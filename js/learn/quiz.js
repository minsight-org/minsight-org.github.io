// Quick quiz at the end of the learn guides. Answers are checked in the page;
// nothing is stored or sent anywhere.

const QUESTIONS = [
  {
    q: "Why is the gamma-ray source moved backwards and forwards during a measurement?",
    options: [
      "To keep the source from overheating",
      "To use the Doppler effect to shift the gamma-ray energy very slightly",
      "To average out the orientation of crystals in the sample",
      "To reduce background counts at the detector"
    ],
    answer: 1,
    why: "Moving the source changes the gamma-ray energy very slightly through the Doppler effect, so the spectrum can scan across the nuclear transitions.",
    guide: ["first-look.html", "A first look at Mössbauer spectroscopy"]
  },
  {
    q: "Why is the area of a fitted site only roughly proportional to the amount of iron in that environment?",
    options: [
      "Only 2% of natural iron is iron-57",
      "The detector is less sensitive at high velocities",
      "Different iron environments absorb with different efficiency (the recoil-free fraction)",
      "Linewidths vary between sites"
    ],
    answer: 2,
    why: "Some iron environments absorb more efficiently than others, which is described by the recoil-free fraction.",
    guide: ["hyperfine-parameters.html#relative-area", "Hyperfine parameters"]
  },
  {
    q: "A powder holder held up to the light shows small holes in the sample layer. What will this do to the spectrum?",
    options: [
      "Make the lines shallower, because some gamma rays miss the iron",
      "Broaden the lines and distort the relative areas",
      "Shift the whole spectrum to higher velocity",
      "Have no effect as long as the total mass is correct"
    ],
    answer: 0,
    why: "Gamma rays that pass through the holes miss the iron, so the lines become shallower. Broadening and distorted areas come from patches that are too thick.",
    guide: ["sample-preparation.html", "Preparing a sample"]
  },
  {
    q: "Why can a sample prepared by filtering only be measured below room temperature?",
    options: [
      "Kapton tape becomes brittle when warm",
      "It must stay frozen in case of residual moisture",
      "Filtered samples are always superparamagnetic",
      "The filter itself absorbs gamma rays at room temperature"
    ],
    answer: 1,
    why: "The filtered sample is kept frozen in case it still holds some moisture.",
    guide: ["sample-preparation.html#filtration", "Preparing a sample"]
  },
  {
    q: "Why does high-spin Fe(II) have a larger isomer shift than high-spin Fe(III)?",
    options: [
      "It has a stronger hyperfine field",
      "Its environment is always less symmetric",
      "Its extra 3d electron shields the s electrons, so fewer reach the nucleus",
      "It has a higher recoil-free fraction"
    ],
    answer: 2,
    why: "The extra 3d electron shields the s electrons, so fewer reach the nucleus, which for iron-57 gives a larger isomer shift.",
    guide: ["hyperfine-parameters.html#isomer-shift", "Hyperfine parameters"]
  },
  {
    q: "Spectrometers are usually run from −12 to +12 mm/s. What would be lost with a much narrower range?",
    options: [
      "The doublets of Fe(II) minerals",
      "The outer lines of sextets with large fields, such as hematite at about 52 T",
      "The quadrupole shift of goethite",
      "The second-order Doppler shift"
    ],
    answer: 1,
    why: "The outer lines of hematite lie at about ±8 mm/s, so a narrow range would cut them off.",
    guide: ["hyperfine-parameters.html#hyperfine-field", "Hyperfine parameters"]
  },
  {
    q: "Nanoparticulate goethite gives a doublet at room temperature even though it is magnetically ordered. What is the explanation?",
    options: [
      "It is above its Néel temperature",
      "The magnetisation of each particle flips faster than the roughly 10⁻⁸ s the measurement needs to “see” a field",
      "The sample was too thick",
      "Aluminium substitution has removed the hyperfine field"
    ],
    answer: 1,
    why: "This is superparamagnetism. Each particle's magnetisation flips so quickly that the field averages out to zero during the measurement.",
    guide: ["temperature.html", "Temperature: from doublet to sextet"]
  },
  {
    q: "Why is magnetite best measured at about 140 K?",
    options: [
      "It is cold enough to bring the A and B site recoil-free fractions closer together, but above the Verwey transition",
      "It is below the Verwey transition, which simplifies the spectrum",
      "It is the blocking temperature of most magnetite nanoparticles",
      "Magnetite only becomes magnetically ordered below 150 K"
    ],
    answer: 0,
    why: "At about 140 K the A and B site recoil-free fractions are closer together, while the spectrum is still above the Verwey transition (about 120 K) and can be fitted with two sites.",
    guide: ["temperature.html", "Temperature: from doublet to sextet"]
  },
  {
    q: "In Voigt-based fitting of a sextet with a spread in hyperfine field, which lines are broadened most?",
    options: [
      "All six equally",
      "The two inner lines",
      "The two outer lines, because they move furthest when the field changes",
      "Only lines 3 and 4"
    ],
    answer: 2,
    why: "The outer lines move furthest when the field changes, so a spread of fields broadens them most.",
    guide: ["line-shapes.html", "Line shapes: Lorentzian or Voigt?"]
  },
  {
    q: "At 4.2 K the hyperfine fields of hematite and goethite are fairly close. What best separates them?",
    options: [
      "The isomer shift, which is much larger for goethite",
      "The sign of the quadrupole shift, positive for hematite and negative for goethite",
      "Goethite gives a doublet at 4.2 K",
      "Hematite has a second sextet near 0.67 mm/s"
    ],
    answer: 1,
    why: "Below the Morin transition hematite's quadrupole shift turns positive, while goethite's stays negative.",
    guide: ["iron-oxides.html", "Telling iron oxides apart"]
  }
];

