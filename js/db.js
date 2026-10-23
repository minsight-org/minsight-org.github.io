// import { lorentzian, voigtApprox } from "/js/lineshapes.js";

const ACCEPTED_COLUMNS = [
  "sample",
  // "class",
  "is",
  "qs",
  "bhf",
  "reference",
  "temp",
  "ReferenceID"
];

let data = [];
let headers = [];
let samples = [];
let references = {};
let mineralProfiles = [];
let currentSort = {
  column: null,
  direction: "asc"  // "asc" | "desc"
};

const HIDE_ERROR_COLUMNS = true;
const filtersPanel = document.getElementById("filters-panel");
const toggleFiltersBtn = document.getElementById("toggle-filters");

function isHiddenColumn(header) {
  const normalized = normalizeHeader(header);
  return !ACCEPTED_COLUMNS.includes(normalized);
}
const LINK_COLUMN_NAMES = ["reference", "link", "url"];

function isLinkColumn(header) {
  return LINK_COLUMN_NAMES.includes(header.toLowerCase());
}
// function runSearch() {
//   const query = searchInput.value.trim();
//   filterTable(query);
// }
function runSearch() {
  const query = searchInput.value.trim();

  // ✅ Transition to active layout
  if (query) {
    document.body.classList.remove("search-centered");
    document.body.classList.add("search-active");
    dockSearchInNavbar();
  }

  // ✅ ALWAYS clear autocomplete on search commit
  autocomplete.innerHTML = "";

  filterTable(query);
}


function clearSearch() {
  searchInput.value = "";
  committedQuery = "";

  undockSearchFromNavbar();            // ✅ critical

  document.body.classList.remove("search-active");
  document.body.classList.add("search-centered");

  
  autocomplete.innerHTML = "";
  
  filterTable("");

  document.getElementById("result-count").style.display = "none";
  document.getElementById("no-results").style.display = "none";
  document.getElementById("results").classList.remove("visible");

  clearBtn.style.display = "none";
}



function passesRange(value, min, max) {
  if (value == null || value === "") return false;

  const v = parseFloat(value);
  if (isNaN(v)) return false;

  if (min !== "" && !isNaN(min) && v < min) return false;
  if (max !== "" && !isNaN(max) && v > max) return false;

  return true;
}


let searchDockedInNavbar = false;

function dockSearchInNavbar() {
  if (searchDockedInNavbar) return;

  const searchBlock = document.getElementById("search-block");
  const searchSlot = document.getElementById("navbar-search-slot");
  const filtersSlot = document.getElementById("navbar-filters-slot");
  const filtersBtn = document.getElementById("toggle-filters");

  if (!searchBlock || !searchSlot) return;

  // Move search into navbar
  searchSlot.appendChild(searchBlock);

  // Move filters button next to search (if slot exists)
  if (filtersBtn && filtersSlot) {
    filtersSlot.appendChild(filtersBtn);
  }

  document.body.classList.add("search-in-navbar");
  searchDockedInNavbar = true;
}
function undockSearchFromNavbar() {
  if (!searchDockedInNavbar) return;

  const searchBlock = document.getElementById("search-block");
  const filtersToggle = document.getElementById("toggle-filters");
  const searchWrapper = document.getElementById("search-wrapper");

  if (!searchBlock || !searchWrapper) return;

  // Put search back where it started
  searchWrapper.insertBefore(searchBlock, searchWrapper.firstChild);

  // Put filters toggle directly after the search (landing layout)
  if (filtersToggle) {
    searchWrapper.appendChild(filtersToggle);
  }

  document.body.classList.remove("search-in-navbar");
  searchDockedInNavbar = false;
}

/* ---------- CSV parsing ---------- */

function parseCSV(text) {
  const lines = text.trim().split("\n");
  headers = lines[0].split(",").map(h => h.trim());

  return lines.slice(1).map(line => {
    const values = line.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/);
    const row = {};
    headers.forEach((h, i) => {
      row[h] = (values[i] || "").replace(/^"|"$/g, "");
    });
    return row;
  });
}


/* ---------- Filter chips helper ---------- */

toggleFiltersBtn.addEventListener("click", e => {
  e.stopPropagation(); // prevent document click handler

  const isOpen = filtersPanel.classList.toggle("open");
  toggleFiltersBtn.classList.toggle("open", isOpen);

  const caret = toggleFiltersBtn.querySelector(".hf-caret");
  if (caret) {
    caret.textContent = isOpen ? "▴" : "▾";
  }
});

    function updateFilterChips() {
    const container = document.getElementById("active-filters");
    container.innerHTML = "";

    const filters = [
      ["Temperature_K", "temp"],
      ["Isomer_Shift_mm_s", "is"],
      ["Quadrupole_Splitting_mm_s", "qs"],
      ["Hyperfine_Field_T", "bhf"]
    ];

    filters.forEach(([label, id]) => {
      const min = document.getElementById(`${id}-min`).value;
      const max = document.getElementById(`${id}-max`).value;

      if (min || max) {
        const chip = document.createElement("div");
        chip.className = "filter-chip";

        const text = document.createElement("span");
        text.textContent =
          `${label.split(" ")[0]}: ${min || "–"}–${max || "–"} ${label.match(/\[.*\]/)?.[0] || ""}`;

        const close = document.createElement("button");
        close.textContent = "✕";
        close.title = "Remove filter";
        close.onclick = () => {
          document.getElementById(`${id}-min`).value = "";
          document.getElementById(`${id}-max`).value = "";
          filterTable(document.getElementById("search").value.trim());
        };

        chip.appendChild(text);
        chip.appendChild(close);
        container.appendChild(chip);
      }
    });
  }

    /* ---------- Highlight helper ---------- */

    function highlight(text, query) {
      if (!query) return text;
      const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`(${escaped})`, "gi");
      return text.replace(regex, "<span class='highlight'>$1</span>");
    }


    function sortRows(rows, column, direction) {
      const dir = direction === "asc" ? 1 : -1;

      return [...rows].sort((a, b) => {
        const va = a[column];
        const vb = b[column];

        // Handle empty values
        if (!va && !vb) return 0;
        if (!va) return 1;
        if (!vb) return -1;

        // Numeric comparison if possible
        const na = parseFloat(va);
        const nb = parseFloat(vb);

        if (!isNaN(na) && !isNaN(nb)) {
          return (na - nb) * dir;
        }

        // String comparison fallback
        return va.localeCompare(vb, undefined, {
          numeric: true,
          sensitivity: "base"
        }) * dir;
      });
    }

    // function normalizeHeader(header) {
    //   return header
    //     .toLowerCase()
    //     .replace(/\[.*?\]/g, "")  // remove units like [mm/s]
    //     .trim();
    // }

    function normalizeHeader(header) {
      const h = header.toLowerCase().trim();

      if (h === "isomer_shift_mm_s") return "is";
      if (h === "quadrupole_splitting_mm_s") return "qs";
      if (h === "hyperfine_field_t") return "bhf";
      if (h === "relative_area_percent") return "ra";
      if (h === "cr_title") return "title";
      if (h === "linewidth_mm_s") return "linewidth_mm_s";

      return h.replace(/\[.*?\]/g, "").trim();
    }

    function getValue(row, key) {
      const normKey = key.toLowerCase();

      for (const h in row) {
        const n = normalizeHeader(h);
        if (n === normKey) {
          const v = row[h];
          if (v === null || v === undefined || v === "") return NaN;
          return parseFloat(v);
        }
      }
      return NaN;
    }

    // function getValue(row, key) {
    //   const normKey = key.toLowerCase();

    //   for (const h in row) {
    //     const n = normalizeHeader(h);

    //     if (n === normKey) {
    //       const v = row[h];

    //       if (v === null || v === undefined || v === "") {
    //         return normKey === "qs" ? 0.0 : NaN;
    //       }

    //       return parseFloat(v);
    //     }
    //   }

    //   return normKey === "qs" ? 0.0 : NaN;
    // }
    


/* ---------- Build Mossbauer spectrum  ---------- */
// const DEFAULT_HWHM = 0.097; // mm/s
const DEFAULT_FWHM = 0.194;
const DEFAULT_HWHM = DEFAULT_FWHM / 2;

const SITE_AREA = 1; // arbitrary absolute scale

