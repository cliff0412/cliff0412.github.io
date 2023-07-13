---
title: cryptography (3) RSA cryptosystem
date: 2023-06-17 14:29:26
tags: [cryptography]
---
<script
  src="https://cdn.mathjax.org/mathjax/latest/MathJax.js?config=TeX-AMS-MML_HTMLorMML"
  type="text/javascript">
</script>


## introduction
the security of RSA relies on the difficulty of factoring a product of two large primes(the integer factorization problem). it is firstly presented in 1978 in [1].

## Euclidean Algorithm
todo!()
## Extended Euclidean Algorithm
todo!()

## Euler's Phi Function
we consider the ring \\( Z_m\\) i.e., the set of integers \\({0,1,...,m-1}\\). we are interested in teh problem of knowing how many numbers in this set are relatively prime to m. this quantity is given by Euler's phi function, which is \\(\Phi(m)\\)

***
let m have the following canonical factorization
\\[ m = p_{1}^{e_1} \cdot p_{2}^{e_2} \cdot ... \cdot p_{n}^{e_n}\\]
where the \\(p_i\\) are distinct prime numbers and \\( e_i\\) are positive integers, then

\\[ \Phi(m) = \prod_{i=1}^{n}(p_{i}^{e_i} - p_{i}^{e_i -1} ) \\]
***
it is important to stress that we need to know the factoorization of m in order to calculate Euler's phi function.

## Fermat's little theorem
Fermat's little theorem states that if p is a prime number, then for any integer a, the number 
\\(a^{p}-a \\) is an integer multiple of p. In the notation of modular arithmetic, this is expressed as
\\[ a^{p} \equiv a \bmod p\\]
the theorem can be stated in the form also,
\\[ a^{p-1} \equiv 1 \bmod p\\]
then the inverse of an integer is,
\\[ a^{-1} \equiv a^{p-2} \bmod p\\]
performing the above formulate (involving exponentiation) to find inverse is usually slower than using extended Euclidean algorithm. However, there are situations where it is advantageous to use Fermat's Little Theorem,  e.g., on smart cards or other devices which have a hardware accelerator for fast exponentiation anyway.

a generatlization of Fermat's little Theorem to any integer moduli, i.e., moduli that are not necessarily primes, is Euler's theorem.
***
**Euler's Theorem**
let \\(a\\) and \\(m\\) be integers with \\(gcd(a,m) = 1\\), then
\\[ a^{\Phi(m)} \equiv 1 \bmod m\\]
***
since it works modulo m, it is applicable to integer rings \\(Z_{m}\\)

## key generation
***
**Output**: public key: \\( k_{pub} = (n,e) and private key: k_{pr} = (d) \\)
1. choose two large primes p and q.
2. compute \\(n = p\cdot q\\)
3. compute \\( \Phi(n) = (p-1)(q-1)\\)
4. select the public exponent \\( e \in {1,2,...,\Phi(n)-1} \\) such that 
\\[ gcd(e,\Phi(n)) = 1\\]
5. compute the private key d such that
\\[ d \cdot e \equiv 1 \bmod \Phi(n)\\]
***
the condition that \\( gcd(e,\Phi(n)) = 1\\) ensures that the inverse of \\(e\\) exists modulo \\(\Phi(n)\\), so that there is always a private key \\(d\\).
the computation of key keys \\(d\\) and \\(e\\) canb e doen at once using the extended Euclidean algorith. 


## Encryption and Decryption
todo!()

## references
- [1] [A Method for Obtaining Digital
Signatures and Public-Key Cryptosystems](https://web.williams.edu/Mathematics/lg5/302/RSA.pdf) 