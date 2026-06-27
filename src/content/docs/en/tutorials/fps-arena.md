---
title: "Tutorial: Build A Shooting Range"
description: Break down FPS Arena's rhythm from first-person movement, reloads, target generation, hit feedback, and HUD.
---

FPS Arena is a shooting range inside a closed arena. It has no complex assets and no full weapon system; it focuses on more basic and more important things: the player can move, fire, and reload; targets keep appearing; pressure rises over time.

The player moves through the arena, aims, and shoots dynamically generated drone targets. Too many uncleared targets reduce `integrity`; clearing enough targets completes the round.

Sample source: [examples/project/fps_arena](https://github.com/viloris-org/Varg/tree/main/examples/project/fps_arena).

:::note[Reading Advice]
This tutorial is more like "combining multiple systems" than Jump Jump: movement, weapons, spawning, win/loss, and HUD all live in the same main script. On the first read, focus on movement and reloads; leave target generation and win/loss pressure for the second pass.
:::

## Know This Before Starting

- You have read the first four steps of [Tutorial: Build An Endless Jumper](/en/tutorials/jump-jump/), or you understand `phase`, timers, and `position`.
- If you have no programming background, you have completed [Intermediate Exercise: Build A Playable Collection Loop](/en/tutorials/first-playable-loop/).
- You know why `dt` is multiplied into movement and countdowns.
- You know tag queries are not the final raycast system, but a practical way to do hits and distance checks in the current MVP.

## What You Will Learn

- How to use yaw, forward vectors, and input axes for first-person movement.
- How to write reloads with explicit timers instead of relying on `wait()`.
- How to build complex targets from runtime-spawned objects.
- How to use tag distance as an MVP hit check.
- How to drive target spawning, countdown, and pressure penalties with multiple timers.
- How to connect HUD, sound effects, and status text to the gameplay loop.

## Finished Gameplay

Controls:

| Input | Action |
| --- | --- |
| WASD | Move |
| Shift | Sprint |
| Mouse movement | Aim |
| Fire | Shoot |
| Interact | Reload |
| Esc / Q | Menu or exit, depending on the runtime host |

Win/loss conditions:

- Clear the required number of targets before the countdown ends.
- If too many targets remain, `integrity` drops.
- Failure happens when time reaches zero or integrity reaches zero.

## Project Structure

```txt
fps_arena/
├── Varg.toml
├── scenes/
│   └── fps_arena.vscene
└── scripts/
    ├── fps_player.varg
    ├── fps_camera.varg
    ├── target_drift.varg
    ├── drone_part_drift.varg
    └── despawn_far.varg
```

`fps_player.varg` is the main script. Other scripts provide camera following, target bobbing, and runtime object cleanup.

## Step One: Treat The Scene As A Training Arena

The scene file owns static content: floor, walls, lights, player, and camera. The player object uses the `Player` tag, which the scripts use for camera following and cleanup distance.

Player script mount:

```swift
script FpsPlayer {
    source: "scripts/fps_player.varg"
    moveSpeed: 4.8
    sprintMultiplier: 1.55
    arenaLimitX: 8.5
    arenaLimitZ: 10.5
    fireRate: 0.16
    reloadTime: 1.15
    magazineSize: 24
    hitRadius: 2.35
    spawnAhead: 8.5
    giIntensity: 1.2
}
```

These parameters show this is not a fixed-number demo. Movement speed, arena bounds, hit radius, magazine size, reload time, and GI intensity are all level tuning points. Expose these knobs early so difficulty tuning has handles later.

## Step Two: Organize Script State

`FpsPlayer` variables can be grouped by system:

| Group | Example variables | Purpose |
| --- | --- | --- |
| View and movement | `yaw`, `moveSpeed`, `arenaLimitX` | Player control |
| Weapon | `ammo`, `reserve`, `canFire`, `reloading`, `reloadTimer` | Shooting and reloads |
| Target spawning | `targetTimer`, `targetIndex`, `spawnAhead`, `activeTargets` | Spawn control |
| Scoring | `score`, `streak`, `shots`, `hits`, `cleared` | Player performance feedback |
| Pressure | `roundTimer`, `integrity`, `pressureTimer`, `wave` | Win/loss rhythm |
| Feedback | `status`, `musicStarted`, `renderReady` | HUD, audio, rendering |

Read this table before reading the code. It becomes easier to distinguish "weapon state," "spawning state," and "win/loss state." Dozens of variables are manageable; the real problem is when they all look like the same layer.

## Step Three: First-Person Movement

The core of FPS movement is converting yaw into forward and right vectors, then combining them with input axes.

```swift
yaw += Input.mouseDeltaX() * 0.08
yaw += Input.value("LookX") * 86.0 * dt

let yawRad: Float = yaw * 0.01745329
let forwardX: Float = 0.0 - sin(yawRad)
let forwardZ: Float = cos(yawRad)
let rightX: Float = cos(yawRad)
let rightZ: Float = sin(yawRad)

var speed: Float = moveSpeed
if Input.down("Sprint") {
    speed = moveSpeed * sprintMultiplier
}

let moveX: Float = Input.value("MoveX")
let moveZ: Float = Input.value("MoveY")
let deltaX: Float = rightX * moveX + forwardX * moveZ
let deltaZ: Float = rightZ * moveX + forwardZ * moveZ

position.x += deltaX * speed * dt
position.z += deltaZ * speed * dt
position.x = clamp(position.x, -arenaLimitX, arenaLimitX)
position.z = clamp(position.z, -arenaLimitZ, arenaLimitZ)
rotation = Vec3(0.0, yaw, 0.0)
```

This is worth explaining line by line:

- Mouse and controller look both change `yaw`.
- `sin/cos` converts an angle into direction vectors.
- `MoveX` moves along right, and `MoveY` moves along forward.
- `dt` keeps movement independent from frame rate.
- `clamp` keeps the player inside the arena.

## Step Four: Initialize Feedback Systems Once

Do not reinitialize rendering and music every frame. Guard them with boolean state:

```swift
if !renderReady {
    render.gi.useScreenSpace()
    render.gi.useProbeVolume(Vec3(0.0, 2.5, 0.0), Vec3(18.0, 8.0, 22.0), Vec3(4.0, 3.0, 4.0), giIntensity)
    render.gi.setIntensity(giIntensity)
    renderReady = true
}

if !musicStarted {
    Audio.startLoop("fps_arena_pulse", "saw", "C3 R G3 R Bb3 R G3 R", 128.0, 0.42, 0.08)
    musicStarted = true
}
```

This pattern transfers to many systems: configure the environment the first time, and update only values that actually change every frame. It also avoids repeated resets that can make you think rendering or audio is broken.

## Step Five: Weapon And Reload

Shooting checks ammo first:

```swift
func fireWeapon() {
    if ammo <= 0 {
        status = "Empty - reload"
        Audio.playTone("square", 110.0, 0.05, 0.18)
        return
    }

    ammo -= 1
    shots += 1
    canFire = false
    Audio.playTone3D("sine", 760.0 + streak * 12.0, 0.04, 0.22)
}
```

Reloading uses an explicit timer:

```swift
if Input.pressed("Interact") && !reloading && ammo < magazineSize && reserve > 0 {
    reloading = true
    canFire = false
    reloadTimer = reloadTime
    Audio.playTone("square", 220.0, 0.08, 0.14)
}

if reloading {
    reloadTimer -= dt
    status = "Reloading"

    if reloadTimer <= 0.0 {
        let needed: Int = magazineSize - ammo
        if reserve >= needed {
            ammo = magazineSize
            reserve -= needed
        } else {
            ammo += reserve
            reserve = 0
        }

        reloading = false
        canFire = true
        status = "Ready"
    }
}
```

This does not use `wait(reloadTime)`. During reload, HUD, target pressure, countdown, and movement must continue running; an explicit timer exposes "currently reloading" as normal state for other logic.

## Step Six: Spawn Drone Targets

A target is not a model asset; it is a group of simple geometry spawned at runtime:

```swift
scene.spawnSphere("Training Drone Core", "Target", Vec3(x, y, targetZ), 0.42, "scripts/target_drift.varg")
scene.spawnBox("Training Drone Top Plate", "DronePart", Vec3(x, y + 0.47, targetZ), Vec3(0.92, 0.12, 0.34), "scripts/drone_part_drift.varg")
scene.spawnBox("Training Drone Bottom Plate", "DronePart", Vec3(x, y - 0.47, targetZ), Vec3(0.72, 0.1, 0.28), "scripts/drone_part_drift.varg")
scene.spawnBox("Training Drone Left Wing", "DronePart", Vec3(x - 0.58, y, targetZ), Vec3(0.16, 0.34, 0.76), "scripts/drone_part_drift.varg")
scene.spawnBox("Training Drone Right Wing", "DronePart", Vec3(x + 0.58, y, targetZ), Vec3(0.16, 0.34, 0.76), "scripts/drone_part_drift.varg")
```

This is especially good for tutorials:

- No external model assets required.
- Each part can attach a bobbing script.
- The core sphere uses the `Target` tag, while decorative parts use the `DronePart` tag.
- On hit, the core and parts can be destroyed separately.

Target positions use `targetIndex` for deterministic variation:

```swift
let lane: Float = targetIndex - floor(targetIndex / 5.0) * 5.0
let x: Float = -5.6 + lane * 2.8
let z: Float = -1.0 + sin(targetIndex * 1.1) * 5.4
let y: Float = 1.35 + abs(sin(targetIndex * 0.7)) * 1.45
let targetZ: Float = z + spawnAhead
```

This is better for teaching and debugging than pure randomness because every run reproduces a similar rhythm.

## Step Seven: MVP Hit Detection

The current example does not use a raycast gun. It approximates hits with distance to the nearest `Target`:

```swift
let targetDistance: Float = scene.distanceToTag("Target")

if targetDistance <= hitRadius {
    hits += 1
    streak += 1
    cleared += 1
    activeTargets -= 1
    score += 100 + streak * 15
    roundTimer += 0.55
    status = "Target down +" + streak

    scene.destroyNearestWithTag("Target", hitRadius)
    scene.destroyNearestWithTag("DronePart", hitRadius + 1.4)
    scene.destroyNearestWithTag("DronePart", hitRadius + 1.4)
    scene.destroyNearestWithTag("DronePart", hitRadius + 1.4)
} else {
    streak = 0
    roundTimer -= 0.65
    status = "Miss - time lost"
}
```

This code is honest about being an MVP: it is not the final raycast gun, but it is enough to validate ammo, score, streaks, target spawning, and feedback rhythm. Make the game loop work first, then replace the hit model with a more precise one.

`destroyNearestWithTag("DronePart", ...)` is called repeatedly because the current API destroys one nearest object per call. Repeating it clears a group of parts around the target.

## Step Eight: Create Pressure With Multiple Timers

The shooting range is not a linear state machine. It is several parallel timers:

```swift
roundTimer -= dt
pressureTimer -= dt
targetTimer -= dt
```

Target spawning:

```swift
if targetTimer <= 0.0 && !gameOver {
    spawnTarget()
    let spawnDelay: Float = 1.35 - wave * 0.08
    targetTimer = clamp(spawnDelay, 0.45, 1.35)
}
```

Pressure penalty:

```swift
if pressureTimer <= 0.0 && activeTargets > 0 {
    integrity -= 1
    activeTargets -= 1
    streak = 0
    status = "Breach warning"
    Audio.playTone("square", 130.0, 0.08, 0.22)
    pressureTimer = clamp(4.6 - wave * 0.28, 1.6, 4.6)
}
```

Win/loss conditions:

```swift
if roundTimer <= 0.0 {
    gameOver = true
    status = "LOCKDOWN - score " + score
}

if cleared >= clearGoal {
    gameOver = true
    score += integrity * 250
    status = "SIM CLEARED - score " + score
}
```

This structure has clear boundaries: each timer controls one kind of pressure, and together they create the game rhythm. Debugging is also easier because you can tell whether spawning is too fast or the penalty is too heavy.

## Step Nine: Draw HUD

Extracting HUD into a function keeps the main loop much clearer:

```swift
func drawHud() {
    ui.rect("fps_hud_panel", 12.0, 12.0, 382.0, 184.0, 0.02, 0.025, 0.03, 0.86)
    ui.rect("fps_hud_accent", 12.0, 12.0, 4.0, 184.0, 0.95, 0.18, 0.12, 1.0)
    ui.label("fps_title", "FPS Arena", 24.0, 22.0)
    ui.label("fps_score", "Score: " + score, 24.0, 44.0)
    ui.label("fps_timer", "Time: " + roundTimer, 154.0, 44.0)
    ui.label("fps_ammo", "Ammo: " + ammo + " / " + reserve, 24.0, 66.0)
    ui.label("fps_integrity", "Integrity: " + integrity, 154.0, 66.0)
    ui.label("fps_goal", "Cleared: " + cleared + " / " + clearGoal, 24.0, 88.0)
    ui.label("fps_status", status, 24.0, 134.0)
    ui.label("fps_crosshair", "+", 392.0, 292.0)
}
```

HUD should answer four questions:

- What is my current goal?
- How many shots do I have left?
- How well am I doing?
- Why did I fail or succeed?

If the HUD answers these four questions, the player can understand the gameplay.

## Common Problems

| Problem | Possible cause | Fix |
| --- | --- | --- |
| Shots do not hit | `hitRadius` is too small, or target tag is not `Target` | Check generation code and script parameters |
| Targets keep piling up | `pressureTimer` is too slow, or hits do not reduce `activeTargets` | Check the hit branch |
| Ammo is wrong after reload | `needed` or `reserve` calculation is wrong | Test with a small magazine first |
| Player leaves the arena | Forgot `clamp(position.x/z, ...)` | Check the last few lines of movement code |
| HUD values do not refresh | `drawHud()` is not called every frame | Call it at the end of `update()` |

## Exercises

1. Add a `BonusTarget` that grants extra time when hit.
2. Shrink `hitRadius` as streak grows to make high scores harder.
3. Add a timeout cleanup script to targets; if they expire unhit, subtract score.
4. Use `ui.slider` to build a debug panel for adjusting `spawnDelay` at runtime.
5. Split `spawnTarget()` into three functions: normal target, fast target, and high-score target.
