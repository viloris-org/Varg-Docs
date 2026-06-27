---
title: 示例拆解
description: 从 Varg examples/scripts 中学习常见脚本模式。
---

这些示例来自 Varg 仓库的 `examples/scripts`，可以作为你写自己脚本时的模板。更完整的跟做教程见：

- [中间练习：做一个可玩的收集循环](/zh/tutorials/first-playable-loop/)
- [制作无尽跳跃](/zh/tutorials/jump-jump/)
- [制作射击训练场](/zh/tutorials/fps-arena/)

如果你还不熟悉编程，读示例时不要从第一行硬读到最后一行。先问三个问题：这个脚本记住了什么状态？它在 `update()` 里每帧检查什么？玩家做了什么以后，状态发生了什么变化？

如果你还没形成这套读法，先读 [从基础到进阶：组织玩法脚本](/zh/scripting/gameplay-loop-patterns/)。那一页专门讲怎么把变量、输入、计时器和反馈排进同一个 `update()`。

## 武器冷却

核心文件：`weapon_cooldown.varg`

```swift
script WeaponCooldown {
    @export var fireRate: Float = 0.5
    @export var damage: Int = 10

    var canFire: Bool = true
    var ammo: Int = 30

    func update(_ dt: Float) {
        if Input.pressed("Fire") && canFire && ammo > 0 {
            ammo -= 1
            canFire = false
            wait(fireRate)
            canFire = true
        }
    }
}
```

学到的模式：

- 把可调设计参数放进 `@export var`
- 用持久状态保存 `canFire` 和 `ammo`
- 用输入事件触发状态变化
- 用 `wait()` 表达短暂停顿

## 粒子计数器

核心文件：`particle_system.varg`

```swift
var particlesActive: Int = 0
var timeSinceEmit: Float = 0.0

func update(_ dt: Float) {
    timeSinceEmit += dt

    let emitInterval: Float = 1.0 / emitRate
    while timeSinceEmit >= emitInterval {
        if particlesActive < particleCount {
            particlesActive += 1
        }
        timeSinceEmit -= emitInterval
    }
}
```

学到的模式：

- 用累计时间把帧更新转成固定频率事件
- 用 `while` 处理一帧内可能发生多次的发射
- 用上限判断防止状态超过设计范围

## 波次生成器

核心文件：`wave_spawner.varg`

这个示例把逻辑拆成多个状态：

| 状态 | 含义 |
| --- | --- |
| `currentWave` | 当前波次 |
| `waveTimer` | 距离下一波的剩余时间 |
| `enemiesSpawned` | 当前波次已生成数量 |
| `isSpawning` | 是否正在生成 |

重点片段：

```swift
if waveTimer <= 0 && !isSpawning {
    currentWave += 1
    isSpawning = true
    enemiesSpawned = 0
    log("Starting wave")
}
```

这是典型的状态机写法：一个条件触发状态转换，然后后续逻辑根据新状态继续运行。

## 循环演示

核心文件：`loop_demo.varg`

它覆盖了：

- `0..3` 范围循环
- `1..=5` 包含末尾的范围循环
- `count(3)` 计数循环
- 嵌套循环
- `break` 和 `continue`
- 使用 `sin(Time.time + i)` 做动画叠加

当你需要批量检查、批量累加或做简单动画采样时，可以优先参考这个文件。

## 完整项目示例

[examples/project/jump_jump](https://github.com/viloris-org/Varg/tree/main/examples/project/jump_jump) 和 [examples/project/fps_arena](https://github.com/viloris-org/Varg/tree/main/examples/project/fps_arena) 已经超出了基础 examples 的范围：

| 项目 | 重点能力 | 推荐阅读文件 |
| --- | --- | --- |
| `jump_jump` | 第一人称蓄力跳跃、运行时生成平台、落点判定、收集物、HUD、辅助模式 | `scripts/jump_player.varg` |
| `fps_arena` | 第一人称移动、弹药和换弹、目标生成、距离命中、波次压力、HUD | `scripts/fps_player.varg` |

如果你觉得单文件 examples 太简陋，但完整项目又太大，先做 [中间练习：做一个可玩的收集循环](/zh/tutorials/first-playable-loop/)。它会把移动、拾取、得分、计时、生成和 HUD 放在一个小脚本里，刚好接在语法页后面。
