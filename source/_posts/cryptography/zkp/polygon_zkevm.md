---
title: polygon zkEVM
date: 2023-12-11 13:24:03
tags: [cryptography,zkp]
---

<script
  src="https://cdn.mathjax.org/mathjax/latest/MathJax.js?config=TeX-AMS-MML_HTMLorMML"
  type="text/javascript">
</script>

## zkProver
### State Machines
The zkProver follows modularity of design to the extent that, except for a few components, it is mainly a cluster of State Machines. It has a total of thirteen (13) State Machines;
- The Main State Machine
- Secondary State Machines → Binary SM, Storage SM, Memory SM, Arithmetic SM, Keccak Function SM, PoseidonG SM,
- Auxiliary State Machines → Padding-PG SM, Padding-KK SM, Bits2Field SM, Memory Align SM, Byte4 SM, ROM SM.
Due to the modular design of zkProver, the Main State Machine can delegate as many of tasks as possible to other specialist State Machines. This heavily improves the efficiency of Main SM.
![](/images/zkp/zkevm/polygon/state_machines.png)

### Two Novel Languages For zkProver
#### Zero-Knowledge Assembly(zkASM)
As an Assembly language, the Zero-Knowledge Assembly (or zkASM) language is specially designed to map instructions from the zkProver's Main State Machine to other State Machines. In case of the State Machines with firmware, zkASM is the Interpreter for the firmware.

#### Polynomial Identity Language(PIL)
The Polynomial Identity Language (or PIL) is especially designed for the zkProver. Almost all state machines express computations in terms of polynomials. Therefore, state transitions in State Machines must satisfy computation-specific polynomial identities.

### Microprocessor State Machines
There are two microprocessor-type state machines; the Main SM and the Storage SM. These two State Machines have the Firmware and the Hardware part. It is worth noting that each of these Microprocessor SM has its own ROM.

The Firmware part runs the zkASM language to set up the logic and rules, which are expressed in JSON format and stored in a ROM. The JSON-file is then parsed to the specific SM Executor, which executes Storage Actions in compliance with the rules and logic in the JSON-file.

The Hardware component, which uses the Polynomial Identity Language (PIL), defines constraints (or polynomial identities), expresses them in JSON format, and stores them in the accompanying JSON-file. These constraints are parsed to the specific SM Executor, because all computations must be executed in conformance to the polynomial identities.

![](/images/zkp/zkevm/polygon/micro_processor.png)
