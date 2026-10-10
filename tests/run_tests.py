"""Tests der Lerntheke im Browser (Playwright für Python).

Einrichtung einmalig:   pip install playwright
Ausführen im Projektordner:   python3 tests/run_tests.py
Optional mit Screenshots:     python3 tests/run_tests.py --screenshots

Genutzt wird das installierte Google Chrome. Ohne Chrome vorher `playwright install chromium`
ausführen und den Schalter --chromium angeben.
"""
import functools
import http.server
import json
import re
import socketserver
import sys
import threading
from pathlib import Path

from playwright.sync_api import sync_playwright, expect

WURZEL = Path(__file__).resolve().parent.parent
BILDER = WURZEL / "tests" / "screenshots"
DATEN = json.loads((WURZEL / "aufgaben.json").read_text(encoding="utf8"))
HANDY = {"width": 360, "height": 780}
TABLET = {"width": 1180, "height": 820}
VERBOTEN = [(" – ", "Gedankenstrich"), (" — ", "Gedankenstrich"), (";", "Semikolon"),
            (", und ", "Komma vor und"), (re.compile(r"\bTakt"), "Takt")]

fehler = []
bestanden = 0
gesehene_texte = {}


def pruefe(name, bedingung, info=""):
    global bestanden
    if bedingung:
        bestanden += 1
    else:
        fehler.append(f"{name} {info}".strip())
        print("FEHLER:", name, info)


def starte_server():
    class Leise(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a):
            pass
    handler = functools.partial(Leise, directory=str(WURZEL))
    server = socketserver.ThreadingTCPServer(("127.0.0.1", 0), handler)
    server.daemon_threads = True
    threading.Thread(target=server.serve_forever, daemon=True).start()
    return server, f"http://127.0.0.1:{server.server_address[1]}/"


def deutsch(x):
    return repr(x).replace(".", ",")


def merke_text(seite, name):
    text = seite.evaluate("""() => {
        const k = document.querySelector('main').cloneNode(true);
        k.querySelectorAll('.katex-mathml, textarea').forEach(e => e.remove());
        return k.innerText + ' ' + document.querySelector('header').innerText;
    }""")
    gesehene_texte[name] = text


def keine_katex_fehler(seite, name):
    n = seite.locator(".katex-error").count()
    pruefe(f"KaTeX ohne Fehler: {name}", n == 0, f"{n} Fehler")


def kein_quer_scrollen(seite, name):
    breite = seite.evaluate("document.documentElement.scrollWidth")
    sicht = seite.evaluate("window.innerWidth")
    pruefe(f"kein waagerechtes Scrollen: {name}", breite <= sicht, f"{breite} > {sicht}")


def zustand(seite):
    return seite.evaluate("JSON.parse(localStorage.getItem('lerntheke-gk12') || '{}')")


def beantworte_teil(seite, aid, teil, sicher=True):
    k = f"{aid}/{teil['id']}"
    karte = seite.locator(f'section.teil[data-teil="{k}"]')
    p = teil["pruefung"]
    if p["typ"] == "zahl":
        karte.locator("input.zahlfeld").fill(deutsch(p["wert"]))
        karte.locator('[data-aktion="pruefen"]').click()
    elif p["typ"] == "auswahl":
        for i in p["richtig"]:
            karte.locator(f'input[data-index="{i}"]').check()
        karte.locator('[data-aktion="pruefen"]').click()
    else:
        karte.locator('[data-aktion="kriterien"]').click()
        karte = seite.locator(f'section.teil[data-teil="{k}"]')
        for box in karte.locator("input[data-kriterium]").all():
            box.check()
        karte.locator('[data-aktion="bewerten"]').click()
    if sicher:
        ok = seite.locator(f'section.teil[data-teil="{k}"] .rueckmeldung.ok')
        try:
            ok.wait_for(timeout=3000)
            pruefe(f"richtig gewertet {k}", True)
        except Exception:
            text = seite.locator(f'section.teil[data-teil="{k}"] .rueckmeldung').all_inner_texts()
            pruefe(f"richtig gewertet {k}", False, str(text))


