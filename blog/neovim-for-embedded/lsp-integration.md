---
publish: true
title: LSP Integration
created: 2026 03 29
modified: 2026 04 11
---

Given that at the time of the writing of this blog the 0.12 Neovim release is finally out we will be using it for this guide and couple of its features. If you are interested in upgrading and/or trying to setup a brand new config or just want to follow this guide step by step take a look at the [[quick-start|Neovim Quick Start]]

## Clangd Installation

Clangd is the only viable option we have as a C/C++ language server. That's not to say it is a bad choice, but we will be dealing with Clang and LLVM when most embedded toolchains are GCC-based so there will be some friction. Clangd has all if not more features than the VS Code C/C++ Intellisense and the benefit of being open-source and having great ecosystem of tooling. Also if you aren't aware already ARM has released its new open-source ARM Cortex-M toolchain using LLVM and the Zephyr-SDK 1.0.0 release has officially added it as a second toolchain you can use for Zephyr projects!

Let's install Clangd using the method I suggested for [[quick-start#Installation|installing Neovim]] or you can use one of methods in the [docs](https://clangd.llvm.org/installation):

```sh
❯ mise use -g github:clangd/clangd
github:clangd/clangd@22.1.0         verify SLSA provenance                                                                                                                               ✔
mise ~/.config/mise/config.toml tools: github:clangd/clangd@22.1.0
mise +github:clangd/clangd@22.1.0

❯ which clangd
/home/alealfaro/.local/share/mise/installs/github-clangd-clangd/22.1.0/bin/clangd
```

## Neovim LSP Configuration

Once you have Clangd installed you can give it a try running it with your Neovim installation. If you have `nvim-lspconfig` as an active plugin (If you followed the [[quick-start|Quick start guide]] you should have it), Clangd should already be configured and you should be able to use it after enabling it.

```lua
vim.lsp.enable('clangd')
```

If not the you can add this lua table as configuration inside a new file `$MYVIMRC/after/lsp/clangd.lua` .

```sh
cd ~/.config/nvim
touch after/lsp/clangd.lua
```

```lua title:clangd.lua
---@type vim.lsp.Config
return {
  cmd = { 'clangd' },
  filetypes = { 'c', 'cpp', 'objc', 'objcpp', 'cuda' },
  root_markers = {
    '.clangd',
    '.clang-tidy',
    '.clang-format',
    'compile_commands.json',
    'compile_flags.txt',
    'configure.ac', -- AutoTools
    '.git',
  },
  capabilities = {
    textDocument = {
      completion = {
        editsNearCursor = true,
      },
    },
    offsetEncoding = { 'utf-8', 'utf-16' },
  },
  ---@param init_result ClangdInitializeResult
  on_init = function(client, init_result)
    if init_result.offsetEncoding then
      client.offset_encoding = init_result.offsetEncoding
    end
  end,
  on_attach = function(client, bufnr)
    vim.api.nvim_buf_create_user_command(bufnr, 'LspClangdSwitchSourceHeader', function()
      switch_source_header(bufnr, client)
    end, { desc = 'Switch between source/header' })

    vim.api.nvim_buf_create_user_command(bufnr, 'LspClangdShowSymbolInfo', function()
      symbol_info(bufnr, client)
    end, { desc = 'Show symbol info' })
  end,
}
```

I copy pasted it from `nvim-lspconfig` so it is pretty generic and good base.

Neovim configures and start our LSP client using **file type** and a **project root directory marker** as its main trigger event for it to start the LSP automatically. But as long as we open a C/C++ file Clangd should automatically start.

## Testing it Out

To try it out let's build the hello world example in Zephyr and see what it can do:

```sh
❯ west build -p -b reel_board zephyr/samples/hello_world
-- west build: making build dir /home/alealfaro/zephyrproject/build pristine
-- west build: generating a build system
...
❯ nvim zephyr/samples/hello_world/src/main.c
```

