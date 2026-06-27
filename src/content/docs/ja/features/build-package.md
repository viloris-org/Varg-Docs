---
title: ビルド、テスト、パッケージ化
description: よく使う Varg、Cargo、Bun、xtask コマンド。
---

## ビルド profile

Varg は feature/profile の組み合わせで、どのサブシステムをリンクするかを選びます。

| Profile | 含まれるもの |
| --- | --- |
| `editor` | Tauri フロントエンドに必要なエディターサービス、wgpu ビューポート、Agent ツール |
| `runtime-min` | ヘッドレスモード。CI、サーバー、自動ビルド向け |
| `runtime-game` | ヘッドレスにウィンドウ対応を追加 |
| `dev-full` | エディター、物理、音声、スクリプト、Agent、レンダリングなどの完全機能 |

よく使うコマンド:

```sh
varg -p runtime-min --no-default-features --features editor
varg -p runtime-min --no-default-features --features runtime-min
```

## テスト

```sh
# ヘッドレスランタイム
varg -p runtime-min --no-default-features --features runtime-min
```

Varg ソースコードリポジトリ内でエンジン自体を開発している場合だけ、Cargo で具体的な crate をテストする必要があります。

```sh
cargo test --workspace
cargo test -p engine-editor --no-default-features --features agent-tools
cargo test -p engine-render-wgpu
```

## ゲームプロジェクトをパッケージする

```sh
cd ../Varg

cargo xtask package --project examples/project --target native --format folder --debug
cargo xtask package --project examples/project --target native --format folder --release
```

パッケージ結果は次に書き込まれます。

```txt
exports/<project>/<target>/<channel>/
```

典型的な内容:

- runtime バイナリ
- 起動スクリプト
- プロジェクトマニフェスト
- 既定シーン
- コピー後のアセット
- `asset-manifest.json`
- `package-manifest.json`

## プラットフォーム対応状況

| Target | Host 対応 | Formats |
| --- | --- | --- |
| `linux-x64` | Linux | `folder` |
| `windows-x64` | Windows | `folder` |
| `macos-universal` | macOS | `folder` |
| `android-arm64` | Linux、Windows | `apk`、`aab` を計画中 |
| `ios-universal` | macOS | `ipa` を計画中 |

Android と iOS は共有パッケージパイプラインとツールチェーン検証の方向に入っていますが、署名済みモバイル成果物にはまだモバイルランタイムアダプターとプラットフォームプロジェクトテンプレートが必要です。
