---
title: rust crate: serde
date: 2023-04-01 22:04:38
tags: [rust-crate]
---

```rust
#[serde(tag = "filterType")]
#[serde(untagged)]
#[serde(rename = "PRICE_FILTER")]
#[serde(rename_all = "camelCase")]

#[serde(with = "string_or_float")]
pub stop_price: f64,
```