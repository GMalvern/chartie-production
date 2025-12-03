// ===== CONFIG =====
const PROXY = "https://chartie-proxy.onrender.com";
const MODEL = "models/gemini-2.5-flash";

// ===== Refs
const topicEl = document.getElementById('topic');
const btnGen = document.getElementById('btn-generate');
const btnDl = document.getElementById('btn-download');
const btnPDF = document.getElementById('btn-pdf');
const errorEl = document.getElementById('error');
const sheet = document.getElementById('sheet');
const titleEl = document.getElementById('chart-title');
const subEl = document.getElementById('chart-sub');
const contentEl = document.getElementById('chart-content');
const formatBadge = document.getElementById('format-badge');
const srStatus = document.getElementById('sr-status');

const layoutSel = document.getElementById('layout');
const hlStyleSel = document.getElementById('hlStyle');
const fontPresetSel = document.getElementById('fontPreset');
const bgStyleSel = document.getElementById('bgStyle');
const paperSel = document.getElementById('paper');
const orientSel = document.getElementById('orientation');
const toggleBig = document.getElementById('toggle-big');
const toggleEmoji = document.getElementById('toggle-emoji');
const toggleHand = document.getElementById('toggle-hand');
const toggleSticky = document.getElementById('toggle-sticky');

const progFill = document.getElementById('prog-fill');
const pencil = document.getElementById('pencil');
const loadingText = document.getElementById('loading-text');

const qtPanel = document.getElementById('qt-panel');
const qtRows = document.getElementById('qt-rows');
const qtTitle = document.getElementById('qt-title');
const qtSplitBlank = document.getElementById('qt-split-blank');
const qtSplitLines = document.getElementById('qt-split-lines');

const stickyBox = document.getElementById('sticky');
const stickyH = document.getElementById('sticky-h');
const stickyP = document.getElementById('sticky-p');
const stickyControls = document.getElementById('sticky-controls');
const stickyTitle = document.getElementById('sticky-title');
const stickyText = document.getElementById('sticky-text');

const accentButtons = [...document.querySelectorAll('.swatch')];

// ===== State
let lastChartJSON = null;
const simpleLayouts = new Set([
  'simple-title-body','simple-2col','simple-3col','simple-2x2',
  'simple-title-sub-3','simple-title-sub-list','simple-quote',
  'simple-def-callout','simple-objective-steps','simple-image'
]);
function isSimpleLayout(v){ return simpleLayouts.has(v); }

// ===== Helpers
function setAccent(hex){
  document.documentElement.style.setProperty('--accent', hex);
  // regen brush to match accent
  const acc = hex.replace('#','%23');
  const url = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 12' preserveAspectRatio='none'><path d='M2 9 Q 22 2, 42 8 T 98 8' fill='none' stroke='${acc}' stroke-width='6' stroke-linecap='round'/></svg>")`;
  document.documentElement.style.setProperty('--brush-url', url);
  refreshHighlights();
}
function setFonts(preset){
  if(preset === 'hand+rounded'){
    document.documentElement.style.setProperty('--title-font', "'Patrick Hand', cursive");
    document.documentElement.style.setProperty('--body-font', "'Poppins', system-ui, -apple-system, Segoe UI, Roboto, sans-serif");
  } else if(preset === 'serif+rounded'){
    document.documentElement.style.setProperty('--title-font', "'DM Serif Display', serif");
    document.documentElement.style.setProperty('--body-font', "'Nunito Sans', system-ui, -apple-system, Segoe UI, Roboto, sans-serif");
  } else if(preset === 'hand+sans'){
    document.documentElement.style.setProperty('--title-font', "'Patrick Hand', cursive");
    document.documentElement.style.setProperty('--body-font', "'Nunito Sans', system-ui, -apple-system, Segoe UI, Roboto, sans-serif");
  } else {
    document.documentElement.style.setProperty('--title-font', "'Nunito Sans', system-ui, -apple-system, Segoe UI, Roboto, sans-serif");
    document.documentElement.style.setProperty('--body-font', "'Nunito Sans', system-ui, -apple-system, Segoe UI, Roboto, sans-serif");
  }
}
function setBackground(style){
  sheet.classList.remove('bg-lined-light','bg-lined-dark','bg-blank','bg-graph','bg-poster');
  sheet.classList.add(
    style==='lined-dark' ? 'bg-lined-dark' :
    style==='blank' ? 'bg-blank' :
    style==='graph' ? 'bg-graph' :
    style==='poster' ? 'bg-poster' :
    'bg-lined-light'
  );
}
function emojiFor(i){
  const set=['🎯','📌','✏️','🧠','✨','📎','💡','🧩','📚','🔎'];
  return set[i % set.length] + ' ';
}
function refreshHighlights(){
  const style = hlStyleSel.value;
  const els = sheet.querySelectorAll('.hl');
  els.forEach(el=>{
    el.classList.remove('hl-clean','hl-brush','hl-none');
    el.classList.add(style==='brush'?'hl-brush': style==='none'?'hl-none':'hl-clean');
  });
}
function looksLikeComparison(t){
  const s=` ${String(t||'').toLowerCase()} `;
  return /( vs\.? | versus | compare|comparison| pov |point of view|pro\/?con|two sides|for and against|perspective)/i.test(s);
}
function looksMathy(t){
  return /[=±×÷\/]|[0-9]\s*[a-z]|[\^]|fraction|solve|equation|area|perimeter|volume|slope|intercept/i.test(t||'');
}

