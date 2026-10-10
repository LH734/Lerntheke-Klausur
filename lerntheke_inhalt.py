# -*- coding: utf-8 -*-
"""Inhalt der digitalen Lerntheke zur Klausur GK 12 (Induktion und mechanische
Schwingungen), Stand 10.10.2026.

Erzeugt aufgaben.json für die Web-App, die Lukas mit Claude Code baut.
Alle Zahlenwerte werden hier nachgerechnet (assert), die JSON-Werte stammen aus
denselben Rechnungen.

Konventionen (verbindlich, aus dem Kurs):
- Amplitude y_max, Elongation y, Kreisfrequenz ω, thermische Energie.
- Induktionsgesetz mit Minuszeichen: steigender Fluss → negative Spannung.
  Beträge sind erlaubt, wenn kenntlich gemacht (Prüfung: vorzeichen = "betrag_ok").
- Windungszahl im Hefter n (Formelsammlung N).
- Kein „Takt“, nichts Umgangssprachliches, keine Gedankenstriche im Satz,
  kein Komma vor „und“, keine Semikolons, keine Quellen im Schülertext.
- Formeln in LaTeX zwischen $…$.
"""
import json
import math

PI = math.pi
MU0 = 4 * PI * 1e-7


def r(x, n=3):
    """auf n signifikante Stellen runden"""
    if x == 0:
        return 0.0
    return round(x, -int(math.floor(math.log10(abs(x)))) + (n - 1))


def ZAHL(text, wert, einheit, be, afb, hilfen, loesung, tol=0.02, vorzeichen="streng"):
    return {"text": text, "be": be, "afb": afb,
            "pruefung": {"typ": "zahl", "wert": wert, "einheit": einheit,
                         "toleranz_rel": tol, "vorzeichen": vorzeichen},
            "hilfen": hilfen, "loesung": loesung}


def WAHL(text, optionen, richtig, be, afb, hilfen, loesung, mehrfach=False):
    return {"text": text, "be": be, "afb": afb,
            "pruefung": {"typ": "auswahl", "optionen": optionen, "richtig": richtig,
                         "mehrfach": mehrfach},
            "hilfen": hilfen, "loesung": loesung}


def SELBST(text, be, afb, kriterien, hilfen, loesung):
    assert len(kriterien) >= be, text
    return {"text": text, "be": be, "afb": afb,
            "pruefung": {"typ": "selbst", "kriterien": kriterien},
            "hilfen": hilfen, "loesung": loesung}


THEMEN = []
AUFGABEN = []
DIAGNOSE = []


def thema(tid, bereich, titel, stunden, checkliste):
    THEMEN.append({"id": tid, "bereich": bereich, "titel": titel,
                   "hefter": stunden, "checkliste": checkliste})


def aufgabe(aid, tid, stufe, titel, kontext, teile, abbildung=None):
    for i, t in enumerate(teile):
        t["id"] = "abcdefgh"[i]
    AUFGABEN.append({"id": aid, "thema": tid, "stufe": stufe, "titel": titel,
                     "kontext": kontext, "abbildung": abbildung, "teile": teile})


def diag(tid, frage, optionen, richtig):
    DIAGNOSE.append({"thema": tid, "frage": frage, "optionen": optionen,
                     "richtig": richtig})


# ========================================================================
#  INDUKTION
# ========================================================================

# ------------------------------------------------------------------ I1
thema("I1", "Induktion", "Entstehung der Induktionsspannung", "Stationsarbeit Station 1",
      ["Ladungstrennung im bewegten Leiter mit der Lorentzkraft erklären",
       "$U = B \\cdot l \\cdot v$ anwenden und umstellen",
       "nur die Feldkomponente senkrecht zu Leiter und Bewegung zählt"])

U = 0.30 * 0.40 * 2.5
assert abs(U - 0.30) < 1e-12
aufgabe("I1-G1", "I1", "G", "Leiterstab auf Schienen",
        "Ein gerader Leiterstab der Länge 40 cm wird mit $2{,}5\\,\\tfrac{m}{s}$ senkrecht "
        "zu den Feldlinien durch ein homogenes Magnetfeld mit $B = 0{,}30\\,T$ gezogen.",
        [ZAHL("Berechne die Spannung zwischen den Stabenden.", r(U), "V", 2, "I",
              ["Welche Gleichung verbindet B, l und v mit der Spannung?",
               "$U = B \\cdot l \\cdot v$. Die Länge muss in Meter eingesetzt werden.",
               "$U = 0{,}30\\,T \\cdot 0{,}40\\,m \\cdot 2{,}5\\,\\tfrac{m}{s}$"],
              ["$U = B \\cdot l \\cdot v$",
               "$U = 0{,}30\\,T \\cdot 0{,}40\\,m \\cdot 2{,}5\\,\\tfrac{m}{s} = 0{,}30\\,V$"]),
         SELBST("Beschreibe, wie zwischen den Stabenden eine Spannung entsteht.", 3, "I",
                ["Die freien Elektronen bewegen sich mit dem Stab durch das Magnetfeld, auf "
                 "sie wirkt die Lorentzkraft.",
                 "Die Lorentzkraft schiebt die Elektronen zu einem Stabende: dort "
                 "Elektronenüberschuss, am anderen Ende Elektronenmangel.",
                 "Zwischen den beiden Polen liegt die Induktionsspannung."],
                ["Welche Kraft wirkt auf bewegte Ladungen im Magnetfeld?",
                 "Wohin bewegen sich die Elektronen und was bleibt am anderen Ende zurück?",
                 "Verwende die Begriffe Lorentzkraft, Elektronenüberschuss, Elektronenmangel "
                 "und Pol."],
                ["Lorentzkraft auf die bewegten Elektronen",
                 "Ladungstrennung: Überschuss an einem Ende, Mangel am anderen",
                 "zwischen den Polen liegt die Spannung"])])

V = 0.045 / (0.50 * 0.20)
assert abs(V - 0.45) < 1e-12
aufgabe("I1-G2", "I1", "G", "Geschwindigkeit aus der Spannung",
        "Ein Stab der Länge 20 cm bewegt sich senkrecht zu den Feldlinien durch ein "
        "Magnetfeld mit $B = 0{,}50\\,T$. Zwischen den Enden misst man 45 mV.",
        [ZAHL("Berechne die Geschwindigkeit des Stabes.", r(V), "m/s", 2, "I",
              ["Stelle $U = B \\cdot l \\cdot v$ nach v um.",
               "$v = \\dfrac{U}{B \\cdot l}$. Rechne mV in V um.",
               "$v = \\dfrac{0{,}045\\,V}{0{,}50\\,T \\cdot 0{,}20\\,m}$"],
              ["$v = \\dfrac{U}{B \\cdot l} = \\dfrac{0{,}045\\,V}{0{,}50\\,T \\cdot 0{,}20\\,m} "
               "= 0{,}45\\,\\tfrac{m}{s}$"]),
         WAHL("Der Stab wird nun parallel zu den Feldlinien bewegt. Welche Spannung misst man?",
              ["0 V", "45 mV", "90 mV", "22,5 mV"], [0], 1, "II",
              ["Wirkt auf eine Ladung, die sich parallel zu den Feldlinien bewegt, eine "
               "Lorentzkraft?"],
              ["Bei Bewegung parallel zu den Feldlinien wirkt keine Lorentzkraft.",
               "Es werden keine Ladungen getrennt, die Spannung ist 0 V."])])

U_FL = 48e-6 * 35 * 230
U_LAND = 48e-6 * 35 * 80
assert abs(U_FL - 0.386) < 0.001 and abs(U_LAND - 0.134) < 0.001
aufgabe("I1-A", "I1", "A", "Flugzeug im Erdmagnetfeld",
        "Ein Regionalflugzeug mit 35 m Spannweite fliegt waagerecht mit $230\\,\\tfrac{m}{s}$. "
        "Die senkrechte Komponente des Erdmagnetfelds beträgt $48\\,\\mu T$.",
        [ZAHL("Berechne die Spannung zwischen den Flügelspitzen.", r(U_FL), "V", 2, "II",
              ["Welche Feldkomponente steht senkrecht auf Flügel und Flugrichtung?",
               "Setze die senkrechte Komponente in $U = B \\cdot l \\cdot v$ ein. "
               "$1\\,\\mu T = 10^{-6}\\,T$.",
               "$U = 48 \\cdot 10^{-6}\\,T \\cdot 35\\,m \\cdot 230\\,\\tfrac{m}{s}$"],
              ["$U = 48 \\cdot 10^{-6}\\,T \\cdot 35\\,m \\cdot 230\\,\\tfrac{m}{s} "
               "\\approx 0{,}39\\,V$"]),
         ZAHL("Im Landeanflug fliegt das Flugzeug mit $80\\,\\tfrac{m}{s}$. Berechne die "
              "Spannung.", r(U_LAND), "V", 1, "II",
              ["Wie hängt U von v ab?",
               "U ist proportional zu v. Du kannst neu einsetzen oder mit dem Verhältnis "
               "rechnen."],
              ["$U = 48 \\cdot 10^{-6}\\,T \\cdot 35\\,m \\cdot 80\\,\\tfrac{m}{s} "
               "\\approx 0{,}13\\,V$"], tol=0.04)])

T_EIN = 0.20 / 0.50
U_EIN = 0.40 * 0.10 * 0.50
assert abs(T_EIN - 0.40) < 1e-12 and abs(U_EIN - 0.020) < 1e-12
aufgabe("I1-Z", "I1", "Z", "Leiterschleife durch ein Magnetfeld",
        "Eine rechteckige Leiterschleife (10 cm hoch, 20 cm lang) wird mit "
        "$0{,}50\\,\\tfrac{m}{s}$ waagerecht durch ein 50 cm breites homogenes Magnetfeld mit "
        "$B = 0{,}40\\,T$ gezogen. Die Feldlinien stehen senkrecht auf der Schleife. Die "
        "10 cm lange Seite liegt parallel zum Feldrand.",
        [ZAHL("Berechne, wie lange das Eintreten in das Feld dauert.", r(T_EIN), "s", 1, "I",
              ["Welchen Weg legt die Schleife zurück, bis sie ganz im Feld ist?",
               "Die Schleife ist ganz im Feld, wenn sie um ihre Länge von 20 cm "
               "eingetreten ist."],
              ["$t = \\dfrac{0{,}20\\,m}{0{,}50\\,\\tfrac{m}{s}} = 0{,}40\\,s$"]),
         ZAHL("Berechne den Betrag der induzierten Spannung beim Eintreten.", r(U_EIN), "V", 2,
              "II",
              ["Welche Seite der Schleife schneidet beim Eintreten die Feldlinien?",
               "Nur die vordere 10 cm lange Seite ist im Feld. Es gilt "
               "$U = B \\cdot l \\cdot v$ mit l = 0,10 m.",
               "$U = 0{,}40\\,T \\cdot 0{,}10\\,m \\cdot 0{,}50\\,\\tfrac{m}{s}$"],
              ["Gleichwertig über die Flächenänderung: $|U| = B \\cdot A' = B \\cdot l \\cdot v$",
               "$|U| = 0{,}40\\,T \\cdot 0{,}10\\,m \\cdot 0{,}50\\,\\tfrac{m}{s} = 0{,}020\\,V$"],
              vorzeichen="betrag_ok"),
         SELBST("Ein Mitschüler behauptet: „Wenn die Schleife ganz im Feld ist, ist die "
                "Spannung am größten, weil dann der Fluss am größten ist.“ Nimm Stellung.",
                3, "III",
                ["Die Aussage ist falsch: Ganz im Feld ist der Fluss zwar am größten, aber "
                 "konstant.",
                 "Induziert wird nur bei Änderung des Flusses, die Spannung ist dann 0.",
                 "Beim Austreten nimmt der Fluss ab, die Spannung hat den gleichen Betrag und "
                 "das entgegengesetzte Vorzeichen wie beim Eintreten."],
                ["Wovon hängt die Induktionsspannung ab: vom Fluss oder von seiner Änderung?",
                 "Ändert sich der Fluss, solange die Schleife ganz im Feld ist?",
                 "Vergleiche Eintreten, ganz im Feld und Austreten."],
                ["Fluss ganz im Feld maximal, aber konstant: $U = 0$",
                 "Eintreten: Fluss wächst, $|U| = 20\\,mV$. Austreten: Fluss sinkt, "
                 "$|U| = 20\\,mV$ mit umgekehrtem Vorzeichen",
                 "entscheidend ist die Änderungsrate des Flusses, nicht sein Wert"])],
        abbildung={"typ": "skizze", "beschreibung":
                   "Draufsicht: graues Rechteck 50 cm breit (Magnetfeld, Kreuze für Feldlinien "
                   "in die Zeichenebene), links davon eine Leiterschleife 20 cm × 10 cm mit "
                   "Geschwindigkeitspfeil v nach rechts."})

