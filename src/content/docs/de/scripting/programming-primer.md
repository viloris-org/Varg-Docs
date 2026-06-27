---
title: Skripting für absolute Anfänger
description: Verstehe Variablen, Funktionen, Bedingungen, Schleifen und Updates pro Frame, bevor du Varg-Syntax lernst.
---

Wenn du noch nie Code geschrieben hast, ist diese Seite das Polster dazwischen. Du musst dir noch keine Syntaxdetails merken; wichtig ist nur die Idee: Ein Skript merkt sich Dinge, trifft Entscheidungen und wiederholt Aufgaben.

Ein Spielskript ist weniger wie ein Aufsatz und eher wie eine Regelkarte:

- Es merkt sich Werte wie Geschwindigkeit, Punkte oder Munition.
- Wenn der Spieler Tasten drückt, verändert es diese Werte nach Regeln.
- Es prüft jeden Frame, ob sich die Figur bewegen soll, ob UI aktualisiert werden muss oder ob das Spiel verloren ist.

## Variablen: Dingen Namen geben

Eine Variable ist ein "Fach mit Namen". In das Fach können Zahlen, Text oder Wahr/Falsch-Zustände.

```swift
var score: Int = 0
var speed: Float = 6.0
var gameOver: Bool = false
var status: String = "Ready"
```

So kannst du es lesen:

| Schreibweise | Menschliche Erklärung |
| --- | --- |
| `score` | Dieses Fach heißt Punktzahl |
| `Int` | Darin liegen Ganzzahlen |
| `0` | Der Anfangswert ist 0 |
| `Bool` | Darin liegt nur true oder false |
| `String` | Darin liegt Text |

Beim Skripten ändern sich Variablen oft:

```swift
score += 1
gameOver = true
status = "You win"
```

Das bedeutet: Punktzahl plus 1, Spielende wird wahr, Statustext wird zu "You win".

## Unterschied zwischen `let` und `var`

`var` ist ein Fach, das sich später ändern kann. `let` ist ein in diesem kleinen Abschnitt berechneter Wert, der nicht mehr geändert werden soll.

```swift
var ammo: Int = 30
ammo -= 1

let moveX: Float = Input.value("MoveX")
```

Faustregel:

- Dinge, die über Frames hinweg gemerkt werden müssen, sind `var` im Skript-Scope.
- Dinge, die nur in diesem Frame kurz berechnet werden, sind `let` in einer Funktion.

## Funktionen: Eine Regel, die ausgeführt wird

Eine Funktion ist ein benannter Regelblock. In Varg sind `start()` und `update(_ dt: Float)` am häufigsten.

```swift
func start() {
    log("game start")
}

func update(_ dt: Float) {
    score += 1
}
```

So kannst du es verstehen:

- `start()`: läuft einmal, wenn das Skript beginnt.
- `update(_ dt: Float)`: läuft jeden Frame.

Die meisten Einsteigerskripte sehen so aus:

```swift
script MyScript {
    var score: Int = 0

    func start() {
        log("ready")
    }

    func update(_ dt: Float) {
        score += 1
    }
}
```

## `dt`: Wie viel Zeit seit dem letzten Frame vergangen ist

Ein Spiel aktualisiert nicht nur einmal pro Sekunde, sondern viele Male pro Sekunde. `dt` bedeutet: wie viel Zeit seit dem letzten Update vergangen ist.

Bei Bewegung multiplizierst du mit `dt`:

```swift
position.x += speed * dt
```

Das heißt: Geschwindigkeit beschreibt Bewegung pro Sekunde, und `dt` macht daraus die Bewegung für diesen Frame. Egal ob die Maschine schneller oder langsamer ist, die Figur bewegt sich relativ stabil.

## Bedingungen: Wenn etwas gilt, tue etwas

`if` drückt Entscheidungen aus.

```swift
if Input.pressed("Fire") {
    ammo -= 1
}
```

Der Satz liest sich direkt so: Wenn in diesem Frame Fire neu gedrückt wurde, verringere die Munition um 1.

Bedingungen können genauer sein:

```swift
if Input.pressed("Fire") && ammo > 0 {
    ammo -= 1
}
```

`&&` bedeutet "und". Der Satz heißt: Nur wenn Fire neu gedrückt wurde und die Munition größer als 0 ist, wird geschossen.

Häufige Prüfungen:

| Schreibweise | Bedeutung |
| --- | --- |
| `ammo > 0` | Munition ist größer als 0 |
| `timer <= 0.0` | Der Timer ist bei null angekommen |
| `!gameOver` | Das Spiel ist noch nicht vorbei |
| `canFire && ammo > 0` | Es darf geschossen werden und Munition ist vorhanden |

## Schleifen: Eine Sache wiederholen

Schleifen wiederholen Aufgaben. Für den Einstieg reichen zwei Arten.

`for` passt, wenn die Anzahl klar ist:

```swift
for i in count(3) {
    log("spawn one")
}
```

`while` passt für "solange die Bedingung noch gilt":

```swift
while timer > 0.0 {
    timer -= dt
}
```

Sei bei `while` besonders vorsichtig: In der Schleife muss die Bedingung eine Chance haben, sich zu ändern. Sonst bleibt das Skript darin hängen.

## Skript-Scope und Funktionsinneres

Variablen, die im `script`, aber außerhalb von Funktionen stehen, existieren mit dem Skript weiter.

```swift
script Counter {
    var score: Int = 0

    func update(_ dt: Float) {
        score += 1
    }
}
```

`score` behält in jedem Frame den Wert aus dem vorherigen Frame.

Variablen in `update()` werden jeden Frame neu erstellt:

```swift
func update(_ dt: Float) {
    var score: Int = 0
    score += 1
}
```

Dieser Code setzt `score` jeden Frame wieder auf 0 und eignet sich deshalb nicht für Gesamtpunkte.

## Diese kleine Karte zuerst merken

Wenn du später ein Varg-Skript siehst, zerlege es zuerst so:

```swift
script Player {
    @export var speed: Float = 6.0
    var score: Int = 0

    func start() {
        log("ready")
    }

    func update(_ dt: Float) {
        let moveX: Float = Input.value("MoveX")
        position.x += moveX * speed * dt
    }
}
```

Block für Block:

| Bereich | Aufgabe |
| --- | --- |
| `script Player` | Das ist eine Skript-Regelkarte namens Player |
| `@export var speed` | Parameter, der in Editor oder Szene eingestellt werden kann |
| `var score` | Zustand, den das Spiel zur Laufzeit merken muss |
| `start()` | Läuft einmal zu Beginn |
| `update()` | Läuft jeden Frame |
| `Input.value` | Liest Eingabe |
| `position.x += ...` | Ändert die Position der Figur |

Wenn du diese Karte verstehst, wird [Skript-Grundlagen](/de/scripting/basics/) deutlich leichter.
