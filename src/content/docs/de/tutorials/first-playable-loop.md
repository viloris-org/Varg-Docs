---
title: "Zwischenübung: Einen spielbaren Sammel-Loop bauen"
description: Übe Bewegung, Timer, Einsammeln, Punkte und HUD zuerst mit einem kleinen Skript, bevor du in vollständige Projekte gehst.
---

Dieses Kapitel liegt zwischen "Syntax lernen" und "vollständiges Projekttutorial". Das Ziel ist klein: ein Mini-Gameplay, in dem man sich bewegen, sammeln, Punkte bekommen und gegen einen Countdown spielen kann.

Du musst keine vollständige Spielarchitektur verstehen. Baue zuerst diesen Loop:

1. Der Spieler bewegt sich mit Pfeiltasten oder WASD.
2. In der Szene gibt es ein `Collectible`.
3. Wenn der Spieler nahe genug ist, bekommt er Punkte.
4. Das HUD zeigt Punkte, Countdown und Zustand.
5. Wenn die Zeit abläuft, stoppt die Punktewertung.

## Vorher solltest du können

- [Skripting für absolute Anfänger](/de/scripting/programming-primer/) gelesen haben.
- Wissen, dass `update(_ dt: Float)` jeden Frame läuft.
- Wissen, dass `position.x` und `position.z` die Objektposition ändern können.
- Wissen, dass tag der Name ist, mit dem Skripte Objekte finden.

## Erst eine minimale Szene vorbereiten

Diese Übung braucht nur zwei Objekte:

| Objekt | Benötigt | Warum |
| --- | --- | --- |
| Spieler | Skript `CollectPlayer` | Eingabe, Timer und Punkte liegen im Spielerskript |
| Sammelobjekt | tag `Collectible` | Das Skript sucht mit diesem tag das nächste Sammelobjekt |

Der Spieler kann eine Box oder Kapsel sein, das Sammelobjekt zunächst eine kleine Kugel. Wichtig ist nicht das Modell, sondern dass die Kette "Objekt nähern -> Punkte -> Objekt löschen" läuft.

Wenn du `.vscene` von Hand schreibst, sieht die Struktur ungefähr so aus:

```swift
entity "Player" {
    tag: "Player"
    position: Vec3(0.0, 0.6, 0.0)

    script CollectPlayer {
        source: "scripts/collect_player.varg"
        speed: 5.0
        roundTime: 30.0
        pickupRadius: 1.4
    }
}

entity "Crystal" {
    tag: "Collectible"
    position: Vec3(2.0, 0.8, 0.0)
}
```

Am leichtesten vertippt man sich bei `Collectible`. Der tag in der Szene und der String im Skript müssen exakt gleich sein, inklusive Groß-/Kleinschreibung. Das Skript fragt `scene.distanceToTag("Collectible")`; in der Szene darf also nicht `collectible` oder `Collectable` stehen.

## Schritt eins: Nur den Spieler bewegen

Baue noch keine Punkte, kein Einsammeln und keine UI. Prüfe zuerst nur, ob der Spieler sich bewegt.

```swift
script CollectPlayer {
    @export var speed: Float = 5.0

    func update(_ dt: Float) {
        let moveX: Float = Input.value("MoveX")
        let moveZ: Float = Input.value("MoveY")

        position.x += moveX * speed * dt
        position.z += moveZ * speed * dt
    }
}
```

Zeile für Zeile:

- `speed` ist die Bewegungsgeschwindigkeit.
- `moveX` ist Eingabe links/rechts.
- `moveZ` ist Eingabe vor/zurück.
- `* dt` macht Bewegung unabhängig von der Framerate.

Führe es bis hier aus. Sobald der Spieler sich bewegt, gehst du weiter.

Wenn der Spieler sich gar nicht bewegt, prüfe zuerst:

| Symptom | Häufige Ursache |
| --- | --- |
| Tasten reagieren nicht | Skript hängt nicht am Spielerobjekt |
| Links/rechts geht, vor/zurück nicht | `MoveY` ist in der Eingabezuordnung nicht konfiguriert, oder die Tasten sind andere als erwartet |
| Bewegung zu schnell oder zu langsam | `speed` passt nicht; probiere zuerst `3.0` bis `6.0` |

Stelle Bewegung erst angenehm ein, bevor du Regeln hinzufügst. Sonst stören Bewegungsprobleme später Punkte, Spawning und HUD.

## Schritt zwei: Countdown hinzufügen

Jetzt bekommt das Gameplay ein Zeitlimit.