diag("I1", "Ein Stab bewegt sich doppelt so schnell durch dasselbe Feld. Die Spannung …",
     ["verdoppelt sich", "bleibt gleich", "halbiert sich", "vervierfacht sich"], 0)
diag("I1", "Welche Kraft trennt im bewegten Stab die Ladungen?",
     ["Lorentzkraft", "Gewichtskraft", "Reibungskraft", "Federkraft"], 0)

# ------------------------------------------------------------------ I2
thema("I2", "Induktion", "Induktionsgesetz und magnetischer Fluss", "Stationsarbeit Station 2",
      ["$\\Phi = B \\cdot A \\cdot \\cos\\varphi$ und $[\\Phi] = Vs$",
       "$U = -n \\cdot \\dfrac{\\Delta \\Phi}{\\Delta t}$ für konstante Fläche und für konstantes B",
       "U(t)-Diagramm aus einem B(t)- oder Φ(t)-Diagramm",
       "Vorzeichen: steigender Fluss, negative Spannung"])

A2 = 30e-4
U1 = -300 * 0.60 * A2 / 3.0
U3 = -300 * (-0.60) * A2 / 1.5
assert abs(U1 + 0.18) < 1e-12 and abs(U3 - 0.36) < 1e-12
aufgabe("I2-G1", "I2", "G", "Spule im veränderlichen Magnetfeld",
        "Eine Spule mit 300 Windungen und $30\\,cm^2$ Querschnittsfläche steht senkrecht im "
        "Magnetfeld. Das Diagramm zeigt die Flussdichte.",
        [ZAHL("Berechne die Spannung im Abschnitt I (0 bis 3,0 s).", r(U1), "V", 2, "I",
              ["Die Fläche ist konstant, nur B ändert sich.",
               "$U = -n \\cdot A \\cdot \\dfrac{\\Delta B}{\\Delta t}$ mit "
               "$A = 30 \\cdot 10^{-4}\\,m^2$",
               "$\\Delta B = 0{,}60\\,T$ in $\\Delta t = 3{,}0\\,s$"],
              ["$A = 3{,}0 \\cdot 10^{-3}\\,m^2$",
               "$U = -300 \\cdot 3{,}0 \\cdot 10^{-3}\\,m^2 \\cdot "
               "\\dfrac{0{,}60\\,T}{3{,}0\\,s} = -0{,}18\\,V$"],
              vorzeichen="betrag_ok"),
         ZAHL("Gib die Spannung im Abschnitt II (3,0 s bis 5,0 s) an.", 0.0, "V", 1, "I",
              ["Ändert sich der Fluss in diesem Abschnitt?"],
              ["B ist konstant, der Fluss ändert sich nicht: $U = 0$"]),
         ZAHL("Berechne die Spannung im Abschnitt III (5,0 s bis 6,5 s).", r(U3), "V", 2, "II",
              ["Wie groß ist ΔB und in welcher Zeit?",
               "B fällt um 0,60 T in 1,5 s. Fallender Fluss gibt positive Spannung.",
               "Die Änderung ist doppelt so schnell wie in Abschnitt I."],
              ["$U = -300 \\cdot 3{,}0 \\cdot 10^{-3}\\,m^2 \\cdot "
               "\\dfrac{-0{,}60\\,T}{1{,}5\\,s} = +0{,}36\\,V$"],
              vorzeichen="betrag_ok")],
        abbildung={"typ": "bt_diagramm", "punkte": [[0, 0], [3.0, 0.60], [5.0, 0.60],
                                                    [6.5, 0], [8.0, 0]],
                   "achse_x": "t in s", "achse_y": "B in T",
                   "abschnitte": [["I", 0, 3.0], ["II", 3.0, 5.0], ["III", 5.0, 6.5]]})

PHI = 0.80 * 50e-4 * math.cos(math.radians(60))
assert abs(PHI - 2.0e-3) < 1e-12
aufgabe("I2-G2", "I2", "G", "Magnetischer Fluss",
        "Eine Leiterschleife mit $50\\,cm^2$ Fläche liegt in einem Magnetfeld mit "
        "$B = 0{,}80\\,T$. Flächennormale und Feldlinien schließen 60° ein.",
        [ZAHL("Berechne den magnetischen Fluss in mVs.", r(PHI * 1e3), "mVs", 2, "I",
              ["Nur die Komponente von B entlang der Flächennormalen zählt.",
               "$\\Phi = B \\cdot A \\cdot \\cos\\varphi$ mit "
               "$A = 50 \\cdot 10^{-4}\\,m^2$",
               "Der Taschenrechner muss auf Grad (DEG) stehen."],
              ["$\\Phi = 0{,}80\\,T \\cdot 5{,}0 \\cdot 10^{-3}\\,m^2 \\cdot \\cos 60° "
               "= 2{,}0 \\cdot 10^{-3}\\,Vs = 2{,}0\\,mVs$"]),
         WAHL("Bei welchem Winkel zwischen Flächennormale und Feldlinien ist der Fluss am "
              "größten?", ["0°", "45°", "90°", "180° und 90° gleich"], [0], 1, "I",
              ["Für welchen Winkel ist $\\cos\\varphi$ am größten?"],
              ["$\\cos 0° = 1$: Die Feldlinien durchsetzen die Fläche senkrecht."])])

PHIMAX = 0.25 * 40e-4
assert abs(PHIMAX - 1.0e-3) < 1e-12
aufgabe("I2-A", "I2", "A", "Generator",
        "In einem Generator dreht sich eine Spule (200 Windungen, $40\\,cm^2$) mit "
        "50 Umdrehungen je Sekunde in einem homogenen Magnetfeld mit $B = 0{,}25\\,T$.",
        [ZAHL("Berechne den größten magnetischen Fluss durch eine Windung in mVs.",
              r(PHIMAX * 1e3), "mVs", 1, "I",
              ["Wann durchsetzt das Feld die Spulenfläche vollständig?",
               "$\\Phi_{max} = B \\cdot A$"],
              ["$\\Phi_{max} = 0{,}25\\,T \\cdot 4{,}0 \\cdot 10^{-3}\\,m^2 "
               "= 1{,}0\\,mVs$"]),
         ZAHL("Gib die Frequenz der erzeugten Wechselspannung an.", 50.0, "Hz", 1, "I",
              ["Wie oft wiederholt sich die Flussänderung bei einer Umdrehung?"],
              ["Eine Umdrehung ergibt eine Periode der Spannung: $f = 50\\,Hz$"]),
         SELBST("Erkläre, warum die Spannung am größten ist, wenn die Spulenfläche parallel "
                "zu den Feldlinien steht, obwohl der Fluss dann null ist.", 2, "II",
                ["Induziert wird nach dem Induktionsgesetz durch die Änderungsrate des "
                 "Flusses, nicht durch den Fluss.",
                 "In dieser Stellung ändert sich der Fluss am schnellsten, deshalb ist die "
                 "Spannung am größten."],
                ["Wovon hängt U im Induktionsgesetz ab?",
                 "Zeichne Φ(t) als Kosinus. Wo ist die Kurve am steilsten?"],
                ["$U = -n \\cdot \\Phi'$: entscheidend ist die Steigung von Φ(t)",
                 "Φ(t) ist bei Φ = 0 am steilsten, dort ist |U| am größten"])])

aufgabe("I2-Z", "I2", "Z", "Zwei Wege zur gleichen Gleichung",
        "Ein Leiterbügel der Länge l gleitet mit der Geschwindigkeit v auf zwei Schienen. "
        "Bügel und Schienen bilden eine Leiterschleife, deren Fläche wächst. Das Magnetfeld B "
        "steht senkrecht auf der Schleife und ist konstant.",
        [SELBST("Zeige mit dem Induktionsgesetz $U = -n \\cdot B \\cdot A'$, dass für den "
                "Betrag der Spannung $U = B \\cdot l \\cdot v$ gilt. Notiere hinter jedem "
                "Schritt, was du tust.", 4, "III",
                ["Die Schleife hat eine Windung: n = 1.",
                 "In der Zeit Δt wächst die Fläche um $\\Delta A = l \\cdot v \\cdot \\Delta t$.",
                 "Daraus folgt $A' = \\dfrac{\\Delta A}{\\Delta t} = l \\cdot v$.",
                 "Eingesetzt: $|U| = B \\cdot l \\cdot v$, dasselbe Ergebnis wie über die "
                 "Lorentzkraft."],
                ["Welche Größe ändert sich hier, B oder A?",
                 "Um wie viel wächst die Fläche, wenn der Bügel die Strecke "
                 "$v \\cdot \\Delta t$ zurücklegt?",
                 "Setze $A' = l \\cdot v$ in das Induktionsgesetz ein."],
                ["n = 1, B konstant",
                 "$\\Delta A = l \\cdot v \\cdot \\Delta t$  |  Fläche des überstrichenen "
                 "Rechtecks",
                 "$A' = l \\cdot v$  |  durch Δt geteilt",
                 "$|U| = B \\cdot l \\cdot v$  |  eingesetzt"])])

diag("I2", "Die Flussdichte in einer Spule ist groß, aber konstant. Die induzierte Spannung ist …",
     ["null", "groß", "negativ", "gleich der Flussdichte"], 0)
diag("I2", "Welche Einheit hat der magnetische Fluss?", ["Vs", "T", "V/s", "Wb/m²"], 0)

# ------------------------------------------------------------------ I3
thema("I3", "Induktion", "Lenz’sche Regel und Selbstinduktion", "Stationsarbeit Station 3",
      ["Lenz’sche Regel: der Induktionsstrom wirkt seiner Ursache entgegen",
       "Wirbelströme und Wirbelstrombremse",
       "Ein- und Ausschalten einer Spule: I(t)-Diagramm und Erklärung in Schritten"])

aufgabe("I3-G1", "I3", "G", "Magnet im Kupferrohr",
        "Ein Stabmagnet fällt einmal durch ein Kupferrohr und einmal durch ein gleich großes "
        "Kunststoffrohr.",
        [WAHL("Vergleiche die Fallzeiten.",
              ["Im Kupferrohr fällt er deutlich langsamer.",
               "Im Kunststoffrohr fällt er deutlich langsamer.",
               "Die Fallzeiten sind gleich.",
               "Im Kupferrohr bleibt er stecken."], [0], 1, "I",
              ["In welchem Rohr können Ströme fließen?"],
              ["Nur im leitenden Kupfer werden Ströme induziert, die den Magneten bremsen."]),
         SELBST("Erkläre die Beobachtung mit der Lenz’schen Regel.", 2, "II",
                ["Der fallende Magnet ändert den Fluss durch die Rohrwand, im Kupfer werden "
                 "Wirbelströme induziert.",
                 "Nach der Lenz’schen Regel wirkt ihr Magnetfeld der Ursache, der Bewegung des "
                 "Magneten, entgegen und bremst ihn. Kunststoff leitet nicht."],
                ["Was ändert sich in der Rohrwand, wenn der Magnet vorbeifällt?",
                 "Wogegen richtet sich das Magnetfeld der induzierten Ströme?"],
                ["Flussänderung in der Rohrwand, Wirbelströme im Kupfer",
                 "Lenz: Magnetfeld der Wirbelströme bremst den Magneten"])])

aufgabe("I3-G2", "I3", "G", "Einschalten mit Spule",
        "Zwei Glühlampen werden gleichzeitig eingeschaltet. Vor der ersten liegt eine Spule "
        "mit Eisenkern, vor der zweiten ein ohmscher Widerstand gleicher Größe.",
        [WAHL("Welche Beschreibung des I(t)-Verlaufs ist richtig?",
              ["Widerstand: Sprung auf den Endwert. Spule: verzögerter Anstieg auf denselben "
               "Endwert.",
               "Widerstand: Sprung auf den Endwert. Spule: verzögerter Anstieg auf einen "
               "kleineren Endwert.",
               "Spule: Sprung auf den Endwert. Widerstand: verzögerter Anstieg.",
               "Beide steigen gleich schnell an."], [0], 2, "I",
              ["Begrenzt die Spule im eingeschalteten Zustand den Strom stärker als der "
               "Widerstand?",
               "Am Ende fließt Gleichstrom, die Spule wirkt nur noch mit ihrem Widerstand."],
              ["Widerstandskreis: Stromstärke springt sofort auf den Endwert.",
               "Spulenkreis: verzögerter Anstieg auf denselben Endwert, weil beide gleich "
               "große Widerstände haben."]),
         SELBST("Erkläre den Unterschied. Verwende die Begriffe Magnetfeldänderung, "
                "Selbstinduktion und Lenz’sche Regel.", 3, "II",
                ["Beim Einschalten baut sich das Magnetfeld der Spule auf: Magnetfeldänderung.",
                 "Die Änderung induziert in der Spule selbst eine Spannung: Selbstinduktion.",
                 "Nach der Lenz’schen Regel wirkt der Induktionsstrom seiner Ursache entgegen "
                 "und hemmt den Anstieg der Stromstärke."],
                ["Was passiert beim Einschalten mit dem Magnetfeld der Spule?",
                 "Was bewirkt diese Änderung in der Spule selbst?",
                 "In welche Richtung wirkt der Induktionsstrom?"],
                ["Magnetfeldänderung beim Einschalten",
                 "Selbstinduktion in der Spule",
                 "Lenz: hemmt den Stromanstieg"])],
        abbildung={"typ": "skizze", "beschreibung":
                   "Zwei parallele Stromkreise an einer Gleichspannungsquelle mit gemeinsamem "
                   "Schalter: Lampe 1 mit Spule (Eisenkern), Lampe 2 mit Widerstand."})

