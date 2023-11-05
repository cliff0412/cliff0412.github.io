---
title: cryptography (4) digital signature
date: 2023-06-20 14:29:26
tags: [cryptography]
---
<script
  src="https://cdn.mathjax.org/mathjax/latest/MathJax.js?config=TeX-AMS-MML_HTMLorMML"
  type="text/javascript">
</script>

## Elgamal Digital Signature Scheme
The Elgammal signature scheme is based on the difficulty of computing discrete logarithms. Unlike RSA, where encryption and digital signature are almoste identical operations, the Elgamal digital signature is quite different from the encryption scheme with teh same name.

### key generation
***
1. Choose a large prime \\(p\\).
2. Choose a primitive element \\(\alpha\\) of \\(Z_{p}^{\ast}\\), or a subgroup of \\(Z_{p}^{\ast}\\).
3. Choose a random integer \\(d \in {2,3,...,p-2}\\)
4. Compute \\(\beta = \alpha^{d} \bmod p\\)
***
The public key is now formed by \\(k_{pub} = (p, \alpha, \beta)\\), and the private key by \\(k_{pr}=d\\)
\\(Z_{p}^{\ast}\\) is the set of integers who are smaller than \\(p\\) and coprime to \\(p\\)

### signature and verification
Usign the private ey and parameters of the public key, the signature
\\[sig_{k_{pr}}(x, k_{E}) = (r,s)\\]
\\(x\\) is the message. \\(k_{E}\\) is a random value, which forms an ephemeral private key
***
**Elgamal Signature Generation**
1. choose a random ephemeral key \\(k_{E} \in {0,1,2,..,p-2}\\) such that \\(gcd(k_{E}, p-1) = 1\\)
2. compute the signatue parameters:
\\[r \equiv \alpha^{k_{E}} \bmod p\\]
\\[s \equiv (x - d \cdot r)k_{E}^{-1} \bmod p-1\\]
***
on the receiving side, the signature is verified as \\(ver_{k_{pub}}(x,(r,s))\\) using the public key, the signature and the message.
***
**Elgamal Signature Verification**
1. comput the value 
\\[t \equiv \beta^{r} \cdot r^s \bmod p\\]
2. the verification follows form
\begin{equation}
t = 
\begin{cases}
\equiv \alpha^{x} \bmod p & => \text{valid signature} \cr
\not\equiv \alpha^{x} \bmod p  & => \text{invalid signature}
\end{cases}
\end{equation}
***

## Digital Signature Algorithm (DSA)
The native Elgamal signature algorithm described above is rarely used in practice. Instead, a much more popular variant is used, known as the Digital Signature Algorithm (DSA). It is a federal US government standard for digital signatures and was proposed by NIST (National Institute of Standards and Technology). Its main advantages over the Elgamal signature scheme are that the signature is only 320-bit long and that some of the attacks
 that can threaten the Elgamal scheme are not applicable.
### key generation
***
**key Generation for DSA**
1. Generate a prime \\(p\\) with \\(2^1023 < p < 2^1024\\)
2. find a prime divisor \\(q\\) of \\(p-1\\) \\(2^159 < q < 2^160\\)
3. Find an element \\(\alpha\\) with \\( ord(\alpha) = q\\), i.e., \alpha genertes the subgroup with \\(q\\) elements.
4. choose a random integer \\(d\\) with \\(0 < d < q\\).
5. compute \\(\beta \equiv \alpha^{d} \bmod p\\).
the keys are now:
\\(k_{pub} = (p, q, \alpha, \beta)\\)
\\(k_{pr}= (d)\\)
***
The central idea of DSA is that there are two cyclic groups involved. One is the large cyclic group \\(Z_{p}*{\ast}\\), the order of which has bit length of 1024 bit. The second one is in the 160-bit subgroup of \\(Z_{p}^{\ast}\\). this set-up yields shorter signature.

### Signature and Verification
As in the Elgamal signatue scheme, the DSA signature consists of a pair of integers \\((r,s)\\). Since each of the two parameters is only 160-bit long, the total signature length is 320 bit. 
***
**DSA signature generation**
1. choose an integer as random ephemeral key \\(k_{E}\\) with \\(0 < k_{E} < q\\).
2. compute \\(r \equiv (\alpha^{k_{E}} \bmod p) \bmod q\\)
3. compute \\(s \equiv (SHA(x) + d \cdot r)k_{E}^{-1} \bmod q \\)
***

The signature verification process is as follows:
***
**DSA signature verification**
1. compute auxilary value \\(w \equiv s^{-1} \bmod q\\).
2. compute auxilary value \\(u_{1} \equiv w \cdot SHA(x) \bmod q\\).
3. compute auxilary value \\(u_{2} \equiv w \cdot r \bmod q\\).
4. compute \\(v \equiv (\alpha^{u_1} \cdot \beta^{u_2} \bmod p) \bmod q\\).
5. the verification \\(ver_{k_{pub}}(x, (r,s))\\) folows from
\begin{equation}
v = 
\begin{cases}
\equiv r \bmod q & => \text{valid signature} \cr
\not\equiv r \bmod q  & => \text{invalid signature}
\end{cases}
\end{equation}
***

## Elliptic Curve Digital Signature Algorithm (ECDSA)
Elliptic curves have several advantages over RSA and over DL schemes like Elgamal or DSA. In particular, in abscence of strong attacks against elliptic curve cryptosystems (ECC), bit lengths in the range of 160-256 bit can be chosen which provide security equivalent to 1024-3072 bit RSA and DL scheme. The shorter bit length of ECC often results in shorter processing time and in shorter signatures. 
The ECDSA standard is defined for elliptic curves over prime fields \\(Z_{p}\\) adn Galois fields \\(GF(2^m)\\). the former is often preferred in practice, and we only introduce this one in what follows
### key generation
***
**Key Generation for ECDSA**
1. Use and elliptic curve E with 
- modulus p
- coefficients a and b
- a point A which generates a cyclic group of prime order q.
2. choose a random integer d with \\(0 < d < q\\)
3. compute \\(B = dA\\).
The keys are now
\\(k_{pub} = (p,a,b,q,A,B)\\)
\\(k_{pr} = (d)\\)
***

### Signature and Verification
***
**ECDSA Signature Generation**
1. choose an integer as random ephemeral key \\(k_{E}\\) with \\( 0 < k_{E} < q\\).
2. compute \\(R = k_{E}A\\)
3. Let \\(r = x_{R}\\)
4. compute \\(s \equiv (h(x) + d \cdot r)k_{E}^{-1} \bmod q\\)
***
the signature verification process is as follows
***
**ECDSA Signature Verification**
1. Compute auxiliary value \\(w \equiv s^{-1} \bmod q\\)
2. compute auxilary value \\(u_1 \equiv w \cdot h(x) \bmod q\\)
3. compute auxiliary value \\(u_2 = w \cdot r \bmod q\\)
4. compute \\(P = u_1 A + u_2 B\\).
5. the verification \\(ver{k_{pub}}(x, (r,s))\\) follows from
\begin{equation}
x_{P} = 
\begin{cases}
\equiv r \bmod q & => \text{valid signature} \cr
\not\equiv r \bmod q  & => \text{invalid signature}
\end{cases}
\end{equation}
***
The point multiplication, which is in most cases by the far the most arithmetic intensive operation, can be precomputed by choosing the ephemeral key ahead of time.