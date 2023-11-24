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