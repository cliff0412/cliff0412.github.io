---
title: field
date: 2023-12-15 11:19:44
tags: [cryptography,field]
---

<script
  src="https://cdn.mathjax.org/mathjax/latest/MathJax.js?config=TeX-AMS-MML_HTMLorMML"
  type="text/javascript">
</script>

## Pseudo-Mersenne Prime
Pseudo-Mersenne Prime is a prime of the form
\\[ p = 2^m -k \\]
where \\(k\\) is an integer for which 
\\[ 0 \lt |k| \lt 2^{\lfloor m/2 \rfloor} \\]

if \\(k=1\\), then \\(p\\) is a **Mersenne prime** (and \\(m\\) must necesarily be a priime). if \\(k=-1\\); then \\(p\\) is called a **Fermat prime** (and \\(m\\) must necessarily be a power of two)

Pseudo-Mersenne primes are useful in public-key cryptography because they admit fast modular reduction similar to Mersenne primes. If \\(n\\) is a positive integer less than \\(p^2\\), then \\(n\\) can be written as
\\[ n = u \cdot 2^{2m} + a \cdot 2^{m} + b \\]
where \\(u=0\\) or \\(1\\) and \\(a\\) and \\(b\\) are nonnegative integers less than \\(2^m\\). Then
\\[ n \equiv u \cdot k^2 + a \cdot k + b \mod p\\]

Repeating this substitution a few times will yield \\(n \mod p\\).

## Optimal Extension Fields (OEF)
Optimal extension fields (OEFs) are a family of finite fields with an arithmetic that can be implemented efficiently in software. OEFs are extension fields \\(GP(p^m)\\) where the prime p is of special form.

An Optimal Extension Field is a finite field \\(GF(p^m)\\) such that
1. \\(p\\) is pseudo Mersenne prime
2. An irreducible binomial \\(P(x) = x^m - \omega\\) exists over \\(GF(p)\\)

## other concepts
### two adicity
A two-adicity of 32 means that there's a multiplicative subgroup of size \\(2^32\\) that exists in the field.
For example
```rust
const TWO_ADICITY: u32 = 32;
const TWO_ADIC_ROOT_OF_UNITY: BigInteger = BigInteger([
    0x218077428c9942de, 0xcc49578921b60494, 0xac2e5d27b2efbee2, 0xb79fa897f2db056
]);  // TWO_ADIC_ROOT_OF_UNITY^{2^32} = 1
```


## references
- [Pseudo-Mersenne Prime](https://link.springer.com/referenceworkentry/10.1007/978-1-4419-5906-5_42)
- [Optimal Extension Field] Bailey DV, Paar C (1998) Optimal extension fields for fast arithmetic in public-key algorithms. In: Krawczyk H (ed), Advances in cryptology–CRYPTO ’98, LNCS 1462. Springer, Berlin, pp 472–485