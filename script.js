// Simple debounce helper
function debounce(fn, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

// Inputs
const chartTitleInput = document.getElementById("chartTitle");
const chartSubtitleInput = document.getElementById("chartSubtitle");
const templateSelect = document.getElementById("templateSelect");

const section1TitleInput = document.getElementById("section1Title");
const section1BodyInput = document.getElementById("section1Body");
const section2TitleInput = document.getElementById("section2Title");
const section2BodyInput = document.getElementById("section2Body");
const section3TitleInput = document.getElementById("section3Title");
const section3BodyInput = document.getElementById("section3Body");

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

const previewTeacherNotes = document.getElementById("previewTeacherNotes");
const chartCanvas = document.getElementById("chartCanvas");

// Export
const copyTextBtn = document.getElementById("copyTextBtn");
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

  previewTeacherNotes.textContent =
    notes ||
    "Notes here are just for you. Students won’t see this part in the printed chart.";

  // For T-chart layout, store Section 3 heading on the footer for the pseudo label
  const footer = previewTeacherNotes.parentElement;
  if (footer && footer.classList.contains("chart-footer")) {
    footer.setAttribute("data-third-heading", s3Title || "Extra Notes");
  }
}

const debouncedUpdate = debounce(updatePreview, 120);

// Template layout switching
function updateLayout() {
  const value = templateSelect.value;

  chartCanvas.classList.remove(
    "layout-three-columns",
    "layout-t-chart",
    "layout-steps"
  );

  switch (value) {
    case "t-chart":
      chartCanvas.classList.add("layout-t-chart");
      break;
    case "steps":
      chartCanvas.classList.add("layout-steps");
      break;
    case "three-columns":
    default:
      chartCanvas.classList.add("layout-three-columns");
      break;
  }
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
  teacherNotesInput
].forEach((el) => {
  el.addEventListener("input", debouncedUpdate);
});

templateSelect.addEventListener("change", () => {
  updateLayout();
  updatePreview();
});

copyTextBtn.addEventListener("click", copyChartText);

// Initialize
updateLayout();
updatePreview();
