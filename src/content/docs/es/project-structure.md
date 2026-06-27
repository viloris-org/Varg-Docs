---
title: Estructura del proyecto
description: Entiende que hacen Varg.toml, scenes, scripts y assets dentro de un proyecto de juego Varg.
---

Esta pagina habla del proyecto de juego Varg de un creador, no del repositorio de codigo fuente del motor Varg.

Si abres `examples/project/jump_jump` o `examples/project/fps_arena`, veras una estructura parecida:

```txt
my_game/
├── Varg.toml
├── scenes/
│   └── main.vscene
├── scripts/
│   ├── player.varg
│   └── camera.varg
├── assets/
│   ├── models/
│   ├── textures/
│   ├── audio/
│   └── materials/
└── build/
```

Al empezar no necesitas llenar todos los directorios. Un proyecto minimo suele necesitar solo:

```txt
my_game/
├── Varg.toml
├── scenes/
│   └── main.vscene
└── scripts/
    └── player.varg
```

## `Varg.toml`

`Varg.toml` es el manifiesto del proyecto. Le dice al editor y al runtime como se llama el proyecto, donde esta la raiz de recursos, donde buscar scripts y que escena abrir por defecto.

```toml
name = "My Game"
asset_root = "assets"
script_roots = ["scripts"]
default_scene = "scenes/main.vscene"
```

Campos comunes:

| Campo | Funcion |
| --- | --- |
| `name` | Nombre del proyecto, mostrado en el editor o en los artefactos compilados |
| `asset_root` | Directorio de recursos, normalmente `assets` |
| `script_roots` | Directorios de busqueda de scripts, normalmente `["scripts"]` |
| `default_scene` | Escena que se abre por defecto en Play o al empaquetar |

Si una escena contiene `source: "scripts/player.varg"`, el runtime encontrara ese archivo segun la configuracion del proyecto.

## `scenes/`

`scenes/` contiene archivos `.vscene`. Puedes entender un `.vscene` como "que hay en el mundo cuando empieza el juego".

Una escena suele encargarse de:

- Colocar jugador, camara, luces y objetos iniciales.
- Asignar tags a objetos, por ejemplo `Player`, `Platform`, `Collectible`.
- Montar scripts en objetos.
- Sobrescribir valores de ajuste de `@export var`.

Una escena muy pequena podria verse asi:

```swift
entity "Player" {
    tag: "Player"
    position: Vec3(0.0, 0.6, 0.0)

    script PlayerController {
        source: "scripts/player.varg"
        speed: 5.0
    }
}

entity "Camera" {
    position: Vec3(0.0, 2.0, -5.0)
}
```

Regla practica: la escena se encarga de "colocar cosas y ajustar parametros"; el script se encarga de "reglas en runtime".

## `scripts/`

`scripts/` contiene archivos `.varg`. Se encargan de la logica de runtime: movimiento, temporizadores, puntuacion, generacion de objetos, HUD y sonidos.

```txt
scripts/
├── player.varg
├── camera.varg
├── enemy.varg
└── despawn_far.varg
```

Para proyectos iniciales conviene separar por objeto o responsabilidad:

| Script | Encaja con |
| --- | --- |
| `player.varg` | Entrada del jugador, movimiento, vida, puntuacion |
| `camera.varg` | Seguimiento de camara, vista en primera persona |
| `enemy.varg` | Movimiento enemigo, deteccion, impactos |
| `despawn_far.varg` | Limpiar objetos temporales cuando estan demasiado lejos |

No lo dividas demasiado al principio. Mientras una mecanica no funciona todavia, poner la logica principal en un script central facilita depurar. Cuando las reglas esten estables, separa responsabilidades independientes como camara, limpieza o animacion flotante.

## `assets/`

`assets/` contiene recursos del proyecto. Los tutoriales iniciales pueden no usar muchos recursos externos, pero un proyecto real ira anadiendo modelos, texturas, audio y materiales.

```txt
assets/
├── models/
├── textures/
├── audio/
└── materials/
```

Organizacion habitual:

| Directorio | Contenido |
| --- | --- |
| `models/` | Personajes, objetos, modelos de entorno |
| `textures/` | Texturas, iconos, imagenes de UI |
| `audio/` | Efectos y musica |
| `materials/` | Configuracion o recursos relacionados con materiales |

Los proyectos de tutorial suelen empezar con cajas y esferas generadas en runtime para reducir distracciones de recursos. Cuando las reglas de gameplay funcionan, es mas seguro sustituirlas por recursos finales.

## `build/`

`build/` o un directorio de salida similar contiene artefactos de compilacion. No es el lugar principal de edicion.

Normalmente no escribas scripts de gameplay directamente dentro de la salida de build. Los archivos fuente deben vivir en `scripts/`, `scenes/` y `assets/`; despues el proceso de build genera el producto final.

## Como se conecta un archivo con otro

La cadena clave es:

1. `Varg.toml` define la escena por defecto: `default_scene = "scenes/main.vscene"`.
2. `main.vscene` coloca el objeto jugador.
3. El jugador monta un script: `source: "scripts/player.varg"`.
4. `player.varg` lee entrada, mueve al jugador y actualiza el HUD en `update(_ dt: Float)`.

El proyecto no funciona por un archivo aislado, sino por esta cadena de referencias:

```txt
Varg.toml -> scenes/main.vscene -> scripts/player.varg
```

Si tras Play no ocurre nada, revisa primero esta cadena:

| Problema | Comprobacion |
| --- | --- |
| No se abre la escena esperada | Si `default_scene` apunta al `.vscene` correcto |
| El script no se ejecuta | Si el objeto de escena monta el script y si la ruta `source` es correcta |
| La consulta por tag no encuentra objetos | Si el tag en `.vscene` coincide exactamente con la cadena del script |
| Los parametros no surten efecto | Si los nombres de campos del script en la escena coinciden con `@export var` |

## Diferencia con la estructura del codigo fuente del motor

En el repositorio fuente del motor Varg veras directorios como `editor/`, `crates/` y `xtask/`. Esa estructura es para quienes desarrollan el motor y el editor.

Cuando creas un juego, debes fijarte primero en tu propio proyecto:

```txt
Varg.toml
scenes/
scripts/
assets/
```

Los tutoriales posteriores usan este modelo mental de proyecto de usuario. La arquitectura interna de crates solo importa si vas a modificar el editor, el renderizador o el runtime.
