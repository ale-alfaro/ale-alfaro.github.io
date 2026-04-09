---
publish: true
title: Neovim Quick Start
created: 2026-03-29
modified: 2026-03-29 16:51
---

# Quick-start

Neovim 0.12 has couple handy features that we can use to add the [[blog/neovim-for-embedded/index#What Does a Great Editor/IDE Require?|editor features]] I listed previously all natively and minimize the usage of third party plugins and adding too much to a starter config so I **strongly recommend** that if you are starting a new config you use it. Additionally will be using vim.pack, Neovim's native plugin manager, so we don't have to use lazy.nvim or other plugin managers[^1]

## Installation

There's many ways to install Neovim all listed in the official [website](https://neovim.io/doc/install) but I'm going to show one more way to do it. Not because I want to be cool and edgy but because the way I will show is how I manage **most of my development tools both on Mac and Linux including python packages, rust-based CLIs, etc**. Not only that but [Mise](https://mise.jdx.dev/),the one and only tool manager, can also be a environment variable manager and even a task runner. I have to say this has me excited as hell specially as I like to try out tools and move between projects with different tooling requirements constantly. I will stop preaching and just show the goods so this is how you install mise (after you inspected the shell script coming from a stranger from the internet of course) :

```sh
❯ curl https://mise.run | sh

  % Total    % Received % Xferd  Average Speed  Time    Time    Time   Current
                                 Dload  Upload  Total   Spent   Left   Speed
100  10670 100  10670   0      0 118.9k      0                              0
mise: installing mise...
######################################################################## 100.0%
mise: installed successfully to /home/alealfaro/.local/bin/mise
mise: run the following to activate mise in your shell:
echo "eval \"\$(/home/alealfaro/.local/bin/mise activate zsh)\"" >> "/home/alealfaro/.config/zsh/.zshrc"

mise: run `mise doctor` to verify this is set up correctly
```

After installing you can follow the instructions outputted by Mise and add to your `.zshrc` a line that will activate mise every time you start a new interactive shell: `eval "$(~/.local/bin/mise activate zsh)"` or for bash users `eval "$(~/.local/bin/mise activate bash)"` to your `.bashrc`. This will add Mise to your path and any tools installed and managed by mise.

Once that is done, this is how you install Neovim with Mise:

```sh
❯ mise use -g neovim@0.12

mise Downloading https://github.com/neovim/neovim/releases/download/v0.12.0/nvim-linux-x86_64.tar.gz
mise Verifying "/home/alealfaro/.local/share/mise/downloads/neovim-0.12.0/nvim-linux-x86_64.tar.gz" checksum
mise Extracting "/home/alealfaro/.local/share/mise/downloads/neovim-0.12.0/nvim-linux-x86_64.tar.gz" to "/home/alealfaro/.local/share/mise/installs/neovim/0.12.0"
neovim@0.12.0 install ✔
mise ~/.config/mise/config.toml tools: neovim@0.12.0
mise +neovim@0.12.0
```

Lets give a try to your new Neovim installation to see that all is working well. If you have mise active in your path you can simply do:

```sh
nvim
```

And you should see the friendly welcome screen:

![[blog/images/neovim-for-embedded-welcome.png]]

That's it. Couple things I want to point out:

- This is an OS-agnostic way to install tools as well as shell-agnostic
- It will write a line into your `.bashrc`/`.zshrc` for activating itself which what it really does is change your path so the tools installed through Mise are prepended first and are the ones your shell will invoke
- Tools can be managed through `mise use` and `mise unuse` commands. `-g` is for global installations and the format for tools is `<TOOL>@<VERSION>`

> [!TIP] Mise can also run neovim without modifying your PATH and install it on demand using `mise x nvim@0.12 -- nvim`
> This will install the neovim executable into the mise managed installation directories but not change your path. It will remain locally until you decide to clear the mise cache with `mise cache clear`

If you go this route, read more on what Mise can do and give it a try and install some of your favorite utilities. I do mostly Zephyr development and for me the tool I manage the most with mise is Python and Python CLI and package dependencies.Not all tools that you might want for embedded are going to be supported the biggest one being your target's toolchain. If you work on Zephyr or the Nordic flavored Zephyr I am working on two Mise plugin to manage the Zephyr-SDK and NCS installation and set env variables when using them automatically so stay tuned!

## Config

> [!warning]
> If you are new to Neovim I **strongly** suggest that you take some time to learn couple topics:
>
> - Vim keymaps and Vim modal editing. If you enter `:Tutor` as soon as you start Neovim you will enter the official tutorial page where you can learn the essentials
> - Lua and neovim's Lua API for configuration writting (this you could delegate to an AI agent but it won't be YOUR config until you learn how to change it yourself)
> - Motivation to learn, patience at being slow at doing your work for a while and have your other editor ready available in case you are stuck or feel yourself burning out. It took me two attempts to fully switch to Neovim and had VS Code at hand for the things I hadn't figured out yet how to do.

The fastest way get us to the good stuff and writing embedded code in Neovim will be to use a minimal preset that will do the essentials for us and have the foundation for us to add the Embedded specific tweaks to the config. One I like and supports the 0.12 version of Neovim is [MiniMax](https://nvim-mini.org/MiniMax/) by the creator of a family of small, independent plugins that can also be installed as one: [mini.nvim](https://nvim-mini.org/mini.nvim/) . I encourage to check it out and read the comments laid across the files of the config. Following the README, to install we do:

```sh
# Download
git clone --filter=blob:none https://github.com/nvim-mini/MiniMax ./MiniMax

# Set up config (copies config files and possibly initiates Git repository)
NVIM_APPNAME=nvim-minimax nvim -l ./MiniMax/setup.lua
```

> [!note] The method above is recommended by the creator of MiniMax but it is meant for trying out MiniMax and not overriding an already existing configuration.
> If you are installing Neovim for the first time and do not have an existing config, you can remove the `NVIM_APPNAME=nvim-minimax` from `NVIM_APPNAME=nvim-minimax nvim -l ./MiniMax/setup.lua` so it becomes your default config and can call Neovim by its bin name only.
>
> I still recommend trying it out first before making it your default config in case it is far from your taste. If you decide to use it as an alternative config might as well add an alias to call it `alias minimax='NVIM_APPNAME=nvim-minimax nvim`

Once that is done, open Neovim with the newly installed config using the recommended way in the README if you followed it:

```sh
# Start Neovim
NVIM_APPNAME=nvim-minimax nvim

# On Neovim>=0.12 press `y` to confirm installation of all listed plugins
# Wait for plugins to install (there should be no new notifications)

# Enjoy your new config!
# Start with reading its files. Type `<Space>`+`e`+`i` to open 'init.lua'.
```

![[blog/images/neovim-for-embedded-mnimax-welcome.png]]

You should have now a working installation of Neovim with a good foundation to start customizing!

---

## Additional Tweaks and Customizations

Once you open up your new Neovim installation with MiniMax you might notice couple rough edges or choices that the author took that don't go with your taste such as the color-scheme, key mappings, etc. Below I quickly show the hot-spots of customization and the customization I personally did.

> [!hint] Couple Keymaps to Know out of the Gate
> All of these are in normal mode (default mode and when cursor is a block). Leader is set to the `<space>` key/bar by default
>
> - Most important of them of all - `ZZ` for save and quit (`:wq`)
> - Restart Neovim with `<leader>sR` to refresh your config and have any changes to your config apply
> - To open files of your neovim config instantly at hit:
>   - `<leader>eo` for `10_options.ua`
>   - `<leader>ek` for `20_keymaps.lua`
>   - `<leader>em` for `30_mini.lua` and `<leader>ep` for `40_plugins.lua`

### Options (10\_options.lua)

Add system clipboard as the default yank (copy) register

```lua
vim.o.clipboard = 'unnamedplus'
```

### Keymappings (20\_keymaps.lua)

Some basic ones that are missing for me:

```lua
---@param mode (string|string[])?
---@param lhs string
---@param rhs string|fun(args:table)
----@param opts vim.keymap.set.Opts?
local function map(lhs, rhs, mode, opts)
  vim.validate('mode', mode, { 'string', 'table' }, true)
  vim.validate('lhs', lhs, 'string')
  vim.validate('rhs', rhs, { 'string', 'function' })
  vim.validate('opts', opts, 'table', true)
  opts = opts or {}
  mode = mode or 'n'
  vim.keymap.set(mode, lhs, rhs, opts)
end
map('q', '<nop>', nil, { noremap = true })
map('<C-s>', '<Cmd>silent! update | redraw<CR>', nil, { desc = 'Save', noremap = true })
map('<C-s>', '<Esc><Cmd>silent! update | redraw<CR>', { 'x', 'i' }, { desc = 'Save and go to Normal mode', noremap = true })
map('<M-r>', '<Cmd>restart<CR>', nil, { desc = 'Restart', noremap = true })
map('<C-q>', '<Cmd>q<CR>', nil, { desc = 'Quit', noremap = true })

-- Misc
map('j', 'gj', { 'n', 'x' }, { desc = 'Navigate down (visual line)' })
map('k', 'gk', { 'n', 'x' }, { desc = 'Navigate up (visual line)' })
map('<Down>', 'gj', { 'n', 'x' }, { desc = 'Navigate down (visual line)' })
map('gk', '<Up>', { 'n', 'x' }, { desc = 'Navigate up (visual line)' })
map('<', '<gv', 'v')
map('>', '>gv', 'v')
map('<C-Left>', '<C-w>h', nil, { desc = 'Focus window left' })
map('<C-Right>', '<C-w>l', nil, { desc = 'Focus window right' })
map('<C-Up>', '<C-w>k', nil, { desc = 'Focus window up' })
map('<C-Down>', '<C-w>j', nil, { desc = 'Focus window up' })
map('<M-Up>', '<C-o>:move -2<cr>', 'i', { desc = 'Move Line Up' })
map('<M-Down>', '<C-o>:move +1<cr>', 'i', { desc = 'Move Line Down' })

```

> [!hint] To make your changes take effect immediately, restart your neovim config `:restart` and map it to something you will remember

LSP related keymaps that I like (default ones that come with Neovim 0.12):

```lua
nmap('gra', '<Cmd>lua vim.lsp.buf.code_action()<CR>',     'Actions')
nmap('<C-w>d', '<Cmd>lua vim.diagnostic.open_float()<CR>',   'Diagnostic popup')
nmap('grf', '<Cmd>lua require("conform").format()<CR>',   'Format')
nmap('gri', '<Cmd>lua vim.lsp.buf.implementation()<CR>',  'Implementation')
map('K', '<Cmd>lua vim.lsp.buf.hover()<CR>',           'Hover')
nmap('gF', '<Cmd>lua vim.lsp.buf.rename()<CR>',          'Rename')
nmap('gf', '<Cmd>lua vim.lsp.buf.references()<CR>',      'References')
nmap('gd', '<Cmd>lua vim.lsp.buf.definition()<CR>',      'Source definition')
nmap('grt', '<Cmd>lua vim.lsp.buf.type_definition()<CR>', 'Type definition')
nmap_leader('ll', '<Cmd>lua vim.lsp.codelens.run()<CR>',        'Lens')
nmap_leader('f', '<Cmd>lua require("conform").format()<CR>', 'Format selection')
```

### Colorscheme (40\_plugin.lua)

Go to the top of `30_mini.lua` and comment the following line:

```lua
-- now(function() vim.cmd('colorscheme miniwinter') end)
```

This is the default colorscheme the author chose. Alongside those options you can also try out the one below that line without installing any new plugins

```lua
-- You can try these other 'mini.hues'-based color schemes (uncomment with `gcc`):
-- now(function() vim.cmd('colorscheme minispring') end)
-- now(function() vim.cmd('colorscheme minisummer') end)
-- now(function() vim.cmd('colorscheme miniautumn') end)
-- now(function() vim.cmd('colorscheme randomhue') end)

```

If none are to your taste, go to the bottom of the `40_plugin.lua` file and uncomment this codeblock and try out the other ones listed here

```lua
Config.now(function()
 -- Install only those that you need
 add({
   'https://github.com/sainnhe/everforest',
   'https://github.com/Shatur/neovim-ayu',
   'https://github.com/ellisonleao/gruvbox.nvim',
 })

  -- Enable only one
  vim.cmd('color everforest')
end)
```

### Lua Language Server (40\_plugin.lua)

Let's add our first LSP:

```lua
now_if_args(function()
  add({ 'https://github.com/neovim/nvim-lspconfig' })

  -- Use `:h vim.lsp.enable()` to automatically enable language server based on
  -- the rules provided by 'nvim-lspconfig'.
  -- Use `:h vim.lsp.config()` or 'after/lsp/' directory to configure servers.
  -- Uncomment and tweak the following `vim.lsp.enable()` call to enable servers.
  vim.lsp.enable({
    'lua_ls',
  })
end)

```

> [!caution] You will need you to first install `lua-language-server` executable and add it to your path.

`lua_ls` is recommended to have on by default and it doesn't really hurt to have it enabled as **it will only get started if a Lua file is open**.

One other thing to add is a `.luarc.json` to the root of the your Neovim config. This file give that lua language server the paths to the different modules (i.e plugins or runtime libraries) that are in use. Here's the one I use:

```json
{
  "diagnostics.globals": ["vim"],

  "$schema": "https://raw.githubusercontent.com/sumneko/vscode-lua/master/setting/schema.json",
  "runtime": {
    "version": "LuaJIT"
  },
  "workspace": {
    "checkThirdParty": false,
    "library": [
      "$VIMRUNTIME/lua",
      "${3rd}/luv/library",
      "lua/custom",
      "$XDG_DATA_HOME/nvim/site/pack/core/opt/conform.nvim",
      "$XDG_DATA_HOME/nvim/site/pack/core/opt/nvim-treesitter",
      "$XDG_DATA_HOME/nvim/site/pack/core/opt/mini.nvim",
      "$XDG_DATA_HOME/nvim/site/pack/core/opt/plenary.nvim",
      "$XDG_DATA_HOME/nvim/site/pack/core/opt/nvim/after"
    ]
  }
}
```

### Plugin Tweaks (30\_mini.lua)

The `mini.clue` plugin is nice to have for remembering keymaps. It will pop-up a window when you press one of its triggers but I think the default delay is too long for my liking. You can tweak this inside the setup function of the plugin:

![[blog/images/quick-start-1.png]]

As an aside, the way plugin loading works usually is that the plugin will need a `require('plugin.name').setup()` aside from being listed as a repo inside a `vim.pack.add()` call. To choose a configuration different from the default you can pass a Lua table to the setup function with tweaks. Normally the plugin will **extend by doing a deep merge** the default config with the config you passed to the setup function so you dont need to specify defaults whenever you are configuring

## Embedded Specific Tweaks

This are specific to working with Zephyr and other similar projects. We first add the languages that are present in the codebase to the list in the `nvim-treesitter` setup:

```lua
  local languages = {
    -- These are already pre-installed with Neovim. Used as an example.
    'lua',
    'c',
    'devicetree',
    'kconfig',
    'markdown',
    'python',
    'vimdoc',
    'yaml',
    -- Add here more languages with which you want to use tree-sitter
    -- To see available languages:
    -- - Execute `:=require('nvim-treesitter').get_available()`
    -- - Visit 'SUPPORTED_LANGUAGES.md' file at
    --   https://github.com/nvim-treesitter/nvim-treesitter/blob/main
  }
```

Then we add enable clangd and other LSP that we use day-to-day.

> [!note] I will cover more in detail the Clangd setup in [[lsp-integration|the next entry of the series]]

```lua
now_if_args(function()
  add({ 'https://github.com/neovim/nvim-lspconfig' })
  vim.lsp.enable({
    'lua_ls',
    'clangd',
  })
end)
```

[^1]: I personally prefer a more conservative use of plugins but lazy.nvim and its Neovim distro LazyVim can be good options for beginners, I myself started with LazyVim and slowly removed all the plugins I really didn't need until and kept about 10 of them to migrate to using vim.pack.
