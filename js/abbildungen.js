// Abbildungen als SVG, im Code gezeichnet. Farben kommen aus CSS-Klassen,
// damit Hell- und Dunkelmodus stimmen.

const NS = 'http://www.w3.org/2000/svg';

function el(name, attr = {}, text) {
  const e = document.createElementNS(NS, name);
  for (const [k, v] of Object.entries(attr)) e.setAttribute(k, String(v));
  if (text !== undefined) e.textContent = text;
  return e;
}

function zahl(x, stellen = 2) {
  const s = String(Number(x.toFixed(stellen)));
  return s.replace('.', ',').replace('-', '−');
}

function neuesSvg(breite, hoehe, titel) {
  const svg = el('svg', {
    viewBox: `0 0 ${breite} ${hoehe}`, class: 'abb', role: 'img', 'aria-label': titel,
  });
  svg.appendChild(el('title', {}, titel));
  const defs = el('defs');
  const pfeil = el('marker', {
    id: 'pfeil', viewBox: '0 0 10 10', refX: 9, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse',
  });
  pfeil.appendChild(el('path', { d: 'M0,0 L10,5 L0,10 z', class: 'pfeilspitze' }));
  defs.appendChild(pfeil);
  svg.appendChild(defs);
  return svg;
}

/**
 * Koordinatensystem mit Gitter, Achsenpfeilen und Beschriftung.
 * o: { xmin, xmax, ymin, ymax, gx, gy, lx, ly, achseX, achseY, breite, hoehe, rand }
 */
function koordinaten(o) {
  const breite = o.breite || 420;
  const hoehe = o.hoehe || 260;
  const rand = { l: 46, r: 50, o: 30, u: 34, ...(o.rand || {}) };
  const svg = neuesSvg(breite, hoehe, o.titel);
  const b = breite - rand.l - rand.r;
  const h = hoehe - rand.o - rand.u;
  const sx = (x) => rand.l + ((x - o.xmin) / (o.xmax - o.xmin)) * b;
  const sy = (y) => rand.o + ((o.ymax - y) / (o.ymax - o.ymin)) * h;

  const gitter = el('g', { class: 'gitter' });
  const eps = 1e-9;
  if (o.gx) {
    for (let x = Math.ceil((o.xmin - eps) / o.gx) * o.gx; x <= o.xmax + eps; x += o.gx) {
      if (Math.abs(x) < eps) continue;
      gitter.appendChild(el('line', { x1: sx(x), y1: sy(o.ymin), x2: sx(x), y2: sy(o.ymax) }));
    }
  }
  if (o.gy) {
    for (let y = Math.ceil((o.ymin - eps) / o.gy) * o.gy; y <= o.ymax + eps; y += o.gy) {
      if (Math.abs(y) < eps) continue;
      gitter.appendChild(el('line', { x1: sx(o.xmin), y1: sy(y), x2: sx(o.xmax), y2: sy(y) }));
    }
  }
  svg.appendChild(gitter);

  const achsen = el('g', { class: 'achse' });
  achsen.appendChild(el('line', { x1: sx(o.xmin), y1: sy(0), x2: sx(o.xmax) + 22, y2: sy(0), 'marker-end': 'url(#pfeil)' }));
  achsen.appendChild(el('line', { x1: sx(0), y1: sy(o.ymin), x2: sx(0), y2: sy(o.ymax) - 18, 'marker-end': 'url(#pfeil)' }));
  svg.appendChild(achsen);

  const schrift = el('g', { class: 'beschriftung' });
  if (o.lx) {
    for (let x = Math.ceil((o.xmin - eps) / o.lx) * o.lx; x <= o.xmax + eps; x += o.lx) {
      if (Math.abs(x) < eps) continue;
      schrift.appendChild(el('line', { x1: sx(x), y1: sy(0) - 4, x2: sx(x), y2: sy(0) + 4, class: 'strich' }));
      const unten = o.ymin < 0 ? sy(o.ymin) + 16 : sy(0) + 18;
      schrift.appendChild(el('text', { x: sx(x), y: unten, 'text-anchor': 'middle' }, zahl(x)));
    }
  }
  if (o.ly) {
    for (let y = Math.ceil((o.ymin - eps) / o.ly) * o.ly; y <= o.ymax + eps; y += o.ly) {
      if (Math.abs(y) < eps) continue;
      schrift.appendChild(el('line', { x1: sx(0) - 4, y1: sy(y), x2: sx(0) + 4, y2: sy(y), class: 'strich' }));
      schrift.appendChild(el('text', { x: sx(0) - 7, y: sy(y) + 4.5, 'text-anchor': 'end' }, zahl(y)));
    }
  }
  schrift.appendChild(el('text', { x: sx(0) - 7, y: sy(0) + 4.5, 'text-anchor': 'end' }, '0'));
  // Achsenbeschriftung außerhalb der Kurve
  schrift.appendChild(el('text', { x: sx(o.xmax) + 6, y: sy(0) - 8, 'text-anchor': 'start', class: 'achsentitel' }, o.achseX));
  schrift.appendChild(el('text', { x: sx(0) + 9, y: sy(o.ymax) - 10, 'text-anchor': 'start', class: 'achsentitel' }, o.achseY));
  svg.appendChild(schrift);
  return { svg, sx, sy };
}

