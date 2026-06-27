---
title: Advanced Gameplay Scripting
description: Use scene queries, dynamic spawning, HUD, audio, mouse, and rendering commands to build real playable loops.
---

After learning the basics, you can already write local logic such as "move on key press," "weapon cooldown," and "timer." Real game scripts also connect several systems: player input changes state, state creates or destroys scene objects, and scene objects feed back into score, failure conditions, sound, and UI.

This page is not a complete API index. It is a method for writing gameplay scripts. Examples come from projects in the Varg repository:

- [examples/project/jump_jump](https://github.com/viloris-org/Varg/tree/main/examples/project/jump_jump): endless jumping, focused on platform generation, landing checks, HUD, and assist mode.
- [examples/project/fps_arena](https://github.com/viloris-org/Varg/tree/main/examples/project/fps_arena): shooting range, focused on first-person movement, target generation, reloads, hit feedback, and wave pressure.

:::note[Current Executable Scope]
This page covers only capabilities already used by the current MVP examples. Generic `scene.spawn(...)`, asset-based `Audio.play(...)`, event buses, module calls, arrays, and dictionaries belong to the target direction. Do not present them as stable capabilities in public tutorials yet.
:::

## One Gameplay Loop

Most small and medium gameplay scripts can be split into the same loop:

1. Read input: `Input.value`, `Input.pressed`, `Input.mouseDeltaX`.
2. Update state: ammo, score, phase, timers, difficulty, failure state.
3. Change the world: move the player, spawn platforms or enemies, destroy picked-up or hit objects.
4. Query the world: distance to nearest target, whether you landed on a platform, how far temporary objects are from the player.
5. Give feedback: HUD, sound effects, music, rendering environment.

Write these five steps as comments or sections first, then fill in code. The script will still be readable when it grows to hundreds of lines.

## Scene Tags Are A Low-Cost Interface

In the current Varg MVP, tags are the most stable connection between scripts and scenes. You set tags on objects in `.vscene` or when spawning runtime objects, then scripts query the nearest object by tag.

If you have not used other engines, think of a tag as a label stuck onto an object. The script does not know exactly how many platforms, targets, or collectibles are in the scene, but it can ask: "How far is the nearest `Platform` from me?" That is the value of tag queries.

```swift
entity "Player" {
    tag: "Player"
}
```

Runtime-spawned objects should also receive tags:

```swift
scene.spawnSphere("Training Drone Core", "Target", Vec3(x, y, z), 0.42, "scripts/target_drift.varg")
```

Use tags in scripts to check hits or pickups:

```swift
let targetDistance: Float = scene.distanceToTag("Target")

if targetDistance <= hitRadius {
    scene.destroyNearestWithTag("Target", hitRadius)
    score += 100
}
```

Common queries:

| API | Good for |
| --- | --- |
| `scene.distanceToTag("Target")` | Hits, pickups, danger-zone contact |
| `scene.distanceToTagBounds("Platform")` | Checking distance to an object's surface |
| `scene.horizontalDistanceToTagBounds("Platform")` | Platform landing checks that only consider horizontal error |
| `playerDistance()` | Cleaning up temporary objects far from the player |
| `scene.xOf("Player")` / `scene.yOf(...)` / `scene.zOf(...)` | Camera following the player |

:::tip[How To Describe This In Public Tutorials]
Do not describe tags as the final ECS query system. A more accurate description is: the current MVP uses tags as a lightweight interface between scripts and scenes, suitable for prototypes, tutorials, and small gameplay.
:::

### Choosing A Distance Query

The three distance functions are easy to mix up. Choose based on the question:

| Question | Recommended API |
| --- | --- |
| Did the player touch a collectible or danger zone? | `scene.distanceToTag(...)` |
| Is the player near the surface of a platform? | `scene.distanceToTagBounds(...)` |
| Is the player's horizontal position within the platform range? | `scene.horizontalDistanceToTagBounds(...)` |

For example, landing checks often need both "horizontal footprint" and "surface height":

```swift
let footprint: Float = scene.horizontalDistanceToTagBounds("Platform")
let surface: Float = scene.distanceToTagBounds("Platform")

if footprint <= 0.18 && surface <= 0.98 {
    landed = true
}
```

This is steadier than checking only center-point distance. Large, small, and long platforms are more likely to behave reasonably.

## Dynamic Object Spawning

The current runtime can spawn boxes and spheres. That is enough for platforms, targets, collectibles, effect points, preview points, and similar teaching scenarios.

```swift
scene.spawnBox(
    "Generated Platform",
    "Platform",
    Vec3(nextSpawnX, 0.0, platformZ),
    Vec3(platformWidth, 0.5, platformDepth),
    "scripts/despawn_far.varg"
)

scene.spawnSphere(
    "Generated Crystal",
    "Collectible",
    Vec3(nextSpawnX, 1.15, platformZ),
    0.35,
    "scripts/despawn_far.varg"
)
```

Read the parameters in this order:

| Position | Meaning |
| --- | --- |
| 1 | Object name, useful for debugging and editor display |
| 2 | Tag, used by later queries and destruction |
| 3 | World position |
| 4 | Box size or sphere radius |
| 5 | Optional script path, often used for bobbing animation or automatic cleanup |

The most common beginner mistake is "spawn only, never clean up." Temporary objects usually get a cleanup script:

```swift
script DespawnFar {
    @export var maxDistance: Float = 46.0

    func update(_ dt: Float) {
        if playerDistance() > maxDistance {
            entity.destroy()
        }
    }
}
```

This script is small, but it keeps endless generation from filling the scene forever.

### Spawning Is Not Random Throwing

Many tutorials jump straight to random generation, but at the beginner stage, "deterministic variation" is better. Deterministic means each run is similar, which helps you tell whether a problem is caused by rules or luck.

```swift
let lane: Float = spawnIndex - floor(spawnIndex / 4.0) * 4.0
let wobble: Float = sin(spawnIndex * 1.7) * 0.9
let x: Float = spawnIndex * segmentLength
let z: Float = -3.0 + lane * 2.0 + wobble
```

Here `spawnIndex` is like a serial number. The 0th, 1st, and 2nd objects go to different positions. `sin()` adds variation so the result does not look like a mechanical grid.

### When To Attach Scripts

The last parameter of `spawnBox` / `spawnSphere` can attach a script to the spawned object. Common uses fall into three groups:

| Spawned object | Good attached script |
| --- | --- |
| Platforms behind the player, bullets, effect points | Automatic cleanup script |
| Collectibles, targets, hint spheres | Bobbing or rotation script |
| Temporary danger zones | Timed destruction script |

For early tutorials, attaching only an automatic cleanup script is enough. Add bobbing, flashing, or sound scripts when the gameplay needs stronger feedback.

## First-Person Input

First-person control has two parts: either the player script updates yaw, or the camera script reads mouse input and sets `rotation`. Public tutorials should start with the camera version because its responsibility is simpler.

```swift
script FirstPersonCamera {
    @export var eyeHeight: Float = 0.65
    @export var mouseSensitivity: Float = 0.08
    @export var minPitch: Float = -36.0
    @export var maxPitch: Float = 18.0

    var yaw: Float = -34.0
    var pitch: Float = -9.0
    var mouseCaptured: Bool = true

    func start() {
        Input.captureMouse(mouseCaptured)
    }

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

        position.x = scene.xOf("Player")
        position.y = scene.yOf("Player") + eyeHeight
        position.z = scene.zOf("Player")
        rotation = Vec3(pitch, yaw, 0.0)
    }
}
```

This script shows two useful habits:

- The camera follows the player through `scene.xOf("Player")`, without duplicating player movement logic.
- `pitch` is limited with `clamp`, so the view cannot flip over.

### What Yaw And Pitch Mean

If you have no 3D programming experience, remember:

| Name | Direction |
| --- | --- |
| `yaw` | Turning left and right |
| `pitch` | Looking up and down |
| `rotation = Vec3(pitch, yaw, 0.0)` | Rotate the camera to this orientation |

Horizontal mouse movement usually changes `yaw`; vertical mouse movement usually changes `pitch`. `pitch` needs a range limit because a human head cannot bend backward forever.

First-person movement also converts `yaw` into a forward direction:

```swift
let yawRad: Float = yaw * 0.01745329
let forwardX: Float = 0.0 - sin(yawRad)
let forwardZ: Float = cos(yawRad)
```

`0.01745329` is an approximation for converting degrees to radians. You do not need to understand trigonometry first; just know that `sin/cos` here turns "which direction am I facing" into "which direction do I move."

## HUD Is Part Of Gameplay Feedback

HUD is not decoration. It tells the player the current goal, ammo, state, risk, combo, and failure reason. The Varg MVP lets scripts emit simple UI commands every frame:

```swift
ui.rect("hud_panel", 12.0, 12.0, 340.0, 154.0, 0.03, 0.04, 0.06, 0.86)
ui.label("hud_score", "Score: " + score, 24.0, 42.0)
ui.label("hud_status", status, 24.0, 84.0)
```

Progress bars are also rectangles:

```swift
let chargeWidth: Float = 160.0 * clamp(charge / maxCharge, 0.0, 1.0)

ui.rect("charge_bg", 24.0, 128.0, 160.0, 10.0, 0.18, 0.2, 0.24, 1.0)
ui.rect("charge_fill", 24.0, 128.0, chargeWidth, 10.0, 0.34, 0.75, 0.92, 1.0)
```

Interactive controls can return new values directly:

```swift
assistMode = ui.toggle("assist_toggle", assistMode, 282.0, 112.0, 48.0, 24.0)
```

UI worth teaching first:

| API | Purpose |
| --- | --- |
| `ui.label(...)` | Text |
| `ui.rect(...)` | Panels, health bars, progress bars |
| `ui.toggle(...)` | Switches, such as assist mode |
| `ui.slider(...)` | Debug values, such as difficulty or volume |
| `ui.button(...)` | Menus or restart |

### Show Decision Information First

Do not rush into pretty UI at the start. Ask: what does the player need to know in the next second?

| Gameplay | HUD should show first |
| --- | --- |
| Collection minigame | Score, remaining time, whether it is over |
| Jumping game | Charge, status, score, whether assist is enabled |
| Shooting range | Ammo, reload state, countdown, target progress |

If information does not affect player decisions, add it later. This keeps HUD from becoming a pile of numbers.

### Debug UI Is Useful Too

`ui.slider` and `ui.toggle` are useful for developers, not just players:

```swift
difficulty = ui.slider("debug_difficulty", difficulty, 0.0, 1.0, 24.0, 148.0, 180.0)
assistMode = ui.toggle("debug_assist", assistMode, 220.0, 148.0, 48.0, 24.0)
```

This lets you tune difficulty, speed, and assist mode while playing, without restarting for every value change.

## Start Audio With Procedural Tones

Tutorial projects do not need an external audio pipeline at first. Procedural tones are enough to express "success," "failure," "reload," "hit," and "combo up."

```swift
Audio.playTone("square", 220.0, 0.08, 0.14)
Audio.playTone3D("triangle", 880.0 + combo * 18.0, 0.12, 0.34)
```

Looping music can also use patterns:

```swift
if !musicStarted {
    Audio.startLoop("main_loop", "triangle", "C4 E4 G4 R E4 G4 B4 R", 132.0, 0.5, 0.12)
    musicStarted = true
}

if gameOver {
    Audio.stopLoop("main_loop")
    musicStarted = false
}
```

`R` is a rest. Common waveforms include `"sine"`, `"square"`, `"triangle"`, `"saw"`, and `"noise"`.

### Give Different Events Different Sounds

Sound does not need to be complex, but it should be distinguishable:

| Event | Recommended feel |
| --- | --- |
| Successful pickup | Short, high, clean |
| Failure | Low, rough, slightly longer |
| Reload | Mid-low, mechanical feedback |
| Combo | Pitch rises gradually |

Examples:

```swift
Audio.playTone("triangle", 860.0, 0.08, 0.25)
Audio.playTone("noise", 120.0, 0.18, 0.28)
Audio.playTone("square", 220.0, 0.08, 0.14)
Audio.playTone3D("sine", 760.0 + combo * 18.0, 0.04, 0.22)
```

Give every event clear feedback first, then consider real audio assets.

## Separate Rendering Initialization From Dynamic Updates

Global illumination settings usually only need to initialize once:

```swift
if !renderReady {
    render.gi.useScreenSpace()
    render.gi.useProbeVolume(Vec3(10.0, 3.5, 7.0), Vec3(42.0, 12.0, 26.0), Vec3(5.0, 3.0, 4.0), giIntensity)
    render.gi.setIntensity(giIntensity)
    renderReady = true
}
```

Intensity that changes with difficulty can update every frame:

```swift
render.gi.setIntensity(giIntensity + difficulty * 0.35)
```

In public tutorials, call this pattern "one-time configuration plus per-frame modulation." Readers can transfer it to other systems more easily.

### When Rendering APIs Are Needed

Rendering APIs are not required for beginner scripts. They are useful after gameplay rules already work, to improve atmosphere and feedback.

| Need | Useful API |
| --- | --- |
| Make the whole scene brighter or darker | `render.gi.setIntensity(...)` |
| Give a prototype scene quick lighting depth | `render.gi.useScreenSpace()` |
| Give a fixed area more stable GI | `render.gi.useProbeVolume(...)` |

In tutorials, put rendering in a "feedback enhancement" section instead of step one. Otherwise readers will be interrupted by graphics concepts before they understand movement, state, and checks.

## A Minimal Checklist For Public Tutorials

When writing advanced tutorials for players or creators, cover at least:

| Item | Why it matters |
| --- | --- |
| Final effect | Readers know what they will build |
| Input and controls | Readers can immediately try it |
| File list | Readers know which files to inspect |
| State table | Readers understand why the script needs these variables |
| Main loop | Explain what happens every frame instead of only pasting code |
| Failure and feedback | Game feel comes from feedback, not only rules |
| Extension tasks | Readers can keep modifying their own version |

Starting in the next chapter, we use this method to rewrite two full project tutorials.
