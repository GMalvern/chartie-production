/* =========================================================
   Chartie — Full app.js (clean, fixed, production-ready)
   ========================================================= */

// -----------------------------
// Helpers
// -----------------------------
const $ = (id) => document.getElementById(id);
const progressFill = $('progress-fill');
const progressPencil = $('progress-pencil');
const loadingText = $('loading-text');

const sheet = $('sheet');
const chartTitle = $('chart-title');
const chartSub = $('chart-sub');
const chartContent = $('chart-content');

const stickyBox = $('sticky');
const stickyH = $('sticky-h');
const stickyP = $('sticky-p');

let currentAccent = '#0d9488'; // default teal
let highlightMode = 'clean';   // clean | brush | none

// -----------------------------
// Accent Setter
// -----------------------------
function setAccent(color){
  currentAccent = color;
  document.documentElement.style.setProperty('--accent', color);
}

// -----------------------------
// Highlight System
// -----------------------------
function applyHighlightMode(){
  document.body.classList.remove('hl-mode-clean','hl-mode-brush','hl-mode-none');

  if(highlightMode === 'clean') document.body.classList.add('hl-mode-clean');
  if(highlightMode === 'brush') document.body.classList.add('hl-mode-brush');
  if(highlightMode === 'none')  document.body.classList.add('hl-mode-none');
}

// -----------------------------
// Background Setter
// -----------------------------
function setBackground(style){
  sheet.classList.remove('bg-lined-light','bg-lined-dark','bg-graph','bg-poster','bg-blank');
  sheet.classList.add(`bg-${style}`);
}

// -----------------------------
// Font Presets
// -----------------------------
function setFonts(preset){
  let titleFont = 'Patrick Hand';
  let bodyFont = 'Poppins';

  if(preset === 'serif+rounded'){
    titleFont = 'DM Serif Display';
    bodyFont = 'Nunito Sans';
  }
  if(preset === 'hand+sans'){
    titleFont = 'Patrick Hand';
    bodyFont = 'Nunito Sans';
  }
  if(preset === 'clean+academic'){
    titleFont = 'Nunito Sans';
    bodyFont = 'Nunito Sans';
  }

  document.documentElement.style.setProperty('--title-font', titleFont);
  document.documentElement.style.setProperty('--body-font', bodyFont);
}

// -----------------------------
// Progress Animation
// -----------------------------
function startProgress(){
  progressFill.style.width = '0%';
  setTimeout(() => {
    progressFill.style.width = '100%';
  }, 80);

  loadingText.textContent = 'Building…';
}

function resetProgress(){
  progressFill.style.width = '0%';
  loadingText.textContent = 'Ready. Type a topic and hit Create.';
}

// -----------------------------
// Sticky Toggle
// -----------------------------
function toggleStickyNote(show){
  if(show){
    stickyBox.classList.remove('hidden');
  } else {
    stickyBox.classList.add('hidden');
  }
}

// -----------------------------
// Layout Builders
// -----------------------------
function buildStandard(content){
  chartContent.innerHTML = `
    <div class="card">
      <h3 class="marker-h"><span class="hl hl-${highlightMode}">Main Idea</span></h3>
      <p>${content}</p>
    </div>
  `;
}

function buildCompare(content){
  const halves = content.split('|');
  chartContent.innerHTML = `
    <div class="card">
      <h3 class="marker-h"><span class="hl hl-${highlightMode}">Comparison</span></h3>
      <div class="grid grid-cols-2 gap-4">
        <div>${halves[0] || 'Side A…'}</div>
        <div>${halves[1] || 'Side B…'}</div>
      </div>
    </div>
  `;
}

function buildCause(content){
  const halves = content.split('→');
  chartContent.innerHTML = `
    <div class="card">
      <h3 class="marker-h"><span class="hl hl-${highlightMode}">Cause & Effect</span></h3>
      <div class="grid grid-cols-2 gap-4">
        <div><strong>Cause:</strong> ${halves[0] || ''}</div>
        <div><strong>Effect:</strong> ${halves[1] || ''}</div>
      </div>
    </div>
  `;
}

