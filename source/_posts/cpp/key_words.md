---
title: cpp key workds
date: 2023-11-21 11:35:20
tags: [cpp]
---

- `decltype`
`decltype` is a keyword that is used to obtain the type of an expression or an entity
```cpp
#include <iostream>

int main() {
    int x = 42;
    double y = 3.14;

    // Using decltype to declare a variable with the same type as another variable
    decltype(x) result1 = x;  // result1 has the type int
    decltype(y) result2 = y;  // result2 has the type double

    // Using decltype with an expression
    int a = 10;
    int b = 20;
    decltype(a + b) sum = a + b;  // sum has the type int

    return 0;
}
```

- `friend`
In C++, the friend keyword is used to grant non-member functions or other classes access to the private and protected members of a class. When a function or class is declared as a friend of another class, it is allowed to access private and protected members of that class as if it were a member of that class.

- `const`
```cpp
const int var = 1;
int* a = new int;
*a = 2; // change the pointed int
a = (int*)&var; // change pointer to pointing another int
```

```cpp
const int var = 1;
const int* a = new int; // cannot change the value pointed by a; same as written `int const* a = new int`
*a = 2; // illegal
a = (int*)&var; //  valid
```

```cpp
const int var = 1;
int* const a = new int; // cannot change the pointer address, but can change the pointed value;
*a = 2; // valid
a = (int*)&var; //  invalid

```cpp
const int var = 1;
const int* const a = new int; 
*a = 2; // invalid
a = (int*)&var; //  invalid
```

```cpp
class Entity
{
private: 
    int m_x, m_y;
public:
    int GetX() const // const here means the method will not change state of the object
    {
        return m_x;
    }

}
```
  - `const` is a promise, you can bypass it actually.