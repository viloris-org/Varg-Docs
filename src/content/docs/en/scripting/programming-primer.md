---
title: Programming Primer For Readers With No Coding Background
description: Before learning Varg syntax, understand variables, functions, conditions, loops, and per-frame updates.
---

If you have never written code before, this page is a buffer. You do not need to memorize syntax details yet; just understand that a script remembers things, makes decisions, and repeats actions for you.

Game scripts are less like writing an essay and more like writing a rule card:

- First remember values such as speed, score, and ammo.
- When the player presses keys, change those values according to rules.
- Check every frame to see whether the character should move, the UI should update, or the game has failed.

## Variables: Naming Things

A variable is a named box. The box can hold numbers, text, or true/false state.

```swift
var score: Int = 0
var speed: Float = 6.0
var gameOver: Bool = false
var status: String = "Ready"
```

Read it like this:

| Syntax | Plain meaning |
| --- | --- |
| `score` | This box is called score |
| `Int` | It stores whole numbers |
| `0` | The initial value is 0 |
| `Bool` | It only stores true or false |
| `String` | It stores text |

Scripts often change variables:

```swift
score += 1
gameOver = true
status = "You win"
```

That means: add 1 to the score, set game over to true, and change the status text to "You win."

## The Difference Between `let` And `var`

`var` is a box that can change later. `let` is a temporary value calculated in a small section of code and not meant to be changed again.

```swift
var ammo: Int = 30
ammo -= 1

let moveX: Float = Input.value("MoveX")
```

Rule of thumb:

- Use script-scope `var` for things that must be remembered across frames.
- Use function-local `let` for things calculated temporarily in this frame.

## Functions: Rules That Run

A function is a named block of rules. In Varg, the most common ones are `start()` and `update(_ dt: Float)`.

```swift
func start() {
    log("game start")
}

func update(_ dt: Float) {
    score += 1
}
```

Understand them like this:

- `start()`: runs once when the script starts.
- `update(_ dt: Float)`: runs every frame.

Most beginner scripts look like this:

```swift
script MyScript {
    var score: Int = 0

    func start() {
        log("ready")
    }

    func update(_ dt: Float) {
        score += 1
    }
}
```

## `dt`: How Much Time Passed This Frame

Games do not update only once per second; they update many times per second. `dt` means "how much time passed since the last update."

Multiply movement by `dt`:

```swift
position.x += speed * dt
```

This means speed is how far to move per second, and `dt` converts it into how far to move this frame. The character speed stays more stable on fast and slow machines.

## Conditions: If Something Is True, Do Something

`if` expresses a decision.

```swift
if Input.pressed("Fire") {
    ammo -= 1
}
```

Read it directly: if Fire was just pressed this frame, reduce ammo by 1.

Conditions can be more specific:

```swift
if Input.pressed("Fire") && ammo > 0 {
    ammo -= 1
}
```

`&&` means "and." This says: fire only if Fire was just pressed and ammo is greater than 0.

Common checks:

| Syntax | Meaning |
| --- | --- |
| `ammo > 0` | Ammo is greater than 0 |
| `timer <= 0.0` | The timer has reached zero |
| `!gameOver` | The game is not over |
| `canFire && ammo > 0` | You can fire, and there is ammo |

## Loops: Repeat An Action

Loops repeat work. Learn two kinds first.

`for` is good when the repeat count is clear:

```swift
for i in count(3) {
    log("spawn one")
}
```

`while` is good for "keep going while this condition is still true":

```swift
while timer > 0.0 {
    timer -= dt
}
```

Be careful with `while`: the loop body must give the condition a chance to change. Otherwise the script can get stuck inside the loop.

## Script Scope And Function Internals

Variables written inside `script` but outside functions live together with the script.

```swift
script Counter {
    var score: Int = 0

    func update(_ dt: Float) {
        score += 1
    }
}
```

`score` keeps its previous value every frame.

A variable written inside `update()` is created again every frame:

```swift
func update(_ dt: Float) {
    var score: Int = 0
    score += 1
}
```

This code resets `score` to 0 every frame, so it cannot record a total score.

## Memorize This Small Map First

When you see a Varg script later, split it like this:

```swift
script Player {
    @export var speed: Float = 6.0
    var score: Int = 0

    func start() {
        log("ready")
    }

    func update(_ dt: Float) {
        let moveX: Float = Input.value("MoveX")
        position.x += moveX * speed * dt
    }
}
```

Read it block by block:

| Area | Responsibility |
| --- | --- |
| `script Player` | This is a script rule card called Player |
| `@export var speed` | A parameter tunable in the editor or scene |
| `var score` | State remembered while the game runs |
| `start()` | Runs once at the beginning |
| `update()` | Runs every frame |
| `Input.value` | Reads input |
| `position.x += ...` | Changes the character position |

Once this map makes sense, [Scripting Basics](/en/scripting/basics/) will be much easier to read.