function buildSpectrum({
  IS,
  QS,
  Bhf,
  type,
  HWHM,
  weight = 1,
  model,
  sigma_qs,
  sigma_bhf
}) {
  const x = velocityAxis(-12, 12, 512);
  const y = Array(x.length).fill(0);

  const gamma = Number.isFinite(HWHM) ? HWHM * 2 : DEFAULT_HWHM * 2;

  let peaks = [];
  let intensities = [];

  if (type === "Db") {
    peaks = [IS - QS / 2, IS + QS / 2];
    intensities = [1, 1];
  }

  if (type === "Sx") {
    const Z = 1.7509;
    const z = 0.067897 * Bhf;
    peaks = [
      IS - (Z + 3) * z / 2 + QS,
      IS - (Z + 1) * z / 2 - QS,
      IS - (Z - 1) * z / 2 - QS,
      IS + (Z - 1) * z / 2 - QS,
      IS + (Z + 1) * z / 2 - QS,
      IS + (Z + 3) * z / 2 + QS
    ];
    intensities = [3, 2, 1, 1, 2, 3];
  }

  const norm = intensities.reduce((a, b) => a + b, 0);

  peaks.forEach((p, idx) => {
    const lineArea = weight * (intensities[idx] / norm);

    // ✅ Default Lorentzian
    for (let i = 0; i < x.length; i++) {
      y[i] -= lineArea * lorentzian(x[i], gamma / 2, p);
      
    }
  });

  return { x, y };
}




/* ---------- lorentzian handler ---------- */
function lorentzian(x, w, x0) {
  return (1 / Math.PI) * (w / ((x - x0) ** 2 + w ** 2));
}

const SQRT2 = Math.sqrt(2);
const SQRT2PI = Math.sqrt(2 * Math.PI);

function VBF(phi, gamma, w0, sigma_in, h) {
  const ak = [-1.2150, -1.3509, -1.2150, -1.3509];
  const bk = [1.2359, 0.3786, -1.2359, -0.3786];
  const gk = [-0.3085, 0.5906, -0.3085, 0.5906];
  const dk = [0.0210, -1.1858, -0.0210, 1.1858];

  const sigma = 0.5 * (sigma_in === 0 ? 1e-5 : sigma_in);
  const w = gamma * 0.5;

  const x = (phi - w0) / (sigma * SQRT2);
  const y = gamma / (sigma * 2 * SQRT2);

  let ksum = 0;
  for (let i = 0; i < 4; i++) {
    const dy = y - ak[i];
    const dx = x - bk[i];
    ksum += (gk[i] * dy + dk[i] * dx) / (dy * dy + dx * dx);
  }

  const Voigt_const =
    (Math.PI * h * w) /
    (2 * SQRT2PI * sigma);

  return -Voigt_const * ksum;
}

// function VBF_spectrum(x, params, spec_type, components) {
//   const bkgd = params[0];
//   const HWHM = params[1];
//   const gamma = 2 * HWHM;

//   let y = new Array(x.length).fill(0);

//   let idxList = [2];

//   for (let i = 1; i < spec_type.length; i++) {
//     if (spec_type[i - 1] === "Db") {
//       idxList.push(idxList[i - 1] + 5 + 3 * (components[i - 1] - 1));
//     } else {
//       idxList.push(idxList[i - 1] + 7 + 3 * (components[i - 1] - 1));
//     }
//   }

//   for (let i = 0; i < idxList.length; i++) {
//     let base = idxList[i];

//     if (spec_type[i] === "Db") {

//       const area = params[base];
//       const Aminus_Aplus = params[base + 1];
//       const centre = params[base + 2];
//       const QS0 = params[base + 3];
//       let sigmaQS0 = params[base + 4];

//       if (sigmaQS0 === 0) sigmaQS0 = 1e-5;

//       let p0 = 1.0;
//       for (let j = 1; j < components[i]; j++) {
//         p0 -= params[base + 5 + j * 3 - 1];
//       }

//       const area_eff = (0.5 * area * Aminus_Aplus + 0.5 * area);
//       const h = area_eff / (Math.PI * (gamma));

//       for (let k = 0; k < x.length; k++) {
//         y[k] += p0 * (
//           VBF(x[k], gamma, centre - 0.5 * QS0, sigmaQS0, h) +
//           VBF(x[k], gamma, centre + 0.5 * QS0, sigmaQS0, h)
//         );
//       }

//       for (let j = 1; j < components[i]; j++) {
//         const QS = params[base + 3 + j * 3 - 1];
//         let sigmaQS = params[base + 4 + j * 3 - 1];
//         const p = params[base + 5 + j * 3 - 1];

//         if (sigmaQS === 0) sigmaQS = 1e-5;

//         if (p > 0) {
//           for (let k = 0; k < x.length; k++) {
//             y[k] += p * (
//               VBF(x[k], gamma, centre - 0.5 * QS, sigmaQS, h) +
//               VBF(x[k], gamma, centre + 0.5 * QS, sigmaQS, h)
//             );
//           }
//         }
//       }

//     } else if (spec_type[i] === "Sx") {

//       const area = params[base];
//       const a1a3 = params[base + 1];
//       const a2a3 = params[base + 2];
//       const centre = params[base + 3];
//       const Q = params[base + 4];
//       const H0 = params[base + 5];
//       let sigmaH0 = params[base + 6];

//       if (sigmaH0 === 0) sigmaH0 = 1e-5;

//       const Z = 1.7509;
//       const z0 = 0.067897 * H0;
//       sigmaH0 = 0.067897 * sigmaH0;

//       let p0 = 1.0;
//       for (let j = 1; j < components[i]; j++) {
//         p0 -= params[base + 7 + j * 3 - 1];
//       }

//       const area_eff = area / (a1a3 + a2a3 + 1) / 0.5;
//       const h = area_eff / (Math.PI * gamma);

//       const f = [Z + 3, Z + 1, Z - 1, Z - 1, Z + 1, Z + 3];
//       const amps = [a1a3, a2a3, 1, 1, a2a3, a1a3];
//       const shifts = [
//         +Q, -Q, -Q, -Q, -Q, +Q
//       ];

//       for (let k = 0; k < x.length; k++) {

//         y[k] += p0 * (
//           VBF(x[k], gamma, centre - f[0] * z0 / 2 + shifts[0], f[0] * sigmaH0, amps[0] * h) +
//           VBF(x[k], gamma, centre - f[1] * z0 / 2 + shifts[1], f[1] * sigmaH0, amps[1] * h) +
//           VBF(x[k], gamma, centre - f[2] * z0 / 2 + shifts[2], f[2] * sigmaH0, amps[2] * h) +
//           VBF(x[k], gamma, centre + f[3] * z0 / 2 + shifts[3], f[3] * sigmaH0, amps[3] * h) +
//           VBF(x[k], gamma, centre + f[4] * z0 / 2 + shifts[4], f[4] * sigmaH0, amps[4] * h) +
//           VBF(x[k], gamma, centre + f[5] * z0 / 2 + shifts[5], f[5] * sigmaH0, amps[5] * h)
//         );

//       }

//       // additional components
//       for (let j = 1; j < components[i]; j++) {

//         const H = params[base + 5 + j * 3 - 1];
//         let sigmaH = params[base + 6 + j * 3 - 1];
//         const p = params[base + 7 + j * 3 - 1];

//         if (sigmaH === 0) sigmaH = 1e-5;

//         const z = 0.067897 * H;
//         sigmaH = 0.067897 * sigmaH * 2;

//         if (p > 0) {
//           for (let k = 0; k < x.length; k++) {
//             y[k] += p * (
//               VBF(x[k], gamma, centre - f[0] * z / 2 + shifts[0], f[0] * sigmaH / 2, amps[0] * h) +
//               VBF(x[k], gamma, centre - f[1] * z / 2 + shifts[1], f[1] * sigmaH / 2, amps[1] * h) +
//               VBF(x[k], gamma, centre - f[2] * z / 2 + shifts[2], f[2] * sigmaH / 2, amps[2] * h) +
//               VBF(x[k], gamma, centre + f[3] * z / 2 + shifts[3], f[3] * sigmaH / 2, amps[3] * h) +
//               VBF(x[k], gamma, centre + f[4] * z / 2 + shifts[4], f[4] * sigmaH / 2, amps[4] * h) +
//               VBF(x[k], gamma, centre + f[5] * z / 2 + shifts[5], f[5] * sigmaH / 2, amps[5] * h)
//             );
//           }
//         }
//       }
//     }
//   }

