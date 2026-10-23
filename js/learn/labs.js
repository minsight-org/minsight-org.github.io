// Interactive spectrum plots ("labs") for the learn guides.
//
// A page marks a spot with <div class="lab" data-lab="name"></div> and this
// module fills it with a plot and controls. The spectra come from the same
// functions as the database page (js/db/spectrum.js).
//
// Values marked "illustrative" are chosen to show a behaviour clearly, not
// taken from a particular sample.

import { buildLorentzianSite, buildVBFSite, velocityAxis } from "../db/spectrum.js";
import { drawSpectrum } from "../db/plot.js";

/* ---------- Building spectra ---------- */

/**
 * One site. A doublet when Bhf is 0, otherwise a sextet. As in the database,
 * QS is the quadrupole splitting ΔEQ for a doublet and the quadrupole shift ε
 * for a sextet. Uses VBF when `voigt` is set, otherwise Lorentzian lines.
 */
function site({ IS, QS = 0, Bhf = 0, fwhm = 0.25, weight = 1, sigmaQS = 0, sigmaBhf = 0, voigt = false }) {
  if (voigt) {
    return buildVBFSite({ IS, QS, Bhf: Bhf > 0 ? Bhf : NaN, fwhm, sigmaQS, sigmaBhf }, weight).y;
  }
  return buildLorentzianSite({ IS, QS, Bhf, type: Bhf > 0 ? "Sx" : "Db", HWHM: fwhm / 2, weight }).y;
}

function spectrum(sites) {
  const x = velocityAxis();
  const sum = x.map((_, i) => sites.reduce((acc, y) => acc + y[i], 0));
  return { x, sum, sites: sites.length > 1 ? sites.map(y => ({ y })) : [] };
}

/** Depth of a single unsplit line, so plots can keep one scale while lines split. */
function singletDepth(fwhm, voigt = false) {
  return Math.max(...site({ IS: 0, fwhm, voigt }).map(Math.abs));
}

const fmt = (v, digits = 2) => Number(v).toFixed(digits);

/* ---------- Lab definitions ---------- */

