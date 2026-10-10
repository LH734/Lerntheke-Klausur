// Fortschritt im localStorage und als kurzer Text-Code.
// Jeder Zugriff auf den Speicher steht in try/catch. Fällt er aus, läuft die App weiter.

const SCHLUESSEL = 'lerntheke-gk12';
const SCHLUESSEL_TEXTE = 'lerntheke-gk12-texte';
const SCHLUESSEL_LEHRER = 'lerntheke-gk12-lehrer';

export function leererZustand() {
  return { version: 1, teile: {}, diagnose: null, klausur: null, klausurVerlauf: [] };
}

let speicherOk = true;

function lies(schluessel) {
  try {
    const roh = window.localStorage.getItem(schluessel);
    return roh ? JSON.parse(roh) : null;
  } catch (e) {
    speicherOk = false;
    return null;
  }
}

function schreib(schluessel, wert) {
  try {
    window.localStorage.setItem(schluessel, JSON.stringify(wert));
    return true;
  } catch (e) {
    speicherOk = false;
    return false;
  }
}

function loesche(schluessel) {
  try {
    window.localStorage.removeItem(schluessel);
  } catch (e) {
    speicherOk = false;
  }
}

export function speicherVerfuegbar() {
  try {
    const k = SCHLUESSEL + '-test';
    window.localStorage.setItem(k, '1');
    window.localStorage.removeItem(k);
    return speicherOk;
  } catch (e) {
    return false;
  }
}

export function ladeZustand() {
  const z = lies(SCHLUESSEL);
  if (!z || z.version !== 1) return leererZustand();
  return { ...leererZustand(), ...z };
}

export function speichereZustand(z) {
  return schreib(SCHLUESSEL, z);
}

export function ladeTexte() {
  return lies(SCHLUESSEL_TEXTE) || {};
}

export function speichereTexte(t) {
  return schreib(SCHLUESSEL_TEXTE, t);
}

export function ladeLehrer() {
  return lies(SCHLUESSEL_LEHRER) || { zSperreAus: false };
}

export function speichereLehrer(l) {
  return schreib(SCHLUESSEL_LEHRER, l);
}

export function allesLoeschen() {
  loesche(SCHLUESSEL);
  loesche(SCHLUESSEL_TEXTE);
}

// ------------------------------------------------------------------ Code
// Aufbau (Bytes): Format, Anzahl Teile, je Teil 2 Byte Kennung + 1 Byte Stand,
// Anzahl Diagnoseantworten, je 1 Byte, Anzahl Probeklausuren, je 3 Byte, Prüfsumme.
// Die Kennungen werden aus den IDs gebildet, damit Codes auch nach Inhaltsänderungen gültig bleiben.

const FORMAT = 1;
const STUFE_NR = { G: 0, A: 1, Z: 2 };
const NR_STUFE = ['G', 'A', 'Z'];

export function kodiereTeilId(schluessel) {
  const m = /^([IS])([1-7])-([GAZ])([1-7]?)\/([a-h])$/.exec(schluessel);
  if (!m) return null;
  return (m[1] === 'S' ? 1 << 11 : 0)
    | (Number(m[2]) << 8)
    | (STUFE_NR[m[3]] << 6)
    | ((m[4] ? Number(m[4]) : 0) << 3)
    | (m[5].charCodeAt(0) - 97);
}

export function dekodiereTeilId(n) {
  const bereich = n & (1 << 11) ? 'S' : 'I';
  const thema = (n >> 8) & 7;
  const stufe = NR_STUFE[(n >> 6) & 3];
  const nr = (n >> 3) & 7;
  const teil = String.fromCharCode(97 + (n & 7));
  return `${bereich}${thema}-${stufe}${nr || ''}/${teil}`;
}

function kodiereDiagnose(schluessel, richtig) {
  const m = /^([IS])([1-7])-([1-7])$/.exec(schluessel);
  if (!m) return null;
  return (m[1] === 'S' ? 128 : 0) | (Number(m[2]) << 4) | (Number(m[3]) << 1) | (richtig ? 1 : 0);
}

function dekodiereDiagnose(b) {
  return { schluessel: `${b & 128 ? 'S' : 'I'}${(b >> 4) & 7}-${(b >> 1) & 7}`, richtig: !!(b & 1) };
}

