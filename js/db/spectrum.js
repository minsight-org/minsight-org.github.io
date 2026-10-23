// Simulated Mössbauer spectra from published hyperfine parameters.
//
// The line-shape maths (lorentzian, VBF, buildLorentzianSite, buildVBFSite,
// computeSiteWeights) is carried over unchanged from the original js/db.js.
// Only the way parameters are passed in has changed: functions now take the
// site records made in data.js instead of raw CSV rows.

/** Default linewidth (FWHM, mm/s) used when a paper does not give one. */
export const DEFAULT_FWHM = 0.194;
export const DEFAULT_HWHM = DEFAULT_FWHM / 2;

const SQRT2 = Math.sqrt(2);
const SQRT2PI = Math.sqrt(2 * Math.PI);

export function velocityAxis(vmin = -12, vmax = 12, n = 512) {
  const x = [];
  const step = (vmax - vmin) / (n - 1);
  for (let i = 0; i < n; i++) {
    x.push(vmin + i * step);
  }
  return x;
}

export function lorentzian(x, w, x0) {
  return (1 / Math.PI) * (w / ((x - x0) ** 2 + w ** 2));
}

/** Voigt-based fitting (VBF) line approximation. */
export function VBF(phi, gamma, w0, sigma_in, h) {
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

/** Lorentzian doublet ("Db") or sextet ("Sx"). */
export function buildLorentzianSite({ IS, QS, Bhf, type, HWHM, weight = 1 }) {
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
    for (let i = 0; i < x.length; i++) {
      y[i] -= lineArea * lorentzian(x[i], gamma / 2, p);
    }
  });

  return { x, y };
}

/** VBF doublet, or sextet when Bhf is non-zero. */
export function buildVBFSite(site, weight = 1) {
  const x = velocityAxis(-12, 12, 512);

  const IS = Number.isFinite(site.IS) ? site.IS : 0.0;
  const QS = Number.isFinite(site.QS) ? site.QS : 0.0;
  const Bhf = site.Bhf;
  const sigma_qs = site.sigmaQS;
  const sigma_bhf = site.sigmaBhf;

  const HWHM = Number.isFinite(site.fwhm) ? site.fwhm / 2 : DEFAULT_HWHM;
  const gamma = 2 * HWHM;

  const y = new Array(x.length).fill(0);

  // ---- DOUBLETS ----
  if (!Number.isFinite(Bhf) || Math.abs(Bhf) <= 0) {
    const sigma = Number.isFinite(sigma_qs) && sigma_qs > 0 ? sigma_qs : 1e-5;

    const Aminus_Aplus = 1; // symmetric doublet
    const area = (0.5 * weight * Aminus_Aplus + 0.5 * weight);
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

    let sigmaH = Number.isFinite(sigma_bhf) && sigma_bhf > 0 ? sigma_bhf : 1e-5;
    sigmaH = 0.067897 * sigmaH; // convert to velocity

    const f = [Z + 3, Z + 1, Z - 1, Z - 1, Z + 1, Z + 3];
    const amps = [3, 2, 1, 1, 2, 3];
    const shifts = [+QS, -QS, -QS, -QS, -QS, +QS];

    const area = weight / (3 + 2 + 1) / 0.5;
    const h = area / (Math.PI * gamma);

    for (let k = 0; k < x.length; k++) {
      for (let j = 0; j < 6; j++) {
        y[k] +=
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

/** Relative site areas, renormalised; equal areas when no paper value is given. */
export function computeSiteWeights(sites) {
  const ras = sites.map(s => s.area);
  const hasAnyRA = ras.some(v => Number.isFinite(v) && v > 0);

  if (hasAnyRA) {
    const sum = ras.reduce((a, v) => a + (Number.isFinite(v) ? v : 0), 0);
    return ras.map(v => (Number.isFinite(v) && sum > 0 ? v / sum : 0));
  }

  const n = sites.length;
  if (n <= 1) return [1];
  return Array(n).fill(1 / n);
}

function isSextet(site) {
  return Number.isFinite(site.Bhf) && Math.abs(site.Bhf) > 0;
}

/**
 * Line shape for a site. A Model column ("VBF" or "Lorentzian") decides when
 * present; otherwise VBF is used when the paper gives a distribution width
 * (σ(QS) for doublets, σ(Bhf) for sextets), and Lorentzian when it does not.
 */
export function siteModel(site) {
  if (site.model === "vbf") return "vbf";
  if (site.model) return "lorentzian";
  const sigma = isSextet(site) ? site.sigmaBhf : site.sigmaQS;
  return Number.isFinite(sigma) && sigma > 0 ? "vbf" : "lorentzian";
}

/**
 * Simulate a whole spectrum. Used by both the plot and the download, so the
 * two always match.
 * @returns {{x: number[], sum: number[], sites: {y: number[], model: string}[],
 *            weights: number[], areaGiven: boolean}}
 */
export function simulateSpectrum(spectrum) {
  const sites = spectrum.sites;
  const weights = computeSiteWeights(sites);
  const areaGiven = sites.some(s => Number.isFinite(s.area) && s.area > 0);

  const simulated = sites.map((site, i) => {
    const model = siteModel(site);
    const { y } = model === "vbf"
      ? buildVBFSite(site, weights[i])
      : buildLorentzianSite({
          IS: Number.isFinite(site.IS) ? site.IS : 0.0,
          QS: Number.isFinite(site.QS) ? site.QS : 0.0,
          Bhf: site.Bhf,
          type: site.Bhf > 0 ? "Sx" : "Db",
          HWHM: Number.isFinite(site.fwhm) ? site.fwhm / 2 : undefined,
          weight: weights[i]
        });
    return { y, model };
  });

  const x = velocityAxis(-12, 12, 512);
  const sum = x.map((_, i) => simulated.reduce((acc, s) => acc + s.y[i], 0));

  return { x, sum, sites: simulated, weights, areaGiven };
}

/** "Lorentzian", "VBF" or "Lorentzian and VBF" for a simulated spectrum. */
export function modelLabel(simulation) {
  const models = new Set(simulation.sites.map(s => s.model));
  if (models.size > 1) return "Lorentzian and VBF";
  return models.has("vbf") ? "VBF" : "Lorentzian";
}
