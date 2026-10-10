// Unit-Tests für Zahleneingabe, Datenprüfung, Probeklausur und Fortschritts-Code.
// Ausführen mit: python3 tests/run_tests.py  (oder direkt mit jsc -m tests/unit.mjs im Projektordner)
import { leseZahl, pruefeZahl, HINWEIS, formatZahl } from '../js/zahl.js';
import { pruefeDaten, bereite, winkelmodus } from '../js/daten.js';
import { zieheKlausur, verteilung, passtVerteilung, notenpunkte, notenschluessel } from '../js/klausur.js';
import { KONFIG } from '../js/config.js';

const ausgabe = typeof window === 'undefined' && typeof print === 'function' ? print : console.log;
let ok = 0;
let fehl = 0;
function pruefe(name, bedingung, info = '') {
  if (bedingung) ok++;
  else { fehl++; ausgabe(`FEHLER: ${name} ${info}`); }
}
function gleich(name, ist, soll) {
  const gut = Number.isNaN(soll) ? Number.isNaN(ist) : Math.abs(ist - soll) <= 1e-12 * Math.max(1, Math.abs(soll));
  pruefe(name, gut, `ist ${ist}, soll ${soll}`);
}

// btoa/atob fehlen in jsc
if (typeof globalThis.btoa !== 'function') {
  const zeichen = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  globalThis.btoa = (s) => {
    let out = '';
    for (let i = 0; i < s.length; i += 3) {
      const a = s.charCodeAt(i), b = s.charCodeAt(i + 1), c = s.charCodeAt(i + 2);
      const n = (a << 16) | ((b || 0) << 8) | (c || 0);
      out += zeichen[(n >> 18) & 63] + zeichen[(n >> 12) & 63]
        + (i + 1 < s.length ? zeichen[(n >> 6) & 63] : '=') + (i + 2 < s.length ? zeichen[n & 63] : '=');
    }
    return out;
  };
  globalThis.atob = (s) => {
    s = s.replace(/=+$/, '');
    if (/[^A-Za-z0-9+/]/.test(s)) throw new Error('ungültig');
    let out = '';
    let puffer = 0, bits = 0;
    for (const ch of s) {
      puffer = (puffer << 6) | zeichen.indexOf(ch);
      bits += 6;
      if (bits >= 8) { bits -= 8; out += String.fromCharCode((puffer >> bits) & 255); }
    }
    return out;
  };
}
const { erzeugeCode, leseCode, kodiereTeilId, dekodiereTeilId, fuehreZusammen, leererZustand } = await import('../js/speicher.js');

// ------------------------------------------------------------ Zahl lesen
gleich('Komma', leseZahl('0,25'), 0.25);
gleich('Punkt', leseZahl('0.25'), 0.25);
gleich('Leerzeichen außen', leseZahl('  12,6 '), 12.6);
gleich('Tausender mit Leerzeichen', leseZahl('640 000'), 640000);
gleich('geschütztes Leerzeichen', leseZahl('640 000'), 640000);
gleich('negatives Vorzeichen', leseZahl('-0,18'), -0.18);
gleich('typografisches Minus', leseZahl('−0,18'), -0.18);
gleich('Plus', leseZahl('+0,36'), 0.36);
gleich('e klein', leseZahl('2,5e-3'), 2.5e-3);
gleich('E groß', leseZahl('2.5E-3'), 2.5e-3);
gleich('e positiv', leseZahl('6e3'), 6000);
gleich('Malpunkt', leseZahl('2,5·10^-3'), 2.5e-3);
gleich('Sternchen', leseZahl('2,5*10^-3'), 2.5e-3);
gleich('x', leseZahl('2,5x10^-3'), 2.5e-3);
gleich('Kreuz', leseZahl('2,5×10^-3'), 2.5e-3);
gleich('Leerzeichen statt Malzeichen', leseZahl('2,5 10^-3'), 2.5e-3);
gleich('Leerzeichen um Malpunkt', leseZahl('2,5 · 10 ^ -3'), 2.5e-3);
gleich('Klammer im Exponenten', leseZahl('2,5·10^(-3)'), 2.5e-3);
gleich('hochgestellt', leseZahl('2,5·10⁻³'), 2.5e-3);
gleich('nur Zehnerpotenz', leseZahl('10^-3'), 1e-3);
gleich('negative Zehnerpotenz', leseZahl('-10^3'), -1000);
gleich('Komma am Ende', leseZahl('5,'), 5);
gleich('Komma am Anfang', leseZahl(',5'), 0.5);
gleich('leer', leseZahl(''), NaN);
gleich('Text', leseZahl('abc'), NaN);
gleich('Komma und Punkt gemischt', leseZahl('1.234,5'), NaN);
gleich('Einheit angehängt', leseZahl('0,3 V'), NaN);
gleich('zwei Kommas', leseZahl('1,2,3'), NaN);

