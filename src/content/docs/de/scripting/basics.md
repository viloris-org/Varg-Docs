---
title: Skript-Grundlagen
description: Lerne die Dateifunktion von Varg-Skripten, script-Deklarationen und die Grundstruktur.
---

`.varg` ist Vargs Datei für Laufzeitlogik. Du kannst sie dir zuerst als "Regel an einem Spielobjekt" vorstellen: wann etwas beginnt, was pro Frame passiert und wie auf Spielereingaben reagiert wird.

Wenn du noch keine andere Programmiersprache gelernt hast, lies zuerst [Skripting für absolute Anfänger](/de/scripting/programming-primer/). Diese Seite erklärt Variablen, Funktionen, Bedingungen und Schleifen langsamer.

Die Syntax ähnelt Swift, ist aber nicht Swift; sie ist auf Spielskripte, Module und deklaratives Verhalten ausgerichtet. Am Anfang musst du dich nur um `script` kümmern. Andere Deklarationen kannst du später lesen.

## Top-Level-Deklarationen

`.varg` erlaubt drei Arten von Top-Level-Deklarationen:

| Deklaration | Zweck | Aktuelle Empfehlung |
| --- | --- | --- |
| `script` | Laufzeitlogik, die an Entitäten hängt | Hauptsächlich verwenden |
| `module` | Wiederverwendbarer Code, der von anderen `.varg` importiert wird | Ziel-API, vorsichtig verwenden |
| `behavior` | Deklarativer Behavior Tree oder Zustandsautomat | Ziel-API, noch eher im Entwurf |

Die aktuellen Tutorials konzentrieren sich auf `script`.

:::tip[Drei Dinge zuerst greifen]
Ein Einsteigerskript braucht meist nur drei Blöcke: `@export var` für Editor-Parameter, normale `var` für Laufzeitzustand und `start()` / `update(_ dt: Float)` für die eigentliche Logik. Spätere APIs füllen nur diese Blöcke mit mehr Werkzeugen.
:::

## Minimales Skript

```swift
script HelloVarg {
    func start() {
        log("Hello Varg")
    }
}
```

Erklärung:

- `script HelloVarg` definiert ein Skript, das an eine Entität gehängt werden kann.
- `func start()` ist eine Lifecycle-Funktion und wird beim Start des Skripts aufgerufen.
- `log("...")` gibt eine Literal-Logmeldung aus. Das aktuelle MVP unterstützt Literal-Strings im Log.

## Eine vollständigere Struktur

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

Ein Skript besteht aus drei Arten von Inhalt:

- Exportierte Parameter: `@export var speed`, für Editor- und Level-Tuning.
- Persistenter Zustand: `var jumpsLeft`, bleibt während der Skriptausführung erhalten.
- Lifecycle-Funktionen: `start()`, `update(_ dt: Float)` und ähnliche tragen die eigentliche Logik.

## Grenzen des aktuell ausführbaren MVP

Die folgenden Fähigkeiten kannst du aktuell zuverlässig verwenden. Es sieht nach viel aus; du musst es nicht auswendig lernen. Merke dir nur die Kategorien und schlage die Namen beim Schreiben nach.

Grundsyntax:

- `let`, `var`, `@export var`
- `start`, `update`, `fixedUpdate`
- `if`, `else`, `for`, `while`
- `return`, `break`, `continue`
- `wait(expression)`
- `log("literal message")`

Eingabe und Bewegung:

- `Input.down`, `Input.pressed`, `Input.released`, `Input.value`
- `Input.mouseDeltaX`, `Input.mouseDeltaY`, `Input.captureMouse`
- `position` und `entity.translate(Vec3(...))`

Szenenabfrage und Erzeugung:

- `scene.spawnBox`, `scene.spawnSphere`, `scene.destroyNearestWithTag`
- `scene.distanceToTag`, `scene.distanceToTagBounds`, `scene.horizontalDistanceToTagBounds`
- `scene.xOf`, `scene.yOf`, `scene.zOf`, `playerDistance()`

Feedback-Systeme:

- `Audio.playTone`, `Audio.playTone3D`, `Audio.startLoop`, `Audio.stopLoop`
- `ui.label`, `ui.rect`, `ui.button`, `ui.toggle`, `ui.slider`, `ui.dragX`, `ui.dragY`, `ui.input`
- `render.gi.useScreenSpace`, `render.gi.useProbeVolume`, `render.gi.setIntensity`

Behandle Ziel-APIs vorerst nicht als fertige Laufzeitfähigkeiten. Dazu gehören generisches `scene.spawn(...)`, Events mit `emit(...)`, assetbasiertes `Audio.play(...)`, Arrays, Dictionaries, optional binding und Modulaufrufe. Sie gehören zur Sprachrichtung und sollten vor der Verwendung in Tutorials auf Diagnose oder Implementierungsupdates warten.