const LABS = {
  "isomer-shift": {
    label: "A single line moved by the isomer shift",
    controls: [
      { key: "IS", label: "Isomer shift δ", unit: "mm/s", min: -1, max: 2, step: 0.01, value: 0.35 }
    ],
    compute: v => ({
      sim: spectrum([site({ IS: v.IS })]),
      readout: "The whole spectrum moves. Real spectra are rarely a single line, but every line moves by the same amount."
    })
  },

  quadrupole: {
    label: "A doublet from quadrupole splitting",
    initial: { IS: 0.35 },
    controls: [
      { key: "QS", label: "Quadrupole splitting ΔE<sub>Q</sub>", unit: "mm/s", min: 0, max: 3.5, step: 0.01, value: 0.7 }
    ],
    presets: [
      { label: "Typical Fe(III)", values: { IS: 0.35, QS: 0.7 } },
      { label: "Typical Fe(II)", values: { IS: 1.15, QS: 2.7 } }
    ],
    compute: v => ({
      sim: spectrum([site({ IS: v.IS, QS: v.QS })]),
      options: { depth: singletDepth(0.25) },
      readout: `With δ = ${fmt(v.IS)} mm/s, the two lines sit at ${fmt(v.IS - v.QS / 2)} and ${fmt(v.IS + v.QS / 2)} mm/s. ` +
        "Their midpoint is δ and their separation is ΔEQ."
    })
  },

  "hyperfine-field": {
    label: "A sextet from the hyperfine field",
    controls: [
      { key: "Bhf", label: "Hyperfine field B<sub>hf</sub>", unit: "T", min: 0, max: 55, step: 0.1, value: 33 }
    ],
    presets: [
      { label: "No field", values: { Bhf: 0 } },
      { label: "Metallic iron", values: { Bhf: 33 } },
      { label: "Hematite at room temperature", values: { Bhf: 51.8 } }
    ],
    compute(v) {
      return {
        sim: spectrum([site({ IS: 0, Bhf: v.Bhf })]),
        readout: v.Bhf > 0
          ? `The outer lines are ${fmt(0.067897 * v.Bhf * 4.7509, 1)} mm/s apart.`
          : "With no field there is a single line."
      };
    }
  },

  "quadrupole-shift": {
    label: "A sextet with and without a quadrupole shift",
    controls: [
      { key: "QS", label: "Quadrupole shift ε", unit: "mm/s", min: -0.3, max: 0.3, step: 0.01, value: -0.13 }
    ],
    presets: [
      { label: "Goethite (about −0.13)", values: { QS: -0.13 } },
      { label: "None", values: { QS: 0 } },
      { label: "Hematite below 260 K (about +0.20)", values: { QS: 0.2 } }
    ],
    compute: v => ({
      sim: spectrum([site({ IS: 0.37, QS: v.QS, Bhf: 50 })]),
      options: { reference: site({ IS: 0.37, QS: 0, Bhf: 50 }) },
      caption: '<span class="key key-sum">With ε</span> <span class="key key-reference">Without ε</span>'
    })
  },

  linewidth: {
    label: "A doublet with different linewidths",
    controls: [
      { key: "fwhm", label: "Linewidth (FWHM)", unit: "mm/s", min: 0.194, max: 1, step: 0.002, value: 0.3 }
    ],
    compute: v => ({
      sim: spectrum([site({ IS: 0.35, QS: 0.7, fwhm: v.fwhm })]),
      options: { depth: singletDepth(0.194) / 2 },
      readout: v.fwhm < 0.2
        ? "This is about as narrow as a measured line can be (twice the natural linewidth of 0.097 mm/s)."
        : "Broader lines are shallower, because the area under each line stays the same."
    })
  },

  // Every parameter at once, for a doublet or a sextet
  together: {
    label: "A spectrum built from all the hyperfine parameters",
    choices: [
      { key: "type", label: "Type of site", options: () => [["doublet", "Doublet"], ["sextet", "Sextet"]], value: "doublet" }
    ],
    controls: [
      { key: "IS", label: "Isomer shift δ", unit: "mm/s", min: -0.5, max: 2, step: 0.01, value: 0.35 },
      { key: "QS", label: "Quadrupole splitting ΔE<sub>Q</sub>", unit: "mm/s", min: 0, max: 3.5, step: 0.01, value: 0.7,
        showWhen: v => v.type === "doublet" },
      { key: "Bhf", label: "Hyperfine field B<sub>hf</sub>", unit: "T", min: 0, max: 55, step: 0.1, value: 51.8,
        showWhen: v => v.type === "sextet" },
      { key: "eps", label: "Quadrupole shift ε", unit: "mm/s", min: -0.3, max: 0.3, step: 0.01, value: -0.1,
        showWhen: v => v.type === "sextet" },
      { key: "fwhm", label: "Linewidth (FWHM)", unit: "mm/s", min: 0.194, max: 1, step: 0.002, value: 0.3 }
    ],
    // Typical room-temperature values unless stated (see MINERALS below).
    // Siderite δ from Dyar et al. (2006).
    presets: [
      { label: "Ferrihydrite, Fe(III)", values: { type: "doublet", IS: 0.35, QS: 0.7, fwhm: 0.4 } },
      { label: "Lepidocrocite, Fe(III)", values: { type: "doublet", IS: 0.37, QS: 0.53, fwhm: 0.3 } },
      { label: "Siderite, Fe(II)", values: { type: "doublet", IS: 1.22, QS: 1.8, fwhm: 0.3 } },
      { label: "Hematite", values: { type: "sextet", IS: 0.37, Bhf: 51.8, eps: -0.1, fwhm: 0.3 } },
      { label: "Goethite at 4.2 K", values: { type: "sextet", IS: 0.48, Bhf: 50.6, eps: -0.13, fwhm: 0.3 } }
    ],
    compute(v) {
      if (v.type === "doublet") {
        return {
          sim: spectrum([site({ IS: v.IS, QS: v.QS, fwhm: v.fwhm })]),
          readout: `A doublet with lines at ${fmt(v.IS - v.QS / 2)} and ${fmt(v.IS + v.QS / 2)} mm/s. ` +
            (v.IS > 0.8 ? "A δ this large points to high-spin Fe(II)." : "A δ this small points to Fe(III).")
        };
      }
      return {
        sim: spectrum([site({ IS: v.IS, QS: v.eps, Bhf: v.Bhf, fwhm: v.fwhm })]),
        readout: `A sextet centred on ${fmt(v.IS)} mm/s, with its outer lines ${fmt(0.067897 * v.Bhf * 4.7509, 1)} mm/s apart.`
      };
    }
  },

  // Illustrative model of nanoparticles with a spread of sizes (blocking temperatures)
  temperature: {
    label: "Illustrative iron oxide nanoparticles measured at different temperatures",
    controls: [
      { key: "T", label: "Measurement temperature", unit: "K", min: 4, max: 400, step: 1, value: 295 },
      { key: "TB", label: "Particle size (median blocking temperature)", unit: "K", min: 20, max: 400, step: 5, value: 120 }
    ],
    presets: [
      { label: "Liquid helium (4.2 K)", values: { T: 4 } },
      { label: "Liquid nitrogen (77 K)", values: { T: 77 } },
      { label: "Room temperature", values: { T: 295 } }
    ],
    caption: '<span class="key key-dist">Spread of blocking temperatures</span> ' +
             '<span class="key key-sum">Iron in the sextet</span> <span class="key key-reference">Iron in the doublet</span>',
    drawExtra: drawBlockingProfile,
    compute(v) {
      // 40 particle groups spread log-normally around the median blocking temperature
      const n = 40;
      let blockedShare = 0;
      const doublet = site({ IS: 0.4, QS: 0.7, fwhm: 0.3 });
      const y = new Array(doublet.length).fill(0);

      for (let i = 0; i < n; i++) {
        const z = normalQuantile((i + 0.5) / n);
        const TB = v.TB * Math.exp(0.6 * z);
        let part;
        if (v.T < TB) {
          // Below its blocking temperature a particle shows a sextet whose field
          // is reduced a little by collective magnetic excitations
          const Bhf = 50 * (1 - v.T / (2 * 10 * TB));
          part = site({ IS: 0.4, Bhf, fwhm: 0.3, weight: 1 / n });
          blockedShare += 1 / n;
        } else {
          part = doublet.map(d => d / n);
        }
        part.forEach((p, k) => { y[k] += p; });
      }

      const blockedPercent = Math.round(blockedShare * 100);
      return {
        sim: spectrum([y]),
        // One scale for every temperature: 100% is the depth when all the iron is in the doublet
        options: { depth: Math.max(...doublet.map(Math.abs)), yAxis: true },
        readout: `${blockedPercent}% of the iron is in particles that are magnetically blocked (sextet) ` +
          `and ${100 - blockedPercent}% is superparamagnetic (doublet).`
      };
    }
  },

  "doublet-distribution": {
    label: "A doublet with a spread of quadrupole splittings",
    controls: [
      { key: "sigma", label: "Spread σ(ΔE<sub>Q</sub>)", unit: "mm/s", min: 0, max: 0.6, step: 0.01, value: 0.25 }
    ],
    compute: v => ({
      sim: spectrum([site({ IS: 0.35, QS: 0.7, fwhm: 0.25, sigmaQS: v.sigma || 1e-5, voigt: true })]),
      options: {
        depth: singletDepth(0.25, true) / 2,
        reference: site({ IS: 0.35, QS: 0.7, fwhm: 0.25, sigmaQS: 1e-5, voigt: true })
      },
      caption: '<span class="key key-sum">Voigt (VBF)</span> <span class="key key-reference">Lorentzian, no spread</span>'
    })
  },

  "sextet-distribution": {
    label: "A sextet with a spread of hyperfine fields",
    controls: [
      { key: "sigma", label: "Spread σ(B<sub>hf</sub>)", unit: "T", min: 0, max: 8, step: 0.1, value: 3 }
    ],
    compute: v => ({
      sim: spectrum([site({ IS: 0.37, QS: -0.13, Bhf: 45, fwhm: 0.3, sigmaBhf: v.sigma || 1e-5, voigt: true })]),
      options: {
        depth: singletDepth(0.3, true) / 4,
        reference: site({ IS: 0.37, QS: -0.13, Bhf: 45, fwhm: 0.3, sigmaBhf: 1e-5, voigt: true })
      },
      caption: '<span class="key key-sum">Voigt (VBF)</span> <span class="key key-reference">Lorentzian, no spread</span>'
    })
  },

  "iron-oxides": {
    label: "Typical spectra of common iron oxides",
    // Magnetite and maghemite are not simulated at 4.2 K, so those buttons switch off together
    choices: [
      { key: "mineral", label: "Mineral", options: () => Object.entries(MINERALS).map(([k, m]) => [k, m.name]), value: "hematite",
        disabled: (option, v) => v.temp === "lt" && !MINERALS[option].lt },
      { key: "temp", label: "Temperature", options: () => [["rt", "Room temperature"], ["lt", "4.2 K"]], value: "rt",
        disabled: (option, v) => option === "lt" && !MINERALS[v.mineral].lt }
    ],
    compute(v) {
      const mineral = MINERALS[v.mineral];
      const readout = mineral.lt ? mineral.note[v.temp] : `${mineral.note.rt} ${mineral.note.lt}`;
      return { sim: spectrum(mineral[v.temp].map(s => site(s))), readout };
    }
  }
};

