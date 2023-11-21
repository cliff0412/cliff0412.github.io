---
title: understanding plonk
date: 2023-11-01 17:19:04
tags: [cryptography,zkp]
---

<script
  src="https://cdn.mathjax.org/mathjax/latest/MathJax.js?config=TeX-AMS-MML_HTMLorMML"
  type="text/javascript">
</script>

# introduction
[PLONK](https://eprint.iacr.org/2019/953), standing for the unwieldy quasi-backronym "Permutations over Lagrange-bases for Oecumenical Noninteractive arguments of Knowledge". PLONK still requires a "universal and updateable" trusted setup, meaning each program share the same setup. Secondly, there is a way for multiple parties to participate in the trusted setup such that it is secure as long as any one of them is honest.


# preliminary
## observation 1
a key fact: for non-zero \\( f \in \mathbb{F_p}^{\le d}[X]\\) <br>
for \\( r  \leftarrow \mathbb{F_p}: Pr[f(r) = 0] \le d/p\\)
understanding: polynomial \\(f\\) contains at most \\(d\\) roots of zeros. <br>
suppose \\( p \approx 2^{256}\\) and  \\( d \approx 2^{40}\\) then \\(d/p\\) is negligible. <br>
Therefore, for \\( r  \leftarrow \mathbb{F_p}\\) if \\(f(r) = 0\\) then \\(f\\) is identically zero w.h.p (with high probability)

=> a simple zero test for a committed polynomial
**Note** SZDL lemma: this also holds for multivariate polynomials (where d is total degree of f) 

## observation 2
let \\(f,g \in \mathbb{F_p}^{\le d}[X]\\).
for \\( r  \leftarrow \mathbb{F_p}\\), if \\(f(r) = g(r)\\), then \\(f = g\\) w.h.p <br>
\\(f(r)-g(r)=0\\) => \\(f-g=0\\) w.h.p <br>

=> a simple equality test for two committed polynomials

# useful proof gadgets
## zero test
let \\( \omega \in \mathbb{F_p} \\) be a primitive k-th root of unity \\(( \omega ^{k} = 1)\\)
set \\( H:= \\{1,\omega,\omega^2,\omega^3,...,\omega^{k-1}\\}  \subseteq \mathbb{F_p} \\)
let \\( f \in \mathbb{F_p}^{\le d}[X]\\) and \\( b, c \in \mathbb{F_p}\\)  \\((d \ge k)\\)

task: prove that \\(f\\) is identically zero on \\(H\\)
![zero test](images/zkp/plonk/zero_test.png)

**info** the box of \\(f\\) means the commitment of polynomial \\(f\\), i.e \\(com_f\\)

# PLONK: a poly-IOP for a general circuit C(x,w)
## step 1: compile circuit to a computation trace (gate fan-in = 2)
![circuit to trace](images/zkp/plonk/plonk_circuit_to_trace.png)

and encode the trace as polynomial

## references
- https://hackmd.io/@learn-zkp/note-plonk-family
- [ZKP MOOC Lecture 5: The Plonk SNARK](https://www.youtube.com/watch?v=A0oZVEXav24)
- [CS251.stanford lecture](https://cs251.stanford.edu/lectures/lecture15.pdf)


\\( \Omega=\{1,\omega,\omega^2,\omega^3,...,\omega^{d-1}\} \\)
\\(d=3*|Gate|+|PublicInput|+|Witness|\\)
\\(Selector*(Left+Right-Output)+(1-Selector)*(Left*Right-Output)=0\\)

LeftInput=f(\omega^{3l})
  RightInput=f(\omega^{3l+1})
  Output=f(\omega^{3l+2})
  x_1=f(\omega^9)