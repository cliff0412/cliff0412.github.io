---
title: rust basics
date: 2022-10-04 15:55:04
tags: [rust]
---

## frequently used cmd
```
rustc [filename].rs
cargo new [project_name]
cargo build [--release]
cargo run [--release]
cargo check # check whether compile success, no executible output
```

## data type

### integer
- i8,i16,i32,i64,i128,isize,u8,u16,u32,u64,u128,usize，etc
- isize, usize indicates that the type is determined by the architecture of the computer. For example, on a 32 bit target, this is 4 bytes and on a 64 bit target, this is 8 bytes.
- 0x: hex，0o Octal，0b binary，starting with b: byte （u8 only）

| Number Literals      | Example |
| ----------- | ----------- |
| Decimal      | 98_222       |
| Hex   | 0xff        |
| Octal   | 0o77        |
| Binary   | 0b1111_0000        |
| Byte(u8 only)   | b'A'        |

### Tuple
- The length of Tuple is fixed, and the length cannot be changed once declared
```rust
fn main() {
    // tuple could be declared as mut
    let mut tuple_1 = ("Hello", 39, "Years");
    let tuple_2:(i32, &str ) = (1983, "since.");
    tuple_1.0 = "Hi";
    println!("{} {} {}", tuple_1.0, tuple_1.1, tuple_1.2);
    // destructure
    let (a,b) = tuple_2;
    println!("{} {}", a, b);
}
```

### array
- arrays in Rust have a fixed length.
- Vector is similar to an array, it is provided by the standard library, and its length can be changed

```rust
fn main() {

    let arr_test:[u8; 3] = [1,2,3];
    println!("Number is {},{},{}", arr_test[0],arr_test[1],arr_test[2]);

    let arr_test = ["I","love","you"];
    println!("You said : {} {} {}", arr_test[0],arr_test[1],arr_test[2]);

    let arr_test = [1;3]; 
    println!("Call Num : {}&{}&{}", arr_test[0],arr_test[1],arr_test[2]);
}
```



### String
- Basic data types are stored on the stack, but the String type is stored on the heap
```rust
let s = String::from("hello");
```
- push_str(): append a str slice a string
- push(): appends a single character to a String
```rust
fn main() { 
    let mut data = String::from("andy");
    data.push_str(" is stronger");
    data.push('!');
}
```
- <code>+</code> operator, chaining strings. the left side of the + operator is the ownership of the string, and the right side is the string slice
- String is actually a wrapper for Vec<u8>, so the length can be measured by the len() method, but note that Len() is not length of character, but byte len
- String iteration
```rust
fn main() { 
    let mut data = String::from("andy");
    data.push_str(" is stronger");
    data.push('!');

    for i in data.bytes() {
        ///
    }

    for i in data.chars() {
        ///
    }
}
```

### Vector
- Vector is like any other struct. When Vector leaves the scope, the variable value is cleaned up, and all its elements are also cleaned up.
```rust
fn main() {
    let vec: Vec<u16> = Vec::new();
    let vec2: Vec<i32> = vec![3,4，5] // create vector by macro
    for i in vec2 {
        println!("Vector value is : {}", i);
    }
}
```

### HashMap
- HashMap is not preloaded, so it needs to be included  `use std::collections::HashMap`
```rust
use std::collections::HashMap;
fn main() {
    let keys = vec!["andy".to_string(), "cliff".to_string()] ;
    let ages = vec![38, 26];
    let map :HashMap<_,_> = keys.iter().zip(ages.iter()).collect();
    println!("{:?}", map); /// print {"andy": 38, "cliff": 26}
}
```
#### HashMap ownership
- For types that implement the Copy trait (such as i32), the value will be copied into the HashMap
- For values with ownership, such as (String), the value will be moved and ownership will be given to HashMap
- If a reference to a value is inserted into the HashMap, the value itself does not move

