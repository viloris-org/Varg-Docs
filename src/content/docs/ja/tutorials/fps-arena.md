---
title: チュートリアル：射撃訓練場を作る
description: 一人称移動、リロード、ターゲット生成、命中フィードバック、HUD から FPS Arena のリズムを分解します。
---

FPS Arena は閉じたフィールド内の射撃訓練場です。複雑なアセットも完全な武器システムもありません。扱うのは、より基礎的で重要なことです。プレイヤーが移動でき、発射でき、リロードでき、ターゲットが継続的に出現し、時間とともに圧力が上がることです。

プレイヤーはフィールド内を移動し、照準し、動的生成されるドローンターゲットを撃ちます。ターゲットが溜まりすぎると `integrity` が下がり、十分な数を処理できればクリアです。

サンプルソース: [examples/project/fps_arena](https://github.com/viloris-org/Varg/tree/main/examples/project/fps_arena)。

:::note[読む提案]
このページは Jump Jump より「複数システムの合成」に近いです。移動、武器、スポーン、勝敗、HUD が同じ主スクリプトに入っています。最初に読む時は、まず移動とリロードを押さえ、ターゲット生成と勝敗圧力は 2 回目に回してもかまいません。
:::

## 始める前に知っておくこと

- [チュートリアル：エンドレスジャンプを作る](/ja/tutorials/jump-jump/) の前半 4 ステップを読んでいる、または `phase`、タイマー、`position` が分かる。
- プログラミング未経験の場合は、[中級演習：遊べる収集ループを作る](/ja/tutorials/first-playable-loop/) を終えている。
- 移動とカウントダウンに `dt` を掛ける理由を知っている。
- tag 検索は最終的な射線システムではなく、現在の MVP で命中と距離判定を行う実用的な方法だと知っている。

## 学べること

- yaw、前方ベクトル、入力軸で一人称移動を作る方法。
- `wait()` に頼らず、明示的タイマーでリロードを書く方法。
- ランタイム生成オブジェクトで複雑なターゲットを組み立てる方法。
- tag 距離で MVP の命中判定を作る方法。
- 複数のタイマーでターゲット生成、カウントダウン、圧力ペナルティを動かす方法。
- HUD、効果音、状態テキストをゲームプレイループに接続する方法。

## 完成ゲームプレイ

操作:

| 入力 | 行動 |
| --- | --- |
| WASD | 移動 |
| Shift | スプリント |
| マウス移動 | 照準 |
| Fire | 射撃 |
| Interact | リロード |
| Esc / Q | メニューまたは終了。ランタイムホストによる |

勝敗条件:

- カウントダウン終了前に指定数のターゲットを処理する。
- 未処理ターゲットが多すぎると `integrity` が下がる。
- 時間切れまたは integrity が 0 になると失敗。

## プロジェクト構造

```txt
fps_arena/
├── Varg.toml
├── scenes/
│   └── fps_arena.vscene
└── scripts/
    ├── fps_player.varg
    ├── fps_camera.varg
    ├── target_drift.varg
    ├── drone_part_drift.varg
    └── despawn_far.varg
```

`fps_player.varg` は主スクリプトです。他のスクリプトはカメラ追従、ターゲット浮遊、ランタイムオブジェクトのクリーンアップを提供します。

## 第 1 歩：シーンを訓練場として扱う

シーンファイルは静的内容を担当します。地面、壁、ライト、プレイヤー、カメラです。プレイヤーオブジェクトは `Player` tag を使い、スクリプトはこの tag でカメラ追従とクリーンアップ距離を処理します。

プレイヤースクリプトの取り付け断片:

```swift
script FpsPlayer {
    source: "scripts/fps_player.varg"
    moveSpeed: 4.8
    sprintMultiplier: 1.55
    arenaLimitX: 8.5
    arenaLimitZ: 10.5
    fireRate: 0.16
    reloadTime: 1.15
    magazineSize: 24
    hitRadius: 2.35
    spawnAhead: 8.5
    giIntensity: 1.2
}
```

このパラメータ群は、固定値の demo だけではないことを示します。移動速度、フィールド境界、射撃半径、弾倉サイズ、リロード時間、GI 強度は、すべてレベル調整点になります。先にこれらのつまみを出しておくと、後で難度を調整しやすくなります。

## 第 2 歩：スクリプト状態を整理する

`FpsPlayer` の変数はシステムごとに分けられます。

| グループ | 変数例 | 用途 |
| --- | --- | --- |
| 視点と移動 | `yaw`、`moveSpeed`、`arenaLimitX` | プレイヤー制御 |
| 武器 | `ammo`、`reserve`、`canFire`、`reloading`、`reloadTimer` | 射撃とリロード |
| ターゲット生成 | `targetTimer`、`targetIndex`、`spawnAhead`、`activeTargets` | スポーン制御 |
| スコア | `score`、`streak`、`shots`、`hits`、`cleared` | プレイヤー成績のフィードバック |
| 圧力 | `roundTimer`、`integrity`、`pressureTimer`、`wave` | 勝敗リズム |
| フィードバック | `status`、`musicStarted`、`renderReady` | HUD、音声、レンダリング |

この表を見てからコードを見ると、「武器状態」「スポーン状態」「勝敗状態」を分けやすくなります。数十個の変数は怖くありません。怖いのは、それらが全部同じ層に見えることです。

## 第 3 歩：一人称移動

FPS 移動の核心は、yaw を前方と右方向へ変換し、入力軸で合成することです。

```swift
yaw += Input.mouseDeltaX() * 0.08
yaw += Input.value("LookX") * 86.0 * dt

let yawRad: Float = yaw * 0.01745329
let forwardX: Float = 0.0 - sin(yawRad)
let forwardZ: Float = cos(yawRad)
let rightX: Float = cos(yawRad)
let rightZ: Float = sin(yawRad)

var speed: Float = moveSpeed
if Input.down("Sprint") {
    speed = moveSpeed * sprintMultiplier
}

let moveX: Float = Input.value("MoveX")
let moveZ: Float = Input.value("MoveY")
let deltaX: Float = rightX * moveX + forwardX * moveZ
let deltaZ: Float = rightZ * moveX + forwardZ * moveZ

position.x += deltaX * speed * dt
position.z += deltaZ * speed * dt
position.x = clamp(position.x, -arenaLimitX, arenaLimitX)
position.z = clamp(position.z, -arenaLimitZ, arenaLimitZ)
rotation = Vec3(0.0, yaw, 0.0)
```

このコードは行ごとに説明する価値があります。

- マウスとゲームパッド look がともに `yaw` を変えます。
- `sin/cos` が角度を方向ベクトルに変えます。
- `MoveX` は右方向、`MoveY` は前方向に対応します。
- `dt` が移動をフレームレート非依存にします。
- `clamp` がプレイヤーを訓練場内に留めます。

## 第 4 歩：フィードバックシステムを一度だけ初期化する

レンダリングと音楽は毎フレーム再初期化しません。真偽状態で守ります。

```swift
if !renderReady {
    render.gi.useScreenSpace()
    render.gi.useProbeVolume(Vec3(0.0, 2.5, 0.0), Vec3(18.0, 8.0, 22.0), Vec3(4.0, 3.0, 4.0), giIntensity)
    render.gi.setIntensity(giIntensity)
    renderReady = true
}

if !musicStarted {
    Audio.startLoop("fps_arena_pulse", "saw", "C3 R G3 R Bb3 R G3 R", 128.0, 0.42, 0.08)
    musicStarted = true
}
```

このパターンは多くのシステムに移せます。最初の実行で環境を設定し、毎フレームは本当に変わる値だけを更新します。状態が何度もリセットされることも避けられるため、レンダリングや音声が壊れていると誤解しにくくなります。

## 第 5 歩：武器とリロード

射撃ではまず弾薬を確認します。

```swift
func fireWeapon() {
    if ammo <= 0 {
        status = "Empty - reload"
        Audio.playTone("square", 110.0, 0.05, 0.18)
        return
    }

    ammo -= 1
    shots += 1
    canFire = false
    Audio.playTone3D("sine", 760.0 + streak * 12.0, 0.04, 0.22)
}
```

リロードは明示的タイマーを使います。

```swift
if Input.pressed("Interact") && !reloading && ammo < magazineSize && reserve > 0 {
    reloading = true
    canFire = false
    reloadTimer = reloadTime
    Audio.playTone("square", 220.0, 0.08, 0.14)
}

if reloading {
    reloadTimer -= dt
    status = "Reloading"

    if reloadTimer <= 0.0 {
        let needed: Int = magazineSize - ammo
        if reserve >= needed {
            ammo = magazineSize
            reserve -= needed
        } else {
            ammo += reserve
            reserve = 0
        }

        reloading = false
        canFire = true
        status = "Ready"
    }
}
```

ここでは `wait(reloadTime)` を使いません。リロード中も HUD、ターゲット圧力、カウントダウン、移動は動き続ける必要があります。明示的タイマーなら「リロード中」を普通の状態として他のロジックに見せられます。

## 第 6 歩：ドローンターゲットを生成する

ターゲットは 1 つのモデルアセットではなく、ランタイムで生成される単純なジオメトリの組み合わせです。

```swift
scene.spawnSphere("Training Drone Core", "Target", Vec3(x, y, targetZ), 0.42, "scripts/target_drift.varg")
scene.spawnBox("Training Drone Top Plate", "DronePart", Vec3(x, y + 0.47, targetZ), Vec3(0.92, 0.12, 0.34), "scripts/drone_part_drift.varg")
scene.spawnBox("Training Drone Bottom Plate", "DronePart", Vec3(x, y - 0.47, targetZ), Vec3(0.72, 0.1, 0.28), "scripts/drone_part_drift.varg")
scene.spawnBox("Training Drone Left Wing", "DronePart", Vec3(x - 0.58, y, targetZ), Vec3(0.16, 0.34, 0.76), "scripts/drone_part_drift.varg")
scene.spawnBox("Training Drone Right Wing", "DronePart", Vec3(x + 0.58, y, targetZ), Vec3(0.16, 0.34, 0.76), "scripts/drone_part_drift.varg")
```

この方法はチュートリアルに向いています。

- 外部モデルアセットが不要です。
- 各部品に浮遊スクリプトを付けられます。
- 中心球は `Target` tag、装飾部品は `DronePart` tag を使います。
- 命中時に中心と部品を別々に破棄できます。

ターゲット位置は `targetIndex` で決定的に変化させます。

```swift
let lane: Float = targetIndex - floor(targetIndex / 5.0) * 5.0
let x: Float = -5.6 + lane * 2.8
let z: Float = -1.0 + sin(targetIndex * 1.1) * 5.4
let y: Float = 1.35 + abs(sin(targetIndex * 0.7)) * 1.45
let targetZ: Float = z + spawnAhead
```

これは純粋なランダムより学習とデバッグに向いています。毎回の実行で似たリズムを再現できるからです。

## 第 7 歩：MVP 命中判定

現在のサンプルはレイキャスト銃を使わず、最近の `Target` までの距離で命中を近似します。

```swift
let targetDistance: Float = scene.distanceToTag("Target")

if targetDistance <= hitRadius {
    hits += 1
    streak += 1
    cleared += 1
    activeTargets -= 1
    score += 100 + streak * 15
    roundTimer += 0.55
    status = "Target down +" + streak

    scene.destroyNearestWithTag("Target", hitRadius)
    scene.destroyNearestWithTag("DronePart", hitRadius + 1.4)
    scene.destroyNearestWithTag("DronePart", hitRadius + 1.4)
    scene.destroyNearestWithTag("DronePart", hitRadius + 1.4)
} else {
    streak = 0
    roundTimer -= 0.65
    status = "Miss - time lost"
}
```

このコードは自分が MVP であることを認めています。最終的なレイキャスト銃ではありませんが、弾薬、得点、コンボ、ターゲット生成、フィードバックのリズムを検証するには十分です。まずゲームループを動かし、その後で命中モデルを精密にします。

`destroyNearestWithTag("DronePart", ...)` を連続で呼ぶのは、現在の API が 1 回につき最近の 1 オブジェクトを破棄するためです。数回繰り返すことで、ターゲット周囲の部品群をクリーンアップできます。

## 第 8 歩：複数タイマーで圧力を作る

射撃場は単一の線形状態機械ではなく、いくつかの並行タイマーです。

```swift
roundTimer -= dt
pressureTimer -= dt
targetTimer -= dt
```

ターゲット生成:

```swift
if targetTimer <= 0.0 && !gameOver {
    spawnTarget()
    let spawnDelay: Float = 1.35 - wave * 0.08
    targetTimer = clamp(spawnDelay, 0.45, 1.35)
}
```

圧力ペナルティ:

```swift
if pressureTimer <= 0.0 && activeTargets > 0 {
    integrity -= 1
    activeTargets -= 1
    streak = 0
    status = "Breach warning"
    Audio.playTone("square", 130.0, 0.08, 0.22)
    pressureTimer = clamp(4.6 - wave * 0.28, 1.6, 4.6)
}
```

勝敗条件:

```swift
if roundTimer <= 0.0 {
    gameOver = true
    status = "LOCKDOWN - score " + score
}

if cleared >= clearGoal {
    gameOver = true
    score += integrity * 250
    status = "SIM CLEARED - score " + score
}
```

この構造の利点は境界が明確なことです。各タイマーが 1 種類の圧力を担当し、組み合わせることでゲームリズムになります。デバッグ時も、ターゲット生成が速すぎるのか、ペナルティが重すぎるのかを特定しやすいです。

## 第 9 歩：HUD を描く

HUD を関数に分けると、主ループがかなり読みやすくなります。

```swift
func drawHud() {
    ui.rect("fps_hud_panel", 12.0, 12.0, 382.0, 184.0, 0.02, 0.025, 0.03, 0.86)
    ui.rect("fps_hud_accent", 12.0, 12.0, 4.0, 184.0, 0.95, 0.18, 0.12, 1.0)
    ui.label("fps_title", "FPS Arena", 24.0, 22.0)
    ui.label("fps_score", "Score: " + score, 24.0, 44.0)
    ui.label("fps_timer", "Time: " + roundTimer, 154.0, 44.0)
    ui.label("fps_ammo", "Ammo: " + ammo + " / " + reserve, 24.0, 66.0)
    ui.label("fps_integrity", "Integrity: " + integrity, 154.0, 66.0)
    ui.label("fps_goal", "Cleared: " + cleared + " / " + clearGoal, 24.0, 88.0)
    ui.label("fps_status", status, 24.0, 134.0)
    ui.label("fps_crosshair", "+", 392.0, 292.0)
}
```

HUD は 4 つの質問に答えるべきです。

- 今の目標は何か。
- あと何発撃てるか。
- どれくらいうまくできているか。
- なぜ失敗または成功したか。

HUD がこの 4 つに答えられれば、プレイヤーはゲームプレイを理解できます。

## よくある問題

| 問題 | 可能な原因 | 修正 |
| --- | --- | --- |
| 射撃が命中しない | `hitRadius` が小さすぎる、またはターゲット tag が `Target` ではない | 生成コードとスクリプトパラメータを確認 |
| ターゲットが増え続ける | `pressureTimer` が遅すぎる、または命中時に `activeTargets` を減らしていない | 命中分岐を確認 |
| リロード後の弾薬がおかしい | `needed` または `reserve` の計算ミス | 小さい弾倉で先にテスト |
| プレイヤーが場外へ出る | `clamp(position.x/z, ...)` を忘れている | 移動コードの最後数行を確認 |
| HUD の値が更新されない | `drawHud()` を毎フレーム呼んでいない | `update()` の末尾で呼ぶ |

## 練習

1. `BonusTarget` を追加し、命中後に時間を追加する。
2. コンボに応じて `hitRadius` を小さくし、高得点の難度を上げる。
3. ターゲットにタイムアウトクリーンアップスクリプトを加え、時間内に命中しなければ減点する。
4. `ui.slider` でデバッグパネルを作り、実行中に `spawnDelay` を調整する。
5. `spawnTarget()` を通常ターゲット、高速ターゲット、高得点ターゲットの 3 関数に分ける。
