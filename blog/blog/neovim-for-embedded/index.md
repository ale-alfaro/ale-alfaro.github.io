---
publish: true
title: Neovim as Your Embedded IDE
created: 2026-04-04T17:54:29.997-07:00
modified: 2026-04-08T18:11:40.368-07:00
---

## Why Neovim?

I believe that one of the most important choices a developer does in their career is their choice of editor. Not only it is the tool that we use the most, but it is also the one that influenced the most our other choices of tools and how we interact with computers a whole.

I'll tell you about my situation at work to illustrate the point. I work with embedded devices using Nordic SoCs like the nRF52840 running Zephyr and most of the ecosystem for tools to work with this chips is provided by Nordic through their VS Code extension so naturally a lot of people gravitate towards using VS Code as their sole editor for work. I , as you could have guessed already, use Neovim and am the sole developer in my team that uses anything aside from VS Code in my team and to put it plainly I have had to put a lot of work to my setup to catch-up to what a lot of my coworkers have as soon as they install the nRF Connect VS Extension. Although this might seem to be a handicap at first, in the long-run I have come to be way better at the workflow creation and tailoring of environments and developer setups than any person in my team to the point where I am the sole person who knows how to run tests in locally and on CI without a hitch.

None of the stuff I know is rocket science, it is just knowing right incantation CLI flags and options to bend the tools to do exactly what I want. But getting to that recipe is not trivial if you don't have an intuition for how CLI tools works or what the native Command Line itself offers. When your only interface to a computer is a terminal-based editor, well you end-up relying on this tool … a lot. One thing I found hard however was to find any resources related to embedded development specific tools and workflows. Aside from the embedded developer space being relatively small when comparing to the other fields in SWE, most of the embedded tooling space has been vendor-specific and can vary quite a ton depending on what your SoC's architecture is. However I think nowadays things are looking way better due to the popularity of open source projects like Zephyr which are establishing standards and tools across the industry.

The following mini-articles or guides are here to enable those who are already interested in using Neovim for embedded development, specifically Zephyr development. These are separated into core key features that an editor must have and that VS code extensions can provide.

I will not go into the basics of how to use Neovim, for that many resources exist and also reading articles won't help you. I will focus solely on how to go from a fresh Neovim 0.12 installation to one that can rival VS Code and perhaps give you that little push over the hump to switch over to using Neovim as your main IDE. Let’s get started!

## What Does a Great Editor/IDE Require?

Here are the top of things I believe a good editor experience should offer:

- LSP integration for diagnostics, code navigation and some neat features like macro expansion while hovering
- Formatters that can be ran on save to keep your code clean and consistent and complying with your repositories coding guidelines
- Easy running of task or jobs for building, linting, running test, etc for quick feedback on code you just wrote

> [!question]- The missing key item from this list …
> You might be looking at this list and see some things missing like being able to debug with a integrated debugger. Although this tools might exist in Neovim as plugins that you can definitely use for embedded (with some effort and searching around) I generally do not recommend going into that rabbit hole due to several reasons:
>
> 1. Support for most embedded target specific toolchains is not great or non-existent in most plugins or being actively mantained
> 2. Even if 1 wasn't an issue, there are way better tools for debugging such as GDB which if you learn now will pay dividends for the rest of your embedded career.
> 3. You can easily have another window open running GDB and your editor on another. Why compromise if we can have two great tools doing the specific job they are meant to do?

## How Do I Do All the above with Neovim?

If you are new to Neovim and wish to give it a try go to [[quick-start|Neovim 0.12 Quick Start]] where I will go over a way to get started quickly with a **minimalist** config that I personally wish I had started with

> [!note] All of the guides below are written for Neovim 0.12 but the features themselves do **not** require any of Neovim 0.12 features. There's older ways to achieve the same results
> However there's a new native package manager and couple [new LSP native integration](https://github.com/neovim/neovim/blob/fc7e5cf6c93fef08effc183087a2c8cc9bf0d75a/runtime/doc/news.txt) features that you might want to add.

The steps below to add each feature can be followed chronologically or also piece-wise. Feel free to jump to whichever section you feel the most interested in learning about:

1. [[lsp-integration|LSP integration]] is a must for any editor. For Language Server we will be going through the installation and setup for Zephyr SDK and also the NCS toolchain (which is just a slightly modified version of the Zephyr SDK) using Clangd as our LSP.
2. [[formatters-and-linters|Formatting and linting]] are nowadays a requirement for most SW teams. This guide will focus on how to add clang-format and clang-tidy tools to run format when saving and have linter diagnostics as well
3. [[task-runners-and-extras|Task Running]] to be able to run builds within Neovim can get you that instant feedback you need to know if the changes you are making work. We will go over how to add asynchronous tasks or jobs to Neovim to run builds and get the diagnostics from the compiler right away in the editor

> [!question] Why are some of the links not working?
> As I am writing this not all the entries have been written yet but I have added links to them as I'm planning to in the near future!
