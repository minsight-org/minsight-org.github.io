"""Make the slim CSV that database.html loads.

The full export repeats each paper's summary text on every site row, which makes
it about 10 MB. This keeps only the columns the page uses (about 1 MB), and
reports cells that should be numbers but are not, so they can be fixed at source.

Source tables with summaries or abstracts live in database/private, which git
ignores: they must not be published, as the text belongs to the journals.
Never add a summary, abstract or notes column to KEEP below.

Usage, from the repository root:
    python database/tools/make_slim_csv.py
    python database/tools/make_slim_csv.py path/to/input.csv path/to/output.csv

Re-run it whenever the source CSV changes. This step goes away once the
database moves to SQL.
"""

import csv
import re
import sys
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DEFAULT_IN = ROOT / "database/private/merged_Journal_output.csv"
DEFAULT_OUT = ROOT / "database/parameters/minsight_parameters.csv"

# Columns the page uses, in output order. Missing ones are written empty.
# Short bibliographic fields only: no summary, abstract or notes text.
KEEP = [
    "record_id",
    "sample_id",
    "Sample",
    "Material / Composition",
    "Treatment/Condition",
    "Temperature_K",
    "Component",
    "Site",
    "Site_Assignment",
    "Isomer_Shift_mm_s",
    "Quadrupole_Splitting_mm_s",
    "sigma(Quadrupole_Splitting)",
    "Quadrupole_shift_mm_s",
    "Linewidth_mm_s",
    "Hyperfine_Field_T",
    "sigma(Hyperfine_Field_T)",
    "Relative_Area_percent",
    "Fit_Type",
    "line_Type",
    "Model",
    "doi",
    "cr_title",
    "cr_authors",
    "cr_journal",
    "cr_year",
    "Review_sample",
]

NUMERIC = [
    "Temperature_K",
    "Isomer_Shift_mm_s",
    "Quadrupole_Splitting_mm_s",
    "sigma(Quadrupole_Splitting)",
    "Quadrupole_shift_mm_s",
    "Linewidth_mm_s",
    "Hyperfine_Field_T",
    "sigma(Hyperfine_Field_T)",
    "Relative_Area_percent",
]

NUMBER = re.compile(r"[-+]?(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?")


def main():
    src = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_IN
    dst = Path(sys.argv[2]) if len(sys.argv) > 2 else DEFAULT_OUT

    with open(src, encoding="utf-8-sig", newline="") as f:
        rows = list(csv.DictReader(f))

    problems = defaultdict(list)
    out_rows = []

    for row in rows:
        out = {}
        for col in KEEP:
            value = row.get(col) or ""
            # The export has this column twice under two spellings
            if col == "Material / Composition" and not value:
                value = row.get("Material/Composition") or ""
            # Line breaks inside a cell only make the file harder to read
            value = " ".join(value.split())
            out[col] = value

            if col in NUMERIC and value and not NUMBER.fullmatch(value):
                problems[col].append((row.get("record_id", "?"), value))

        out_rows.append(out)

    dst.parent.mkdir(parents=True, exist_ok=True)
    with open(dst, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=KEEP)
        writer.writeheader()
        writer.writerows(out_rows)

    print(f"Wrote {len(out_rows)} rows to {dst} ({dst.stat().st_size / 1e6:.1f} MB)")

    if problems:
        print("\nCells that should be numbers but are not (the page treats them as missing):")
        for col, items in problems.items():
            examples = ", ".join(f"{rid}: {val!r}" for rid, val in items[:5])
            more = f" and {len(items) - 5} more" if len(items) > 5 else ""
            print(f"  {col}: {len(items)} ({examples}{more})")


if __name__ == "__main__":
    main()
