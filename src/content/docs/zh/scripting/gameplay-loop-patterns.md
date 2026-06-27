---
title: 从基础到进阶：组织玩法脚本
description: 学完变量、输入和控制流后，先用一套稳定结构把它们组织成可维护的玩法脚本。
---

学完变量、`update()`、输入和 `if` 以后，很多人会卡在同一个地方：每个知识点都看得懂，但不知道怎么把它们放进一个真正的玩法脚本里。

这一页就是补中间那段。它不急着讲高级 API，也不要求你立刻做完整项目。目标只有一个：学会把“基础语法”整理成一条清楚的玩法循环。

## 先从一句玩法规则开始

写脚本前，不要先想代码。先把玩法规则写成人话：

> 玩家按下 Fire 时发射；发射后进入冷却；冷却期间不能再次发射；HUD 显示当前状态。

这句话可以拆成四类内容：

| 类别 | 例子 | 脚本里通常放哪里 |
| --- | --- | --- |
| 输入 | 按下 `Fire` | `update()` 里读 `Input.pressed(...)` |
| 状态 | 是否冷却中、冷却还剩多久 | 脚本作用域的 `var` |
| 规则 | 能发射才发射，冷却归零才恢复 | `if` 判断 |
| 反馈 | HUD 文本、音效、日志 | 规则变化后更新 |

这张表比代码更重要。只要能分清这四类，脚本就不会一开始变成一团。

## 一个推荐的脚本骨架

入门玩法脚本可以先按这个顺序写：

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
        // 1. 更新已有状态

        // 2. 读取输入

        // 3. 根据规则改变状态

        // 4. 给玩家反馈
    }
}
```

先写注释也可以。注释不是装饰，它帮你把“每帧做什么”排好顺序。

## 第一步：先让状态自己流动

冷却、倒计时、持续时间这类状态，不需要玩家输入也会变化。通常先更新它们：

```swift
if cooldown > 0.0 {
    cooldown -= dt

    if cooldown <= 0.0 {
        cooldown = 0.0
        status = "Ready"
    }
}
```

这里有两个细节：

- `cooldown -= dt` 表示时间往下走。
- 归零时把它夹回 `0.0`，HUD 和判断都会更干净。

很多初学者会只写 `cooldown -= dt`，不处理小于 0 的情况。短期能跑，但后面判断和显示会越来越乱。

## 第二步：再读取输入

输入建议靠近使用它的地方。不要一上来读一大堆按键，然后隔几十行才用。

```swift
if Input.pressed("Fire") && cooldown <= 0.0 {
    cooldown = cooldownTime
    status = "Fired"
    Audio.playTone("square", 520.0, 0.05, 0.2)
}
```

这段可以直接读成：

1. 如果这一帧刚按下 `Fire`。
2. 并且当前不在冷却。
3. 就进入冷却，改状态文字，播放音效。

这是最常见的玩法脚本形状：输入不是直接“做事”，而是触发状态变化。

## 第三步：把 HUD 放在最后

HUD 通常放在 `update()` 末尾，因为它显示的是这一帧算完后的结果。

```swift
ui.rect("action_panel", 12.0, 12.0, 280.0, 96.0, 0.03, 0.04, 0.06, 0.86)
ui.label("action_status", status, 24.0, 42.0)
ui.label("action_cooldown", "Cooldown: " + cooldown, 24.0, 70.0)
```

如果先画 HUD，再改 `status`，玩家看到的就会慢一拍。入门时先记住这个经验规则：先算规则，最后显示结果。

## 完整小例子

把上面的部分合在一起：

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

这个脚本很小，但它已经包含完整玩法脚本的基本结构：参数、状态、输入、规则、反馈。

## 从一个动作扩展成玩法

接下来不是换一套写法，而是在同一套结构里加更多状态。

| 想加的玩法 | 新状态 | 新规则 |
| --- | --- | --- |
| 弹药 | `ammo` | 发射时扣 1，没弹药不能发射 |
| 换弹 | `reloading`、`reloadTimer` | 按 Interact 后倒计时，结束后补弹 |
| 得分 | `score` | 命中或收集时加分 |
| 倒计时 | `timeLeft`、`gameOver` | 时间归零后停止输入 |

比如加弹药，不需要推翻脚本，只是在输入判断里多一个条件：

```swift
if Input.pressed("Fire") && cooldown <= 0.0 && ammo > 0 {
    ammo -= 1
    cooldown = cooldownTime
    status = "Fired"
}
```

如果弹药不足，就写另一条规则：

```swift
if Input.pressed("Fire") && ammo <= 0 {
    status = "Empty"
    Audio.playTone("square", 120.0, 0.08, 0.18)
}
```

玩法脚本就是这样长大的：不是一次写一个巨大的系统，而是不断增加清楚的小状态和小规则。

## 什么时候用 `wait()`，什么时候用计时器

`wait()` 适合很短、很孤立的节奏：

```swift
canFire = false
wait(fireRate)
canFire = true
```

但如果等待期间还要继续显示 HUD、移动玩家、处理失败或允许取消，就改用显式计时器：

```swift
if reloadTimer > 0.0 {
    reloadTimer -= dt
    status = "Reloading"
}
```

经验规则：

| 情况 | 推荐 |
| --- | --- |
| 只是一个简单冷却示例 | `wait()` 可以 |
| HUD 要显示剩余时间 | 显式计时器 |
| 玩家等待时还能移动 | 显式计时器 |
| 状态可能被取消或打断 | 显式计时器 |

完整项目教程里大多使用显式计时器，因为它更容易调试，也更容易和其它系统一起工作。

## 读长脚本的方法

看到一个几十行或几百行的玩法脚本时，不要从第一行硬读。先找这几块：

| 先找什么 | 你会知道什么 |
| --- | --- |
| `@export var` | 这个脚本哪些数值可以调 |
| 脚本作用域 `var` | 它要记住哪些状态 |
| `start()` | 开始时做了哪些初始化 |
| `update()` 前半段 | 每帧哪些状态在自然变化 |
| 输入判断 | 玩家能触发哪些状态变化 |
| HUD 和音效 | 哪些规则会给反馈 |

这个读法能直接衔接到下一页的高级运行时 API。高级 API 不是另一套世界，它只是给“改变场景、查询场景、播放声音、画 HUD”这些步骤提供更多工具。

## 下一步

现在你已经知道怎么把基础语法组织成玩法脚本。接下来有两条路：

- 想继续学 API：读 [高级运行时 API](/zh/scripting/advanced-runtime-apis/)，学习场景查询、动态生成、HUD、音频和渲染命令。
- 想先做一个小闭环：跟 [中间练习：做一个可玩的收集循环](/zh/tutorials/first-playable-loop/)，把移动、拾取、得分、倒计时和 HUD 接起来。