```swift
script CollectPlayer {
    @export var speed: Float = 5.0
    @export var roundTime: Float = 30.0

    var timeLeft: Float = 30.0
    var gameOver: Bool = false

    func start() {
        timeLeft = roundTime
    }

    func update(_ dt: Float) {
        if !gameOver {
            timeLeft -= dt

            if timeLeft <= 0.0 {
                timeLeft = 0.0
                gameOver = true
            }
        }

        if !gameOver {
            let moveX: Float = Input.value("MoveX")
            let moveZ: Float = Input.value("MoveY")

            position.x += moveX * speed * dt
            position.z += moveZ * speed * dt
        }
    }
}
```

Zwei neue Zustände:

| Variable | Bedeutung |
| --- | --- |
| `timeLeft` | Wie viele Sekunden noch übrig sind |
| `gameOver` | Ob das Spiel vorbei ist |

`if !gameOver` bedeutet: Nur wenn das Spiel noch nicht vorbei ist, laufen Countdown und Bewegung weiter.

`timeLeft` und `roundTime` sind keine Dopplung:

- `roundTime` ist die einstellbare Startdauer und kann in der Szene geändert werden.
- `timeLeft` ist die Restzeit zur Laufzeit und sinkt jeden Frame.

Viele Anfänger ändern direkt `roundTime -= dt`. Das läuft zwar, macht Debugging aber unangenehm, weil "Standarddauer" und "aktuelle Restzeit" zu einem Wert vermischt werden.

## Schritt drei: Punkte beim Nähern an Sammelobjekt

Das Sammelobjekt in der Szene braucht den tag `Collectible`. Das Skript prüft per Distanz, ob der Spieler nahe ist.

```swift
@export var pickupRadius: Float = 1.4

var score: Int = 0
var status: String = "Collect the crystal"
```

Setze den folgenden Block in `update()` nach die Bewegungslogik:

```swift
if !gameOver {
    let distance: Float = scene.distanceToTag("Collectible")

    if distance <= pickupRadius {
        score += 1
        status = "Collected +" + score
        scene.destroyNearestWithTag("Collectible", pickupRadius)
        Audio.playTone("triangle", 720.0, 0.08, 0.25)
    }
}
```

Der Code tut vier Dinge:

1. Er findet das nächste `Collectible`.
2. Wenn die Distanz klein genug ist, erhöht er die Punkte um 1.
3. Er löscht das nächste Sammelobjekt.
4. Er spielt einen kurzen Soundeffekt.

Es wird noch kein neues Sammelobjekt erzeugt, also kannst du nur einmal sammeln. Das ist gut: Erst soll eine Aktion stabil laufen.

Die Reihenfolge ist hier wichtig:

1. Distanz berechnen.
2. Nur bei ausreichender Nähe Punkte ändern.
3. Nach den Punkten das eingesammelte Objekt löschen.
4. Zuletzt Feedback abspielen.

Wenn du zuerst ein Objekt löschst und danach Position oder Zustand lesen willst, wird die Logik schnell unklar. Für den Einstieg halte dich an: prüfen, Punkte ändern, Szene ändern, Feedback geben.

## Schritt vier: Neues Sammelobjekt erzeugen

Nach dem Einsammeln kannst du weiter vorne eine neue Kugel erzeugen.

Füge zuerst einen Zähler hinzu:

```swift
var spawnIndex: Int = 0
```

Füge danach bei erfolgreichem Einsammeln an:

```swift
let nextX: Float = -4.0 + spawnIndex * 1.7
let nextZ: Float = sin(spawnIndex * 1.3) * 3.0

scene.spawnSphere(
    "Collectible",
    "Collectible",
    Vec3(nextX, 0.8, nextZ),
    0.35,
    ""
)

spawnIndex += 1
```

Hier verwenden wir keinen Zufall, sondern `spawnIndex` und `sin()` für Variation. Vorteil: Jeder Lauf fühlt sich ähnlich an und ist leichter zu debuggen.

`scene.spawnSphere(...)` liest du so:

| Parameter | Wert hier | Zweck |
| --- | --- | --- |
| Objektname | `"Collectible"` | Name im Editor oder Debugging |
| tag | `"Collectible"` | Wird später wieder von `distanceToTag` gefunden |
| Position | `Vec3(nextX, 0.8, nextZ)` | Wo das neue Sammelobjekt entsteht |
| Radius | `0.35` | Kugelgröße |
| Skript | `""` | Hier noch kein Zusatzskript |

Auch der zweite Parameter muss `Collectible` sein. Sonst sieht man die neue Kugel, aber das Skript findet sie beim nächsten Mal nicht, und der Spieler kann sie nicht aufsammeln.

## Schritt fünf: HUD anschließen

Zeige zuletzt die Informationen an, die der Spieler braucht.

