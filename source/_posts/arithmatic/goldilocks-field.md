---
title: goldilocks field
date: 2023-11-18 11:06:53
tags: [arithmatic]
---


<script
  src="https://cdn.mathjax.org/mathjax/latest/MathJax.js?config=TeX-AMS-MML_HTMLorMML"
  type="text/javascript">
</script>

# properties
\\( p = \phi^2 - \phi + 1\\)
\\( \epsilon  = \phi -1\\)

## Goldilocks Addition
let \\( a = a_0 + a_1 \cdot \phi, b = b_0 + b_1 \cdot \phi\\)

`(c, carry) = a + b`;
- if carry = 0 && c > p, result should be `c -p`
- if carry = 0 && c < p, result should be `c`
- if carry = 1 
let \\( c = c_0 + c_1 \cdot \phi + c_2 \cdot \phi^2\\), and \\(c_2 = 1 \\). let \\( u = c_0 + c_1 \cdot \phi \\)
therefore \\(a + b \mod p\\) should be \\( a + b - p = c_0 + c_1 \cdot \phi + \phi^2 - (\phi^2 - \phi + 1) =c_0 + c_1 \cdot \phi + \phi - 1 = u + \phi - 1\\) 
  - if \\( u  <  p\\), computationally, \\( u  -  p\\) will borrow from \\( \phi^2\\), which is equivalent to
  \\( \phi^2 + u - p = u + \phi - 1  \\), which is \\( a - b \mod p\\). therefore, the result is just \\( u-p \\)
  - if \\( u> p\\), this will unlikely occur, if u >p, given by \\( \phi^2 > p \\), so \\( u + \phi^2 > p + \phi^2 > 2p\\) that means a or b is not in canonical form. <span style="color:red">**does not consider this case for now**</span>

## Goldilocks Subtraction
\\(a - b \mod MOD\\)
if a < b, a - b is negative, and the binary representation is 2's complement of the negative value. therefore, it's requied to add by MOD and treat the final binary representation as positive value.

## Goldilocks Multiplication
let \\(a = a_0 + a_1 \cdot \phi\\), and \\(b=b_0 + b_1 \cdot \phi\\)
to compute \\(c = a \cdot b\\)
- first, turn it into \\( a_0 \cdot b_0 +(a_1\cdot b_0 +a_0\cdot b_1)\cdot \phi + a_1 \cdot b_1 \phi^2 \\)
it may carry to \\( \phi^2 \\). so the results is a `u128` (`[u32;4]`)
- second, reduce the `[u32;4]` to `u64`, details to be described in the following section.
## plonky2 Goldilocks Fieldreduce128
```rust
fn reduce128(x: u128) -> GoldilocksField {
    let (x_lo, x_hi) = split(x); // This is a no-op
    let x_hi_hi = x_hi >> 32;
    let x_hi_lo = x_hi & EPSILON;

    let (mut t0, borrow) = x_lo.overflowing_sub(x_hi_hi);
    if borrow {
        branch_hint(); // A borrow is exceedingly rare. It is faster to branch.
        t0 -= EPSILON; // Cannot underflow.
    }
    let t1 = x_hi_lo * EPSILON;
    let t2 = unsafe { add_no_canonicalize_trashing_input(t0, t1) };
    GoldilocksField(t2)
}
```

let \\( n = n_0 + n_1 \cdot \phi + n_2 \cdot \phi^{2} + n_3 \cdot \phi^{3}\\)
since, \\(\phi^{3} = -1\\), \\(n\\) could be reduced to \\( n = n_0 + n_1 \cdot \phi + n_2 \cdot \phi^{2} - n_3  \\),
which is line 6 in the above code snipet. when borrow occurs, it means it borrows \\( \phi^2\\) ( subtraction is of u64, so borrow 1 menas add \\( \phi^2\\), `1<<64`). therefore, needs to reduce \\( \phi^2\\). since \\( \phi^2 = \phi - 1\\), which is reduce by \\( \phi - 1\\) (this is `EPSILON`). 
**Note** needs to consider line 23 could underflow