def test_unit(kontext, basis):
    seite = kontext.new_page()
    seite.goto(basis + "tests/unit.html")
    seite.wait_for_function("document.getElementById('ausgabe').textContent.includes('Unit-Tests:')", timeout=30000)
    text = seite.locator("#ausgabe").inner_text()
    zeile = [z for z in text.splitlines() if z.startswith("Unit-Tests:")][-1]
    print(zeile)
    for z in text.splitlines():
        if z.startswith("FEHLER"):
            print(" ", z)
    pruefe("Unit-Tests", "0 fehlgeschlagen" in zeile, zeile)
    seite.close()


def test_fehlerhafte_json(kontext, basis):
    seite = kontext.new_page()
    kaputt = json.loads(json.dumps(DATEN))
    kaputt["aufgaben"][1]["id"] = kaputt["aufgaben"][0]["id"]
    seite.route("**/aufgaben.json", lambda r: r.fulfill(status=200, content_type="application/json",
                                                       body=json.dumps(kaputt)))
    seite.goto(basis)
    seite.locator(".fehlerseite").wait_for(timeout=5000)
    pruefe("Fehlermeldung bei doppelter ID", "doppelt" in seite.locator(".fehlerseite").inner_text())
    seite.unroute("**/aufgaben.json")
    seite.route("**/aufgaben.json", lambda r: r.fulfill(status=200, content_type="application/json", body="{kein json"))
    seite.reload()
    seite.locator(".fehlerseite").wait_for(timeout=5000)
    pruefe("Fehlermeldung bei kaputtem JSON", seite.locator(".fehlerseite").is_visible())
    seite.close()


def test_alle_aufgaben(kontext, basis):
    seite = kontext.new_page()
    seite.set_viewport_size(HANDY)
    seite.goto(basis)
    seite.evaluate("localStorage.setItem('lerntheke-gk12-lehrer', JSON.stringify({zSperreAus: true}))")
    for a in DATEN["aufgaben"]:
        seite.goto(f"{basis}#/aufgabe/{a['id']}")
        seite.locator(f'article.aufgabe[data-aufgabe="{a["id"]}"]').wait_for(timeout=5000)
        if a["abbildung"]:
            fig = seite.locator("figure.abbildung svg, figure.abbildung .skizze-text").first
            box = fig.bounding_box()
            pruefe(f"Abbildung sichtbar {a['id']}", fig.is_visible() and box and box["width"] > 100 and box["height"] > 60)
            pruefe(f"Abbildung als Zeichnung {a['id']}", seite.locator("figure.abbildung svg").count() > 0)
        keine_katex_fehler(seite, a["id"])
        kein_quer_scrollen(seite, a["id"])
        merke_text(seite, a["id"])
        for t in a["teile"]:
            beantworte_teil(seite, a["id"], t)
        keine_katex_fehler(seite, a["id"] + " mit Lösungen")
        kein_quer_scrollen(seite, a["id"] + " mit Lösungen")
        merke_text(seite, a["id"] + " gelöst")
        pruefe(f"Abschluss angezeigt {a['id']}", seite.locator(".abschluss").count() == 1)
    z = zustand(seite)
    for a in DATEN["aufgaben"]:
        for t in a["teile"]:
            st = z["teile"].get(f"{a['id']}/{t['id']}", {})
            pruefe(f"volle BE {a['id']}{t['id']}", st.get("r") == t["be"] and st.get("d"), str(st))
    for weg in ["#/", "#/themen", "#/thema/I1", "#/uebersicht", "#/sichern", "#/laden"]:
        seite.goto(basis + weg)
        seite.wait_for_timeout(300)
        kein_quer_scrollen(seite, weg)
        keine_katex_fehler(seite, weg)
        merke_text(seite, weg)
    seite.close()


