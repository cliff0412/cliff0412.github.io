---
title: rust memory layout
date: 2022-10-25 10:54:13
tags: [rust]
---


## trait object
a reference to a trait type (or Box<Mytrait>) is called trait object

### two ways convert concrete type to trait object
1. assigning to variable
```rust
use std::io::Write;

let mut buffer: Vec<u8> = vec![];
let w: &mut dyn Write = &mut buffer;
```
2. pass a concrete type as a argument to a function
```rust
fn main() {
   let mut buffer: Vec<u8> = vec![];
   writer(&mut buffer);
}

fn writer(w: &mut dyn Write) {
    // ...
}
```
in both ways, buffer is converted to a trait object implements Write

in memory, a trait object (in the example, w) is a fat point consists two pointers
![trait_object_memory](/images/rust/memory/trait_object_memory.png)
the vtable is generated once at compile time and shared by all objects of the same type. the vtable contains pointers to the machine code of the functions that must be present for a type to be a "Writer"


## references
- https://www.youtube.com/watch?v=rDoqT-a6UFg