#### HashMap iteration
```rust
use std::collections::HashMap;

fn main() { 
    let name = "andy".to_string();
    let age = 36;
    let mut map = HashMap::new();
    map.insert(name, age);
    map.insert(String::from("cliff"), 26);
    println!("{:?}", &map);
    for (k, v) in map {
        println!("{} age {}", k, v);
    } /// cliff age 26
      /// andy age 36
}
```
#### update
```rust
use std::collections::HashMap;

fn main() { 
    let name = "andy".to_string();
    let age = 36;
    let mut map = HashMap::new();
    map.insert(name, age);
    map.insert(String::from("cliff"), 26);

    let result = map.entry("bob".to_string());
    println!("{:?}", result); /// Entry(VacantEntry("bob"))

    let result = map.entry("andy".to_string());
    println!("{:?}", result); /// Entry(OccupiedEntry { key: "andy", value: 36, .. })

    map.entry("bob".to_string()).or_insert(28);
    map.entry("cliff".to_string()).or_insert(0);
}
```

## control flow
- if
```rust
fn main() {
    let condition = 1;
    let x = if condition == 1 { "A" } else { "B" };
    println!("Result x = {}" , x) ;
}
```
- loop
```rust
fn main() {
    let mut condition = 0;

    let result = 'outer: loop {  // 'outer is label
        'inner: loop {
            condition += 1;
            if 3 == condition {
                break 'outer 3 * condition; // break outer loop
            }
        }
    };
    println!("Loop result is : {}", result); /// Loop result is : 9
}

```
- rot
```rust
fn main() {
    let arr = [3,2,3];
    for num in arr.iter() {
        println!("For value is {}", num);
    }
}
```

## Range iterator
- Range
```rust
fn main() {
     for number in (1..=3) {
        println!("Number A is {}", number ); /// 1,2,3
    }
 
    for number in (1..=3).rev() { /// rev means reverse,
        println!("Number B is {}", number ); /// 3,2,1
    }
}

```

## struct
- If struct is declared mutable then all fields in the instance are mutable
### tuple struct
```rust
struct Color(i32,i32,i32);
let black = Color(0,0,0);
```
### Unit-Like struct
```rust
struct Man {};
```
### struct method
```rust

fn main() {
    let rec = Rectangle {
        width: 30,
        height: 50,
    };

    let result = rec.area(); 
    println!("rectangle：{:?}，area is：{}", rec, result);
}


#[derive(Debug)]
struct Rectangle {
    width: u32,
    height: u32,
}

impl Rectangle {
    fn area(&self) -> u32{
        self.width * self.height
    }
}

```
### associative func（similar to static method）
- You can define a function that does not take `self` as the first parameter in the impl block. This form is called an associated function, and the calling method is similar to `String::from()`
```rust
impl Rectangle {
    fn create_square(width: u32) -> Rectangle {
        Rectangle {
            width,
            height: width,
        }
    }
}
```
  
## enum
```rust
enum Ip {
    V4,
    V6,
}

enum IpAddr {
    V4(String),
    V6(String),
}
``` 

## match
- match must exhaust all possibilities
- If there are too many matchings, you can also use "_" for wildcarding, but note that "_" must be placed at the end
```rust
enum Color {
    Red,
    Yellow,
    Blue,
}
enum ColorWithVal {
    Red(u8,u8,u8),
    Yellow(u8,u8,u8),
    Blue(u8,u8,u8),
}
fn main(){
    let colour = Color::Blue;
    match colour {
        Color::Red => {
            println!("Red colour.");
        },
        _ => {
            println!("Other colour.");
        }
    }

    let colour = ColorWithVal::Red(222,111,22);
    match colour {
        ColorWithVal::Red(r,g,b) => {
            println!("Red colour. {},{},{}", r,g,b);
        },
        _ => {
            println!("Other colour.");
        }
    }
}
```

