---
title: kzg polynomial commitment
date: 2023-12-03 11:19:44
tags: [cryptography,zkp]
---

<script
  src="https://cdn.mathjax.org/mathjax/latest/MathJax.js?config=TeX-AMS-MML_HTMLorMML"
  type="text/javascript">
</script>

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
While elliptic curves themselves don’t allow polynomial multiplication, luckily we can do it with pairings: We have that
\\[ e([a]_1, [b]_2) = e(G,H)^{(ab)} = [ab]_T\\]
while we unfortunately can’t just multiply two field elements inside an elliptic curve and get their product as an elliptic curve element, we can multiply two field elements if we commited to them in different curves (one in \\(G_1\\) and one in \\(G_2\\), and the output is a 
\\(G_T\\) element.

Noe let's say we want to prove that \\(p(z)=y\\). we will use the polynomial \\(p(X) - y\\). this polynomial is clearly zero at \\(z\\). Let \\(q(X)\\) be the polynomial \\(p(X) - y\\) divided by the linear factor \\(X-z\\), i.e
\\[ q(X) = \frac{p(X) - y}{X-z} \\]
which is equivalent to saying that \\(q(X)(X-z) = p(X) - y\\)

## Kate proofs
now a kate proof for the evaluation \\(p(z) = y\\) is defined as \\(\pi = [q(s)]_1\\). remember the commitment to the polynomial \\(p(X)\\) is defined as \\(C=[p(s)]_1\\)
the verifier checks this proof using the following equation
\\( e(\pi, [s-z]_2) = e(C-[y]_1, H) \\)

Note that the verifier can compute \\([s-z]_2\\), because it is just a combination of the element \\([s]_2\\)
 from the trusted setup and \\(z\\) is the point at which the polynomial is evaluated. 

## multiproofs
So far we have shown how to prove an evaluation of a polynomial at a single point. Note that this is already pretty amazing: You can show that some polynomial that could be any degree – say \\(2^{28}\\) – at some point takes a certain value, by only sending a single group element (that could be 48 bytes, for example in BLS12_381). The toy example of using Merkle trees as polynomial commitments would have needed to send \\(2^{28}\\) elements – all the coefficients of the polynomial.

Let’s say we have a list of \\(k\\) points \\((z_0, y_0),(z_1, y_1), ..., (z_{k-1}, y_{k-1})\\). Using lagrange interpolation, we can find polynomial \\(I(X)\\) goes through all of these points.

Now let's assume that we know \\(p(X)\\) goes through all these points. then the polynomial \\(p(X) - I(X)\\) will clearly be zero at each \\(z_0, z_1, ..., z_{k-1}\\). the zero polynomial is
\\(Z(X) = (X-z_0)\cdot (X-z_1)...(X-z_{k-1})\\)
Now, we can compute the quotient
\\(q(X) = \frac{p(X)-I(X)}{Z(X)}\\)
We can now define the Kate multiproof for the evaluations \\((z_0, y_0),(z_1, y_1),..., (z_{k-1}, y_{k-1})\\): \\(\pi = [q(s)]_1\\). note that this is still only one group element.

Now, to check this, the verifier will also have to compute the interpolation polynomial \\(I(X)\\) and the zero polynomial Z(X). Using this, they can compute \\([Z(s)]_2\\) and \\([I(s)]_1\\), and thus verify the paring equation
\\[ e(\pi, [Z(s)]_2) = e(C-[I(s)]_1, H) \\]

## Kate as a vector commitment
While the Kate commitment scheme is designed as a polynomial commitment, it actually also makes a really nice vector commitment. Remember that a vector commitment commits to a vector \\(a_0, ..., a_{n-1}\\) and lets you prove that you committed to \\(a_i\\) for some \\(i\\). We can reproduce this using the Kate commitment scheme: Let \\(p(X)\\) be the polynomial that for all \\(i\\) evaluates as \\(p(i)=a_i\\). 
Now using this polynomial, we can prove any number of elements in the vector using just a single group element! Note how much more efficient (in terms of proof size) this is compared to Merkle trees

## references
[Dankrad Feist Post](https://dankradfeist.de/ethereum/2020/06/16/kate-polynomial-commitments.html)