def test_rueckmeldung(kontext, basis):
    seite = kontext.new_page()
    seite.goto(basis + "#/aufgabe/I1-G1")
    karte = lambda: seite.locator('section.teil[data-teil="I1-G1/a"]')
    pruefe("Lösung zeigen anfangs gesperrt", karte().locator('[data-aktion="loesung"]').is_disabled())
    karte().locator("input.zahlfeld").fill("3,0")
    karte().locator('[data-aktion="pruefen"]').click()
    text = karte().locator(".rueckmeldung").inner_text()
    pruefe("erster Fehlversuch: Noch nicht richtig", "Noch nicht richtig" in text, text)
    pruefe("Hinweis Einheitenumrechnung", "Einheitenumrechnung" in text, text)
    pruefe("erster Fehlversuch zeigt keine Hilfe automatisch", karte().locator(".hilfe").count() == 0)
    pruefe("Lösung zeigen nach Prüfversuch aktiv", karte().locator('[data-aktion="loesung"]').is_enabled())
    karte().locator("input.zahlfeld").fill("0,5")
    karte().locator('[data-aktion="pruefen"]').click()
    pruefe("zweiter Fehlversuch zeigt Hilfe 1", karte().locator(".hilfe").count() == 1)
    pruefe("Hilfe 3 noch gesperrt", karte().locator('[data-aktion="hilfe"]').last.is_disabled())
    karte().locator('[data-aktion="hilfe"]').first.click()
    pruefe("Hilfe 2 erscheint nach Klick", karte().locator(".hilfe").count() == 2)
    karte().locator("input.zahlfeld").fill("0,30")
    karte().locator('[data-aktion="pruefen"]').click()
    st = zustand(seite)["teile"]["I1-G1/a"]
    pruefe("richtig nach Hilfen gibt BE", st["r"] == 2 and st["h"] == 2, str(st))
    # Vorzeichen
    seite.goto(basis + "#/aufgabe/I2-G1")
    k = lambda: seite.locator('section.teil[data-teil="I2-G1/a"]')
    k().locator("input.zahlfeld").fill("0,18")
    k().locator('[data-aktion="pruefen"]').click()
    text = k().locator(".rueckmeldung").inner_text()
    pruefe("betrag_ok zählt und erklärt", "Richtig" in text and "Minuszeichen" in text, text)
    # Lösung zeigen gibt 0 BE
    seite.goto(basis + "#/aufgabe/S5-G2")
    k = lambda: seite.locator('section.teil[data-teil="S5-G2/a"]')
    k().locator("input.zahlfeld").fill("1,28")
    k().locator('[data-aktion="pruefen"]').click()
    pruefe("streng: Vorzeichen falsch", "Prüfe das Vorzeichen" in k().locator(".rueckmeldung").inner_text())
    k().locator('[data-aktion="loesung"]').click()
    st = zustand(seite)["teile"]["S5-G2/a"]
    pruefe("Lösung angesehen: 0 BE", st["r"] == 0 and st["l"] and st["d"], str(st))
    pruefe("nächste Teilaufgabe erscheint", seite.locator('section.teil[data-teil="S5-G2/b"]').count() == 1)
    # Winkelmodus
    seite.goto(basis + "#/aufgabe/S4-G1")
    beantworte_teil(seite, "S4-G1", DATEN["aufgaben"][[a["id"] for a in DATEN["aufgaben"]].index("S4-G1")]["teile"][0])
    beantworte_teil(seite, "S4-G1", DATEN["aufgaben"][[a["id"] for a in DATEN["aufgaben"]].index("S4-G1")]["teile"][1])
    k = lambda: seite.locator('section.teil[data-teil="S4-G1/c"]')
    k().locator("input.zahlfeld").fill("0,0877")
    k().locator('[data-aktion="pruefen"]').click()
    pruefe("Hinweis RAD", "RAD" in k().locator(".rueckmeldung").inner_text())
    seite.close()


def test_z_sperre(kontext, basis):
    seite = kontext.new_page()
    seite.goto(basis + "#/aufgabe/I1-Z")
    pruefe("Z gesperrt", seite.locator(".sperrhinweis").count() == 1)
    teile = {}
    for a in DATEN["aufgaben"]:
        if a["thema"] == "I1" and a["stufe"] != "Z":
            for t in a["teile"]:
                teile[f"{a['id']}/{t['id']}"] = {"r": 0, "h": 0, "v": 0, "l": True, "d": True, "ok": False}
    seite.evaluate("t => localStorage.setItem('lerntheke-gk12', JSON.stringify({version: 1, teile: t, diagnose: null, klausur: null, klausurVerlauf: []}))", teile)
    seite.reload()
    seite.locator("article.aufgabe").wait_for(timeout=5000)
    pruefe("Z frei nach G und A", seite.locator(".sperrhinweis").count() == 0)
    seite.goto(basis + "#/aufgabe/I2-Z")
    pruefe("Z anderer Themen bleibt gesperrt", seite.locator(".sperrhinweis").count() == 1)
    seite.close()


