---
title: "Tutorial: Schießstand bauen"
description: Zerlege den Rhythmus von FPS Arena von First-Person-Bewegung, Nachladen, Zielspawning und Treffer-Feedback bis zum HUD.
---

FPS Arena ist ein Schießstand in einer geschlossenen Arena. Es hat keine komplexen Assets und kein vollständiges Waffensystem; es kümmert sich um grundlegendere und wichtigere Dinge: Der Spieler kann sich bewegen, schießen und nachladen, Ziele erscheinen laufend, und der Druck steigt mit der Zeit.

Der Spieler bewegt sich in der Arena, zielt und schießt auf dynamisch erzeugte Drohnenziele. Wenn zu viele Ziele liegen bleiben, sinkt `integrity`; wer genug Ziele beseitigt, gewinnt.

Beispielquellcode: [examples/project/fps_arena](https://github.com/viloris-org/Varg/tree/main/examples/project/fps_arena).

:::note[Leseempfehlung]
Diese Seite ist stärker als Jump Jump eine "Mehrsystem-Synthese": Bewegung, Waffen, Spawning, Sieg/Niederlage und HUD liegen im selben Hauptskript. Beim ersten Lesen reichen Bewegung und Nachladen; Zielspawning und Sieg-/Niederlagedruck kannst du beim zweiten Durchgang nehmen.
:::

## Vorher solltest du können

- Die ersten vier Schritte von [Tutorial: Endloses Springen bauen](/de/tutorials/jump-jump/) gelesen haben oder `phase`, Timer und `position` verstehen.
- Wenn du keine Programmiergrundlagen hast, [Zwischenübung: Einen spielbaren Sammel-Loop bauen](/de/tutorials/first-playable-loop/) gemacht haben.
- Wissen, warum `dt` in Bewegung und Countdown multipliziert wird.
- Wissen, dass tag-Abfragen nicht das finale Ray-System sind, sondern im aktuellen MVP eine praktische Methode für Treffer- und Distanzprüfungen.

## Was du lernst

- Wie man mit yaw, Vorwärtsvektor und Eingabeachsen First-Person-Bewegung baut.
- Wie man Nachladen mit expliziten Timern schreibt, statt sich auf `wait()` zu verlassen.
- Wie man mit Laufzeitobjekten ein komplexes Ziel zusammensetzt.
- Wie man mit tag-Distanz MVP-Treffer prüft.
- Wie mehrere Timer Zielspawning, Countdown und Druckstrafe antreiben.
- Wie HUD, Soundeffekte und Statustext in den Gameplay-Loop eingebunden werden.

## Fertiges Gameplay

Steuerung:

| Eingabe | Verhalten |
| --- | --- |
| WASD | Bewegen |
| Shift | Sprinten |
| Mausbewegung | Zielen |
| Fire | Schießen |
| Interact | Nachladen |
| Esc / Q | Menü oder Beenden, abhängig vom Laufzeit-Host |

Sieg- und Niederlagebedingungen:

- Vor Ende des Countdowns eine vorgegebene Anzahl Ziele beseitigen.
- Wenn zu viele Ziele unbearbeitet bleiben, sinkt `integrity`.
- Zeit bei null oder `integrity` bei null bedeutet Niederlage.

## Projektstruktur

```txt
fps_arena/
├── Varg.toml
├── scenes/
│   └── fps_arena.vscene
└── scripts/
    ├── fps_player.varg
    ├── fps_camera.varg
    ├── target_drift.varg
    ├── drone_part_drift.varg
    └── despawn_far.varg
```

`fps_player.varg` ist das Hauptskript. Die anderen Skripte liefern Kamerafolge, Zielschweben und Laufzeitobjekt-Cleanup.

## Schritt eins: Szene als Trainingsarena

Die Szenendatei ist für statische Inhalte zuständig: Boden, Wände, Licht, Spieler und Kamera. Das Spielerobjekt nutzt den tag `Player`; das Skript nutzt diesen tag für Kamerafolge und Cleanup-Distanz.

Mount des Spielerskripts:

```swift
script FpsPlayer {
    source: "scripts/fps_player.varg"
    moveSpeed: 4.8
    sprintMultiplier: 1.55
    arenaLimitX: 8.5
    arenaLimitZ: 10.5
    fireRate: 0.16
    reloadTime: 1.15
    magazineSize: 24
    hitRadius: 2.35
    spawnAhead: 8.5
    giIntensity: 1.2
}
```

Diese Parameter zeigen, dass es kein Demo mit fest verdrahteten Zahlen sein muss. Bewegungsgeschwindigkeit, Arenagrenzen, Schussradius, Magazingröße, Nachladezeit und GI-Intensität sind Level-Tuning-Punkte. Wenn diese Regler früh sichtbar sind, hast du später beim Balancing Halt.

## Schritt zwei: Skriptzustand ordnen

Die Variablen von `FpsPlayer` lassen sich nach Systemen gruppieren:

| Gruppe | Beispielvariablen | Zweck |
| --- | --- | --- |
| Blick und Bewegung | `yaw`, `moveSpeed`, `arenaLimitX` | Spielersteuerung |
| Waffe | `ammo`, `reserve`, `canFire`, `reloading`, `reloadTimer` | Schießen und Nachladen |
| Zielspawning | `targetTimer`, `targetIndex`, `spawnAhead`, `activeTargets` | Spawning steuern |
| Wertung | `score`, `streak`, `shots`, `hits`, `cleared` | Spielerleistung rückmelden |
| Druck | `roundTimer`, `integrity`, `pressureTimer`, `wave` | Sieg-/Niederlagerhythmus |
| Feedback | `status`, `musicStarted`, `renderReady` | HUD, Audio, Rendering |

Lies zuerst diese Tabelle und dann den Code. So lassen sich "Waffenzustand", "Spawnzustand" und "Sieg-/Niederlagezustand" leichter trennen. Dutzende Variablen sind nicht schlimm; schlimm ist, wenn sie alle wie dieselbe Ebene wirken.

## Schritt drei: First-Person-Bewegung

Der Kern der FPS-Bewegung ist: yaw in Vorwärts- und Rechtsvektor umwandeln, dann mit Eingabeachsen Bewegung zusammensetzen.

```swift
yaw += Input.mouseDeltaX() * 0.08
yaw += Input.value("LookX") * 86.0 * dt

let yawRad: Float = yaw * 0.01745329
let forwardX: Float = 0.0 - sin(yawRad)
let forwardZ: Float = cos(yawRad)
let rightX: Float = cos(yawRad)
let rightZ: Float = sin(yawRad)

var speed: Float = moveSpeed
if Input.down("Sprint") {
    speed = moveSpeed * sprintMultiplier
}

let moveX: Float = Input.value("MoveX")
let moveZ: Float = Input.value("MoveY")
let deltaX: Float = rightX * moveX + forwardX * moveZ
let deltaZ: Float = rightZ * moveX + forwardZ * moveZ

position.x += deltaX * speed * dt
position.z += deltaZ * speed * dt
position.x = clamp(position.x, -arenaLimitX, arenaLimitX)
position.z = clamp(position.z, -arenaLimitZ, arenaLimitZ)
rotation = Vec3(0.0, yaw, 0.0)
```

Diese Zeilen lohnen sich:

- Maus und Controller-look ändern gemeinsam `yaw`.
- `sin/cos` wandeln Winkel in Richtungsvektoren um.
- `MoveX` läuft nach rechts, `MoveY` nach vorn.
- `dt` macht Bewegung framerateunabhängig.
- `clamp` hält den Spieler in der Arena.

## Schritt vier: Feedbacksysteme einmalig initialisieren

Rendering und Musik sollten nicht jeden Frame neu initialisiert werden. Schütze sie mit Bool-Zustand:

```swift
if !renderReady {
    render.gi.useScreenSpace()
    render.gi.useProbeVolume(Vec3(0.0, 2.5, 0.0), Vec3(18.0, 8.0, 22.0), Vec3(4.0, 3.0, 4.0), giIntensity)
    render.gi.setIntensity(giIntensity)
    renderReady = true
}

if !musicStarted {
    Audio.startLoop("fps_arena_pulse", "saw", "C3 R G3 R Bb3 R G3 R", 128.0, 0.42, 0.08)
    musicStarted = true
}
```

Dieses Muster lässt sich auf viele Systeme übertragen: Beim ersten Lauf Umgebung setzen, pro Frame nur wirklich veränderliche Werte aktualisieren. Es verhindert auch, dass Zustände ständig zurückgesetzt werden und du fälschlich Rendering oder Audio verdächtigst.

## Schritt fünf: Waffe und Nachladen

Schießen prüft zuerst Munition:

```swift
func fireWeapon() {
    if ammo <= 0 {
        status = "Empty - reload"
        Audio.playTone("square", 110.0, 0.05, 0.18)
        return
    }

    ammo -= 1
    shots += 1
    canFire = false
    Audio.playTone3D("sine", 760.0 + streak * 12.0, 0.04, 0.22)
}
```

Nachladen nutzt einen expliziten Timer:

```swift
if Input.pressed("Interact") && !reloading && ammo < magazineSize && reserve > 0 {
    reloading = true
    canFire = false
    reloadTimer = reloadTime
    Audio.playTone("square", 220.0, 0.08, 0.14)
}

if reloading {
    reloadTimer -= dt
    status = "Reloading"

    if reloadTimer <= 0.0 {
        let needed: Int = magazineSize - ammo
        if reserve >= needed {
            ammo = magazineSize
            reserve -= needed
        } else {
            ammo += reserve
            reserve = 0
        }

        reloading = false
        canFire = true
        status = "Ready"
    }
}
```

Hier verwenden wir kein `wait(reloadTime)`. Während des Nachladens müssen HUD, Zieldruck, Countdown und Bewegung weiterlaufen; ein expliziter Timer macht "gerade wird nachgeladen" als normalen Zustand für andere Logik sichtbar.

## Schritt sechs: Drohnenziele erzeugen

Ein Ziel ist kein Modellasset, sondern eine Gruppe einfacher Geometrien zur Laufzeit:

```swift
scene.spawnSphere("Training Drone Core", "Target", Vec3(x, y, targetZ), 0.42, "scripts/target_drift.varg")
scene.spawnBox("Training Drone Top Plate", "DronePart", Vec3(x, y + 0.47, targetZ), Vec3(0.92, 0.12, 0.34), "scripts/drone_part_drift.varg")
scene.spawnBox("Training Drone Bottom Plate", "DronePart", Vec3(x, y - 0.47, targetZ), Vec3(0.72, 0.1, 0.28), "scripts/drone_part_drift.varg")
scene.spawnBox("Training Drone Left Wing", "DronePart", Vec3(x - 0.58, y, targetZ), Vec3(0.16, 0.34, 0.76), "scripts/drone_part_drift.varg")
scene.spawnBox("Training Drone Right Wing", "DronePart", Vec3(x + 0.58, y, targetZ), Vec3(0.16, 0.34, 0.76), "scripts/drone_part_drift.varg")
```

Diese Methode ist besonders tutorialfreundlich:

- Keine externen Modellassets nötig.
- Jedes Teil kann ein Schwebeskript bekommen.
- Die Kernkugel nutzt den tag `Target`, dekorative Teile den tag `DronePart`.
- Bei Treffer können Kern und Teile getrennt zerstört werden.

Zielpositionen nutzen `targetIndex` für deterministische Variation:

```swift
let lane: Float = targetIndex - floor(targetIndex / 5.0) * 5.0
let x: Float = -5.6 + lane * 2.8
let z: Float = -1.0 + sin(targetIndex * 1.1) * 5.4
let y: Float = 1.35 + abs(sin(targetIndex * 0.7)) * 1.45
let targetZ: Float = z + spawnAhead
```

Das ist für Unterricht und Debugging besser als reiner Zufall, weil jeder Lauf einen ähnlichen Rhythmus reproduziert.

## Schritt sieben: MVP-Trefferprüfung

Das aktuelle Beispiel verwendet keine Raygun, sondern nähert Treffer über die Distanz zum nächsten `Target` an:

```swift
let targetDistance: Float = scene.distanceToTag("Target")

if targetDistance <= hitRadius {
    hits += 1
    streak += 1
    cleared += 1
    activeTargets -= 1
    score += 100 + streak * 15
    roundTimer += 0.55
    status = "Target down +" + streak

    scene.destroyNearestWithTag("Target", hitRadius)
    scene.destroyNearestWithTag("DronePart", hitRadius + 1.4)
    scene.destroyNearestWithTag("DronePart", hitRadius + 1.4)
    scene.destroyNearestWithTag("DronePart", hitRadius + 1.4)
} else {
    streak = 0
    roundTimer -= 0.65
    status = "Miss - time lost"
}
```

Dieser Code gibt zu, dass er MVP ist: Er ist keine finale Raygun, reicht aber, um Munition, Punkte, Kombo, Zielspawning und Feedback-Rhythmus zu validieren. Bring zuerst den Spiel-Loop zum Laufen und ersetze danach das Treffermodell durch ein feineres.

`destroyNearestWithTag("DronePart", ...)` wird mehrfach aufgerufen, weil die aktuelle API pro Aufruf nur das nächste Objekt zerstört. Mehrere Aufrufe räumen eine Gruppe von Teilen um das Ziel herum auf.

## Schritt acht: Druck mit mehreren Timern erzeugen

Der Schießstand ist keine lineare Zustandsmaschine, sondern mehrere parallele Timer:

```swift
roundTimer -= dt
pressureTimer -= dt
targetTimer -= dt
```

Zielspawning:

```swift
if targetTimer <= 0.0 && !gameOver {
    spawnTarget()
    let spawnDelay: Float = 1.35 - wave * 0.08
    targetTimer = clamp(spawnDelay, 0.45, 1.35)
}
```

Druckstrafe:

```swift
if pressureTimer <= 0.0 && activeTargets > 0 {
    integrity -= 1
    activeTargets -= 1
    streak = 0
    status = "Breach warning"
    Audio.playTone("square", 130.0, 0.08, 0.22)
    pressureTimer = clamp(4.6 - wave * 0.28, 1.6, 4.6)
}
```

Sieg/Niederlage:

```swift
if roundTimer <= 0.0 {
    gameOver = true
    status = "LOCKDOWN - score " + score
}

if cleared >= clearGoal {
    gameOver = true
    score += integrity * 250
    status = "SIM CLEARED - score " + score
}
```

Der Vorteil dieser Struktur ist klare Grenze: Jeder Timer steuert eine Druckart, gemeinsam bilden sie den Spielrhythmus. Beim Debuggen findest du leichter, ob Zielspawning zu schnell oder die Strafe zu hart ist.

## Schritt neun: HUD zeichnen

Wenn du HUD in eine Funktion auslagerst, bleibt der Hauptloop klarer:

```swift
func drawHud() {
    ui.rect("fps_hud_panel", 12.0, 12.0, 382.0, 184.0, 0.02, 0.025, 0.03, 0.86)
    ui.rect("fps_hud_accent", 12.0, 12.0, 4.0, 184.0, 0.95, 0.18, 0.12, 1.0)
    ui.label("fps_title", "FPS Arena", 24.0, 22.0)
    ui.label("fps_score", "Score: " + score, 24.0, 44.0)
    ui.label("fps_timer", "Time: " + roundTimer, 154.0, 44.0)
    ui.label("fps_ammo", "Ammo: " + ammo + " / " + reserve, 24.0, 66.0)
    ui.label("fps_integrity", "Integrity: " + integrity, 154.0, 66.0)
    ui.label("fps_goal", "Cleared: " + cleared + " / " + clearGoal, 24.0, 88.0)
    ui.label("fps_status", status, 24.0, 134.0)
    ui.label("fps_crosshair", "+", 392.0, 292.0)
}
```

HUD sollte vier Fragen beantworten:

- Was ist mein aktuelles Ziel?
- Wie viele Schüsse habe ich noch?
- Wie gut läuft es?
- Warum habe ich gewonnen oder verloren?

Wenn das HUD diese vier Fragen beantwortet, versteht der Spieler dein Gameplay.

## Häufige Probleme

| Problem | Mögliche Ursache | Lösung |
| --- | --- | --- |
| Schüsse treffen nicht | `hitRadius` zu klein oder Ziel-tag nicht `Target` | Erzeugungscode und Skriptparameter prüfen |
| Immer mehr Ziele sammeln sich | `pressureTimer` zu langsam oder Treffer verringert `activeTargets` nicht | Trefferzweig prüfen |
| Munition nach Nachladen falsch | `needed` oder `reserve` falsch berechnet | Erst mit kleinem Magazin testen |
| Spieler läuft aus der Arena | `clamp(position.x/z, ...)` vergessen | Letzte Zeilen der Bewegungslogik prüfen |
| HUD-Werte aktualisieren sich nicht | `drawHud()` wird nicht jeden Frame aufgerufen | Am Ende von `update()` aufrufen |

## Übungen

1. Füge ein `BonusTarget` hinzu, das bei Treffer zusätzliche Zeit gibt.
2. Verkleinere `hitRadius` mit steigender Kombo, um Highscores schwieriger zu machen.
3. Gib Zielen ein Timeout-Cleanup-Skript, das bei verpasstem Treffer Punkte abzieht.
4. Baue mit `ui.slider` ein Debugpanel, um `spawnDelay` zur Laufzeit zu ändern.
5. Zerlege `spawnTarget()` in drei Funktionen: normales Ziel, schnelles Ziel und Highscore-Ziel.
