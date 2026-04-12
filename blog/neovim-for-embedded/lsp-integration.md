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

Now there might be additional work to be done to get this features to work as you like them but that will be all in terms of getting you started with the first big piece of the puzzle to working with Zephyr and any other embedded project using Neovim! I have written couple sections that go into more of the tweaking and improvements one can do below, I encourage you to read on if you feel like you are still lacking features or are having issues with Clangd working with your setup.

## [[clangd-pitfalls|TBD]]
