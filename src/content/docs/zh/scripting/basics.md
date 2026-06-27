---
title: 脚本基础
description: 学习 Varg 脚本的文件角色、script 声明和基本结构。
---

`.varg` 是 Varg 的运行时逻辑文件。你可以先把它理解成“挂在游戏对象上的一段规则”：什么时候开始、每帧做什么、玩家按键时怎么反应。

如果你没有学过其它编程语言，建议先读 [零基础脚本入门](/zh/scripting/programming-primer/)。那一页会用更慢的速度解释变量、函数、条件和循环。

它使用接近 Swift 的语法，但不是 Swift；它面向游戏脚本、模块和声明式行为。刚开始只需要关心 `script`，其它声明以后再看也来得及。

## 顶层声明

`.varg` 允许三种顶层声明：

| 声明 | 用途 | 当前建议 |
| --- | --- | --- |
| `script` | 挂在实体上的运行时逻辑 | 主要使用 |
| `module` | 被其他 `.varg` 导入的复用代码 | 目标 API，谨慎使用 |
| `behavior` | 声明式行为树或状态机 | 目标 API，偏设计中 |

当前教程重点使用 `script`。

:::tip[先抓住三件事]
一个入门脚本通常只需要三块：`@export var` 给编辑器调参，普通 `var` 记住运行时状态，`start()` / `update(_ dt: Float)` 放实际逻辑。后面的 API 都是往这三块里填东西。
:::

## 最小脚本

```swift
script HelloVarg {
    func start() {
        log("Hello Varg")
    }
}
```

解释：

- `script HelloVarg` 定义一个可挂载到实体上的脚本。
- `func start()` 是生命周期函数，在脚本开始运行时调用。
- `log("...")` 输出字面量日志。当前 MVP 支持字面量字符串日志。

## 一个更完整的结构

```swift
script PlayerController {
    @export var speed: Float = 6.0
    var jumpsLeft: Int = 1

    func start() {
        log("player ready")
    }

    func update(_ dt: Float) {
        let moveX: Float = Input.value("MoveX")
        entity.translate(Vec3(moveX * speed * dt, 0, 0))
    }
}
```

脚本由三类内容组成：

- 导出参数：`@export var speed`，给编辑器和关卡调参使用。
- 持久状态：`var jumpsLeft`，脚本运行期间会保留。
- 生命周期函数：`start()`、`update(_ dt: Float)` 等，承载实际逻辑。

## 当前可执行 MVP 边界

下面是当前可以放心使用的能力。它看起来很多，不需要背；先知道它们分成几类，写脚本时回来查名字即可。

基础语法：

- `let`、`var`、`@export var`
- `start`、`update`、`fixedUpdate`
- `if`、`else`、`for`、`while`
- `return`、`break`、`continue`
- `wait(expression)`
- `log("literal message")`

输入和移动：

- `Input.down`、`Input.pressed`、`Input.released`、`Input.value`
- `Input.mouseDeltaX`、`Input.mouseDeltaY`、`Input.captureMouse`
- `position` 和 `entity.translate(Vec3(...))`

场景查询和生成：

- `scene.spawnBox`、`scene.spawnSphere`、`scene.destroyNearestWithTag`
- `scene.distanceToTag`、`scene.distanceToTagBounds`、`scene.horizontalDistanceToTagBounds`
- `scene.xOf`、`scene.yOf`、`scene.zOf`、`playerDistance()`

反馈系统：

- `Audio.playTone`、`Audio.playTone3D`、`Audio.startLoop`、`Audio.stopLoop`
- `ui.label`、`ui.rect`、`ui.button`、`ui.toggle`、`ui.slider`、`ui.dragX`、`ui.dragY`、`ui.input`
- `render.gi.useScreenSpace`、`render.gi.useProbeVolume`、`render.gi.setIntensity`

暂时不要把目标 API 当成已完成运行时能力，包括通用 `scene.spawn(...)`、事件 `emit(...)`、资源式 `Audio.play(...)`、数组、字典、可选绑定和模块调用。它们属于语言方向，接入执行前应等待诊断或实现更新。
