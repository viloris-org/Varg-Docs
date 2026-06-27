---
title: 教程：制作无尽跳跃
description: 从场景、脚本状态、运行时平台生成到 HUD，拆开 Jump Jump 的玩法循环。
---

Jump Jump 是一个很小的第一人称无尽跳跃游戏，但它包含一条完整的玩法闭环：蓄力、起跳、落地判定、得分、失败、重试，以及不断向前延展的关卡。

玩家按住 Space 蓄力，松开后沿视角方向跳到下一块平台。脚本会在前方生成新平台、收集物和危险区。落地成功得分，踩到危险区或跳空则失败，并从最近检查点重试。

示例源码：[examples/project/jump_jump](https://github.com/viloris-org/Varg/tree/main/examples/project/jump_jump)。

:::tip[适合什么时候读]
如果你刚学完脚本基础，可以先跟到“第四步：写空中弧线”。那已经能做出一个可玩的跳跃原型。后面的落地判定、无尽生成和 HUD 是把原型变成完整小游戏，不需要一口气吃完。
:::

## 开始前先会这些

- 看得懂 `@export var` 和普通 `var` 的区别。
- 知道 `start()` 用来初始化，`update(_ dt: Float)` 每帧运行。
- 会用 `Input.down`、`Input.released` 和 `position`。
- 知道 tag 是脚本查找场景对象的名字。

如果这些还不熟，先读 [零基础脚本入门](/scripting/programming-primer/)、[脚本基础](/scripting/basics/) 和 [生命周期与输入](/scripting/lifecycle-input/)。如果你想先做一个更小的玩法闭环，可以先跟 [中间练习：做一个可玩的收集循环](/tutorials/first-playable-loop/)。

## 你会学到什么

- 如何把 `.vscene` 当作初始关卡，把 `.varg` 当作运行时玩法。
- 如何用 `phase` 写一个简单但稳定的玩家状态机。
- 如何用 `scene.spawnBox` 和 `scene.spawnSphere` 做无尽生成。
- 如何用 tag 和距离查询判断落地、收集、危险区。
- 如何用 `ui.rect`、`ui.label`、`ui.toggle` 做 HUD 和辅助模式。
- 如何用程序化音效和 GI 强度让玩法更有反馈。

这一页的跨度确实比前面的语法页大。读的时候可以把它分成三段：第一到第四步做“能跳”；第五到第七步做“能判定和生成”；第八步再做“让玩家看懂发生了什么”。

## 成品玩法

控制方式：

| 输入 | 行为 |
| --- | --- |
| 鼠标移动 | 调整瞄准方向 |
| Space 按住 | 蓄力 |
| Space 松开 | 跳跃 |
| WASD | 在跳跃方向上增加一点偏移 |
| Fire | 重新捕获鼠标 |
| Assist toggle | 显示落点预览 |

玩法循环：

1. 玩家在平台上蓄力。
2. 松开 Space 后进入空中阶段。
3. 落地时脚本检查最近平台、目标平台、危险区和收集物。
4. 成功则更新检查点、分数、连击和难度。
5. 脚本持续在玩家前方生成下一批平台。

## 项目结构

```txt
jump_jump/
├── Varg.toml
├── scenes/
│   └── jump_jump.vscene
└── scripts/
    ├── jump_player.varg
    ├── first_person_camera.varg
    ├── despawn_far.varg
    └── bobber.varg
```

`Varg.toml` 定义默认场景和脚本根：

```toml
name = "Jump Jump"
asset_root = "assets"
script_roots = ["scripts"]
default_scene = "scenes/jump_jump.vscene"
```

这意味着场景里写 `source: "scripts/jump_player.varg"` 时，运行时能在项目里找到脚本。

## 第一步：准备初始场景

`.vscene` 负责“游戏开始时有哪些东西”。Jump Jump 的初始场景至少需要：

- 一个相机，挂 `FirstPersonCamera`。
- 一个玩家对象，tag 是 `Player`，挂 `JumpPlayer`。
- 几块起始平台，tag 是 `Platform` 或 `Goal`。
- 一些灯光，让游戏一开始就可读。

玩家脚本挂载片段类似这样：

```swift
script JumpPlayer {
    source: "scripts/jump_player.varg"
    maxCharge: 1.25
    jumpScale: 5.0
    arcHeight: 3.0
    spawnAhead: 36.0
    segmentLength: 2.9
    routeYaw: -34.0
    giIntensity: 1.35
}
```

这里传入的值会覆盖脚本里的 `@export var` 默认值。也就是说，`.vscene` 里的脚本字段不是装饰，它就是关卡调参入口。先把这些参数暴露出来，后面调手感才不会变成改代码猜数值。

## 第二步：定义玩家状态

`jump_player.varg` 的变量看起来很多，但可以分组理解：

| 分组 | 变量例子 | 用途 |
| --- | --- | --- |
| 调参 | `maxCharge`、`jumpScale`、`arcHeight`、`spawnAhead` | 设计师调玩法手感 |
| 跳跃状态 | `charge`、`phase`、`jumpTime`、`startX`、`targetX` | 控制蓄力和空中移动 |
| 进度 | `score`、`bestDistance`、`combo`、`difficulty` | 记录玩家表现 |
| 生成 | `nextSpawnX`、`nextSpawnZ`、`spawnIndex` | 决定下一批平台在哪里 |
| 反馈 | `hudStatus`、`musicStarted`、`renderReady` | 控制 UI、音频和渲染 |
| 失败恢复 | `gameOver`、`checkpointX`、`checkpointZ` | 从最近安全位置重试 |

先给变量分组，再读代码，会比从第一行读到最后一行可靠。状态机脚本最怕变量散落一地，看起来每个值都重要，结果读者不知道哪个值属于哪套规则。

## 第三步：写蓄力阶段

`phase == 0` 表示玩家在地面上，可以蓄力。

```swift
if phase == 0 {
    hudStatus = "Mouse look / hold Space"

    if Input.down("Jump") {
        charge += dt
        if charge > maxCharge {
            charge = maxCharge
        }
        hudStatus = "Release to jump"
    }
}
```

这里不用 `wait()`，因为蓄力每帧都要响应输入和 HUD。只要 Space 按住，就累计 `charge`；到达上限后用 `maxCharge` 截断。

松开 Space 时，把当前点和目标点保存下来，然后切换到空中阶段：

```swift
if Input.released("Jump") && charge > 0.05 {
    startX = position.x
    startZ = position.z

    let yawRad: Float = aimYaw * 0.01745329
    let forwardX: Float = -sin(yawRad)
    let forwardZ: Float = cos(yawRad)
    let distance: Float = charge * jumpScale

    targetX = position.x + forwardX * distance
    targetZ = position.z + forwardZ * distance

    jumpTime = 0.0
    phase = 1
    hudStatus = "Airborne"
    Audio.playTone3D("sine", 360.0 + charge * 260.0, 0.08, 0.22)
}
```

这段代码的关键是“目标点在松手瞬间才结算”。按住时玩家仍然可以调整视角；松开后，脚本用当时的 yaw 算出前向，再把 `charge` 变成距离。

## 第四步：写空中弧线

`phase == 1` 表示玩家正在飞行。水平位置用 `lerp`，垂直高度用 `sin`。

```swift
if phase == 1 {
    jumpTime += dt * 1.85
    let t: Float = clamp(jumpTime, 0.0, 1.0)

    position.x = lerp(startX, targetX, t)
    position.z = lerp(startZ, targetZ, t)
    position.y = 1.1 + sin(t * 3.14159) * arcHeight
}
```

为什么这样写：

- `lerp(start, target, t)` 让水平移动稳定可控。
- `sin(t * pi)` 在起点和终点都是 0，中间最高，天然像跳跃弧线。
- `clamp` 保证 `t` 不超过 1，避免落地后继续外推。

这不是最终物理角色控制器，却是很好的第一版玩法代码：可解释、可调、能立刻玩。等规则站稳以后，再替换成更真实的运动模型也不迟。

## 第五步：落地判定

当 `jumpTime >= 1.0`，脚本开始判断是否落地。

```swift
let platformFootprint: Float = scene.horizontalDistanceToTagBounds("Platform")
let platformSurface: Float = scene.distanceToTagBounds("Platform")
let goalFootprint: Float = scene.horizontalDistanceToTagBounds("Goal")
let goalSurface: Float = scene.distanceToTagBounds("Goal")

var landed: Bool = false

if platformFootprint <= 0.18 && platformSurface <= 0.98 {
    landed = true
}

if goalFootprint <= 0.18 && goalSurface <= 0.98 {
    landed = true
}

if scene.distanceToTag("Hazard") <= 0.9 {
    landed = false
    dangerStreak += 1
}
```

这里有一个很重要的技巧：用 `horizontalDistanceToTagBounds` 判断水平落点，用 `distanceToTagBounds` 判断离表面是否足够近。只用中心点距离会让大平台和小平台手感不一致。

## 第六步：奖励、失败和检查点

成功落地后，更新分数和检查点：

```swift
if landed {
    score += 1 + dangerStreak
    combo += 1
    checkpointX = position.x
    checkpointZ = position.z

    if combo > bestCombo {
        bestCombo = combo
    }
}
```

收集物也是 tag 查询：

```swift
if scene.distanceToTag("Collectible") <= 1.45 {
    score += 10 + combo
    scene.destroyNearestWithTag("Collectible", 1.45)
    Audio.playTone3D("triangle", 880.0 + combo * 18.0, 0.12, 0.34)
    hudStatus = "Crystal +" + (10 + combo)
}
```

失败时不要直接重开场景。把 `gameOver` 设为 `true`，让 HUD 有机会显示结果：

```swift
if !landed {
    position.y = -1.2
    gameOver = true
    combo = 0
    Audio.stopLoop("jump_rush_bgm")
    musicStarted = false
    Audio.playTone("noise", 120.0, 0.18, 0.28)
}
```

重试时从最近检查点恢复：

```swift
if gameOver && Input.pressed("Jump") {
    charge = 0.0
    phase = 0
    jumpTime = 0.0
    gameOver = false
    position = Vec3(checkpointX, 1.1, checkpointZ)
}
```

## 第七步：无尽生成平台

平台不是全部写在场景里，而是运行时补在玩家前方。

```swift
while nextSpawnX < position.x + spawnAhead {
    let lane: Float = spawnIndex - floor(spawnIndex / 4.0) * 4.0
    let wobble: Float = sin(spawnIndex * 1.7) * 0.9
    let platformZ: Float = nextSpawnZ + wobble
    let platformWidth: Float = 2.7 + abs(sin(spawnIndex * 0.9)) * 0.7 - difficulty * 0.65
    let platformDepth: Float = 2.8 - difficulty * 0.45

    scene.spawnBox("Generated Platform", "Platform", Vec3(nextSpawnX, 0.0, platformZ), Vec3(platformWidth, 0.5, platformDepth), "scripts/despawn_far.varg")

    nextSpawnX += segmentLength + difficulty * 0.38
    nextSpawnZ += 0.72 + sin(spawnIndex * 0.6) * 0.25 + difficulty * 0.1
    spawnIndex += 1
}
```

这个生成器不是随机乱放，而是“确定性变化”：

- `spawnIndex` 让每段都能复现。
- `sin(spawnIndex * n)` 让位置和宽度产生变化。
- `difficulty` 让平台逐渐变窄、间距逐渐变化。
- `despawn_far.varg` 负责清理身后的对象。

## 第八步：加入 HUD 和辅助模式

HUD 需要显示玩家能做决策的信息：分数、距离、连击、状态、风险和蓄力条。

```swift
let chargeWidth: Float = 160.0 * clamp(charge / maxCharge, 0.0, 1.0)

ui.rect("jump_hud_panel", 12.0, 12.0, 340.0, 154.0, 0.03, 0.04, 0.06, 0.86)
ui.label("jump_hud_score", "Score: " + score, 24.0, 42.0)
ui.label("jump_hud_distance", "Distance: " + floor(bestDistance), 154.0, 42.0)
ui.label("jump_hud_status", hudStatus, 24.0, 84.0)
ui.rect("jump_hud_charge_bg", 24.0, 128.0, 160.0, 10.0, 0.18, 0.2, 0.24, 1.0)
ui.rect("jump_hud_charge", 24.0, 128.0, chargeWidth, 10.0, 0.34, 0.75, 0.92, 1.0)
```

辅助模式用 `ui.toggle` 控制：

```swift
assistMode = ui.toggle("jump_assist_toggle", assistMode, 282.0, 112.0, 48.0, 24.0)
```

开启后生成一个临时预览球：

```swift
if assistMode && ghostCooldown <= 0.0 {
    scene.spawnSphere("Assist Landing Preview", "Assist", Vec3(previewX, 0.78, previewZ), 0.18, "scripts/despawn_far.varg")
    ghostCooldown = 0.18
}
```

这一步把脚本从“能运行”推到“玩家能读懂”。很多原型失败不是因为规则不好，而是玩家不知道自己刚才做对了什么、错在了哪里。

## 常见问题

| 问题 | 可能原因 | 修法 |
| --- | --- | --- |
| 平台生成后无法落地 | tag 写错，或者没有用 `Platform` / `Goal` | 检查生成和场景里的 tag |
| 生成对象越来越多 | 没挂清理脚本 | 给运行时生成物传入 `scripts/despawn_far.varg` |
| 跳跃方向不对 | yaw 转弧度或 forward 方向写反 | 检查 `yaw * 0.01745329` 和 `-sin/cos` |
| 蓄力条不动 | `charge` 没有跨帧保存 | 确认 `charge` 是脚本作用域 `var` |
| 重试后状态异常 | 只重置了位置，没重置 phase/timer | 把失败恢复相关变量集中重置 |

## 练习

1. 增加一种 `Bonus` 平台，落上去额外加时间。
2. 让 `assistMode` 只在新手前 100 米可用。
3. 把危险区的生成概率随 `difficulty` 提高。
4. 用 `ui.slider` 做一个调试面板，运行时调 `jumpScale`。
5. 给连续完美落地增加不同音高的提示音。