Now you might not see much after opening it. To do a direct check if clangd is running enter `:checkhealth vim.lsp` (while in normal mode) to get the Neovim internal diagnostics for its native LSP client:

```sh
vim.lsp:                                                                    ✅

- LSP log level : WARN
- Log path: /home/alealfaro/.local/state/nvim-minimax/lsp.log
- Log size: 115 KB

vim.lsp: Active Features ~
- document_color
  - Active buffers:

- folding_range
  - Active buffers:

- inline_completion
  - Active buffers:

- semantic_tokens
  - Active buffers:
      [2]: clangd (id: 1)

vim.lsp: Active Clients ~
- clangd (id: 1)
  - Version: clangd version 22.1.0 (https://github.com/llvm/llvm-project 4434dabb69916856b824f68a64b029c67175e532) linux+grpc x86_64-unknown-linux-gnu
  - Root directory: ~/zephyrproject/zephyr
  - Command: { "clangd" }
  - Settings: {}
  - Attached buffers: 2
vim.lsp: Enabled Configurations ~
- clangd:
  - capabilities: {
      offsetEncoding = { "utf-8", "utf-16" },
      textDocument = {
....
  - cmd: { "clangd" }
  - filetypes: c, cpp, objc, objcpp, cuda
  - get_language_id: <function @/home/alealfaro/.local/share/nvim-minimax/site/pack/core/opt/nvim-lspconfig/lsp/clangd.lua:77>
  - on_attach: <function @/home/alealfaro/.local/share/nvim-minimax/site/pack/core/opt/nvim-lspconfig/lsp/clangd.lua:95>
  - on_init: <function @/home/alealfaro/.local/share/nvim-minimax/site/pack/core/opt/nvim-lspconfig/lsp/clangd.lua:90>
  - root_markers = { '.clangd', '.clang-tidy', '.clang-format', 'compile_commands.json', 'compile_flags.txt', 'configure.ac','.git'},
```

This is looking great! The `vim.lsp` internal checks are looking good and also we got detailed info on clangd including a confirmation that it is attached to a buffer loaded with the file we opened (in my case `main.c` ).

```sh
vim.lsp: Active Clients ~
- clangd (id: 1)
  - Version: clangd version 22.1.0 (https://github.com/llvm/llvm-project 4434dabb69916856b824f68a64b029c67175e532) linux+grpc x86_64-unknown-linux-gnu
  - Root directory: ~/zephyrproject/zephyr
  - Command: { "clangd" }
  - Settings: {}
  - Attached buffers: 2
```

And also notice the root directory that clangd is using, it using the zephyr directory although I ran the build in the directory above it. Why? This is Neovim's (and ours) doing actually, we specified the root markers in the config in `after/lsp/clangd.lua` to be the following:

```lua
root_markers = {
  '.clangd',
  '.clang-tidy',
  '.clang-format',
  'compile_commands.json',
  'compile_flags.txt',
  'configure.ac', -- AutoTools
  '.git',
},
```

Zephyr has a `.clang_format` file and `.git` directory while the top of the workspace has none of those markers. No wonder Neovim is setting the project root to be the Zephyr top directory. Now this might not be a big deal know but it can be if we pull in other sources that are not under the root directory. We should try to fix this. A better set of root markers might be this:

```lua
root_markers = {
    '.clangd',
    'compile_commands.json',
    'build'
  },
```

If we change that in our config and restart Neovim (`:restart` if you are using 0.12) and do the health check again you should hopefully see that the root directory is the top of the workspace:

```sh
vim.lsp: Active Clients ~
- clangd (id: 1)
  - Version: clangd version 22.1.0 (https://github.com/llvm/llvm-project 4434dabb69916856b824f68a64b029c67175e532) linux+grpc x86_64-unknown-linux-gnu
- Root directory: ~/zephyrproject
```

---

## Noisy Diagnostics

Maybe you already noticed but there's the following diagnostics being flagged that have nothing to do with our code:

