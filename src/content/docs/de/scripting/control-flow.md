---
title: Kontrollfluss und Warten
description: Schreibe Gameplay-Logik mit if, for, while, break, continue und wait.
---

## Bedingungen

Kontrollfluss ist nicht dazu da, "cleveren" Code zu schreiben, sondern Gameplay-Regeln klar auszudrücken: Wenn geschossen werden darf, Munition abziehen; wenn nachgeladen wird, Countdown zählen; wenn der Spieler von der Plattform fällt, verlieren.

```swift
if Input.pressed("Fire") && canFire && ammo > 0 {
    ammo -= 1
    canFire = false
}
```

Das aktuelle MVP unterstützt:

- Einfache Bool-Zustandsnamen wie `canFire`
- `!`, `&&`, `||`
- Zahlenvergleiche wie `ammo > 0`, `timer <= 0`
- Eingabeprüfungen wie `Input.pressed("Fire")`

## `for`-Schleifen

Bereichsschleife:

```swift
for i in 0..3 {
    log("Range loop iteration")
}
```

Inklusive Bereichsschleife:

```swift
for i in 1..=5 {
    sum += i
}
```

Zählschleife:

```swift
for i in count(3) {
    count += 1
}
```

## `while`-Schleifen

```swift
while loopCount < maxIterations {
    if loopCount >= 5 {
        break
    }

    loopCount += 1
}
```

`while` eignet sich für "solange der Zustand die Bedingung erfüllt, weitermachen". Achte darauf, dass sich die Bedingung in jeder Runde ändern kann, um Endlosschleifen zu vermeiden.

## `break` und `continue`

```swift
for i in 0..10 {
    if i == skipValue {
        continue
    }

    filtered += 1
}
```

- `break`: beendet die aktuelle Schleife sofort
- `continue`: überspringt den Rest dieser Runde und geht zur nächsten Runde

## `wait(expression)`

`wait()` drückt Zeitabstände in Skripten aus:

```swift
script WeaponCooldown {
    @export var fireRate: Float = 0.5

    var canFire: Bool = true
    var ammo: Int = 30

    func update(_ dt: Float) {
        if Input.pressed("Fire") && canFire && ammo > 0 {
            ammo -= 1
            canFire = false
            log("Fire! Ammo remaining:")

            wait(fireRate)

            canFire = true
        }
    }
}
```

Diese Schreibweise eignet sich für Unterricht und einfache Rhythmuskontrolle. Du kannst sie als "erst kurz warten, dann mit dem Folgenden weitermachen" verstehen.

Wenn ein System während des Wartens weiter HUD aktualisieren, Eingaben verarbeiten, Figuren bewegen oder Sieg/Niederlage prüfen muss, verwende besser einen expliziten Timer. Das sind ein paar Zeilen mehr, aber der Zustand ist sichtbarer und leichter zu debuggen, zu pausieren und zu speichern.

```swift
var cooldown: Float = 0.0

func update(_ dt: Float) {
    if cooldown > 0 {
        cooldown -= dt
    }

    if Input.pressed("Fire") && cooldown <= 0 {
        cooldown = fireRate
    }
}
```