//   return y.map(v => v + bkgd);
// }

// function VBF(phi, gamma, w0, sigma, h) {
//   /*
//     Numerical approximation of a Voigt-based peak.

//     Parameters:
//       phi   : predictor variable
//       gamma : Lorentzian broadening
//       w0    : peak center
//       sigma : Gaussian width parameter
//       h     : peak height
//   */

//   // Numerical coefficients
//   const ak = [-1.2150, -1.3509, -1.2150, -1.3509];
//   const bk = [ 1.2359,  0.3786, -1.2359, -0.3786];
//   const gk = [-0.3085,  0.5906, -0.3085,  0.5906];
//   const dk = [ 0.0210, -1.1858, -0.0210,  1.1858];

//   // Match original scaling
//   sigma = 0.5 * sigma;
//   const w = 0.5 * gamma;

//   const sqrt2 = Math.sqrt(2);

//   // Dimensionless variables
//   const x = (phi - w0) / (sigma * sqrt2);
//   const y = gamma / (sigma * 2 * sqrt2);

//   // Kernel sum
//   let ksum = 0;
//   for (let i = 0; i < 4; i++) {
//     const dy = y - ak[i];
//     const dx = x - bk[i];
//     ksum += (gk[i] * dy + dk[i] * dx) / (dy * dy + dx * dx);
//   }

//   // Voigt prefactor
//   const VoigtConst =
//     (Math.PI * h * w) / (2 * Math.sqrt(2 * Math.PI) * sigma);

//   return -VoigtConst * ksum;
// }


function velocityAxis(vmin = -12, vmax = 12, n = 512) {
  const x = [];
  const step = (vmax - vmin) / (n - 1);
  for (let i = 0; i < n; i++) {
    x.push(vmin + i * step);
  }
  return x;
}

function doubletPositions(IS, QS) {
  return [
    IS - QS / 2,
    IS + QS / 2
  ];
}

function sextetPositions(IS, QS, Bhf) {
  const Z = 1.7509;
  const z = 0.067897 * Bhf;

  return [
    IS - (Z + 3) * z / 2 + QS,
    IS - (Z + 1) * z / 2 - QS,
    IS - (Z - 1) * z / 2 - QS,
    IS + (Z - 1) * z / 2 - QS,
    IS + (Z + 1) * z / 2 - QS,
    IS + (Z + 3) * z / 2 + QS
  ];
}

  


function createMetadataBlock(row) {
  const box = document.createElement("div");
  box.className = "detail-metadata";


  const title = document.createElement("div");
  title.className = "metadata-title";
  title.textContent = row.cr_title || row.Sample || "Unknown reference";
  box.appendChild(title);


  if (row.cr_authors) {
    const authors = document.createElement("div");
    authors.className = "metadata-authors";
    authors.textContent = row.cr_authors;
    box.appendChild(authors);
  }

  const details = [];
  if (row.cr_year) details.push(String(row.cr_year));
  if (row["Publication type"]) details.push(row["Publication type"]);
  if (row["Journal"]) details.push(row["Journal"]);

  if (details.length) {
    const pub = document.createElement("div");
    pub.className = "metadata-journal";
    pub.textContent = details.join(" • ");
    box.appendChild(pub);
  }

  if (row.doi || row.URL) {
    const link = document.createElement("a");
    link.className = "metadata-link";
    link.href = row.URL || `https://doi.org/${row.doi}`;
    link.target = "_blank";
    link.rel = "noopener";
    link.textContent = row.doi ? `DOI: ${row.doi}` : "View publication";
    box.appendChild(link);
  }


  
  // ---------- Model pill ----------
  const sites = getSitesForSpectrum(row);

  const hasVBF = sites.some(
    s => String(s.Model || s.model || "").toLowerCase() === "vbf"
  );

  const modelPill = document.createElement("span");
  modelPill.className = "model-pill";
  modelPill.textContent = hasVBF ? "VBF" : "Lorentzian";
  modelPill.classList.add(hasVBF ? "model-vbf" : "model-lorentz");

  box.appendChild(modelPill);

  return box;
}

function computeSiteWeights(sites) {
  // Try to read RA [%] from CSV
  const ras = sites.map(s => getValue(s, "ra"));

  const hasAnyRA = ras.some(v => Number.isFinite(v) && v > 0);

  if (hasAnyRA) {
    // ✅ Use provided RA values, renormalised
    const sum = ras.reduce((a, v) => a + (Number.isFinite(v) ? v : 0), 0);

    return ras.map(v =>
      Number.isFinite(v) && sum > 0 ? v / sum : 0
    );
  }

  // ✅ No RA provided → fallback
  const n = sites.length;
  if (n <= 1) return [1];

  return Array(n).fill(1 / n);
}

function buildVBFSite(site, weight = 1) {
  const x = velocityAxis(-12, 12, 512);

  // const IS = getValue(site, "is");
  const IS_raw = getValue(site, "is");
  const IS = Number.isFinite(IS_raw) ? IS_raw : 0.0;
  // const QS = getValue(site, "qs");
  const QS_raw = getValue(site, "qs");
  const QS = Number.isFinite(QS_raw) ? QS_raw : 0.0;
  
  const Bhf = getValue(site, "bhf");

  const sigma_qs = getValue(site, "sigma_qs");
  const sigma_bhf = getValue(site, "sigma_bhf");

  const linewidth_raw = getValue(site, "linewidth_mm_s");
  const HWHM = Number.isFinite(linewidth_raw)
    ? linewidth_raw / 2
    : DEFAULT_HWHM;

  const gamma = 2 * HWHM;
  // const HWHM_raw = getValue(site, "hwhm");
  // const HWHM = Number.isFinite(HWHM_raw) ? HWHM_raw : DEFAULT_HWHM;

  // const gamma = 2 * HWHM;

  let y = new Array(x.length).fill(0);

  // ---- DOUBLETS ----
  if (!Number.isFinite(Bhf) || Math.abs(Bhf) <= 0) {
      const sigma = Number.isFinite(sigma_qs) && sigma_qs > 0
      ? sigma_qs
      : 1e-5;

    const Aminus_Aplus = 1; // default to symmetric doublet if not specified
    const area = (0.5*weight*Aminus_Aplus + 0.5*weight);
    const h = area / (Math.PI * gamma);

    for (let i = 0; i < x.length; i++) {
      y[i] +=
        VBF(x[i], gamma, IS - QS / 2, sigma, h) +
        VBF(x[i], gamma, IS + QS / 2, sigma, h);
    }
  }

  // ---- SEXTETS ----
  if (Number.isFinite(Bhf) && Math.abs(Bhf) > 0) {
    const Z = 1.7509;
    const z = 0.067897 * Bhf;

    let sigmaH = Number.isFinite(sigma_bhf) && sigma_bhf > 0
      ? sigma_bhf
      : 1e-5;

    sigmaH = 0.067897 * sigmaH; // convert to velocity
    // sigmaH = 0.067897 * sigmaH * 2; // convert to velocity

    const f = [Z + 3, Z + 1, Z - 1, Z - 1, Z + 1, Z + 3];
    const amps = [3, 2, 1, 1, 2, 3];
    const shifts = [+QS, -QS, -QS, -QS, -QS, +QS];

    const norm = amps.reduce((a, b) => a + b, 0);
    // const h = weight / (Math.PI * gamma);
    // const h = weight / (Math.PI * gamma) * (gamma / (gamma + sigmaH));
    const area = weight/(3 + 2 + 1)/0.5;
    const h = area / (Math.PI * gamma);
    // const h = weight
    
    for (let k = 0; k < x.length; k++) {
      for (let j = 0; j < 6; j++) {
        y[k] +=
          // (amps[j] / norm) *
          VBF(
            x[k],
            gamma,
            IS + (j < 3 ? -1 : 1) * f[j] * z / 2 + shifts[j],
            Math.abs(sigmaH) * f[j],
            amps[j] * h
          );
      }
    }
  }

  return { x, y };
}