![[blog/images/lsp-integration-1.png]]

That's annoying. But it is easily fixable with by adding a `.clangd` configuration file to the top of the workspace. This file is used to tweak the compile flags extracted for the `compile_commands.json` to better fit our build environment. Clangd can't get it all right on the first try! Lets create one and add some fields that will help with false positives:

```yaml title:.clangd
CompileFlags
  Remove: [-fno-reorder-functions, -fno-printf-return-value, -mfp16-format=*]
```

This file uses an unconventional syntax so you might be fooled to think this is a unique format but in reality this just a YAML file underneath. What we are doing here is simply removing the compile flags that clangd doesn't recognize from the `compile_commands.json` parsing. If we try to open the `main.c` we should see that warnings are gone.

> [!tip] This file can also be defined globally per user or per project.
> In linux the path to this file should be `$XDG_CONFIG_HOME/clangd/config.yaml`. You can take a look at the paths that Clangd for Mac and Windows in their [docs](https://clangd.llvm.org/config#files)

---

## Conclusion

That should be it to get us the basic LSP integration that most people will be happy with. The following features should now work whenever we open a file that is being compiled as part of our app:

- Go to definition/declaration
- Go to implementation and references
- Diagnostics and code actions to fix them
- Completions using Neovim's native completion and MiniCompletion for signature help and snippet support ([[quick-start|if you followed the guide here]])

Now there might be additional work to be done to get this features to work as you like them but that will be all in terms of getting you started with the first big piece of the puzzle to working with Zephyr and any other embedded project using Neovim! I have written couple sections that go into about some issues that you can encounter and some tweaks and improvements. I encourage you to read on if you feel like you are still lacking features or are having issues with Clangd working with your setup.

[[#Issue You are getting tons of missing reference errors and other related diagnostics as soon as you open a file]]

[[#Issue Esoteric errors like unknown flags, warnings due to macros such as `LOG_INF` and just noisy diagnostics in general]]

[[#Issue `stdio.h` and other libc headers not found or the correct implementation is not being picked up (i.e using `/usr/lib` instead of your toolchains)]]

[[#Diagnostics configuration]]

[[#Completions with Signature help and snippets]]

---

## Issue: You are getting tons of missing reference errors and other related diagnostics as soon as you open a file

**Cause:** Most likely the `compile_commands.json` is not found by Clangd due to your build directory not being at the top of the workspace or named differently

**Solution:** Symlink your build directory `compile_commands.json` to the root of the workspace or project

Clangd by default will search for `compile_commands.json` by looking at each parent directory of the current source file being analyzed. It will also search under a directory named `build` at each parent too. More on this can be found in their [design docs](https://clangd.llvm.org/design/compile-commands#compilation-databases).

Depending on how you run your build command the `compile_commands.json` might not be found during the search all the time. If you run `west build -p -b <BOARD> <path/to/my/app>` from the root of the workspace without changing the naming of the build directory the search will work but this is inherently fragile. as the build directory is not going to be always called `build` nor be at the top of the workspace (though this is a good idea and how Zephyr west build command is usually ran in the docs).

> [!caution] Search for the `compile_commands.json` and the analysis is triggered when the LSP attaches to the buffer of a source file (i.e opening a file for editing). That means **your project wont be analyzed as whole and instead analyzed file by file.**
> This is important to understand as it affects the startup and finding of references and definitions that are in other translation units. But fear not, clangd has a good solution for this using a [Background Index Feature](https://clangd.llvm.org/design/#index).

You can go with the simple solution and symlink the file to the top of the workspace using the `west topdir` command:

```sh
ln -sf /path/to/build_dir/compile_commands.json “$(west topdir)/compile_commands.json”
```

If you tend to work on a single app , use only one build command per app and infrequently switch between different ones this might be enough. You do it once per app and that's it.

> [!tip]
> For those who want a more advanced way of achieving this and know some CMake black magic you can\
> come up with several solution to symlink the file automatically after building an app.
> Here's a snippet I use within the app CMakeLists.txt:
>
> ```cmake
> execute_process(
>   COMMAND ${CMAKE_COMMAND} -E create_symlink ${CMAKE_BINARY_DIR}/compile_commands.json
>           ${WEST_TOPDIR}/compile_commands.json
> )
> ```
>
> Conveniently, Zephyr always sets the `WEST_TOPDIR` CMake variable

## Issue: Esoteric errors like unknown flags, warnings due to macros such as `LOG_INF` and just noisy diagnostics in general

**Cause:** Many reasons, as it depends heavily on your toolchain and what your target platform is.

**Solution**: The issue is broad so cant give specifics and some of this are minor nuisances so you might be fine not fixing them at all. Start by always modifying the `.clangd` compile flags and trying the following:

1. Removing the "unknown flags" that are showing up in errors
2. Adding a target-triple flag matching the target platform
3. If you work with C++ as well as C in your project you will need to filter/add C++ flags for the C++ sources and similarly with C flags and C sources.

The advice above is shown best by an example `.clangd` instead of explaining:

```yaml
CompileFlags:
    # Specifying target triple for an ARM Cortex M33 SoC (nRF52840)
    Add: [--target=thumbv7m-unknown-none-eabi]
    # Removing unknown flags by clang
    Remove: [-fno-reorder-functions, -fno-printf-return-value, -mfp16-format=*]
---
If: # Apply this config conditionally
    PathMatch: [.*\.h, .*\.c] # to all headers OR c files
    PathExclude: framework/.* # except all files within "framework" (C++ project)
CompileFlags:
    # Adding C flags for C23 and upping the diagnostics on some common C issues and supprssing some that I dont care about (no initializers override)
    Add: [-std=c23, -Wpointer-arith, -Werror=implicit-int, -Wno-initializer-overrides]
---
# Do the same thing for C++ sources
If:
    PathMatch: [.*\.hpp, .*\.cpp]
CompileFlags:
    Add: [-std=c++20]
Diagnostics:
    Suppress: [-Wimplicit-enum-enum-cast, -Wvla-cxx-extension]
```

## Issue: `stdio.h` and other libc headers not found or the correct implementation is not being picked up (i.e using `/usr/lib` instead of your toolchains)

**Cause:** Clangd can't figure out the locations of this standard libraries from your compile flags and goes for the ones your system installation clang uses.

**Solution:** Specify manually adding `-I/path/to/my/lib` to your `.clangd`OR a even better solution is to let Clangd figure it our by having it query your target's compiler using the `--query-driver` **Clangd flag**.

> [!caution] `--query-driver` is not a compiler flag so adding it to a `.clangd` is not going to work. You must pass it to `clangd` through Neovim's LSP client.

For Clangd to get information on your toolchain it requires you to specify the path to your compiler and using an **absolute path that can use globbing**. Below is what the docs say about this flag:

> [_–query-driver_](https://releases.llvm.org/10.0.0/tools/clang/tools/extra/docs/clangd/Configuration.html#id2)
>
> Clangd makes use of clang behind the scenes, so it might fail to detect your standard library or built-in headers if your project is making use of a custom toolchain. That is quite common in hardware-related projects, especially for the ones making use of gcc (e.g. ARM’s arm-none-eabi-gcc).
> You can specify your driver as a list of globs or full paths, then clangd will execute drivers and fetch necessary include paths to compile your code.

Easiest way to add this is to use a glob that captures all of the possible paths of your toolchain's compiler when you are working on your workspace. I work only with Zephyr and have all my toolchain versions in one location so I normally hardcode this into the config that is set in `after/lsp/clangd.lua`. The Zephyr toolchain installation directory looks someting like this:

```sh
 ❯ tree -L4 --prune ~/zephyr-sdk-root
/home/alealfaro/zephyr-sdk-root
├── zephyr-sdk-0.17.0
...
├── zephyr-sdk-0.17.4
│   ├── arm-zephyr-eabi
│   │   ├── bin
│   │   │   ├── arm-zephyr-eabi-addr2line
│   │   │   ├── arm-zephyr-eabi-ar
│   │   │   ├── arm-zephyr-eabi-as
│   │   │   ├── arm-zephyr-eabi-c++
│   │   │   ├── arm-zephyr-eabi-cc -> arm-zephyr-eabi-gcc
│   │   │   ├── arm-zephyr-eabi-c++filt
│   │   │   ├── arm-zephyr-eabi-cpp
│   │   │   ├── arm-zephyr-eabi-ct-ng.config
│   │   │   ├── arm-zephyr-eabi-elfedit
│   │   │   ├── arm-zephyr-eabi-g++
│   │   │   ├── arm-zephyr-eabi-gcc
│   │   │   ├── arm-zephyr-eabi-gcc-12.2.0
│   │   │   ├── arm-zephyr-eabi-gcc-ar
│   │   │   ├── arm-zephyr-eabi-gcc-nm
│   │   │   ├── arm-zephyr-eabi-gcc-ranlib
│   │   │   ├── arm-zephyr-eabi-gcov
│   │   │   ├── arm-zephyr-eabi-gcov-dump
│   │   │   ├── arm-zephyr-eabi-gcov-tool
│   │   │   ├── arm-zephyr-eabi-gdb
│   │   │   ├── arm-zephyr-eabi-gdb-add-index
│   │   │   ├── arm-zephyr-eabi-gdb-add-index-py
│   │   │   ├── arm-zephyr-eabi-gdb-py
│   │   │   ├── arm-zephyr-eabi-gprof
│   │   │   ├── arm-zephyr-eabi-gprof-py
│   │   │   ├── arm-zephyr-eabi-ld
│   │   │   ├── arm-zephyr-eabi-ld.bfd
│   │   │   ├── arm-zephyr-eabi-lto-dump
│   │   │   ├── arm-zephyr-eabi-nm
│   │   │   ├── arm-zephyr-eabi-objcopy
│   │   │   ├── arm-zephyr-eabi-objdump
│   │   │   ├── arm-zephyr-eabi-ranlib
│   │   │   ├── arm-zephyr-eabi-readelf
│   │   │   ├── arm-zephyr-eabi-size
│   │   │   ├── arm-zephyr-eabi-strings
│   │   │   └── arm-zephyr-eabi-strip
│   │   └── lib
│   │       ├── libcc1.so -> libcc1.so.0.0.0
│   │       ├── libcc1.so.0 -> libcc1.so.0.0.0
│   │       └── libcc1.so.0.0.0
│   ├── cmake
│   │   ├── zephyr
...
```

I have multiple versions of the Zephyr SDK 0.17 and 0.17.4 and use the `arm-zephyr-eabi` toolchain, yours might be different. The glob to pick up all the versions of `arm-zephyr-eabi-gcc`would look something like this:

```sh
--query-driver="/home/alealfaro/**/arm-zephyr-eabi/bin/arm-zephyr-eabi-g*"
```

> [!tip] Using globs for C and C++ analysis
> Using a glob is useful when working with a C and C++ codebase, `--query-driver="prefix/to/toolchain/bin/arm-zephyr-eabi-g*` will allow Clangd to analyze your code with the right compiler depending on the language used in a file

I can pass it to Neovim like that and have it expand it when the LSP first attaches:

```lua
---@type vim.lsp.Config
return {
  cmd = {
    'clangd',
     '--query-driver=/home/alealfaro/**/arm-zephyr-eabi/bin/arm-zephyr-eabi-g*'
  },
...
```

> [!warning] Do not use `~` or environment variables in your strings that get passed as command. They wont' get expanded!

---

Leaving some useful code snippets targeted for specific areas that can be improved in the LSP configuration

## Diagnostics configuration

A solid baseline:

````lua
```lua
vim.diagnostic.config {
  severity_sort = true,
  float = {
    border = 'rounded',
    source = 'if_many',
    underline = true,
  },
  virtual_text = {
    spacing = 2,
    source = 'if_many',
    prefix = 'o',
  },
  -- Disable signs in the gutter.
  signs = {
    text = {
      [vim.diagnostic.severity.ERROR] = 'E',
      [vim.diagnostic.severity.WARN] = 'W',
      [vim.diagnostic.severity.INFO] = 'I',
      [vim.diagnostic.severity.HINT] = 'H',
    },
  },
}
````

## Completions with Signature help and snippets

I have to say that the Neovim native completion can be better and is also so confusing to know what does what. I just edited slightly the default configuration from [[quick-start]] to add:

1. Different key maps for triggering the second step or fallback completion sources (i.e snippets or other completion sources)
2. Fuzzy filtering
3. Larger delay for better sources being matched. Counter intuitive I know but this is how the Neovim completion system works :/

```lua
  -- Customize post-processing of LSP responses for a better user experience.
  -- Don't show 'Text' suggestions (usually noisy) and show snippets last.
  local process_items_opts = { filtersort = 'fuzzy', kind_priority = { Text = -1, Snippet = 99 } }
  local process_items = function(items, base)
    return MiniCompletion.default_process_items(items, base, process_items_opts)
  end

  require('mini.completion').setup {
    delay = { completion = 300, info = 300, signature = 300 },
    lsp_completion = {
      auto_setup = false,
      -- Without this config autocompletion is set up through `:h 'completefunc'`.
      -- Although not needed, setting up through `:h 'omnifunc'` is cleaner
      -- (sets up only when needed) and makes it possible to use `<C-u>`.
      source_func = 'omnifunc',
      -- A function which takes LSP 'textDocument/completion' response items
      -- (each with `client_id` field for item's server) and word to complete.
      -- Output should be a table of the same nature as input. Common use case
      -- is custom filter/sort. Default: `default_process_items`
      process_items = process_items,

      -- A function which takes a snippet as string and inserts it at cursor.
      -- Default: `default_snippet_insert` which tries to use 'mini.snippets'
      -- and falls back to `vim.snippet.expand` (on Neovim>=0.10).
      snippet_insert = function(snippet)
        local insert = MiniSnippets.config.expand.insert or MiniSnippets.default_insert
        return insert { body = snippet }
      end,
    },

    -- Fallback action as function/string. Executed in Insert mode.
    -- To use built-in completion (`:h ins-completion`), set its mapping as
    -- string. Example: set '<C-x><C-l>' for 'whole lines' completion.
    -- fallback_action = '<C-x><C-l>',

    -- Module mappings. Use `''` (empty string) to disable one. Some of them
    -- might conflict with system mappings.
    mappings = {
      -- Force two-step/fallback completions
      force_twostep = '<A-Space>',
      force_fallback = '<A-y>',

      -- Scroll info/signature window down/up. When overriding, check for
      -- conflicts with built-in keys for popup menu (like `<C-u>`/`<C-o>`
      -- for 'completefunc'/'omnifunc' source function; or `<C-n>`/`<C-p>`).
      scroll_down = '<C-PageDown>',
      scroll_up = '<C-PageUp>',
    },
  }
```

One interesting things is that you can also specify the priority of the completion "kinds":

```lua
CompletionItemKind = {
  Text = 1,
  Method = 2,
  Function = 3,
  Constructor = 4,
  Field = 5,
  Variable = 6,
  Class = 7,
  Interface = 8,
  Module = 9,
  Property = 10,
  Unit = 11,
  Value = 12,
  Enum = 13,
  Keyword = 14,
  Snippet = 15,
  Color = 16,
  File = 17,
  Reference = 18,
  Folder = 19,
  EnumMember = 20,
  Constant = 21,
  Struct = 22,
  Event = 23,
  Operator = 24,
  TypeParameter = 25,
},
```
