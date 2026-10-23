// Ideal absorber thickness calculator for the sample preparation guide.
//
// Rebuilt from the Mosstool calculator. Following Rancourt et al. (1993), the
// ideal thickness is 1/μ, where μ is the sample's mass absorption coefficient
// at 14.4 keV (the mass-weighted sum of each element's coefficient, values
// from Gütlich et al. 2010).

const ATOMIC_MASS = {
  H: 1.00794, He: 4.0026, Li: 6.941, Be: 9.01218, B: 10.811, C: 12.011, N: 14.0067, O: 15.9994,
  F: 18.9984, Ne: 20.1797, Na: 22.98977, Mg: 24.305, Al: 26.98154, Si: 28.0855, P: 30.97376,
  S: 32.066, Cl: 35.4527, Ar: 39.948, K: 39.0983, Ca: 40.078, Sc: 44.9559, Ti: 47.88, V: 50.9415,
  Cr: 51.996, Mn: 54.938, Fe: 55.847, Co: 58.9332, Ni: 58.6934, Cu: 63.546, Zn: 65.39, Ga: 69.723,
  Ge: 72.61, As: 74.9216, Se: 78.96, Br: 79.904, Kr: 83.8, Rb: 85.4678, Sr: 87.62, Y: 88.9059,
  Zr: 91.224, Nb: 92.9064, Mo: 95.94, Tc: 98, Ru: 101.07, Rh: 102.9055, Pd: 106.42, Ag: 107.868,
  Cd: 112.41, In: 114.82, Sn: 118.71, Sb: 121.757, Te: 127.6, I: 126.9045, Xe: 131.29,
  Cs: 132.9054, Ba: 137.33, La: 138.9055, Ce: 140.12, Pr: 140.9077, Nd: 144.24, Pm: 145,
  Sm: 150.36, Eu: 151.965, Gd: 157.25, Tb: 158.9253, Dy: 162.5, Ho: 164.9303, Er: 167.26,
  Tm: 168.9342, Yb: 173.04, Lu: 174.967, Hf: 178.49, Ta: 180.9479, W: 183.85, Re: 186.207,
  Os: 190.2, Ir: 192.22, Pt: 195.08, Au: 196.9665, Hg: 200.59, Tl: 204.383, Pb: 207.2,
  Bi: 208.9804, Po: 209, At: 210, Rn: 222, Fr: 223, Ra: 226.0254, Ac: 227, Th: 232.0381,
  Pa: 231.0359, U: 238.029, Np: 237.0482
};

/** Mass absorption coefficients at 14.4 keV (cm²/g), from Gütlich et al. (2010). */
const ABSORPTION = {
  H: 0.387, He: 0.194, Li: 0.23, Be: 0.32, B: 0.51, C: 0.87, N: 1.4, O: 2.2, F: 2.7, Ne: 4,
  Na: 5.2, Mg: 6.8, Al: 9, Si: 12.4, P: 14.2, S: 17, Cl: 20, Ar: 21, K: 27, Ca: 32.5, Sc: 33,
  Ti: 42, V: 43, Cr: 48, Mn: 53, Fe: 64, Co: 66, Ni: 75, Cu: 82, Zn: 92, Ga: 97, Ge: 102,
  As: 126, Se: 110, Br: 130, Kr: 126, Rb: 21, Sr: 24.5, Y: 26, Zr: 28, Nb: 29.5, Mo: 34,
  Tc: 35.5, Ru: 37.5, Rh: 38, Pd: 41, Ag: 44, Cd: 46, In: 49, Sn: 54, Sb: 56, Te: 60, I: 61,
  Xe: 67, Cs: 71, Ba: 75, La: 76, Ce: 77, Pr: 81, Nd: 88, Pm: 92, Sm: 96, Eu: 100, Gd: 104,
  Tb: 107, Dy: 110, Ho: 115, Er: 120, Tm: 127, Yb: 133, Lu: 139, Hf: 145, Ta: 150, W: 155,
  Re: 160, Os: 165, Ir: 172, Pt: 178, Au: 191, Hg: 165, Tl: 123, Pb: 120, Bi: 123, Po: 126,
  At: 140, Rn: 60, Fr: 62, Ra: 65, Ac: 70, Th: 75, Pa: 80, U: 85, Np: 90
};

const FE_MASS = ATOMIC_MASS.Fe;
const FE_ABSORPTION = ABSORPTION.Fe;

/**
 * Count the atoms in a formula such as "Fe3O4", "Ca(OH)2",
 * "Fe0.9Al0.1OOH" or "FeSO4·7H2O" (a · or * joins parts).
 * @returns {Object<string, number>} moles of each element
 */