def test_diagnose(kontext, basis, bilder=False):
    seite = kontext.new_page()
    seite.goto(basis)
    seite.get_by_role("button", name="Diagnose starten").click()
    themen_frage = []
    fragen = set()
    for i in range(26):
        fragen.add(seite.locator(".diagnose-frage").inner_text())
        ueber = seite.locator(".diagnose .ueberzeile").inner_text()
        pruefe(f"Diagnose Fragezähler {i + 1}", ueber == f"Frage {i + 1} von 26", ueber)
        keine_katex_fehler(seite, f"Diagnose {i + 1}")
        # abwechselnd erste und letzte angezeigte Option wählen
        optionen = seite.locator('.diagnose input[type="radio"]')
        (optionen.first if i % 2 == 0 else optionen.last).check()
        seite.locator('[data-aktion="abgeben"]').click()
        if i == 0:
            merke_text(seite, "Diagnose")
        themen_frage.append(seite.locator(".rueckmeldung").inner_text())
        seite.locator('[data-aktion="weiter"]').click()
    seite.get_by_role("heading", name="Auswertung der Diagnose").wait_for()
    pruefe("Diagnose: 26 verschiedene Fragen", len(fragen) == 26, str(len(fragen)))
    z = zustand(seite)
    pruefe("Diagnose: 26 Antworten gespeichert", len(z["diagnose"]["antworten"]) == 26, str(z["diagnose"]))
    falsch = {k.split("-")[0] for k, v in z["diagnose"]["antworten"].items() if not v}
    links = seite.locator(".empfehlungsliste a").all_inner_texts()
    pruefe("Empfehlung nennt alle Themen mit Fehlern", len(links) == len(falsch), f"{links} {falsch}")
    reihenfolge = [l.split()[0] for l in links]
    erwartet = [t["id"] for t in DATEN["themen"] if t["id"] in falsch]
    pruefe("Empfehlung nach Bereich sortiert", reihenfolge == erwartet, f"{reihenfolge}")
    merke_text(seite, "Diagnose Auswertung")
    seite.goto(basis + "#/themen")
    pruefe("empfohlene Themen markiert", seite.locator(".kachel.empfohlen").count() == len(falsch))
    seite.close()


def zahlen_antworten(seite, aufgaben, richtig=True):
    for a in aufgaben:
        for t in a["teile"]:
            k = f"{a['id']}/{t['id']}"
            karte = seite.locator(f'section.teil[data-teil="{k}"]')
            p = t["pruefung"]
            if p["typ"] == "zahl":
                karte.locator("input.zahlfeld").fill(deutsch(p["wert"]) if richtig else "12345")
            elif p["typ"] == "auswahl":
                for i in (p["richtig"] if richtig else [x for x in range(len(p["optionen"])) if x not in p["richtig"]][:1]):
                    karte.locator(f'input[data-index="{i}"]').check()
            else:
                karte.locator("textarea").fill("Antwort zum Test")


