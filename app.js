// ===== CONFIG =====
const PROXY = "https://chartie-proxy.onrender.com";
const MODEL = "models/gemini-2.5-flash";

// ===== DOM refs =====
const topicEl = document.getElementById("topic");
const btnGen = document.getElementById("btn-generate");
const btnDl = document.getElementById("btn-download");
const btnPDF = document.getElementById("btn-pdf");
const errorEl = document.getElementById("error");

const sheet = document.getElementById("sheet");
const titleEl = document.getElementById("chart-title");
const subEl = document.getElementById("chart-sub");
const contentEl = document.getElementById("chart-content");
const formatBadge = document.getElementById("format-badge");
const srStatus = document.getElementById("sr-status");

const layoutSel = document.getElementById("layout");
const hlStyleSel = document.getElementById("hlStyle");
const fontPresetSel = document.getElementById("fontPreset");
const bgStyleSel = document.getElementById("bgStyle");
const paperSel = document.getElementById("paper");
const orientSel = document.getElementById("orientation");

const toggleBig = document.getElementById("toggle-big");
const toggleEmoji = document.getElementById("toggle-emoji");
const toggleHand = document.getElementById("toggle-hand");
const toggleSticky = document.getElementById("toggle-sticky");

const progFill = document.getElementById("prog-fill");
const pencil = document.getElementById("pencil");
const loadingText = document.getElementById("loading-text");

const qtPanel = document.getElementById("qt-panel");
const qtRows = document.getElementById("qt-rows");
const qtTitle = document.getElementById("qt-title");
const qtSplitBlank = document.getElementById("qt-split-blank");
const qtSplitLines = document.getElementById("qt-split-lines");

const stickyBox = document.getElementById("sticky");
const stickyH = document.getElementById("sticky-h");
const stickyP = document.getElementById("sticky-p");
const stickyControls = document.getElementById("sticky-controls");
const stickyTitle = document.getElementById("sticky-title");
const stickyText = document.getElementById("sticky-text");

const accentButtons = [...document.querySelectorAll(".swatch")];

// ===== State =====
let lastChartJSON = null;

const simpleLayouts = new Set([
  "simple-title-body",
  "simple-2col",
  "simple-3col",
  "simple-2x2",
  "simple-title-sub-3",
  "simple-title-sub-list",
  "simple-quote",
  "simple-def-callout",
  "simple-objective-steps",
  "simple-image"
]);

// These are the optional CRex layouts you can add to <select> later
const crexLayouts = new Set(["crex-short", "crex-extended"]);

function isSimpleLayout(v) {
  return simpleLayouts.has(v);
}
function isCRexLayout(v) {
  return crexLayouts.has(v);
}

// ===== Helper: accent + fonts + background =====
function setAccent(hex) {
  document.documentElement.style.setProperty("--accent", hex);
  // regen brush underline SVG based on accent
  const acc = hex.replace("#", "%23");
  const url = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 12' preserveAspectRatio='none'><path d='M2 9 Q 22 2, 42 8 T 98 8' fill='none' stroke='${acc}' stroke-width='6' stroke-linecap='round'/></svg>")`;
  document.documentElement.style.setProperty("--brush-url", url);
  refreshHighlights();
}

