---
title: 中級演習：遊べる収集ループを作る
description: 完全プロジェクトに入る前に、小さなスクリプトで移動、計時、取得、得点、HUD を練習します。
---

この章は「構文学習」と「完全プロジェクトチュートリアル」の中間にあります。目標は小さく、移動でき、収集でき、得点でき、カウントダウンする小さなゲームプレイを作ることです。

完全なゲームアーキテクチャを先に理解する必要はありません。まず次のループを作ります。

1. プレイヤーが方向キーまたは WASD で移動する。
2. シーン内に `Collectible` が 1 つある。
3. プレイヤーが近づくと得点する。
4. HUD がスコア、カウントダウン、状態を表示する。
5. 時間切れになると得点を止める。

## 始める前に知っておくこと

- [プログラミング未経験者のためのスクリプト入門](/ja/scripting/programming-primer/) を読んでいる。
- `update(_ dt: Float)` が毎フレーム実行されることを知っている。
- `position.x`、`position.z` でオブジェクト位置を変えられることを知っている。
- tag がスクリプトからオブジェクトを探すための名前だと知っている。

## まず最小シーンを準備する

この演習に必要なオブジェクトは 2 つだけです。

| オブジェクト | 必要なもの | 理由 |
| --- | --- | --- |
| プレイヤー | `CollectPlayer` スクリプトを付ける | 入力、計時、得点をプレイヤースクリプトに書く |
| 収集物 | tag を `Collectible` にする | スクリプトがこの tag で最近の収集物を探す |

プレイヤーは箱またはカプセルでよく、収集物は最初は小さな球で構いません。重要なのはモデルの見た目ではなく、「近づく -> 得点 -> 削除」というチェーンを動かすことです。

`.vscene` を手書きする場合、構造はおおよそ次のようになります。

```swift
entity "Player" {
    tag: "Player"
    position: Vec3(0.0, 0.6, 0.0)

    script CollectPlayer {
        source: "scripts/collect_player.varg"
        speed: 5.0
        roundTime: 30.0
        pickupRadius: 1.4
    }
}

entity "Crystal" {
    tag: "Collectible"
    position: Vec3(2.0, 0.8, 0.0)
}
```

ここで最も間違えやすいのは `Collectible` です。シーン内の tag とスクリプト内の文字列は完全に同じでなければなりません。大文字小文字も同じです。スクリプトが `scene.distanceToTag("Collectible")` と尋ねるなら、シーン側は `collectible` や `Collectable` ではいけません。

## 第 1 歩：まずプレイヤーだけを動かす

最初から得点、収集、UI を作らないでください。第 1 歩ではプレイヤーが動くことだけを確認します。

```swift
script CollectPlayer {
    @export var speed: Float = 5.0

    func update(_ dt: Float) {
        let moveX: Float = Input.value("MoveX")
        let moveZ: Float = Input.value("MoveY")

        position.x += moveX * speed * dt
        position.z += moveZ * speed * dt
    }
}
```

このコードは一文ずつ読めます。

- `speed` は移動速度です。
- `moveX` は左右入力です。
- `moveZ` は前後入力です。
- `* dt` により、移動速度がフレームレートに依存しにくくなります。

ここまでで一度実行します。プレイヤーが動くなら次へ進みます。

プレイヤーがまったく動かない場合、まず 3 つ確認します。

| 現象 | よくある原因 |
| --- | --- |
| キーに反応しない | スクリプトがプレイヤーオブジェクトに付いていない |
| 左右は動くが前後は動かない | 入力マッピングに `MoveY` がない、または想定したキーではない |
| 移動が速すぎる/遅すぎる | `speed` が合っていない。まず `3.0` から `6.0` の間にする |

先に移動を気持ちよく調整してから、次のルールを足してください。そうしないと後の得点、生成、HUD が移動問題に巻き込まれます。

## 第 2 歩：カウントダウンを加える

次にゲームプレイへ時間制限を加えます。

