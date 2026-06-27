---
title: "De basico a avanzado: organizar scripts de gameplay"
description: Tras aprender variables, entrada y flujo de control, usa una estructura estable para convertirlos en scripts de gameplay mantenibles.
---

Despues de aprender variables, `update()`, entrada e `if`, mucha gente se atasca en el mismo sitio: entiende cada pieza, pero no sabe como ponerlas dentro de un script de gameplay real.

Esta pagina cubre esa parte intermedia. No se apresura a explicar APIs avanzadas ni exige crear un proyecto completo de inmediato. El objetivo es uno: aprender a ordenar la "sintaxis basica" en un bucle de gameplay claro.

## Empieza por una regla de juego en una frase

Antes de escribir codigo, no pienses primero en codigo. Escribe la regla en lenguaje humano:

> Cuando el jugador pulsa Fire, dispara; tras disparar entra en cooldown; durante el cooldown no puede disparar de nuevo; el HUD muestra el estado actual.

Esa frase se separa en cuatro tipos de contenido:

| Categoria | Ejemplo | Donde suele ir en el script |
| --- | --- | --- |
| Entrada | Pulsar `Fire` | Leer `Input.pressed(...)` en `update()` |
| Estado | Si esta en cooldown, cuanto queda | `var` en ambito de script |
| Reglas | Solo dispara si puede; vuelve al estar a cero | Condiciones `if` |
| Feedback | Texto de HUD, sonido, log | Tras cambiar reglas |

Esta tabla importa mas que el codigo. Si puedes separar estas cuatro categorias, el script no empieza convertido en una masa.

## Un esqueleto recomendado

Un script inicial de gameplay puede escribirse en este orden:

```swift
script SimpleAction {
    @export var cooldownTime: Float = 0.6

    var cooldown: Float = 0.0
    var status: String = "Ready"

    func start() {
        cooldown = 0.0
        status = "Ready"
    }

    func update(_ dt: Float) {
        // 1. Actualizar estado existente

        // 2. Leer entrada

        // 3. Cambiar estado segun reglas

        // 4. Dar feedback al jugador
    }
}
```

Tambien puedes escribir primero comentarios. No son decoracion: ayudan a ordenar "que pasa cada frame".

## Paso uno: deja que el estado fluya

Cooldowns, cuentas atras y duraciones cambian aunque el jugador no pulse nada. Normalmente se actualizan primero:

```swift
if cooldown > 0.0 {
    cooldown -= dt

    if cooldown <= 0.0 {
        cooldown = 0.0
        status = "Ready"
    }
}
```

Dos detalles:

- `cooldown -= dt` significa que el tiempo baja.
- Al llegar a cero, se fija de nuevo en `0.0`; HUD y condiciones quedan mas limpios.

Muchos principiantes escriben solo `cooldown -= dt` y no tratan el caso menor que 0. A corto plazo funciona, pero despues las condiciones y la visualizacion se vuelven cada vez mas confusas.

## Paso dos: lee la entrada despues

Conviene leer la entrada cerca de donde se usa. No leas un monton de teclas al principio para usarlas muchas lineas despues.

```swift
if Input.pressed("Fire") && cooldown <= 0.0 {
    cooldown = cooldownTime
    status = "Fired"
    Audio.playTone("square", 520.0, 0.05, 0.2)
}
```

Se lee directamente:

1. Si en este frame se acaba de pulsar `Fire`.
2. Y ahora no hay cooldown.
3. Entonces entra en cooldown, cambia el texto de estado y reproduce sonido.

Esta es la forma mas comun de un script de gameplay: la entrada no "hace cosas" directamente, sino que dispara cambios de estado.

## Paso tres: pon el HUD al final

El HUD suele ir al final de `update()` porque muestra el resultado despues de calcular este frame.

```swift
ui.rect("action_panel", 12.0, 12.0, 280.0, 96.0, 0.03, 0.04, 0.06, 0.86)
ui.label("action_status", status, 24.0, 42.0)
ui.label("action_cooldown", "Cooldown: " + cooldown, 24.0, 70.0)
```

Si dibujas el HUD antes de cambiar `status`, el jugador lo vera con un frame de retraso. Regla practica para empezar: primero calcula reglas, al final muestra el resultado.

## Ejemplo completo pequeno

Juntando las partes:

```swift
script SimpleAction {
    @export var cooldownTime: Float = 0.6

    var cooldown: Float = 0.0
    var status: String = "Ready"

    func start() {
        cooldown = 0.0
        status = "Ready"
    }

    func update(_ dt: Float) {
        if cooldown > 0.0 {
            cooldown -= dt

            if cooldown <= 0.0 {
                cooldown = 0.0
                status = "Ready"
            }
        }

        if Input.pressed("Fire") && cooldown <= 0.0 {
            cooldown = cooldownTime
            status = "Fired"
            Audio.playTone("square", 520.0, 0.05, 0.2)
        }

        ui.rect("action_panel", 12.0, 12.0, 280.0, 96.0, 0.03, 0.04, 0.06, 0.86)
        ui.label("action_status", status, 24.0, 42.0)
        ui.label("action_cooldown", "Cooldown: " + cooldown, 24.0, 70.0)
    }
}
```

Es pequeno, pero ya contiene la estructura basica de un script de gameplay completo: parametros, estado, entrada, reglas y feedback.

## Ampliar una accion hasta gameplay

Lo siguiente no es cambiar de estilo, sino anadir mas estado dentro de la misma estructura.

| Gameplay a anadir | Nuevo estado | Nueva regla |
| --- | --- | --- |
| Municion | `ammo` | Resta 1 al disparar; sin municion no dispara |
| Recarga | `reloading`, `reloadTimer` | Tras Interact cuenta atras; al terminar rellena |
| Puntuacion | `score` | Suma al impactar o recoger |
| Cuenta atras | `timeLeft`, `gameOver` | Al llegar a cero detiene entrada |

Por ejemplo, para municion no hay que rehacer el script; solo anadir otra condicion al disparo:

```swift
if Input.pressed("Fire") && cooldown <= 0.0 && ammo > 0 {
    ammo -= 1
    cooldown = cooldownTime
    status = "Fired"
}
```

Si no queda municion, escribe otra regla:

```swift
if Input.pressed("Fire") && ammo <= 0 {
    status = "Empty"
    Audio.playTone("square", 120.0, 0.08, 0.18)
}
```

Asi crecen los scripts de gameplay: no se escribe un sistema enorme de una vez, sino que se anaden pequenos estados y reglas claras.

## Cuando usar `wait()` y cuando usar temporizador

`wait()` encaja con ritmos cortos y aislados:

```swift
canFire = false
wait(fireRate)
canFire = true
```

Pero si durante la espera hay que seguir mostrando HUD, moviendo al jugador, procesando derrota o permitiendo cancelar, usa un temporizador explicito:

```swift
if reloadTimer > 0.0 {
    reloadTimer -= dt
    status = "Reloading"
}
```

Regla practica:

| Caso | Recomendacion |
| --- | --- |
| Solo un ejemplo simple de cooldown | `wait()` puede servir |
| El HUD debe mostrar tiempo restante | Temporizador explicito |
| El jugador puede moverse mientras espera | Temporizador explicito |
| El estado puede cancelarse o interrumpirse | Temporizador explicito |

Los tutoriales de proyectos completos usan sobre todo temporizadores explicitos porque son mas faciles de depurar y de combinar con otros sistemas.

## Como leer scripts largos

Cuando veas un script de gameplay de decenas o cientos de lineas, no lo leas a fuerza desde la primera linea. Busca primero estos bloques:

| Que buscar primero | Que sabras |
| --- | --- |
| `@export var` | Que valores del script se pueden ajustar |
| `var` en ambito de script | Que estados debe recordar |
| `start()` | Que inicializa al empezar |
| Primera mitad de `update()` | Que estados cambian naturalmente cada frame |
| Condiciones de entrada | Que cambios puede activar el jugador |
| HUD y sonidos | Que reglas dan feedback |

Esta lectura conecta directamente con la siguiente pagina sobre APIs avanzadas de runtime. Las APIs avanzadas no son otro mundo; solo ofrecen mas herramientas para pasos como cambiar escena, consultar escena, reproducir sonido y dibujar HUD.

## Siguiente paso

Ahora sabes organizar la sintaxis basica en un script de gameplay. Hay dos caminos:

- Si quieres seguir con APIs: lee [APIs avanzadas de runtime](/es/scripting/advanced-runtime-apis/) para aprender consultas de escena, generacion dinamica, HUD, audio y comandos de render.
- Si prefieres crear primero un pequeno ciclo: sigue [Practica intermedia: crear un bucle de recoleccion jugable](/es/tutorials/first-playable-loop/) para conectar movimiento, recogida, puntuacion, cuenta atras y HUD.
