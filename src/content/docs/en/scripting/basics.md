---
title: Scripting Basics
description: Learn the file role, script declaration, and basic structure of Varg scripts.
---

`.varg` is Varg's runtime logic file. You can first understand it as "a set of rules attached to a game object": when it starts, what it does every frame, and how it reacts when the player presses keys.

If you have never learned another programming language, read [Programming Primer](/en/scripting/programming-primer/) first. That page explains variables, functions, conditions, and loops at a slower pace.

The syntax is close to Swift, but it is not Swift. It is designed for game scripts, modules, and declarative behaviors. At the start, you only need to care about `script`; the other declarations can wait.

## Top-Level Declarations

`.varg` allows three top-level declarations:

| Declaration | Purpose | Current recommendation |
| --- | --- | --- |
| `script` | Runtime logic attached to an entity | Main use |
| `module` | Reusable code imported by other `.varg` files | Target API, use carefully |
| `behavior` | Declarative behavior tree or state machine | Target API, still design-oriented |

Current tutorials focus on `script`.

:::tip[Hold Onto Three Things First]
A beginner script usually needs only three blocks: `@export var` for editor tuning, normal `var` for runtime state, and `start()` / `update(_ dt: Float)` for actual logic. Later APIs are things you put into those three blocks.
:::

## Minimal Script

```swift
script HelloVarg {
    func start() {
        log("Hello Varg")
    }
}
```

Explanation:

- `script HelloVarg` defines a script that can be mounted on an entity.
- `func start()` is a lifecycle function called when the script starts running.
- `log("...")` outputs a literal log message. The current MVP supports literal string logs.

## A More Complete Structure

```swift
script PlayerController {
    @export var speed: Float = 6.0
    var jumpsLeft: Int = 1

    func start() {
        log("player ready")
    }

    func update(_ dt: Float) {
        let moveX: Float = Input.value("MoveX")
        entity.translate(Vec3(moveX * speed * dt, 0, 0))
    }
}
```

A script is made of three kinds of content:

- Exported parameters: `@export var speed`, used by the editor and levels for tuning.
- Persistent state: `var jumpsLeft`, retained while the script runs.
- Lifecycle functions: `start()`, `update(_ dt: Float)`, and similar functions that hold the real logic.

## Current Executable MVP Boundary

The capabilities below are safe to use today. The list looks long, but you do not need to memorize it. First notice the categories, then look names up when writing scripts.

Basic syntax:

- `let`, `var`, `@export var`
- `start`, `update`, `fixedUpdate`
- `if`, `else`, `for`, `while`
- `return`, `break`, `continue`
- `wait(expression)`
- `log("literal message")`

Input and movement:

- `Input.down`, `Input.pressed`, `Input.released`, `Input.value`
- `Input.mouseDeltaX`, `Input.mouseDeltaY`, `Input.captureMouse`
- `position` and `entity.translate(Vec3(...))`

Scene queries and spawning:

- `scene.spawnBox`, `scene.spawnSphere`, `scene.destroyNearestWithTag`
- `scene.distanceToTag`, `scene.distanceToTagBounds`, `scene.horizontalDistanceToTagBounds`
- `scene.xOf`, `scene.yOf`, `scene.zOf`, `playerDistance()`

Feedback systems:

- `Audio.playTone`, `Audio.playTone3D`, `Audio.startLoop`, `Audio.stopLoop`
- `ui.label`, `ui.rect`, `ui.button`, `ui.toggle`, `ui.slider`, `ui.dragX`, `ui.dragY`, `ui.input`
- `render.gi.useScreenSpace`, `render.gi.useProbeVolume`, `render.gi.setIntensity`

Do not treat target APIs as completed runtime capabilities yet, including generic `scene.spawn(...)`, events such as `emit(...)`, asset-based `Audio.play(...)`, arrays, dictionaries, optional binding, and module calls. They belong to the language direction; wait for diagnostics or implementation updates before using them as executable code.