// ------------------------------------------------------------ Toleranz
const p = (wert, tol = 0.02, vorzeichen = 'streng') => ({ typ: 'zahl', wert, toleranz_rel: tol, vorzeichen });
pruefe('genau', pruefeZahl('0,30', p(0.3)).richtig);
pruefe('am Rand innen', pruefeZahl('0,306', p(0.3)).richtig);
pruefe('am Rand außen', !pruefeZahl('0,307', p(0.3)).richtig);
pruefe('unten innen', pruefeZahl('0,294', p(0.3)).richtig);
pruefe('unten außen', !pruefeZahl('0,293', p(0.3)).richtig);
pruefe('Toleranz 3 %', pruefeZahl('4,12', p(4.0, 0.03)).richtig);
pruefe('Toleranz 3 % außen', !pruefeZahl('4,13', p(4.0, 0.03)).richtig);
pruefe('negativer Wert', pruefeZahl('-2,1', p(-2.12)).richtig);
pruefe('null richtig', pruefeZahl('0', p(0)).richtig);
pruefe('null mit Komma', pruefeZahl('0,0', p(0)).richtig);
pruefe('null minus', pruefeZahl('-0', p(0)).richtig);
pruefe('null winzig', pruefeZahl('1e-10', p(0)).richtig);
pruefe('null falsch', !pruefeZahl('0,01', p(0)).richtig);
pruefe('null falsch klein', !pruefeZahl('1e-6', p(0)).richtig);
pruefe('null ohne Einheitenhinweis', pruefeZahl('0,01', p(0)).hinweis === null);
pruefe('unlesbar', !pruefeZahl('x', p(1)).lesbar && pruefeZahl('x', p(1)).hinweis === HINWEIS.unlesbar);

// ------------------------------------------------------------ Vorzeichen
let e = pruefeZahl('0,18', p(-0.18, 0.02, 'betrag_ok'));
pruefe('betrag_ok: Betrag zählt', e.richtig);
pruefe('betrag_ok: Hinweis', e.hinweis === HINWEIS.betrag);
e = pruefeZahl('-0,18', p(-0.18, 0.02, 'betrag_ok'));
pruefe('betrag_ok: richtiges Vorzeichen ohne Hinweis', e.richtig && e.hinweis === null);
e = pruefeZahl('-120', p(120, 0.02, 'betrag_ok'), { nurBetrag: true });
pruefe('betrag_ok bei Frage nach dem Betrag ohne Hinweis', e.richtig && e.hinweis === null);
e = pruefeZahl('1,28', p(-1.28));
pruefe('streng: falsches Vorzeichen falsch', !e.richtig);
pruefe('streng: Hinweis Vorzeichen', e.hinweis === HINWEIS.vorzeichen);
e = pruefeZahl('-1,28', p(-1.28));
pruefe('streng: richtig', e.richtig && e.hinweis === null);

// ------------------------------------------------------------ Zehnerpotenzen
for (const [eingabe, wert] of [['3,0', 0.3], ['30', 0.3], ['300', 0.3], ['0,025', 2.5], ['0,0025', 2.5],
  ['0,0045', 4.5], ['2,5e-6', 2.5], ['2500000', 2.5], ['45000', 45]]) {
  e = pruefeZahl(eingabe, p(wert));
  pruefe(`Faktor ${eingabe} statt ${wert}`, !e.richtig && e.hinweis === HINWEIS.einheit, e.hinweis);
}
e = pruefeZahl('-30', p(0.3));
pruefe('Faktor und Vorzeichen', !e.richtig && e.hinweis === HINWEIS.einheit);
e = pruefeZahl('0,5', p(0.3));
pruefe('kein Faktor', !e.richtig && e.hinweis === null);
e = pruefeZahl('0,5', p(0.3), { winkelmodus: 'RAD' });
pruefe('Hinweis RAD', e.hinweis === HINWEIS.rad);
e = pruefeZahl('0,5', p(0.3), { winkelmodus: 'DEG' });
pruefe('Hinweis DEG', e.hinweis === HINWEIS.deg);

