---
title: 快速上手
description: 安装 Varg、启动编辑器，并找到脚本示例项目。
---

## 前提条件

这一页只解决两个问题：怎么把 Varg 打开，以及示例代码在哪里。先不用急着理解所有文件类型；能打开项目、能找到脚本，就已经够进入下一步了。

下载 Varg 请使用 GitHub Releases：

- [https://github.com/viloris-org/Varg/releases](https://github.com/viloris-org/Varg/releases)

如果你只是想试用编辑器或运行示例项目，优先下载 release 里的预构建产物。下面的源码启动方式只适合准备参与开发、调试引擎或修改编辑器的人。

从源码启动编辑器需要：

- Rust 1.96 或更高版本
- Bun 1.3.14 或更高版本
- Tauri v2 系统依赖

Linux 常用依赖：

```sh
sudo apt install libwebkit2gtk-4.1-dev build-essential libssl-dev libayatana-appindicator3-dev librsvg2-dev
```

## 启动编辑器

如果你下载的是 release 包，解压后直接运行其中的 Varg 可执行文件。

如果你从源码启动，并且 Varg 仓库位于文档站旁边的 `../Varg`：

```sh
cd ../Varg/editor
bun install
bun run dev:tauri
```

启动后进入 Hub 画面。你可以创建或打开项目，在编辑器中放置对象、添加组件，并进入 Play 模式运行物理与脚本。

如果你只是想学习脚本，建议先打开示例项目，不要一开始就从空项目搭完整场景。空项目会同时牵扯场景、资源、脚本挂载和输入配置，跨度会比较大。

## 脚本示例在哪里

本手册的语法示例来自 Varg 仓库里的 `examples/scripts`：

```txt
examples/scripts/
├── loop_demo.varg
├── particle_system.varg
├── timed_sequence.varg
├── wave_spawner.varg
└── weapon_cooldown.varg
```

完整玩法教程使用这些示例项目：

- [examples/project/jump_jump](https://github.com/viloris-org/Varg/tree/main/examples/project/jump_jump)
- [examples/project/fps_arena](https://github.com/viloris-org/Varg/tree/main/examples/project/fps_arena)

你不需要 fork Varg 才能阅读这些示例。可以直接在 GitHub 上查看源码，也可以下载 release 或源码压缩包后在本地打开。

建议学习顺序不要跳太快：

1. `weapon_cooldown.varg`：导出参数、输入、状态和 `wait()`
2. `loop_demo.varg`：循环、`break`、`continue`、局部变量
3. `wave_spawner.varg`：多状态脚本和生命周期分工
4. `particle_system.varg`：计时器和按键重置
5. `jump_jump`：运行时生成平台、落点判定、HUD、辅助模式。先看主脚本的前半段也可以。
6. `fps_arena`：第一人称移动、换弹、目标生成、命中反馈。它系统更多，建议放在 `jump_jump` 之后。

:::tip[怎么读示例]
先找 `@export var`，它们通常是设计师会调的参数；再找 `var`，它们通常是脚本自己记住的状态；最后看 `start()` 和 `update(_ dt: Float)`。这样读比从第一行硬啃到最后一行舒服很多。
:::

## 你需要记住的一句话

`.varg` 写运行时逻辑；`.vscene` 写场景和对象结构；`.vasset` 写资源登记；`.vmodel` 写生成式模型描述。当前能执行的重点是 `.varg` 脚本 MVP。
