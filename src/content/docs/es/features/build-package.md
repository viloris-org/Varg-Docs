---
title: Compilacion, pruebas y empaquetado
description: Comandos habituales de Varg, Cargo, Bun y xtask.
---

## Profiles de compilacion

Varg usa combinaciones de feature/profile para elegir que subsistemas enlazar:

| Profile | Incluye |
| --- | --- |
| `editor` | Servicios del editor para el frontend Tauri, viewport wgpu y herramientas de Agent |
| `runtime-min` | Modo headless, adecuado para CI, servidores y builds automatizados |
| `runtime-game` | Headless con soporte de ventana |
| `dev-full` | Capacidades completas: editor, fisica, audio, scripting, Agent, render, etc. |

Comandos habituales:

```sh
varg -p runtime-min --no-default-features --features editor
varg -p runtime-min --no-default-features --features runtime-min
```

## Pruebas

```sh
# Runtime headless
varg -p runtime-min --no-default-features --features runtime-min
```

Solo necesitas usar Cargo para probar crates concretos si estas desarrollando el propio motor dentro del repositorio fuente de Varg:

```sh
cargo test --workspace
cargo test -p engine-editor --no-default-features --features agent-tools
cargo test -p engine-render-wgpu
```

## Empaquetar proyectos de juego

```sh
cd ../Varg

cargo xtask package --project examples/project --target native --format folder --debug
cargo xtask package --project examples/project --target native --format folder --release
```

El resultado se escribe en:

```txt
exports/<project>/<target>/<channel>/
```

Contenido tipico:

- Binario de runtime
- Script de arranque
- Manifiesto del proyecto
- Escena por defecto
- Recursos copiados
- `asset-manifest.json`
- `package-manifest.json`

## Estado de soporte por plataforma

| Target | Host compatible | Formats |
| --- | --- | --- |
| `linux-x64` | Linux | `folder` |
| `windows-x64` | Windows | `folder` |
| `macos-universal` | macOS | `folder` |
| `android-arm64` | Linux, Windows | soporte previsto para `apk`, `aab` |
| `ios-universal` | macOS | soporte previsto para `ipa` |

Android e iOS ya estan orientados hacia un pipeline de empaquetado compartido y validacion de toolchain, pero los artefactos moviles firmados aun necesitan adaptadores de runtime movil y plantillas de proyecto de plataforma.