## if let
```rust
fn main(){
    let colour = Color::Red(Some(222),Some(222),Some(222));

    if let Color::Red(r,g,b) = colour {
        println!("Red colour. {:?},{:?},{:?}", r,g,b);
    } else {
        println!("Other colour.");
    }
}
```

## Result<T,E>
- Recoverable err via Result<T,E>, non-recoverable via panic!
- upon panic!, the program will expand an error message, unwind, clean up the call stack (Stack) and finally exit the program
- You can set panic = 'abort' in Cargo.toml to terminate the cleaning of the call stack
```rust
[profile.release]
panic='abort'
```
- RUST_BACKTRACE = 1 prints detailed error messages in the stack
```rust
use std::fs::File;
fn main() { 
    let fp = File::open("hello.txt");
    let file = match fp {
        Ok(file)=> {
            file
        },
        Err(error) => panic!("file not found {:?} ", error),
    };
}
```

```rust
use std::{fs::File, io::ErrorKind};
fn main() { 
    let fp = File::open("hello.txt");
    let file = match fp {
        Ok(file)=> {
            file
        },
        Err(error) => {
            match error.kind() {
                ErrorKind::NotFound => {
                    match File::create("hello.txt") {
                        Ok(file) => {
                            file
                        },
                        Err(err) => {
                            panic!("file create error:{:?}", &err);
                        },
                    }
                },
                oe => panic!("other error {:?}", oe),
            }
        } ,
    };
}
```
```rust
use std::{fs::File, io::ErrorKind};
fn main() { 
    let file = File::open("hello.txt").unwrap_or_else(|err| {
        if err.kind() == ErrorKind::NotFound {
            File::create("hello.txt").unwrap_or_else(|err|{
                panic!("error：{:?}", err);
            })
        }else{
            panic!("other error：{:?}", err);
        }
    });
}
```
### unwrap && expect
- If do not want to deal with Err, can use unwarp() method. If result is Ok(val), return val. If Err, then call the panic! macro.
- expect can specify what the error message is, which is easier to debug

### The question mark operator, ?
When writing code that calls many functions that return the Result type, the error handling can be tedious. The question mark operator, ?, hides some of the boilerplate of propagating errors up the call stack.
```rust
let mut file = File::create("my_best_friends.txt")?;
```

## generic
```rust
#[derive(Debug)]
struct Point<T, U>  {
   x : T,
   y : U,
}
impl <T, U> Point<T, U> {
    fn mixup<V, W>(self, other: Point<V, W>) -> Point<T, W> {
        Point{x: self.x , y: other.y, }
    }
}
```

## trait
### definition
```rust
pub trait Summary {
    fn summarize(&self) -> String {
         "... more".to_string() /// default 
    }
}
pub struct Tweet {
    user_name :String,
    replay_count :u32,
    like_count :u32,
}
impl Tweet {
    fn like(&mut self) {
        self.like_count += 1;
    }
}

impl Summary for Tweet {
    fn summarize(&self) -> String {
        format!("{} like count :{} , replay count :{}", &self.user_name, &self.replay_count, &self.like_count)
    }
}
```

### trait as arguments
```rust
fn notify_msg <T:Summary> (info: T) {
    println!("summary : {}", info.summarize() );
}
fn notify_msg (info: impl Summary + Display) {
    println!("summary : {}", info.summarize() );
}
fn notify_msg <T> (info: T) 
where 
    T: Summary + Display,
{
    println!("summary : {}", info.summarize() );
    println!("display implement info : {}", info);
}
```
### trait as return
- impl Trait can only return the same type, if it returns a different type, even if the Trait is implemented, an error will be reported

## references
- [the rust programming language](https://doc.rust-lang.org/book/)
- [mooc course](https://time.geekbang.org/course/intro/100060601?tab=catalog)
- [bilibili tutorial](https://www.bilibili.com/video/BV1hp4y1k7SV?p=50&spm_id_from=pageDriver)
- [jianshu notes](https://www.jianshu.com/p/30d917790298)