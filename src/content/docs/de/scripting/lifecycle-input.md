---
title: Lifecycle und Eingabe
description: Beherrsche start, update, fixedUpdate und die Input API.
---

## Lifecycle-Funktionen

Lifecycle-Funktionen sind die Stellen, an denen die Engine aktiv anklopft. Du rufst sie nicht selbst auf; nachdem ein Skript an einer Entität hängt, ruft die Laufzeit sie zum passenden Zeitpunkt auf.

Varg-Skripte empfangen Engine-Ereignisse über reservierte Namen:

```swift
func start()
func update(_ dt: Float)
func fixedUpdate(_ dt: Float)
func collisionEnter(_ other: Entity)
func collisionExit(_ other: Entity)
func event(_ name: String, _ data: EventData)
```

Im aktuellen MVP sind diese am häufigsten:

| Funktion | Auslösezeitpunkt | Häufige Verwendung |
| --- | --- | --- |
| `start()` | Skript beginnt zu laufen | Zustand initialisieren, Start-Log ausgeben |
| `update(_ dt: Float)` | Jeder Frame | Eingabe, Bewegung, Timer, Animation |
| `fixedUpdate(_ dt: Float)` | Fester Zeitschritt | Physiknahe Logik, Batch-Prüfungen |

Merke dir am Anfang zuerst `start()` und `update(_ dt: Float)`. Namen wie `collisionEnter` und `event` kannst du als Türen betrachten, die später wichtig werden; du musst sie jetzt noch nicht öffnen.

## Was ist `dt`

`dt` ist die Zeit seit dem letzten Update, üblicherweise in Sekunden gedacht. Wenn du Bewegung mit `dt` multiplizierst, hängt die Geschwindigkeit nicht von der Framerate ab.

```swift
script Mover {
    @export var speed: Float = 3.0

    func update(_ dt: Float) {
        entity.translate(Vec3(speed * dt, 0, 0))
    }
}
```

## Input API

Die Input API hat einige Namen, aber die Frage ist einfach: Wird diese Taste in diesem Frame gehalten, gerade gedrückt, gerade losgelassen, oder welchen Wert hat eine Achse?

Verwende klare Eingabenamen:

```swift
Input.down("Jump")        // In diesem Frame gehalten
Input.pressed("Jump")     // In diesem Frame neu gedrückt
Input.released("Jump")    // In diesem Frame losgelassen
Input.value("MoveX")      // Achseneingabe, oft für Bewegung
Input.mouseDeltaX()       // Horizontale Mausbewegung in diesem Frame
Input.mouseDeltaY()       // Vertikale Mausbewegung in diesem Frame
Input.captureMouse(true)  // Maus einfangen, oft für First-Person-Perspektive
```

## Eingabebeispiel: Bewegung und Sprung

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

Der Sprung wird hier als `position.y += ...` geschrieben, weil das aktuelle MVP `position`-Zuweisung und Komponentenänderung ausdrücklich unterstützt. Eine vollständigere Physikgeschwindigkeits-API gehört zur Zielrichtung; vor der Nutzung ist die tatsächliche Laufzeitimplementierung maßgeblich.

## First-Person-Mauseingabe

Vollständige Beispiele findest du in [jump_jump/scripts/first_person_camera.varg](https://github.com/viloris-org/Varg/tree/main/examples/project/jump_jump/scripts/first_person_camera.varg) und [fps_arena/scripts/fps_camera.varg](https://github.com/viloris-org/Varg/tree/main/examples/project/fps_arena/scripts/fps_camera.varg).

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
