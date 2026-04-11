---
title: Clangd - Deep-dive and Avoiding pitfalls
created: 2026-04-08 13:48
modified: 2026-04-08 13:48
publish: false
---

# Deep-dive on Clangd

```sh
> clangd --help
OVERVIEW: clangd is a language server that provides IDE-like features to editors.

It should be used via an editor plugin rather than invoked directly. For more information, see:
        https://clangd.llvm.org/
        https://microsoft.github.io/language-server-protocol/

clangd accepts flags on the commandline, and in the CLANGD_FLAGS environment variable.

USAGE: clangd [options]

OPTIONS:

Generic Options:

  --help                               - Display available options (--help-hidden for more)
  --help-list                          - Display list of available options (--help-list-hidden for more)
  --version                            - Display the version of this program

clangd compilation flags options:

  --compile-commands-dir=<string>      - Specify a path to look for compile_commands.json. If path is invalid, clangd will look in the current directory and parent paths of each source file
  --query-driver=<string>              - Comma separated list of globs for white-listing gcc-compatible drivers that are safe to execute. Drivers matching any of these globs will be used to extract system includes. e.g. /usr/bin/**/clang-*,/path/to/repo/**/g++-*

clangd feature options:

  --all-scopes-completion              - If set to true, code completion will include index symbols that are not defined in the scopes (e.g. namespaces) visible from the code completion point. Such completions can insert scope qualifiers
  --background-index                   - Index project code in the background and persist index on disk.
  --clang-tidy                         - Enable clang-tidy diagnostics
  --completion-style=<value>           - Granularity of code completion suggestions
    =detailed                          -   One completion item for each semantically distinct completion, with full type information
    =bundled                           -   Similar completion items (e.g. function overloads) are combined. Type information shown where possible
  --fallback-style=<string>            - clang-format style to apply by default when no .clang-format file is found
  --function-arg-placeholders=<string> - When disabled (0), completions contain only parentheses for function calls. When enabled (1), completions also contain placeholders for method parameters
  --header-insertion=<value>           - Add #include directives when accepting code completions
    =iwyu                              -   Include what you use. Insert the owning header for top-level symbols, unless the header is already directly included or the symbol is forward-declared
    =never                             -   Never insert #include directives as part of code completion
  --header-insertion-decorators        - Prepend a circular dot or space before the completion label, depending on whether an include line will be inserted or not
  --limit-references=<int>             - Limit the number of references returned by clangd. 0 means no limit (default=1000)
  --limit-results=<int>                - Limit the number of results returned by clangd. 0 means no limit (default=100)
  
clangd miscellaneous options:

  --check[=<string>]                     - Parse one file in isolation instead of acting as a language server. Useful to investigate/reproduce crashes or configuration problems. With --check=<filename>, attempts to parse a particular file.
  --enable-config                      - Read user and project configuration from YAML files.
                                         Project config is from a .clangd file in the project directory.
                                         User config is from clangd/config.yaml in the following directories:
                                                Windows: %USERPROFILE%\AppData\Local
                                                Mac OS: ~/Library/Preferences/
                                                Others: $XDG_CONFIG_HOME, usually ~/.config
                                         Configuration is documented at https://clangd.llvm.org/config.html
  -j <uint>                            - Number of async workers used by clangd. Background index also uses this many workers.
  
clangd protocol and logging options:

  --log=<value>                        - Verbosity of log messages written to stderr
    =error                             -   Error messages only
    =info                              -   High level execution tracing
    =verbose                           -   Low level details
  --offset-encoding=<value>            - Force the offsetEncoding used for character positions. This bypasses negotiation via client capabilities
    =utf-8                             -   Offsets are in UTF-8 bytes
    =utf-16                            -   Offsets are in UTF-16 code units
    =utf-32                            -   Offsets are in unicode codepoints
```

Clangd has one major requirements to analyze your project:

1. **Application/Project's Build Recipe per source file** - How your project/application was compiled in the form of a database called `compile_commands.json`. This file is automatically generated by CMake if `set(CMAKE_EXPORT_COMPILE_COMMANDS ON)` is present.

Thankfully Zephyr sets this option and the build generates this artifact already by default. It is located in the top directory of the build. Just to show what this file really is let' look at an entry of this database and understand how Clangd uses this database:

```sh
❯ west build -p -b native_sim zephyr/samples/hello_world
....
❯ cat build/compile_commands.json | jq '.[0]'

```

