---
title: 高度なゲームプレイスクリプト
description: シーン検索、動的生成、HUD、音声、マウス、描画コマンドを使って、本当に遊べるループを作ります。
---

基礎構文を学ぶと、「キーで移動する」「武器クールダウン」「タイマー」のような局所ロジックは書けるようになります。本物のゲームスクリプトでは、さらに複数のシステムを接続します。プレイヤー入力が状態を変え、状態がシーンオブジェクトを生成または破棄し、シーンオブジェクトが得点、失敗条件、音、UI に影響を返します。

このページは完全な API 索引ではありません。ゲームプレイスクリプトを書くための作業方法です。例は Varg リポジトリのプロジェクトから来ています。

- [examples/project/jump_jump](https://github.com/viloris-org/Varg/tree/main/examples/project/jump_jump): エンドレスジャンプ。重点はプラットフォーム生成、着地点判定、HUD、補助モードです。
- [examples/project/fps_arena](https://github.com/viloris-org/Varg/tree/main/examples/project/fps_arena): 射撃訓練場。重点は一人称移動、ターゲット生成、リロード、命中フィードバック、ウェーブ圧力です。

:::note[現在実行できる範囲]
このページでは、現在の MVP サンプルですでに使われている能力だけを扱います。汎用 `scene.spawn(...)`、アセット式 `Audio.play(...)`、イベントバス、モジュール呼び出し、配列、辞書は目標方向です。公開チュートリアルでは、安定済み能力として扱わないでください。
:::

## 1 本のゲームプレイループ

多くの中小規模ゲームプレイスクリプトは、同じループに分解できます。

1. 入力を読む: `Input.value`、`Input.pressed`、`Input.mouseDeltaX`。
2. 状態を更新する: 弾薬、スコア、フェーズ、タイマー、難度、失敗したか。
3. 世界を変える: プレイヤーを動かす、プラットフォームや敵を生成する、拾われた/命中したオブジェクトを破棄する。
4. 世界を検索する: 最近ターゲットまでの距離、プラットフォーム上に着地したか、プレイヤーと一時オブジェクトの距離。
5. フィードバックを出す: HUD、効果音、音楽、レンダリング環境。

スクリプトを書く時は、まずこの 5 つをコメントまたは小節として書き、その後にコードを入れます。そうすれば、数百行になっても読めます。

## シーン tag は低コストなインターフェース

現在の Varg MVP で、スクリプトとシーンをつなぐ最も安定した方法は tag です。`.vscene` またはランタイム生成時にオブジェクトへラベルを付け、スクリプトは tag で近いオブジェクトを検索します。

ほかのエンジンを使ったことがないなら、tag は「オブジェクトに貼るラベル」だと考えてください。スクリプトはシーン内にプラットフォーム、ターゲット、収集物が具体的に何個あるかを知りません。しかし「一番近い `Platform` までどれくらいか」と尋ねられます。これが tag 検索の価値です。

```swift
entity "Player" {
    tag: "Player"
}
```

ランタイム生成する時も tag を付けます。

```swift
scene.spawnSphere("Training Drone Core", "Target", Vec3(x, y, z), 0.42, "scripts/target_drift.varg")
```

スクリプトでは tag を使って命中や取得を判定します。

```swift
let targetDistance: Float = scene.distanceToTag("Target")

if targetDistance <= hitRadius {
    scene.destroyNearestWithTag("Target", hitRadius)
    score += 100
}
```

よく使う検索:

| API | 向いている場面 |
| --- | --- |
| `scene.distanceToTag("Target")` | 命中、取得、危険区域接触 |
| `scene.distanceToTagBounds("Platform")` | オブジェクト表面までの近さを判断 |
| `scene.horizontalDistanceToTagBounds("Platform")` | プラットフォーム着地点。水平誤差だけを見る |
| `playerDistance()` | プレイヤーから遠すぎる一時オブジェクトのクリーンアップ |
| `scene.xOf("Player")` / `scene.yOf(...)` / `scene.zOf(...)` | カメラのプレイヤー追従 |

:::tip[公開チュートリアルでの言い方]
tag を最終的な ECS 検索システムとして説明しないでください。より正確には、現在の MVP では tag をスクリプトとシーンの間の軽量インターフェースとして使い、プロトタイプ、チュートリアル、小規模ゲームプレイに適しています。
:::

### 距離検索の選び方

3 つの距離関数は混同しやすいです。まず質問から選びます。

| 聞きたいこと | 推奨 API |
| --- | --- |
| プレイヤーが収集物または危険区域に触れたか | `scene.distanceToTag(...)` |
| プレイヤーがプラットフォーム表面の近くにいるか | `scene.distanceToTagBounds(...)` |
| プレイヤーの水平位置がプラットフォーム範囲内にあるか | `scene.horizontalDistanceToTagBounds(...)` |

たとえばプラットフォーム着地判定では、通常「水平着地点」と「表面からの高さ」を同時に見ます。

```swift
let footprint: Float = scene.horizontalDistanceToTagBounds("Platform")
let surface: Float = scene.distanceToTagBounds("Platform")

if footprint <= 0.18 && surface <= 0.98 {
    landed = true
}
```

中心点距離だけを見るより安定します。大きい足場、小さい足場、長い足場でも合理的な結果になりやすいです。

## 動的にオブジェクトを生成する

現在のランタイムは箱と球を生成できます。プラットフォーム、ターゲット、収集物、エフェクト点、プレビュー点などの学習場面には十分です。

```swift
scene.spawnBox(
    "Generated Platform",
    "Platform",
    Vec3(nextSpawnX, 0.0, platformZ),
    Vec3(platformWidth, 0.5, platformDepth),
    "scripts/despawn_far.varg"
)

scene.spawnSphere(
    "Generated Crystal",
    "Collectible",
    Vec3(nextSpawnX, 1.15, platformZ),
    0.35,
    "scripts/despawn_far.varg"
)
```

引数はこの順序で理解します。

| 位置 | 意味 |
| --- | --- |
| 1 | オブジェクト名。デバッグやエディター表示に便利 |
| 2 | tag。後の検索と破棄に使う |
| 3 | ワールド座標 |
| 4 | 箱のサイズまたは球の半径 |
| 5 | 任意のスクリプトパス。浮遊アニメーションや自動クリーンアップによく使う |

新しく始めた人が生成で最も起こしやすいミスは「生成するだけで回収しない」ことです。通常、一時オブジェクトにはクリーンアップスクリプトを付けます。

```swift
script DespawnFar {
    @export var maxDistance: Float = 46.0

    func update(_ dt: Float) {
        if playerDistance() > maxDistance {
            entity.destroy()
        }
    }
}
```

このスクリプトは小さいですが、エンドレス生成でシーンが埋まるのを防ぎます。

### 生成はランダムに投げることではない

多くのチュートリアルはランダム生成から始めますが、入門では「決定的な変化」をおすすめします。毎回ほぼ同じ結果になり、ルールの問題なのか運の問題なのかを判断しやすいためです。

```swift
let lane: Float = spawnIndex - floor(spawnIndex / 4.0) * 4.0
let wobble: Float = sin(spawnIndex * 1.7) * 0.9
let x: Float = spawnIndex * segmentLength
let z: Float = -3.0 + lane * 2.0 + wobble
```

ここで `spawnIndex` は番号のようなものです。0 番目、1 番目、2 番目のオブジェクトは別の位置に置かれます。`sin()` は位置に少し揺らぎを与え、機械的な格子に見えにくくします。

### いつスクリプトを付けるか

`spawnBox` / `spawnSphere` の最後の引数で、生成物にスクリプトを付けられます。よくある用途は 3 種類です。

| 生成物 | 向いているスクリプト |
| --- | --- |
| 背後のプラットフォーム、弾、エフェクト点 | 自動クリーンアップスクリプト |
| 収集物、ターゲット、ヒント球 | 浮遊または回転スクリプト |
| 一時危険区域 | カウントダウン破棄スクリプト |

チュートリアルを作り始める段階では、自動クリーンアップスクリプトだけで十分です。ゲームプレイにより強いフィードバックが必要になったら、浮遊、点滅、効果音スクリプトを追加します。

## 一人称入力

一人称制御は 2 つの部分で構成されます。プレイヤースクリプトが yaw を更新するか、カメラスクリプトがマウスを読み rotation を設定します。公開チュートリアルでは、責務が単純なカメラ版から説明するのがおすすめです。

```swift
script FirstPersonCamera {
    @export var eyeHeight: Float = 0.65
    @export var mouseSensitivity: Float = 0.08
    @export var minPitch: Float = -36.0
    @export var maxPitch: Float = 18.0

    var yaw: Float = -34.0
    var pitch: Float = -9.0
    var mouseCaptured: Bool = true

    func start() {
        Input.captureMouse(mouseCaptured)
    }

    func update(_ dt: Float) {
        if Input.pressed("Fire") {
            mouseCaptured = true
        }

        Input.captureMouse(mouseCaptured)

        if mouseCaptured {
            yaw += Input.mouseDeltaX() * mouseSensitivity
            pitch -= Input.mouseDeltaY() * mouseSensitivity
        }

        pitch = clamp(pitch, minPitch, maxPitch)

        position.x = scene.xOf("Player")
        position.y = scene.yOf("Player") + eyeHeight
        position.z = scene.zOf("Player")
        rotation = Vec3(pitch, yaw, 0.0)
    }
}
```

このスクリプトには 2 つの良い習慣があります。

- カメラは `scene.xOf("Player")` でプレイヤーを追従し、プレイヤー移動ロジックを複製しません。
- pitch を `clamp` で制限し、視点が反転しないようにします。

### yaw と pitch とは

3D プログラミング経験がない場合は、まずこう覚えてください。

| 名前 | 方向 |
| --- | --- |
| `yaw` | 左右に首を振る |
| `pitch` | 上下に見上げる/見下ろす |
| `rotation = Vec3(pitch, yaw, 0.0)` | カメラをこの向きへ回す |

マウス水平移動は通常 `yaw` を変え、マウス垂直移動は通常 `pitch` を変えます。`pitch` は範囲制限が必要です。人間は頭を無限に後ろへ反らせないためです。

一人称移動では `yaw` を前方ベクトルへ変換します。

```swift
let yawRad: Float = yaw * 0.01745329
let forwardX: Float = 0.0 - sin(yawRad)
let forwardZ: Float = cos(yawRad)
```

`0.01745329` は「度」から「ラジアン」へ変換する近似値です。三角関数を先に理解する必要はありません。ここでは `sin/cos` が「何度を向いているか」を「どちらへ進むか」に変えている、と分かれば十分です。

## HUD はゲームプレイフィードバックの一部

HUD は装飾ではありません。現在目標、弾薬、状態、リスク、コンボ、失敗理由をプレイヤーに伝えます。Varg MVP では、スクリプトから毎フレーム簡単な UI コマンドを発行できます。

```swift
ui.rect("hud_panel", 12.0, 12.0, 340.0, 154.0, 0.03, 0.04, 0.06, 0.86)
ui.label("hud_score", "Score: " + score, 24.0, 42.0)
ui.label("hud_status", status, 24.0, 84.0)
```

進捗バーも矩形です。

```swift
let chargeWidth: Float = 160.0 * clamp(charge / maxCharge, 0.0, 1.0)

ui.rect("charge_bg", 24.0, 128.0, 160.0, 10.0, 0.18, 0.2, 0.24, 1.0)
ui.rect("charge_fill", 24.0, 128.0, chargeWidth, 10.0, 0.34, 0.75, 0.92, 1.0)
```

インタラクティブなコントロールは新しい値を直接返せます。

```swift
assistMode = ui.toggle("assist_toggle", assistMode, 282.0, 112.0, 48.0, 24.0)
```

公開チュートリアルで先に扱うのに向いた UI:

| API | 用途 |
| --- | --- |
| `ui.label(...)` | テキスト |
| `ui.rect(...)` | パネル、体力バー、進捗バー |
| `ui.toggle(...)` | スイッチ。補助モードなど |
| `ui.slider(...)` | デバッグ値。難度や音量など |
| `ui.button(...)` | メニューまたはリスタート |

### HUD はまず意思決定情報を表示する

入門時は、美しい画面を急がないでください。まず「プレイヤーが次の 1 秒で知るべきことは何か」を問います。

| ゲームプレイ | HUD がまず表示すべきもの |
| --- | --- |
| 収集ミニゲーム | スコア、残り時間、終了したか |
| ジャンプゲーム | 溜め、状態、スコア、補助が有効か |
| 射撃訓練場 | 弾薬、リロード状態、カウントダウン、ターゲット進捗 |

プレイヤーの判断に影響しない情報は後で足せます。こうすれば HUD が数字だらけになりません。

### デバッグ UI も有用

`ui.slider` と `ui.toggle` はプレイヤー用だけでなく、開発者のデバッグにも使えます。

```swift
difficulty = ui.slider("debug_difficulty", difficulty, 0.0, 1.0, 24.0, 148.0, 180.0)
assistMode = ui.toggle("debug_assist", assistMode, 220.0, 148.0, 48.0, 24.0)
```

これにより、プレイしながら難度、速度、補助モードを調整できます。値を変えるたびに再起動する必要がありません。

## 効果音はまず手続き的 tone でよい

チュートリアルプロジェクトでは、最初から外部音声パイプラインを導入する必要はありません。手続き的 tone だけでも、「成功」「失敗」「リロード」「命中」「コンボ上昇」を表現できます。

```swift
Audio.playTone("square", 220.0, 0.08, 0.14)
Audio.playTone3D("triangle", 880.0 + combo * 18.0, 0.12, 0.34)
```

ループ音楽も pattern で書けます。

```swift
if !musicStarted {
    Audio.startLoop("main_loop", "triangle", "C4 E4 G4 R E4 G4 B4 R", 132.0, 0.5, 0.12)
    musicStarted = true
}

if gameOver {
    Audio.stopLoop("main_loop")
    musicStarted = false
}
```

`R` は休符です。よく使う波形には `"sine"`、`"square"`、`"triangle"`、`"saw"`、`"noise"` があります。

### イベントごとに違う音を付ける

音は複雑でなくてもよいですが、区別できる必要があります。

| イベント | おすすめの感触 |
| --- | --- |
| 収集成功 | 短く、高く、きれい |
| 失敗 | 低く、粗く、少し長い |
| リロード | 中低域。機械的な反応 |
| コンボ | 音高が徐々に上がる |

例:

```swift
Audio.playTone("triangle", 860.0, 0.08, 0.25)
Audio.playTone("noise", 120.0, 0.18, 0.28)
Audio.playTone("square", 220.0, 0.08, 0.14)
Audio.playTone3D("sine", 760.0 + combo * 18.0, 0.04, 0.22)
```

まず各イベントに明確なフィードバックを持たせ、その後で実際の音声アセットを検討します。

## レンダリングコマンドは初期化と動的更新を分ける

グローバルイルミネーション設定は通常 1 回だけ初期化すれば十分です。

```swift
if !renderReady {
    render.gi.useScreenSpace()
    render.gi.useProbeVolume(Vec3(10.0, 3.5, 7.0), Vec3(42.0, 12.0, 26.0), Vec3(5.0, 3.0, 4.0), giIntensity)
    render.gi.setIntensity(giIntensity)
    renderReady = true
}
```

難度で変わる強度は毎フレーム更新できます。

```swift
render.gi.setIntensity(giIntensity + difficulty * 0.35)
```

公開チュートリアルでは、このパターンを「一度きりの設定 + 毎フレームの変調」と呼べます。読者が他システムへ移しやすくなります。

### レンダリング API が必要な時

レンダリング API は入門スクリプトの必需品ではありません。ゲームプレイルールが成立した後、雰囲気とフィードバックを強めるために使うのに向いています。

| 需要 | 使えるもの |
| --- | --- |
| シーン全体を明るくまたは暗くしたい | `render.gi.setIntensity(...)` |
| プロトタイプシーンに素早く照明階層を作りたい | `render.gi.useScreenSpace()` |
| 固定区域でより安定した GI が必要 | `render.gi.useProbeVolume(...)` |

チュートリアルでは、レンダリングを「フィードバック強化」章に置くことをおすすめします。最初の手順に置くと、読者が移動、状態、判定を理解する前にグラフィック概念で止まりやすくなります。

## 公開チュートリアルの最小チェックリスト

プレイヤーまたは制作者向けの高度なチュートリアルを書く時は、少なくとも次を説明してください。

| 項目 | なぜ重要か |
| --- | --- |
| 完成形 | 読者が何を作るか分かる |
| 入力と操作 | 読者がすぐ試せる |
| ファイル一覧 | 読者が見るべきファイルを知る |
| 状態表 | なぜその変数が必要か理解できる |
| メインループ | コードを貼るだけでなく、毎フレーム何をするかを説明する |
| 失敗とフィードバック | ゲーム感はルールだけでなくフィードバックから来る |
| 拡張課題 | 読者が自分の版へ改造し続けられる |

次の章から、この方法で 2 つの完全プロジェクトチュートリアルを書き直します。