function renderTable(rows, query = "") {
  const table = document.getElementById("results");
  table.innerHTML = "";

  const visibleHeaders = headers.filter(h => !isHiddenColumn(h));

  /* ---------- Header ---------- */
  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");

  visibleHeaders.forEach(h => {
    const th = document.createElement("th");
    th.textContent = h;
    th.style.cursor = "pointer";

    if (currentSort.column === h) {
      th.textContent += currentSort.direction === "asc" ? " ▲" : " ▼";
    }

    th.addEventListener("click", () => {
      if (currentSort.column === h) {
        currentSort.direction =
          currentSort.direction === "asc" ? "desc" : "asc";
      } else {
        currentSort.column = h;
        currentSort.direction = "asc";
      }
      filterTable(document.getElementById("search").value.trim());
    });

    headerRow.appendChild(th);
  });

  thead.appendChild(headerRow);
  table.appendChild(thead);

  /* ---------- Body ---------- */
  const tbody = document.createElement("tbody");


  rows.forEach(row => {
    /* ========== Main data row ========== */
    const tr = document.createElement("tr");
    tr.className = "data-row";

    /* ========== Detail row (collapsed) ========== */
    const detailTr = document.createElement("tr");
    detailTr.className = "detail-row";

    const detailTd = document.createElement("td");
    detailTd.colSpan = visibleHeaders.length;
    detailTd.className = "detail-cell";
    detailTr.appendChild(detailTd);

    /* ---------- Click → expand / collapse ---------- */
    tr.addEventListener("click", () => {
    const isOpen = detailTr.classList.contains("open");

    // ✅ Close OTHER open rows only
    document.querySelectorAll(".detail-row.open")
      .forEach(r => {
        if (r !== detailTr) r.classList.remove("open");
      });

    document.querySelectorAll("#results tr.selected")
      .forEach(r => {
        if (r !== tr) r.classList.remove("selected");
      });

    if (!isOpen) {
      detailTd.innerHTML = "";
      detailTd.appendChild(createDetailCard(row));
      detailTr.classList.add("open");
      tr.classList.add("selected");
    }
  });

    /* ---------- Cells ---------- */
    visibleHeaders.forEach(h => {
      const td = document.createElement("td");

      if (h === "Sample") {
        td.innerHTML = highlight(row[h] || "", query);

      } else if (isLinkColumn(h)) {
        const ref = getReference(row);
        if (ref && ref.URL) {
          const a = document.createElement("a");
          a.href = ref.URL;
          a.target = "_blank";
          a.textContent = "🔗";
          a.title = ref.DOI || "View publication";
          a.addEventListener("click", e => e.stopPropagation());
          td.appendChild(a);
        }

      } else {
        td.textContent = row[h];
      }

      tr.appendChild(td);
    });

    tbody.appendChild(tr);

    

    
    tbody.appendChild(detailTr);
  });

  table.appendChild(tbody);
}


// Error function approximation (Abramowitz & Stegun formula)
function erf(x) {
  const sign = x >= 0 ? 1 : -1;
  x = Math.abs(x);

  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const t = 1 / (1 + p * x);
  const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

  return sign * y;
}

// Mean of folded Gaussian
function meanFoldedGaussian(mu, sigma) {
  const term1 = sigma * Math.sqrt(2 / Math.PI) * Math.exp(-(mu ** 2) / (2 * sigma ** 2));
  const term2 = mu * erf(mu / Math.sqrt(2 * sigma ** 2));
  return term1 + term2;
}

// Standard deviation of folded Gaussian
function stdFoldedGaussian(mu, sigma, muFolded) {
  return Math.sqrt(Math.abs(mu ** 2 + sigma ** 2 - muFolded ** 2));
}





