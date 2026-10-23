// A simulated Mössbauer spectrometer for the first learn guide.
//
// A drive moves the source with a triangular velocity profile (constant
// acceleration), sweeping from −v to +v and back. The computer stores counts
// in 512 channels over one sweep, so the raw spectrum holds two mirror images
// (unfolded). Folding adds the two halves to give counts against velocity.
//
// The sample is a hematite-like sextet. Counting noise is random, so the
// spectrum emerges as the measurement runs.

import { buildLorentzianSite, velocityAxis } from "../db/spectrum.js";

const NS = "http://www.w3.org/2000/svg";
const CHANNELS = 512;
const HALF = CHANNELS / 2;
const COUNTS_PER_TICK = 4000;     // counts per channel per step, far from the dips
const EFFECT = 0.12;              // depth of the deepest line (12% absorption)
const TICK_MS = 100;
const HOURS_PER_TICK = 0.25;      // simulated measuring time per step
const MAX_TICKS = 120;            // the measurement stops after 30 simulated hours
const SWEEP_SECONDS = 2;          // how fast the drawn source moves (a real drive is much faster)

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- The sample ---------- */

const GRID = velocityAxis();
const ABSORPTION = (() => {
  const y = buildLorentzianSite({ IS: 0.37, QS: -0.10, Bhf: 51.8, type: "Sx", HWHM: 0.15, weight: 1 }).y;
  const deepest = Math.max(...y.map(Math.abs));
  return y.map(v => Math.abs(v) / deepest);
})();

/** Fraction of gamma rays that pass through the sample at velocity v (mm/s). */
function transmission(v) {
  if (v <= GRID[0] || v >= GRID[GRID.length - 1]) return 1;
  const step = GRID[1] - GRID[0];
  const i = Math.floor((v - GRID[0]) / step);
  const f = (v - GRID[i]) / step;
  return 1 - EFFECT * (ABSORPTION[i] * (1 - f) + ABSORPTION[i + 1] * f);
}

/** Source velocity while channel k is recorded: up the first half, down the second. */
function channelVelocity(k, vmax) {
  return k < HALF
    ? -vmax + 2 * vmax * (k + 0.5) / HALF
    : vmax - 2 * vmax * (k - HALF + 0.5) / HALF;
}

function gaussian() {
  const u = 1 - Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * Math.random());
}

/* ---------- Drawing helpers ---------- */

function el(name, attrs, parent) {
  const node = document.createElementNS(NS, name);
  Object.entries(attrs).forEach(([k, v]) => node.setAttribute(k, v));
  if (parent) parent.appendChild(node);
  return node;
}

function text(parent, x, y, content, attrs = {}) {
  el("text", { x, y, ...attrs }, parent).textContent = content;
}

/**
 * Counts as dots, scaled to their own range, with ticks along the bottom.
 * ticks: [{x, label, sub}] in data units; marker: optional x to highlight.
 */
