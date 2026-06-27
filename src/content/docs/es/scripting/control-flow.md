---
title: Flujo de control y espera
description: Usa if, for, while, break, continue y wait para escribir logica de gameplay.
---

## Condiciones

El flujo de control no sirve para escribir codigo "listo", sino para expresar reglas de gameplay con claridad: si se puede disparar, resta municion; si esta recargando, cuenta atras; si cae de la plataforma, falla.

```swift
if Input.pressed("Fire") && canFire && ammo > 0 {
    ammo -= 1
    canFire = false
}
```

El MVP actual soporta:

- Nombres simples de estado booleano, por ejemplo `canFire`
- `!`, `&&`, `||`
- Comparaciones numericas, por ejemplo `ammo > 0`, `timer <= 0`
- Comprobaciones de entrada, por ejemplo `Input.pressed("Fire")`

## Bucle `for`

Bucle de rango:

```swift
for i in 0..3 {
    log("Range loop iteration")
}
```

Bucle de rango inclusivo:

```swift
for i in 1..=5 {
    sum += i
}
```

Bucle de conteo:

```swift
for i in count(3) {
    count += 1
}
```

## Bucle `while`

```swift
while loopCount < maxIterations {
    if loopCount >= 5 {
        break
    }

    loopCount += 1
}
```

`while` sirve para expresar "seguir hasta que el estado cumpla una condicion". Asegurate de que cada iteracion pueda cambiar la condicion para evitar bucles infinitos.

## `break` y `continue`

```swift
for i in 0..10 {
    if i == skipValue {
        continue
    }

    filtered += 1
}
```

- `break`: termina inmediatamente el bucle actual
- `continue`: salta el resto de la logica de esta iteracion y pasa a la siguiente

## `wait(expression)`

`wait()` expresa intervalos de tiempo dentro de un script:

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

Esta forma es adecuada para ensenanza y control de ritmos simples. Puedes leerla como "espera un momento y luego continua con lo siguiente".

Si un sistema debe seguir actualizando HUD, procesando entrada, moviendo al personaje o participando en condiciones de victoria/derrota mientras espera, usa un temporizador explicito. Son unas lineas mas, pero el estado queda visible y es mas facil de depurar, pausar y guardar.

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
