---
title: go similar concepts comparison
date: 2023-03-05 10:44:50
tags: [golang]
---

## struct{} & struct{}{}
`struct` is a keyword in Go. It is used to define struct types, which is a sequence of named elements.

For example:
```go
type Person struct {
    Name string
    Age  int
}
```
The `struct{}` is a struct type with zero elements. It is often used when no information is to be stored. It has the benefit of being 0-sized, so usually no memory is required to store a value of type `struct{}`.

`struct{}{}` on the other hand is a [composite literal](https://go.dev/ref/spec#Composite_literals), it constructs a value of type `struct{}`. A composite literal constructs values for types such as `structs`, `arrays`, `maps` and `slices`. Its syntax is the type followed by the elements in braces. Since the "empty" struct (struct{}) has no fields, the elements list is also empty:

 struct{}  {}
|  ^     | ^
  type     empty element list
As an example let's create a "set" in Go. Go does not have a builtin set data structure, but it has a builtin map. We can use a map as a set, as a map can only have at most one entry with a given key. And since we want to only store keys (elements) in the map, we may choose the map value type to be struct{}.

A map with string elements:
```go
var set map[string]struct{}
// Initialize the set
set = make(map[string]struct{})

// Add some values to the set:
set["red"] = struct{}{}
set["blue"] = struct{}{}

// Check if a value is in the map:
_, ok := set["red"]
fmt.Println("Is red in the map?", ok)
_, ok = set["green"]
fmt.Println("Is green in the map?", ok)
```