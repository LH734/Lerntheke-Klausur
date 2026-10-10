// Probeklausur: Zusammenstellung und Notenpunkte.
import { aufgabeBE, mische, sortiereAufgaben } from './daten.js';

/** Kennzahlen einer Auswahl ganzer Aufgaben. */
export function verteilung(daten, auswahl) {
  const afb = { I: 0, II: 0, III: 0 };
  let be = 0;
  let induktion = 0;
  for (const a of auswahl) {
    for (const t of a.teile) {
      afb[t.afb] += t.be;
      be += t.be;
      if (daten.themaNach.get(a.thema).bereich === 'Induktion') induktion += t.be;
    }
  }
  return { be, afb, induktion };
}

function imBereich(x, [min, max]) {
  return x >= min - 1e-9 && x <= max + 1e-9;
}

/** Erfüllt die Auswahl alle Vorgaben aus der Konfiguration? */
export function passtVerteilung(daten, auswahl, k) {
  const v = verteilung(daten, auswahl);
  if (v.be < k.beMin || v.be > k.beMax) return false;
  return imBereich(v.afb.I / v.be, k.afbI)
    && imBereich(v.afb.II / v.be, k.afbII)
    && imBereich(v.afb.III / v.be, k.afbIII)
    && imBereich(v.induktion / v.be, k.anteilInduktion);
}

/**
 * Zieht ganze Aufgaben, bis die Verteilung passt.
 * Gibt die Aufgaben sortiert nach Bereich und Thema zurück oder null, wenn nichts passt.
 */
export function zieheKlausur(daten, k, rnd = Math.random) {
  for (let versuch = 0; versuch < k.versuche; versuch++) {
    const auswahl = [];
    const themen = new Set();
    let be = 0;
    for (const a of mische(daten.aufgaben, rnd)) {
      if (k.hoechstensEineAufgabeJeThema && themen.has(a.thema)) continue;
      const b = aufgabeBE(a);
      if (be + b > k.beMax) continue;
      auswahl.push(a);
      themen.add(a.thema);
      be += b;
      if (be >= k.beMin) break;
    }
    if (passtVerteilung(daten, auswahl, k)) return sortiereAufgaben(daten, auswahl);
  }
  return null;
}

/**
 * Notenpunkte nach dem Schlüssel Sachsen-Anhalt:
 * 15 NP ab 95 %, 10 NP ab 70 %, 5 NP ab 45 %, 1 NP ab 20 %, dazwischen linear je NP.
 * Die BE-Grenzen werden aufgerundet.
 */
export function prozentGrenze(np) {
  if (np >= 10) return 70 + (np - 10) * 5;
  if (np >= 5) return 45 + (np - 5) * 5;
  return 20 + (np - 1) * 6.25;
}

export function notenschluessel(maxBE) {
  const zeilen = [];
  for (let np = 15; np >= 1; np--) {
    const p = prozentGrenze(np);
    zeilen.push({ np, prozent: p, be: Math.ceil((p / 100) * maxBE - 1e-9) });
  }
  return zeilen;
}

export function notenpunkte(be, maxBE) {
  for (const z of notenschluessel(maxBE)) {
    if (be >= z.be) return z.np;
  }
  return 0;
}
