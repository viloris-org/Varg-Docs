---
title: Desglose de ejemplos
description: Aprende patrones comunes de scripting desde Varg examples/scripts.
---

Estos ejemplos vienen de `examples/scripts` en el repositorio de Varg y pueden servir como plantillas al escribir tus propios scripts. Para tutoriales guiados mas completos:

- [Practica intermedia: crear un bucle de recoleccion jugable](/es/tutorials/first-playable-loop/)
- [Crear un salto infinito](/es/tutorials/jump-jump/)
- [Crear un campo de tiro](/es/tutorials/fps-arena/)

Si aun no tienes soltura programando, no leas los ejemplos desde la primera linea hasta la ultima. Haz primero tres preguntas: que estado recuerda este script, que revisa cada frame en `update()`, y que cambia cuando el jugador hace algo.

Si todavia no tienes esa forma de lectura, lee primero [De basico a avanzado: organizar scripts de gameplay](/es/scripting/gameplay-loop-patterns/). Esa pagina explica como ordenar variables, entrada, temporizadores y feedback dentro del mismo `update()`.

## Cooldown de arma

Archivo principal: `weapon_cooldown.varg`

```swift
script WeaponCooldown {
    @export var fireRate: Float = 0.5
    @export var damage: Int = 10

    var canFire: Bool = true
    var ammo: Int = 30

    func update(_ dt: Float) {
        if Input.pressed("Fire") && canFire && ammo > 0 {
            ammo -= 1
            canFire = false
            wait(fireRate)
            canFire = true
        }
    }
}
```

Patrones aprendidos:

- Poner parametros de diseno ajustables en `@export var`
- Guardar `canFire` y `ammo` como estado persistente
- Usar eventos de entrada para activar cambios de estado
- Usar `wait()` para expresar una pausa corta

## Contador de particulas

Archivo principal: `particle_system.varg`

```swift
var particlesActive: Int = 0
var timeSinceEmit: Float = 0.0

func update(_ dt: Float) {
    timeSinceEmit += dt

    let emitInterval: Float = 1.0 / emitRate
    while timeSinceEmit >= emitInterval {
        if particlesActive < particleCount {
            particlesActive += 1
        }
        timeSinceEmit -= emitInterval
    }
}
```

Patrones aprendidos:

- Convertir actualizaciones por frame en eventos de frecuencia fija mediante tiempo acumulado
- Usar `while` para manejar varias emisiones posibles en un solo frame
- Usar limites para evitar que el estado supere el rango disenado

## Generador de oleadas

Archivo principal: `wave_spawner.varg`

Este ejemplo separa la logica en varios estados:

| Estado | Significado |
| --- | --- |
| `currentWave` | Oleada actual |
| `waveTimer` | Tiempo restante hasta la siguiente oleada |
| `enemiesSpawned` | Cantidad generada en la oleada actual |
| `isSpawning` | Si esta generando |

Fragmento clave:

```swift
if waveTimer <= 0 && !isSpawning {
    currentWave += 1
    isSpawning = true
    enemiesSpawned = 0
    log("Starting wave")
}
```

Es una maquina de estado tipica: una condicion activa una transicion de estado y la logica posterior continua segun el estado nuevo.

## Demo de bucles

Archivo principal: `loop_demo.varg`

Cubre:

- Bucle de rango `0..3`
- Bucle de rango inclusivo `1..=5`
- Bucle de conteo `count(3)`
- Bucles anidados
- `break` y `continue`
- Uso de `sin(Time.time + i)` para acumulacion de animacion

Cuando necesites comprobaciones por lote, acumulaciones o muestreo simple de animacion, empieza consultando este archivo.

## Ejemplos de proyecto completo

[examples/project/jump_jump](https://github.com/viloris-org/Varg/tree/main/examples/project/jump_jump) y [examples/project/fps_arena](https://github.com/viloris-org/Varg/tree/main/examples/project/fps_arena) ya superan el alcance de los examples basicos:

| Proyecto | Capacidades clave | Archivo recomendado |
| --- | --- | --- |
| `jump_jump` | Salto cargado en primera persona, generacion de plataformas en runtime, deteccion de aterrizaje, recogibles, HUD, modo de ayuda | `scripts/jump_player.varg` |
| `fps_arena` | Movimiento en primera persona, municion y recarga, generacion de objetivos, impactos por distancia, presion de oleadas, HUD | `scripts/fps_player.varg` |

Si los examples de un solo archivo te parecen demasiado simples pero los proyectos completos demasiado grandes, haz primero [Practica intermedia: crear un bucle de recoleccion jugable](/es/tutorials/first-playable-loop/). Pone movimiento, recogida, puntuacion, tiempo, generacion y HUD en un pequeno script, justo despues de las paginas de sintaxis.
