import base64
import difflib
import io
import re

import cv2
import numpy as np
from PIL import Image, ImageOps

# Known medicine names / brand strings checked against raw OCR text.
# Specific names are matched before generic ones, so candidates are sorted
# by length descending before matching.
MEDICINE_NAMES = [
    "Co-Amoxiclav", "Ciprofloxacin", "Azithromycin", "Levofloxacin",
    "Esomeprazole", "Pantoprazole", "Levothyroxine", "Rosuvastatin",
    "Atorvastatin", "Omeprazole", "Metformin", "Paracetamol",
    "Amoxicillin", "Montelukast", "Cetirizine", "Salbutamol",
    "Amlodipine", "Diclofenac", "Metoprolol", "Losartan", "Glycomet",
    "Augmentin", "Levocetirizine", "Simvastatin", "Nebivolol",
    "Telmisartan", "Sitagliptin", "Glimepiride", "Cefixime",
    "Amoxycillin", "Azithral", "Pantocid", "Ecosprin", "Thyronorm",
    "Calpol", "Crocin", "Dolo", "Cipro", "Omez", "Pantop", "Amlo",
    "Telma", "Voveran", "Brufen", "Aspirin", "Ibuprofen", "Amaryl",
    "Losar", "Atorva", "Crestor", "Doxycycline", "Fluconazole",
    "Norfloxacin", "Pantodac", "Omezol", "Rablet", "Pantac",
    "Pan 40", "Pan 20", "Razo", "Esogress", "Razel", "Atorlip",
    "Clopilet", "Ecosprin 75", "Telvas", "Tazzle", "Forzest",
    "Filitra", "Modalert", "Modafinil", "Gabapentin", "Pregabalin",
    "Amitriptyline", "Fluoxetine", "Sertraline", "Escitalopram",
    "Alprazolam", "Clonazepam", "Zolpidem", "Melatonin",
    "Cyclopam", "Dicyclomine", "Ondansetron", "Domperidone",
    "Pantop D", "Razo D", "Omez D", "Rablet D",
    "Pan D", "Pantodac D", "Razo L", "Omez L",
    "Azee 500", "Azee 250", "Azithral 500", "Azithral 250",
    "Monocef 500", "Monocef 250", "Taxim O 200", "Cefix 200",
    "Zifi 200", "Zifi 500", "Oflox 200", "Gatiflox",
    "Levoflox 500", "Levoflox 250", "Mox 500", "Mox CV",
    "Clavam 625", "Clavam 125", "Augmentin 625", "Augmentin 1g",
    "Amoxicap 500", "Amoxicillin 500", "Amox 500", "Amox CV",
    "Met XL", "Metformin 500", "Metformin 1000", "Glycomet GP",
    "Glycomet 500", "Glycomet 1g", "Obimet", "Glyciphage",
    "Januvia 100", "Sitagliptin 100", "Voglibose", "Gluconorm",
    "Zoryl", "Pioglit", "Glizid", "Daonil", "Glynase",
    "Atorvastatin 10", "Atorvastatin 20", "Atorva 10", "Atorva 20",
    "Rosuvas 10", "Rosuvas 20", "Storvas 10", "Storvas 20",
    "Ecosprin AV", "Lipikind", "Lipistat", "Stamlo",
    "Losar H", "Telma H", "Telma 40", "Losar 50",
    "Amlodac 5", "Amlodac 10", "Amlopress", "Amlokind",
    "Dolo 650", "Dolo 500", "Dolo 1g", "Paracip 500",
    "Crocin 500", "Crocin Advance", "Crocin Pain Relief",
    "Combiflam", "Ibucomb", "Flexon", "Meftal", "Dicloflex",
    "Voltaren", "Cataflam", "Zerodol", "Zerodol SP", "Zerodol P",
    "Movexx", "Voveran SR", "Voveran EM", "Diclogem",
    "Pantopazole 40", "Pantop 40", "Pantop 20",
    "Omez 20", "Omez 40", "Omeprazole 20", "Ocid 20",
    "Razo 20", "Razo D 20", "Rablet 20", "Rablet L",
    "Nexpro 20", "Nexpro 40", "Esomez 20", "Esomez 40",
    "Rocaltrol", "Calciquick", "Calcirol", "Torch",
    "Thyronorm 25", "Thyronorm 50", "Thyronorm 100",
    "Eltroxin", "Thyrox", "Euthyrox",
    "Montair LC", "Montair CX", "Montelukast 10",
    "Montemair", "Montair", "Deriphyllin", "Dothalin",
    "Asthalin", "Salbutamol 4", "Levolin", "Levocetirizine 5",
    "Cetzine", "Alerid", "Cetcip", "Levocet",
    "Teczine", "Xyzal", "Silomat", "Tus Q D",
    "Crocin DM", "Crocin Cold", "Vicks Action 500",
    "Decadron", "Betnesol", "Prednisolone", "Wysolone",
    "Panafcort", "Omnacortil", "Defcort",
    "Azithro 500", "Azee OD", "Azithromax", "Azee XP",
    "Ivermectin", "Iverjohn", "Ivermectol", "Hydroxychloroquine",
    "HCQS 200", "HCQS 400", "Plaquenil",
    "Pantocid DSR", "Pantocid 40", "Pantocid 20",
    "Eliquis", "Xarelto", "Warfarin", "Acitrom", "Ascomin",
    "Caprin", "Disprin", "Loprin", "Ecosprin 325",
    "Clopidogrel 75", "Clopilet A", "Deplatt A", "Deplatt",
    "Rozavel A", "Rosuvas F", "Atorva F", "Atozet",
    "Telpres A", "Telma A", "Telvas AT", "Losar AT",
    "Amlodac AT", "Stamlo B", "Amlopress AT",
    "Edarbychlor", "Azilsartan", "Olmesta 40", "Olmesta H",
    "Telma AM", "Telma CT", "Telma 20", "Losar 25",
    "Tenif", "Telpres", "Amlodac B",
    "Azee Z", "Azithral Z", "Taxim O",
    "Pan 40 D", "Pan 20 D", "Omez 20 DSR", "Pantodac 40",
    "Nexpro RD", "Esomez DSR", "Razo DSR",
]