aufgabe("I3-A", "I3", "A", "Thomson’scher Ringversuch",
        "Ein leichter Aluminiumring liegt locker auf einer Spule mit Eisenkern. Die Spule wird "
        "an eine Gleichspannungsquelle angeschlossen.",
        [SELBST("Erkläre, warum der Ring beim Einschalten hochspringt.", 3, "II",
                ["Beim Einschalten wächst der Fluss durch den Ring.",
                 "Im Ring wird ein Strom induziert.",
                 "Nach Lenz wirkt sein Magnetfeld dem Anstieg entgegen: Ring und Spule stoßen "
                 "sich ab, die Kraft ist größer als die Gewichtskraft."],
                ["Was ändert sich beim Einschalten im Ring?",
                 "Wie ist das Magnetfeld des Ringstroms gerichtet?"],
                ["Flussanstieg durch den Ring", "Induktionsstrom im Ring",
                 "Lenz: Abstoßung, Ring springt"]),
         WAHL("Der Ring wird aufgeschlitzt. Was beobachtet man?",
              ["Er bleibt liegen.", "Er springt höher.", "Er springt gleich hoch.",
               "Er wird angezogen."], [0], 1, "II",
              ["Kann im geschlitzten Ring ein Strom im Kreis fließen?"],
              ["Der Schlitz unterbricht die Strombahn, es fließt kein Ringstrom, es gibt keine "
               "Abstoßung."]),
         WAHL("Der Ring liegt wieder ungeschlitzt auf der Spule. Was geschieht beim "
              "Ausschalten?",
              ["Er wird kurz zur Spule hin gezogen.", "Er springt hoch.",
               "Es passiert nichts.", "Er beginnt zu rotieren."], [0], 1, "II",
              ["Beim Ausschalten nimmt der Fluss ab. Wogegen richtet sich der Ringstrom jetzt?"],
              ["Der Ringstrom wirkt der Abnahme entgegen: Sein Magnetfeld ist gleichsinnig mit "
               "dem der Spule, der Ring wird kurz angezogen."])])

aufgabe("I3-Z", "I3", "Z", "Magnet im langen Kupferrohr",
        "Ein starker Magnet fällt durch ein sehr langes senkrechtes Kupferrohr. Nach kurzer "
        "Zeit fällt er mit konstanter Geschwindigkeit.",
        [SELBST("Erkläre, warum sich eine konstante Geschwindigkeit einstellt.", 3, "III",
                ["Die Bremskraft der Wirbelströme wächst mit der Geschwindigkeit, weil sich der "
                 "Fluss dann schneller ändert.",
                 "Der Magnet wird schneller, bis die Bremskraft so groß ist wie die "
                 "Gewichtskraft.",
                 "Dann ist die resultierende Kraft null, die Geschwindigkeit bleibt konstant."],
                ["Wovon hängt die Stärke der Wirbelströme ab?",
                 "Welche Kräfte wirken auf den Magneten und wann heben sie sich auf?"],
                ["Bremskraft wächst mit v (schnellere Flussänderung)",
                 "Gleichgewicht Bremskraft = Gewichtskraft", "resultierende Kraft null"]),
         SELBST("Beurteile die Energiebilanz während des Falls mit konstanter "
                "Geschwindigkeit.", 2, "II",
                ["Die kinetische Energie bleibt konstant, die potentielle Energie nimmt ab.",
                 "Die Energie wird über die Wirbelströme in thermische Energie des Rohres "
                 "umgewandelt. Die Energie bleibt erhalten."],
                ["Welche Energieform nimmt ab, welche bleibt gleich?",
                 "Was bewirken die Wirbelströme im Kupfer?"],
                ["E_kin konstant, Lageenergie nimmt ab",
                 "Umwandlung in thermische Energie des Rohres, Energieerhaltung"])])

diag("I3", "Nach der Lenz’schen Regel wirkt der Induktionsstrom …",
     ["seiner Ursache entgegen", "seiner Ursache gleichgerichtet",
      "immer senkrecht zum Magnetfeld", "nur bei Wechselstrom"], 0)
diag("I3", "Beim Einschalten einer Spule steigt die Stromstärke …",
     ["verzögert an", "sprunghaft an", "gar nicht an", "über den Endwert hinaus an"], 0)

# ------------------------------------------------------------------ I4
thema("I4", "Induktion", "Induktivität und Permeabilität", "Stationsarbeit Station 4",
      ["$L = \\mu_0 \\cdot \\mu_r \\cdot \\dfrac{n^2 \\cdot A}{l}$",
       "$U = -L \\cdot \\dfrac{\\Delta I}{\\Delta t}$, Abschaltspannung",
       "Wirkung von n, A, l und Eisenkern auf L"])

L_LUFT = MU0 * 800 ** 2 * 10e-4 / 0.20
assert abs(L_LUFT - 4.02e-3) < 1e-5
aufgabe("I4-G1", "I4", "G", "Induktivität einer Spule",
        "Eine Luftspule hat 800 Windungen, die Länge 20 cm und die Querschnittsfläche "
        "$10\\,cm^2$.",
        [ZAHL("Berechne die Induktivität in mH.", r(L_LUFT * 1e3, 2), "mH", 2, "I",
              ["$L = \\mu_0 \\cdot \\mu_r \\cdot \\dfrac{n^2 \\cdot A}{l}$ mit "
               "$\\mu_r = 1$ für Luft",
               "$\\mu_0 = 1{,}257 \\cdot 10^{-6}\\,\\tfrac{Vs}{Am}$, "
               "$A = 10 \\cdot 10^{-4}\\,m^2$",
               "n wird quadriert: $800^2 = 640\\,000$"],
              ["$L = 1{,}257 \\cdot 10^{-6}\\,\\tfrac{Vs}{Am} \\cdot "
               "\\dfrac{640\\,000 \\cdot 1{,}0 \\cdot 10^{-3}\\,m^2}{0{,}20\\,m} "
               "\\approx 4{,}0\\,mH$"], tol=0.03),
         ZAHL("Ein Eisenkern mit $\\mu_r = 500$ wird eingeschoben. Berechne die neue "
              "Induktivität in H.", r(L_LUFT * 500, 2), "H", 1, "I",
              ["L ist proportional zu $\\mu_r$."],
              ["$L = 500 \\cdot 4{,}0\\,mH = 2{,}0\\,H$"], tol=0.03)])

U_AB = 0.60 * 3.0 / 0.015
assert abs(U_AB - 120) < 1e-9
aufgabe("I4-G2", "I4", "G", "Abschaltspannung",
        "Durch eine Spule mit $L = 0{,}60\\,H$ fließen 3,0 A. Beim Öffnen des Schalters sinkt "
        "die Stromstärke in 15 ms auf null.",
        [ZAHL("Berechne den Betrag der induzierten Spannung.", r(U_AB), "V", 2, "I",
              ["$U = -L \\cdot \\dfrac{\\Delta I}{\\Delta t}$",
               "$\\Delta I = -3{,}0\\,A$, $\\Delta t = 0{,}015\\,s$"],
              ["$|U| = 0{,}60\\,H \\cdot \\dfrac{3{,}0\\,A}{0{,}015\\,s} = 120\\,V$"],
              vorzeichen="betrag_ok"),
         WAHL("Der Strom wird stattdessen in 30 ms abgeschaltet. Die Spannung …",
              ["halbiert sich", "verdoppelt sich", "bleibt gleich", "viertelt sich"], [0], 1,
              "II", ["Wie hängt U von Δt ab?"],
              ["U ist umgekehrt proportional zu Δt: doppelte Zeit, halbe Spannung, 60 V."])])

U_WZ = 0.80 * 1.5 / 0.20e-3
assert abs(U_WZ - 6000) < 1e-6
aufgabe("I4-A", "I4", "A", "Weidezaungerät",
        "Ein Weidezaungerät enthält eine Spule mit $L = 0{,}80\\,H$. Ein Strom von 1,5 A wird "
        "periodisch in 0,20 ms unterbrochen.",
        [ZAHL("Berechne den Betrag der Spannung in kV.", r(U_WZ / 1e3), "kV", 2, "II",
              ["Gleiche Gleichung wie bei der Abschaltspannung.",
               "0,20 ms = $0{,}20 \\cdot 10^{-3}\\,s$"],
              ["$|U| = 0{,}80\\,H \\cdot \\dfrac{1{,}5\\,A}{0{,}20 \\cdot 10^{-3}\\,s} "
               "= 6{,}0\\,kV$"], vorzeichen="betrag_ok"),
         SELBST("Begründe mit der Gleichung, warum der Strom möglichst schnell unterbrochen "
                "werden muss.", 2, "II",
                ["Die Spannung ist umgekehrt proportional zur Abschaltzeit Δt.",
                 "Nur bei sehr kurzer Abschaltzeit entsteht die hohe Spannung, die der Zaun "
                 "braucht."],
                ["Was passiert mit U, wenn Δt kleiner wird?"],
                ["$|U| = L \\cdot \\dfrac{\\Delta I}{\\Delta t}$: kleines Δt, große Spannung",
                 "hohe Spannung nur bei schneller Unterbrechung"])])

aufgabe("I4-Z", "I4", "Z", "Induktivität vergrößern",
        "Eine Luftspule soll eine größere Induktivität bekommen. Zur Wahl stehen: Windungszahl "
        "bei gleicher Länge verdoppeln · Länge bei gleicher Windungszahl halbieren · "
        "Querschnittsfläche verdoppeln · Eisenkern mit $\\mu_r = 100$ einschieben.",
        [WAHL("Ordne zu: Um welchen Faktor wächst L bei Verdoppeln der Windungszahl?",
              ["4", "2", "8", "1"], [0], 1, "II",
              ["n steht in der Gleichung im Quadrat."], ["$L \\sim n^2$: Faktor 4"]),
         SELBST("Ein Mitschüler sagt: „Doppelte Windungszahl heißt doppelte Induktivität.“ "
                "Beurteile die Aussage und ordne alle vier Maßnahmen nach ihrer Wirkung.", 3,
                "III",
                ["Die Aussage ist falsch: L wächst mit $n^2$, also um den Faktor 4.",
                 "Reihenfolge: Eisenkern (Faktor 100), Windungszahl verdoppeln (4), Länge "
                 "halbieren (2) und Fläche verdoppeln (2).",
                 "Begründung über die Exponenten bzw. Faktoren in der Gleichung."],
                ["Schreibe für jede Maßnahme den Faktor auf, um den L wächst.",
                 "Achte auf das Quadrat bei n und darauf, dass l im Nenner steht."],
                ["falsch: Faktor 4 wegen $n^2$",
                 "Eisenkern 100 > n verdoppeln 4 > l halbieren 2 = A verdoppeln 2"])])

diag("I4", "Die Windungszahl einer Spule wird verdoppelt (gleiche Länge). L …",
     ["vervierfacht sich", "verdoppelt sich", "bleibt gleich", "halbiert sich"], 0)
diag("I4", "Welche Einheit hat die Induktivität?", ["H", "F", "T", "Vs"], 0)

# ------------------------------------------------------------------ I5
thema("I5", "Induktion", "Transformator und Energiefernleitung", "Stationsarbeit Station 5",
      ["$\\dfrac{U_1}{U_2} = \\dfrac{n_1}{n_2}$ und $\\dfrac{I_1}{I_2} = \\dfrac{n_2}{n_1}$ "
       "(ideal)",
       "Verlustleistung $P_V = I^2 \\cdot R$, Hochspannung", "Wirkungsgrad",
       "kein Transformator mit Gleichspannung"])

