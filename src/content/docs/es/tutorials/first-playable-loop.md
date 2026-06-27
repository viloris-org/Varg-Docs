---
title: "Practica intermedia: crear un bucle de recoleccion jugable"
description: Antes de entrar en un proyecto completo, practica movimiento, tiempo, recogida, puntuacion y HUD con un script pequeno.
---

Este capitulo esta entre la ensenanza de sintaxis y los tutoriales de proyecto completo. El objetivo es pequeno: crear una mecanica que permita moverse, recoger, puntuar y jugar contra una cuenta atras.

No necesitas entender primero una arquitectura de juego completa. Construye este bucle:

1. El jugador se mueve con flechas o WASD.
2. En la escena hay un `Collectible`.
3. Al acercarse, el jugador gana puntuacion.
4. El HUD muestra puntuacion, cuenta atras y estado.
5. Cuando se acaba el tiempo, deja de puntuar.

## Antes de empezar

- Haber leido [Introduccion al scripting para lectores sin programacion](/es/scripting/programming-primer/).
- Saber que `update(_ dt: Float)` se ejecuta cada frame.
- Saber que `position.x` y `position.z` pueden cambiar la posicion del objeto.
- Saber que un tag es el nombre que usa un script para encontrar objetos.

## Prepara una escena minima

Este ejercicio necesita solo dos objetos:

| Objeto | Necesita | Por que |
| --- | --- | --- |
| Jugador | Montar el script `CollectPlayer` | Entrada, tiempo y puntuacion viven en el script del jugador |
| Recogible | tag `Collectible` | El script usa ese tag para encontrar el recogible mas cercano |

El jugador puede ser una caja o capsula; el recogible puede ser una esfera pequena. Lo importante no es el modelo, sino hacer funcionar la cadena "acercarse al objeto -> sumar punto -> borrar objeto".

Si escribes `.vscene` a mano, la estructura se parece a esto:

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

El error mas comun aqui es escribir mal `Collectible`. El tag de la escena y la cadena del script deben coincidir exactamente, incluidas mayusculas. Si el script pregunta `scene.distanceToTag("Collectible")`, la escena no puede usar `collectible` ni `Collectable`.

## Paso uno: solo mover al jugador

No hagas todavia puntuacion, recogida ni UI. Primero confirma que el jugador se mueve.

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

Lectura linea a linea:

- `speed` es la velocidad de movimiento.
- `moveX` es entrada izquierda/derecha.
- `moveZ` es entrada adelante/atras.
- `* dt` evita que la velocidad dependa del framerate.

Ejecuta hasta aqui. Si el jugador se mueve, pasa al siguiente paso.

Si no se mueve:

| Sintoma | Causa comun |
| --- | --- |
| Las teclas no responden | El script no esta montado en el jugador |
| Izquierda/derecha funciona, adelante/atras no | `MoveY` no esta configurado o las teclas no son las esperadas |
| Se mueve demasiado rapido o lento | `speed` no encaja; prueba entre `3.0` y `6.0` |

Ajusta primero el movimiento. Si no, puntuacion, generacion y HUD quedaran contaminados por ese problema.

## Paso dos: anadir cuenta atras

Ahora anade un limite de tiempo.

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

Hay dos estados nuevos:

| Variable | Significado |
| --- | --- |
| `timeLeft` | Segundos restantes |
| `gameOver` | Si el juego ha terminado |

`if !gameOver` significa: si el juego no ha terminado, sigue contando y moviendo.

`timeLeft` y `roundTime` no son duplicados:

- `roundTime` es la duracion inicial ajustable desde escena.
- `timeLeft` es el tiempo restante en runtime y baja cada frame.

Muchos principiantes escriben directamente `roundTime -= dt`. Funciona, pero mezcla "duracion por defecto" con "tiempo restante actual" y complica la depuracion.

## Paso tres: puntuar al acercarse

El recogible de la escena necesita tag `Collectible`. El script usa distancia para saber si el jugador esta cerca.

```swift
@export var pickupRadius: Float = 1.4

var score: Int = 0
var status: String = "Collect the crystal"
```

Pon esto en `update()`, despues del movimiento:

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

Hace cuatro cosas:

1. Encuentra el `Collectible` mas cercano.
2. Si esta suficientemente cerca, suma 1.
3. Destruye el recogible cercano.
4. Reproduce un sonido corto.

Todavia no se genera otro recogible, asi que solo se recoge una vez. Eso esta bien: primero haz funcionar una accion.

El orden importa:

1. Calcula distancia.
2. Si esta bastante cerca, suma puntuacion.
3. Tras puntuar, destruye el objeto recogido.
4. Finalmente reproduce feedback.

Si destruyes primero y luego intentas leer posicion o estado, la logica se vuelve confusa. Al empezar, mantente con este orden: detectar, cambiar puntuacion, cambiar escena, dar feedback.

## Paso cuatro: generar otro recogible

Tras recoger, puedes generar una nueva esfera delante.

Primero anade un contador:

```swift
var spawnIndex: Int = 0
```

Luego, dentro del exito de recogida, anade:

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

No usa aleatoriedad; usa `spawnIndex` y `sin()` para variar. La ventaja es que cada ejecucion tiene un ritmo parecido y resulta mas facil depurar.

Parametros de `scene.spawnSphere(...)`:

| Parametro | Valor aqui | Funcion |
| --- | --- | --- |
| Nombre del objeto | `"Collectible"` | Nombre visto en editor o depuracion |
| tag | `"Collectible"` | Permite que `distanceToTag` lo encuentre despues |
| Posicion | `Vec3(nextX, 0.8, nextZ)` | Donde aparece el nuevo recogible |
| Radio | `0.35` | Tamano de la esfera |
| Script | `""` | Aqui no monta script extra |

El segundo parametro tambien debe ser `Collectible`. Si no, la esfera aparece, pero el script no la encontrara y no se podra recoger.

## Paso cinco: conectar el HUD

Muestra al jugador la informacion necesaria:

```swift
ui.rect("collect_panel", 12.0, 12.0, 300.0, 126.0, 0.03, 0.04, 0.06, 0.86)
ui.label("collect_score", "Score: " + score, 24.0, 42.0)
ui.label("collect_time", "Time: " + floor(timeLeft), 24.0, 70.0)
ui.label("collect_status", status, 24.0, 98.0)
```

Si el tiempo termino, cambia el aviso:

```swift
if gameOver {
    status = "Time up"
}
```

Conviene conectar el HUD al final no porque no importe, sino porque depende del estado anterior. Primero tienes `score`, `timeLeft` y `status`; luego los muestras. Es la lectura mas clara.

Estas coordenadas son de pantalla, no de mundo. `ui.label("collect_score", ..., 24.0, 42.0)` dibuja cerca de la esquina superior izquierda y no se mueve con el jugador ni el recogible.

## Script completo

Juntando todo:

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

## Lo que acabas de practicar

| Capacidad | Donde aparece |
| --- | --- |
| Actualizacion por frame | Movimiento, cuenta atras, HUD |
| Estado persistente | `score`, `timeLeft`, `gameOver` |
| Entrada | `Input.value("MoveX")`, `Input.value("MoveY")` |
| Condiciones | Tiempo agotado, cercania al recogible |
| Consulta de escena | `scene.distanceToTag("Collectible")` |
| Generacion dinamica | `scene.spawnSphere(...)` |
| Feedback | `ui.label`, `ui.rect`, `Audio.playTone` |

Esto es una version reducida de un proyecto completo. Jump Jump y FPS Arena solo amplian la misma idea con mas estados, mas objetos y feedback mas fuerte.

## Problemas comunes

| Problema | Que revisar primero |
| --- | --- |
| Al acercarse no suma | Si el tag de escena es exactamente `Collectible` |
| Tras recoger el primero no aparece otro | Si `spawnIndex += 1` esta dentro del `if` de recogida exitosa |
| La puntuacion sube sin parar | Si llamaste a `scene.destroyNearestWithTag(...)` tras recoger |
| Tras acabarse el tiempo aun se mueve | Si el movimiento esta envuelto en `if !gameOver` |
| El HUD no cambia | Si `ui.label` esta en `update()` y no solo en `start()` |

Al depurar, no cambies muchas cosas a la vez. Haz que el movimiento funcione, luego una recogida, luego la regeneracion, y al final el HUD. Si cada paso se puede jugar, el siguiente problema sera mas facil de localizar.
