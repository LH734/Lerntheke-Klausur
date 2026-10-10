# Lerntheke Klausur · Physik GK 12

Statische Web-App ohne Server und ohne Framework. Läuft auf GitHub Pages und offline.

## Aufbau

| Pfad | Inhalt |
|---|---|
| `index.html` | Einstieg |
| `aufgaben.json` | alle Inhalte, erzeugt von `lerntheke_inhalt.py` |
| `lerntheke_inhalt.py` | **einzige Stelle für Inhaltsänderungen** |
| `js/config.js` | Z-Sperre, BE-Regel bei Auswahlaufgaben, Vorgaben der Probeklausur |
| `js/` | App-Logik (`app.js` Oberfläche, `zahl.js` Zahlenprüfung, `klausur.js` Probeklausur, `speicher.js` Fortschritt und Code, `abbildungen.js` SVG) |
| `css/app.css` | Gestaltung inkl. Dunkelmodus |
| `lib/` | KaTeX 0.16.11 und qrcode-generator 1.4.4, lokal |
| `sw.js` | Service Worker für den Offline-Betrieb |
| `tests/` | Unit-Tests und Browser-Tests |

## Inhalte ändern

1. `lerntheke_inhalt.py` bearbeiten.
2. Im Projektordner ausführen: `python3 lerntheke_inhalt.py`. Das Skript rechnet nach, prüft die Schreibregeln und schreibt `aufgaben.json` neu.
3. Hochladen (siehe unten). Geräte, die die Lerntheke schon kennen, zeigen beim nächsten Öffnen „Es gibt eine neue Version“.

## Einstellungen (`js/config.js`)

- `zSperre: false` gibt die Z-Aufgaben auf **allen** Geräten frei.
- Unter `?lehrer=1` gibt es die Vorschau aller Aufgaben mit Lösungen. Der Schalter dort wirkt nur auf dem eigenen Gerät.
- `auswahlNurErsterVersuch: true` gibt die BE bei Auswahlaufgaben nur für den ersten Versuch.

## Lokal ansehen

```bash
python3 -m http.server 8000
```

Dann `http://localhost:8000` öffnen. Ein Doppelklick auf `index.html` reicht nicht, weil der Browser `aufgaben.json` dann nicht laden darf.

## Tests

```bash
pip install playwright
python3 tests/run_tests.py --screenshots
```

Geprüft werden: Zahleneingabe, Toleranz, Vorzeichen, Zehnerpotenz-Hinweis, JSON-Prüfung, 100 Probeklausur-Ziehungen, Notenpunkte, Fortschritts-Code, alle 52 Aufgaben bei 360 px mit den Lösungswerten, Diagnose, Probeklausur, Z-Sperre, Lehreransicht, Offline-Betrieb und die Schreibregeln auf allen Seiten. Screenshots landen in `tests/screenshots/`.

## Veröffentlichen auf GitHub Pages

1. Auf github.com ein leeres Repository anlegen, z. B. `Lerntheke-GK12` (ohne README).
2. Im Projektordner:
   ```bash
   git init -b main
   git add .
   git commit -m "Lerntheke Klausur"
   git remote add origin https://github.com/BENUTZERNAME/Lerntheke-GK12.git
   git push -u origin main
   ```
3. Im Repository unter **Settings → Pages**: Source „Deploy from a branch“, Branch `main`, Ordner `/ (root)`.
4. Nach etwa einer Minute ist die App unter `https://BENUTZERNAME.github.io/Lerntheke-GK12/` erreichbar.
5. Spätere Änderungen: `git add . && git commit -m "…" && git push`.

Den Ordner „Übergabe Claude Code“ schließt `.gitignore` aus. Wenn sich die Liste der Dateien in `sw.js` ändert, dort `VERSION` erhöhen.