# Rough purpose/use hint per medicine keyword (best-effort; not medical advice).
MEDICINE_USES = {
    "Cyra": "Antibiotic",
    "Cipro": "Antibiotic",
    "Ciprofloxacin": "Antibiotic",
    "Amoxicillin": "Antibiotic",
    "Amoxycillin": "Antibiotic",
    "Co-Amoxiclav": "Antibiotic",
    "Augmentin": "Antibiotic",
    "Azithromycin": "Antibiotic",
    "Azithral": "Antibiotic",
    "Levofloxacin": "Antibiotic",
    "Cefixime": "Antibiotic",
    "Metformin": "Antidiabetic (blood sugar control)",
    "Glycomet": "Antidiabetic (blood sugar control)",
    "Amaryl": "Antidiabetic (blood sugar control)",
    "Glimepiride": "Antidiabetic (blood sugar control)",
    "Sitagliptin": "Antidiabetic (blood sugar control)",
    "Paracetamol": "Pain reliever / fever reducer",
    "Calpol": "Pain reliever / fever reducer",
    "Dolo": "Pain reliever / fever reducer",
    "Crocin": "Pain reliever / fever reducer",
    "Aspirin": "Blood thinner / pain reliever",
    "Ecosprin": "Blood thinner / pain reliever",
    "Ibuprofen": "Anti-inflammatory pain reliever",
    "Brufen": "Anti-inflammatory pain reliever",
    "Diclofenac": "Anti-inflammatory pain reliever",
    "Voveran": "Anti-inflammatory pain reliever",
    "Atorvastatin": "Cholesterol-lowering (statin)",
    "Atorva": "Cholesterol-lowering (statin)",
    "Rosuvastatin": "Cholesterol-lowering (statin)",
    "Crestor": "Cholesterol-lowering (statin)",
    "Simvastatin": "Cholesterol-lowering (statin)",
    "Amlodipine": "Blood pressure medicine",
    "Amlo": "Blood pressure medicine",
    "Telmisartan": "Blood pressure / heart protection (ARB)",
    "Telma": "Blood pressure / heart protection (ARB)",
    "Losartan": "Blood pressure / heart protection (ARB)",
    "Losar": "Blood pressure / heart protection (ARB)",
    "Metoprolol": "Beta-blocker (heart rate / blood pressure)",
    "Nebivolol": "Beta-blocker (heart rate / blood pressure)",
    "Omeprazole": "Acid reflux reducer (PPI)",
    "Omez": "Acid reflux reducer (PPI)",
    "Pantoprazole": "Acid reflux reducer (PPI)",
    "Pantop": "Acid reflux reducer (PPI)",
    "Pantocid": "Acid reflux reducer (PPI)",
    "Esomeprazole": "Acid reflux reducer (PPI)",
    "Levothyroxine": "Thyroid hormone replacement",
    "Thyronorm": "Thyroid hormone replacement",
    "Cetirizine": "Antihistamine (allergy)",
    "Levocetirizine": "Antihistamine (allergy)",
    "Montelukast": "Asthma / allergy medicine",
    "Salbutamol": "Asthma reliever (bronchodilator)",
}