function createDetailCard(row) {
  const wrapper = document.createElement("div");
  // wrapper.className = "detail-card";
  wrapper.className = "detail-card detail-content";

  // ---------- Model pill ----------
  const modelPill = document.createElement("span");
  modelPill.className = "model-pill";
  /* ---------- Mini spectrum container ---------- */
  const spectrumBox = document.createElement("div");
  spectrumBox.className = "detail-spectrum";

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  spectrumBox.appendChild(svg);

  /* ---------- Collect sites (by sample_id) ---------- */
  const sites = getSitesForSpectrum(row);
  const showSigmaQS = sites.some(
    s => String(s.Model || s.model || "").toLowerCase() === "vbf"
  );
  const showSigmaBhf = sites.some(s => {
    const model = String(s.Model || s.model || "").toLowerCase();
    const bhf = getValue(s, "bhf");
    return model === "vbf" && Number.isFinite(bhf) && bhf > 0;
  });
  const hasVBF = sites.some(
    s => String(s.Model || s.model || "").toLowerCase() === "vbf"
  );

  modelPill.textContent = hasVBF ? "Voigt (VBF)" : "Lorentzian";
  modelPill.classList.add(hasVBF ? "model-vbf" : "model-lorentz");

  /* ---------- Build individual spectra ---------- */
  const spectra = [];
  const weights = computeSiteWeights(sites);
  const rawRA = sites.map(s => getValue(s, "ra"));
  const hasAnyRA = rawRA.some(v => Number.isFinite(v) && v > 0);

  sites.forEach((site, i) => {
    const model = String(site.Model ?? site.model ?? "").toLowerCase();

    if (model === "vbf") {
      spectra.push(buildVBFSite(site, weights[i]));
    } else {

      const IS_raw = getValue(site, "is");
      const QS_raw = getValue(site, "qs");

      spectra.push(
        buildSpectrum({
          IS: Number.isFinite(IS_raw) ? IS_raw : 0.0,
          QS: Number.isFinite(QS_raw) ? QS_raw : 0.0,
          Bhf: getValue(site, "bhf"),
          type: getValue(site, "bhf") > 0 ? "Sx" : "Db",
          HWHM: Number.isFinite(getValue(site, "linewidth_mm_s"))
            ? getValue(site, "linewidth_mm_s") / 2
            : undefined,
          weight: weights[i]
        })
      );
    }
  });


      /* ---------- Determine highlighted site ---------- */
      const selectedIndex = sites.findIndex(s =>
        s.sample_id === row.sample_id &&
        (s.Site ?? "") === (row.Site ?? "") &&
        String(s["Isomer_Shift_mm_s"] ?? "") === String(row["Isomer_Shift_mm_s"] ?? "")
      );

      const highlightIndex = selectedIndex >= 0 ? selectedIndex : 0;

      /* ---------- Render spectra ---------- */
      if (spectra.length > 0) {
        renderMultiSpectrumInto(svg, spectra, highlightIndex);
      }

      /* ---------- Sites table ---------- */
      const sitesBox = document.createElement("div");

      /* ---------- Metadata ---------- */
      sitesBox.appendChild(createMetadataBlock(row));

      const table = document.createElement("table");
      table.className = "sites-table";

      /* --- Caption --- */
      const caption = document.createElement("caption");
      caption.className = "sites-caption";

      const sampleName = row.Sample ?? "Unknown sample";
      const temp = row["Temperature_K"] ? `${row["Temperature_K"]} K` : "T unknown";

      // caption.textContent = `${sampleName} — ${temp}`;

      caption.textContent =
      `${row.Sample} — ${temp}`;
      
      table.appendChild(caption);

      /* --- Table header (UPDATED) --- */
      const thead = document.createElement("thead");
      thead.innerHTML = `
        <tr>
          <th>Sample</th>
          <th>Site</th>
          <th>IS (mm/s)</th>
          <th>QS (mm/s)</th>
          ${showSigmaQS ? "<th>σ(QS) (mm/s)</th>" : ""}
          <th>|Bhf| (T)</th>
          ${showSigmaBhf ? "<th><|σBhf (T)|</th>" : ""}
          <th>RA (%)</th>
          <th>FWHM (mm/s)</th>
        </tr>
      `;
      table.appendChild(thead);
      let hasApproximation = false;

      /* --- Table body --- */
      const tbody = document.createElement("tbody");

      if (sites.length === 0) {
        const tr = document.createElement("tr");
        tr.innerHTML = `<td colspan="7">No sites available</td>`;
        tbody.appendChild(tr);

      } else {


        sites.forEach((site, i) => {
          const tr = document.createElement("tr");
          tr.style.cursor = "pointer";

          if (i === highlightIndex) {
            tr.classList.add("site-selected");
          }

          const siteName =
            site.Site ||
            site.Sublattice ||
            String.fromCharCode(65 + i);

          const RA_value = hasAnyRA && Number.isFinite(rawRA[i])
            ? rawRA[i]
            : (weights[i] * 100);

          const RA_isApprox = !hasAnyRA;

          // --- HWHM handling (MUST come before the check) ---
          // const HWHM_raw = getValue(site, "hwhm");
          // const HWHM_value = Number.isFinite(HWHM_raw) ? HWHM_raw : DEFAULT_HWHM;
          // const HWHM_isApprox = !Number.isFinite(HWHM_raw);

          // --- FWHM handling ---
          const linewidth_raw = getValue(site, "linewidth_mm_s");
          const linewidth_value = Number.isFinite(linewidth_raw)
            ? linewidth_raw
            : DEFAULT_HWHM * 2; // convert default HWHM to FWHM

          const linewidth_isApprox = !Number.isFinite(linewidth_raw);



          
          const sigmaQS_raw = getValue(site, "sigma_qs");
          const sigmaQS_value = Number.isFinite(sigmaQS_raw)
            ? sigmaQS_raw.toFixed(3)
            : "—";
          const sigmaBhf_raw = getValue(site, "sigma_bhf");
          const sigmaBhf_value = Number.isFinite(sigmaBhf_raw)
            ? sigmaBhf_raw.toFixed(2)
            : "—";

          const QS_raw = getValue(site, "qs");
          const QS_value = Number.isFinite(QS_raw) ? QS_raw : 0.0;
          const QS_isApprox = !Number.isFinite(QS_raw);

          const IS_raw = getValue(site, "is");
          const IS_value = Number.isFinite(IS_raw) ? IS_raw : 0.0;
          const IS_isApprox = !Number.isFinite(IS_raw);

          
          // --- Approximation detection ---
          if (RA_isApprox || linewidth_isApprox || QS_isApprox || IS_isApprox) {
            hasApproximation = true;
          }
  
          
          tr.innerHTML = `
            <td>${site.Sample ?? "—"}</td>
            <td>${siteName}</td>
            <td>${IS_value.toFixed(3)}${IS_isApprox ? "*" : ""}</td>
            <td>${QS_value.toFixed(3)}${QS_isApprox ? "*" : ""}</td>
            ${showSigmaQS ? `<td>${sigmaQS_value}</td>` : ""}
            <td>${site["Hyperfine_Field_T"] ?? "—"}</td>
            ${showSigmaBhf ? `<td>${sigmaBhf_value}</td>` : ""}
            <td>${RA_value.toFixed(1)}${RA_isApprox ? "*" : ""}</td>
            <td>${linewidth_value.toFixed(3)}${linewidth_isApprox ? "*" : ""}</td>

          `;

          /* --- Click → highlight this site spectrum --- */
          tr.addEventListener("click", e => {
            e.stopPropagation();

            // Remove selection from all site rows
            tbody.querySelectorAll("tr").forEach(r =>
              r.classList.remove("site-selected")
            );

            // Highlight this one
            tr.classList.add("site-selected");

            // Update spectrum
            renderMultiSpectrumInto(svg, spectra, i);
          });

          tbody.appendChild(tr);

          
const model = String(site.Model ?? site.model ?? "").toLowerCase();

if (model === "vbf") {
  const compTr = document.createElement("tr");

  compTr.innerHTML = `
    <td colspan="${tr.children.length}">
      VBF: Bhf = ${getValue(site, "bhf")},
      VBF: sigma(Bhf) = ${getValue(site, "sigma_bhf")},
    </td>
  `;

  tbody.appendChild(compTr);
}
          
          
        });
      }

      table.appendChild(tbody);



      // ---------- Download link ----------
      const downloadLink = document.createElement("button");
      downloadLink.className = "spectrum-download-link";
      downloadLink.textContent = "⬇ Download simulated spectrum";
      
      downloadLink.addEventListener("click", e => {
        e.stopPropagation();

        try {
          // GoatCounter event: shows as download-spectrum/<sample id> in the dashboard
          if (window.goatcounter && typeof window.goatcounter.count === "function") {
            window.goatcounter.count({
              path: "download-spectrum/" + (row.sample_id || row.Sample),
              title: `${row.Sample} (${row["Temperature_K"]} K)`,
              event: true
            });
          }
        } catch (err) {
          // Analytics must never break downloads
          console.warn("GoatCounter tracking failed:", err);
        }

        downloadSpectrumTxt(row, sites);
      });

      const downloadRow = document.createElement("div");

      downloadRow.className = "spectrum-download-row";
      downloadRow.appendChild(downloadLink);

      const tableWrapper = document.createElement("div");

      /* ---------- Assemble card ---------- */
      tableWrapper.className = "sites-table-wrapper";
      tableWrapper.appendChild(table);
      
      // Add table wrapper
      sitesBox.appendChild(tableWrapper);

      if (hasApproximation) {
        const note = document.createElement("div");
        note.className = "sites-note";
        note.textContent =
          "* indicates reference parameter unavailable, default value applied.";

        // Insert directly below the table
        tableWrapper.appendChild(note);
      }


      // --- Download row (below legend) ---
      tableWrapper.appendChild(downloadRow);

      // Assemble card
      wrapper.appendChild(spectrumBox);
      wrapper.appendChild(sitesBox);

      return wrapper;
    }

    function getSitesForSpectrum(row) {

      return data.filter(r =>
        r.sample_id &&
        row.sample_id &&
        r.sample_id.trim() === row.sample_id.trim()
      );
    }


    function renderMultiSpectrumInto(svg, spectra, selectedIndex = -1) {
      while (svg.firstChild) svg.removeChild(svg.firstChild);

      if (!spectra || spectra.length === 0) return;

      const W = 320, H = 200, padding = 24;
      svg.setAttribute("width", W);
      svg.setAttribute("height", H);
      svg.setAttribute("viewBox", `0 0 ${W} ${H}`);

      const x = spectra[0].x;
      if (!x || x.length === 0) return;

      /* ---------- Build summed spectrum safely ---------- */
      const summedY = x.map((_, i) =>
        spectra.reduce((acc, s) => acc + (s.y?.[i] ?? 0), 0)
      );

      /* ---------- Collect all y values ---------- */
      const yAll = [
        ...spectra.flatMap(s => s.y ?? []),
        ...summedY
      ];

      let yAbsMax = Math.max(...yAll.map(v => Math.abs(v)).filter(Number.isFinite));
      if (!isFinite(yAbsMax) || yAbsMax === 0) yAbsMax = 1;

      const targetDepth = 0.95;
      const scaleY = targetDepth / yAbsMax;

      /* ---------- Coordinate transforms ---------- */
      const sx = v =>
        padding + (v - x[0]) / (x[x.length - 1] - x[0]) * (W - 2 * padding);

      const yMargin = 0.05; // 5% margin top and bottom

      const sy = v =>
        padding +
        (1 - ((v * scaleY + 1) / 2)) *
        (1 - 2 * yMargin) *
        (H - 2 * padding) +
        yMargin * (H - 2 * padding);


      /* ---------- X axis ---------- */

      const axisY = H - padding;

      // Axis line
      const xAxis = document.createElementNS("http://www.w3.org/2000/svg", "line");
      xAxis.setAttribute("x1", padding);
      xAxis.setAttribute("y1", axisY);
      xAxis.setAttribute("x2", W - padding);
      xAxis.setAttribute("y2", axisY);
      xAxis.setAttribute("stroke", "#444");
      xAxis.setAttribute("stroke-width", "1");
      svg.appendChild(xAxis);

      /* ---------- X ticks + labels ---------- */

      // Standard Mössbauer velocity ticks
      const ticks = [-12, -8, -4, 0, 4, 8, 12];

      ticks.forEach(v => {
        const xPos = sx(v);

        // Tick mark
        const tick = document.createElementNS("http://www.w3.org/2000/svg", "line");
        tick.setAttribute("x1", xPos);
        tick.setAttribute("y1", axisY);
        tick.setAttribute("x2", xPos);
        tick.setAttribute("y2", axisY + 5);
        tick.setAttribute("stroke", "#444");
        tick.setAttribute("stroke-width", "1");
        svg.appendChild(tick);

        // Tick label
        const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
        label.setAttribute("x", xPos);
        label.setAttribute("y", axisY + 16);
        label.setAttribute("text-anchor", "middle");
        label.setAttribute("font-size", "9");
        label.setAttribute("fill", "#333");
        label.textContent = v;
        svg.appendChild(label);
      });


      /* ---------- Axis label ---------- */

      const axisLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
      axisLabel.setAttribute("x", W / 2);
      axisLabel.setAttribute("y", H - 4);
      axisLabel.setAttribute("text-anchor", "middle");
      axisLabel.setAttribute("font-size", "10");
      axisLabel.setAttribute("fill", "#333");
      axisLabel.textContent = "Velocity (mm/s)";
      svg.appendChild(axisLabel);

      /* ---------- Draw individual site spectra ---------- */
      spectra.forEach((spec, i) => {
        if (!spec.y) return;

        let d = "";
        for (let j = 0; j < x.length; j++) {
          d += (j === 0 ? "M" : "L") +
              `${sx(x[j])} ${sy(spec.y[j] ?? 0)} `;
        }

        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("d", d);
        path.setAttribute("fill", "none");

        const isSelected = i === selectedIndex;
        path.setAttribute("stroke", isSelected ? "#D62828" : "#999");
        path.setAttribute("stroke-width", isSelected ? "1.5" : "1");
        path.setAttribute("opacity", isSelected ? "1" : "0.6");

        svg.appendChild(path);
      });

      /* ---------- Draw summed spectrum ---------- */
      let dSum = "";
      for (let i = 0; i < x.length; i++) {
        dSum += (i === 0 ? "M" : "L") +
                `${sx(x[i])} ${sy(summedY[i])} `;
      }

      const sumPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
      sumPath.setAttribute("d", dSum);
      sumPath.setAttribute("stroke", "#215F9A");
      sumPath.setAttribute("stroke-width", "1");
      sumPath.setAttribute("fill", "none");

      svg.appendChild(sumPath);
    }