function setFonts(preset) {
  if (preset === "hand+rounded") {
    document.documentElement.style.setProperty(
      "--title-font",
      "'Patrick Hand', cursive"
    );
    document.documentElement.style.setProperty(
      "--body-font",
      "'Poppins', system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    );
  } else if (preset === "serif+rounded") {
    document.documentElement.style.setProperty(
      "--title-font",
      "'DM Serif Display', serif"
    );
    document.documentElement.style.setProperty(
      "--body-font",
      "'Nunito Sans', system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    );
  } else if (preset === "hand+sans") {
    document.documentElement.style.setProperty(
      "--title-font",
      "'Patrick Hand', cursive"
    );
    document.documentElement.style.setProperty(
      "--body-font",
      "'Nunito Sans', system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    );
  } else {
    // clean academic default
    document.documentElement.style.setProperty(
      "--title-font",
      "'Nunito Sans', system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    );
    document.documentElement.style.setProperty(
      "--body-font",
      "'Nunito Sans', system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    );
  }
}

function setBackground(style) {
  sheet.classList.remove(
    "bg-lined-light",
    "bg-lined-dark",
    "bg-blank",
    "bg-graph",
    "bg-poster"
  );
  sheet.classList.add(
    style === "lined-dark"
      ? "bg-lined-dark"
      : style === "blank"
      ? "bg-blank"
      : style === "graph"
      ? "bg-graph"
      : style === "poster"
      ? "bg-poster"
      : "bg-lined-light"
  );
}

// ===== Helper: highlight styles =====
function refreshHighlights() {
  const style = hlStyleSel.value;
  const els = sheet.querySelectorAll(".hl");
  els.forEach((el) => {
    el.classList.remove("hl-clean", "hl-brush", "hl-none");
    if (style === "brush") {
      el.classList.add("hl-brush");
    } else if (style === "none") {
      el.classList.add("hl-none");
    } else {
      el.classList.add("hl-clean");
    }
  });
}

// ===== Topic heuristics =====
function emojiFor(i) {
  const set = ["🎯", "📌", "✏️", "🧠", "✨", "📎", "💡", "🧩", "📚", "🔎"];
  return set[i % set.length] + " ";
}

function looksLikeComparison(t) {
  const s = ` ${String(t || "").toLowerCase()} `;
  return /( vs\.? | versus | compare|comparison| pov |point of view|pro\/?con|two sides|for and against|perspective)/i.test(
    s
  );
}

function looksMathy(t) {
  return /[=±×÷/]|[0-9]\s*[a-z]|[\^]|fraction|solve|equation|area|perimeter|volume|slope|intercept/i.test(
    t || ""
  );
}

function looksLikeCRex(t) {
  return /(constructed response|short response|extended response|scr|ecr)/i.test(
    t || ""
  );
}

// ===== Loading UI =====
function progressTo(p) {
  const v = Math.max(0, Math.min(100, p));
  progFill.style.width = v + "%";
  pencil.style.left = v + "%";
}

function startLoading() {
  btnGen.disabled = true;
  btnGen.textContent = "Creating…";
  progressTo(5);
  loadingText.textContent = "Cooking up a clean anchor chart…";
}

function stopLoading() {
  btnGen.disabled = false;
  btnGen.textContent = "Create Chart";
  progressTo(100);
  setTimeout(() => progressTo(0), 600);
  loadingText.textContent = "Done. Tweak anything, then download.";
}

// ===== Quick Templates (Simple layouts) =====
function addBox(label, id, rows = 5, placeholder = "Paste or type here…") {
  const wrap = document.createElement("div");
  wrap.innerHTML = `<label class="block text-xs font-semibold mb-1">${label}</label>
  <textarea id="${id}" rows="${rows}" class="w-full rounded-lg border px-3 py-2" placeholder="${placeholder}"></textarea>`;
  qtRows.appendChild(wrap);
}

function addInput(label, id, placeholder = "") {
  const wrap = document.createElement("div");
  wrap.innerHTML = `<label class="block text-xs font-semibold mb-1">${label}</label>
  <input id="${id}" class="w-full rounded-lg border px-3 py-2" placeholder="${placeholder}" />`;
  qtRows.appendChild(wrap);
}

function buildQtRows(layout) {
  qtRows.innerHTML = "";
  qtRows.className = "grid gap-3";

  if (layout === "simple-title-body") {
    addBox("Body", "qt-body", 8);
  } else if (layout === "simple-2col") {
    qtRows.classList.add("md:grid-cols-2");
    addBox("Column A", "qt-col1", 10);
    addBox("Column B", "qt-col2", 10);
  } else if (layout === "simple-3col") {
    qtRows.classList.add("md:grid-cols-3");
    addBox("Column A", "qt-col1", 10);
    addBox("Column B", "qt-col2", 10);
    addBox("Column C", "qt-col3", 10);
  } else if (layout === "simple-2x2") {
    qtRows.classList.add("md:grid-cols-2");
    addBox("Top Left", "qt-q1", 7);
    addBox("Top Right", "qt-q2", 7);
    addBox("Bottom Left", "qt-q3", 7);
    addBox("Bottom Right", "qt-q4", 7);
  } else if (layout === "simple-title-sub-3") {
    addInput("Subtitle", "qt-sub", "Short supporting line…");
    addInput("Bullet 1", "qt-b1");
    addInput("Bullet 2", "qt-b2");
    addInput("Bullet 3", "qt-b3");
  } else if (layout === "simple-title-sub-list") {
    addInput("Subtitle", "qt-sub", "Short supporting line…");
    addBox(
      "Bulleted List (each line = bullet)",
      "qt-list",
      8,
      "Item 1\nItem 2\nItem 3"
    );
  } else if (layout === "simple-quote") {
    addBox("Quote text", "qt-quote", 5, "“Put your best pull-quote here.”");
    addInput("Attribution", "qt-by", "— Name, role");
  } else if (layout === "simple-def-callout") {
    addInput("Term", "qt-term", "Vocabulary Term");
    addBox("Definition", "qt-def", 4, "Student-friendly definition…");
    addBox(
      "Examples (one per line)",
      "qt-ex",
      4,
      "example 1\nexample 2\nexample 3"
    );
  } else if (layout === "simple-objective-steps") {
    addInput("Objective", "qt-obj", "I can…");
    addBox("Steps (one per line)", "qt-steps", 6, "Do this\nThen that\nFinish…");
  } else if (layout === "simple-image") {
    addInput("Image URL", "qt-img", "https://…");
    addInput("Caption", "qt-cap", "Short, friendly caption…");
  }
}

function qtValues() {
  const get = (id) => document.getElementById(id)?.value || "";
  return {
    title: qtTitle.value.trim(),
    body: get("qt-body"),
    col1: get("qt-col1"),
    col2: get("qt-col2"),
    col3: get("qt-col3"),
    q1: get("qt-q1"),
    q2: get("qt-q2"),
    q3: get("qt-q3"),
    q4: get("qt-q4"),
    sub: get("qt-sub"),
    b1: get("qt-b1"),
    b2: get("qt-b2"),
    b3: get("qt-b3"),
    list: get("qt-list"),
    quote: get("qt-quote"),
    by: get("qt-by"),
    term: get("qt-term"),
    def: get("qt-def"),
    ex: get("qt-ex"),
    obj: get("qt-obj"),
    steps: get("qt-steps"),
    img: get("qt-img"),
    cap: get("qt-cap")
  };
}

function distribute(byBlank) {
  const areas = Array.from(qtRows.querySelectorAll("textarea")).map(
    (t) => t.id
  );
  if (areas.length <= 1) return;
  const first = document.getElementById(areas[0]);
  const chunks = (first.value || "")
    .split(byBlank ? /\n\s*\n/ : /\n/)
    .map((s) => s.trim())
    .filter(Boolean);
  areas.forEach((id, i) => {
    document.getElementById(id).value = chunks[i] || "";
  });
}

qtSplitBlank?.addEventListener("click", () => distribute(true));
qtSplitLines?.addEventListener("click", () => distribute(false));

// ===== Rendering helpers =====
function applyStyling() {
  sheet.classList.toggle("bigtext", toggleBig.checked);
  setBackground(bgStyleSel.value);
  setFonts(fontPresetSel.value);
  sheet.classList.toggle("math-hand", toggleHand.checked);

  // sticky
  stickyBox.classList.toggle("hidden", !toggleSticky.checked);
  stickyBox.setAttribute("aria-hidden", String(!toggleSticky.checked));
  stickyH.textContent = stickyTitle.value || "";
  stickyP.textContent = stickyText.value || "";

  refreshHighlights();
}

function makeCard(title, html) {
  const d = document.createElement("div");
  d.className = "card";
  d.innerHTML =
    (title
      ? `<h3 class="marker-h"><span class="hl hl-clean">${title}</span></h3>`
      : "") + (html || "");
  return d;
}

// ===== Simple layouts render =====
function renderSimple(layout) {
  const v = qtValues();
  titleEl.textContent = v.title || topicEl.value || "Your Chart";
  subEl.textContent = "";

  const labelMap = {
    "simple-title-body": "Simple — Title & Body",
    "simple-2col": "Simple — Two Columns",
    "simple-3col": "Simple — Three Columns",
    "simple-2x2": "Simple — 2×2 Grid",
    "simple-title-sub-3": "Simple — Title + Subtitle + 3 Bullets",
    "simple-title-sub-list": "Simple — Title + Subtitle + List",
    "simple-quote": "Simple — Quote Card",
    "simple-def-callout": "Simple — Definition Callout",
    "simple-objective-steps": "Simple — Objective + Steps",
    "simple-image": "Simple — Image & Caption"
  };

  formatBadge.textContent = `Format: ${labelMap[layout] || "Simple"}`;
  contentEl.innerHTML = "";

  if (layout === "simple-title-body") {
    contentEl.appendChild(
      makeCard("", `<div class="whitespace-pre-wrap">${v.body || ""}</div>`)
    );
  } else if (layout === "simple-2col") {
    const row = document.createElement("div");
    row.className = "grid gap-3 md:grid-cols-2";
    row.appendChild(
      makeCard("", `<div class="whitespace-pre-wrap">${v.col1 || ""}</div>`)
    );
    row.appendChild(
      makeCard("", `<div class="whitespace-pre-wrap">${v.col2 || ""}</div>`)
    );
    contentEl.appendChild(row);
  } else if (layout === "simple-3col") {
    const row = document.createElement("div");
    row.className = "grid gap-3 md:grid-cols-3";
    row.appendChild(
      makeCard("", `<div class="whitespace-pre-wrap">${v.col1 || ""}</div>`)
    );
    row.appendChild(
      makeCard("", `<div class="whitespace-pre-wrap">${v.col2 || ""}</div>`)
    );
    row.appendChild(
      makeCard("", `<div class="whitespace-pre-wrap">${v.col3 || ""}</div>`)
    );
    contentEl.appendChild(row);
  } else if (layout === "simple-2x2") {
    const grid = document.createElement("div");
    grid.className = "grid gap-3 md:grid-cols-2";
    grid.appendChild(
      makeCard("", `<div class="whitespace-pre-wrap">${v.q1 || ""}</div>`)
    );
    grid.appendChild(
      makeCard("", `<div class="whitespace-pre-wrap">${v.q2 || ""}</div>`)
    );
    grid.appendChild(
      makeCard("", `<div class="whitespace-pre-wrap">${v.q3 || ""}</div>`)
    );
    grid.appendChild(
      makeCard("", `<div class="whitespace-pre-wrap">${v.q4 || ""}</div>`)
    );
    contentEl.appendChild(grid);
  } else if (layout === "simple-title-sub-3") {
    if (v.sub)
      contentEl.appendChild(
        makeCard("", `<div class="pill">${v.sub}</div>`)
      );
    const ul = `<ul class='pretty-list list-disc pl-6'>${[v.b1, v.b2, v.b3]
      .filter(Boolean)
      .map(
        (b, i) =>
          `<li>${toggleEmoji.checked ? emojiFor(i) : ""}${b}</li>`
      )
      .join("")}</ul>`;
    contentEl.appendChild(makeCard("Key Points", ul));
  } else if (layout === "simple-title-sub-list") {
    if (v.sub)
      contentEl.appendChild(
        makeCard("", `<div class="pill">${v.sub}</div>`)
      );
    const items = (v.list || "")
      .split(/\n/)
      .map((s) => s.trim())
      .filter(Boolean);
    const ul = `<ul class='pretty-list list-disc pl-6'>${items
      .map(
        (b, i) =>
          `<li>${toggleEmoji.checked ? emojiFor(i) : ""}${b}</li>`
      )
      .join("")}</ul>`;
    contentEl.appendChild(makeCard("Notes", ul));
  } else if (layout === "simple-quote") {
    const quote = `“${(v.quote || "").replace(/^["“]|["”]$/g, "")}”`;
    const by = v.by ? `<div class="mt-2 text-slate-600">${v.by}</div>` : "";
    contentEl.appendChild(makeCard("", `<div class="quote">${quote}</div>${by}`));
  } else if (layout === "simple-def-callout") {
    const top =
      `<div class='inline-block px-3 py-1 rounded-lg border bg-white/80 mb-2'><span class='marker-h'><span class='hl hl-clean'>${v.term ||
      "Term"}</span></span></div>`;
    const def = `<p class="mb-2 whitespace-pre-wrap">${v.def || ""}</p>`;
    const exArr = (v.ex || "")
      .split(/\n/)
      .map((s) => s.trim())
      .filter(Boolean);
    const ex = exArr.length
      ? `<div><span class="text-xs font-semibold text-slate-600">Examples</span><ul class="pretty-list list-disc pl-6">${exArr
          .map(
            (e, i) =>
              `<li>${toggleEmoji.checked ? emojiFor(i) : ""}${e}</li>`
          )
          .join("")}</ul></div>`
      : "";
    contentEl.appendChild(makeCard("", top + def + ex));
  } else if (layout === "simple-objective-steps") {
    if (v.obj)
      contentEl.appendChild(
        makeCard("Objective", `<div class="pill">${v.obj}</div>`)
      );
    const steps = (v.steps || "")
      .split(/\n/)
      .map((s) => s.trim())
      .filter(Boolean);
    const ol = `<ol class='list-decimal pl-6'>${steps
      .map((s) => `<li>${s}</li>`)
      .join("")}</ol>`;
    contentEl.appendChild(makeCard("Steps", ol));
  } else if (layout === "simple-image") {
    const img = v.img
      ? `<img src="${v.img}" class="w-full h-auto rounded-lg border mb-2" alt="">`
      : `<div class="text-sm text-slate-500">Add an image URL above.</div>`;
    const cap = v.cap
      ? `<div class="text-sm text-slate-600">${v.cap}</div>`
      : "";
    contentEl.appendChild(makeCard("", img + cap));
  }

  refreshHighlights();
}

// ===== Math helpers =====
function formatMath(text) {
  if (!text) return "";
  let out = String(text);

  // units
  out = out
    .replace(/cm\^2/g, "cm²")
    .replace(/cm\^3/g, "cm³")
    .replace(/m\^2/g, "m²")
    .replace(/m\^3/g, "m³");

  // exponents x^2
  out = out.replace(/(\w+)\^(\d+)/g, "$1<sup>$2</sup>");

  // simple numeric fractions a/b
  out = out.replace(
    /(^|[^\d])(\d+)\s*\/\s*(\d+)(?!\d)/g,
    (match, prefix, num, den) =>
      `${prefix}<span class="frac"><span class="num">${num}</span><span class="bar"></span><span class="den">${den}</span></span>`
  );

  return out;
}

function stripLeadingNumber(text) {
  if (!text) return "";
  return text.replace(/^\s*\d+[\.\)]\s*/, "");
}

// ===== AI layout renderers =====
function renderStandard(obj) {
  contentEl.innerHTML = "";
  (obj.sections || []).forEach((s) => {
    const ul = `<ul class='pretty-list list-disc pl-6'>${(s.bullets || [])
      .map(
        (b, i) =>
          `<li>${toggleEmoji.checked ? emojiFor(i) : ""}${b}</li>`
      )
      .join("")}</ul>`;
    contentEl.appendChild(makeCard(s.heading || "Section", ul));
  });
}

function renderCompare(obj) {
  contentEl.innerHTML = "";
  const wrap = document.createElement("div");
  wrap.className = "grid gap-3 md:grid-cols-2";

  const left = `<ul class='pretty-list list-disc pl-6'>${(obj.leftBullets || [])
    .map(
      (b, i) =>
        `<li>${toggleEmoji.checked ? emojiFor(i) : ""}${b}</li>`
    )
    .join("")}</ul>`;
  const right = `<ul class='pretty-list list-disc pl-6'>${(obj.rightBullets || [])
    .map(
      (b, i) =>
        `<li>${toggleEmoji.checked ? emojiFor(i) : ""}${b}</li>`
    )
    .join("")}</ul>`;

  wrap.appendChild(makeCard(obj.leftTitle || "Side A", left));
  wrap.appendChild(makeCard(obj.rightTitle || "Side B", right));
  contentEl.appendChild(wrap);

  if (obj.conclusion) {
    contentEl.appendChild(makeCard("Conclusion", `<p>${obj.conclusion}</p>`));
  }
}

function renderCauseEffect(obj) {
  contentEl.innerHTML = "";
  const wrap = document.createElement("div");
  wrap.className = "grid gap-3 md:grid-cols-2";

  const causes = `<ul class='pretty-list list-disc pl-6'>${(obj.causes || [])
    .map(
      (b, i) =>
        `<li>${toggleEmoji.checked ? emojiFor(i) : ""}${b}</li>`
    )
    .join("")}</ul>`;
  const effects = `<ul class='pretty-list list-disc pl-6'>${(obj.effects || [])
    .map(
      (b, i) =>
        `<li>${toggleEmoji.checked ? emojiFor(i) : ""}${b}</li>`
    )
    .join("")}</ul>`;

  wrap.appendChild(makeCard("Causes", causes));
  wrap.appendChild(makeCard("Effects", effects));
  contentEl.appendChild(wrap);
}

function renderTimelineH(obj) {
  contentEl.innerHTML = "";

  const events = (obj.sections || []).map((s, i) => ({
    title: s.heading || `Step ${i + 1}`,
    text: (s.bullets || [])[0] || ""
  }));

  const rail = document.createElement("div");
  rail.className = "relative mt-2 mb-1";
  rail.innerHTML =
    "<div class='h-2 rounded-full' style='background:linear-gradient(90deg,#e2e8f0,#cbd5e1)'></div>";
  contentEl.appendChild(rail);

  const cols = Math.min(6, Math.max(3, Math.ceil(events.length)));
  const row = document.createElement("div");
  row.className = "grid gap-3 " + (cols ? `md:grid-cols-${cols}` : "");

  events.forEach((ev) => {
    row.appendChild(
      makeCard(
        ev.title,
        `<p class='text-sm'>${ev.text}</p>`
      )
    );
  });

  contentEl.appendChild(row);
}

function renderFrayerIFD(obj) {
  contentEl.innerHTML = "";
  const grid = document.createElement("div");
  grid.className = "grid gap-3 md:grid-cols-2";

  (obj.sections || [])
    .slice(0, 4)
    .forEach((s) => {
      const ul = `<ul class='pretty-list list-disc pl-6'>${(s.bullets || [])
        .map(
          (b, i) =>
            `<li>${toggleEmoji.checked ? emojiFor(i) : ""}${b}</li>`
        )
        .join("")}</ul>`;
      grid.appendChild(makeCard(s.heading || "", ul));
    });

  contentEl.appendChild(grid);
}
function renderFrayerClassic(obj) {
  return renderFrayerIFD(obj);
}

// MathEx — worked example
function renderMathEx(obj) {
  contentEl.innerHTML = "";

  const top = document.createElement("div");
  top.className = "grid gap-3 md:grid-cols-2";

  // Given
  top.appendChild(
    makeCard(
      "Worked Example — Given",
      `<ul class='pretty-list pl-6'>${(obj.given || [])
        .map(
          (g) =>
            `<li><span class="mathface ${
              toggleHand.checked ? "math-hand" : ""
            }">${formatMath(g)}</span></li>`
        )
        .join("")}
      </ul>`
    )
  );

  // Formula
  top.appendChild(
    makeCard(
      "Formula",
      `<div class="eqbox">
        <span class="mathface ${toggleHand.checked ? "math-hand" : ""}">
          ${formatMath(obj.formula || "")}
        </span>
      </div>`
    )
  );

  contentEl.appendChild(top);

  // Steps (supports plain strings OR { text, work })
  const stepsHTML = (obj.steps || [])
    .map((step) => {
      let text, work;

      if (typeof step === "string") {
        text = stripLeadingNumber(step);
        work = "";
      } else if (step && typeof step === "object") {
        text = stripLeadingNumber(step.text || "");
        work = step.work || "";
      } else {
        return "";
      }

      const workHTML = work
        ? `<div class="mt-1 text-base mathface ${
            toggleHand.checked ? "math-hand" : ""
          }">${formatMath(work)}</div>`
        : "";

      return `<li>
        <span class="mathface ${toggleHand.checked ? "math-hand" : ""}">
          ${formatMath(text)}
        </span>
        ${workHTML}
      </li>`;
    })
    .join("");

  contentEl.appendChild(
    makeCard(
      "Steps",
      `<ol class="list-decimal pl-6 space-y-1">${stepsHTML}</ol>`
    )
  );

  // Worked Example: full string of lines
  contentEl.appendChild(
    makeCard(
      "Worked Example",
      `<div class="space-y-2 text-lg">${(obj.example || [])
        .map(
          (l) =>
            `<div class="mathface ${
              toggleHand.checked ? "math-hand" : ""
            }">${formatMath(l)}</div>`
        )
        .join("")}
      </div>`
    )
  );

  // Final answer
  if (obj.answer) {
    contentEl.appendChild(
      makeCard(
        "Answer",
        `<div class='text-xl'>
          <span class="mathface ${toggleHand.checked ? "math-hand" : ""}">
            ${formatMath(obj.answer || "")}
          </span>
        </div>`
      )
    );
  }
}

// CRex renderer — short / extended constructed response
function renderCRex(obj, mode) {
  contentEl.innerHTML = "";

  const sections = obj.sections || [];

  // Expect: What it is, Key Components, Strategy, Tips, Example Structure, Sample Sentence Starters, etc.
  sections.forEach((s) => {
    const ul = `<ul class='pretty-list list-disc pl-6'>${(s.bullets || [])
      .map((b) => `<li>${b}</li>`)
      .join("")}</ul>`;
    contentEl.appendChild(makeCard(s.heading || "Section", ul));
  });

  // For “extended” we expect more sections, but renderer is the same.
}

// ===== Layout dispatcher =====
function renderByLayout(layout, data) {
  titleEl.textContent = data.title || topicEl.value || "Your Chart";
  subEl.textContent = data.subtitle || "";
  sheet.classList.toggle("math-hand", toggleHand.checked);

  const labelMap = {
    standard: "Standard",
    compare: "Comparison",
    cause: "Cause ↔ Effect",
    timelineH: "Timeline — Horizontal",
    frayer: "Frayer (IFD)",
    frayerClassic: "Frayer — Classic",
    auto: "Auto",
    mathex: "MathEx — Worked Example",
    "crex-short": "CRex — Short Constructed Response",
    "crex-extended": "CRex — Extended Constructed Response"
  };

  formatBadge.textContent = `Format: ${labelMap[layout] || "Standard"}`;

  if (layout === "compare") return renderCompare(data);
  if (layout === "cause") return renderCauseEffect(data);
  if (layout === "timelineH") return renderTimelineH(data);
  if (layout === "frayer") return renderFrayerIFD(data);
  if (layout === "frayerClassic") return renderFrayerClassic(data);
  if (layout === "mathex") return renderMathEx(data);
  if (layout === "crex-short" || layout === "crex-extended")
    return renderCRex(data, layout);

  return renderStandard(data);
}

function relayout() {
  applyStyling();
  const layout = layoutSel.value;

  if (isSimpleLayout(layout)) {
    renderSimple(layout);
    return;
  }
  if (!lastChartJSON) return;

  let chosen =
    layout === "auto"
      ? looksMathy(topicEl.value)
        ? "mathex"
        : looksLikeComparison(topicEl.value)
        ? "compare"
        : looksLikeCRex(topicEl.value)
        ? "crex-short"
        : "standard"
      : layout;

  renderByLayout(chosen, lastChartJSON);
  refreshHighlights();
}

// ===== Model call =====
async function callModel(body) {
  const r = await fetch(`${PROXY}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  let data = null;
  try {
    data = await r.json();
  } catch (e) {}
  return { ok: r.ok, status: r.status, data };
}