def test_probeklausur(kontext, basis, bilder=None):
    seite = kontext.new_page()
    if bilder:
        seite.set_viewport_size(bilder)
    seite.goto(basis + "#/klausur")
    merke_text(seite, "Probeklausur Start")
    seite.locator('[data-aktion="klausur-start"]').click()
    seite.locator(".klausurleiste").wait_for()
    ids = [e.get_attribute("data-aufgabe") for e in seite.locator("article.aufgabe-klausur").all()]
    aufgaben = [a for a in DATEN["aufgaben"] if a["id"] in ids]
    be = sum(t["be"] for a in aufgaben for t in a["teile"])
    pruefe("Probeklausur 38 bis 42 BE", 38 <= be <= 42, str(be))
    leiste = seite.locator(".klausurleiste").inner_text()
    minuten = round(be * 2.2)
    pruefe("Timer BE mal 2,2 Minuten", f"Restzeit {minuten - 1}:" in leiste or f"Restzeit {minuten}:" in leiste, leiste)
    pruefe("keine Hilfen in der Probeklausur", seite.locator('[data-aktion="hilfe"], [data-aktion="loesung"], [data-aktion="pruefen"]').count() == 0)
    keine_katex_fehler(seite, "Probeklausur")
    kein_quer_scrollen(seite, "Probeklausur")
    merke_text(seite, "Probeklausur")
    zahlen_antworten(seite, aufgaben)
    seite.reload()
    seite.locator(".klausurleiste").wait_for()
    erste = next((a, t) for a in aufgaben for t in a["teile"] if t["pruefung"]["typ"] == "zahl")
    wert = seite.locator(f'section.teil[data-teil="{erste[0]["id"]}/{erste[1]["id"]}"] input').input_value()
    pruefe("Antworten überstehen Neuladen", wert == deutsch(erste[1]["pruefung"]["wert"]), wert)
    seite.locator('[data-aktion="abgeben"]').click()
    seite.locator('.bestaetigung [data-aktion="ja"]').click()
    if any(t["pruefung"]["typ"] == "selbst" for a in aufgaben for t in a["teile"]):
        seite.get_by_role("heading", name="Selbstkontrolle").wait_for()
        merke_text(seite, "Selbstkontrolle")
        for box in seite.locator("input[data-kriterium]").all():
            box.check()
        seite.locator('[data-aktion="auswertung"]').click()
    seite.locator(".ergebnis").wait_for()
    np = seite.locator(".np").inner_text()
    pruefe("volle Punktzahl gibt 15 NP", np == "15", np)
    pruefe("BE in der Auswertung", f"{be} von {be} BE" in seite.locator(".ergebnis").inner_text())
    if bilder:
        return seite
    seite.locator('[data-aktion="loesungen"]').click()
    pruefe("Lösungen nach der Auswertung", seite.locator(".loesung").count() >= sum(len(a["teile"]) for a in aufgaben))
    keine_katex_fehler(seite, "Probeklausur Lösungen")
    kein_quer_scrollen(seite, "Probeklausur Lösungen")
    merke_text(seite, "Probeklausur Auswertung")
    z = zustand(seite)
    pruefe("Probeklausur im Verlauf", len(z["klausurVerlauf"]) == 1 and z["klausurVerlauf"][0]["np"] == 15)
    seite.close()


def test_code(browser, basis):
    k1 = browser.new_context(service_workers="block")
    s1 = k1.new_page()
    s1.goto(basis + "#/aufgabe/I1-G1")
    a = DATEN["aufgaben"][0]
    for t in a["teile"]:
        beantworte_teil(s1, a["id"], t)
    s1.goto(basis + "#/sichern")
    code = s1.locator("#code-ausgabe").input_value()
    pruefe("QR-Code erzeugt", s1.locator(".qr svg").count() == 1)
    stand1 = zustand(s1)["teile"]
    k1.close()
    k2 = browser.new_context(service_workers="block")
    s2 = k2.new_page()
    s2.goto(basis + "#p=" + code)
    s2.locator('[data-aktion="code-laden"]').click()
    s2.get_by_role("heading", name="Meine Übersicht").wait_for()
    stand2 = zustand(s2)["teile"]
    gleich = all(stand2.get(k, {}).get("r") == v["r"] and stand2[k]["d"] == v["d"] for k, v in stand1.items())
    pruefe("Fortschritt per Link übertragen", gleich and len(stand2) == len(stand1), f"{stand1} {stand2}")
    pruefe("Code aus der Adresse entfernt", "#p=" not in s2.url)
    s2.goto(basis + "#/laden")
    s2.locator("#code-eingabe").fill("Unsinn")
    s2.locator('[data-aktion="code-laden"]').click()
    pruefe("falscher Code wird gemeldet", s2.locator(".rueckmeldung.falsch").count() == 1)
    k2.close()


