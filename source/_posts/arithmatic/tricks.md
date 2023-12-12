---
title: cryptography arithmetic tricks
date: 2023-11-22 14:47:28
tags: [arithmatic]
---

<script
  src="https://cdn.mathjax.org/mathjax/latest/MathJax.js?config=TeX-AMS-MML_HTMLorMML"
  type="text/javascript">
</script>

- get the next m*SIZE
```cpp
# define WARP_SZ 32
size_t n = (nelems+WARP_SZ-1) & ((size_t)0-WARP_SZ)
```
0-WARP_SIZE = 0xffffffffffffffe0
eo = 0b11100000
it will select multiples of WARP_SZ
nelems+WARP_SZ-1 will counter for the removed numbers by 00000

n will be [32, 64, 96, ...]