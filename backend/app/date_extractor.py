import re
from typing import Tuple, Optional

MONTHS_FR = {
    1: "Janvier", 2: "Février", 3: "Mars", 4: "Avril",
    5: "Mai", 6: "Juin", 7: "Juillet", 8: "Août",
    9: "Septembre", 10: "Octobre", 11: "Novembre", 12: "Décembre"
}

MONTH_NAME_TO_INT = {
    "janvier": 1, "january": 1, "jan": 1,
    "février": 2, "fevrier": 2, "february": 2, "feb": 2,
    "mars": 3, "march": 3, "mar": 3,
    "avril": 4, "april": 4, "apr": 4,
    "mai": 5, "may": 5,
    "juin": 6, "june": 6, "jun": 6,
    "juillet": 7, "july": 7, "jul": 7,
    "août": 8, "aout": 8, "august": 8, "aug": 8,
    "septembre": 9, "september": 9, "sep": 9, "sept": 9,
    "octobre": 10, "october": 10, "oct": 10,
    "novembre": 11, "november": 11, "nov": 11,
    "décembre": 12, "decembre": 12, "december": 12, "dec": 12,
}


def add_months_to_period(month_num: int, year: int, months_to_add: int) -> Tuple[int, int]:
    total_m = month_num + months_to_add
    new_y = year + (total_m - 1) // 12
    new_m = ((total_m - 1) % 12) + 1
    return new_m, new_y


def format_period(month_num: int, year: int) -> str:
    m_str = MONTHS_FR.get(month_num, "Janvier")
    return f"{m_str} {year}"


def extract_internship_dates(title: str, text: str = "", contract_type: str = "") -> Tuple[str, str, str]:
    """
    Extracts or computes:
    - start_date (e.g. 'Janvier 2027', 'Juin 2027', 'Dès que possible')
    - end_date (e.g. 'Juin 2027', 'Août 2027', 'Décembre 2027')
    - duration_months (e.g. '6 mois', '10 semaines', '4-6 mois')
    """
    combined = f"{title} {text}".lower()

    # 1. Check Duration first
    duration = "6 mois"
    if any(k in combined for k in ["summer", "été", "10 weeks", "10 semaines", "8-10 weeks"]):
        duration = "10 semaines"
    elif any(k in combined for k in ["pfe", "fin d'études", "fin d'etudes", "4-6 mois", "4 à 6 mois"]):
        duration = "4-6 mois"
    else:
        dur_match = re.search(r'(?:durée|duration|pour une durée de)\s*[:\-]?\s*(\d+)\s*(mois|months|semaines|weeks)', combined)
        if dur_match:
            val, unit = dur_match.group(1), dur_match.group(2)
            if "semaine" in unit or "week" in unit:
                duration = f"{val} semaines"
            else:
                duration = f"{val} mois"

    # 2. Check explicitly stated month and year in title or text
    # Case: Summer 2027 / Summer Internship
    if "summer" in combined or "été" in combined:
        year = 2027
        y_match = re.search(r'202[6-8]', combined)
        if y_match:
            year = int(y_match.group(0))
        return f"Juin {year}", f"Août {year}", duration

    # Regex for "start / début / à partir de" or exact month mentioned with year
    pattern_start = re.search(
        r'(?:démarrage|début|commencement|à partir de|a partir de|dès|start date|starting in|from|dès le|courant)\s*[:\-]?\s*(?:le|en|de)?\s*'
        r'(janvier|février|fevrier|mars|avril|mai|juin|juillet|août|aout|septembre|octobre|novembre|décembre|january|february|march|april|may|june|july|august|september|october|november|december)\s*'
        r'(202[6-8])?',
        combined
    )

    pattern_any_month_year = re.search(
        r'(janvier|février|fevrier|mars|avril|mai|juin|juillet|août|aout|septembre|octobre|novembre|décembre|january|february|march|april|may|june|july|august|september|october|november|december)\s*'
        r'(202[6-8])',
        combined
    )

    start_m = None
    start_y = None

    if pattern_start:
        m_str = pattern_start.group(1)
        y_str = pattern_start.group(2)
        start_m = MONTH_NAME_TO_INT.get(m_str)
        if y_str:
            start_y = int(y_str)
        else:
            # Look for closest year in text
            y_find = re.search(r'202[6-8]', combined)
            start_y = int(y_find.group(0)) if y_find else 2027

    elif pattern_any_month_year:
        m_str = pattern_any_month_year.group(1)
        y_str = pattern_any_month_year.group(2)
        start_m = MONTH_NAME_TO_INT.get(m_str)
        start_y = int(y_str)

    # If start month & year identified
    if start_m and start_y:
        start_str = format_period(start_m, start_y)
        # Calculate end date
        months_dur = 6
        if "semaine" in duration:
            num_w = re.search(r'\d+', duration)
            w = int(num_w.group(0)) if num_w else 10
            months_dur = 2 if w <= 10 else 3
        else:
            num_m = re.search(r'\d+', duration)
            if num_m:
                months_dur = int(num_m.group(0))

        end_m, end_y = add_months_to_period(start_m, start_y, months_dur)
        end_str = format_period(end_m, end_y)
        return start_str, end_str, duration

    # 3. Off-cycle / 2027 explicit mentions
    if "2027" in combined:
        if any(k in combined for k in ["off-cycle", "offcycle", "césure", "cesure"]):
            return "Juin 2027", "Décembre 2027", duration
        elif any(k in combined for k in ["s1", "janvier", "january", "hiver", "winter"]):
            return "Janvier 2027", "Juin 2027", duration
        elif any(k in combined for k in ["s2", "juin", "june", "printemps", "spring"]):
            return "Juin 2027", "Décembre 2027", duration
        return "Juin 2027", "Décembre 2027", duration

    # 4. Immediate / ASAP / Dès que possible
    if any(k in combined for k in ["dès que possible", "asap", "immédiat", "immediate", "dès maintenant"]):
        return "Immédiat / Dès que possible", "6 mois après démarrage", duration

    # 5. Default standard market finance off-cycle timeline (EDHEC M1 target: Juin 2027)
    return "Juin 2027", "Décembre 2027", duration
