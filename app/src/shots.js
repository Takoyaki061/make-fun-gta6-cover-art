// Fixed scenes for screenshots: ?shot=editor shows the page with sample
// photos loaded; ?shot=cover shows one exported cover alone, edge to edge.
// Query knobs: layout, grade, size (square|portrait|wide), caption,
// subtitle, and photo (the sample every panel uses). window.__shotReady is
// set once the cover has been painted.
import { COVER_LAYOUTS, panelsForLayout } from './cover.js';

export async function runShot(shot, query, api) {
  const { state, setPhoto, loadImage, redraw, syncPanelControls } = api;
  const photoName = query.get('photo') ?? 'boulevard';
  const img = await loadImage(`./samples/${photoName}.jpg`);
  setPhoto(0, img);
  state.panels.forEach((p) => { p.photo = 0; });

  const layout = query.get('layout');
  if (layout && COVER_LAYOUTS[layout]) {
    state.layout = layout;
    state.panels = panelsForLayout(layout, state.panels);
    document.querySelector(`input[name="layout"][value="${layout}"]`).checked = true;
  }
  const grade = query.get('grade');
  if (grade) {
    state.grade = grade;
    document.querySelector(`input[name="grade"][value="${grade}"]`).checked = true;
  }
  const size = query.get('size');
  if (size) {
    state.size = size;
    document.querySelector(`input[name="size"][value="${size}"]`).checked = true;
  }
  const caption = query.get('caption');
  if (caption !== null) {
    state.caption = caption;
    document.getElementById('caption').value = caption;
  }
  const subtitle = query.get('subtitle');
  if (subtitle !== null) {
    state.subtitle = subtitle;
    document.getElementById('subtitle').value = subtitle;
  }
  // `photos=a,b,c` loads one sample per slot, then deals them round the
  // panels. Runs after the layout, so every panel of the chosen layout
  // gets its share.
  const photos = query.get('photos');
  if (photos) {
    const names = photos.split(',').map((s) => s.trim()).filter(Boolean).slice(0, 4);
    for (let i = 0; i < names.length; i++) {
      setPhoto(i, await loadImage(`./samples/${names[i]}.jpg`));
    }
    state.panels.forEach((p, i) => { p.photo = i % names.length; });
  }
  if (shot === 'editor') {
    // A second sample photo in slot 2, so the editor shows two photos loaded.
    const second = await loadImage('./samples/neon.jpg');
    setPhoto(1, second);
    state.panels[1] = { ...state.panels[1], photo: 1 };
  }
  if (shot === 'cover') document.body.classList.add('shot-cover');
  syncPanelControls();
  await redraw();
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
