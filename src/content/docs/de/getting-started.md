---
title: Schnellstart
description: Varg installieren, den Editor starten und die Skript-Beispielprojekte finden.
---

## Voraussetzungen

Diese Seite beantwortet nur zwei Fragen: wie du Varg öffnest und wo der Beispielcode liegt. Du musst noch nicht alle Dateitypen verstehen; wenn du ein Projekt öffnen und die Skripte finden kannst, bist du bereit für den nächsten Schritt.

Lade Varg über GitHub Releases herunter:

- [https://github.com/viloris-org/Varg/releases](https://github.com/viloris-org/Varg/releases)

Wenn du nur den Editor ausprobieren oder Beispielprojekte ausführen willst, lade bevorzugt die vorgebauten Artefakte aus dem Release herunter. Der folgende Start aus dem Quellcode ist nur für Personen gedacht, die an der Entwicklung teilnehmen, die Engine debuggen oder den Editor ändern wollen.

Um den Editor aus dem Quellcode zu starten, brauchst du:

- Rust 1.96 oder neuer
- Bun 1.3.14 oder neuer
- Tauri-v2-Systemabhängigkeiten

Häufige Linux-Abhängigkeiten:

```sh
sudo apt install libwebkit2gtk-4.1-dev build-essential libssl-dev libayatana-appindicator3-dev librsvg2-dev
```

## Editor starten

Wenn du ein Release-Paket heruntergeladen hast, entpacke es und führe direkt die enthaltene Varg-Datei aus.

Wenn du aus dem Quellcode startest und das Varg-Repository neben dieser Dokumentationsseite unter `../Varg` liegt:

```sh
cd ../Varg/editor
bun install
bun run dev:tauri
```

Nach dem Start landest du im Hub. Dort kannst du Projekte erstellen oder öffnen, Objekte im Editor platzieren, Komponenten hinzufügen und im Play-Modus Physik und Skripte ausführen.

Wenn du nur Skripting lernen willst, öffne zuerst ein Beispielprojekt und beginne nicht direkt mit einem leeren Projekt. Ein leeres Projekt berührt gleichzeitig Szenen, Assets, Skript-Mounting und Eingabekonfiguration; das ist am Anfang ein großer Sprung.

## Wo die Skriptbeispiele liegen

Die Syntaxbeispiele in diesem Handbuch stammen aus `examples/scripts` im Varg-Repository:

```txt
examples/scripts/
├── loop_demo.varg
├── particle_system.varg
├── timed_sequence.varg
├── wave_spawner.varg
└── weapon_cooldown.varg
```

Die vollständigen Gameplay-Tutorials verwenden diese Beispielprojekte:

- [examples/project/jump_jump](https://github.com/viloris-org/Varg/tree/main/examples/project/jump_jump)
- [examples/project/fps_arena](https://github.com/viloris-org/Varg/tree/main/examples/project/fps_arena)

Du musst Varg nicht forken, um diese Beispiele zu lesen. Du kannst den Quellcode direkt auf GitHub ansehen oder ein Release beziehungsweise ein Quellcode-Archiv herunterladen und lokal öffnen.

Springe beim Lernen nicht zu schnell:

1. `weapon_cooldown.varg`: exportierte Parameter, Eingabe, Zustand und `wait()`
2. `loop_demo.varg`: Schleifen, `break`, `continue`, lokale Variablen
3. `wave_spawner.varg`: Skripte mit mehreren Zuständen und Lifecycle-Aufteilung
4. `particle_system.varg`: Timer und Tastendruck-Reset
5. `jump_jump`: Plattformen zur Laufzeit erzeugen, Landepunkt prüfen, HUD, Assist-Modus. Du kannst auch nur die erste Hälfte des Hauptskripts lesen.
6. `fps_arena`: First-Person-Bewegung, Nachladen, Zielerzeugung, Treffer-Feedback. Es hat mehr Systeme und sollte nach `jump_jump` kommen.

:::tip[Wie man Beispiele liest]
Suche zuerst nach `@export var`; das sind meist Parameter, die Designer anpassen. Suche dann nach `var`; das ist meist Zustand, den das Skript selbst speichert. Lies zuletzt `start()` und `update(_ dt: Float)`. So ist es deutlich angenehmer als stur von der ersten bis zur letzten Zeile zu lesen.
:::

## Ein Satz zum Merken

`.varg` schreibt Laufzeitlogik; `.vscene` schreibt Szenen- und Objektstruktur; `.vasset` registriert Assets; `.vmodel` beschreibt generative Modelle. Der aktuell ausführbare Schwerpunkt ist das `.varg`-Skript-MVP.
