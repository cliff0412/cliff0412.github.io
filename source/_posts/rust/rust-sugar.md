---
title: rust sugar
date: 2022-11-17 15:47:13
tags: [rust]
---

## formatted print
```rust
// Positional arguments can be used
println!("{0}, this is {1}. {1}, this is {0}", "Alice", "Bob");
// As can named arguments.
println!("{subject} {verb} {object}",
            object="the lazy dog",
            subject="the quick brown fox",
            verb="jumps over");
// Different formatting can be invoked by specifying the format character
// after a `:`.
println!("Base 10:               {}",   69420); // 69420
println!("Base 2 (binary):       {:b}", 69420); // 10000111100101100
println!("Base 8 (octal):        {:o}", 69420); // 207454
println!("Base 16 (hexadecimal): {:x}", 69420); // 10f2c
println!("Base 16 (hexadecimal): {:X}", 69420); // 10F2C
// You can right-justify text with a specified width. This will
// output "    1". (Four white spaces and a "1", for a total width of 5.)
println!("{number:>5}", number=1);
// You can pad numbers with extra zeroes,
// and left-adjust by flipping the sign. This will output "10000".
println!("{number:0<5}", number=1);
// You can use named arguments in the format specifier by appending a `$`.
println!("{number:0>width$}", number=1, width=5);
```
- [reference](https://doc.rust-lang.org/rust-by-example/hello/print.html)


## syntax
```rust
/// print to stderr
eprintln!("server error: {}", e);

struct MyTupleStruct<M>(M);
let myTupleStruct =  MyTupleStruct::<String>(String::from("hello"));

vec.iter().position()
vec.iter().find()
vec.iter().any()


static mut A: u32 = 0;
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

## ptr
```rust
NonNull::new_unchecked()

#![feature(new_uninit)]
let mut five = Box::<u32>::new_uninit();
let five = unsafe {
    // Deferred initialization:
    five.as_mut_ptr().write(5);
    five.assume_init()
};
assert_eq!(*five, 5)

let zero = Box::<u32>::new_zeroed();
let zero = unsafe { zero.assume_init() };
assert_eq!(*zero, 0)

use std::alloc::{alloc, Layout};
unsafe {
    let ptr = alloc(Layout::new::<i32>()) as *mut i32;
    ptr.write(5);
    let x = Box::from_raw(ptr);
}
```