---
title: スクリプト基礎
description: Varg スクリプトのファイル役割、script 宣言、基本構造を学びます。
---

`.varg` は Varg のランタイムロジックファイルです。最初は「ゲームオブジェクトに取り付ける一連のルール」だと考えてください。いつ始まり、毎フレーム何をし、プレイヤー入力にどう反応するかを書きます。

ほかのプログラミング言語を学んだことがない場合は、先に [ゼロからのスクリプト入門](/ja/scripting/programming-primer/) を読むことをおすすめします。そのページでは、変数、関数、条件、ループをゆっくり説明します。

構文は Swift に近いですが、Swift ではありません。ゲームスクリプト、モジュール、宣言的 behavior のための言語です。最初は `script` だけを見れば十分です。他の宣言は後で構いません。

## トップレベル宣言

`.varg` では 3 種類のトップレベル宣言を使えます。

| 宣言 | 用途 | 現在の推奨 |
| --- | --- | --- |
| `script` | エンティティに取り付けるランタイムロジック | 主に使用 |
| `module` | 他の `.varg` から導入される再利用コード | 目標 API。慎重に使用 |
| `behavior` | 宣言的なビヘイビアツリーまたは状態機械 | 目標 API。設計中 |

現在のチュートリアルでは `script` を中心に使います。

:::tip[まず 3 つを押さえる]
入門スクリプトに必要なのは通常 3 つだけです。`@export var` はエディターで調整するパラメータ、普通の `var` はランタイム状態、`start()` / `update(_ dt: Float)` は実際のロジックです。後の API はすべて、この 3 つの中に入っていきます。
:::

## 最小スクリプト

```swift
script HelloVarg {
    func start() {
        log("Hello Varg")
    }
}
```

説明:

- `script HelloVarg` は、エンティティに取り付けられるスクリプトを定義します。
- `func start()` はライフサイクル関数で、スクリプト開始時に呼ばれます。
- `log("...")` はリテラルログを出力します。現在の MVP はリテラル文字列ログに対応しています。

## もう少し完全な構造

```swift
script PlayerController {
    @export var speed: Float = 6.0
    var jumpsLeft: Int = 1

    func start() {
        log("player ready")
    }

    func update(_ dt: Float) {
        let moveX: Float = Input.value("MoveX")
        entity.translate(Vec3(moveX * speed * dt, 0, 0))
    }
}
```

スクリプトは 3 種類の内容で構成されます。

- エクスポートパラメータ: `@export var speed`。エディターやレベル側の調整に使います。
- 永続状態: `var jumpsLeft`。スクリプト実行中に保持されます。
- ライフサイクル関数: `start()`、`update(_ dt: Float)` など。実際のロジックを置きます。

## 現在実行できる MVP の境界

以下は現在安心して使える能力です。多く見えますが、暗記する必要はありません。分類だけ覚えておき、スクリプトを書く時に名前を確認すれば十分です。

基本構文:

- `let`、`var`、`@export var`
- `start`、`update`、`fixedUpdate`
- `if`、`else`、`for`、`while`
- `return`、`break`、`continue`
- `wait(expression)`
- `log("literal message")`

入力と移動:

- `Input.down`、`Input.pressed`、`Input.released`、`Input.value`
- `Input.mouseDeltaX`、`Input.mouseDeltaY`、`Input.captureMouse`
- `position` と `entity.translate(Vec3(...))`

シーン検索と生成:

- `scene.spawnBox`、`scene.spawnSphere`、`scene.destroyNearestWithTag`
- `scene.distanceToTag`、`scene.distanceToTagBounds`、`scene.horizontalDistanceToTagBounds`
- `scene.xOf`、`scene.yOf`、`scene.zOf`、`playerDistance()`

フィードバックシステム:

- `Audio.playTone`、`Audio.playTone3D`、`Audio.startLoop`、`Audio.stopLoop`
- `ui.label`、`ui.rect`、`ui.button`、`ui.toggle`、`ui.slider`、`ui.dragX`、`ui.dragY`、`ui.input`
- `render.gi.useScreenSpace`、`render.gi.useProbeVolume`、`render.gi.setIntensity`

目標 API を、まだ完成したランタイム能力として扱わないでください。これには汎用 `scene.spawn(...)`、イベント `emit(...)`、アセット式 `Audio.play(...)`、配列、辞書、オプショナルバインディング、モジュール呼び出しが含まれます。これらは言語の方向性であり、実行環境へ接続されるまでは診断または実装更新を待つべきです。
