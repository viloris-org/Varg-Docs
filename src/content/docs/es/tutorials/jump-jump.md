---
title: "Tutorial: crear un salto infinito"
description: Desglosa el bucle de Jump Jump desde escena, estado de script, generacion de plataformas en runtime hasta HUD.
---

Jump Jump es un pequeno juego de salto infinito en primera persona, pero contiene un bucle completo de gameplay: cargar, saltar, detectar aterrizaje, puntuar, fallar, reintentar y extender el nivel hacia delante sin parar.

El jugador mantiene Space para cargar y lo suelta para saltar hacia la siguiente plataforma segun la direccion de la vista. El script genera nuevas plataformas, recogibles y zonas peligrosas delante. Aterrizar bien suma puntos; pisar una zona peligrosa o caer al vacio falla y reinicia desde el ultimo checkpoint.

Codigo de ejemplo: [examples/project/jump_jump](https://github.com/viloris-org/Varg/tree/main/examples/project/jump_jump).

:::tip[Cuando leerlo]
Si acabas de aprender scripting basico, puedes seguir hasta "Paso cuatro: escribir el arco en el aire". Con eso ya tendras un prototipo de salto jugable. La deteccion de aterrizaje, generacion infinita y HUD convierten el prototipo en minijuego completo; no hace falta hacerlo todo de una vez.
:::

## Antes de empezar

- Entender la diferencia entre `@export var` y `var` normal.
- Saber que `start()` inicializa y `update(_ dt: Float)` corre cada frame.
- Saber usar `Input.down`, `Input.released` y `position`.
- Saber que un tag es el nombre que usa un script para buscar objetos de escena.

Si esto no esta claro, lee primero [Introduccion al scripting desde cero](/es/scripting/programming-primer/), [Conceptos basicos de scripting](/es/scripting/basics/) y [Ciclo de vida y entrada](/es/scripting/lifecycle-input/). Si prefieres un bucle mas pequeno antes, sigue [Practica intermedia: crear un bucle de recoleccion jugable](/es/tutorials/first-playable-loop/).

## Que aprenderas

- Como usar `.vscene` como nivel inicial y `.varg` como gameplay de runtime.
- Como escribir una maquina de estado simple y estable con `phase`.
- Como generar sin fin con `scene.spawnBox` y `scene.spawnSphere`.
- Como usar tags y consultas de distancia para aterrizajes, recogibles y zonas peligrosas.
- Como crear HUD y modo de ayuda con `ui.rect`, `ui.label`, `ui.toggle`.
- Como reforzar el gameplay con sonido procedural e intensidad GI.

Esta pagina cubre mas que las paginas de sintaxis. Leela en tres partes: pasos uno a cuatro para "poder saltar"; cinco a siete para "detectar y generar"; paso ocho para "que el jugador entienda que ocurre".

## Gameplay final

Controles:

| Entrada | Accion |
| --- | --- |
| Movimiento del raton | Ajustar direccion de apuntado |
| Mantener Space | Cargar |
| Soltar Space | Saltar |
| WASD | Anadir pequeno desplazamiento en la direccion del salto |
| Fire | Capturar de nuevo el raton |
| Assist toggle | Mostrar vista previa de aterrizaje |

Bucle de juego:

1. El jugador carga sobre una plataforma.
2. Al soltar Space entra en fase aerea.
3. Al aterrizar, el script comprueba plataforma cercana, plataforma objetivo, zona peligrosa y recogible.
4. Si tiene exito, actualiza checkpoint, puntuacion, combo y dificultad.
5. El script sigue generando nuevas plataformas delante del jugador.

## Estructura del proyecto

```txt
jump_jump/
├── Varg.toml
├── scenes/
│   └── jump_jump.vscene
└── scripts/
    ├── jump_player.varg
    ├── first_person_camera.varg
    ├── despawn_far.varg
    └── bobber.varg
```

`Varg.toml` define escena por defecto y raiz de scripts:

```toml
name = "Jump Jump"
asset_root = "assets"
script_roots = ["scripts"]
default_scene = "scenes/jump_jump.vscene"
```

Esto significa que cuando la escena escribe `source: "scripts/jump_player.varg"`, el runtime puede encontrar el script dentro del proyecto.

## Paso uno: preparar la escena inicial

`.vscene` se encarga de "que cosas existen cuando empieza el juego". Jump Jump necesita al menos:

- Una camara con `FirstPersonCamera`.
- Un objeto jugador con tag `Player` y `JumpPlayer`.
- Algunas plataformas iniciales con tag `Platform` o `Goal`.
- Luces para que el juego sea legible desde el primer momento.

El montaje del script de jugador se parece a:

```swift
script JumpPlayer {
    source: "scripts/jump_player.varg"
    maxCharge: 1.25
    jumpScale: 5.0
    arcHeight: 3.0
    spawnAhead: 36.0
    segmentLength: 2.9
    routeYaw: -34.0
    giIntensity: 1.35
}
```

Estos valores sobrescriben los valores por defecto de `@export var` del script. Es decir, los campos de script en `.vscene` no son decorativos: son la entrada de ajuste del nivel. Exponerlos desde el principio evita que ajustar sensacion se convierta en adivinar numeros dentro del codigo.

## Paso dos: definir estado del jugador

Las variables de `jump_player.varg` parecen muchas, pero se entienden mejor por grupos:

| Grupo | Ejemplos de variables | Uso |
| --- | --- | --- |
| Ajustes | `maxCharge`, `jumpScale`, `arcHeight`, `spawnAhead` | Ajustar sensacion de gameplay |
| Estado de salto | `charge`, `phase`, `jumpTime`, `startX`, `targetX` | Controlar carga y movimiento aereo |
| Progreso | `score`, `bestDistance`, `combo`, `difficulty` | Registrar rendimiento del jugador |
| Generacion | `nextSpawnX`, `nextSpawnZ`, `spawnIndex` | Decidir donde aparece el siguiente lote |
| Feedback | `hudStatus`, `musicStarted`, `renderReady` | Controlar UI, audio y render |
| Fallo y recuperacion | `gameOver`, `checkpointX`, `checkpointZ` | Reintentar desde una posicion segura |

Agrupa variables antes de leer el codigo. Es mas fiable que leer de arriba abajo. En scripts de maquina de estado, lo peor es que las variables parezcan todas igual de importantes y nadie sepa a que regla pertenece cada valor.

## Paso tres: escribir la fase de carga

`phase == 0` significa que el jugador esta en el suelo y puede cargar.

```swift
if phase == 0 {
    hudStatus = "Mouse look / hold Space"

    if Input.down("Jump") {
        charge += dt
        if charge > maxCharge {
            charge = maxCharge
        }
        hudStatus = "Release to jump"
    }
}
```

Aqui no se usa `wait()` porque la carga debe responder a entrada y HUD cada frame. Mientras Space este mantenido, acumula `charge`; al llegar al limite, se corta con `maxCharge`.

Al soltar Space, guarda punto actual y objetivo, y cambia a fase aerea:

```swift
if Input.released("Jump") && charge > 0.05 {
    startX = position.x
    startZ = position.z

    let yawRad: Float = aimYaw * 0.01745329
    let forwardX: Float = -sin(yawRad)
    let forwardZ: Float = cos(yawRad)
    let distance: Float = charge * jumpScale

    targetX = position.x + forwardX * distance
    targetZ = position.z + forwardZ * distance

    jumpTime = 0.0
    phase = 1
    hudStatus = "Airborne"
    Audio.playTone3D("sine", 360.0 + charge * 260.0, 0.08, 0.22)
}
```

La clave es que el punto objetivo se calcula al soltar. Mientras mantiene la tecla, el jugador puede ajustar la vista; al soltar, el script usa el yaw de ese instante para calcular la direccion y convierte `charge` en distancia.

## Paso cuatro: escribir el arco en el aire

`phase == 1` significa que el jugador vuela. La posicion horizontal usa `lerp` y la altura usa `sin`.

```swift
if phase == 1 {
    jumpTime += dt * 1.85
    let t: Float = clamp(jumpTime, 0.0, 1.0)

    position.x = lerp(startX, targetX, t)
    position.z = lerp(startZ, targetZ, t)
    position.y = 1.1 + sin(t * 3.14159) * arcHeight
}
```

Por que funciona:

- `lerp(start, target, t)` hace que el movimiento horizontal sea estable y ajustable.
- `sin(t * pi)` vale 0 al inicio y al final, y alcanza el maximo en medio, parecido a un arco de salto.
- `clamp` evita que `t` supere 1 y el salto continue extrapolando tras aterrizar.

No es el controlador fisico final, pero es una primera version muy buena: explicable, ajustable y jugable enseguida. Cuando las reglas funcionen, se puede sustituir por un modelo de movimiento mas realista.

## Paso cinco: deteccion de aterrizaje

Cuando `jumpTime >= 1.0`, el script decide si aterrizo.

```swift
let platformFootprint: Float = scene.horizontalDistanceToTagBounds("Platform")
let platformSurface: Float = scene.distanceToTagBounds("Platform")
let goalFootprint: Float = scene.horizontalDistanceToTagBounds("Goal")
let goalSurface: Float = scene.distanceToTagBounds("Goal")

var landed: Bool = false

if platformFootprint <= 0.18 && platformSurface <= 0.98 {
    landed = true
}

if goalFootprint <= 0.18 && goalSurface <= 0.98 {
    landed = true
}

if scene.distanceToTag("Hazard") <= 0.9 {
    landed = false
    dangerStreak += 1
}
```

El truco importante es usar `horizontalDistanceToTagBounds` para el aterrizaje horizontal y `distanceToTagBounds` para comprobar la cercania a la superficie. Usar solo distancia al centro hace que plataformas grandes y pequenas se sientan incoherentes.

## Paso seis: recompensa, fallo y checkpoint

Tras aterrizar con exito, actualiza puntuacion y checkpoint:

```swift
if landed {
    score += 1 + dangerStreak
    combo += 1
    checkpointX = position.x
    checkpointZ = position.z

    if combo > bestCombo {
        bestCombo = combo
    }
}
```

Los recogibles tambien usan consulta por tag:

```swift
if scene.distanceToTag("Collectible") <= 1.45 {
    score += 10 + combo
    scene.destroyNearestWithTag("Collectible", 1.45)
    Audio.playTone3D("triangle", 880.0 + combo * 18.0, 0.12, 0.34)
    hudStatus = "Crystal +" + (10 + combo)
}
```

Al fallar, no reinicies la escena directamente. Marca `gameOver` para dar al HUD oportunidad de mostrar el resultado:

```swift
if !landed {
    position.y = -1.2
    gameOver = true
    combo = 0
    Audio.stopLoop("jump_rush_bgm")
    musicStarted = false
    Audio.playTone("noise", 120.0, 0.18, 0.28)
}
```

Al reintentar, restaura desde el ultimo checkpoint:

```swift
if gameOver && Input.pressed("Jump") {
    charge = 0.0
    phase = 0
    jumpTime = 0.0
    gameOver = false
    position = Vec3(checkpointX, 1.1, checkpointZ)
}
```

## Paso siete: generacion infinita de plataformas

Las plataformas no estan todas en la escena; se anaden en runtime delante del jugador.

```swift
while nextSpawnX < position.x + spawnAhead {
    let lane: Float = spawnIndex - floor(spawnIndex / 4.0) * 4.0
    let wobble: Float = sin(spawnIndex * 1.7) * 0.9
    let platformZ: Float = nextSpawnZ + wobble
    let platformWidth: Float = 2.7 + abs(sin(spawnIndex * 0.9)) * 0.7 - difficulty * 0.65
    let platformDepth: Float = 2.8 - difficulty * 0.45

    scene.spawnBox("Generated Platform", "Platform", Vec3(nextSpawnX, 0.0, platformZ), Vec3(platformWidth, 0.5, platformDepth), "scripts/despawn_far.varg")

    nextSpawnX += segmentLength + difficulty * 0.38
    nextSpawnZ += 0.72 + sin(spawnIndex * 0.6) * 0.25 + difficulty * 0.1
    spawnIndex += 1
}
```

Este generador no coloca al azar; usa variacion determinista:

- `spawnIndex` hace que cada segmento pueda reproducirse.
- `sin(spawnIndex * n)` varia posicion y anchura.
- `difficulty` estrecha plataformas y cambia distancias gradualmente.
- `despawn_far.varg` limpia objetos que quedan atras.

## Paso ocho: anadir HUD y modo de ayuda

El HUD debe mostrar informacion para decidir: puntuacion, distancia, combo, estado, riesgo y barra de carga.

```swift
let chargeWidth: Float = 160.0 * clamp(charge / maxCharge, 0.0, 1.0)

ui.rect("jump_hud_panel", 12.0, 12.0, 340.0, 154.0, 0.03, 0.04, 0.06, 0.86)
ui.label("jump_hud_score", "Score: " + score, 24.0, 42.0)
ui.label("jump_hud_distance", "Distance: " + floor(bestDistance), 154.0, 42.0)
ui.label("jump_hud_status", hudStatus, 24.0, 84.0)
ui.rect("jump_hud_charge_bg", 24.0, 128.0, 160.0, 10.0, 0.18, 0.2, 0.24, 1.0)
ui.rect("jump_hud_charge", 24.0, 128.0, chargeWidth, 10.0, 0.34, 0.75, 0.92, 1.0)
```

El modo de ayuda se controla con `ui.toggle`:

```swift
assistMode = ui.toggle("jump_assist_toggle", assistMode, 282.0, 112.0, 48.0, 24.0)
```

Al activarlo, genera una esfera temporal de previsualizacion:

```swift
if assistMode && ghostCooldown <= 0.0 {
    scene.spawnSphere("Assist Landing Preview", "Assist", Vec3(previewX, 0.78, previewZ), 0.18, "scripts/despawn_far.varg")
    ghostCooldown = 0.18
}
```

Este paso lleva el script de "funciona" a "el jugador lo entiende". Muchos prototipos fallan no porque la regla sea mala, sino porque el jugador no sabe que hizo bien o donde fallo.

## Problemas comunes

| Problema | Causa posible | Arreglo |
| --- | --- | --- |
| No se puede aterrizar tras generar plataformas | tag incorrecto o no uso de `Platform` / `Goal` | Revisa tags en generacion y escena |
| Los objetos generados se acumulan | Falta script de limpieza | Pasa `scripts/despawn_far.varg` a objetos generados |
| La direccion del salto es incorrecta | Conversion de yaw a radianes o direccion forward invertida | Revisa `yaw * 0.01745329` y `-sin/cos` |
| La barra de carga no se mueve | `charge` no persiste entre frames | Confirma que `charge` es `var` en ambito de script |
| El estado queda raro al reintentar | Solo reseteaste posicion, no phase/timer | Reinicia juntas las variables de recuperacion |

## Ejercicios

1. Anade una plataforma `Bonus` que sume tiempo extra al aterrizar.
2. Haz que `assistMode` solo este disponible durante los primeros 100 metros.
3. Aumenta la probabilidad de zonas peligrosas con `difficulty`.
4. Usa `ui.slider` para crear un panel de depuracion que ajuste `jumpScale` en runtime.
5. Anade tonos de distinta altura para aterrizajes perfectos consecutivos.
