---
title: "Intermediate Exercise: Build A Playable Collection Loop"
description: Before entering a full project, use one small script to practice movement, timing, pickup, scoring, and HUD.
---

This chapter sits between "syntax lessons" and "full project tutorials." The goal is small: build a mini-gameplay loop that can move, collect, score, count down, and display HUD.

You do not need to understand full game architecture first. Build this loop:

1. The player moves with arrow keys or WASD.
2. The scene contains one `Collectible`.
3. The player scores when near it.
4. HUD shows score, countdown, and status.
5. Scoring stops when time runs out.

## Know This Before Starting

- You have read [Programming Primer For Readers With No Coding Background](/en/scripting/programming-primer/).
- You know `update(_ dt: Float)` runs every frame.
- You know `position.x` and `position.z` can change object position.
- You know a tag is a name scripts use to find objects.

## Prepare A Minimal Scene First

This exercise needs only two objects:

| Object | Needs | Why |
| --- | --- | --- |
| Player | `CollectPlayer` script attached | Input, timing, and scoring all live in the player script |
| Collectible | tag set to `Collectible` | The script uses this tag to find the nearest collectible |

The player can be a box or capsule, and the collectible can be a small sphere. The point is not whether the model looks good; first make the "approach object -> score -> delete object" chain run.

If you write `.vscene` by hand, the structure is roughly:

```swift
entity "Player" {
    tag: "Player"
    position: Vec3(0.0, 0.6, 0.0)

    script CollectPlayer {
        source: "scripts/collect_player.varg"
        speed: 5.0
        roundTime: 30.0
        pickupRadius: 1.4
    }
}

entity "Crystal" {
    tag: "Collectible"
    position: Vec3(2.0, 0.8, 0.0)
}
```

The easiest mistake here is `Collectible`. The tag in the scene and the string in the script must match exactly, including capitalization. If the script asks for `scene.distanceToTag("Collectible")`, the scene cannot write `collectible` or `Collectable`.

## Step One: Move The Player Only

Do not add scoring, collecting, or UI yet. First confirm the player can move.

```swift
script CollectPlayer {
    @export var speed: Float = 5.0

    func update(_ dt: Float) {
        let moveX: Float = Input.value("MoveX")
        let moveZ: Float = Input.value("MoveY")

        position.x += moveX * speed * dt
        position.z += moveZ * speed * dt
    }
}
```

Read it line by line:

- `speed` is movement speed.
- `moveX` is left/right input.
- `moveZ` is forward/back input.
- `* dt` keeps movement speed independent from frame rate.

Run it here first. If the player moves, go to the next step.

If the player does not move at all, check three things first:

| Symptom | Common cause |
| --- | --- |
| Keys do nothing | The script is not attached to the player object |
| Left/right works, forward/back does not | `MoveY` is not configured in input mapping, or the keys are not what you expected |
| Movement is too fast or too slow | `speed` is not suitable; try between `3.0` and `6.0` first |

Tune movement until it feels comfortable before adding rules. Otherwise scoring, spawning, and HUD will all be obscured by movement problems.

## Step Two: Add A Countdown

Now add a time limit.

```swift
script CollectPlayer {
    @export var speed: Float = 5.0
    @export var roundTime: Float = 30.0

    var timeLeft: Float = 30.0
    var gameOver: Bool = false

    func start() {
        timeLeft = roundTime
    }

    func update(_ dt: Float) {
        if !gameOver {
            timeLeft -= dt

            if timeLeft <= 0.0 {
                timeLeft = 0.0
                gameOver = true
            }
        }

        if !gameOver {
            let moveX: Float = Input.value("MoveX")
            let moveZ: Float = Input.value("MoveY")

            position.x += moveX * speed * dt
            position.z += moveZ * speed * dt
        }
    }
}
```

There are two new states:

| Variable | Meaning |
| --- | --- |
| `timeLeft` | How many seconds remain |
| `gameOver` | Whether the game is over |

`if !gameOver` means: only continue counting down and moving if the game is not over.

Notice that `timeLeft` and `roundTime` are not duplicates:

- `roundTime` is the tunable initial duration and can be changed in the scene.
- `timeLeft` is the runtime remaining time and decreases every frame.

Many beginners directly write `roundTime -= dt`. It runs, but debugging becomes awkward because "default duration" and "current remaining time" become the same value.

## Step Three: Score When Near The Collectible

The collectible in the scene needs the `Collectible` tag. The script uses distance to decide whether the player is close.

```swift
@export var pickupRadius: Float = 1.4

var score: Int = 0
var status: String = "Collect the crystal"
```

Put this block inside `update()`, after movement:

```swift
if !gameOver {
    let distance: Float = scene.distanceToTag("Collectible")

    if distance <= pickupRadius {
        score += 1
        status = "Collected +" + score
        scene.destroyNearestWithTag("Collectible", pickupRadius)
        Audio.playTone("triangle", 720.0, 0.08, 0.25)
    }
}
```

This code does four things:

1. Finds the nearest `Collectible`.
2. If it is close enough, adds 1 to the score.
3. Deletes the nearest collectible.
4. Plays a short sound effect.

There is no respawn yet, so you can only pick it up once. That is good; first make one action work.

The order matters most:

1. Calculate distance.
2. Add score only if close enough.
3. Delete the picked-up object.
4. Finally play feedback.

