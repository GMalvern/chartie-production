document.addEventListener("DOMContentLoaded", () => {
  // Inputs
  const titleInput = document.getElementById("chartTitleInput");
  const bigIdeaInput = document.getElementById("bigIdeaInput");
  const bulletsInput = document.getElementById("bulletsInput");
  const askInput = document.getElementById("askYourselfInput");
  const fontSelect = document.getElementById("fontSelect");
  const backgroundSelect = document.getElementById("backgroundSelect");
  const exportBtn = document.getElementById("exportPngBtn");

  // Displays
  const titleDisplay = document.getElementById("chartTitleDisplay");
  const bigIdeaDisplay = document.getElementById("bigIdeaDisplay");
  const bulletsDisplay = document.getElementById("bulletsDisplay");
  const askDisplay = document.getElementById("askYourselfDisplay");
  const chartCanvas = document.getElementById("chartCanvas");
  const pencilFill = document.getElementById("pencilFill");

  // Accent controls
  const accentButtons = document.querySelectorAll(".accent-swatch");

  // Helper to refresh bullets
  function updateBullets() {
    const raw = bulletsInput.value || "";
    const lines = raw.split("\n").map(l => l.trim()).filter(Boolean);

    bulletsDisplay.innerHTML = "";
    lines.forEach(line => {
      // Try to bold the word before the first dash
      const parts = line.split("–");
      let label = "";
      let rest = "";

      if (parts.length > 1) {
        label = parts[0].trim();
        rest = parts.slice(1).join("–").trim();
      } else {
        const spaceParts = line.split("-");
        if (spaceParts.length > 1) {
          label = spaceParts[0].trim();
          rest = spaceParts.slice(1).join("-").trim();
        } else {
          rest = line;
        }
      }

      const li = document.createElement("li");

      if (label) {
        const span = document.createElement("span");
        span.className = "bullet-label";
        span.textContent = label;
        li.appendChild(span);
        if (rest) {
          li.appendChild(document.createTextNode(" – " + rest));
        }
      } else {
        li.textContent = line;
      }

      bulletsDisplay.appendChild(li);
    });
  }

  // Sync text fields
  function wireInput(input, target, fallback = "") {
    if (!input || !target) return;
    const handler = () => {
      const val = input.value.trim();
      target.textContent = val || fallback;
      updateProgress();
    };
    input.addEventListener("input", handler);
    handler();
  }

  wireInput(
    titleInput,
    titleDisplay,
    "Leaders of the Republic of Texas ⭐"
  );

  wireInput(
    bigIdeaInput,
    bigIdeaDisplay,
    "Different leaders shaped the Republic of Texas in different ways — courage, vision, and tough decisions all mattered."
  );

  if (askInput && askDisplay) {
    const askSpan = askDisplay.querySelector("span") || askDisplay;
    const handler = () => {
      const val = askInput.value.trim();
      if (askSpan && askSpan !== askDisplay) {
        askSpan.textContent = val || "What leadership quality am I seeing here?";
      } else {
        askDisplay.textContent =
          "Ask yourself: " + (val || "What leadership quality am I seeing here?");
      }
      updateProgress();
    };
    askInput.addEventListener("input", handler);
    handler();
  }

  if (bulletsInput) {
    bulletsInput.addEventListener("input", () => {
      updateBullets();
      updateProgress();
    });
    updateBullets();
  }

  // Accent color handling
  function setAccent(color) {
    chartCanvas.style.setProperty("--chart-accent", color);
    accentButtons.forEach(btn => {
      btn.classList.toggle(
        "selected",
        btn.getAttribute("data-accent") === color
      );
    });
  }

  accentButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const color = btn.getAttribute("data-accent");
      setAccent(color);
    });
  });

  // Default accent
  setAccent("#f59e0b");

  // Font change
  if (fontSelect) {
    fontSelect.addEventListener("change", () => {
      if (fontSelect.value === "hand") {
        chartCanvas.classList.add("hand-font");
      } else {
        chartCanvas.classList.remove("hand-font");
      }
    });
    // set default
    chartCanvas.classList.add("hand-font");
  }

  // Background change
  if (backgroundSelect) {
    backgroundSelect.addEventListener("change", () => {
      chartCanvas.classList.remove("chart-bg-lined", "chart-bg-grid", "chart-bg-plain");
      if (backgroundSelect.value === "lined") {
        chartCanvas.classList.add("chart-bg-lined");
      } else if (backgroundSelect.value === "grid") {
        chartCanvas.classList.add("chart-bg-grid");
      } else {
        chartCanvas.classList.add("chart-bg-plain");
      }
    });
  }

  // Pencil progress (simple: how much content is filled?)
  function updateProgress() {
    let score = 0;
    const total = 4;

    if (titleInput && titleInput.value.trim().length > 0) score++;
    if (bigIdeaInput && bigIdeaInput.value.trim().length > 0) score++;
    if (bulletsInput && bulletsInput.value.trim().length > 0) score++;
    if (askInput && askInput.value.trim().length > 0) score++;

    const percent = Math.max(20, Math.min(100, (score / total) * 100));
    if (pencilFill) {
      pencilFill.style.width = `${percent}%`;
    }
  }

  updateProgress();

  // Export as PNG
  if (exportBtn && chartCanvas) {
    exportBtn.addEventListener("click", async () => {
      // Temporarily bump scale for better quality
      const originalTransform = chartCanvas.style.transform;
      chartCanvas.style.transform = "scale(1)";

      try {
        const canvas = await html2canvas(chartCanvas, {
          backgroundColor: "#020617",
          scale: 2
        });
        const dataUrl = canvas.toDataURL("image/png");

        const link = document.createElement("a");
        link.href = dataUrl;
        const safeTitle =
          (titleInput?.value || "chartie-anchor-chart")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)+/g, "");
        link.download = `${safeTitle || "chartie-anchor-chart"}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (err) {
        console.error("Error exporting chart:", err);
        alert("Oops — something went wrong exporting the chart. Try again?");
      } finally {
        chartCanvas.style.transform = originalTransform || "";
      }
    });
  }
});
