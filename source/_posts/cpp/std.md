---
title: cpp std
date: 2023-11-21 11:35:20
tags: [cpp]
---


# snprintf
`snprintf` is a function that formats a string and writes the resulting characters to a character array.
```cpp
int snprintf(char *str, size_t size, const char *format, ...);
```
- `str`: A pointer to the destination buffer where the resulting string is stored.
- `size`: The size of the destination buffer (including the null-terminating character).
- `format`: A format string that specifies the desired format of the output.
- `...`: Additional arguments corresponding to the placeholders in the format string.
```cpp
int main() {
    size_t n = std::snprintf(nullptr, 0, "%s", "hello, world");
    std::cout << n << std::endl;  // print 12
    return 0;
}
```

# string
## `std::string(n, '\0')` 
creates a string with a length of `n` and fills it with null characters ('\0').
```cpp
size_t n = 10;
std::string myString(n, '\0');
```
## `strerror_r` 
is a function that is commonly used for thread-safe retrieval of error messages. The purpose of this function is to convert an error number (an integer typically set by a system call or library function to indicate an error) into a human-readable error message
```cpp
#include <cstring>

int strerror_r(int errnum, char *buf, size_t buflen);
```
- `errnum`: The error number for which you want to retrieve the error message.
- `buf`: A pointer to the buffer where the error message will be stored.
- `buflen`: The size of the buffer pointed to by buf.

## others
- `strncpy`: Copy no more than N characters of SRC to DEST.
- `std::strlen`: Return the length of String.
- `std::strstr` is a standard C library function that is used to find the first occurrence of a substring within a string. The function returns a pointer to the first occurrence of the substring in the given string, or NULL if the substring is not found.