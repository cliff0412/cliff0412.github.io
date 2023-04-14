---
title: understanding of kademlia protocol
date: 2023-01-15 11:00:30
tags: [blockchain]
---

# overview
Most of the decentralized networks use P2P protocols, especially in blockchain technology. Usually, a distributed hash table DHT (Distributed Hash Table) is used, and the Kademlia protocol is one of the DHT technologies.

# node tree
In the Kad network, all nodes are regarded as the leaves of a binary tree, and the position of each node is uniquely determined by the shortest prefix of its ID value, and each node has a 160bit ID (ETH account address is 20 bytes, which is 160 bits) value as an identifier.

The ID value is expressed in binary form; the nth bit of the binary corresponds to the nth layer of the binary tree; if the bit is 1, it enters the left subtree, and if it is 0, it enters the right subtree; the last leaf node on the binary tree corresponds to a node

Each node is a 160-bit binary representation, so there are up to 160 layers, but there are not so many layers in reality. Because the shortest unique prefix is used, leaf nodes will appear at any number of layers. As follows
![subtree of node 0011](/images/kademlia.subtree.png)

# sub-tree of a node
For any node, the binary tree can be decomposed into a series of continuous subtrees that do not contain itself. The highest-level subtree is composed of the other half of the whole tree that does not contain itself; the next level of subtree is composed of the remaining half that does not contain itself; and so on, until the complete tree is split. As shown above.

The part contained by the dotted line is the subtree of node 0011, and the whole subtree of the part that does not contain the node itself is split from each bifurcation point

For each node, when it splits the subtree from its own perspective, it will get n subtrees; for each subtree, if it can know a node inside, then it can use these n nodes to perform recursive routing to reach any node of the entire binary tree. 

# node distance
The Kad algorithm uses an XOR operation to calculate the distance between nodes

# k bucket
After each node completes subtree splitting, it needs to record K nodes in each subtree. The K value mentioned here is a system-level constant (must be an even number). It is set by the software system using Kad (for example, the Kad network used by BT download, K is set to 8). K-buckets are actually routing tables. For a node, if it splits n subtrees from its own perspective, it needs to maintain n routing tables, and the upper limit of nodes in each routing table is K

# update of k bucket
There are mainly the following ways to update the K bucket:

- Actively collect nodes: Any node can initiate a FIND_NODE (query node) request to refresh the node information in the K-bucket.
- Passive collection node: When receiving requests from other nodes (such as: FIND_NODE, FIND_VALUE), it will add the node ID of the other party to a certain K-bucket.
- Detect invalid nodes: By initiating a PING request, determine whether a node in the K-bucket is online, and then clean up which offline nodes in the K-bucket.

The update principle is to insert the latest node into the tail of the queue, and not to remove the online nodes in the queue.

According to the K-bucket update principle, nodes with a long online time are more likely to remain in the K-bucket list. Therefore, by keeping the nodes with a long online time in the K-bucket, Kad will significantly increase the number of nodes in the K-bucket. it can defend against DOS attacks to a certain extent, because only when the old node fails, Kad will update the K bucket information, which avoids flooding routing information through the addition of new nodes
![probability of continuous online agains onlie duration](/images/kademlia.onlineprob.png)

# RPC method
The Kademlia protocol includes four remote RPC operations: PING, STORE, FIND_NODE, FIND_VALUE.

- The purpose of the PING operation is to detect a node to determine whether it is still online.
- The function of the STORE operation is to notify a node to store a <key, value> pair for future query needs.
- The FIND_NODE operation takes a 160bit ID as a parameter. The receiver of this operation returns the (IP address, UDP port, Node ID) information of K nodes that it knows are closer to the target ID. The information of these nodes can be obtained from a single K-bucket, or from multiple K-buckets. In either case, the receiver will return the information of K nodes to the operation initiator. 
- The FIND_VALUE operation is similar to the FIND_NODE operation, the difference is that it only needs to return the (IP address, UDP port, Node ID) information of a node


# node query routing

# node join

# references
- ![kademlia paper](https://pdos.csail.mit.edu/~petar/papers/maymounkov-kademlia-lncs.pdf)
- ![go implementation](https://github.com/libp2p/go-libp2p-kad-dht)
- ![kademlia stanford](https://codethechange.stanford.edu/guides/guide_kademlia.html)
- ![zhihu](https://zhuanlan.zhihu.com/p/388994038)