---
title: "Tutorial: Endloses Springen bauen"
description: Zerlege Jump Jumps Gameplay-Loop von Szene, Skriptzustand und Laufzeit-Plattformspawning bis zum HUD.
---

Jump Jump ist ein kleines First-Person-Endlos-Sprungspiel, enthält aber einen vollständigen Gameplay-Loop: Aufladen, Springen, Landung prüfen, Punkte, Niederlage, Wiederholen und ein Level, das sich ständig nach vorn erweitert.

Der Spieler hält Space zum Aufladen und lässt los, um entlang der Blickrichtung zur nächsten Plattform zu springen. Das Skript erzeugt vor dem Spieler neue Plattformen, Sammelobjekte und Gefahrenzonen. Erfolgreiche Landung gibt Punkte; Gefahren oder ein Sprung ins Leere führen zur Niederlage und zum Neustart am nächsten Checkpoint.

Beispielquellcode: [examples/project/jump_jump](https://github.com/viloris-org/Varg/tree/main/examples/project/jump_jump).

:::tip[Wann lesen]
Wenn du gerade die Skript-Grundlagen gelernt hast, kannst du zuerst bis "Schritt vier: Flugkurve schreiben" folgen. Das ergibt bereits einen spielbaren Sprungprototyp. Landungsprüfung, endlose Erzeugung und HUD machen daraus ein vollständiges Minispiel und müssen nicht in einem Stück gelesen werden.
:::

## Vorher solltest du können

- Den Unterschied zwischen `@export var` und normalem `var` verstehen.
- Wissen, dass `start()` initialisiert und `update(_ dt: Float)` jeden Frame läuft.
- `Input.down`, `Input.released` und `position` verwenden können.
- Wissen, dass tag der Name ist, mit dem Skripte Szenenobjekte finden.

Wenn das noch unsicher ist, lies zuerst [Skripting für absolute Anfänger](/de/scripting/programming-primer/), [Skript-Grundlagen](/de/scripting/basics/) und [Lifecycle und Eingabe](/de/scripting/lifecycle-input/). Wenn du zuerst einen kleineren Gameplay-Loop bauen willst, folge [Zwischenübung: Einen spielbaren Sammel-Loop bauen](/de/tutorials/first-playable-loop/).

## Was du lernst

- Wie `.vscene` als Startlevel und `.varg` als Laufzeit-Gameplay zusammenarbeiten.
- Wie man mit `phase` einen einfachen, stabilen Spieler-Zustandsautomaten schreibt.
- Wie man mit `scene.spawnBox` und `scene.spawnSphere` endlos erzeugt.
- Wie tag und Distanzabfragen Landung, Sammeln und Gefahren prüfen.
- Wie man mit `ui.rect`, `ui.label`, `ui.toggle` HUD und Assist-Modus baut.
- Wie prozedurale Sounds und GI-Intensität Gameplay-Feedback verstärken.

Der Umfang dieser Seite ist größer als bei den Syntaxseiten. Teile sie beim Lesen in drei Abschnitte: Schritt eins bis vier macht "kann springen"; Schritt fünf bis sieben macht "kann prüfen und erzeugen"; Schritt acht macht "Spieler versteht, was passiert".

## Fertiges Gameplay

Steuerung:

| Eingabe | Verhalten |
| --- | --- |
| Mausbewegung | Zielrichtung ändern |
| Space halten | Aufladen |
| Space loslassen | Springen |
| WASD | Kleine Abweichung in Sprungrichtung |
| Fire | Maus erneut einfangen |
| Assist toggle | Landepunktvorschau anzeigen |

Gameplay-Loop:

1. Spieler lädt auf einer Plattform auf.
2. Nach Loslassen von Space geht er in die Luftphase.
3. Beim Landen prüft das Skript nächste Plattform, Zielplattform, Gefahr und Sammelobjekt.
4. Erfolg aktualisiert Checkpoint, Punkte, Kombo und Schwierigkeit.
5. Das Skript erzeugt laufend die nächste Plattformgruppe vor dem Spieler.

## Projektstruktur

```txt
jump_jump/
├── Varg.toml
├── scenes/
│   └── jump_jump.vscene
└── scripts/
    ├── jump_player.varg
    ├── first_person_camera.varg
    ├── despawn_far.varg
    └── bobber.varg
```

`Varg.toml` definiert Standardszene und Skriptwurzel:

```toml
name = "Jump Jump"
asset_root = "assets"
script_roots = ["scripts"]
default_scene = "scenes/jump_jump.vscene"
```

Das bedeutet: Wenn die Szene `source: "scripts/jump_player.varg"` schreibt, findet die Laufzeit das Skript im Projekt.

## Schritt eins: Startszene vorbereiten

`.vscene` ist zuständig für "was zu Spielbeginn existiert". Jump Jumps Startszene braucht mindestens:

- Eine Kamera mit `FirstPersonCamera`.
- Ein Spielerobjekt mit tag `Player` und `JumpPlayer`.
- Einige Startplattformen mit tag `Platform` oder `Goal`.
- Licht, damit das Spiel sofort lesbar ist.

Der Mount des Spielerskripts sieht etwa so aus:

```swift
script JumpPlayer {
    source: "scripts/jump_player.varg"
    maxCharge: 1.25
    jumpScale: 5.0
    arcHeight: 3.0
    spawnAhead: 36.0
    segmentLength: 2.9
    routeYaw: -34.0
    giIntensity: 1.35
}
```

Diese Werte überschreiben die `@export var`-Defaults im Skript. Die Skriptfelder in `.vscene` sind also keine Dekoration, sondern der Einstieg für Level-Tuning. Wenn du diese Parameter früh freigibst, musst du später nicht im Code raten.

## Schritt zwei: Spielerzustand definieren

`jump_player.varg` hat viele Variablen, aber du kannst sie gruppiert lesen:

| Gruppe | Beispielvariablen | Zweck |
| --- | --- | --- |
| Tuning | `maxCharge`, `jumpScale`, `arcHeight`, `spawnAhead` | Gameplay-Gefühl einstellen |
| Sprungzustand | `charge`, `phase`, `jumpTime`, `startX`, `targetX` | Aufladen und Luftbewegung steuern |
| Fortschritt | `score`, `bestDistance`, `combo`, `difficulty` | Spielerleistung speichern |
| Erzeugung | `nextSpawnX`, `nextSpawnZ`, `spawnIndex` | Entscheiden, wo die nächsten Plattformen entstehen |
| Feedback | `hudStatus`, `musicStarted`, `renderReady` | UI, Audio und Rendering steuern |
| Fehlererholung | `gameOver`, `checkpointX`, `checkpointZ` | Vom nächsten sicheren Punkt wiederholen |

Variablen zuerst zu gruppieren ist zuverlässiger als von Zeile eins bis zum Ende zu lesen. Zustandsmaschinen werden schwer, wenn Werte verstreut sind und alle gleich wichtig aussehen.

## Schritt drei: Aufladephase schreiben

`phase == 0` bedeutet: Der Spieler steht am Boden und kann aufladen.

```swift
if phase == 0 {
    hudStatus = "Mouse look / hold Space"

    if Input.down("Jump") {
        charge += dt
        if charge > maxCharge {
            charge = maxCharge
        }
        hudStatus = "Release to jump"
    }
}
```

Hier verwenden wir kein `wait()`, weil Aufladen jeden Frame Eingabe und HUD beantworten muss. Solange Space gehalten wird, steigt `charge`; bei der Obergrenze wird auf `maxCharge` geklemmt.

Beim Loslassen von Space speichert das Skript Start- und Zielpunkt und wechselt in die Luftphase:

```swift
if Input.released("Jump") && charge > 0.05 {
    startX = position.x
    startZ = position.z

    let yawRad: Float = aimYaw * 0.01745329
    let forwardX: Float = -sin(yawRad)
    let forwardZ: Float = cos(yawRad)
    let distance: Float = charge * jumpScale

    targetX = position.x + forwardX * distance
    targetZ = position.z + forwardZ * distance

    jumpTime = 0.0
    phase = 1
    hudStatus = "Airborne"
    Audio.playTone3D("sine", 360.0 + charge * 260.0, 0.08, 0.22)
}
```

Der Schlüssel ist: Der Zielpunkt wird erst beim Loslassen festgelegt. Während des Haltens kann der Spieler noch zielen; beim Loslassen berechnet das Skript mit dem aktuellen yaw die Vorwärtsrichtung und wandelt `charge` in Distanz um.

## Schritt vier: Flugkurve schreiben

`phase == 1` bedeutet: Der Spieler fliegt. Die horizontale Position nutzt `lerp`, die Höhe nutzt `sin`.

```swift
if phase == 1 {
    jumpTime += dt * 1.85
    let t: Float = clamp(jumpTime, 0.0, 1.0)

    position.x = lerp(startX, targetX, t)
    position.z = lerp(startZ, targetZ, t)
    position.y = 1.1 + sin(t * 3.14159) * arcHeight
}
```

Warum diese Schreibweise:

- `lerp(start, target, t)` macht horizontale Bewegung stabil und einstellbar.
- `sin(t * pi)` ist am Anfang und Ende 0 und in der Mitte am höchsten, also natürlich sprungförmig.
- `clamp` verhindert, dass `t` über 1 hinausläuft und nach der Landung weiter extrapoliert.

Das ist kein finaler physischer Character Controller, aber ein guter erster Gameplay-Code: erklärbar, einstellbar und sofort spielbar. Wenn die Regeln stehen, kann später ein realistischeres Bewegungsmodell ersetzt werden.

## Schritt fünf: Landung prüfen

Wenn `jumpTime >= 1.0`, prüft das Skript die Landung.

```swift
let platformFootprint: Float = scene.horizontalDistanceToTagBounds("Platform")
let platformSurface: Float = scene.distanceToTagBounds("Platform")
let goalFootprint: Float = scene.horizontalDistanceToTagBounds("Goal")
let goalSurface: Float = scene.distanceToTagBounds("Goal")

var landed: Bool = false

if platformFootprint <= 0.18 && platformSurface <= 0.98 {
    landed = true
}

if goalFootprint <= 0.18 && goalSurface <= 0.98 {
    landed = true
}

if scene.distanceToTag("Hazard") <= 0.9 {
    landed = false
    dangerStreak += 1
}
```

Der wichtige Trick: `horizontalDistanceToTagBounds` prüft den horizontalen Landepunkt, `distanceToTagBounds` prüft die Nähe zur Oberfläche. Nur Mittelpunktdistanz macht große und kleine Plattformen unterschiedlich unberechenbar.

## Schritt sechs: Belohnung, Niederlage und Checkpoint

Nach erfolgreicher Landung werden Punkte und Checkpoint aktualisiert:

```swift
if landed {
    score += 1 + dangerStreak
    combo += 1
    checkpointX = position.x
    checkpointZ = position.z

    if combo > bestCombo {
        bestCombo = combo
    }
}
```

Sammelobjekte sind ebenfalls tag-Abfragen:

```swift
if scene.distanceToTag("Collectible") <= 1.45 {
    score += 10 + combo
    scene.destroyNearestWithTag("Collectible", 1.45)
    Audio.playTone3D("triangle", 880.0 + combo * 18.0, 0.12, 0.34)
    hudStatus = "Crystal +" + (10 + combo)
}
```

Bei Niederlage lade nicht direkt die Szene neu. Setze `gameOver` auf `true`, damit das HUD das Ergebnis anzeigen kann:

```swift
if !landed {
    position.y = -1.2
    gameOver = true
    combo = 0
    Audio.stopLoop("jump_rush_bgm")
    musicStarted = false
    Audio.playTone("noise", 120.0, 0.18, 0.28)
}
```

Beim Neustart wird vom nächsten Checkpoint wiederhergestellt:

```swift
if gameOver && Input.pressed("Jump") {
    charge = 0.0
    phase = 0
    jumpTime = 0.0
    gameOver = false
    position = Vec3(checkpointX, 1.1, checkpointZ)
}
```

## Schritt sieben: Plattformen endlos erzeugen

Die Plattformen stehen nicht alle in der Szene, sondern werden zur Laufzeit vor dem Spieler ergänzt.

```swift
while nextSpawnX < position.x + spawnAhead {
    let lane: Float = spawnIndex - floor(spawnIndex / 4.0) * 4.0
    let wobble: Float = sin(spawnIndex * 1.7) * 0.9
    let platformZ: Float = nextSpawnZ + wobble
    let platformWidth: Float = 2.7 + abs(sin(spawnIndex * 0.9)) * 0.7 - difficulty * 0.65
    let platformDepth: Float = 2.8 - difficulty * 0.45

    scene.spawnBox("Generated Platform", "Platform", Vec3(nextSpawnX, 0.0, platformZ), Vec3(platformWidth, 0.5, platformDepth), "scripts/despawn_far.varg")

    nextSpawnX += segmentLength + difficulty * 0.38
    nextSpawnZ += 0.72 + sin(spawnIndex * 0.6) * 0.25 + difficulty * 0.1
    spawnIndex += 1
}
```

Dieser Generator ist keine zufällige Streuung, sondern "deterministische Variation":

- `spawnIndex` macht jedes Segment reproduzierbar.
- `sin(spawnIndex * n)` variiert Position und Breite.
- `difficulty` macht Plattformen schmaler und Abstände variabler.
- `despawn_far.varg` räumt Objekte hinter dem Spieler auf.

## Schritt acht: HUD und Assist-Modus hinzufügen

Das HUD muss Informationen zeigen, mit denen der Spieler Entscheidungen trifft: Punkte, Distanz, Kombo, Zustand, Risiko und Ladebalken.

```swift
let chargeWidth: Float = 160.0 * clamp(charge / maxCharge, 0.0, 1.0)

ui.rect("jump_hud_panel", 12.0, 12.0, 340.0, 154.0, 0.03, 0.04, 0.06, 0.86)
ui.label("jump_hud_score", "Score: " + score, 24.0, 42.0)
ui.label("jump_hud_distance", "Distance: " + floor(bestDistance), 154.0, 42.0)
ui.label("jump_hud_status", hudStatus, 24.0, 84.0)
ui.rect("jump_hud_charge_bg", 24.0, 128.0, 160.0, 10.0, 0.18, 0.2, 0.24, 1.0)
ui.rect("jump_hud_charge", 24.0, 128.0, chargeWidth, 10.0, 0.34, 0.75, 0.92, 1.0)
```

Assist-Modus wird mit `ui.toggle` gesteuert:

```swift
assistMode = ui.toggle("jump_assist_toggle", assistMode, 282.0, 112.0, 48.0, 24.0)
```

Wenn aktiv, erzeugt er eine temporäre Vorschaukugel:

```swift
if assistMode && ghostCooldown <= 0.0 {
    scene.spawnSphere("Assist Landing Preview", "Assist", Vec3(previewX, 0.78, previewZ), 0.18, "scripts/despawn_far.varg")
    ghostCooldown = 0.18
}
```

Dieser Schritt macht aus "läuft" ein "Spieler kann es lesen". Viele Prototypen scheitern nicht an schlechten Regeln, sondern daran, dass Spieler nicht verstehen, was gerade richtig oder falsch war.

## Häufige Probleme

| Problem | Mögliche Ursache | Lösung |
| --- | --- | --- |
| Auf erzeugten Plattformen kann man nicht landen | tag falsch oder nicht `Platform` / `Goal` verwendet | tags in Erzeugung und Szene prüfen |
| Immer mehr erzeugte Objekte | Kein Cleanup-Skript angehängt | Laufzeitobjekten `scripts/despawn_far.varg` mitgeben |
| Sprungrichtung falsch | yaw-Radiant-Umrechnung oder forward-Richtung falsch | `yaw * 0.01745329` und `-sin/cos` prüfen |
| Ladebalken bewegt sich nicht | `charge` wird nicht über Frames gespeichert | Prüfen, dass `charge` eine `var` im Skript-Scope ist |
| Zustand nach Neustart kaputt | Nur Position zurückgesetzt, nicht phase/timer | Variablen für Fehlererholung gemeinsam zurücksetzen |

## Übungen

1. Füge eine `Bonus`-Plattform hinzu, die bei Landung zusätzliche Zeit gibt.
2. Erlaube `assistMode` nur in den ersten 100 Metern für neue Spieler.
3. Erhöhe die Erzeugungswahrscheinlichkeit von Gefahren mit `difficulty`.
4. Baue mit `ui.slider` ein Debugpanel, um `jumpScale` zur Laufzeit zu ändern.
5. Gib aufeinanderfolgenden perfekten Landungen unterschiedliche Tonhöhen.
