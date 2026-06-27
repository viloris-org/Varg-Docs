---
title: Ciclo de vida y entrada
description: Domina start, update, fixedUpdate y la API Input.
---

## Funciones de ciclo de vida

Las funciones de ciclo de vida son los lugares donde el motor llama a la puerta. No tienes que llamarlas tu; una vez montado el script en una entidad, el runtime las invoca en el momento adecuado.

Los scripts Varg reciben eventos del motor mediante nombres reservados:

```swift
func start()
func update(_ dt: Float)
func fixedUpdate(_ dt: Float)
func collisionEnter(_ other: Entity)
func collisionExit(_ other: Entity)
func event(_ name: String, _ data: EventData)
```

En el MVP actual, las mas usadas son:

| Funcion | Cuando se activa | Usos comunes |
| --- | --- | --- |
| `start()` | Cuando empieza el script | Inicializar estado, emitir logs de arranque |
| `update(_ dt: Float)` | Cada frame | Entrada, movimiento, tiempo, animacion |
| `fixedUpdate(_ dt: Float)` | Paso fijo | Logica relacionada con fisica, detecciones por lote |

Al empezar, recuerda primero `start()` y `update(_ dt: Float)`. Nombres como `collisionEnter` y `event` pueden considerarse puertas futuras; no hace falta abrirlas ahora.

## Que es `dt`

`dt` es el tiempo entre esta actualizacion y la anterior, normalmente entendido en segundos. Multiplicar movimiento por `dt` hace que la velocidad no dependa del framerate.

```swift
script Mover {
    @export var speed: Float = 3.0

    func update(_ dt: Float) {
        entity.translate(Vec3(speed * dt, 0, 0))
    }
}
```

## API de entrada

La API de entrada tiene varios nombres, pero la pregunta es simple: si esta tecla esta mantenida, acaba de pulsarse, acaba de soltarse, o cuanto vale un eje ahora.

Usa nombres de entrada explicitos:

```swift
Input.down("Jump")        // mantenido este frame
Input.pressed("Jump")     // pulsado justo este frame
Input.released("Jump")    // soltado justo este frame
Input.value("MoveX")      // entrada de eje, comun en movimiento
Input.mouseDeltaX()       // desplazamiento horizontal del raton en este frame
Input.mouseDeltaY()       // desplazamiento vertical del raton en este frame
Input.captureMouse(true)  // captura el raton, comun en primera persona
```

## Ejemplo de entrada: movimiento y salto

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

Aqui el salto se escribe como `position.y += ...` porque el MVP actual soporta explicitamente asignacion y modificacion de componentes de `position`. Una API de velocidad fisica mas completa pertenece a la direccion objetivo; antes de usarla hay que basarse en la implementacion real del runtime.

## Entrada de raton en primera persona

El ejemplo completo esta en [jump_jump/scripts/first_person_camera.varg](https://github.com/viloris-org/Varg/tree/main/examples/project/jump_jump/scripts/first_person_camera.varg) y [fps_arena/scripts/fps_camera.varg](https://github.com/viloris-org/Varg/tree/main/examples/project/fps_arena/scripts/fps_camera.varg).

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
