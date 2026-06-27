---
title: ライフサイクルと入力
description: start、update、fixedUpdate、Input API を身につけます。
---

## ライフサイクル関数

ライフサイクル関数は、エンジン側から呼びに来る入口です。自分で呼ぶ必要はありません。スクリプトをエンティティに取り付けると、ランタイムが適切なタイミングで呼びます。

Varg スクリプトは予約名でエンジンイベントを受け取ります。

```swift
func start()
func update(_ dt: Float)
func fixedUpdate(_ dt: Float)
func collisionEnter(_ other: Entity)
func collisionExit(_ other: Entity)
func event(_ name: String, _ data: EventData)
```

現在の MVP で最もよく使うもの:

| 関数 | いつ呼ばれるか | よくある用途 |
| --- | --- | --- |
| `start()` | スクリプト開始時 | 状態初期化、起動ログ |
| `update(_ dt: Float)` | 毎フレーム | 入力、移動、計時、アニメーション |
| `fixedUpdate(_ dt: Float)` | 固定ステップ | 物理関連ロジック、一括検出 |

入門時は `start()` と `update(_ dt: Float)` を優先して覚えてください。`collisionEnter` や `event` は、将来使う入口として名前だけ知っておけば十分です。

## `dt` とは

`dt` は、今回の更新から前回の更新までの時間です。通常は秒単位として考えます。移動時に `dt` を掛けると、速度がフレームレートに依存しにくくなります。

```swift
script Mover {
    @export var speed: Float = 3.0

    func update(_ dt: Float) {
        entity.translate(Vec3(speed * dt, 0, 0))
    }
}
```

## 入力 API

入力 API の名前は多いですが、問うていることは素朴です。このフレームで押されているか、今押されたか、今離されたか、ある軸の値はいくつか、です。

明確な入力名を使うことをおすすめします。

```swift
Input.down("Jump")        // このフレームで押されている
Input.pressed("Jump")     // このフレームで押された
Input.released("Jump")    // このフレームで離された
Input.value("MoveX")      // 軸入力。移動によく使う
Input.mouseDeltaX()       // このフレームのマウス水平移動
Input.mouseDeltaY()       // このフレームのマウス垂直移動
Input.captureMouse(true)  // マウスを捕獲する。一人称視点でよく使う
```

## 入力例: 移動とジャンプ

```swift
script SimplePlayer {
    @export var speed: Float = 6.0
    @export var jumpForce: Float = 8.0

    var jumpsLeft: Int = 1

    func update(_ dt: Float) {
        let moveX: Float = Input.value("MoveX")
        let moveY: Float = Input.value("MoveY")

        entity.translate(Vec3(moveX * speed * dt, 0, moveY * speed * dt))

        if Input.pressed("Jump") && jumpsLeft > 0 {
            position.y += jumpForce * dt
            jumpsLeft -= 1
        }
    }
}
```

ここではジャンプを `position.y += ...` として書いています。現在の MVP が `position` 代入と成分変更に明確に対応しているためです。より完全な物理速度 API は目標方向であり、接続前はランタイム実装を基準にしてください。

## 一人称マウス入力

完全な例は [jump_jump/scripts/first_person_camera.varg](https://github.com/viloris-org/Varg/tree/main/examples/project/jump_jump/scripts/first_person_camera.varg) と [fps_arena/scripts/fps_camera.varg](https://github.com/viloris-org/Varg/tree/main/examples/project/fps_arena/scripts/fps_camera.varg) を参照してください。

```swift
script LookCamera {
    @export var mouseSensitivity: Float = 0.08
    @export var minPitch: Float = -55.0
    @export var maxPitch: Float = 32.0

    var yaw: Float = 0.0
    var pitch: Float = -6.0
    var mouseCaptured: Bool = true

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
        rotation = Vec3(pitch, yaw, 0.0)
    }
}
```