/**
 * Typical parameters (δ relative to α-Fe, mm/s; QS is ΔEQ for doublets and ε
 * for sextets, mm/s; Bhf in T), after Murad and Cashion (2004) and Cornell and
 * Schwertmann (2003). Real samples vary with crystallinity, substitution and
 * particle size. The table in guides/iron-oxides.html shows the same values.
 */
export const MINERALS = {
  hematite: {
    name: "Hematite",
    rt: [{ IS: 0.37, QS: -0.10, Bhf: 51.8, fwhm: 0.3 }],
    lt: [{ IS: 0.48, QS: 0.20, Bhf: 54.2, fwhm: 0.3 }],
    note: {
      rt: "One sharp sextet with the largest field of the common iron oxides.",
      lt: "Below the Morin transition (about 260 K) the field rises and ε changes sign from negative to positive."
    }
  },
  goethite: {
    name: "Goethite",
    rt: [{ IS: 0.37, QS: -0.13, Bhf: 38, fwhm: 0.45 }],
    lt: [{ IS: 0.48, QS: -0.13, Bhf: 50.6, fwhm: 0.3 }],
    note: {
      rt: "A sextet with a much lower field than hematite. Small or substituted crystals give broad, asymmetric lines, or even a doublet.",
      lt: "At 4.2 K the field is close to hematite's, but ε stays negative, which helps tell them apart."
    }
  },
  lepidocrocite: {
    name: "Lepidocrocite",
    rt: [{ IS: 0.37, QS: 0.53, fwhm: 0.3 }],
    lt: [{ IS: 0.47, QS: 0.01, Bhf: 45.8, fwhm: 0.35 }],
    note: {
      rt: "A Fe(III) doublet. Lepidocrocite only orders magnetically below about 77 K.",
      lt: "At 4.2 K it becomes a sextet with a lower field than hematite or goethite."
    }
  },
  ferrihydrite: {
    name: "Ferrihydrite (2-line)",
    rt: [{ IS: 0.35, QS: 0.7, fwhm: 0.4 }],
    lt: [{ IS: 0.47, QS: -0.01, Bhf: 47, fwhm: 0.8 }],
    note: {
      rt: "A Fe(III) doublet, which on its own cannot be told apart from many other Fe(III) phases.",
      lt: "At 4.2 K the tiny particles are blocked and give a broad sextet. Measuring at low temperature is often the only way to identify ferrihydrite."
    }
  },
  magnetite: {
    name: "Magnetite",
    rt: [
      { IS: 0.26, QS: 0, Bhf: 49.0, fwhm: 0.3, weight: 0.34 },
      { IS: 0.67, QS: 0, Bhf: 46.0, fwhm: 0.35, weight: 0.66 }
    ],
    lt: null,
    note: {
      rt: "Two sextets. The tetrahedral (A) site holds Fe(III); the octahedral (B) site holds Fe(II) and Fe(III) that swap electrons quickly, so it looks like Fe(2.5+). In stoichiometric magnetite the B site has about twice the area of the A site.",
      lt: "There is no 4.2 K spectrum here, because below the Verwey transition (about 120 K) the electron hopping stops and the spectrum becomes too complex to show simply."
    }
  },
  maghemite: {
    name: "Maghemite",
    rt: [{ IS: 0.32, QS: 0, Bhf: 50.0, fwhm: 0.4 }],
    lt: null,
    note: {
      rt: "A single sextet from Fe(III) on both sites. The missing Fe(2.5+) site is what separates it from magnetite.",
      lt: "There is no 4.2 K spectrum here. The field rises a little on cooling, but the two sites can only be separated with an applied magnetic field."
    }
  }
};

