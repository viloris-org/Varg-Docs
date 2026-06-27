---
title: Assets, Szenen und deklarative Dateien
description: Verstehe die Verantwortungsgrenzen von .varg, .vscene, .vmodel und .vasset.
---

Varg soll eine Gruppe von Autorensprachen mit einheitlichem Stil bereitstellen, die Menschen und AI lesen, ändern und validieren können.

## Dateirollen

| Erweiterung | Rolle | Verwendung | Turing-vollständig |
| --- | --- | --- | --- |
| `.varg` | Logic file | Skripte, Module, dynamische Gameplay-Logik, deklaratives behavior | `script` und `module` ja; `behavior` nein |
| `.vscene` | World file | Szenen, prefabs, Entitätszusammenstellung, Layoutabsicht, Netzwerk-Replikationsdeklarationen | Nein |
| `.vmodel` | Model authoring file | Prozeduraler oder parametrisierter Modellbau | Nein |
| `.vasset` | Asset file | Asset-Registrierung, Importeinstellungen, Materialien, Audio-Events und Abhängigkeiten | Nein |

## `.vscene`-Szenenskizze

```swift
scene MainScene {
    camera "MainCamera" {
        transform {
            position: Vec3(0, 6, 10)
            rotation: Euler(-30, 0, 0)
        }

        primary: true
    }

    entity "Player" {
        tag: "player"

        transform {
            position: Vec3(0, 1, 0)
        }

        script PlayerController {
            source: "scripts/player_controller.varg"
            speed: 6.0
        }
    }
}
```

Szenendateien beschreiben "was existiert" und "wo es ist"; sie enthalten keine beliebigen Schleifen oder Laufzeitereignisse.

## AI-Intent-Szenen

Vargs Design erlaubt AI, hochrangige Absichten zu schreiben:

```swift
scene ForestCamp {
    intent: "A small night camp in a forest clearing"

    scatter "PineTree" {
        count: 32
        area: ring(inner: 8, outer: 18)
        scale: range(0.8, 1.4)
    }
}
```

Solche Dateien werden später von Werkzeugen in deterministische Szenenobjekte kompiliert. Die Quelldatei behält die Autorenabsicht, damit Menschen sie prüfen und AI sie weiter verändern kann.

## Asset-Pipeline

Vargs Asset-System ist zuständig für:

- glTF, PNG, Audio und andere Assets importieren
- Asset-Datenbank und Manifest aufbauen
- Dateiänderungen beobachten und hot reloaden
- Beim Paketieren Assets kopieren und `asset-manifest.json` erzeugen

Wenn ein Asset nur Registrierung, Importeinstellungen oder Materialparameter braucht, gehört es bevorzugt in `.vasset`. Wenn Laufzeitlogik nötig ist, schreibe erst dann `.varg`.
