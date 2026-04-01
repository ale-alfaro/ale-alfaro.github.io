---
title: Neovim as Your Embedded IDE - Why? 
created: 2026-03-29
modified: 2026-03-29 18:04
---


I believe that one of the most important choices a developer does in their career is their choice of editor. not only it is the tool that we use the most, but it is also the one that influenced the most our other choices of tools. this article is here to enable those who are already interested in using Neovim for embedded, specifically Zephyr, development a way to add some of the key features VS code extensions add all through Neovim’s Lua configuration language. I will not go into the basics of how to use Neovim, for that many resources and starter configs exist, I will focus solely on how to get you from having your Embedded-less Neovim installation to one that can rival VS Code and perhaps give you that little push over the hump to switch over to using Neovim as your main IDE. Let’s get started!

## What Does a Great Editor/IDE Require?

Here are the top of things I believe a good editor experience should offer:

- LSP integration for diagnostics, code navigation and some neat features like macro expansion while hovering
- Formatters that can be ran on save to keep your code clean and consistent and complying with your repositories coding guidelines
- Easy running of task or jobs for building, linting, running test, etc for quick feedback on code you just wrote

>[!question]- The missing key item from this list …
>You might be looking at this list and see some things missing like being able to debug with a integrated debugger. Although this tools might exist in Neovim as plugins that you can definitely use for embedded (with some effort and searching around) I generally do not recommend going into that rabbit hole due to several reasons:
>
> 1. Support for most embedded target specific toolchains is not great or non-existent in most plugins or being actively mantained
> 2. Even if 1 wasn't an issue, there are way better tools for debugging such as GDB which if you learn now will pay dividends for the rest of your embedded career.
> 3. You can easily have another window open running GDB and your editor on another. Why compromise if we can have two great tools doing the specific job they are meant to do?

## How Do I Accomplish All of the Requirements above with Neovim?

I have written how **I** have accomplished all of this things with my own config. There's many ways to do it of course but I haven't found much material when it comes to Neovim and how to use it for embedded so I have decided to share my thoughts and get more people excited about using their most used tool.


## Contents

- If you are new to Neovim and wish to give it a try go to [[1774816517-USPT|Neovim 0.12 Quick Start]] where I will go over a way to get started quickly with a **minimalist** config that I personally wish I had started with
- 
> [!note]  LSP integration does **not** require any Neovim 0.12 features.
> However there's a new native package manager  and couple [new LSP native integration](https://github.com/neovim/neovim/blob/fc7e5cf6c93fef08effc183087a2c8cc9bf0d75a/runtime/doc/news.txt) features and other niceties 

- Language Servers or also know as LSPs are probably the biggest quality of life feature modern IDEs bring so [[Neovim as your Embedded IDE - LSP Integration|LSP integration]] is a must if you plan to use Neovim for embedded
- Formatting ant linting are a requirement for most if not all modern languages. C is not too far behind and has some good options that are relatively easy to add to Neovim. Once you have LSP working you can head over to [[Neovim as your Embedded IDE - Formatters and Linters]]
- Similarly running a build command and getting instant feedback on code you wrote is nice. Neovim has some good plugins that can be used for that purpose so we will at the end add this as the cherry on top and look at [[Neovim as your Embedded IDE - Task Runners and Extras]]