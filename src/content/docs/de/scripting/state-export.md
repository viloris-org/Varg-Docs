---
title: Zustand, Variablen und Export
description: Trenne einstellbare Parameter, persistenten Zustand und lokale Variablen.
---

Varg-Skripte betonen explizite Absicht. An der Position einer Variablendeklaration solltest du erkennen können, ob sie Konfiguration, Zustand oder temporärer Rechenwert ist.

Wenn du keine Programmiererfahrung hast, stell dir Variablen zuerst als "kleines Notizbuch des Skripts" vor. Manche Einträge darf der Levelautor ändern, manche merkt sich das Skript selbst, und manche werden nur in diesem Frame kurz berechnet.

## Drei Arten von Variablen

| Schreibweise | Lebensdauer | Zweck |
| --- | --- | --- |
| `@export var` | Bleibt mit dem Skript bestehen, im Editor einstellbar | Geschwindigkeit, Schaden, Cooldown, Anzahl |
| `var` im Skript-Scope | Bleibt mit dem Skript bestehen | Munition, Timer, Phase, Initialisierungsstatus |
| `let` / `var` in Funktionen | Gilt nur in diesem Funktionsaufruf | Temporäre Berechnung, Schleifenzähler, lokales Ergebnis |

## Exportierte Parameter

Exportierte Parameter sind "Regler von außen". Zum Beispiel Bewegungsgeschwindigkeit, Schaden oder Cooldown. Sie sind meist nicht Zustand, den der Spieler zur Laufzeit selbst verändert, sondern Werte, die Creators beim Feintuning ändern.

```swift
script WeaponCooldown {
    @export var fireRate: Float = 0.5
    @export var damage: Int = 10

    var canFire: Bool = true
    var ammo: Int = 30
}
```

`fireRate` und `damage` sind Parameter für Designer oder Levelautoren. `canFire` und `ammo` sind interne Laufzeitzustände.

## Persistenter Zustand

Persistenter Zustand sind "Dinge, die das Skript selbst merkt". Zum Beispiel restliche Munition, ob gerade nachgeladen wird oder wie viele Sekunden vergangen sind.

`var` im Skript-Scope bleibt über Frames hinweg erhalten:

```swift
script Timer {
    var elapsed: Float = 0.0

    func update(_ dt: Float) {
        elapsed += dt
    }
}
```

Wenn `elapsed` in `update()` stehen würde, würde es jeden Frame neu erstellt und wäre kein geeigneter kumulativer Timer.

## Lokale Variablen

Lokale Variablen sind "Ergebnisse, die dieser kleine Codeabschnitt kurz berechnet". Sie speichern nichts langfristig, sondern machen die aktuelle Berechnung klarer.

```swift
func update(_ dt: Float) {
    let pulse: Float = sin(Time.time * 3.0) * 0.2
    position.y = 1.0 + pulse
}
```

`pulse` ist nur das Ergebnis dieses Frames; `let` reicht aus.

## Altes `state.name`

Das aktuelle MVP akzeptiert eventuell noch:

```swift
state.ammo -= 1
```

Neue Skripte sollten bevorzugt deklarativen persistenten Zustand schreiben:

```swift
var ammo: Int = 30

func update(_ dt: Float) {
    ammo -= 1
}
```

Das ist für Editor, Validator und AI-Agenten leichter zu verstehen.
