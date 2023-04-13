---
title: geth evm source analysis
date: 2023-04-13 16:24:54
tags: [blockchain,geth]
---

# overall
the code is under path `core/vm`
overview of the whole evm module ![evm](/images/geth.evm.architecture.png)

the core is `EVM` struct (in evm.go), with main function in creating or call contract. a new `EVM` object is created every time when processing a transaction. inside the EVM struct, the main items are `Interpreter`, and `StateDB` (for state persistence). `Interpreter` loops through contract call instructions.Before each instruction is executed, some checks are performed to ensure sufficient gas and stack space. actual instruction execution code is recorded in `JumpTable` (256 sized array of `operation`)

depending on the version of Ethereum, JumpTable may point to four different instruction sets: constantinopleInstructionSet, byzantiumInstructionSet, homesteadInstructionSet, frontierInstructionSet. Most of the instructions of these four sets of instruction sets are the same, but as the version is updated, the new version supports more instruction sets than the old version.

# evm
The `EVM` object is the most important object exported by the evm module, which represents an Ethereum virtual machine

## creating evm
Every time a transaction is processed, an EVM is created to execute the transaction. This is reflected in the function `ApplyTransaction` (core/state_processor.go)

## creating contract
If the `to` of the transaction is empty, it means that this transaction is to create a contract, so call `EVM.Create` to perform related functions
- CREATE
```
contractAddr = crypto.CreateAddress(caller.Address(), evm.StateDB.GetNonce(caller.Address()))
```
- CREATE2
```
codeAndHash := &codeAndHash{code: code}
	contractAddr = crypto.CreateAddress2(caller.Address(), salt.Bytes32(), codeAndHash.Hash().Bytes())
```
during create contract, an object `Contract` is created. A Contract object contains and maintains the necessary information during the execution of the contract, such as the contract creator, the address of the contract itself, the remaining gas of the contract, the contract code and the `jumpdests` record of the code.

then, it invokes below method to create contract
```
ret, err := evm.interpreter.Run(contract, nil, false)
evm.StateDB.SetCode(address, ret)
```
If the operation is successful and the contract code does not exceed the length limit, call StateDB.SetCode to store the contract code in the contract account of the Ethereum state database. Of course, the storage needs to consume a certain amount of gas.

You may wonder why the stored contract code is the return code after the contract runs, not the data in the original transaction (ie Transaction.data.Payload). This is because when the contract source code is compiled into binary data, in addition to the original code of the contract, the compiler also inserts some codes to perform related functions. For creation, the compiler inserts code that executes the contract's "constructor" (that is, the contract object's constructor method). Therefore, when the binary compiled by the compiler is submitted to the Ethereum node to create a contract, the EVM executes this binary code, in fact, it mainly executes the constructor method of the contract, and then returns other codes of the contract, so there is a `ret` variable here Stored in the state database as the actual code of the contract

## call contract
The EVM object has three methods to implement the call of the contract, they are:

- EVM. Call
- EVM. CallCode
- EVM. DelegateCall
- EVM.StaticCall
The basic contract call function implemented by EVM.Call is nothing special. The following three calling methods are the differences compared with EVM.Call. So here we only introduce the particularity of the last three calling methods

### EVM.CallCode & EVM.DelegateCall
The existence of EVM.CallCode and EVM.DelegateCall is to realize the characteristics of the "library" of the contract. If the code written by solidity is to be called as a library, it must be deployed on the blockchain to obtain a fixed address like a normal contract. , other contracts can call the method provided by this "library contract". But the contract also involves some unique attributes, such as the caller of the contract, contract address, the amount of ether it owns, etc. If we directly call the code of the "library contract", these properties must be the properties of the "library contract" itself, but this may not be what we want

as an example
```
A -> contractB - delegateCall -> libC
```
`EVM.DelegateCall` sets the caller (msg.sender) of the "library contract" (libC) to A, rather than contractB; sets the address of the "library contract" (libC) to contractB. 
`EVM.CallCode` is similar to `EVM.DelegateCall`. the only difference is that `EVM.CallCode` only change the address of the "library contract" (libC) to contractB, without chanding the caller to A.
`EVM.StaticCall` is similar to `EVM.Call`, the only difference is that EVM.StaticCall does not allow execution of instructions that modify permanently stored data