function drawCounts(svg, xs, ys, { width, height, xMin, xMax, ticks, label, marker }) {
  svg.replaceChildren();
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  const pad = { left: 20, right: 20, top: 14, bottom: ticks.some(t => t.sub) ? 68 : 52 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;
  const sx = v => pad.left + (v - xMin) / (xMax - xMin) * plotW;

  const finite = ys.filter(Number.isFinite);
  let lo = Math.min(...finite);
  let hi = Math.max(...finite);
  if (!finite.length || hi - lo < 1e-9) {
    lo = (finite[0] || 1) * 0.9;
    hi = (finite[0] || 1) * 1.02;
  }
  const span = hi - lo;
  const sy = v => pad.top + (1 - (v - lo + span * 0.05) / (span * 1.1)) * plotH;

  const axisY = height - pad.bottom + 8;
  el("line", { class: "plot-axis", x1: pad.left, x2: width - pad.right, y1: axisY, y2: axisY }, svg);
  ticks.forEach((t, i) => {
    // End labels line up with the ends of the axis, so they are not cut off
    const anchor = i === 0 ? "start" : i === ticks.length - 1 && ticks.length > 1 ? "end" : "middle";
    const x = anchor === "start" ? sx(t.x) - 4 : anchor === "end" ? sx(t.x) + 4 : sx(t.x);
    el("line", { class: "plot-axis", x1: sx(t.x), x2: sx(t.x), y1: axisY, y2: axisY + 5 }, svg);
    text(svg, x, axisY + 18, t.label, { class: "plot-text", "text-anchor": anchor });
    if (t.sub) text(svg, x, axisY + 33, t.sub, { class: "plot-text plot-text-sub", "text-anchor": anchor });
  });
  text(svg, width / 2, height - 2, label, { class: "plot-text", "text-anchor": "middle" });

  if (Number.isFinite(marker)) {
    el("line", { class: "plot-marker", x1: sx(marker), x2: sx(marker), y1: pad.top, y2: axisY }, svg);
  }

  if (!finite.length) return;
  const d = xs.map((x, i) => `M${sx(x).toFixed(1)} ${sy(ys[i]).toFixed(1)}h0`).join("");
  el("path", { class: "plot-dots", d }, svg);
}

/* ---------- The widget ---------- */

function setUp(root) {
  let vmax = 0;
  let counts = new Float64Array(CHANNELS);
  let ticks = 0;
  let running = false;
  let timer = null;
  let phase = 0;
  let lastFrame = null;

  root.innerHTML = `
    <figure class="inst-figure">
      <svg class="inst-schematic" viewBox="0 0 720 160" role="img"
           aria-label="A drive unit moves the radioactive source backwards and forwards. Gamma rays from the source pass through the sample to a detector, which is connected to a computer.">
        <rect class="inst-box" x="16" y="52" width="104" height="56" rx="6"></rect>
        <text class="inst-label" x="68" y="85" text-anchor="middle">Drive</text>
        <line class="inst-rod" x1="120" y1="80" x2="170" y2="80"></line>
        <g class="inst-source-group">
          <circle class="inst-source" cx="178" cy="80" r="11"></circle>
          <text class="inst-small" x="178" y="124" text-anchor="middle">Source</text>
          <text class="inst-velocity" x="178" y="38" text-anchor="middle"></text>
        </g>
        <line class="inst-beam" x1="194" y1="80" x2="520" y2="80"></line>
        <rect class="inst-sample" x="346" y="46" width="14" height="68" rx="2"></rect>
        <text class="inst-small" x="353" y="150" text-anchor="middle">Sample</text>
        <rect class="inst-box" x="520" y="56" width="64" height="48" rx="6"></rect>
        <text class="inst-small" x="552" y="124" text-anchor="middle">Detector</text>
        <line class="inst-cable" x1="584" y1="80" x2="616" y2="80"></line>
        <rect class="inst-box" x="616" y="50" width="88" height="60" rx="6"></rect>
        <rect class="inst-screen-icon" x="628" y="60" width="64" height="34" rx="2"></rect>
        <text class="inst-small" x="660" y="150" text-anchor="middle">Computer</text>
      </svg>
      <div class="inst-screen">
        <p class="inst-screen-title">On the computer: counts in each channel (unfolded)</p>
        <svg class="inst-plot" role="img" aria-label="Counts recorded in each channel during one sweep of the drive."></svg>
      </div>
    </figure>

    <div class="inst-controls">
      <div class="lab-control">
        <label for="inst-vmax"><span>Maximum velocity of the drive</span><output class="lab-value" for="inst-vmax"></output></label>
        <input id="inst-vmax" type="range" min="0" max="12" step="0.5" value="0">
      </div>
      <div class="inst-buttons">
        <button type="button" class="button inst-run">Start measuring</button>
        <button type="button" class="button button-outline inst-clear">Clear</button>
      </div>
      <p class="lab-readout" aria-live="polite"></p>
    </div>

    <aside class="inst-fold" aria-labelledby="fold-title">
      <p class="inst-fold-title" id="fold-title">Folding the spectrum</p>
      <p>
        The drive sweeps the velocity up and then back down, so every velocity is recorded twice, once in each half of
        the channels. That is why the raw spectrum shows two mirror images. Folding lays one half over the other and adds
        them, giving counts against velocity.
      </p>
      <div class="inst-fold-plot">
        <svg role="img" aria-label="The folded spectrum: counts against velocity."></svg>
      </div>
      <p class="inst-fold-note">
        The folding point is found from a calibration measurement, usually of α-Fe foil, which also converts channel
        numbers into velocities. Folding at the wrong point broadens the lines.
      </p>
    </aside>
  `;

  const slider = root.querySelector("#inst-vmax");
  const output = root.querySelector("output");
  const runButton = root.querySelector(".inst-run");
  const clearButton = root.querySelector(".inst-clear");
  const readout = root.querySelector(".lab-readout");
  const plot = root.querySelector(".inst-plot");
  const foldPlot = root.querySelector(".inst-fold-plot svg");
  const sourceGroup = root.querySelector(".inst-source-group");
  const velocityText = root.querySelector(".inst-velocity");
  const beam = root.querySelector(".inst-beam");

  const channelIndex = Array.from({ length: CHANNELS }, (_, k) => k);

  function clear() {
    counts = new Float64Array(CHANNELS);
    ticks = 0;
  }

  function measureStep() {
    for (let k = 0; k < CHANNELS; k++) {
      const expected = COUNTS_PER_TICK * transmission(channelVelocity(k, vmax));
      counts[k] += expected + Math.sqrt(expected) * gaussian();
    }
    ticks++;
    if (ticks >= MAX_TICKS) setRunning(false);
    draw();
  }

  function setRunning(on) {
    running = on;
    runButton.textContent = on ? "Pause" : ticks ? "Continue measuring" : "Start measuring";
    beam.classList.toggle("is-running", on && !reduceMotion);
    clearInterval(timer);
    if (on) {
      if (ticks >= MAX_TICKS) clear();
      timer = setInterval(measureStep, TICK_MS);
      lastFrame = null;
      if (!reduceMotion) requestAnimationFrame(animate);
    }
    draw();
  }

  // The drawn source follows the drive: position is the integral of the triangular velocity
  function sourceAt(p) {
    const x = p < 0.5 ? -vmax * p + 2 * vmax * p * p : 3 * vmax * (p - 0.5) - 2 * vmax * (p * p - 0.25);
    const v = p < 0.5 ? -vmax + 4 * vmax * p : 3 * vmax - 4 * vmax * p;
    return { x: x * 26 / 1.5, v };
  }

  function animate(time) {
    if (!running) return;
    if (lastFrame !== null) phase = (phase + (time - lastFrame) / 1000 / SWEEP_SECONDS) % 1;
    lastFrame = time;
    const { x, v } = sourceAt(phase);
    sourceGroup.setAttribute("transform", `translate(${x.toFixed(1)} 0)`);
    velocityText.textContent = `v = ${v >= 0 ? "+" : "−"}${Math.abs(v).toFixed(1)} mm/s`;
    drawMain(Math.floor(phase * CHANNELS));
    requestAnimationFrame(animate);
  }

  // Plots are drawn narrower on small screens, so their text is not shrunk too far
  const plotWidth = full => (root.clientWidth < 520 ? Math.round(full * 0.6) : full);

  function drawMain(markerChannel) {
    const vLabel = v => `v = ${v === 0 ? "0" : `${v > 0 ? "+" : "−"}${Math.abs(v)}`}`;
    drawCounts(plot, channelIndex, ticks ? Array.from(counts) : [], {
      width: plotWidth(720), height: 246, xMin: 0, xMax: CHANNELS,
      label: root.clientWidth < 520 ? "Channel (velocity v in mm/s)" : "Channel, with the source velocity (v, mm/s) underneath",
      ticks: [
        { x: 0, label: "0", sub: vLabel(-vmax) },
        { x: 128, label: "128", sub: "v = 0" },
        { x: 256, label: "256", sub: vLabel(vmax) },
        { x: 384, label: "384", sub: "v = 0" },
        { x: 512, label: "512", sub: vLabel(-vmax) }
      ],
      marker: running && !reduceMotion ? markerChannel : NaN
    });
  }

  function draw() {
    output.textContent = `${vmax.toFixed(1)} mm/s`;
    if (!running || reduceMotion) {
      sourceGroup.removeAttribute("transform");
      velocityText.textContent = vmax ? `sweeps ±${vmax.toFixed(1)} mm/s` : "standing still";
    }
    if (!running || reduceMotion) drawMain(NaN);

    const folded = [];
    const foldedV = [];
    for (let j = 0; j < HALF; j++) {
      folded.push(counts[j] + counts[CHANNELS - 1 - j]);
      foldedV.push(channelVelocity(j, vmax));
    }
    const range = vmax || 1;
    drawCounts(foldPlot, foldedV, ticks ? folded : [], {
      width: plotWidth(480) + (root.clientWidth < 520 ? 60 : 0), height: 200, xMin: -range, xMax: range,
      label: "Velocity (mm/s)",
      ticks: vmax ? [{ x: -vmax, label: `−${vmax}` }, { x: 0, label: "0" }, { x: vmax, label: `+${vmax}` }] : [{ x: 0, label: "0" }]
    });

    const hours = ticks * HOURS_PER_TICK;
    const time = ticks ? ` After ${hours < 1 ? `${Math.round(hours * 60)} minutes` : `${hours} hours`} of (simulated) measuring.` : "";
    if (!vmax) {
      readout.textContent = "With the source standing still, every channel records the same energy, so there is nothing to see. Increase the velocity." + time;
    } else if (!ticks) {
      readout.textContent = "Press Start measuring to count gamma rays at each velocity.";
    } else if (vmax < 8.5) {
      readout.textContent = `The velocity range is too small to reach the outer lines of this sample. Try a larger maximum velocity.${time}`;
    } else if (ticks < 12) {
      readout.textContent = `Counts are still low, so the spectrum is noisy.${time}`;
    } else {
      readout.textContent = `The lines stand out more clearly as counts build up.${time}`;
    }
  }

  slider.addEventListener("input", () => {
    vmax = Number(slider.value);
    clear();               // a new velocity range means a new measurement
    if (!running) runButton.textContent = "Start measuring";
    draw();
  });

  runButton.addEventListener("click", () => setRunning(!running));
  clearButton.addEventListener("click", () => {
    setRunning(false);
    clear();
    runButton.textContent = "Start measuring";
    draw();
  });

  draw();
}

document.querySelectorAll("[data-instrument]").forEach(setUp);
