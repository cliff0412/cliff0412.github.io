---
title: cpp build
date: 2023-12-20 11:35:20
tags: [cpp]
---

## system
- `/etc/ld.so.conf`
The file /etc/ld.so.conf is a configuration file used by the dynamic linker/loader on Unix-like systems, including Linux. Its purpose is to specify additional directories where the linker should search for shared libraries at runtime.
When a program starts, the dynamic linker/loader is responsible for resolving and loading shared libraries (also known as dynamic libraries or shared objects). The paths specified in /etc/ld.so.conf help the linker locate these libraries.
On some systems, you might also find additional configuration files in the `/etc/ld.so.conf.d/` directory, each containing a list of directories.
After modifying the file, you need to run the `ldconfig` command to update the dynamic linker's cache and apply the changes.

**note**: `ld` stands for linker

## environment variables
- `LD_LIBRARY_PATH`
The `LD_LIBRARY_PATH` environment variable is used in Unix-like operating systems (including Linux) to specify a list of directories where the system should look for shared libraries before searching the default system locations. This variable is particularly useful when you want to run an executable that depends on shared libraries that are not in standard library paths.
1. compiling
```shell
g++ -o my_program my_program.cpp -lmy_library -L/path/to/library
```
2. running
```shell
export LD_LIBRARY_PATH=/path/to/library:$LD_LIBRARY_PATH
./my_program
```