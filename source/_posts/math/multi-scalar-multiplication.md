---
title: multi scalar multiplication (MSM)
date: 2024-01-08 11:13:17
tags: [math]
---

<script
  src="https://cdn.mathjax.org/mathjax/latest/MathJax.js?config=TeX-AMS-MML_HTMLorMML"
  type="text/javascript">
</script>

## Problem
Let \\( \mathbb{G}\\) be a group of order \\(p=2^{\lambda}\\)(\\(\lambda\\) would be the number of bits of the prime).  Give \\(n\\) scalars \\(e_i\\) and \\(n\\) EC points \\(P_i\\), calculate \\(P\\) such that 
\\[ P = \sum_{i=0}^{n}e_i P_i \\]

## naive approach
Let \\(e_i = e_{i,\lambda -1} e_{i,\lambda -2} ...e_{i,0} \\), where each \\(e_{i,j} \in 0,1\\).
We have
\\[ e_i = e_{i,\lambda-1}\cdot2^{\lambda-1} + e_{i, \lambda-2}\cdot2^{\lambda-2} + ...+e_{i,0}\cdot2^0\\]
To compute \\(e_i \cdot p_i\\), we can compute \\(2^0 \cdot p_i,2^1 \cdot p_i,...,2^{\lambda-1} \cdot p_i  \\). Then, we simply add them up to get \\(e_i \cdot p_i\\). Here, we need \\(\lambda -1\\) squarings (multiplication by 2) and \\(\lambda-1\\) additions.
To computing \\(e_1\cdot p_1, e_2 \cdot p_2, ..., e_{N-1}\cdot p_{N-1}\\), we need \\(N\cdot(\lambda-1)\\) squarings and \\(N\cdot(\lambda-1)\\) additions.

We additionally need \\(N-1\\) additions to sum \\(e_i\cdot p_i\\) into \\(P\\).
In total, weed \\(N\cdot(\lambda-1)\\) squarings and \\(N\cdot\lambda=1\\) additions


## pippenger approach
at a high level, Pippenger approach divides \\(\lambda\\) bits into `num_window` (\\(=\frac{\lambda}{c}\\)) bit windows where each bit window has \\(c\\) bits. \\(c\\) is also called "window size".

### Part I (computation for each window)
Initialize a vector `window_res = [0,0,...,0]` of length `num_window`.
For the w-th window:
- Initialize a vector `buckets=[0,0,...,0]` of length `num_buckets` = \\( 2^c -1 \\).
- Get the `start_idx` of the current window, say \\(M\\). Remember that we are considering a `c-bit` window out of \\(\lambda\\)-bit fields
- for each pair of \\((e_i, g_i)\\)
  - Get the bits in scalar \\(e_i\\) correspondign to the current window. Formally, we have `scalar` = \\((e_i >> M) \mod 2^c\\).
  - If `scalar` \\(\ne 0\\), we have buckets[scalar-1] += \\(p_i\\)
- Initialize `tmp = 0`
- For `j` in \\(2^c-1\\) to 1:
      `tmp= tmp+buckets[j]`
- `window_res[w] = tmp`

### Part II (sum over all windows)

```
lowest = window_res[0]
total = 0
for w in num_window -1 to 1:
  total += window_res[w]
  for _ in 0..c:
    total = total + total // shift left c bits.
total = total + lowest
```
`total` is the final result

In Part I, for each window, we need \\(N+2^c\\) additions. Since we have \\(\frac{\lambda}{c}\\) windows, we need \\((N+2^{\lambda}*\frac{\lambda}{c})\\) additions.

In Part II, we need 1 addition and `c` squarings for each window.
In total, we need \\(\frac{\lambda}{c}\cdot(N+2^c+1)\\) additions and \\(\lambda\\) squarings.

In Arkworks implementation, `c` is set to be \\(ln(N)+2\\).
For notation simplicity, let's set `c` to be \\(log2(N)\\). Then, the computation complexity of Pippenger's algorithm is \\(\frac{2N\lambda}{log2(N)}+1\\) additions and \\(\lambda\\) squarings
Since \\(\lambda\\) is a constant for a elliptic curve, people usually say that pippenger has a time complexity of \\(O(\frac{N}{log(N)})\\)

## References
- [pippenger MSM](https://hackmd.io/@drouyang/SyYwhWIso)
- [MSM](https://hackmd.io/@tazAymRSQCGXTUKkbh1BAg/Sk27liTW9)