---
title: Introduccion al scripting para lectores sin programacion
description: Antes de aprender la sintaxis de Varg, entiende variables, funciones, condiciones, bucles y actualizacion por frame.
---

Si nunca has escrito codigo, esta pagina es un amortiguador. No te apresures a memorizar detalles de sintaxis; solo necesitas entender que "el script recuerda cosas por ti, decide y repite acciones".

Un script de juego no se parece tanto a escribir un articulo; se parece mas a escribir una tarjeta de reglas:

- Primero recuerda algunos valores, como velocidad, puntuacion o municion.
- Cuando el jugador pulsa teclas, cambia esos valores segun reglas.
- En cada frame revisa si el personaje debe moverse, si la UI debe actualizarse o si el juego ha fallado.

## Variables: poner nombre a cosas

Una variable es una "caja con nombre". Dentro puede haber numeros, texto o estados verdadero/falso.

```swift
var score: Int = 0
var speed: Float = 6.0
var gameOver: Bool = false
var status: String = "Ready"
```

Puedes leerlo asi:

| Escritura | Explicacion |
| --- | --- |
| `score` | Esta caja se llama puntuacion |
| `Int` | Dentro hay un entero |
| `0` | El valor inicial es 0 |
| `Bool` | Dentro solo va true o false |
| `String` | Dentro va texto |

Al escribir scripts cambiaras variables con frecuencia:

```swift
score += 1
gameOver = true
status = "You win"
```

Significan: suma 1 a la puntuacion, marca el juego como terminado y cambia el texto de estado a "You win".

## Diferencia entre `let` y `var`

`var` es una caja que cambiara despues. `let` es un valor temporal calculado en este pequeno bloque y que no planeas cambiar.

```swift
var ammo: Int = 30
ammo -= 1

let moveX: Float = Input.value("MoveX")
```

Regla practica:

- Lo que debe recordarse entre frames usa `var` en el ambito del script.
- Lo que solo se calcula temporalmente en este frame usa `let` dentro de la funcion.

## Funciones: una regla que se ejecuta

Una funcion es una regla con nombre. En Varg las mas comunes son `start()` y `update(_ dt: Float)`.

```swift
func start() {
    log("game start")
}

func update(_ dt: Float) {
    score += 1
}
```

Puedes entenderlas asi:

- `start()`: se ejecuta una vez cuando empieza el script.
- `update(_ dt: Float)`: se ejecuta cada frame.

La mayoria de scripts iniciales se parecen a esto:

```swift
script MyScript {
    var score: Int = 0

    func start() {
        log("ready")
    }

    func update(_ dt: Float) {
        score += 1
    }
}
```

## `dt`: cuanto ha pasado en este frame

Un juego no se actualiza solo una vez por segundo, sino muchas. `dt` significa "cuanto tiempo paso desde la actualizacion anterior".

Al mover, multiplica por `dt`:

```swift
position.x += speed * dt
```

Esto significa: la velocidad indica cuanto se mueve por segundo, y `dt` lo convierte en cuanto debe moverse este frame. La velocidad del personaje se mantiene bastante estable aunque la maquina sea mas rapida o lenta.

## Condiciones: si pasa algo, haz algo

`if` expresa decisiones.

```swift
if Input.pressed("Fire") {
    ammo -= 1
}
```

Se puede leer directamente: si en este frame se acaba de pulsar Fire, resta 1 a la municion.

La condicion puede ser mas concreta:

```swift
if Input.pressed("Fire") && ammo > 0 {
    ammo -= 1
}
```

`&&` significa "y". Esta frase dice: solo dispara si se acaba de pulsar Fire y la municion es mayor que 0.

Comparaciones comunes:

| Escritura | Significado |
| --- | --- |
| `ammo > 0` | La municion es mayor que 0 |
| `timer <= 0.0` | El temporizador llego a cero |
| `!gameOver` | El juego no ha terminado |
| `canFire && ammo > 0` | Se puede disparar y queda municion |

## Bucles: repetir una accion

Los bucles repiten acciones. Al empezar, reconoce dos tipos.

`for` sirve cuando el numero de repeticiones esta claro:

```swift
for i in count(3) {
    log("spawn one")
}
```

`while` sirve para "seguir mientras se cumpla una condicion":

```swift
while timer > 0.0 {
    timer -= dt
}
```

Ten cuidado con `while`: dentro del bucle la condicion debe tener oportunidad de cambiar. Si no, el script se queda atrapado.

## Ambito del script y dentro de funciones

Las variables escritas dentro de `script` pero fuera de funciones viven junto al script.

```swift
script Counter {
    var score: Int = 0

    func update(_ dt: Float) {
        score += 1
    }
}
```

`score` conserva el valor del frame anterior.

Las variables escritas dentro de `update()` se crean de nuevo cada frame:

```swift
func update(_ dt: Float) {
    var score: Int = 0
    score += 1
}
```

Este codigo vuelve a poner `score` en 0 cada frame, asi que no sirve para registrar la puntuacion total.

## Memoriza este pequeno mapa

Cuando veas scripts Varg, puedes separarlos asi:

```swift
script Player {
    @export var speed: Float = 6.0
    var score: Int = 0

    func start() {
        log("ready")
    }

    func update(_ dt: Float) {
        let moveX: Float = Input.value("MoveX")
        position.x += moveX * speed * dt
    }
}
```

Lee por bloques:

| Zona | Responsabilidad |
| --- | --- |
| `script Player` | Esta es una tarjeta de reglas llamada Player |
| `@export var speed` | Parametro ajustable en editor o escena |
| `var score` | Estado que el juego debe recordar en runtime |
| `start()` | Se ejecuta una vez al empezar |
| `update()` | Se ejecuta cada frame |
| `Input.value` | Lee entrada |
| `position.x += ...` | Cambia la posicion del personaje |

Cuando entiendas este mapa, leer [Conceptos basicos de scripting](/es/scripting/basics/) sera mucho mas facil.