N2 = 1150 * 6.0 / 230
I1 = 6.0 * 1.5 / 230
assert abs(N2 - 30) < 1e-9 and abs(I1 - 0.0391) < 1e-4
aufgabe("I5-G1", "I5", "G", "Netztransformator",
        "Ein Transformator setzt 230 V auf 6,0 V herunter. Die Primärspule hat 1150 Windungen.",
        [ZAHL("Berechne die Windungszahl der Sekundärspule.", 30.0, "", 2, "I",
              ["$\\dfrac{U_1}{U_2} = \\dfrac{n_1}{n_2}$ nach $n_2$ umstellen."],
              ["$n_2 = n_1 \\cdot \\dfrac{U_2}{U_1} = 1150 \\cdot \\dfrac{6{,}0\\,V}{230\\,V} "
               "= 30$"], tol=0.001),
         ZAHL("Sekundär fließen 1,5 A. Berechne die primäre Stromstärke in mA (ideal).",
              r(I1 * 1e3, 2), "mA", 2, "I",
              ["Beim idealen Transformator ist die Leistung auf beiden Seiten gleich.",
               "$U_1 \\cdot I_1 = U_2 \\cdot I_2$"],
              ["$I_1 = \\dfrac{U_2 \\cdot I_2}{U_1} = \\dfrac{6{,}0\\,V \\cdot 1{,}5\\,A}{230\\,V} "
               "\\approx 39\\,mA$"], tol=0.03)])

P, R = 5.0e6, 2.5
PV10 = (P / 10e3) ** 2 * R
PV110 = (P / 110e3) ** 2 * R
assert abs(PV10 - 625e3) < 1 and abs(PV110 - 5165) < 1
aufgabe("I5-G2", "I5", "G", "Fernleitung",
        "Ein Windpark liefert 5,0 MW. Die Leitung zum Umspannwerk hat den Widerstand 2,5 Ω.",
        [ZAHL("Berechne die Verlustleistung bei 10 kV in kW.", r(PV10 / 1e3), "kW", 2, "I",
              ["Zuerst die Stromstärke: $I = \\dfrac{P}{U}$",
               "Dann $P_V = I^2 \\cdot R$"],
              ["$I = \\dfrac{5{,}0 \\cdot 10^6\\,W}{10 \\cdot 10^3\\,V} = 500\\,A$",
               "$P_V = (500\\,A)^2 \\cdot 2{,}5\\,\\Omega = 625\\,kW$"]),
         ZAHL("Berechne die Verlustleistung bei 110 kV in kW.", r(PV110 / 1e3, 2), "kW", 2,
              "II",
              ["Gleicher Weg, andere Spannung.",
               "11-fache Spannung bedeutet 1/11 der Stromstärke und 1/121 der Verluste."],
              ["$I \\approx 45\\,A$, $P_V = I^2 \\cdot R \\approx 5{,}2\\,kW$"], tol=0.03)])

ETA = 5.0 * 1.2 / 7.5
assert abs(ETA - 0.80) < 1e-12
aufgabe("I5-A", "I5", "A", "Ladegerät",
        "Ein Ladegerät nimmt 7,5 W auf und gibt 5,0 V bei 1,2 A ab.",
        [ZAHL("Berechne den Wirkungsgrad in Prozent.", 80.0, "%", 2, "I",
              ["$\\eta = \\dfrac{P_{ab}}{P_{auf}}$, $P_{ab} = U \\cdot I$"],
              ["$P_{ab} = 5{,}0\\,V \\cdot 1{,}2\\,A = 6{,}0\\,W$",
               "$\\eta = \\dfrac{6{,}0\\,W}{7{,}5\\,W} = 80\\,\\%$"]),
         SELBST("Erkläre, wo die fehlende Leistung bleibt und stelle einen Bezug zur "
                "Beobachtung her, dass das Gerät warm wird.", 3, "II",
                ["Ein Teil wird in thermische Energie umgewandelt.",
                 "Ursachen: Widerstand der Wicklungen und Wirbelströme im Eisenkern.",
                 "Diese thermische Energie macht sich als Erwärmung des Gerätes bemerkbar."],
                ["In welche Energieform wird der Rest umgewandelt?",
                 "Wo im Transformator entsteht sie?"],
                ["1,5 W werden in thermische Energie umgewandelt",
                 "Wicklungswiderstand und Wirbelströme", "Erwärmung des Gerätes"])])

aufgabe("I5-Z", "I5", "Z", "Transformator an der Autobatterie",
        "Jemand schließt einen Transformator ($n_1 = 500$, $n_2 = 5000$) an eine 12-V-"
        "Autobatterie an und erwartet sekundär 120 V.",
        [SELBST("Beurteile die Erwartung.", 4, "III",
                ["Die Batterie liefert Gleichspannung, im Betrieb fließt ein konstanter Strom.",
                 "Das Magnetfeld im Eisenkern ist konstant, der Fluss durch die Sekundärspule "
                 "ändert sich nicht.",
                 "Nach dem Induktionsgesetz wird sekundär keine Spannung induziert, nicht "
                 "120 V.",
                 "Nur beim Ein- und Ausschalten ändert sich der Fluss, dann entstehen kurze "
                 "Spannungsstöße."],
                ["Welche Art Spannung liefert eine Batterie?",
                 "Was braucht die Sekundärspule nach dem Induktionsgesetz?",
                 "Gibt es Momente, in denen sich der Fluss doch ändert?"],
                ["Gleichspannung, konstanter Strom", "Fluss konstant",
                 "keine Spannung im Dauerbetrieb", "kurze Stöße beim Schalten"])])

diag("I5", "Warum überträgt man Energie mit Hochspannung?",
     ["kleinere Stromstärke, kleinere Verluste", "Hochspannung ist ungefährlicher",
      "die Leistung wird größer", "der Widerstand der Leitung sinkt"], 0)
diag("I5", "Ein idealer Transformator erhöht die Spannung. Die Leistung …",
     ["bleibt gleich", "steigt", "sinkt auf null", "verdoppelt sich immer"], 0)

# ------------------------------------------------------------------ I6
thema("I6", "Induktion", "Der elektromagnetische Schwingkreis", "Stationsarbeit Station 6",
      ["$T = 2\\pi \\cdot \\sqrt{L \\cdot C}$, auch nach L oder C umstellen",
       "Energie pendelt zwischen elektrischem und magnetischem Feld",
       "Vergleich mit dem Federschwinger"])

T_SK = 2 * PI * math.sqrt(5.0e-3 * 2.2e-6)
assert abs(T_SK - 6.59e-4) < 1e-6
aufgabe("I6-G1", "I6", "G", "Periodendauer eines Schwingkreises",
        "Ein Schwingkreis besteht aus einer Spule mit $L = 5{,}0\\,mH$ und einem Kondensator "
        "mit $C = 2{,}2\\,\\mu F$.",
        [ZAHL("Berechne die Periodendauer in ms.", r(T_SK * 1e3, 2), "ms", 2, "I",
              ["Thomson’sche Gleichung", "$T = 2\\pi \\cdot \\sqrt{L \\cdot C}$ mit "
               "$L = 5{,}0 \\cdot 10^{-3}\\,H$, $C = 2{,}2 \\cdot 10^{-6}\\,F$"],
              ["$T = 2\\pi \\cdot \\sqrt{5{,}0 \\cdot 10^{-3}\\,H \\cdot 2{,}2 \\cdot 10^{-6}\\,F} "
               "\\approx 0{,}66\\,ms$"], tol=0.03),
         ZAHL("Berechne die Frequenz in kHz.", r(1 / T_SK / 1e3, 2), "kHz", 1, "I",
              ["$f = \\dfrac{1}{T}$"], ["$f = \\dfrac{1}{0{,}66\\,ms} \\approx 1{,}5\\,kHz$"],
              tol=0.03)])

C_SK = 1 / (4 * PI ** 2 * 1.0e3 ** 2 * 10e-3)
assert abs(C_SK - 2.53e-6) < 1e-8
aufgabe("I6-G2", "I6", "G", "Kapazität gesucht",
        "Ein Schwingkreis mit einer Spule von $L = 10\\,mH$ soll mit $f = 1{,}0\\,kHz$ "
        "schwingen.",
        [ZAHL("Berechne die nötige Kapazität in µF.", r(C_SK * 1e6, 2), "µF", 3, "II",
              ["Aus f folgt T. Dann $T = 2\\pi\\sqrt{L C}$ nach C umstellen.",
               "Quadrieren: $T^2 = 4\\pi^2 \\cdot L \\cdot C$",
               "$C = \\dfrac{T^2}{4\\pi^2 \\cdot L}$ mit $T = 1{,}0\\,ms$"],
              ["$T = \\dfrac{1}{f} = 1{,}0 \\cdot 10^{-3}\\,s$",
               "$C = \\dfrac{T^2}{4\\pi^2 \\cdot L}$  |  quadriert und umgestellt",
               "$C = \\dfrac{(1{,}0 \\cdot 10^{-3}\\,s)^2}{4\\pi^2 \\cdot 0{,}010\\,H} "
               "\\approx 2{,}5\\,\\mu F$"], tol=0.03),
         WAHL("Die Kapazität wird vervierfacht. Die Frequenz …",
              ["halbiert sich", "viertelt sich", "verdoppelt sich", "bleibt gleich"], [0], 1,
              "II", ["T wächst mit der Wurzel aus C."],
              ["$T \\sim \\sqrt{C}$: vierfache Kapazität, doppelte Periodendauer, halbe "
               "Frequenz."])])

F_MS = 1 / (2 * PI * math.sqrt(1.2e-3 * 10e-9))
D_PROZ = (1 - 1 / math.sqrt(1.02)) * 100
assert abs(F_MS - 45.9e3) < 100 and abs(D_PROZ - 0.985) < 0.01
aufgabe("I6-A", "I6", "A", "Metallsuchgerät",
        "Ein Metallsuchgerät enthält einen Schwingkreis mit $L = 1{,}2\\,mH$ und "
        "$C = 10\\,nF$. Liegt Metall unter dem Suchrahmen, wächst die Induktivität um 2 %.",
        [ZAHL("Berechne die Frequenz ohne Metall in kHz.", r(F_MS / 1e3), "kHz", 2, "II",
              ["$f = \\dfrac{1}{2\\pi\\sqrt{L C}}$", "$1\\,nF = 10^{-9}\\,F$"],
              ["$f = \\dfrac{1}{2\\pi\\sqrt{1{,}2 \\cdot 10^{-3}\\,H \\cdot 10 \\cdot 10^{-9}\\,F}} "
               "\\approx 46\\,kHz$"], tol=0.03),
         ZAHL("Berechne, um wie viel Prozent die Frequenz mit Metall sinkt.", round(D_PROZ, 1),
              "%", 2, "II",
              ["Wie hängt f von L ab?", "$f \\sim \\dfrac{1}{\\sqrt{L}}$: neue Frequenz "
               "$f' = \\dfrac{f}{\\sqrt{1{,}02}}$"],
              ["$\\dfrac{f'}{f} = \\dfrac{1}{\\sqrt{1{,}02}} \\approx 0{,}990$",
               "Die Frequenz sinkt um etwa 1,0 %."], tol=0.08)])

C_AN = 0.50 / (20.0 * 0.50)
assert abs(C_AN - 0.050) < 1e-12
assert abs(2 * PI * math.sqrt(0.50 / 20.0) - 2 * PI * math.sqrt(0.50 * C_AN)) < 1e-12
aufgabe("I6-Z", "I6", "Z", "Federschwinger und Schwingkreis",
        "Ein Federschwinger ($m = 0{,}50\\,kg$, $D = 20\\,\\tfrac{N}{m}$) und ein Schwingkreis "
        "mit $L = 0{,}50\\,H$ sollen dieselbe Periodendauer haben.",
        [ZAHL("Berechne die nötige Kapazität in F.", C_AN, "F", 2, "II",
              ["Setze die beiden Periodendauern gleich.",
               "$2\\pi\\sqrt{\\tfrac{m}{D}} = 2\\pi\\sqrt{L C}$, also "
               "$L \\cdot C = \\dfrac{m}{D}$"],
              ["$C = \\dfrac{m}{D \\cdot L} = \\dfrac{0{,}50\\,kg}{20\\,\\tfrac{N}{m} \\cdot "
               "0{,}50\\,H} = 0{,}050\\,F$"]),
         SELBST("Vergleiche die Energieumwandlungen in beiden Schwingern und gib an, welche "
                "Größen einander entsprechen.", 3, "III",
                ["Federschwinger: potentielle Energie im Umkehrpunkt, kinetische Energie in "
                 "der Ruhelage.",
                 "Schwingkreis: Energie des elektrischen Feldes bei voll geladenem Kondensator, "
                 "Energie des magnetischen Feldes bei größter Stromstärke.",
                 "Entsprechungen begründet: y und Q, v und I, m und L, D und 1/C, Reibung und "
                 "ohmscher Widerstand."],
                ["Wo steckt die Energie in den Umkehrpunkten bzw. bei vollem Kondensator?",
                 "Welche Größe des Schwingkreises verhält sich wie die Geschwindigkeit?"],
                ["Feder: potentiell ↔ kinetisch", "Kreis: elektrisches ↔ magnetisches Feld",
                 "y ↔ Q, v ↔ I, m ↔ L, D ↔ 1/C"])])