If you delete the object first and then try to read its position or state, the logic becomes messy. At the beginner stage, keep this order: check, change score, change scene, give feedback.

## Step Four: Spawn A New Collectible

After pickup, spawn a new sphere ahead.

Add a counter first:

```swift
var spawnIndex: Int = 0
```

Then append this after a successful pickup:

```swift
let nextX: Float = -4.0 + spawnIndex * 1.7
let nextZ: Float = sin(spawnIndex * 1.3) * 3.0

scene.spawnSphere(
    "Collectible",
    "Collectible",
    Vec3(nextX, 0.8, nextZ),
    0.35,
    ""
)

spawnIndex += 1
```

This uses `spawnIndex` and `sin()` instead of randomness. The benefit is that every run has a similar rhythm, so debugging is easier.

Read the `scene.spawnSphere(...)` parameters like this:

| Parameter | Value here | Purpose |
| --- | --- | --- |
| Object name | `"Collectible"` | Name visible in the editor or debugging |
| tag | `"Collectible"` | Lets `distanceToTag` find it later |
| Position | `Vec3(nextX, 0.8, nextZ)` | Where the new collectible spawns |
| Radius | `0.35` | Sphere size |
| Script | `""` | No extra script attached for now |

The second parameter must also be `Collectible`. Otherwise the new sphere is visible, but the script cannot find it next time, so the player cannot pick it up.

## Step Five: Connect HUD

Finally display the information the player needs.

```swift
ui.rect("collect_panel", 12.0, 12.0, 300.0, 126.0, 0.03, 0.04, 0.06, 0.86)
ui.label("collect_score", "Score: " + score, 24.0, 42.0)
ui.label("collect_time", "Time: " + floor(timeLeft), 24.0, 70.0)
ui.label("collect_status", status, 24.0, 98.0)
```

When time is up, change the prompt:

```swift
if gameOver {
    status = "Time up"
}
```

HUD is connected last not because it is unimportant, but because it depends on the previous state. First create `score`, `timeLeft`, and `status`; then display them. That reads best.

These coordinates are screen coordinates, not world coordinates. `ui.label("collect_score", ..., 24.0, 42.0)` draws text near the top-left of the screen; it does not follow the player or collectible.

## Complete Script

Putting the pieces together gives this version:

```swift
script CollectPlayer {
    @export var speed: Float = 5.0
    @export var roundTime: Float = 30.0
    @export var pickupRadius: Float = 1.4

    var timeLeft: Float = 30.0
    var gameOver: Bool = false
    var score: Int = 0
    var status: String = "Collect the crystal"
    var spawnIndex: Int = 0

    func start() {
        timeLeft = roundTime
    }

    func update(_ dt: Float) {
        if !gameOver {
            timeLeft -= dt

            if timeLeft <= 0.0 {
                timeLeft = 0.0
                gameOver = true
                status = "Time up"
            }
        }

        if !gameOver {
            let moveX: Float = Input.value("MoveX")
            let moveZ: Float = Input.value("MoveY")

            position.x += moveX * speed * dt
            position.z += moveZ * speed * dt

            let distance: Float = scene.distanceToTag("Collectible")

            if distance <= pickupRadius {
                score += 1
                status = "Collected +" + score
                scene.destroyNearestWithTag("Collectible", pickupRadius)
                Audio.playTone("triangle", 720.0, 0.08, 0.25)

                let nextX: Float = -4.0 + spawnIndex * 1.7
                let nextZ: Float = sin(spawnIndex * 1.3) * 3.0

                scene.spawnSphere(
                    "Collectible",
                    "Collectible",
                    Vec3(nextX, 0.8, nextZ),
                    0.35,
                    ""
                )

                spawnIndex += 1
            }
        }

        ui.rect("collect_panel", 12.0, 12.0, 300.0, 126.0, 0.03, 0.04, 0.06, 0.86)
        ui.label("collect_score", "Score: " + score, 24.0, 42.0)
        ui.label("collect_time", "Time: " + floor(timeLeft), 24.0, 70.0)
        ui.label("collect_status", status, 24.0, 98.0)
    }
}
```

## What You Just Practiced

| Capability | Where it appears |
| --- | --- |
| Per-frame update | Movement, countdown, HUD |
| Persistent state | `score`, `timeLeft`, `gameOver` |
| Input | `Input.value("MoveX")`, `Input.value("MoveY")` |
| Conditions | Time reaching zero, nearing a collectible |
| Scene queries | `scene.distanceToTag("Collectible")` |
| Dynamic spawning | `scene.spawnSphere(...)` |
| Feedback | `ui.label`, `ui.rect`, `Audio.playTone` |

This is a miniature version of a full project. Jump Jump and FPS Arena extend the same idea into more state, more objects, and stronger feedback.

## Common Problems

| Problem | Check first |
| --- | --- |
| No score when near the collectible | Whether the scene tag is exactly `Collectible` |
| No next collectible after picking up the first | Whether `spawnIndex += 1` is inside the successful pickup `if` |
| Score increases constantly | Whether pickup calls `scene.destroyNearestWithTag(...)` |
| Player can still move after time is up | Whether movement code is wrapped in `if !gameOver` |
| HUD numbers do not change | Whether `ui.label` is written in `update()`, not only in `start()` |

When debugging, do not change many places at once. First make movement work, then one pickup, then respawn, then HUD. If every step is playable, the next issue is easier to locate.
