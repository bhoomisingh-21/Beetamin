#!/usr/bin/env python3
"""Convert Anuvaad INDB xlsx export to CSV for scripts/seed-indb-foods.js."""

from __future__ import annotations

import csv
import sys
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

NS = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
ROOT = Path(__file__).resolve().parents[1]
DEFAULT_XLSX = ROOT / "data" / "Anuvaad_INDB_2024.11.xlsx"
DEFAULT_OUT = ROOT / "data" / "anuvaad-indb-2024.csv"

OUT_HEADERS = [
    "food_code",
    "name",
    "category",
    "kcal_per_100g",
    "carbs_g_per_100g",
    "protein_g_per_100g",
    "fat_g_per_100g",
    "fiber_g_per_100g",
    "default_qty_grams",
    "default_unit",
    "primary_source",
]


def col_letters(cell_ref: str) -> int:
    letters = "".join(ch for ch in cell_ref if ch.isalpha())
    idx = 0
    for ch in letters:
        idx = idx * 26 + (ord(ch.upper()) - ord("A") + 1)
    return idx - 1


def read_shared_strings(z: zipfile.ZipFile) -> list[str]:
    root = ET.fromstring(z.read("xl/sharedStrings.xml"))
    out: list[str] = []
    for si in root.findall("m:si", NS):
        parts = [t.text or "" for t in si.findall(".//m:t", NS)]
        out.append("".join(parts))
    return out


def read_sheet_rows(z: zipfile.ZipFile, shared: list[str]) -> list[list[str]]:
    root = ET.fromstring(z.read("xl/worksheets/sheet1.xml"))
    rows_out: list[list[str]] = []
    for row in root.findall(".//m:row", NS):
        cells: dict[int, str] = {}
        for cell in row.findall("m:c", NS):
            ref = cell.get("r", "")
            v = cell.find("m:v", NS)
            if v is None or v.text is None:
                continue
            val = shared[int(v.text)] if cell.get("t") == "s" else v.text
            cells[col_letters(ref)] = val
        if not cells:
            continue
        max_col = max(cells)
        row_vals = [cells.get(i, "") for i in range(max_col + 1)]
        rows_out.append(row_vals)
    return rows_out


def to_float(value: str) -> float | None:
    value = (value or "").strip()
    if not value:
        return None
    try:
        n = float(value)
        return n if n == n else None
    except ValueError:
        return None


def serving_grams(per100_kcal: float | None, serving_kcal: float | None) -> int | None:
    if not per100_kcal or not serving_kcal or per100_kcal <= 0:
        return None
    grams = round((serving_kcal / per100_kcal) * 100)
    if grams < 30:
        return 30
    if grams > 500:
        return 500
    return grams


def convert(xlsx_path: Path, out_path: Path) -> int:
    with zipfile.ZipFile(xlsx_path) as z:
        shared = read_shared_strings(z)
        rows = read_sheet_rows(z, shared)

    if not rows:
        raise SystemExit("Workbook sheet is empty")

    header = [h.strip().lower() for h in rows[0]]
    idx = {name: i for i, name in enumerate(header)}

    required = ["food_code", "food_name", "energy_kcal", "carb_g", "protein_g", "fat_g", "fibre_g"]
    for col in required:
        if col not in idx:
            raise SystemExit(f"Missing column {col} in xlsx header")

    written = 0
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with out_path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=OUT_HEADERS)
        writer.writeheader()
        for raw in rows[1:]:
            def cell(col: str) -> str:
                i = idx.get(col)
                if i is None or i >= len(raw):
                    return ""
                return raw[i].strip()

            name = cell("food_name")
            if not name:
                continue
            per100_kcal = to_float(cell("energy_kcal"))
            serving_kcal = to_float(cell("unit_serving_energy_kcal"))
            qty = serving_grams(per100_kcal, serving_kcal) or 150
            unit = cell("servings_unit") or "serving"
            source = cell("primarysource") or "indb"
            writer.writerow(
                {
                    "food_code": cell("food_code"),
                    "name": name,
                    "category": "Prepared Meal",
                    "kcal_per_100g": per100_kcal if per100_kcal is not None else "",
                    "carbs_g_per_100g": to_float(cell("carb_g")) or "",
                    "protein_g_per_100g": to_float(cell("protein_g")) or "",
                    "fat_g_per_100g": to_float(cell("fat_g")) or "",
                    "fiber_g_per_100g": to_float(cell("fibre_g")) or "",
                    "default_qty_grams": qty,
                    "default_unit": unit,
                    "primary_source": source,
                }
            )
            written += 1

    print(f"Wrote {written} rows to {out_path}")
    return written


def main() -> None:
    xlsx = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_XLSX
    out = Path(sys.argv[2]) if len(sys.argv) > 2 else DEFAULT_OUT
    if not xlsx.exists():
        raise SystemExit(f"XLSX not found: {xlsx}\nCopy Anuvaad_INDB_2024.11.xlsx to data/ or pass path as argv[1]")
    convert(xlsx, out)


if __name__ == "__main__":
    main()
