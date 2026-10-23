// Database page: one search box, optional parameter filters, and a list of
// published spectra that open to show their sites and a simulated spectrum.
// The search is kept in the address (?q=goethite&is=0.3,0.4) so results can
// be shared and the back button works.

import { loadSpectra, loadMineralProfiles } from "./data.js";
import { FILTERS, SORTS, displayName, fold, hasActiveFilters, indexSpectra, search, sortResults, suggestions } from "./search.js";
import { DEFAULT_FWHM, MIN_FWHM, modelLabel, simulateSpectrum } from "./spectrum.js";
import { drawSpectrum } from "./plot.js";
import { downloadSpectrum } from "./download.js";

const PAGE_SIZE = 25;

const $ = id => document.getElementById(id);
const form = $("search-form");
const input = $("search");
const suggestionList = $("suggestions");
const filtersToggle = $("filters-toggle");
const filtersPanel = $("filters-panel");
const sortSelect = $("sort");
const resultsList = $("results");
const showMore = $("show-more");

let spectra = [];
let profiles = [];
let state = { q: "", ranges: {}, sort: "sample", all: false };
let results = [];
let shown = 0;

/* ---------- Small helpers ---------- */

function make(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

const CHEVRON = '<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"></path></svg>';

/** Text with each search word wrapped in <mark>. */
function highlighted(text, query) {
  const fragment = document.createDocumentFragment();
  const terms = fold(query).split(/\s+/).filter(Boolean);
  const folded = fold(text);
  if (!terms.length || folded.length !== text.length) {
    fragment.append(text);
    return fragment;
  }

  const marks = Array(text.length).fill(false);
  terms.forEach(t => {
    let i = folded.indexOf(t);
    while (i !== -1) {
      marks.fill(true, i, i + t.length);
      i = folded.indexOf(t, i + 1);
    }
  });

  let i = 0;
  while (i < text.length) {
    let j = i;
    while (j < text.length && marks[j] === marks[i]) j++;
    const part = text.slice(i, j);
    fragment.append(marks[i] ? make("mark", "", part) : part);
    i = j;
  }
  return fragment;
}

/** "Friedl and Schwertmann (1996)" or "Smith et al. (2010)". */
function shortCitation(ref) {
  const authors = ref.authors.split(/\s*(?:;|,(?!\s*[A-Z]\.?(?:\s|,|$))|\band\b|&)\s*/).filter(Boolean);
  const surname = a => a.replace(/,.*$/, "").trim().split(/\s+/).pop();
  let who = "";
  if (authors.length === 1) who = surname(authors[0]);
  else if (authors.length === 2) who = `${surname(authors[0])} and ${surname(authors[1])}`;
  else if (authors.length > 2) who = `${surname(authors[0])} et al.`;
  const year = ref.year ? ` (${ref.year})` : "";
  return [who + year, ref.journal].filter(s => s.trim()).join(", ");
}

function formatK(value) {
  return Number.isFinite(value) ? `${value} K` : "";
}

/* ---------- Address bar ---------- */

function rangeToParam([min, max] = []) {
  return `${Number.isFinite(min) ? min : ""},${Number.isFinite(max) ? max : ""}`;
}

function paramToRange(text) {
  const [min = "", max = ""] = (text || "").split(",");
  const n = v => (v.trim() === "" ? NaN : Number(v));
  return [n(min), n(max)];
}

function stateToURL(push) {
  const params = new URLSearchParams();
  if (state.q) params.set("q", state.q);
  FILTERS.forEach(f => {
    const r = state.ranges[f.key];
    if (r && (Number.isFinite(r[0]) || Number.isFinite(r[1]))) params.set(f.key, rangeToParam(r));
  });
  if (state.all && !state.q && !hasActiveFilters(state.ranges)) params.set("all", "1");
  if (state.sort !== "sample") params.set("sort", state.sort);
  const query = params.toString();
  const url = `${location.pathname}${query ? `?${query}` : ""}`;
  if (url !== `${location.pathname}${location.search}`) {
    history[push ? "pushState" : "replaceState"](null, "", url);
  }
}

function stateFromURL() {
  const params = new URLSearchParams(location.search);
  const ranges = {};
  FILTERS.forEach(f => {
    if (params.has(f.key)) ranges[f.key] = paramToRange(params.get(f.key));
  });
  return {
    q: params.get("q") || "",
    ranges,
    sort: SORTS[params.get("sort")] ? params.get("sort") : "sample",
    all: params.get("all") === "1"
  };
}

/** Copy state into the form controls. */
function showState() {
  input.value = state.q;
  sortSelect.value = state.sort;
  FILTERS.forEach(f => {
    const [min, max] = state.ranges[f.key] || [];
    $(`${f.key}-min`).value = Number.isFinite(min) ? min : "";
    $(`${f.key}-max`).value = Number.isFinite(max) ? max : "";
  });
}

function rangesFromInputs() {
  const ranges = {};
  FILTERS.forEach(f => {
    const n = id => ($(id).value === "" ? NaN : Number($(id).value));
    ranges[f.key] = [n(`${f.key}-min`), n(`${f.key}-max`)];
  });
  return ranges;
}

/* ---------- Searching ---------- */

function isSearching() {
  return Boolean(state.q) || hasActiveFilters(state.ranges) || state.all;
}

function run() {
  renderChips();
  renderProfile();

  const searching = isSearching();
  $("landing").hidden = searching;
  $("results-toolbar").hidden = !searching;

  resultsList.replaceChildren();
  shown = 0;

  if (!searching) {
    results = [];
    showMore.hidden = true;
    return;
  }

  results = sortResults(search(spectra, state.q, state.ranges), state.sort);
  const papers = new Set(results.map(r => r.spectrum.reference.doi || r.spectrum.reference.title)).size;

  $("result-count").textContent = results.length
    ? `${results.length} spectr${results.length === 1 ? "um" : "a"} from ${papers} paper${papers === 1 ? "" : "s"}`
    : "No spectra match this search. Try fewer words or wider ranges.";

  renderMore();
}

function renderMore() {
  const next = results.slice(shown, shown + PAGE_SIZE);
  next.forEach(r => resultsList.appendChild(resultCard(r)));
  shown += next.length;
  showMore.hidden = shown >= results.length;
  showMore.textContent = `Show more (${results.length - shown} left)`;
}

function commit(push = true) {
  closeSuggestions();
  state.q = input.value.trim();
  state.ranges = rangesFromInputs();
  stateToURL(push);
  run();
}

/* ---------- Result cards ---------- */

function resultCard({ spectrum, matchedSites }) {
  const li = make("li", "result-card");
  const detailId = `detail-${spectrum.id}`;

  const heading = make("h2", "result-heading");
  const head = make("button", "result-head");
  head.type = "button";
  head.setAttribute("aria-expanded", "false");
  head.setAttribute("aria-controls", detailId);

  const title = make("span", "result-title");
  title.append(highlighted(displayName(spectrum), state.q));

  const meta = [
    spectrum.sample && spectrum.material ? spectrum.material : "",
    formatK(spectrum.temperatureK),
    `${spectrum.sites.length} site${spectrum.sites.length === 1 ? "" : "s"}`
  ].filter(Boolean).join(" · ");

  const text = make("span", "result-text");
  text.append(title, make("span", "result-meta", meta), make("span", "result-ref", shortCitation(spectrum.reference)));
  head.append(text);
  head.insertAdjacentHTML("beforeend", CHEVRON);
  heading.append(head);

  const detail = make("div", "result-detail");
  detail.id = detailId;
  detail.hidden = true;

  head.addEventListener("click", () => {
    const open = head.getAttribute("aria-expanded") !== "true";
    head.setAttribute("aria-expanded", String(open));
    detail.hidden = !open;
    li.classList.toggle("is-open", open);
    if (open && !detail.hasChildNodes()) detail.append(detailView(spectrum, matchedSites));
  });

  li.append(heading, detail);
  return li;
}

function cell(row, content, className) {
  const td = make("td", className);
  td.append(content);
  row.append(td);
  return td;
}

/**
 * Shown value for a site parameter: the paper's number, or with a star the
 * default the simulation used (or the paper's text when there is no default).
 */
function paramText(value, raw, fallback) {
  const text = String(raw ?? "").trim();
  const title = text ? `The paper gives: ${text}` : "Not given in the paper";
  if (Number.isFinite(value)) return { text, approx: false };
  if (fallback !== undefined) return { text: `${fallback}*`, approx: true, title };
  if (text) return { text: `${text}*`, approx: true, title };
  return { text: "—", approx: false };
}

function detailView(spectrum, matchedSites) {
  const sim = simulateSpectrum(spectrum);
  const name = displayName(spectrum);
  const wrapper = make("div", "detail");

  /* Plot */
  const figure = make("figure", "detail-plot");
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-label", `Simulated Mössbauer spectrum of ${name}, from -12 to 12 mm/s`);
  let selected = matchedSites.length ? matchedSites[0] : 0;
  drawSpectrum(svg, sim, selected);
  const caption = make("figcaption", "", `Simulated from the published parameters (${modelLabel(sim)}). `);
  caption.append(make("span", "key key-sum", "Sum"), " and ", make("span", "key key-site", "selected site"), ".");
  figure.append(svg, caption);

  /* Facts and reference */
  const info = make("div", "detail-info");
  const facts = make("dl", "detail-facts");
  [
    ["Sample", spectrum.sample],
    ["Material", spectrum.material],
    ["Treatment", spectrum.treatment],
    ["Temperature", formatK(spectrum.temperatureK)],
    ["Fit", spectrum.fitType]
  ].forEach(([label, value]) => {
    if (!value) return;
    facts.append(make("dt", "", label), make("dd", "", value));
  });
  info.append(facts);

  const ref = spectrum.reference;
  if (ref.title || ref.doi) {
    const refBox = make("div", "detail-ref");
    refBox.append(make("p", "detail-ref-label", "Published in"));
    const titleP = make("p", "detail-ref-title");
    if (ref.doi) {
      const a = make("a", "", ref.title || ref.doi);
      a.href = `https://doi.org/${ref.doi}`;
      a.target = "_blank";
      a.rel = "noopener";
      titleP.append(a);
    } else {
      titleP.textContent = ref.title;
    }
    refBox.append(titleP);
    if (ref.authors) refBox.append(make("p", "detail-ref-authors", ref.authors));
    const pub = [ref.journal, ref.year].filter(Boolean).join(", ");
    if (pub) refBox.append(make("p", "detail-ref-journal", pub));
    info.append(refBox);
  }

  const top = make("div", "detail-top");
  top.append(figure, info);

  /* Sites table */
  const sites = spectrum.sites;
  const showComponent = sites.some(s => s.component && s.component !== s.name);
  const showSigmaQS = sites.some(s => Number.isFinite(s.sigmaQS));
  const showSigmaBhf = sites.some(s => Number.isFinite(s.sigmaBhf));

  const table = make("table", "sites-table");
  table.append(make("caption", "", "Site parameters. Select a site to highlight it in the plot."));
  const headRow = make("tr");
  [
    ["Site"],
    ...(showComponent ? [["Assignment"]] : []),
    ["IS", "mm/s", "Isomer shift"],
    ["QS", "mm/s", "Quadrupole splitting (doublets) or shift (sextets)"],
    ...(showSigmaQS ? [["σ(QS)", "mm/s", "Width of the quadrupole splitting distribution"]] : []),
    ["Bhf", "T", "Hyperfine field"],
    ...(showSigmaBhf ? [["σ(Bhf)", "T", "Width of the hyperfine field distribution"]] : []),
    ["FWHM", "mm/s", "Linewidth, full width at half maximum"],
    ["Area", "%", "Relative area"],
    ["Line shape"]
  ].forEach(([label, unit, title]) => {
    const th = make("th");
    th.scope = "col";
    if (title) {
      const abbr = make("abbr", "", label);
      abbr.title = title;
      th.append(abbr);
    } else {
      th.append(label);
    }
    if (unit) th.append(make("span", "unit", ` (${unit})`));
    headRow.append(th);
  });
  const thead = make("thead");
  thead.append(headRow);
  table.append(thead);

  const tbody = make("tbody");
  let anyApprox = false;
  const buttons = [];

  sites.forEach((site, i) => {
    const tr = make("tr");
    if (matchedSites.includes(i)) tr.classList.add("site-match");

    const button = make("button", "site-select", site.name);
    button.type = "button";
    button.setAttribute("aria-pressed", String(i === selected));
    button.addEventListener("click", () => {
      selected = i;
      buttons.forEach((b, j) => b.setAttribute("aria-pressed", String(j === i)));
      drawSpectrum(svg, sim, selected);
    });
    buttons.push(button);
    const th = make("th");
    th.scope = "row";
    th.append(button);
    tr.append(th);
    if (showComponent) cell(tr, site.component || "—");

    const values = [
      paramText(site.IS, site.raw.IS, "0"),
      paramText(site.QS, site.raw.QS, "0"),
      ...(showSigmaQS ? [paramText(site.sigmaQS, site.raw.sigmaQS)] : []),
      paramText(site.Bhf, site.raw.Bhf),
      ...(showSigmaBhf ? [paramText(site.sigmaBhf, site.raw.sigmaBhf)] : []),
      paramText(site.fwhm, site.raw.fwhm, String(DEFAULT_FWHM)),
      sim.areaGiven
        ? paramText(site.area, site.raw.area)
        : { text: `${(sim.weights[i] * 100).toFixed(1)}*`, approx: true }
    ];
    values.forEach(v => {
      anyApprox ||= v.approx;
      const td = cell(tr, v.text, "num");
      if (v.title) td.title = v.title;
    });
    cell(tr, sim.sites[i].model === "vbf" ? "VBF" : "Lorentzian");
    tbody.append(tr);
  });
  table.append(tbody);

  const scroll = make("div", "table-scroll");
  scroll.tabIndex = 0;
  scroll.setAttribute("role", "region");
  scroll.setAttribute("aria-label", `Site parameters for ${name}`);
  scroll.append(table);

  wrapper.append(top, scroll);

  if (anyApprox) {
    wrapper.append(make("p", "sites-note",
      `* Not given as a single value in the paper, so the simulation used a default ` +
      `(0 mm/s for IS and QS, ${DEFAULT_FWHM} mm/s for FWHM, equal areas when none are given). ` +
      `Linewidths below ${MIN_FWHM} mm/s are narrower than 57Fe allows and are treated as errors. ` +
      `Point at a starred value to see what the paper gives.`));
  }
  if (matchedSites.length) {
    wrapper.append(make("p", "sites-note", "Sites marked with a bar match your parameter filters."));
  }

  const download = make("button", "button download-button", "Download simulated spectrum (.txt)");
  download.type = "button";
  download.addEventListener("click", () => downloadSpectrum(spectrum));
  const actions = make("p", "detail-actions");
  actions.append(download);
  wrapper.append(actions);

  return wrapper;
}

/* ---------- Mineral profile ---------- */

function renderProfile() {
  const box = $("mineral-profile");
  box.replaceChildren();
  const profile = profiles.find(p => fold(p.mineral) === fold(state.q));
  if (!profile) return;

  const card = make("section", "profile-card");
  card.setAttribute("aria-labelledby", "profile-title");
  const h = make("h2", "", profile.mineral);
  h.id = "profile-title";
  card.append(h);

  if (profile.image) {
    const img = make("img", "profile-image");
    img.src = profile.image;
    img.alt = "";
    card.append(img);
  }

  const text = make("p", "profile-text clamp", profile.description);
  text.id = "profile-text";
  card.append(text);

  const more = make("button", "read-more");
  more.type = "button";
  more.setAttribute("aria-expanded", "false");
  more.setAttribute("aria-controls", "profile-text");
  more.innerHTML = `<span>Read more</span>${CHEVRON}`;
  more.addEventListener("click", () => {
    const open = text.classList.toggle("clamp-open");
    more.setAttribute("aria-expanded", String(open));
    more.querySelector("span").textContent = open ? "Show less" : "Read more";
  });
  card.append(more);

  if (profile.image && profile.image_credit) {
    card.append(make("p", "profile-credit", `Image: ${profile.image_credit}`));
  }

  box.append(card);
  // Only offer Read more when the text is actually cut short
  requestAnimationFrame(() => {
    more.hidden = text.scrollHeight <= text.clientHeight + 1;
  });
}

/* ---------- Filters ---------- */

function renderChips() {
  const box = $("active-filters");
  box.replaceChildren();
  let count = 0;

  FILTERS.forEach(f => {
    const [min, max] = state.ranges[f.key] || [];
    const hasMin = Number.isFinite(min);
    const hasMax = Number.isFinite(max);
    if (!hasMin && !hasMax) return;
    count++;

    const label = hasMin && hasMax ? `${min} to ${max}` : hasMin ? `at least ${min}` : `at most ${max}`;
    const chip = make("button", "chip");
    chip.type = "button";
    chip.setAttribute("aria-label", `Remove ${f.label} filter`);
    chip.append(`${f.label}: ${label} ${f.unit}`);
    chip.insertAdjacentHTML("beforeend", '<svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"></path></svg>');
    chip.addEventListener("click", () => {
      $(`${f.key}-min`).value = "";
      $(`${f.key}-max`).value = "";
      commit(false);
      input.focus();
    });
    box.append(chip);
  });

  box.hidden = count === 0;
  $("filter-count").textContent = count ? ` (${count})` : "";
}

function setFiltersOpen(open) {
  filtersToggle.setAttribute("aria-expanded", String(open));
  filtersPanel.hidden = !open;
}

/* ---------- Autocomplete (ARIA combobox) ---------- */

let activeOption = -1;

function closeSuggestions() {
  suggestionList.hidden = true;
  suggestionList.replaceChildren();
  input.setAttribute("aria-expanded", "false");
  input.removeAttribute("aria-activedescendant");
  activeOption = -1;
}

function openSuggestions() {
  const items = suggestions(spectra, profiles, input.value);
  suggestionList.replaceChildren();
  if (!items.length) return closeSuggestions();

  items.forEach((text, i) => {
    const li = make("li", "suggestion");
    li.id = `suggestion-${i}`;
    li.setAttribute("role", "option");
    li.append(highlighted(text, input.value));
    // mousedown, so the choice lands before the input loses focus
    li.addEventListener("mousedown", e => {
      e.preventDefault();
      input.value = text;
      commit();
    });
    suggestionList.append(li);
  });
  suggestionList.hidden = false;
  input.setAttribute("aria-expanded", "true");
}

function moveActive(step) {
  const options = [...suggestionList.children];
  if (!options.length) return;
  activeOption = (activeOption + step + options.length) % options.length;
  options.forEach((o, i) => o.setAttribute("aria-selected", String(i === activeOption)));
  input.setAttribute("aria-activedescendant", options[activeOption].id);
}

/* ---------- Wiring ---------- */

function setUpControls() {
  Object.entries(SORTS).forEach(([key, s]) => sortSelect.append(new Option(s.label, key)));

  form.addEventListener("submit", e => {
    e.preventDefault();
    const options = [...suggestionList.children];
    if (activeOption >= 0 && options[activeOption]) input.value = options[activeOption].textContent;
    state.all = false;
    commit();
  });

  input.addEventListener("input", openSuggestions);
  input.addEventListener("blur", closeSuggestions);
  input.addEventListener("keydown", e => {
    if (e.key === "ArrowDown") { e.preventDefault(); moveActive(1); }
    else if (e.key === "ArrowUp") { e.preventDefault(); moveActive(-1); }
    else if (e.key === "Escape" && !suggestionList.hidden) { e.preventDefault(); closeSuggestions(); }
  });
  // The clear (x) button of a search input
  input.addEventListener("search", () => {
    if (!input.value) {
      state.all = false;
      commit();
    }
  });

  filtersToggle.addEventListener("click", () => {
    setFiltersOpen(filtersToggle.getAttribute("aria-expanded") !== "true");
  });

  let timer;
  filtersPanel.addEventListener("input", () => {
    clearTimeout(timer);
    timer = setTimeout(() => commit(false), 250);
  });

  $("clear-filters").addEventListener("click", () => {
    FILTERS.forEach(f => {
      $(`${f.key}-min`).value = "";
      $(`${f.key}-max`).value = "";
    });
    commit(false);
  });

  sortSelect.addEventListener("change", () => {
    state.sort = sortSelect.value;
    stateToURL(false);
    run();
  });

  showMore.addEventListener("click", () => {
    const firstNew = resultsList.children.length;
    renderMore();
    resultsList.children[firstNew]?.querySelector(".result-head")?.focus();
  });

  $("browse-all").addEventListener("click", () => {
    state.all = true;
    commit();
  });

  window.addEventListener("popstate", () => {
    state = stateFromURL();
    showState();
    run();
  });
}

async function start() {
  setUpControls();
  state = stateFromURL();
  showState();
  if (hasActiveFilters(state.ranges)) setFiltersOpen(true);

  try {
    [spectra, profiles] = await Promise.all([loadSpectra(), loadMineralProfiles()]);
  } catch (e) {
    $("db-stats").textContent = "Sorry, the database could not be loaded. Please try again later.";
    console.error(e);
    return;
  }

  indexSpectra(spectra);
  const papers = new Set(spectra.map(s => s.reference.doi || s.reference.title)).size;
  $("db-stats").textContent = `${spectra.length.toLocaleString("en-GB")} spectra from ${papers} papers`;
  run();
}

start();