```swift
script CollectPlayer {
    @export var speed: Float = 5.0
    @export var roundTime: Float = 30.0

    var timeLeft: Float = 30.0
    var gameOver: Bool = false

    func start() {
        timeLeft = roundTime
    }

    func update(_ dt: Float) {
        if !gameOver {
            timeLeft -= dt

            if timeLeft <= 0.0 {
                timeLeft = 0.0
                gameOver = true
            }
        }

        if !gameOver {
            let moveX: Float = Input.value("MoveX")
            let moveZ: Float = Input.value("MoveY")

            position.x += moveX * speed * dt
            position.z += moveZ * speed * dt
        }
    }
}
```

ここには 2 つの新しい状態があります。

| 変数 | 意味 |
| --- | --- |
| `timeLeft` | 残り秒数 |
| `gameOver` | ゲームが終わったか |

`if !gameOver` は、ゲームがまだ終わっていない時だけカウントダウンと移動を続ける、という意味です。

`timeLeft` と `roundTime` は重複ではありません。

- `roundTime` は調整用の初期時間で、シーンから変更できます。
- `timeLeft` は実行時の残り時間で、毎フレーム減ります。

初心者はよく `roundTime -= dt` と直接書きます。それでも動きますが、「既定時間」と「現在残り時間」が同じ値に混ざるため、デバッグしづらくなります。

## 第 3 歩：収集物に近づいたら得点する

シーン内の収集物には `Collectible` tag が必要です。スクリプトは距離でプレイヤーが近いか判定します。

```swift
@export var pickupRadius: Float = 1.4

var score: Int = 0
var status: String = "Collect the crystal"
```

次を `update()` 内、移動ロジックの後に置きます。

```swift
if !gameOver {
    let distance: Float = scene.distanceToTag("Collectible")

    if distance <= pickupRadius {
        score += 1
        status = "Collected +" + score
        scene.destroyNearestWithTag("Collectible", pickupRadius)
        Audio.playTone("triangle", 720.0, 0.08, 0.25)
    }
}
```

このコードは 4 つのことをします。

1. 一番近い `Collectible` を探す。
2. 距離が十分近いならスコアを 1 増やす。
3. 一番近い収集物を削除する。
4. 短い効果音を鳴らす。

まだ収集物を再生成しないので、拾えるのは 1 回だけです。それで問題ありません。まず 1 つのアクションを動かします。

この部分で最も重要なのは順序です。

1. まず距離を計算する。
2. 距離が十分近い時だけ加点する。
3. 加点後に拾われたオブジェクトを削除する。
4. 最後にフィードバック音を鳴らす。

先にオブジェクトを削除してから位置や状態を読むと、ロジックが乱れやすくなります。入門段階では、判断、スコア変更、シーン変更、フィードバックの順序を守るとよいです。

## 第 4 歩：新しい収集物を生成する

拾った後、前方に新しい球を生成できます。

まずカウンタを追加します。

```swift
var spawnIndex: Int = 0
```

取得成功後に追加します。

```swift
let nextX: Float = -4.0 + spawnIndex * 1.7
let nextZ: Float = sin(spawnIndex * 1.3) * 3.0

scene.spawnSphere(
    "Collectible",
    "Collectible",
    Vec3(nextX, 0.8, nextZ),
    0.35,
    ""
)

spawnIndex += 1
```

ここでは乱数ではなく、`spawnIndex` と `sin()` で変化を作っています。毎回の実行リズムが近くなり、デバッグしやすいからです。

`scene.spawnSphere(...)` の引数はこう読めます。

| 引数 | この値 | 役割 |
| --- | --- | --- |
| オブジェクト名 | `"Collectible"` | エディターまたはデバッグで見える名前 |
| tag | `"Collectible"` | 後で `distanceToTag` から見つける |
| 位置 | `Vec3(nextX, 0.8, nextZ)` | 新しい収集物の生成場所 |
| 半径 | `0.35` | 球の大きさ |
| スクリプト | `""` | ここでは追加スクリプトを付けない |

2 番目の引数も `Collectible` にしてください。そうしないと、新しい球は見えるのにスクリプトが次回見つけられず、もう拾えなくなります。

## 第 5 歩：HUD を接続する

最後に、プレイヤーが必要な情報を表示します。

