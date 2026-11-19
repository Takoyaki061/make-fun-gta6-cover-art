// Neon Coast — the cover engine. Draws a multi-panel GTA-style poster cover
// onto a canvas: panel grid, per-panel photo with crop and position, a
// sunset or neon colour grade, palm silhouettes, grain and vignette, and a
// bold Anton title lockup with a Pacifico script subtitle. No Rockstar
// artwork, logo or font anywhere: the lettering is Anton and Pacifico, both
// shipped under the SIL Open Font License in app/fonts/.

/** The three post sizes the app exports, in pixels. */
export const COVER_SIZES = {
  square: { width: 1080, height: 1080, label: '1080 x 1080' },
  portrait: { width: 1080, height: 1350, label: '1080 x 1350' },
  wide: { width: 1920, height: 1080, label: '1920 x 1080' },
};

/** Panel layouts. Each panel is [x, y, w, h] in fractions of the panel area. */
export const COVER_LAYOUTS = {
  hero: {
    label: 'Hero + two',
    panels: [[0, 0, 0.62, 1], [0.62, 0, 0.38, 0.5], [0.62, 0.5, 0.38, 0.5]],
  },
  grid: {
    label: 'Four panels',
    panels: [[0, 0, 0.5, 0.5], [0.5, 0, 0.5, 0.5], [0, 0.5, 0.5, 0.5], [0.5, 0.5, 0.5, 0.5]],
  },
  triptych: {
    label: 'Three up',
    panels: [[0, 0, 0.34, 1], [0.34, 0, 0.32, 1], [0.66, 0, 0.34, 1]],
  },
  nine: {
    label: 'Nine panel',
    panels: [
      [0, 0, 1 / 3, 1 / 3], [1 / 3, 0, 1 / 3, 1 / 3], [2 / 3, 0, 1 / 3, 1 / 3],
      [0, 1 / 3, 1 / 3, 1 / 3], [1 / 3, 1 / 3, 1 / 3, 1 / 3], [2 / 3, 1 / 3, 1 / 3, 1 / 3],
      [0, 2 / 3, 1 / 3, 1 / 3], [1 / 3, 2 / 3, 1 / 3, 1 / 3], [2 / 3, 2 / 3, 1 / 3, 1 / 3],
    ],
  },
};

/** Colour grades: a wash, a top-to-bottom tint and the title gradient. */
export const COVER_GRADES = {
  sunset: {
    label: 'Sunset',
    wash: 'rgba(255, 110, 60, 0.20)', top: 'rgba(255, 94, 98, 0.28)',
    bottom: 'rgba(120, 30, 120, 0.34)', title: ['#ffd166', '#ff5e62', '#ff2e88'],
    accent: '#2de2ff',
  },
  neon: {
    label: 'Neon night',
    wash: 'rgba(40, 220, 255, 0.16)', top: 'rgba(255, 46, 136, 0.30)',
    bottom: 'rgba(10, 10, 60, 0.42)', title: ['#2de2ff', '#ff2e88', '#ffd166'],
    accent: '#ff2e88',
  },
  vice: {
    label: 'Vice pink',
    wash: 'rgba(255, 46, 136, 0.22)', top: 'rgba(255, 120, 200, 0.26)',
    bottom: 'rgba(60, 10, 90, 0.38)', title: ['#ff9de2', '#ff2e88', '#7b2fff'],
    accent: '#2de2ff',
  },
  midnight: {
    label: 'Midnight',
    wash: 'rgba(30, 60, 200, 0.18)', top: 'rgba(20, 20, 80, 0.30)',
    bottom: 'rgba(0, 0, 10, 0.46)', title: ['#e8f4ff', '#9db8ff', '#ff2e88'],
    accent: '#ffd166',
  },
};

/** A fresh cover state: four photo slots, one panel assignment per panel. */
export function defaultCoverState() {
  return {
    layout: 'hero',
    grade: 'sunset',
    size: 'square',
    caption: 'NEON COAST',
    subtitle: 'sunset run',
    photos: [null, null, null, null],
    panels: COVER_LAYOUTS.hero.panels.map(() => ({ photo: 0, zoom: 1, panX: 0, panY: 0 })),
  };
}

