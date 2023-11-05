---
title: zkp demystify zokrates
date: 2023-07-14 14:29:26
tags: [cryptography,zkp]
---
<script
  src="https://cdn.mathjax.org/mathjax/latest/MathJax.js?config=TeX-AMS-MML_HTMLorMML"
  type="text/javascript">
</script>

## pipeline
### source file
an example, `square.zok`
```
def main(private field a, field b) {
    assert(a * a == b);
    return;
}
```
- The keyword private signals that we do not want to reveal this input, but still prove that we know its value.
### compile
```
zokrates compile -i root.zok
```
after compile, it generates below files
- out
- out.r1cs
- abi.json
### setup
Performs a trusted setup for a given constraint system
```
zokrates setup
```
options 
-  -i, --input <FILE>                       Path of the binary [default: out]
it generates below two files
- proving.key
- verification.key