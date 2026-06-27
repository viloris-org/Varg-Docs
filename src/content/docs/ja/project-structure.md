---
title: プロジェクト構造
description: Varg のゲームプロジェクトで Varg.toml、scenes、scripts、assets がそれぞれ何を担当するかを理解します。
---

このページで扱うのは、制作者自身の Varg ゲームプロジェクトです。Varg エンジンのソースコードリポジトリではありません。

`examples/project/jump_jump` または `examples/project/fps_arena` を開くと、構造はおおよそ次のようになります。

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

作り始めの段階では、すべてのディレクトリを埋める必要はありません。最小プロジェクトは通常これだけで足ります。

```txt
my_game/
├── Varg.toml
├── scenes/
│   └── main.vscene
└── scripts/
    └── player.varg
```

## `Varg.toml`

`Varg.toml` はプロジェクトマニフェストです。プロジェクト名、アセットルート、スクリプトの探索場所、既定で開くシーンを、エディターとランタイムに伝えます。

```toml
name = "My Game"
asset_root = "assets"
script_roots = ["scripts"]
default_scene = "scenes/main.vscene"
```

よく使うフィールド:

| フィールド | 役割 |
| --- | --- |
| `name` | プロジェクト名。エディターやビルド成果物に表示されます |
| `asset_root` | アセットディレクトリ。通常は `assets` |
| `script_roots` | スクリプト探索ディレクトリ。通常は `["scripts"]` |
| `default_scene` | Play またはパッケージ時に既定で入るシーン |

シーン内に `source: "scripts/player.varg"` と書かれている場合、ランタイムはプロジェクト設定に基づいてそのスクリプトファイルを見つけます。

## `scenes/`

`scenes/` には `.vscene` ファイルを置きます。`.vscene` は「ゲーム開始時に世界の中に何があるか」を表すものだと考えると分かりやすいです。

シーンがよく担当すること:

- プレイヤー、カメラ、ライト、初期オブジェクトを配置する。
- `Player`、`Platform`、`Collectible` などの tag をオブジェクトに設定する。
- オブジェクトにスクリプトを取り付ける。
- スクリプト内の `@export var` の調整値を上書きする。

小さなシーンは、たとえば次のようになります。

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

経験則として、シーンは「物を置き、パラメータを調整する」場所で、スクリプトは「実行時のルール」を書く場所です。

## `scripts/`

`scripts/` には `.varg` ファイルを置きます。移動、計時、得点、オブジェクト生成、HUD、効果音などのランタイムロジックを担当します。

```txt
scripts/
├── player.varg
├── camera.varg
├── enemy.varg
└── despawn_far.varg
```

入門プロジェクトでは、まずオブジェクトまたは責務で分けるのがおすすめです。

| スクリプト | 担当しやすいこと |
| --- | --- |
| `player.varg` | プレイヤー入力、移動、生命、得点 |
| `camera.varg` | カメラ追従、一人称視点 |
| `enemy.varg` | 敵の移動、検出、被弾 |
| `despawn_far.varg` | 一時オブジェクトがプレイヤーから遠すぎる時のクリーンアップ |

最初から細かく分けすぎないでください。ゲームプレイがまだ動いていない段階では、主要ロジックをひとつの主スクリプトに置いた方がデバッグしやすいです。ルールが安定したら、カメラ、クリーンアップ、浮遊アニメーションのような独立した責務を外へ出します。

## `assets/`

`assets/` にはプロジェクトアセットを置きます。初期チュートリアルでは外部アセットをあまり使わなくても進められますが、実際のプロジェクトではモデル、テクスチャ、音声、マテリアルが徐々に増えます。

```txt
assets/
├── models/
├── textures/
├── audio/
└── materials/
```

よくある配置:

| ディレクトリ | 内容 |
| --- | --- |
| `models/` | キャラクター、道具、シーンモデル |
| `textures/` | テクスチャ、アイコン、UI 画像 |
| `audio/` | 効果音と音楽 |
| `materials/` | マテリアル設定または関連リソース |

チュートリアルプロジェクトでは、ランタイム生成の箱や球から始めることがよくあります。これはアセットによる混乱を減らすためです。ゲームプレイルールが成り立ってから正式アセットに置き換える方が安定します。

## `build/`

`build/` または類似の出力ディレクトリにはビルド成果物を置きます。主に編集する場所ではありません。

通常、ゲームプレイスクリプトをビルド出力ディレクトリに直接書くべきではありません。ソースファイルは `scripts/`、`scenes/`、`assets/` に置き、ビルド流れで最終成果物を生成します。

## ファイル同士のつながり

最も重要な参照チェーンは次の通りです。

1. `Varg.toml` が既定シーンを指定します: `default_scene = "scenes/main.vscene"`。
2. `main.vscene` がプレイヤーオブジェクトを配置します。
3. プレイヤーオブジェクトにスクリプトを付けます: `source: "scripts/player.varg"`。
4. `player.varg` が `update(_ dt: Float)` で入力を読み、プレイヤーを動かし、HUD を更新します。

つまり、プロジェクトは単一ファイルだけで動くのではなく、この参照チェーンで動きます。

```txt
Varg.toml -> scenes/main.vscene -> scripts/player.varg
```

Play 後に何も起きない場合は、まずこのチェーンを確認してください。

| 問題 | 確認すること |
| --- | --- |
| 期待したシーンではない | `default_scene` が正しい `.vscene` を指しているか |
| スクリプトが動かない | シーンオブジェクトにスクリプトが付いているか、`source` パスが正しいか |
| tag 検索でオブジェクトが見つからない | `.vscene` の tag がスクリプト文字列と完全一致しているか |
| パラメータが効かない | シーン内のスクリプトフィールド名が `@export var` と一致しているか |

## エンジンソース構造との違い

Varg エンジンのソースコードリポジトリには `editor/`、`crates/`、`xtask/` のようなディレクトリがあります。これはエンジンやエディターを開発する人向けの構造です。

制作者がゲームを作る時にまず見るべきなのは、自分のプロジェクトです。

```txt
Varg.toml
scenes/
scripts/
assets/
```

以降のチュートリアルでは、このユーザープロジェクトのメンタルモデルで説明します。エンジン内部の crate 階層は、エディター、レンダラー、ランタイムを変更する時だけ深掘りすれば十分です。
