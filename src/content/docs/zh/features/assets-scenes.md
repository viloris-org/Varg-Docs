---
title: 资源、场景与声明式文件
description: 理解 .varg、.vscene、.vmodel 和 .vasset 的职责边界。
---

Varg 计划提供一组统一风格的作者语言，让人和 AI 都能读、改、验证项目文件。

## 文件角色

| 扩展名 | 角色 | 用途 | 是否图灵完备 |
| --- | --- | --- | --- |
| `.varg` | Logic file | 脚本、模块、动态 gameplay 逻辑、声明式 behavior | `script` 和 `module` 是；`behavior` 不是 |
| `.vscene` | World file | 场景、prefab、实体组成、布局意图、网络复制声明 | 否 |
| `.vmodel` | Model authoring file | 程序化或参数化模型构建 | 否 |
| `.vasset` | Asset file | 资源登记、导入设置、材质、音频事件和依赖 | 否 |

## `.vscene` 场景示意

```swift
scene MainScene {
    camera "MainCamera" {
        transform {
            position: Vec3(0, 6, 10)
            rotation: Euler(-30, 0, 0)
        }

        primary: true
    }

    entity "Player" {
        tag: "player"

        transform {
            position: Vec3(0, 1, 0)
        }

        script PlayerController {
            source: "scripts/player_controller.varg"
            speed: 6.0
        }
    }
}
```

场景文件描述“有什么”和“在哪里”，不写任意循环和运行时事件。

## AI 意图式场景

Varg 的设计允许 AI 写高层意图：

```swift
scene ForestCamp {
    intent: "A small night camp in a forest clearing"

    scatter "PineTree" {
        count: 32
        area: ring(inner: 8, outer: 18)
        scale: range(0.8, 1.4)
    }
}
```

这类文件之后由工具编译成确定的场景对象。源文件保留作者意图，便于人审阅和 AI 继续修改。

## 资源管线

Varg 的资源系统负责：

- 导入 glTF、PNG、音频等资源
- 建立资源数据库和清单
- 监听文件变化并热重载
- 在打包时复制资源和生成 `asset-manifest.json`

当资源只需要登记、导入设置或材质参数时，优先放入 `.vasset`。当需要运行时逻辑时，才写 `.varg`。
