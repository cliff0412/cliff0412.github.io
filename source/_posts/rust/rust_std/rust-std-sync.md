---
title: rust std sync
date: 2023-06-08 22:04:38
tags: [rust-std]
---

## [lock free & wait free](https://en.wikipedia.org/wiki/Non-blocking_algorithm)
"Lock-free" and "wait-free" are two different approaches to designing concurrent algorithms and data structures. Both aim to provide efficient and non-blocking synchronization in concurrent environments.
- **lock-free** A lock-free algorithm or data structure guarantees progress for at least one thread, regardless of the behavior or state of other threads. In a lock-free design, threads can independently perform their operations without being blocked by other threads. If one thread gets delayed or suspended, other threads can continue to make progress. Lock-free algorithms typically use low-level synchronization primitives such as atomic operations to ensure progress and prevent data races.
- **wait-free** A wait-free algorithm or data structure guarantees progress for every thread, regardless of the behavior or state of other threads. In a wait-free design, every thread executing an operation completes its operation within a finite number of steps, without being delayed by other threads. Wait-free algorithms are more stringent in their requirements compared to lock-free algorithms and often require more complex synchronization mechanisms.

It's important to note that both lock-free and wait-free designs aim to avoid traditional locks or blocking synchronization mechanisms (such as mutexes or condition variables) that can lead to contention and thread blocking. Instead, they rely on techniques like atomic operations, compare-and-swap (CAS), or memory fences to ensure progress and prevent data races in concurrent execution.

