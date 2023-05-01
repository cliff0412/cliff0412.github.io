---
title: rust ownership
date: 2023-10-11 17:09:28
tags: [rust]
---

## ownership rule
- Each value in Rust has an owner.
- There can only be one owner at a time.
- When the owner goes out of scope, the value will be dropped.

## variable scope
```rust
fn main() {
    {                      // s is not valid here, it’s not yet declared
        let s = "hello";   // s is valid from this point forward
        // do stuff with s
    }                      // this scope is now over, and s is no longer valid
}
```

## Move
### stack-only data: Copy trait
such as primitive type
```rust
fn main() {
    let x = 5;
    let y = x;
}
```
bind the value 5 to x; then make a copy of the value in x and bind it to y.

### for heap variable
```rust
fn main() {
    let s1 = String::from("hello");
    let s2 = s1;
}
```
![move-string](/images/rust/ownership/move-string.png)
ptr, len, capacity is stored in stack, while string value is stored in heap \
When we assign s1 to s2, the String data is copied, meaning we copy the pointer, the length, and the capacity that are on the stack. We do not copy the data on the heap
![move-string-2](/images/rust/ownership/move-string-2.png)
similar to shallow copy

## Clone
```rust
fn main() {
    let s1 = String::from("hello");
    let s2 = s1.clone();

    println!("s1 = {}, s2 = {}", s1, s2);
}
```
If we do want to deeply copy the heap data of the String, not just the stack data, we can use a common method called clone.

### ownership and function
- Passing a value to a function will result in a move or copy of ownership
- difference between "stack" and "heap" variables: stack variables will be copied, and heap variables will be moved. When a variable containing heap data leaves the scope, its value will be cleared by the drop function, unless the ownership of the data is moved to another variable
```rust
fn main() {
    let s = String::from("hello");  // s comes into scope
    takes_ownership(s);             // s's value moves into the function...
                                    // ... and so is no longer valid here

    let x = 5;                      // x comes into scope

    makes_copy(x);                  // x would move into the function,
                                    // but i32 is Copy, so it's okay to still
                                    // use x afterward

} // Here, x goes out of scope, then s. But because s's value was moved, nothing
  // special happens.

fn takes_ownership(some_string: String) { // some_string comes into scope
    println!("{}", some_string);
} // Here, some_string goes out of scope and `drop` is called. The backing
  // memory is freed.

fn makes_copy(some_integer: i32) { // some_integer comes into scope
    println!("{}", some_integer);
} // Here, some_integer goes out of scope. Nothing special happens.

```

### return values and scope
```rust
fn main() {
    let s1 = gives_ownership();         // gives_ownership moves its return
                                        // value into s1

    let s2 = String::from("hello");     // s2 comes into scope

    let s3 = takes_and_gives_back(s2);  // s2 is moved into
                                        // takes_and_gives_back, which also
                                        // moves its return value into s3
} // Here, s3 goes out of scope and is dropped. s2 was moved, so nothing
  // happens. s1 goes out of scope and is dropped.

fn gives_ownership() -> String {             // gives_ownership will move its
                                             // return value into the function
                                             // that calls it

    let some_string = String::from("yours"); // some_string comes into scope

    some_string                              // some_string is returned and
                                             // moves out to the calling
                                             // function
}

// This function takes a String and returns one
fn takes_and_gives_back(a_string: String) -> String { // a_string comes into
                                                      // scope

    a_string  // a_string is returned and moves out to the calling function
}
```
> What if we want to let a function use a value but not take ownership?  
> that's reference
 

## reference & borrow
- & means reference (borrow but not own)， default immutable
- &mut a mutable reference， only one mutable reference allowed in same scope (avoid data racing)
- Multiple mutable references can be created non-simultaneously by creating a new scope
- **Cannot have mutable and immutable references at the same time**
```rust
fn main() {
    let mut s = String::from("hello");
    {
        let s1 = &mut s;
    } // r1 goes out of scope here, so we can make a new reference with no problems.
    let s2 = &mut s;
}

fn main() {
    let mut s = String::from("hello");

    let r1 = &s; // no problem
    let r2 = &s; // no problem
    println!("{} and {}", r1, r2);
    // variables r1 and r2 will not be used after this point

    let r3 = &mut s; // no problem
    println!("{}", r3);

    println!{"{}",r1} // got problem with above mutable borrow
}
```

### reference as function arguments
```rust
fn main() {
    let s1 = String::from("hello");

    let len = calculate_length(&s1);

    println!("The length of '{}' is {}.", s1, len);
}

fn calculate_length(s: &String) -> usize { // s is a reference to a String
    s.len() 
}  // Here, s goes out of scope. But because it does not have ownership of what
   // it refers to, nothing happens.
```
we pass &s1 into calculate_length and, in its definition, we take &String rather than String. These ampersands represent references, and they allow you to refer to some value without taking ownership of it. Because it does not own it, the value it points to will not be dropped when the reference stops being used. \
 When functions have references as parameters instead of the actual values, we won't need to return the values in order to give back ownership, because we never had ownership. \
 We call the action of creating a reference borrowing. 

### mutable references
```rust
fn main() {
    let mut s = String::from("hello");

    change(&mut s);
}

fn change(some_string: &mut String) {
    some_string.push_str(", world");
}
```

### dangling references
- A pointer refers to an address in memory, but the memory may have been freed and allocated for use by someone else
- rust，The compiler can guarantee that there will never be dangling references
```rust
fn main() {
    let r = dangle();
}
fn dangle() -> &string {  // dangle returns a reference to a String
    let s = String::from("hello");  // s is a new String
    &s // we return a reference to the String, s
} // Here, s goes out of scope, and is dropped. Its memory goes away.
// Danger
```
The solution here is to return the String directly:
```rust
fn main() {
    let string = no_dangle();
}

fn no_dangle() -> String {
    let s = String::from("hello");
    s
}
```
This works without any problems. Ownership is moved out, and nothing is deallocated.


## slice
- Slices let you reference a contiguous sequence of elements in a collection rather than the whole collection. A slice is a kind of reference, so it does not have ownership.

### string slice
```rust
fn main() {
    let mut s = String::from("Hello world");

    let hello = &s[0..5]; 
    let world = &s[6..11];
}
```
Rather than a reference to the entire String, hello is a reference to a portion of the String, \
With Rust's `..` range syntax, if you want to start at index zero, you can drop the value before the two periods \
By the same token, if your slice includes the last byte of the String, you can drop the trailing number. 
> Note: String slice range indices must occur at **valid UTF-8 character boundaries**. If you attempt to create a string slice in the middle of a multibyte character, your program will exit with an error.

```rust
fn first_word(s :&String) -> &str {
    let bytes = s.as_bytes();
    for(i, &item) in bytes.iter().enumerate() {
        if item == b' ' {
            return &s[..i];
        }
    }
    &s[..]
}
```

### String Literals Are Slices
```rust
fn main() {
let s = "Hello, world!";
}
```
The type of s here is &str: it's a slice pointing to that specific point of the binary. 

### String Slices as Parameters
- Pass &str as a parameter, you can receive parameters of type &String and &str at the same time
```rust
fn first_word(s: &String) -> &str {
```
equivalent to
```rust
fn first_word(s: &str) -> &str
```

### other slices
array slice
```rust
fn main() {
  let a = [1, 2, 3, 4, 5];
  let slice = &a[1..3];
  assert_eq!(slice, &[2, 3]);
}
```