---
title: cryptography (1) group & field
date: 2023-06-03 14:29:26
tags: [cryptography]
---
<script
  src="https://cdn.mathjax.org/mathjax/latest/MathJax.js?config=TeX-AMS-MML_HTMLorMML"
  type="text/javascript">
</script>



## Group
a group is a set of elements \\( G \\) together with an operation \\( \circ \\). a group has the following properties
1. the group operation \\( \circ \\) is closed. that is, for all \\( a,b, \in G  \\), it holds that \\( a \circ b = c \in G \\)
2. the group operation is associative. That is, \\( a \circ (b \circ c) = (a \circ b) \circ c \\) for all \\( a,b,c \in G \\)
3. there is an element \\( 1 \in G \\), called the neutral element (or identity element), such that \\( a \circ \ = 1 \circ a\\) for all \\( a \in G \\)
4. For each \\( a \in G \\) there exists an element \\( a^{-1} \in G\\), called the inverse of a, such that \\( a \circ a^{-1} = 1 \\).
5. a group G is abelian (or commutative) if, furthermore, \\( a \circ b = b \circ a \\) for all \\( a, b \in G \\) 

### Example of Group
the set of integers \\( Z_{m} = 0,1,...,m-1 \\) and the operation addition modulo \\( m \\) forma group with the neutral element 0. every element \\( a \\) has an inverse \\(  -a \\). note that this set does not form a group with the operation multiplication gecause mose eleents \\(  a \\) do not have an inverse such that \\(  a a^{-1} = 1 \bmod m\\).

In order to have all four basic arithmetic operations (i.e. addition, subtraction, multiplication, division) in one structure, we need a set which contains an additive and a multiplicative group. this is what we call a field.

## Field
A field is a set of elements with the following properties
- all elements of \\( F\\) form an additive group with the group operation \\( + \\) and the neutral element \\( 0 \\)
-  all element of \\( F \\) except \\( 0 \\) form a multiplicative group with the gorup operation \\( x \\) and the neutral element \\( 1 \\) .
- when the two group operations are mixed, the distributivety law holds, i.e., for all \\( a,b,c \in F: a(b+c) = (ab) + (ac) \\)  

### Example of Field
the set \\( R \\) of real numbers is a field with the neutral element 0 for the additive group and the neutral element 1 for the multiplicative group. every real number \\( a \\) has an additive inverse, namely \\( -a \\), and every nonzero element \\( a \\) has a multiplicative inverse \\( 1 \div a \\)

## Galois Field
In cryptography, we are almose always interested in fields with a **finite** number of elements, which we call finite fields or `Galois field`. the number of elements in the field is called the `order` or `cardinality` of the field. Of fundamental importance is the following theorem
***
a field with order `m` only exists if `m` is a prime power, i.e, \\( m = p^{n} \\), for some positive integer `n` and prime integer `p`. `p` is called the characteristic of the finite field
***

the theorem implies that there are, for instance, finite fields with 11 elements (\\( 11^{1} \\)), or with 81 elements \\( 81 = 3^{4} \\) or with 256 elements (\\( 256 = 2^{8} \\)). 

## Prime Field
the most intuitive examples of finite fields are fields of prime order, i.e., fields with \\( n =1 \\). elements of the field \\( GF(p) \\) can be represented by integers \\( 0,1,..., p-1 \\).

## Extension Field `GF(2^m)`
In AES the finite field contains 256 elements and is denoted as \\( GF(2^8) \\).
However, if the order  of a finite field is not prime, and \\( 2^8 \\) is clearly not a prime, the addition and multiplication operation cannot be represented by addition and multiplication of integers modulo \\( 2^8 \\). such fields with \\( m >1 \\) are called `extension field`. in order to deal with extension fields we need (1) a different notation for field elements and (2) different rules for performing arithmetic with the elements. elements of extension fields can be represented as `polynomials`, and computation in the extension field is achieved by performing a certain type of `polynomial arithmetic`.

In the field \\( GF(2^8) \\), which is used in AES, each element \\( A \in GF(2^8) \\) is thus represented as: 
\\[ A(x) = a_{7}x^7 + ...+a_{1}x+a_{0}, a_{i} \in GF(2) = {0,1} \\]
It is also important to observe that every polynomial can simply be stored in digital form as an 8-bit vector
\\[ A = (a_7,a_6,a_5,a_4,a_3,a_2,a_1,a_0) \\]

### addition and subtraction in `GF(2^m)`
addition and subtraction are simply achieved by performing polynomial addition and subtraction. note that we perform modulo 2 addition (or subtraction) with the coefficients.
\\[ A(x) = x^7 + x^6 + x^4 + 1 \\]
\\[ B(x) = x^4 + x^2+ 1 \\]
\\[ A(x) + B(x) = x^7 + x^6+ x^2 \\]

### multiplication in `GF(2^m)`
firstly, two elements (represented by their polynomials) of a finite field `GF(2^m)` are multiplied usig the standard polynomial multiplication rule \\[ A(x) \dot B(x) = C(x) \\]. In general, the product polynomial \\[ C(x) \\] will have a degree higher than `m-1` and has to be reduced. to do that, the product of the multiplication is divided by a certain polyhomial, and we consider only the remainder after the polynomial division. we need **irreducible** polynomials for the module reduction. irreducible polynomials are roughly comparable to prime numbers. their only factors are 1 and polynomial itself.
Thus, every field `GF(2^m)` requires an irreducible polynomial `P(x)` of degree `m`. 
For AES, the irreducible polynomial is 
\\[ P(x) = x^8 + x^4+ x^3 +x + 1 \\]
the main algorithm for computing multiplicative inverse is the extended Euclidean algorithm, which is introduced in other posts.