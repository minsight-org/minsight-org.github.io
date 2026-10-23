// Text search, parameter filters and sorting over spectrum records.

/** Lower case without accents, so "mossbauer" finds "Mössbauer". */
export function fold(text) {
  return String(text ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

/** Precompute the text each spectrum is searched by. */
export function indexSpectra(spectra) {
  spectra.forEach(s => {
    s.searchText = fold([
      s.sample,
      s.material,
      s.treatment,
      ...s.sites.map(site => `${site.name} ${site.component}`),
      s.reference.title,
      s.reference.authors,
      s.reference.journal,
      s.reference.doi
    ].join(" "));
  });
}

/** Parameter filters: each is [min, max] with NaN for an open end. */
export const FILTERS = [
  { key: "t", label: "Temperature", unit: "K", field: "temperatureK", level: "spectrum" },
  { key: "is", label: "IS", unit: "mm/s", field: "IS", level: "site" },
  { key: "qs", label: "QS", unit: "mm/s", field: "QS", level: "site" },
  { key: "bhf", label: "Bhf", unit: "T", field: "Bhf", level: "site" }
];

function inRange(value, [min, max]) {
  if (!Number.isFinite(value)) return false;
  if (Number.isFinite(min) && value < min) return false;
  if (Number.isFinite(max) && value > max) return false;
  return true;
}

function isActive(range) {
  return range && (Number.isFinite(range[0]) || Number.isFinite(range[1]));
}

export function hasActiveFilters(ranges) {
  return FILTERS.some(f => isActive(ranges[f.key]));
}

/**
 * Spectra matching every word of the query and all active ranges.
 * Site ranges must all hold for the same site. Each result carries the
 * indices of the sites that matched, so the detail view can point them out.
 * @returns {{spectrum: Object, matchedSites: number[]}[]}
 */
export function search(spectra, query, ranges) {
  const terms = fold(query).split(/\s+/).filter(Boolean);
  const siteFilters = FILTERS.filter(f => f.level === "site" && isActive(ranges[f.key]));
  const spectrumFilters = FILTERS.filter(f => f.level === "spectrum" && isActive(ranges[f.key]));

  const results = [];

  spectra.forEach(spectrum => {
    if (!terms.every(t => spectrum.searchText.includes(t))) return;
    if (!spectrumFilters.every(f => inRange(spectrum[f.field], ranges[f.key]))) return;

    const matchedSites = [];
    spectrum.sites.forEach((site, i) => {
      if (siteFilters.every(f => inRange(site[f.field], ranges[f.key]))) matchedSites.push(i);
    });
    if (siteFilters.length && !matchedSites.length) return;

    results.push({ spectrum, matchedSites: siteFilters.length ? matchedSites : [] });
  });

  return results;
}

const byText = (a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });

// Missing values always go last, whichever way the list is sorted
function byNumber(a, b, direction) {
  const fa = Number.isFinite(a);
  const fb = Number.isFinite(b);
  if (!fa || !fb) return fa === fb ? 0 : fa ? -1 : 1;
  return (a - b) * direction;
}

export const SORTS = {
  sample: { label: "Sample (A to Z)", compare: (a, b) => byText(displayName(a), displayName(b)) },
  temperature: { label: "Temperature (low to high)", compare: (a, b) => byNumber(a.temperatureK, b.temperatureK, 1) },
  newest: { label: "Year (newest first)", compare: (a, b) => byNumber(Number(a.reference.year), Number(b.reference.year), -1) }
};

export function sortResults(results, sortKey) {
  const sort = SORTS[sortKey] || SORTS.sample;
  return [...results].sort((a, b) => sort.compare(a.spectrum, b.spectrum) || byText(a.spectrum.id, b.spectrum.id));
}

/** The name shown for a spectrum (some papers leave the sample name blank). */
export function displayName(spectrum) {
  return spectrum.sample || spectrum.material || "Unnamed sample";
}

/**
 * Autocomplete suggestions: mineral profiles, sample names and materials that
 * contain the query, those starting with it first.
 */
export function suggestions(spectra, profiles, query, limit = 8) {
  const q = fold(query.trim());
  if (q.length < 2) return [];

  const seen = new Map();
  const add = text => {
    const t = String(text || "").trim();
    if (t && !seen.has(fold(t))) seen.set(fold(t), t);
  };
  profiles.forEach(p => add(p.mineral));
  spectra.forEach(s => {
    add(s.sample);
    add(s.material);
  });

  const matches = [...seen].filter(([key]) => key.includes(q));
  matches.sort(([a], [b]) => (b.startsWith(q) - a.startsWith(q)) || a.length - b.length);
  return matches.slice(0, limit).map(([, text]) => text);
}
