export const LIMIT = 130;

const movements = {
  terror:  { name: 'Movement of Terror',  short: 'Terror',  hex: 'AA00FF', css: '#AA00FF' },
  lament:  { name: 'Movement of Lament',  short: 'Lament',  hex: '00FFFF', css: '#00FFFF' },
  wrath:   { name: 'Movement of Wrath',   short: 'Wrath',   hex: 'FF0000', css: '#FF0000' },
  delight: { name: 'Movement of Delight', short: 'Delight', hex: 'FFFF00', css: '#FFFF00' }
};

function extractCoords(raw) {
  const m = raw.match(/\(\s*([+-]?\d+(?:\.\d+)?)\s*,\s*([+-]?\d+(?:\.\d+)?)\s*\)/);
  return m ? `(${m[1]},${m[2]})` : null;
}

// Sunrise gradient palette (warm reds → oranges → yellow)
const SUNRISE = ['FF5858', 'FF6938', 'FB8F23', 'FCB138', 'FFEB46', 'FCB138', 'FB8F23'];

function colorizeGradient(text, palette) {
  if (!text) return '';
  const words = text.split(' ');
  let result = '';
  let colorIdx = 0;
  for (let i = 0; i < words.length; i++) {
    if (i > 0) result += ' ';
    const word = words[i];
    // Split longer words into 2–4 character chunks for the gradient effect
    const chunkSize = Math.max(2, Math.ceil(word.length / 3));
    for (let j = 0; j < word.length; j += chunkSize) {
      const chunk = word.slice(j, j + chunkSize);
      const hex = palette[colorIdx % palette.length];
      result += `#c${hex}${chunk}`;
      colorIdx++;
    }
  }
  return result;
}

export function formatResonance(raw, movementKey) {
  const coords = extractCoords(raw);
  if (!coords) return { ok: false, error: 'No coordinates found. Paste a location that includes (x,y).' };

  const m = movements[movementKey] || movements.terror;

  let output = '';
  if (movementKey === 'terror') {
    const phrase = 'Join us! NONSTOP Terror Movement Spam';
    const colored = colorizeGradient(phrase, SUNRISE);
    output = `${colored} #W${coords}`;
  } else {
    // Fallback for other movements (can expand later)
    const core = `#c${m.hex}${m.name} #W${coords}`;
    output = core;
  }

  const count = output.length;
  return {
    ok: count <= LIMIT,
    movement: m.name,
    coords,
    output,
    count,
    error: count > LIMIT ? 'Essential details exceed 130 characters.' : ''
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
      ? `Movement: ${r.movement}. Coordinates: ${r.coords}. ${r.error || 'Ready to copy and test in-game.'}`
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
