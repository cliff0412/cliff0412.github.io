---
title: rust cargo all in one
date: 2022-12-06 17:05:07
tags: [rust]
---

## useful cmd
```
cargo build --verbose ## print out each rustc invocation
```

## specifying dependencies
- specifying dependencies from crates.io
```toml
[dependencies]
time = "0.1.12"
```
- specifying dependencies from other registries
```toml
[dependencies]
some-crate = { version = "1.0", registry = "my-registry" }
```
- specifying dependencies form git repositories
```toml
[dependencies]
regex = { git = "https://github.com/rust-lang/regex.git" }
```
- path dependencies
```toml
[dependencies]
hello_utils = { path = "hello_utils" }
```
- platform specific dependencies
```toml
[target.'cfg(unix)'.dependencies]
openssl = "1.0.1"

[target.'cfg(target_arch = "x86")'.dependencies]
native-i686 = { path = "native/i686" }
```
Like with Rust, the syntax here supports the not, any, and all operators to combine various cfg name/value pairs.
If you want to know which cfg targets are available on your platform, run ```rustc --print=cfg``` from the command line.
If you want to know which cfg targets are available for another platform, such as 64-bit Windows, run ```rustc --print=cfg --target=x86_64-pc-windows-msvc```
- custom target specifications
```toml
[target.bar.dependencies]
winhttp = "0.4.0"

[target.my-special-i686-platform.dependencies]
openssl = "1.0.1"
native = { path = "native/i686" }
```
- development dependencies
    [dev-dependencies]
    Dev-dependencies are not used when compiling a package for building, but are used for compiling tests, examples, and benchmarks.
    These dependencies are not propagated to other packages which depend on this package.
    ```toml
    [target.'cfg(unix)'.dev-dependencies]
    mio = "0.0.1"
    ```

- build dependencies
    ```toml
    [build-dependencies]
    cc = "1.0.3"
    ```
    The build script does not have access to the dependencies listed in the dependencies or dev-dependencies section. Build dependencies will likewise not be available to the package itself unless listed under the dependencies section as well.
- choosing features
    ```toml
    [dependencies.awesome]
    version = "1.3.5"
    default-features = false # do not include the default features, and optionally
                            # cherry-pick individual features
    features = ["secure-password", "civet"]
    ```
- renaming dependencies in Cargo.toml
    When writing a [dependencies] section in Cargo.toml the key you write for a dependency typically matches up to the name of the crate you import from in the code. For some projects, though, you may wish to reference the crate with a different name in the code regardless of how it's published on crates.io. For example you may wish to: Avoid the need to use foo as bar in Rust source.
    (more to be found in original book)

## references
[cargo book](https://doc.rust-lang.org/cargo/)