_MONTHS = {
    "jan": 1, "feb": 2, "mar": 3, "apr": 4, "may": 5, "jun": 6,
    "jul": 7, "aug": 8, "sep": 9, "sept": 9, "oct": 10, "nov": 11, "dec": 12,
}

# Labels that introduce an expiry value, longest-first so "EXP DATE" wins
# over "EXP".
_EXP_LABELS = [
    "VALID UNTIL", "BEST BEFORE", "EXPIRY DATE", "EXP DATE", "EXPIRATION",
    "EXPIRES", "EXPIRY", "USE BY", "BBD", "EXP",
]

# One or more expiry value shapes: "SEP 2027", "SEP.2027", "Sep-27", "09/2027",
# "2027-09-14", "09.27", "2027/09".
_EXP_VALUE = (
    r'([A-Za-z]{3,4}\.?\s*\d{4}|'
    r'[A-Za-z]{3,4}\.?\s*\d{2}|'
    r'\d{4}[-/]\d{1,2}(?:[-/]\d{1,2})?|'
    r'\d{1,2}[-/.]\d{4}|\d{1,2}[-/.]\d{2})'
)

# Search window around an expiry label (characters) to find the date value.
_LABEL_WINDOW = 80


# =====================================================
# IMAGE PROCESSING HELPERS
# =====================================================

def _crop_content(rgb):
    """Remove empty margins around the visible content of an image."""
    gray = cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY)
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8)).apply(gray)
    _, bw = cv2.threshold(clahe, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    bw = cv2.erode(bw, np.ones((5, 5), np.uint8))
    coords = np.column_stack(np.where(bw > 0))
    if len(coords) == 0:
        return rgb
    y0, x0 = coords.min(axis=0)
    y1, x1 = coords.max(axis=0)
    return rgb[y0:y1 + 1, x0:x1 + 1]


def _preprocess_variant(rgb):
    """CLAHE contrast + sharpen + 2x upscale — good general-purpose OCR preprocessing."""
    gray = cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY)
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8)).apply(gray)
    blur = cv2.GaussianBlur(clahe, (0, 0), 3)
    sharp = cv2.addWeighted(clahe, 1.8, blur, -0.8, 0)
    return cv2.resize(sharp, None, fx=2.0, fy=2.0, interpolation=cv2.INTER_CUBIC)


def _rotation_angle(rot):
    return {0: 0, 1: 90, 2: 180, 3: 270}[rot]


def _rotate_image(rgb, rot):
    if rot == 0:
        return rgb
    if rot == 1:
        return cv2.rotate(rgb, cv2.ROTATE_90_CLOCKWISE)
    if rot == 2:
        return cv2.rotate(rgb, cv2.ROTATE_180)
    return cv2.rotate(rgb, cv2.ROTATE_90_COUNTERCLOCKWISE)


def _save_debug_image(variant_rgb):
    """Encode a grayscale numpy array as a JPEG data URL for frontend display."""
    img = Image.fromarray(variant_rgb)
    if img.mode != "L":
        img = img.convert("L")
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=85)
    b64 = base64.b64encode(buf.getvalue()).decode("ascii")
    return "data:image/jpeg;base64," + b64


# =====================================================
# DATE AND NAME HELPERS
# =====================================================

