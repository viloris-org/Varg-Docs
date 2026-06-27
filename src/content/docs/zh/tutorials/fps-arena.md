---
title: 教程：制作射击训练场
description: 从第一人称移动、换弹、目标生成、命中反馈到 HUD，拆开 FPS Arena 的节奏。
---

FPS Arena 是一个封闭场地里的射击训练场。它没有复杂资源，也没有完整武器系统；它关心的是更基础也更重要的事：玩家能移动、能开火、能换弹，目标会持续出现，压力会随时间上升。

玩家在场地中移动、瞄准并射击动态生成的无人机目标。目标越积越多会扣除完整度，清除足够目标即可通关。

示例源码：[examples/project/fps_arena](https://github.com/viloris-org/Varg/tree/main/examples/project/fps_arena)。

:::note[阅读建议]
这篇比 Jump Jump 更像“多系统合成”：移动、武器、刷怪、胜负、HUD 都在同一个主脚本里。第一次读可以先抓住移动和换弹，目标生成与胜负压力放到第二遍。
:::

## 开始前先会这些

- 已经读过 [教程：制作无尽跳跃](/zh/tutorials/jump-jump/) 的前四步，或者能看懂 `phase`、计时器和 `position`。
- 如果你没有编程基础，已经做过 [中间练习：做一个可玩的收集循环](/zh/tutorials/first-playable-loop/)。
- 知道 `dt` 为什么要乘到移动和倒计时里。
- 知道 tag 查询不是最终射线系统，而是当前 MVP 里做命中和距离判断的实用办法。

## 你会学到什么

- 如何用 yaw、前向向量和输入轴做第一人称移动。
- 如何用显式计时器写换弹，而不是依赖 `wait()`。
- 如何用运行时生成对象拼出复杂目标。
- 如何用 tag 距离做 MVP 命中判定。
- 如何用多个计时器驱动目标生成、倒计时和压力惩罚。
- 如何把 HUD、音效和状态文本接到玩法循环。

## 成品玩法

控制方式：

| 输入 | 行为 |
| --- | --- |
| WASD | 移动 |
| Shift | 冲刺 |
| 鼠标移动 | 瞄准 |
| Fire | 射击 |
| Interact | 换弹 |
| Esc / Q | 菜单或退出，取决于运行时宿主 |

胜负条件：

- 在倒计时结束前清除指定数量的目标。
- 太多目标未处理时，`integrity` 会下降。
- 时间归零或完整度归零则失败。

## 项目结构

```txt
fps_arena/
├── Varg.toml
├── scenes/
│   └── fps_arena.vscene
└── scripts/
    ├── fps_player.varg
    ├── fps_camera.varg
    ├── target_drift.varg
    ├── drone_part_drift.varg
    └── despawn_far.varg
```

`fps_player.varg` 是主脚本，其他脚本提供相机跟随、目标漂浮和运行时对象清理。

## 第一步：把场景当作训练场

场景文件负责静态内容：地面、墙、灯光、玩家和相机。玩家对象使用 `Player` tag，脚本用这个 tag 做相机跟随和清理距离。

玩家脚本挂载片段：

```swift
script FpsPlayer {
    source: "scripts/fps_player.varg"
    moveSpeed: 4.8
    sprintMultiplier: 1.55
    arenaLimitX: 8.5
    arenaLimitZ: 10.5
    fireRate: 0.16
    reloadTime: 1.15
    magazineSize: 24
    hitRadius: 2.35
    spawnAhead: 8.5
    giIntensity: 1.2
}
```

这组参数说明它不是只能跑固定数值的 demo。移动速度、场地边界、射击半径、弹匣大小、换弹时间和 GI 强度都可以作为关卡调参点。先把这些旋钮摆出来，后面调难度才有抓手。

## 第二步：整理脚本状态

`FpsPlayer` 的变量可以按系统分组：

| 分组 | 变量例子 | 用途 |
| --- | --- | --- |
| 视角和移动 | `yaw`、`moveSpeed`、`arenaLimitX` | 玩家控制 |
| 武器 | `ammo`、`reserve`、`canFire`、`reloading`、`reloadTimer` | 射击和换弹 |
| 目标生成 | `targetTimer`、`targetIndex`、`spawnAhead`、`activeTargets` | 控制刷怪 |
| 计分 | `score`、`streak`、`shots`、`hits`、`cleared` | 反馈玩家表现 |
| 压力 | `roundTimer`、`integrity`、`pressureTimer`、`wave` | 胜负节奏 |
| 反馈 | `status`、`musicStarted`、`renderReady` | HUD、音频、渲染 |

先看这张表，再看代码，会更容易分清“武器状态”“刷怪状态”和“胜负状态”。几十个变量并不可怕，可怕的是它们看起来都像同一层东西。

## 第三步：第一人称移动

FPS 移动的核心是把 yaw 转成前向和右向，再用输入轴合成移动。

```swift
yaw += Input.mouseDeltaX() * 0.08
yaw += Input.value("LookX") * 86.0 * dt

let yawRad: Float = yaw * 0.01745329
let forwardX: Float = 0.0 - sin(yawRad)
let forwardZ: Float = cos(yawRad)
let rightX: Float = cos(yawRad)
let rightZ: Float = sin(yawRad)

var speed: Float = moveSpeed
if Input.down("Sprint") {
    speed = moveSpeed * sprintMultiplier
}

let moveX: Float = Input.value("MoveX")
let moveZ: Float = Input.value("MoveY")
let deltaX: Float = rightX * moveX + forwardX * moveZ
let deltaZ: Float = rightZ * moveX + forwardZ * moveZ

position.x += deltaX * speed * dt
position.z += deltaZ * speed * dt
position.x = clamp(position.x, -arenaLimitX, arenaLimitX)
position.z = clamp(position.z, -arenaLimitZ, arenaLimitZ)
rotation = Vec3(0.0, yaw, 0.0)
```

这段代码值得逐行讲：

- 鼠标和手柄 look 共同改变 `yaw`。
- `sin/cos` 把角度变成方向向量。
- `MoveX` 走右向，`MoveY` 走前向。
- `dt` 保证移动不依赖帧率。
- `clamp` 把玩家留在训练场中。

## 第四步：一次性初始化反馈系统

渲染和音乐不要每帧重新初始化。用布尔状态保护它们：

```swift
if !renderReady {
    render.gi.useScreenSpace()
    render.gi.useProbeVolume(Vec3(0.0, 2.5, 0.0), Vec3(18.0, 8.0, 22.0), Vec3(4.0, 3.0, 4.0), giIntensity)
    render.gi.setIntensity(giIntensity)
    renderReady = true
}

if !musicStarted {
    Audio.startLoop("fps_arena_pulse", "saw", "C3 R G3 R Bb3 R G3 R", 128.0, 0.42, 0.08)
    musicStarted = true
}
```

这个模式可以迁移到很多系统：第一次运行时设置环境，每帧只更新真正变化的数值。它也能避免某些状态被反复重置，导致你以为是渲染或音频坏了。

## 第五步：武器和换弹

射击先检查弹药：

```swift
func fireWeapon() {
    if ammo <= 0 {
        status = "Empty - reload"
        Audio.playTone("square", 110.0, 0.05, 0.18)
        return
    }

    ammo -= 1
    shots += 1
    canFire = false
    Audio.playTone3D("sine", 760.0 + streak * 12.0, 0.04, 0.22)
}
```

换弹用显式计时器：

```swift
if Input.pressed("Interact") && !reloading && ammo < magazineSize && reserve > 0 {
    reloading = true
    canFire = false
    reloadTimer = reloadTime
    Audio.playTone("square", 220.0, 0.08, 0.14)
}

if reloading {
    reloadTimer -= dt
    status = "Reloading"

    if reloadTimer <= 0.0 {
        let needed: Int = magazineSize - ammo
        if reserve >= needed {
            ammo = magazineSize
            reserve -= needed
        } else {
            ammo += reserve
            reserve = 0
        }

        reloading = false
        canFire = true
        status = "Ready"
    }
}
```

这里不用 `wait(reloadTime)`。换弹期间 HUD、目标压力、倒计时和移动都要继续运行；显式计时器能把“正在换弹”作为普通状态暴露给其它逻辑。

## 第六步：生成无人机目标

目标不是一个模型资源，而是运行时生成的一组简单几何体：

```swift
scene.spawnSphere("Training Drone Core", "Target", Vec3(x, y, targetZ), 0.42, "scripts/target_drift.varg")
scene.spawnBox("Training Drone Top Plate", "DronePart", Vec3(x, y + 0.47, targetZ), Vec3(0.92, 0.12, 0.34), "scripts/drone_part_drift.varg")
scene.spawnBox("Training Drone Bottom Plate", "DronePart", Vec3(x, y - 0.47, targetZ), Vec3(0.72, 0.1, 0.28), "scripts/drone_part_drift.varg")
scene.spawnBox("Training Drone Left Wing", "DronePart", Vec3(x - 0.58, y, targetZ), Vec3(0.16, 0.34, 0.76), "scripts/drone_part_drift.varg")
scene.spawnBox("Training Drone Right Wing", "DronePart", Vec3(x + 0.58, y, targetZ), Vec3(0.16, 0.34, 0.76), "scripts/drone_part_drift.varg")
```

这种做法特别适合教程：

- 不需要外部模型资源。
- 每个部件都能挂漂浮脚本。
- 核心球用 `Target` tag，装饰部件用 `DronePart` tag。
- 命中时可以分别销毁核心和零件。

目标位置用 `targetIndex` 做确定性变化：

```swift
let lane: Float = targetIndex - floor(targetIndex / 5.0) * 5.0
let x: Float = -5.6 + lane * 2.8
let z: Float = -1.0 + sin(targetIndex * 1.1) * 5.4
let y: Float = 1.35 + abs(sin(targetIndex * 0.7)) * 1.45
let targetZ: Float = z + spawnAhead
```

这比纯随机更适合教学和调试，因为每次运行都能复现相似节奏。

## 第七步：MVP 命中判定

当前示例没有用射线枪，而是用到最近 `Target` 的距离近似命中：

```swift
let targetDistance: Float = scene.distanceToTag("Target")

if targetDistance <= hitRadius {
    hits += 1
    streak += 1
    cleared += 1
    activeTargets -= 1
    score += 100 + streak * 15
    roundTimer += 0.55
    status = "Target down +" + streak

    scene.destroyNearestWithTag("Target", hitRadius)
    scene.destroyNearestWithTag("DronePart", hitRadius + 1.4)
    scene.destroyNearestWithTag("DronePart", hitRadius + 1.4)
    scene.destroyNearestWithTag("DronePart", hitRadius + 1.4)
} else {
    streak = 0
    roundTimer -= 0.65
    status = "Miss - time lost"
}
```

这段代码承认自己是 MVP：它不是最终的射线枪，但已经足够验证弹药、得分、连击、目标生成和反馈节奏。先把游戏循环跑通，再把命中模型换精细。

连续调用 `destroyNearestWithTag("DronePart", ...)` 是因为当前 API 每次销毁最近一个对象。重复几次可以清理目标周围的一组零件。

## 第八步：用多个计时器制造压力

射击场不是一个线性状态机，而是几个并行计时器：

```swift
roundTimer -= dt
pressureTimer -= dt
targetTimer -= dt
```

目标生成：

```swift
if targetTimer <= 0.0 && !gameOver {
    spawnTarget()
    let spawnDelay: Float = 1.35 - wave * 0.08
    targetTimer = clamp(spawnDelay, 0.45, 1.35)
}
```

压力惩罚：

```swift
if pressureTimer <= 0.0 && activeTargets > 0 {
    integrity -= 1
    activeTargets -= 1
    streak = 0
    status = "Breach warning"
    Audio.playTone("square", 130.0, 0.08, 0.22)
    pressureTimer = clamp(4.6 - wave * 0.28, 1.6, 4.6)
}
```

胜负条件：

```swift
if roundTimer <= 0.0 {
    gameOver = true
    status = "LOCKDOWN - score " + score
}

if cleared >= clearGoal {
    gameOver = true
    score += integrity * 250
    status = "SIM CLEARED - score " + score
}
```

这个结构的好处是边界清楚：每个计时器负责一种压力，组合起来就是游戏节奏。调试时也容易定位，是目标生成太快，还是惩罚太重。

## 第九步：绘制 HUD

把 HUD 抽成函数，主循环会清楚很多：

```swift
func drawHud() {
    ui.rect("fps_hud_panel", 12.0, 12.0, 382.0, 184.0, 0.02, 0.025, 0.03, 0.86)
    ui.rect("fps_hud_accent", 12.0, 12.0, 4.0, 184.0, 0.95, 0.18, 0.12, 1.0)
    ui.label("fps_title", "FPS Arena", 24.0, 22.0)
    ui.label("fps_score", "Score: " + score, 24.0, 44.0)
    ui.label("fps_timer", "Time: " + roundTimer, 154.0, 44.0)
    ui.label("fps_ammo", "Ammo: " + ammo + " / " + reserve, 24.0, 66.0)
    ui.label("fps_integrity", "Integrity: " + integrity, 154.0, 66.0)
    ui.label("fps_goal", "Cleared: " + cleared + " / " + clearGoal, 24.0, 88.0)
    ui.label("fps_status", status, 24.0, 134.0)
    ui.label("fps_crosshair", "+", 392.0, 292.0)
}
```

HUD 应该回答四个问题：

- 我现在目标是什么？
- 我还能射几发？
- 我做得怎么样？
- 我为什么失败或成功？

如果 HUD 能回答这四个问题，玩家就能理解你的玩法。

## 常见问题

| 问题 | 可能原因 | 修法 |
| --- | --- | --- |
| 射击没有命中 | `hitRadius` 太小，或目标 tag 不是 `Target` | 检查生成代码和脚本参数 |
| 目标越积越多 | `pressureTimer` 太慢，或命中没有减少 `activeTargets` | 检查命中分支 |
| 换弹后弹药异常 | `needed` 或 `reserve` 计算错误 | 先用小弹匣测试 |
| 玩家跑出场地 | 忘记 `clamp(position.x/z, ...)` | 检查移动代码最后几行 |
| HUD 数值不刷新 | `drawHud()` 没有每帧调用 | 在 `update()` 末尾调用 |

## 练习

1. 增加一种 `BonusTarget`，命中后额外加时间。
2. 让 `hitRadius` 随连击缩小，提高高分难度。
3. 给目标增加超时清理脚本，超时未命中扣分。
4. 用 `ui.slider` 做调试面板，运行时调整 `spawnDelay`。
5. 把 `spawnTarget()` 拆成普通目标、快速目标和高分目标三个函数。
