---
title: cpp generics
date: 2023-11-21 11:35:20
tags: [cpp]
---

# generics
## variadic template parameter
```cpp
template<typename... Types>
void printValues(const Types&... values) {
    // Fold expression (C++17 and later) to print all values
    (std::cout << ... << values) << std::endl;
}
```

# macros
## examples
```cpp
#if defined(_WIN32)
#else
#endif
```
-  `__cplusplus` macro is a predefined macro in C++ that is used to indicate the version of the C++ standard being used by the compiler. The value of `__cplusplus` is an integer that represents the version.
- __FILE__
`__FILE__` is a predefined macro in C and C++ that expands to the name of the current source file as a string literal.
- __LINE__
`__LINE__` is a predefined macro in C and C++ that expands to the current line number in the source code.