---
title: rust reflect and macro
date: 2022-12-21 10:24:21
tags: [rust]
---

## reflect
### trait object
Rust provides dynamic dispatch through a feature called `trait objects`. Trait objects, like &Foo or Box<Foo>, are normal values that store a value of any type that implements the given trait, where the precise type can only be known at **runtime**. more details can be found on [references 1]

### any
This module (std::any) contains the `Any` trait, which enables dynamic typing of any <code>'static</code> type through runtime reflection. It also contains the `Provider` trait and accompanying API, which enable trait objects to provide data based on typed requests, an alternate form of runtime reflection.
Any itself can be used to get a TypeId

```rust
use std::fmt::Debug;
use std::any::Any;

fn log<T: Any + Debug>(value: &Any) {
    let value_any = value as &dyn Any;  // &dyn Any (a borrowed trait object), Note that &dyn Any is limited to testing whether a value is of a specified concrete type, and cannot be used to test whether a type implements a trait.

    match value_any.downcast_ref::<String>() {
        Some(val_str) -> {
            // do with string
        },
        None => {
            // 
        }
    }
}
```

### porpular crates using Any
- [oso](https://docs.osohq.com/)
The Oso Library is a batteries-included framework for building authorization in your application
- [bevy](https://bevyengine.org/)
A refreshingly simple data-driven game engine built in Rust

## macro
### rust compile process
![rust compile process](/images/rust/macros/16.compile_process.png)

### front end: rustc
1. lexical analysis: Code Text -> TokenStream
2. syntax analysis: TokenStream -> AST (abstract syntax tree)
3. semantic analyzer: 
            AST -> HIR (High-Level Intermediate Representation) -> Type HIR (static type analysis, syntactic desugar, e.g `for` changed to `loop`) -> MIR: (Mid-Level Intermediate Representation, scope, reference & borrow check)

### back end: LLVM
LLVM IR -> machine code


### macros in compiling
- declarative macros: TokenStream - expand -> TokenStream
- procedule macros: self defined AST with the help or third party crate such as syn, quote

## declarative macro: macro_rules!
Declarative macros allow us to write match-like code. The match expression is a control structure that receives an expression and then matches the result of the expression with multiple patterns. Once a pattern is matched, the code associated with the pattern will be executed
```rust
#![allow(unused)]
fn main() {
    match target {
        match_pattern_1 => expr_1,
        match_pattern_2 => {
            statement1;
            statement2;
            expr_2
        },
        _ => expr_3
    }
}
```

### example 1, simplified `vec!`
below example use macro_rules to implement a simplified version of vec!
```rust
#[macro_export]
macro_rules! vec {
    ( $( $x:expr ),* ) => {
        {
            let mut temp_vec = Vec::new();
            $(
                temp_vec.push($x);
            )*
            temp_vec
        }
    };
}

#![allow(unused)]
fn main() {
    let v: Vec<u32> = vec![1, 2, 3];
}
```

### example 2, unless
```rust
macro_rules! unless {
    ( ($arg:expr) => $branch:tt ) => ( if !$arg {$branch};);
}

fn cmp(a:i32, b:i32) {
    unless!{
        (a>b) => {println!("{} < {}", a,b);}
    }
}
fn main() {
    cmp(1,2);  /// print "1<2" as the condition is true !(a>b)
    cmp(3,2);  /// print nothing
}
```
### example 3, HashMap
```rust
macro_rules! hashmap {
    // match for "a" => 1, "b" => 2,
    ( $($key:expr => $value:expr,)* ) =>
        { hashmap!($($key => $value),*) }; // recuisive
    // match for "a" => 1, "b" => 2
    ( $($key:expr => $value:expr),* ) => { 
        {
            let mut _map = ::std::collections::HashMap::new();
            $(
                _map.insert($key, $value);
            )*
            _map
        }
       
    };
}

macro_rules! hashmap_equivalent {
    ( $($key:expr => $value:expr),* $(,)*) => { 
        {
            let mut _map = ::std::collections::HashMap::new();
            $(
                _map.insert($key, $value);
            )*
            _map
        }
       
    };
}
fn main() {
    let map = hashmap!{
        "a" => 1,
        "b" => 2,  // with or without ,
    };
    let map_2 = hashmap_equivalent!{
        "a" => 1, 
        "b" => 2,  // with or without ,
    };
}
```

### metavariables
- item: an Item
- stmt: a Statement without the trailing semicolon (except for item statements that require semicolons)
- expr: an Expression
- ty: a Type
- ident: an IDENTIFIER_OR_KEYWORD or RAW_IDENTIFIER
- path: a TypePath style path
- tt: a TokenTree (a single token or tokens in matching delimiters (), [], or {})
- meta: an Attr, the contents of an attribute
- lifetime: a LIFETIME_TOKEN
- vis: a possibly empty Visibility qualifier
- literal: matches LiteralExpression
details to be found [here](https://doc.rust-lang.org/reference/macros-by-example.html)

## procedures macro

## references
1. [rust trait object](https://web.mit.edu/rust-lang_v1.25/arch/amd64_ubuntu1404/share/doc/rust/html/book/first-edition/trait-objects.html)