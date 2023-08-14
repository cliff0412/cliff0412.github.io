---
title: zkp groth16 paper review
date: 2023-07-07 14:29:26
tags: [cryptography,zkp]
---
<script
  src="https://cdn.mathjax.org/mathjax/latest/MathJax.js?config=TeX-AMS-MML_HTMLorMML"
  type="text/javascript">
</script>
## 1. Introduction
Goldwasser, Micali and Rackoff [GMR89] introduced zero-knowledge proofs that enable a prover to convince a verifier that a statement is true without revealing anything else. They have three core properties:
- **Completeness**: Given a statement and a witness, the prover can convince the verifier. 
- **Soundness**: A malicious prover cannot convince the verifier of a false statement. 
- **Zero-knowledge**: The proof does not reveal anything but the truth of the statement

### 1.1. Contribution
**Succinct NIZK** We construct a NIZK argument for arithmetic circuit satisfiability where a proof consists of only 3 group elements. In addition to being small, the proof is also easy to verify. The verifier just needs to compute a number of exponentiations proportional to the statement size and check a single pairing product equation, which only has 3 pairings.


## 2. Preliminaries
### 2.1 Bilinear Groups
We will work over bilinear groups \\((p, \mathbb{G_{1}}, \mathbb{G_{2}}, \mathbb{G_{T}} , e, g, h)\\) with the following properties:
- \\(\mathbb{G_{1}}, \mathbb{G_{2}}, \mathbb{G_{T}} \\)are groups of prime order \\(p\\)
- The pairing \\( e:\mathbb{G_{1}} \times \mathbb{G_{2}} \rightarrow \mathbb{G_{T}}\\) is a bilinear map
- \\(g\\) is a generator for \\(\mathbb{G_{1}}\\), \\(h\\) is a generator for \\(\mathbb{G_{2}}\\), and \\(e(g,h)\\) is a generator for \\(\mathbb{G_{T}}\\)

There are many ways to set up bilinear groups both as symmetric bilinear groups where \\(\mathbb{G_{1}} = \mathbb{G_{1}}\\) and as asymmetric bilinear groups where \\(\mathbb{G_{1}} \neq \mathbb{G_{1}}\\). Galbraith, Paterson and Smart [GPS08] classify bilinear groups as **Type I** where \\(\mathbb{G_{1}} = \mathbb{G_{2}}\\), **Type II** where there is an efficiently computable non-trivial homomorphism \\(\Phi : \mathbb{G_{2}} \rightarrow \mathbb{G_{1}}\\), and **Type III** where no such efficiently computable homomorphism exists in either direction between \\(\mathbb{G_{1}}\\) and \\(\mathbb{G_{2}}\\). Type III bilinear groups are the most efficient type of bilinear groups and hence the most relevant for practical applications.
As a notation for group elements, we write \\( \lbrack a \rbrack_{1} \\) for \\( g^a\\), \\( \lbrack b \rbrack_{2}\\) for \\( h^b\\) and \\( \lbrack c \rbrack_{T}\\) for \\(e(g,h)^{c} \\).  A vector of group elements will be represented as \\( \lbrack \mathbf{a} \rbrack_{i} \\).  Given two vectors of \\(n\\) group elements \\( \lbrack \mathbf{a} \rbrack_{1} \\) and \\( \lbrack \mathbf{b} \rbrack_{2} \\), we define their dot product as \\( \lbrack \mathbf{a} \rbrack_{1} \cdot \lbrack \mathbf{b} \rbrack_{2}  = \lbrack \mathbf{a} \cdot  \mathbf{b} \rbrack_{T} \\), which can be efficiently computed using the pairing \\(e\\).
## references
- [1] groth 16 paper, On the Size of Pairing-based Non-interactive Arguments by Jens Groth