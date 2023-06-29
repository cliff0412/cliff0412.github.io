---
title: rust core: data structure
date: 2023-05-01 22:04:38
tags: [rust, rust-core]
---

## slice
- `len()`: Returns the number of elements in the slice
- `is_empty()`
- `first()` Returns the first element of the slice, or `None` if it is empty.
- `first_mut()` Returns a mutable **pointer** to the first element of the slice, or `None` if it is empty
- `split_first()` Returns the first and all the rest of the elements of the slice, or `None` if it is empty.
- `split_first_mut()` 
- `split_last()`
- `split_last_mut()`
- `last()`
- `last_mut()`
- `get<I>(index: I)` Returns a reference to an element or subslice depending on the type of index.
```rust
let v = [10, 40, 30];
assert_eq!(Some(&40), v.get(1));
assert_eq!(Some(&[10, 40][..]), v.get(0..2));
```
- `get_mut<I>(index: I)`
- `get_unchecked<I>(index: I)` Returns a reference to an element or subslice, without doing bounds checking
- `get_unchecked_mut<I>(index: I)`
- `as_ptr(&self) -> *const T` Returns a raw pointer to the slice's buffer
```rust
let x = &[1, 2, 4];
let x_ptr = x.as_ptr();
unsafe {
    for i in 0..x.len() {
        assert_eq!(x.get_unchecked(i), &*x_ptr.add(i));
    }
}
```
- `as_mut_ptr(&mut self) -> *mut T` 
```rust
let x = &mut [1, 2, 4];
let x_ptr = x.as_mut_ptr();
unsafe {
    for i in 0..x.len() {
        *x_ptr.add(i) += 2;
    }
}
assert_eq!(x, &[3, 4, 6]);
```
- `as_ptr_range(&self) -> Range<*const T>` Returns the two raw pointers spanning the slice.
```rust
pub const fn as_ptr_range(&self) -> Range<*const T> {
    let start = self.as_ptr();
    let end = unsafe { start.add(self.len()) };
    start..end
}
```
- `as_mut_ptr_range(&mut self) -> Range<*mut T>`
- `swap(&mut self, a: usize, b: usize)` Swaps two elements in the slice.
- `reverse(&mut self)` Reverses the order of elements in the slice, in place.
- `windows(&self, size: usize)` Returns an iterator over all contiguous windows of length `size`. The windows overlap. If the slice is shorter than `size`, the iterator returns no values.
```rust
let slice = ['r', 'u', 's', 't'];
let mut iter = slice.windows(2);
assert_eq!(iter.next().unwrap(), &['r', 'u']);
assert_eq!(iter.next().unwrap(), &['u', 's']);
assert_eq!(iter.next().unwrap(), &['s', 't']);
assert!(iter.next().is_none());
```
- `chunks(&self, chunk_size: usize)` Returns an iterator over `chunk_size` elements of the slice at a time
```rust
let slice = ['l', 'o', 'r', 'e', 'm'];
let mut iter = slice.chunks(2);
assert_eq!(iter.next().unwrap(), &['l', 'o']);
assert_eq!(iter.next().unwrap(), &['r', 'e']);
assert_eq!(iter.next().unwrap(), &['m']);
assert!(iter.next().is_none());
```
- `chunks_mut()`
- `chunks_exact(&self, chunk_size: usize)`
```rust
let slice = ['l', 'o', 'r', 'e', 'm'];
let mut iter = slice.chunks_exact(2);
assert_eq!(iter.next().unwrap(), &['l', 'o']);
assert_eq!(iter.next().unwrap(), &['r', 'e']);
assert!(iter.next().is_none());
assert_eq!(iter.remainder(), &['m']);
```
- `as_chunks_unchecked<const N: usize>(&self)` Splits the slice into a slice of `N`-element arrays, assuming that there's no remainder
- `as_chunks<const N: usize>(&self)` Splits the slice into a slice of `N`-element arrays, starting at the beginning of the slice, and a remainder slice with length strictly less than `N`
- `as_rchunks<const N: usize>(&self)` r means reverse
- `group_by<F>(&self, pred: F)` Returns an iterator over the slice producing non-overlapping runs of elements using the predicate to separate them. The predicate is called on two elements following themselves, it means the predicate is called on `slice[0]` and `slice[1]` then on `slice[1]` and `slice[2]` and so on
```rust
#![feature(slice_group_by)]
let slice = &[1, 1, 2, 3, 2, 3, 2, 3, 4];
let mut iter = slice.group_by(|a, b| a <= b);
assert_eq!(iter.next(), Some(&[1, 1, 2, 3][..]));
assert_eq!(iter.next(), Some(&[2, 3][..]));
assert_eq!(iter.next(), Some(&[2, 3, 4][..]));
assert_eq!(iter.next(), None);
```
- `split_at(&self, mid: usize)` Divides one slice into two at an index.
- `split<F>(&self, pred: F)` Returns an iterator over subslices separated by elements that match `pred`. The matched element is not contained in the subslices.
- `splitn<F>(&self, n: usize, pred: F)` 
- `contains(&self, x: &T)` Returns `true` if the slice contains an element with the given value.
- `starts_with(&self, needle: &[T])` eturns `true` if `needle` is a prefix of the slice
```rust
let v = [10, 40, 30];
assert!(v.starts_with(&[10]));
assert!(v.starts_with(&[10, 40]));
assert!(!v.starts_with(&[50]));
```
- `ends_with(&self, needle: &[T])` 
- `strip_prefix` Returns a subslice with the prefix removed.
```rust
let v = &[10, 40, 30];
assert_eq!(v.strip_prefix(&[10]), Some(&[40, 30][..]));
assert_eq!(v.strip_prefix(&[50]), None);
let prefix : &str = "he";
assert_eq!(b"hello".strip_prefix(prefix.as_bytes()),
           Some(b"llo".as_ref()));
```
- `strip_suffix`
- `binary_search(&self, x: &T)`  Binary searches this slice for a given element.
- `sort_unstable(&mut self)` Sorts the slice, but might not preserve the order of equal elements.
- `rotate_left(&mut self, mid: usize)` Rotates the slice in-place such that the first `mid` elements of the slice move to the end while the last `self.len() - mid` elements move to the front.
- `fill(&mut self, value: T)` Fills `self` with elements by cloning `value`.
- `clone_from_slice(&mut self, src: &[T])` Copies the elements from `src` into `self`.
- `copy_from_slice(&mut self, src: &[T])` 
- `is_sorted(&self)` 
- `take<'a, R: OneSidedRange<usize>>(self: &mut &'a Self, range: R)` Removes the subslice corresponding to the given range
- `get_many_mut<const N: usize>` Returns mutable references to many indices at once.
```rust
#![feature(get_many_mut)]
let v = &mut [1, 2, 3];
if let Ok([a, b]) = v.get_many_mut([0, 2]) {
    *a = 413;
    *b = 612;
}
assert_eq!(v, &[413, 2, 612]);
```