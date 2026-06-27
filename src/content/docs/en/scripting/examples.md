---
title: Example Walkthroughs
description: Learn common scripting patterns from Varg examples/scripts.
---

These examples come from `examples/scripts` in the Varg repository and can be used as templates when writing your own scripts. For fuller follow-along tutorials, see:

- [Intermediate Exercise: Build A Playable Collection Loop](/en/tutorials/first-playable-loop/)
- [Tutorial: Build An Endless Jumper](/en/tutorials/jump-jump/)
- [Tutorial: Build A Shooting Range](/en/tutorials/fps-arena/)

If you are not comfortable with programming yet, do not read examples from the first line to the last line. Ask three questions first: what state does this script remember? What does it check every frame in `update()`? What player action changes the state?

If you have not formed that reading habit yet, read [From Basics To Intermediate: Organizing Gameplay Scripts](/en/scripting/gameplay-loop-patterns/) first. That page focuses on putting variables, input, timers, and feedback into one `update()`.

## Weapon Cooldown

Core file: `weapon_cooldown.varg`

```swift
script WeaponCooldown {
    @export var fireRate: Float = 0.5
    @export var damage: Int = 10

    var canFire: Bool = true
    var ammo: Int = 30

    func update(_ dt: Float) {
        if Input.pressed("Fire") && canFire && ammo > 0 {
            ammo -= 1
            canFire = false
            wait(fireRate)
            canFire = true
        }
    }
}
```

Patterns to learn:

- Put tunable design parameters in `@export var`
- Store `canFire` and `ammo` as persistent state
- Use input events to trigger state changes
- Use `wait()` to express a short pause

## Particle Counter

Core file: `particle_system.varg`

```swift
var particlesActive: Int = 0
var timeSinceEmit: Float = 0.0

func update(_ dt: Float) {
    timeSinceEmit += dt

    let emitInterval: Float = 1.0 / emitRate
    while timeSinceEmit >= emitInterval {
        if particlesActive < particleCount {
            particlesActive += 1
        }
        timeSinceEmit -= emitInterval
    }
}
```

Patterns to learn:

- Use accumulated time to turn frame updates into fixed-frequency events
- Use `while` to handle multiple emissions that may happen in one frame
- Use an upper bound check to keep state within the design range

## Wave Spawner

Core file: `wave_spawner.varg`

This example splits logic into several states:

| State | Meaning |
| --- | --- |
| `currentWave` | Current wave |
| `waveTimer` | Time remaining until the next wave |
| `enemiesSpawned` | Number spawned in the current wave |
| `isSpawning` | Whether spawning is active |

Key excerpt:

```swift
if waveTimer <= 0 && !isSpawning {
    currentWave += 1
    isSpawning = true
    enemiesSpawned = 0
    log("Starting wave")
}
```

This is a typical state-machine shape: one condition triggers a state transition, then later logic continues based on the new state.

## Loop Demo

Core file: `loop_demo.varg`

It covers:

- `0..3` range loops
- `1..=5` inclusive range loops
- `count(3)` count loops
- Nested loops
- `break` and `continue`
- Animation layering with `sin(Time.time + i)`

When you need batch checks, batch accumulation, or simple animation sampling, start by referencing this file.

## Full Project Examples

[examples/project/jump_jump](https://github.com/viloris-org/Varg/tree/main/examples/project/jump_jump) and [examples/project/fps_arena](https://github.com/viloris-org/Varg/tree/main/examples/project/fps_arena) go beyond the basic examples:

| Project | Key capabilities | Recommended file |
| --- | --- | --- |
| `jump_jump` | First-person charged jumping, runtime platform generation, landing checks, collectibles, HUD, assist mode | `scripts/jump_player.varg` |
| `fps_arena` | First-person movement, ammo and reloads, target generation, distance-based hits, wave pressure, HUD | `scripts/fps_player.varg` |

If single-file examples feel too small but full projects feel too large, start with [Intermediate Exercise: Build A Playable Collection Loop](/en/tutorials/first-playable-loop/). It puts movement, pickup, score, timing, spawning, and HUD into one small script, right after the syntax pages.
