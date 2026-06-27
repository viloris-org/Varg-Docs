---
title: "Von Grundlagen zu Fortgeschritten: Gameplay-Skripte organisieren"
description: Organisiere Variablen, Eingabe und Kontrollfluss nach dem Lernen zuerst mit einer stabilen Struktur zu wartbaren Gameplay-Skripten.
---

Nach Variablen, `update()`, Eingabe und `if` bleiben viele an derselben Stelle hängen: Jeder einzelne Wissenspunkt ist verständlich, aber es ist unklar, wie sie in ein echtes Gameplay-Skript passen.

Diese Seite füllt genau dieses Zwischenstück. Sie springt nicht direkt zu fortgeschrittenen APIs und verlangt kein vollständiges Projekt. Das Ziel ist nur: "Grundsyntax" zu einem klaren Gameplay-Loop ordnen.

## Erst mit einer Gameplay-Regel beginnen

Denke vor dem Skript nicht zuerst an Code. Schreibe die Gameplay-Regel erst in Alltagssprache:

> Wenn der Spieler Fire drückt, wird gefeuert; danach beginnt ein Cooldown; während des Cooldowns kann nicht erneut gefeuert werden; das HUD zeigt den aktuellen Zustand.

Dieser Satz zerfällt in vier Arten von Inhalt:

| Kategorie | Beispiel | Wo im Skript |
| --- | --- | --- |
| Eingabe | `Fire` drücken | In `update()` mit `Input.pressed(...)` lesen |
| Zustand | Ob Cooldown aktiv ist, wie lange er noch läuft | `var` im Skript-Scope |
| Regel | Nur feuern, wenn es erlaubt ist; nach Cooldown wieder bereit | `if`-Bedingungen |
| Feedback | HUD-Text, Soundeffekt, Log | Nach Regeländerungen aktualisieren |

Diese Tabelle ist wichtiger als Code. Solange du diese vier Kategorien trennen kannst, wird das Skript am Anfang nicht zu einem Knäuel.

## Empfohlenes Skriptskelett

Einsteiger-Gameplay-Skripte kannst du zuerst in dieser Reihenfolge schreiben:

```swift
script SimpleAction {
    @export var cooldownTime: Float = 0.6

    var cooldown: Float = 0.0
    var status: String = "Ready"

    func start() {
        cooldown = 0.0
        status = "Ready"
    }

    func update(_ dt: Float) {
        // 1. Aktualisiere vorhandenen Zustand

        // 2. Lies Eingaben

        // 3. Ändere Zustand anhand der Regeln

        // 4. Gib Feedback an den Spieler
    }
}
```

Kommentare zuerst zu schreiben ist in Ordnung. Kommentare sind hier keine Dekoration; sie ordnen, "was pro Frame passiert".

## Schritt eins: Zustand selbst fließen lassen

Zustände wie Cooldown, Countdown oder Dauer ändern sich auch ohne Spielereingabe. Aktualisiere sie normalerweise zuerst:

```swift
if cooldown > 0.0 {
    cooldown -= dt

    if cooldown <= 0.0 {
        cooldown = 0.0
        status = "Ready"
    }
}
```

Zwei Details:

- `cooldown -= dt` lässt Zeit herunterlaufen.
- Beim Erreichen von null wird auf `0.0` geklemmt, damit HUD und Bedingungen sauber bleiben.

Viele Anfänger schreiben nur `cooldown -= dt` und behandeln den negativen Bereich nicht. Kurzfristig läuft es, aber spätere Bedingungen und Anzeigen werden schnell unordentlich.

## Schritt zwei: Dann Eingabe lesen

Eingaben sollten nahe an ihrer Verwendung stehen. Lies nicht am Anfang viele Tasten und benutze sie erst Dutzende Zeilen später.

```swift
if Input.pressed("Fire") && cooldown <= 0.0 {
    cooldown = cooldownTime
    status = "Fired"
    Audio.playTone("square", 520.0, 0.05, 0.2)
}
```

Das liest sich direkt:

1. Wenn in diesem Frame `Fire` neu gedrückt wurde.
2. Und gerade kein Cooldown aktiv ist.
3. Dann Cooldown starten, Statustext ändern und Sound abspielen.

Das ist die häufigste Form von Gameplay-Skripten: Eingabe "tut" nicht direkt etwas, sondern löst Zustandsänderungen aus.

## Schritt drei: HUD ans Ende

HUD steht meist am Ende von `update()`, weil es das Ergebnis dieses Frames anzeigen soll.

```swift
ui.rect("action_panel", 12.0, 12.0, 280.0, 96.0, 0.03, 0.04, 0.06, 0.86)
ui.label("action_status", status, 24.0, 42.0)
ui.label("action_cooldown", "Cooldown: " + cooldown, 24.0, 70.0)
```

Wenn du zuerst das HUD zeichnest und danach `status` änderst, sieht der Spieler den Zustand einen Frame später. Merke dir am Anfang diese Regel: Erst Regeln berechnen, zuletzt Ergebnis anzeigen.

## Vollständiges kleines Beispiel

Zusammengesetzt ergibt das:

