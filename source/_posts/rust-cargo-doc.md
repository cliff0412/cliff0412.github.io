---
title: cargo_doc
date: 2022-11-13 15:41:59
tags: [rust,cargo]
---

## 文档注释
### 用于生成文档
  - 使用 ///
  - 支持 Markdown
  - 放置在被说没条目之前
### 例子
```rust
/// adds one to the number given
/// 
/// # Examples
/// ```
/// let arg = 5;
/// let answer = my_crate::add_one(arg);
/// 
/// assert_eq!(6, answer);
/// ```
pub fn add_one(x: i32) -> i32 {
    x + 1;
}
```
### 命令
```
cargo doc  ## 生成的html放在 target/doc 目录下
cargo doc --open ## 构建当前crate的文档 (也包含crate依赖项的文档)
```
### 常用章节
- # Examples
- Panics: 可能panic的场景
- Errors: 如果fn返回Result, 描述可能的错误种类, 以及导致错误的条件
- Safety: 如果fn出入unsafe调用, 解释unsafe的原因, 以及调用者确保的使用前提

### 文档注释作为测试
- 运行cargo test, doc中用# Example标记的实例代码会用来测试运行

### 为包含注释的项添加文档注释
- 符号: //!
- 这类注释通常用描述crate和模块:
  - crate root (按惯例 src/lib.rs)
  - 一个模块内，将crate火模块作为一个整体进行记录