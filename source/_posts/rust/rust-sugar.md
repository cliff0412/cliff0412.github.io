---
title: rust sugar
date: 2022-11-17 15:47:13
tags: [rust]
---

## syntax
```rust
/// print to stderr
eprintln!("server error: {}", e);

struct MyTupleStruct<M>(M);
let myTupleStruct =  MyTupleStruct::<String>(String::from("hello"));

vec.iter().position()
vec.iter().find()
vec.iter().any()
```

## attributes
```rust
#![allow(warnings)]
#[allow(dead_code)]
#![allow(unused)]
// Suppress all warnings from casts which overflow.
#![allow(overflowing_literals)]
#![allow(unreachable_code)]
```

## memory
The compiler will not rearrange the memory layout
```rust
#[repr(C)]
struct A {
    a:u8,
    b:u32,
    c:u16
}
```
