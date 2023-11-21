---
title: cpp_notes
date: 2023-11-15 11:35:20
tags:
---

## Conversion Operator
```cpp
class MyIntegerWrapper {
private:
    int value;

public:
    // Constructor
    MyIntegerWrapper(int val) : value(val) {}

    // Conversion operator to int
    operator int() const {
        return value;
    }
};
```