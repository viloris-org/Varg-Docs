---
title: 给零编程基础读者的脚本入门
description: 在学习 Varg 语法前，先理解变量、函数、条件、循环和每帧更新。
---

如果你以前没有写过代码，这一页就是缓冲垫。先不用急着记住语法细节；你只要理解“脚本在替你记事、判断、重复做事”。

游戏脚本不像写一篇文章，更像写一张规则卡：

- 先记住一些数值，例如速度、分数、弹药。
- 玩家按键时，按规则改变这些数值。
- 每一帧都检查一次，看看角色要不要移动、UI 要不要更新、游戏有没有失败。

## 变量：给东西起名字

变量就是“有名字的格子”。格子里可以放数字、文字、真假状态。

```swift
var score: Int = 0
var speed: Float = 6.0
var gameOver: Bool = false
var status: String = "Ready"
```

可以这样读：

| 写法 | 人话解释 |
| --- | --- |
| `score` | 这个格子叫分数 |
| `Int` | 里面放整数 |
| `0` | 初始值是 0 |
| `Bool` | 里面只放 true 或 false |
| `String` | 里面放文字 |

写脚本时经常会改变量：

```swift
score += 1
gameOver = true
status = "You win"
```

它们的意思是：分数加 1、游戏结束变成真、状态文字改成“You win”。

## `let` 和 `var` 的区别

`var` 是之后还会变的格子。`let` 是这一小段里临时算出来、不打算再改的值。

```swift
var ammo: Int = 30
ammo -= 1

let moveX: Float = Input.value("MoveX")
```

经验规则：

- 需要跨帧记住的东西，用脚本作用域的 `var`。
- 只在这一帧临时算一下的东西，用函数里的 `let`。

## 函数：一段会被执行的规则

函数是一段有名字的规则。Varg 里最常见的是 `start()` 和 `update(_ dt: Float)`。

```swift
func start() {
    log("game start")
}

func update(_ dt: Float) {
    score += 1
}
```

可以这样理解：

- `start()`：脚本刚开始运行时做一次。
- `update(_ dt: Float)`：每一帧都做一次。

大多数入门脚本都长这样：

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

## `dt`：这一帧过去了多久

游戏不是一秒只更新一次，而是一秒更新很多次。`dt` 表示“这次更新距离上次更新过了多久”。

移动时要乘上 `dt`：

```swift
position.x += speed * dt
```

这样写的意思是：速度是每秒移动多少，`dt` 负责把它换成本帧该移动多少。机器快或慢，角色速度都比较稳定。

## 条件：如果怎样，就做什么

`if` 用来表达判断。

```swift
if Input.pressed("Fire") {
    ammo -= 1
}
```

这句话可以直接读成：如果这一帧刚按下 Fire，就让弹药减 1。

条件可以更具体：

```swift
if Input.pressed("Fire") && ammo > 0 {
    ammo -= 1
}
```

`&&` 表示“并且”。这句意思是：刚按下 Fire，并且弹药大于 0，才开火。

常见判断：

| 写法 | 意思 |
| --- | --- |
| `ammo > 0` | 弹药大于 0 |
| `timer <= 0.0` | 计时器已经归零 |
| `!gameOver` | 游戏还没结束 |
| `canFire && ammo > 0` | 可以开火，并且还有弹药 |

## 循环：重复做一件事

循环用来重复做事。入门时先认识两种。

`for` 适合次数明确的重复：

```swift
for i in count(3) {
    log("spawn one")
}
```

`while` 适合“只要条件还满足，就继续”：

```swift
while timer > 0.0 {
    timer -= dt
}
```

写 `while` 时要特别小心：循环里面必须让条件有机会改变。不然脚本会一直卡在里面。

## 脚本作用域和函数内部

写在 `script` 里面、函数外面的变量，会一直跟着脚本存在。

```swift
script Counter {
    var score: Int = 0

    func update(_ dt: Float) {
        score += 1
    }
}
```

`score` 每帧都会保留上一次的值。

写在 `update()` 里面的变量，每帧都会重新创建：

```swift
func update(_ dt: Float) {
    var score: Int = 0
    score += 1
}
```

这段代码每帧都把 `score` 重新变成 0，所以它不能用来记录总分。

## 先背这一张小地图

你以后看到 Varg 脚本，可以先这样拆：

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

逐块看：

| 区域 | 负责什么 |
| --- | --- |
| `script Player` | 这是一张叫 Player 的脚本规则卡 |
| `@export var speed` | 可以在编辑器或场景里调的参数 |
| `var score` | 游戏运行时要记住的状态 |
| `start()` | 开始时做一次 |
| `update()` | 每帧做一次 |
| `Input.value` | 读取输入 |
| `position.x += ...` | 改变角色位置 |

看懂这张地图，再去读 [脚本基础](/scripting/basics/) 会轻松很多。
