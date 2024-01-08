---
title: classic implementations of arithematic of multi precision big integers
date: 2023-11-22 14:47:28
tags: [arithmatic]
---

<script
  src="https://cdn.mathjax.org/mathjax/latest/MathJax.js?config=TeX-AMS-MML_HTMLorMML"
  type="text/javascript">
</script>


## multiple-precision integer arithmetic
If \\(b ≥ 2\\) is an integer, then any positive integer \\(a\\) can be expressed uniquely as \\(a = a_n \cdot b^n+a_{n−1}\cdot b^{n−1}+···+a_1 \cdot b+a_0\\), where \\(a_i\\) is an integer with \\(0≤a_i <b \\) for \\(0≤ i ≤ n \\), and \\(a_n  \ne 0\\).

The representation of a positive integer \\(a\\) as a sum of multiples of powers of \\(b\\), as given above, is called the base \\(b\\) or \\(radix b\\) representation of \\(a\\), which is usually written as 
\\(a = (a_n a_{n−1} ···a_1 a_0)_b\\)

If \\( (a_n a_{n−1} ···a_1 a_0)_b\\) is the base b representation of \\(a\\) and \\(a_n \ne 0\\), then the precision
or length of a is n + 1. If n = 0, then a is called a single-precision integer; otherwise, a is a **multiple-precision** integer.

The division algorithm for integers provides an efficient method for determining the base b representation of a non-negative integer
![radix_b_repesentation](images/arithmatic/radix_b_repesentation.png)

if \\( (a_{n} a_{n−1} ···a_1 a_0)_b \\) is the base b representation of a and k is a positive integer, then

\\( (u_{l} u_{l−1} ···u_1 u_0)_{b^k} \\) is the base \\( b^k \\) representation of a, where \\( l =\lceil (n+1)/k \rceil -1 \\), 

\\( u_i = \sum_{j=0}^{k-1} a_{ik+j}b^j  \\) for \\( 0 \le i \le l-1 \\), and
\\( u_l = \sum_{j=0}^{n-lk} a_{lk+j}b^j\\)


### Representing negative numbers
**complement representation**.

## addition and subtraction
![multiple_precision_addition](images/arithmatic/multiple_precision_addition.png)
subraction is quite similar to addition. (omitted here)


## multiplication
Let x and y be integers expressed in radix b representation: 
\\( x = (x_n x_{n−1} ··· x_1 x_0)_b \\) and 

\\( y = (y_t y_{t−1} ··· y_1 y_0)_b \\). The product x · y will have at most (n + t + 2) base b digits.


## modular reduction
### Barrett 
### Mongtgomery
## references
- [1] [Handbook of Applied Cryptography chap14](http://cacr.uwaterloo.ca/hac/about/chap14.pdf)
- [2] [csdn blog](https://blog.csdn.net/mutourend/article/details/134224122?spm=1001.2014.3001.5502)
- [3] [risc zero youtube: ff implementations: Barrett & Montgomery](https://www.youtube.com/watch?v=hUl8ZB6hpUM)
- [4] [montgomery multiplication](https://en.algorithmica.org/hpc/number-theory/montgomery/)