function kurve(svg, punkte, sx, sy, klasse = 'kurve') {
  const d = punkte.map(([x, y], i) => `${i ? 'L' : 'M'}${sx(x).toFixed(2)},${sy(y).toFixed(2)}`).join(' ');
  svg.appendChild(el('path', { d, class: klasse }));
}

// ------------------------------------------------------------ B(t)-Diagramm
function btDiagramm(a) {
  const tmax = Math.max(...a.punkte.map((p) => p[0]));
  const bmax = Math.max(...a.punkte.map((p) => p[1]));
  const ymax = Math.ceil((bmax + 0.1 - 1e-9) * 10) / 10;
  const { svg, sx, sy } = koordinaten({
    titel: 'B(t)-Diagramm', xmin: 0, xmax: tmax, ymin: 0, ymax, gx: 0.5, gy: 0.1, lx: 1, ly: 0.1,
    achseX: a.achse_x, achseY: a.achse_y, hoehe: 270, rand: { o: 34 },
  });
  // Abschnitte über der Kurve
  const band = sy(bmax) - 4;
  const g = el('g', { class: 'abschnitte' });
  for (const [name, t0, t1] of a.abschnitte || []) {
    const y = band - 6;
    g.appendChild(el('path', { d: `M${sx(t0) + 2},${y + 5} V${y} H${sx(t1) - 2} V${y + 5}`, class: 'klammer' }));
    g.appendChild(el('text', { x: (sx(t0) + sx(t1)) / 2, y: y - 5, 'text-anchor': 'middle', class: 'abschnitt' }, name));
  }
  svg.appendChild(g);
  kurve(svg, a.punkte, sx, sy);
  return svg;
}

// ------------------------------------------------------------ y(t)-Diagramm
const FUNKTIONEN = {
  sin: (x) => Math.sin(x),
  cos: (x) => Math.cos(x),
  '-sin': (x) => -Math.sin(x),
  '-cos': (x) => -Math.cos(x),
  '−sin': (x) => -Math.sin(x),
  '−cos': (x) => -Math.cos(x),
};

function ytDiagramm(a) {
  const f = FUNKTIONEN[a.funktion] || FUNKTIONEN.sin;
  const ygrenze = Math.ceil((a.ymax + 0.25) * 2) / 2;
  const viertel = a.T / 4;
  const anzahl = Math.round(a.tmax / viertel);
  const { svg, sx, sy } = koordinaten({
    titel: 'y(t)-Diagramm', xmin: 0, xmax: a.tmax, ymin: -ygrenze, ymax: ygrenze,
    gx: a.raster ? viertel : null, gy: a.raster ? 0.5 : null,
    lx: anzahl > 12 ? 2 * viertel : viertel, ly: ygrenze > 2 ? 1 : 0.5,
    achseX: 't in s', achseY: `y in ${a.einheit_y}`, hoehe: 280,
  });
  const punkte = [];
  for (let i = 0; i <= 600; i++) {
    const t = (a.tmax * i) / 600;
    punkte.push([t, a.ymax * f((2 * Math.PI * t) / a.T)]);
  }
  kurve(svg, punkte, sx, sy);
  return svg;
}

