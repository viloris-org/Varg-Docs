---
title: Recursos, escenas y archivos declarativos
description: Entiende los limites de responsabilidad de .varg, .vscene, .vmodel y .vasset.
---

Varg planea ofrecer un conjunto de lenguajes de autor con estilo unificado, legibles, modificables y verificables tanto por personas como por IA.

## Roles de archivo

| Extension | Rol | Uso | Turing completo |
| --- | --- | --- | --- |
| `.varg` | Logic file | Scripts, modulos, logica dinamica de gameplay, behavior declarativo | `script` y `module` si; `behavior` no |
| `.vscene` | World file | Escenas, prefabs, composicion de entidades, intencion de layout, declaraciones de replicacion de red | No |
| `.vmodel` | Model authoring file | Construccion procedural o parametrica de modelos | No |
| `.vasset` | Asset file | Registro de recursos, ajustes de importacion, materiales, eventos de audio y dependencias | No |

## Ejemplo de escena `.vscene`

```swift
scene MainScene {
    camera "MainCamera" {
        transform {
            position: Vec3(0, 6, 10)
            rotation: Euler(-30, 0, 0)
        }

        primary: true
    }

    entity "Player" {
        tag: "player"

        transform {
            position: Vec3(0, 1, 0)
        }

        script PlayerController {
            source: "scripts/player_controller.varg"
            speed: 6.0
        }
    }
}
```

El archivo de escena describe "que hay" y "donde esta"; no escribe bucles arbitrarios ni eventos de runtime.

## Escenas con intencion de IA

El diseno de Varg permite que la IA escriba intencion de alto nivel:

```swift
scene ForestCamp {
    intent: "A small night camp in a forest clearing"

    scatter "PineTree" {
        count: 32
        area: ring(inner: 8, outer: 18)
        scale: range(0.8, 1.4)
    }
}
```

Despues las herramientas compilan estos archivos en objetos de escena deterministas. El archivo fuente conserva la intencion del autor, lo que facilita la revision humana y que la IA siga modificandolo.

## Pipeline de recursos

El sistema de recursos de Varg se encarga de:

- Importar glTF, PNG, audio y otros recursos
- Crear base de datos y manifiestos de recursos
- Vigilar cambios de archivos y recargar en caliente
- Copiar recursos y generar `asset-manifest.json` al empaquetar

Cuando un recurso solo necesita registro, ajustes de importacion o parametros de material, ponlo primero en `.vasset`. Solo escribe `.varg` cuando necesites logica de runtime.
