---
title: cuda standard api & tools
date: 2023-11-22 14:47:28
tags: [cuda]
---

# API
- `__syncthreads()`: A thread’s execution can only proceed past a __syncthreads() after all threads in its block have executed the __syncthreads()
- `__syncwarp()` is an intrinsic function that provides a warp-level synchronization point within a warp. A warp is a group of threads in CUDA that execute instructions in lockstep.


# Tool
## cmd
- nvidia-smi



## references
- [cuda runtime api](https://docs.nvidia.com/cuda/cuda-runtime-api/index.html)