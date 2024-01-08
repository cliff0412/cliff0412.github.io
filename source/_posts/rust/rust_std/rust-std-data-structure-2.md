---
title: rust std data structure (2D)
date: 2023-05-02 22:04:38
tags: [rust-std]
---

## collections
### BTreeMap
- `clear(&mut self)` Clears the map, removing all elements.
- `get(&self, key: &Q)` Returns a reference to the value corresponding to the key.
- `get_key_value(&self, k: &Q)`
- `first_key_value(&self)` eturns the first key-value pair in the map.
- `first_entry(&mut self)` Returns the first entry in the map for in-place manipulation
- `pop_first(&mut self)` 
- `last_key_value(&self)`
- `last_entry(&mut self)`
- `pop_last(&mut self)`
- `contains_key(&self, key: &Q)`
- `get_mut(&mut self, key: &Q)` Returns a mutable reference to the value corresponding to the key
- `insert(&mut self, key: K, value: V)`
- `try_insert(&mut self, key: K, value: V)` If the map already had this key present, nothing is updated, and an error containing the occupied entry and the value is returned.
- `remove(&mut self, key: &Q)`
- `remove_entry(&mut self, key: &Q)`
- `retain<F>(&mut self, mut f: F)` Retains only the elements specified by the predicate.
```rust
use std::collections::BTreeMap;
let mut map: BTreeMap<i32, i32> = (0..8).map(|x| (x, x*10)).collect();
// Keep only the elements with even-numbered keys.
map.retain(|&k, _| k % 2 == 0);
assert!(map.into_iter().eq(vec![(0, 0), (2, 20), (4, 40), (6, 60)]));
```
- `append(&mut self, other: &mut Self)` Moves all elements from `other` into `self`, leaving `other` empty.
- `range<T: ?Sized, R>(&self, range: R) -> Range<'_, K, V>` Constructs a double-ended iterator over a sub-range of elements in the map.
```rust
use std::collections::BTreeMap;
use std::ops::Bound::Included;
let mut map = BTreeMap::new();
map.insert(3, "a");
map.insert(5, "b");
map.insert(8, "c");
for (&key, &value) in map.range((Included(&4), Included(&8))) {
    println!("{key}: {value}");
}
assert_eq!(Some((&5, &"b")), map.range(4..).next());
```
- `range_mut<T: ?Sized, R>(&mut self, range: R) -> RangeMut<'_, K, V>` 
- `entry(&mut self, key: K)` Gets the given key's corresponding entry in the map for in-place manipulation.
```rust
use std::collections::BTreeMap;
let mut count: BTreeMap<&str, usize> = BTreeMap::new();
// count the number of occurrences of letters in the vec
for x in ["a", "b", "a", "c", "a", "b"] {
    count.entry(x).and_modify(|curr| *curr += 1).or_insert(1);
}
assert_eq!(count["a"], 3);
assert_eq!(count["b"], 2);
assert_eq!(count["c"], 1);
```
- `split_off<Q: ?Sized + Ord>(&mut self, key: &Q)` Splits the collection into two at the given key. Returns everything after the given key,
- `drain_filter<F>(&mut self, pred: F)` Creates an iterator that visits all elements (key-value pairs) in ascending key order and uses a closure to determine if an element should be removed. If the closure returns `true`, the element is removed from the map and yielded. If the closure returns `false`, or panics, the element remains in the map and will not be yielded
- `into_keys(self)` Creates a consuming iterator visiting all the keys, in sorted order. The map cannot be used after calling this
- `into_values(self)`
