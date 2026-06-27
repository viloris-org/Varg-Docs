---
title: 构建、测试与打包
description: 常用 Varg、Cargo、Bun 和 xtask 命令。
---

## 构建 profile

Varg 用 feature/profile 组合选择链接哪些子系统：

| Profile | 包含内容 |
| --- | --- |
| `editor` | Tauri 前端需要的编辑器服务、wgpu 视口和 Agent 工具 |
| `runtime-min` | 无头模式，适合 CI、服务器、自动化构建 |
| `runtime-game` | 无头加窗口支持 |
| `dev-full` | 编辑器、物理、音频、脚本、Agent、渲染等完整能力 |

常用命令：

```sh
varg -p runtime-min --no-default-features --features editor
varg -p runtime-min --no-default-features --features runtime-min
```

## 测试

```sh
# 无头运行时
varg -p runtime-min --no-default-features --features runtime-min
```

如果你在 Varg 源码仓库内开发引擎本身，才需要使用 Cargo 测试具体 crate：

```sh
cargo test --workspace
cargo test -p engine-editor --no-default-features --features agent-tools
cargo test -p engine-render-wgpu
```

## 打包游戏项目

```sh
cd ../Varg

cargo xtask package --project examples/project --target native --format folder --debug
cargo xtask package --project examples/project --target native --format folder --release
```

打包结果会写入：

```txt
exports/<project>/<target>/<channel>/
```

典型内容包括：

- runtime 二进制
- 启动脚本
- 项目清单
- 默认场景
- 复制后的资源
- `asset-manifest.json`
- `package-manifest.json`

## 平台支持状态

| Target | Host 支持 | Formats |
| --- | --- | --- |
| `linux-x64` | Linux | `folder` |
| `windows-x64` | Windows | `folder` |
| `macos-universal` | macOS | `folder` |
| `android-arm64` | Linux、Windows | 计划支持 `apk`、`aab` |
| `ios-universal` | macOS | 计划支持 `ipa` |

Android 和 iOS 已进入共享打包管线和工具链校验方向，但签名移动端产物仍需要移动运行时适配器和平台项目模板。
