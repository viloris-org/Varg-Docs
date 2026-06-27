---
title: 项目结构
description: 了解一个 Varg 游戏项目里 Varg.toml、scenes、scripts 和 assets 分别负责什么。
---

这一页讲的是创作者自己的 Varg 游戏项目，不是 Varg 引擎源码仓库。

如果你打开的是 `examples/project/jump_jump` 或 `examples/project/fps_arena`，看到的结构大致会是这样：

```txt
my_game/
├── Varg.toml
├── scenes/
│   └── main.vscene
├── scripts/
│   ├── player.varg
│   └── camera.varg
├── assets/
│   ├── models/
│   ├── textures/
│   ├── audio/
│   └── materials/
└── build/
```

刚开始做项目时，不需要把每个目录都填满。一个最小项目通常只需要：

```txt
my_game/
├── Varg.toml
├── scenes/
│   └── main.vscene
└── scripts/
    └── player.varg
```

## `Varg.toml`

`Varg.toml` 是项目清单。它告诉编辑器和运行时：项目叫什么、资源根目录在哪里、脚本从哪里找、默认打开哪个场景。

```toml
name = "My Game"
asset_root = "assets"
script_roots = ["scripts"]
default_scene = "scenes/main.vscene"
```

常见字段：

| 字段 | 作用 |
| --- | --- |
| `name` | 项目名称，显示在编辑器或构建产物里 |
| `asset_root` | 资源目录，通常是 `assets` |
| `script_roots` | 脚本搜索目录，通常是 `["scripts"]` |
| `default_scene` | Play 或打包时默认进入的场景 |

如果场景里写了 `source: "scripts/player.varg"`，运行时会根据项目配置去找到这个脚本文件。

## `scenes/`

`scenes/` 放 `.vscene` 文件。你可以把 `.vscene` 理解成“游戏开始时世界里有什么”。

场景通常负责：

- 放置玩家、相机、灯光和初始对象。
- 给对象设置 tag，例如 `Player`、`Platform`、`Collectible`。
- 给对象挂脚本。
- 覆盖脚本里的 `@export var` 调参值。

一个很小的场景可能像这样：

```swift
entity "Player" {
    tag: "Player"
    position: Vec3(0.0, 0.6, 0.0)

    script PlayerController {
        source: "scripts/player.varg"
        speed: 5.0
    }
}

entity "Camera" {
    position: Vec3(0.0, 2.0, -5.0)
}
```

经验规则：场景负责“摆东西和调参数”，脚本负责“运行时规则”。

## `scripts/`

`scripts/` 放 `.varg` 文件。它们负责运行时逻辑，例如移动、计时、得分、生成对象、HUD 和音效。

```txt
scripts/
├── player.varg
├── camera.varg
├── enemy.varg
└── despawn_far.varg
```

入门项目建议先按对象或职责拆：

| 脚本 | 适合负责 |
| --- | --- |
| `player.varg` | 玩家输入、移动、生命、得分 |
| `camera.varg` | 相机跟随、第一人称视角 |
| `enemy.varg` | 敌人移动、检测、被命中 |
| `despawn_far.varg` | 临时对象离玩家太远后清理 |

不要一开始就拆得太碎。一个玩法还没跑通时，把主要逻辑放在一个主脚本里更容易调试。等规则稳定后，再把相机、清理、漂浮动画这类独立职责拆出去。

## `assets/`

`assets/` 放项目资源。早期教程可以不用很多外部资源，但真实项目通常会逐渐加入模型、贴图、音频和材质。

```txt
assets/
├── models/
├── textures/
├── audio/
└── materials/
```

常见放法：

| 目录 | 内容 |
| --- | --- |
| `models/` | 角色、道具、场景模型 |
| `textures/` | 贴图、图标、UI 图片 |
| `audio/` | 音效和音乐 |
| `materials/` | 材质配置或材质相关资源 |

教程项目经常先用运行时生成的盒体和球体，是为了减少资源干扰。等玩法规则成立，再替换成正式资源会更稳。

## `build/`

`build/` 或类似输出目录放构建产物。它不是你主要编辑的地方。

通常不要把玩法脚本直接写进构建输出目录。源文件应该放在 `scripts/`、`scenes/` 和 `assets/` 里，再由构建流程生成最终产物。

## 一个文件怎么串起来

最关键的链路是：

1. `Varg.toml` 指定默认场景：`default_scene = "scenes/main.vscene"`。
2. `main.vscene` 放置玩家对象。
3. 玩家对象挂脚本：`source: "scripts/player.varg"`。
4. `player.varg` 在 `update(_ dt: Float)` 里读取输入、移动玩家、更新 HUD。

也就是说，项目不是靠某个文件单独工作，而是靠这条引用链跑起来：

```txt
Varg.toml -> scenes/main.vscene -> scripts/player.varg
```

如果 Play 后什么都没发生，优先检查这条链：

| 问题 | 检查 |
| --- | --- |
| 打开的不是预期场景 | `default_scene` 是否指向正确 `.vscene` |
| 脚本没有运行 | 场景对象是否挂了脚本，`source` 路径是否正确 |
| tag 查询找不到对象 | `.vscene` 里的 tag 是否和脚本字符串完全一致 |
| 参数没有生效 | 场景里的脚本字段名是否和 `@export var` 一致 |

## 和引擎源码结构的区别

Varg 引擎源码仓库里会看到 `editor/`、`crates/`、`xtask/` 这类目录。那是开发引擎和编辑器的人看的结构。

创作者做游戏时，优先关心的是自己的项目：

```txt
Varg.toml
scenes/
scripts/
assets/
```

后面的教程都会按这个用户项目心智模型来讲。引擎内部 crate 分层只有在你要改编辑器、渲染器或运行时时才需要深入。
