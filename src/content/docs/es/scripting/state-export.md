---
title: Estado, variables y exportacion
description: Distingue parametros ajustables, estado persistente y variables locales.
---

Los scripts Varg enfatizan la intencion explicita. Deberias poder deducir por la ubicacion de una declaracion si una variable es configuracion, estado o un calculo temporal.

Si no tienes base de programacion, piensa en las variables como "el pequeno cuaderno del script". Algunas cosas las cambia el autor del nivel, otras las recuerda el script, y otras solo se calculan temporalmente en este frame.

## Tres tipos de variables

| Escritura | Ciclo de vida | Uso |
| --- | --- | --- |
| `@export var` | Persiste en el script y puede ajustarse en el editor | Velocidad, dano, cooldown, cantidad |
| `var` en ambito de script | Persiste en el script | Municion, temporizador, fase, si ya inicializo |
| `let` / `var` dentro de funcion | Valido solo en esta llamada de funcion | Calculos temporales, contador de bucle, resultado local |

## Parametros exportados

Los parametros exportados son "controles que se pueden ajustar desde fuera". Por ejemplo velocidad de movimiento, dano o tiempo de enfriamiento. Normalmente no son estado que cambie el jugador en runtime, sino valores que cambia el creador al ajustar sensaciones.

```swift
script WeaponCooldown {
    @export var fireRate: Float = 0.5
    @export var damage: Int = 10

    var canFire: Bool = true
    var ammo: Int = 30
}
```

`fireRate` y `damage` son parametros que ajustaria un disenador o autor de niveles. `canFire` y `ammo` son estado interno de runtime.

## Estado persistente

El estado persistente son "cosas que el script recuerda". Por ejemplo cuanta municion queda, si esta recargando o cuantos segundos han pasado.

Un `var` en el ambito del script se conserva entre frames:

```swift
script Timer {
    var elapsed: Float = 0.0

    func update(_ dt: Float) {
        elapsed += dt
    }
}
```

Si escribes `elapsed` dentro de `update()`, se recrea cada frame y no sirve como temporizador acumulado.

## Variables locales

Una variable local es "un resultado temporal de este pequeno bloque de codigo". No guarda memoria a largo plazo; solo hace mas clara la cuenta actual.

```swift
func update(_ dt: Float) {
    let pulse: Float = sin(Time.time * 3.0) * 0.2
    position.y = 1.0 + pulse
}
```

`pulse` es solo el resultado de este frame, asi que `let` basta.

## `state.name` antiguo

El MVP actual puede seguir aceptando:

```swift
state.ammo -= 1
```

En scripts nuevos se recomienda escribir estado persistente declarativo:

```swift
var ammo: Int = 30

func update(_ dt: Float) {
    ammo -= 1
}
```

Asi es mas facil de entender para el editor, los validadores y los agentes de IA.