// ------------------------------------------------------------ gedämpfte Schwingung
function gedaempft(a) {
  const delta = Math.LN2 / 3; // Halbierung der Amplitude in 3 s
  const ygrenze = Math.ceil((a.ymax + 0.25) * 2) / 2;
  const { svg, sx, sy } = koordinaten({
    titel: 'gedämpfte Schwingung', xmin: 0, xmax: a.tmax, ymin: -ygrenze, ymax: ygrenze,
    gx: a.T / 2, gy: 0.5, lx: a.T * (a.tmax / a.T > 10 ? 2 : 1), ly: 0.5,
    achseX: 't in s', achseY: 'y in cm', hoehe: 280,
  });
  const punkte = [];
  for (let i = 0; i <= 800; i++) {
    const t = (a.tmax * i) / 800;
    punkte.push([t, a.ymax * Math.exp(-delta * t) * Math.sin((2 * Math.PI * t) / a.T)]);
  }
  kurve(svg, punkte, sx, sy);
  if (a.einhuellende) {
    const oben = [];
    const unten = [];
    for (let i = 0; i <= 100; i++) {
      const t = (a.tmax * i) / 100;
      oben.push([t, a.ymax * Math.exp(-delta * t)]);
      unten.push([t, -a.ymax * Math.exp(-delta * t)]);
    }
    kurve(svg, oben, sx, sy, 'einhuellende');
    kurve(svg, unten, sx, sy, 'einhuellende');
  }
  return svg;
}

// ------------------------------------------------------------ drei Einhüllende
const HUELLEN = {
  konst: (t) => Math.max(0, 2 * (1 - t / 7)),
  v: (t) => 2 * Math.exp(-0.35 * t),
  v2: (t) => 2 / (1 + 0.6 * t),
};

function einhuellendeDrei(a) {
  const box = document.createElement('div');
  box.className = 'abb-reihe';
  (a.reihenfolge || ['konst', 'v', 'v2']).forEach((art, i) => {
    const huelle = HUELLEN[art] || HUELLEN.v;
    const fig = document.createElement('figure');
    fig.className = 'abb-klein';
    const { svg, sx, sy } = koordinaten({
      titel: `Diagramm ${i + 1}`, xmin: 0, xmax: 8, ymin: -2.4, ymax: 2.4,
      achseX: 't', achseY: 'y', breite: 260, hoehe: 190, rand: { l: 18, r: 30, o: 26, u: 14 },
    });
    const punkte = [];
    const oben = [];
    const unten = [];
    for (let j = 0; j <= 500; j++) {
      const t = (8 * j) / 500;
      punkte.push([t, huelle(t) * Math.cos(2 * Math.PI * t)]);
    }
    for (let j = 0; j <= 120; j++) {
      const t = (8 * j) / 120;
      oben.push([t, huelle(t)]);
      unten.push([t, -huelle(t)]);
    }
    kurve(svg, punkte, sx, sy);
    kurve(svg, oben, sx, sy, 'einhuellende');
    kurve(svg, unten, sx, sy, 'einhuellende');
    fig.appendChild(svg);
    const cap = document.createElement('figcaption');
    cap.textContent = `Diagramm ${i + 1}`;
    fig.appendChild(cap);
    box.appendChild(fig);
  });
  return box;
}