export function parseFormula(formula) {
  const counts = {};
  formula.replace(/\s+/g, "").split(/[·*]/).forEach(part => {
    if (!part) return;
    const lead = part.match(/^\d+(\.\d+)?/);
    const multiplier = lead ? Number(lead[0]) : 1;
    const text = lead ? part.slice(lead[0].length) : part;
    let i = 0;

    function readNumber() {
      const m = text.slice(i).match(/^\d+(\.\d+)?|^\.\d+/);
      if (!m) return 1;
      i += m[0].length;
      return Number(m[0]);
    }

    function readGroup() {
      const result = {};
      while (i < text.length && !")]".includes(text[i])) {
        let inner;
        if (text[i] === "(" || text[i] === "[") {
          i++;
          inner = readGroup();
          if (text[i] !== ")" && text[i] !== "]") throw new Error("A bracket is not closed.");
          i++;
        } else {
          const m = text.slice(i).match(/^[A-Z][a-z]?/);
          if (!m) throw new Error(`“${text[i]}” is not part of an element symbol.`);
          if (!(m[0] in ATOMIC_MASS)) throw new Error(`“${m[0]}” is not an element this calculator knows.`);
          i += m[0].length;
          inner = { [m[0]]: 1 };
        }
        const n = readNumber();
        Object.entries(inner).forEach(([el, c]) => { result[el] = (result[el] || 0) + c * n; });
      }
      return result;
    }

    const group = readGroup();
    if (i < text.length) throw new Error("There is a closing bracket without an opening one.");
    Object.entries(group).forEach(([el, c]) => { counts[el] = (counts[el] || 0) + c * multiplier; });
  });
  if (!Object.keys(counts).length) throw new Error("Enter a formula, for example Fe3O4.");
  return counts;
}

/** Molar mass, mass absorption coefficient and ideal thickness for a formula. */
export function fromFormula(formula) {
  const counts = parseFormula(formula);
  const molarMass = Object.entries(counts).reduce((sum, [el, n]) => sum + n * ATOMIC_MASS[el], 0);
  const mu = Object.entries(counts).reduce((sum, [el, n]) => sum + (n * ATOMIC_MASS[el] / molarMass) * ABSORPTION[el], 0);
  const feShare = (counts.Fe || 0) * FE_MASS / molarMass;
  return { molarMass, mu, thickness: 1000 / mu, feShare };
}

/** Ideal thickness (mg/cm²) from the iron content alone, ignoring other absorbers. */
export function fromIronPercent(percent) {
  return 1000 / (percent / 100 * FE_ABSORPTION);
}

/** Volume (ml) of a solution to filter onto a given area to reach the ideal amount of iron. */
export function volumeForFiltration(concentration_mM, area) {
  const idealIron = 1000 / FE_ABSORPTION;   // mg Fe per cm² for pure iron
  return idealIron * area / (FE_MASS * concentration_mM) * 1000;
}

/* ---------- Page wiring ---------- */

const fmt = (v, digits = 1) => v.toLocaleString("en-GB", { maximumFractionDigits: digits, minimumFractionDigits: digits });
const fmtArea = v => v.toLocaleString("en-GB", { maximumFractionDigits: 2 });

function setUp(root) {
  const $ = name => root.querySelector(`[name="${name}"]`);
  const result = root.querySelector(".calc-result");
  const panels = root.querySelectorAll("[data-method-panel]");

  function method() {
    return root.querySelector('input[name="method"]:checked').value;
  }

  function update() {
    const m = method();
    panels.forEach(p => { p.hidden = p.dataset.methodPanel !== m; });
    const area = Number($("area").value);

    try {
      if (!(area > 0)) throw new Error("Enter the area of your sample holder in cm².");

      if (m === "formula") {
        const r = fromFormula($("formula").value);
        if (!r.feShare) {
          result.innerHTML = "This formula contains no iron, so it would give no Mössbauer spectrum.";
          return;
        }
        result.innerHTML =
          `<p><strong>Ideal thickness: ${fmt(r.thickness, 2)} mg/cm²</strong>, so weigh out about ` +
          `<strong>${fmt(r.thickness * area, 1)} mg</strong> for a ${fmtArea(area)} cm² holder.</p>` +
          `<p class="calc-detail">Molar mass ${fmt(r.molarMass, 2)} g/mol · iron ${fmt(r.feShare * 100, 1)} wt% · ` +
          `mass absorption coefficient ${fmt(r.mu, 2)} cm²/g</p>`;
      } else if (m === "percent") {
        const pct = Number($("percent").value);
        if (!(pct > 0 && pct <= 100)) throw new Error("Enter an iron content between 0 and 100 wt%.");
        const t = fromIronPercent(pct);
        result.innerHTML =
          `<p><strong>Ideal thickness: about ${fmt(t, 1)} mg/cm²</strong>, so weigh out about ` +
          `<strong>${fmt(t * area, 0)} mg</strong> for a ${fmtArea(area)} cm² holder.</p>` +
          `<p class="calc-detail">Only the iron is counted here. Other heavy elements absorb too, so you may need less.</p>`;
      } else {
        const c = Number($("concentration").value);
        if (!(c > 0)) throw new Error("Enter an iron concentration above 0 mM.");
        const v = volumeForFiltration(c, area);
        result.innerHTML =
          `<p><strong>Filter about ${fmt(v, 1)} ml</strong> of solution onto a ${fmtArea(area)} cm² filter.</p>` +
          `<p class="calc-detail">Assumes all the iron is caught on the filter and no other strong absorbers are present.</p>`;
      }
    } catch (e) {
      result.innerHTML = `<p>${e.message}</p>`;
    }
  }

  root.addEventListener("input", update);
  root.addEventListener("change", update);
  root.addEventListener("submit", e => e.preventDefault());
  update();
}

document.querySelectorAll(".calculator").forEach(setUp);
