---
title: Projektstruktur
description: Verstehe, wofür Varg.toml, scenes, scripts und assets in einem Varg-Spielprojekt zuständig sind.
---

Diese Seite behandelt das Varg-Spielprojekt eines Creators, nicht das Quellcode-Repository der Varg-Engine.

Wenn du `examples/project/jump_jump` oder `examples/project/fps_arena` öffnest, sieht die Struktur ungefähr so aus:

```txt
my_game/
├── Varg.toml
├── scenes/
│   └── main.vscene
├── scripts/
│   ├── player.varg
│   └── camera.varg
├── assets/
│   ├── models/
│   ├── textures/
│   ├── audio/
│   └── materials/
└── build/
```

Am Anfang musst du nicht jedes Verzeichnis füllen. Ein Minimalprojekt braucht meist nur:

```txt
my_game/
├── Varg.toml
├── scenes/
│   └── main.vscene
└── scripts/
    └── player.varg
```

## `Varg.toml`

`Varg.toml` ist das Projektmanifest. Es sagt Editor und Laufzeit: wie das Projekt heißt, wo die Asset-Wurzel liegt, wo Skripte gesucht werden und welche Szene standardmäßig geöffnet wird.

```toml
name = "My Game"
asset_root = "assets"
script_roots = ["scripts"]
default_scene = "scenes/main.vscene"
```

Häufige Felder:

| Feld | Zweck |
| --- | --- |
| `name` | Projektname, der im Editor oder in Build-Artefakten angezeigt wird |
| `asset_root` | Asset-Verzeichnis, meist `assets` |
| `script_roots` | Suchverzeichnisse für Skripte, meist `["scripts"]` |
| `default_scene` | Szene, die beim Play-Modus oder Paketieren standardmäßig startet |

Wenn in einer Szene `source: "scripts/player.varg"` steht, findet die Laufzeit diese Skriptdatei anhand der Projektkonfiguration.

## `scenes/`

`scenes/` enthält `.vscene`-Dateien. Du kannst dir eine `.vscene` als "was beim Spielstart in der Welt existiert" vorstellen.

Szenen sind typischerweise zuständig für:

- Spieler, Kamera, Licht und Startobjekte platzieren.
- Tags für Objekte setzen, zum Beispiel `Player`, `Platform`, `Collectible`.
- Skripte an Objekte hängen.
- Werte von `@export var` aus Skripten überschreiben.

Eine sehr kleine Szene könnte so aussehen:

```swift
entity "Player" {
    tag: "Player"
    position: Vec3(0.0, 0.6, 0.0)

    script PlayerController {
        source: "scripts/player.varg"
        speed: 5.0
    }
}

entity "Camera" {
    position: Vec3(0.0, 2.0, -5.0)
}
```

Faustregel: Die Szene ist für "Dinge platzieren und Parameter einstellen" zuständig, das Skript für "Regeln zur Laufzeit".

## `scripts/`

`scripts/` enthält `.varg`-Dateien. Sie steuern Laufzeitlogik wie Bewegung, Timer, Punkte, Objektspawning, HUD und Soundeffekte.

```txt
scripts/
├── player.varg
├── camera.varg
├── enemy.varg
└── despawn_far.varg
```

Für Einsteigerprojekte empfiehlt sich eine Aufteilung nach Objekt oder Verantwortung:

| Skript | Geeignet für |
| --- | --- |
| `player.varg` | Spielereingabe, Bewegung, Leben, Punkte |
| `camera.varg` | Kamerafolge, First-Person-Perspektive |
| `enemy.varg` | Gegnerbewegung, Erkennung, Treffer |
| `despawn_far.varg` | Temporäre Objekte entfernen, wenn sie zu weit vom Spieler entfernt sind |

Zerlege am Anfang nicht zu fein. Solange ein Gameplay noch nicht läuft, ist es einfacher, die Hauptlogik in einem Hauptskript zu debuggen. Wenn die Regeln stabil sind, kannst du unabhängige Aufgaben wie Kamera, Cleanup oder Schwebanimation auslagern.

## `assets/`

`assets/` enthält Projektassets. Frühe Tutorials kommen mit wenigen externen Assets aus, echte Projekte fügen aber meist nach und nach Modelle, Texturen, Audio und Materialien hinzu.

```txt
assets/
├── models/
├── textures/
├── audio/
└── materials/
```

Häufige Ablage:

| Verzeichnis | Inhalt |
| --- | --- |
| `models/` | Charaktere, Props, Szenenmodelle |
| `textures/` | Texturen, Icons, UI-Bilder |
| `audio/` | Soundeffekte und Musik |
| `materials/` | Materialkonfiguration oder materialbezogene Assets |

Tutorialprojekte verwenden oft zuerst zur Laufzeit erzeugte Boxen und Kugeln, um Asset-Störungen zu vermeiden. Wenn die Gameplay-Regeln stehen, ist der Austausch gegen finale Assets stabiler.

## `build/`

`build/` oder ein ähnliches Ausgabeverzeichnis enthält Build-Artefakte. Das ist nicht der Ort, den du hauptsächlich bearbeitest.

Schreibe Gameplay-Skripte normalerweise nicht direkt in das Build-Ausgabeverzeichnis. Quelldateien gehören nach `scripts/`, `scenes/` und `assets/`; der Build-Prozess erzeugt daraus die finalen Artefakte.

## Wie eine Datei mit den anderen verbunden ist

Die wichtigste Kette ist:

1. `Varg.toml` legt die Standardszene fest: `default_scene = "scenes/main.vscene"`.
2. `main.vscene` platziert das Spielerobjekt.
3. Das Spielerobjekt hängt ein Skript ein: `source: "scripts/player.varg"`.
4. `player.varg` liest in `update(_ dt: Float)` Eingaben, bewegt den Spieler und aktualisiert das HUD.

Das Projekt arbeitet also nicht durch eine einzelne Datei, sondern durch diese Referenzkette:

```txt
Varg.toml -> scenes/main.vscene -> scripts/player.varg
```

Wenn nach Play nichts passiert, prüfe zuerst diese Kette:

| Problem | Prüfung |
| --- | --- |
| Es öffnet sich nicht die erwartete Szene | Zeigt `default_scene` auf die richtige `.vscene`? |
| Das Skript läuft nicht | Hat das Szenenobjekt ein Skript, und stimmt der `source`-Pfad? |
| Tag-Abfragen finden kein Objekt | Ist der tag in `.vscene` exakt derselbe String wie im Skript? |
| Parameter greifen nicht | Stimmen die Skriptfeldnamen in der Szene mit `@export var` überein? |

## Unterschied zur Engine-Quellstruktur

Im Varg-Engine-Repository siehst du Verzeichnisse wie `editor/`, `crates/` und `xtask/`. Diese Struktur ist für Personen gedacht, die Engine und Editor entwickeln.

Wenn du ein Spiel baust, ist zuerst dein eigenes Projekt wichtig:

```txt
Varg.toml
scenes/
scripts/
assets/
```

Die folgenden Tutorials erklären alles anhand dieses mentalen Modells eines Nutzerprojekts. Die interne crate-Schichtung der Engine brauchst du erst, wenn du Editor, Renderer oder Laufzeit ändern willst.