// ------------------------------------------------------------ Skizzen je Aufgabe
function skizzeLeiterschleife() {
  // Maßstab 5 px je cm
  const s = 5;
  const x0 = 24;
  const feldX = x0 + 25 * s;
  const svg = neuesSvg(460, 250, 'Leiterschleife vor einem Magnetfeld, Draufsicht');
  svg.classList.add('skizze');
  const oben = 40;
  const feldH = 34 * s;
  svg.appendChild(el('rect', { x: feldX, y: oben, width: 50 * s, height: feldH, class: 'feld' }));
  const kreuze = el('g', { class: 'kreuz' });
  for (let cx = feldX + 15; cx < feldX + 50 * s; cx += 30) {
    for (let cy = oben + 15; cy < oben + feldH; cy += 30) {
      kreuze.appendChild(el('path', { d: `M${cx - 5},${cy - 5} L${cx + 5},${cy + 5} M${cx + 5},${cy - 5} L${cx - 5},${cy + 5}` }));
    }
  }
  svg.appendChild(kreuze);
  svg.appendChild(el('text', { x: feldX + 50 * s - 8, y: oben + 20, 'text-anchor': 'end', class: 'beschriftung-gross' }, 'B'));
  // Leiterschleife 20 cm × 10 cm
  const sy0 = oben + feldH / 2 - 5 * s;
  svg.appendChild(el('rect', { x: x0, y: sy0, width: 20 * s, height: 10 * s, class: 'leiter' }));
  // Geschwindigkeit
  svg.appendChild(el('line', { x1: x0 + 20 * s + 6, y1: sy0 + 5 * s, x2: x0 + 20 * s + 22, y2: sy0 + 5 * s, class: 'vektor', 'marker-end': 'url(#pfeil)' }));
  svg.appendChild(el('text', { x: x0 + 20 * s + 12, y: sy0 + 5 * s - 8, class: 'beschriftung-gross', 'text-anchor': 'middle' }, 'v'));
  // Maße
  const mass = el('g', { class: 'mass' });
  const unten = oben + feldH + 22;
  mass.appendChild(el('line', { x1: feldX, y1: unten, x2: feldX + 50 * s, y2: unten, 'marker-start': 'url(#pfeil)', 'marker-end': 'url(#pfeil)' }));
  mass.appendChild(el('text', { x: feldX + 25 * s, y: unten + 16, 'text-anchor': 'middle' }, '50 cm'));
  mass.appendChild(el('line', { x1: x0, y1: sy0 - 12, x2: x0 + 20 * s, y2: sy0 - 12, 'marker-start': 'url(#pfeil)', 'marker-end': 'url(#pfeil)' }));
  mass.appendChild(el('text', { x: x0 + 10 * s, y: sy0 - 18, 'text-anchor': 'middle' }, '20 cm'));
  mass.appendChild(el('line', { x1: x0 - 10, y1: sy0, x2: x0 - 10, y2: sy0 + 10 * s, 'marker-start': 'url(#pfeil)', 'marker-end': 'url(#pfeil)' }));
  mass.appendChild(el('text', { x: x0 + 4, y: sy0 + 10 * s + 18, 'text-anchor': 'start' }, '10 cm'));
  svg.appendChild(mass);
  svg.appendChild(el('text', { x: feldX + 25 * s, y: oben - 10, 'text-anchor': 'middle', class: 'beschriftung' }, 'Magnetfeld, Feldlinien in die Zeichenebene'));
  return svg;
}

function lampe(g, cx, cy) {
  g.appendChild(el('circle', { cx, cy, r: 12, class: 'bauteil' }));
  const d = 12 / Math.SQRT2;
  g.appendChild(el('path', { d: `M${cx - d},${cy - d} L${cx + d},${cy + d} M${cx + d},${cy - d} L${cx - d},${cy + d}`, class: 'leitung' }));
}

