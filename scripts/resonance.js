export const LIMIT = 130;

const movements = {
  terror:  { name: 'Terror',  full: 'Movement of Terror' },
  lament:  { name: 'Lament',  full: 'Movement of Lament' },
  wrath:   { name: 'Wrath',   full: 'Movement of Wrath' },
  delight: { name: 'Delight', full: 'Movement of Delight' }
};

const PALETTES = {
  terror:  ['D9A0FF', 'C070FF', 'AA40FF', '9010FF'],
  lament:  ['A0FFFF', '70F0FF', '40E0FF', '10D0FF'],
  wrath:   ['FFA0A0', 'FF7070', 'FF4040', 'FF1010'],
  delight: ['FFFFA0', 'FFFF70', 'FFFF40', 'FFFF10']
};

function extractCoords(raw) {
  const m = raw.match(/\(\s*([+-]?\d+(?:\.\d+)?)\s*,\s*([+-]?\d+(?:\.\d+)?)\s*\)/);
  return m ? `(${m[1]},${m[2]})` : null;
}

function colorize(text, palette, chunkSize) {
  if (!text) return '';
  let result = '';
  let idx = 0;
  for (let i = 0; i < text.length; i += chunkSize) {
    const chunk = text.slice(i, i + chunkSize);
    const hex = palette[idx % palette.length];
    result += `#c${hex}${chunk}`;
    idx++;
  }
  return result;
}

function buildCandidates(phrase, palette, coords) {
  const candidates = [];
  for (let chunk = 6; chunk >= 2; chunk--) {
    const colored = colorize(phrase, palette, chunk);
    candidates.push(`${colored} ${coords}`);
  }
  return candidates;
}

export function formatResonance(raw, movementKey) {
  const coords = extractCoords(raw);
  if (!coords) return { ok: false, error: 'No coordinates found. Paste a location that includes (x,y).' };

  const m = movements[movementKey] || movements.terror;
  const palette = PALETTES[movementKey] || PALETTES.terror;

  const phrases = [
    `Join us! NONSTOP ${m.full} Spam`,
    `Join us! NONSTOP ${m.name} Spam`,
    `NONSTOP ${m.full} Spam`,
    `NONSTOP ${m.name} Spam`,
    `Join ${m.name} Spam`,
    `${m.name} Spam`,
    m.name
  ];

  let best = null;
  for (const phrase of phrases) {
    const cands = buildCandidates(phrase, palette, coords);
    for (const cand of cands) {
      if (cand.length <= LIMIT && (!best || cand.length > best.length)) {
        best = cand;
      }
    }
    if (best) break;
  }

  if (!best) {
    best = `#c${palette[0]}${m.name} ${coords}`;
  }

  const count = best.length;
  return {
    ok: count <= LIMIT,
    movement: m.full,
    coords,
    output: best,
    count,
    error: count > LIMIT ? 'Could not fit essential details under 130 characters.' : ''
  };
}

if (typeof document !== 'undefined') {
  const input = document.querySelector('#location-input');
  const output = document.querySelector('#output');
  const preview = document.querySelector('#preview');
  const status = document.querySelector('#status');
  const countEl = document.querySelector('#count');
  const copy = document.querySelector('#copy');

  function selectedMovement() {
    return document.querySelector('input[name="movement"]:checked')?.value || 'terror';
  }

  function update() {
    const r = formatResonance(input.value, selectedMovement());
    output.value = r.output || '';
    preview.replaceChildren();
    countEl.textContent = `${r.count || 0}/130 characters (including codes)${r.output ? ' · ' + Math.max(0, LIMIT - r.count) + ' remaining' : ''}`;
    copy.disabled = !r.ok;
    status.textContent = r.output
      ? `Movement: ${r.movement}. Coordinates: ${r.coords}. ${r.error || 'Fitted under 130. Ready to copy.'}`
      : r.error;

    if (r.output) {
      const parts = r.output.split(/(#c[0-9A-Fa-f]{6}|#[RGBYWK])/);
      let colour = '#ffffff';
      for (const part of parts) {
        if (/^#c[0-9A-Fa-f]{6}$/i.test(part)) {
          colour = '#' + part.slice(2);
        } else if (/^#[RGBYWK]$/.test(part)) {
          colour = { '#R': '#ff0000', '#G': '#00ff00', '#B': '#0000ff', '#Y': '#ffff00', '#W': '#ffffff', '#K': '#000000' }[part];
        } else if (part) {
          const span = document.createElement('span');
          span.style.color = colour;
          span.textContent = part;
          preview.append(span);
        }
      }
    }
  }

  input.addEventListener('input', update);
  document.querySelectorAll('input[name="movement"]').forEach(el => el.addEventListener('change', update));

  document.querySelector('#sample-btn').addEventListener('click', () => {
    input.value = 'World Vision1, Monolith: Exo (4800.00,576.00)';
    update();
  });

  document.querySelector('#clear-btn').addEventListener('click', () => {
    input.value = '';
    update();
    input.focus();
  });

  copy.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(output.value);
      status.textContent = 'Copied. Paste into the game chat and verify the coordinates.';
    } catch {
      output.focus();
      output.select();
      status.textContent = 'Clipboard unavailable. Copy the selected code manually.';
    }
  });

  update();
}