```swift
ui.rect("collect_panel", 12.0, 12.0, 300.0, 126.0, 0.03, 0.04, 0.06, 0.86)
ui.label("collect_score", "Score: " + score, 24.0, 42.0)
ui.label("collect_time", "Time: " + floor(timeLeft), 24.0, 70.0)
ui.label("collect_status", status, 24.0, 98.0)
```

時間切れなら、表示を変えられます。

```swift
if gameOver {
    status = "Time up"
}
```

HUD を最後に接続するのは、重要でないからではありません。前の状態に依存するからです。まず `score`、`timeLeft`、`status` があり、その後に表示する方が読みやすいです。

ここでの座標はスクリーン座標であり、ワールド座標ではありません。`ui.label("collect_score", ..., 24.0, 42.0)` は、画面左上付近に文字を描くという意味です。プレイヤーや収集物には追従しません。

## 完全スクリプト

上の部分をまとめると、この版になります。

```swift
script CollectPlayer {
    @export var speed: Float = 5.0
    @export var roundTime: Float = 30.0
    @export var pickupRadius: Float = 1.4

    var timeLeft: Float = 30.0
    var gameOver: Bool = false
    var score: Int = 0
    var status: String = "Collect the crystal"
    var spawnIndex: Int = 0

    func start() {
        timeLeft = roundTime
    }

    func update(_ dt: Float) {
        if !gameOver {
            timeLeft -= dt

            if timeLeft <= 0.0 {
                timeLeft = 0.0
                gameOver = true
                status = "Time up"
            }
        }

        if !gameOver {
            let moveX: Float = Input.value("MoveX")
            let moveZ: Float = Input.value("MoveY")

            position.x += moveX * speed * dt
            position.z += moveZ * speed * dt

            let distance: Float = scene.distanceToTag("Collectible")

            if distance <= pickupRadius {
                score += 1
                status = "Collected +" + score
                scene.destroyNearestWithTag("Collectible", pickupRadius)
                Audio.playTone("triangle", 720.0, 0.08, 0.25)

                let nextX: Float = -4.0 + spawnIndex * 1.7
                let nextZ: Float = sin(spawnIndex * 1.3) * 3.0

                scene.spawnSphere(
                    "Collectible",
                    "Collectible",
                    Vec3(nextX, 0.8, nextZ),
                    0.35,
                    ""
                )

                spawnIndex += 1
            }
        }

        ui.rect("collect_panel", 12.0, 12.0, 300.0, 126.0, 0.03, 0.04, 0.06, 0.86)
        ui.label("collect_score", "Score: " + score, 24.0, 42.0)
        ui.label("collect_time", "Time: " + floor(timeLeft), 24.0, 70.0)
        ui.label("collect_status", status, 24.0, 98.0)
    }
}
```

## ここで練習したこと

| 能力 | 使った場所 |
| --- | --- |
| 毎フレーム更新 | 移動、カウントダウン、HUD |
| 永続状態 | `score`、`timeLeft`、`gameOver` |
| 入力 | `Input.value("MoveX")`、`Input.value("MoveY")` |
| 条件判断 | 時間切れ、収集物に近いか |
| シーン検索 | `scene.distanceToTag("Collectible")` |
| 動的生成 | `scene.spawnSphere(...)` |
| フィードバック | `ui.label`、`ui.rect`、`Audio.playTone` |

これは完全プロジェクトの縮小版です。Jump Jump と FPS Arena は、同じ考え方をより多くの状態、オブジェクト、フィードバックへ拡張したものです。

## よくある問題

| 問題 | まず確認すること |
| --- | --- |
| 収集物に近づいても得点しない | シーン内の tag が正確に `Collectible` か |
| 最初を拾った後に次が出ない | `spawnIndex += 1` が取得成功の `if` 内にあるか |
| スコアが連続で増え続ける | 取得後に `scene.destroyNearestWithTag(...)` を呼んでいるか |
| 時間切れ後も移動できる | 移動コードを `if !gameOver` で包んでいるか |
| HUD の数字が変わらない | `ui.label` が `update()` 内にあり、`start()` だけにないか |

デバッグ時に一度に多くを変えないでください。まず移動を正常にし、次に 1 回の取得を正常にし、その後に再生成を足し、最後に HUD を接続します。各ステップで遊べる状態なら、次の問題も判断しやすくなります。
