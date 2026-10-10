// Laden und Prüfen von aufgaben.json sowie Hilfsfunktionen für den Zugriff.

export const STUFEN = ['G', 'A', 'Z'];
export const STUFE_NAME = { G: 'Grundaufgabe', A: 'Anwendung', Z: 'Zusatzaufgabe' };
export const STUFE_PLURAL = { G: 'Grundaufgaben', A: 'Anwendungen', Z: 'Zusatzaufgaben' };
export const BEREICH_NAME = {
  Induktion: 'Elektromagnetische Induktion',
  Schwingungen: 'Mechanische Schwingungen',
};
const BEREICH_REIHENFOLGE = ['Induktion', 'Schwingungen'];
const TYPEN_ABBILDUNG = ['bt_diagramm', 'yt_diagramm', 'gedaempft', 'einhuellende_drei', 'skizze'];

/** Prüft die Daten. Gibt eine Liste von Fehlermeldungen zurück (leer, wenn alles stimmt). */
export function pruefeDaten(d) {
  const fehler = [];
  if (!d || typeof d !== 'object') return ['Die Datei enthält kein gültiges JSON-Objekt.'];
  for (const feld of ['meta', 'themen', 'aufgaben', 'diagnose']) {
    if (!d[feld]) fehler.push(`Das Feld „${feld}“ fehlt.`);
  }
  if (fehler.length) return fehler;

  const themenIds = new Set();
  for (const t of d.themen) {
    if (themenIds.has(t.id)) fehler.push(`Die Themen-ID ${t.id} kommt doppelt vor.`);
    themenIds.add(t.id);
    if (!BEREICH_REIHENFOLGE.includes(t.bereich)) fehler.push(`Thema ${t.id}: unbekannter Bereich „${t.bereich}“.`);
  }

  const aufgabenIds = new Set();
  for (const a of d.aufgaben) {
    if (aufgabenIds.has(a.id)) fehler.push(`Die Aufgaben-ID ${a.id} kommt doppelt vor.`);
    aufgabenIds.add(a.id);
    if (!themenIds.has(a.thema)) fehler.push(`Aufgabe ${a.id}: Thema ${a.thema} gibt es nicht.`);
    if (!STUFEN.includes(a.stufe)) fehler.push(`Aufgabe ${a.id}: unbekannte Stufe „${a.stufe}“.`);
    if (a.abbildung && !TYPEN_ABBILDUNG.includes(a.abbildung.typ)) {
      fehler.push(`Aufgabe ${a.id}: unbekannter Abbildungstyp „${a.abbildung.typ}“.`);
    }
    if (!Array.isArray(a.teile) || !a.teile.length) {
      fehler.push(`Aufgabe ${a.id}: keine Teilaufgaben.`);
      continue;
    }
    const teilIds = new Set();
    for (const t of a.teile) {
      const wo = `Aufgabe ${a.id}${t.id}`;
      if (teilIds.has(t.id)) fehler.push(`${wo}: Teil-ID doppelt.`);
      teilIds.add(t.id);
      if (!(t.be > 0)) fehler.push(`${wo}: BE fehlen.`);
      if (!['I', 'II', 'III'].includes(t.afb)) fehler.push(`${wo}: unbekannter AFB „${t.afb}“.`);
      const p = t.pruefung || {};
      if (p.typ === 'zahl') {
        if (typeof p.wert !== 'number' || !Number.isFinite(p.wert)) fehler.push(`${wo}: Zahlenwert fehlt.`);
        if (!['streng', 'betrag_ok'].includes(p.vorzeichen)) fehler.push(`${wo}: unbekannte Vorzeichenregel.`);
      } else if (p.typ === 'auswahl') {
        if (!Array.isArray(p.optionen) || p.optionen.length < 2) fehler.push(`${wo}: zu wenige Optionen.`);
        if (!Array.isArray(p.richtig) || !p.richtig.length) fehler.push(`${wo}: keine richtige Option.`);
        else if (!p.richtig.every((i) => Number.isInteger(i) && i >= 0 && i < p.optionen.length)) {
          fehler.push(`${wo}: ungültiger Index in „richtig“.`);
        }
        if (!p.mehrfach && p.richtig && p.richtig.length !== 1) fehler.push(`${wo}: Einfachauswahl mit mehreren richtigen Optionen.`);
      } else if (p.typ === 'selbst') {
        if (!Array.isArray(p.kriterien) || !p.kriterien.length) fehler.push(`${wo}: keine Kriterien.`);
      } else {
        fehler.push(`${wo}: unbekannte Prüfungsart „${p.typ}“.`);
      }
      if (!Array.isArray(t.hilfen)) fehler.push(`${wo}: Hilfen fehlen.`);
      if (!Array.isArray(t.loesung) || !t.loesung.length) fehler.push(`${wo}: Lösung fehlt.`);
    }
  }

  d.diagnose.forEach((q, i) => {
    const wo = `Diagnosefrage ${i + 1}`;
    if (!themenIds.has(q.thema)) fehler.push(`${wo}: Thema ${q.thema} gibt es nicht.`);
    if (!Array.isArray(q.optionen) || !Number.isInteger(q.richtig) || q.richtig < 0 || q.richtig >= q.optionen.length) {
      fehler.push(`${wo}: ungültiger Index in „richtig“.`);
    }
  });
  return fehler;
}

/** Baut Nachschlagetabellen auf. */
export function bereite(d) {
  const themaNach = new Map(d.themen.map((t) => [t.id, t]));
  const aufgabeNach = new Map(d.aufgaben.map((a) => [a.id, a]));
  const aufgabenJeThema = new Map(d.themen.map((t) => [t.id, []]));
  for (const a of d.aufgaben) aufgabenJeThema.get(a.thema).push(a);
  // Diagnosefragen bekommen eine stabile Kennung: Thema und laufende Nummer im Thema
  const zaehler = {};
  for (const q of d.diagnose) {
    zaehler[q.thema] = (zaehler[q.thema] || 0) + 1;
    q.schluessel = `${q.thema}-${zaehler[q.thema]}`;
  }
  const bereiche = BEREICH_REIHENFOLGE.map((b) => ({
    id: b, name: BEREICH_NAME[b], themen: d.themen.filter((t) => t.bereich === b),
  }));
  return { ...d, themaNach, aufgabeNach, aufgabenJeThema, bereiche };
}

export function teilSchluessel(aufgabe, teil) {
  return `${aufgabe.id}/${teil.id}`;
}

export function aufgabeBE(a) {
  return a.teile.reduce((s, t) => s + t.be, 0);
}

export function afbListe(a) {
  const reihenfolge = ['I', 'II', 'III'];
  return reihenfolge.filter((x) => a.teile.some((t) => t.afb === x));
}

/** Sortiert Aufgaben nach Bereich, Thema und Stufe wie in der JSON. */
export function sortiereAufgaben(daten, liste) {
  const pos = new Map(daten.aufgaben.map((a, i) => [a.id, i]));
  return [...liste].sort((x, y) => pos.get(x.id) - pos.get(y.id));
}

/** Fisher-Yates-Mischung mit austauschbarer Zufallsquelle. */
export function mische(liste, rnd = Math.random) {
  const a = [...liste];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Benötigter Winkelmodus einer Teilaufgabe, aus den Texten erkannt. */
export function winkelmodus(teil) {
  const text = [teil.text, ...teil.hilfen, ...teil.loesung].join(' ');
  if (/\bRAD\b|Bogenmaß/.test(text)) return 'RAD';
  if (/\bDEG\b/.test(text)) return 'DEG';
  return null;
}
