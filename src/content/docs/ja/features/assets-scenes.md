---
title: アセット、シーン、宣言的ファイル
description: .varg、.vscene、.vmodel、.vasset の責務境界を理解します。
---

Varg は、人間と AI のどちらも読み、変更し、検証できる統一スタイルの authoring 言語群を提供する計画です。

## ファイルの役割

| 拡張子 | 役割 | 用途 | チューリング完全か |
| --- | --- | --- | --- |
| `.varg` | Logic file | スクリプト、モジュール、動的 gameplay ロジック、宣言的 behavior | `script` と `module` は完全、`behavior` は不完全 |
| `.vscene` | World file | シーン、prefab、エンティティ構成、レイアウト意図、ネットワーク複製宣言 | いいえ |
| `.vmodel` | Model authoring file | 手続き的またはパラメータ化されたモデル構築 | いいえ |
| `.vasset` | Asset file | アセット登録、インポート設定、マテリアル、音声イベント、依存関係 | いいえ |

## `.vscene` シーン例

```swift
scene MainScene {
    camera "MainCamera" {
        transform {
            position: Vec3(0, 6, 10)
            rotation: Euler(-30, 0, 0)
        }

        primary: true
    }

    entity "Player" {
        tag: "player"

        transform {
            position: Vec3(0, 1, 0)
        }

        script PlayerController {
            source: "scripts/player_controller.varg"
            speed: 6.0
        }
    }
}
```

シーンファイルは「何があるか」と「どこにあるか」を記述します。任意のループやランタイムイベントは書きません。

## AI 意図式シーン

Varg の設計では、AI が高レベルの意図を書くことを許します。

```swift
scene ForestCamp {
    intent: "A small night camp in a forest clearing"

    scatter "PineTree" {
        count: 32
        area: ring(inner: 8, outer: 18)
        scale: range(0.8, 1.4)
    }
}
```

この種のファイルは、後でツールによって確定的なシーンオブジェクトへコンパイルされます。ソースファイルには作者の意図が残るため、人間のレビューや AI による追加修正がしやすくなります。

## アセットパイプライン

Varg のアセットシステムは次を担当します。

- glTF、PNG、音声などのアセットをインポートする
- アセットデータベースとマニフェストを作る
- ファイル変更を監視してホットリロードする
- パッケージ時にアセットをコピーし、`asset-manifest.json` を生成する

アセットに必要なのが登録、インポート設定、マテリアルパラメータだけなら、優先して `.vasset` に置きます。ランタイムロジックが必要な場合にだけ `.varg` を書きます。
