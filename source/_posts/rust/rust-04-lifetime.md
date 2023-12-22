---
title: rust lifetime
date: 2022-10-18 21:33:26
tags: [rust]
---

## lifetime
- Every reference in Rust has its own lifecycle
- most of the time, Rust's lifetime is implicit and can be inferred
- There are two types of life cycle: input life cycle and output life cycle
- 'static is a special life cycle annotation
### Example of lifetime out of scope
```rust
fn main() {
    let mut x;
    {
        let y = String::from("hello");
        // x = y; // this is allowed
        x = &y; // not allowed. borrowed value (y) does not live long enough
    }
    println!("Str:{}", x);
}
```

### lifetime checker
Rust compiler's borrow checker to determine whether a borrow is legal
```rust
// If it returns a reference value, no matter how simple your function is written, it will always report an error `missing lifetime specifier.`
fn longest(x:&str, y:&str) -> &str { /// this function's return type contains a borrowed value, but the signature does not say whether it is borrowed from `x` or `y`
    if x.len() > y.len() {
        x
    }else{
        y
    }
}
```
let's find out why it is such case
```rust
fn main() {
    // variable to hold the result value
    let long_str; 

    let x = "abc".to_string();
    {
        let y = "bbccd".to_string();
        long_str = longest(x.as_str(), y.as_str());
    }
    // if x.len() > y.len() then it is OK，the long_str variable will hole x; if not, long_str supposed tohold y, however, y has a smaller scope than x, long_str will hold to a dropped value
    println!("Longest str: {}", long_str);
}

```
Hence, we need lifetime annotation `'`
```rust
fn longest<'a>(x:&'a str, y:&'a str) -> &'a str {
    if x.len() > y.len() {
        x
    }else{
        y
    }
}
```

### deeper understanding
- When returning a reference value from a function, the lifetime of the return type needs to match the lifetime of one of the parameters

### Struct lifetime annotation
```rust
fn main() {
    let info = String::from("File not found.");
    // 存放结果值的变量
    let exc = ImportantExcepiton {
        part: info.as_str()
    };

    println!("{:?}", exc);
}
#[derive(Debug)]
struct ImportantExcepiton<'a> {
    part: &'a str,
}
```
- lifetime of the field `part` must be longer than struct

### Lifetime Elision
In order to make common patterns more ergonomic, Rust allows lifetimes to be elided in function signatures.
Elision rules are as follows:
- Each elided lifetime in input position becomes a distinct lifetime parameter.
- If there is exactly one input lifetime position (elided or not), that lifetime is assigned to all elided output lifetimes.
- If there are multiple input lifetime positions, but one of them is &self or &mut self, the lifetime of self is assigned to all elided output lifetimes.
- Otherwise, it is an error to elide an output lifetime.

### struct lifetime annotation
```rust

fn main() {
    let info = String::from("File not found.");
    let exc = ImportantExcepiton {
        part: info.as_str()
    };

    println!("{:?}", exc);
}
#[derive(Debug)]
struct ImportantExcepiton <'a>{
    part: &'a str,
}

// the first 'a is decraration, the second is usage
impl<'a> ImportantExcepiton <'a> {
    // in return value, 'a is omitted according to Lifetime Elision rule
    fn callname(&self ) -> &str{
        self.part
    }
}
```

### 'static
'static is a special lifetime that takes up the duration of the entire program, for example all string literals have a 'static lifetime