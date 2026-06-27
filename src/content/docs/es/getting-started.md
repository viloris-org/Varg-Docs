---
title: Inicio rapido
description: Instala Varg, inicia el editor y encuentra los proyectos de ejemplo de scripts.
---

## Requisitos previos

Esta pagina resuelve solo dos preguntas: como abrir Varg y donde esta el codigo de ejemplo. No hace falta entender todavia todos los tipos de archivo; si puedes abrir un proyecto y encontrar los scripts, ya puedes pasar al siguiente paso.

Descarga Varg desde GitHub Releases:

- [https://github.com/viloris-org/Varg/releases](https://github.com/viloris-org/Varg/releases)

Si solo quieres probar el editor o ejecutar proyectos de ejemplo, descarga primero los artefactos precompilados del release. El arranque desde codigo fuente que aparece abajo esta pensado para quienes vayan a participar en el desarrollo, depurar el motor o modificar el editor.

Para iniciar el editor desde codigo fuente necesitas:

- Rust 1.96 o superior
- Bun 1.3.14 o superior
- Dependencias del sistema para Tauri v2

Dependencias habituales en Linux:

```sh
sudo apt install libwebkit2gtk-4.1-dev build-essential libssl-dev libayatana-appindicator3-dev librsvg2-dev
```

## Iniciar el editor

Si descargaste el paquete de release, descomprimelo y ejecuta directamente el binario de Varg incluido.

Si lo inicias desde codigo fuente y el repositorio de Varg esta junto al sitio de documentacion en `../Varg`:

```sh
cd ../Varg/editor
bun install
bun run dev:tauri
```

Al arrancar veras la pantalla Hub. Puedes crear o abrir un proyecto, colocar objetos en el editor, anadir componentes y entrar en modo Play para ejecutar fisica y scripts.

Si solo quieres aprender scripting, conviene abrir primero un proyecto de ejemplo en vez de construir una escena completa desde un proyecto vacio. Un proyecto vacio mezcla escena, recursos, montaje de scripts y configuracion de entrada desde el primer momento, y el salto es mayor.

## Donde estan los ejemplos de scripts

Los ejemplos de sintaxis de este manual vienen de `examples/scripts` en el repositorio de Varg:

```txt
examples/scripts/
├── loop_demo.varg
├── particle_system.varg
├── timed_sequence.varg
├── wave_spawner.varg
└── weapon_cooldown.varg
```

Los tutoriales completos usan estos proyectos de ejemplo:

- [examples/project/jump_jump](https://github.com/viloris-org/Varg/tree/main/examples/project/jump_jump)
- [examples/project/fps_arena](https://github.com/viloris-org/Varg/tree/main/examples/project/fps_arena)

No necesitas hacer fork de Varg para leer estos ejemplos. Puedes ver el codigo directamente en GitHub o descargar un release o archivo fuente comprimido y abrirlo localmente.

Orden recomendado:

1. `weapon_cooldown.varg`: parametros exportados, entrada, estado y `wait()`
2. `loop_demo.varg`: bucles, `break`, `continue`, variables locales
3. `wave_spawner.varg`: scripts con varios estados y reparto de ciclo de vida
4. `particle_system.varg`: temporizadores y reinicio por tecla
5. `jump_jump`: generacion de plataformas en runtime, deteccion de aterrizaje, HUD y modo de ayuda. Puedes empezar por la primera mitad del script principal.
6. `fps_arena`: movimiento en primera persona, recarga, generacion de objetivos y feedback de impacto. Tiene mas sistemas, asi que dejalo despues de `jump_jump`.

:::tip[Como leer ejemplos]
Busca primero `@export var`; suelen ser parametros que ajusta el disenador. Luego busca `var`; suelen ser estados que el script recuerda. Al final mira `start()` y `update(_ dt: Float)`. Leer asi es mucho mas comodo que pelear desde la primera linea hasta la ultima.
:::

## Una frase que debes recordar

`.varg` escribe logica de runtime; `.vscene` escribe la estructura de escenas y objetos; `.vasset` registra recursos; `.vmodel` describe modelos generativos. El foco ejecutable actual es el MVP de scripts `.varg`.