```json
[
...
{
  "directory": "/home/alealfaro/zephyrproject/build",
  "command": "/bin/gcc -DKERNEL -DK_HEAP_MEM_POOL_SIZE=0 -D__ZEPHYR__=1 -I/home/alealfaro/zephyrproject/build/zephyr/include/generated/zephyr -I/home/alealfaro/zephyrproject/zephyr/include -I/home/alealfaro/zephyrproject/build/zephyr/include/generated -I/home/alealfaro/zephyrproject/zephyr/soc/native/inf_clock -I/home/alealfaro/zephyrproject/zephyr/boards/native/native_sim -I/home/alealfaro/zephyrproject/zephyr/lib/midi2/. -I/home/alealfaro/zephyrproject/zephyr/scripts/native_simulator/common/src/include -I/home/alealfaro/zephyrproject/zephyr/scripts/native_simulator/native/src/include -I/home/alealfaro/zephyrproject/modules/hal/microchip/include -I/home/alealfaro/zephyrproject/modules/hal/ti/mspm0/source/ti/devices/msp/. -I/home/alealfaro/zephyrproject/modules/hal/ti/mspm0/source/ti/devices/msp/m0p -I/home/alealfaro/zephyrproject/modules/hal/ti/mspm0/source/ti/devices/msp/peripherals -I/home/alealfaro/zephyrproject/modules/hal/ti/mspm0/source/ti/devices/msp/peripherals/m0p -I/home/alealfaro/zephyrproject/modules/hal/ti/mspm0/source/ti/devices/msp/peripherals/m0p/sysctl -fno-strict-aliasing -Os -imacros /home/alealfaro/zephyrproject/build/zephyr/include/generated/zephyr/autoconf.h -fno-common -g -gdwarf-4 -fdiagnostics-color=always -Wall -Wformat -Wformat-security -Wno-format-zero-length -Wdouble-promotion -Wno-pointer-sign -Wpointer-arith -Wexpansion-to-defined -Wno-unused-but-set-variable -Werror=implicit-int -fno-pic -fno-pie -fno-asynchronous-unwind-tables -fno-reorder-functions --param=min-pagesize=0 -fno-defer-pop -fmacro-prefix-map=/home/alealfaro/zephyrproject/zephyr/samples/hello_world=CMAKE_SOURCE_DIR -fmacro-prefix-map=/home/alealfaro/zephyrproject/zephyr=ZEPHYR_BASE -fmacro-prefix-map=/home/alealfaro/zephyrproject=WEST_TOPDIR -ffunction-sections -fdata-sections -m32 -msse2 -mfpmath=sse -fvisibility=hidden -fno-freestanding -std=c11 -o CMakeFiles/app.dir/src/main.c.obj -c /home/alealfaro/zephyrproject/zephyr/samples/hello_world/src/main.c",
  "file": "/home/alealfaro/zephyrproject/zephyr/samples/hello_world/src/main.c",
  "output": "/home/alealfaro/zephyrproject/build/CMakeFiles/app.dir/src/main.c.obj"
},
...
]
```

It simply is a database of the compilation flags used to build each file pulled into the build. Clangd uses this as input for its analysis which parses the files using clang frontend as it had compiled the source file itself. Clangd design documentation

Sounds simple? It is though there's many ways to hinder clangd's analysis and none of them are clearly errors but you might not get the desired behavior… so next section I will talk about the pitfalls as a way to teach some of the best practices and tricks to wield the power of Clangd for embedded

But with only that as context Clangd cant perform at its 100% capacity for an embedded codebase as there is a lot of assumptions done by Clangd that aren't always true or accurate. Once you have a base working you should look at the following inputs for Clangd:

1. **Location of `compile_commands.json`** - Managing this automatically and correctly is key for Clangd to give you any value.
2. **Toolchain Environment -** It needs to know about your compiler,system include headers paths, target-triple (i.e arm-none-eabi, riscv5-x86-elf)
3. **Tweaking the GCC flags for Clangd** - Some flags are stripped by Clangd when converting them from GCC flags that we want to add back

## Pitfall #1: Where Did the compile_commands.json Go?

