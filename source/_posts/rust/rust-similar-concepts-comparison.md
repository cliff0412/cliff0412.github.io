---
title: rust similar concepts comparison
date: 2022-11-23 15:52:34
tags: [rust]
---

## ref vs &
`ref` annotates pattern bindings to make them borrow rather than move. It is **not** a part of the pattern as far as matching is concerned: it does not affect whether a value is matched, only how it is matched.
By default, match statements consume all they can, which can sometimes be a problem, when you don't really need the value to be moved and owned:
```rust
let maybe_name = Some(String::from("Alice"));
// Using `ref`, the value is borrowed, not moved ...
match maybe_name {
    Some(ref n) => println!("Hello, {n}"),
    _ => println!("Hello, world"),
}
// ... so it's available here!
println!("Hello again, {}", maybe_name.unwrap_or("world".into()));
```

- `&` denotes that your pattern expects a reference to an object. Hence `&` is a part of said pattern: `&Foo` matches different objects than `Foo` does.
- `ref` indicates that you want a reference to an unpacked value. It is not matched against: `Foo(ref foo)` matches the same objects as `Foo(foo)`.

## Clone vs Copy
### Copy 的含义
`Copy` 的全名是 `std::marker::Copy`。`std::marker` 这个模块里面的所有的 trait 都是特殊的。目前稳定的有四个，它们是 `Copy`、`Send`、`Sized`、`Sync`。它们的特殊之处在于它们是跟编译器密切绑定的，impl 这些 trait 对编译器的行为有重要影响。这几个 trait 内部都没有方法，它们的唯一任务是，给类型打一个“标记”，表明它符合某种约定。

如果一个类型 impl 了 Copy trait，意味着任何时候，我们可以通过简单的内存拷贝(C语言的按位拷贝memcpy)实现该类型的复制，而不会产生任何问题。

一旦一个类型实现了 Copy trait，那么它在变量绑定、函数参数传递、函数返回值传递等场景下，它都是 copy 语义，而不再是默认的 move 语义。

### Copy 的实现条件
并不是所有的类型都可以实现Copy trait。Rust规定，对于自定义类型，只有所有的成员都实现了 Copy trait，这个类型才有资格实现 Copy trait。

常见的数字类型、bool类型、共享借用指针&，都是具有 Copy 属性的类型。而 Box、Vec、可写借用指针&mut 等类型都是不具备 Copy 属性的类型。

我们可以认为，Rust中只有 POD(C++语言中的Plain Old Data) 类型才有资格实现Copy trait。在Rust中，如果一个类型只包含POD数据类型的成员，没有指针类型的成员，并且没有自定义析构函数（实现Drop trait），那它就是POD类型。比如整数、浮点数、只包含POD类型的数组等。而Box、 String、 Vec等，不能按 bit 位拷贝的类型，都不属于POD类型。但是，反过来讲，并不是所有的POD类型都应该实现Copy trait。

### Clone 的含义
Clone 的全名是 std::clone::Clone。它的完整声明是这样的：
```rust
pub trait Clone : Sized {
    fn clone(&self) -> Self;
    fn clone_from(&mut self, source: &Self) {
        *self = source.clone()
    }
}
```
它有两个关联方法，其中 clone_from 是有默认实现的，它依赖于 clone 方法的实现。clone 方法没有默认实现，需要我们手动实现。

clone 方法一般用于“基于语义的复制”操作。所以，它做什么事情，跟具体类型的作用息息相关。比如对于 Box 类型，clone 就是执行的“深拷贝”，而对于 Rc 类型，clone 做的事情就是把引用计数值加1。

虽然说，Rust中 clone 方法一般是用来执行复制操作的，但是你如果在自定义的 clone 函数中做点什么别的工作编译器也没法禁止，你可以根据情况在 clone 函数中编写任意的逻辑。但是有一条规则需要注意：对于实现了 Copy 的类型，它的 clone 方法应该跟 Copy 语义相容，等同于按位拷贝。

### 自动 derive
绝大多数情况下，实现 Copy Clone 这样的 trait 都是一个重复而无聊的工作。因此，Rust提供了一个 attribute，让我们可以利用编译器自动生成这部分代码。示例如下：

```rust
#[derive(Copy, Clone)]
struct MyStruct(i32);
```
这里的 derive 会让编译器帮我们自动生成 impl Copy 和 impl Clone 这样的代码。自动生成的 clone 方法，就是依次调用每个成员的 clone 方法。

通过 derive 方式自动实现 Copy 和手工实现 Copy 有一丁点的微小区别。当类型具有泛型参数的时候，比如 struct MyStruct<T>{}，通过 derive 自动生成的代码会自动添加一个 T: Copy 的约束。

目前，只有一部分固定的特殊 trait 可以通过 derive 来自动实现。将来 Rust 会允许自定义的 derive 行为，让我们自己的 trait 也可以通过 derive 的方式自动实现。

## Cell vs RefCell
- Cell 是操作T(values), RefCell操作&T(references). Cell<T> get的时候要求T impl Copy。比如String类型没有实现Copy trait, 那么Cell::new(String::from("Hello")).get()会报错
- Cell 在编译器检查，运行时不会panic；RefCell在运行时检查，使用不当会发生panic
- 一般来说，Cell内部实现会发生内存的分配，性能较之RefCell有点大

## AsRef vs Borrow
[WIP]