// ===== Generate chart =====
async function generate() {
  const layout = layoutSel.value;

  // Simple layouts: no AI call
  if (isSimpleLayout(layout)) {
    relayout();
    srStatus.textContent = "Chart ready (Quick Template).";
    return;
  }

  const topic = (topicEl.value || "").trim();
  if (!topic) {
    errorEl.textContent = "Please enter a topic.";
    errorEl.classList.remove("hidden");
    return;
  }
  errorEl.classList.add("hidden");

  startLoading();
  progressTo(20);

  let chosen =
    layout === "auto"
      ? looksMathy(topic)
        ? "mathex"
        : looksLikeComparison(topic)
        ? "compare"
        : looksLikeCRex(topic)
        ? "crex-short"
        : "standard"
      : layout;

  let prompt;
  let schema;

  if (chosen === "mathex") {
    prompt = `You are Chartie, an expert teacher anchor-chart generator.

Create a clear, step-by-step math worked example for: "${topic}".

Return ONLY JSON with keys:
- title (string)
- subtitle (string)
- given (array of short lines listing the given information)
- formula (string with the general formula)
- steps (array) — each item is either
    a plain string OR
    an object { "text": explanation, "work": "optional math line" }
- example (array of lines showing the FULL worked example from start to finish)
- answer (string with the final answer).`;

    schema = {
      type: "object",
      properties: {
        title: { type: "string" },
        subtitle: { type: "string" },
        given: { type: "array", items: { type: "string" } },
        formula: { type: "string" },
        steps: {
          type: "array",
          items: {
            anyOf: [
              { type: "string" },
              {
                type: "object",
                properties: {
                  text: { type: "string" },
                  work: { type: "string" }
                },
                required: ["text"]
              }
            ]
          }
        },
        example: { type: "array", items: { type: "string" } },
        answer: { type: "string" }
      },
      required: ["title", "steps"]
    };
  } else if (chosen === "compare") {
    prompt = `You are Chartie. Create a two-column comparison anchor chart for: "${topic}".

Return ONLY JSON with:
- title (string)
- subtitle (string)
- leftTitle (string)
- leftBullets (array of short bullets)
- rightTitle (string)
- rightBullets (array of short bullets)
- conclusion (short summary sentence).`;

    schema = {
      type: "object",
      properties: {
        title: { type: "string" },
        subtitle: { type: "string" },
        leftTitle: { type: "string" },
        leftBullets: { type: "array", items: { type: "string" } },
        rightTitle: { type: "string" },
        rightBullets: { type: "array", items: { type: "string" } },
        conclusion: { type: "string" }
      },
      required: ["title", "leftTitle", "leftBullets", "rightTitle", "rightBullets"]
    };
  } else if (chosen === "cause") {
    prompt = `You are Chartie. Create a Cause ↔ Effect anchor chart for: "${topic}".

Return ONLY JSON with:
- title (string)
- subtitle (string)
- causes (array of bullets)
- effects (array of bullets, aligned with causes where possible).`;

    schema = {
      type: "object",
      properties: {
        title: { type: "string" },
        subtitle: { type: "string" },
        causes: { type: "array", items: { type: "string" } },
        effects: { type: "array", items: { type: "string" } }
      },
      required: ["title", "causes", "effects"]
    };
  } else if (chosen === "crex-short" || chosen === "crex-extended") {
    const modeLabel =
      chosen === "crex-short" ? "short constructed response (SCR)" : "extended constructed response (ECR)";
    prompt = `You are Chartie, an ELA anchor-chart generator.

Make a structured anchor chart that teaches students how to write a ${modeLabel} for: "${topic}".

Use student-friendly language. Keep bullets concrete (actions, sentence frames, reminders).

Return ONLY JSON:
{
  "title": string,
  "subtitle": string,
  "sections": [
    { "heading": string, "bullets": string[] }
  ]
}`;

    schema = {
      type: "object",
      properties: {
        title: { type: "string" },
        subtitle: { type: "string" },
        sections: {
          type: "array",
          items: {
            type: "object",
            properties: {
              heading: { type: "string" },
              bullets: { type: "array", items: { type: "string" } }
            },
            required: ["heading", "bullets"]
          }
        }
      },
      required: ["title", "sections"]
    };
  } else {
    // standard / timeline / frayer all use "sections" schema
    const extra =
      chosen === "timelineH"
        ? "Organize sections in chronological order (each section is one key event)."
        : chosen === "frayer" || chosen === "frayerClassic"
        ? "Use up to four sections like: Definition, Examples, Non-Examples, Visual / Reminder."
        : "";

    prompt = `You are Chartie. Create an anchor chart for: "${topic}".

Use short, concrete bullets in student-friendly language.
${extra}

Return ONLY JSON:
{
  "title": string,
  "subtitle": string,
  "sections": [
    { "heading": string, "bullets": string[] }
  ]
}`;
    schema = {
      type: "object",
      properties: {
        title: { type: "string" },
        subtitle: { type: "string" },
        sections: {
          type: "array",
          items: {
            type: "object",
            properties: {
              heading: { type: "string" },
              bullets: { type: "array", items: { type: "string" } }
            },
            required: ["heading", "bullets"]
          }
        }
      },
      required: ["title", "sections"]
    };
  }

  try {
    const { ok, data } = await callModel({
      model: MODEL,
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.6
      }
    });

    progressTo(65);

    if (!ok) {
      stopLoading();
      errorEl.textContent =
        data?.error?.message || "Chartie could not reach the model.";
      errorEl.classList.remove("hidden");
      return;
    }

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    lastChartJSON = JSON.parse(text);

    renderByLayout(chosen, lastChartJSON);
    srStatus.textContent = "Chart ready.";
    progressTo(95);
  } catch (e) {
    console.error(e);
    errorEl.textContent = "Model returned invalid chart data.";
    errorEl.classList.remove("hidden");
  } finally {
    stopLoading();
  }
}

