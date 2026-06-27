---
title: 项目结构
description: 了解 Varg 仓库中和脚本、编辑器、运行时相关的目录。
---

Varg 仓库的关键目录如下：

```txt
Varg/
├── editor/                  # Tauri 桌面编辑器，前端和 Rust 后端都在这里
├── crates/
│   ├── engine-editor/       # 编辑器工作流、服务、Agent 工具
│   ├── engine-ecs/          # 场景、实体、变换、世界
│   ├── engine-assets/       # 资源数据库、导入器、热重载
│   ├── engine-render/       # 渲染图和设备 trait
│   ├── engine-render-wgpu/  # WGPU 渲染后端
│   ├── engine-physics/      # 物理系统
│   ├── engine-audio/        # 音频管线
│   ├── engine-script-varg/  # Varg 脚本语言实现
│   ├── engine-ai/           # AI 规划器与系统提示
│   └── runtime-min/         # 无头运行时组合根
├── examples/                # 示例行为和脚本
├── xtask/                   # 构建与打包任务
└── docs/                    # 设计文档和语言规范
```

## 读代码时的入口

- 想学习脚本语法：看 `docs/varg-language-family-spec.md` 和 `examples/scripts`
- 想跑编辑器：看 `editor/package.json` 里的脚本
- 想理解打包：看 `xtask/src/main.rs`
- 想了解运行时 profile：看根目录 `Cargo.toml` 和各 crate 的 feature

## 用户项目的心智模型

一个 Varg 游戏项目通常会包含：

- 场景：对象、光照、相机、出生点、脚本挂载关系
- 脚本：玩家控制、敌人行为、计时器、触发器、UI 逻辑
- 资源：模型、贴图、音频、材质、导入设置
- 构建产物：导出的 runtime、启动脚本和清单文件