const BLOCKING_SPREAD = 0.6;

/** Share of particles still blocked (sextet) at temperature T. */
function blockedShare(T, medianTB) {
  return 1 - normalCdf(Math.log(T / medianTB) / BLOCKING_SPREAD);
}

/**
 * Blocking temperature profile under the temperature lab: the spread of
 * blocking temperatures, and the share of iron in the sextet and doublet
 * at each temperature, with the current temperature marked.
 */
function drawBlockingProfile(svg, v) {
  const NS = "http://www.w3.org/2000/svg";
  const W = 480, H = 210;
  const pad = { left: 52, right: 16, top: 18, bottom: 44 };
  const plotW = W - pad.left - pad.right, plotH = H - pad.top - pad.bottom;
  const Tmax = 400;
  const sx = T => pad.left + T / Tmax * plotW;
  const sy = f => pad.top + (1 - f) * plotH;
  const el = (name, attrs) => {
    const node = document.createElementNS(NS, name);
    Object.entries(attrs).forEach(([k, val]) => node.setAttribute(k, val));
    svg.appendChild(node);
    return node;
  };
  svg.replaceChildren();
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);

  const temps = Array.from({ length: 201 }, (_, i) => Math.max(1, i * Tmax / 200));
  const pdf = temps.map(T => Math.exp(-((Math.log(T / v.TB) / BLOCKING_SPREAD) ** 2) / 2) / T);
  const peak = Math.max(...pdf);
  const line = f => temps.map((T, i) => `${i ? "L" : "M"}${sx(T).toFixed(1)} ${sy(f(T, i)).toFixed(1)}`).join("");

  el("path", { class: "plot-dist", d: `${line((T, i) => 0.9 * pdf[i] / peak)}L${sx(Tmax)} ${sy(0)}L${sx(temps[0])} ${sy(0)}Z` });
  el("path", { class: "plot-reference", d: line(T => 1 - blockedShare(T, v.TB)) });
  el("path", { class: "plot-sum", d: line(T => blockedShare(T, v.TB)) });

  // Axes
  const axisY = sy(0) + 6;
  el("line", { class: "plot-axis", x1: pad.left, x2: W - pad.right, y1: axisY, y2: axisY });
  [0, 100, 200, 300, 400].forEach(T => {
    el("line", { class: "plot-axis", x1: sx(T), x2: sx(T), y1: axisY, y2: axisY + 5 });
    el("text", { class: "plot-text", x: sx(T), y: axisY + 18, "text-anchor": "middle" }).textContent = T;
  });
  el("text", { class: "plot-text", x: pad.left + plotW / 2, y: H - 4, "text-anchor": "middle" }).textContent = "Temperature (K)";
  const ax = pad.left - 8;
  el("line", { class: "plot-axis", x1: ax, x2: ax, y1: sy(0), y2: sy(1) });
  [0, 50, 100].forEach(pct => {
    el("line", { class: "plot-axis", x1: ax - 5, x2: ax, y1: sy(pct / 100), y2: sy(pct / 100) });
    el("text", { class: "plot-text", x: ax - 8, y: sy(pct / 100) + 4, "text-anchor": "end" }).textContent = pct;
  });
  el("text", { class: "plot-text", x: 12, y: pad.top + plotH / 2, "text-anchor": "middle",
               transform: `rotate(-90 12 ${pad.top + plotH / 2})` }).textContent = "Share of iron (%)";

  // Current temperature
  const share = blockedShare(Math.max(v.T, 1), v.TB);
  el("line", { class: "plot-marker", x1: sx(v.T), x2: sx(v.T), y1: sy(1) - 6, y2: axisY });
  el("circle", { class: "plot-point", cx: sx(v.T), cy: sy(share), r: 4.5 });
}

