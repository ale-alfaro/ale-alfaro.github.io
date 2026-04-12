---
title: Clangd Pitfalls
created: 2026 04 08
modified: 2026 04 11
publish: false
---

If you read [[lsp-integration|the previous post on LSP]] , we left-off in a solid config that can work in a lot cases. Clangd can work almost out-of-the-box **IF** all things are done exactly how Clangd expects it. Many use cases wont work so this is a follow-up to help out with some of the pitfalls you might encounter. I can't possibly predict what issues you might see so I will list out some of the pitfalls, from most common/severe to rare/mildly annoying, that I have dealt with solutions/workarounds.

## Pitfall #1: Where Did the compile_commands.json go?

## Pitfall #2: Making Clang and Embedded Toolchains Friends

Once Clangd has a `compile_commands.json`, but with only that as context Clangd cant perform at its 100% capacity for an embedded codebase as there is a lot of assumptions done by Clangd that aren't always true or accurate. Once you have a base working you should look at the following inputs for Clangd:

1. **Toolchain Environment -** It needs to know about your compiler,system include headers paths, target-triple (i.e arm-none-eabi, riscv5-x86-elf)
2. **Tweaking the GCC flags for Clangd** - Some flags are stripped by Clangd when converting them from GCC flags that we want to add back

I'm assuming that you have a Zephyr SDK installed already + have a working python environment with the package dependencies installed. For more info on how to setup Zephyr go to the [official docs](https://docs.zephyrproject.org/latest/develop/getting_started/index.html) on it.

> [!NOTE] If you don't use Zephyr at all the steps below translate to any toolchain. You would do the same steps for the Baremental GNU ARM toolchain or other toolchains.

For Clangd to get information on your toolchain it requires you to specify the location of said toolchain and use this CLI flag to specify the toolchain's compiler location with an **absolute path**:

