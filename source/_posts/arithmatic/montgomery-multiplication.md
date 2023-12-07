---
title: montgomery multiplication
date: 2023-12-07 19:10:13
tags: [number_theory]
---

<script
  src="https://cdn.mathjax.org/mathjax/latest/MathJax.js?config=TeX-AMS-MML_HTMLorMML"
  type="text/javascript">
</script>

## montgomery space
Montgomery multiplication works by first transforming the multipliers into Montgomery space, where modular multiplication can be performed cheaply, and then transforming them back when their actual values are needed. Unlike general integer division methods, Montgomery multiplication is not efficient for performing just one modular reduction and only becomes worthwhile when there is a chain of modular operations. 

The space is defined by the modulo `n` and a positive integer `r ≥ n` coprime to `n`. The algorithm involves modulo and division by `r`, so in practice, `r` is chosen to be `2^32` or `2^64`, so that these operations can be done with a right-shift and a bitwise `AND` respectively.


Definition. the representative \\(\bar{x}\\) of a number \\(x\\) in the Montgomery space is defined as 
\\[ \bar{x} = x \cdot r \mod n \\]

Computing this transformation involves a multiplication and a modulo — an expensive operation that we wanted to optimize away in the first place — which is why we only use this method when the overhead of transforming numbers to and from the Montgomery space is worth it and not for general modular multiplication.

Inside the Montgomery space, addition, substraction, and checking for equality is performed as usual:


\\[ x \cdot r + y \cdot r \equiv (x+y) \cdot r \mod n \\]

However, this is not the case for multiplication. Denoting multiplication in the Montgomery space as \\(∗\\) and the “normal” multiplication as \\(\cdot\\), we expect the result to be:
\\[ \bar{x} * \bar{y} = \overline{x\cdot y} = (x\cdot y)\cdot r \mod n \\]

But the normal multiplication in the Montgomery space yields:
\\[ \bar{x} \cdot \bar{y}=(x\cdot y)\cdot r \cdot r \mod n  \\]

Therefore, the multiplication in the Montgomery space is defined as
\\[ \bar{x} * \bar{y} = \bar{x} \cdot \bar{y} \cdot r^{-1} \mod n \\]

This means that, after we normally multiply two numbers in the Montgomery space, we need to reduce the result by multiplying it by \\(r^{-1}\\)  and taking the modulo — and there is an efficent way to do this particular operation.


## Montgomery reduction
assume that \\(r=2^{32}\\), the modulo \\(n\\) is 32-bit, and the number \\(x\\) we need to reduce is 64-bit(the product of two 32-bit numbers). The goal is to calculate \\(y=x\cdot r^{-1} \mod n\\).

Since \\(r\\) is coprime with \\(n\\), we know that there are two numbers \\(r^{-1}\\) and \\(n'\\) in the \\([0, n)\\) range such that
\\[ r \cdot r^{-1} + n \cdot n' = 1 \\]
both \\(r^{-1} and \quad n'\\) can be computed using extended Euclidean algorithm **(\\(n' = n^{-1} \mod r\\))**.
Using this identiy, we can express \\(r \cdot r^{-1}\\) as \\(1-n\cdot n'\\) and write \\(x \cdot r^{-1}\\) as

\\[
  \displaylines{
  x\cdot r^{-1} = \frac{x \cdot r \cdot r^{-1}}{r} \\\\
  = \frac{x \cdot (1-n\cdot n')}{r} \\\\
  = \frac{x - x \cdot n \cdot n'}{r} \\\\
  = \frac{x - x \cdot n \cdot n' + k\cdot r \cdot n}{r} \quad (\mod n) (for \hspace{0.2cm}any\hspace{0.2cm} integer\hspace{0.2cm} k) \\\\
  = \frac{x - (x\cdot n' - k\cdot r)\cdot n}{r}
}
  \\]

Now, if we choose \\(k\\) to be \\(\lfloor x\cdot n'/r\rfloor\\) (the upper 64 bits of \\(x\cdot n'\\), giving \\(x\\) is 64 bits and \\(n'\\) is 32 bits ), it will cancel out, and \\(k\cdot r - x\cdot n'\\) will simply be equal to \\(x \cdot n' \mod r\\) (the lower 32 bits of \\(x\cdot n'\\)), implying:
\\[ x\cdot r^{-1} = (x - (x\cdot n' \mod r )\cdot n)/r\\]

the algorithm itself just evaluates this formula, performing two multiplications to calculate \\(q = x\cdot n' \mod r\\) and \\(m = q\cdot n\\), and then subtracts it from \\(x\\) and right shifts the result to divide it by r.

The only remaining thing to handle is that the result may not be in the \\([0,n)\\) range; but since
\\[x < n\cdot n < r\cdot n => x/r < n \\]
and
\\[m = q\cdot n < r\cdot n => m/r < n\\]
it is guaranted that 
\\[ -n < (x-m)/r < n \\]

Therefore, we can simply check if the result is negative and in that case, add \\(n\\) to it, giving the following algorithm:

```cpp
typedef __uint32_t u32;
typedef __uint64_t u64;

const u32 n = 1e9 + 7, nr = inverse(n, 1ull << 32); // nr is n' in the above equations, r is 1<<32

u32 reduce(u64 x) {
    u32 q = u32(x) * nr;      // q = x * n' mod r
    u64 m = (u64) q * n;      // m = q * n
    u32 y = (x - m) >> 32;    // y = (x - m) / r
    return x < m ? y + n : y; // if y < 0, add n to make it be in the [0, n) range
}
```
This last check is relatively cheap, but it is still on the critical path. If we are fine with the result being in the \\([0,2\cdot n−2]\\) range instead of \\([0, n)\\), we can remove it and add \\(n\\) to the result unconditionally:

```cpp
u32 reduce(u64 x) {
    u32 q = u32(x) * nr;
    u64 m = (u64) q * n;
    u32 y = (x - m) >> 32;
    return y + n
}
```

We can also move the `>> 32` operation one step earlier in the computation graph and compute \\(\lfloor x/r \rfloor - \lfloor m/r \rfloor\\) instead of \\( (x-m)/r\\). This is correct because the lower 32 bits of \\(x\\) and \\(m\\) are equal anyway since 
\\[ m = x\cdot n' \cdot n = x \mod r\\] (mod r is same as taking the lower 32 bits).

But why would we voluntarily choose to perfom two right-shifts instead of just one? This is beneficial because for `((u64) q * n) >> 32` we need to do a 32-by-32 multiplication and take the upper 32 bits of the result (which the x86 mul instruction already writes in a separate register, so it doesn’t cost anything), and the other right-shift `x >> 32` is not on the critical path.
```cpp
u32 reduce(u64 x) {
    u32 q = u32(x) * nr;
    u32 m = ((u64) q * n) >> 32;
    return (x >> 32) + n - m;
}
```
if to reduce a u128 number（u64 * u64). it is as below
```cpp
typedef __uint128_t u128;

u64 reduce(u128 x) const {
    u64 q = u64(x) * nr;
    u64 m = ((u128) q * n) >> 64;
    return (x >> 64) + n - m;
}
```

## references
- https://en.algorithmica.org/hpc/number-theory/montgomery/
- [csdn blog on montgomery reduction](https://blog.csdn.net/mutourend/article/details/95613967)
- [nayuki montgomery reduction](https://www.nayuki.io/page/montgomery-reduction-algorithm)
