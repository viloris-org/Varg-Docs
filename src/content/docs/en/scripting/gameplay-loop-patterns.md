---
title: "From Basics To Intermediate: Organizing Gameplay Scripts"
description: After learning variables, input, and control flow, use a stable structure to turn them into maintainable gameplay scripts.
---

After learning variables, `update()`, input, and `if`, many people get stuck in the same place: every individual concept makes sense, but it is unclear how to put them into a real gameplay script.

This page fills that middle gap. It does not rush into advanced APIs, and it does not require you to build a full project immediately. The goal is simple: learn to organize "basic syntax" into one clear gameplay loop.

## Start With One Gameplay Rule

Before writing code, do not think about code first. Write the gameplay rule in plain language:

> When the player presses Fire, fire; after firing, enter cooldown; during cooldown, cannot fire again; HUD shows the current state.

This sentence splits into four categories:

| Category | Example | Where it usually goes in the script |
| --- | --- | --- |
| Input | Press `Fire` | Read `Input.pressed(...)` in `update()` |
| State | Whether cooling down, how much cooldown remains | Script-scope `var` |
| Rules | Fire only when allowed; recover when cooldown reaches zero | `if` checks |
| Feedback | HUD text, sound effects, logs | Updated after rule changes |

This table matters more than the code. If you can separate these four categories, the script will not become a mess at the start.

## A Recommended Script Skeleton

Beginner gameplay scripts can start in this order:

```swift
script SimpleAction {
    @export var cooldownTime: Float = 0.6

    var cooldown: Float = 0.0
    var status: String = "Ready"

    func start() {
        cooldown = 0.0
        status = "Ready"
    }

    func update(_ dt: Float) {
        // 1. Update existing state

        // 2. Read input

        // 3. Change state according to rules

        // 4. Give feedback to the player
    }
}
```

Writing comments first is fine. Comments are not decoration; they help you order what happens every frame.

## Step One: Let State Flow On Its Own

Cooldowns, countdowns, and durations change even without player input. Update them first:

```swift
if cooldown > 0.0 {
    cooldown -= dt

    if cooldown <= 0.0 {
        cooldown = 0.0
        status = "Ready"
    }
}
```

Two details matter here:

- `cooldown -= dt` makes time count down.
- Clamping it back to `0.0` keeps HUD and checks cleaner.

Many beginners only write `cooldown -= dt` and do not handle the below-zero case. It works briefly, but later checks and display logic get messy.

## Step Two: Then Read Input

Keep input close to where it is used. Do not read a pile of keys at the top and use them dozens of lines later.

```swift
if Input.pressed("Fire") && cooldown <= 0.0 {
    cooldown = cooldownTime
    status = "Fired"
    Audio.playTone("square", 520.0, 0.05, 0.2)
}
```

Read this directly:

1. If `Fire` was just pressed this frame.
2. And we are not currently cooling down.
3. Enter cooldown, change status text, and play a sound.

This is the most common gameplay-script shape: input does not directly "do the thing"; it triggers a state change.

## Step Three: Put HUD At The End

HUD usually goes at the end of `update()` because it displays the result after this frame's rules have been calculated.

```swift
ui.rect("action_panel", 12.0, 12.0, 280.0, 96.0, 0.03, 0.04, 0.06, 0.86)
ui.label("action_status", status, 24.0, 42.0)
ui.label("action_cooldown", "Cooldown: " + cooldown, 24.0, 70.0)
```

If you draw HUD first and then change `status`, the player sees a one-frame delay. As a beginner, remember this rule of thumb: calculate rules first, display results last.

## Complete Small Example

Putting the pieces together:

```swift
script SimpleAction {
    @export var cooldownTime: Float = 0.6

    var cooldown: Float = 0.0
    var status: String = "Ready"

    func start() {
        cooldown = 0.0
        status = "Ready"
    }

    func update(_ dt: Float) {
        if cooldown > 0.0 {
            cooldown -= dt

            if cooldown <= 0.0 {
                cooldown = 0.0
                status = "Ready"
            }
        }

        if Input.pressed("Fire") && cooldown <= 0.0 {
            cooldown = cooldownTime
            status = "Fired"
            Audio.playTone("square", 520.0, 0.05, 0.2)
        }

        ui.rect("action_panel", 12.0, 12.0, 280.0, 96.0, 0.03, 0.04, 0.06, 0.86)
        ui.label("action_status", status, 24.0, 42.0)
        ui.label("action_cooldown", "Cooldown: " + cooldown, 24.0, 70.0)
    }
}
```

This script is small, but it already contains the basic shape of a complete gameplay script: parameters, state, input, rules, and feedback.

## Expand From One Action Into Gameplay

The next step is not a different writing style. Add more state within the same structure.

| Gameplay to add | New state | New rule |
| --- | --- | --- |
| Ammo | `ammo` | Spend 1 when firing; cannot fire with no ammo |
| Reloading | `reloading`, `reloadTimer` | Count down after Interact; refill when finished |
| Score | `score` | Add score on hit or pickup |
| Countdown | `timeLeft`, `gameOver` | Stop input after time reaches zero |

For example, adding ammo does not require throwing the script away. Just add one more condition to the input check:

```swift
if Input.pressed("Fire") && cooldown <= 0.0 && ammo > 0 {
    ammo -= 1
    cooldown = cooldownTime
    status = "Fired"
}
```

If ammo is empty, write another rule:

```swift
if Input.pressed("Fire") && ammo <= 0 {
    status = "Empty"
    Audio.playTone("square", 120.0, 0.08, 0.18)
}
```

Gameplay scripts grow this way: not by writing one huge system all at once, but by adding clear small states and small rules.

## When To Use `wait()`, And When To Use Timers

`wait()` is good for short, isolated timing:

```swift
canFire = false
wait(fireRate)
canFire = true
```

But if HUD must keep showing, the player can still move, failure must be processed, or the state can be canceled while waiting, use an explicit timer:

```swift
if reloadTimer > 0.0 {
    reloadTimer -= dt
    status = "Reloading"
}
```

Rule of thumb:

| Situation | Recommendation |
| --- | --- |
| A simple cooldown example | `wait()` is fine |
| HUD must show remaining time | Explicit timer |
| Player can move while waiting | Explicit timer |
| State can be canceled or interrupted | Explicit timer |

Full project tutorials mostly use explicit timers because they are easier to debug and combine with other systems.

## How To Read Long Scripts

When you see a gameplay script with dozens or hundreds of lines, do not read from the first line downward. Find these sections first:

| Find first | What you learn |
| --- | --- |
| `@export var` | Which values this script can tune |
| Script-scope `var` | Which states it remembers |
| `start()` | What it initializes |
| First half of `update()` | Which states naturally change every frame |
| Input checks | Which state changes the player can trigger |
| HUD and sound | Which rules give feedback |

This reading method connects directly to the next page about advanced runtime APIs. Advanced APIs are not a separate world; they just provide more tools for "change the scene, query the scene, play sound, and draw HUD."

## Next Step

You now know how to organize basic syntax into gameplay scripts. Next, choose one path:

- To keep learning APIs, read [Advanced Runtime APIs](/en/scripting/advanced-runtime-apis/) for scene queries, dynamic spawning, HUD, audio, and rendering commands.
- To build a small loop first, follow [Intermediate Exercise: Build A Playable Collection Loop](/en/tutorials/first-playable-loop/) and connect movement, pickup, score, countdown, and HUD.