> [`-–query-driver`](https://releases.llvm.org/10.0.0/tools/clang/tools/extra/docs/clangd/Configuration.html#id2)
>
> Clangd makes use of clang behind the scenes, so it might fail to detect your standard library or\
> built-in headers if your project is making use of a custom toolchain.
> That is quite common in hardware-related projects, especially for the ones making use of gcc (e.g. ARM's arm-none-eabi-gcc).
> You can specify your driver as a list of globs or full paths, then clangd will execute drivers and fetch necessary include paths to compile your code.

Adding this flag is a must for working with ARM toolchains so we need to add it every time we invoke Clangd as a command within Neovim. We will need to make sure we have this location whenever we open Neovim within a west workspace and use it when calling `vim.lsp.config` to enable Clangd. Next section we will go over how to do this using environment variables that Zephyr already uses to detect the active toolchain

> [!tip] Using globs for C and C++ analysis
> Using a glob is useful when working with a C and C++ codebase, `--query-driver="prefix/to/toolchain/bin/arm-zephyr-eabi-g*` will allow Clangd to analyze your code with the right compiler depending on the language used in a file

#### Zephyr SDK Installation Path

The default installation root for the Zephyr SDK is the home directory and every installed toolchain is suffixed with its version: `~/zephr-sdk-<VERSION>`. Not related to Clangd but important to set it up if you plan to use different version of the Zephyr SDK toolchain are the environment variable `ZEPHYR_SDK_INSTALL_DIR` and `ZEPHYR_TOOLCHAIN_VARIANT` and others you can read more about in the Zephyr docs. These provide the build system the location of the active toolchain.

> [!info] `ZEPHYR_TOOLCHAIN_VARIANT` is only relevant if you use a zephyr-sdk version equal or above to v1.0.0. This variable can allow you to switch between using the GNU (zephyr) toolchain or the new LLVM toolchain

Aside from those two a key variable that Zephyr will need always is `ZEPHYR_BASE` which you can provide in many ways but I prefer to just do explicitly and have the 3 within one source-able shell script to setup my environment at the top of the west workspace:

```sh
cat <<EOF> .env
export ZEPHYR_BASE="$(west topdir)/zephyr"
export ZEPHYR_TOOLCHAIN_VARIANT=zephyr
export ZEPHYR_SDK_INSTALL_DIR="$HOME/zephyr-sdk-1.0.0"
EOF
```

If you installed the toolchain somewhere else you will need to modify the path accordingly. Every time you enter the workspace you will need to source it `source .env` to make sure the environment variables are setup. Otherwise Clangd won't have the value of `--query-driver` expanded to the right path

## Aside - NCS Toolchain

I work with the NCS flavor of Zephyr which also ships with its own toolchain managed by Nordic's own utility, `nrfutil`. As non-VSCode user I have had to deal with the pain of figuring how Nordic manages the Zephyr SDK toolchains and their location.[^1] In my search I found a command that can give us that information for each version of the NCS toolchain installed in your system:

```sh
 ❯ nrfutil toolchain-manager env --ncs-version v3.2.1 --as-script
export PATH=/home/alealfaro/ncs/toolchains/43683a87ea/usr/bin:/home/alealfaro/ncs/toolchains/43683a87ea/usr/bin:/home/alealfaro/ncs/toolchains/43683a87ea/usr/local/bin:/home/alealfaro/ncs/toolchains/43683a87ea/opt/bin:/home/alealfaro/ncs/toolchains/43683a87ea/opt/nanopb/generator-bin:/home/alealfaro/ncs/toolchains/43683a87ea/nrfutil/bin:/home/alealfaro/ncs/toolchains/43683a87ea/opt/zephyr-sdk/arm-zephyr-eabi/bin:/home/alealfaro/ncs/toolchains/43683a87ea/opt/zephyr-sdk/riscv64-zephyr-elf/bin:$PATH
export LD_LIBRARY_PATH=/home/alealfaro/ncs/toolchains/43683a87ea/usr/lib:/home/alealfaro/ncs/toolchains/43683a87ea/usr/lib/x86_64-linux-gnu:/home/alealfaro/ncs/toolchains/43683a87ea/usr/local/lib:$LD_LIBRARY_PATH
export GIT_EXEC_PATH=/home/alealfaro/ncs/toolchains/43683a87ea/usr/local/libexec/git-core
export GIT_TEMPLATE_DIR=/home/alealfaro/ncs/toolchains/43683a87ea/usr/local/share/git-core/templates
export PYTHONHOME=/home/alealfaro/ncs/toolchains/43683a87ea/usr/local
export PYTHONPATH=/home/alealfaro/ncs/toolchains/43683a87ea/usr/local/lib/python3.12:/home/alealfaro/ncs/toolchains/43683a87ea/usr/local/lib/python3.12/site-packages
export NRFUTIL_HOME=/home/alealfaro/ncs/toolchains/43683a87ea/nrfutil/home
export ZEPHYR_TOOLCHAIN_VARIANT=zephyr
export ZEPHYR_SDK_INSTALL_DIR=/home/alealfaro/ncs/toolchains/43683a87ea/opt/zephyr-sdk
```

We only care about the two variables at the bottom and the rest we can ignore so we can filter out the results using grep and writing that to a .env file

```sh
❯ nrfutil toolchain-manager env --ncs-version v3.2.1 --as-script | grep 'ZEPHYR' > .env
```

As a sanity check and also to figure out where the GCC compiler is located, use the `ls` or `tree` command to view the contents of the toolchain directory:

```sh
❯ tree $ZEPHYR_SDK_INSTALL_DIR -L3 --prune
/home/alealfaro/ncs/toolchains/43683a87ea/opt/zephyr-sdk
├── arm-zephyr-eabi
│   ├── bin
│   │   ├── arm-zephyr-eabi-addr2line
│   │   ├── arm-zephyr-eabi-ar
│   │   ├── arm-zephyr-eabi-as
│   │   ├── arm-zephyr-eabi-c++
│   │   ├── arm-zephyr-eabi-cc -> arm-zephyr-eabi-gcc
│   │   ├── arm-zephyr-eabi-c++filt
│   │   ├── arm-zephyr-eabi-cpp
│   │   ├── arm-zephyr-eabi-ct-ng.config
│   │   ├── arm-zephyr-eabi-elfedit
│   │   ├── arm-zephyr-eabi-g++ # <------- g++
│   │   ├── arm-zephyr-eabi-gcc # <------- gcc
│   │   ├── arm-zephyr-eabi-gcc-12.2.0
│   │   ├── arm-zephyr-eabi-gcc-ar
│   │   ├── arm-zephyr-eabi-gcc-nm
│   │   ├── arm-zephyr-eabi-gcc-ranlib
│   │   ├── arm-zephyr-eabi-gcov
│   │   ├── arm-zephyr-eabi-gcov-dump
│   │   ├── arm-zephyr-eabi-gcov-tool
│   │   ├── arm-zephyr-eabi-gdb
│   │   ├── arm-zephyr-eabi-gdb-add-index
│   │   ├── arm-zephyr-eabi-gdb-add-index-py
│   │   ├── arm-zephyr-eabi-gdb-py
│   │   ├── arm-zephyr-eabi-gprof
│   │   ├── arm-zephyr-eabi-gprof-py
│   │   ├── arm-zephyr-eabi-ld
│   │   ├── arm-zephyr-eabi-ld.bfd
│   │   ├── arm-zephyr-eabi-lto-dump
│   │   ├── arm-zephyr-eabi-nm
│   │   ├── arm-zephyr-eabi-objcopy
│   │   ├── arm-zephyr-eabi-objdump
│   │   ├── arm-zephyr-eabi-ranlib
│   │   ├── arm-zephyr-eabi-readelf
│   │   ├── arm-zephyr-eabi-size
│   │   ├── arm-zephyr-eabi-strings
│   │   └── arm-zephyr-eabi-strip
│   └── lib
│       ├── libcc1.so -> libcc1.so.0.0.0
│       ├── libcc1.so.0 -> libcc1.so.0.0.0
│       └── libcc1.so.0.0.0
├── cmake
│   ├── zephyr
│   │   ├── generic.cmake
│   │   ├── host-tools.cmake
│   │   ├── Kconfig
│   │   └── target.cmake
│   ├── Zephyr-sdkConfig.cmake
│   ├── Zephyr-sdkConfigVersion.cmake
│   └── zephyr_sdk_export.cmake
├── sdk_toolchains
└── sdk_version

6 directories, 47 files
```

The NCS toolchain only ships with `arm-zephyr-eabi` target-specific toolchain. so your installation might vary but the directory structure should be the same for all toolchains.

Now that we know where the location of the gcc compiler is we can create a glob as an input for the `--query-driver` flag:

```sh
clangd --query-driver="$ZEPHYR_SDK_INSTALL_DIR/**/bin/arm-zephyr-eabi-g*"
```

### Pitfall #3: Clangd Vs GCC Flags

---

[^1]: If you want to know more go to there's no official doc or resource I found on this topic and the only way to do it is by doing some "reverse engineering" and connecting the dots. A good start is to look at the toolchains.json and the other json files within each toolchain directory
