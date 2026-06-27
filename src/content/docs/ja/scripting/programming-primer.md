---
title: プログラミング未経験者のためのスクリプト入門
description: Varg 構文を学ぶ前に、変数、関数、条件、ループ、毎フレーム更新を理解します。
---

これまでコードを書いたことがないなら、このページが緩衝材になります。構文の細部を急いで覚える必要はありません。まず「スクリプトは、代わりに記録し、判断し、繰り返し作業するもの」だと理解してください。

ゲームスクリプトは文章を書くというより、ルールカードを書く感覚に近いです。

- 速度、スコア、弾薬などの数値を覚えておく。
- プレイヤーがキーを押した時、ルールに従ってそれらの数値を変える。
- 毎フレーム確認し、キャラクターを動かすか、UI を更新するか、ゲームが失敗したかを判断する。

## 変数: ものに名前を付ける

変数は「名前付きの箱」です。箱には数字、文字、真偽値を入れられます。

```swift
var score: Int = 0
var speed: Float = 6.0
var gameOver: Bool = false
var status: String = "Ready"
```

読み方:

| 書き方 | 人間向けの説明 |
| --- | --- |
| `score` | この箱の名前はスコア |
| `Int` | 中には整数を入れる |
| `0` | 初期値は 0 |
| `Bool` | 中には true または false だけを入れる |
| `String` | 中には文字を入れる |

スクリプトでは変数をよく変更します。

```swift
score += 1
gameOver = true
status = "You win"
```

意味は、スコアを 1 増やす、ゲーム終了を真にする、状態文字列を “You win” に変える、です。

## `let` と `var` の違い

`var` は後で変わる箱です。`let` は、その小さな範囲で一時的に計算し、再変更しない値です。

```swift
var ammo: Int = 30
ammo -= 1

let moveX: Float = Input.value("MoveX")
```

経験則:

- フレームをまたいで覚える必要があるものは、スクリプトスコープの `var` にします。
- そのフレーム内で一時的に計算するだけのものは、関数内の `let` にします。

## 関数: 実行されるルールのまとまり

関数は、名前の付いたルールのまとまりです。Varg で最もよく見るのは `start()` と `update(_ dt: Float)` です。

```swift
func start() {
    log("game start")
}

func update(_ dt: Float) {
    score += 1
}
```

理解のしかた:

- `start()`: スクリプトが動き始めた時に 1 回だけ行う。
- `update(_ dt: Float)`: 毎フレーム行う。

ほとんどの入門スクリプトはこの形です。

```swift
script MyScript {
    var score: Int = 0

    func start() {
        log("ready")
    }

    func update(_ dt: Float) {
        score += 1
    }
}
```

## `dt`: このフレームでどれだけ時間が進んだか

ゲームは 1 秒に 1 回だけ更新されるのではなく、1 秒に何度も更新されます。`dt` は「今回の更新から前回の更新までにどれだけ時間が経ったか」を表します。

移動には `dt` を掛けます。

```swift
position.x += speed * dt
```

これは、速度が「1 秒あたりどれだけ動くか」で、`dt` がそれを「このフレームでどれだけ動くか」に変換する、という意味です。速い機械でも遅い機械でも、キャラクター速度が安定します。

## 条件: もしこうなら、これをする

`if` は判断を表します。

```swift
if Input.pressed("Fire") {
    ammo -= 1
}
```

この文はそのまま「このフレームで Fire が押されたなら、弾薬を 1 減らす」と読めます。

条件はより具体的にもできます。

```swift
if Input.pressed("Fire") && ammo > 0 {
    ammo -= 1
}
```

`&&` は「かつ」を意味します。この文は「Fire が押され、かつ弾薬が 0 より多い時だけ発射する」です。

よくある判断:

| 書き方 | 意味 |
| --- | --- |
| `ammo > 0` | 弾薬が 0 より多い |
| `timer <= 0.0` | タイマーが 0 になった |
| `!gameOver` | ゲームはまだ終わっていない |
| `canFire && ammo > 0` | 発射でき、かつ弾薬がある |

## ループ: 同じことを繰り返す

ループは作業を繰り返すために使います。入門では 2 種類をまず知れば十分です。

`for` は回数が明確な繰り返しに向いています。

```swift
for i in count(3) {
    log("spawn one")
}
```

`while` は「条件を満たす間だけ続ける」時に向いています。

```swift
while timer > 0.0 {
    timer -= dt
}
```

`while` を書く時は特に注意してください。ループ内で条件が変わる機会が必要です。そうしないとスクリプトがそこで止まり続けます。

## スクリプトスコープと関数内部

`script` の中、関数の外に書いた変数は、スクリプトと一緒に存在し続けます。

```swift
script Counter {
    var score: Int = 0

    func update(_ dt: Float) {
        score += 1
    }
}
```

`score` は毎フレーム、前回の値を保持します。

`update()` の中に書いた変数は、毎フレーム作り直されます。

```swift
func update(_ dt: Float) {
    var score: Int = 0
    score += 1
}
```

このコードは毎フレーム `score` を 0 に戻すため、合計スコアの記録には使えません。

## まず覚える小さな地図

今後 Varg スクリプトを見る時は、まずこう分解してください。

```swift
script Player {
    @export var speed: Float = 6.0
    var score: Int = 0

    func start() {
        log("ready")
    }

    func update(_ dt: Float) {
        let moveX: Float = Input.value("MoveX")
        position.x += moveX * speed * dt
    }
}
```

部分ごとの役割:

| 領域 | 何を担当するか |
| --- | --- |
| `script Player` | Player という名前のスクリプトルールカード |
| `@export var speed` | エディターまたはシーンで調整できるパラメータ |
| `var score` | ゲーム実行中に覚える状態 |
| `start()` | 開始時に 1 回だけ行う |
| `update()` | 毎フレーム行う |
| `Input.value` | 入力を読む |
| `position.x += ...` | キャラクター位置を変える |

この地図が分かれば、[スクリプト基礎](/ja/scripting/basics/) はずっと読みやすくなります。
