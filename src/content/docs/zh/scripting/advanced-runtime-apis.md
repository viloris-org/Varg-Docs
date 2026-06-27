---
title: 进阶玩法脚本
description: 用场景查询、动态生成、HUD、音频、鼠标和渲染命令做出真正可玩的循环。
---

学完基础语法后，你已经能写“按键移动”“武器冷却”“计时器”这类局部逻辑。真正的游戏脚本还需要把几个系统接起来：玩家输入改变状态，状态生成或销毁场景对象，场景对象反过来影响得分、失败条件、声音和 UI。

这一页不是完整 API 索引，而是一套写玩法脚本的工作方法。示例来自 Varg 仓库里的项目：

- [examples/project/jump_jump](https://github.com/viloris-org/Varg/tree/main/examples/project/jump_jump)：无尽跳跃，重点是平台生成、落点判定、HUD 和辅助模式。
- [examples/project/fps_arena](https://github.com/viloris-org/Varg/tree/main/examples/project/fps_arena)：射击训练场，重点是第一人称移动、目标生成、换弹、命中反馈和波次压力。

:::note[当前可执行范围]
本页只讲当前 MVP 示例已经使用的能力。通用 `scene.spawn(...)`、资源式 `Audio.play(...)`、事件总线、模块调用、数组和字典属于目标方向，写公共教程时不要把它们当作已稳定能力。
:::

## 一条玩法循环

多数中小型玩法脚本都可以拆成同一条循环：

1. 读取输入：`Input.value`、`Input.pressed`、`Input.mouseDeltaX`。
2. 更新状态：弹药、分数、阶段、计时器、难度、是否失败。
3. 改变世界：移动玩家，生成平台或敌人，销毁被拾取或命中的对象。
4. 查询世界：到最近目标的距离、是否落在平台上、玩家离临时对象多远。
5. 给反馈：HUD、音效、音乐、渲染环境。

写脚本时先把这五步写成注释或小节，再填代码。这样脚本长到几百行时仍然能读。

## 场景标签是低成本接口

Varg 当前 MVP 里，脚本和场景最稳定的连接方式是 tag。你在 `.vscene` 或运行时生成对象时给对象设置标签，然后脚本用标签查询最近对象。

如果你没有用过其它引擎，可以把 tag 理解成“贴在对象身上的标签纸”。脚本不知道场景里具体有多少个平台、目标或收集物，但它可以问：“离我最近的 `Platform` 有多远？”这就是 tag 查询的价值。

```swift
entity "Player" {
    tag: "Player"
}
```

运行时生成对象时也要给 tag：

```swift
scene.spawnSphere("Training Drone Core", "Target", Vec3(x, y, z), 0.42, "scripts/target_drift.varg")
```

脚本里用 tag 判断命中或拾取：

```swift
let targetDistance: Float = scene.distanceToTag("Target")

if targetDistance <= hitRadius {
    scene.destroyNearestWithTag("Target", hitRadius)
    score += 100
}
```

常用查询：

| API | 适合场景 |
| --- | --- |
| `scene.distanceToTag("Target")` | 命中、拾取、危险区接触 |
| `scene.distanceToTagBounds("Platform")` | 判断离对象表面多远 |
| `scene.horizontalDistanceToTagBounds("Platform")` | 平台落点，只看水平误差 |
| `playerDistance()` | 清理离玩家太远的临时对象 |
| `scene.xOf("Player")` / `scene.yOf(...)` / `scene.zOf(...)` | 相机跟随玩家 |

:::tip[公开教程里的说法]
不要把 tag 描述成最终 ECS 查询系统。更准确的说法是：当前 MVP 用 tag 做脚本和场景之间的轻量接口，适合原型、教程和小型玩法。
:::

### 怎么选择距离查询

三个距离函数容易混。可以先按问题来选：

| 你想问的问题 | 推荐 API |
| --- | --- |
| 玩家有没有碰到收集物或危险区 | `scene.distanceToTag(...)` |
| 玩家是不是踩在平台表面附近 | `scene.distanceToTagBounds(...)` |
| 玩家水平位置有没有落在平台范围内 | `scene.horizontalDistanceToTagBounds(...)` |

比如平台落地判断通常要同时看“水平落点”和“离表面高度”：

```swift
let footprint: Float = scene.horizontalDistanceToTagBounds("Platform")
let surface: Float = scene.distanceToTagBounds("Platform")

if footprint <= 0.18 && surface <= 0.98 {
    landed = true
}
```

这样比只看中心点距离稳定。大平台、小平台、长平台都更容易得到合理结果。

## 动态生成对象

当前运行时可以生成盒体和球体。它们足够覆盖平台、目标、收集物、特效点、预览点等教学场景。

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

参数按这个顺序理解：

| 位置 | 含义 |
| --- | --- |
| 1 | 对象名，方便调试和编辑器显示 |
| 2 | 标签，后续查询和销毁使用 |
| 3 | 世界坐标 |
| 4 | 盒体尺寸或球体半径 |
| 5 | 可选脚本路径，常用于漂浮动画或自动清理 |

很多新手生成对象时最容易犯的错是“只生成，不回收”。我们通常给临时对象挂一个清理脚本：

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

这段脚本很小，但它让无尽生成不至于把场景堆满。

### 生成不是随机乱扔

很多教程会直接写随机生成，但入门阶段更推荐“确定性变化”。确定性的意思是：每次运行差不多，方便你判断是规则问题还是运气问题。

```swift
let lane: Float = spawnIndex - floor(spawnIndex / 4.0) * 4.0
let wobble: Float = sin(spawnIndex * 1.7) * 0.9
let x: Float = spawnIndex * segmentLength
let z: Float = -3.0 + lane * 2.0 + wobble
```

这里的 `spawnIndex` 像一个编号。第 0 个、第 1 个、第 2 个对象会被放在不同位置。`sin()` 负责给位置一点起伏，看起来不像机械网格。

### 什么时候挂脚本

`spawnBox` / `spawnSphere` 的最后一个参数可以给生成物挂脚本。常见用途有三类：

| 生成物 | 适合挂的脚本 |
| --- | --- |
| 身后的平台、子弹、特效点 | 自动清理脚本 |
| 收集物、目标、提示球 | 漂浮或旋转脚本 |
| 临时危险区 | 倒计时销毁脚本 |

刚开始做教程时，先挂自动清理脚本就够了。等玩法需要更强反馈，再加漂浮、闪烁或音效脚本。

## 第一人称输入

第一人称控制由两个部分组成：玩家脚本更新 yaw，或者相机脚本读取鼠标并设置 rotation。公开教程建议先讲相机版本，因为它职责更单纯。

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

这个脚本体现了两个好习惯：

- 相机通过 `scene.xOf("Player")` 跟随玩家，不复制玩家移动逻辑。
- pitch 用 `clamp` 限制，不让玩家视角翻转。

### yaw 和 pitch 是什么

如果你没有 3D 编程经验，可以先这样记：

| 名字 | 方向 |
| --- | --- |
| `yaw` | 左右转头 |
| `pitch` | 上下抬头低头 |
| `rotation = Vec3(pitch, yaw, 0.0)` | 把相机转到这个朝向 |

鼠标水平移动通常改变 `yaw`，鼠标垂直移动通常改变 `pitch`。`pitch` 要限制范围，因为人不能把头无限往后仰。

第一人称移动还会把 `yaw` 转成前向：

```swift
let yawRad: Float = yaw * 0.01745329
let forwardX: Float = 0.0 - sin(yawRad)
let forwardZ: Float = cos(yawRad)
```

`0.01745329` 是从“角度”换成“弧度”的近似值。你不需要先懂三角函数，只要知道：`sin/cos` 在这里负责把“面朝多少度”变成“往哪个方向走”。

## HUD 是玩法反馈的一部分

HUD 不只是装饰。它告诉玩家当前目标、弹药、状态、风险、连击和失败原因。Varg MVP 允许脚本每帧发出简单 UI 命令：

```swift
ui.rect("hud_panel", 12.0, 12.0, 340.0, 154.0, 0.03, 0.04, 0.06, 0.86)
ui.label("hud_score", "Score: " + score, 24.0, 42.0)
ui.label("hud_status", status, 24.0, 84.0)
```

进度条也是矩形：

```swift
let chargeWidth: Float = 160.0 * clamp(charge / maxCharge, 0.0, 1.0)

ui.rect("charge_bg", 24.0, 128.0, 160.0, 10.0, 0.18, 0.2, 0.24, 1.0)
ui.rect("charge_fill", 24.0, 128.0, chargeWidth, 10.0, 0.34, 0.75, 0.92, 1.0)
```

交互控件可以直接返回新值：

```swift
assistMode = ui.toggle("assist_toggle", assistMode, 282.0, 112.0, 48.0, 24.0)
```

适合公开教程先讲的 UI：

| API | 用途 |
| --- | --- |
| `ui.label(...)` | 文本 |
| `ui.rect(...)` | 面板、血条、进度条 |
| `ui.toggle(...)` | 开关，例如辅助模式 |
| `ui.slider(...)` | 调试数值，例如难度或音量 |
| `ui.button(...)` | 菜单或重新开始 |

### HUD 先显示决策信息

入门时不要急着做漂亮界面。先问：玩家下一秒需要知道什么？

| 玩法 | HUD 应该先显示 |
| --- | --- |
| 收集小游戏 | 分数、剩余时间、是否结束 |
| 跳跃游戏 | 蓄力、状态、分数、是否开启辅助 |
| 射击训练场 | 弹药、换弹状态、倒计时、目标进度 |

如果一个信息不会影响玩家决策，可以晚点再加。这样 HUD 不会变成一堆数字。

### 调试 UI 也很有用

`ui.slider` 和 `ui.toggle` 不只给玩家用，也可以给开发者调试：

```swift
difficulty = ui.slider("debug_difficulty", difficulty, 0.0, 1.0, 24.0, 148.0, 180.0)
assistMode = ui.toggle("debug_assist", assistMode, 220.0, 148.0, 48.0, 24.0)
```

这样你可以边玩边调难度、速度、辅助模式，不用每改一次数值就重启。

## 音效先用程序化 tone

教程项目不必一开始就引入外部音频管线。程序化 tone 足够表达“成功”“失败”“换弹”“命中”“连击升级”。

```swift
Audio.playTone("square", 220.0, 0.08, 0.14)
Audio.playTone3D("triangle", 880.0 + combo * 18.0, 0.12, 0.34)
```

循环音乐也可以用 pattern：

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

`R` 是休止符。常见波形有 `"sine"`、`"square"`、`"triangle"`、`"saw"`、`"noise"`。

### 给不同事件不同声音

声音不用复杂，但要有区分度：

| 事件 | 推荐感觉 |
| --- | --- |
| 收集成功 | 短、高、干净 |
| 失败 | 低、粗、稍长 |
| 换弹 | 中低频，像机械反馈 |
| 连击 | 音高逐渐升高 |

示例：

```swift
Audio.playTone("triangle", 860.0, 0.08, 0.25)
Audio.playTone("noise", 120.0, 0.18, 0.28)
Audio.playTone("square", 220.0, 0.08, 0.14)
Audio.playTone3D("sine", 760.0 + combo * 18.0, 0.04, 0.22)
```

先让每个事件有清楚反馈，再考虑真实音频资源。

## 渲染命令要分清初始化和动态更新

全局光照设置通常只需要初始化一次：

```swift
if !renderReady {
    render.gi.useScreenSpace()
    render.gi.useProbeVolume(Vec3(10.0, 3.5, 7.0), Vec3(42.0, 12.0, 26.0), Vec3(5.0, 3.0, 4.0), giIntensity)
    render.gi.setIntensity(giIntensity)
    renderReady = true
}
```

随难度变化的强度可以每帧更新：

```swift
render.gi.setIntensity(giIntensity + difficulty * 0.35)
```

公开教程里可以把这个模式叫做“一次性配置 + 每帧调制”。读者会更容易迁移到其他系统。

### 什么时候需要渲染 API

渲染 API 不是入门脚本的必需品。它适合在玩法规则已经成立后，用来加强场景氛围和反馈。

| 需求 | 可以使用 |
| --- | --- |
| 场景整体更亮或更暗 | `render.gi.setIntensity(...)` |
| 原型场景需要快速有光照层次 | `render.gi.useScreenSpace()` |
| 固定区域需要更稳定的 GI | `render.gi.useProbeVolume(...)` |

教程中建议把渲染放在“反馈增强”章节，而不是放在第一步。否则读者还没理解移动、状态和判定，就会被图形概念打断。

## 一个公开教程的最小检查清单

写面向玩家或创作者的高级教程时，至少交代这些内容：

| 项目 | 为什么重要 |
| --- | --- |
| 成品效果 | 读者知道自己会做出什么 |
| 输入和控制 | 读者能立刻试玩 |
| 文件清单 | 读者知道要看哪些文件 |
| 状态表 | 读者能理解脚本为什么需要这些变量 |
| 主循环 | 解释每帧做什么，而不是只贴代码 |
| 失败和反馈 | 游戏感来自反馈，不只是规则 |
| 扩展任务 | 让读者能继续改出自己的版本 |

下一章开始，我们用这套方式重写两个完整项目教程。
