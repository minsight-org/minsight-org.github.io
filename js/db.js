


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
function runSearch() {
  const query = searchInput.value.trim();
  filterTable(query);
}

function clearSearch() {
  searchInput.value = "";
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
      toggleFiltersBtn.textContent = isOpen
        ? "▴ Search by parameters"
        : "▾ Search by parameters";
    });

    function updateFilterChips() {
    const container = document.getElementById("active-filters");
    container.innerHTML = "";

    const filters = [
      ["Temp [K]", "temp"],
      ["IS [mm/s]", "is"],
      ["QS [mm/s]", "qs"],
      ["Bhf [T]", "bhf"]
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

    function normalizeHeader(header) {
      return header
        .toLowerCase()
        .replace(/\[.*?\]/g, "")  // remove units like [mm/s]
        .trim();
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

    /* ---------- Build Mossbauer spectrum  ---------- */
    
    function buildSpectrum({ IS, QS, Bhf, type }) {
      const x = velocityAxis(-12, 12, 1200);
      const y = Array(x.length).fill(0);
      const w = 0.25; // linewidth (mm/s)

      let peaks = [];
      let intensities = [];

      if (type === "Db") {
        // Doublet: equal intensity
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

        // ✅ Physical sextet intensities
        intensities = [3, 2, 1, 1, 2, 3];
      }

      // Normalize intensities (optional but recommended)
      const norm = intensities.reduce((a, b) => a + b, 0) || 1;

      peaks.forEach((p, idx) => {
        const A = intensities[idx] / norm;
        for (let i = 0; i < x.length; i++) {
          y[i] -= A * lorentzian(x[i], w, p);
        }
      });

      return { x, y };
    }


    function createMetadataBlock(row) {
      const box = document.createElement("div");
      box.className = "detail-metadata";

      const title = document.createElement("div");
      title.className = "metadata-title";
      title.textContent = row.Title || row.Sample || "Unknown reference";
      box.appendChild(title);

      if (row.Author) {
        const authors = document.createElement("div");
        authors.className = "metadata-authors";
        authors.textContent = row.Author;
        box.appendChild(authors);
      }

      const details = [];
      if (row.Date) details.push(row.Date);
      if (row["Publication type"]) details.push(row["Publication type"]);

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

      return box;
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


    function createDetailCard(row) {
      const wrapper = document.createElement("div");
      // wrapper.className = "detail-card";
      wrapper.className = "detail-card detail-content";

      /* ---------- Mini spectrum container ---------- */
      const spectrumBox = document.createElement("div");
      spectrumBox.className = "detail-spectrum";

      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      spectrumBox.appendChild(svg);

      /* ---------- Collect sites (by SampleID) ---------- */
      const sites = getSitesForSpectrum(row);

      /* ---------- Build individual spectra ---------- */
      const spectra = [];

      sites.forEach(site => {
        const IS  = getValue(site, "is");
        const QS  = getValue(site, "qs");
        const Bhf = getValue(site, "bhf");

        if (isNaN(IS) || isNaN(QS)) return;

        const type = Bhf && Bhf > 0 ? "Sx" : "Db";
        spectra.push(buildSpectrum({ IS, QS, Bhf, type }));
      });

      /* ---------- Determine highlighted site ---------- */
      const selectedIndex = sites.findIndex(s =>
        s.SampleID === row.SampleID &&
        (s.Site ?? "") === (row.Site ?? "") &&
        String(s["IS [mm/s]"] ?? "") === String(row["IS [mm/s]"] ?? "")
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
      const temp = row["Temp [K]"] ? `${row["Temp [K]"]} K` : "T unknown";

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
          <th>Bhf (T)</th>
        </tr>
      `;
      table.appendChild(thead);

      /* --- Table body --- */
      const tbody = document.createElement("tbody");

      if (sites.length === 0) {
        const tr = document.createElement("tr");
        tr.innerHTML = `<td colspan="5">No sites available</td>`;
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

          tr.innerHTML = `
            <td>${site.Sample ?? "—"}</td>
            <td>${siteName}</td>
            <td>${site["IS [mm/s]"] ?? "—"}</td>
            <td>${site["QS [mm/s]"] ?? "—"}</td>
            <td>${site["Bhf [T]"] ?? "—"}</td>
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
        });
      }

      table.appendChild(tbody);


      // ---------- Download link ----------
      const downloadLink = document.createElement("button");
      downloadLink.className = "spectrum-download-link";
      downloadLink.textContent = "⬇ Download simulated spectrum";
      downloadLink.addEventListener("click", e => {
        e.stopPropagation();
        downloadSpectrumTxt(row, sites);
      });

      const downloadRow = document.createElement("div");

      downloadRow.className = "spectrum-download-row";
      downloadRow.appendChild(downloadLink);

      const tableWrapper = document.createElement("div");


      /* ---------- Assemble card ---------- */
      // sitesBox.appendChild(table);
      tableWrapper.className = "sites-table-wrapper";
      tableWrapper.appendChild(table);
      sitesBox.appendChild(tableWrapper);
      wrapper.appendChild(spectrumBox);
      wrapper.appendChild(sitesBox);
      tableWrapper.appendChild(downloadRow);

      return wrapper;
    }

    function getSitesForSpectrum(row) {

      return data.filter(r =>
        r.SampleID &&
        row.SampleID &&
        r.SampleID.trim() === row.SampleID.trim()
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
  const sampleID = row.SampleID || "UnknownID";
  const temp = row["Temp [K]"] || "Unknown";

  let metaLines = [];
  metaLines.push(`# Sample: ${sample}`);
  metaLines.push(`# Interpretation: ${interpretation}`);
  metaLines.push(`# SampleID: ${sampleID}`);
  metaLines.push(`# Temperature (K): ${temp}`);

  metaLines.push(""); // blank line

  const refLine = [
    "Reference: ",
    row.Title || null,
    ". ",
    row.Author || null,
    ". ",
    row.Date || null,
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
  metaLines.push(
    "# These data are intended for visualization, comparison, and educational use only."
  );

  metaLines.push(""); // blank line

  metaLines.push(
    "# If you use this simulated spectrum, please cite:"
  );
  metaLines.push(
    "# Byrne, J. M. MinSight – a new concept for fitting and interpreting Mössbauer spectroscopy data."
  );
  metaLines.push(
    "# Interactions (2025). https://doi.org/10.1007/s10751-025-02331-7"
  );

  /* ---------- Timestamp ---------- */
  const timestamp = new Date().toISOString();
  metaLines.push(`# File generated on: ${timestamp}`);
  metaLines.push(""); // blank line


  /* ---------- Sites table ---------- */
  let siteTable = [];
  siteTable.push("# Sites table");
  siteTable.push([
    "Sample",
    "Site",
    "IS(mm/s)",
    "QS(mm/s)",
    "Bhf(T)"
  ].join("\t"));

  sites.forEach((s, i) => {
    const siteName =
      s.Site || s.Sublattice || `Site${i + 1}`;
    siteTable.push([
      s.Sample || "—",
      siteName,
      s["IS [mm/s]"] ?? "—",
      s["QS [mm/s]"] ?? "—",
      s["Bhf [T]"] ?? "—"
    ].join("\t"));
  });

  siteTable.push("");

  /* ---------- Build spectra ---------- */
  const spectra = [];
  sites.forEach(site => {
    const IS = getValue(site, "is");
    const QS = getValue(site, "qs");
    const Bhf = getValue(site, "bhf");
    if (isNaN(IS) || isNaN(QS)) return;
    const type = Bhf && Bhf > 0 ? "Sx" : "Db";
    spectra.push(buildSpectrum({ IS, QS, Bhf, type }));
  });

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
    toggleFiltersBtn.textContent = "▾ Search by parameters";
  }
});

document.addEventListener("keydown", e => {
  if (e.key === "Escape" && filtersPanel.classList.contains("open")) {
    filtersPanel.classList.remove("open");
    toggleFiltersBtn.textContent = "▾ Search by parameters";
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
            
            if (hasSampleQuery) {
          const q = query.toLowerCase();
          filtered = filtered.filter(r =>
            r.Sample && r.Sample.toLowerCase().includes(q)
          );
        }
      filtered = filtered.filter(row =>
          (!tempMin && !tempMax || passesRange(row["Temp [K]"], tempMin, tempMax)) &&
          (!isMin && !isMax     || passesRange(row["IS [mm/s]"], isMin, isMax)) &&
          (!qsMin && !qsMax     || passesRange(row["QS [mm/s]"], qsMin, qsMax)) &&
          (!bhfMin && !bhfMax   || passesRange(row["Bhf [T]"], bhfMin, bhfMax))
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

    // fetch("database/parameters/parameters_with_ReferenceID.csv")
    fetch("database/parameters/parameters_SECONDARY.csv")
      .then(res => res.text())
      .then(text => {
        data = parseCSV(text).map(r => ({
          ...r,
          SampleID: r.SampleID?.trim() || null
        }));

        samples = [...new Set(data.map(d => d.Sample).filter(Boolean))];

        filterTable("");
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
          document.getElementById("search").value = m;
          box.innerHTML = "";
          filterTable(m);
        };
        box.appendChild(div);
      });
    }

    /* ---------- Search handler ---------- */

    document.getElementById("search").addEventListener("input", e => {
      const query = e.target.value.trim();
      clearBtn.style.display = query ? "block" : "none";

      const box = document.getElementById("autocomplete");

      if (query.length > 0) {
        document.body.classList.remove("search-centered");
        document.body.classList.add("search-active");
      }

      if (!query) {
        box.innerHTML = "";
        filterTable("");
        return;
      }

      const matches = samples.filter(m =>
        m.toLowerCase().includes(query.toLowerCase())
      );

      updateAutocomplete(matches, query);
      filterTable(query);
    });

    document.addEventListener("click", e => {
      if (!e.target.closest(".search-container")) {
        document.getElementById("autocomplete").innerHTML = "";
      }
    });


  const searchInput = document.getElementById("search");
  const searchBtn = document.getElementById("search-btn");
  const clearBtn = document.getElementById("clear-btn");
  const autocomplete = document.getElementById("autocomplete");

  searchBtn.addEventListener("click", runSearch);
  clearBtn.addEventListener("click", clearSearch);

  /* Allow Enter key to trigger search */
  // searchInput.addEventListener("input", e => {
  //   const query = e.target.value.trim();

  //   clearBtn.style.display = query ? "block" : "none";

  //   if (query.length > 0) {
  //     document.body.classList.remove("search-centered");
  //     document.body.classList.add("search-active");
  //   }

  //   if (!query) {
  //     autocomplete.innerHTML = "";
  //     filterTable("");
  //     return;
  //   }

  //   const matches = samples.filter(m =>
  //     m.toLowerCase().includes(query.toLowerCase())
  //   );

  //   updateAutocomplete(matches, query);
  //   filterTable(query);
  // });

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
          ? `${row.Sample}${row["Temp [K]"] ? ` — ${row["Temp [K]"]} K` : ""}`
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
      //   ["Temp [K]", row["Temp [K]"]],
      //   ["IS [mm/s]", row["IS [mm/s]"]],
      //   ["QS [mm/s]", row["QS [mm/s]"]],
      //   ["Bhf [T]", row["Bhf [T]"]]
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
          ref.Authors && ref.Year
            ? `${ref.Authors.split(",")[0]} (${ref.Year})`
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

    /* ---------- lorentzian handler ---------- */

  function lorentzian(x, w, x0) {
    return (1 / Math.PI) * (0.5 * w / ((x - x0) ** 2 + w ** 2));
  }

  function velocityAxis(vmin = -12, vmax = 12, n = 1200) {
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
            filterTable(document.getElementById("search").value.trim())
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