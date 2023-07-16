---
title: zkp a brief understanding
date: 2023-06-20 14:29:26
tags: [cryptography,zkp]
---
<script
  src="https://cdn.mathjax.org/mathjax/latest/MathJax.js?config=TeX-AMS-MML_HTMLorMML"
  type="text/javascript">
</script>

## introduction
zk-SNARKs cannot be applied to any computational problem directly; rather, you have to convert the problem into the right “form” for the problem to operate on. The form is called a “quadratic arithmetic program” (QAP), and transforming the code of a function into one of these is itself highly nontrivial.

The example that we will choose is a simple one: proving that you know the solution to a cubic equation: `x**3 + x + 5 == 35`

## reference
- [vitalik's blog: qap zero to hero](https://medium.com/@VitalikButerin/quadratic-arithmetic-programs-from-zero-to-hero-f6d558cea649)