next step is to reduce \\( n_2 \cdot \phi^2 \\), which is just \\( n_2 \cdot (\phi -1)  \\), which is \\( n_2 \cdot EPSILON  \\), line 11, `x_hi_lo * EPSILON`


## Sppark reduce(uint32_t temp[4])
```cpp
    inline void reduce(uint32_t temp[4])
    {
        uint32_t carry;

        asm("sub.cc.u32 %0, %0, %3; subc.cc.u32 %1, %1, %4; subc.u32 %2, 0, 0;"
            : "+r"(temp[0]), "+r"(temp[1]), "=r"(carry)
            : "r"(temp[2]), "r"(temp[3]));
        asm("add.cc.u32 %0, %0, %2; addc.u32 %1, %1, %3;"
            : "+r"(temp[1]), "+r"(carry)
            : "r"(temp[2]), "r"(temp[3]));

        asm("mad.lo.cc.u32 %0, %3, %4, %0; madc.hi.cc.u32 %1, %3, %4, %1; addc.u32 %2, 0, 0;"
            : "+r"(temp[0]), "+r"(temp[1]), "=r"(temp[2])
            : "r"(carry), "r"(gl64_device::W));
        asm("mad.lo.cc.u32 %0, %2, %3, %0; madc.hi.u32 %1, %2, %3, %1;"
            : "+r"(temp[0]), "+r"(temp[1])
            : "r"(temp[2]), "r"(gl64_device::W));


        asm("mad.lo.cc.u32 %0, %2, %3, %0; madc.hi.u32 %1, %2, %3, %1;"
            : "+r"(temp[0]), "+r"(temp[1])
            : "r"(temp[2]), "r"(gl64_device::W));

        asm("mov.b64 %0, {%1, %2};" : "=l"(val) : "r"(temp[0]), "r"(temp[1]));
    }

```
**note**: `W` is epsilon
let \\( n = n_0 + n_1 \cdot \phi + n_2 \cdot \phi^{2} + n_3 \cdot \phi^{3}\\) 
\\( n = n_0 + n_2\cdot\phi^2 + \phi(n_1+n_3\cdot \phi^2)\\).
since \\( \phi^2 = \phi - 1\\)
\\( n = n_0 + n_2\cdot(\phi-1) + \phi(n_1+n_3\cdot(\phi-1))\\).
\\( n = n_0 -n_2 +n_2\phi + \phi(n_1-n_3 + n_3\cdot\phi)\\).
\\( n = n_0 -n_2 + \phi(n_1-n_3 +n_2) + n_3\cdot\phi^2\\).
line 5 computes `n0 - n2` and set to temp[0]; & computes `n1-n3` and sets to temp[1]
line 8 computes `n1- n3 + n2`; add n_3 with carry and put it to carry.

let \\(c\\) be the carry, at \\(\phi^2\\), it is actually \\( c \cdot \phi^2\\). it could be further reduced to  \\(c \cdot (\phi - 1) = c \cdot W\\)
line 12 is to reduce the carry part to temp[0], temp[1], and temp[2].
if temp[2] still exist. line 15 will reduce it to temp[0], temp[1] similar as above.
at this step. only temp[0] and temp[1] will contains value and return as the result


## appendix
- underflow
```
uint64_t tmp;
uint32_t borrow;
asm("{ .reg.pred %top;");
asm("sub.cc.u64 %0, %0, %2; subc.u32 %1, 0, 0;"
    : "+l"(val), "=r"(borrow)
    : "l"(b.val));
```
all bits of borrow will be set to 1 if underflow occurs

# references
- [The Goldilocks Prime by Remco Bloemem](https://xn--2-umb.com/22/goldilocks/)
- [parameters of goldilocks field](https://cronokirby.com/notes/2022/09/the-goldilocks-field/)
- [csdn blog](https://blog.csdn.net/mutourend/article/details/126407028)
- [cuda implementation of GoldilocksNTT by yrrid](https://github.com/yrrid/GoldilocksNTT/tree/main)