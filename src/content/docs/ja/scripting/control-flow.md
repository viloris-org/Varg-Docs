---
title: 制御フローと待機
description: if、for、while、break、continue、wait を使って gameplay ロジックを書きます。
---

## 条件判断

制御フローは「賢い」コードを書くためではなく、ゲームプレイルールを明確にするためにあります。発射できるなら弾薬を減らす、リロード中ならカウントダウンする、足場から落ちたら失敗にする、といったことです。

```swift
if Input.pressed("Fire") && canFire && ammo > 0 {
    ammo -= 1
    canFire = false
}
```

現在の MVP は次に対応しています。

- `canFire` のような単純な真偽状態名
- `!`、`&&`、`||`
- `ammo > 0`、`timer <= 0` のような数値比較
- `Input.pressed("Fire")` のような入力チェック

## `for` ループ

範囲ループ:

```swift
for i in 0..3 {
    log("Range loop iteration")
}
```

終端を含む範囲ループ:

```swift
for i in 1..=5 {
    sum += i
}
```

回数指定ループ:

```swift
for i in count(3) {
    count += 1
}
```

## `while` ループ

```swift
while loopCount < maxIterations {
    if loopCount >= 5 {
        break
    }

    loopCount += 1
}
```

`while` は「状態が条件を満たすまで続ける」ことを表すのに向いています。各反復で条件が変わる機会を作り、無限ループを避けてください。

## `break` と `continue`

```swift
for i in 0..10 {
    if i == skipValue {
        continue
    }

    filtered += 1
}
```

- `break`: 現在のループをただちに終了する
- `continue`: この反復の残りを飛ばし、次の反復へ進む

## `wait(expression)`

`wait()` はスクリプト内の時間間隔を表すために使います。

```swift
script WeaponCooldown {
    @export var fireRate: Float = 0.5

    var canFire: Bool = true
    var ammo: Int = 30

    func update(_ dt: Float) {
        if Input.pressed("Fire") && canFire && ammo > 0 {
            ammo -= 1
            canFire = false
            log("Fire! Ammo remaining:")

            wait(fireRate)

            canFire = true
        }
    }
}
```

この書き方は、学習や単純なリズム制御に向いています。「少し待ってから、後続の処理を続ける」と考えられます。

待っている間にも HUD 更新、入力処理、キャラクター移動、勝敗判定が必要なシステムでは、明示的なタイマーを使うことをおすすめします。数行増えますが、状態が見えやすく、デバッグ、停止、保存が楽になります。

```swift
var cooldown: Float = 0.0

func update(_ dt: Float) {
    if cooldown > 0 {
        cooldown -= dt
    }

    if Input.pressed("Fire") && cooldown <= 0 {
        cooldown = fireRate
    }
}
```
