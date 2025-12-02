// Simple debounce helper
function debounce(fn, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

// Local storage key
const STORAGE_KEY = "chartie-anchor-state-v2";

// Inputs
const chartTitleInput = document.getElementById("chartTitle");
const chartSubtitleInput = document.getElementById("chartSubtitle");
const templateSelect = document.getElementById("templateSelect");
const themeSelect = document.getElementById("themeSelect");

const section1TitleInput = document.getElementById("section1Title");
const section1BodyInput = document.getElementById("section1Body");
const section2TitleInput = document.getElementById("section2Title");
const section2BodyInput = document.getElementById("section2Body");
const section3TitleInput = document.getElementById("section3Title");
const section3BodyInput = document.getElementById("section3Body");
const section4TitleInput = document.getElementById("section4Title");
const section4BodyInput = document.getElementById("section4Body");

const teacherNotesInput = document.getElementById("teacherNotes");

// Preview elements
const previewChartTitle = document.getElementById("previewChartTitle");
const previewChartSubtitle = document.getElementById("previewChartSubtitle");

const previewSection1Title = document.getElementById("previewSection1Title");
const previewSection1Body = document.getElementById("previewSection1Body");
const previewSection2Title = document.getElementById("previewSection2Title");
const previewSection2Body = document.getElementById("previewSection2Body");
const previewSection3Title = document.getElementById("previewSection3Title");
const previewSection3Body = document.getElementById("previewSection3Body");
const previewSection4Title = document.getElementById("previewSection4Title");
const previewSection4Body = document.getElementById("previewSection4Body");

const previewTeacherNotes = document.getElementById("previewTeacherNotes");
const chartCanvas = document.getElementById("chartCanvas");

// Export
const copyTextBtn = document.getElementById("copyTextBtn");
const downloadPngBtn = document.getElementById("downloadPngBtn");
const exportStatus = document.getElementById("exportStatus");

// Update preview
function updatePreview() {
  const chartTitle = chartTitleInput.value.trim();
  const chartSubtitle = chartSubtitleInput.value.trim();

  const s1Title = section1TitleInput.value.trim();
  const s1Body = section1BodyInput.value;
  const s2Title = section2TitleInput.value.trim();
  const s2Body = section2BodyInput.value;
  const s3Title = section3TitleInput.value.trim();
  const s3Body = section3BodyInput.value;
  const s4Title = section4TitleInput.value.trim();
  const s4Body = section4BodyInput.value;

  const notes = teacherNotesInput.value.trim();

  previewChartTitle.textContent = chartTitle || "Chart Title";
  previewChartSubtitle.textContent =
    chartSubtitle || "Subtitle or guiding question";

  previewSection1Title.textContent = s1Title || "Section 1";
  previewSection1Body.textContent =
    s1Body || "Add key ideas for Section 1.";

  previewSection2Title.textContent = s2Title || "Section 2";
  previewSection2Body.textContent =
    s2Body || "Add key ideas for Section 2.";

  previewSection3Title.textContent = s3Title || "Section 3";
  previewSection3Body.textContent =
    s3Body || "Add key ideas for Section 3.";

  previewSection4Title.textContent = s4Title || "Section 4";
  previewSection4Body.textContent =
    s4Body || "Add key ideas for Section 4.";

  previewTeacherNotes.textContent =
    notes ||
    "Notes here are just for you. Students won’t see this part in the printed chart.";

  // For steps layout, assign step numbers
  if (chartCanvas.classList.contains("layout-steps")) {
    const sections = chartCanvas.querySelectorAll(".chart-section");
    let step = 1;
    sections.forEach((sec) => {
      if (sec.style.display === "none") {
        sec.removeAttribute("data-step");
      } else {
        sec.setAttribute("data-step", step.toString());
        step += 1;
      }
    });
  }

  saveState();
}

const debouncedUpdate = debounce(updatePreview, 120);

// Template layout switching
function updateLayout() {
  const value = templateSelect.value;

  chartCanvas.classList.remove(
    "layout-three-columns",
    "layout-t-chart",
    "layout-steps",
    "layout-frayer",
    "layout-example-nonexample",
    "layout-timeline"
  );

  switch (value) {
    case "t-chart":
      chartCanvas.classList.add("layout-t-chart");
      break;
    case "steps":
      chartCanvas.classList.add("layout-steps");
      break;
    case "frayer":
      chartCanvas.classList.add("layout-frayer");
      break;
    case "example-nonexample":
      chartCanvas.classList.add("layout-example-nonexample");
      break;
    case "timeline":
      chartCanvas.classList.add("layout-timeline");
      break;
    case "three-columns":
    default:
      chartCanvas.classList.add("layout-three-columns");
      break;
  }

  updatePreview();
}

// Theme switching
function updateTheme() {
  const theme = themeSelect.value;
  const body = document.body;

  body.classList.remove(
    "theme-purple",
    "theme-monochrome",
    "theme-high-contrast",
    "theme-elementary"
  );
  body.classList.add(theme);

  saveState();
}

// Copy text representation of chart
async function copyChartText() {
  const chartTitle = chartTitleInput.value.trim();
  const chartSubtitle = chartSubtitleInput.value.trim();

  const s1Title = section1TitleInput.value.trim();
  const s1Body = section1BodyInput.value.trim();
  const s2Title = section2TitleInput.value.trim();
  const s2Body = section2BodyInput.value.trim();
  const s3Title = section3TitleInput.value.trim();
  const s3Body = section3BodyInput.value.trim();
  const s4Title = section4TitleInput.value.trim();
  const s4Body = section4BodyInput.value.trim();

  const notes = teacherNotesInput.value.trim();

  const lines = [];

  if (chartTitle) lines.push(`# ${chartTitle}`);
  if (chartSubtitle) lines.push(chartSubtitle);
  if (chartTitle || chartSubtitle) lines.push("");

  if (s1Title || s1Body) {
    lines.push(`Section 1: ${s1Title || "Heading"}`);
    if (s1Body) lines.push(s1Body);
    lines.push("");
  }

  if (s2Title || s2Body) {
    lines.push(`Section 2: ${s2Title || "Heading"}`);
    if (s2Body) lines.push(s2Body);
    lines.push("");
  }

  if (s3Title || s3Body) {
    lines.push(`Section 3: ${s3Title || "Heading"}`);
    if (s3Body) lines.push(s3Body);
    lines.push("");
  }

  if (s4Title || s4Body) {
    lines.push(`Section 4: ${s4Title || "Heading"}`);
    if (s4Body) lines.push(s4Body);
    lines.push("");
  }

  if (notes) {
    lines.push("Teacher Notes:");
    lines.push(notes);
  }

  const exportText = lines.join("\n");

  try {
    await navigator.clipboard.writeText(exportText);
    exportStatus.textContent = "Chart text copied to clipboard ✂️📋";
  } catch (err) {
    console.error(err);
    exportStatus.textContent =
      "Could not copy automatically. You can still select and copy manually.";
  }

  setTimeout(() => {
    exportStatus.textContent = "";
  }, 3000);
}

// Download chart as PNG using html2canvas
async function downloadChartPng() {
  if (!window.html2canvas) {
    exportStatus.textContent =
      "Image export is not available (html2canvas not loaded).";
    setTimeout(() => {
      exportStatus.textContent = "";
    }, 3000);
    return;
  }

  try {
    const canvas = await html2canvas(chartCanvas, {
      backgroundColor: null,
      scale: 2
    });

    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    const title = chartTitleInput.value.trim() || "chartie-anchor-chart";
    link.download = `${title.replace(/\s+/g, "-").toLowerCase()}.png`;
    link.click();

    exportStatus.textContent = "Chart PNG downloaded 🖼️";
  } catch (err) {
    console.error(err);
    exportStatus.textContent =
      "Could not generate image. Try taking a screenshot as a backup.";
  }

  setTimeout(() => {
    exportStatus.textContent = "";
  }, 3500);
}

// Save state to localStorage
function saveState() {
  const state = {
    chartTitle: chartTitleInput.value,
    chartSubtitle: chartSubtitleInput.value,
    template: templateSelect.value,
    theme: themeSelect.value,
    section1Title: section1TitleInput.value,
    section1Body: section1BodyInput.value,
    section2Title: section2TitleInput.value,
    section2Body: section2BodyInput.value,
    section3Title: section3TitleInput.value,
    section3Body: section3BodyInput.value,
    section4Title: section4TitleInput.value,
    section4Body: section4BodyInput.value,
    teacherNotes: teacherNotesInput.value
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    // silently fail if storage not available
  }
}

// Load state from localStorage
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const state = JSON.parse(raw);

    chartTitleInput.value = state.chartTitle || "";
    chartSubtitleInput.value = state.chartSubtitle || "";

    if (state.template) templateSelect.value = state.template;
    if (state.theme) themeSelect.value = state.theme;

    section1TitleInput.value = state.section1Title || "";
    section1BodyInput.value = state.section1Body || "";
    section2TitleInput.value = state.section2Title || "";
    section2BodyInput.value = state.section2Body || "";
    section3TitleInput.value = state.section3Title || "";
    section3BodyInput.value = state.section3Body || "";
    section4TitleInput.value = state.section4Title || "";
    section4BodyInput.value = state.section4Body || "";
    teacherNotesInput.value = state.teacherNotes || "";

    updateTheme();
    updateLayout();
    updatePreview();
  } catch (e) {
    // ignore load errors
  }
}

// Hook events
[
  chartTitleInput,
  chartSubtitleInput,
  section1TitleInput,
  section1BodyInput,
  section2TitleInput,
  section2BodyInput,
  section3TitleInput,
  section3BodyInput,
  section4TitleInput,
  section4BodyInput,
  teacherNotesInput
].forEach((el) => {
  el.addEventListener("input", debouncedUpdate);
});

templateSelect.addEventListener("change", () => {
  updateLayout();
  saveState();
});

themeSelect.addEventListener("change", () => {
  updateTheme();
});

copyTextBtn.addEventListener("click", copyChartText);
downloadPngBtn.addEventListener("click", downloadChartPng);

// Initialize
updateTheme();
updateLayout();
updatePreview();
loadState();
