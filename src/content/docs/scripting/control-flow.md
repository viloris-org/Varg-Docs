---
title: 控制流与等待
description: 使用 if、for、while、break、continue 和 wait 编写 gameplay 逻辑。
---

## 条件判断

控制流不是为了写“聪明”的代码，而是为了把玩法规则说清楚：如果能开火就扣弹药，如果正在换弹就倒计时，如果掉出平台就失败。

```swift
if Input.pressed("Fire") && canFire && ammo > 0 {
    ammo -= 1
    canFire = false
}
```

当前 MVP 支持：

- 简单布尔状态名，例如 `canFire`
- `!`、`&&`、`||`
- 数值比较，例如 `ammo > 0`、`timer <= 0`
- 输入检查，例如 `Input.pressed("Fire")`

## `for` 循环

范围循环：

```swift
for i in 0..3 {
    log("Range loop iteration")
}
```

包含末尾的范围循环：

```swift
for i in 1..=5 {
    sum += i
}
```

计数循环：

```swift
for i in count(3) {
    count += 1
}
```

## `while` 循环

```swift
while loopCount < maxIterations {
    if loopCount >= 5 {
        break
    }

    loopCount += 1
}
```

`while` 适合表达“直到状态满足条件前一直做”。注意每轮都要让条件有机会变化，避免无限循环。

## `break` 和 `continue`

```swift
for i in 0..10 {
    if i == skipValue {
        continue
    }

    filtered += 1
}
```

- `break`：立即结束当前循环
- `continue`：跳过本轮后续逻辑，进入下一轮

## `wait(expression)`

`wait()` 用于表达脚本中的时间间隔：

```swift
script WeaponCooldown {
    @export var fireRate: Float = 0.5

    var canFire: Bool = true
    var ammo: Int = 30

    func update(_ dt: Float) {
        if Input.pressed("Fire") && canFire && ammo > 0 {
            ammo -= 1
            canFire = false
            log("Fire! Ammo remaining:")

            wait(fireRate)

            canFire = true
        }
    }
}
```

这种写法适合教学和简单节奏控制。你可以把它当成“先等一下，再继续做后面的事”。

如果一个系统等待时还要继续更新 HUD、处理输入、移动角色或参与胜负判断，建议改用显式计时器。它多写几行，但状态更摊开，也更容易调试、暂停和存档。

```swift
var cooldown: Float = 0.0

func update(_ dt: Float) {
    if cooldown > 0 {
        cooldown -= dt
    }

    if Input.pressed("Fire") && cooldown <= 0 {
        cooldown = fireRate
    }
}
```
