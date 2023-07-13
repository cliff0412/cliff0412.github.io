---
title: rust concurrency
date: 2023-06-01 22:04:38
tags: [rust]
---

## Send and Sync
- A type is Send if it is safe to send it to another thread.
- A type is Sync if it is safe to share between threads (T is Sync if and only if &T is Send).
- raw pointers are neither Send nor Sync (because they have no safety guards).
- UnsafeCell isn't Sync (and therefore Cell and RefCell aren't).
- Rc isn't Send or Sync (because the refcount is shared and unsynchronized).

Types that aren't automatically derived can simply implement them if desired:
```rust
struct MyBox(*mut u8);

unsafe impl Send for MyBox {}
unsafe impl Sync for MyBox {}
```
one can also unimplement Send and Sync:
```rust
#![feature(negative_impls)]

// I have some magic semantics for some synchronization primitive!
struct SpecialThreadToken(u8);

impl !Send for SpecialThreadToken {}
impl !Sync for SpecialThreadToken {}
```

## reference
- [rustonomicon](https://doc.rust-lang.org/nomicon/send-and-sync.html)