function zuBase64Url(bytes) {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function ausBase64Url(text) {
  const s = text.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(s + '==='.slice((s.length + 3) % 4));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

export function erzeugeCode(z) {
  const bytes = [FORMAT];
  const teile = Object.entries(z.teile).filter(([k, t]) => kodiereTeilId(k) !== null && istBeruehrt(t)).slice(0, 255);
  bytes.push(teile.length);
  for (const [k, t] of teile) {
    const id = kodiereTeilId(k);
    bytes.push(id >> 8, id & 255);
    bytes.push((Math.min(t.r || 0, 7)) | (Math.min(t.h || 0, 3) << 3) | (t.l ? 32 : 0) | (t.d ? 64 : 0) | (t.ok ? 128 : 0));
  }
  const diag = z.diagnose ? Object.entries(z.diagnose.antworten || {}) : [];
  const diagBytes = diag.map(([k, r]) => kodiereDiagnose(k, r)).filter((b) => b !== null).slice(0, 255);
  bytes.push(diagBytes.length, ...diagBytes);
  const verlauf = (z.klausurVerlauf || []).slice(-5);
  bytes.push(verlauf.length);
  for (const v of verlauf) bytes.push(Math.min(v.be, 255), Math.min(v.max, 255), Math.min(v.np, 15));
  bytes.push(bytes.reduce((s, b) => (s + b) & 255, 0));
  return zuBase64Url(bytes);
}

/** Liest einen Code. Wirft einen Fehler mit lesbarer Meldung, wenn er nicht stimmt. */
export function leseCode(text) {
  const sauber = String(text || '').trim().replace(/^.*#p=/, '').replace(/\s+/g, '');
  if (!sauber) throw new Error('Es wurde kein Code eingegeben.');
  let bytes;
  try {
    bytes = ausBase64Url(sauber);
  } catch (e) {
    throw new Error('Der Code enthält ungültige Zeichen.');
  }
  const pruef = bytes.slice(0, -1).reduce((s, b) => (s + b) & 255, 0);
  if (bytes.length < 5 || bytes[0] !== FORMAT || pruef !== bytes[bytes.length - 1]) {
    throw new Error('Der Code ist unvollständig oder falsch abgeschrieben.');
  }
  let i = 1;
  const z = leererZustand();
  const nTeile = bytes[i++];
  for (let n = 0; n < nTeile; n++) {
    const id = (bytes[i] << 8) | bytes[i + 1];
    const s = bytes[i + 2];
    i += 3;
    z.teile[dekodiereTeilId(id)] = {
      r: s & 7, h: (s >> 3) & 3, l: !!(s & 32), d: !!(s & 64), ok: !!(s & 128), v: 0,
    };
  }
  const nDiag = bytes[i++];
  if (nDiag) {
    z.diagnose = { antworten: {}, datum: null };
    for (let n = 0; n < nDiag; n++) {
      const { schluessel, richtig } = dekodiereDiagnose(bytes[i++]);
      z.diagnose.antworten[schluessel] = richtig;
    }
  }
  const nKlausur = bytes[i++];
  for (let n = 0; n < nKlausur; n++) {
    z.klausurVerlauf.push({ be: bytes[i], max: bytes[i + 1], np: bytes[i + 2], datum: null });
    i += 3;
  }
  if (i !== bytes.length - 1) throw new Error('Der Code ist unvollständig oder falsch abgeschrieben.');
  return z;
}

function istBeruehrt(t) {
  return t && (t.d || t.h || t.l || t.r);
}

function rang(t) {
  if (!t) return 0;
  return (t.d ? 1000 : 0) + (t.r || 0) * 10 + (t.ok ? 5 : 0) - (t.h || 0);
}

/** Führt zwei Stände zusammen. Je Teilaufgabe zählt der bessere Stand. */
export function fuehreZusammen(hier, neu) {
  const z = { ...hier, teile: { ...hier.teile } };
  for (const [k, t] of Object.entries(neu.teile)) {
    if (rang(t) > rang(z.teile[k])) z.teile[k] = { ...z.teile[k], ...t };
  }
  if (neu.diagnose && Object.keys(neu.diagnose.antworten || {}).length) {
    if (!z.diagnose || !Object.keys(z.diagnose.antworten || {}).length) z.diagnose = neu.diagnose;
  }
  const bekannt = new Set((z.klausurVerlauf || []).map((v) => `${v.be}/${v.max}/${v.np}`));
  z.klausurVerlauf = [...(z.klausurVerlauf || [])];
  for (const v of neu.klausurVerlauf || []) {
    if (!bekannt.has(`${v.be}/${v.max}/${v.np}`)) z.klausurVerlauf.push(v);
  }
  return z;
}
