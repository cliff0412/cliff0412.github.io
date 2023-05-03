---
title: rust frequently used crates
date: 2022-12-13 17:15:23
tags: [rust]
---


tokio-trace -> tracing

contexts, multi threads
causality -
structured diagnostics ( no grep)

tracing is part of tokio, tokio not requied

spans: a perido of time, entered and exited
events: singular moment in time
subscriber: collect trace