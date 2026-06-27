---
title: Conceptos basicos de scripting
description: Aprende el rol de los archivos de script de Varg, la declaracion script y la estructura basica.
---

`.varg` es el archivo de logica de runtime de Varg. Puedes entenderlo al principio como "un conjunto de reglas montado en un objeto del juego": cuando empieza, que hace cada frame y como reacciona a las teclas del jugador.

Si no has aprendido otros lenguajes de programacion, lee primero [Introduccion al scripting desde cero](/es/scripting/programming-primer/). Esa pagina explica variables, funciones, condiciones y bucles con mas calma.

Usa una sintaxis cercana a Swift, pero no es Swift; esta orientado a scripts de juego, modulos y comportamientos declarativos. Al principio solo necesitas fijarte en `script`; las otras declaraciones pueden esperar.

## Declaraciones de nivel superior

`.varg` permite tres declaraciones de nivel superior:

| Declaracion | Uso | Recomendacion actual |
| --- | --- | --- |
| `script` | Logica de runtime montada en entidades | Uso principal |
| `module` | Codigo reutilizable importado por otros `.varg` | API objetivo, usar con cuidado |
| `behavior` | Arboles de comportamiento o maquinas de estado declarativas | API objetivo, aun en diseno |

Los tutoriales actuales se centran en `script`.

:::tip[Quedate primero con tres cosas]
Un script inicial suele necesitar solo tres bloques: `@export var` para parametros del editor, `var` normal para recordar estado de runtime, y `start()` / `update(_ dt: Float)` para la logica real. Las APIs posteriores rellenan esos tres bloques.
:::

## Script minimo

```swift
script HelloVarg {
    func start() {
        log("Hello Varg")
    }
}
```

Explicacion:

- `script HelloVarg` define un script que puede montarse en una entidad.
- `func start()` es una funcion de ciclo de vida llamada cuando el script empieza.
- `log("...")` emite un log literal. El MVP actual soporta logs de cadenas literales.

## Una estructura mas completa

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

Un script contiene tres tipos de contenido:

- Parametros exportados: `@export var speed`, usados por el editor y niveles para ajustar valores.
- Estado persistente: `var jumpsLeft`, conservado mientras el script se ejecuta.
- Funciones de ciclo de vida: `start()`, `update(_ dt: Float)` y similares, donde vive la logica real.

## Limites del MVP ejecutable actual

Estas son las capacidades que puedes usar con confianza ahora. Parecen muchas, pero no hace falta memorizarlas; recuerda las categorias y vuelve aqui cuando escribas scripts.

Sintaxis basica:

- `let`, `var`, `@export var`
- `start`, `update`, `fixedUpdate`
- `if`, `else`, `for`, `while`
- `return`, `break`, `continue`
- `wait(expression)`
- `log("literal message")`

Entrada y movimiento:

- `Input.down`, `Input.pressed`, `Input.released`, `Input.value`
- `Input.mouseDeltaX`, `Input.mouseDeltaY`, `Input.captureMouse`
- `position` y `entity.translate(Vec3(...))`

Consulta y generacion de escena:

- `scene.spawnBox`, `scene.spawnSphere`, `scene.destroyNearestWithTag`
- `scene.distanceToTag`, `scene.distanceToTagBounds`, `scene.horizontalDistanceToTagBounds`
- `scene.xOf`, `scene.yOf`, `scene.zOf`, `playerDistance()`

Sistemas de feedback:

- `Audio.playTone`, `Audio.playTone3D`, `Audio.startLoop`, `Audio.stopLoop`
- `ui.label`, `ui.rect`, `ui.button`, `ui.toggle`, `ui.slider`, `ui.dragX`, `ui.dragY`, `ui.input`
- `render.gi.useScreenSpace`, `render.gi.useProbeVolume`, `render.gi.setIntensity`

No trates por ahora la API objetivo como capacidad de runtime terminada: `scene.spawn(...)` generico, eventos `emit(...)`, `Audio.play(...)` basado en recursos, arrays, diccionarios, optional binding y llamadas a modulos. Son direccion del lenguaje; antes de usarlas en ejecucion espera diagnostico o actualizaciones de implementacion.