Clangd by default will search for `compile_commands.json` by looking at each parent directory of the current source file being analyzed. It will also search under a directory named `build` at each parent too. More on this can be found in their [design docs](https://clangd.llvm.org/design/compile-commands#compilation-databases).

So here we have the first issue, depending on how you run your build command the `compile_commands.json` might not be found during the search all the time. If you run `west build -p -b <BOARD> <path/to/my/app>` from the root of the workspace without changing the naming of the build directory the search will work but this is inherently fragile. We need to figure out the best way to surface it to a place where it will be found for all source file we navigate to within our **current active application.**

>[!caution] Search for the `compile_commands.json` and analysis is triggered when the LSP attaches to the buffer of a source file (i.e opening a file for editing). That means **your project wont be analyzed as whole and instead analyzed file by file.**
>This affects the finding of references and definitions that are in other transalation units. But fear not, clangd has a good solution for this using a [Background Index Feature](https://clangd.llvm.org/design/#index).

You can go with the simple solution and symlink the file to the top of the workspace using the `west topdir` command:

```sh
ln -sf /path/to/build_dir/compile_commands.json “$(west topdir)/compile_commands.json”
```

If you tend to work on a single app , use only one build command per app and infrequently switch between different ones this might be enough. You do it once per app and that's it.

>[!tip]
>For those who want a more advanced way of achieving this and know some CMake black magic you can come up with several solution to symlink the file automatically after building an app. Here's a snippet I use within the app CMakeLists.txt:
>
> ```sh
>   execute_process(
>     COMMAND ${CMAKE_COMMAND} -E create_symlink ${CMAKE_BINARY_DIR}/compile_commands.json
>             ${WEST_TOPDIR}/compile_commands.json
>   )
> ```
>Conveniently, Zephyr always sets the `WEST_TOPDIR` CMake variable

## Pitfall #2: Making Clang and Embedded Toolchains Friends

Once Clangd has a `compile_commands.json`, but with only that as context Clangd cant perform at its 100% capacity for an embedded codebase as there is a lot of assumptions done by Clangd that aren't always true or accurate. Once you have a base working you should look at the following inputs for Clangd:

1. **Toolchain Environment -** It needs to know about your compiler,system include headers paths, target-triple (i.e arm-none-eabi, riscv5-x86-elf)
2. **Tweaking the GCC flags for Clangd** - Some flags are stripped by Clangd when converting them from GCC flags that we want to add back

I'm assuming that you have a Zephyr SDK installed already + have a working python environment with the package dependencies installed. For more info on how to setup Zephyr go to the [official docs](https://docs.zephyrproject.org/latest/develop/getting_started/index.html) on it.

>[!NOTE] If you don't use Zephyr at all the steps below translate to any toolchain. You would do the same steps for the Baremental GNU ARM toolchain or other toolchains.

For Clangd to get information on your toolchain it requires you to specify the location of said toolchain and use this CLI flag to specify the toolchain's compiler location with an **absolute path**:

>[_–query-driver_](https://releases.llvm.org/10.0.0/tools/clang/tools/extra/docs/clangd/Configuration.html#id2)
>
>Clangd makes use of clang behind the scenes, so it might fail to detect your standard library or built-in headers if your project is making use of a custom toolchain. That is quite common in hardware-related projects, especially for the ones making use of gcc (e.g. ARM’s arm-none-eabi-gcc).
>You can specify your driver as a list of globs or full paths, then clangd will execute drivers and fetch necessary include paths to compile your code.

Adding this flag is a must for working with ARM toolchains so we need to add it every time we invoke Clangd as a command within Neovim. We will need to make sure we have this location whenever we open Neovim within a west workspace and use it when calling `vim.lsp.config` to enable Clangd. Next section we will go over how to do this using environment variables that Zephyr already uses to detect the active toolchain

>[!tip] Using globs for C and C++ analysis
>Using a glob is useful when working with a C and C++ codebase, `--query-driver="prefix/to/toolchain/bin/arm-zephyr-eabi-g*` will allow Clangd to analyze your code with the right compiler depending on the language used in a file

### Zephyr SDK Installation Path

The default installation root for the Zephyr SDK is the home directory and every installed toolchain is suffixed with its version: `~/zephr-sdk-<VERSION>`. Not related to Clangd but important to set it up if you plan to use different version of the Zephyr SDK toolchain are the environment variable `ZEPHYR_SDK_INSTALL_DIR` and `ZEPHYR_TOOLCHAIN_VARIANT` and others you can read more about in the Zephyr docs. These provide the build system the location of the active toolchain.

>[!info] `ZEPHYR_TOOLCHAIN_VARIANT` is only relevant if you use a zephyr-sdk version equal or above to v1.0.0. This variable can allow you to switch between using the GNU (zephyr) toolchain or the new LLVM toolchain

Aside from those two a key variable that Zephyr will need always is `ZEPHYR_BASE` which you can provide in many ways but I prefer to just do explicitly and have the 3 within one source-able shell script to setup my environment at the top of the west workspace:

```sh
cat <<EOF> .env
export ZEPHYR_BASE="$(west topdir)/zephyr"
export ZEPHYR_TOOLCHAIN_VARIANT=zephyr
export ZEPHYR_SDK_INSTALL_DIR="$HOME/zephyr-sdk-1.0.0"
EOF
```

If you installed the toolchain somewhere else you will need to modify the path accordingly. Every time you enter the workspace you will need to source it `source .env` to make sure the environment variables are setup. Otherwise Clangd won't have the value of `--query-driver` expanded to the right path

### Aside - NCS Toolchain

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

## Pitfall #3: Clangd Vs GCC Flags

---

[^1]: If you want to know more go to there's no official doc or resource I found on this topic and the only way to do it is by doing some "reverse engineering" and connecting the dots. A good start is to look at the toolchains.json and the other json files within each toolchain directory