function startLoading(){
  btnGen.disabled=true;
  btnGen.textContent='Creating…';
  progressTo(5);
  loadingText.textContent='Cooking up a clean anchor chart…';
}
function progressTo(p){
  const v=Math.max(0,Math.min(100,p));
  progFill.style.width=v+'%';
  pencil.style.left=v+'%';
}
function stopLoading(){
  btnGen.disabled=false;
  btnGen.textContent='Create Chart';
  progressTo(100);
  setTimeout(()=>progressTo(0),600);
  loadingText.textContent='Done. Tweak anything, then download.';
}

// ===== Quick Templates UI
function addBox(label,id,rows=5,placeholder='Paste or type here…'){
  const wrap=document.createElement('div');
  wrap.innerHTML=`<label class="block text-xs font-semibold mb-1">${label}</label>
  <textarea id="${id}" rows="${rows}" class="w-full rounded-lg border px-3 py-2" placeholder="${placeholder}"></textarea>`;
  qtRows.appendChild(wrap);
}
function addInput(label,id,placeholder=''){
  const wrap=document.createElement('div');
  wrap.innerHTML=`<label class="block text-xs font-semibold mb-1">${label}</label>
  <input id="${id}" class="w-full rounded-lg border px-3 py-2" placeholder="${placeholder}" />`;
  qtRows.appendChild(wrap);
}
function buildQtRows(layout){
  qtRows.innerHTML=''; qtRows.className='grid gap-3';
  if(layout==='simple-title-body'){ addBox('Body','qt-body',8); }
  if(layout==='simple-2col'){
    qtRows.classList.add('md:grid-cols-2');
    addBox('Column A','qt-col1',10);
    addBox('Column B','qt-col2',10);
  }
  if(layout==='simple-3col'){
    qtRows.classList.add('md:grid-cols-3');
    addBox('Column A','qt-col1',10);
    addBox('Column B','qt-col2',10);
    addBox('Column C','qt-col3',10);
  }
  if(layout==='simple-2x2'){
    qtRows.classList.add('md:grid-cols-2');
    addBox('Top Left','qt-q1',7);
    addBox('Top Right','qt-q2',7);
    addBox('Bottom Left','qt-q3',7);
    addBox('Bottom Right','qt-q4',7);
  }
  if(layout==='simple-title-sub-3'){
    addInput('Subtitle','qt-sub','Short supporting line…');
    addInput('Bullet 1','qt-b1');
    addInput('Bullet 2','qt-b2');
    addInput('Bullet 3','qt-b3');
  }
  if(layout==='simple-title-sub-list'){
    addInput('Subtitle','qt-sub','Short supporting line…');
    addBox('Bulleted List (each line = bullet)','qt-list',8,'Item 1\nItem 2\nItem 3');
  }
  if(layout==='simple-quote'){
    addBox('Quote text','qt-quote',5,'“Put your best pull-quote here.”');
    addInput('Attribution','qt-by','— Name, role');
  }
  if(layout==='simple-def-callout'){
    addInput('Term','qt-term','Vocabulary Term');
    addBox('Definition','qt-def',4,'Student-friendly definition…');
    addBox('Examples (one per line)','qt-ex',4,'example 1\nexample 2');
  }
  if(layout==='simple-objective-steps'){
    addInput('Objective','qt-obj','I can…');
    addBox('Steps (one per line)','qt-steps',6,'Do this\nThen that\nFinish with…');
  }
  if(layout==='simple-image'){
    addInput('Image URL','qt-img','https://…');
    addInput('Caption','qt-cap','Short, friendly caption…');
  }
}
function qtValues(){
  const get = id => document.getElementById(id)?.value || '';
  return {
    title: qtTitle.value.trim(),
    body: get('qt-body'),
    col1: get('qt-col1'), col2: get('qt-col2'), col3: get('qt-col3'),
    q1: get('qt-q1'), q2: get('qt-q2'), q3: get('qt-q3'), q4: get('qt-q4'),
    sub: get('qt-sub'), b1:get('qt-b1'), b2:get('qt-b2'), b3:get('qt-b3'),
    list:get('qt-list'), quote:get('qt-quote'), by:get('qt-by'),
    term:get('qt-term'), def:get('qt-def'), ex:get('qt-ex'),
    obj:get('qt-obj'), steps:get('qt-steps'),
    img:get('qt-img'), cap:get('qt-cap')
  };
}
function distribute(byBlank){
  const areaIds = Array.from(qtRows.querySelectorAll('textarea')).map(t=>t.id);
  if(areaIds.length<=1) return;
  const first = document.getElementById(areaIds[0]);
  const chunks = (first.value||'').split(byBlank?(/\n\s*\n/):(/\n/)).map(s=>s.trim()).filter(Boolean);
  for(let i=0;i<areaIds.length;i++){
    document.getElementById(areaIds[i]).value = chunks[i] || '';
  }
}
qtSplitBlank?.addEventListener('click',()=>distribute(true));
qtSplitLines?.addEventListener('click',()=>distribute(false));

