---
title: go reflect
date: 2023-03-02 10:44:50
tags: [golang]
---

## introduction
Reflection is the ability of a program to examine its own structure, particularly through types. 

## type and interfaces
Go is statically typed. Every variable has a static type, Exactly one type known and fixed at compile time. If we declare
```go
type MyInt int

var i int
var j MyInt
```
**The variables i and j have distinct static types and, although they have the same underlying type, they cannot be assigned to one another without a conversion.**

One important category of type is interface types, which represent fixed sets of methods. An interface variable can store any concrete (non-interface) value as long as that value implements the interface’s methods. An extremely important example of an interface type is the empty interface:
```go
interface{}
```
or its equivalent alias,
```go
any
```
It represents the empty set of methods and is satisfied by any value at all, since every value has zero or more methods.
a variable of interface type always has the same static type, and even though at run time the value stored in the interface variable may change type, that value will always satisfy the interface.

## the representation of an interface
A variable of interface type stores a pair: the concrete value assigned to the variable, and that value’s type descriptor.
For instance, after
```golang
var r io.Reader
tty, err := os.OpenFile("/dev/tty", os.O_RDWR, 0)
if err != nil {
    return nil, err
}
r = tty
```
r contains, schematically, the (value, type) pair, (tty, *os.File). Notice that the type *os.File implements methods other than Read; even though the interface value provides access only to the Read method, the value inside carries all the type information about that value. That’s why we can do things like this:
```go
var w io.Writer
w = r.(io.Writer)
```
The expression in this assignment is a type assertion; what it asserts is that the item inside r also implements io.Writer, and so we can assign it to w.  After the assignment, w will contain the pair (tty, *os.File). That’s the same pair as was held in r. 
One important detail is that the pair inside an interface variable always has the form (value, concrete type) and cannot have the form (value, interface type). Interfaces do not hold interface values.

## the first law of reflection
1.  Reflection goes from interface value to reflection object
At the basic level, reflection is just a mechanism to examine the type and value pair stored inside an interface variable. `reflect.TypeOf` and `reflect.ValueOf`, retrieve `reflect.Type` and `reflect.Value` pieces out of an interface value.
```go
var x float64 = 3.4
fmt.Println("type:", reflect.TypeOf(x))
```
```
type: float64
```
```go
var x float64 = 3.4
v := reflect.ValueOf(x)
fmt.Println("type:", v.Type())
fmt.Println("kind is float64:", v.Kind() == reflect.Float64)
fmt.Println("value:", v.Float())
```
```
type: float64
kind is float64: true
value: 3.4
```
There are also methods like SetInt and SetFloat. **to keep the API simple, the “getter” and “setter” methods of Value operate on the largest type that can hold the value**: int64 for all the signed integers, for instance. 
```go
var x uint8 = 'x'
v := reflect.ValueOf(x)
fmt.Println("type:", v.Type())                            // uint8.
fmt.Println("kind is uint8: ", v.Kind() == reflect.Uint8) // true.
x = uint8(v.Uint())                                       // v.Uint returns a uint64.
```

2. Reflection goes from reflection object to interface value.
Given a reflect.Value we can recover an interface value using the Interface method;
```go
// Interface returns v's current value as an interface{}.
// It is equivalent to:
//
//	var i interface{} = (v's underlying value)
func (v Value) Interface() interface{}
```
```go
y := v.Interface().(float64) // y will have type float64.
fmt.Println(y)
```

3. To modify a reflection object, the value must be settable.
The CanSet method of Value reports the settability of a Value; in our case,
```go
var x float64 = 3.4
v := reflect.ValueOf(x)
fmt.Println("settability of v:", v.CanSet())
```
```
settability of v: false
```
we pass a copy of x to reflect.ValueOf, so the interface value created as the argument to reflect.ValueOf is a copy of x, not x itself. Thus, if the statement `v.SetFloat(7.1)` were allowed to succeed, it would not update x, even though v looks like it was created from x. Instead, it would update the copy of x stored inside the reflection value and x itself would be unaffected. That would be confusing and useless, so it is illegal, and settability is the property used to avoid this issue. If we want to modify x by reflection, we must give the reflection library a pointer to the value we want to modify.
Let’s do that. 
```go
var x float64 = 3.4
p := reflect.ValueOf(&x) // Note: take the address of x.
fmt.Println("type of p:", p.Type())
fmt.Println("settability of p:", p.CanSet())
```
The reflection object p isn’t settable, but it’s not p we want to set, it’s (in effect) *p. To get to what p points to, we call the Elem method of Value, which indirects through the pointer, and save the result in a reflection Value called v:
```go
v := p.Elem()
fmt.Println("settability of v:", v.CanSet())
```
```
settability of v: true
```

## structs

```go
type T struct {
    A int
    B string
}
t := T{23, "skidoo"}
s := reflect.ValueOf(&t).Elem()
typeOfT := s.Type()
for i := 0; i < s.NumField(); i++ {
    f := s.Field(i)
    fmt.Printf("%d: %s %s = %v\n", i,
        typeOfT.Field(i).Name, f.Type(), f.Interface())
}
```
```
0: A int = 23
1: B string = skidoo
```
There’s one more point about settability introduced in passing here: the field names of T are upper case (exported) because only exported fields of a struct are settable.
Because s contains a settable reflection object, we can modify the fields of the structure.
```
s.Field(0).SetInt(77)
s.Field(1).SetString("Sunset Strip")
fmt.Println("t is now", t)
```
If we modified the program so that s was created from t, not &t, the calls to SetInt and SetString would fail as the fields of t would not be settable.

## references
- [official blog](https://go.dev/blog/laws-of-reflection)
- [go data structure: interface](https://research.swtch.com/interfaces)