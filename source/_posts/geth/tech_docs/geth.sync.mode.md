---
title: geth sync
date: 2023-03-18 16:29:43
tags: [geth]
---

## state 
Ethereum maintains two different types of state: the set of accounts; and a set of storage slots for each contract account. Naively, storing these key-value pairs as flat data would be very efficient, however, verifying their correctness becomes computationally intractable. Every time a modification would be made, we'd need to hash all that data from scratch (which is not efficient).

Instead of hashing the entire dataset all the time, eth uses MPT. The original useful data would be in the leaves, and each internal node would be a hash of everything below it. This would allow us to only recalculate a logarithmic number of hashes when something is modified, inserted, deleted and verified. A tiny extra is that keys are hashed before insertion to balance the tries (secured trie).

## state storage
MPT make every read/write of O(lnN) complexity. the depth of the trie is continuously growing; LevelDB also organizes its data into a maximum of 7 levels, so there's an extra multiplier from there. The net result is that a single state access is expected to amplify into **25-50** random disk accesses. 

Of course all client implementations try their best to minimize this overhead. Geth uses large memory areas for caching trie nodes; and also uses in-memory pruning to avoid writing to disk nodes that get deleted anyway after a few blocks.

## Not all accesses are created equal
The Merkle Patricia tree is essential for writes (matain the capability to verify data), but it's an overhead for reads. 
An Ethereum node accesses state in a few different places:
- When importing a new block, EVM code execution does a more-or-less balanced number of state reads and writes. 
- When a node operator retrieves state (e.g. eth_call and family), EVM code execution only does reads (it can write too, but those get discarded at the end and are not persisted).
- When a node is synchronizing, it is requesting state from remote nodes that need to dig it up and serve it over the network.

if we can short circuit reads not to hit the state trie, a slew of node operations will become significantly faster. 

## snapshot
Geth introduced its snapshot acceleration structure (not enabled by default). A snapshot is a complete view of the Ethereum state at a given block. Abstract implementation wise, it is a dump of all accounts and storage slots, represented by a flat key-value store.
snapshot is maintained as an extra to MPT. The snapshot essentially reduces reads from O(log n) to O(1) at the cost of increasing writes from O(log n) to O(1 + log n). 

## devil's in the details
to maintain a snapshot, the naitve approach is to apply changes to current snapshot upon new block. If there's a mini reorg however (even a single block), we're in trouble, because there's no undo. 
To overcome this limitation, Geth's snapshot is composed of two entities: a persistent disk layer that is a complete snapshot of an older block (e.g. HEAD-128); and a tree of in-memory diff layers that gather the writes on top.
Whenever a new block is processed, we do not merge the writes directly into the disk layer, rather just create a new in-memory diff layer with the changes. If enough in-memory diff layers are piled on top, the bottom ones start getting merged together and eventually pushed to disk. Whenever a state item is to be read, we start at the topmost diff layer and keep going backwards until we find it or reach the disk.
Of course, there are lots and lots of gotchas and caveats.
- On shutdown, the in-memory diff layers need to be persisted into a journal and loaded back up, otherwise the snapshot will become useless on restart.
- Use the bottom-most diff layer as an accumulator and only flush to disk when it exceeds some memory usage.
- Allocate a read cache for the disk layer so that contracts accessing the same ancient slot over and over don't cause disk hits.
- Use cumulative bloom filters in the in-memory diff layers to quickly detect whether there's a chance for an item to be in the diffs, or if we can go to disk immediately.
- The keys are not the raw data (account address, storage key), rather the hashes of these, ensuring the snapshot has the same iteration order as the Merkle Patricia tree.

The snapshot also enables blazing fast state iteration of the most recent blocks. This was actually the main reason for building snapshots, as it permitted the creation of the new snap [sync algorithm](https://github.com/ethereum/devp2p/pull/145).

## Consensus layer syncing
all consensus logic and block propagation is handled by consensus clients. Blocks are downloaded by the consensus client and verified by the execution client. **Geth cannot sync without being connected to a consensus client.** 
There are two ways for the consensus client to find a block header that Geth can use as a sync target: optimistic syncing and checkpoint syncing:

### optimistic sync
Optimistic sync downloads blocks before the execution client has validated them. In optimistic sync the node assumes the data it receives from its peers is correct during the downloading phase but then retroactively verifies each downloaded block.
[more details](https://github.com/ethereum/consensus-specs/blob/dev/sync/optimistic.md)

### checkpoint sync
Alternatively, the consensus client can grab a checkpoint from a trusted source which provides a target state to sync up to, before switching to full sync and verifying each block in turn. In this mode, the node trusts that the checkpoint is correct.

## archive nodes
An archive node is a node that retains all historical data right back to genesis. There is no need to regenerate any data from checkpoints because all data is directly available in the node's own storage. 

It is also possible to create a partial/recent archive node where the node was synced using snap but the state is never pruned. This creates an archive node that saves all state data from the point that the node first syncs. This is configured by starting Geth with `--syncmode snap --gcmode archive`.


## light nodes
A light node syncs very quickly and stores the bare minimum of blockchain data. Light nodes only process block headers, not entire blocks. they receive a proof from the full node and verify it against their local header chain. **Light nodes are not currently working on proof-of-stake Ethereum.**



## full node
### full
A full block-by-block sync generates the current state by executing every block starting from the genesis block. A full sync independently verifies block provenance as well as all state transitions by re-executing the transactions in the entire historical sequence of blocks. Only the most recent 128 block states are stored in a full node - older block states are pruned periodically and represented as a series of checkpoints from which any previous state can be regenerated on request.

### snap sync (default)
Snap sync starts from a relatively recent block and syncs from there to the head of the chain, keeping only the most recent 128 block states in memory.  The block header to sync up to is provided by the consensus client. Between the initial sync block and the 128 most recent blocks, the node stores occasional snapshots that can be used to rebuild any intermediate state "on-the-fly". The difference between the snap-synced node and a full block-by-block synced node is that a snap synced node started from an initial checkpoint that was more recent than the genesis block. Snap sync is much faster than a full block-by-block sync from genesis.
![sync mode](/images/geth/sync.mode.jpg)

Snap sync works by first downloading the headers for a chunk of blocks. Once the headers have been verified, the block bodies and receipts for those blocks are downloaded. In parallel, Geth also begins state-sync. In state-sync, Geth first downloads the leaves of the state trie for each block without the intermediate nodes along with a range proof. The state trie is then regenerated locally.


The state download is the part of the snap-sync that takes the most time to complete and the progress can be monitored using the ETA values in the log messages. <span style="color:red">However, the blockchain is also progressing at the same time and invalidating some of the regenerated state data.</span> (don't really understand why regenrated state could be invalidated). This means it is also necessary to have a 'healing' phase where errors in the state are fixed. Geth regularly reports `Syncing, state heal in progress` during state healing - this informs the user that state heal has not finished.

The healing has to outpace the growth of the blockchain, otherwise the node will never catch up to the current state.

To summarize, snap sync progresses in the following sequence:

- download and verify headers
- download block bodies and receipts. In parallel, download raw state data and build state trie
- heal state trie to account for newly arriving data

A node that is started using snap will switch to block-by-block sync once it has caught up to the head of the chain.









# references
- [geth doc on sync mode](https://geth.ethereum.org/docs/fundamentals/sync-modes)
- [eth.org blog on snapshot acceleration](https://blog.ethereum.org/2020/07/17/ask-about-geth-snapshot-acceleration)