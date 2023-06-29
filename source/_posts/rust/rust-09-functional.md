---
title: rust functional programming
date: 2023-04-11 22:04:38
tags: [rust]
---

## iterator
- `iter()` Returns an iterator over the **slice**
- `into_iter()` Creates a consuming iterator, that is, one that moves each value out of the vector
- `iter_mut()` Returns an iterator that allows modifying each value.

## flat_map
```rust
/// Creates an iterator that works like map, but flattens nested structure.
///
/// The [`map`] adapter is very useful, but only when the closure
/// argument produces values. If it produces an iterator instead, there's
/// an extra layer of indirection. `flat_map()` will remove this extra layer
/// on its own.
```
### Examples
```rust
let words = ["alpha", "beta", "gamma"];
// chars() returns an iterator
let merged: String = words.iter()
                          .flat_map(|s| s.chars())
                          .collect();
assert_eq!(merged, "alphabetagamma");
```
