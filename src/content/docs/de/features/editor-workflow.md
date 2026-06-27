---
title: Editor-Workflow
description: Der grundlegende Varg-Editorablauf vom Hub bis zum Play-Modus.
---

Diese Seite erklärt, "wie man nach dem Öffnen des Editors arbeitet", nicht die interne Architektur des Varg-Editors.

Im Editor erledigst du meist drei Dinge: Projekte verwalten, Szenen organisieren und im Play-Modus Skripte prüfen. Skripte, Szenen und Assets bleiben normale Projektdateien; der Editor macht diese Dateien nur leichter sichtbar, änderbar und testbar.

## Grundablauf

1. Starte Varg und öffne den Hub.
2. Erstelle ein neues Projekt oder öffne ein vorhandenes Projektverzeichnis.
3. Öffne eine Szene und wähle Objekte in der Hierarchy.
4. Passe im Inspector Position, Rotation, Skalierung und Komponentenparameter an.
5. Prüfe das 3D-Layout in der Scene View.
6. Klicke Play und führe Physik und Skripte in der Game View aus.
7. Nach Stop kehrst du in den Editierzustand zurück und passt weiter an.

Editierzustand und Laufzustand solltest du getrennt verstehen. Im Editierzustand änderst du Szenendateien; der Play-Modus läuft in einer Laufzeitwelt-Kopie. So kannst du Skripte gefahrlos ausprobieren, ohne dass ein fehlgeschlagener Lauf die Szenendatei durcheinanderbringt.

## Was der Hub macht

Der Hub ist der Projekteinstieg. Er erstellt Projekte, öffnet Projekte und bringt dich zu zuletzt verwendeten Projekten zurück.

Ein Projekt braucht mindestens:

- `Varg.toml`: Projektmanifest, das Standardszene und Skriptverzeichnisse deklariert.
- `scenes/`: Szenendateien.
- `scripts/`: `.varg`-Skripte.
- `assets/`: Modelle, Texturen, Audio und andere Assets.

Wenn du zuerst ein vollständiges Projekt ansehen willst, öffne direkt ein Beispiel:

- [examples/project/jump_jump](https://github.com/viloris-org/Varg/tree/main/examples/project/jump_jump)
- [examples/project/fps_arena](https://github.com/viloris-org/Varg/tree/main/examples/project/fps_arena)

## Häufige Komponenten

Am Anfang musst du nicht alle Komponenten auswendig kennen. Merke dir zuerst diese:

| Komponente | Zweck |
| --- | --- |
| Camera | Definiert die Spielansicht |
| Light | Beleuchtet die Szene |
| MeshRenderer | Zeigt Modell oder Mesh |
| Rigidbody | Nimmt an der Physiksimulation teil |
| Collider | Kollisionsform |
| Script | Hängt ein `.varg`-Skript ein |

Eine minimale lauffähige Szene braucht meist eine Camera, ein Light und mindestens eine Entität mit Skript oder Interaktion.

## Wie Skripte in die Szene kommen

Skripte laufen nicht automatisch; sie müssen an Szenenobjekte gehängt werden. Der typische Ablauf ist:

1. Erstelle oder importiere eine `.varg`-Datei im Projekt.
2. Wähle die Zielentität.
3. Füge eine Script-Komponente hinzu.
4. Binde die Skriptressource, zum Beispiel `scripts/player_controller.varg`.
5. Passe die durch `@export var` freigegebenen Parameter im Inspector an.
6. Prüfe das Verhalten im Play-Modus.

Beispiel:

```swift
script JumpPlayer {
    source: "scripts/jump_player.varg"
    maxCharge: 1.25
    jumpScale: 5.0
}
```

`source` zeigt hier auf die Skriptdatei, und die darunterstehenden Felder überschreiben exportierte Parameter im Skript. Anders gesagt: Das Skript definiert die Regeln, Inspector oder `.vscene` stellen die Parameter ein.

## Worauf du im Play-Modus achten solltest

Nach dem Start des Play-Modus prüfe zuerst vier Dinge:

- Kommt die Eingabe im Skript an?
- Ändern sich Position und Rotation der Objekte wie erwartet?
- Erklären HUD oder Log den aktuellen Zustand?
- Kehrt Stop sauber in den Editierzustand zurück?

Verbinde am Anfang nicht alle Systeme gleichzeitig. Bring zuerst ein Objekt in Bewegung, dann kommen Kollision, UI, Sound und Spawning. Wenn etwas schiefgeht, ist der Suchbereich viel kleiner.

## Beziehung zu Dateien

Ein Varg-Projekt muss nicht nur im Editor geändert werden. Du kannst Objekte und Parameter im Editor anpassen oder Projektdateien direkt bearbeiten.

Häufige Aufteilung:

- `.vscene` schreibt Szenenstruktur, Objekte, Komponenten und Skript-Mounting.
- `.varg` schreibt Laufzeitlogik wie Eingabe, Timer, Zustandsmaschinen und UI.
- `.vasset` schreibt Asset-Registrierung und Importeinstellungen.
- `Varg.toml` schreibt Projekteinstieg und Standardszene.

Der Editor eignet sich für räumliche Beziehungen und Parametertuning; Textdateien eignen sich für Review, Beispielkopien, Massenänderungen und von Werkzeugen erzeugte Entwürfe. Beides widerspricht sich nicht. Wichtig ist, dass Projektdateien lesbar bleiben.
