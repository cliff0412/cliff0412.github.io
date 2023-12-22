---
title: cpp types
date: 2023-11-15 11:35:20
tags: [cpp]
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

int main() {
    MyIntegerWrapper myObj(42);

    // Implicit conversion using the conversion operator
    int intValue = myObj;
    std::cout << "Implicit Conversion: " << intValue << std::endl;

    // Explicit conversion using static_cast
    double doubleValue = static_cast<double>(myObj);
    std::cout << "Explicit Conversion: " << doubleValue << std::endl;

    return 0;
}
```