---
title: "Tutorial: Build An Endless Jumper"
description: Break down Jump Jump's gameplay loop from scene, script state, runtime platform generation, and HUD.
---

Jump Jump is a small first-person endless jumping game, but it contains a complete gameplay loop: charging, jumping, landing checks, scoring, failure, retrying, and a level that keeps extending forward.

The player holds Space to charge, then releases it to jump toward the next platform along the view direction. The script generates new platforms, collectibles, and danger zones ahead. Landing successfully gives score; stepping into a danger zone or missing a platform fails, then the player retries from the latest checkpoint.

Sample source: [examples/project/jump_jump](https://github.com/viloris-org/Varg/tree/main/examples/project/jump_jump).

:::tip[When To Read This]
If you have just learned scripting basics, follow through "Step Four: Write The Airborne Arc" first. That already creates a playable jump prototype. Landing checks, endless generation, and HUD turn the prototype into a complete minigame; you do not need to absorb them all at once.
:::

## Know This Before Starting

- You understand the difference between `@export var` and normal `var`.
- You know `start()` initializes, and `update(_ dt: Float)` runs every frame.
- You can use `Input.down`, `Input.released`, and `position`.
- You know a tag is the name scripts use to find scene objects.

If these are still unfamiliar, read [Programming Primer](/en/scripting/programming-primer/), [Scripting Basics](/en/scripting/basics/), and [Lifecycle And Input](/en/scripting/lifecycle-input/) first. If you want a smaller gameplay loop before this, follow [Intermediate Exercise: Build A Playable Collection Loop](/en/tutorials/first-playable-loop/).

## What You Will Learn

- How to use `.vscene` as the initial level and `.varg` as runtime gameplay.
- How to write a simple but stable player state machine with `phase`.
- How to use `scene.spawnBox` and `scene.spawnSphere` for endless generation.
- How to use tags and distance queries for landing, collection, and danger-zone checks.
- How to use `ui.rect`, `ui.label`, and `ui.toggle` for HUD and assist mode.
- How to use procedural sound and GI intensity to make gameplay more responsive.

This page is wider in scope than the syntax pages. Read it in three parts: steps one through four make the player jump; steps five through seven add checks and generation; step eight makes the result readable to the player.

## Finished Gameplay

Controls:

| Input | Action |
| --- | --- |
| Mouse movement | Adjust aim direction |
| Hold Space | Charge |
| Release Space | Jump |
| WASD | Add slight offset to jump direction |
| Fire | Recapture mouse |
| Assist toggle | Show landing preview |

Gameplay loop:

1. The player charges on a platform.
2. Releasing Space enters the airborne phase.
3. On landing, the script checks the nearest platform, goal platform, danger zone, and collectible.
4. Success updates checkpoint, score, combo, and difficulty.
5. The script keeps generating the next batch of platforms ahead of the player.

## Project Structure

```txt
jump_jump/
├── Varg.toml
├── scenes/
│   └── jump_jump.vscene
└── scripts/
    ├── jump_player.varg
    ├── first_person_camera.varg
    ├── despawn_far.varg
    └── bobber.varg
```

`Varg.toml` defines the default scene and script root:

```toml
name = "Jump Jump"
asset_root = "assets"
script_roots = ["scripts"]
default_scene = "scenes/jump_jump.vscene"
```

That means when the scene writes `source: "scripts/jump_player.varg"`, the runtime can find the script in the project.

## Step One: Prepare The Initial Scene

`.vscene` is responsible for "what exists when the game starts." Jump Jump's initial scene needs at least:

- A camera with `FirstPersonCamera`.
- A player object tagged `Player` with `JumpPlayer`.
- A few starting platforms tagged `Platform` or `Goal`.
- Some lights, so the game is readable from the start.

The player script mount looks roughly like this:

```swift
script JumpPlayer {
    source: "scripts/jump_player.varg"
    maxCharge: 1.25
    jumpScale: 5.0
    arcHeight: 3.0
    spawnAhead: 36.0
    segmentLength: 2.9
    routeYaw: -34.0
    giIntensity: 1.35
}
```

These values override the default `@export var` values in the script. In other words, script fields in `.vscene` are not decoration; they are the tuning entry point for the level. Expose these parameters early so tuning feel does not become a guessing game in code.

## Step Two: Define Player State

`jump_player.varg` has many variables, but they are easier to read in groups:

| Group | Example variables | Purpose |
| --- | --- | --- |
| Tuning | `maxCharge`, `jumpScale`, `arcHeight`, `spawnAhead` | Designer gameplay feel |
| Jump state | `charge`, `phase`, `jumpTime`, `startX`, `targetX` | Charge and airborne movement |
| Progress | `score`, `bestDistance`, `combo`, `difficulty` | Player performance |
| Generation | `nextSpawnX`, `nextSpawnZ`, `spawnIndex` | Where the next platforms go |
| Feedback | `hudStatus`, `musicStarted`, `renderReady` | UI, audio, rendering |
| Failure recovery | `gameOver`, `checkpointX`, `checkpointZ` | Retry from the last safe position |

Grouping variables before reading code is more reliable than reading top to bottom. State-machine scripts become hard when variables are scattered and every value seems equally important.

## Step Three: Write The Charge Phase

`phase == 0` means the player is on the ground and can charge.

```swift
if phase == 0 {
    hudStatus = "Mouse look / hold Space"

    if Input.down("Jump") {
        charge += dt
        if charge > maxCharge {
            charge = maxCharge
        }
        hudStatus = "Release to jump"
    }
}
```

This does not use `wait()` because charging must respond to input and HUD every frame. While Space is held, `charge` accumulates; when it reaches the limit, `maxCharge` clamps it.

When Space is released, save the current point and target point, then switch to the airborne phase:

```swift
if Input.released("Jump") && charge > 0.05 {
    startX = position.x
    startZ = position.z

    let yawRad: Float = aimYaw * 0.01745329
    let forwardX: Float = -sin(yawRad)
    let forwardZ: Float = cos(yawRad)
    let distance: Float = charge * jumpScale

    targetX = position.x + forwardX * distance
    targetZ = position.z + forwardZ * distance

    jumpTime = 0.0
    phase = 1
    hudStatus = "Airborne"
    Audio.playTone3D("sine", 360.0 + charge * 260.0, 0.08, 0.22)
}
```

The key is that the target point is finalized at release time. While holding, the player can still adjust view direction; after release, the script uses the yaw at that moment to calculate forward direction and convert `charge` into distance.

## Step Four: Write The Airborne Arc

`phase == 1` means the player is flying. Horizontal position uses `lerp`; vertical height uses `sin`.

```swift
if phase == 1 {
    jumpTime += dt * 1.85
    let t: Float = clamp(jumpTime, 0.0, 1.0)

    position.x = lerp(startX, targetX, t)
    position.z = lerp(startZ, targetZ, t)
    position.y = 1.1 + sin(t * 3.14159) * arcHeight
}
```

Why this works:

- `lerp(start, target, t)` makes horizontal movement stable and tunable.
- `sin(t * pi)` is 0 at the start and end, highest in the middle, so it naturally looks like a jump arc.
- `clamp` keeps `t` from exceeding 1, so the player does not keep extrapolating after landing.

This is not the final physical character controller, but it is a strong first gameplay version: explainable, tunable, and immediately playable. After the rules are stable, replacing it with a more realistic movement model is easier.

## Step Five: Landing Check

When `jumpTime >= 1.0`, the script begins checking whether the player landed.

```swift
let platformFootprint: Float = scene.horizontalDistanceToTagBounds("Platform")
let platformSurface: Float = scene.distanceToTagBounds("Platform")
let goalFootprint: Float = scene.horizontalDistanceToTagBounds("Goal")
let goalSurface: Float = scene.distanceToTagBounds("Goal")

var landed: Bool = false

if platformFootprint <= 0.18 && platformSurface <= 0.98 {
    landed = true
}

if goalFootprint <= 0.18 && goalSurface <= 0.98 {
    landed = true
}

if scene.distanceToTag("Hazard") <= 0.9 {
    landed = false
    dangerStreak += 1
}
```

The important trick is using `horizontalDistanceToTagBounds` for horizontal landing footprint and `distanceToTagBounds` for distance to the surface. Center-point distance alone makes large and small platforms feel inconsistent.

## Step Six: Rewards, Failure, And Checkpoints

After a successful landing, update score and checkpoint:

```swift
if landed {
    score += 1 + dangerStreak
    combo += 1
    checkpointX = position.x
    checkpointZ = position.z

    if combo > bestCombo {
        bestCombo = combo
    }
}
```

Collectibles also use tag queries:

```swift
if scene.distanceToTag("Collectible") <= 1.45 {
    score += 10 + combo
    scene.destroyNearestWithTag("Collectible", 1.45)
    Audio.playTone3D("triangle", 880.0 + combo * 18.0, 0.12, 0.34)
    hudStatus = "Crystal +" + (10 + combo)
}
```

On failure, do not restart the scene immediately. Set `gameOver` to `true` so HUD can show the result:

```swift
if !landed {
    position.y = -1.2
    gameOver = true
    combo = 0
    Audio.stopLoop("jump_rush_bgm")
    musicStarted = false
    Audio.playTone("noise", 120.0, 0.18, 0.28)
}
```

Retry from the latest checkpoint:

```swift
if gameOver && Input.pressed("Jump") {
    charge = 0.0
    phase = 0
    jumpTime = 0.0
    gameOver = false
    position = Vec3(checkpointX, 1.1, checkpointZ)
}
```

## Step Seven: Endless Platform Generation

Platforms are not all written into the scene. The runtime fills them in ahead of the player.

```swift
while nextSpawnX < position.x + spawnAhead {
    let lane: Float = spawnIndex - floor(spawnIndex / 4.0) * 4.0
    let wobble: Float = sin(spawnIndex * 1.7) * 0.9
    let platformZ: Float = nextSpawnZ + wobble
    let platformWidth: Float = 2.7 + abs(sin(spawnIndex * 0.9)) * 0.7 - difficulty * 0.65
    let platformDepth: Float = 2.8 - difficulty * 0.45

    scene.spawnBox("Generated Platform", "Platform", Vec3(nextSpawnX, 0.0, platformZ), Vec3(platformWidth, 0.5, platformDepth), "scripts/despawn_far.varg")

    nextSpawnX += segmentLength + difficulty * 0.38
    nextSpawnZ += 0.72 + sin(spawnIndex * 0.6) * 0.25 + difficulty * 0.1
    spawnIndex += 1
}
```

This generator is not random throwing; it is deterministic variation:

- `spawnIndex` makes every segment reproducible.
- `sin(spawnIndex * n)` varies position and width.
- `difficulty` gradually narrows platforms and changes spacing.
- `despawn_far.varg` cleans up objects behind the player.

## Step Eight: Add HUD And Assist Mode

HUD should show information the player can make decisions from: score, distance, combo, status, risk, and charge bar.

```swift
let chargeWidth: Float = 160.0 * clamp(charge / maxCharge, 0.0, 1.0)

ui.rect("jump_hud_panel", 12.0, 12.0, 340.0, 154.0, 0.03, 0.04, 0.06, 0.86)
ui.label("jump_hud_score", "Score: " + score, 24.0, 42.0)
ui.label("jump_hud_distance", "Distance: " + floor(bestDistance), 154.0, 42.0)
ui.label("jump_hud_status", hudStatus, 24.0, 84.0)
ui.rect("jump_hud_charge_bg", 24.0, 128.0, 160.0, 10.0, 0.18, 0.2, 0.24, 1.0)
ui.rect("jump_hud_charge", 24.0, 128.0, chargeWidth, 10.0, 0.34, 0.75, 0.92, 1.0)
```

Assist mode is controlled by `ui.toggle`:

```swift
assistMode = ui.toggle("jump_assist_toggle", assistMode, 282.0, 112.0, 48.0, 24.0)
```

When enabled, spawn a temporary preview sphere:

```swift
if assistMode && ghostCooldown <= 0.0 {
    scene.spawnSphere("Assist Landing Preview", "Assist", Vec3(previewX, 0.78, previewZ), 0.18, "scripts/despawn_far.varg")
    ghostCooldown = 0.18
}
```

This step moves the script from "it runs" to "the player can understand it." Many prototypes fail not because the rules are bad, but because the player cannot tell what they did right or wrong.

## Common Problems

| Problem | Possible cause | Fix |
| --- | --- | --- |
| Cannot land after platforms spawn | Tag typo, or not using `Platform` / `Goal` | Check tags in generation and scene |
| Generated objects keep piling up | Cleanup script is not attached | Pass `scripts/despawn_far.varg` to runtime-spawned objects |
| Jump direction is wrong | Yaw-to-radians or forward direction is reversed | Check `yaw * 0.01745329` and `-sin/cos` |
| Charge bar does not move | `charge` is not persisted across frames | Confirm `charge` is a script-scope `var` |
| State is wrong after retry | Only position was reset, not phase/timer | Reset failure recovery variables together |

## Exercises

1. Add a `Bonus` platform that gives extra time when landed on.
2. Make `assistMode` available only for the first 100 meters.
3. Increase danger-zone spawn probability with `difficulty`.
4. Use `ui.slider` to create a debug panel for tuning `jumpScale` at runtime.
5. Add different-pitch cue sounds for consecutive perfect landings.
