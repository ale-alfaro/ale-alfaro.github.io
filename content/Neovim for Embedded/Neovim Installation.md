---
title: Neovim 0.12 Quick Start
created: 2026-03-29
modified: 2026-03-29 16:51
---


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

And this is how you install Neovim with Mise:

```sh
❯ mise use -g neovim@nightly

mise Downloading https://github.com/neovim/neovim/releases/download/nightly/nvim-linux-x86_64.tar.gz
mise Verifying "/home/alealfaro/.local/share/mise/downloads/neovim-nightly/nvim-linux-x86_64.tar.gz" checksum
mise Extracting "/home/alealfaro/.local/share/mise/downloads/neovim-nightly/nvim-linux-x86_64.tar.gz" to "/home/alealfaro/.local/share/mise/installs/neovim/nightly"
neovim@nightly                      install                                                                                                                                              ✔
mise ~/.config/mise/config.toml tools: neovim@nightly
mise +neovim@nightly
```

Lets give a try to your new neovim installation to see that all is working well. If you have mise active or you have neovim in your path:

```sh
nvim
```

That's it. Couple things I want to point out:

- This is an OS-agnostic way to install tools as well as shell-agnostic
- It will write a line into your bashrc/zshrc for activating itself which what it really does is change your path so the tools installed through Mise are prepended first and are the ones your shell will invoke
- Tools can be managed through `mise use` and `mise unuse` commands. `-g` is for global installations and the format for tools is `<TOOL>@<VERSION>`

> [!TIP] Mise can also run neovim without modifying your PATH and install it on demand using `mise x nvim@nigthly -- nvim`

If you go this route, read more on what Mise can do and give it a try and install some of your favorite utilities. I do mostly Zephyr development and for me the tool I manage the most with mise is Python and Python CLI and package dependencies.Not all tools that you might want for embedded are going to be supported the biggest one being your target's toolchain. If you work on Zephyr I am woking on a Mise plugin to install the Zephyr-SDK and set the env variables so stay tuned!

## Neovim config

> [!warning]
> If you are new to Neovim I **strongly** suggest that you take some time to learn couple topics:
>
> - Vim keymaps and Vim modal editing. If you enter `:Tutor` as soon as you start Neovim you will enter the official tutorial page where you can learn the essentials
> - Lua and neovim's Lua API for configuration writting (this you could delegate to an AI agent but it won't be YOUR config until you learn how to change it yourself)
> - Motivation to learn, patience at being slow at doing your work for a while and have your other editor ready available in case you are stuck or feel yourself burning out. It took me two attempts to fully switch to Neovim and had VS Code at hand for the things I hadn't figured out yet how to do.

The fastest way get us to the good stuff and writing embedded code in Neovim will be to use a minimal preset that will do the essentials for us and have the foundation for us to add the Embedded specific plugins and configs. One I like and supports the 0.12 version of Neovim is MiniMax. I encourage to check it out and read the comments laid across the files of the config. Following the README, to install we do:

```sh
# Download
git clone --filter=blob:none https://github.com/nvim-mini/MiniMax ./MiniMax

# Set up config (copies config files and possibly initiates Git repository)
NVIM_APPNAME=nvim-minimax nvim -l ./MiniMax/setup.lua

# Start Neovim
NVIM_APPNAME=nvim-minimax nvim

# On Neovim>=0.12 press `y` to confirm installation of all listed plugins
# Wait for plugins to install (there should be no new notifications)

# Enjoy your new config!
# Start with reading its files. Type `<Space>`+`e`+`i` to open 'init.lua'.
```

> [!note] The method above is recommended by the creator of MiniMax but it is meant for trying out MiniMax and not overriding an already existing configuration.
> If you are installing Neovim for the first time and do not have an existing config, you can remove the `NVIM_APPNAME=nvim-minimax` from the commands `NVIM_APPNAME=nvim-minimax nvim -l ./MiniMax/setup.lua` so it becomes your default config and can call Neovim by its bin name only. I still recommend trying it out first before making it your default config in case the style it is not to your taste.

Once that is done, you should have now a working installation of Neovim with a good foundation to start customizing!

![[nvim_for_embedded_dev1.png]]