// ===== Downloads =====
async function downloadPNG() {
  const bg = sheet.classList.contains("bg-blank")
    ? "#ffffff"
    : sheet.classList.contains("bg-lined-dark")
    ? "#f5efe3"
    : sheet.classList.contains("bg-graph")
    ? "#ffffff"
    : "#fff9e8";

  const canvas = await html2canvas(sheet, {
    scale: 2,
    backgroundColor: bg
  });
  const a = document.createElement("a");
  const safe = (titleEl.textContent || "Chartie-Chart")
    .replace(/[\/\\?%*:|"<>]/g, "-")
    .slice(0, 80);
  a.download = `${safe}.png`;
  a.href = canvas.toDataURL("image/png");
  a.click();
}

async function downloadPDF() {
  const { jsPDF } = window.jspdf;
  const sizeMap = {
    letter: [216, 279],
    a4: [210, 297],
    tabloid: [279, 432]
  };
  let [w, h] = sizeMap[paperSel.value] || sizeMap.letter;
  if (orientSel.value === "landscape") [w, h] = [h, w];

  const bg = sheet.classList.contains("bg-blank")
    ? "#ffffff"
    : sheet.classList.contains("bg-lined-dark")
    ? "#f5efe3"
    : sheet.classList.contains("bg-graph")
    ? "#ffffff"
    : "#fff9e8";

  const canvas = await html2canvas(sheet, {
    scale: 2,
    backgroundColor: bg
  });
  const img = canvas.toDataURL("image/png");

  const pdf = new jsPDF({
    orientation: orientSel.value,
    unit: "mm",
    format: [w, h]
  });

  const ratio = Math.min(w / canvas.width, h / canvas.height);
  const iw = canvas.width * ratio;
  const ih = canvas.height * ratio;
  const x = (w - iw) / 2;
  const y = (h - ih) / 2;

  pdf.addImage(img, "PNG", x, y, iw, ih, "", "FAST");
  const safe = (titleEl.textContent || "Chartie-Chart")
    .replace(/[\/\\?%*:|"<>]/g, "-")
    .slice(0, 80);
  pdf.save(`${safe}.pdf`);
}

// ===== Event wires + initial state =====
btnGen.addEventListener("click", generate);
btnDl.addEventListener("click", downloadPNG);
btnPDF.addEventListener("click", downloadPDF);

topicEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    generate();
  }
});

[
  layoutSel,
  hlStyleSel,
  fontPresetSel,
  bgStyleSel,
  toggleBig,
  toggleEmoji,
  toggleHand,
  toggleSticky
].forEach((el) =>
  el.addEventListener("change", () => {
    const layout = layoutSel.value;
    const showQt = isSimpleLayout(layout);
    qtPanel.classList.toggle("hidden", !showQt);
    if (showQt) buildQtRows(layout);

    stickyControls.classList.toggle("hidden", !toggleSticky.checked);

    relayout();
  })
);

stickyTitle.addEventListener("input", () => {
  stickyH.textContent = stickyTitle.value;
});
stickyText.addEventListener("input", () => {
  stickyP.textContent = stickyText.value;
});

accentButtons.forEach((b) =>
  b.addEventListener("click", () => setAccent(b.dataset.color))
);

// Initial styling
setAccent("#f59e0b");
setFonts("hand+rounded");
setBackground("lined-light");
refreshHighlights();
relayout();
