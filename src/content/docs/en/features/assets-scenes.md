---
title: Assets, Scenes, And Declarative Files
description: Understand the responsibility boundaries of .varg, .vscene, .vmodel, and .vasset.
---

Varg is planned to provide a family of authoring languages with a shared style, so both people and AI can read, modify, and validate project files.

## File Roles

| Extension | Role | Purpose | Turing-complete |
| --- | --- | --- | --- |
| `.varg` | Logic file | Scripts, modules, dynamic gameplay logic, declarative behavior | `script` and `module` are; `behavior` is not |
| `.vscene` | World file | Scenes, prefabs, entity composition, layout intent, network replication declarations | No |
| `.vmodel` | Model authoring file | Procedural or parametric model construction | No |
| `.vasset` | Asset file | Asset registration, import settings, materials, audio events, and dependencies | No |

## `.vscene` Scene Sketch

```swift
scene MainScene {
    camera "MainCamera" {
        transform {
            position: Vec3(0, 6, 10)
            rotation: Euler(-30, 0, 0)
        }

        primary: true
    }

    entity "Player" {
        tag: "player"

        transform {
            position: Vec3(0, 1, 0)
        }

        script PlayerController {
            source: "scripts/player_controller.varg"
            speed: 6.0
        }
    }
}
```

Scene files describe "what exists" and "where it is." They do not contain arbitrary loops or runtime events.

## AI Intent Scenes

Varg's design allows AI to write high-level intent:

```swift
scene ForestCamp {
    intent: "A small night camp in a forest clearing"

    scatter "PineTree" {
        count: 32
        area: ring(inner: 8, outer: 18)
        scale: range(0.8, 1.4)
    }
}
```

These files are later compiled by tools into deterministic scene objects. The source file preserves author intent, which makes human review and further AI edits easier.

## Asset Pipeline

Varg's asset system is responsible for:

- Importing glTF, PNG, audio, and other assets
- Building the asset database and manifests
- Watching file changes and hot reloading
- Copying assets and generating `asset-manifest.json` during packaging

When an asset only needs registration, import settings, or material parameters, prefer `.vasset`. Write `.varg` only when runtime logic is needed.
