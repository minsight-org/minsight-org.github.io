// Where the database page gets its data.
//
// Everything else on the page works with the spectrum records described below
// and never sees CSV column names. When the database moves to SQL, replace the
// body of loadSpectra() with a query that returns the same records.

import { parseCSV } from "./csv.js";

const PARAMETERS_URL = "database/parameters/minsight_parameters.csv";
const PROFILES_URL = "database/mineral_profiles/mineral_profiles.json";

/**
 * @typedef {Object} Site
 * @property {string} name        Site label (e.g. "A", "Fe(III) oct")
 * @property {string} component   Phase the site is assigned to, if given
 * @property {number} IS          Isomer shift (mm/s), NaN if not given
 * @property {number} QS          Quadrupole splitting or shift (mm/s), NaN if not given
 * @property {number} sigmaQS     Width of the QS distribution (mm/s), NaN if not given
 * @property {number} Bhf         Hyperfine field (T), NaN for doublets
 * @property {number} sigmaBhf    Width of the Bhf distribution (T), NaN if not given
 * @property {number} fwhm        Linewidth, full width at half maximum (mm/s), NaN if not given
 * @property {number} area        Relative area (%), NaN if not given
 * @property {string} model       "vbf", "lorentzian" or "" when the source does not say
 * @property {Object<string,string>} raw  Original text of each parameter, for display
 *
 * @typedef {Object} Spectrum
 * @property {string} id            Unique spectrum id (sample_id)
 * @property {string} sample        Sample name as given in the paper
 * @property {string} material      Material or composition
 * @property {string} treatment     Treatment or condition
 * @property {number} temperatureK  Measurement temperature (K), NaN if not given
 * @property {string} fitType       Fit description from the paper
 * @property {{doi: string, title: string, authors: string, journal: string, year: string}} reference
 * @property {Site[]} sites
 */

// Strict number parsing: "2.75-2.85" or "nil" are treated as missing, not as 2.75
function toNumber(value) {
  const text = String(value ?? "").trim();
  return /^[-+]?(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?$/.test(text) ? Number(text) : NaN;
}

// Dashes and "nil" stand for an empty cell in some papers' tables
function toText(value) {
  const text = String(value ?? "").trim();
  return /^(?:[-–—]+|nil|n\/?a|none)$/i.test(text) ? "" : text;
}

function toYear(value) {
  const n = toNumber(value);
  return Number.isFinite(n) ? String(Math.round(n)) : String(value ?? "").trim();
}

function siteFromRow(row, index) {
  const raw = {
    IS: row.Isomer_Shift_mm_s,
    QS: row.Quadrupole_Splitting_mm_s,
    sigmaQS: row["sigma(Quadrupole_Splitting)"],
    Bhf: row.Hyperfine_Field_T,
    sigmaBhf: row["sigma(Hyperfine_Field_T)"],
    fwhm: row.Linewidth_mm_s,
    area: row.Relative_Area_percent
  };

  return {
    name: toText(row.Site) || toText(row.Site_Assignment) || toText(row.Component) || String.fromCharCode(65 + index),
    component: toText(row.Component) || toText(row.Site_Assignment),
    IS: toNumber(raw.IS),
    QS: toNumber(raw.QS),
    sigmaQS: toNumber(raw.sigmaQS),
    Bhf: toNumber(raw.Bhf),
    sigmaBhf: toNumber(raw.sigmaBhf),
    // A linewidth of 0 cannot be simulated (it divides by zero), so treat it as missing
    fwhm: toNumber(raw.fwhm) > 0 ? toNumber(raw.fwhm) : NaN,
    area: toNumber(raw.area),
    model: String(row.Model || "").trim().toLowerCase(),
    raw
  };
}

/** Group site rows into spectra (one per sample_id). */
export function spectraFromRows(rows) {
  const groups = new Map();

  rows
    .filter(r => String(r.Review_sample).trim().toLowerCase() !== "true")
    .forEach(r => {
      const id = (r.sample_id || "").trim() || (r.record_id || "").trim();
      if (!id) return;
      if (!groups.has(id)) groups.set(id, []);
      groups.get(id).push(r);
    });

  return [...groups].map(([id, siteRows]) => {
    const first = siteRows[0];
    return {
      id,
      sample: toText(first.Sample),
      material: toText(first["Material / Composition"]),
      treatment: toText(first["Treatment/Condition"]),
      temperatureK: toNumber(first.Temperature_K),
      fitType: toText(first.Fit_Type),
      reference: {
        doi: (first.doi || "").trim(),
        title: (first.cr_title || "").trim(),
        authors: (first.cr_authors || "").trim(),
        journal: (first.cr_journal || "").trim(),
        year: toYear(first.cr_year)
      },
      sites: siteRows.map(siteFromRow)
    };
  });
}

/** @returns {Promise<Spectrum[]>} */
export async function loadSpectra() {
  const response = await fetch(PARAMETERS_URL);
  if (!response.ok) throw new Error(`Could not load ${PARAMETERS_URL} (${response.status})`);
  return spectraFromRows(parseCSV(await response.text()));
}

/** @returns {Promise<{mineral: string, description: string, image: ?string, image_credit: ?string}[]>} */
export async function loadMineralProfiles() {
  try {
    const response = await fetch(PROFILES_URL);
    return response.ok ? await response.json() : [];
  } catch (e) {
    return [];   // the page works without profiles
  }
}