```swift
script SimpleAction {
    @export var cooldownTime: Float = 0.6

    var cooldown: Float = 0.0
    var status: String = "Ready"

    func start() {
        cooldown = 0.0
        status = "Ready"
    }

    func update(_ dt: Float) {
        if cooldown > 0.0 {
            cooldown -= dt

            if cooldown <= 0.0 {
                cooldown = 0.0
                status = "Ready"
            }
        }

        if Input.pressed("Fire") && cooldown <= 0.0 {
            cooldown = cooldownTime
            status = "Fired"
            Audio.playTone("square", 520.0, 0.05, 0.2)
        }

        ui.rect("action_panel", 12.0, 12.0, 280.0, 96.0, 0.03, 0.04, 0.06, 0.86)
        ui.label("action_status", status, 24.0, 42.0)
        ui.label("action_cooldown", "Cooldown: " + cooldown, 24.0, 70.0)
    }
}
```

Dieses Skript ist klein, enthält aber die Grundstruktur vollständiger Gameplay-Skripte: Parameter, Zustand, Eingabe, Regeln und Feedback.

## Von einer Aktion zu Gameplay erweitern

Als Nächstes brauchst du keine neue Schreibweise, sondern mehr Zustand in derselben Struktur.

| Gameplay-Idee | Neuer Zustand | Neue Regel |
| --- | --- | --- |
| Munition | `ammo` | Beim Feuern 1 abziehen, ohne Munition nicht feuern |
| Nachladen | `reloading`, `reloadTimer` | Nach Interact Countdown, danach Munition auffüllen |
| Punkte | `score` | Bei Treffer oder Sammeln Punkte erhöhen |
| Countdown | `timeLeft`, `gameOver` | Nach Zeitablauf Eingabe stoppen |

Munition hinzuzufügen erfordert keinen Umbau, sondern nur eine weitere Bedingung:

```swift
if Input.pressed("Fire") && cooldown <= 0.0 && ammo > 0 {
    ammo -= 1
    cooldown = cooldownTime
    status = "Fired"
}
```

Wenn Munition fehlt, schreibe eine zweite Regel:

```swift
if Input.pressed("Fire") && ammo <= 0 {
    status = "Empty"
    Audio.playTone("square", 120.0, 0.08, 0.18)
}
```

So wachsen Gameplay-Skripte: nicht durch ein riesiges System auf einmal, sondern durch klare kleine Zustände und Regeln.

## Wann `wait()`, wann Timer

`wait()` passt für sehr kurze, isolierte Rhythmen:

```swift
canFire = false
wait(fireRate)
canFire = true
```

Wenn während des Wartens HUD angezeigt, der Spieler bewegt, Niederlage geprüft oder Abbruch erlaubt werden muss, verwende einen expliziten Timer:

```swift
if reloadTimer > 0.0 {
    reloadTimer -= dt
    status = "Reloading"
}
```

Faustregel:

| Situation | Empfehlung |
| --- | --- |
| Nur ein einfaches Cooldown-Beispiel | `wait()` ist in Ordnung |
| HUD soll Restzeit anzeigen | Expliziter Timer |
| Spieler kann während des Wartens laufen | Expliziter Timer |
| Zustand kann abgebrochen oder unterbrochen werden | Expliziter Timer |

Vollständige Projekttutorials verwenden meist explizite Timer, weil sie leichter zu debuggen sind und besser mit anderen Systemen zusammenarbeiten.

## Lange Skripte lesen

Wenn du ein Gameplay-Skript mit Dutzenden oder Hunderten Zeilen siehst, lies nicht von oben nach unten. Suche zuerst diese Blöcke:

| Zuerst suchen | Was du erfährst |
| --- | --- |
| `@export var` | Welche Werte das Skript einstellbar macht |
| `var` im Skript-Scope | Welche Zustände es speichern muss |
| `start()` | Welche Initialisierung beim Start passiert |
| Erste Hälfte von `update()` | Welche Zustände pro Frame natürlich laufen |
| Eingabebedingungen | Welche Zustandsänderungen der Spieler auslösen kann |
| HUD und Sound | Welche Regeln Feedback geben |

Diese Lesemethode führt direkt zur nächsten Seite über fortgeschrittene Laufzeit-APIs. Fortgeschrittene APIs sind keine andere Welt; sie liefern nur mehr Werkzeuge für "Szene ändern, Szene abfragen, Sound spielen, HUD zeichnen".

## Nächster Schritt

Jetzt weißt du, wie du Grundsyntax zu Gameplay-Skripten ordnest. Es gibt zwei Wege weiter:

- Wenn du APIs weiterlernen willst: Lies [Fortgeschrittene Laufzeit-APIs](/de/scripting/advanced-runtime-apis/) und lerne Szenenabfragen, dynamische Erzeugung, HUD, Audio und Renderbefehle.
- Wenn du zuerst einen kleinen Loop bauen willst: Folge [Zwischenübung: Einen spielbaren Sammel-Loop bauen](/de/tutorials/first-playable-loop/) und verbinde Bewegung, Einsammeln, Punkte, Countdown und HUD.
