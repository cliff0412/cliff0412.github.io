---
title: inline ptx assembly in cuda
date: 2023-11-15 14:47:28
tags: [cuda]
---
# introduction
PTX, a low-level parallel thread execution virtual machine and instruction set architecture (ISA). PTX exposes the GPU as a data-parallel computing device.
The PTX Instruction Set Architecture (ISA) is lower-level compared to CUDA C++, but the programming model is entirely the same, with only some terminology differences. For example: CTA (Cooperative Thread Array): Equivalent to the Block in the CUDA thread model.

# assembler statements
## parameters
```cpp
asm("template-string" : "constraint"(output) : "constraint"(input));
```
an example
```cpp
asm("add.s32 %0, %1, %2;" : "=r"(i) : "r"(j), "r"(k));
```
Each `%n` in the template string is an index into the following list of operands, in text order. So `%0` refers to the first operand, `%1` to the second operand, and so on. Since the output operands are always listed ahead of the input operands, they are assigned the smallest indices. 
Note that the numbered references in the string can be in arbitrary order. The following is equivalent to the above example:
```cpp
asm("add.s32 %0, %2, %1;" : "=r"(i) : "r"(k), "r"(j));
```
You can also repeat a reference, e.g.:
```cpp
asm("add.s32 %0, %1, %1;" : "=r"(i) : "r"(k));
```
If there is no input operand, you can drop the final colon, e.g.:
```cpp
asm("mov.s32 %0, 2;" : "=r"(i));
```

If there is no output operand, the colon separators are adjacent, e.g.:


```cpp
asm("mov.s32 r1, %0;" :: "r"(i));
```
the “r” constraint refers to a 32bit integer register. The “=” modifier in “=r” specifies that the register is written to.  There is also available a “+” modifier that specifies the register is both read and written

Multiple instructions can be combined into a single asm() statement; 
am example
```cpp
__device__ int cube (int x)
{
  int y;
  asm(".reg .u32 t1;\n\t"              // temp reg t1
      " mul.lo.u32 t1, %1, %1;\n\t"    // t1 = x * x
      " mul.lo.u32 %0, t1, %1;"        // y = t1 * x
      : "=r"(y) : "r" (x));
  return y;
}
```

## constraints
There is a separate constraint letter for each PTX register type:
```cpp
"h" = .u16 reg
"r" = .u32 reg
"l" = .u64 reg
"f" = .f32 reg
"d" = .f64 reg
```
The constraint "n" may be used for immediate integer operands with a known value. Example:
```cpp
asm("add.u32 %0, %0, %1;" : "=r"(x) : "n"(42));
```


# State Space + Type + Identifier
## state spaces
A state space is a storage area with particular characteristics. All variables reside in some state space. 
| Name | Description |
| ----------- | ----------- |
| .reg | Registers, fast. |
| .sreg | Special registers. Read-only; pre-defined; platform-specific. |
|.const|Shared, read-only memory.|
|.global|Global memory, shared by all threads.|
|.local|Local memory, private to each thread.|
|.param|Kernel parameters, defined per-grid; or Function or local parameters, defined per-thread.|
|.shared|Addressable memory, defined per CTA, accessible to all threads in the cluster throughout the lifetime of the CTA that defines it.|


## types
### fundamental types
In PTX, the fundamental types reflect the native data types supported by the target architectures.
| Basic Type | Fundamental Type Specifiers |
| ----------- | ----------- |
| Signed integer | .s8, .s16, .s32, .s64 |
|Unsigned integer|.u8, .u16, .u32, .u64|
|Floating-point|.f16, .f16x2, .f32, .f64|
|Bits (untyped)|.b8, .b16, .b32, .b64, .b128|
|Predicate|.pred|

## variables
In PTX, a variable declaration describes both the variable’s type and its state space. In addition to fundamental types, PTX supports types for simple aggregate objects such as vectors and arrays.
**examples**
```cpp
.global .v4 .f32 V;   // a length-4 vector of floats
.shared .v2 .u16 uv;  // a length-2 vector of unsigned ints
.global .v4 .b8  v;   // a length-4 vector of bytes
```

# references
- [nvidia docs inlline ptx assembly](https://docs.nvidia.com/cuda/inline-ptx-assembly/index.html)
- [IBM Open XL C/C++ Inline Assembly](https://www.ibm.com/docs/en/openxl-c-and-cpp-aix/17.1.0?topic=features-inline-assembly-statements)
- [parallel thread execution ISA guide](https://docs.nvidia.com/cuda/parallel-thread-execution/index.html#)