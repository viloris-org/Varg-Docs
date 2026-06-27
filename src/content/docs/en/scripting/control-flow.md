---
title: Control Flow And Waiting
description: Use if, for, while, break, continue, and wait to write gameplay logic.
---

## Conditions

Control flow is not about writing "clever" code. It is about making gameplay rules clear: if you can fire, spend ammo; if you are reloading, count down; if you fall off the platform, fail.

```swift
if Input.pressed("Fire") && canFire && ammo > 0 {
    ammo -= 1
    canFire = false
}
```

The current MVP supports:

- Simple boolean state names such as `canFire`
- `!`, `&&`, `||`
- Numeric comparisons such as `ammo > 0` and `timer <= 0`
- Input checks such as `Input.pressed("Fire")`

## `for` Loops

Range loop:

```swift
for i in 0..3 {
    log("Range loop iteration")
}
```

Inclusive range loop:

```swift
for i in 1..=5 {
    sum += i
}
```

Count loop:

```swift
for i in count(3) {
    count += 1
}
```

## `while` Loops

```swift
while loopCount < maxIterations {
    if loopCount >= 5 {
        break
    }

    loopCount += 1
}
```

`while` is good for expressing "keep doing this until the state satisfies a condition." Make sure each iteration gives the condition a chance to change, so you avoid infinite loops.

## `break` And `continue`

```swift
for i in 0..10 {
    if i == skipValue {
        continue
    }

    filtered += 1
}
```

- `break`: immediately ends the current loop
- `continue`: skips the rest of this iteration and moves to the next one

## `wait(expression)`

`wait()` expresses time gaps in scripts:

```swift
script WeaponCooldown {
    @export var fireRate: Float = 0.5

    var canFire: Bool = true
    var ammo: Int = 30

    func update(_ dt: Float) {
        if Input.pressed("Fire") && canFire && ammo > 0 {
            ammo -= 1
            canFire = false
            log("Fire! Ammo remaining:")

            wait(fireRate)

            canFire = true
        }
    }
}
```

This style is good for teaching and simple rhythm control. You can read it as "wait for a bit, then continue with the next thing."

If a system must continue updating HUD, processing input, moving the player, or checking win/loss state while waiting, use an explicit timer instead. It takes a few more lines, but the state is more visible and easier to debug, pause, and save.

```swift
var cooldown: Float = 0.0

func update(_ dt: Float) {
    if cooldown > 0 {
        cooldown -= dt
    }

    if Input.pressed("Fire") && cooldown <= 0 {
        cooldown = fireRate
    }
}
```