def normalize_expiry(value):
    """Normalize a parsed expiry string to YYYY-MM-DD (day defaults to 01).

    Supports: SEP 2027, Sep.2027, Sep-2027, 09/2027, 2027-09, 2027-09-14, SEP 27, ...
    Returns None when the value cannot be turned into a clean date.
    """
    if not value:
        return None

    v = str(value).strip().upper()
    if not v:
        return None

    m = re.match(r'^([A-Z]{3,4})\.?\s*[-/. ]?\s*(\d{4})$', v)
    if m:
        month = _MONTHS.get(m.group(1).lower())
        if month and 2000 <= int(m.group(2)) <= 2100:
            return "{:04d}-{:02d}-01".format(int(m.group(2)), month)

    m = re.match(r'^(\d{1,2})\s*[-/. ]\s*(\d{4})$', v)
    if m:
        month, year = int(m.group(1)), int(m.group(2))
        if 1 <= month <= 12 and 2000 <= year <= 2100:
            return "{:04d}-{:02d}-01".format(year, month)

    m = re.match(r'^(\d{4})[-/](\d{1,2})(?:[-/](\d{1,2}))?$', v)
    if m:
        year, month = int(m.group(1)), int(m.group(2))
        day = int(m.group(3)) if m.group(3) else 1
        if 2000 <= year <= 2100 and 1 <= month <= 12 and 1 <= day <= 31:
            return "{:04d}-{:02d}-{:02d}".format(year, month, day)

    m = re.match(r'^([A-Z]{3,4})\.?\s*[-/. ]?\s*(\d{2})$', v)
    if m:
        month = _MONTHS.get(m.group(1).lower())
        if month:
            yy = int(m.group(2))
            year = 2000 + yy if yy <= 90 else 1900 + yy
            return "{:04d}-{:02d}-01".format(year, month)

    m = re.match(r'^(\d{1,2})[-/.](\d{2})$', v)
    if m:
        month, yy = int(m.group(1)), int(m.group(2))
        if 1 <= month <= 12:
            year = 2000 + yy if yy <= 90 else 1900 + yy
            return "{:04d}-{:02d}-01".format(year, month)

    return None


def _tokenize(text):
    return re.findall(r"[A-Za-z][A-Za-z0-9\-]*", text)


def detect_medicine_name(text):
    """Find the most likely known medicine name in OCR text.

    Exact case-insensitive match first, then fuzzy token matching so small
    OCR typos (e.g. "Metformln") still resolve to the right medicine.
    """
    if not text:
        return None

    low = text.lower()
    candidates = sorted(MEDICINE_NAMES, key=len, reverse=True)

    for name in candidates:
        if name.lower() in low:
            return name

    tokens = [t.lower() for t in _tokenize(text)]

    best_name, best_score = None, 0.0
    for name in candidates:
        nlow = name.lower().replace("-", "").replace(" ", "")

        for tok in tokens:
            if len(tok) >= 4 and (tok in nlow or nlow in tok):
                return name

            if min(len(nlow), len(tok)) < 4:
                continue

            score = difflib.SequenceMatcher(None, nlow, tok).ratio()
            if score >= 0.85 and score > best_score:
                best_name, best_score = name, score

    return best_name


def lookup_medicine_purpose(medicine_name):
    """Rough purpose/use hint by medicine name keyword (None when unknown)."""
    if not medicine_name:
        return None
    low = medicine_name.lower()
    for key, purpose in MEDICINE_USES.items():
        if key.lower() in low:
            return purpose
    return None


def find_expiry(text):
    """Extract expiry date from text, searching both forward and backward from
    every recognised EXP/EXPIRY label.

    This handles layouts where the date appears after the label (common) as
    well as layouts where the date appears *before* the label (e.g. when
    the OCR reads the date and label as separate neighbouring tokens in a
    different spatial order).
    """
    if not text:
        return None, None

    for label in sorted(_EXP_LABELS, key=len, reverse=True):
        label_pat = re.escape(label)
        for label_match in re.finditer(label_pat, text, re.IGNORECASE):
            pos = label_match.start()
            end = label_match.end()

            # Search forward from label end
            fwd = text[end:end + _LABEL_WINDOW]
            val_fwd = re.search(_EXP_VALUE, fwd, re.IGNORECASE)
            if val_fwd:
                iso = normalize_expiry(val_fwd.group(1))
                if iso:
                    return iso, val_fwd.group(1)

            # Search backward from label start
            bwd = text[max(0, pos - _LABEL_WINDOW):pos]
            val_bwd = re.search(_EXP_VALUE, bwd, re.IGNORECASE)
            if val_bwd:
                iso = normalize_expiry(val_bwd.group(1))
                if iso:
                    return iso, val_bwd.group(1)

    return None, None