diag("I6", "Die Kapazität eines Schwingkreises wird vervierfacht. Die Periodendauer …",
     ["verdoppelt sich", "vervierfacht sich", "halbiert sich", "bleibt gleich"], 0)
diag("I6", "Warum klingt die Schwingung in einem realen Schwingkreis ab?",
     ["Der Widerstand wandelt Energie in thermische Energie um",
      "Die Energie wird vernichtet", "Der Kondensator verliert seine Kapazität",
      "Die Spule wird zum Dauermagneten"], 0)

# ========================================================================
#  SCHWINGUNGEN
# ========================================================================

# ------------------------------------------------------------------ S1
thema("S1", "Schwingungen", "Schwingungen und Kenngrößen", "Decks 11 bis 13",
      ["periodisch und Schwingung unterscheiden, zwei Voraussetzungen",
       "Elongation y, Amplitude $y_{max}$, T und $f = \\dfrac{1}{T}$ aus einem y(t)-Diagramm",
       "harmonisch: Rückstellkraft proportional zur Elongation"])

aufgabe("S1-G1", "S1", "G", "y(t)-Diagramm ablesen",
        "Das Diagramm zeigt die Elongation eines Federschwingers.",
        [ZAHL("Lies die Amplitude in cm ab.", 2.5, "cm", 1, "I",
              ["Die Amplitude ist die größte Elongation, gemessen von der Ruhelage aus."],
              ["$y_{max} = 2{,}5\\,cm$, nicht der Abstand zwischen Berg und Tal"]),
         ZAHL("Lies die Periodendauer in s ab.", 0.80, "s", 1, "I",
              ["Miss den Abstand zwischen zwei gleichen Zuständen, zum Beispiel zwei "
               "Maxima."], ["$T = 0{,}80\\,s$"]),
         ZAHL("Berechne die Frequenz.", 1.25, "Hz", 1, "I", ["$f = \\dfrac{1}{T}$"],
              ["$f = \\dfrac{1}{0{,}80\\,s} = 1{,}25\\,Hz$"])],
        abbildung={"typ": "yt_diagramm", "funktion": "sin", "ymax": 2.5, "T": 0.80,
                   "tmax": 2.0, "einheit_y": "cm", "raster": True})

aufgabe("S1-G2", "S1", "G", "Schwingung oder nur periodisch?",
        "Nicht jede periodische Bewegung ist eine Schwingung.",
        [WAHL("Wähle alle Schwingungen aus.",
              ["Fadenpendel", "Herzschlag", "Erde um die Sonne", "Stimmgabel",
               "prallender Ball", "Boje auf dem Wasser"], [0, 3, 5], 2, "I",
              ["Eine Schwingung ist eine periodische Bewegung um eine stabile "
               "Gleichgewichtslage."],
              ["Schwingungen: Fadenpendel, Stimmgabel, Boje.",
               "Nur periodisch: Herzschlag, Erdumlauf, prallender Ball."], mehrfach=True),
         SELBST("Nenne die zwei Voraussetzungen für eine Schwingung.", 2, "I",
                ["stabile Gleichgewichtslage", "Rückstellkraft zur Ruhelage hin"],
                ["Wohin kehrt ein Schwinger immer wieder zurück?",
                 "Welche Kraft treibt ihn dorthin?"],
                ["stabile Gleichgewichtslage (Ruhelage)",
                 "Rückstellkraft zur Ruhelage hin"])])

aufgabe("S1-A", "S1", "A", "Harmonisch oder nicht?",
        "An einer Feder wird gemessen, welche Kraft man für verschiedene Auslenkungen aus der "
        "Ruhelage braucht: 1,0 cm: 0,40 N · 2,0 cm: 0,80 N · 3,0 cm: 1,20 N.",
        [WAHL("Welcher Zusammenhang liegt vor?",
              ["F ist proportional zu y", "F ist konstant", "F wächst mit y²",
               "F ist umgekehrt proportional zu y"], [0], 1, "II",
              ["Bilde die Quotienten F/y."],
              ["F/y = 40 N/m in allen Zeilen: Die Rückstellkraft ist proportional zur "
               "Elongation."]),
         SELBST("Begründe, ob ein Körper an dieser Feder harmonisch schwingt.", 2, "II",
                ["Rückstellkraft proportional zur Elongation (lineares Kraftgesetz).",
                 "Deshalb ist die Schwingung harmonisch, ihr y(t)-Diagramm ist eine "
                 "Sinuskurve."],
                ["Welche Bedingung muss die Rückstellkraft für eine harmonische Schwingung "
                 "erfüllen?"],
                ["F ~ y", "harmonisch, Sinusverlauf"])])

aufgabe("S1-Z", "S1", "Z", "EKG",
        "Eine Schülerin sagt: „Der Herzschlag ist eine harmonische Schwingung, das sieht man "
        "am EKG.“",
        [SELBST("Nimm Stellung.", 3, "III",
                ["Der Herzschlag ist periodisch.",
                 "Er ist keine Schwingung, weil es keine Bewegung um eine stabile "
                 "Gleichgewichtslage mit Rückstellkraft gibt.",
                 "Die EKG-Kurve ist keine Sinuskurve, also auch nicht harmonisch."],
                ["Prüfe die drei Begriffe periodisch, Schwingung und harmonisch nacheinander."],
                ["periodisch: ja", "Schwingung: nein (keine Ruhelage, keine Rückstellkraft)",
                 "harmonisch: nein (kein Sinusverlauf)"])])

diag("S1", "Die Amplitude ist …", ["die größte Elongation", "der Abstand zwischen Berg und Tal",
                                    "die Zeit für eine Schwingung", "die Elongation bei t = 0"], 0)
diag("S1", "T = 0,25 s. Die Frequenz ist …", ["4,0 Hz", "0,25 Hz", "2,5 Hz", "25 Hz"], 0)

# ------------------------------------------------------------------ S2
thema("S2", "Schwingungen", "Periodendauer des Federschwingers", "Decks 14 und 15",
      ["$T = 2\\pi \\cdot \\sqrt{\\dfrac{m}{D}}$ anwenden und nach m oder D umstellen",
       "T hängt nicht von der Amplitude und nicht von g ab",
       "Zeit für viele Schwingungen messen"])

T_S2 = 2 * PI * math.sqrt(0.250 / 40.0)
assert abs(T_S2 - 0.497) < 0.001
aufgabe("S2-G1", "S2", "G", "Periodendauer berechnen",
        "Ein Körper der Masse 250 g schwingt an einer Feder mit $D = 40\\,\\tfrac{N}{m}$.",
        [ZAHL("Berechne die Periodendauer.", r(T_S2, 2), "s", 2, "I",
              ["$T = 2\\pi \\cdot \\sqrt{\\dfrac{m}{D}}$, Masse in kg"],
              ["$T = 2\\pi \\cdot \\sqrt{\\dfrac{0{,}250\\,kg}{40\\,\\tfrac{N}{m}}} "
               "\\approx 0{,}50\\,s$"], tol=0.03),
         WAHL("Der Körper wird doppelt so weit ausgelenkt. Die Periodendauer …",
              ["bleibt gleich", "verdoppelt sich", "halbiert sich", "wächst um den Faktor √2"],
              [0], 1, "I", ["Kommt die Amplitude in der Gleichung vor?"],
              ["T hängt nur von m und D ab, nicht von der Amplitude."])])

T20 = 14.0 / 20
D_S2 = 4 * PI ** 2 * 0.30 / T20 ** 2
assert abs(D_S2 - 24.2) < 0.05
aufgabe("S2-G2", "S2", "G", "Federhärte aus der Messung",
        "Ein Körper der Masse 300 g schwingt an einer Feder. Für 20 Schwingungen misst man "
        "14,0 s.",
        [ZAHL("Berechne die Federhärte.", r(D_S2), "N/m", 3, "II",
              ["Zuerst T aus der Messung.", "$T = 2\\pi\\sqrt{\\tfrac{m}{D}}$ quadrieren und "
               "nach D umstellen.", "$D = \\dfrac{4\\pi^2 \\cdot m}{T^2}$"],
              ["$T = \\dfrac{14{,}0\\,s}{20} = 0{,}700\\,s$",
               "$D = \\dfrac{4\\pi^2 \\cdot 0{,}300\\,kg}{(0{,}700\\,s)^2} "
               "\\approx 24{,}2\\,\\tfrac{N}{m}$"], tol=0.02),
         ZAHL("Gib ohne neue Rechnung an, welche Masse man für T = 1,4 s braucht.", 1.2, "kg",
              1, "II", ["T wächst mit der Wurzel aus m. Doppelte Periodendauer braucht …"],
              ["Doppelte Periodendauer braucht die vierfache Masse: 1,2 kg"])])

M_ISS = 1800 * 1.30 ** 2 / (4 * PI ** 2)
assert abs(M_ISS - 77.05) < 0.05
aufgabe("S2-A", "S2", "A", "Massebestimmung auf der Raumstation",
        "Auf einer Raumstation wird die Masse eines Astronauten mit einem Federschwinger "
        "bestimmt. Die Federhärte beträgt $1800\\,\\tfrac{N}{m}$, die Periodendauer 1,30 s.",
        [ZAHL("Berechne die Masse.", r(M_ISS), "kg", 2, "II",
              ["$T = 2\\pi\\sqrt{\\tfrac{m}{D}}$ nach m umstellen.",
               "$m = \\dfrac{D \\cdot T^2}{4\\pi^2}$"],
              ["$m = \\dfrac{1800\\,\\tfrac{N}{m} \\cdot (1{,}30\\,s)^2}{4\\pi^2} "
               "\\approx 77\\,kg$"], tol=0.02),
         SELBST("Begründe, warum eine Personenwaage dort nicht funktioniert, der "
                "Federschwinger aber schon.", 2, "II",
                ["Die Personenwaage misst die Gewichtskraft. Auf der Raumstation drückt der "
                 "Astronaut nicht auf die Waage.",
                 "Die Periodendauer hängt nur von m und D ab, nicht von g."],
                ["Was misst eine Personenwaage eigentlich?", "Kommt g in der Gleichung für T "
                 "vor?"],
                ["Waage braucht die Gewichtskraft auf die Unterlage",
                 "T hängt nicht von g ab"])])

T_BUNG = 2 * PI * math.sqrt(0.25 / 9.81)
assert abs(T_BUNG - 1.00) < 0.01
aufgabe("S2-Z", "S2", "Z", "Periodendauer aus der Dehnung",
        "Ein Körper hängt ruhig an einer Feder. Die Feder ist dabei um $s_0$ gedehnt.",
        [SELBST("Zeige, dass $T = 2\\pi \\cdot \\sqrt{\\dfrac{s_0}{g}}$ gilt.", 3, "II",
                ["In der Ruhelage gilt das Kräftegleichgewicht $m \\cdot g = D \\cdot s_0$.",
                 "Umgestellt: $\\dfrac{m}{D} = \\dfrac{s_0}{g}$.",
                 "Eingesetzt in $T = 2\\pi\\sqrt{\\tfrac{m}{D}}$ folgt die Gleichung."],
                ["Welche Kräfte sind in der Ruhelage im Gleichgewicht?",
                 "Forme so um, dass m/D allein steht."],
                ["$m \\cdot g = D \\cdot s_0$  |  Kräftegleichgewicht",
                 "$\\dfrac{m}{D} = \\dfrac{s_0}{g}$  |  umgestellt",
                 "$T = 2\\pi\\sqrt{\\dfrac{s_0}{g}}$  |  eingesetzt"]),
         ZAHL("Berechne T für $s_0 = 25\\,cm$.", r(T_BUNG, 2), "s", 1, "II",
              ["$s_0$ in Meter, $g = 9{,}81\\,\\tfrac{m}{s^2}$"],
              ["$T = 2\\pi\\sqrt{\\dfrac{0{,}25\\,m}{9{,}81\\,\\tfrac{m}{s^2}}} \\approx 1{,}0\\,s$"],
              tol=0.03)])

diag("S2", "Die Masse am Federschwinger wird vervierfacht. T …",
     ["verdoppelt sich", "vervierfacht sich", "bleibt gleich", "halbiert sich"], 0)
diag("S2", "Derselbe Federschwinger auf dem Mond hat …",
     ["dieselbe Periodendauer", "eine größere Periodendauer", "eine kleinere Periodendauer",
      "keine Schwingung"], 0)

# ------------------------------------------------------------------ S3
thema("S3", "Schwingungen", "Energie der Schwingung", "Decks 16 und 17",
      ["$E = \\tfrac{1}{2} \\cdot D \\cdot y_{max}^2$, y zählt ab der Ruhelage",
       "Umkehrpunkt nur potentielle, Ruhelage nur kinetische Energie",
       "$v_{max}$ über die Energie"])