// ===== Rendering
function applyStyling(){
  sheet.classList.toggle('bigtext', toggleBig.checked);
  setBackground(bgStyleSel.value);
  setFonts(fontPresetSel.value);
  refreshHighlights();
  sheet.classList.toggle('math-hand', toggleHand.checked);
  // sticky
  stickyBox.classList.toggle('hidden', !toggleSticky.checked);
  stickyBox.setAttribute('aria-hidden', String(!toggleSticky.checked));
  stickyH.textContent = stickyTitle.value || '';
  stickyP.textContent = stickyText.value || '';
}
function makeCard(title, html){
  const d=document.createElement('div'); d.className='card';
  d.innerHTML = (title?`<h3 class="marker-h"><span class="hl hl-clean">${title}</span></h3>`:'') + (html||'');
  return d;
}
function renderSimple(layout){
  const v = qtValues();
  titleEl.textContent = v.title || (topicEl.value || 'Your Chart');
  subEl.textContent = '';
  const labelMap = {
    'simple-title-body':'Simple — Title & Body',
    'simple-2col':'Simple — Two Columns',
    'simple-3col':'Simple — Three Columns',
    'simple-2x2':'Simple — 2×2 Grid',
    'simple-title-sub-3':'Simple — Title + Subtitle + 3 Bullets',
    'simple-title-sub-list':'Simple — Title + Subtitle + List',
    'simple-quote':'Simple — Quote Card',
    'simple-def-callout':'Simple — Definition Callout',
    'simple-objective-steps':'Simple — Objective + Steps',
    'simple-image':'Simple — Image & Caption'
  };
  formatBadge.textContent = `Format: ${labelMap[layout]}`;
  contentEl.innerHTML = '';

  if(layout==='simple-title-body'){
    contentEl.appendChild(makeCard('', `<div class="whitespace-pre-wrap">${v.body||''}</div>`));
  }
  if(layout==='simple-2col'){
    const row=document.createElement('div'); row.className='grid gap-3 md:grid-cols-2';
    row.appendChild(makeCard('', `<div class="whitespace-pre-wrap">${v.col1||''}</div>`));
    row.appendChild(makeCard('', `<div class="whitespace-pre-wrap">${v.col2||''}</div>`));
    contentEl.appendChild(row);
  }
  if(layout==='simple-3col'){
::contentReference[oaicite:0]{index=0}