def _find_mfg(text):
    """Extract manufacturing date (label → value forward only)."""
    if not text:
        return None
    m = re.search(
        r'MFG\s+DATE[:\-]?\s*([A-Za-z]{3,4}\.?\s*\d{4}|\d{1,2}[-/.]\d{4}|\d{4}[-/]\d{1,2})',
        text, re.IGNORECASE,
    )
    return m.group(1) if m else None


def _error_result(message):
    return {
        "medicine_name": None,
        "generic_name": None,
        "mfg_date": None,
        "expiry_date": None,
        "purpose": None,
        "raw_text": "",
        "error": message,
        "preprocessed_image": None,
    }


# =====================================================
# ORIENTATION DETECTION + MULTI-PASS OCR
# =====================================================

def _orient_score(text):
    """Heuristic score for how readable a text string is.

    Higher = more meaningful words (fewer random digits).
    """
    tokens = [t for t in text.split() if len(t) >= 2]
    if not tokens:
        return 0
    alpha = sum(1 for t in tokens if any(c.isalpha() for c in t))
    # Punish strings that are mostly digits
    total_chars = sum(len(t) for t in tokens)
    if total_chars == 0:
        return 0
    alpha_chars = sum(sum(1 for c in t if c.isalpha()) for t in tokens)
    return alpha_chars * 100 + alpha * 50


def _run_ocr(reader, variant):
    """Run easyocr on a single image variant, return list of (text, confidence)."""
    try:
        results = reader.readtext(variant, detail=1)
        return [(r[1], r[2]) for r in results if r[1] and r[1].strip()]
    except Exception:
        return []


def _aggregate_results(all_passes):
    """Merge OCR results from multiple passes into one (text, best_debug_image).

    all_passes: list of (rotation_index, variant_array, [(text, conf), ...])
    Returns: (combined_text, debug_image_array)
    """
    if not all_passes:
        return "", None

    # Score each pass
    scored = []
    for rot, variant, items in all_passes:
        combined = " ".join(text for text, _ in items)
        score = _orient_score(combined)
        scored.append((score, rot, variant, items))
    scored.sort(reverse=True)

    best_score, best_rot, best_variant, best_items = scored[0]
    best_text = " ".join(text for text, _ in best_items)

    # Fallback: if best text is very short, try to merge from second-best pass
    if len(best_text) < 40 and len(scored) > 1:
        _, _, _, second_items = scored[1]
        all_text = best_text + " " + " ".join(text for text, _ in second_items)
    else:
        all_text = best_text

    return all_text, best_variant


def extract_medicine_info(image_path):
    """Extract medicine info from a medicine strip / label photo using OCR.

    The pipeline:
      1. Load + EXIF transpose + crop empty margins.
      2. Try all 4 rotations (0/90/180/270). Each gets CLAHE + sharpen + 2x upscale.
      3. Score each rotation by how many readable words it yields.
      4. Use the best rotation's text for medicine name + expiry matching.
      5. Return the preprocessed debug image as a JPEG data URL.

    easyocr is imported lazily so the app can still start without it.
    """

    try:
        import easyocr
        reader = easyocr.Reader(["en"])
    except Exception:
        reader = None

    if reader is None:
        return _error_result("OCR unavailable (easyocr engine could not be loaded)")

    try:
        raw_rgb = np.array(ImageOps.exif_transpose(Image.open(image_path)).convert("RGB"))
    except Exception:
        try:
            raw_rgb = np.array(Image.open(image_path).convert("RGB"))
        except Exception:
            return _error_result("Could not read image file")

    cropped = _crop_content(raw_rgb)

    all_passes = []
    for rot in range(4):
        rotated = _rotate_image(cropped, rot)
        variant = _preprocess_variant(rotated)
        items = _run_ocr(reader, variant)
        all_passes.append((rot, variant, items))

    text, debug_variant = _aggregate_results(all_passes)

    print("BEST ORIENTED OCR TEXT:")
    print(text)

    preprocessed_image = _save_debug_image(debug_variant) if debug_variant is not None else None

    medicine_name = detect_medicine_name(text)
    mfg_date = _find_mfg(text)
    expiry_iso, _expiry_raw = find_expiry(text)

    return {
        "medicine_name": medicine_name,
        "generic_name": medicine_name,
        "mfg_date": mfg_date,
        "expiry_date": expiry_iso,
        "purpose": lookup_medicine_purpose(medicine_name),
        "raw_text": text,
        "error": None,
        "preprocessed_image": preprocessed_image,
    }
