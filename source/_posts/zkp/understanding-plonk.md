---
title: understanding_plonk
date: 2023-11-01 17:19:04
tags: [cryptography,zkp]
---

<script
  src="https://cdn.mathjax.org/mathjax/latest/MathJax.js?config=TeX-AMS-MML_HTMLorMML"
  type="text/javascript">
</script>

## introduction
[PLONK](https://eprint.iacr.org/2019/953), standing for the unwieldy quasi-backronym "Permutations over Lagrange-bases for Oecumenical Noninteractive arguments of Knowledge". PLONK still requires a "universal and updateable" trusted setup, meaning each program share the same setup. Secondly, there is a way for multiple parties to participate in the trusted setup such that it is secure as long as any one of them is honest.


## references
- https://hackmd.io/@learn-zkp/note-plonk-family