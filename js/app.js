// Lerntheke Klausur: Oberfläche und Ablauf.
import { KONFIG } from './config.js';
import {
  pruefeDaten, bereite, teilSchluessel, aufgabeBE, afbListe, mische, winkelmodus,
  STUFEN, STUFE_NAME, STUFE_PLURAL,
} from './daten.js';
import { pruefeZahl, formatZahl } from './zahl.js';
import { zieheKlausur, notenpunkte, notenschluessel, verteilung } from './klausur.js';
import * as sp from './speicher.js';
import { abbildung } from './abbildungen.js';

const LEHRER = new URLSearchParams(location.search).get('lehrer') === '1';
const main = document.getElementById('inhalt');
const nav = document.getElementById('navigation');
const hinweisLeiste = document.getElementById('hinweisleiste');

let daten = null;
let rohText = '';
let zustand = sp.ladeZustand();
let texte = sp.ladeTexte();
let lehrer = sp.ladeLehrer();
let diagnoseSitzung = null;
let uhr = null;
// Zustand der aktuellen Anzeige: Reihenfolge der Optionen, Eingaben, Rückmeldungen
let ansicht = neueAnsicht();

function neueAnsicht() {
  return { reihenfolge: {}, eingaben: {}, rueckmeldung: {}, phase: {}, auswahl: {} };
}

// ------------------------------------------------------------------ Hilfsfunktionen

function h(tag, attrs, ...kinder) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === null || v === undefined || v === false) continue;
    if (k === 'class') e.className = v;
    else if (k === 'text') e.textContent = v;
    else if (k === 'value') e.value = v;
    else if (k === 'checked') e.checked = !!v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else if (v === true) e.setAttribute(k, '');
    else e.setAttribute(k, v);
  }
  for (const k of kinder.flat(3)) {
    if (k === null || k === undefined || k === false) continue;
    e.appendChild(typeof k === 'string' || typeof k === 'number' ? document.createTextNode(String(k)) : k);
  }
  return e;
}

/** Hängt Kinder an und überspringt leere Werte (null, undefined, false). */
function knoten(kinder) {
  return kinder.flat(3).filter((k) => k !== null && k !== undefined && k !== false);
}

function anfuegen(el, ...kinder) {
  el.append(...knoten(kinder));
}

function ersetzen(el, ...kinder) {
  el.replaceChildren(...knoten(kinder));
}

/** Text mit LaTeX in $…$ als Element. Gerendert wird mit mathe(). */
function tx(text, tag = 'span', klasse) {
  return h(tag, { class: klasse }, text);
}

function mathe(wurzel) {
  if (typeof window.renderMathInElement === 'function') {
    window.renderMathInElement(wurzel, {
      delimiters: [{ left: '$', right: '$', display: false }],
      throwOnError: false,
    });
  }
  passeFormelnAn(wurzel);
}

/** Zu breite Formeln bekommen einen eigenen, waagerecht scrollbaren Container. */
function passeFormelnAn(wurzel) {
  for (const k of wurzel.querySelectorAll('.katex')) {
    if (k.parentElement.classList.contains('formel-lang')) continue;
    const block = k.parentElement.closest('p, li, label, h1, h2, h3, td, dd, div, figcaption, summary');
    if (!block || !block.clientWidth) continue;
    if (k.getBoundingClientRect().width > block.clientWidth + 1) {
      const huelle = h('span', { class: 'formel-lang' });
      k.replaceWith(huelle);
      huelle.appendChild(k);
    }
  }
}

function speichere() {
  sp.speichereZustand(zustand);
}

function knopf(text, onclick, klasse = 'knopf', extra = {}) {
  return h('button', { type: 'button', class: klasse, onclick, ...extra }, text);
}

function link(text, ziel, klasse = 'knopf') {
  return h('a', { href: ziel, class: klasse }, text);
}

function listeUnd(teile) {
  if (teile.length <= 1) return teile.join('');
  return teile.slice(0, -1).join(', ') + ' und ' + teile[teile.length - 1];
}

function prozent(x) {
  return `${Math.round(x * 100)}\u00a0%`;
}

