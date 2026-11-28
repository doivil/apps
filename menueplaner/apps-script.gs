/**
 * Schnittstelle für die App «Menüplaner OTW70» (https://doivil.github.io/apps/menueplaner/).
 *
 * Die eigentliche Logik (Rezeptsuche Swissmilk/gutekueche.ch, Einkaufsliste, E-Mail-Versand,
 * Kühlschrank-Foto mit Gemini) liegt im Apps-Script-Projekt «Menüplaner OTW70», das an das
 * Google Sheet «Menüplaner OTW70 – Daten» (geteilte Ablage «Michèle-Livio») gebunden ist.
 * Dieser Block wird dort in Code.gs ergänzt; danach «Bereitstellen» → «Bereitstellungen verwalten»
 * → Bearbeiten → «Neue Version». Die Web-App-URL (endet auf /exec) bleibt gleich.
 *
 * Die GitHub-Seite schickt jede Aktion als POST {action, args}. Erlaubt sind nur die Funktionen
 * in API. Daten, E-Mail-Adressen und der Gemini-Schlüssel stehen im Sheet, nicht auf GitHub.
 */
const API = {
  getState: getState, addMenu: addMenu, findRecipe: findRecipe, confirmMenu: confirmMenu,
  deleteMenu: deleteMenu, setPortions: setPortions, setCheck: setCheck, resetChecks: resetChecks,
  clearAll: clearAll, addExtra: addExtra, deleteExtra: deleteExtra, exportWeek: exportWeek,
  suggestIdeas: suggestIdeas, suggestFromHome: suggestFromHome, analyzePhotos: analyzePhotos,
  setHome: setHome, removeHome: removeHome, clearHome: clearHome
};

function doPost(e) {
  let req = {};
  try { req = JSON.parse((e && e.postData && e.postData.contents) || '{}'); } catch (x) {}
  const fn = API[req.action];
  if (!fn) return apiJson_({ ok: false, error: 'Unbekannte Aktion' });
  try {
    return apiJson_({ ok: true, result: fn.apply(null, Array.isArray(req.args) ? req.args : []) });
  } catch (err) {
    return apiJson_({ ok: false, error: String((err && err.message) || err) });
  }
}

function apiJson_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
