"""
club_names.py — kanonisk klubbnamns-normalisering för Bandygrytan-data.

Bandygrytan renderar samma klubb olika över säsonger (suffix, bindestreck,
versalisering, ordföljd). Det splittrar matchup- och klubbaggregat. Den här
modulen mappar varianter till ett kanoniskt namn.

PRINCIP: slå bara ihop varianter av SAMMA klubb (verifierat via säsongsmönster
— varje variant ligger i skilda säsonger = renderingsändring, ej kollision).
Slå ALDRIG ihop två olika klubbar. Lidköpings AIK ≠ Villa-Lidköping BK.

Verifierat 2026-06-03. Se docs/data/club_name_map.json för granskningslista.
"""

# variant → kanoniskt namn. Endast formaterings-/suffix-/ordföljdsvarianter
# av en och samma klubb (bekräftat via skilda säsonger).
CANONICAL_MAP = {
    # ── Herr ──
    "Bollnäs GIF": "Bollnäs GoIF",
    "Bollnäs GOIF BF": "Bollnäs GoIF",
    "Broberg/Söderhamn BIF": "Broberg/Söderhamn",
    "Edsbyns IF Bandy": "Edsbyns IF",
    "Edsbyns IF Bandyförening": "Edsbyns IF",
    "Gripen BK Trollhättan": "Gripen Trollhättan BK",
    "GripenTrollhättan BK": "Gripen Trollhättan BK",
    "Hammarby Bandy": "Hammarby IF",
    "Sandvikens AIK": "Sandvikens AIK/BK",
    "Villa Lidköping BK": "Villa-Lidköping BK",
    "Västerås SK/BK": "Västerås SK",
    # ── Dam ──
    "Hammarby IF Dam": "Hammarby IF",
    "Mölndal BK": "Mölndal Bandy",
    "Sandvikens AIK Dam": "Sandvikens AIK/BK",
    "Skirö AIK Dam": "Skirö AIK",
    "Uppsala BOIS": "Uppsala BoIS",
}

# Klubbar som EXPLICIT inte slås ihop trots namnlikhet — distinkta klubbar.
DO_NOT_MERGE = {
    "Lidköpings AIK",   # separat från Villa-Lidköping BK
    "IF Boltic",        # egen klubb (ej Karlstad/BS-sammanslagning här)
}

# Sammanslagningar som rekommenderas bekräftas av Jacob (slogs ihop men
# core-token skiljer mer än ren formatering).
REVIEW_RECOMMENDED = [
    {"variants": ["Bollnäs GIF", "Bollnäs GOIF BF"], "canonical": "Bollnäs GoIF",
     "note": "GIF vs GoIF skiljer en bokstav i akronymen. Säsongsmönster (2019-23 vs 2024-26) + enda Bollnäs-bandyklubben i elit → samma klubb."},
    {"variants": ["Mölndal BK", "Mölndal Bandy"], "canonical": "Mölndal Bandy",
     "note": "BK vs Bandy. Samma ort, enda Mölndal-klubben. Säsongsmönster stödjer."},
    {"variants": ["Västerås SK", "Västerås SK/BK"], "canonical": "Västerås SK",
     "note": "SK vs SK/BK. Kontinuerlig elitnärvaro, ingen parallell Västerås-klubb."},
]


def normalize_club(name):
    """Returnera kanoniskt klubbnamn. Ändrar inget för okända/distinkta namn."""
    if name in DO_NOT_MERGE:
        return name
    return CANONICAL_MAP.get(name, name)