function zeitText(ms) {
  const s = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function datumText(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
    + ', ' + d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
}

function stufeChip(stufe) {
  return h('span', { class: `chip stufe-${stufe}` }, `${stufe} ${STUFE_NAME[stufe]}`);
}

/** Bestätigung direkt im Text, ohne Dialogfenster. */
function bestaetigung(frage, jaText, ja, neinText = 'Abbrechen') {
  const box = h('div', { class: 'bestaetigung', role: 'alertdialog' });
  anfuegen(box, 
    h('p', {}, frage),
    h('div', { class: 'knopfreihe' },
      knopf(jaText, ja, 'knopf warnung', { 'data-aktion': 'ja' }),
      knopf(neinText, () => box.remove(), 'knopf leise')),
  );
  return box;
}

// ------------------------------------------------------------------ Stand

function stand(a, t) {
  return zustand.teile[teilSchluessel(a, t)];
}

function standSchreiben(a, t) {
  const k = teilSchluessel(a, t);
  if (!zustand.teile[k]) zustand.teile[k] = { r: 0, h: 0, v: 0, l: false, d: false, ok: false };
  return zustand.teile[k];
}

function ohneHilfe(st) {
  return st && st.d && !st.h && !st.l;
}

function aufgabeStand(a) {
  let erledigt = 0;
  let be = 0;
  let hilfen = 0;
  let frei = 0;
  let beruehrt = false;
  for (const t of a.teile) {
    const st = stand(a, t);
    if (!st) continue;
    if (st.d || st.h || st.v) beruehrt = true;
    if (st.d) erledigt++;
    be += st.r || 0;
    hilfen += st.h || 0;
    if (ohneHilfe(st)) frei++;
  }
  return { erledigt, gesamt: a.teile.length, be, beMax: aufgabeBE(a), hilfen, frei, beruehrt };
}

function themaStand(themaId, stufe) {
  const liste = daten.aufgabenJeThema.get(themaId).filter((a) => !stufe || a.stufe === stufe);
  const s = { erledigt: 0, gesamt: 0, be: 0, beMax: 0, hilfen: 0, frei: 0 };
  for (const a of liste) {
    const x = aufgabeStand(a);
    for (const k of Object.keys(s)) s[k] += x[k];
  }
  return s;
}

function zSperreAktiv() {
  return KONFIG.zSperre && !lehrer.zSperreAus;
}

function zOffen(themaId) {
  if (!zSperreAktiv()) return true;
  return daten.aufgabenJeThema.get(themaId)
    .filter((a) => a.stufe !== 'Z')
    .every((a) => a.teile.every((t) => stand(a, t)?.d));
}

function diagnoseFehlerThemen() {
  const antworten = zustand.diagnose?.antworten || {};
  const themen = new Set();
  for (const [k, richtig] of Object.entries(antworten)) {
    if (!richtig) themen.add(k.split('-')[0]);
  }
  return themen;
}

function diagnoseThema(themaId) {
  const antworten = zustand.diagnose?.antworten;
  if (!antworten) return null;
  const eintraege = Object.entries(antworten).filter(([k]) => k.split('-')[0] === themaId);
  if (!eintraege.length) return null;
  return { richtig: eintraege.filter(([, r]) => r).length, gesamt: eintraege.length };
}

// ------------------------------------------------------------------ Navigation

const SEITEN = [
  ['#/', 'Start'],
  ['#/themen', 'Themen'],
  ['#/klausur', 'Probeklausur'],
  ['#/uebersicht', 'Übersicht'],
];

function zeichneNavigation(route) {
  const eintraege = LEHRER ? [...SEITEN, ['#/lehrer', 'Lehrkraft']] : SEITEN;
  ersetzen(nav, ...eintraege.map(([ziel, name]) => {
    const aktiv = route === ziel.slice(1) || (ziel !== '#/' && route.startsWith(ziel.slice(1)))
      || (ziel === '#/themen' && /^\/(thema|aufgabe)\//.test(route));
    return h('a', { href: ziel, class: aktiv ? 'aktiv' : null, 'aria-current': aktiv ? 'page' : null }, name);
  }));
}

function route() {
  const hash = location.hash || '#/';
  if (hash.startsWith('#p=')) return { pfad: '/laden', code: hash.slice(3) };
  return { pfad: hash.slice(1) || '/' };
}

function zeichne() {
  if (uhr) { clearInterval(uhr); uhr = null; }
  ansicht = neueAnsicht();
  const r = route();
  zeichneNavigation(r.pfad);
  const teile = r.pfad.split('/').filter(Boolean);
  let titel = 'Lerntheke Klausur';
  ersetzen(main);
  if (!teile.length) seiteStart();
  else if (teile[0] === 'themen') { seiteThemen(); titel = 'Themen'; }
  else if (teile[0] === 'thema') seiteThema(decodeURIComponent(teile[1] || ''));
  else if (teile[0] === 'aufgabe') seiteAufgabe(decodeURIComponent(teile[1] || ''));
  else if (teile[0] === 'diagnose') { seiteDiagnose(); titel = 'Diagnose'; }
  else if (teile[0] === 'klausur') { seiteKlausur(); titel = 'Probeklausur'; }
  else if (teile[0] === 'uebersicht') { seiteUebersicht(); titel = 'Meine Übersicht'; }
  else if (teile[0] === 'sichern') { seiteSichern(); titel = 'Fortschritt sichern'; }
  else if (teile[0] === 'laden') { seiteLaden(r.code); titel = 'Fortschritt laden'; }
  else if (teile[0] === 'lehrer' && LEHRER) { seiteLehrer(); titel = 'Lehrkraft'; }
  else seiteNichtGefunden();
  document.title = titel === 'Lerntheke Klausur' ? titel : `${titel} · Lerntheke Klausur`;
  mathe(main);
  window.scrollTo(0, 0);
}

function seiteNichtGefunden() {
  anfuegen(main, h('section', { class: 'karte' },
    h('h1', {}, 'Seite nicht gefunden'),
    h('p', {}, 'Diese Seite gibt es in der Lerntheke nicht.'),
    link('Zur Startseite', '#/')));
}

// ------------------------------------------------------------------ Start

function seiteStart() {
  const hatStand = Object.keys(zustand.teile).length > 0 || zustand.diagnose;
  anfuegen(main, 
    h('section', { class: 'kopfbereich' },
      h('h1', {}, daten.meta.titel),
      h('p', { class: 'untertitel' }, `${daten.meta.kurs}: Elektromagnetische Induktion und mechanische Schwingungen`)),
    h('section', { class: 'karte' },
      h('h2', {}, 'So arbeitest du'),
      h('ul', { class: 'liste' },
        h('li', {}, 'Rechne im Hefter. In die App gibst du nur das Ergebnis ein.'),
        h('li', {}, 'Erklärungen und Begründungen schreibst du in den Hefter oder in das Textfeld. Danach vergleichst du sie mit einer Kriterienliste.'),
        h('li', {}, 'Jedes Thema hat Aufgaben auf drei Stufen. ',
          h('strong', { class: 'stufe-text-G' }, 'G'), ' sind Grundaufgaben nah am Hefter. ',
          h('strong', { class: 'stufe-text-A' }, 'A'), ' sind Anwendungen in einem neuen Kontext. ',
          h('strong', { class: 'stufe-text-Z' }, 'Z'), ' sind Zusatzaufgaben auf Klausurniveau.'),
        zSperreAktiv() ? h('li', {}, 'Die Z-Aufgaben eines Themas werden frei, wenn du die G- und A-Aufgaben dieses Themas bearbeitet hast.') : null,
        h('li', {}, 'Hilfen kosten keine BE. Sie werden aber gezählt.'),
        h('li', {}, 'Beginne am besten mit der Diagnose. Sie zeigt dir, welche Themen du zuerst üben solltest.')),
      h('div', { class: 'knopfreihe' },
        knopf('Diagnose starten', () => { starteDiagnose(); location.hash = '#/diagnose'; }, 'knopf haupt'),
        link('Zur Themenübersicht', '#/themen'),
        link('Probeklausur', '#/klausur'))),
    h('section', { class: 'karte' },
      h('h2', {}, 'Dein Fortschritt'),
      sp.speicherVerfuegbar()
        ? h('p', {}, 'Der Fortschritt wird nur auf diesem Gerät gespeichert. Mit einem Code nimmst du ihn auf ein anderes Gerät mit.')
        : h('p', { class: 'warnhinweis' }, 'Dieser Browser speichert keine Daten. Die Lerntheke funktioniert trotzdem. Sichere deinen Fortschritt vor dem Schließen als Code.'),
      h('p', { class: 'klein' }, 'Auf iPad und iPhone löscht Safari gespeicherte Daten nach einigen Tagen ohne Nutzung. Sichere deinen Fortschritt deshalb am Ende jeder Stunde als Code oder lege die Lerntheke über „Teilen“ und „Zum Home-Bildschirm“ ab.'),
      hatStand ? h('p', { class: 'klein' }, 'Hat vor dir jemand anderes an diesem Gerät gearbeitet? Dann beginne unter „Meine Übersicht“ neu.') : null,
      h('div', { class: 'knopfreihe' },
        link('Fortschritt sichern', '#/sichern'),
        link('Fortschritt laden', '#/laden'))),
  );
}

// ------------------------------------------------------------------ Themen

function balken(stufe, s, gesperrt) {
  const anteil = s.gesamt ? s.erledigt / s.gesamt : 0;
  return h('div', { class: `balken stufe-${stufe}${gesperrt ? ' gesperrt' : ''}` },
    h('span', { class: 'balken-name' }, stufe),
    h('span', {
      class: 'balken-spur', role: 'progressbar', 'aria-label': `${STUFE_PLURAL[stufe]} bearbeitet`,
      'aria-valuemin': 0, 'aria-valuemax': s.gesamt, 'aria-valuenow': s.erledigt,
    }, h('span', { class: 'balken-fuellung', style: `width:${Math.round(anteil * 100)}%` })),
    h('span', { class: 'balken-zahl' }, gesperrt ? 'gesperrt' : `${s.erledigt}/${s.gesamt}`));
}

function seiteThemen() {
  const empfohlen = diagnoseFehlerThemen();
  anfuegen(main, h('section', { class: 'kopfbereich' },
    h('h1', {}, 'Themenübersicht'),
    h('p', { class: 'untertitel' }, empfohlen.size
      ? 'Markierte Themen empfiehlt dir die Diagnose zuerst. Die Balken zeigen, wie viele Teilaufgaben je Stufe bearbeitet sind.'
      : 'Die Balken zeigen, wie viele Teilaufgaben je Stufe bearbeitet sind.')));
  for (const b of daten.bereiche) {
    anfuegen(main, h('h2', { class: 'bereich' }, b.name));
    anfuegen(main, h('div', { class: 'kacheln' }, b.themen.map((t) => {
      const zoffen = zOffen(t.id);
      return h('a', { href: `#/thema/${t.id}`, class: `kachel${empfohlen.has(t.id) ? ' empfohlen' : ''}`, 'data-thema': t.id },
        h('span', { class: 'kachel-kopf' },
          h('span', { class: 'kachel-id' }, t.id),
          empfohlen.has(t.id) ? h('span', { class: 'chip empfehlung' }, 'Empfohlen') : null),
        h('span', { class: 'kachel-titel' }, t.titel),
        h('span', { class: 'kachel-hefter' }, t.hefter),
        h('span', { class: 'balken-gruppe' },
          STUFEN.map((s) => balken(s, themaStand(t.id, s), s === 'Z' && !zoffen))));
    })));
  }
}

function seiteThema(id) {
  const t = daten.themaNach.get(id);
  if (!t) { seiteNichtGefunden(); return; }
  const zoffen = zOffen(id);
  const diag = diagnoseThema(id);
  anfuegen(main, 
    h('p', { class: 'zurueck' }, h('a', { href: '#/themen' }, 'Zur Themenübersicht')),
    h('section', { class: 'kopfbereich' },
      h('p', { class: 'ueberzeile' }, `${t.id} · ${daten.bereiche.find((b) => b.id === t.bereich).name}`),
      h('h1', {}, t.titel),
      h('p', { class: 'untertitel' }, `Hefter: ${t.hefter}`)),
    h('section', { class: 'karte' },
      h('h2', {}, 'Das musst du können'),
      h('ul', { class: 'checkliste' }, t.checkliste.map((c) => tx(c, 'li'))),
      diag ? h('p', { class: 'klein' }, `Diagnose: ${diag.richtig} von ${diag.gesamt} Fragen richtig.`) : null),
  );
  const aufgaben = daten.aufgabenJeThema.get(id);
  for (const stufe of STUFEN) {
    const liste = aufgaben.filter((a) => a.stufe === stufe);
    if (!liste.length) continue;
    const gesperrt = stufe === 'Z' && !zoffen;
    anfuegen(main, h('section', { class: `stufenblock stufe-${stufe}` },
      h('h2', {}, h('span', { class: `chip stufe-${stufe}` }, stufe), ` ${STUFE_PLURAL[stufe]}`),
      gesperrt ? h('p', { class: 'sperrhinweis' }, 'Die Zusatzaufgaben werden frei, wenn alle Teilaufgaben der G- und A-Aufgaben dieses Themas bearbeitet sind.') : null,
      h('ul', { class: 'aufgabenliste' }, liste.map((a) => {
        const s = aufgabeStand(a);
        const status = s.erledigt === s.gesamt ? `bearbeitet, ${s.be} von ${s.beMax} BE`
          : s.beruehrt ? `begonnen, ${s.erledigt} von ${s.gesamt} Teilaufgaben` : `${s.beMax} BE, offen`;
        const inhalt = [
          h('span', { class: 'aufgabe-titel' }, a.titel),
          h('span', { class: 'aufgabe-status' }, gesperrt ? `${s.beMax} BE, gesperrt` : status),
        ];
        return h('li', {}, gesperrt
          ? h('span', { class: 'aufgabe-eintrag gesperrt', 'aria-disabled': 'true' }, inhalt)
          : h('a', { href: `#/aufgabe/${a.id}`, class: `aufgabe-eintrag${s.erledigt === s.gesamt ? ' fertig' : ''}` }, inhalt));
      }))));
  }
}

// ------------------------------------------------------------------ Aufgabe

function aufgabenKopf(a, mitThema = true) {
  const t = daten.themaNach.get(a.thema);
  return h('header', { class: 'aufgabenkopf' },
    mitThema ? h('p', { class: 'ueberzeile' }, `${t.id} ${t.titel}`) : null,
    h('h1', {}, a.titel),
    h('p', { class: 'chips' },
      stufeChip(a.stufe),
      h('span', { class: 'chip' }, `${aufgabeBE(a)} BE`),
      h('span', { class: 'chip' }, `AFB ${listeUnd(afbListe(a))}`)));
}

function seiteAufgabe(id) {
  const a = daten.aufgabeNach.get(id);
  if (!a) { seiteNichtGefunden(); return; }
  anfuegen(main, h('p', { class: 'zurueck' }, h('a', { href: `#/thema/${a.thema}` }, 'Zurück zum Thema')));
  if (a.stufe === 'Z' && !zOffen(a.thema)) {
    anfuegen(main, h('section', { class: 'karte' },
      aufgabenKopf(a),
      h('p', { class: 'sperrhinweis' }, 'Diese Zusatzaufgabe wird frei, wenn alle Teilaufgaben der G- und A-Aufgaben dieses Themas bearbeitet sind.'),
      link('Zum Thema', `#/thema/${a.thema}`)));
    return;
  }
  const fig = abbildung(a);
  const teileBox = h('div', { class: 'teile' });
  anfuegen(main, h('article', { class: 'aufgabe', 'data-aufgabe': a.id },
    h('div', { class: 'aufgabe-links' },
      aufgabenKopf(a),
      tx(a.kontext, 'p', 'kontext'),
      fig),
    h('div', { class: 'aufgabe-rechts' }, teileBox)));
  zeichneTeile(a, teileBox);
}

/** Zeigt alle erledigten Teilaufgaben und die erste offene. */
function zeichneTeile(a, box) {
  const vorhanden = [...box.children];
  const soll = [];
  for (const t of a.teile) {
    soll.push(t);
    if (!stand(a, t)?.d) break;
  }
  soll.forEach((t, i) => {
    if (!vorhanden[i]) {
      const karte = teilKarte(a, t, box);
      box.appendChild(karte);
      mathe(karte);
    }
  });
  const alleFertig = a.teile.every((t) => stand(a, t)?.d);
  const abschluss = box.querySelector('.abschluss');
  if (alleFertig && !abschluss) {
    const karte = abschlussKarte(a);
    box.appendChild(karte);
    mathe(karte);
  }
}

function erneuereTeil(a, t, box, alt) {
  const neu = teilKarte(a, t, box);
  alt.replaceWith(neu);
  mathe(neu);
  zeichneTeile(a, box);
}

function teilKarte(a, t, box) {
  const k = teilSchluessel(a, t);
  const p = t.pruefung;
  if (!stand(a, t)?.d && !stand(a, t)?.s) {
    // Beginn der Teilaufgabe merken, davon hängt „Lösung vergleichen“ ab
    standSchreiben(a, t).s = Date.now();
    speichere();
  }
  const st = stand(a, t);
  const karte = h('section', { class: `teil${st.d ? ' erledigt' : ''}`, 'data-teil': k, 'data-typ': p.typ });
  const neuZeichnen = () => erneuereTeil(a, t, box, karte);

  anfuegen(karte, h('div', { class: 'teil-kopf' },
    h('span', { class: 'teil-id' }, `${t.id})`),
    h('div', { class: 'teil-text' }, tx(t.text, 'p'),
      h('p', { class: 'teil-meta' }, `${t.be} BE · AFB ${t.afb}`))));

  // Eingabebereich
  if (p.typ === 'zahl') anfuegen(karte, zahlBereich(a, t, st, neuZeichnen));
  else if (p.typ === 'auswahl') anfuegen(karte, auswahlBereich(a, t, st, neuZeichnen));
  else anfuegen(karte, selbstBereich(a, t, st, neuZeichnen));

  // Rückmeldung
  const rm = ansicht.rueckmeldung[k];
  if (rm) {
    anfuegen(karte, h('div', { class: `rueckmeldung ${rm.art}`, role: 'status' },
      h('strong', {}, rm.titel), rm.text ? h('span', {}, ' ', rm.text) : null));
  } else if (st.d) {
    anfuegen(karte, h('div', { class: `rueckmeldung ${st.l && !st.ok ? 'neutral' : 'ok'}`, role: 'status' },
      h('strong', {}, standText(t, st))));
  }

  // Hilfen
  const hilfenBox = h('div', { class: 'hilfen' });
  t.hilfen.slice(0, st.h || 0).forEach((text, i) => {
    anfuegen(hilfenBox, h('div', { class: 'hilfe' }, h('span', { class: 'hilfe-nr' }, `Hilfe ${i + 1}`), tx(text, 'p')));
  });
  anfuegen(karte, hilfenBox);

  // Knöpfe
  const reihe = h('div', { class: 'knopfreihe teil-knoepfe' });
  if (!st.d) {
    t.hilfen.forEach((_, i) => {
      if (i < (st.h || 0)) return;
      anfuegen(reihe, knopf(`Hilfe ${i + 1}`, () => {
        const s = standSchreiben(a, t);
        s.h = Math.max(s.h || 0, i + 1);
        speichere();
        neuZeichnen();
      }, 'knopf leise', { disabled: i > (st.h || 0), 'data-aktion': 'hilfe' }));
    });
    if (p.typ !== 'selbst') {
      const ab = (st.s || Date.now()) + wartezeit(t);
      const fehl = (st.v || 0) >= 1;
      anfuegen(reihe, knopf('Lösung vergleichen', () => {
        const s = standSchreiben(a, t);
        s.l = true;
        s.d = true;
        delete ansicht.rueckmeldung[k];
        speichere();
        neuZeichnen();
      }, 'knopf leise', { disabled: true, 'data-aktion': 'loesung', 'data-ab': ab, 'data-fehl': fehl ? '1' : '0' }));
    }
  }
  if (reihe.children.length) anfuegen(karte, reihe);
  if (!st.d && p.typ !== 'selbst') {
    anfuegen(karte, h('p', { class: 'klein loesung-hinweis', 'aria-live': 'polite' }));
    aktualisiereLoesungsKnopf(karte);
  }

  // Lösung
  if (st.d && (p.typ !== 'selbst' || st.ok)) {
    const loesung = h('div', { class: 'loesung' },
      h('h3', {}, 'Lösung'),
      h('ol', {}, t.loesung.map((s) => tx(s, 'li'))));
    if (st.ok && p.typ !== 'selbst' && !st.l) {
      anfuegen(karte, h('details', { class: 'loesung-klapp' }, h('summary', {}, 'Lösungsweg ansehen'), loesung));
    } else {
      anfuegen(karte, loesung);
    }
  }
  return karte;
}

/** Wartezeit bis „Lösung vergleichen“ ab Beginn der Teilaufgabe. */
function wartezeit(t) {
  const k = KONFIG.loesungVergleichen;
  return Math.max(k.mindestMinuten, k.minutenJeBE * t.be) * 60000;
}

/** „Lösung vergleichen“ ist frei nach einem falschen Ergebnis und nach Ablauf der Wartezeit. */
function aktualisiereLoesungsKnopf(karte) {
  const knopfEl = karte.querySelector('[data-aktion="loesung"]');
  const hinweisEl = karte.querySelector('.loesung-hinweis');
  if (!knopfEl || !hinweisEl) return;
  const fehl = knopfEl.dataset.fehl === '1';
  const rest = Number(knopfEl.dataset.ab) - Date.now();
  knopfEl.disabled = !(fehl && rest <= 0);
  let text = '';
  if (!fehl) text = 'Lösung vergleichen ist erst nach einem falschen Ergebnis möglich.';
  else if (rest > 0) text = `Lösung vergleichen ist in ${zeitText(rest)} min möglich.`;
  if (hinweisEl.textContent !== text) hinweisEl.textContent = text;
}

function standText(t, st) {
  if (t.pruefung.typ === 'selbst') return `Selbst bewertet: ${st.r} von ${t.be} BE.`;
  if (st.ok && st.r) return `Richtig gelöst: ${st.r} von ${t.be} BE.`;
  if (st.ok) return `Richtig gelöst, aber nicht im ersten Versuch: 0 von ${t.be} BE.`;
  return `Lösung verglichen: 0 von ${t.be} BE.`;
}

function falschVerarbeiten(a, t, s, hinweis) {
  s.v = (s.v || 0) + 1;
  let text = hinweis ? hinweis + ' ' : '';
  if (s.v >= 2 && (s.h || 0) < t.hilfen.length) {
    s.h = (s.h || 0) + 1;
    text += 'Die nächste Hilfe wird unten angezeigt.';
  } else if (s.v === 1 && (s.h || 0) < t.hilfen.length) {
    text += 'Möchtest du eine Hilfe ansehen?';
  }
  ansicht.rueckmeldung[teilSchluessel(a, t)] = { art: 'falsch', titel: 'Noch nicht richtig.', text: text.trim() };
}

function zahlBereich(a, t, st, neuZeichnen) {
  const k = teilSchluessel(a, t);
  const p = t.pruefung;
  if (st.d) {
    return h('div', { class: 'ergebnis-anzeige' },
      st.e ? h('p', {}, `Deine Eingabe: ${st.e} ${p.einheit}`) : null,
      h('p', {}, 'Ergebnis: ', h('strong', {}, `${formatZahl(p.wert)} ${p.einheit}`.trim())));
  }
  const id = `eingabe-${k.replace(/\W/g, '-')}`;
  const feld = h('input', {
    id, type: 'text', inputmode: 'decimal', autocomplete: 'off', autocorrect: 'off', spellcheck: 'false',
    class: 'zahlfeld', value: ansicht.eingaben[k] || '', 'aria-label': `Ergebnis${p.einheit ? ' in ' + p.einheit : ''}`,
    oninput: (e) => { ansicht.eingaben[k] = e.target.value; },
    onkeydown: (e) => { if (e.key === 'Enter') { e.preventDefault(); pruefen(); } },
  });
  const einsetzen = (zeichen) => {
    const anf = feld.selectionStart ?? feld.value.length;
    const ende = feld.selectionEnd ?? feld.value.length;
    feld.value = feld.value.slice(0, anf) + zeichen + feld.value.slice(ende);
    ansicht.eingaben[k] = feld.value;
    feld.focus();
    feld.setSelectionRange(anf + zeichen.length, anf + zeichen.length);
  };
  function pruefen() {
    const wert = feld.value.trim();
    if (!wert) {
      ansicht.rueckmeldung[k] = { art: 'falsch', titel: 'Gib zuerst ein Ergebnis ein.' };
      neuZeichnen();
      return;
    }
    const erg = pruefeZahl(wert, p, { nurBetrag: /Betrag/.test(t.text), winkelmodus: winkelmodus(t) });
    const s = standSchreiben(a, t);
    if (!erg.lesbar) {
      ansicht.rueckmeldung[k] = { art: 'falsch', titel: 'Die Eingabe ist nicht lesbar.', text: erg.hinweis };
    } else if (erg.richtig) {
      s.ok = true;
      s.d = true;
      s.r = s.l ? 0 : t.be;
      s.e = wert;
      ansicht.rueckmeldung[k] = { art: 'ok', titel: 'Richtig.', text: erg.hinweis || `${s.r} von ${t.be} BE.` };
    } else {
      falschVerarbeiten(a, t, s, erg.hinweis);
    }
    speichere();
    neuZeichnen();
  }
  return h('div', { class: 'eingabe' },
    h('label', { for: id, class: 'eingabe-label' }, 'Dein Ergebnis'),
    h('div', { class: 'eingabe-zeile' },
      feld,
      p.einheit ? h('span', { class: 'einheit' }, p.einheit) : null),
    h('div', { class: 'knopfreihe' },
      knopf('Prüfen', pruefen, 'knopf haupt', { 'data-aktion': 'pruefen' }),
      knopf('−', () => einsetzen('-'), 'knopf klein', { 'aria-label': 'Minuszeichen einfügen' }),
      knopf('·10^', () => einsetzen('·10^'), 'knopf klein', { 'aria-label': 'Zehnerpotenz einfügen' })),
    h('p', { class: 'klein' }, 'Komma oder Punkt, Zehnerpotenzen als 2,5·10^-3 oder 2,5e-3.'));
}

function optionenReihenfolge(k, anzahl) {
  if (!ansicht.reihenfolge[k]) ansicht.reihenfolge[k] = mische([...Array(anzahl).keys()]);
  return ansicht.reihenfolge[k];
}

function auswahlBereich(a, t, st, neuZeichnen) {
  const k = teilSchluessel(a, t);
  const p = t.pruefung;
  const reihenfolge = optionenReihenfolge(k, p.optionen.length);
  const gewaehlt = ansicht.auswahl[k] || new Set();
  const name = `wahl-${k.replace(/\W/g, '-')}`;
  const liste = h('div', { class: 'optionen', role: p.mehrfach ? 'group' : 'radiogroup' });
  for (const i of reihenfolge) {
    const richtig = p.richtig.includes(i);
    const klasse = st.d ? (richtig ? 'option zeige-richtig' : 'option') : 'option';
    anfuegen(liste, h('label', { class: klasse },
      h('input', {
        type: p.mehrfach ? 'checkbox' : 'radio', name, 'data-index': i, disabled: st.d, checked: !st.d && gewaehlt.has(i),
        onchange: (e) => {
          const set = p.mehrfach ? new Set(ansicht.auswahl[k] || []) : new Set();
          if (e.target.checked) set.add(i); else set.delete(i);
          ansicht.auswahl[k] = set;
        },
      }),
      tx(p.optionen[i], 'span', 'option-text'),
      st.d && richtig ? h('span', { class: 'option-marke' }, 'richtig') : null));
  }
  const teile = [];
  if (p.mehrfach && !st.d) teile.push(h('p', { class: 'klein' }, 'Mehrere Antworten können richtig sein.'));
  teile.push(liste);
  if (!st.d) {
    teile.push(h('div', { class: 'knopfreihe' }, knopf('Prüfen', () => {
      const set = ansicht.auswahl[k] || new Set();
      if (!set.size) {
        ansicht.rueckmeldung[k] = { art: 'falsch', titel: 'Wähle zuerst eine Antwort aus.' };
        neuZeichnen();
        return;
      }
      const s = standSchreiben(a, t);
      const richtig = set.size === p.richtig.length && p.richtig.every((i) => set.has(i));
      if (richtig) {
        const ersterVersuch = !(s.v > 0);
        s.ok = true;
        s.d = true;
        s.r = s.l || (KONFIG.auswahlNurErsterVersuch && !ersterVersuch) ? 0 : t.be;
        ansicht.rueckmeldung[k] = s.r
          ? { art: 'ok', titel: 'Richtig.', text: `${s.r} von ${t.be} BE.` }
          : { art: 'ok', titel: 'Richtig.', text: 'Bei Auswahlaufgaben gibt es die BE nur für den ersten Versuch.' };
      } else {
        falschVerarbeiten(a, t, s, p.mehrfach ? 'Prüfe jede Antwort einzeln.' : null);
      }
      speichere();
      neuZeichnen();
    }, 'knopf haupt', { 'data-aktion': 'pruefen' })));
  }
  return h('div', { class: 'eingabe' }, teile);
}

function selbstBereich(a, t, st, neuZeichnen) {
  const k = teilSchluessel(a, t);
  const p = t.pruefung;
  const box = h('div', { class: 'eingabe' });
  const id = `text-${k.replace(/\W/g, '-')}`;
  const textfeld = h('textarea', {
    id, rows: 4, class: 'textfeld', disabled: st.d, placeholder: 'Antwort hier oder im Hefter',
    value: texte[k] || '',
    oninput: (e) => { texte[k] = e.target.value; sp.speichereTexte(texte); },
  });
  anfuegen(box, 
    h('label', { for: id, class: 'eingabe-label' }, 'Deine Antwort (freiwillig, bleibt nur auf diesem Gerät)'),
    textfeld);
  if (st.d) {
    anfuegen(box, h('h3', { class: 'kriterien-titel' }, 'Kriterien'),
      h('ul', { class: 'kriterien' }, p.kriterien.map((c, i) => {
        const ja = (st.k || []).includes(i) || (!st.k && i < st.r);
        return h('li', { class: ja ? 'erfuellt' : 'offen' },
          h('span', { class: 'kriterium-marke' }, ja ? 'erfüllt' : 'nicht erfüllt'), tx(c, 'span'));
      })));
    return box;
  }
  if (!ansicht.phase[k]) {
    anfuegen(box, h('div', { class: 'knopfreihe' }, knopf('Mit Kriterien vergleichen', () => {
      ansicht.phase[k] = 'kriterien';
      neuZeichnen();
    }, 'knopf haupt', { 'data-aktion': 'kriterien' })));
    return box;
  }
  const haken = new Set();
  anfuegen(box, 
    h('p', { class: 'hinweis-text' }, 'Hake jedes Kriterium ab, das deine Antwort enthält. Jedes Kriterium zählt 1 BE.'),
    h('div', { class: 'optionen' }, p.kriterien.map((c, i) => h('label', { class: 'option' },
      h('input', { type: 'checkbox', 'data-kriterium': i, onchange: (e) => { if (e.target.checked) haken.add(i); else haken.delete(i); } }),
      tx(c, 'span', 'option-text')))),
    h('div', { class: 'knopfreihe' }, knopf('Bewertung abschließen', () => {
      const s = standSchreiben(a, t);
      s.k = [...haken].sort();
      s.r = Math.min(haken.size, t.be);
      s.d = true;
      s.ok = true;
      ansicht.rueckmeldung[k] = { art: 'ok', titel: `Selbst bewertet: ${s.r} von ${t.be} BE.`, text: 'Vergleiche jetzt mit der Musterlösung.' };
      speichere();
      neuZeichnen();
    }, 'knopf haupt', { 'data-aktion': 'bewerten' })));
  return box;
}

function abschlussKarte(a) {
  const s = aufgabeStand(a);
  const liste = daten.aufgabenJeThema.get(a.thema);
  const naechste = liste[liste.indexOf(a) + 1];
  const naechsteOffen = naechste && (naechste.stufe !== 'Z' || zOffen(a.thema));
  return h('section', { class: 'abschluss karte' },
    h('h2', {}, 'Aufgabe bearbeitet'),
    h('p', {}, `${s.be} von ${s.beMax} BE. ${s.frei} von ${s.gesamt} Teilaufgaben ohne Hilfe.`),
    h('div', { class: 'knopfreihe' },
      naechsteOffen ? link('Nächste Aufgabe', `#/aufgabe/${naechste.id}`, 'knopf haupt') : null,
      link('Zum Thema', `#/thema/${a.thema}`),
      knopf('Aufgabe neu bearbeiten', (e) => {
        const ziel = e.target.closest('.abschluss');
        if (ziel.querySelector('.bestaetigung')) return;
        anfuegen(ziel, bestaetigung('Der Stand dieser Aufgabe wird gelöscht.', 'Neu bearbeiten', () => {
          for (const t of a.teile) {
            delete zustand.teile[teilSchluessel(a, t)];
            delete texte[teilSchluessel(a, t)];
          }
          speichere();
          sp.speichereTexte(texte);
          zeichne();
        }));
      }, 'knopf leise')));
}

// ------------------------------------------------------------------ Diagnose

function starteDiagnose() {
  diagnoseSitzung = {
    fragen: mische(daten.diagnose).map((q) => ({ q, reihenfolge: mische([...q.optionen.keys()]) })),
    i: 0, antworten: {}, gewaehlt: null, geprueft: false, fertig: false,
  };
}

function seiteDiagnose() {
  if (diagnoseSitzung && !diagnoseSitzung.fertig) { diagnoseFrage(); return; }
  if (zustand.diagnose && Object.keys(zustand.diagnose.antworten || {}).length) { diagnoseAuswertung(); return; }
  anfuegen(main, h('section', { class: 'karte' },
    h('h1', {}, 'Diagnose'),
    h('p', {}, `Die Diagnose besteht aus ${daten.diagnose.length} Kurzfragen, zwei zu jedem Thema. Sie dauert etwa 8 Minuten. Danach siehst du, mit welchen Themen du beginnen solltest.`),
    h('div', { class: 'knopfreihe' }, knopf('Diagnose starten', () => { starteDiagnose(); zeichne(); }, 'knopf haupt'))));
}

function diagnoseFrage() {
  const s = diagnoseSitzung;
  const karte = h('section', { class: 'karte diagnose' });
  const zeichneFrage = () => {
    const { q, reihenfolge } = s.fragen[s.i];
    ersetzen(karte, 
      h('p', { class: 'ueberzeile' }, `Frage ${s.i + 1} von ${s.fragen.length}`),
      h('div', { class: 'fortschritt-duenn' }, h('span', { style: `width:${Math.round((s.i / s.fragen.length) * 100)}%` })),
      tx(q.frage, 'h2', 'diagnose-frage'),
      h('div', { class: 'optionen', role: 'radiogroup' }, reihenfolge.map((i) => {
        let klasse = 'option';
        if (s.geprueft && i === q.richtig) klasse += ' zeige-richtig';
        if (s.geprueft && i === s.gewaehlt && i !== q.richtig) klasse += ' zeige-falsch';
        return h('label', { class: klasse },
          h('input', {
            type: 'radio', name: 'diagnose', 'data-index': i, checked: s.gewaehlt === i, disabled: s.geprueft,
            onchange: () => { s.gewaehlt = i; karte.querySelector('[data-aktion="abgeben"]').disabled = false; },
          }),
          tx(q.optionen[i], 'span', 'option-text'),
          s.geprueft && i === q.richtig ? h('span', { class: 'option-marke' }, 'richtig') : null,
          s.geprueft && i === s.gewaehlt && i !== q.richtig ? h('span', { class: 'option-marke' }, 'deine Antwort') : null);
      })),
      s.geprueft ? h('div', { class: `rueckmeldung ${s.gewaehlt === q.richtig ? 'ok' : 'falsch'}`, role: 'status' },
        h('strong', {}, s.gewaehlt === q.richtig ? 'Richtig.' : 'Nicht richtig.'),
        s.gewaehlt === q.richtig ? null : h('span', {}, ' Die richtige Antwort ist markiert.')) : null,
      h('div', { class: 'knopfreihe' }, s.geprueft
        ? knopf(s.i + 1 < s.fragen.length ? 'Nächste Frage' : 'Zur Auswertung', () => {
          s.i++;
          s.gewaehlt = null;
          s.geprueft = false;
          if (s.i >= s.fragen.length) {
            s.fertig = true;
            zustand.diagnose = { antworten: s.antworten, datum: new Date().toISOString() };
            speichere();
            zeichne();
          } else {
            zeichneFrage();
            window.scrollTo(0, 0);
          }
        }, 'knopf haupt', { 'data-aktion': 'weiter' })
        : knopf('Antwort abgeben', () => {
          if (s.gewaehlt === null) return;
          s.geprueft = true;
          s.antworten[q.schluessel] = s.gewaehlt === q.richtig;
          zeichneFrage();
        }, 'knopf haupt', { 'data-aktion': 'abgeben', disabled: s.gewaehlt === null })),
    );
    mathe(karte);
  };
  anfuegen(main, karte);
  zeichneFrage();
}

function diagnoseAuswertung() {
  const antworten = zustand.diagnose.antworten;
  const richtig = Object.values(antworten).filter(Boolean).length;
  const gesamt = Object.keys(antworten).length;
  const fehler = diagnoseFehlerThemen();
  const empfohlen = daten.bereiche.flatMap((b) => b.themen.filter((t) => fehler.has(t.id)));
  anfuegen(main, 
    h('section', { class: 'kopfbereich' },
      h('h1', {}, 'Auswertung der Diagnose'),
      h('p', { class: 'untertitel' }, `Du hast ${richtig} von ${gesamt} Fragen richtig beantwortet.`),
      zustand.diagnose.datum ? h('p', { class: 'klein' }, `Durchgeführt am ${datumText(zustand.diagnose.datum)}`) : null),
    h('section', { class: 'karte' },
      h('h2', {}, 'Empfehlung'),
      empfohlen.length
        ? [h('p', {}, 'Beginne mit diesen Themen:'),
          h('ol', { class: 'empfehlungsliste' }, empfohlen.map((t) => h('li', {},
            h('a', { href: `#/thema/${t.id}` }, `${t.id} ${t.titel}`))))]
        : h('p', {}, 'Du hast alle Fragen richtig beantwortet. Arbeite an den A- und Z-Aufgaben weiter.'),
      h('div', { class: 'knopfreihe' },
        link('Zur Themenübersicht', '#/themen', 'knopf haupt'),
        knopf('Diagnose wiederholen', () => { starteDiagnose(); zeichne(); }))),
    h('section', { class: 'karte' },
      h('h2', {}, 'Ergebnis je Thema'),
      daten.bereiche.map((b) => [
        h('h3', {}, b.name),
        h('ul', { class: 'diagnose-tabelle' }, b.themen.map((t) => {
          const d = diagnoseThema(t.id);
          return h('li', { class: d && d.richtig < d.gesamt ? 'mit-fehler' : null },
            h('span', {}, `${t.id} ${t.titel}`),
            h('span', { class: 'wert' }, d ? `${d.richtig} von ${d.gesamt}` : 'nicht bearbeitet'));
        }))])),
  );
}

// ------------------------------------------------------------------ Probeklausur

function klausurAufgaben() {
  return (zustand.klausur?.ids || []).map((id) => daten.aufgabeNach.get(id)).filter(Boolean);
}

function seiteKlausur() {
  const kl = zustand.klausur;
  if (!kl || !klausurAufgaben().length) { klausurStart(); return; }
  if (kl.phase === 'laeuft') klausurLaeuft();
  else if (kl.phase === 'selbst') klausurSelbst();
  else klausurErgebnis();
}

function klausurStart() {
  const verlauf = zustand.klausurVerlauf || [];
  anfuegen(main, 
    h('section', { class: 'karte' },
      h('h1', {}, 'Probeklausur'),
      h('ul', { class: 'liste' },
        h('li', {}, 'Die Probeklausur stellt ganze Aufgaben aus allen Themen zusammen. Sie umfasst etwa 40 BE, etwa zur Hälfte Induktion und zur Hälfte Schwingungen.'),
        h('li', {}, `Die Bearbeitungszeit beträgt ${String(daten.meta.tempo_min_je_be).replace('.', ',')} Minuten je BE.`),
        h('li', {}, 'Hilfen und Lösungen sind gesperrt. Die Auswertung erfolgt erst nach der Abgabe.'),
        h('li', {}, 'Erklärungen schreibst du in das Textfeld oder in den Hefter. Nach der Abgabe vergleichst du sie selbst mit den Kriterien.'),
        h('li', {}, 'Die Probeklausur zählt nicht für den Fortschritt in den Themen.')),
      h('div', { class: 'knopfreihe' }, knopf('Probeklausur beginnen', () => {
        const auswahl = zieheKlausur(daten, KONFIG.klausur);
        if (!auswahl) {
          anfuegen(main, h('p', { class: 'warnhinweis' }, 'Es konnte keine passende Zusammenstellung gefunden werden.'));
          return;
        }
        const be = auswahl.reduce((s, a) => s + aufgabeBE(a), 0);
        const reihenfolge = {};
        for (const a of auswahl) {
          for (const t of a.teile) {
            if (t.pruefung.typ === 'auswahl') reihenfolge[teilSchluessel(a, t)] = mische([...t.pruefung.optionen.keys()]);
          }
        }
        zustand.klausur = {
          ids: auswahl.map((a) => a.id), start: Date.now(),
          dauer: Math.round(be * daten.meta.tempo_min_je_be * 60000),
          antworten: {}, texte: {}, haken: {}, reihenfolge, phase: 'laeuft',
        };
        speichere();
        zeichne();
      }, 'knopf haupt', { 'data-aktion': 'klausur-start' }))),
    verlauf.length ? h('section', { class: 'karte' },
      h('h2', {}, 'Bisherige Probeklausuren'),
      h('ul', { class: 'diagnose-tabelle' }, verlauf.slice().reverse().map((v) => h('li', {},
        h('span', {}, v.datum ? datumText(v.datum) : 'übernommen'),
        h('span', { class: 'wert' }, `${v.be} von ${v.max} BE, ${v.np} NP`))))) : null,
  );
}

function klausurBE() {
  return klausurAufgaben().reduce((s, a) => s + aufgabeBE(a), 0);
}

function klausurLaeuft() {
  const kl = zustand.klausur;
  const aufgaben = klausurAufgaben();
  const anzeige = h('span', { class: 'restzeit', 'aria-live': 'off' });
  const leiste = h('div', { class: 'klausurleiste' },
    h('span', {}, `${klausurBE()} BE`), anzeige);
  const formular = h('fieldset', { class: 'klausur-aufgaben' });
  const ablaufHinweis = h('p', { class: 'warnhinweis versteckt', role: 'alert' }, 'Die Zeit ist abgelaufen. Gib die Probeklausur jetzt ab.');
  const aktualisiere = () => {
    const rest = kl.start + kl.dauer - Date.now();
    anzeige.textContent = rest > 0 ? `Restzeit ${zeitText(rest)}` : 'Zeit abgelaufen';
    if (rest <= 0) {
      formular.disabled = true;
      ablaufHinweis.classList.remove('versteckt');
      if (uhr) { clearInterval(uhr); uhr = null; }
    }
  };
  aufgaben.forEach((a, n) => {
    const karte = h('article', { class: 'aufgabe-klausur karte', 'data-aufgabe': a.id },
      h('header', { class: 'aufgabenkopf' },
        h('p', { class: 'ueberzeile' }, `Aufgabe ${n + 1}`),
        h('h2', {}, a.titel),
        h('p', { class: 'chips' }, h('span', { class: 'chip' }, `${aufgabeBE(a)} BE`))),
      tx(a.kontext, 'p', 'kontext'),
      abbildung(a));
    for (const t of a.teile) anfuegen(karte, klausurTeil(a, t));
    anfuegen(formular, karte);
  });
  const abgabeBox = h('div', { class: 'karte abgabe' });
  const abgeben = () => {
    kl.phase = klausurAufgaben().some((a) => a.teile.some((t) => t.pruefung.typ === 'selbst')) ? 'selbst' : 'fertig';
    kl.ende = Date.now();
    if (kl.phase === 'fertig') klausurAbschliessen();
    speichere();
    zeichne();
  };
  anfuegen(abgabeBox, h('div', { class: 'knopfreihe' },
    knopf('Abgeben', () => {
      if (abgabeBox.querySelector('.bestaetigung')) return;
      anfuegen(abgabeBox, bestaetigung('Wirklich abgeben? Danach kannst du nichts mehr ändern.', 'Ja, abgeben', abgeben, 'Weiter bearbeiten'));
    }, 'knopf haupt', { 'data-aktion': 'abgeben' }),
    knopf('Probeklausur abbrechen', () => {
      if (abgabeBox.querySelector('.bestaetigung')) return;
      anfuegen(abgabeBox, bestaetigung('Die Probeklausur wird ohne Auswertung beendet.', 'Abbrechen und löschen', () => {
        zustand.klausur = null;
        speichere();
        zeichne();
      }, 'Weiter bearbeiten'));
    }, 'knopf leise')));
  anfuegen(main, leiste, ablaufHinweis, formular, abgabeBox);
  aktualisiere();
  uhr = setInterval(aktualisiere, 1000);
}

function klausurTeil(a, t) {
  const kl = zustand.klausur;
  const k = teilSchluessel(a, t);
  const p = t.pruefung;
  const box = h('section', { class: 'teil', 'data-teil': k, 'data-typ': p.typ },
    h('div', { class: 'teil-kopf' },
      h('span', { class: 'teil-id' }, `${t.id})`),
      h('div', { class: 'teil-text' }, tx(t.text, 'p'), h('p', { class: 'teil-meta' }, `${t.be} BE`))));
  const merke = (wert) => { kl.antworten[k] = wert; speichere(); };
  if (p.typ === 'zahl') {
    const id = `k-${k.replace(/\W/g, '-')}`;
    anfuegen(box, h('div', { class: 'eingabe' },
      h('label', { for: id, class: 'eingabe-label' }, 'Dein Ergebnis'),
      h('div', { class: 'eingabe-zeile' },
        h('input', {
          id, type: 'text', inputmode: 'decimal', autocomplete: 'off', class: 'zahlfeld', value: kl.antworten[k] || '',
          oninput: (e) => merke(e.target.value),
        }),
        p.einheit ? h('span', { class: 'einheit' }, p.einheit) : null)));
  } else if (p.typ === 'auswahl') {
    const gewaehlt = new Set(kl.antworten[k] || []);
    const name = `k-${k.replace(/\W/g, '-')}`;
    anfuegen(box, h('div', { class: 'optionen' }, (kl.reihenfolge[k] || [...p.optionen.keys()]).map((i) => h('label', { class: 'option' },
      h('input', {
        type: p.mehrfach ? 'checkbox' : 'radio', name, 'data-index': i, checked: gewaehlt.has(i),
        onchange: (e) => {
          const set = p.mehrfach ? new Set(kl.antworten[k] || []) : new Set();
          if (e.target.checked) set.add(i); else set.delete(i);
          merke([...set]);
        },
      }),
      tx(p.optionen[i], 'span', 'option-text')))));
  } else {
    const id = `k-${k.replace(/\W/g, '-')}`;
    anfuegen(box, h('div', { class: 'eingabe' },
      h('label', { for: id, class: 'eingabe-label' }, 'Deine Antwort'),
      h('textarea', {
        id, rows: 4, class: 'textfeld', placeholder: 'Antwort hier oder im Hefter', value: kl.texte[k] || '',
        oninput: (e) => { kl.texte[k] = e.target.value; speichere(); },
      })));
  }
  return box;
}

function klausurSelbst() {
  const kl = zustand.klausur;
  anfuegen(main, h('section', { class: 'kopfbereich' },
    h('h1', {}, 'Selbstkontrolle'),
    h('p', { class: 'untertitel' }, 'Vergleiche deine Antworten mit den Kriterien. Hake nur ab, was deine Antwort wirklich enthält. Jedes Kriterium zählt 1 BE.')));
  for (const a of klausurAufgaben()) {
    for (const t of a.teile) {
      if (t.pruefung.typ !== 'selbst') continue;
      const k = teilSchluessel(a, t);
      const haken = new Set(kl.haken[k] || []);
      anfuegen(main, h('section', { class: 'karte teil', 'data-teil': k },
        h('p', { class: 'ueberzeile' }, `${a.titel}, Teil ${t.id}) · ${t.be} BE`),
        tx(t.text, 'p'),
        kl.texte[k] ? h('blockquote', { class: 'eigene-antwort' }, kl.texte[k])
          : h('p', { class: 'klein' }, 'Keine Antwort im Textfeld. Nimm deinen Hefter zur Hand.'),
        h('div', { class: 'optionen' }, t.pruefung.kriterien.map((c, i) => h('label', { class: 'option' },
          h('input', {
            type: 'checkbox', 'data-kriterium': i, checked: haken.has(i),
            onchange: (e) => {
              if (e.target.checked) haken.add(i); else haken.delete(i);
              kl.haken[k] = [...haken];
              speichere();
            },
          }),
          tx(c, 'span', 'option-text'))))));
    }
  }
  anfuegen(main, h('div', { class: 'knopfreihe' }, knopf('Auswertung anzeigen', () => {
    kl.phase = 'fertig';
    klausurAbschliessen();
    speichere();
    zeichne();
  }, 'knopf haupt', { 'data-aktion': 'auswertung' })));
}

function klausurTeilBE(a, t) {
  const kl = zustand.klausur;
  const k = teilSchluessel(a, t);
  const p = t.pruefung;
  if (p.typ === 'zahl') return kl.antworten[k] && pruefeZahl(kl.antworten[k], p).richtig ? t.be : 0;
  if (p.typ === 'auswahl') {
    const set = new Set(kl.antworten[k] || []);
    return set.size === p.richtig.length && p.richtig.every((i) => set.has(i)) ? t.be : 0;
  }
  return Math.min((kl.haken[k] || []).length, t.be);
}

function klausurAbschliessen() {
  const kl = zustand.klausur;
  let be = 0;
  let selbstBE = 0;
  for (const a of klausurAufgaben()) {
    for (const t of a.teile) {
      const x = klausurTeilBE(a, t);
      be += x;
      if (t.pruefung.typ === 'selbst') selbstBE += x;
    }
  }
  const max = klausurBE();
  kl.ergebnis = { be, max, selbstBE, np: notenpunkte(be, max) };
  if (!kl.ende) kl.ende = Date.now();
  zustand.klausurVerlauf = [...(zustand.klausurVerlauf || []), { be, max, np: kl.ergebnis.np, datum: new Date().toISOString() }].slice(-10);
}

function klausurErgebnis() {
  const kl = zustand.klausur;
  if (!kl.ergebnis) klausurAbschliessen();
  const e = kl.ergebnis;
  const aufgaben = klausurAufgaben();
  const v = verteilung(daten, aufgaben);
  const zeigeLoesungen = ansicht.phase.klausurLoesung;
  const aktionen = h('div', { class: 'knopfreihe' });
  anfuegen(aktionen, 
    knopf(zeigeLoesungen ? 'Lösungen ausblenden' : 'Lösungen ansehen', () => {
      ansicht.phase.klausurLoesung = !zeigeLoesungen;
      const y = window.scrollY;
      ersetzen(main);
      klausurErgebnis();
      mathe(main);
      window.scrollTo(0, y);
    }, 'knopf haupt', { 'data-aktion': 'loesungen' }),
    knopf('Neue Probeklausur', () => {
      if (aktionen.parentElement.querySelector('.bestaetigung')) return;
      aktionen.after(bestaetigung('Die Auswertung dieser Probeklausur wird ausgeblendet. Das Ergebnis bleibt in der Übersicht.', 'Neue Probeklausur', () => {
        zustand.klausur = null;
        speichere();
        zeichne();
      }));
    }));
  anfuegen(main, 
    h('section', { class: 'kopfbereich' }, h('h1', {}, 'Auswertung der Probeklausur')),
    h('section', { class: 'karte ergebnis' },
      h('div', { class: 'ergebnis-gross' },
        h('span', { class: 'np', 'data-np': e.np }, String(e.np)),
        h('span', { class: 'np-text' }, e.np === 1 ? 'Notenpunkt' : 'Notenpunkte')),
      h('p', { class: 'ergebnis-zeile' }, `${e.be} von ${e.max} BE, das sind ${prozent(e.be / e.max)}.`),
      e.selbstBE || aufgaben.some((a) => a.teile.some((t) => t.pruefung.typ === 'selbst'))
        ? h('p', { class: 'klein' }, `Davon ${e.selbstBE} BE selbst bewertet.`) : null,
      h('p', { class: 'klein' }, `Bearbeitungszeit ${Math.max(1, Math.round((kl.ende - kl.start) / 60000))} min von ${Math.round(kl.dauer / 60000)} min. Anforderungsbereiche: I ${prozent(v.afb.I / v.be)}, II ${prozent(v.afb.II / v.be)}, III ${prozent(v.afb.III / v.be)}.`),
      aktionen),
    h('section', { class: 'karte' },
      h('h2', {}, 'Ergebnis je Aufgabe'),
      h('ul', { class: 'diagnose-tabelle' }, aufgaben.map((a) => {
        const erreicht = a.teile.reduce((s, t) => s + klausurTeilBE(a, t), 0);
        return h('li', {}, h('span', {}, `${a.thema} ${a.titel}`), h('span', { class: 'wert' }, `${erreicht} von ${aufgabeBE(a)} BE`));
      })),
      h('details', { class: 'schluessel' },
        h('summary', {}, 'Notenschlüssel'),
        h('table', { class: 'tabelle' },
          h('thead', {}, h('tr', {}, h('th', {}, 'NP'), h('th', {}, 'ab BE'), h('th', {}, 'ab Prozent'))),
          h('tbody', {}, notenschluessel(e.max).map((z) => h('tr', { class: z.np === e.np ? 'markiert' : null },
            h('td', {}, String(z.np)), h('td', {}, String(z.be)), h('td', {}, `${String(z.prozent).replace('.', ',')} %`))))))),
  );
  if (zeigeLoesungen) {
    for (const a of aufgaben) anfuegen(main, klausurLoesung(a));
  }
}

function antwortText(a, t) {
  const kl = zustand.klausur;
  const k = teilSchluessel(a, t);
  const p = t.pruefung;
  if (p.typ === 'zahl') return kl.antworten[k] ? `${kl.antworten[k]} ${p.einheit}` : 'keine Eingabe';
  if (p.typ === 'auswahl') {
    const liste = kl.antworten[k] || [];
    return liste.length ? liste.map((i) => p.optionen[i]).join(' | ') : 'keine Auswahl';
  }
  return kl.texte[k] || 'Antwort im Hefter';
}

function klausurLoesung(a) {
  return h('article', { class: 'karte aufgabe-klausur', 'data-aufgabe': a.id },
    aufgabenKopf(a),
    tx(a.kontext, 'p', 'kontext'),
    abbildung(a),
    a.teile.map((t) => {
      const p = t.pruefung;
      const be = klausurTeilBE(a, t);
      let richtig;
      if (p.typ === 'zahl') richtig = `${formatZahl(p.wert)} ${p.einheit}`;
      else if (p.typ === 'auswahl') richtig = p.richtig.map((i) => p.optionen[i]).join(' | ');
      return h('section', { class: 'teil' },
        h('div', { class: 'teil-kopf' }, h('span', { class: 'teil-id' }, `${t.id})`),
          h('div', { class: 'teil-text' }, tx(t.text, 'p'), h('p', { class: 'teil-meta' }, `${be} von ${t.be} BE`))),
        h('dl', { class: 'vergleich' },
          h('dt', {}, 'Deine Antwort'), tx(antwortText(a, t), 'dd'),
          richtig ? [h('dt', {}, 'Richtig'), tx(richtig, 'dd')] : null),
        p.typ === 'selbst' ? h('ul', { class: 'kriterien' }, p.kriterien.map((c, i) => {
          const ja = (zustand.klausur.haken[teilSchluessel(a, t)] || []).includes(i);
          return h('li', { class: ja ? 'erfuellt' : 'offen' }, h('span', { class: 'kriterium-marke' }, ja ? 'erfüllt' : 'nicht erfüllt'), tx(c, 'span'));
        })) : null,
        h('div', { class: 'loesung' }, h('h3', {}, 'Lösung'), h('ol', {}, t.loesung.map((s) => tx(s, 'li')))));
    }));
}

// ------------------------------------------------------------------ Meine Übersicht

function seiteUebersicht() {
  const verlauf = zustand.klausurVerlauf || [];
  const aktionen = h('div', { class: 'knopfreihe' },
    link('Fortschritt sichern', '#/sichern', 'knopf haupt'),
    link('Fortschritt laden', '#/laden'),
    knopf('Neu beginnen', () => {
      if (aktionen.parentElement.querySelector('.bestaetigung')) return;
      aktionen.after(bestaetigung('Der gesamte Fortschritt auf diesem Gerät wird gelöscht. Sichere ihn vorher als Code, wenn du ihn noch brauchst.', 'Ja, alles löschen', () => {
        sp.allesLoeschen();
        zustand = sp.leererZustand();
        texte = {};
        diagnoseSitzung = null;
        zeichne();
      }));
    }, 'knopf leise', { 'data-aktion': 'neu-beginnen' }));
  anfuegen(main, h('section', { class: 'kopfbereich' },
    h('h1', {}, 'Meine Übersicht'),
    h('p', { class: 'untertitel' }, `Stand: ${datumText(new Date().toISOString())}`)));

  const zusammen = h('div', { class: 'zusammenfassung' });
  for (const b of daten.bereiche) {
    const s = b.themen.map((t) => themaStand(t.id)).reduce((x, y) => {
      for (const k of Object.keys(x)) x[k] += y[k];
      return x;
    });
    anfuegen(zusammen, h('div', { class: 'kennzahl' },
      h('span', { class: 'kennzahl-wert' }, prozent(s.be / s.beMax)),
      h('span', { class: 'kennzahl-text' }, `${b.name}: ${s.be} von ${s.beMax} BE`)));
  }
  anfuegen(main, h('section', { class: 'karte' }, zusammen, aktionen));

  for (const b of daten.bereiche) {
    anfuegen(main, h('section', { class: 'karte' },
      h('h2', {}, b.name),
      h('div', { class: 'tabelle-huelle' }, h('table', { class: 'tabelle uebersicht' },
        h('thead', {}, h('tr', {},
          h('th', {}, 'Thema'), h('th', {}, 'BE'), h('th', {}, 'Hilfen'), h('th', {}, 'ohne Hilfe'), h('th', {}, 'Diagnose'))),
        h('tbody', {}, b.themen.map((t) => {
          const s = themaStand(t.id);
          const d = diagnoseThema(t.id);
          return h('tr', {},
            h('td', {}, h('a', { href: `#/thema/${t.id}` }, `${t.id} ${t.titel}`)),
            h('td', {}, `${prozent(s.be / s.beMax)}`, h('span', { class: 'klein block' }, `${s.be} von ${s.beMax}`)),
            h('td', {}, String(s.hilfen)),
            h('td', {}, s.erledigt ? `${s.frei} von ${s.erledigt}` : 'noch nichts'),
            h('td', { class: d && d.richtig < d.gesamt ? 'mit-fehler' : null }, d ? `${d.richtig} von ${d.gesamt}` : 'nicht bearbeitet'));
        }))))));
  }
  anfuegen(main, h('section', { class: 'karte' },
    h('h2', {}, 'Probeklausuren'),
    verlauf.length
      ? h('ul', { class: 'diagnose-tabelle' }, verlauf.slice().reverse().map((v) => h('li', {},
        h('span', {}, v.datum ? datumText(v.datum) : 'übernommen'),
        h('span', { class: 'wert' }, `${v.be} von ${v.max} BE, ${v.np} NP`))))
      : h('p', {}, 'Noch keine Probeklausur geschrieben.')));
}

// ------------------------------------------------------------------ Fortschritt sichern und laden

function kopiere(text, knopfEl) {
  const fertig = () => { knopfEl.textContent = 'Kopiert'; setTimeout(() => { knopfEl.textContent = knopfEl.dataset.text; }, 2000); };
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(fertig, () => {});
  } else {
    const t = h('textarea', { value: text, class: 'versteckt-kopie' });
    anfuegen(document.body, t);
    t.select();
    try { document.execCommand('copy'); fertig(); } catch (e) { /* nichts */ }
    t.remove();
  }
}

function seiteSichern() {
  const code = sp.erzeugeCode(zustand);
  const adresse = `${location.origin}${location.pathname}#p=${code}`;
  const qrBox = h('div', { class: 'qr' });
  if (typeof window.qrcode === 'function') {
    try {
      const qr = window.qrcode(0, 'M');
      qr.addData(adresse);
      qr.make();
      qrBox.innerHTML = qr.createSvgTag({ cellSize: 4, margin: 2, scalable: true });
      const svg = qrBox.querySelector('svg');
      if (svg) svg.setAttribute('aria-label', 'QR-Code mit dem Link zum Fortschritt');
    } catch (e) { qrBox.textContent = ''; }
  }
  const codeKnopf = knopf('Code kopieren', (e) => kopiere(code, e.target), 'knopf haupt', { 'data-text': 'Code kopieren' });
  const linkKnopf = knopf('Link kopieren', (e) => kopiere(adresse, e.target), 'knopf', { 'data-text': 'Link kopieren' });
  anfuegen(main, h('section', { class: 'karte' },
    h('h1', {}, 'Fortschritt sichern'),
    h('p', {}, 'Scanne den QR-Code mit der Kamera deines Handys. Dann öffnet sich die Lerntheke mit deinem Fortschritt. Du kannst auch den Code kopieren und am anderen Gerät unter „Fortschritt laden“ einfügen.'),
    qrBox,
    h('label', { for: 'code-ausgabe', class: 'eingabe-label' }, 'Dein Code'),
    h('textarea', { id: 'code-ausgabe', class: 'textfeld code', readonly: true, rows: 3, value: code, onfocus: (e) => e.target.select() }),
    h('div', { class: 'knopfreihe' }, codeKnopf, linkKnopf),
    h('p', { class: 'klein' }, 'Der Code enthält deine BE, Hilfen und Diagnoseergebnisse, aber keine Texte aus den Textfeldern.')));
}

function seiteLaden(codeAusLink) {
  const feld = h('textarea', { id: 'code-eingabe', class: 'textfeld code', rows: 3, value: codeAusLink || '', placeholder: 'Code hier einfügen' });
  const meldung = h('div', { role: 'status' });
  anfuegen(main, h('section', { class: 'karte' },
    h('h1', {}, 'Fortschritt laden'),
    h('p', {}, codeAusLink
      ? 'Der Link enthält einen gesicherten Fortschritt. Möchtest du ihn auf diesem Gerät übernehmen?'
      : 'Füge den Code ein, den du an einem anderen Gerät gesichert hast.'),
    h('p', { class: 'klein' }, 'Der Code wird mit dem Stand auf diesem Gerät zusammengeführt. Je Teilaufgabe zählt der bessere Stand.'),
    h('label', { for: 'code-eingabe', class: 'eingabe-label' }, 'Code'),
    feld,
    h('div', { class: 'knopfreihe' }, knopf('Fortschritt übernehmen', () => {
      try {
        const neu = sp.leseCode(feld.value);
        zustand = sp.fuehreZusammen(zustand, neu);
        speichere();
        history.replaceState(null, '', `${location.pathname}${location.search}#/uebersicht`);
        zeichne();
        hinweis('Der Fortschritt wurde übernommen.');
      } catch (e) {
        ersetzen(meldung, h('p', { class: 'rueckmeldung falsch' }, e.message));
      }
    }, 'knopf haupt', { 'data-aktion': 'code-laden' })),
    meldung));
}

function hinweis(text, knopfText, aktion) {
  ersetzen(hinweisLeiste, h('div', { class: 'hinweis-inhalt', role: 'status' },
    h('span', {}, text),
    knopfText ? knopf(knopfText, aktion, 'knopf klein') : null,
    knopf('Schließen', () => ersetzen(hinweisLeiste), 'knopf klein leise')));
}

// ------------------------------------------------------------------ Lehrkraft

function seiteLehrer() {
  const stats = { teile: 0, be: 0, afb: { I: 0, II: 0, III: 0 } };
  for (const a of daten.aufgaben) {
    for (const t of a.teile) { stats.teile++; stats.be += t.be; stats.afb[t.afb] += t.be; }
  }
  anfuegen(main, h('section', { class: 'karte' },
    h('h1', {}, 'Vorschau für die Lehrkraft'),
    h('p', {}, `${daten.themen.length} Themen, ${daten.aufgaben.length} Aufgaben, ${stats.teile} Teilaufgaben, ${stats.be} BE, ${daten.diagnose.length} Diagnosefragen. AFB I ${prozent(stats.afb.I / stats.be)}, II ${prozent(stats.afb.II / stats.be)}, III ${prozent(stats.afb.III / stats.be)}. Stand der Inhalte: ${daten.meta.stand}.`),
    h('label', { class: 'option schalter' },
      h('input', {
        type: 'checkbox', checked: lehrer.zSperreAus, 'data-aktion': 'z-sperre',
        onchange: (e) => { lehrer.zSperreAus = e.target.checked; sp.speichereLehrer(lehrer); },
      }),
      h('span', {}, 'Z-Sperre auf diesem Gerät abschalten')),
    h('p', { class: 'klein' }, KONFIG.zSperre
      ? 'Für alle Geräte gilt die Einstellung zSperre in js/config.js. Dort steht zurzeit true. Mit false sind die Z-Aufgaben auf allen Geräten sofort frei.'
      : 'In js/config.js ist die Z-Sperre für alle Geräte abgeschaltet.'),
    h('nav', { class: 'sprungliste' }, daten.themen.map((t) => h('a', { href: `#/lehrer`, onclick: (e) => {
      e.preventDefault();
      document.getElementById(`lehrer-${t.id}`)?.scrollIntoView();
    } }, t.id)))));

  for (const t of daten.themen) {
    const block = h('section', { class: 'lehrer-thema', id: `lehrer-${t.id}` },
      h('h2', {}, `${t.id} ${t.titel}`),
      h('p', { class: 'klein' }, `Hefter: ${t.hefter}`),
      h('ul', { class: 'checkliste' }, t.checkliste.map((c) => tx(c, 'li'))));
    for (const a of daten.aufgabenJeThema.get(t.id)) {
      anfuegen(block, h('article', { class: 'karte lehrer-aufgabe', 'data-aufgabe': a.id },
        h('p', { class: 'ueberzeile' }, a.id, ' · ', h('a', { href: `#/aufgabe/${a.id}` }, 'in der Lerntheke öffnen')),
        aufgabenKopf(a, false),
        tx(a.kontext, 'p', 'kontext'),
        abbildung(a),
        a.teile.map((teil) => lehrerTeil(teil))));
    }
    const fragen = daten.diagnose.filter((q) => q.thema === t.id);
    anfuegen(block, h('div', { class: 'karte' },
      h('h3', {}, 'Diagnosefragen'),
      h('ol', {}, fragen.map((q) => h('li', {}, tx(q.frage, 'p'),
        h('ul', { class: 'optionsliste' }, q.optionen.map((o, i) => h('li', { class: i === q.richtig ? 'richtig' : null },
          tx(o, 'span'), i === q.richtig ? h('span', { class: 'option-marke' }, 'richtig') : null))))))));
    anfuegen(main, block);
  }
}

function lehrerTeil(t) {
  const p = t.pruefung;
  let pruefung;
  if (p.typ === 'zahl') {
    pruefung = h('p', {}, `Zahl: ${formatZahl(p.wert)} ${p.einheit}, Toleranz ${String(p.toleranz_rel * 100).replace('.', ',')} %, Vorzeichen ${p.vorzeichen}`);
  } else if (p.typ === 'auswahl') {
    pruefung = h('ul', { class: 'optionsliste' }, p.optionen.map((o, i) => h('li', { class: p.richtig.includes(i) ? 'richtig' : null },
      tx(o, 'span'), p.richtig.includes(i) ? h('span', { class: 'option-marke' }, 'richtig') : null)));
  } else {
    pruefung = [h('p', {}, 'Selbstkontrolle mit Kriterien:'), h('ul', { class: 'kriterien' }, p.kriterien.map((c) => tx(c, 'li')))];
  }
  return h('section', { class: 'teil' },
    h('div', { class: 'teil-kopf' }, h('span', { class: 'teil-id' }, `${t.id})`),
      h('div', { class: 'teil-text' }, tx(t.text, 'p'), h('p', { class: 'teil-meta' }, `${t.be} BE · AFB ${t.afb}`))),
    pruefung,
    h('div', { class: 'hilfen' }, t.hilfen.map((x, i) => h('div', { class: 'hilfe' }, h('span', { class: 'hilfe-nr' }, `Hilfe ${i + 1}`), tx(x, 'p')))),
    h('div', { class: 'loesung' }, h('h3', {}, 'Lösung'), h('ol', {}, t.loesung.map((s) => tx(s, 'li')))));
}

// ------------------------------------------------------------------ Start der App

function zeigeFehler(titel, meldungen) {
  ersetzen(main, h('section', { class: 'karte fehlerseite', role: 'alert' },
    h('h1', {}, titel),
    h('p', {}, 'Bitte gib der Lehrkraft Bescheid.'),
    meldungen.length ? h('ul', {}, meldungen.slice(0, 30).map((m) => h('li', {}, m))) : null));
}

async function pruefeAktualisierung() {
  if (!navigator.onLine) return;
  try {
    const antwort = await fetch(`aufgaben.json?frisch=${Date.now()}`, { cache: 'no-store' });
    if (!antwort.ok) return;
    const neu = await antwort.text();
    if (neu !== rohText) {
      hinweis('Es gibt eine neue Version der Lerntheke.', 'Neu laden', () => location.reload());
    }
  } catch (e) { /* offline */ }
}

async function starte() {
  try {
    const antwort = await fetch('aufgaben.json');
    if (!antwort.ok) throw new Error(`Die Datei aufgaben.json wurde nicht gefunden (${antwort.status}).`);
    rohText = await antwort.text();
  } catch (e) {
    zeigeFehler('Die Aufgaben konnten nicht geladen werden.', [e.message]);
    return;
  }
  let json;
  try {
    json = JSON.parse(rohText);
  } catch (e) {
    zeigeFehler('Die Datei aufgaben.json ist fehlerhaft.', [e.message]);
    return;
  }
  const fehler = pruefeDaten(json);
  if (fehler.length) {
    zeigeFehler('Die Datei aufgaben.json enthält Fehler.', fehler);
    return;
  }
  daten = bereite(json);
  if (LEHRER && !location.hash) history.replaceState(null, '', `${location.pathname}${location.search}#/lehrer`);
  window.addEventListener('hashchange', zeichne);
  let breite = window.innerWidth;
  window.addEventListener('resize', () => {
    if (Math.abs(window.innerWidth - breite) < 20) return;
    breite = window.innerWidth;
    passeFormelnAn(main);
  });
  document.addEventListener('toggle', (e) => passeFormelnAn(e.target), true);
  zeichne();
  setInterval(() => main.querySelectorAll('section.teil').forEach(aktualisiereLoesungsKnopf), 1000);
  setTimeout(pruefeAktualisierung, 3000);
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
}

if (window.katex) starte();
else window.addEventListener('DOMContentLoaded', starte);
