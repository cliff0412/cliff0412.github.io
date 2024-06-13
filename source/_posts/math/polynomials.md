---
title: polynomials
date: 2024-06-13 11:13:17
tags: [math]
---

<script
 src="https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.7/MathJax.js?config=TeX-MML-AM_CHTML"
  type="text/javascript">
</script>

## Introduction
Let \\(A(X)\\) be a polynomial over \\(\mathbb{F}_p\\) with formal indeterminate \\(X\\). As an example,

$$
A(X) = a_0 + a_1 X + a_2 X^2 + a_3 X^3
$$

defines a degree-\\(3\\) polynomial. \\(a_0\\) is referred to as the constant term. Polynomials of
degree \\(n-1\\) have \\(n\\) coefficients.

#### (aside) Horner's rule
> Horner's rule allows for efficient evaluation of a polynomial of degree \\(n-1\\), using
> only \\(n-1\\) multiplications and \\(n-1\\) additions. It is the following identity:
> $$\begin{aligned}a_0 &+ a_1X + a_2X^2 + \cdots + a_{n-1}X^{n-1} \\ &= a_0 + X\bigg( a_1 + X \Big( a_2 + \cdots + X(a_{n-2} + X a_{n-1}) \Big)\!\bigg),\end{aligned}$$

## Quotient Poly
1. divide the evaluation in each point & use iFFT to get the poly coefficients
2. or, could use [polynomial long division](!https://en.wikipedia.org/wiki/Polynomial_long_division)


## The Schwartz-Zippel lemma
The Schwartz-Zippel lemma informally states that "different polynomials are different at
most points." Formally, it can be written as follows:

> Let \\(p(x_1, x_2, \cdots, x_n)\\) be a nonzero polynomial of \\(n\\) variables with degree \\(d\\).
> Let \\(S\\) be a finite set of numbers with at least \\(d\\) elements in it. If we choose random
> \\(\alpha_1, \alpha_2, \cdots, \alpha_n
\\) from \\(S\\),
> $$\text{Pr}[p(\alpha_1, \alpha_2, \cdots, \alpha_n) = 0] \leq \frac{d}{|S|}.$$

In the familiar univariate case \\(p(X)\\), this reduces to saying that a nonzero polynomial
of degree \\(d\\) has at most \\(d\\) roots.

The Schwartz-Zippel lemma is used in polynomial equality testing.  Given two multi-variate
polynomials \\(p_1(x_1,\cdots,x_n)\\) and \\(p_2(x_1,\cdots,x_n)\\) of degrees \\(d_1, d_2\\)
respectively, we can test if
\\(p_1(\alpha_1, \cdots, \alpha_n) - p_2(\alpha_1, \cdots, \alpha_n) = 0\\) for random
\\(\alpha_1, \cdots, \alpha_n \leftarrow S,\\) where the size of \\(S\\) is at least
\\(|S| \geq (d_1 + d_2).\\)  If the two polynomials are identical, this will always be true,
whereas if the two polynomials are different then the equality holds with probability at
most \\(\frac{\max(d_1,d_2)}{|S|}\\).


## Vanishing polynomial
Consider the order-\\(n\\) multiplicative subgroup \\(\mathcal{H}\\) with primitive root of unity
\\(\omega\\). For all \\(\omega^i \in \mathcal{H}, i \in [n-1],\\) we have
\\((\omega^i)^n = (\omega^n)^i = (\omega^0)^i = 1.\\) In other words, every element of
\\(\mathcal{H}\\) fulfils the equation 

$$
\begin{aligned}
Z_H(X) &= X^n - 1 \\
&= (X-\omega^0)(X-\omega^1)(X-\omega^2)\cdots(X-\omega^{n-1}),
\end{aligned}
$$

meaning every element is a root of \\(Z_H(X).\\) We call \\(Z_H(X)\\) the **vanishing polynomial**
over \\(\mathcal{H}\\) because it evaluates to zero on all elements of \\(\mathcal{H}.\\)

This comes in particularly handy when checking polynomial constraints. For instance, to
check that \\(A(X) + B(X) = C(X)\\) over \\(\mathcal{H},\\) we simply have to check that
\\(A(X) + B(X) - C(X)\\) is some multiple of \\(Z_H(X)\\). In other words, if dividing our
constraint by the vanishing polynomial still yields some polynomial
\\(\frac{A(X) + B(X) - C(X)}{Z_H(X)} = H(X),\\) we are satisfied that \\(A(X) + B(X) - C(X) = 0\\)
over \\(\mathcal{H}.\\)


## Lagrange basis functions


Polynomials are commonly written in the monomial basis (e.g. \\(X, X^2, ... X^n)\\). However,
when working over a multiplicative subgroup of order \\(n\\), we find a more natural expression
in the Lagrange basis.

Consider the order-\\(n\\) multiplicative subgroup \\(\mathcal{H}\\) with primitive root of unity
\\(\omega\\). The Lagrange basis corresponding to this subgroup is a set of functions
\\(\mathcal{L_i}_{i = 0}^{n-1}\\)
where 

$$
\mathcal{L_i}(\omega^j) = \begin{cases}
1 & \text{if } i = j, \\
0 & \text{otherwise.}
\end{cases}
$$

We can write this more compactly as \\(\mathcal{L_i}(\omega^j) = \delta_{ij},\\) where
\\(\delta\\) is the Kronecker delta function. 

Now, we can write our polynomial as a linear combination of Lagrange basis functions,

$$A(X) = \sum_{i = 0}^{n-1} a_i\mathcal{L_i}(X), X \in \mathcal{H},$$

which is equivalent to saying that \\(A(X)\\) evaluates to \\(a_0\\) at \\(\omega^0\\),
to \\(a_1\\) at \\(\omega^1\\), to \\(a_2\\) at \\(\omega^2, \cdots,\\) and so on.

When working over a multiplicative subgroup, the Lagrange basis function has a convenient
sparse representation of the form

$$
\mathcal{L}_i(X) = \frac{c_i\cdot(X^{n} - 1)}{X - \omega^i},
$$

where \\(c_i\\) is the barycentric weight. (To understand how this form was derived, refer to
[^barycentric].) For \\(i = 0,\\) we have
\\(c = 1/n \implies \mathcal{L}_0(X) = \frac{1}{n} \frac{(X^{n} - 1)}{X - 1}\\).

Suppose we are given a set of evaluation points \\(\{x_0, x_1, \cdots, x_{n-1}\}\\).
Since we cannot assume that the \\(x_i\\)'s form a multiplicative subgroup, we consider also
the Lagrange polynomials \\(\mathcal{L}_i\\)'s in the general case. Then we can construct:

$$
\mathcal{L}_i(X) = \prod_{j\neq i}\frac{X - x_j}{x_i - x_j}, i \in [0..n-1].
$$

Here, every \\(X = x_j \neq x_i\\) will produce a zero numerator term \\((x_j - x_j),\\) causing
the whole product to evaluate to zero. On the other hand, \\(X= x_i\\) will evaluate to
\\(\frac{x_i - x_j}{x_i - x_j}\\) at every term, resulting in an overall product of one. This
gives the desired Kronecker delta behaviour \\(\mathcal{L_i}(x_j) = \delta_{ij}\\) on the
set \\(\{x_0, x_1, \cdots, x_{n-1}\}\\).

### Lagrange interpolation
Given a polynomial in its evaluation representation

$$A: \{(x_0, A(x_0)), (x_1, A(x_1)), \cdots, (x_{n-1}, A(x_{n-1}))\},$$

we can reconstruct its coefficient form in the Lagrange basis:

$$A(X) = \sum_{i = 0}^{n-1} A(x_i)\mathcal{L_i}(X), $$

where \\(X \in \{x_0, x_1,\cdots, x_{n-1}\}.\\)

## references
- [1] [halo2 book](https://zcash.github.io/halo2/background/polynomials.html)