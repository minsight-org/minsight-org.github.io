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
 * @property {string} name        Site label, e.g. "Site 1"
 * @property {string} oxidation   Iron oxidation state as given ("2", "3", "2.5") or ""
 * @property {number} IS          Isomer shift (mm/s), NaN if not given
 * @property {number} QS          Quadrupole splitting or shift (mm/s), NaN if not given
 * @property {number} Bhf         Hyperfine field (T), NaN for doublets
 * @property {number} ISError     Published uncertainties, NaN if not given
 * @property {number} QSError
 * @property {number} BhfError
 * @property {number} sigmaQS     Width of the QS distribution (mm/s), NaN if not given
 * @property {number} sigmaBhf    Width of the Bhf distribution (T), NaN if not given
 * @property {number} fwhm        Linewidth, full width at half maximum (mm/s), NaN if not given
 * @property {number} area        Relative area (%), NaN if not given
 * @property {string} fitModel    Model the paper fitted with ("Lorentzian", "VBF", "xVBF") or ""
 * @property {Object<string,string>} raw  Original text of each parameter, for display
 *
 * @typedef {Object} Spectrum
 * @property {string} id            Unique spectrum id
 * @property {string} sample        Mineral name as given in the source
 * @property {string} mineralClass  Mineral class, e.g. "Phyllosilicate"
 * @property {number} temperatureK  Measurement temperature (K), NaN if not given
 * @property {{doi: string, url: string, title: string, authors: string, journal: string, year: string}} reference
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

const FIT_MODELS = { lor: "Lorentzian", vbf: "VBF", xvbf: "xVBF" };

function siteFromRow(row, index) {
  // This table gives no linewidths, areas or distribution widths, so those stay
  // missing and the simulation uses its defaults
  const raw = { IS: row.IS, QS: row.QS, Bhf: row.Bhf, sigmaQS: "", sigmaBhf: "", fwhm: "", area: "" };
  return {
    name: toText(row.site) ? `Site ${toText(row.site)}` : String.fromCharCode(65 + index),
    oxidation: toText(row.oxidation_state),
    IS: toNumber(row.IS),
    QS: toNumber(row.QS),
    Bhf: toNumber(row.Bhf),
    ISError: toNumber(row.IS_error),
    QSError: toNumber(row.QS_error),
    BhfError: toNumber(row.Bhf_error),
    sigmaQS: NaN,
    sigmaBhf: NaN,
    fwhm: NaN,
    area: NaN,
    fitModel: FIT_MODELS[toText(row.fit_model).toLowerCase()] || "",
    raw
  };
}

/** Group site rows into spectra (one per spectrum_id), keeping their order. */
export function spectraFromRows(rows) {
  const groups = new Map();
  rows.forEach(r => {
    const id = (r.spectrum_id || "").trim();
    if (!id) return;
    if (!groups.has(id)) groups.set(id, []);
    groups.get(id).push(r);
  });

  return [...groups].map(([id, siteRows]) => {
    const first = siteRows[0];
    return {
      id,
      sample: toText(first.mineral),
      mineralClass: toText(first.mineral_class),
      temperatureK: toNumber(first.temperature_K),
      reference: {
        doi: toText(first.doi),
        url: toText(first.url),
        title: toText(first.title),
        authors: toText(first.authors),
        journal: toText(first.journal),
        year: toText(first.year)
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
