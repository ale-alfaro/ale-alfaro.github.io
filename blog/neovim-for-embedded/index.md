---
title: Neovim as Your Embedded IDE
publish: true
created: 2026 04 11
modified: 2026 04 11
---

> [!question] Why are some of the links not working?
> As I am writing this not all the entries have been written yet but I have added links to them as I'm planning to in the near future!

I believe that one of the most important choices a developer makes in their career is their choice of editor. Not only it is the tool that we use the most, but it is also the one that influences the most our other choices of tools and how we interact with computers a whole.

## Why I Chose Neovim

At face value, Neovim or any of these non-user friendly but deeply mechanical editors that have been crafted for efficiency, are just a faster way to edit text. But that's not why me and probably most Vim users use a niche editor over one that is objectively more feature-fulll. Personally, my biggest reason to use Neovim has come down to this: control and deep knowledge over my tools. I enjoy making those micro-decisions that Neovim poses everyday, whether to use this key-map or enable this option and learn from them as you would any topic of history you enjoy reading about just because it's deeply interesting to you (Roman history and early Christianity, anyone else?). I also feel deeply satisfied by my personalized development environment that I have built over 2-3 years, and there's always much to learn and try to further iterate it just for the heck of it. I would pose that building an editor configuration can be as satisfying as any physical or digital craftsmanship. At the end of the day what is craftsmanship other than putting effort and love into something that might not deliver "value" to you in a proportional manner but you keep doing it for the purpose of doing it? Like someone might do building a wooden table or composing a narrative for your role-playing board game next Sunday, I spend my nights and weekends sometimes just doing that odd/geekie activity that has me hooked for some reason.

## Neovim and Embedded: What Does that Look like in Practice?

A lot of the ecosystem I work with day-to-day is based on vendor tooling. In firmware development your choice of tools is decided or at least heavily influenced by your SoC vendor. On the pros side this makes tooling easy to choose; on the cons side this leaves developers with little control over the tools they use. Nowadays tooling comes in two form-factors:

- VS Code extension
- CLI tools

Thankfully no more Eclipse-based vendor IDEs are being distributed but they have been replaced with another monolithic IDE: VS Code. CLI tools are still indispensable for the professional setting when you need a non-GUI workflow or automate some process but most of the focus in developer experience from the vendor is poured on the VS Code extensions and not the CLI.

Naturally most teams will gravitate towards using VS Code as their editor for work, sometimes even require it as a policy. Recently I had an awkward call to action when my new manager asked everyone about what they used as their IDE. Everyone, with silent nods for 'Yay', assented "VS Code" after the suggestion of my manager. As everyone was ready to leave the decision of making VS Code a policy in my team, I had to raise my voice and be the only one to put up some resistance: "I use Vim…" Silence and more silence. To this day that soft decision hasn't been settled but that really made me feel like a recluse, but with pride at having put-up a fight.

## Sharing and Spreading the Word

To put it plainly I had to put a lot of work to my Neovim setup to catch-up to what a lot of my coworkers had as soon as they one-click installed the nRF Connect VS Extension. This IS a handicap at first, but in the long-run I have come to be way better at doing the "plumbing" no one wants to do because they haven't written a bash script in the last year. I become THE docker/CI/testing/automation guy in my team which can be a burden for some but at least you will be indispensable if layoffs come to your doorstep.

One thing I found especially hard in my journey was to find any resources related to embedded development specific tools and workflows. Aside from the embedded developer space being relatively small when comparing to the other fields in SWE, most of the embedded tooling space has been close sourced or tightly coupled to the platform you work with and can vary quite a ton depending. So I want to share things I know, found online or learned through experience to other people who are in this niche developer intersection I am at, hopefully encourage some to join too.

> [!note] The following mini-articles or guides are here to enable those who are already interested in using Neovim for embedded development, specifically Zephyr development.
> I will not go into the basics of how to use Neovim, for that many resources exist but I will share quick way to get started with a solid config with a fresh Neovim 0.12 installation: [[quick-start|Neovim 0.12 Quick Start]]

## What Does a Great Editor/IDE Require?

Here are the top of things I believe a good editor experience should offer and the links to the pages talking about them. I have listed in order of importance, from most important for your enjoyment to least (nice-to-haves)

1. [[lsp-integration|LSP integration]] is a must for any editor. For Language Server we will be going through the installation and setup for Zephyr SDK (including the NCS flavored toolchain) using Clangd as our LSP.
2. [[formatters-and-linters|Formatting and linting]] that can be ran on save to keep your code clean and consistent and complying with your repositories coding guidelines
3. [[task-runners-and-extras|Task Running]] for building, linting, running test, etc for quick feedback on code you just wrote

> [!question]- The missing key item from this list …
> You might be looking at this list and see some things missing like being able to debug with a integrated debugger. Although this tools might exist in Neovim as plugins that you can definitely use for embedded (with some effort and searching around) I generally do not recommend going into that rabbit hole due to several reasons:
>
> 1. Support for most embedded target specific toolchains is not great or non-existent in most plugins or being actively mantained
> 2. Even if 1 wasn't an issue, there are way better tools for debugging such as GDB which if you learn now will pay dividends for the rest of your embedded career.
> 3. You can easily have another window open running GDB and your editor on another. Why compromise if we can have two great tools doing the specific job they are meant to do?