def test_offline(browser, basis):
    kontext = browser.new_context()
    seite = kontext.new_page()
    seite.goto(basis)
    seite.evaluate("navigator.serviceWorker.ready.then(() => true)")
    seite.reload()
    seite.wait_for_function("navigator.serviceWorker.controller !== null", timeout=15000)
    seite.wait_for_timeout(500)
    kontext.set_offline(True)
    seite.reload()
    seite.locator(".kopfbereich h1").wait_for(timeout=5000)
    pruefe("offline: Startseite lädt", "Lerntheke" in seite.locator(".kopfbereich h1").inner_text())
    seite.goto(basis + "#/aufgabe/S4-A")
    seite.locator("article.aufgabe").wait_for(timeout=5000)
    pruefe("offline: Aufgabe mit Formeln", seite.locator(".katex").count() > 3)
    keine_katex_fehler(seite, "offline")
    pruefe("offline: Abbildung", seite.locator("figure.abbildung svg").count() == 1)
    schrift = seite.evaluate("document.fonts.check('16px KaTeX_Main')")
    pruefe("offline: KaTeX-Schrift verfügbar", schrift)
    seite.goto(basis + "?lehrer=1")
    seite.locator(".lehrer-aufgabe").first.wait_for(timeout=8000)
    pruefe("offline: Lehreransicht", seite.locator(".lehrer-aufgabe").count() == 52)
    kontext.close()


def test_lehrer(kontext, basis):
    seite = kontext.new_page()
    seite.goto(basis + "?lehrer=1")
    seite.locator(".lehrer-aufgabe").first.wait_for()
    pruefe("Lehreransicht: alle 52 Aufgaben", seite.locator(".lehrer-aufgabe").count() == 52)
    keine_katex_fehler(seite, "Lehreransicht")
    seite.locator('[data-aktion="z-sperre"]').check()
    seite.goto(basis + "?lehrer=1#/aufgabe/S7-Z")
    pruefe("Lehrkraft schaltet Z-Sperre ab", seite.locator(".sperrhinweis").count() == 0)
    seite.close()


def test_schreibregeln():
    for name, text in gesehene_texte.items():
        for muster, regel in VERBOTEN:
            treffer = muster.search(text) if hasattr(muster, "search") else (muster in text)
            if treffer:
                stelle = text.find(muster) if isinstance(muster, str) else treffer.start()
                pruefe(f"Schreibregel {regel} auf {name}", False, repr(text[max(0, stelle - 40):stelle + 40]))
    pruefe("Schreibregeln geprüft", len(gesehene_texte) > 50, str(len(gesehene_texte)))


