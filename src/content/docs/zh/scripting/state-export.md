---
title: 状态、变量与导出
description: 区分可调参数、持久状态和局部变量。
---

Varg 脚本强调显式意图。你应该能从变量声明的位置看出它是配置、状态还是临时计算值。

如果你是零编程基础，可以先把变量想成“脚本的小记事本”。有些内容给关卡作者改，有些内容给脚本自己记，有些内容只是这一帧临时算一下。

## 三种变量

| 写法 | 生命周期 | 用途 |
| --- | --- | --- |
| `@export var` | 脚本持久存在，可在编辑器调参 | 速度、伤害、冷却、数量 |
| 脚本作用域 `var` | 脚本持久存在 | 弹药、计时器、阶段、是否初始化 |
| 函数内 `let` / `var` | 本次函数调用内有效 | 临时计算、循环计数、局部结果 |

## 导出参数

导出参数是“外面可以调的旋钮”。例如移动速度、伤害、冷却时间。它们通常不是玩家运行时自己改的状态，而是创作者调手感时会改的值。

```swift
script WeaponCooldown {
    @export var fireRate: Float = 0.5
    @export var damage: Int = 10

    var canFire: Bool = true
    var ammo: Int = 30
}
```

`fireRate` 和 `damage` 是设计师或关卡作者会调的参数。`canFire` 和 `ammo` 是运行时内部状态。

## 持久状态

持久状态是“脚本自己记住的事情”。例如还剩多少弹药、当前是不是正在换弹、已经过去多少秒。

脚本作用域的 `var` 会跨帧保留：

```swift
script Timer {
    var elapsed: Float = 0.0

    func update(_ dt: Float) {
        elapsed += dt
    }
}
```

如果把 `elapsed` 写在 `update()` 内部，它每帧都会重新创建，不适合做累计计时器。

## 局部变量

局部变量是“这一小段代码临时算出来的结果”。它不负责长期记忆，只是为了让当前这次计算更清楚。

```swift
func update(_ dt: Float) {
    let pulse: Float = sin(Time.time * 3.0) * 0.2
    position.y = 1.0 + pulse
}
```

`pulse` 只是这一帧的计算结果，用 `let` 就够了。

## 旧式 `state.name`

当前 MVP 可能仍接受：

```swift
state.ammo -= 1
```

新脚本建议优先写成声明式持久状态：

```swift
var ammo: Int = 30

func update(_ dt: Float) {
    ammo -= 1
}
```

这样更容易被编辑器、验证器和 AI 代理理解。
