---
title: geth_fine_tune
date: 2023-01-01 16:29:43
tags:
---


If we're a full node on mainnet without --cache specified, bump default cache allowance
ctx.Set(utils.CacheFlag.Name, strconv.Itoa(4096))