/** Rebuilds the panel assignments when the layout changes, keeping photos. */
export function panelsForLayout(layout, previous) {
  const count = COVER_LAYOUTS[layout].panels.length;
  const next = [];
  for (let i = 0; i < count; i++) {
    const old = previous && previous[i];
    next.push(old ? { ...old } : { photo: 0, zoom: 1, panX: 0, panY: 0 });
  }
  return next;
}

/** Draws one photo into a panel rect, cover-fit, with zoom and pan. */
export function drawPanelPhoto(ctx, photo, rect, panel) {
  const { x, y, w, h } = rect;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  if (!photo) {
    const g = ctx.createLinearGradient(x, y, x + w, y + h);
    g.addColorStop(0, '#3a1c5e');
    g.addColorStop(1, '#12081f');
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.font = `600 ${Math.max(14, w * 0.045)}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('ADD A PHOTO', x + w / 2, y + h / 2);
  } else {
    const scale = Math.max(w / photo.naturalWidth, h / photo.naturalHeight) * panel.zoom;
    const pw = photo.naturalWidth * scale;
    const ph = photo.naturalHeight * scale;
    const dx = x + (w - pw) / 2 + panel.panX * w;
    const dy = y + (h - ph) / 2 + panel.panY * h;
    ctx.drawImage(photo, dx, dy, pw, ph);
  }
  ctx.restore();
}

/** A palm silhouette: curved trunk and drooping fronds, drawn in one colour. */
export function drawPalm(ctx, x, baseY, height, lean, colour) {
  ctx.save();
  ctx.strokeStyle = colour;
  ctx.fillStyle = colour;
  ctx.lineCap = 'round';
  const topX = x + lean;
  const topY = baseY - height;
  ctx.lineWidth = Math.max(4, height / 26);
  ctx.beginPath();
  ctx.moveTo(x, baseY);
  ctx.quadraticCurveTo(x + lean * 0.4, baseY - height * 0.55, topX, topY);
  ctx.stroke();
  const fronds = 7;
  for (let k = 0; k < fronds; k++) {
    const ang = Math.PI * (0.06 + 0.88 * k / (fronds - 1));
    const len = height * 0.40;
    const ex = topX + Math.cos(ang) * len;
    const ey = topY + Math.sin(ang) * len * 0.55 + height * 0.10;
    const mx = topX + Math.cos(ang) * len * 0.5;
    const my = topY + Math.sin(ang) * len * 0.28 - height * 0.05;
    ctx.lineWidth = Math.max(3, height / 42);
    ctx.beginPath();
    ctx.moveTo(topX, topY);
    ctx.quadraticCurveTo(mx, my, ex, ey);
    ctx.stroke();
    for (let j = 1; j <= 3; j++) {
      const f = j / 4;
      const lx = topX + (ex - topX) * f;
      const ly = topY + (ey - topY) * f;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(lx, ly);
      ctx.lineTo(lx - height * 0.02, ly + height * 0.035);
      ctx.stroke();
    }
  }
  ctx.restore();
}

let grainTile = null;

/** A small deterministic noise tile, reused for the film grain. */
export function grainPattern(ctx) {
  if (grainTile) return grainTile;
  const tile = document.createElement('canvas');
  tile.width = 128;
  tile.height = 128;
  const tctx = tile.getContext('2d');
  const img = tctx.createImageData(128, 128);
  let seed = 20261119;
  const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.floor(rnd() * 255);
    img.data[i] = v; img.data[i + 1] = v; img.data[i + 2] = v; img.data[i + 3] = 255;
  }
  tctx.putImageData(img, 0, 0);
  grainTile = ctx.createPattern(tile, 'repeat');
  return grainTile;
}

/** Draws the whole cover onto `canvas` (sized to the chosen export size). */
export function drawCover(canvas, state) {
  const size = COVER_SIZES[state.size];
  canvas.width = size.width;
  canvas.height = size.height;
  const ctx = canvas.getContext('2d');
  const w = size.width;
  const h = size.height;
  const grade = COVER_GRADES[state.grade];
  const layout = COVER_LAYOUTS[state.layout];

  // White poster border and gutters, the GTA poster frame.
  const border = Math.round(w * 0.014);
  const gutter = Math.round(w * 0.009);
  ctx.fillStyle = '#fdfdf8';
  ctx.fillRect(0, 0, w, h);

  // Title band along the foot; panels fill the rest.
  const bandH = Math.round(h * 0.17);
  const area = { x: border, y: border, w: w - border * 2, h: h - bandH - border };

  layout.panels.forEach((p, i) => {
    const rect = {
      x: area.x + p[0] * area.w + gutter / 2,
      y: area.y + p[1] * area.h + gutter / 2,
      w: p[2] * area.w - gutter,
      h: p[3] * area.h - gutter,
    };
    const panel = state.panels[i] || { photo: 0, zoom: 1, panX: 0, panY: 0 };
    const photo = state.photos[panel.photo] || null;
    drawPanelPhoto(ctx, photo, rect, panel);
    // The grade: a sunset tint over the photo, stronger at the foot.
    const tint = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
    tint.addColorStop(0, grade.top);
    tint.addColorStop(1, grade.bottom);
    ctx.fillStyle = tint;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.fillStyle = grade.wash;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  });

  // Palm silhouettes framing the hero panel's top corners.
  const palmH = area.h * 0.42;
  ctx.globalAlpha = 0.92;
  drawPalm(ctx, area.x + w * 0.02, area.y + palmH * 0.92, palmH, w * 0.03, '#0d0518');
  drawPalm(ctx, area.x + area.w - w * 0.02, area.y + palmH * 0.85, palmH * 0.82, -w * 0.025, '#0d0518');
  ctx.globalAlpha = 1;

  // A diagonal neon slash across the top right, the poster's accent.
  ctx.save();
  ctx.beginPath();
  ctx.rect(area.x, area.y, area.w, area.h);
  ctx.clip();
  ctx.strokeStyle = grade.accent;
  ctx.lineWidth = Math.max(3, w * 0.004);
  ctx.globalAlpha = 0.6;
  ctx.beginPath();
  ctx.moveTo(area.x + area.w * 0.72, area.y - 10);
  ctx.lineTo(area.x + area.w + 10, area.y + area.h * 0.30);
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.restore();

  // Title band: deep dusk, caption in Anton with a sunset gradient fill.
  const bandY = h - bandH;
  const bandGrad = ctx.createLinearGradient(0, bandY, 0, h);
  bandGrad.addColorStop(0, '#1c0b33');
  bandGrad.addColorStop(1, '#0a0416');
  ctx.fillStyle = bandGrad;
  ctx.fillRect(border, bandY, w - border * 2, bandH - border);
  ctx.fillStyle = grade.accent;
  ctx.fillRect(border, bandY, w - border * 2, Math.max(3, h * 0.004));

  const caption = (state.caption || '').trim().toUpperCase();
  if (caption) {
    let fontSize = bandH * 0.52;
    ctx.font = `${fontSize}px Anton, 'Arial Narrow', sans-serif`;
    while (ctx.measureText(caption).width > w * 0.88 && fontSize > 20) {
      fontSize -= 4;
      ctx.font = `${fontSize}px Anton, 'Arial Narrow', sans-serif`;
    }
    const textY = bandY + bandH * 0.56;
    const textGrad = ctx.createLinearGradient(0, textY - fontSize, 0, textY + fontSize * 0.2);
    grade.title.forEach((c, i) => textGrad.addColorStop(i / (grade.title.length - 1), c));
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(3, fontSize * 0.09);
    ctx.strokeStyle = '#0a0416';
    ctx.strokeText(caption, w / 2, textY);
    ctx.fillStyle = textGrad;
    ctx.fillText(caption, w / 2, textY);
  }

  // Script subtitle below the caption, centred, in Pacifico neon.
  const subtitle = (state.subtitle || '').trim();
  if (subtitle) {
    ctx.save();
    ctx.translate(w / 2, bandY + bandH * 0.88);
    ctx.rotate(-0.02);
    ctx.font = `${Math.round(bandH * 0.22)}px Pacifico, cursive`;
    ctx.textAlign = 'center';
    ctx.shadowColor = grade.accent;
    ctx.shadowBlur = Math.round(w * 0.010);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(subtitle, 0, 0);
    ctx.restore();
  }

  // Film grain and vignette, the printed-poster finish.
  ctx.save();
  ctx.globalAlpha = 0.05;
  ctx.fillStyle = grainPattern(ctx);
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
  const vig = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.42, w / 2, h / 2, Math.max(w, h) * 0.75);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(5,2,12,0.32)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, h);
}

/** Renders a cover at the chosen size and returns the canvas. */
export function renderCover(state) {
  const canvas = document.createElement('canvas');
  drawCover(canvas, state);
  return canvas;
}
