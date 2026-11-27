# Interne Web-Apps H. Reich AG

| App | Adresse |
|---|---|
| Absenzen- & Ferienmeldung | https://doivil.github.io/apps/absenzen/ |
| Tagesprogramm | https://doivil.github.io/apps/tagesprogramm/ |
| Winterdienst BVB | https://doivil.github.io/apps/winterdienst-bvb/ |

Die Apps speichern keine Daten auf GitHub. Meldungen gehen direkt in die Google-Tabellen der Firma.

Das Tagesprogramm liest das Blatt «Baustellen» der Google-Tabelle TAGESPROGRAMM über ein Google-Apps-Script (`tagesprogramm/apps-script.gs`), nur lesend und ohne Telefonnummern und E-Mail-Adressen.

## Winterdienst BVB: Haltestelle hinzufügen

Die Haltestellen stehen in `winterdienst-bvb/haltestellen.json`, nach Linien geordnet.

1. Bild hochladen: auf GitHub im Ordner `winterdienst-bvb/img/` «Add file» → «Upload files» (JPG, am besten unter 500 KB).
2. In `haltestellen.json` (Stift-Symbol) bei der passenden Linie einen Eintrag ergänzen:
   `{"name": "Neue Haltestelle", "ort": "Allschwil", "maps": "Tramhaltestelle Neue Haltestelle Allschwil", "bilder": ["neue-haltestelle.jpg"]}`
   Ohne Bild: `"bilder": []`. Mehrere Bilder: `["a.jpg", "b.jpg"]`.
3. «Commit changes». Nach etwa einer Minute ist die App aktualisiert.

Eine neue Linie ist ein weiterer Block unter `linien` mit `nr`, `titel`, `farbe` und `haltestellen`.

Die Telefonliste im Tab «Team» liest die Google-Tabelle «Pikett Winterdienst – Telefonliste» über ein Google-Apps-Script (`winterdienst-bvb/apps-script.gs`), nur lesend und nur mit der Team-PIN. Die Nummern und die PIN stehen nicht auf GitHub.
