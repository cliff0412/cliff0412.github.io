---
title: rust std smart pointer & interior mutability
date: 2023-06-03 22:04:38
tags: [rust-std]
---
# smart pointer
## [Rc](https://doc.rust-lang.org/std/rc/struct.Rc.html)
A single-threaded reference-counting pointer. The inherent methods of Rc are all associated functions, which means that you have to call them as e.g., Rc::get_mut(&mut value) instead of value.get_mut(). This avoids conflicts with methods of the inner type T.



# internal mutibility
## [Cell](https://doc.rust-lang.org/stable/std/cell/struct.Cell.html)
`Cell<T>` enables mutation inside an immutable value. In other words, it enables `interior mutability`. It never gives out mutable pointer to the inner value; A Cell can be shared by multiple references.
### methods
- `fn get(&self) -> T`
- `fn set(&self, val: T)`
- `fn swap(&self, other: &Cell<T>)`
- `fn replace(&self, val: T) -> T`
Replaces the contained value with val, and returns the old contained value
- `fn into_inner(self) -> T`
- `const fn as_ptr(&self) -> *mut T`
- `fn get_mut(&mut self) -> &mut T`
- `fn from_mut(t: &mut T) -> &Cell<T>`

### traits
```rust
impl<T> !Sync for Cell<T>  // cannot be used in other threads
```

## [OnceCell](https://doc.rust-lang.org/stable/std/cell/struct.OnceCell.html)
A cell which can be written to only once.
### special methods
- `fn get_or_init<F>(&self, f: F) -> &T`

## [LazyCell](https://doc.rust-lang.org/stable/std/cell/struct.LazyCell.html)
A value which is initialized on the first access

## [UnsafeCell](https://doc.rust-lang.org/stable/std/cell/struct.UnsafeCell.html#)
`UnsafeCell<T>` opts-out of the immutability guarantee for `&T`: a shared reference `&UnsafeCell<T>` may point to data that is being mutated. This is called `interior mutability`.
All other types that allow internal mutability, such as `Cell<T>` and `RefCell<T>`, internally use `UnsafeCell` to wrap their data.
Note that only the immutability guarantee for shared references is affected by `UnsafeCell`. The uniqueness guarantee for mutable references is unaffected (only one mutable reference at one time, or multiple immutable reference). 

### methods
- `pub const fn get(&self) -> *mut T`
Gets a mutable pointer to the wrapped value.
- `pub fn get_mut(&mut self) -> &mut T`
Returns a mutable reference to the underlying data
- `pub const fn raw_get(this: *const UnsafeCell<T>) -> *mut T`
Gets a mutable pointer to the wrapped value. The difference from get is that this function accepts a raw pointer, which is useful to avoid the creation of temporary references. e.g. Gradual initialization of an UnsafeCell requires raw_get, as calling get would require creating a reference to uninitialized data:
```rust
use std::cell::UnsafeCell;
use std::mem::MaybeUninit;

let m = MaybeUninit::<UnsafeCell<i32>>::uninit();
unsafe { UnsafeCell::raw_get(m.as_ptr()).write(5); }
let uc = unsafe { m.assume_init() };

assert_eq!(uc.into_inner(), 5);
```
- `fn into_inner(self) -> T`
Unwraps the value, consuming the cell.

## [SyncUnsafeCell](https://doc.rust-lang.org/stable/std/cell/struct.SyncUnsafeCell.html)
This is just an `UnsafeCell`, except it implements `Sync` if T implements Sync.

## [std::cell::RefCell](https://doc.rust-lang.org/stable/std/cell/struct.RefCell.html)
A mutable memory location with **dynamically** checked borrow rules
- `fn borrow(&self) -> Ref<'_, T>`
- `fn borrow_mut(&self) -> RefMut<'_, T>`
- `fn as_ptr(&self) -> *mut T`
