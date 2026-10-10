// Zahleneingabe lesen und mit der Prüfung aus aufgaben.json vergleichen.

export const HINWEIS = {
  betrag: 'Der Betrag stimmt. Beachte das Minuszeichen im Induktionsgesetz: steigender Fluss gibt negative Spannung.',
  vorzeichen: 'Prüfe das Vorzeichen.',
  einheit: 'Prüfe die Einheitenumrechnung (cm, mm, µ, m, k …).',
  unlesbar: 'Die Eingabe ist keine Zahl. Schreibe zum Beispiel 0,25 oder 2,5·10^-3.',
  rad: 'Prüfe, ob der Taschenrechner auf Bogenmaß (RAD) steht.',
  deg: 'Prüfe, ob der Taschenrechner auf Grad (DEG) steht.',
};

// Faktoren, um die eine Eingabe bei falscher Umrechnung typischerweise danebenliegt.
const FAKTOREN = [10, 100, 1000, 1e6, 0.1, 0.01, 1e-3, 1e-6];

const HOCH = {
  '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7',
  '⁸': '8', '⁹': '9', '⁻': '-', '⁺': '+',
};

const MANTISSE = '(?:\\d+(?:\\.\\d*)?|\\.\\d+)';
const RE_E = new RegExp('^([+-]?)(' + MANTISSE + ')(?:e([+-]?\\d+))?$', 'i');
const RE_POTENZ = new RegExp('^([+-]?)(?:(' + MANTISSE + ')\\*)?10\\^\\(?([+-]?\\d+)\\)?$');

/**
 * Liest eine Zahl wie „0,25“, „2,5e-3“, „2,5·10^-3“, „−0,18“ oder „640 000“.
 * Gibt NaN zurück, wenn die Eingabe nicht eindeutig lesbar ist.
 */
export function leseZahl(eingabe) {
  if (typeof eingabe !== 'string') return NaN;
  let s = eingabe.trim();
  if (!s) return NaN;
  s = s.replace(/[−‐-—]/g, '-');
  s = s.replace(/10\s*([⁻⁺]?[⁰¹²³⁴⁵⁶⁷⁸⁹]+)/g,
    (_, e) => '10^' + [...e].map((c) => HOCH[c]).join(''));
  // Malzeichen vereinheitlichen, auch „2,5 10^-3“ mit Leerzeichen
  s = s.replace(/\s*[·⋅•×xX*]\s*(?=10\s*\^)/g, '*');
  s = s.replace(/(\d)\s+(?=10\s*\^)/g, '$1*');
  s = s.replace(/[\s  ']/g, '');
  if (s.includes(',') && s.includes('.')) return NaN;
  s = s.replace(/,/g, '.');

  let m = s.match(RE_E);
  if (m) {
    const x = Number(m[2]) * Math.pow(10, m[3] ? Number(m[3]) : 0);
    return m[1] === '-' ? -x : x;
  }
  m = s.match(RE_POTENZ);
  if (m) {
    const mant = m[2] === undefined ? 1 : Number(m[2]);
    const x = mant * Math.pow(10, Number(m[3]));
    return m[1] === '-' ? -x : x;
  }
  return NaN;
}

/** Liegt x innerhalb der Toleranz um wert? */
export function passt(x, wert, toleranzRel) {
  if (!Number.isFinite(x)) return false;
  if (wert === 0) return Math.abs(x) <= 1e-9;
  return Math.abs(x - wert) <= toleranzRel * Math.abs(wert) * (1 + 1e-9);
}

/**
 * Prüft eine Eingabe.
 * pruefung: { wert, toleranz_rel, vorzeichen: "streng" | "betrag_ok" }
 * optionen.nurBetrag: Die Aufgabe fragt ausdrücklich nach dem Betrag.
 * optionen.winkelmodus: "RAD" oder "DEG", wenn die Aufgabe einen Winkelmodus braucht.
 * Ergebnis: { richtig: bool, lesbar: bool, hinweis: string | null }
 */
export function pruefeZahl(eingabe, pruefung, optionen = {}) {
  const x = typeof eingabe === 'number' ? eingabe : leseZahl(eingabe);
  if (!Number.isFinite(x)) return { richtig: false, lesbar: false, hinweis: HINWEIS.unlesbar };
  const w = pruefung.wert;
  const tol = pruefung.toleranz_rel ?? 0.02;

  if (passt(x, w, tol)) return { richtig: true, lesbar: true, hinweis: null };

  if (w !== 0 && passt(-x, w, tol)) {
    if (pruefung.vorzeichen === 'betrag_ok') {
      return { richtig: true, lesbar: true, hinweis: optionen.nurBetrag ? null : HINWEIS.betrag };
    }
    return { richtig: false, lesbar: true, hinweis: HINWEIS.vorzeichen };
  }

  if (w !== 0) {
    for (const f of FAKTOREN) {
      if (passt(x / f, w, tol) || passt(-x / f, w, tol)) {
        return { richtig: false, lesbar: true, hinweis: HINWEIS.einheit };
      }
    }
  }

  if (optionen.winkelmodus === 'RAD') return { richtig: false, lesbar: true, hinweis: HINWEIS.rad };
  if (optionen.winkelmodus === 'DEG') return { richtig: false, lesbar: true, hinweis: HINWEIS.deg };
  return { richtig: false, lesbar: true, hinweis: null };
}

/** Zahl deutsch formatieren, z. B. 0.386 → „0,386“, 2.5e-6 → „2,5·10^-6“. */
export function formatZahl(x) {
  if (x === 0) return '0';
  const a = Math.abs(x);
  let s;
  if (a >= 1e-3 && a < 1e6) {
    s = String(Number(x.toPrecision(6)));
  } else {
    const [m, e] = x.toExponential(3).split('e');
    s = String(Number(m)) + '·10^' + Number(e);
  }
  return s.replace('.', ',').replace(/-/g, '−');
}
