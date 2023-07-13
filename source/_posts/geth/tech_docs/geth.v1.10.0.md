---
title: geth v1.10.0 summary
date: 2023-03-15 16:29:43
tags: [geth]
---

## introduction
geth v1.10.0 has been [released](https://github.com/ethereum/go-ethereum/releases/tag/v1.10.0) on Mar 4 2021. this is a late summary of v1.10.0.

## snapshots
the snapshot feature reduces the cost of accessing an account from `O(logN)` to `O(1)`. Whilst snapshots do grant us a 10x read performance, EVM execution also writes data, and these writes need to be Merkle proven. The Merkle proof requirement retains the necessity for `O(logN)` disk access on writes. 
Problems it solves
- **DoS** In 2016, Ethereum sustained its worse DoS attack ever - The [Shanghai Attacks](https://2017.edcon.io/ppt/one/Martin%20Holst%20Swende_The%20%27Shanghai%20%27Attacks_EDCON.pdf) - that lasted about 2-3 months. The attack revolved around bloating Ethereum's state and abusing various underpriced opcodes to grind the network to a halt. After numerous client optimizations and repricing hard forks, the attack was repelled. The root cause still lingers: state access opcodes have a fixed EVM gas cost O(1), but an ever slowly increasing execution cost O(logN). Snapshots on the other hand reduce execution cost of state reads to O(1) - in line with EVM costs - thus solves the read-based DoS issues long term.
- **Call** Checking a smart contract's state in Ethereum entails a mini EVM execution. Part of that is running bytecode and part of it is reading state slots from disk. snap makes the state access faster.
- **Sync** There are two major ways you can synchronize an Ethereum node. You can download the blocks and execute all the transactions within; or you can download the blocks, verify the PoWs and download the state associated a recent block. The latter is much faster, but it relies on benefactors serving you a copy of the recent state. With the current Merkle-Patricia state model, these benefactors read 16TB of data off disk to serve a syncing node. Snapshots enable serving nodes to read only **96GB** of data off disk to get a new node joined into the network.

drawbacks of snapshot
- A snapshot is a redundant copy of the raw Ethereum state already contained in the leaves of the Merkle Patricia trie. 
user can disable snapshot via `--snapshot=false`

## snap sync
When Ethereum launched, you could choose from two different ways to synchronize the network: full sync and fast sync。 Full sync operated by downloading the entire chain and executing all transactions; vs. fast sync placed an initial trust in a recent-ish block, and directly downloaded the state associated with it (after which it switched to block execution like full sync). 
- **full sync** minimized trust, choosing to execute all transactions from genesis to head. 
- **fast sync** chose to rely on the security of the PoWs.it assumed that a block with 64 valid PoWs on top would be prohibitively expensive for someone to construct, as such it's ok to download the state associated with `HEAD-64`

### delays of fast sync
- network latency (download node)
- io latency (level db random disk access)
- upload latency (requst with node `hash` to remote servers)

The core idea of `snap sync` is fairly simple: instead of downloading the trie node-by-node, snap sync downloads the contiguous chunks of useful state data, and reconstructs the Merkle trie locally:
- Without downloading intermediate Merkle trie nodes, state data can be fetched in large batches, removing the delay caused by network latency.
- Without downloading Merkle nodes, downstream data drops to half; and without addressing each piece of data individually, upstream data gets insignificant, removing the delay caused by bandwidth.
- Without requesting randomly keyed data, peers do only a couple contiguous disk reads to serve the responses, removing the delay of disk IO

## offline pruning
When processing a new block, a node takes the current state of the network as input data and mutates it according to the transactions in the block. only state diff is kept. Pushing these new pieces of state data, block-by-block, to the database is a problem. They keep accumulating. In theory we could "just delete" state data that's old enough to not run the risk of a reorg. it's exceedingly costly to figure out if a node deep within an old state is still referenced by anything newer or not.
If you have snapshots enabled and fully generated, Geth can use those as an acceleration structure to relatively quickly determine which trie nodes should be kept and which should be deleted. Pruning trie nodes based on snapshots does have the drawback that the chain may not progress during pruning. This means, that you need to stop Geth, prune its database and then restart it. To prune your database, please run `geth snapshot prune-state`.

## transaction unindexing
Node operators always took it for granted that they can look up an arbitrary transaction from the past, given only its hash. To make transactions searchable, we need to - at minimum - map the entire range of transaction hashes to the blocks they are in. It's also important to note that transaction indices are not part of consensus and are not part of the network protocol. They are purely a locally generated acceleration structure.
Geth v1.10.0 switches on transaction unindexing by default and sets it to 2,350,000 blocks (about 1 year). The transaction unindexer will linger in the background, and every time a new block arrives, it ensures that only transactions from the most recent N blocks are indexed, deleting older ones. user can use `--txlookuplimit` to control the indexing block range

## preimage discarding
Ethereum stores all its data in a Merkle Patricia trie. The values in the leaves are the raw data being stored (e.g. storage slot content, account content), and the path to the leaf is the key at which the data is stored. The keys however are not the account addresses or storage addresses, rather the Keccak256 hashes of those. This helps balance the branch depths of the state tries.
the preimage is the actual key related to the hash. The preimages aren't particularly heavy. If you do a full sync from genesis - reexecuting all the transactions - you'll only end up with 5GB extra load. Still, there is no reason to keep that data around for users not using it, as it only increases the load on LevelDB compactions. As such, Geth v1.10.0 disables preimage collection by default, but there's no mechanism to actively delete already stored preimages.
If you are using your Geth instance to debug transactions, you can retain the original behavior via `--cache.preimages`. 

## ETH/66 protocol
The eth/66 protocol is a fairly small change, yet has quite a number of beneficial implications. In short, the protocol introduces request and reply IDs for all bidirectional packets. The goal behind these IDs is to more easily match up responses to requests, specifically, to more easily deliver a response to a subsystem that made the original request.

## chainid enforcement
Geth v1.10.0 supports reverting to the old behavior and accepting non-EIP155 transactions via --rpc.allow-unprotected-txs. Be advised that this is a temporary mechanism that will be removed long term.

## Database introspection
Every now and again we receive an issue report about a corrupted database, with no real way to debug it. Geth v1.10.0 ships a built-in database introspection tool to try and alleviate the situation a bit. It is a very low level accessor to LevelDB, but it allows arbitrary data retrievals, insertions and deletions. We are unsure how useful these will turn out to be, but they at least give a fighting chance to restore a broken node without having to resync.

## Unclean shutdown tracking
Fairly often we receive bug reports that Geth started importing old blocks on startup. This phenomenon is generally caused by the node operator terminating Geth abruptly (power outage, OOM killer, too short shutdown timeout). Since Geth keeps a lot of dirty state in memory - to avoid writing to disk things that get stale a few blocks later - an abrupt shutdown can cause these to not be flushed. With recent state missing on startup, Geth has no choice but to rewind it's local chain to the point where it last saved the progress.

Geth v1.10.0 will start tracking and reporting node crashes. We're hopeful that this will allow operatos to detect that their infra is misconfigured or has issue before those turn into irreversible data loss.
```
WARN [03-03|06:36:38.734] Unclean shutdown detected        booted=2021-02-03T06:47:28+0000 age=3w6d23h
```

## references
- [eth foundation blog]()