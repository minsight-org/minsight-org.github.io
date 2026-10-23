"""Build the CSV that database.html loads.

Reads the curated parameter table and its reference list (kept out of git in
_restricted/), groups the site rows into spectra, adds bibliographic details
for each DOI from Crossref, and writes one tidy table with a row per site.

Usage, from the repository root:
    python database/tools/build_database.py

Options:
    --params PATH       parameter table (default _restricted/parameters_with_ReferenceID.csv)
    --refs PATH         reference list (default _restricted/references.csv)
    --offline           do not contact Crossref; use only the cache

Crossref answers are cached in database/tools/crossref_cache.json, so they are
only fetched once per DOI. Re-run this whenever the parameter table changes.
This step goes away once the database moves to SQL.
"""

import argparse
import csv
import json
import re
import sys
import urllib.request
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "database/parameters/minsight_parameters.csv"
CACHE = Path(__file__).with_name("crossref_cache.json")

COLUMNS = [
    "spectrum_id", "mineral", "mineral_class", "temperature_K", "site", "n_sites", "oxidation_state",
    "IS", "IS_error", "QS", "QS_error", "Bhf", "Bhf_error", "fit_model",
    "doi", "url", "title", "authors", "journal", "year",
]

NUMBER = re.compile(r"[-+]?(\d+\.?\d*|\.\d+)")


def clean(value):
    return " ".join(str(value or "").split())


def crossref(doi, cache, offline):
    """Title, authors, journal and year for a DOI (bibliographic fields only)."""
    if doi in cache:
        return cache[doi]
    if offline:
        return {}
    try:
        request = urllib.request.Request(
            f"https://api.crossref.org/works/{doi}",
            headers={"User-Agent": "MinSight database build (https://minsight.org)"})
        with urllib.request.urlopen(request, timeout=30) as response:
            message = json.load(response)["message"]
    except Exception as e:  # keep going; the page falls back to the link
        print(f"  Crossref lookup failed for {doi}: {e}")
        return {}
    year = (message.get("issued", {}).get("date-parts") or [[None]])[0][0]
    record = {
        "title": clean((message.get("title") or [""])[0]),
        "authors": ", ".join(clean(f"{a.get('given', '')} {a.get('family', '')}") for a in message.get("author", [])),
        "journal": clean((message.get("container-title") or [""])[0]),
        "year": str(year or ""),
    }
    cache[doi] = record
    return record


def slug(text):
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--params", default=ROOT / "_restricted/parameters_with_ReferenceID.csv")
    parser.add_argument("--refs", default=ROOT / "_restricted/references.csv")
    parser.add_argument("--offline", action="store_true")
    args = parser.parse_args()

    with open(args.params, encoding="utf-8-sig", newline="") as f:
        rows = list(csv.DictReader(f))
    with open(args.refs, encoding="utf-8-sig", newline="") as f:
        refs = {r["ReferenceID"].strip(): r for r in csv.DictReader(f)}

    cache = json.loads(CACHE.read_text(encoding="utf-8")) if CACHE.exists() else {}

    # Group site rows into spectra. A row joins an open spectrum with the same
    # paper, mineral, temperature and number of sites that does not yet have
    # its site number; otherwise it starts a new spectrum. This copes with
    # sites listed out of order and with several samples of one mineral.
    spectra = []
    open_groups = defaultdict(list)
    for row in rows:
        key = tuple(clean(row[c]) for c in ("Reference", "Mineral", "Temp [K]", "Nsites"))
        site = clean(row["Site"])
        n_sites = int(row["Nsites"]) if clean(row["Nsites"]).isdigit() else 1
        group = None
        if site:
            for g in open_groups[key]:
                if site not in g["sites"] and len(g["rows"]) < n_sites:
                    group = g
                    break
        if group is None:
            group = {"rows": [], "sites": set()}
            spectra.append(group)
            if site:
                open_groups[key].append(group)
        group["rows"].append(row)
        group["sites"].add(site)

    out_rows = []
    problems = []
    seen_ids = defaultdict(int)
    for group in spectra:
        first = group["rows"][0]
        ref = refs.get(clean(first["ReferenceID"]), {})
        doi = clean(ref.get("DOI"))
        meta = crossref(doi, cache, args.offline) if doi else {}
        url = clean(ref.get("URL")) or clean(first["Reference"])

        base = f"{clean(first['ReferenceID']) or 'ref'}-{slug(clean(first['Mineral']))}-{clean(first['Temp [K]'])}K"
        seen_ids[base] += 1
        spectrum_id = f"{base}-{seen_ids[base]}"

        expected = clean(first["Nsites"])
        if expected.isdigit() and len(group["rows"]) != int(expected):
            problems.append(f"{clean(first['Mineral'])} at {clean(first['Temp [K]'])} K "
                            f"({clean(first['ReferenceID']) or url}): {len(group['rows'])} of {expected} sites")

        for row in sorted(group["rows"], key=lambda r: clean(r["Site"]) or "0"):
            out_rows.append({
                "spectrum_id": spectrum_id,
                "mineral": clean(row["Mineral"]),
                "mineral_class": clean(row["Class"]),
                "temperature_K": clean(row["Temp [K]"]),
                "site": clean(row["Site"]),
                "n_sites": clean(row["Nsites"]),
                "oxidation_state": clean(row["Ox state"]),
                "IS": clean(row["IS [mm/s]"]),
                "IS_error": clean(row["IS error [mm/s]"]),
                "QS": clean(row["QS [mm/s]"]),
                "QS_error": clean(row["QS error [mm/s]"]),
                "Bhf": clean(row["Bhf [T]"]),
                "Bhf_error": clean(row["Bhf error [T]"]),
                "fit_model": clean(row["Model"]),
                "doi": doi,
                "url": url,
                # Crossref sometimes returns a broken ö
                "title": meta.get("title", "").replace("M�ssbauer", "Mössbauer"),
                "authors": meta.get("authors", ""),
                "journal": meta.get("journal", ""),
                "year": meta.get("year", ""),
            })

    CACHE.write_text(json.dumps(cache, indent=1, ensure_ascii=False, sort_keys=True), encoding="utf-8")
    OUT.parent.mkdir(parents=True, exist_ok=True)
    with open(OUT, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=COLUMNS)
        writer.writeheader()
        writer.writerows(out_rows)

    print(f"Wrote {len(spectra)} spectra ({len(out_rows)} sites) to {OUT}")
    if problems:
        print(f"\nSpectra with a different number of sites than Nsites says ({len(problems)}):")
        for p in problems:
            print("  " + p)


if __name__ == "__main__":
    sys.exit(main())
