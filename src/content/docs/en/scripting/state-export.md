---
title: State, Variables, And Exports
description: Separate tunable parameters, persistent state, and local variables.
---

Varg scripts emphasize explicit intent. You should be able to tell whether a variable is configuration, state, or a temporary computed value from where it is declared.

If you are new to programming, think of variables as a script's small notebook. Some entries are edited by level authors, some are remembered by the script itself, and some are only temporary calculations for this frame.

## Three Kinds Of Variables

| Syntax | Lifetime | Purpose |
| --- | --- | --- |
| `@export var` | Persistent for the script, tunable in the editor | Speed, damage, cooldown, count |
| Script-scope `var` | Persistent for the script | Ammo, timers, phase, initialization flags |
| Function-local `let` / `var` | Valid during this function call | Temporary calculations, loop counters, local results |

## Exported Parameters

Exported parameters are knobs that can be tuned from outside. Examples include movement speed, damage, and cooldown. They are usually not player-owned runtime state; they are values creators change while tuning feel.

```swift
script WeaponCooldown {
    @export var fireRate: Float = 0.5
    @export var damage: Int = 10

    var canFire: Bool = true
    var ammo: Int = 30
}
```

`fireRate` and `damage` are parameters designers or level authors tune. `canFire` and `ammo` are internal runtime state.

## Persistent State

Persistent state is "what the script remembers." Examples include remaining ammo, whether a reload is happening, and how many seconds have passed.

Script-scope `var` persists across frames:

```swift
script Timer {
    var elapsed: Float = 0.0

    func update(_ dt: Float) {
        elapsed += dt
    }
}
```

If `elapsed` is written inside `update()`, it is created again every frame and is not suitable as an accumulated timer.

## Local Variables

Local variables are temporary results for a small section of code. They do not provide long-term memory; they make the current calculation clearer.

```swift
func update(_ dt: Float) {
    let pulse: Float = sin(Time.time * 3.0) * 0.2
    position.y = 1.0 + pulse
}
```

`pulse` is only the result for this frame, so `let` is enough.

## Old-Style `state.name`

The current MVP may still accept:

```swift
state.ammo -= 1
```

New scripts should prefer declared persistent state:

```swift
var ammo: Int = 30

func update(_ dt: Float) {
    ammo -= 1
}
```

This is easier for the editor, validator, and AI agents to understand.
