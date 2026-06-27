---
title: 生命周期与输入
description: 掌握 start、update、fixedUpdate 和 Input API。
---

## 生命周期函数

生命周期函数就是引擎主动来敲门的地方。你不需要自己调用它们；脚本挂到实体上之后，运行时会在合适的时机调用。

Varg 脚本通过保留名称接收引擎事件：

```swift
func start()
func update(_ dt: Float)
func fixedUpdate(_ dt: Float)
func collisionEnter(_ other: Entity)
func collisionExit(_ other: Entity)
func event(_ name: String, _ data: EventData)
```

当前 MVP 最常用的是：

| 函数 | 触发时机 | 常见用途 |
| --- | --- | --- |
| `start()` | 脚本开始运行 | 初始化状态、输出启动日志 |
| `update(_ dt: Float)` | 每帧 | 输入、移动、计时、动画 |
| `fixedUpdate(_ dt: Float)` | 固定步长 | 物理相关逻辑、批量检测 |

入门时优先记住 `start()` 和 `update(_ dt: Float)`。`collisionEnter`、`event` 这些名字可以先当作未来会用到的门，不必现在就推开。

## `dt` 是什么

`dt` 是本次更新距离上次更新的时间，单位通常按秒理解。移动时乘上 `dt` 可以让速度不依赖帧率。

```swift
script Mover {
    @export var speed: Float = 3.0

    func update(_ dt: Float) {
        entity.translate(Vec3(speed * dt, 0, 0))
    }
}
```

## 输入 API

输入 API 的名字有点多，但问题很朴素：这一帧是否按住、刚按下、刚松开，或者某个轴现在是多少。

推荐使用明确的输入名称：

```swift
Input.down("Jump")        // 这一帧按住
Input.pressed("Jump")     // 这一帧刚按下
Input.released("Jump")    // 这一帧刚松开
Input.value("MoveX")      // 轴输入，常用于移动
Input.mouseDeltaX()       // 鼠标本帧水平位移
Input.mouseDeltaY()       // 鼠标本帧垂直位移
Input.captureMouse(true)  // 捕获鼠标，常用于第一人称视角
```

## 输入示例：移动和跳跃

```swift
script SimplePlayer {
    @export var speed: Float = 6.0
    @export var jumpForce: Float = 8.0

    var jumpsLeft: Int = 1

    func update(_ dt: Float) {
        let moveX: Float = Input.value("MoveX")
        let moveY: Float = Input.value("MoveY")

        entity.translate(Vec3(moveX * speed * dt, 0, moveY * speed * dt))

        if Input.pressed("Jump") && jumpsLeft > 0 {
            position.y += jumpForce * dt
            jumpsLeft -= 1
        }
    }
}
```

这里把跳跃写成 `position.y += ...`，是因为当前 MVP 明确支持 `position` 赋值和分量修改。更完整的物理速度 API 属于目标方向，接入前要以运行时实现为准。

## 第一人称鼠标输入

完整示例见 [jump_jump/scripts/first_person_camera.varg](https://github.com/viloris-org/Varg/tree/main/examples/project/jump_jump/scripts/first_person_camera.varg) 和 [fps_arena/scripts/fps_camera.varg](https://github.com/viloris-org/Varg/tree/main/examples/project/fps_arena/scripts/fps_camera.varg)。

```swift
script LookCamera {
    @export var mouseSensitivity: Float = 0.08
    @export var minPitch: Float = -55.0
    @export var maxPitch: Float = 32.0

    var yaw: Float = 0.0
    var pitch: Float = -6.0
    var mouseCaptured: Bool = true

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
        rotation = Vec3(pitch, yaw, 0.0)
    }
}
```
