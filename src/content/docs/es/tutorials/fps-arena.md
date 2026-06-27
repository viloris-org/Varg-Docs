---
title: "Tutorial: crear un campo de tiro"
description: Desglosa el ritmo de FPS Arena desde movimiento en primera persona, recarga, generacion de objetivos y feedback de impacto hasta HUD.
---

FPS Arena es un campo de tiro en un espacio cerrado. No tiene recursos complejos ni un sistema de armas completo; se centra en algo mas basico e importante: el jugador puede moverse, disparar y recargar, los objetivos aparecen continuamente y la presion sube con el tiempo.

El jugador se mueve por la arena, apunta y dispara a objetivos dron generados dinamicamente. Si se acumulan demasiados objetivos, baja la integridad; limpiar suficientes objetivos completa la simulacion.

Codigo de ejemplo: [examples/project/fps_arena](https://github.com/viloris-org/Varg/tree/main/examples/project/fps_arena).

:::note[Consejo de lectura]
Este tutorial se parece mas a una "sintesis de varios sistemas" que Jump Jump: movimiento, arma, spawns, victoria/derrota y HUD viven en el mismo script principal. En la primera lectura, quedate con movimiento y recarga; deja generacion de objetivos y presion para una segunda pasada.
:::

## Antes de empezar

- Haber leido los cuatro primeros pasos de [Tutorial: crear un salto infinito](/es/tutorials/jump-jump/) o entender `phase`, temporizadores y `position`.
- Si no tienes base de programacion, haber hecho [Practica intermedia: crear un bucle de recoleccion jugable](/es/tutorials/first-playable-loop/).
- Saber por que `dt` se multiplica en movimiento y cuentas atras.
- Saber que la consulta por tag no es el sistema final de raycast, sino una forma practica de hacer impactos y distancias en el MVP actual.

## Que aprenderas

- Como usar yaw, vector frontal y ejes de entrada para movimiento en primera persona.
- Como escribir recarga con temporizador explicito en vez de depender de `wait()`.
- Como armar objetivos complejos generando objetos en runtime.
- Como usar distancia por tag para una deteccion MVP de impactos.
- Como manejar varios temporizadores para generacion, cuenta atras y castigo de presion.
- Como conectar HUD, sonidos y texto de estado al bucle de gameplay.

## Gameplay final

Controles:

| Entrada | Accion |
| --- | --- |
| WASD | Mover |
| Shift | Sprint |
| Movimiento del raton | Apuntar |
| Fire | Disparar |
| Interact | Recargar |
| Esc / Q | Menu o salir, segun el host de runtime |

Condiciones de victoria y derrota:

- Limpia la cantidad indicada de objetivos antes de que termine la cuenta atras.
- Si hay demasiados objetivos sin atender, `integrity` baja.
- Si el tiempo o la integridad llegan a cero, fallas.

## Estructura del proyecto

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

`fps_player.varg` es el script principal. Los demas scripts proporcionan seguimiento de camara, flotacion de objetivos y limpieza de objetos de runtime.

## Paso uno: tratar la escena como campo de entrenamiento

El archivo de escena se encarga de contenido estatico: suelo, paredes, luces, jugador y camara. El jugador usa tag `Player`; el script usa ese tag para seguimiento de camara y distancia de limpieza.

Montaje del script de jugador:

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

Estos parametros muestran que no es un demo de valores fijos. Velocidad, limites de arena, radio de disparo, tamano de cargador, tiempo de recarga e intensidad GI son puntos de ajuste del nivel. Exponer estos controles primero da margen para ajustar dificultad despues.

## Paso dos: ordenar estado del script

Las variables de `FpsPlayer` pueden agruparse por sistema:

| Grupo | Ejemplos de variables | Uso |
| --- | --- | --- |
| Vista y movimiento | `yaw`, `moveSpeed`, `arenaLimitX` | Control del jugador |
| Arma | `ammo`, `reserve`, `canFire`, `reloading`, `reloadTimer` | Disparo y recarga |
| Generacion de objetivos | `targetTimer`, `targetIndex`, `spawnAhead`, `activeTargets` | Control de spawns |
| Puntuacion | `score`, `streak`, `shots`, `hits`, `cleared` | Feedback de rendimiento |
| Presion | `roundTimer`, `integrity`, `pressureTimer`, `wave` | Ritmo de victoria/derrota |
| Feedback | `status`, `musicStarted`, `renderReady` | HUD, audio y render |

Mira esta tabla antes del codigo. Ayuda a separar "estado del arma", "estado de spawns" y "estado de victoria/derrota". Decenas de variables no asustan; lo peligroso es que parezcan todas del mismo nivel.

## Paso tres: movimiento en primera persona

El nucleo del movimiento FPS convierte yaw en vectores frontal y derecho, y combina esos vectores con los ejes de entrada.

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

Vale la pena explicarlo linea por linea:

- Raton y look de mando cambian `yaw`.
- `sin/cos` convierten angulo en vector de direccion.
- `MoveX` camina hacia la derecha; `MoveY` hacia delante.
- `dt` evita dependencia del framerate.
- `clamp` mantiene al jugador dentro de la arena.

## Paso cuatro: inicializar feedback una sola vez

Render y musica no deben reinicializarse cada frame. Protegelos con booleanos:

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

Este patron se traslada a muchos sistemas: configurar el entorno una vez y actualizar por frame solo valores que cambian de verdad. Tambien evita que algunos estados se reinicien constantemente y parezcan fallos de render o audio.

## Paso cinco: arma y recarga

Disparar empieza comprobando municion:

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

La recarga usa un temporizador explicito:

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

No se usa `wait(reloadTime)`. Durante la recarga deben seguir funcionando HUD, presion de objetivos, cuenta atras y movimiento; el temporizador explicito expone "recargando" como estado normal para el resto de la logica.

## Paso seis: generar objetivos dron

Un objetivo no es un recurso de modelo, sino un conjunto de geometria simple generada en runtime:

```swift
scene.spawnSphere("Training Drone Core", "Target", Vec3(x, y, targetZ), 0.42, "scripts/target_drift.varg")
scene.spawnBox("Training Drone Top Plate", "DronePart", Vec3(x, y + 0.47, targetZ), Vec3(0.92, 0.12, 0.34), "scripts/drone_part_drift.varg")
scene.spawnBox("Training Drone Bottom Plate", "DronePart", Vec3(x, y - 0.47, targetZ), Vec3(0.72, 0.1, 0.28), "scripts/drone_part_drift.varg")
scene.spawnBox("Training Drone Left Wing", "DronePart", Vec3(x - 0.58, y, targetZ), Vec3(0.16, 0.34, 0.76), "scripts/drone_part_drift.varg")
scene.spawnBox("Training Drone Right Wing", "DronePart", Vec3(x + 0.58, y, targetZ), Vec3(0.16, 0.34, 0.76), "scripts/drone_part_drift.varg")
```

Esta tecnica encaja muy bien en tutoriales:

- No necesita recursos de modelo externos.
- Cada pieza puede montar un script de flotacion.
- La esfera central usa tag `Target`; las piezas decorativas usan tag `DronePart`.
- Al impactar se pueden destruir nucleo y piezas por separado.

La posicion usa `targetIndex` para una variacion determinista:

```swift
let lane: Float = targetIndex - floor(targetIndex / 5.0) * 5.0
let x: Float = -5.6 + lane * 2.8
let z: Float = -1.0 + sin(targetIndex * 1.1) * 5.4
let y: Float = 1.35 + abs(sin(targetIndex * 0.7)) * 1.45
let targetZ: Float = z + spawnAhead
```

Es mejor que aleatoriedad pura para ensenar y depurar, porque cada ejecucion reproduce un ritmo parecido.

## Paso siete: deteccion de impacto MVP

El ejemplo actual no usa un arma de raycast, sino distancia al `Target` mas cercano como aproximacion:

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

El codigo reconoce que es MVP: no es el arma de raycast final, pero basta para validar municion, puntuacion, combo, generacion de objetivos y ritmo de feedback. Primero haz funcionar el bucle; despues cambia el modelo de impacto por uno mas preciso.

Se llama varias veces a `destroyNearestWithTag("DronePart", ...)` porque la API actual destruye solo el objeto mas cercano en cada llamada. Repetirlo limpia varias piezas alrededor del objetivo.

## Paso ocho: crear presion con varios temporizadores

El campo de tiro no es una maquina de estado lineal, sino varios temporizadores paralelos:

```swift
roundTimer -= dt
pressureTimer -= dt
targetTimer -= dt
```

Generacion de objetivos:

```swift
if targetTimer <= 0.0 && !gameOver {
    spawnTarget()
    let spawnDelay: Float = 1.35 - wave * 0.08
    targetTimer = clamp(spawnDelay, 0.45, 1.35)
}
```

Castigo de presion:

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

Victoria y derrota:

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

La ventaja de esta estructura es que los limites son claros: cada temporizador maneja una presion, y juntos forman el ritmo de juego. Al depurar tambien localizas rapido si el problema es que los objetivos aparecen demasiado rapido o que el castigo pesa demasiado.

## Paso nueve: dibujar HUD

Extraer el HUD a una funcion limpia mucho el bucle principal:

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

El HUD debe responder cuatro preguntas:

- Cual es mi objetivo ahora?
- Cuantos disparos me quedan?
- Como lo estoy haciendo?
- Por que gane o falle?

Si el HUD responde eso, el jugador puede entender la mecanica.

## Problemas comunes

| Problema | Causa posible | Arreglo |
| --- | --- | --- |
| El disparo no impacta | `hitRadius` demasiado pequeno o el tag del objetivo no es `Target` | Revisa generacion y parametros del script |
| Los objetivos se acumulan | `pressureTimer` demasiado lento o el impacto no reduce `activeTargets` | Revisa la rama de impacto |
| Municion rara tras recargar | Error en calculo de `needed` o `reserve` | Prueba primero con cargador pequeno |
| El jugador sale de la arena | Falta `clamp(position.x/z, ...)` | Revisa las ultimas lineas del movimiento |
| El HUD no refresca | `drawHud()` no se llama cada frame | Llamalo al final de `update()` |

## Ejercicios

1. Anade un `BonusTarget` que sume tiempo extra al impactar.
2. Haz que `hitRadius` se reduzca con la racha para subir la dificultad de puntuaciones altas.
3. Anade a los objetivos un script de limpieza por timeout que reste puntos si no reciben impacto.
4. Usa `ui.slider` para un panel de depuracion que ajuste `spawnDelay` en runtime.
5. Divide `spawnTarget()` en tres funciones: objetivo normal, objetivo rapido y objetivo de alta puntuacion.