pruefe('formatZahl Komma', formatZahl(0.386) === '0,386');
pruefe('formatZahl negativ', formatZahl(-2.12) === '−2,12');
pruefe('formatZahl klein', formatZahl(2.5e-6) === '2,5·10^−6');

// ------------------------------------------------------------ Daten
const roh = typeof read === 'function' ? read('aufgaben.json') : await (await fetch('../aufgaben.json')).text();
const json = JSON.parse(roh);
pruefe('aufgaben.json fehlerfrei', pruefeDaten(json).length === 0, pruefeDaten(json).join(' | '));
const daten = bereite(json);
pruefe('13 Themen', daten.themen.length === 13);
pruefe('52 Aufgaben', daten.aufgaben.length === 52);
pruefe('111 Teilaufgaben', daten.aufgaben.reduce((s, a) => s + a.teile.length, 0) === 111);
pruefe('26 Diagnosefragen', daten.diagnose.length === 26);

// Alle Lösungswerte werden als richtig gewertet, auch deutsch formatiert
for (const a of daten.aufgaben) {
  for (const t of a.teile) {
    if (t.pruefung.typ !== 'zahl') continue;
    const w = t.pruefung.wert;
    pruefe(`Lösungswert ${a.id}${t.id}`, pruefeZahl(String(w).replace('.', ','), t.pruefung).richtig);
    pruefe(`Lösungswert formatiert ${a.id}${t.id}`, pruefeZahl(formatZahl(w), t.pruefung).richtig, formatZahl(w));
  }
}
pruefe('Winkelmodus S4-G1c', winkelmodus(daten.aufgabeNach.get('S4-G1').teile[2]) === 'RAD');
pruefe('Winkelmodus I2-G2a', winkelmodus(daten.aufgabeNach.get('I2-G2').teile[0]) === 'DEG');
pruefe('Winkelmodus I1-G1a', winkelmodus(daten.aufgabeNach.get('I1-G1').teile[0]) === null);

// Fehlerhafte Daten werden erkannt
const kaputt = JSON.parse(roh);
kaputt.aufgaben[1].id = kaputt.aufgaben[0].id;
kaputt.aufgaben[2].thema = 'X9';
kaputt.aufgaben[1].teile[1].pruefung.richtig = [7];
kaputt.diagnose[0].richtig = 9;
const meldungen = pruefeDaten(kaputt);
pruefe('doppelte ID erkannt', meldungen.some((m) => m.includes('doppelt')));
pruefe('fehlendes Thema erkannt', meldungen.some((m) => m.includes('X9')));
pruefe('ungültiger Index erkannt', meldungen.filter((m) => m.includes('ungültiger Index')).length === 2);
pruefe('kein Objekt erkannt', pruefeDaten(null).length === 1);

// ------------------------------------------------------------ Probeklausur
let seed = 12345;
const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
const k = KONFIG.klausur;
let alleGut = true;
const gezogen = new Set();
for (let i = 0; i < 100; i++) {
  const auswahl = zieheKlausur(daten, k, rnd);
  if (!auswahl) { alleGut = false; ausgabe('FEHLER: keine Ziehung gefunden'); break; }
  const v = verteilung(daten, auswahl);
  const gut = v.be >= 38 && v.be <= 42 && v.afb.I / v.be >= 0.30 && v.afb.I / v.be <= 0.35
    && v.afb.II / v.be >= 0.45 && v.afb.II / v.be <= 0.55 && v.afb.III / v.be >= 0.15 && v.afb.III / v.be <= 0.20
    && v.induktion / v.be >= 0.45 && v.induktion / v.be <= 0.55
    && new Set(auswahl.map((a) => a.thema)).size === auswahl.length;
  if (!gut || !passtVerteilung(daten, auswahl, k)) { alleGut = false; ausgabe('FEHLER: Ziehung ' + JSON.stringify(v)); }
  gezogen.add(auswahl.map((a) => a.id).join(','));
}
pruefe('100 Ziehungen in der Spanne', alleGut);
pruefe('Ziehungen unterscheiden sich', gezogen.size > 90, String(gezogen.size));