/* ---------- Maths helpers ---------- */

/** Standard normal cumulative distribution (Abramowitz and Stegun 7.1.26). */
function normalCdf(z) {
  const t = 1 / (1 + 0.3275911 * Math.abs(z) / Math.SQRT2);
  const erf = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t *
    Math.exp(-(z * z) / 2);
  return z >= 0 ? 0.5 * (1 + erf) : 0.5 * (1 - erf);
}

/** Inverse of the standard normal distribution (Acklam's approximation). */
function normalQuantile(p) {
  const a = [-39.6968302866538, 220.946098424521, -275.928510446969, 138.357751867269, -30.6647980661472, 2.50662827745924];
  const b = [-54.4760987982241, 161.585836858041, -155.698979859887, 66.8013118877197, -13.2806815528857];
  const c = [-0.00778489400243029, -0.322396458041136, -2.40075827716184, -2.54973253934373, 4.37466414146497, 2.93816398269878];
  const d = [0.00778469570904146, 0.32246712907004, 2.445134137143, 3.75440866190742];
  const q = p < 0.5 ? p : 1 - p;
  let x;
  if (q < 0.02425) {
    const r = Math.sqrt(-2 * Math.log(q));
    x = (((((c[0] * r + c[1]) * r + c[2]) * r + c[3]) * r + c[4]) * r + c[5]) / ((((d[0] * r + d[1]) * r + d[2]) * r + d[3]) * r + 1);
  } else {
    const r = (q - 0.5) ** 2;
    x = (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * (q - 0.5) /
        (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
    return p < 0.5 ? x : -x;
  }
  return p < 0.5 ? x : -x;
}

/* ---------- Building the widgets ---------- */

let labCount = 0;

function make(tag, className, html) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (html !== undefined) node.innerHTML = html;
  return node;
}

function setUpLab(root) {
  const config = LABS[root.dataset.lab];
  if (!config) return;
  const id = `lab-${++labCount}`;
  const values = { ...(config.initial || {}) };

  const figure = make("figure", "lab-figure");
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-label", config.label);
  const caption = make("figcaption", "lab-caption");
  figure.append(svg);
  let extra = null;
  if (config.drawExtra) {
    extra = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    extra.setAttribute("class", "lab-extra");
    extra.setAttribute("role", "img");
    extra.setAttribute("aria-label", "How the share of iron in the sextet and the doublet changes with temperature");
    figure.append(extra);
  }
  figure.append(caption);

  const panel = make("div", "lab-controls");
  const outputs = {};
  const inputs = {};
  const radios = {};
  const disabling = [];
  const conditional = [];

  (config.choices || []).forEach(c => {
    values[c.key] = c.value;
    const group = make("fieldset", "lab-choice");
    group.append(make("legend", "", c.label));
    c.options().forEach(([value, text]) => {
      const label = make("label", "lab-pill");
      const radio = make("input");
      Object.assign(radio, { type: "radio", name: `${id}-${c.key}`, value, checked: value === c.value });
      radios[`${c.key}=${value}`] = radio;
      if (c.disabled) disabling.push([radio, label, () => c.disabled(value, values)]);
      radio.addEventListener("change", () => {
        values[c.key] = value;
        update();
      });
      label.append(radio, make("span", "", text));
      group.append(label);
    });
    panel.append(group);
  });

  (config.controls || []).forEach(c => {
    values[c.key] = c.value;
    const inputId = `${id}-${c.key}`;
    const wrap = make("div", "lab-control");
    const label = make("label", "", `<span>${c.label}</span>`);
    label.htmlFor = inputId;
    const output = make("output", "lab-value");
    output.htmlFor = inputId;
    label.append(output);
    const input = make("input");
    Object.assign(input, { type: "range", id: inputId, min: c.min, max: c.max, step: c.step, value: c.value });
    input.addEventListener("input", () => {
      values[c.key] = Number(input.value);
      update();
    });
    wrap.append(label, input);
    panel.append(wrap);
    if (c.showWhen) conditional.push([wrap, c.showWhen]);
    outputs[c.key] = { node: output, control: c };
    inputs[c.key] = input;
  });

  if (config.presets) {
    const group = make("div", "lab-presets");
    group.setAttribute("role", "group");
    group.setAttribute("aria-label", "Examples");
    group.append(make("span", "lab-presets-label", "Try"));
    config.presets.forEach(p => {
      const button = make("button", "lab-preset", p.label);
      button.type = "button";
      button.addEventListener("click", () => {
        Object.entries(p.values).forEach(([k, v]) => {
          values[k] = v;
          if (inputs[k]) inputs[k].value = v;
          if (radios[`${k}=${v}`]) radios[`${k}=${v}`].checked = true;
        });
        update();
      });
      group.append(button);
    });
    panel.append(group);
  }

  const readout = make("p", "lab-readout");
  readout.setAttribute("aria-live", "polite");
  panel.append(readout);

  root.append(figure, panel);

  function update() {
    conditional.forEach(([wrap, showWhen]) => { wrap.hidden = !showWhen(values); });
    disabling.forEach(([radio, label, isDisabled]) => {
      radio.disabled = isDisabled();
      label.classList.toggle("is-disabled", radio.disabled);
    });
    Object.values(outputs).forEach(({ node, control }) => {
      const digits = String(control.step).split(".")[1]?.length ?? 0;
      node.textContent = `${Number(values[control.key]).toFixed(digits)} ${control.unit}`;
    });
    const result = config.compute(values);
    drawSpectrum(svg, result.sim, -1, result.options || {});
    if (extra) config.drawExtra(extra, values);
    const captionHtml = result.caption || config.caption || "";
    caption.innerHTML = captionHtml;
    caption.hidden = !captionHtml;
    readout.textContent = result.readout || "";
    readout.hidden = !result.readout;
  }

  update();
}

document.querySelectorAll(".lab[data-lab]").forEach(setUpLab);
