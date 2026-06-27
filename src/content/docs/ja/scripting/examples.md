---
title: サンプル解説
description: Varg examples/scripts から、よくあるスクリプトパターンを学びます。
---

これらのサンプルは Varg リポジトリの `examples/scripts` から来ています。自分のスクリプトを書く時のテンプレートとして使えます。より完全な手順付きチュートリアルはこちらです。

- [中級演習：遊べる収集ループを作る](/ja/tutorials/first-playable-loop/)
- [エンドレスジャンプを作る](/ja/tutorials/jump-jump/)
- [射撃訓練場を作る](/ja/tutorials/fps-arena/)

プログラミングにまだ慣れていない場合、サンプルを最初の行から最後の行まで読む必要はありません。まず 3 つ質問してください。このスクリプトは何の状態を覚えているか。`update()` で毎フレーム何を確認しているか。プレイヤーが何をした後、状態がどう変わるか。

この読み方がまだ身についていない場合は、先に [基礎から応用へ：ゲームプレイスクリプトを整理する](/ja/scripting/gameplay-loop-patterns/) を読んでください。そのページでは、変数、入力、タイマー、フィードバックを 1 つの `update()` に並べる方法を扱います。

## 武器クールダウン

中心ファイル: `weapon_cooldown.varg`

```swift
script WeaponCooldown {
    @export var fireRate: Float = 0.5
    @export var damage: Int = 10

    var canFire: Bool = true
    var ammo: Int = 30

    func update(_ dt: Float) {
        if Input.pressed("Fire") && canFire && ammo > 0 {
            ammo -= 1
            canFire = false
            wait(fireRate)
            canFire = true
        }
    }
}
```

学べるパターン:

- 調整可能な設計パラメータを `@export var` に置く
- 永続状態として `canFire` と `ammo` を保存する
- 入力イベントで状態変化を起こす
- `wait()` で短い停止を表す

## パーティクルカウンタ

中心ファイル: `particle_system.varg`

```swift
var particlesActive: Int = 0
var timeSinceEmit: Float = 0.0

func update(_ dt: Float) {
    timeSinceEmit += dt

    let emitInterval: Float = 1.0 / emitRate
    while timeSinceEmit >= emitInterval {
        if particlesActive < particleCount {
            particlesActive += 1
        }
        timeSinceEmit -= emitInterval
    }
}
```

学べるパターン:

- 累積時間でフレーム更新を固定頻度イベントに変える
- 1 フレーム内で複数回発生する可能性がある発射を `while` で処理する
- 上限判断で状態が設計範囲を超えないようにする

## ウェーブスポナー

中心ファイル: `wave_spawner.varg`

このサンプルはロジックを複数状態に分けています。

| 状態 | 意味 |
| --- | --- |
| `currentWave` | 現在のウェーブ |
| `waveTimer` | 次のウェーブまでの残り時間 |
| `enemiesSpawned` | 現在ウェーブで生成済みの数 |
| `isSpawning` | 生成中かどうか |

重要な断片:

```swift
if waveTimer <= 0 && !isSpawning {
    currentWave += 1
    isSpawning = true
    enemiesSpawned = 0
    log("Starting wave")
}
```

これは典型的な状態機械の書き方です。ある条件が状態遷移を起こし、その後のロジックが新しい状態に基づいて動き続けます。

## ループデモ

中心ファイル: `loop_demo.varg`

このファイルは次を扱います。

- `0..3` 範囲ループ
- `1..=5` 終端を含む範囲ループ
- `count(3)` 回数指定ループ
- ネストしたループ
- `break` と `continue`
- `sin(Time.time + i)` によるアニメーション重ね合わせ

一括確認、一括加算、単純なアニメーションサンプリングが必要な時は、まずこのファイルを参考にできます。

## 完全プロジェクトサンプル

[examples/project/jump_jump](https://github.com/viloris-org/Varg/tree/main/examples/project/jump_jump) と [examples/project/fps_arena](https://github.com/viloris-org/Varg/tree/main/examples/project/fps_arena) は、基礎 examples の範囲を超えています。

| プロジェクト | 重点能力 | 推奨読むファイル |
| --- | --- | --- |
| `jump_jump` | 一人称の溜めジャンプ、ランタイム生成プラットフォーム、着地点判定、収集物、HUD、補助モード | `scripts/jump_player.varg` |
| `fps_arena` | 一人称移動、弾薬とリロード、ターゲット生成、距離命中、ウェーブ圧力、HUD | `scripts/fps_player.varg` |

単体ファイル examples は簡単すぎるが完全プロジェクトは大きすぎると感じる場合は、先に [中級演習：遊べる収集ループを作る](/ja/tutorials/first-playable-loop/) を進めてください。移動、取得、得点、計時、生成、HUD を小さな 1 つのスクリプトに置くので、構文ページの次にちょうどよい内容です。