function skizzeZweiStromkreise() {
  const svg = neuesSvg(430, 270, 'Zwei parallele Stromkreise mit gemeinsamem Schalter');
  svg.classList.add('skizze');
  const g = el('g');
  const L = (d) => g.appendChild(el('path', { d, class: 'leitung' }));
  const T = (x, y, t, anker = 'middle') => g.appendChild(el('text', { x, y, 'text-anchor': anker, class: 'beschriftung' }, t));
  const oben = 60;
  const mitte = 160;
  const unten = 240;
  // Quelle links
  L(`M40,${oben} V${mitte - 6}`);
  L(`M40,${mitte + 6} V${unten}`);
  g.appendChild(el('line', { x1: 24, y1: mitte - 6, x2: 56, y2: mitte - 6, class: 'leitung' }));
  g.appendChild(el('line', { x1: 32, y1: mitte + 6, x2: 48, y2: mitte + 6, class: 'leitung dick' }));
  T(64, mitte - 10, '+', 'start');
  T(64, mitte + 22, '−', 'start');
  T(14, mitte + 4, 'U', 'end');
  // Schalter
  L(`M40,${oben} H90`);
  g.appendChild(el('circle', { cx: 92, cy: oben, r: 2.5, class: 'punkt' }));
  g.appendChild(el('line', { x1: 92, y1: oben, x2: 124, y2: oben - 16, class: 'leitung' }));
  g.appendChild(el('circle', { cx: 128, cy: oben, r: 2.5, class: 'punkt' }));
  T(110, oben - 24, 'S');
  L(`M130,${oben} H170`);
  // Verzweigung
  g.appendChild(el('circle', { cx: 170, cy: oben, r: 3, class: 'punkt' }));
  L(`M170,${oben} V${mitte}`);
  // Zweig 1: Spule mit Eisenkern und Lampe 1
  L(`M170,${oben} H210`);
  g.appendChild(el('rect', { x: 210, y: oben - 8, width: 60, height: 16, class: 'spule' }));
  g.appendChild(el('line', { x1: 210, y1: oben - 14, x2: 270, y2: oben - 14, class: 'leitung dick' }));
  T(240, oben - 22, 'Spule mit Eisenkern');
  L(`M270,${oben} H318`);
  lampe(g, 330, oben);
  T(330, oben + 32, 'Lampe 1');
  L(`M342,${oben} H400`);
  // Zweig 2: Widerstand und Lampe 2
  L(`M170,${mitte} H210`);
  g.appendChild(el('rect', { x: 210, y: mitte - 8, width: 60, height: 16, class: 'bauteil' }));
  T(240, mitte - 16, 'Widerstand');
  L(`M270,${mitte} H318`);
  lampe(g, 330, mitte);
  T(330, mitte + 32, 'Lampe 2');
  L(`M342,${mitte} H400`);
  // Rückleitung
  g.appendChild(el('circle', { cx: 400, cy: mitte, r: 3, class: 'punkt' }));
  L(`M400,${oben} V${unten} H40`);
  svg.appendChild(g);
  return svg;
}

const SKIZZEN = {
  'I1-Z': skizzeLeiterschleife,
  'I3-G2': skizzeZweiStromkreise,
};

/** Erzeugt das DOM-Element zur Abbildung einer Aufgabe oder null. */
export function abbildung(aufgabe) {
  const a = aufgabe.abbildung;
  if (!a) return null;
  let inhalt;
  if (a.typ === 'bt_diagramm') inhalt = btDiagramm(a);
  else if (a.typ === 'yt_diagramm') inhalt = ytDiagramm(a);
  else if (a.typ === 'gedaempft') inhalt = gedaempft(a);
  else if (a.typ === 'einhuellende_drei') inhalt = einhuellendeDrei(a);
  else if (a.typ === 'skizze' && SKIZZEN[aufgabe.id]) inhalt = SKIZZEN[aufgabe.id]();
  else if (a.typ === 'skizze') {
    inhalt = document.createElement('p');
    inhalt.className = 'skizze-text';
    inhalt.textContent = a.beschreibung;
  }
  const fig = document.createElement('figure');
  fig.className = 'abbildung';
  fig.dataset.typ = a.typ;
  fig.appendChild(inhalt);
  return fig;
}
