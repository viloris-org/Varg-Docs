---
title: Build, Test und Paketierung
description: Häufige Varg-, Cargo-, Bun- und xtask-Befehle.
---

## Build-profile

Varg wählt mit feature/profile-Kombinationen, welche Subsysteme gelinkt werden:

| Profile | Enthält |
| --- | --- |
| `editor` | Editor-Dienste, wgpu-Viewport und Agent-Werkzeuge für das Tauri-Frontend |
| `runtime-min` | Headless-Modus, geeignet für CI, Server und automatisierte Builds |
| `runtime-game` | Headless plus Fensterunterstützung |
| `dev-full` | Vollständige Fähigkeiten wie Editor, Physik, Audio, Skripting, Agent und Rendering |

Häufige Befehle:

```sh
varg -p runtime-min --no-default-features --features editor
varg -p runtime-min --no-default-features --features runtime-min
```

## Tests

```sh
# Headless-Laufzeit
varg -p runtime-min --no-default-features --features runtime-min
```

Nur wenn du im Varg-Quellrepository an der Engine selbst entwickelst, brauchst du Cargo-Tests für konkrete crates:

```sh
cargo test --workspace
cargo test -p engine-editor --no-default-features --features agent-tools
cargo test -p engine-render-wgpu
```

## Spielprojekt paketieren

```sh
cd ../Varg

cargo xtask package --project examples/project --target native --format folder --debug
cargo xtask package --project examples/project --target native --format folder --release
```

Das Paketergebnis wird geschrieben nach:

```txt
exports/<project>/<target>/<channel>/
```

Typische Inhalte:

- runtime-Binary
- Startskripte
- Projektmanifest
- Standardszene
- kopierte Assets
- `asset-manifest.json`
- `package-manifest.json`

## Stand der Plattformunterstützung

| Target | Host-Unterstützung | Formats |
| --- | --- | --- |
| `linux-x64` | Linux | `folder` |
| `windows-x64` | Windows | `folder` |
| `macos-universal` | macOS | `folder` |
| `android-arm64` | Linux, Windows | Geplant: `apk`, `aab` |
| `ios-universal` | macOS | Geplant: `ipa` |

Android und iOS sind bereits Richtung gemeinsamer Paketpipeline und Toolchain-Prüfung unterwegs, aber signierte Mobile-Artefakte brauchen weiterhin Mobile-Laufzeitadapter und Plattform-Projektvorlagen.
