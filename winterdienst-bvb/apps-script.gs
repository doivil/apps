/**
 * Telefonliste für die App «Winterdienst BVB» (https://doivil.github.io/apps/winterdienst-bvb/).
 *
 * Liest die Google-Tabelle «Pikett Winterdienst – Telefonliste» (erstes Blatt, Spalten A–D:
 * Name · Telefon · Funktion · Typ). Die Tabelle wird nur gelesen.
 * Die Nummern stehen nicht auf GitHub: Die App holt sie hier ab, und nur mit der richtigen PIN.
 *
 * Einrichten (einmalig, ca. 5 Minuten):
 * 1. https://script.google.com → «Neues Projekt», Name «Winterdienst BVB App».
 * 2. Diesen ganzen Text in Code.gs einfügen und speichern.
 * 3. Links «Projekteinstellungen» (Zahnrad) → ganz unten «Skripteigenschaften» →
 *    «Skripteigenschaft hinzufügen»: Eigenschaft PIN, Wert = die PIN für das Team (z.B. 4–6 Ziffern).
 *    Die PIN steht damit nur im Skript, nicht auf GitHub.
 * 4. «Bereitstellen» → «Neue Bereitstellung» → Typ «Web-App».
 *    Ausführen als: Ich · Zugriff: Jeder → «Bereitstellen», Zugriff erlauben.
 * 5. Die Web-App-URL (endet auf /exec) steht in index.html unter EXEC.
 *
 * Eingerichtet am 27.11.2026 als Projekt «Winterdienst BVB App» im Konto livio.domeniconi@reich.ch.
 *
 * PIN ändern: Skripteigenschaft PIN anpassen, fertig (keine neue Bereitstellung nötig).
 */
const SHEET_ID = '1uzxLrgpHcY7CPXx4_2Os-EfkXZROzEtpQlnEh3Tf6MI';

function doGet(e) {
  try {
    const pin = String(PropertiesService.getScriptProperties().getProperty('PIN') || '').trim();
    const given = String((e && e.parameter && e.parameter.pin) || '').trim();
    if (!pin) return json({ ok: false, error: 'nopin' });
    if (given !== pin) { Utilities.sleep(800); return json({ ok: false, error: 'pin' }); }

    const sh = SpreadsheetApp.openById(SHEET_ID).getSheets()[0];
    const values = sh.getRange(1, 1, Math.max(sh.getLastRow(), 1), 4).getDisplayValues();
    const people = [];
    values.forEach(function (r, i) {
      const name = String(r[0]).trim();
      if (!name || (i === 0 && /^name$/i.test(name))) return;
      people.push({ name: name, tel: String(r[1]).trim(), funktion: String(r[2]).trim(), typ: String(r[3]).trim() });
    });
    return json({ ok: true, people: people });
  } catch (err) {
    return json({ ok: false, error: String(err && err.message || err) });
  }
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
