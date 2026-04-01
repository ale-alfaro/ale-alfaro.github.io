---
title: Neovim as your Embedded IDE - LSP Integration
date: 2026-03-29
modified: 2026-03-29 18:13
---

In this entry we will learn how to do LSP integration, which might be the biggest quality of life improvement modern IDEs provide. At a later point I might cover the other two.

Given that at the time of the writing of this blog Neovim is about to release its 0.12 version which has couple handy features that we can use to get us started, I will be using the nightly version of Neovim which has all of these features and is pretty stable at this point. We also will be using vim.pack, Neovim's native plugin manager, for minimal use of 3rd party plugins in our config[^1]


## Clangd and LSP integration

Now to the good stuff. Clangd is the only viable option we have as a C/C++ language server. That’s not to say it is a bad choice, but we will be dealing with Clang and LLVM when most embedded toolchains are GCC-based so there will be some friction. Clangd has all if not more features than the VS Code C/C++ Intellisense and the benefit of being open-source and having great ecosystem of tooling. Also if you aren't aware already ARM has released its new open-source ARM Cortex-M toolchain using LLVM and the Zephyr-SDK 1.0.0 release has officially added it as a second toolchain you can use for Zephyr projects!

Let's install clangd using the method I suggested in the [[Neovim 0.12 Quick Start|Neovim Quick Start Guide]] or you can use one of methods in the clangd [docs](https://clangd.llvm.org/installation):

```sh
❯ mise use -g github:clangd/clangd
github:clangd/clangd@22.1.0         verify SLSA provenance                                                                                                                               ✔
mise ~/.config/mise/config.toml tools: github:clangd/clangd@22.1.0
mise +github:clangd/clangd@22.1.0

❯ which clangd
/home/alealfaro/.local/share/mise/installs/github-clangd-clangd/22.1.0/bin/clangd
```

Clangd has 2-3 configuration requirements:

1. **Toolchain Environment -** It needs to know about your toolchain (i.e the gcc executable location, system include paths, etc)

2. **Application/Project Build Steps -** How your project/application was compiled in the form of a database called compile_commands.json. This database simply contains a mapping of the source files to the gcc or clang command was used to compile that source.

3. **Optional Tweaking and Customization** - Additional customization in the form of yaml file to add/remove compiler flags for certain sources and other settings. This is I recommend to avoid noisy diagnostics. More on that later

## Clangd - Toolchain Environment Settings

Our running example will be using the Zephyr-SDK toolchain and a Zephyr in-tree sample using the `native_sim` board. Let's start a quick Zephyr project:

```sh
!#/usr/bin/env bash

set -euo pipefail

# ── Create a temp workspace with the minimal manifest.yaml to build a sample ─────────────────────────────────────────────
WORKSPACE="/tmp/workspace"
mkdir "${WORKSPACE}/app"
cat > "${WORKSPACE}/app/west.yml" <<YAML
manifest:
  remotes:
    - name: zephyrproject-rtos
      url-base: https://github.com/zephyrproject-rtos
  projects:
    - name: zephyr
      remote: zephyrproject-rtos
      revision: main
      clone-depth: 1
      import:
        name-allowlist:
          - cmsis

  self:
    path: app
YAML

# ── West init & update ─────────────────────────────────────────────
cd "${WORKSPACE}"
west init -l .
west update --narrow
west config zephyr.base "${WORKSPACE}/zephyr"
```

I'm assuming that you have a Zephyr-SDK installed already + have a working python environment with the package dependencies installed. For more info on how to setup Zephyr go to the [official docs](https://docs.zephyrproject.org/latest/develop/getting_started/index.html) on it.

> [!NOTE] If you don't use Zephyr at all the steps below translate to any toolchain. You would do the same steps for the Baremental GNU ARM toolchain or other toolchains.

For Clangd to get information on your toolchain it requires you to specify the location of said toolchain and use this CLI flag to specify the toolchain's compiler location with an **absolute path**:

> [_–query-driver_](https://releases.llvm.org/10.0.0/tools/clang/tools/extra/docs/clangd/Configuration.html#id2)
>
> Clangd makes use of clang behind the scenes, so it might fail to detect your standard library or built-in headers if your project is making use of a custom toolchain. That is quite common in hardware-related projects, especially for the ones making use of gcc (e.g. ARM’s arm-none-eabi-gcc).

This last part comes in handy when we work with multiple toolchain installations with different prefixes:

> You can specify your driver as a list of globs or full paths, then clangd will execute drivers and fetch necessary include paths to compile your code.

If you followed the quick start guide from Zephyr and kept the default installation path for the Zephyr-SDK you should have the different version of the toolchain installed in `~/zephr-sdk-<VERSION>`. Zephyr has an environment variable that it checks for the location of Zephyr-SDK installation `ZEPHYR_SDK_INSTALL_DIR` which provides a lot more flexibility than relying on a hardcoded value so we will be setting that to the location of the toolchain:

```sh
> export ZEPHYR_SDK_INSTALL_DIR="/home/alealfaro/zephyr-sdk-1.0.1"
```

I work with the NCS flavor of Zephyr which also ships with its own toolchain managed by Nordic's own utility, `nrfutil` and as non VS Code I have had to deal with the pain of figuring how Nordic manages the Zephyr SDK toolchains and their location. In my search I found a command that can give us that information and more:

```sh
 ❯ nrfutil toolchain-manager env --as-script
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

That's nice! We only care about the two variables at the bottom and the rest we can ignore:

```sh
export ZEPHYR_TOOLCHAIN_VARIANT=zephyr
export ZEPHYR_SDK_INSTALL_DIR=/home/alealfaro/ncs/toolchains/43683a87ea/opt/zephyr-sdk
```

[!note] `ZEPHYR_TOOLCHAIN_VARIANT` is only relevant if you use a zephyr-sdk version equal or above to v1.0.0. This variable can allow you to switch between using the GNU (zephyr) toolchain or the new LLVM toolchain

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
│   │   ├── arm-zephyr-eabi-g++ <------- g++
│   │   ├── arm-zephyr-eabi-gcc <------- gcc
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

Zephyr-SDK

The NCS toolchain only ships with arm-zephyr-eabi target-specific toolchain. so your installation might vary but the directory structure should be the same for all toolchains. Now that we know where the location of the gcc compiler is we can create a glob as an input for the `--query-driver` flag:

```
--query-driver="$ZEPHYR_SDK_INSTALL_DIR/**/bin/arm-zephyr-eabi-gcc
```

## Clangd - Project or App Level Settings

For clangd to know about your project we need the compilation database `compile_commands.json`. Thankfully Zephyr generates this artifact already by default and is located inside the build directory of your application.

The trick though is that for Clangd to recognize the compile_commands.json you need to either 1) point to the location of this file in your project-level config OR 2) have the location of the file be in the root of the project/app. Personally I find 2 to be much easier and flexible when working with multiple apps at the same time so we will go with that approach.

We need to make sure our project has the compile_commands.json in what we want to make our root of the project, i.e the west workspace root or top directory. The simplest way to achieve this is by symlinking the file from the build directory to the west workspace root which can be conveniently fetched using `west topdir` command when called inside a west workspace. The command below gets the job done:

```sh
ln -sf /path/to/build_dir/compile_commands.json “$(west topdir)/compile_commands.json”
```

With this command your app and clangd can be synchronized as long as the build directory doesn’t change. I find it hard to remember to do this everytime I’m switching between applications so to automate this process for every app I add this CMake snippet in the CMakeLists.txt of the application directory:

```sh
  execute_process(
    COMMAND ${CMAKE_COMMAND} -E create_symlink ${CMAKE_BINARY_DIR}/compile_commands.json
            ${WEST_TOPDIR}/compile_commands.json
  )
```

> Conveniently, Zephyr sets the `WEST_TOPDIR` CMake variable every build so we can use it

Additionally we can specify a Clangd config file named `.clangd` in the west topdir to help clangd with finding the location of the root and also adding couple settings that help with noisy diagnostics that Zephyr ha

```bash
cat << EOF > "$(west topdir)/.clangd"
CompileFlags:
  Add: -Wno-unknown-warning-option
  Remove: [-m*, -f*]
EOF
```

## Clangd - Neovim LSP Config

The final step to get LSP integration is to have Neovim configure and start our LSP client whenever it detects a C or C++ file when opening a file in a buffer.

1. Go to your Neovim config (inside `~/.config/nvim`) and create a new file called `clangd.lua` under the `after/lsp` folder:

```sh
cd ~/.config/nvim
touch after/lsp/clangd.lua
```

2. Open the file and let’s add a lua table which is simply a primitive type in Lua that is analogous to map or dictionary in other languages and add the following:

```lua
-- Specify the common flags that clangd should have for all projects
---@type string[]
local clangd_cmd = {
	"clangd",
	"--background-index",
	"--enable-config",
	"--clang-tidy",
	"--header-insertion=iwyu",
	"--completion-style=detailed",
	"--fallback-style=llvm",
	"--log=error",
}

---@return vim.lsp.Config
return {
	filetypes = { "c", "cpp" },
	-- Add compile_commands.json as the first choice for root marker and have fallbacks in case it is not found
	root_markers = {
		"compile_commands.json",
		".clangd",
		".clang-tidy",
		".clang-format",
	},
	-- Specify project specific modifications to the clangd cmd here before we initialize the LSP client using the full command
	-- Here we will append the --query-driver flag with the path to arm-zephyr-eabi-gcc dynamically so we don't need to specify it per project
	before_init = function(_, config)
		-- Initialize the clangd command to a common set of flags
		config.cmd = clangd_cmd
		-- 1st method uses the environment variables found in the shell
		local envs = vim.fn.environ()
		-- 2nd method uses the executables found in PATH
		local compiler = vim.fn.executable("arm-zephyr-eabi-gcc") and vim.fn.exepath("arm-zephyr-eabi-gcc") or ""
		local query_driver_value = nil
		-- 1. If ZEPHYR_SDK_INSTALL_DIR is set glob to find the arm-zephyr-eabi-gcc within the toolchain
		if envs["ZEPHYR_SDK_INSTALL_DIR"] ~= nil then
			query_driver_value =
				string.format("%s/arm-zephyr-eabi/bin/arm-zephyr-eabi-g*", envs["ZEPHYR_SDK_INSTALL_DIR"])
		-- 2. Otherwise check if the arm-zephyr-eabi-gcc was found as an executable it PATH and use the exepath result for the exact location
		elseif type(compiler) == "string" and vim.uv.fs_stat(compiler) then
			query_driver_value = compiler:gsub("gcc$", "g*")
		else
			VimRc.warn("Can't find compiler to query or is not a valid path")
		end
		-- If the query-driver flag could be set, append to the command array
		if query_driver_value then
			VimRc.info("Clangd adding flag " .. query_driver_value)
			config.cmd[#config.cmd + 1] = "--query-driver=" .. query_driver_value
		end

		-- No need to return a value, the config arg is path by reference
	end,
	init_options = {
		usePlaceholders = true,
		completeUnimported = true,
	},
}
```

That should be it to get us the basic LSP integration that most people will be happy with. The following features should now work whenever we open a file that is being compiled as part of our app:

- Go to definition/declaration
- Go to implementation and references
- Diagnostics and code actions to fix them
- Code Completions

Now there might be additional work to be done to get this features to work as you like them but that will be all in terms of getting you started with the first big piece of the puzzle to working with Zephyr and any other embedded project using Neovim

[^1]: I personally prefer a more conservative use of plugins and making my own little scripts or modules to do exactly what I want. . There's Neovim full-on distributions that try to give you all the bells and whistles of an IDE such as LazyVim. Feel free to check it out if that's what you feel it will make you use Neovim more

[^2]: Lua is an embeddable, simple to use programming language and is the preferred method to configure Neovim. More info on Lua and how it can be used in Neovim can be found in the Neovim [help section](https://neovim.io/doc/user/luaref/) on Lua

[^2]: More info in the README in the [repo](https://github.com/jrop/nvimv)

[^3]: See the docs for more info on [Zephyr SDK](https://docs.zephyrproject.org/latest/develop/toolchains/zephyr_sdk.html#zephyr-sdk)


---
