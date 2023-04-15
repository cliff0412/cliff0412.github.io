---
title: MPT
date: 2023-01-22 17:25:36
tags: [blockchain, geth]
---

# trie
a trie, also called prefix tree, is a type of k-ary search tree. These keys are most often strings, with links between nodes defined not by the entire key, but by individual characters. In order to access a key, the trie is traversed depth-first, following the links between nodes, which represent each character in the key.

![prefix trie](/images/trie.prefix.png)
In general, the nodes of a Trie look like this:
```
[ [Ia, Ib, … I*], value]
```
[Ia, Ib, ... I*] is the index array of the node, which takes the next character in the key as the index, and each element I* points to the corresponding child node. value represents the value

# MPT
- use []byte as key, other than string
- nibble: the smallest unit of the key type (4 bit)
- Use hashes to refer to nodes instead of memory pointers

there are two types of node: full nodes (fullNode) and short nodes (shortNode). Full nodes have 17 elements, while shortNode nodes have two elements. Their schematic expressions are as follows
```
fullNode: [i0, i1, i2, … i15, hash]  
shortNode： [ [k0, k1, … kn], hash ] // first element is an array
```
if the hash pointing to a value, it is a leaf node; if pointing another node, a non leaf node.

![mpt](/images/mpt.png)

Use the upper 4 bits of the first byte of the []byte value composed of nibbles as storage flag. The 0th bit stores the parity information, and the 1st bit stores the type represented by the value
|hex char| bits | pointing to | odd/even | 2nd niddle padding |
| -----|:----:|:----:|:----:|-------|
|0| 0000 | node | even | no |
|1| 0001 | node | odd | yes |
|2| 0010 | value | even | no |
|3| 0011 | value | odd | yes |

this encoding method is only used when accessing the database. After reading into memory, the key is directly stored in []byte type

# reference
- [github](https://github.com/agiletechvn/go-ethereum-code-analysis/blob/master/trie-analysis.md)