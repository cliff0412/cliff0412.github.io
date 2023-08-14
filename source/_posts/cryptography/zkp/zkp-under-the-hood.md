---
title: zkp how and why it works
date: 2023-07-01 14:29:26
tags: [cryptography,zkp]
---
<script
  src="https://cdn.mathjax.org/mathjax/latest/MathJax.js?config=TeX-AMS-MML_HTMLorMML"
  type="text/javascript">
</script>

## The medium of proof: Polynomial
If a prover claims to know some polynomial (no matter how large its degree is) that the verifier also knows, they can follow a simple protocol to verify the statement
• Verifier chooses a random value for x and evaluates his polynomial locally
• Verifier gives x to the prover and asks to evaluate the polynomial in question
• Prover evaluates his polynomial at x and gives the result to the verifier
• Verifier checks if the local result is equal to the prover’s result, and if so then the statement is proven with a high confidence

## Non-Interactive Zero-Knowledge of a Polynomial
1. Proving Knowledge of a Polynomial
A polynomial can be expressed in the form (where n is the degree of the polynomial):
\\[c_n x^n + ...+ c_1 x^1 + c_0 x^0\\]
It one claims that he know a polynomial, it is actually the knowledge of the polynomial's coefficients.

2. Factorization
The Fundamental Theorem of Algebra states that any polynomial can be factored into linear po- lynomials (i.e., a degree 1 polynomials representing a line), as long it is solvable. Consequently, we can represent any valid polynomial as a product of its factors:
\\[(x-a_0)(x-a_1)...(x-a_n) = 0\\]

if the prover wants to prove that indeed his polynomial has specific roots without disclosing the polynomial itself, he needs to prove that his polynomial \\(p(x)\\) is the multiplication of those cofactors \\(t(x) = (x − x_0)(x − x_1)\\), called target polynomial, where \\(x_0, x_1\\) are the specific roots. i.e.:
\\[p(x) = t(x) \cdot h(x)\\]
A natural way to find \\(h(x)\\) is through the division \\(h(x) = \frac{p(x)}{t(x)}\\)
> for simplicity, onwards we will use polynomial’s letter variable to denote its evaluation, e.g., \\(p = p(r)\\)

Using our polynomial identity check protocol we can compare polynomials \\(p(x)\\) and \\(t(x)·h(x)\\):
- Verifier samples a random value \\(r\\), calculates \\(t = t(r)\\) (i.e., evaluates) and gives \\(r\\) to the prover
- Prover calculates \\(h(x) = \frac{p(x)}{t(x)}\\) and evaluates \\(p(r)\\) and \\(h(r)\\); the resulting values \\(p,h\\) are
provided to the verifier
- Verifier then checks that \\(p = t \cdot h\\), if so those polynomials are equal, meaning that \\(p(x)\\) has \\(t(x)\\) as a cofactor.

**Remark 3.1** Now we can check a polynomial for specific properties without learning the polyno- mial itself, so this already gives us some form of zero-knowledge and succinctness. Nonetheless, there are multiple issues with this construction:
• Prover may not know the claimed polynomial \\(p(x)\\) at all. He can calculate evaluation \\(t = t(r)\\), select a random number \\(h\\) and set \\(p = t \cdot h\\), which will be accepted by the verifier as valid, since equation holds.
• Because prover knows the random point \\(x = r\\), he can construct any polynomial which has one shared point at \\(r\\) with \\(t(r) \cdot h(r)\\).
• In the original statement, prover claims to know a polynomial of a particular degree, in the current protocol there is no enforcement of degree. Hence prover can cheat by using a polynomial of higher degree which also satisfies the cofactors check.

3. Obscure Evaluation
Two first issues of remark 3.1 are possible because values are presented at raw, prover knows r and t(r). It would be ideal if those values would be given as a black box, so one cannot temper with the protocol, but still able to compute operations on those obscure values. 
3.1. Homomorphic Encryption
There are multiple ways to achieve homomorphic properties of encryption, and we will briefly introduce a simple one. The general idea is to choose a base number \\(g\\) and do ecncryption of a value \\(x\\) by exponentiate of \\(g\\)
\\[E(x) = g^{x} \bmod p\\]
For example, let \\(E(x_1) = g^{x_1} \bmod p\\), and \\(E(x_2) = g^{x_2} \bmod p\\), then
\\[E(x_2) \cdot E(x_1) = g^{x_1 + x_2} = E(x_1 + x_2) \\]

3.2. Encrypted Polynomial
Let us see how we can evaluate a polynomial \\(p(x) = x^3 − 3x^2 + 2x\\). Because homomorphic encryption does not allows to exponentiate an encrypted value, we’ve must been given encrypted values of powers of x from 1 to 3: \\(E(x),E(x2),E(x3)\\) so that
\\[ E(x^3)^1 \cdot E(x^2)^{-3} \cdot E(x)^2 = (g^{x^3})^{1} \cdot (g^{x^2})^{-3} \cdot (g^{x})^{2} = g^{1x^3} \cdot g^{-3x^2} \cdot g^{2x} = g^{x^3-3x^2+2x}\\]
Hence, we have an encrypted evaluation of our polynomial at some unknown to us \\(x\\) 

We can now update the previous version of the protocol, for a polynomial fo degree \\(d\\):
- Verifier
  - samples a random value \\(s\\), i.e., secret
  - calculates encryptions of \\(s\\) for all powers \\(i\\) in \\(0,1,...,d\\), i.e. : \\(E(s^{i}) = g^{s^{i}}\\)
  - evaluates unencrypted target polynomial with \\(s: t(s)\\)
  - encrypted powers of \\(s\\) are provided to the prover: \\(E(s^{0}),E(s^{1}),...,E(s^{d})\\)
- Prover
  - calculates polynomial \\(h(x) = \frac{p(x)}{t(x)}\\)
  - using encrypted powers \\(g^{s^{0}},g^{s^{1}},...,g^{s^{d}}\\) and coefficients \\(c_0, c_1,...,c_n \\) evaluates \\(E(p(s)) = g^{p(s)} = (g^{s^{d}})^{c_d} \cdot \cdot \cdot (g^{s^{1}})^{c_1} \cdot (g^{s^{0}})^{c_0}\\) and similarly \\(E(h(s)) = g^{h(s)}\\)
  - the resulting \\(g^p\\) and \\(g^h\\) are provided to the verifier
- Verifier
  - The alst step for the verifier is to checks that \\(p = t(s) \cdot h \\) in encrypted space: \\(g^p = (g^h)^{t(s)}\\) => \\(g^p = g^{t(s) \cdot h}\\)

> Note: because the prover does not know anything about s, it makes it hard to come up with non-legitimate but still matching evaluations.
## referneces
- [why and how zk-SNARK works by Maksym](https://arxiv.org/pdf/1906.07221.pdf)