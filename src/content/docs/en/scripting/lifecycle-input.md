---
title: Lifecycle And Input
description: Learn start, update, fixedUpdate, and the Input API.
---

## Lifecycle Functions

Lifecycle functions are the places where the engine comes knocking. You do not call them yourself; after a script is mounted on an entity, the runtime calls them at the right time.

Varg scripts receive engine events through reserved names:

```swift
func start()
func update(_ dt: Float)
func fixedUpdate(_ dt: Float)
func collisionEnter(_ other: Entity)
func collisionExit(_ other: Entity)
func event(_ name: String, _ data: EventData)
```

The current MVP most commonly uses:

| Function | When it runs | Common uses |
| --- | --- | --- |
| `start()` | When the script starts running | Initialize state, output startup logs |
| `update(_ dt: Float)` | Every frame | Input, movement, timing, animation |
| `fixedUpdate(_ dt: Float)` | Fixed timestep | Physics-related logic, batch checks |

As a beginner, remember `start()` and `update(_ dt: Float)` first. Names such as `collisionEnter` and `event` can be treated as doors you may open later.

## What `dt` Is

`dt` is the time since the last update, usually understood in seconds. Multiplying movement by `dt` keeps speed independent from frame rate.

```swift
script Mover {
    @export var speed: Float = 3.0

    func update(_ dt: Float) {
        entity.translate(Vec3(speed * dt, 0, 0))
    }
}
```

## Input API

There are several input API names, but the questions are simple: is a button held this frame, just pressed, just released, or what is the current value of an axis?

Use clear input names:

```swift
Input.down("Jump")        // Held this frame
Input.pressed("Jump")     // Just pressed this frame
Input.released("Jump")    // Just released this frame
Input.value("MoveX")      // Axis input, often used for movement
Input.mouseDeltaX()       // Horizontal mouse movement this frame
Input.mouseDeltaY()       // Vertical mouse movement this frame
Input.captureMouse(true)  // Capture the mouse, often for first-person view
```

## Input Example: Movement And Jumping

```swift
script SimplePlayer {
    @export var speed: Float = 6.0
    @export var jumpForce: Float = 8.0

    var jumpsLeft: Int = 1

    func update(_ dt: Float) {
        let moveX: Float = Input.value("MoveX")
        let moveY: Float = Input.value("MoveY")

        entity.translate(Vec3(moveX * speed * dt, 0, moveY * speed * dt))

        if Input.pressed("Jump") && jumpsLeft > 0 {
            position.y += jumpForce * dt
            jumpsLeft -= 1
        }
    }
}
```

The jump is written as `position.y += ...` because the current MVP explicitly supports `position` assignment and component edits. A fuller physics velocity API belongs to the target direction; before using it, check the runtime implementation.

## First-Person Mouse Input

Full examples are in [jump_jump/scripts/first_person_camera.varg](https://github.com/viloris-org/Varg/tree/main/examples/project/jump_jump/scripts/first_person_camera.varg) and [fps_arena/scripts/fps_camera.varg](https://github.com/viloris-org/Varg/tree/main/examples/project/fps_arena/scripts/fps_camera.varg).

```swift
script LookCamera {
    @export var mouseSensitivity: Float = 0.08
    @export var minPitch: Float = -55.0
    @export var maxPitch: Float = 32.0

    var yaw: Float = 0.0
    var pitch: Float = -6.0
    var mouseCaptured: Bool = true

    func update(_ dt: Float) {
        if Input.pressed("Fire") {
            mouseCaptured = true
        }

        Input.captureMouse(mouseCaptured)

        if mouseCaptured {
            yaw += Input.mouseDeltaX() * mouseSensitivity
            pitch -= Input.mouseDeltaY() * mouseSensitivity
        }

        pitch = clamp(pitch, minPitch, maxPitch)
        rotation = Vec3(pitch, yaw, 0.0)
    }
}
```
