---
title: Flujo de trabajo del editor
description: Flujo basico del editor Varg desde Hub hasta modo Play.
---

Esta pagina explica "como trabajar despues de abrir el editor", no la arquitectura interna del editor Varg.

Normalmente haras tres cosas en el editor: gestionar proyectos, organizar escenas y entrar en modo Play para validar scripts. Los scripts, escenas y recursos siguen siendo archivos normales del proyecto; el editor solo hace que sean mas faciles de ver, modificar y probar.

## Flujo basico

1. Inicia Varg y entra en Hub.
2. Crea un proyecto nuevo o abre un directorio de proyecto existente.
3. Abre una escena y selecciona objetos en Hierarchy.
4. Ajusta posicion, rotacion, escala y parametros de componentes en Inspector.
5. Revisa el layout 3D en Scene View.
6. Pulsa Play para ejecutar fisica y scripts en Game View.
7. Tras Stop, vuelve al estado de edicion y sigue ajustando.

Conviene separar estado de edicion y estado de ejecucion. En edicion modificas archivos de escena; en Play se ejecuta una copia del mundo de runtime. Asi puedes probar scripts sin preocuparte de que una ejecucion fallida estropee la escena.

## Que hace Hub

Hub es la entrada al proyecto. Crea proyectos, abre proyectos y te permite volver a proyectos recientes.

Un proyecto necesita al menos:

- `Varg.toml`: manifiesto del proyecto, declara escena por defecto y directorios de scripts.
- `scenes/`: archivos de escena.
- `scripts/`: scripts `.varg`.
- `assets/`: modelos, texturas, audio y otros recursos.

Si solo quieres ver un proyecto completo, abre directamente un ejemplo:

- [examples/project/jump_jump](https://github.com/viloris-org/Varg/tree/main/examples/project/jump_jump)
- [examples/project/fps_arena](https://github.com/viloris-org/Varg/tree/main/examples/project/fps_arena)

## Componentes comunes

Al principio no hace falta memorizar todos los componentes; reconoce primero estos:

| Componente | Uso |
| --- | --- |
| Camera | Define la vista del juego |
| Light | Iluminacion de la escena |
| MeshRenderer | Muestra un modelo o malla |
| Rigidbody | Participa en la simulacion fisica |
| Collider | Forma de colision |
| Script | Monta un script `.varg` |

Una escena minima ejecutable suele necesitar una Camera, una Light y al menos una entidad con script o interactiva.

## Como entra un script en la escena

Un script no se ejecuta automaticamente; debe montarse en un objeto de escena. Flujo tipico:

1. Crea o importa un archivo `.varg` en el proyecto.
2. Selecciona la entidad objetivo.
3. Anade un componente Script.
4. Vincula el recurso de script, por ejemplo `scripts/player_controller.varg`.
5. Ajusta en Inspector los parametros expuestos por `@export var`.
6. Entra en modo Play para validar el comportamiento.

Ejemplo:

```swift
script JumpPlayer {
    source: "scripts/jump_player.varg"
    maxCharge: 1.25
    jumpScale: 5.0
}
```

Aqui `source` apunta al archivo de script y los campos siguientes sobrescriben parametros exportados del script. Es decir: el script contiene las reglas; Inspector o `.vscene` ajustan los parametros.

## Que mirar en modo Play

Al entrar en Play, confirma primero cuatro cosas:

- Si la entrada llega al script.
- Si la posicion y rotacion de los objetos cambian como esperas.
- Si el HUD o los logs explican el estado actual.
- Si tras Stop se vuelve limpiamente al estado de edicion.

No conectes todos los sistemas al principio. Haz que un objeto se mueva, luego anade colision, UI, audio y generacion. Cuando algo falle, el alcance sera mucho menor.

## Relacion con los archivos

Un proyecto Varg no solo se modifica desde el editor. Puedes ajustar objetos y parametros en el editor o editar directamente los archivos del proyecto.

Reparto habitual:

- `.vscene` escribe estructura de escena, objetos, componentes y montaje de scripts.
- `.varg` escribe logica de runtime: entrada, temporizadores, maquinas de estado y UI.
- `.vasset` escribe registro de recursos y ajustes de importacion.
- `Varg.toml` escribe la entrada del proyecto y la escena por defecto.

El editor es bueno para revisar relaciones espaciales y ajustar parametros; los archivos de texto son buenos para review, copiar ejemplos, cambios masivos y borradores generados por herramientas. No se contradicen: lo importante es que los archivos del proyecto sigan siendo legibles.
