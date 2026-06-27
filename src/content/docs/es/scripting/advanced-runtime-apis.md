---
title: Scripts de gameplay avanzados
description: Usa consultas de escena, generacion dinamica, HUD, audio, raton y comandos de render para crear bucles realmente jugables.
---

Tras aprender la sintaxis basica, ya puedes escribir logica local como "mover con teclas", "cooldown de arma" o "temporizador". Un script de juego real debe conectar varios sistemas: la entrada cambia estado, el estado genera o destruye objetos de escena, y esos objetos afectan a puntuacion, fallos, sonido y UI.

Esta pagina no es un indice completo de API, sino un metodo de trabajo para escribir scripts de gameplay. Los ejemplos vienen de proyectos del repositorio Varg:

- [examples/project/jump_jump](https://github.com/viloris-org/Varg/tree/main/examples/project/jump_jump): salto infinito, centrado en generacion de plataformas, deteccion de aterrizaje, HUD y modo de ayuda.
- [examples/project/fps_arena](https://github.com/viloris-org/Varg/tree/main/examples/project/fps_arena): campo de tiro, centrado en movimiento en primera persona, generacion de objetivos, recarga, feedback de impacto y presion de oleadas.

:::note[Alcance ejecutable actual]
Esta pagina solo cubre capacidades usadas por los ejemplos MVP actuales. `scene.spawn(...)` generico, `Audio.play(...)` basado en recursos, bus de eventos, llamadas a modulos, arrays y diccionarios son direccion objetivo; no los trates como capacidades estables en tutoriales publicos.
:::

## Un bucle de gameplay

La mayoria de scripts de gameplay pequenos y medianos se separan en el mismo bucle:

1. Leer entrada: `Input.value`, `Input.pressed`, `Input.mouseDeltaX`.
2. Actualizar estado: municion, puntuacion, fase, temporizadores, dificultad, si fallo.
3. Cambiar el mundo: mover jugador, generar plataformas o enemigos, destruir objetos recogidos o impactados.
4. Consultar el mundo: distancia al objetivo cercano, si cayo sobre una plataforma, cuan lejos esta el jugador de objetos temporales.
5. Dar feedback: HUD, sonidos, musica, entorno de render.

Al escribir scripts, pon primero estos cinco pasos como comentarios o secciones y luego rellena codigo. Asi el script sigue siendo legible aunque crezca a cientos de lineas.

## Los tags son una interfaz barata con la escena

En el MVP actual de Varg, la forma mas estable de conectar scripts y escena es el tag. Das un tag a un objeto en `.vscene` o al generarlo en runtime, y luego el script consulta objetos cercanos por ese tag.

Si no has usado otros motores, piensa en un tag como una etiqueta pegada al objeto. El script no sabe cuantos `Platform`, `Target` o `Collectible` hay, pero puede preguntar: "a que distancia esta el `Platform` mas cercano?". Ese es el valor de las consultas por tag.

```swift
entity "Player" {
    tag: "Player"
}
```

Tambien da tag al generar objetos en runtime:

```swift
scene.spawnSphere("Training Drone Core", "Target", Vec3(x, y, z), 0.42, "scripts/target_drift.varg")
```

En el script, usa tags para detectar impactos o recogidas:

```swift
let targetDistance: Float = scene.distanceToTag("Target")

if targetDistance <= hitRadius {
    scene.destroyNearestWithTag("Target", hitRadius)
    score += 100
}
```

Consultas comunes:

| API | Escena adecuada |
| --- | --- |
| `scene.distanceToTag("Target")` | Impactos, recogidas, contacto con zonas peligrosas |
| `scene.distanceToTagBounds("Platform")` | Saber cuan lejos estas de la superficie de un objeto |
| `scene.horizontalDistanceToTagBounds("Platform")` | Aterrizaje en plataformas, mirando solo error horizontal |
| `playerDistance()` | Limpiar objetos temporales demasiado lejos del jugador |
| `scene.xOf("Player")` / `scene.yOf(...)` / `scene.zOf(...)` | Camara siguiendo al jugador |

:::tip[Como explicarlo en tutoriales publicos]
No describas tag como el sistema final de consultas ECS. Es mas preciso decir: el MVP actual usa tags como interfaz ligera entre scripts y escena, adecuada para prototipos, tutoriales y gameplay pequeno.
:::

### Como elegir una consulta de distancia

Tres funciones de distancia se confunden facilmente. Elige segun la pregunta:

| Pregunta | API recomendada |
| --- | --- |
| Si el jugador toco un recogible o zona peligrosa | `scene.distanceToTag(...)` |
| Si el jugador esta cerca de la superficie de una plataforma | `scene.distanceToTagBounds(...)` |
| Si la posicion horizontal del jugador cae dentro de la plataforma | `scene.horizontalDistanceToTagBounds(...)` |

Por ejemplo, la deteccion de aterrizaje suele mirar a la vez "huella horizontal" y "altura respecto a la superficie":

```swift
let footprint: Float = scene.horizontalDistanceToTagBounds("Platform")
let surface: Float = scene.distanceToTagBounds("Platform")

if footprint <= 0.18 && surface <= 0.98 {
    landed = true
}
```

Esto es mas estable que mirar solo la distancia al centro. Plataformas grandes, pequenas o largas dan resultados mas razonables.

## Generacion dinamica de objetos

El runtime actual puede generar cajas y esferas. Bastan para cubrir plataformas, objetivos, recogibles, puntos de efecto y puntos de previsualizacion en tutoriales.

```swift
scene.spawnBox(
    "Generated Platform",
    "Platform",
    Vec3(nextSpawnX, 0.0, platformZ),
    Vec3(platformWidth, 0.5, platformDepth),
    "scripts/despawn_far.varg"
)

scene.spawnSphere(
    "Generated Crystal",
    "Collectible",
    Vec3(nextSpawnX, 1.15, platformZ),
    0.35,
    "scripts/despawn_far.varg"
)
```

Lee los parametros en este orden:

| Posicion | Significado |
| --- | --- |
| 1 | Nombre del objeto, util para depurar y mostrar en el editor |
| 2 | Tag, usado despues para consultar y destruir |
| 3 | Coordenadas de mundo |
| 4 | Tamano de caja o radio de esfera |
| 5 | Ruta opcional de script, comun para animacion flotante o limpieza automatica |

Un error comun al generar objetos es "generar sin reciclar". Normalmente montamos un script de limpieza en objetos temporales:

```swift
script DespawnFar {
    @export var maxDistance: Float = 46.0

    func update(_ dt: Float) {
        if playerDistance() > maxDistance {
            entity.destroy()
        }
    }
}
```

Es pequeno, pero evita que la generacion infinita llene la escena.

### Generar no es lanzar al azar

Muchos tutoriales usan generacion aleatoria directa, pero al empezar es mejor usar "variacion determinista". Significa que cada ejecucion se parece bastante, y eso ayuda a saber si el problema es la regla o la suerte.

```swift
let lane: Float = spawnIndex - floor(spawnIndex / 4.0) * 4.0
let wobble: Float = sin(spawnIndex * 1.7) * 0.9
let x: Float = spawnIndex * segmentLength
let z: Float = -3.0 + lane * 2.0 + wobble
```

`spawnIndex` funciona como un numero de serie. Los objetos 0, 1 y 2 aparecen en lugares distintos. `sin()` da ondulacion para que no parezca una rejilla mecanica.

### Cuando montar scripts

El ultimo parametro de `spawnBox` / `spawnSphere` puede montar un script en el objeto generado. Usos comunes:

| Objeto generado | Script adecuado |
| --- | --- |
| Plataformas, balas o efectos detras del jugador | Limpieza automatica |
| Recogibles, objetivos, esferas de pista | Flotacion o rotacion |
| Zonas peligrosas temporales | Destruccion tras cuenta atras |

Para tutoriales iniciales basta con montar limpieza automatica. Cuando el gameplay necesite mas feedback, anade flotacion, parpadeo o sonido.

## Entrada en primera persona

El control en primera persona se compone de dos partes: el script del jugador actualiza yaw, o el script de camara lee el raton y asigna rotation. En tutoriales publicos conviene empezar con la version de camara porque su responsabilidad es mas simple.

```swift
script FirstPersonCamera {
    @export var eyeHeight: Float = 0.65
    @export var mouseSensitivity: Float = 0.08
    @export var minPitch: Float = -36.0
    @export var maxPitch: Float = 18.0

    var yaw: Float = -34.0
    var pitch: Float = -9.0
    var mouseCaptured: Bool = true

    func start() {
        Input.captureMouse(mouseCaptured)
    }

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

        position.x = scene.xOf("Player")
        position.y = scene.yOf("Player") + eyeHeight
        position.z = scene.zOf("Player")
        rotation = Vec3(pitch, yaw, 0.0)
    }
}
```

El script muestra dos buenos habitos:

- La camara sigue al jugador con `scene.xOf("Player")`, sin copiar la logica de movimiento.
- `pitch` se limita con `clamp` para que la vista no se voltee.

### Que son yaw y pitch

Si no tienes experiencia 3D, recuerda esto:

| Nombre | Direccion |
| --- | --- |
| `yaw` | Girar la cabeza izquierda/derecha |
| `pitch` | Mirar arriba/abajo |
| `rotation = Vec3(pitch, yaw, 0.0)` | Orientar la camara a esa direccion |

El movimiento horizontal del raton suele cambiar `yaw`, y el vertical cambia `pitch`. `pitch` debe limitarse porque una cabeza no gira infinitamente hacia atras.

El movimiento en primera persona convierte `yaw` en direccion frontal:

```swift
let yawRad: Float = yaw * 0.01745329
let forwardX: Float = 0.0 - sin(yawRad)
let forwardZ: Float = cos(yawRad)
```

`0.01745329` es una aproximacion para convertir grados a radianes. No necesitas entender trigonometria primero; aqui `sin/cos` convierten "a cuantos grados mira" en "hacia donde caminar".

## El HUD es parte del feedback de gameplay

El HUD no es decoracion. Le dice al jugador objetivo actual, municion, estado, riesgo, combo y causa de fallo. El MVP de Varg permite emitir comandos UI simples cada frame:

```swift
ui.rect("hud_panel", 12.0, 12.0, 340.0, 154.0, 0.03, 0.04, 0.06, 0.86)
ui.label("hud_score", "Score: " + score, 24.0, 42.0)
ui.label("hud_status", status, 24.0, 84.0)
```

Las barras de progreso tambien son rectangulos:

```swift
let chargeWidth: Float = 160.0 * clamp(charge / maxCharge, 0.0, 1.0)

ui.rect("charge_bg", 24.0, 128.0, 160.0, 10.0, 0.18, 0.2, 0.24, 1.0)
ui.rect("charge_fill", 24.0, 128.0, chargeWidth, 10.0, 0.34, 0.75, 0.92, 1.0)
```

Los controles interactivos pueden devolver directamente un nuevo valor:

```swift
assistMode = ui.toggle("assist_toggle", assistMode, 282.0, 112.0, 48.0, 24.0)
```

UI adecuada para explicar primero en tutoriales publicos:

| API | Uso |
| --- | --- |
| `ui.label(...)` | Texto |
| `ui.rect(...)` | Paneles, barras de vida, barras de progreso |
| `ui.toggle(...)` | Interruptores, por ejemplo modo de ayuda |
| `ui.slider(...)` | Valores de depuracion, por ejemplo dificultad o volumen |
| `ui.button(...)` | Menus o reinicio |

### El HUD debe mostrar primero informacion de decision

No te apresures a crear una interfaz bonita. Pregunta primero: que necesita saber el jugador en el siguiente segundo?

| Gameplay | El HUD deberia mostrar primero |
| --- | --- |
| Minijuego de recogida | Puntuacion, tiempo restante, si termino |
| Juego de salto | Carga, estado, puntuacion, si la ayuda esta activa |
| Campo de tiro | Municion, estado de recarga, cuenta atras, progreso de objetivos |

Si una informacion no afecta decisiones del jugador, puede esperar. Asi el HUD no se convierte en una montana de numeros.

### La UI de depuracion tambien ayuda

`ui.slider` y `ui.toggle` no son solo para jugadores; tambien sirven para depurar:

```swift
difficulty = ui.slider("debug_difficulty", difficulty, 0.0, 1.0, 24.0, 148.0, 180.0)
assistMode = ui.toggle("debug_assist", assistMode, 220.0, 148.0, 48.0, 24.0)
```

Asi puedes ajustar dificultad, velocidad o modo de ayuda mientras juegas, sin reiniciar tras cada cambio.

## Empieza el sonido con tones procedurales

Un proyecto de tutorial no necesita introducir una pipeline de audio externa desde el principio. Los tones procedurales bastan para expresar exito, fallo, recarga, impacto o subida de combo.

```swift
Audio.playTone("square", 220.0, 0.08, 0.14)
Audio.playTone3D("triangle", 880.0 + combo * 18.0, 0.12, 0.34)
```

La musica en bucle tambien puede usar pattern:

```swift
if !musicStarted {
    Audio.startLoop("main_loop", "triangle", "C4 E4 G4 R E4 G4 B4 R", 132.0, 0.5, 0.12)
    musicStarted = true
}

if gameOver {
    Audio.stopLoop("main_loop")
    musicStarted = false
}
```

`R` es silencio. Formas de onda comunes: `"sine"`, `"square"`, `"triangle"`, `"saw"`, `"noise"`.

### Sonidos distintos para eventos distintos

El sonido no tiene que ser complejo, pero si distinguible:

| Evento | Sensacion recomendada |
| --- | --- |
| Recogida exitosa | Corto, alto, limpio |
| Fallo | Bajo, aspero, algo mas largo |
| Recarga | Medio-bajo, como feedback mecanico |
| Combo | Tono que sube gradualmente |

Ejemplo:

```swift
Audio.playTone("triangle", 860.0, 0.08, 0.25)
Audio.playTone("noise", 120.0, 0.18, 0.28)
Audio.playTone("square", 220.0, 0.08, 0.14)
Audio.playTone3D("sine", 760.0 + combo * 18.0, 0.04, 0.22)
```

Primero da feedback claro a cada evento; despues piensa en recursos de audio reales.

## Separa inicializacion y actualizacion dinamica en render

La iluminacion global normalmente solo necesita inicializarse una vez:

```swift
if !renderReady {
    render.gi.useScreenSpace()
    render.gi.useProbeVolume(Vec3(10.0, 3.5, 7.0), Vec3(42.0, 12.0, 26.0), Vec3(5.0, 3.0, 4.0), giIntensity)
    render.gi.setIntensity(giIntensity)
    renderReady = true
}
```

La intensidad que cambia con dificultad puede actualizarse cada frame:

```swift
render.gi.setIntensity(giIntensity + difficulty * 0.35)
```

En tutoriales publicos puedes llamarlo "configuracion una vez + modulacion por frame". Es facil trasladarlo a otros sistemas.

### Cuando necesitas la API de render

La API de render no es necesaria para scripts iniciales. Encaja cuando las reglas ya funcionan y quieres reforzar ambiente y feedback.

| Necesidad | Puedes usar |
| --- | --- |
| Escena global mas clara u oscura | `render.gi.setIntensity(...)` |
| Prototipo con iluminacion rapida en capas | `render.gi.useScreenSpace()` |
| Zona fija que necesita GI mas estable | `render.gi.useProbeVolume(...)` |

En tutoriales conviene poner render en la seccion de "mejorar feedback", no en el primer paso. Si no, el lector se atasca en conceptos graficos antes de entender movimiento, estado y deteccion.

## Checklist minimo para un tutorial publico

Al escribir tutoriales avanzados para jugadores o creadores, cubre al menos:

| Elemento | Por que importa |
| --- | --- |
| Resultado final | El lector sabe que va a construir |
| Entrada y controles | El lector puede probar enseguida |
| Lista de archivos | El lector sabe que archivos mirar |
| Tabla de estado | El lector entiende por que el script necesita esas variables |
| Bucle principal | Explica que pasa cada frame, no solo pega codigo |
| Fallo y feedback | La sensacion de juego viene del feedback, no solo de reglas |
| Tareas de extension | Permite que el lector continue con su propia version |

En el siguiente capitulo reescribimos dos tutoriales completos de proyecto usando este metodo.
