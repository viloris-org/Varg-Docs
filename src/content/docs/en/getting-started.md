---
title: Getting Started
description: Install Varg, launch the editor, and find the scripting sample projects.
---

## Prerequisites

This page answers only two questions: how to open Varg, and where to find the sample code. You do not need to understand every file type yet; if you can open a project and find the scripts, you are ready for the next step.

Download Varg from GitHub Releases:

- [https://github.com/viloris-org/Varg/releases](https://github.com/viloris-org/Varg/releases)

If you only want to try the editor or run sample projects, download the prebuilt artifact from the release first. The source-based startup path below is only for people who plan to contribute to development, debug the engine, or modify the editor.

Launching the editor from source requires:

- Rust 1.96 or later
- Bun 1.3.14 or later
- Tauri v2 system dependencies

Common Linux dependencies:

```sh
sudo apt install libwebkit2gtk-4.1-dev build-essential libssl-dev libayatana-appindicator3-dev librsvg2-dev
```

## Launch The Editor

If you downloaded a release package, extract it and run the Varg executable inside it.

If you are launching from source and the Varg repository is next to this docs site at `../Varg`:

```sh
cd ../Varg/editor
bun install
bun run dev:tauri
```

After startup, you will enter the Hub screen. You can create or open a project, place objects in the editor, add components, and enter Play mode to run physics and scripts.

If you only want to learn scripting, open a sample project first instead of building a full scene from an empty project. An empty project involves scenes, assets, script mounting, and input configuration all at once, which is a larger jump.

## Where The Script Examples Are

The syntax examples in this manual come from `examples/scripts` in the Varg repository:

```txt
examples/scripts/
├── loop_demo.varg
├── particle_system.varg
├── timed_sequence.varg
├── wave_spawner.varg
└── weapon_cooldown.varg
```

Full gameplay tutorials use these sample projects:

- [examples/project/jump_jump](https://github.com/viloris-org/Varg/tree/main/examples/project/jump_jump)
- [examples/project/fps_arena](https://github.com/viloris-org/Varg/tree/main/examples/project/fps_arena)

You do not need to fork Varg to read these examples. You can view the source directly on GitHub, or download a release or source archive and open them locally.

Recommended learning order:

1. `weapon_cooldown.varg`: exported parameters, input, state, and `wait()`
2. `loop_demo.varg`: loops, `break`, `continue`, and local variables
3. `wave_spawner.varg`: multi-state scripts and lifecycle responsibilities
4. `particle_system.varg`: timers and key-based reset
5. `jump_jump`: runtime platform generation, landing checks, HUD, and assist mode. Reading only the first half of the main script is fine.
6. `fps_arena`: first-person movement, reloads, target generation, hit feedback. It has more systems, so read it after `jump_jump`.

:::tip[How To Read Examples]
Find the `@export var` declarations first; they are usually the parameters designers tune. Then find `var`; those are usually the states the script remembers. Finally read `start()` and `update(_ dt: Float)`. This is much more comfortable than grinding from the first line to the last.
:::

## One Sentence To Remember

`.varg` writes runtime logic; `.vscene` writes scene and object structure; `.vasset` registers assets; `.vmodel` describes generative models. The current executable focus is the `.varg` scripting MVP.
