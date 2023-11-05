---
title: danksharding
date: 2023-10-12 14:36:58
tags: [blockchain]
---

<script
  src="https://cdn.mathjax.org/mathjax/latest/MathJax.js?config=TeX-AMS-MML_HTMLorMML"
  type="text/javascript">
</script>

## introduction
Danksharding is central to Ethereum’s rollup-centric roadmap. The idea is to provide space for large blobs of data, which are verifiable and available, without attempting to interpret them.


## Preliminaries
All references to EC, in this report, refer to BLS12_381 [1]. We are mainly concerned with the EC Abelian-group \\(\mathbb{G_{1}}\\) and the EC scalar-field \\(F_r\\). Both are of size \\(r < 2256\\). Note that \\(2^{32}\\) divides the size of the multiplicative-group in \\(F_r\\)

## Data organization
The input data consists of n = 256 shard-blobs. Each shard-blob is a vector of m = 4096 field-elements referred-to as symbols. The data symbols are organized in an n × m input
matrix
\\[
    \tag{1}
    D_{n x m}^{in} =
\begin{bmatrix}
\displaylines{
    d(0,0)   & d(0,1)  & \dots  & d(0,m-1)\\\\
    d(1,0)   & d(1,1)  & \dots  & d(1,m-1)\\\\
    \vdots                 & \vdots                 & \ddots & \vdots\\\\
    d(n-1,0)   & d(n-1,1)  & \dots  & d(n-1,m-1)
}
\end{bmatrix}
\\]
where each row is one of the shard-blob vectors [2]
In order to enable interpolation and polynomial-commitment to the data, we will pro-
ceed to treat the data symbols as polynomial evaluations.

Let us thus associate each domain location in the input matrix with a field-element pair \\(u_{\mu}, \omega_{\eta}\\), where \\(\mu \in [0, n−1], \eta \in [0, m−1]\\) correspond to the row and column indexes, respectively.The row field-element is defined as \\( u_{\mu} \equiv u^{rbo(\mu)}\\), where u is a 2n’th root-of-unity such that \\(u^{2n} = 1\\). The column field-element is defined as \\( \omega_{\eta} \equiv \omega^{rbo(\eta)}\\), where \\(\omega\\) is a 2m’th root-of-unity such that \\(\omega^{2m} = 1\\). <span style="color:red">_Using reverse-bit-order ordering rather than natural-ordering allows accessing cosets in block (consecutive) rather than interleaved manner_</span>

## coefficients extraction
Taking the data symbols to be evaluations of a 2D-polynomial or 1D-product-polynomials with row degree n−1 and column degree m−1 uniquely defines the polynomials’ coefficients.

### 2D coeficients extraction
The 2D-polynomial representing the input data can be expressed as
\\[\tag{2} d(x,y) \equiv \sum_{i=0}^{n-1}\sum_{j=0}^{m-1} \hat{c}[i,j] x^{i}y^{j}\\]
Plugging an evaluation from (1) into (2) results in the following:

\\[\tag{3} d(u_{\mu},\omega_{\eta}) \equiv \sum_{i=0}^{n-1}\sum_{j=0}^{m-1} \hat{c}[i,j] {u_{\mu}}^{i}{\omega_{\eta}}^{j}\\]
## references
[1] Ben Edgington. Bls12-381 for the rest of us. https://hackmd.io/@benjaminion/bls12-381.
[2] Dankrad Feist. Data availability encoding. https://notes.ethereum.org/@dankrad/danksharding_encoding