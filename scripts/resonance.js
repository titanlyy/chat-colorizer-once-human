export const LIMIT = 130;

const movements = {
  terror:  { name: 'Terror',  full: 'Movement of Terror' },
  lament:  { name: 'Lament',  full: 'Movement of Lament' },
  wrath:   { name: 'Wrath',   full: 'Movement of Wrath' },
  delight: { name: 'Delight', full: 'Movement of Delight' }
};

const PALETTES = {
  terror:  ['FFFFFF', 'F5E0FF', 'E8C0FF', 'DBA0FF', 'C880FF'], // clear white → light purple
  lament:  ['A0FFFF', '70F0FF', '40E0FF', '10D0FF'],
  wrath:   ['FFA0A0', 'FF7070', 'FF4040', 'FF1010'],
  delight: ['FFFFA0', 'FFFF70', 'FFFF40', 'FFFF10']
};

function extractCoords(raw) {
  const m = raw.match(/\(\s*([+-]?\d+(?:\.\d+)?)\s*,\s*([+-]?\d+(?:\.\d+)?)\s*\)/);
  return m ? `(${m[1]},${m[2]})` : null;
}

function colorizeGradient(text, palette, chunkSize) {
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

export function formatResonance(raw, movementKey) {
  const coords = extractCoords(raw);
  if (!coords) return { ok: false, error: 'No coordinates found. Paste a location that includes (x,y).' };

  const m = movements[movementKey] || movements.terror;
  const palette = PALETTES[movementKey] || PALETTES.terror;

  const templates = [
    (grad) => `#WJoin us! #YNONSTOP ${grad} #YSpam ${coords}`,
    (grad) => `#WJoin us! #YNONSTOP ${grad} ${coords}`,
    (grad) => `#YNONSTOP ${grad} #YSpam ${coords}`,
    (grad) => `#YNONSTOP ${grad} ${coords}`,
    (grad) => `${grad} #YSpam ${coords}`,
    (grad) => `${grad} ${coords}`
  ];

  let best = null;
  // Prefer smaller chunks (3–4) so the white→purple gradient is visible
  for (const tpl of templates) {
    for (let chunk = 3; chunk <= 4; chunk++) {
      const grad = colorizeGradient(m.full, palette, chunk);
      const cand = tpl(grad);
      if (cand.length <= LIMIT && (!best || cand.length > best.length)) {
        best = cand;
      }
    }
    if (best) break;
  }

  // Fallback to other chunk sizes if needed
  if (!best) {
    for (const tpl of templates) {
      for (let chunk = 2; chunk <= 6; chunk++) {
        const grad = colorizeGradient(m.full, palette, chunk);
        const cand = tpl(grad);
        if (cand.length <= LIMIT && (!best || cand.length > best.length)) {
          best = cand;
        }
      }
      if (best) break;
    }
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
