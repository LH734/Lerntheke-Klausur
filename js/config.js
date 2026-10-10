// Einstellungen der Lerntheke. Nach einer Änderung die Datei ins Repo hochladen,
// dann gilt sie für alle Geräte.

export const KONFIG = {
  // Z-Aufgaben eines Themas erst freigeben, wenn G und A dieses Themas bearbeitet sind.
  // false schaltet die Sperre für alle Geräte ab.
  zSperre: true,

  // Auswahlaufgaben geben die BE nur, wenn der erste Prüfversuch richtig ist.
  // false: richtig vor dem Anzeigen der Lösung gibt die BE, wie bei Zahlenaufgaben.
  auswahlNurErsterVersuch: true,

  // Probeklausur
  klausur: {
    beMin: 38,
    beMax: 42,
    afbI: [0.30, 0.35],
    afbII: [0.45, 0.55],
    afbIII: [0.15, 0.20],
    anteilInduktion: [0.45, 0.55],
    hoechstensEineAufgabeJeThema: true,
    versuche: 20000,
  },
};
