---
title: geth state prune
date: 2023-03-25 19:29:43
tags: [geth]
---

> **_NOTE:_**  Offline pruning is only for the hash-based state scheme. In future release, geth will have a path-based state scheme which enables the pruning by default. Once the hash-based state scheme is no longer supported, offline pruning will be deprecated.

## introduction
A snap-sync'd Geth node currently requires more than 650 GB of disk space to store the historic blockchain data. With default cache size the database grows by about 14 GB/week. Since Geth v1.10, users have been able to trigger a snapshot offline prune to bring the total storage back down to the original ~650 GB in about 4-5 hours.

## how pruning works
Pruning uses snapshots of the state database as an indicator to determine which nodes in the state trie can be kept and which ones are stale and can be discarded. Geth identifies the target state trie based on a stored snapshot layer which has at least 128 block confirmations on top (for surviving reorgs) data that isn't part of the target state trie or genesis state.

Geth prunes the database in three stages:

1. Iterating state snapshot: Geth iterates the bottom-most snapshot layer and constructs a bloom filter set for identifying the target trie nodes.
2. Pruning state data: Geth deletes stale trie nodes from the database which are not in the bloom filter set.
3. Compacting database: Geth tidies up the new database to reclaim free space.

## Pruning command
```
geth snapshot prune-state
```

## references
- [geth doc](https://geth.ethereum.org/docs/fundamentals/pruning)