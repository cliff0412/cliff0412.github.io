---
title: rust project management
date: 2022-11-06 15:33:55
tags: [rust]
---

## basic concepts
- **Packages**: A Cargo feature that lets you build, test, and share crates
- **Crates**: A tree of modules that produces a library or executable
- **Modules and use**: Let you control the organization, scope, and privacy of paths
- **Paths**: A way of naming an item, such as a struct, function, or module

### package
1. one package can only has one library Crate. default is src/lib.rs
2. one package can have multiple binary Crates (under src/bin). default src/main.rs
3. one package has at least one crate，no matter lib or bin。
4. one package could simultaneously have src/main.rs and src/lib.rs (crate name same to package name)
```
cargo new my-project --lib  ## create a library project
```
### crate
- binary or library
- The crate root is a source file that the Rust compiler starts from and makes up the root module of your crate

### module
- keyword `mod` 
- module could be nested。
- module includes(struct、enum、const、trait、func, etc)

### path
- absolute path: use crate name or `crate`
- relative path:，use self, super etc
```rust
fn serve_order() {}
mod back_of_house {
    fn fix_incorrect_order() {
        cook_order();
        super::serve_order();
    }
    fn cook_order() {}
}
```
```rust
mod front_of_house {
    pub mod hosting {
        pub fn add_to_waitlist() {}
    }
}
pub fn eat_at_restaurant() {
    // Absolute path
    crate::front_of_house::hosting::add_to_waitlist();
    // Relative path
    front_of_house::hosting::add_to_waitlist();
}
```

### Bringing Paths into Scope with the use Keyword
```rust
use std::io;
use std::io::Write;
use std::io:: { self, Write} ;
use std::{cmp::Ordering, io};
use std::fmt::Result;
use std::io::Result as IoResult;
use std::collections::*;

pub use crate::front_of_house::hosting; // re-exporting names with pub use
```
### Separating Modules into Different Files
Filename: src/lib.rs
```rust
mod front_of_house;

pub use crate::front_of_house::hosting;

pub fn eat_at_restaurant() {
    hosting::add_to_waitlist();
    hosting::add_to_waitlist();
    hosting::add_to_waitlist();
}
```
Filename: src/front_of_house.rs
```rust
pub mod hosting {
    pub fn add_to_waitlist() {}
}
```

## profile
```
cargo build ## dev: [unoptimized + debuginfo]
cargo build --release ## [optimized]
```
- config
```
[profile.dev]
opt-level = 0

[profile.release]
opt-level = 3

# profile for the wasm example (from project ethers-rs)
[profile.release.package.ethers-wasm]
opt-level = "s"  # Tell `rustc` to optimize for small code size.
```