E_S3 = 0.5 * 60 * 0.050 ** 2
V_S3 = math.sqrt(2 * E_S3 / 0.15)
assert abs(E_S3 - 0.075) < 1e-12 and abs(V_S3 - 1.0) < 1e-12
aufgabe("S3-G1", "S3", "G", "Energie und größte Geschwindigkeit",
        "Ein Körper der Masse 150 g schwingt an einer Feder mit $D = 60\\,\\tfrac{N}{m}$ mit "
        "der Amplitude 5,0 cm. Die Reibung ist vernachlässigbar.",
        [ZAHL("Berechne die Energie der Schwingung in J.", E_S3, "J", 1, "I",
              ["$E = \\tfrac{1}{2} \\cdot D \\cdot y_{max}^2$, Amplitude in m"],
              ["$E = \\tfrac{1}{2} \\cdot 60\\,\\tfrac{N}{m} \\cdot (0{,}050\\,m)^2 "
               "= 0{,}075\\,J$"]),
         ZAHL("Berechne die größte Geschwindigkeit.", 1.0, "m/s", 2, "II",
              ["Wo ist die gesamte Energie kinetisch?",
               "$\\tfrac{1}{2} \\cdot m \\cdot v_{max}^2 = E$ nach $v_{max}$ umstellen"],
              ["$v_{max} = \\sqrt{\\dfrac{2E}{m}} = \\sqrt{\\dfrac{2 \\cdot 0{,}075\\,J}"
               "{0{,}15\\,kg}} = 1{,}0\\,\\tfrac{m}{s}$"])])

EK = 0.75 * E_S3
assert abs(EK - 0.05625) < 1e-12
aufgabe("S3-G2", "S3", "G", "Energie bei halber Auslenkung",
        "Der Körper aus Aufgabe S3-G1 ist gerade 2,5 cm aus der Ruhelage ausgelenkt.",
        [ZAHL("Berechne die kinetische Energie in J.", r(EK, 2), "J", 2, "II",
              ["Die potentielle Energie bei y ist $\\tfrac{1}{2} \\cdot D \\cdot y^2$.",
               "Halbe Auslenkung, ein Viertel der potentiellen Energie. Der Rest ist "
               "kinetisch."],
              ["$E_{pot} = \\tfrac{1}{4} \\cdot 0{,}075\\,J \\approx 0{,}019\\,J$",
               "$E_{kin} = \\tfrac{3}{4} \\cdot 0{,}075\\,J \\approx 0{,}056\\,J$"], tol=0.03),
         WAHL("Häufiger Fehler: Welche Antwort entsteht, wenn man E_kin gleich der Hälfte "
              "setzt?", ["0,038 J", "0,056 J", "0,019 J", "0,075 J"], [0], 1, "II",
              ["Die Hälfte von 0,075 J"],
              ["Die Hälfte wäre 0,038 J. Falsch, weil die Energie mit dem Quadrat der "
               "Auslenkung geht."])])

E_PF = 0.5 * 3000 * 0.080 ** 2
V_PF = math.sqrt(2 * E_PF / 30)
assert abs(E_PF - 9.6) < 1e-9 and abs(V_PF - 0.80) < 1e-9
aufgabe("S3-A", "S3", "A", "Federwippe",
        "Ein Kind (30 kg) wippt auf einer Federwippe ($D = 3000\\,\\tfrac{N}{m}$) mit 8,0 cm "
        "Amplitude um die Ruhelage.",
        [ZAHL("Berechne die Energie der Schwingung.", E_PF, "J", 1, "I",
              ["$E = \\tfrac{1}{2} \\cdot D \\cdot y_{max}^2$"],
              ["$E = \\tfrac{1}{2} \\cdot 3000\\,\\tfrac{N}{m} \\cdot (0{,}080\\,m)^2 = 9{,}6\\,J$"]),
         ZAHL("Berechne die größte Geschwindigkeit.", r(V_PF, 2), "m/s", 2, "II",
              ["$v_{max} = \\sqrt{\\dfrac{2E}{m}}$"],
              ["$v_{max} = \\sqrt{\\dfrac{2 \\cdot 9{,}6\\,J}{30\\,kg}} = 0{,}80\\,\\tfrac{m}{s}$"]),
         SELBST("Gib an, wo das Kind am schnellsten ist und wo die Energie ganz potentiell "
                "ist.", 1, "I",
                ["Am schnellsten in der Ruhelage, ganz potentiell in den Umkehrpunkten."],
                ["Wo ist die Elongation null?"],
                ["Ruhelage: v maximal · Umkehrpunkte: nur potentielle Energie"])])

aufgabe("S3-Z", "S3", "Z", "Doppelte Amplitude",
        "Ein Mitschüler behauptet: „Verdoppelt man die Amplitude, verdoppelt sich die Energie "
        "der Schwingung und der Körper braucht für eine Schwingung doppelt so lange.“",
        [SELBST("Beurteile beide Teile der Aussage.", 3, "III",
                ["Die Energie vervierfacht sich, weil $E \\sim y_{max}^2$.",
                 "Die Periodendauer bleibt gleich, weil T nur von m und D abhängt.",
                 "Der doppelte Weg wird mit doppelter größter Geschwindigkeit "
                 "zurückgelegt."],
                ["Wie geht $y_{max}$ in E ein?", "Kommt $y_{max}$ in T vor?",
                 "Wie ändert sich $v_{max}$, wenn E vierfach ist?"],
                ["Energie: falsch, Faktor 4", "Periodendauer: falsch, bleibt gleich",
                 "$v_{max}$ verdoppelt sich"])])

diag("S3", "Wo ist die Geschwindigkeit eines Federschwingers am größten?",
     ["in der Ruhelage", "in den Umkehrpunkten", "auf halbem Weg", "überall gleich"], 0)
diag("S3", "Die Amplitude wird verdoppelt. Die Energie …",
     ["vervierfacht sich", "verdoppelt sich", "bleibt gleich", "halbiert sich"], 0)

# ------------------------------------------------------------------ S4
thema("S4", "Schwingungen", "Das Weg-Zeit-Gesetz", "Deck 18",
      ["$y(t) = y_{max} \\cdot \\sin(\\omega \\cdot t)$ mit $\\omega = \\dfrac{2\\pi}{T}$",
       "vier Startpositionen: sin, cos, −sin, −cos",
       "Taschenrechner im Bogenmaß (RAD)"])

OM4 = 2 * PI / 0.50
Y01 = 4.0 * math.sin(OM4 * 0.10)
assert abs(OM4 - 12.57) < 0.01 and abs(Y01 - 3.80) < 0.01
aufgabe("S4-G1", "S4", "G", "Start in der Ruhelage nach oben",
        "Ein Federschwinger startet in der Ruhelage nach oben (oben positiv). Amplitude "
        "4,0 cm, Periodendauer 0,50 s.",
        [ZAHL("Berechne die Kreisfrequenz.", r(OM4), "1/s", 1, "I",
              ["$\\omega = \\dfrac{2\\pi}{T}$"],
              ["$\\omega = \\dfrac{2\\pi}{0{,}50\\,s} \\approx 12{,}6\\,\\tfrac{1}{s}$"]),
         WAHL("Welches Weg-Zeit-Gesetz gilt?",
              ["$y(t) = 4{,}0\\,cm \\cdot \\sin(12{,}6\\,\\tfrac{1}{s} \\cdot t)$",
               "$y(t) = 4{,}0\\,cm \\cdot \\cos(12{,}6\\,\\tfrac{1}{s} \\cdot t)$",
               "$y(t) = -4{,}0\\,cm \\cdot \\sin(12{,}6\\,\\tfrac{1}{s} \\cdot t)$",
               "$y(t) = 4{,}0\\,cm \\cdot \\sin(0{,}50\\,s \\cdot t)$"], [0], 1, "I",
              ["Start in der Ruhelage nach oben: welche Funktion beginnt bei null und "
               "steigt?"], ["Start Ruhelage nach oben: Sinus mit positiver Amplitude."]),
         ZAHL("Berechne die Elongation nach 0,10 s in cm.", r(Y01), "cm", 2, "II",
              ["Einsetzen, Taschenrechner auf RAD."],
              ["$y = 4{,}0\\,cm \\cdot \\sin(12{,}57 \\cdot 0{,}10) \\approx 3{,}8\\,cm$"],
              tol=0.02)])

aufgabe("S4-G2", "S4", "G", "Startpositionen",
        "Ordne jeder Startposition das passende Weg-Zeit-Gesetz zu (oben positiv).",
        [WAHL("Start im oberen Umkehrpunkt",
              ["$y_{max} \\cdot \\cos(\\omega t)$", "$y_{max} \\cdot \\sin(\\omega t)$",
               "$-y_{max} \\cdot \\cos(\\omega t)$", "$-y_{max} \\cdot \\sin(\\omega t)$"], [0],
              1, "I", ["Welche Funktion hat bei t = 0 ihren größten Wert?"],
              ["cos(0) = 1: Start oben"]),
         WAHL("Start im unteren Umkehrpunkt",
              ["$-y_{max} \\cdot \\cos(\\omega t)$", "$y_{max} \\cdot \\cos(\\omega t)$",
               "$y_{max} \\cdot \\sin(\\omega t)$", "$-y_{max} \\cdot \\sin(\\omega t)$"], [0],
              1, "I", ["Bei t = 0 muss y = −y_max sein."], ["−cos: Start unten"]),
         WAHL("Start in der Ruhelage nach unten",
              ["$-y_{max} \\cdot \\sin(\\omega t)$", "$y_{max} \\cdot \\sin(\\omega t)$",
               "$y_{max} \\cdot \\cos(\\omega t)$", "$-y_{max} \\cdot \\cos(\\omega t)$"], [0],
              1, "I", ["Bei t = 0 ist y = 0, danach wird y negativ."],
              ["−sin: Start in der Ruhelage nach unten"])])

Y015 = 3.0 * math.cos(2 * PI / 0.40 * 0.15)
assert abs(Y015 + 2.12) < 0.01
aufgabe("S4-A", "S4", "A", "Gesetz aus dem Diagramm",
        "Das Diagramm zeigt die Elongation eines Schwingers.",
        [WAHL("Welches Weg-Zeit-Gesetz passt?",
              ["$y(t) = 3{,}0\\,cm \\cdot \\cos(15{,}7\\,\\tfrac{1}{s} \\cdot t)$",
               "$y(t) = 3{,}0\\,cm \\cdot \\sin(15{,}7\\,\\tfrac{1}{s} \\cdot t)$",
               "$y(t) = 3{,}0\\,cm \\cdot \\cos(0{,}40\\,\\tfrac{1}{s} \\cdot t)$",
               "$y(t) = -3{,}0\\,cm \\cdot \\cos(15{,}7\\,\\tfrac{1}{s} \\cdot t)$"], [0], 2,
              "II", ["Wo startet die Kurve?", "Lies T ab und berechne $\\omega$."],
              ["Start im oberen Umkehrpunkt: cos", "T = 0,40 s, "
               "$\\omega = 15{,}7\\,\\tfrac{1}{s}$"]),
         ZAHL("Berechne die Elongation nach 0,15 s in cm.", r(Y015), "cm", 2, "II",
              ["RAD-Modus, Vorzeichen beachten."],
              ["$y = 3{,}0\\,cm \\cdot \\cos(15{,}71 \\cdot 0{,}15) \\approx -2{,}1\\,cm$"],
              tol=0.02)],
        abbildung={"typ": "yt_diagramm", "funktion": "cos", "ymax": 3.0, "T": 0.40,
                   "tmax": 1.0, "einheit_y": "cm", "raster": True})

