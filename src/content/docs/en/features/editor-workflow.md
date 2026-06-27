---
title: Editor Workflow
description: The basic Varg editor flow from Hub to Play mode.
---

This page is about how to work after opening the editor, not the internal architecture of the Varg editor.

You usually do three things in the editor: manage projects, organize scenes, and enter Play mode to validate scripts. Scripts, scenes, and assets are still ordinary project files; the editor simply makes those files easier to inspect, modify, and test.

## Basic Flow

1. Launch Varg and enter the Hub.
2. Create a new project, or open an existing project directory.
3. Open a scene and select objects in the Hierarchy.
4. Adjust position, rotation, scale, and component parameters in the Inspector.
5. Check the 3D layout in the Scene View.
6. Click Play to run physics and scripts in the Game View.
7. Stop to return to edit state, then continue adjusting.

Keep edit state and runtime state separate. Edit state modifies scene files; Play mode runs a runtime world. This lets you try scripts without worrying that one failed run will mess up the scene file.

## What The Hub Does

The Hub is the project entry point. It creates projects, opens projects, and lets you return to recently used projects.

A project needs at least:

- `Varg.toml`: project manifest declaring the default scene and script directories.
- `scenes/`: scene files.
- `scripts/`: `.varg` scripts.
- `assets/`: models, textures, audio, and other assets.

If you only want to inspect a complete project first, open a sample directly:

- [examples/project/jump_jump](https://github.com/viloris-org/Varg/tree/main/examples/project/jump_jump)
- [examples/project/fps_arena](https://github.com/viloris-org/Varg/tree/main/examples/project/fps_arena)

## Common Components

You do not need to memorize every component at the start. Recognize these first:

| Component | Purpose |
| --- | --- |
| Camera | Defines the game view |
| Light | Scene lighting |
| MeshRenderer | Displays a model or mesh |
| Rigidbody | Participates in physics simulation |
| Collider | Collision shape |
| Script | Mounts a `.varg` script |

A minimal runnable scene usually needs a Camera, a Light, and at least one scripted or interactable entity.

## How Scripts Enter A Scene

Scripts do not run automatically. They must be attached to scene objects. A typical flow is:

1. Create or import a `.varg` file in the project.
2. Select the target entity.
3. Add a Script component.
4. Bind the script resource, for example `scripts/player_controller.varg`.
5. Tune parameters exposed by `@export var` in the Inspector.
6. Enter Play mode to validate behavior.

Example:

```swift
script JumpPlayer {
    source: "scripts/jump_player.varg"
    maxCharge: 1.25
    jumpScale: 5.0
}
```

Here `source` points to the script file, and the fields below it override exported parameters in the script. In other words, the script owns the rules; the Inspector or `.vscene` owns tuning.

## What To Check In Play Mode

After entering Play mode, confirm four things first:

- Whether the script receives input.
- Whether object position and rotation change as expected.
- Whether HUD or logs explain the current state.
- Whether Stop returns cleanly to edit state.

Do not connect every system at the start. Make one object move first, then add collision, UI, sound, and spawning logic. When something breaks, the search area is much smaller.

## Relationship To Files

Varg projects are not editable only through the editor. You can tune objects and parameters in the editor, and you can also edit project files directly.

Common responsibility split:

- `.vscene` writes scene structure, objects, components, and script mount relationships.
- `.varg` writes runtime logic such as input, timers, state machines, and UI.
- `.vasset` writes asset registration and import settings.
- `Varg.toml` writes the project entry point and default scene.

The editor is good for checking spatial relationships and tuning parameters. Text files are good for review, copying examples, bulk edits, and tool-generated drafts. The two sides do not conflict; the key is keeping project files readable.
