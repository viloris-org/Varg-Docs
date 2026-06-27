---
title: 中间练习：做一个可玩的收集循环
description: 不进入完整项目，先用一个小脚本练习移动、计时、拾取、得分和 HUD。
---

这一章夹在“语法教学”和“完整项目教程”中间。目标很小：做一个能移动、能收集、能计分、能倒计时的小玩法。

你不需要先懂完整游戏架构。先把下面这条循环做出来：

1. 玩家用方向键或 WASD 移动。
2. 场景里有一个 `Collectible`。
3. 玩家靠近它时得分。
4. HUD 显示分数、倒计时和状态。
5. 时间到了就停止计分。

## 开始前先会这些

- 看过 [给零编程基础读者的脚本入门](/scripting/programming-primer/)。
- 知道 `update(_ dt: Float)` 会每帧运行。
- 知道 `position.x`、`position.z` 可以改变对象位置。
- 知道 tag 是脚本查找对象用的名字。

## 第一步：只让玩家移动

先不要做得分、收集和 UI。第一步只确认玩家能动。

```swift
script CollectPlayer {
    @export var speed: Float = 5.0

    func update(_ dt: Float) {
        let moveX: Float = Input.value("MoveX")
        let moveZ: Float = Input.value("MoveY")

        position.x += moveX * speed * dt
        position.z += moveZ * speed * dt
    }
}
```

这段代码可以一句句读：

- `speed` 是移动速度。
- `moveX` 是左右输入。
- `moveZ` 是前后输入。
- `* dt` 让移动速度不受帧率影响。

先运行到这里。只要玩家能移动，就进入下一步。

## 第二步：加一个倒计时

现在给玩法加时间限制。

```swift
script CollectPlayer {
    @export var speed: Float = 5.0
    @export var roundTime: Float = 30.0

    var timeLeft: Float = 30.0
    var gameOver: Bool = false

    func start() {
        timeLeft = roundTime
    }

    func update(_ dt: Float) {
        if !gameOver {
            timeLeft -= dt

            if timeLeft <= 0.0 {
                timeLeft = 0.0
                gameOver = true
            }
        }

        if !gameOver {
            let moveX: Float = Input.value("MoveX")
            let moveZ: Float = Input.value("MoveY")

            position.x += moveX * speed * dt
            position.z += moveZ * speed * dt
        }
    }
}
```

这里有两个新状态：

| 变量 | 意思 |
| --- | --- |
| `timeLeft` | 还剩多少秒 |
| `gameOver` | 游戏是否结束 |

`if !gameOver` 的意思是：如果游戏还没结束，才继续倒计时和移动。

## 第三步：靠近收集物时得分

场景里的收集物需要有 `Collectible` tag。脚本用距离判断玩家是否靠近。

```swift
@export var pickupRadius: Float = 1.4

var score: Int = 0
var status: String = "Collect the crystal"
```

把下面这段放进 `update()`，放在移动逻辑后面：

```swift
if !gameOver {
    let distance: Float = scene.distanceToTag("Collectible")

    if distance <= pickupRadius {
        score += 1
        status = "Collected +" + score
        scene.destroyNearestWithTag("Collectible", pickupRadius)
        Audio.playTone("triangle", 720.0, 0.08, 0.25)
    }
}
```

这段代码做了四件事：

1. 找最近的 `Collectible`。
2. 如果距离足够近，分数加 1。
3. 删除最近的收集物。
4. 播放一个短音效。

现在还没有重新生成收集物，所以只能捡一次。这样很好，先让一个动作跑通。

## 第四步：生成新的收集物

捡到以后，可以在前方生成一个新的球体。

先加一个计数器：

```swift
var spawnIndex: Int = 0
```

然后在拾取成功后追加：

```swift
let nextX: Float = -4.0 + spawnIndex * 1.7
let nextZ: Float = sin(spawnIndex * 1.3) * 3.0

scene.spawnSphere(
    "Collectible",
    "Collectible",
    Vec3(nextX, 0.8, nextZ),
    0.35,
    ""
)

spawnIndex += 1
```

这里没有用随机数，而是用 `spawnIndex` 和 `sin()` 做变化。好处是每次运行节奏都差不多，比较容易调试。

## 第五步：把 HUD 接上

最后把玩家需要的信息显示出来。

```swift
ui.rect("collect_panel", 12.0, 12.0, 300.0, 126.0, 0.03, 0.04, 0.06, 0.86)
ui.label("collect_score", "Score: " + score, 24.0, 42.0)
ui.label("collect_time", "Time: " + floor(timeLeft), 24.0, 70.0)
ui.label("collect_status", status, 24.0, 98.0)
```

如果时间到了，可以改一下提示：

```swift
if gameOver {
    status = "Time up"
}
```

## 完整脚本

把上面的部分合在一起，会得到这个版本：

```swift
script CollectPlayer {
    @export var speed: Float = 5.0
    @export var roundTime: Float = 30.0
    @export var pickupRadius: Float = 1.4

    var timeLeft: Float = 30.0
    var gameOver: Bool = false
    var score: Int = 0
    var status: String = "Collect the crystal"
    var spawnIndex: Int = 0

    func start() {
        timeLeft = roundTime
    }

    func update(_ dt: Float) {
        if !gameOver {
            timeLeft -= dt

            if timeLeft <= 0.0 {
                timeLeft = 0.0
                gameOver = true
                status = "Time up"
            }
        }

        if !gameOver {
            let moveX: Float = Input.value("MoveX")
            let moveZ: Float = Input.value("MoveY")

            position.x += moveX * speed * dt
            position.z += moveZ * speed * dt

            let distance: Float = scene.distanceToTag("Collectible")

            if distance <= pickupRadius {
                score += 1
                status = "Collected +" + score
                scene.destroyNearestWithTag("Collectible", pickupRadius)
                Audio.playTone("triangle", 720.0, 0.08, 0.25)

                let nextX: Float = -4.0 + spawnIndex * 1.7
                let nextZ: Float = sin(spawnIndex * 1.3) * 3.0

                scene.spawnSphere(
                    "Collectible",
                    "Collectible",
                    Vec3(nextX, 0.8, nextZ),
                    0.35,
                    ""
                )

                spawnIndex += 1
            }
        }

        ui.rect("collect_panel", 12.0, 12.0, 300.0, 126.0, 0.03, 0.04, 0.06, 0.86)
        ui.label("collect_score", "Score: " + score, 24.0, 42.0)
        ui.label("collect_time", "Time: " + floor(timeLeft), 24.0, 70.0)
        ui.label("collect_status", status, 24.0, 98.0)
    }
}
```

## 你刚刚练到的东西

| 能力 | 在哪里用到 |
| --- | --- |
| 每帧更新 | 移动、倒计时、HUD |
| 持久状态 | `score`、`timeLeft`、`gameOver` |
| 输入 | `Input.value("MoveX")`、`Input.value("MoveY")` |
| 条件判断 | 时间归零、靠近收集物 |
| 场景查询 | `scene.distanceToTag("Collectible")` |
| 动态生成 | `scene.spawnSphere(...)` |
| 反馈 | `ui.label`、`ui.rect`、`Audio.playTone` |

这就是完整项目的缩小版。Jump Jump 和 FPS Arena 只是把同一套思路扩展成更多状态、更多对象和更强反馈。