assert abs(6.0 / 4 - 1.5) < 1e-12
assert abs(2 * PI * math.sqrt(9.0 / 9.81) - 6.0) < 0.05   # 9 m Dehnung passt zu T = 6,0 s
aufgabe("S4-Z", "S4", "Z", "Bungeesprung",
        "Ein Bungeespringer schwingt nach dem ersten Fall näherungsweise harmonisch um seine "
        "Ruhelage. Er startet im unteren Umkehrpunkt, 12 m unter der Ruhelage, die "
        "Periodendauer beträgt 6,0 s.",
        [WAHL("Welches Gesetz beschreibt die Bewegung (oben positiv)?",
              ["$y(t) = -12\\,m \\cdot \\cos(1{,}05\\,\\tfrac{1}{s} \\cdot t)$",
               "$y(t) = 12\\,m \\cdot \\cos(1{,}05\\,\\tfrac{1}{s} \\cdot t)$",
               "$y(t) = -12\\,m \\cdot \\sin(1{,}05\\,\\tfrac{1}{s} \\cdot t)$",
               "$y(t) = 12\\,m \\cdot \\sin(6{,}0\\,\\tfrac{1}{s} \\cdot t)$"], [0], 2, "II",
              ["Start unten.", "$\\omega = \\dfrac{2\\pi}{6{,}0\\,s}$"],
              ["Start im unteren Umkehrpunkt: −cos, $\\omega \\approx 1{,}05\\,\\tfrac{1}{s}$"]),
         ZAHL("Gib an, wann er erstmals durch die Ruhelage geht.", 1.5, "s", 1, "II",
              ["Vom Umkehrpunkt zur Ruhelage ist es eine Viertelperiode."],
              ["$t = \\dfrac{T}{4} = 1{,}5\\,s$"]),
         SELBST("Das Seil ist in der Ruhelage um 9 m gedehnt. Beurteile, ob die Bewegung über "
                "die ganze Periode harmonisch sein kann.", 3, "III",
                ["Oberhalb der ungedehnten Seillänge ist das Seil schlaff, es gibt keine "
                 "Federkraft.",
                 "Mit 12 m Amplitude erreicht der Springer 12 m über der Ruhelage, das sind "
                 "3 m über der ungedehnten Länge.",
                 "Dort wirkt nur die Gewichtskraft, die Rückstellkraft ist nicht proportional "
                 "zur Elongation: nicht harmonisch."],
                ["Wann übt ein Seil eine Kraft aus?",
                 "Wie hoch über der Ruhelage kommt der Springer?"],
                ["Seil schlaff oberhalb der ungedehnten Länge",
                 "12 m > 9 m: Springer kommt in diesen Bereich",
                 "dort kein lineares Kraftgesetz, nicht harmonisch"])])

diag("S4", "Ein Schwinger startet im oberen Umkehrpunkt. Das Gesetz enthält …",
     ["cos", "sin", "−sin", "−cos"], 0)
diag("S4", "T = 2,0 s. Die Kreisfrequenz ist …", ["3,14 1/s", "6,28 1/s", "0,50 1/s",
                                                 "12,6 1/s"], 0)

# ------------------------------------------------------------------ S5
thema("S5", "Schwingungen", "Geschwindigkeit und Beschleunigung", "Deck 19",
      ["$v(t) = y'(t)$ und $a(t) = y''(t)$ (nach t ableiten, Kettenregel)",
       "$v_{max} = y_{max} \\cdot \\omega$, $a_{max} = y_{max} \\cdot \\omega^2$",
       "$a = -\\omega^2 \\cdot y$, a zeigt zur Ruhelage"])

aufgabe("S5-G1", "S5", "G", "Größte Werte",
        "Für einen Schwinger gilt $y(t) = 5{,}0\\,cm \\cdot \\sin(8{,}0\\,\\tfrac{1}{s} \\cdot t)$.",
        [WAHL("Welches v-t-Gesetz gilt?",
              ["$v(t) = 0{,}40\\,\\tfrac{m}{s} \\cdot \\cos(8{,}0\\,\\tfrac{1}{s} \\cdot t)$",
               "$v(t) = 0{,}40\\,\\tfrac{m}{s} \\cdot \\sin(8{,}0\\,\\tfrac{1}{s} \\cdot t)$",
               "$v(t) = -0{,}40\\,\\tfrac{m}{s} \\cdot \\cos(8{,}0\\,\\tfrac{1}{s} \\cdot t)$",
               "$v(t) = 3{,}2\\,\\tfrac{m}{s} \\cdot \\cos(8{,}0\\,\\tfrac{1}{s} \\cdot t)$"], [0],
              1, "I", ["Nach t ableiten, innere Ableitung $\\omega$."],
              ["$v(t) = y_{max} \\cdot \\omega \\cdot \\cos(\\omega t)$, "
               "$0{,}050\\,m \\cdot 8{,}0\\,\\tfrac{1}{s} = 0{,}40\\,\\tfrac{m}{s}$"]),
         ZAHL("Berechne die größte Beschleunigung.", 3.2, "m/s²", 2, "I",
              ["$a_{max} = y_{max} \\cdot \\omega^2$"],
              ["$a_{max} = 0{,}050\\,m \\cdot (8{,}0\\,\\tfrac{1}{s})^2 = 3{,}2\\,\\tfrac{m}{s^2}$"])])

A_Y = -(8.0 ** 2) * 0.020
assert abs(A_Y + 1.28) < 1e-12
aufgabe("S5-G2", "S5", "G", "Beschleunigung und Elongation",
        "Derselbe Schwinger ($\\omega = 8{,}0\\,\\tfrac{1}{s}$) ist gerade 2,0 cm über der "
        "Ruhelage.",
        [ZAHL("Berechne die Beschleunigung (oben positiv).", r(A_Y), "m/s²", 2, "II",
              ["$a = -\\omega^2 \\cdot y$", "y in Meter, Vorzeichen beachten."],
              ["$a = -(8{,}0\\,\\tfrac{1}{s})^2 \\cdot 0{,}020\\,m = -1{,}28\\,\\tfrac{m}{s^2}$",
               "Die Beschleunigung zeigt nach unten, zur Ruhelage."]),
         WAHL("Wo ist die Beschleunigung null?",
              ["in der Ruhelage", "in den Umkehrpunkten", "nirgends", "auf halbem Weg"], [0],
              1, "I", ["$a = -\\omega^2 \\cdot y$ bei y = 0?"],
              ["In der Ruhelage ist y = 0, also a = 0. Dort ist v am größten."])])

OM5 = 2 * PI / 0.80
VMAX5 = 0.015 * OM5
AMAX5 = 0.015 * OM5 ** 2
assert abs(VMAX5 - 0.118) < 0.001 and abs(AMAX5 - 0.925) < 0.001
aufgabe("S5-A", "S5", "A", "Seismometer",
        "Ein Seismometer zeichnet eine harmonische Bodenschwingung mit der Amplitude 1,5 cm und "
        "der Periodendauer 0,80 s auf.",
        [ZAHL("Berechne die größte Geschwindigkeit des Bodens.", r(VMAX5, 2), "m/s", 2, "II",
              ["Zuerst $\\omega$, dann $v_{max} = y_{max} \\cdot \\omega$."],
              ["$\\omega = \\dfrac{2\\pi}{0{,}80\\,s} \\approx 7{,}85\\,\\tfrac{1}{s}$",
               "$v_{max} = 0{,}015\\,m \\cdot 7{,}85\\,\\tfrac{1}{s} \\approx 0{,}12\\,\\tfrac{m}{s}$"],
              tol=0.03),
         ZAHL("Berechne die größte Beschleunigung.", r(AMAX5, 2), "m/s²", 2, "II",
              ["$a_{max} = y_{max} \\cdot \\omega^2$"],
              ["$a_{max} = 0{,}015\\,m \\cdot (7{,}85\\,\\tfrac{1}{s})^2 "
               "\\approx 0{,}93\\,\\tfrac{m}{s^2}$"], tol=0.03)])

aufgabe("S5-Z", "S5", "Z", "Seismometer mit Induktion",
        "Im Seismometer schwingt ein Magnet in einer Spule. Die induzierte Spannung wird "
        "aufgezeichnet.",
        [SELBST("Ein Schüler sagt: „Die Spannung ist am größten, wenn der Magnet am weitesten "
                "ausgelenkt ist.“ Beurteile die Aussage.", 4, "III",
                ["Die Spannung hängt von der Änderungsrate des Flusses ab.",
                 "Die Flussänderung ist umso schneller, je größer die Geschwindigkeit des "
                 "Magneten ist: U folgt v(t).",
                 "Im Umkehrpunkt ist v = 0, die Spannung ist dort null.",
                 "Am größten ist sie beim Durchgang durch die Ruhelage. Die Aussage ist "
                 "falsch."],
                ["Wovon hängt die induzierte Spannung ab?",
                 "Wann ändert sich der Fluss am schnellsten?",
                 "Wo ist der Magnet am schnellsten?"],
                ["$U \\sim \\Phi'$", "Φ ändert sich am schnellsten bei größtem v",
                 "Umkehrpunkt: v = 0, U = 0", "Ruhelage: U maximal, Aussage falsch"])])

diag("S5", "Wo ist die Geschwindigkeit null?", ["in den Umkehrpunkten", "in der Ruhelage",
                                                "nirgends", "überall"], 0)
diag("S5", "$a_{max}$ eines harmonischen Schwingers ist …",
     ["$y_{max} \\cdot \\omega^2$", "$y_{max} \\cdot \\omega$", "$\\omega^2$",
      "$y_{max} / \\omega$"], 0)

# ------------------------------------------------------------------ S6
thema("S6", "Schwingungen", "Gedämpfte Schwingung", "Deck 20",
      ["Amplitude nimmt ab, Periodendauer bleibt",
       "Einhüllende verrät die Bremskraft: konstant, ~ v, ~ v²",
       "Schwingfall, aperiodischer Grenzfall, Kriechfall",
       "Energie in thermische Energie umgewandelt"])

aufgabe("S6-G1", "S6", "G", "Gedämpfte Schwingung erkennen",
        "Das Diagramm zeigt eine gedämpfte Schwingung.",
        [WAHL("Welche Aussage ist richtig?",
              ["Die Amplitude nimmt ab, die Periodendauer bleibt gleich.",
               "Die Periodendauer nimmt ab, die Amplitude bleibt gleich.",
               "Beide nehmen ab.", "Beide bleiben gleich."], [0], 1, "I",
              ["Vergleiche die Abstände der Nulldurchgänge."],
              ["Die Ausschläge werden kleiner, die Nulldurchgänge haben gleichen Abstand. "
               "$T = 2\\pi\\sqrt{\\tfrac{m}{D}}$ hängt nicht von der Amplitude ab."]),
         ZAHL("Die Amplitude halbiert sich. Wie viel Prozent der Energie sind noch "
              "vorhanden?", 25.0, "%", 2, "II",
              ["$E \\sim y_{max}^2$"],
              ["$(\\tfrac{1}{2})^2 = \\tfrac{1}{4}$: 25 % der Energie",
               "75 % wurden in thermische Energie umgewandelt."])],
        abbildung={"typ": "gedaempft", "bremskraft": "v", "ymax": 2.0, "T": 1.0,
                   "tmax": 8.0, "einhuellende": False})

aufgabe("S6-G2", "S6", "G", "Einhüllende deuten",
        "Ordne der Form der Einhüllenden die Art der Bremskraft zu.",
        [WAHL("Einhüllende ist eine Gerade",
              ["Bremskraft konstant", "Bremskraft ~ v", "Bremskraft ~ v²"], [0], 1, "II",
              ["Nimmt die Amplitude je Periode um den gleichen Betrag ab?"], ["Gerade: konstante Bremskraft "
                                                         "(Gleitreibung)"]),
         WAHL("Einhüllende wird immer flacher, gleicher Bruchteil je Periode",
              ["Bremskraft ~ v", "Bremskraft konstant", "Bremskraft ~ v²"], [0], 1, "II",
              ["Große Amplitude, große Geschwindigkeit, starke Bremsung."],
              ["Bremskraft ~ v (Öldämpfer, Wirbelstrom)"]),
         WAHL("Bei großer Amplitude nimmt sie je Periode um einen großen Bruchteil ab, bei "
              "kleiner Amplitude nur noch um einen sehr kleinen Bruchteil",
              ["Bremskraft ~ v²", "Bremskraft ~ v", "Bremskraft konstant"], [0], 1, "II",
              ["Bei kleinem v bremst diese Kraft kaum noch."],
              ["Bremskraft ~ v² (Luftwiderstand)"])],
        abbildung={"typ": "einhuellende_drei", "reihenfolge": ["konst", "v", "v2"]})

aufgabe("S6-A", "S6", "A", "Stoßdämpfer",
        "Ein Auto fährt über eine Bodenwelle.",
        [WAHL("Welcher Dämpfungsfall ist für den Stoßdämpfer erwünscht?",
              ["aperiodischer Grenzfall", "Schwingfall", "Kriechfall",
               "ungedämpfte Schwingung"], [0], 1, "I",
              ["Das Auto soll schnell und ohne Nachschaukeln ruhig liegen."],
              ["Aperiodischer Grenzfall: schnellste Rückkehr ohne Überschwingen."]),
         SELBST("Beschreibe, woran man bei einem verschlissenen und bei einem zu harten "
                "Dämpfer erkennt, dass er nicht passt.", 2, "II",
                ["verschlissen (zu schwach): Schwingfall, die Karosserie schwingt über die "
                 "Ruhelage hinaus",
                 "zu hart: Kriechfall, die Karosserie kehrt nur langsam in die Ruhelage "
                 "zurück"],
                ["Welche zwei Merkmale unterscheiden die Dämpfungsfälle?"],
                ["verschlissen: Überschwingen (Schwingfall)",
                 "zu hart: langsame Rückkehr ohne Überschwingen (Kriechfall)"])])