const LETTERS = "ABCD";

function make(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function setUp(root) {
  const list = make("ol", "quiz-list");
  const score = make("p", "quiz-score");
  score.setAttribute("aria-live", "polite");
  const restart = make("button", "button button-outline", "Start again");
  restart.type = "button";
  restart.hidden = true;
  let answered = 0;
  let correct = 0;

  function build() {
    list.replaceChildren();
    answered = 0;
    correct = 0;
    score.textContent = "";
    restart.hidden = true;

    QUESTIONS.forEach((item, qi) => {
      const li = make("li", "quiz-question");
      const fieldset = make("fieldset");
      fieldset.append(make("legend", "", item.q));
      const feedback = make("div", "quiz-feedback");
      feedback.setAttribute("aria-live", "polite");

      item.options.forEach((text, oi) => {
        const label = make("label", "quiz-option");
        const radio = make("input");
        Object.assign(radio, { type: "radio", name: `quiz-${qi}`, value: oi });
        const letter = make("span", "quiz-letter", LETTERS[oi]);
        label.append(radio, letter, make("span", "", text));
        radio.addEventListener("change", () => {
          // The first answer counts; the question then locks
          fieldset.querySelectorAll("input").forEach(r => { r.disabled = true; });
          const right = oi === item.answer;
          answered++;
          if (right) correct++;
          fieldset.querySelectorAll(".quiz-option").forEach((o, k) => {
            o.classList.toggle("is-answer", k === item.answer);
            o.classList.toggle("is-wrong", k === oi && !right);
          });
          li.classList.add(right ? "is-right" : "is-wrong-answer");
          feedback.replaceChildren(
            make("p", "quiz-verdict", right ? "Correct." : `Not quite. The answer is ${LETTERS[item.answer]}.`),
            make("p", "", item.why)
          );
          const more = make("p", "quiz-more");
          const link = make("a", "", item.guide[1]);
          link.href = item.guide[0];
          more.append("Read more in ", link, ".");
          feedback.append(more);
          if (answered === QUESTIONS.length) {
            score.textContent = `You answered ${correct} of ${QUESTIONS.length} correctly.`;
            restart.hidden = false;
          }
        });
        fieldset.append(label);
      });

      li.append(fieldset, feedback);
      list.append(li);
    });
  }

  restart.addEventListener("click", () => {
    build();
    list.querySelector("input")?.focus();
  });

  root.append(list, score, restart);
  build();
}

document.querySelectorAll("[data-quiz]").forEach(setUp);
