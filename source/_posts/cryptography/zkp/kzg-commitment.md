---
title: kzg polynomial commitment
date: 2023-12-03 11:19:44
tags: [cryptography,zkp]
---

## introduction
KZG polynomial commitments was introduced by Kate, Zaverucha and Goldberg. It is called a commitment, because having sent the commitment value (an elliptic curve point) to someone (the verifier), the prover cannot change the polynomial they are working with.

## Comparison to Merkle trees
A Merkle tree is what cryptographers call a vector commitment: Using a Merkle tree of depth \\(d\\), you can compute a commitment to a vector. A polynomial commitment can be achived by making a merkle tree commitment of all polynomials coefficients. however, it is not efficient.

## parings
Let \\(\mathbb{G_1}\\) and \\(\mathbb{G_2}\\) be two elliptic curves wit a paring \\(e: \mathbb{G_1} \times \mathbb{G_2} \rightarrow \mathbb{G_T}\\). Let \\(p\\) be the order of \\(\mathbb{G_1}\\) and \\(\mathbb{G_2}\\), and \\(G\\) and \\(H\\) be generators of \\(\mathbb{G_1}\\) and \\(\mathbb{G_2}\\). We will use a very useful shorhand notation
\\( [x]_1 = xG \in \mathbb{G_1}\\), and \\([x]_2 = xH \in \mathbb{G_2} \\), for any \\(x \in \mathbb{F_p}\\)

## Trusted setup
Let’s assume we have a trusted setup, so that for some secret \\(s\\), the elements \\([s^i]_1\\) and \\([s^i]_2\\) are available to both prover and verifier for \\(i=0, ..., n-1\\). 

Let \\(p(X) = \sum_{i=0}^{n}p_i X^i \\) be a polynomial, the prover can compute


\\( \left[ p(s) \right]_1 = p_0[s^0]_1 + p_1[s^1]_1 + ... + p_n[s^n]_1 \\)


## Kate commitment
In the Kate commitment scheme, the eleemnt \\(C = [p(s)]_1\\) is the commitment to the polynomial \\(p(X)\\).  Could the prover (without knowing \\(s\\)) find another polynomial \\(q(X) \neq p(X)\\)  that has the same commitment. Let's assume that this were the case. Then it would mean \\([p(s) - q(s)]_1 = 0\\), implying \\(p(s) - q(s) = 0\\).

Now, \\(r(X) = p(X) - q(X)\\) is itself a polynomial. we know that it's not constant because \\(p(X) \neq q(X) \\).  It is a well-known fact that any non-constant polynomial of degree \\(n\\) can have at most \\(n\\) zeroes. 
Since the prover doesn’t know \\(s\\), the only way they could achieve that \\(p(s) - q(s) = 0\\)
 is by making \\( p(X) - q(X)=0\\) in as many places as possible. But since they can do that in at most \\(n\\)
 places, as we’ve just proved, they are very unlikely to succeed: since \\(n\\) is much smaller than the order of the curve, \\(p\\). the probability that  \\(s\\) will be one of the points they chose to make \\(p(X) = q(X)\\) will be vanishingly tiny.

## Multiplying polynomials

## references
[Dankrad Feist Post](https://dankradfeist.de/ethereum/2020/06/16/kate-polynomial-commitments.html)
