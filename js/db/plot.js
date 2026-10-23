// Small SVG plot of a simulated spectrum: each site in grey, the selected site
// highlighted, and the sum on top. Colours come from css/database.css, so the
// plot follows the light and dark themes.

const NS = "http://www.w3.org/2000/svg";
const W = 480;
const H = 260;
const PAD = { left: 16, right: 16, top: 16, bottom: 44 };
const TICKS = [-12, -8, -4, 0, 4, 8, 12];

function el(name, attrs, parent) {
  const node = document.createElementNS(NS, name);
  Object.entries(attrs).forEach(([k, v]) => node.setAttribute(k, v));
  if (parent) parent.appendChild(node);
  return node;
}

/**
 * Draw `simulation` (from simulateSpectrum) into an <svg>.
 * @param {SVGSVGElement} svg
 * @param {number} selected  Index of the site to highlight, or -1
 * @param {{depth?: number, reference?: number[], yAxis?: boolean}} options
 *   depth: fixed absorption depth for the full plot height, so lines visibly
 *   shrink as they split (the learn guides); otherwise scaled to the deepest line.
 *   reference: an extra curve drawn dashed for comparison.
 *   yAxis: draw a relative absorption axis, 0 to 100% of `depth`.
 */
export function drawSpectrum(svg, simulation, selected = -1, options = {}) {
  svg.replaceChildren();
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);

  const { x, sum, sites } = simulation;
  const all = [...sum, ...sites.flatMap(s => s.y)].map(Math.abs).filter(Number.isFinite);
  const depth = options.depth || Math.max(...all) || 1;

  const left = options.yAxis ? 52 : PAD.left;
  const plotW = W - left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;
  const sx = v => left + (v - x[0]) / (x[x.length - 1] - x[0]) * plotW;
  // Baseline at the top, absorption lines dip downwards
  const sy = v => PAD.top + Math.min(-v / depth, 1.04) * plotH * 0.95;

  const path = y => y.map((v, i) => `${i ? "L" : "M"}${sx(x[i]).toFixed(1)} ${sy(v).toFixed(1)}`).join("");

  // Axis, ticks and label
  const axisY = H - PAD.bottom + 8;
  el("line", { class: "plot-axis", x1: left, x2: W - PAD.right, y1: axisY, y2: axisY }, svg);
  TICKS.forEach(v => {
    el("line", { class: "plot-axis", x1: sx(v), x2: sx(v), y1: axisY, y2: axisY + 5 }, svg);
    el("text", { class: "plot-text", x: sx(v), y: axisY + 18, "text-anchor": "middle" }, svg).textContent = v;
  });
  el("text", { class: "plot-text", x: left + plotW / 2, y: H - 4, "text-anchor": "middle" }, svg).textContent = "Velocity (mm/s)";

  if (options.yAxis) {
    const ax = left - 8;
    el("line", { class: "plot-axis", x1: ax, x2: ax, y1: sy(0), y2: sy(-depth) }, svg);
    [0, 50, 100].forEach(pct => {
      const y = sy(-depth * pct / 100);
      el("line", { class: "plot-axis", x1: ax - 5, x2: ax, y1: y, y2: y }, svg);
      el("text", { class: "plot-text", x: ax - 8, y: y + 4, "text-anchor": "end" }, svg).textContent = pct;
    });
    el("text", { class: "plot-text", x: 12, y: PAD.top + plotH * 0.475, "text-anchor": "middle",
                 transform: `rotate(-90 12 ${PAD.top + plotH * 0.475})` }, svg).textContent = "Relative absorption (%)";
  }

  // Other sites, then the sum, then the selected site on top
  sites.forEach((site, i) => {
    if (i !== selected) el("path", { class: "plot-site", d: path(site.y) }, svg);
  });
  if (options.reference) el("path", { class: "plot-reference", d: path(options.reference) }, svg);
  el("path", { class: "plot-sum", d: path(sum) }, svg);
  if (selected >= 0 && selected < sites.length) {
    el("path", { class: "plot-site plot-site-selected", d: path(sites[selected].y) }, svg);
  }
}
