---
title: 编辑器工作流
description: 从 Hub 到 Play 模式的 Varg 编辑器基本流程。
---

这一页讲的是“打开编辑器之后怎么工作”，不是 Varg 编辑器的内部架构。

你通常会在编辑器里完成三件事：管理项目、整理场景、进入 Play 模式验证脚本。脚本、场景和资源仍然是普通项目文件；编辑器只是让这些文件更容易看、改和测试。

## 基本流程

1. 启动 Varg，进入 Hub。
2. 创建新项目，或打开已有项目目录。
3. 打开场景，在 Hierarchy 里选择对象。
4. 在 Inspector 里调整位置、旋转、缩放和组件参数。
5. 在 Scene View 里检查 3D 布局。
6. 点击 Play，在 Game View 中运行物理和脚本。
7. Stop 后回到编辑状态，再继续调整。

编辑状态和运行状态要分开理解。编辑状态改的是场景文件；Play 模式运行的是一份运行时世界。这样你可以放心试脚本，不必担心一次失败的运行把场景文件弄乱。

## Hub 做什么

Hub 是项目入口。它负责创建项目、打开项目，以及让你回到最近使用的项目。

一个项目至少需要：

- `Varg.toml`：项目清单，声明默认场景和脚本目录。
- `scenes/`：场景文件。
- `scripts/`：`.varg` 脚本。
- `assets/`：模型、贴图、音频等资源。

如果你只是想先看完整项目，可以直接打开示例：

- [examples/project/jump_jump](https://github.com/viloris-org/Varg/tree/main/examples/project/jump_jump)
- [examples/project/fps_arena](https://github.com/viloris-org/Varg/tree/main/examples/project/fps_arena)

## 常见组件

刚开始不用记住所有组件，先认准这几个：

| 组件 | 用途 |
| --- | --- |
| Camera | 定义游戏视角 |
| Light | 场景照明 |
| MeshRenderer | 显示模型或网格 |
| Rigidbody | 参与物理模拟 |
| Collider | 碰撞形状 |
| Script | 挂载 `.varg` 脚本 |

一个能运行的最小场景通常需要一个 Camera、一个 Light，以及至少一个挂脚本或可交互的实体。

## 脚本如何进入场景

脚本不会自动运行，必须挂到场景对象上。典型流程是：

1. 在项目中创建或导入 `.varg` 文件。
2. 选择目标实体。
3. 添加 Script 组件。
4. 绑定脚本资源，例如 `scripts/player_controller.varg`。
5. 在 Inspector 中调整 `@export var` 暴露出的参数。
6. 进入 Play 模式验证行为。

示例：

```swift
script JumpPlayer {
    source: "scripts/jump_player.varg"
    maxCharge: 1.25
    jumpScale: 5.0
}
```

这里的 `source` 指向脚本文件，下面的字段会覆盖脚本里的导出参数。也就是说，脚本负责规则，Inspector 或 `.vscene` 负责调参。

## Play 模式该看什么

进入 Play 模式后，优先确认四件事：

- 输入是否被脚本收到。
- 对象位置和旋转是否按预期变化。
- HUD 或日志是否能说明当前状态。
- Stop 之后能否干净回到编辑状态。

不要一开始就把所有系统都接上。先让一个对象动起来，再接碰撞、UI、音效和生成逻辑。这样出问题时，范围小很多。

## 和文件的关系

Varg 项目不是只能在编辑器里改。你可以在编辑器里调对象和参数，也可以直接编辑项目文件。

常见分工是：

- `.vscene` 写场景结构、对象、组件和脚本挂载关系。
- `.varg` 写运行时逻辑，例如输入、计时器、状态机和 UI。
- `.vasset` 写资源登记和导入设置。
- `Varg.toml` 写项目入口和默认场景。

编辑器适合检查空间关系和调参数；文本文件适合 review、复制示例、批量修改和让工具生成初稿。两边不冲突，关键是让项目文件始终可读。