def screenshots(browser, basis):
    BILDER.mkdir(parents=True, exist_ok=True)
    for geraet, groesse in [("handy", HANDY), ("tablet", TABLET)]:
        kontext = browser.new_context(viewport=groesse, device_scale_factor=2, service_workers="block")
        seite = kontext.new_page()
        seite.goto(basis)
        seite.wait_for_timeout(300)
        seite.screenshot(path=str(BILDER / f"1_start_{geraet}.png"), full_page=True)
        seite.goto(basis + "#/aufgabe/I2-G1")
        a = next(x for x in DATEN["aufgaben"] if x["id"] == "I2-G1")
        beantworte_teil(seite, "I2-G1", a["teile"][0])
        seite.goto(basis + "#/themen")
        seite.wait_for_timeout(300)
        seite.screenshot(path=str(BILDER / f"2_themen_{geraet}.png"), full_page=True)
        seite.goto(basis + "#/aufgabe/I2-G1")
        k = seite.locator('section.teil[data-teil="I2-G1/b"]')
        k.locator("input.zahlfeld").fill("0,18")
        k.locator('[data-aktion="pruefen"]').click()
        seite.wait_for_timeout(300)
        seite.evaluate("window.scrollTo(0, 0)")
        seite.screenshot(path=str(BILDER / f"3_rechenaufgabe_{geraet}.png"), full_page=True)
        seite.goto(basis + "#/aufgabe/I1-G1")
        a = DATEN["aufgaben"][0]
        beantworte_teil(seite, "I1-G1", a["teile"][0])
        k = seite.locator('section.teil[data-teil="I1-G1/b"]')
        k.locator("textarea").fill("Die Elektronen im Stab werden durch die Lorentzkraft zu einem Ende geschoben.")
        k.locator('[data-aktion="hilfe"]').first.click()
        seite.locator('section.teil[data-teil="I1-G1/b"] [data-aktion="kriterien"]').click()
        k = seite.locator('section.teil[data-teil="I1-G1/b"]')
        k.locator('input[data-kriterium="0"]').check()
        k.locator('input[data-kriterium="1"]').check()
        seite.wait_for_timeout(200)
        k.scroll_into_view_if_needed()
        seite.evaluate("window.scrollTo(0, 0)")
        seite.screenshot(path=str(BILDER / f"4_selbstkontrolle_{geraet}.png"), full_page=True)
        s = test_probeklausur(kontext, basis, bilder=groesse)
        s.evaluate("window.scrollTo(0, 0)")
        s.wait_for_timeout(300)
        s.screenshot(path=str(BILDER / f"5_probeklausur_auswertung_{geraet}.png"), full_page=True)
        kontext.close()
    kontext = browser.new_context(viewport=HANDY, device_scale_factor=2, color_scheme="dark", service_workers="block")
    seite = kontext.new_page()
    seite.goto(basis + "#/aufgabe/S4-A")
    seite.wait_for_timeout(300)
    seite.screenshot(path=str(BILDER / "6_dunkelmodus_handy.png"), full_page=True)
    kontext.close()
    print("Screenshots in", BILDER)


def main():
    mit_bildern = "--screenshots" in sys.argv
    server, basis = starte_server()
    with sync_playwright() as p:
        browser = p.chromium.launch() if "--chromium" in sys.argv else p.chromium.launch(channel="chrome")
        konsole = []
        neu = browser.new_context

        def new_context(**kw):
            k = neu(**kw)
            k.on("page", lambda s: (s.on("pageerror", lambda e: konsole.append(str(e))),
                                    s.on("console", lambda m: konsole.append(m.text) if m.type == "error" else None)))
            return k
        browser.new_context = new_context
        kontext = browser.new_context(service_workers="block")
        schritte = [
            ("Unit-Tests", lambda: test_unit(kontext, basis)),
            ("fehlerhafte JSON", lambda: test_fehlerhafte_json(browser.new_context(service_workers="block"), basis)),
            ("alle 52 Aufgaben bei 360 px", lambda: test_alle_aufgaben(browser.new_context(service_workers="block"), basis)),
            ("Rückmeldungen", lambda: test_rueckmeldung(browser.new_context(service_workers="block"), basis)),
            ("Z-Sperre", lambda: test_z_sperre(browser.new_context(service_workers="block"), basis)),
            ("Diagnose", lambda: test_diagnose(browser.new_context(service_workers="block"), basis)),
            ("Probeklausur", lambda: test_probeklausur(browser.new_context(service_workers="block"), basis)),
            ("Fortschritts-Code", lambda: test_code(browser, basis)),
            ("Lehreransicht", lambda: test_lehrer(browser.new_context(service_workers="block"), basis)),
            ("Offline", lambda: test_offline(browser, basis)),
            ("Schreibregeln", test_schreibregeln),
        ]
        for name, f in schritte:
            vorher = len(fehler)
            try:
                f()
            except Exception as e:
                fehler.append(f"{name}: Abbruch {e}")
                print("FEHLER:", name, "Abbruch", e)
            print(f"{'ok    ' if len(fehler) == vorher else 'FEHLER'} {name}")
        if mit_bildern:
            screenshots(browser, basis)
        browser.close()
    server.shutdown()
    echte = [k for k in konsole if "Failed to load resource" not in k]
    pruefe("keine Fehler in der Browserkonsole", not echte, " | ".join(echte[:5]))
    print(f"\n{bestanden} Prüfungen bestanden, {len(fehler)} fehlgeschlagen")
    sys.exit(1 if fehler else 0)


if __name__ == "__main__":
    main()
