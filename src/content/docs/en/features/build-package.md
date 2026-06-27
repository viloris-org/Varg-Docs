---
title: Build, Test, And Package
description: Common Varg, Cargo, Bun, and xtask commands.
---

## Build Profiles

Varg uses feature/profile combinations to choose which subsystems are linked:

| Profile | Includes |
| --- | --- |
| `editor` | Editor services, wgpu viewport, and Agent tools needed by the Tauri frontend |
| `runtime-min` | Headless mode, suitable for CI, servers, and automated builds |
| `runtime-game` | Headless plus window support |
| `dev-full` | Full editor, physics, audio, scripting, Agent, rendering, and related capabilities |

Common commands:

```sh
varg -p runtime-min --no-default-features --features editor
varg -p runtime-min --no-default-features --features runtime-min
```

## Testing

```sh
# Headless runtime
varg -p runtime-min --no-default-features --features runtime-min
```

Only use Cargo to test specific crates if you are developing the engine itself inside the Varg source repository:

```sh
cargo test --workspace
cargo test -p engine-editor --no-default-features --features agent-tools
cargo test -p engine-render-wgpu
```

## Packaging Game Projects

```sh
cd ../Varg

cargo xtask package --project examples/project --target native --format folder --debug
cargo xtask package --project examples/project --target native --format folder --release
```

Packaging output is written to:

```txt
exports/<project>/<target>/<channel>/
```

Typical contents include:

- Runtime binary
- Startup script
- Project manifest
- Default scene
- Copied assets
- `asset-manifest.json`
- `package-manifest.json`

## Platform Support Status

| Target | Host support | Formats |
| --- | --- | --- |
| `linux-x64` | Linux | `folder` |
| `windows-x64` | Windows | `folder` |
| `macos-universal` | macOS | `folder` |
| `android-arm64` | Linux, Windows | Planned `apk`, `aab` |
| `ios-universal` | macOS | Planned `ipa` |

Android and iOS have entered the shared packaging pipeline and toolchain validation direction, but signed mobile artifacts still require mobile runtime adapters and platform project templates.
