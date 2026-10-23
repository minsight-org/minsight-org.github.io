// "Download simulated spectrum": a tab-separated text file with the sample
// details, the reference, the site parameters and the simulated curves.

import { DEFAULT_FWHM, MIN_FWHM, simulateSpectrum } from "./spectrum.js";

function value(v, raw) {
  return Number.isFinite(v) ? String(v) : (raw || "—");
}

export function spectrumText(spectrum) {
  const sim = simulateSpectrum(spectrum);
  const { sites } = spectrum;
  const temp = Number.isFinite(spectrum.temperatureK) ? spectrum.temperatureK : "Unknown";
  const ref = spectrum.reference;

  const lines = [
    `# Sample: ${spectrum.sample || "Unknown sample"}`,
    `# Mineral class: ${spectrum.mineralClass || "Not given"}`,
    `# sample_id: ${spectrum.id}`,
    `# Temperature (K): ${temp}`,
    ""
  ];

  const refText = [ref.title, ref.authors, ref.year, ref.doi ? `https://doi.org/${ref.doi}` : ref.url]
    .filter(Boolean).join(". ");
  if (refText) lines.push(`# Reference: ${refText}`, "");

  const noFwhm = sites.some(s => !Number.isFinite(s.fwhm));
  const noIsQs = sites.some(s => !Number.isFinite(s.IS) || !Number.isFinite(s.QS));

  lines.push("# Notes: The Mössbauer spectra in this file are simulated from published hyperfine parameters.");
  lines.push(`# Line shapes: ${sim.sites.map((s, i) => `${sites[i].name} ${s.model === "vbf" ? "VBF" : "Lorentzian"}`).join(", ")}.`);
  if (!sim.areaGiven) lines.push("#   * Relative areas were not provided, so equal site areas were assumed.");
  if (noFwhm) lines.push(`#   * Where linewidths were not provided, or were below ${MIN_FWHM} mm/s (narrower than the natural linewidth of 57Fe), FWHM ${DEFAULT_FWHM} mm/s (HWHM ${DEFAULT_FWHM / 2} mm/s) was used.`);
  if (noIsQs) lines.push("#   * Where IS or QS were not provided, 0 mm/s was used.");
  lines.push("# These data are intended for visualisation, comparison and educational use only.");
  lines.push("");
  lines.push("# If you use this simulated spectrum in a publication or grant proposal, please cite:");
  lines.push("# Byrne, J. M. MinSight – a new concept for fitting and interpreting Mössbauer spectroscopy data.");
  lines.push("# Hyperfine Interactions (2025). https://doi.org/10.1007/s10751-025-02331-7");
  lines.push(`# File generated on: ${new Date().toISOString()}`);
  lines.push("");

  lines.push("# Sites table");
  lines.push(["Site", "Oxidation_state", "Isomer_Shift_mm_s", "IS_error", "Quadrupole_Splitting_mm_s", "QS_error",
              "Hyperfine_Field_T", "Bhf_error", "Linewidth_FWHM_mm_s", "Relative_Area_percent", "Fitted_with",
              "Simulated_as"].join("\t"));
  sites.forEach((s, i) => {
    lines.push([
      s.name,
      s.oxidation || "—",
      value(s.IS, s.raw.IS),
      value(s.ISError),
      value(s.QS, s.raw.QS),
      value(s.QSError),
      value(s.Bhf, s.raw.Bhf),
      value(s.BhfError),
      value(s.fwhm, s.raw.fwhm),
      value(s.area, s.raw.area),
      s.fitModel || "Not given",
      sim.sites[i].model === "vbf" ? "VBF" : "Lorentzian"
    ].join("\t"));
  });
  lines.push("");

  lines.push("# Spectrum");
  lines.push(["Velocity(mm/s)", "Sum", ...sites.map(s => s.name)].join("\t"));
  sim.x.forEach((v, i) => {
    lines.push([v.toFixed(5), sim.sum[i].toExponential(6), ...sim.sites.map(s => s.y[i].toExponential(6))].join("\t"));
  });

  return lines.join("\n");
}

export function downloadSpectrum(spectrum) {
  const blob = new Blob([spectrumText(spectrum)], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const temp = Number.isFinite(spectrum.temperatureK) ? `${spectrum.temperatureK}K` : "T-unknown";
  const a = document.createElement("a");
  a.href = url;
  a.download = `${spectrum.id}_${spectrum.sample || "sample"}_${temp}_spectrum.txt`
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, "_");
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);

  // GoatCounter event: shows as download-spectrum/<sample id> in the dashboard
  try {
    window.goatcounter?.count?.({
      path: `download-spectrum/${spectrum.id}`,
      title: `${spectrum.sample} (${temp})`,
      event: true
    });
  } catch (e) {
    // Analytics must never break downloads
  }
}
