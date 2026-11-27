/**
 * Telefonliste für die App «Winterdienst BVB» (https://doivil.github.io/apps/winterdienst-bvb/).
 *
 * Liest die Google-Tabelle «Pikett Winterdienst – Telefonliste» (erstes Blatt, Spalten A–E:
 * Name · Telefon · Funktion · Typ · Gruppe). Die Tabelle wird nur gelesen.
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
 * Braucht Lesezugriff auf Google Drive (Pikettliste) und Google Tabellen (Telefonliste).
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
    if (e.parameter.auftrag) return auftragPdf(e.parameter.auftrag);

    const sh = SpreadsheetApp.openById(SHEET_ID).getSheets()[0];
    const values = sh.getRange(1, 1, Math.max(sh.getLastRow(), 1), 5).getDisplayValues();
    const people = [];
    values.forEach(function (r, i) {
      const name = String(r[0]).trim();
      if (!name || (i === 0 && /^name$/i.test(name))) return;
      people.push({ name: name, tel: String(r[1]).trim(), funktion: String(r[2]).trim(), typ: String(r[3]).trim(), gruppe: String(r[4]).trim() });
    });
    const pk = loadPikett();
    return json({ ok: true, people: people, pikett: pk.rows, pikettStand: pk.stand, pikettQuelle: pk.quelle });
  } catch (err) {
    return json({ ok: false, error: String(err && err.message || err) });
  }
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// Ersatz-Stand der Pikettliste, falls die Drive-Datei nicht gelesen werden kann: [Datum, Gruppe, Name, Status].
// Die Daten stehen nur im Apps-Script-Projekt, nicht auf GitHub.
const PIKETT = [];

// Pikettliste live aus Google Drive («Pikett Winterdienst 2026_2027.xlsx»), 5 Minuten zwischengespeichert.
// Klappt das Lesen nicht, wird der zuletzt eingebaute Stand (PIKETT) verwendet.
const PIKETT_FILE_ID = '1WkbZplxfYwV5KYXv0GOUtp3JyYjZZMYR';
function loadPikett() {
  const cache = CacheService.getScriptCache();
  const hit = cache.get('pikett2');
  if (hit) return JSON.parse(hit);
  let res;
  try {
    const file = DriveApp.getFileById(PIKETT_FILE_ID);
    const blob = file.getBlob().setContentType('application/zip');
    const files = {};
    Utilities.unzip(blob).forEach(function (b) { files[b.getName().replace(/^\/+/, '')] = b.getDataAsString('UTF-8'); });
    const rows = parsePikettXlsx(files);
    if (!rows.length) throw new Error('leer');
    res = { rows: rows, stand: file.getLastUpdated().toISOString(), quelle: 'drive' };
  } catch (err) {
    res = { rows: PIKETT, stand: '2026-11-27T17:00:00Z', quelle: 'eingebaut', fehler: String(err && err.message || err) };
  }
  try { cache.put('pikett2', JSON.stringify(res), 300); } catch (e) {}
  return res;
}

// Liest die Pikettliste aus der xlsx-Datei (erstes Blatt). Läuft in Apps Script und zum Testen in Node.
// files: { 'xl/workbook.xml': text, ... } aus dem entpackten xlsx.
function parsePikettXlsx(files) {
  const dec = s => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');
  // erstes Blatt finden
  const wb = files['xl/workbook.xml'] || '';
  const rid = (wb.match(/<sheet\b[^>]*r:id="([^"]+)"/) || [])[1];
  const rels = files['xl/_rels/workbook.xml.rels'] || '';
  let target = 'worksheets/sheet1.xml';
  const relRe = /<Relationship\b[^>]*>/g; let rm;
  while ((rm = relRe.exec(rels))) {
    const id = (rm[0].match(/Id="([^"]+)"/) || [])[1], t = (rm[0].match(/Target="([^"]+)"/) || [])[1];
    if (id === rid && t) target = t.replace(/^\/?xl\//, '');
  }
  const sheet = files['xl/' + target] || '';
  // gemeinsame Texte
  const ss = [];
  const siRe = /<si>([\s\S]*?)<\/si>/g; let sm;
  while ((sm = siRe.exec(files['xl/sharedStrings.xml'] || ''))) {
    let t = ''; const tRe = /<t\b[^>]*>([\s\S]*?)<\/t>/g; let tm;
    while ((tm = tRe.exec(sm[1]))) t += tm[1];
    ss.push(dec(t));
  }
  const colNum = s => { let n = 0; for (const ch of s) n = n * 26 + ch.charCodeAt(0) - 64; return n; };
  const cells = {}; let maxRow = 0;
  const cRe = /<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g; let cm;
  while ((cm = cRe.exec(sheet))) {
    const attrs = cm[1], body = cm[2] || '';
    const ref = (attrs.match(/\br="([A-Z]+)(\d+)"/) || []);
    if (!ref[1]) continue;
    const type = (attrs.match(/\bt="([^"]+)"/) || [])[1];
    let v = null;
    if (type === 'inlineStr') { const t = body.match(/<t\b[^>]*>([\s\S]*?)<\/t>/); v = t ? dec(t[1]) : null; }
    else { const vv = body.match(/<v>([\s\S]*?)<\/v>/); if (vv) v = type === 's' ? ss[+vv[1]] : (type === 'str' ? dec(vv[1]) : (isNaN(+vv[1]) ? dec(vv[1]) : +vv[1])); }
    const r = +ref[2], c = colNum(ref[1]);
    if (v !== null && v !== '') cells[r + ',' + c] = v;
    if (r > maxRow) maxRow = r;
  }
  const merged = {};
  const mRe = /<mergeCell\b[^>]*ref="([A-Z]+)(\d+):([A-Z]+)(\d+)"/g; let mm;
  while ((mm = mRe.exec(sheet))) {
    const c1 = colNum(mm[1]), r1 = +mm[2], c2 = colNum(mm[3]);
    if (c1 < 4) continue;
    const v = cells[r1 + ',' + c1];
    for (let c = c1; c <= c2; c++) merged[r1 + ',' + c] = v;
  }
  const cell = (r, c) => cells[r + ',' + c];
  const val = (r, c) => (r + ',' + c) in merged ? merged[r + ',' + c] : cells[r + ',' + c];
  const MON = { 'NOVEMBER': 11, 'DEZEMBER': 12, 'JANUAR': 1, 'FEBRUAR': 2, 'MÄRZ': 3, 'MAERZ': 3, 'APRIL': 4, 'OKTOBER': 10 };
  const LAB = { 'Gruppe Blau': 'Gruppe Blau · Birsfelden / Frankreich', 'Gruppe Rot': 'Gruppe Rot · Allschwil / Binningen', 'Gruppe Gelb': 'Gruppe Gelb · Depots / Radlader', 'Gruppe Weiss': 'Gruppe Weiss · Zusatzpikett', 'Gruppe Grün': 'Gruppe Grün · Areal Coop Allschwil' };
  const heads = [];
  for (let r = 1; r <= maxRow; r++) {
    const v = cell(r, 3);
    if (typeof v !== 'string') continue;
    const m = v.toUpperCase().match(/^\s*(\S+)\s+(\d{4})/);
    if (m && MON[m[1]]) heads.push([r, MON[m[1]], +m[2]]);
  }
  const pad = n => String(n).padStart(2, '0');
  const out = [];
  heads.forEach(function (hd, i) {
    const hr = hd[0], mo = hd[1], yr = hd[2], end = i + 1 < heads.length ? heads[i + 1][0] : maxRow + 1;
    const cols = {};
    for (let c = 4; c <= 36; c++) { const d = cell(hr + 1, c); if (typeof d === 'number') cols[c] = Math.round(d); }
    const dim = new Date(yr, mo, 0).getDate();
    let g = null;
    for (let r = hr + 2; r < end; r++) {
      const a = cell(r, 1), b = cell(r, 2), cn = cell(r, 3);
      if (typeof cn === 'string' && (cn.indexOf('PIKETTLISTE') >= 0 || cn.trim() === 'Legende:')) break;
      const has = [a, b, cn].some(x => x !== undefined && String(x).trim() !== '');
      if (typeof b === 'string' && b.indexOf('Gruppe') >= 0) g = b.trim();
      else if (!has && g === 'Gruppe Grün') g = 'Ersatzpersonal';
      if (g === 'Ersatzpersonal' && typeof cn === 'string' && /^(Domeniconi Livio|Hell Mattias)$/.test(cn.trim())) g = 'Einsatzleitung';
      if (typeof cn !== 'string' || !cn.trim() || cn.trim() === 'Stammpersonal' || !g) continue;
      Object.keys(cols).forEach(function (c) {
        const d = cols[c]; if (d < 1 || d > dim) return;
        const v = val(r, +c); const s = v === undefined || v === null ? '' : String(v).replace(/\s+/g, ' ').trim();
        if (!s) return;
        const st = /^x+$/i.test(s) ? 'Pikett' : s;
        out.push([yr + '-' + pad(mo) + '-' + pad(d), LAB[g] || g, cn.trim(), st]);
      });
    }
  });
  return out;
}

// Arbeitsaufträge BVB Schneebekämpfung Extern A–E als PDF (neueste Datei «…_Extern_X.pdf» im Ordner).
const AUFTRAG_FOLDER_ID = '1sCgOLJnx4plviZJj6QLpjg8b3JRQMhqj';
function auftragPdf(buchstabe) {
  const b = String(buchstabe || '').toUpperCase();
  if (!/^[A-E]$/.test(b)) return json({ ok: false, error: 'auftrag' });
  const re = new RegExp('Extern_' + b + '\\.pdf$', 'i');
  let best = null;
  const it = DriveApp.getFolderById(AUFTRAG_FOLDER_ID).getFiles();
  while (it.hasNext()) {
    const f = it.next();
    if (re.test(f.getName()) && (!best || f.getLastUpdated() > best.getLastUpdated())) best = f;
  }
  if (!best) return json({ ok: false, error: 'nicht gefunden' });
  return json({ ok: true, name: best.getName(), stand: best.getLastUpdated().toISOString(), data: Utilities.base64Encode(best.getBlob().getBytes()) });
}
