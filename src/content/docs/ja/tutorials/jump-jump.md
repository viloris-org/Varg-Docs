---
title: チュートリアル：エンドレスジャンプを作る
description: シーン、スクリプト状態、ランタイムでのプラットフォーム生成、HUD から Jump Jump のゲームプレイループを分解します。
---

Jump Jump は小さな一人称エンドレスジャンプゲームですが、溜め、ジャンプ、着地判定、得点、失敗、リトライ、前方へ伸び続けるレベルという完全なゲームプレイループを含んでいます。

プレイヤーは Space を押し続けて溜め、離すと視線方向へ次のプラットフォームにジャンプします。スクリプトは前方に新しいプラットフォーム、収集物、危険区域を生成します。着地成功で得点し、危険区域を踏むか落下すると失敗し、最近のチェックポイントから再試行します。

サンプルソース: [examples/project/jump_jump](https://github.com/viloris-org/Varg/tree/main/examples/project/jump_jump)。

:::tip[読むのに向いているタイミング]
スクリプト基礎を学んだばかりなら、「第 4 歩：空中弧線を書く」まで進めるだけでも構いません。そこまでで遊べるジャンププロトタイプになります。後半の着地判定、エンドレス生成、HUD は、プロトタイプを完全なミニゲームにする部分です。一度に全部飲み込む必要はありません。
:::

## 始める前に知っておくこと

- `@export var` と普通の `var` の違いが分かる。
- `start()` は初期化、`update(_ dt: Float)` は毎フレーム実行に使うと知っている。
- `Input.down`、`Input.released`、`position` を使える。
- tag がスクリプトからシーンオブジェクトを探すための名前だと知っている。

これらがまだ不慣れなら、先に [ゼロからのスクリプト入門](/ja/scripting/programming-primer/)、[スクリプト基礎](/ja/scripting/basics/)、[ライフサイクルと入力](/ja/scripting/lifecycle-input/) を読んでください。もっと小さなゲームプレイループを先に作りたい場合は、[中級演習：遊べる収集ループを作る](/ja/tutorials/first-playable-loop/) から進めてもよいです。

## 学べること

- `.vscene` を初期レベル、`.varg` をランタイムゲームプレイとして扱う方法。
- `phase` を使って単純で安定したプレイヤー状態機械を書く方法。
- `scene.spawnBox` と `scene.spawnSphere` でエンドレス生成を行う方法。
- tag と距離検索で着地、収集、危険区域を判定する方法。
- `ui.rect`、`ui.label`、`ui.toggle` で HUD と補助モードを作る方法。
- 手続き的効果音と GI 強度でゲームプレイのフィードバックを強める方法。

このページは前の構文ページより範囲が広いです。読む時は 3 つに分けてください。第 1 から第 4 歩で「跳べる」を作り、第 5 から第 7 歩で「判定と生成」を作り、第 8 歩で「プレイヤーが何が起きているか分かる」ようにします。

## 完成ゲームプレイ

操作:

| 入力 | 行動 |
| --- | --- |
| マウス移動 | 照準方向を調整 |
| Space 押し続け | 溜め |
| Space 離す | ジャンプ |
| WASD | ジャンプ方向へ少し偏移を加える |
| Fire | マウスを再捕獲 |
| Assist toggle | 着地点プレビューを表示 |

ゲームプレイループ:

1. プレイヤーがプラットフォーム上で溜める。
2. Space を離すと空中フェーズへ入る。
3. 着地時に、最近のプラットフォーム、目標プラットフォーム、危険区域、収集物をスクリプトが確認する。
4. 成功するとチェックポイント、スコア、コンボ、難度を更新する。
5. スクリプトはプレイヤー前方に次のプラットフォーム群を生成し続ける。

## プロジェクト構造

```txt
jump_jump/
├── Varg.toml
├── scenes/
│   └── jump_jump.vscene
└── scripts/
    ├── jump_player.varg
    ├── first_person_camera.varg
    ├── despawn_far.varg
    └── bobber.varg
```

`Varg.toml` は既定シーンとスクリプトルートを定義します。

```toml
name = "Jump Jump"
asset_root = "assets"
script_roots = ["scripts"]
default_scene = "scenes/jump_jump.vscene"
```

つまり、シーンに `source: "scripts/jump_player.varg"` と書くと、ランタイムはプロジェクト内でそのスクリプトを見つけられます。

## 第 1 歩：初期シーンを準備する

`.vscene` は「ゲーム開始時に何があるか」を担当します。Jump Jump の初期シーンには少なくとも次が必要です。

- `FirstPersonCamera` を付けたカメラ。
- tag が `Player` で、`JumpPlayer` を付けたプレイヤーオブジェクト。
- tag が `Platform` または `Goal` の開始プラットフォーム数枚。
- ゲーム開始時から読めるようにするライト。

プレイヤースクリプトの取り付け断片は次のようになります。

```swift
script JumpPlayer {
    source: "scripts/jump_player.varg"
    maxCharge: 1.25
    jumpScale: 5.0
    arcHeight: 3.0
    spawnAhead: 36.0
    segmentLength: 2.9
    routeYaw: -34.0
    giIntensity: 1.35
}
```

ここで渡した値は、スクリプト内の `@export var` 既定値を上書きします。つまり、`.vscene` のスクリプトフィールドは飾りではなく、レベル調整の入口です。先にこれらのパラメータを公開しておくと、後で手触りを調整する時にコードを当てずっぽうで変えずに済みます。

## 第 2 歩：プレイヤー状態を定義する

`jump_player.varg` の変数は多く見えますが、グループで理解できます。

| グループ | 変数例 | 用途 |
| --- | --- | --- |
| 調整 | `maxCharge`、`jumpScale`、`arcHeight`、`spawnAhead` | デザイナーが手触りを調整 |
| ジャンプ状態 | `charge`、`phase`、`jumpTime`、`startX`、`targetX` | 溜めと空中移動を制御 |
| 進捗 | `score`、`bestDistance`、`combo`、`difficulty` | プレイヤー成績を記録 |
| 生成 | `nextSpawnX`、`nextSpawnZ`、`spawnIndex` | 次のプラットフォーム位置を決める |
| フィードバック | `hudStatus`、`musicStarted`、`renderReady` | UI、音声、レンダリングを制御 |
| 失敗復帰 | `gameOver`、`checkpointX`、`checkpointZ` | 最近の安全位置から再試行 |

先に変数をグループ化してからコードを読む方が、最初の行から最後の行まで読むより確実です。状態機械スクリプトで怖いのは、変数が散らばりすぎて、どの値がどのルールに属するか分からなくなることです。

## 第 3 歩：溜めフェーズを書く

`phase == 0` は、プレイヤーが地上にいて溜められることを表します。

```swift
if phase == 0 {
    hudStatus = "Mouse look / hold Space"

    if Input.down("Jump") {
        charge += dt
        if charge > maxCharge {
            charge = maxCharge
        }
        hudStatus = "Release to jump"
    }
}
```

ここでは `wait()` を使いません。溜めは毎フレーム入力と HUD に反応する必要があるからです。Space が押されている間は `charge` を累積し、上限に達したら `maxCharge` で切ります。

Space を離した時、現在位置と目標位置を保存し、空中フェーズへ切り替えます。

```swift
if Input.released("Jump") && charge > 0.05 {
    startX = position.x
    startZ = position.z

    let yawRad: Float = aimYaw * 0.01745329
    let forwardX: Float = -sin(yawRad)
    let forwardZ: Float = cos(yawRad)
    let distance: Float = charge * jumpScale

    targetX = position.x + forwardX * distance
    targetZ = position.z + forwardZ * distance

    jumpTime = 0.0
    phase = 1
    hudStatus = "Airborne"
    Audio.playTone3D("sine", 360.0 + charge * 260.0, 0.08, 0.22)
}
```

このコードの要点は「目標点は離した瞬間に確定する」ことです。押している間、プレイヤーはまだ視点を調整できます。離した後、スクリプトはその時点の yaw から前方を計算し、`charge` を距離に変えます。

## 第 4 歩：空中弧線を書く

`phase == 1` はプレイヤーが飛行中であることを表します。水平位置は `lerp`、垂直高さは `sin` を使います。

```swift
if phase == 1 {
    jumpTime += dt * 1.85
    let t: Float = clamp(jumpTime, 0.0, 1.0)

    position.x = lerp(startX, targetX, t)
    position.z = lerp(startZ, targetZ, t)
    position.y = 1.1 + sin(t * 3.14159) * arcHeight
}
```

こう書く理由:

- `lerp(start, target, t)` は水平移動を安定して制御しやすくします。
- `sin(t * pi)` は開始点と終了点で 0、中間で最大になるため、自然にジャンプ弧線に見えます。
- `clamp` は `t` が 1 を超えないようにし、着地後に外挿し続けることを防ぎます。

これは最終的な物理キャラクターコントローラーではありませんが、最初の版として優れたゲームプレイコードです。説明でき、調整でき、すぐ遊べます。ルールが安定してから、より現実的な運動モデルに置き換えても遅くありません。

## 第 5 歩：着地判定

`jumpTime >= 1.0` になったら、スクリプトは着地したかを判定します。

```swift
let platformFootprint: Float = scene.horizontalDistanceToTagBounds("Platform")
let platformSurface: Float = scene.distanceToTagBounds("Platform")
let goalFootprint: Float = scene.horizontalDistanceToTagBounds("Goal")
let goalSurface: Float = scene.distanceToTagBounds("Goal")

var landed: Bool = false

if platformFootprint <= 0.18 && platformSurface <= 0.98 {
    landed = true
}

if goalFootprint <= 0.18 && goalSurface <= 0.98 {
    landed = true
}

if scene.distanceToTag("Hazard") <= 0.9 {
    landed = false
    dangerStreak += 1
}
```

ここには重要な技があります。`horizontalDistanceToTagBounds` で水平着地点を判断し、`distanceToTagBounds` で表面に十分近いかを判断します。中心点距離だけでは、大きいプラットフォームと小さいプラットフォームの手触りが一致しにくくなります。

## 第 6 歩：報酬、失敗、チェックポイント

着地成功後、スコアとチェックポイントを更新します。

```swift
if landed {
    score += 1 + dangerStreak
    combo += 1
    checkpointX = position.x
    checkpointZ = position.z

    if combo > bestCombo {
        bestCombo = combo
    }
}
```

収集物も tag 検索です。

```swift
if scene.distanceToTag("Collectible") <= 1.45 {
    score += 10 + combo
    scene.destroyNearestWithTag("Collectible", 1.45)
    Audio.playTone3D("triangle", 880.0 + combo * 18.0, 0.12, 0.34)
    hudStatus = "Crystal +" + (10 + combo)
}
```

失敗時に直接シーンを再読み込みしないでください。`gameOver` を `true` にし、HUD が結果を表示する機会を残します。

```swift
if !landed {
    position.y = -1.2
    gameOver = true
    combo = 0
    Audio.stopLoop("jump_rush_bgm")
    musicStarted = false
    Audio.playTone("noise", 120.0, 0.18, 0.28)
}
```

リトライ時は最近のチェックポイントから復帰します。

```swift
if gameOver && Input.pressed("Jump") {
    charge = 0.0
    phase = 0
    jumpTime = 0.0
    gameOver = false
    position = Vec3(checkpointX, 1.1, checkpointZ)
}
```

## 第 7 歩：プラットフォームをエンドレス生成する

プラットフォームをすべてシーンに書くのではなく、ランタイムでプレイヤー前方に補います。

```swift
while nextSpawnX < position.x + spawnAhead {
    let lane: Float = spawnIndex - floor(spawnIndex / 4.0) * 4.0
    let wobble: Float = sin(spawnIndex * 1.7) * 0.9
    let platformZ: Float = nextSpawnZ + wobble
    let platformWidth: Float = 2.7 + abs(sin(spawnIndex * 0.9)) * 0.7 - difficulty * 0.65
    let platformDepth: Float = 2.8 - difficulty * 0.45

    scene.spawnBox("Generated Platform", "Platform", Vec3(nextSpawnX, 0.0, platformZ), Vec3(platformWidth, 0.5, platformDepth), "scripts/despawn_far.varg")

    nextSpawnX += segmentLength + difficulty * 0.38
    nextSpawnZ += 0.72 + sin(spawnIndex * 0.6) * 0.25 + difficulty * 0.1
    spawnIndex += 1
}
```

この生成器はランダムに置いているのではなく、「決定的な変化」を使っています。

- `spawnIndex` により各区間を再現できます。
- `sin(spawnIndex * n)` が位置と幅に変化を与えます。
- `difficulty` によりプラットフォームは徐々に狭くなり、間隔も変化します。
- `despawn_far.varg` が背後のオブジェクトをクリーンアップします。

## 第 8 歩：HUD と補助モードを加える

HUD には、プレイヤーが判断に使える情報を表示します。スコア、距離、コンボ、状態、リスク、溜めバーです。

```swift
let chargeWidth: Float = 160.0 * clamp(charge / maxCharge, 0.0, 1.0)

ui.rect("jump_hud_panel", 12.0, 12.0, 340.0, 154.0, 0.03, 0.04, 0.06, 0.86)
ui.label("jump_hud_score", "Score: " + score, 24.0, 42.0)
ui.label("jump_hud_distance", "Distance: " + floor(bestDistance), 154.0, 42.0)
ui.label("jump_hud_status", hudStatus, 24.0, 84.0)
ui.rect("jump_hud_charge_bg", 24.0, 128.0, 160.0, 10.0, 0.18, 0.2, 0.24, 1.0)
ui.rect("jump_hud_charge", 24.0, 128.0, chargeWidth, 10.0, 0.34, 0.75, 0.92, 1.0)
```

補助モードは `ui.toggle` で制御します。

```swift
assistMode = ui.toggle("jump_assist_toggle", assistMode, 282.0, 112.0, 48.0, 24.0)
```

有効なら、一時的なプレビュー球を生成します。

```swift
if assistMode && ghostCooldown <= 0.0 {
    scene.spawnSphere("Assist Landing Preview", "Assist", Vec3(previewX, 0.78, previewZ), 0.18, "scripts/despawn_far.varg")
    ghostCooldown = 0.18
}
```

このステップは、スクリプトを「動く」から「プレイヤーが読める」へ押し上げます。多くのプロトタイプはルールが悪いのではなく、プレイヤーが何を正しくやったのか、何を間違えたのか分からないために失敗します。

## よくある問題

| 問題 | 可能な原因 | 修正 |
| --- | --- | --- |
| プラットフォーム生成後に着地できない | tag が間違っている、または `Platform` / `Goal` を使っていない | 生成コードとシーン内の tag を確認 |
| 生成オブジェクトが増え続ける | クリーンアップスクリプトを付けていない | ランタイム生成物に `scripts/despawn_far.varg` を渡す |
| ジャンプ方向がおかしい | yaw のラジアン変換または forward 方向が逆 | `yaw * 0.01745329` と `-sin/cos` を確認 |
| 溜めバーが動かない | `charge` がフレームをまたいで保存されていない | `charge` がスクリプトスコープの `var` か確認 |
| リトライ後に状態がおかしい | 位置だけを戻し、phase/timer を戻していない | 失敗復帰関連変数をまとめてリセット |

## 練習

1. `Bonus` プラットフォームを追加し、着地すると時間を追加する。
2. `assistMode` を初心者の最初の 100 メートルだけ使えるようにする。
3. `difficulty` に応じて危険区域の生成確率を上げる。
4. `ui.slider` でデバッグパネルを作り、実行中に `jumpScale` を調整する。
5. 連続パーフェクト着地に、音高の違う提示音を追加する。