## [atomic](https://doc.rust-lang.org/stable/std/sync/atomic/index.html)
Rust atomics currently follow the same rules as [C++20 atomics](https://en.cppreference.com/w/cpp/atomic), specifically `atomic_ref`. Basically, creating a shared reference to one of the Rust atomic types corresponds to creating an `atomic_ref` in C++; the atomic_ref is destroyed when the lifetime of the shared reference ends. 
Each method takes an `Ordering` which represents the strength of the memory barrier for that operation. These orderings are the same as the [C++20 atomic orderings](https://en.cppreference.com/w/cpp/atomic/memory_order). For more information see the [nomicon](https://doc.rust-lang.org/stable/nomicon/atomics.html)
Atomic variables are safe to share between threads (they implement Sync) but they do not themselves provide the mechanism for sharing and follow the threading model of Rust. The most common way to share an atomic variable is to put it into an Arc (an atomically-reference-counted shared pointer).

### Compiler Reordering
Compilers may change the actual order of events, or make events never occur! If we write something like
```rust
x = 1;
y = 3;
x = 2;
```
The compiler may conclude that it would be best if your program did:
```rust
x = 2;
y = 3;
```
This has inverted the order of events and completely eliminated one event. But if our program is multi-threaded, we may have been relying on x to actually be assigned to 1 before y was assigned. 

### Hardware Reordering
here is indeed a global shared memory space somewhere in your hardware, but from the perspective of each CPU core it is so very far away and so very slow. Each CPU would rather work with its local cache of the data and only go through all the anguish of talking to shared memory only when it doesn't actually have that memory in cache. The end result is that the hardware doesn't guarantee that events that occur in some order on one thread, occur in the same order on another thread. To guarantee this, we must issue special instructions to the CPU telling it to be a bit less smart.
For instance, say we convince the compiler to emit this logic:
```
initial state: x = 0, y = 1

THREAD 1        THREAD2
y = 3;          if x == 1 {
x = 1;              y *= 2;
                }
```
Ideally this program has 2 possible final states:
- y = 3: (thread 2 did the check before thread 1 completed)
- y = 6: (thread 2 did the check after thread 1 completed)
However there's a third potential state that the hardware enables:
- y = 2: (thread 2 saw x = 1, but not y = 3, and then overwrote y = 3)
It's worth noting that different kinds of CPU provide different guarantees. It is common to separate hardware into two categories: strongly-ordered and weakly-ordered. Most notably x86/64 provides strong ordering guarantees, while ARM provides weak ordering guarantees. 

### Data Accesses
Atomic accesses are how we tell the hardware and compiler that our program is multi-threaded. Each atomic access can be marked with an ordering that specifies what kind of relationship it establishes with other accesses.  For the compiler, this largely revolves around re-ordering of instructions. For the hardware, this largely revolves around how writes are propagated to other threads. The set of orderings Rust exposes are:
- Sequentially Consistent (SeqCst)
- Release
- Acquire
- Relaxed

### Sequentially Consistent
Sequentially Consistent is the most powerful of all, implying the restrictions of all other orderings. Intuitively, a sequentially consistent operation cannot be reordered: all accesses on one thread that happen before and after a SeqCst access stay before and after it.

### Acquire-Release
Acquire and Release are largely intended to be paired. they're perfectly suited for acquiring and releasing locks. 
Intuitively, an acquire access ensures that every access after it stays after it. However operations that occur before an acquire are free to be reordered to occur after it. Similarly, a release access ensures that every access before it stays before it. However operations that occur after a release are free to be reordered to occur before it.
```rust
use std::sync::Arc;
use std::sync::atomic::{AtomicBool, Ordering};
use std::thread;

fn main() {
    let lock = Arc::new(AtomicBool::new(false)); // value answers "am I locked?"

    // ... distribute lock to threads somehow ...

    // Try to acquire the lock by setting it to true
    while lock.compare_and_swap(false, true, Ordering::Acquire) { }
    // broke out of the loop, so we successfully acquired the lock!

    // ... scary data accesses ...

    // ok we're done, release the lock
    lock.store(false, Ordering::Release);
}
```
### Relaxed
Relaxed accesses are the absolute weakest. They can be freely re-ordered and provide no happens-before relationship. Still, relaxed operations are still atomic. That is, they don't count as data accesses and any read-modify-write operations done to them occur atomically. For instance, incrementing a counter can be safely done by multiple threads using a relaxed `fetch_add` if you're not using the counter to synchronize any other accesses.

## an example (spinlock)
```rust
use std::sync::Arc;
use std::sync::atomic::{AtomicUsize, Ordering};
use std::{hint, thread};

fn main() {
    let spinlock = Arc::new(AtomicUsize::new(1));

    let spinlock_clone = Arc::clone(&spinlock);
    let thread = thread::spawn(move|| {
        spinlock_clone.store(0, Ordering::SeqCst);
    });

    // Wait for the other thread to release the lock
    while spinlock.load(Ordering::SeqCst) != 0 {
        hint::spin_loop();
    }

    if let Err(panic) = thread.join() {
        println!("Thread had an error: {panic:?}");
    }
}
```

## usual structs
1. [AtomicBool](https://doc.rust-lang.org/stable/std/sync/atomic/struct.AtomicBool.html)
### methods
- `fn get_mut(&mut self) -> &mut bool`
- `fn into_inner(self) -> bool`
- `fn load(&self, order: Ordering) -> bool`
- `fn store(&self, val: bool, order: Ordering)`
- `fn compare_exchange(&self, current: bool,new: bool,success: Ordering,failure: Ordering) -> Result<bool, bool>`
Stores a value into the bool if the current value is the same as the current value.
compare_exchange takes two Ordering arguments to describe the memory ordering of this operation. success describes the required ordering for the read-modify-write operation that takes place if the comparison with current succeeds. failure describes the required ordering for the load operation that takes place when the comparison fails. 
- `fn fetch_and(&self, val: bool, order: Ordering) -> bool`
Logical “and” with a boolean value.
Performs a logical “and” operation on the current value and the argument val, and sets the new value to the result.
- `const fn as_ptr(&self) -> *mut bool`
Returns a mutable pointer to the underlying bool.
Doing non-atomic reads and writes on the resulting integer can be a data race. This method is mostly useful for FFI, where the function signature may use *mut bool instead of &AtomicBool.

2. [AtomicUsize](https://doc.rust-lang.org/stable/std/sync/atomic/struct.AtomicUsize.html)
2. [AtomicPtr](https://doc.rust-lang.org/stable/std/sync/atomic/struct.AtomicPtr.html)
A raw pointer type which can be safely shared between threads.
This type has the same in-memory representation as a *mut T


## Higher-level synchronization objects
Most of the low-level synchronization primitives are quite error-prone and inconvenient to use, which is why the standard library also exposes some higher-level synchronization objects.
- **Arc**: Atomically Reference-Counted pointer, which can be used in multithreaded environments to prolong the lifetime of some data until all the threads have finished using it.
- **Barrier**: Ensures multiple threads will wait for each other to reach a point in the program, before continuing execution all together.
- **Condvar**: Condition Variable, providing the ability to block a thread while waiting for an event to occur.
- **mpsc**: Multi-producer, single-consumer queues, used for message-based communication. Can provide a lightweight inter-thread synchronisation mechanism, at the cost of some extra memory.
- **Mutex**: Mutual Exclusion mechanism, which ensures that at most one thread at a time is able to access some data.
- **Once**: Used for a thread-safe, one-time global initialization routine
- **OnceLock**: Used for thread-safe, one-time initialization of a global variable.
- **RwLock**: Provides a mutual exclusion mechanism which allows multiple readers at the same time, while allowing only one writer at a time. In some cases, this can be more efficient than a mutex.

## mpsc
This module provides message-based communication over channels, concretely defined among three types:
- Sender
- SyncSender
- Receiver