aufgabe("S6-Z", "S6", "Z", "Ausschwingende Schaukel",
        "Eine Schaukel schwingt mit 12 cm Amplitude aus. Nach 8,0 s beträgt die Amplitude "
        "noch 6,0 cm.",
        [ZAHL("Die Bremskraft ist ~ v. Gib an, nach welcher Zeit die Amplitude 3,0 cm "
              "beträgt.", 16.0, "s", 2, "II",
              ["Bei Bremskraft ~ v nimmt die Amplitude in gleichen Zeiten um den gleichen "
               "Bruchteil ab."],
              ["In 8,0 s halbiert sich die Amplitude: 12 cm → 6,0 cm → 3,0 cm nach 16 s"]),
         ZAHL("Die Bremskraft ist konstant (gleiche Abnahme je Zeit). Gib an, nach welcher "
              "Zeit die Amplitude 3,0 cm beträgt.", 12.0, "s", 2, "II",
              ["Bei konstanter Bremskraft nimmt die Amplitude in gleichen Zeiten um den "
               "gleichen Betrag ab."],
              ["6,0 cm in 8,0 s, also 0,75 cm je Sekunde",
               "9,0 cm Abnahme brauchen 12 s"])])

diag("S6", "Bei einer schwach gedämpften Schwingung bleibt gleich:",
     ["die Periodendauer", "die Amplitude", "die Energie", "die größte Geschwindigkeit"], 0)
diag("S6", "Welcher Fall erreicht die Ruhelage am schnellsten ohne Überschwingen?",
     ["aperiodischer Grenzfall", "Kriechfall", "Schwingfall", "ungedämpfte Schwingung"], 0)

# ------------------------------------------------------------------ S7
thema("S7", "Schwingungen", "Erzwungene Schwingung und Resonanz", "Deck 21",
      ["Eigenfrequenz $f_0$ und Erregerfrequenz unterscheiden",
       "Erregerfrequenz kleiner, größer oder gleich $f_0$",
       "Resonanz: Energiezufuhr in jeder Periode, Dämpfung begrenzt die Amplitude",
       "Gefahren beurteilen und Schutzmaßnahmen begründen"])

aufgabe("S7-G1", "S7", "G", "Begriffe",
        "Ein Federschwinger wird am oberen Federende periodisch von einer Hand bewegt.",
        [WAHL("Mit welcher Frequenz schwingt der Körper nach dem Einschwingen?",
              ["mit der Erregerfrequenz", "mit seiner Eigenfrequenz",
               "mit der Summe beider", "gar nicht"], [0], 1, "I",
              ["Wer gibt bei der erzwungenen Schwingung die Frequenz vor?"],
              ["Erzwungene Schwingung: Der Schwinger schwingt mit der Erregerfrequenz."]),
         WAHL("Die Erregerfrequenz ist deutlich größer als $f_0$. Der Körper schwingt …",
              ["gegenphasig mit sehr kleiner Amplitude",
               "gleichphasig mit etwa der Amplitude der Hand",
               "mit wachsender Amplitude", "mit seiner Eigenfrequenz"], [0], 1, "I",
              ["Kann der träge Körper einer schnellen Anregung folgen?"],
              ["Erregerfrequenz > f₀: gegenphasig, sehr kleine Amplitude"]),
         WAHL("Die Erregerfrequenz ist deutlich kleiner als $f_0$. Der Körper schwingt …",
              ["gleichphasig mit etwa der Amplitude der Hand",
               "gegenphasig mit sehr kleiner Amplitude",
               "mit wachsender Amplitude", "gar nicht"], [0], 1, "I",
              ["Bei langsamer Anregung bewegt sich der Körper mit der Hand mit."],
              ["Erregerfrequenz < f₀: gleichphasig, etwa Erregeramplitude"])])

F0_7 = 1 / (2 * PI) * math.sqrt(16 / 0.40)
assert abs(F0_7 - 1.007) < 0.001
aufgabe("S7-G2", "S7", "G", "Eigenfrequenz",
        "Ein Körper der Masse 400 g hängt an einer Feder mit $D = 16\\,\\tfrac{N}{m}$.",
        [ZAHL("Berechne die Eigenfrequenz.", r(F0_7, 2), "Hz", 2, "I",
              ["$f_0 = \\dfrac{1}{T} = \\dfrac{1}{2\\pi} \\cdot \\sqrt{\\dfrac{D}{m}}$"],
              ["$f_0 = \\dfrac{1}{2\\pi} \\cdot \\sqrt{\\dfrac{16\\,\\tfrac{N}{m}}{0{,}40\\,kg}} "
               "\\approx 1{,}0\\,Hz$"], tol=0.03),
         SELBST("Begründe, warum die Amplitude bei Anregung mit 1,0 Hz wächst.", 2, "II",
                ["Erregerfrequenz gleich Eigenfrequenz: Resonanz.",
                 "Die Kraft der Hand zeigt in jeder Periode in Bewegungsrichtung, es wird in "
                 "jeder Periode Energie zugeführt."],
                ["Welche Bedingung liegt bei 1,0 Hz vor?",
                 "Was bedeutet das für die Energie?"],
                ["Resonanz", "Energiezufuhr in jeder Periode, $E \\sim y_{max}^2$ wächst"])])

F0_W = 1 / (2 * PI) * math.sqrt(3.0e4 / 30)
assert abs(F0_W * 60 - 302) < 1
aufgabe("S7-A", "S7", "A", "Waschmaschine",
        "In einer Waschmaschine ist die Trommeleinheit (30 kg) federnd aufgehängt, die "
        "Federhärte beträgt insgesamt $3{,}0 \\cdot 10^4\\,\\tfrac{N}{m}$. Beim Hochfahren des "
        "Schleudergangs rüttelt die Maschine bei einer bestimmten Drehzahl heftig, danach läuft "
        "sie wieder ruhig.",
        [SELBST("Erkläre das Rütteln.", 2, "II",
                ["Die Unwucht der Wäsche regt die Trommeleinheit mit der Drehfrequenz an.",
                 "Beim Hochfahren erreicht die Drehfrequenz einmal die Eigenfrequenz: "
                 "Resonanz, große Amplitude. Danach ist die Erregerfrequenz größer als f₀."],
                ["Was ist hier der Erreger, was der Schwinger?",
                 "Welche Frequenzen durchläuft die Trommel beim Hochfahren?"],
                ["Unwucht als Erreger mit der Drehfrequenz",
                 "Drehfrequenz = Eigenfrequenz: Resonanz"]),
         ZAHL("Berechne die Drehzahl (Umdrehungen je Minute), bei der die Maschine am stärksten "
              "rüttelt.", 300.0, "1/min", 2, "II",
              ["Zuerst die Eigenfrequenz in Hz.", "Hz bedeutet je Sekunde. Mit 60 "
               "multiplizieren."],
              ["$f_0 = \\dfrac{1}{2\\pi}\\sqrt{\\dfrac{3{,}0 \\cdot 10^4\\,\\tfrac{N}{m}}{30\\,kg}} "
               "\\approx 5{,}0\\,Hz$", "$5{,}0\\,Hz \\cdot 60 \\approx 300$ Umdrehungen je "
               "Minute"], tol=0.03),
         SELBST("Jemand schlägt vor, die Trommeleinheit schwerer zu bauen. Beurteile den "
                "Vorschlag.", 2, "III",
                ["Mehr Masse senkt die Eigenfrequenz, beim Hochfahren wird die Resonanz "
                 "trotzdem durchfahren.",
                 "Bei gleicher Unwucht wird die Amplitude etwas kleiner. Verhindert wird das "
                 "Rütteln aber nur durch stärkere Dämpfung, die mehr Energie in thermische "
                 "Energie umwandelt."],
                ["Wie hängt f₀ von m ab?", "Wird die neue Eigenfrequenz beim Hochfahren "
                 "auch erreicht?"],
                ["f₀ sinkt, Resonanz wird verschoben, nicht vermieden",
                 "größere Masse: etwas kleinere Amplitude, Dämpfer begrenzen sie wirksam"])])

aufgabe("S7-Z", "S7", "Z", "Tacoma-Narrows-Brücke",
        "Über den Einsturz der Tacoma-Narrows-Brücke 1940 liest man oft: „Der Wind hat genau "
        "die Eigenfrequenz der Brücke getroffen.“",
        [SELBST("Beurteile diese Erklärung und erkläre den Einsturz mit einer Energiebilanz.",
                4, "III",
                ["Ein gleichmäßiger Wind hat keine Frequenz, die eine Eigenfrequenz treffen "
                 "könnte. Die Erklärung ist so nicht haltbar.",
                 "Die Fahrbahn verdrehte sich mit ihrer Eigenfrequenz, die Drehung änderte "
                 "die Luftkräfte mit derselben Frequenz: Die Brücke regte sich selbst an.",
                 "In jeder Periode wurde mehr Energie zugeführt, als die Dämpfung in "
                 "thermische Energie umwandeln konnte.",
                 "Die Amplitude wuchs bis zum Bruch: Resonanzkatastrophe."],
                ["Hat ein gleichmäßiger Wind eine Frequenz?",
                 "Woher kam die periodische Anregung?",
                 "Vergleiche Energiezufuhr und Umwandlung je Periode."],
                ["gleichmäßiger Wind: keine Erregerfrequenz",
                 "Selbstanregung mit der Eigenfrequenz",
                 "Zufuhr je Periode größer als Umwandlung", "Amplitude wächst bis zum Bruch"]),
         SELBST("Nenne zwei Schutzmaßnahmen für eine neue Brücke und begründe, an welcher "
                "Stelle der Energiebilanz sie ansetzen.", 2, "II",
                ["Dämpfer einbauen: mehr Umwandlung in thermische Energie.",
                 "Steifer oder mit offener Fahrbahn bauen: Eigenfrequenz verschieben bzw. "
                 "Anregung durch die Luft verringern."],
                ["Welche Größen bestimmen, ob die Amplitude wächst?"],
                ["Dämpfung erhöhen", "Eigenfrequenz verschieben oder Anregung vermeiden"])])

diag("S7", "Resonanz liegt vor, wenn …",
     ["die Erregerfrequenz gleich der Eigenfrequenz ist", "die Erregerfrequenz sehr klein ist",
      "der Schwinger nicht angetrieben wird", "die Dämpfung sehr groß ist"], 0)
diag("S7", "Was begrenzt die Amplitude in der Resonanz?",
     ["die Dämpfung", "die Masse allein", "die Erregerfrequenz", "nichts"], 0)


# ========================================================================
#  Prüfung und Ausgabe
# ========================================================================
def statistik():
    be = {"I": 0, "II": 0, "III": 0}
    for a in AUFGABEN:
        for t in a["teile"]:
            be[t["afb"]] += t["be"]
    s = sum(be.values())
    return be, s


if __name__ == "__main__":
    ids = [a["id"] for a in AUFGABEN]
    assert len(ids) == len(set(ids))
    for a in AUFGABEN:
        assert a["thema"] in {t["id"] for t in THEMEN}
        for t in a["teile"]:
            p = t["pruefung"]
            assert t["hilfen"] and t["loesung"], a["id"]
            if p["typ"] == "auswahl":
                assert all(0 <= i < len(p["optionen"]) for i in p["richtig"])
            text = " ".join([a["kontext"], a["titel"], t["text"]] + t["hilfen"] + t["loesung"]
                            + p.get("kriterien", []) + p.get("optionen", []))
            for verboten in ("Takt", "innere Energie", "Energieverlust", ";", " – ", "ŷ",
                             ", und "):
                assert verboten not in text, (a["id"], verboten)
    rest = " ".join([str(x) for d in DIAGNOSE for x in [d["frage"]] + d["optionen"]]
                    + [c for t in THEMEN for c in t["checkliste"] + [t["titel"]]])
    for verboten in ("Takt", "innere Energie", "Energieverlust", ";", " – ", "ŷ", ", und "):
        assert verboten not in rest, verboten
    be, s = statistik()
    print("Themen:", len(THEMEN), "Aufgaben:", len(AUFGABEN), "Teile:",
          sum(len(a["teile"]) for a in AUFGABEN), "BE:", s)
    print("AFB:", {k: "%d BE (%.0f %%)" % (v, 100 * v / s) for k, v in be.items()})
    print("Diagnosefragen:", len(DIAGNOSE))
    daten = {"meta": {"titel": "Lerntheke Klausur", "kurs": "Physik GK 12",
                      "klausur": "Mi 04.11.2026, 90 min, Induktion und mechanische Schwingungen",
                      "stand": "2026-10-10", "tempo_min_je_be": 2.2},
             "themen": THEMEN, "aufgaben": AUFGABEN, "diagnose": DIAGNOSE}
    with open("aufgaben.json", "w", encoding="utf8") as f:
        json.dump(daten, f, ensure_ascii=False, indent=1)
    print("aufgaben.json geschrieben")