function downloadSpectrumTxt(row, sites) {
  if (!sites || sites.length === 0) return;

  /* ---------- Metadata (FROM parameters_SECONDARY.csv) ---------- */
  const sample = row.Sample || "Unknown sample";
  const interpretation = row.Interpretation || "Unknown interpretation";
  const sampleID = row.sample_id || "UnknownID";
  const temp = row["Temperature_K"] || "Unknown";

  // --- Detect approximations (same logic as UI) ---
  const rawRA = sites.map(s => getValue(s, "ra"));
  const hasAnyRA = rawRA.some(v => Number.isFinite(v) && v > 0);

  const hasApproxRA = !hasAnyRA;

  const hasApproxHWHM = sites.some(
    s => !Number.isFinite(getValue(s, "hwhm"))
  );

  const hasApproximation = hasApproxRA || hasApproxHWHM;

  let metaLines = [];
  metaLines.push(`# Sample: ${sample}`);
  metaLines.push(`# Interpretation: ${interpretation}`);
  metaLines.push(`# sample_id: ${sampleID}`);
  metaLines.push(`# Temperature (K): ${temp}`);

  metaLines.push(""); // blank line

  const refLine = [
    "Reference: ",
    row.cr_title || null,
    ". ",
    row.cr_authors || null,
    ". ",
    row.cr_year || null,
    ". ",
    row.doi || null,
    ". ",
  ].filter(Boolean).join("");

  if (refLine) metaLines.push(`# ${refLine}`);

  // if (row.doi) metaLines.push(`# DOI: ${row.doi}`);

  metaLines.push(""); // blank line

  /* ---------- Simulation & provenance ---------- */
  metaLines.push(
    "# Notes: The Mössbauer spectra in this file are simulated from published hyperfine parameters."
  );
  if (hasApproximation) {
    metaLines.push(
      "# Note: Parameters marked with '*' were approximated."
    );

    if (hasApproxRA) {
      metaLines.push(
        "#   * RA (%) values were not provided and were derived assuming equal site areas."
      );
    }
    if (hasApproxHWHM) {
      metaLines.push(
        "#   * HWHM values were not provided and defaulted to 0.097 mm/s."
      );
    }
  }
  metaLines.push(
    "# These data are intended for visualization, comparison, and educational use only."
  );

  metaLines.push(""); // blank line

  metaLines.push(
    "# If you use this simulated spectrum in a publication or grant proposal, please cite:"
  );
  metaLines.push(
    "# Byrne, J. M. MinSight – a new concept for fitting and interpreting Mössbauer spectroscopy data."
  );
  metaLines.push(
    "# Interactions (2025). https://doi.org/10.1007/s10751-025-02331-7"
  );

  /* ---------- Timestamp ---------- */
  const timestamp = new cr_year().toISOString();
  metaLines.push(`# File generated on: ${timestamp}`);
  metaLines.push(""); // blank line


  /* ---------- Sites table ---------- */
  let siteTable = [];
  siteTable.push("# Sites table");
  siteTable.push([
    "Sample",
    "Site",
    "Isomer_Shift_mm_s",
    "Quadrupole_Splitting_mm_s",
    "Hyperfine_Field_T"
  ].join("\t"));

  sites.forEach((s, i) => {
    const siteName =
      s.Site || s.Sublattice || `Site${i + 1}`;
    siteTable.push([
      s.Sample || "—",
      siteName,
      s["Isomer_Shift_mm_s"] ?? "—",
      s["Quadrupole_Splitting_mm_s"] ?? "—",
      s["Hyperfine_Field_T"] ?? "—"
    ].join("\t"));
  });

  siteTable.push("");

  /* ---------- Build spectra ---------- */
  const spectra = [];

  const weights = computeSiteWeights(sites);

  sites.forEach((site, i) => {
    // const IS = getValue(site, "is");
    const IS_raw = getValue(site, "is");
    const IS = Number.isFinite(IS_raw) ? IS_raw : 0.0;
    // const QS = getValue(site, "qs");
    const QS_raw = getValue(site, "qs");
    const QS = Number.isFinite(QS_raw) ? QS_raw : 0.0;

    if (isNaN(IS) || isNaN(QS)) return;

    const model = String(site.Model ?? site.model ?? "").toLowerCase();

    if (model === "vbf") {
      spectra.push(buildVBFSite(site, weights[i]));
    } else {
      spectra.push(
        buildSpectrum({
          IS: getValue(site, "is"),
          QS: getValue(site, "qs"),
          Bhf: getValue(site, "bhf"),
          type: getValue(site, "bhf") > 0 ? "Sx" : "Db",
          HWHM: getValue(site, "hwhm"),
          weight: weights[i]
        })
      );
    }
  });
      // spectra.push(
      //   buildSpectrum({
      //     IS,
      //     QS,
      //     Bhf,
      //     type,
      //     HWHM,
      //     weight: weights[i],
      //     model: site.Model || site.model,
      //     sigma_qs: getValue(site, "sigma_qs"),
      //     sigma_bhf: getValue(site, "sigma_bhf")
      //   })
      // );
    // });

    if (spectra.length === 0) return;

    const x = spectra[0].x;

    const summedY = x.map((_, i) =>
      spectra.reduce((acc, s) => acc + (s.y?.[i] ?? 0), 0)
    );

    const siteNames = sites.map(
      (s, i) => s.Site || s.Sublattice || `Site${i + 1}`
    );

    /* ---------- Spectrum table ---------- */
    let specLines = [];
    specLines.push("# Spectrum");
    specLines.push(
      ["Velocity(mm/s)", "Sum", ...siteNames].join("\t")
    );

    for (let i = 0; i < x.length; i++) {
      specLines.push([
        x[i].toFixed(5),
        summedY[i].toExponential(6),
        ...spectra.map(s =>
          (s.y?.[i] ?? 0).toExponential(6)
        )
      ].join("\t"));
    }

    /* ---------- Download ---------- */
    const content = [
      ...metaLines,
      ...siteTable,
      ...specLines
    ].join("\n");

    const blob = new Blob([content], {
      type: "text/plain;charset=utf-8"
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download =
      `${sampleID}_${sample}_${temp}K_spectrum.txt`
        .replace(/\s+/g, "_");

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

    

    
/* ---------- Event listeners ---------- */

document.addEventListener("click", e => {
  if (
    filtersPanel.classList.contains("open") &&
    !filtersPanel.contains(e.target) &&
    !toggleFiltersBtn.contains(e.target)
  ) {
    filtersPanel.classList.remove("open");
    const caret = toggleFiltersBtn.querySelector(".hf-caret");
    if (caret) caret.textContent = "▾";
  }
});

document.addEventListener("keydown", e => {
  if (e.key === "Escape" && filtersPanel.classList.contains("open")) {
    filtersPanel.classList.remove("open");
    toggleFiltersBtn.classList.remove("open");
    const caret = toggleFiltersBtn.querySelector(".hf-caret");
    if (caret) caret.textContent = "▾";
  }
});


/* ---------- Filtering ---------- */


    function filterTable(query) {
      const table = document.getElementById("results");
      const count = document.getElementById("result-count");
      const message = document.getElementById("no-results");

      const hasSampleQuery = query && query.trim() !== "";

      const tempMin = document.getElementById("temp-min").value;
      const tempMax = document.getElementById("temp-max").value;
      const isMin   = document.getElementById("is-min").value;
      const isMax   = document.getElementById("is-max").value;
      const qsMin   = document.getElementById("qs-min").value;
      const qsMax   = document.getElementById("qs-max").value;
      const bhfMin  = document.getElementById("bhf-min").value;
      const bhfMax  = document.getElementById("bhf-max").value;

      const hasAnyNumericFilter =
        tempMin || tempMax ||
        isMin   || isMax   ||
        qsMin   || qsMax   ||
        bhfMin  || bhfMax;

      // Auto-activate layout if numeric filters only
      if (!hasSampleQuery && hasAnyNumericFilter) {
        document.body.classList.remove("search-centered");
        document.body.classList.add("search-active");
        dockSearchInNavbar(); // ✅ keep search in navbar
      }
            
      if (hasSampleQuery) {
        renderMineralHighlight(query);
      } else {
        renderMineralHighlight(null);
      }


      updateFilterChips();
      
      // If no filters at all → hide table
      if (!hasSampleQuery && !hasAnyNumericFilter) {
        table.classList.remove("visible");
        table.style.display = "none";
        count.style.display = "none";
        message.style.display = "none";
        return;
      }

      // ✅ Start from full dataset
      let filtered = data;
            
      // if (hasSampleQuery) {
      //   const q = query.toLowerCase();
      //   filtered = filtered.filter(r =>
      //     r.Sample && r.Sample.toLowerCase().includes(q)
      //   );
      // }

      if (hasSampleQuery) {
        const q = query.toLowerCase();

        filtered = filtered.filter(r => {

          const searchable = [
            r.Sample,
            r.cr_title,
            r.Isomer_Shift_mm_s,
            r.Quadrupole_Splitting_mm_s,
            r.Hyperfine_Field_T
          ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
          // const searchable = [
          //   r.Sample,
          //   r.cr_title,
          //   r["Isomer_Shift_mm_s"],
          //   r["Quadrupole_Splitting_mm_s"],
          //   r["Hyperfine_Field_T"]
          // ]
          //   .filter(Boolean)
          //   .join(" ")
          //   .toLowerCase();

          return searchable.includes(q);
        });
      }

      // filtered = filtered.filter(row =>
      //     (!tempMin && !tempMax || passesRange(row["Temperature_K"], tempMin, tempMax)) &&
      //     (!isMin && !isMax     || passesRange(row["Isomer_Shift_mm_s"], isMin, isMax)) &&
      //     (!qsMin && !qsMax     || passesRange(row["Quadrupole_Splitting_mm_s"], qsMin, qsMax)) &&
      //     (!bhfMin && !bhfMax   || passesRange(row["Hyperfine_Field_T"], bhfMin, bhfMax))
      //   );
      filtered = filtered.filter(row =>
          (!tempMin && !tempMax || passesRange(row["Temperature_K"], tempMin, tempMax)) &&
          (!isMin && !isMax     || passesRange(row["Isomer_Shift_mm_s"], isMin, isMax)) &&
          (!qsMin && !qsMax     || passesRange(row["Quadrupole_Splitting_mm_s"], qsMin, qsMax)) &&
          (!bhfMin && !bhfMax   || passesRange(row["Hyperfine_Field_T"], bhfMin, bhfMax))
        );

        
      if (currentSort.column) {
        filtered = sortRows(
          filtered,
          currentSort.column,
          currentSort.direction
        );
      }

        if (!filtered.length) {
          table.classList.remove("visible");
          table.style.display = "none";
          count.style.display = "none";
          message.style.display = "block";

          return;
        }

        
      filtered = Array.from(
        new Map(
          filtered.map(row => [row.sample_id?.trim(), row])
        ).values()
      );

      count.textContent =
        `${filtered.length} entr${filtered.length === 1 ? "y" : "ies"} found`;
      count.style.display = "block";
      message.style.display = "none";

      table.style.display = "table";
      table.offsetHeight; // force reflow
      table.classList.add("visible");

      
      
      // ✅ Auto-render first visible row
      // renderTable(filtered, query);
      if (window.innerWidth > 768) {
        renderTable(filtered, query);
      }
      if (window.innerWidth <= 768) {
        renderCards(filtered);
      }


      // if (filtered.length > 0) {
      //   const spectrumDiv = document.getElementById("mini-spectrum");
      //   spectrumDiv.style.display = "block"; // ✅ show only now


      //   // // optional: visual selection
      //   // setTimeout(() => {
      //   //   const firstRow = document.querySelector("#results tbody tr");
      //   //   if (firstRow) firstRow.classList.add("selected");
      //   // }, 0);
      // }
      }





/* ---------- Load data ---------- */

//fetch("database/parameters/parameters_with_ReferenceID.csv")
// fetch("database/parameters/parameters_SECONDARY_claymins.csv")
// fetch("database/parameters/Clay Minerals Magazine_ALL_SUBTABLES.csv")
fetch("database/parameters/merged_Journal_output.csv")
//fetch("database/parameters/Journal of Hazardous Materials_reviewed.csv")
  .then(res => res.text())
  .then(text => {
    data = parseCSV(text)
    .filter(r => String(r.Review_sample).trim().toLowerCase() !== "true")
    .map(r => ({
      ...r,
      sample_id: r.sample_id?.trim() || null
    }));

    samples = [...new Set(data.map(d => d.Sample).filter(Boolean))];

    filterTable("");
  });

/* ---------- Load mineral profiles (JSON) ---------- */
fetch("database/mineral_profiles/mineral_profiles.json")
  .then(res => res.json())
  .then(json => {
    mineralProfiles = json;
  })
  .catch(err => {
    console.error("Failed to load mineral profiles:", err);
  });

    // fetch("database/parameters/references.csv")
    //   .then(res => res.text())
    //   .then(text => {
    //     const rows = parseCSV(text);
    //     rows.forEach(r => {
    //       references[r.ReferenceID] = r;
    //     });
    // });

    function getReference(row) {
      return references[row.ReferenceID] || null;
    }
    

      
  /* ---------- Autocomplete ---------- */

  function updateAutocomplete(matches, query) {
    const box = document.getElementById("autocomplete");
    box.innerHTML = "";

    matches.slice(0, 10).forEach(m => {
      const div = document.createElement("div");
      div.className = "suggestion";
      div.innerHTML = highlight(m, query);
      div.onclick = () => {
        searchInput.value = m;
        committedQuery = m;

        document.body.classList.remove("search-centered");
        document.body.classList.add("search-active");

        dockSearchInNavbar();   // ✅ NEW

        autocomplete.innerHTML = "";
        filterTable(committedQuery);
      };
      box.appendChild(div);
    });
  }


/* ---------- Render the mineral highlight handler ---------- */

function renderMineralHighlight(mineralName) {
  const container = document.getElementById("mineral-highlight");
  if (!container) return;

  container.innerHTML = "";
  if (!mineralName) return;

  const profile = mineralProfiles.find(
    m => m.mineral.toLowerCase() === mineralName.toLowerCase()
  );

  if (!profile) return;

  const card = document.createElement("div");
  card.className = "mineral-highlight-card";

  card.innerHTML = `
    <div class="mineral-highlight-header">
      <h2>${profile.mineral}</h2>
    </div>

    <div class="mineral-highlight-body">
      ${
        profile.image
          ? `<img src="${profile.image}" alt="${profile.mineral}">`
          : ""
      }

      <p class="mineral-highlight-text">
        ${profile.description}
      </p>

      <button class="mineral-highlight-toggle">
        Show more
      </button>
    </div>
  `;

  container.appendChild(card);

  const toggle = card.querySelector(".mineral-highlight-toggle");
  const text = card.querySelector(".mineral-highlight-text");

  if (toggle && text) {
    toggle.addEventListener("click", () => {
      
      const expanded = text.classList.toggle("expanded");
      toggle.textContent = expanded ? "Show less" : "Show more";
    });
  }
}


  const searchInput = document.getElementById("search");
  const searchBtn = document.getElementById("search-btn");
  const clearBtn = document.getElementById("clear-btn");
  const autocomplete = document.getElementById("autocomplete");

    /* ---------- Search handler ---------- */

  searchInput.addEventListener("input", e => {
    const query = e.target.value.trim();
    clearBtn.style.display = query ? "block" : "none";

    if (!query) {
      autocomplete.innerHTML = "";
      return;
    }

    // const matches = samples.filter(m =>
    //   m.toLowerCase().includes(query.toLowerCase())
    // );
    const matches = [
      ...new Set(
        data.flatMap(r => [
          r.Sample,
          r.cr_title
        ]).filter(Boolean)
      )
    ].filter(v =>
      v.toLowerCase().includes(query.toLowerCase())
    );


    updateAutocomplete(matches, query);
  });

    searchInput.addEventListener("keydown", e => {
      if (e.key === "Enter") {
        e.preventDefault();
        runSearch();
        autocomplete.innerHTML = "";
      }
    });

  searchBtn.addEventListener("click", runSearch);
  clearBtn.addEventListener("click", clearSearch);


  function renderCards(rows) {
    const container = document.getElementById("results-cards");
    container.innerHTML = "";

    rows.forEach(row => {
      const card = document.createElement("div");
      card.className = "result-card";

      const header = document.createElement("div");
      header.className = "card-header";

      const title = document.createElement("div");
      // title.className = "card-title";
      title.textContent = row.Sample || "—";
      title.textContent =
        row.Sample
          ? `${row.Sample}${row["Temperature_K"] ? ` — ${row["Temperature_K"]} K` : ""}`
          : "—";
      ``
      const classTag = document.createElement("div");
      classTag.className = "card-class";
      classTag.textContent = row.Class || "—";

      const arrow = document.createElement("div");
      arrow.className = "card-arrow";
      arrow.textContent = "▼";

      header.appendChild(title);
      header.appendChild(classTag);
      header.appendChild(arrow);

      // const details = document.createElement("div");
      // details.className = "card-details";
      const details = document.createElement("div");
      details.className = "card-details";

      details.appendChild(createDetailCard(row));
  
      // const fields = [
      //   ["Temperature_K", row["Temperature_K"]],
      //   ["Isomer_Shift_mm_s", row["Isomer_Shift_mm_s"]],
      //   ["Quadrupole_Splitting_mm_s", row["Quadrupole_Splitting_mm_s"]],
      //   ["Hyperfine_Field_T", row["Hyperfine_Field_T"]]
      // ];

      // fields.forEach(([label, value]) => {
      //   if (!value) return;
      //   const r = document.createElement("div");
      //   r.className = "card-row";
      //   r.innerHTML = `<span>${label}</span><span>${value}</span>`;
      //   details.appendChild(r);
      // });

      
      const ref = getReference(row);
      if (ref) {
        const citation = document.createElement("div");
        citation.className = "card-row";

        const authorYear =
          ref.cr_authorss && ref.Year
            ? `${ref.cr_authorss.split(",")[0]} (${ref.Year})`
            : "Publication";

        citation.innerHTML = `
          <span>${authorYear}</span>
          <a href="${ref.URL}" target="_blank">🔗</a>
        `;

        details.appendChild(citation);
      }


      header.addEventListener("click", () => {
        document.querySelectorAll(".card-details.open")
          .forEach(d => d !== details && d.classList.remove("open"));

        document.querySelectorAll(".card-arrow.open")
          .forEach(a => a !== arrow && a.classList.remove("open"));

        details.classList.toggle("open");
        arrow.classList.toggle("open");
        renderSpectrumFromRow(row);
      });

      card.appendChild(header);
      card.appendChild(details);
      container.appendChild(card);
    });
}



    function renderHoverSpectrum(data) {
      const svg = document.querySelector("#hover-spectrum svg");
      while (svg.firstChild) svg.removeChild(svg.firstChild);

      if (!data || !data.x || !data.y) return;

      const W = 320;
      const H = 200;
      const padding = 24;

      svg.setAttribute("width", W);
      svg.setAttribute("height", H);
      svg.setAttribute("viewBox", `0 0 ${W} ${H}`);

      const { x, y } = data;

      const xMin = Math.min(...x);
      const xMax = Math.max(...x);
      let yMin = Math.min(...y);
      let yMax = Math.max(...y);

      if (yMax === yMin) {
        yMax += 1e-6;
        yMin -= 1e-6;
      }

      /* --- Scales --- */
      const scaleX = v =>
        padding + (v - xMin) / (xMax - xMin) * (W - 2 * padding);

      const scaleY = v =>
        padding + (yMax - v) / (yMax - yMin) * (H - 2 * padding);

      const axisY = H - padding;

      /* --- Border --- */
      const border = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      border.setAttribute("x", padding);
      border.setAttribute("y", padding);
      border.setAttribute("width", W - 2 * padding);
      border.setAttribute("height", H - 2 * padding);
      border.setAttribute("fill", "none");
      border.setAttribute("stroke", "#444");
      svg.appendChild(border);

      /* --- X axis line --- */
      const xAxis = document.createElementNS("http://www.w3.org/2000/svg", "line");
      xAxis.setAttribute("x1", padding);
      xAxis.setAttribute("y1", axisY);
      xAxis.setAttribute("x2", W - padding);
      xAxis.setAttribute("y2", axisY);
      xAxis.setAttribute("stroke", "#444");
      svg.appendChild(xAxis);

      /* --- X ticks + labels --- */
      const ticks = [-12, -8, -4, 0, 4, 8, 12];

      ticks.forEach(v => {
        const xPos = scaleX(v);

        const tick = document.createElementNS("http://www.w3.org/2000/svg", "line");
        tick.setAttribute("x1", xPos);
        tick.setAttribute("y1", axisY);
        tick.setAttribute("x2", xPos);
        tick.setAttribute("y2", axisY + 4);
        tick.setAttribute("stroke", "#444");
        svg.appendChild(tick);

        const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
        label.setAttribute("x", xPos);
        label.setAttribute("y", axisY + 16);
        label.setAttribute("text-anchor", "middle");
        label.setAttribute("font-size", "9");
        label.setAttribute("fill", "#333");
        label.textContent = v;
        svg.appendChild(label);
      });

      /* --- Axis label --- */
      const axisLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
      axisLabel.setAttribute("x", W / 2);
      axisLabel.setAttribute("y", H - 4);
      axisLabel.setAttribute("text-anchor", "middle");
      axisLabel.setAttribute("font-size", "10");
      axisLabel.setAttribute("fill", "#333");
      axisLabel.textContent = "Velocity (mm/s)";
      svg.appendChild(axisLabel);

      /* --- Spectrum path --- */
      let d = "";
      for (let i = 0; i < x.length; i++) {
        d += (i === 0 ? "M" : "L") +
            `${scaleX(x[i])} ${scaleY(y[i])} `;
      }

      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", d);
      path.setAttribute("stroke", "#215F9A");
      path.setAttribute("stroke-width", "1.5");
      path.setAttribute("fill", "none");
      svg.appendChild(path);
    }

  /* ---------- Event listener ---------- */


   ["temp", "is", "qs", "bhf"].forEach(id => {
      ["min", "max"].forEach(bound => {
        document
          .getElementById(`${id}-${bound}`)
          .addEventListener("input", () =>
            filterTable(committedQuery)
          );
      });
    }); 


function updateSearchPlaceholder() {
  const input = document.getElementById("search");
  if (!input) return;

  if (window.innerWidth <= 768) {
    input.placeholder = "Search (e.g. goethite, magnetite)";
  } else {
    input.placeholder =
      "Search Fe-bearing phase (e.g. Goethite, Magnetite...)";
  }
}

// Run on load and on resize
window.addEventListener("load", updateSearchPlaceholder);
window.addEventListener("resize", updateSearchPlaceholder);