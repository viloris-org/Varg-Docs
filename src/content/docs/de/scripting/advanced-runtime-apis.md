---
title: Fortgeschrittene Gameplay-Skripte
description: Baue echte spielbare Loops mit Szenenabfragen, dynamischer Erzeugung, HUD, Audio, Maus und Renderbefehlen.
---

Nach der Grundsyntax kannst du lokale Logik wie "Tastendruck bewegt", "Waffen-Cooldown" oder "Timer" schreiben. Ein echtes Spielskript muss mehrere Systeme verbinden: Spielereingabe ändert Zustand, Zustand erzeugt oder zerstört Szenenobjekte, und Szenenobjekte beeinflussen wiederum Punkte, Niederlage, Sound und UI.

Diese Seite ist kein vollständiger API-Index, sondern eine Arbeitsmethode für Gameplay-Skripte. Die Beispiele stammen aus Projekten im Varg-Repository:

- [examples/project/jump_jump](https://github.com/viloris-org/Varg/tree/main/examples/project/jump_jump): Endloses Springen mit Schwerpunkt auf Plattformspawning, Landepunktprüfung, HUD und Assist-Modus.
- [examples/project/fps_arena](https://github.com/viloris-org/Varg/tree/main/examples/project/fps_arena): Schießstand mit Schwerpunkt auf First-Person-Bewegung, Zielspawning, Nachladen, Treffer-Feedback und Wellendruck.

:::note[Aktuell ausführbarer Umfang]
Diese Seite behandelt nur Fähigkeiten, die die aktuellen MVP-Beispiele bereits verwenden. Generisches `scene.spawn(...)`, assetbasiertes `Audio.play(...)`, Event-Bus, Modulaufrufe, Arrays und Dictionaries gehören zur Zielrichtung und sollten in öffentlichen Tutorials nicht als stabil behandelt werden.
:::

## Ein Gameplay-Loop

Die meisten kleinen und mittleren Gameplay-Skripte lassen sich in denselben Loop zerlegen:

1. Eingabe lesen: `Input.value`, `Input.pressed`, `Input.mouseDeltaX`.
2. Zustand aktualisieren: Munition, Punkte, Phase, Timer, Schwierigkeit, Niederlage.
3. Welt ändern: Spieler bewegen, Plattformen oder Gegner erzeugen, eingesammelte oder getroffene Objekte zerstören.
4. Welt abfragen: Distanz zum nächsten Ziel, ob der Spieler auf einer Plattform landet, wie weit temporäre Objekte vom Spieler entfernt sind.
5. Feedback geben: HUD, Soundeffekte, Musik, Renderumgebung.

Schreibe diese fünf Schritte beim Skripten zuerst als Kommentare oder Abschnitte und fülle dann Code ein. So bleibt das Skript auch mit mehreren Hundert Zeilen lesbar.

## Szenen-tags sind eine günstige Schnittstelle

Im aktuellen Varg-MVP sind tags die stabilste Verbindung zwischen Skript und Szene. Du setzt in `.vscene` oder beim Erzeugen zur Laufzeit Tags auf Objekte, und das Skript fragt mit Tags die nächsten Objekte ab.

Wenn du keine andere Engine kennst, stell dir einen tag als Etikett am Objekt vor. Das Skript weiß nicht, wie viele Plattformen, Ziele oder Sammelobjekte in der Szene sind, aber es kann fragen: "Wie weit ist das nächste `Platform` von mir entfernt?" Genau das ist der Wert von tag-Abfragen.

```swift
entity "Player" {
    tag: "Player"
}
```

Auch zur Laufzeit erzeugte Objekte brauchen tags:

```swift
scene.spawnSphere("Training Drone Core", "Target", Vec3(x, y, z), 0.42, "scripts/target_drift.varg")
```

Im Skript nutzt du tags für Treffer oder Einsammeln:

```swift
let targetDistance: Float = scene.distanceToTag("Target")

if targetDistance <= hitRadius {
    scene.destroyNearestWithTag("Target", hitRadius)
    score += 100
}
```

Häufige Abfragen:

| API | Geeignet für |
| --- | --- |
| `scene.distanceToTag("Target")` | Treffer, Einsammeln, Kontakt mit Gefahrenzone |
| `scene.distanceToTagBounds("Platform")` | Prüfen, wie weit eine Objektoberfläche entfernt ist |
| `scene.horizontalDistanceToTagBounds("Platform")` | Plattformlandung, nur horizontaler Fehler |
| `playerDistance()` | Temporäre Objekte entfernen, die zu weit vom Spieler entfernt sind |
| `scene.xOf("Player")` / `scene.yOf(...)` / `scene.zOf(...)` | Kamera folgt dem Spieler |

:::tip[Formulierung in öffentlichen Tutorials]
Beschreibe tags nicht als finales ECS-Abfragesystem. Präziser ist: Das aktuelle MVP nutzt tags als leichte Schnittstelle zwischen Skripten und Szenen, geeignet für Prototypen, Tutorials und kleines Gameplay.
:::

### Welche Distanzabfrage wählen

Die drei Distanzfunktionen sind leicht zu verwechseln. Wähle zuerst nach Frage:

| Frage | Empfohlene API |
| --- | --- |
| Berührt der Spieler Sammelobjekt oder Gefahr? | `scene.distanceToTag(...)` |
| Steht der Spieler nahe an der Plattformoberfläche? | `scene.distanceToTagBounds(...)` |
| Liegt die horizontale Position des Spielers innerhalb der Plattformfläche? | `scene.horizontalDistanceToTagBounds(...)` |

Bei Plattformlandung prüfst du meist gleichzeitig "horizontaler Landepunkt" und "Höhe zur Oberfläche":

```swift
let footprint: Float = scene.horizontalDistanceToTagBounds("Platform")
let surface: Float = scene.distanceToTagBounds("Platform")

if footprint <= 0.18 && surface <= 0.98 {
    landed = true
}
```

Das ist stabiler als nur Mittelpunktdistanz. Große, kleine und lange Plattformen verhalten sich eher plausibel.

## Dynamisch Objekte erzeugen

Die aktuelle Laufzeit kann Boxen und Kugeln erzeugen. Das reicht für Plattformen, Ziele, Sammelobjekte, Effektpunkte, Vorschaupunkte und andere Tutorialszenen.

```swift
scene.spawnBox(
    "Generated Platform",
    "Platform",
    Vec3(nextSpawnX, 0.0, platformZ),
    Vec3(platformWidth, 0.5, platformDepth),
    "scripts/despawn_far.varg"
)

scene.spawnSphere(
    "Generated Crystal",
    "Collectible",
    Vec3(nextSpawnX, 1.15, platformZ),
    0.35,
    "scripts/despawn_far.varg"
)
```

Die Parameter in Reihenfolge:

| Position | Bedeutung |
| --- | --- |
| 1 | Objektname, praktisch für Debugging und Editoranzeige |
| 2 | tag, für spätere Abfragen und Zerstörung |
| 3 | Weltposition |
| 4 | Boxgröße oder Kugelradius |
| 5 | Optionaler Skriptpfad, oft für Schwebanimation oder automatisches Cleanup |

Der häufigste Fehler neuer Nutzer ist "nur erzeugen, nicht aufräumen". Deshalb hängen wir temporären Objekten meist ein Cleanup-Skript an:

```swift
script DespawnFar {
    @export var maxDistance: Float = 46.0

    func update(_ dt: Float) {
        if playerDistance() > maxDistance {
            entity.destroy()
        }
    }
}
```

Dieses Skript ist klein, verhindert aber, dass endlose Erzeugung die Szene füllt.

### Erzeugung ist kein zufälliges Werfen

Viele Tutorials schreiben direkt zufälliges Spawning. Für den Einstieg ist "deterministische Variation" besser. Deterministisch heißt: Jeder Lauf ist ähnlich, damit du Regeln von Zufall unterscheiden kannst.

```swift
let lane: Float = spawnIndex - floor(spawnIndex / 4.0) * 4.0
let wobble: Float = sin(spawnIndex * 1.7) * 0.9
let x: Float = spawnIndex * segmentLength
let z: Float = -3.0 + lane * 2.0 + wobble
```

`spawnIndex` ist wie eine Nummer. Objekt 0, 1 und 2 werden an verschiedene Stellen gesetzt. `sin()` gibt der Position etwas Bewegung, damit sie nicht wie ein starres Raster wirkt.

### Wann Skripte anhängen

Der letzte Parameter von `spawnBox` / `spawnSphere` kann dem erzeugten Objekt ein Skript geben. Häufige Zwecke:

| Erzeugtes Objekt | Passende Skripte |
| --- | --- |
| Plattformen, Projektile, Effektpunkte hinter dem Spieler | Automatisches Cleanup |
| Sammelobjekte, Ziele, Hinweiskugeln | Schwebe- oder Rotationsskript |
| Temporäre Gefahrenzone | Countdown-Zerstörung |

Am Anfang eines Tutorials reicht ein Cleanup-Skript. Wenn das Gameplay stärkeres Feedback braucht, kommen Schweben, Blinken oder Soundskripte dazu.

## First-Person-Eingabe

First-Person-Steuerung besteht aus zwei Teilen: Das Spielerskript aktualisiert yaw, oder das Kameraskript liest die Maus und setzt rotation. Für öffentliche Tutorials ist die Kameraversion zuerst besser, weil ihre Verantwortung sauberer ist.

```swift
script FirstPersonCamera {
    @export var eyeHeight: Float = 0.65
    @export var mouseSensitivity: Float = 0.08
    @export var minPitch: Float = -36.0
    @export var maxPitch: Float = 18.0

    var yaw: Float = -34.0
    var pitch: Float = -9.0
    var mouseCaptured: Bool = true

    func start() {
        Input.captureMouse(mouseCaptured)
    }

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

        position.x = scene.xOf("Player")
        position.y = scene.yOf("Player") + eyeHeight
        position.z = scene.zOf("Player")
        rotation = Vec3(pitch, yaw, 0.0)
    }
}
```

Dieses Skript zeigt zwei gute Gewohnheiten:

- Die Kamera folgt dem Spieler über `scene.xOf("Player")`, ohne Spielerbewegungslogik zu kopieren.
- `pitch` wird mit `clamp` begrenzt, damit die Ansicht nicht umkippt.

### Was yaw und pitch bedeuten

Ohne 3D-Programmiererfahrung merke dir:

| Name | Richtung |
| --- | --- |
| `yaw` | Kopf nach links und rechts drehen |
| `pitch` | Kopf nach oben und unten neigen |
| `rotation = Vec3(pitch, yaw, 0.0)` | Kamera in diese Ausrichtung drehen |

Horizontale Mausbewegung ändert meist `yaw`, vertikale Mausbewegung meist `pitch`. `pitch` braucht Grenzen, weil man den Kopf nicht unbegrenzt nach hinten drehen kann.

First-Person-Bewegung wandelt `yaw` außerdem in eine Vorwärtsrichtung um:

```swift
let yawRad: Float = yaw * 0.01745329
let forwardX: Float = 0.0 - sin(yawRad)
let forwardZ: Float = cos(yawRad)
```

`0.01745329` ist eine Näherung für die Umrechnung von Grad in Radiant. Du musst Trigonometrie nicht zuerst verstehen; hier bedeutet `sin/cos`: "Blickrichtung in Bewegungsrichtung umwandeln".

## HUD ist Teil des Gameplay-Feedbacks

HUD ist nicht nur Dekoration. Es zeigt Ziel, Munition, Zustand, Risiko, Kombo und Niederlagegrund. Das Varg-MVP erlaubt Skripten, pro Frame einfache UI-Befehle auszugeben:

```swift
ui.rect("hud_panel", 12.0, 12.0, 340.0, 154.0, 0.03, 0.04, 0.06, 0.86)
ui.label("hud_score", "Score: " + score, 24.0, 42.0)
ui.label("hud_status", status, 24.0, 84.0)
```

Fortschrittsbalken sind ebenfalls Rechtecke:

```swift
let chargeWidth: Float = 160.0 * clamp(charge / maxCharge, 0.0, 1.0)

ui.rect("charge_bg", 24.0, 128.0, 160.0, 10.0, 0.18, 0.2, 0.24, 1.0)
ui.rect("charge_fill", 24.0, 128.0, chargeWidth, 10.0, 0.34, 0.75, 0.92, 1.0)
```

Interaktive Controls können direkt neue Werte zurückgeben:

```swift
assistMode = ui.toggle("assist_toggle", assistMode, 282.0, 112.0, 48.0, 24.0)
```

Geeignete UI für öffentliche Tutorials:

| API | Zweck |
| --- | --- |
| `ui.label(...)` | Text |
| `ui.rect(...)` | Panel, Lebensbalken, Fortschrittsbalken |
| `ui.toggle(...)` | Schalter, zum Beispiel Assist-Modus |
| `ui.slider(...)` | Debugwert, zum Beispiel Schwierigkeit oder Lautstärke |
| `ui.button(...)` | Menü oder Neustart |

### HUD zeigt zuerst Entscheidungsinformationen

Baue am Anfang kein hübsches Interface. Frage zuerst: Was muss der Spieler in der nächsten Sekunde wissen?

| Gameplay | HUD sollte zuerst anzeigen |
| --- | --- |
| Sammelspiel | Punkte, Restzeit, ob das Spiel vorbei ist |
| Sprungspiel | Ladung, Zustand, Punkte, ob Assist aktiv ist |
| Schießstand | Munition, Nachladestatus, Countdown, Zielfortschritt |

Wenn eine Information keine Entscheidung beeinflusst, kann sie später kommen. So wird das HUD nicht zu einer Zahlenwand.

### Debug-UI ist ebenfalls nützlich

`ui.slider` und `ui.toggle` sind nicht nur für Spieler, sondern auch für Entwickler:

```swift
difficulty = ui.slider("debug_difficulty", difficulty, 0.0, 1.0, 24.0, 148.0, 180.0)
assistMode = ui.toggle("debug_assist", assistMode, 220.0, 148.0, 48.0, 24.0)
```

So kannst du Schwierigkeit, Geschwindigkeit oder Assist-Modus beim Spielen ändern, ohne nach jeder Zahl neu zu starten.

## Soundeffekte zuerst mit prozeduralen tones

Tutorialprojekte müssen nicht sofort eine externe Audiopipeline einführen. Prozedurale tones reichen für "Erfolg", "Fehlschlag", "Nachladen", "Treffer" und "Kombo steigt".

```swift
Audio.playTone("square", 220.0, 0.08, 0.14)
Audio.playTone3D("triangle", 880.0 + combo * 18.0, 0.12, 0.34)
```

Loop-Musik kann ebenfalls ein pattern verwenden:

```swift
if !musicStarted {
    Audio.startLoop("main_loop", "triangle", "C4 E4 G4 R E4 G4 B4 R", 132.0, 0.5, 0.12)
    musicStarted = true
}

if gameOver {
    Audio.stopLoop("main_loop")
    musicStarted = false
}
```

`R` ist eine Pause. Häufige Wellenformen sind `"sine"`, `"square"`, `"triangle"`, `"saw"`, `"noise"`.

### Unterschiedliche Ereignisse brauchen unterschiedliche Sounds

Sound muss nicht komplex sein, aber unterscheidbar:

| Ereignis | Empfohlenes Gefühl |
| --- | --- |
| Sammeln erfolgreich | Kurz, hoch, sauber |
| Niederlage | Tief, rau, etwas länger |
| Nachladen | Mitteltief, wie mechanisches Feedback |
| Kombo | Tonhöhe steigt schrittweise |

Beispiel:

```swift
Audio.playTone("triangle", 860.0, 0.08, 0.25)
Audio.playTone("noise", 120.0, 0.18, 0.28)
Audio.playTone("square", 220.0, 0.08, 0.14)
Audio.playTone3D("sine", 760.0 + combo * 18.0, 0.04, 0.22)
```

Gib erst jedem Ereignis klares Feedback und denke danach über echte Audioassets nach.

## Renderbefehle: Initialisierung und dynamische Updates trennen

Globale Beleuchtungseinstellungen müssen meist nur einmal initialisiert werden:

```swift
if !renderReady {
    render.gi.useScreenSpace()
    render.gi.useProbeVolume(Vec3(10.0, 3.5, 7.0), Vec3(42.0, 12.0, 26.0), Vec3(5.0, 3.0, 4.0), giIntensity)
    render.gi.setIntensity(giIntensity)
    renderReady = true
}
```

Schwierigkeitsabhängige Intensität kann pro Frame aktualisiert werden:

```swift
render.gi.setIntensity(giIntensity + difficulty * 0.35)
```

In öffentlichen Tutorials kannst du dieses Muster "einmalige Konfiguration + Modulation pro Frame" nennen. Leser übertragen es leichter auf andere Systeme.

### Wann Render-API nötig ist

Render-API ist nicht Pflicht für Einsteigerskripte. Sie eignet sich, wenn die Gameplay-Regeln bereits stehen und Atmosphäre oder Feedback verstärkt werden sollen.

| Bedarf | Mögliche API |
| --- | --- |
| Szene insgesamt heller oder dunkler | `render.gi.setIntensity(...)` |
| Prototypszene braucht schnell Lichttiefe | `render.gi.useScreenSpace()` |
| Fester Bereich braucht stabilere GI | `render.gi.useProbeVolume(...)` |

In Tutorials sollte Rendering in ein Kapitel "Feedback verbessern", nicht in den ersten Schritt. Sonst unterbrechen Grafikbegriffe das Verständnis von Bewegung, Zustand und Prüfung.

## Minimale Checkliste für öffentliche Tutorials

Wenn du fortgeschrittene Tutorials für Spieler oder Creators schreibst, erkläre mindestens:

| Punkt | Warum wichtig |
| --- | --- |
| Endergebnis | Leser wissen, was sie bauen |
| Eingabe und Steuerung | Leser können sofort testen |
| Dateiliste | Leser wissen, welche Dateien relevant sind |
| Zustandstabelle | Leser verstehen, warum Variablen nötig sind |
| Hauptloop | Erklärt, was pro Frame passiert, statt nur Code zu zeigen |
| Fehler und Feedback | Spielgefühl entsteht durch Feedback, nicht nur Regeln |
| Erweiterungsaufgaben | Leser können eigene Varianten bauen |

Ab dem nächsten Kapitel schreiben wir mit dieser Methode zwei vollständige Projekttutorials neu.
