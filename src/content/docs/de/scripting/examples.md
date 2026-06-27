---
title: Beispielanalyse
description: Lerne häufige Skriptmuster aus Varg examples/scripts.
---

Diese Beispiele stammen aus `examples/scripts` im Varg-Repository und können als Vorlagen für eigene Skripte dienen. Vollständigere Schritt-für-Schritt-Tutorials findest du hier:

- [Zwischenübung: Einen spielbaren Sammel-Loop bauen](/de/tutorials/first-playable-loop/)
- [Endloses Springen bauen](/de/tutorials/jump-jump/)
- [Schießstand bauen](/de/tutorials/fps-arena/)

Wenn du noch nicht sicher programmierst, lies Beispiele nicht stur von der ersten bis zur letzten Zeile. Stelle zuerst drei Fragen: Welchen Zustand merkt sich dieses Skript? Was prüft es in `update()` jeden Frame? Was tut der Spieler, damit sich Zustand ändert?

Wenn du diese Lesemethode noch nicht hast, lies zuerst [Von Grundlagen zu Fortgeschritten: Gameplay-Skripte organisieren](/de/scripting/gameplay-loop-patterns/). Diese Seite erklärt gezielt, wie Variablen, Eingabe, Timer und Feedback in dasselbe `update()` passen.

## Waffen-Cooldown

Kerndatei: `weapon_cooldown.varg`

```swift
script WeaponCooldown {
    @export var fireRate: Float = 0.5
    @export var damage: Int = 10

    var canFire: Bool = true
    var ammo: Int = 30

    func update(_ dt: Float) {
        if Input.pressed("Fire") && canFire && ammo > 0 {
            ammo -= 1
            canFire = false
            wait(fireRate)
            canFire = true
        }
    }
}
```

Gelernte Muster:

- Einstellbare Designparameter in `@export var` legen
- Persistenten Zustand für `canFire` und `ammo` verwenden
- Zustandsänderungen durch Eingabeereignisse auslösen
- Eine kurze Pause mit `wait()` ausdrücken

## Partikelzähler

Kerndatei: `particle_system.varg`

```swift
var particlesActive: Int = 0
var timeSinceEmit: Float = 0.0

func update(_ dt: Float) {
    timeSinceEmit += dt

    let emitInterval: Float = 1.0 / emitRate
    while timeSinceEmit >= emitInterval {
        if particlesActive < particleCount {
            particlesActive += 1
        }
        timeSinceEmit -= emitInterval
    }
}
```

Gelernte Muster:

- Mit kumulierter Zeit Frame-Updates in Ereignisse mit fester Frequenz umwandeln
- Mit `while` mehrere mögliche Emissionen innerhalb eines Frames verarbeiten
- Mit Obergrenzen verhindern, dass Zustand den Designbereich überschreitet

## Wave-Spawner

Kerndatei: `wave_spawner.varg`

Dieses Beispiel zerlegt Logik in mehrere Zustände:

| Zustand | Bedeutung |
| --- | --- |
| `currentWave` | Aktuelle Welle |
| `waveTimer` | Restzeit bis zur nächsten Welle |
| `enemiesSpawned` | In der aktuellen Welle bereits erzeugte Gegner |
| `isSpawning` | Ob gerade erzeugt wird |

Wichtiger Ausschnitt:

```swift
if waveTimer <= 0 && !isSpawning {
    currentWave += 1
    isSpawning = true
    enemiesSpawned = 0
    log("Starting wave")
}
```

Das ist typische Zustandsmaschinen-Schreibweise: Eine Bedingung löst einen Zustandswechsel aus, und die folgende Logik läuft anhand des neuen Zustands weiter.

## Schleifendemo

Kerndatei: `loop_demo.varg`

Sie deckt ab:

- `0..3`-Bereichsschleife
- `1..=5`-inklusive Bereichsschleife
- `count(3)`-Zählschleife
- Verschachtelte Schleifen
- `break` und `continue`
- Animationsoverlay mit `sin(Time.time + i)`

Wenn du Batch-Prüfungen, kumulierte Werte oder einfache Animationsabtastung brauchst, kannst du zuerst diese Datei ansehen.

## Vollständige Projektbeispiele

[examples/project/jump_jump](https://github.com/viloris-org/Varg/tree/main/examples/project/jump_jump) und [examples/project/fps_arena](https://github.com/viloris-org/Varg/tree/main/examples/project/fps_arena) gehen über die einfachen examples hinaus:

| Projekt | Schwerpunkt | Empfohlene Datei |
| --- | --- | --- |
| `jump_jump` | First-Person-Ladesprung, Plattformen zur Laufzeit, Landepunktprüfung, Sammelobjekte, HUD, Assist-Modus | `scripts/jump_player.varg` |
| `fps_arena` | First-Person-Bewegung, Munition und Nachladen, Zielspawning, Distanztreffer, Wellendruck, HUD | `scripts/fps_player.varg` |

Wenn einzelne examples zu schlicht wirken, vollständige Projekte aber zu groß sind, mache zuerst [Zwischenübung: Einen spielbaren Sammel-Loop bauen](/de/tutorials/first-playable-loop/). Sie verbindet Bewegung, Einsammeln, Punkte, Timer, Spawning und HUD in einem kleinen Skript und passt genau nach den Syntaxseiten.
