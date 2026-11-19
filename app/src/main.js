// Wires the Neon Coast editor: pick photos, choose a layout, grade and size,
// edit the caption, crop and position each panel, and export the cover PNG.
// A `?shot=` query sets up a fixed scene for a screenshot instead (shots.js).
import { COVER_LAYOUTS, COVER_SIZES, defaultCoverState, drawCover, panelsForLayout } from './cover.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const captionInput = document.getElementById('caption');
const subtitleInput = document.getElementById('subtitle');
const status = document.getElementById('status');
const panelName = document.getElementById('panel-name');
const panelPhoto = document.getElementById('panel-photo');
const zoomInput = document.getElementById('zoom');
const zoomValue = document.getElementById('zoom-value');
const panXInput = document.getElementById('pan-x');
const panYInput = document.getElementById('pan-y');

const state = defaultCoverState();
let selectedPanel = 0;
let fontsReady = false;

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load ${url}`));
    img.src = url;
  });
}

async function ensureFonts() {
  if (fontsReady) return;
  try {
    await Promise.all([
      document.fonts.load('40px Anton'),
      document.fonts.load('40px Pacifico'),
      document.fonts.ready,
    ]);
  } catch (err) {
    // The fallback fonts still draw; the cover just loses its lettering.
    console.warn('fonts did not load', err);
  }
  fontsReady = true;
}

async function redraw() {
  await ensureFonts();
  drawCover(canvas, state);
}

/** Puts a loaded photo into a slot and marks the slot loaded. */
export function setPhoto(slot, img) {
  state.photos[slot] = img;
  document.querySelector(`.slot[data-slot="${slot}"]`).classList.add('loaded');
  redraw();
}

function loadSample(slot, name) {
  loadImage(`./samples/${name}.jpg`).then((img) => setPhoto(slot, img));
}

document.querySelectorAll('input[type="file"][data-photo]').forEach((input) => {
  input.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhoto(Number(input.dataset.photo), await loadImage(URL.createObjectURL(file)));
  });
});

document.querySelectorAll('button.sample').forEach((btn) => {
  btn.addEventListener('click', () => loadSample(Number(btn.dataset.slot), btn.dataset.sample));
});

document.querySelectorAll('button.fill-all').forEach((btn) => {
  btn.addEventListener('click', () => {
    const slot = Number(btn.dataset.slot);
    if (!state.photos[slot]) {
      status.textContent = 'Load a photo into this slot first.';
      return;
    }
    state.panels.forEach((p) => { p.photo = slot; });
    status.textContent = `All panels now use photo ${slot + 1}.`;
    syncPanelControls();
    redraw();
  });
});

function onChoice(id, fn) {
  document.getElementById(id).addEventListener('change', (e) => { fn(e.target.value); redraw(); });
}

onChoice('layout-choices', (layout) => {
  state.layout = layout;
  state.panels = panelsForLayout(layout, state.panels);
  selectedPanel = 0;
  syncPanelControls();
});
onChoice('grade-choices', (grade) => { state.grade = grade; });
onChoice('size-choices', (size) => { state.size = size; });

captionInput.addEventListener('input', () => { state.caption = captionInput.value; redraw(); });
subtitleInput.addEventListener('input', () => { state.subtitle = subtitleInput.value; redraw(); });

/** Reflects the selected panel in the crop controls. */
export function syncPanelControls() {
  const panel = state.panels[selectedPanel];
  panelName.textContent = String(selectedPanel + 1);
  panelPhoto.value = String(panel.photo);
  zoomInput.value = String(panel.zoom);
  zoomValue.textContent = `${panel.zoom.toFixed(2)}x`;
  panXInput.value = String(panel.panX);
  panYInput.value = String(panel.panY);
}

panelPhoto.addEventListener('change', () => {
  state.panels[selectedPanel].photo = Number(panelPhoto.value);
  redraw();
});
zoomInput.addEventListener('input', () => {
  state.panels[selectedPanel].zoom = Number(zoomInput.value);
  zoomValue.textContent = `${Number(zoomInput.value).toFixed(2)}x`;
  redraw();
});
panXInput.addEventListener('input', () => { state.panels[selectedPanel].panX = Number(panXInput.value); redraw(); });
panYInput.addEventListener('input', () => { state.panels[selectedPanel].panY = Number(panYInput.value); redraw(); });

/** Clicking the preview picks the panel under the pointer. */
canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect();
  const fx = (e.clientX - rect.left) / rect.width;
  const fy = (e.clientY - rect.top) / rect.height;
  const size = COVER_SIZES[state.size];
  const bandH = 0.17;
  if (fy > 1 - bandH) return; // the title band is no panel
  const border = 0.014;
  const area = { x: border, y: border, w: 1 - border * 2, h: (1 - bandH) - border };
  const px = (fx - area.x) / area.w;
  const py = (fy - area.y) / area.h;
  const panels = COVER_LAYOUTS[state.layout].panels;
  const hit = panels.findIndex((p) => px >= p[0] && px < p[0] + p[2] && py >= p[1] && py < p[1] + p[3]);
  if (hit >= 0) {
    selectedPanel = hit;
    syncPanelControls();
    status.textContent = `Panel ${hit + 1} selected — adjust its photo, zoom and position.`;
  }
  void size;
});

document.getElementById('export').addEventListener('click', async () => {
  await redraw();
  const size = COVER_SIZES[state.size];
  canvas.toBlob((blob) => {
    if (!blob) { status.textContent = 'Export failed — try again.'; return; }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `neon-coast-${size.width}x${size.height}.png`;
    a.click();
    status.textContent = `Saved neon-coast-${size.width}x${size.height}.png`;
  }, 'image/png');
});

const query = new URLSearchParams(location.search);
const shot = query.get('shot');
if (shot) {
  runShot(shot, query, { state, setPhoto, loadImage, redraw, syncPanelControls });
} else {
  syncPanelControls();
  redraw();
}
