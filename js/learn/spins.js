// Superparamagnetism, drawn: three particles of different sizes, each full of
// iron moments (arrows). Inside a particle the moments stay lined up and
// jitter more as it warms; the whole particle flips direction at a rate set
// by its blocking temperature compared with the measurement temperature.
//
// Real flips take nanoseconds. Here they are slowed down enormously, so the
// rates only show the trend (Néel relaxation, τ ∝ exp(KV/kT)), not real times.

const NS = "http://www.w3.org/2000/svg";
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Illustrative blocking temperatures: larger particles stay blocked to higher temperatures
const PARTICLES = [
  { label: "Small", cx: 62, r: 34, TB: 40 },
  { label: "Medium", cx: 190, r: 46, TB: 120 },
  { label: "Large", cx: 336, r: 58, TB: 280 }
];
const CY = 84;
const SPACING = 17;

function el(name, attrs, parent) {
  const node = document.createElementNS(NS, name);
  Object.entries(attrs).forEach(([k, v]) => node.setAttribute(k, v));
  if (parent) parent.appendChild(node);
  return node;
}

/** Visible flips per second: rare near the blocking temperature, frequent well above it. */
function flipRate(TB, T) {
  return 6 * Math.exp(-5 * TB / T);
}

function setUp(root) {
  root.innerHTML = `
    <svg viewBox="0 0 400 200" role="img" aria-labelledby="spins-title">
      <title id="spins-title">Three magnetic particles, small, medium and large, each containing lined-up iron moments.</title>
    </svg>
    <div class="spins-controls">
      <label for="spins-T"><span>Temperature</span><output class="lab-value" for="spins-T"></output></label>
      <input id="spins-T" type="range" min="4" max="400" step="1" value="80">
      <button type="button" class="lab-preset spins-play"></button>
    </div>
    <figcaption>
      Each circle is a particle and each arrow the magnetic moment of an iron atom. The moments stay lined up, but
      heat makes the whole particle flip. A particle that flips faster than the measurement gives a doublet. The
      flips are drawn far slower than they really happen.
    </figcaption>`;

  const svg = root.querySelector("svg");
  const slider = root.querySelector("input");
  const output = root.querySelector("output");
  const playButton = root.querySelector(".spins-play");
  let T = Number(slider.value);
  let playing = !reduceMotion;
  let visible = false;
  let last = null;

  const particles = PARTICLES.map(p => {
    const group = el("g", {}, svg);
    el("circle", { class: "spins-particle", cx: p.cx, cy: CY, r: p.r }, group);
    const arrows = [];
    for (let x = p.cx - p.r; x <= p.cx + p.r; x += SPACING) {
      for (let y = CY - p.r; y <= CY + p.r; y += SPACING) {
        if (Math.hypot(x - p.cx, y - CY) > p.r - 9) continue;
        const g = el("g", { class: "spins-arrow" }, group);
        el("line", { x1: 0, y1: 6, x2: 0, y2: -4 }, g);
        el("path", { d: "M-3.5 -2L0 -7L3.5 -2z" }, g);
        arrows.push({ g, x, y, phase: Math.random() * 6.28, speed: 2 + Math.random() * 3 });
      }
    }
    el("text", { class: "cf-text", x: p.cx, y: CY + p.r + 22, "text-anchor": "middle" }, group).textContent = `${p.label} particle`;
    const status = el("text", { class: "cf-small", x: p.cx, y: CY + p.r + 38, "text-anchor": "middle" }, group);
    return { ...p, group, arrows, status, angle: 0, target: 0 };
  });

  function draw(time) {
    const jitter = 22 * Math.sqrt(T / 400);   // thermal wobble of each moment, in degrees
    particles.forEach(p => {
      p.angle += (p.target - p.angle) * 0.25;  // quick swing when the particle flips
      p.arrows.forEach(a => {
        const wobble = jitter * Math.sin(a.phase + (time / 1000) * a.speed);
        a.g.setAttribute("transform", `translate(${a.x} ${a.y}) rotate(${(p.angle + wobble).toFixed(1)})`);
      });
    });
  }

  function update() {
    output.textContent = `${T} K`;
    particles.forEach(p => {
      const blocked = T < p.TB;
      p.status.textContent = blocked ? "stays put: sextet" : "flips: doublet";
      p.status.classList.toggle("spins-status-blocked", blocked);
      // Without animation, fade the moments of particles that would be flipping
      p.group.classList.toggle("spins-flipping", reduceMotion && !blocked);
    });
    playButton.textContent = playing ? "Pause" : "Play";
    playButton.hidden = reduceMotion;
    draw(performance.now());
  }

  function frame(time) {
    if (!playing || !visible) {
      last = null;
      return;
    }
    const dt = last === null ? 0 : Math.min((time - last) / 1000, 0.1);
    last = time;
    particles.forEach(p => {
      if (Math.random() < flipRate(p.TB, T) * dt) p.target = p.target === 0 ? 180 : 0;
    });
    draw(time);
    requestAnimationFrame(frame);
  }

  function start() {
    if (playing && visible) requestAnimationFrame(frame);
  }

  slider.addEventListener("input", () => {
    T = Number(slider.value);
    update();
  });
  playButton.addEventListener("click", () => {
    playing = !playing;
    update();
    start();
  });

  // Only animate while the figure is on screen
  new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    start();
  }).observe(root);

  update();
}

document.querySelectorAll("[data-spins]").forEach(setUp);