```swift
ui.rect("collect_panel", 12.0, 12.0, 300.0, 126.0, 0.03, 0.04, 0.06, 0.86)
ui.label("collect_score", "Score: " + score, 24.0, 42.0)
ui.label("collect_time", "Time: " + floor(timeLeft), 24.0, 70.0)
ui.label("collect_status", status, 24.0, 98.0)
```

Wenn die Zeit abgelaufen ist, kannst du den Hinweis ändern:

```swift
if gameOver {
    status = "Time up"
}
```

HUD wird am besten zuletzt angeschlossen, nicht weil es unwichtig ist, sondern weil es von den vorherigen Zuständen abhängt. Erst `score`, `timeLeft`, `status`; dann anzeigen.

Diese Koordinaten sind Bildschirmkoordinaten, nicht Weltkoordinaten. `ui.label("collect_score", ..., 24.0, 42.0)` zeichnet Text nahe der oberen linken Bildschirmecke; er folgt nicht Spieler oder Sammelobjekt.

## Vollständiges Skript

Zusammen ergibt sich:

```swift
script CollectPlayer {
    @export var speed: Float = 5.0
    @export var roundTime: Float = 30.0
    @export var pickupRadius: Float = 1.4

    var timeLeft: Float = 30.0
    var gameOver: Bool = false
    var score: Int = 0
    var status: String = "Collect the crystal"
    var spawnIndex: Int = 0

    func start() {
        timeLeft = roundTime
    }

    func update(_ dt: Float) {
        if !gameOver {
            timeLeft -= dt

            if timeLeft <= 0.0 {
                timeLeft = 0.0
                gameOver = true
                status = "Time up"
            }
        }

        if !gameOver {
            let moveX: Float = Input.value("MoveX")
            let moveZ: Float = Input.value("MoveY")

            position.x += moveX * speed * dt
            position.z += moveZ * speed * dt

            let distance: Float = scene.distanceToTag("Collectible")

            if distance <= pickupRadius {
                score += 1
                status = "Collected +" + score
                scene.destroyNearestWithTag("Collectible", pickupRadius)
                Audio.playTone("triangle", 720.0, 0.08, 0.25)

                let nextX: Float = -4.0 + spawnIndex * 1.7
                let nextZ: Float = sin(spawnIndex * 1.3) * 3.0

                scene.spawnSphere(
                    "Collectible",
                    "Collectible",
                    Vec3(nextX, 0.8, nextZ),
                    0.35,
                    ""
                )

                spawnIndex += 1
            }
        }

        ui.rect("collect_panel", 12.0, 12.0, 300.0, 126.0, 0.03, 0.04, 0.06, 0.86)
        ui.label("collect_score", "Score: " + score, 24.0, 42.0)
        ui.label("collect_time", "Time: " + floor(timeLeft), 24.0, 70.0)
        ui.label("collect_status", status, 24.0, 98.0)
    }
}
```

## Was du gerade geübt hast

| Fähigkeit | Wo verwendet |
| --- | --- |
| Update pro Frame | Bewegung, Countdown, HUD |
| Persistenter Zustand | `score`, `timeLeft`, `gameOver` |
| Eingabe | `Input.value("MoveX")`, `Input.value("MoveY")` |
| Bedingungen | Zeit bei null, Nähe zu Sammelobjekt |
| Szenenabfrage | `scene.distanceToTag("Collectible")` |
| Dynamische Erzeugung | `scene.spawnSphere(...)` |
| Feedback | `ui.label`, `ui.rect`, `Audio.playTone` |

Das ist die verkleinerte Version eines vollständigen Projekts. Jump Jump und FPS Arena erweitern dieselbe Denkweise nur um mehr Zustand, mehr Objekte und stärkeres Feedback.

## Häufige Probleme

| Problem | Zuerst prüfen |
| --- | --- |
| Nähe zum Sammelobjekt gibt keine Punkte | Ist der tag in der Szene exakt `Collectible`? |
| Nach dem ersten Einsammeln kommt kein nächstes Objekt | Steht `spawnIndex += 1` innerhalb des erfolgreichen `if`? |
| Punkte steigen ununterbrochen | Wird nach dem Einsammeln `scene.destroyNearestWithTag(...)` aufgerufen? |
| Nach Zeitablauf kann man noch laufen | Liegt Bewegungslogik innerhalb von `if !gameOver`? |
| HUD-Zahl ändert sich nicht | Steht `ui.label` in `update()` und nicht nur in `start()`? |

Ändere beim Debuggen nicht viele Dinge auf einmal. Erst Bewegung, dann ein Einsammeln, dann erneutes Erzeugen, zuletzt HUD. Wenn jeder Schritt spielbar ist, lässt sich der nächste Fehler leichter finden.