// Notenpunkte
const s40 = notenschluessel(40);
pruefe('15 NP ab 38 von 40', s40.find((z) => z.np === 15).be === 38);
pruefe('10 NP ab 28 von 40', s40.find((z) => z.np === 10).be === 28);
pruefe('5 NP ab 18 von 40', s40.find((z) => z.np === 5).be === 18);
pruefe('4 NP ab 16 von 40 (38,75 %)', s40.find((z) => z.np === 4).be === 16);
pruefe('1 NP ab 8 von 40', s40.find((z) => z.np === 1).be === 8);
pruefe('NP 40 von 40', notenpunkte(40, 40) === 15);
pruefe('NP 37 von 40', notenpunkte(37, 40) === 14);
pruefe('NP 27 von 40', notenpunkte(27, 40) === 9);
pruefe('NP 7 von 40', notenpunkte(7, 40) === 0);
pruefe('NP aufrunden bei 41', notenschluessel(41).find((z) => z.np === 15).be === 39);
pruefe('NP monoton', s40.every((z, i) => i === 0 || z.be <= s40[i - 1].be));

// ------------------------------------------------------------ Fortschritts-Code
for (const a of daten.aufgaben) {
  for (const t of a.teile) {
    const s = `${a.id}/${t.id}`;
    pruefe(`Kennung ${s}`, dekodiereTeilId(kodiereTeilId(s)) === s);
  }
}
const z = leererZustand();
z.teile['I1-G1/a'] = { r: 2, h: 1, v: 1, l: false, d: true, ok: true };
z.teile['S7-Z/b'] = { r: 0, h: 3, v: 2, l: true, d: true, ok: false };
z.teile['I2-G1/c'] = { r: 0, h: 2, v: 0, l: false, d: false, ok: false };
z.diagnose = { antworten: { 'I1-1': true, 'S7-2': false }, datum: '2026-10-10' };
z.klausurVerlauf = [{ be: 31, max: 40, np: 11, datum: 'x' }];
const code = erzeugeCode(z);
pruefe('Code kurz', code.length < 40, code);
pruefe('Code url-sicher', /^[A-Za-z0-9_-]+$/.test(code));
const zurueck = leseCode(code);
pruefe('Code Teil 1', JSON.stringify(zurueck.teile['I1-G1/a']) === JSON.stringify({ r: 2, h: 1, l: false, d: true, ok: true, v: 0 }));
pruefe('Code Teil 2', zurueck.teile['S7-Z/b'].l && zurueck.teile['S7-Z/b'].h === 3 && zurueck.teile['S7-Z/b'].d);
pruefe('Code Teil 3', zurueck.teile['I2-G1/c'].h === 2 && !zurueck.teile['I2-G1/c'].d);
pruefe('Code Diagnose', zurueck.diagnose.antworten['I1-1'] === true && zurueck.diagnose.antworten['S7-2'] === false);
pruefe('Code Klausur', zurueck.klausurVerlauf[0].np === 11 && zurueck.klausurVerlauf[0].be === 31);
pruefe('Code aus Link', leseCode('https://x.github.io/a/#p=' + code).teile['I1-G1/a'].r === 2);
let geworfen = false;
try { leseCode(code.slice(0, -2) + (code.slice(-2) === 'AA' ? 'AB' : 'AA')); } catch (err) { geworfen = true; }
pruefe('Tippfehler erkannt', geworfen);
geworfen = false;
try { leseCode('Hallo Welt!'); } catch (err) { geworfen = true; }
pruefe('ungültige Zeichen erkannt', geworfen);

// Voller Stand passt in einen Code
const voll = leererZustand();
for (const a of daten.aufgaben) for (const t of a.teile) voll.teile[`${a.id}/${t.id}`] = { r: t.be, h: 1, d: true, ok: true, l: false };
voll.diagnose = { antworten: Object.fromEntries(daten.diagnose.map((q) => [q.schluessel, true])) };
const vollCode = erzeugeCode(voll);
const vollZurueck = leseCode(vollCode);
pruefe('voller Code vollständig', Object.keys(vollZurueck.teile).length === 111 && Object.keys(vollZurueck.diagnose.antworten).length === 26);

// Zusammenführen: der bessere Stand zählt
const a1 = leererZustand();
a1.teile['I1-G1/a'] = { r: 0, h: 2, d: false };
const a2 = leererZustand();
a2.teile['I1-G1/a'] = { r: 2, h: 0, d: true, ok: true };
a2.teile['I1-G2/a'] = { r: 2, h: 0, d: true, ok: true };
const zus = fuehreZusammen(a1, a2);
pruefe('Zusammenführen übernimmt besseren Stand', zus.teile['I1-G1/a'].r === 2 && zus.teile['I1-G2/a'].d);
const zus2 = fuehreZusammen(a2, a1);
pruefe('Zusammenführen behält besseren Stand', zus2.teile['I1-G1/a'].r === 2);

ausgabe(`Unit-Tests: ${ok} bestanden, ${fehl} fehlgeschlagen`);