// -----------------------------
// CRex Layouts
// -----------------------------
function buildCRexShort(topic){
  chartContent.innerHTML = `
    <div class="card">
      <h3 class="marker-h"><span class="hl hl-${highlightMode}">CRex: Short Constructed Response</span></h3>
      <ol class="list-decimal pretty-list pl-5">
        <li>Restate the question.</li>
        <li>Answer in one clear sentence.</li>
        <li>Give one piece of evidence.</li>
        <li>Close strong.</li>
      </ol>
    </div>
  `;
  document.body.classList.add('crex-mode');
}

function buildCRexExtended(topic){
  chartContent.innerHTML = `
    <div class="card">
      <h3 class="marker-h"><span class="hl hl-${highlightMode}">CRex: Extended Response</span></h3>
      <ol class="list-decimal pretty-list pl-5">
        <li>Restate and introduce key idea.</li>
        <li>Explain with supporting evidence.</li>
        <li>Connect to topic ("This matters because…").</li>
        <li>Conclude with a strong final insight.</li>
      </ol>
    </div>
  `;
  document.body.classList.add('crex-mode');
}

// -----------------------------
// Simple Layouts
// -----------------------------
function buildSimpleTitleBody(title, body){
  chartTitle.textContent = title;
  chartContent.innerHTML = `
    <div class="card"><p>${body}</p></div>
  `;
}

// -----------------------------
// AI Emulation Placeholder
// -----------------------------
async function fakeAI(topic, layout){
  // In production you’ll replace this with real API calls
  return `Generated notes about ${topic}.`;
}

// -----------------------------
// MAIN GENERATE
// -----------------------------
$('btn-generate').addEventListener('click', async () => {
  const topic = $('topic').value.trim();
  const layout = $('layout').value;

  if(!topic){
    $('error').classList.remove('hidden');
    $('error').textContent = 'Please enter a topic.';
    return;
  }

  $('error').classList.add('hidden');
  startProgress();

  // Clear mode states
  document.body.classList.remove('crex-mode');

  let generated = await fakeAI(topic, layout);

  chartTitle.textContent = topic;
  chartSub.textContent = '';

  // Layout handling
  if(layout === 'standard') buildStandard(generated);
  else if(layout === 'compare') buildCompare(generated);
  else if(layout === 'cause') buildCause(generated);
  else if(layout === 'crex-short') buildCRexShort(topic);
  else if(layout === 'crex-extended') buildCRexExtended(topic);
  else buildStandard(generated);

  resetProgress();
});

// -----------------------------
// Swatches
// -----------------------------
document.querySelectorAll('.swatch').forEach(btn => {
  btn.addEventListener('click', () => {
    setAccent(btn.dataset.color);
  });
});

// -----------------------------
// Toggles
// -----------------------------
$('toggle-sticky').addEventListener('change', (e)=>{
  toggleStickyNote(e.target.checked);
});
$('toggle-big').addEventListener('change', (e)=>{
  document.body.classList.toggle('bigtext', e.target.checked);
});
$('toggle-emoji').addEventListener('change', (e)=>{
  document.body.classList.toggle('emoji-bullets', e.target.checked);
});
$('toggle-hand').addEventListener('change', (e)=>{
  document.body.classList.toggle('math-hand', e.target.checked);
});

// -----------------------------
// Font, BG, Highlight Listeners
// -----------------------------
$('fontPreset').addEventListener('change', e => setFonts(e.target.value));
$('bgStyle').addEventListener('change', e => setBackground(e.target.value));
$('hlStyle').addEventListener('change', (e)=>{
  highlightMode = e.target.value;
  applyHighlightMode();
});

// -----------------------------
// Download PNG
// -----------------------------
$('btn-download').addEventListener('click', async () => {
  const canvas = await html2canvas(sheet, { scale: 2 });
  const link = document.createElement('a');
  link.download = 'chart.png';
  link.href = canvas.toDataURL();
  link.click();
});

// -----------------------------
// Download PDF
// -----------------------------
$('btn-pdf').addEventListener('click', async () => {
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({
    orientation: $('orientation').value,
    unit: 'pt',
    format: $('paper').value
  });

  const canvas = await html2canvas(sheet, { scale: 2 });
  const img = canvas.toDataURL('image/png');

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  pdf.addImage(img, 'PNG', 0, 0, pageWidth, pageHeight);
  pdf.save('chart.pdf');
});

// -----------------------------
// On Load: default states
// -----------------------------
setAccent('#0d9488');
setBackground('lined-light');
setFonts('hand+rounded');
applyHighlightMode();
