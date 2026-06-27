---
title: Project Structure
description: Understand what Varg.toml, scenes, scripts, and assets do in a Varg game project.
---

This page is about a creator's own Varg game project, not the Varg engine source repository.

If you open `examples/project/jump_jump` or `examples/project/fps_arena`, the structure will look roughly like this:

```txt
my_game/
├── Varg.toml
├── scenes/
│   └── main.vscene
├── scripts/
│   ├── player.varg
│   └── camera.varg
├── assets/
│   ├── models/
│   ├── textures/
│   ├── audio/
│   └── materials/
└── build/
```

When starting a project, you do not need to fill every directory. A minimal project usually needs only:

```txt
my_game/
├── Varg.toml
├── scenes/
│   └── main.vscene
└── scripts/
    └── player.varg
```

## `Varg.toml`

`Varg.toml` is the project manifest. It tells the editor and runtime what the project is called, where the asset root is, where scripts are searched from, and which scene opens by default.

```toml
name = "My Game"
asset_root = "assets"
script_roots = ["scripts"]
default_scene = "scenes/main.vscene"
```

Common fields:

| Field | Purpose |
| --- | --- |
| `name` | Project name, shown in the editor or packaged output |
| `asset_root` | Asset directory, usually `assets` |
| `script_roots` | Script search directories, usually `["scripts"]` |
| `default_scene` | Scene entered by default for Play or packaging |

If a scene writes `source: "scripts/player.varg"`, the runtime uses the project configuration to find that script file.

## `scenes/`

`scenes/` contains `.vscene` files. You can think of a `.vscene` as "what exists in the world when the game starts."

Scenes usually handle:

- Placing the player, camera, lights, and initial objects.
- Setting object tags such as `Player`, `Platform`, and `Collectible`.
- Attaching scripts to objects.
- Overriding values for `@export var` parameters in scripts.

A tiny scene might look like this:

```swift
entity "Player" {
    tag: "Player"
    position: Vec3(0.0, 0.6, 0.0)

    script PlayerController {
        source: "scripts/player.varg"
        speed: 5.0
    }
}

entity "Camera" {
    position: Vec3(0.0, 2.0, -5.0)
}
```

Rule of thumb: scenes place things and tune parameters; scripts define runtime rules.

## `scripts/`

`scripts/` contains `.varg` files. They handle runtime logic such as movement, timing, scoring, object generation, HUD, and sound effects.

```txt
scripts/
├── player.varg
├── camera.varg
├── enemy.varg
└── despawn_far.varg
```

For beginner projects, split scripts by object or responsibility:

| Script | Good For |
| --- | --- |
| `player.varg` | Player input, movement, health, score |
| `camera.varg` | Camera following, first-person view |
| `enemy.varg` | Enemy movement, detection, being hit |
| `despawn_far.varg` | Cleaning up temporary objects far from the player |

Do not split too aggressively at the start. While a gameplay idea is not running yet, putting the main logic in one primary script is easier to debug. After the rules stabilize, split out independent responsibilities such as camera, cleanup, or bobbing animation.

## `assets/`

`assets/` contains project assets. Early tutorials can avoid many external assets, but real projects usually add models, textures, audio, and materials over time.

```txt
assets/
├── models/
├── textures/
├── audio/
└── materials/
```

Common organization:

| Directory | Content |
| --- | --- |
| `models/` | Characters, props, scene models |
| `textures/` | Textures, icons, UI images |
| `audio/` | Sound effects and music |
| `materials/` | Material configuration or material-related resources |

Tutorial projects often start with boxes and spheres generated at runtime to reduce asset noise. Once the gameplay rules work, replacing them with final assets is steadier.

## `build/`

`build/` or a similar output directory contains build artifacts. It is not the main place you edit.

Usually do not write gameplay scripts directly into the build output directory. Source files should live in `scripts/`, `scenes/`, and `assets/`, then the build process generates the final output.

## How One File Connects To Another

The key chain is:

1. `Varg.toml` sets the default scene: `default_scene = "scenes/main.vscene"`.
2. `main.vscene` places the player object.
3. The player object attaches a script: `source: "scripts/player.varg"`.
4. `player.varg` reads input, moves the player, and updates the HUD in `update(_ dt: Float)`.

In other words, the project does not run because of one file alone. It runs through this reference chain:

```txt
Varg.toml -> scenes/main.vscene -> scripts/player.varg
```

If nothing happens after Play, check this chain first:

| Problem | Check |
| --- | --- |
| The expected scene is not open | Whether `default_scene` points to the right `.vscene` |
| The script is not running | Whether the scene object has the script, and whether `source` is correct |
| Tag query cannot find an object | Whether the tag in `.vscene` exactly matches the script string |
| Parameters do not apply | Whether scene script field names match the `@export var` names |

## Difference From The Engine Source Structure

The Varg engine source repository contains directories such as `editor/`, `crates/`, and `xtask/`. That structure is for people developing the engine and editor.

When creating a game, focus on your own project:

```txt
Varg.toml
scenes/
scripts/
assets/
```

Later tutorials use this user-project mental model. You only need to dive into the engine's internal crate layout if you are modifying the editor, renderer, or runtime.
