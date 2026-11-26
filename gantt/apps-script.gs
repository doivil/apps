/**
 * Datenquelle für die App «Tagesprogramm» (https://doivil.github.io/apps/gantt/).
 *
 * Einrichten (einmalig, ca. 5 Minuten):
 * 1. https://script.google.com → «Neues Projekt», Name «Tagesprogramm App».
 * 2. Diesen ganzen Text in Code.gs einfügen und speichern.
 * 3. «Bereitstellen» → «Neue Bereitstellung» → Typ «Web-App».
 *    Ausführen als: Ich · Zugriff: Jeder → «Bereitstellen», Zugriff erlauben.
 * 4. Die Web-App-URL (endet auf /exec) an Claude schicken.
 *
 * Herausgegeben wird nur das Blatt «Baustellen» bis zum Abschnitt «Abklärungen (ALLE)»,
 * Spalten A–K, ohne Telefonnummern und E-Mail-Adressen. Die Tabelle wird nur gelesen.
 */
const SHEET_ID = '1D7_bevvPjkK4LbNuYi120CjII8s0nmu4qiAcg4qyJWk';
const SHEET_NAME = 'Baustellen';

function doGet() {
  try {
    const sh = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
    const values = sh.getRange(1, 1, sh.getLastRow(), 11).getDisplayValues();
    const rows = [];
    for (const r of values) {
      if (/^\s*Abklärungen/i.test(r[0])) break;
      rows.push(r.map(clean));
    }
    const modified = DriveApp.getFileById(SHEET_ID).getLastUpdated().toISOString();
    return json({ ok: true, modified: modified, rows: rows });
  } catch (e) {
    return json({ ok: false, error: String(e && e.message || e) });
  }
}

function clean(v) {
  return String(v)
    .replace(/(?:\+41|0)\s?\d{2}\s?\d{3}\s?\d{2}\s?\d{2}/g, '')   // Telefonnummern
    .replace(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g, '')                 // E-Mail-Adressen
    .replace(/[ \t]{2,}/g, '  ')
    .trim();
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
