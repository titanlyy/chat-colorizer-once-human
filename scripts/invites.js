export const LIMIT = 130;
export function formatInvite(raw) {
  const text = raw.replace(/#\[k=[^\]]+\]/gi, '').replace(/#l\b/g, '').replace(/#c[0-9a-f]{6}/gi, '').replace(/#[RG BYWK]/g, '').trim();
  const types = [['tower', /calamity\s*tower/i], ['nest', /calamity\s*nest/i], ['zone', /calamity\s*zone/i], ['fleet', /voyager\s*fleet/i]];
  const type = types.find(([, re]) => re.test(text))?.[0];
  if (!type) return {ok:false, error:'No supported event detected. Paste a Zone, Tower, Nest or Voyager Fleet invite.'};
  const world = text.match(/\bWorld\s*(\d+)\b/i)?.[1];
  const coord = text.match(/\(\s*([+-]?\d+(?:\.\d+)?)\s*,\s*([+-]?\d+(?:\.\d+)?)\s*\)/);
  if (!world || !coord) return {ok:false, type, error:'World or coordinates missing. No location will be invented.'};
  const size = text.match(/\b(Small|Medium|Large)\s*(?:calamity)/i)?.[1];
  const level = text.match(/\bLv\s*(\d+)\b/i)?.[1];
  const towerName = type === 'tower' ? text.match(/calamity\s*tower\s*[-–—:]\s*(.+?)(?=\s+located\s+at|\s*\[\s*World|$)/i)?.[1]?.trim() : '';
  const area = text.match(/\[\s*([^\[\]:]+)\s*:\s*\(/)?.[1]?.trim() || '';
  const title = type === 'fleet' ? 'Voyager Fleet' : `Calamity ${type[0].toUpperCase()+type.slice(1)}`;
  const prefix = size && type !== 'fleet' && type !== 'tower' ? size[0].toUpperCase()+size.slice(1).toLowerCase()+' ' : '';
  const location = `[World ${world}(${coord[1]},${coord[2]})]`;
  const heading = prefix+title+(towerName ? ' - '+towerName : '');
  const output = '#Y'+heading+(level ? ' #RLv'+level : '')+' #W'+location;
  const count = output.length;
  return {ok:count<=LIMIT, type, world, area, size:prefix.trim(), level, towerName, location, output, count, error:count>LIMIT?'Output exceeds 130 characters. Copy is disabled; essential details were not truncated.':''};
}
export const samples = [
'We are rallying to clear the Large calamity zone located at [World 11[Fragrant Cape:(-3283,-3338)]][Lv80]. Join us!',
'Crisis alert! We are rallying to challenge the Calamity Tower - Devouring Deep located at [World 1(-3725.00,-5637.00)]. Join the battle now!',
'We are working together to clear the SmallCalamity Nest located at [World 1[Falling Ember:(-2708,-5223)]][Lv80]. Come join us!',
"Uninvited guests from the deep! We've spotted the #[k=b5]Voyager Fleet#l near World 1. They're currently at (-4562.82,-7771.28). Join the fi"
];
if (typeof document !== 'undefined') {
  const input=document.querySelector('#invite-input'), output=document.querySelector('#invite-output'), preview=document.querySelector('#invite-preview'), status=document.querySelector('#invite-status'), count=document.querySelector('#invite-count'), copy=document.querySelector('#invite-copy');
  function update(){
    const r=formatInvite(input.value); output.value=r.output||''; preview.replaceChildren(); count.textContent=`${r.count||0}/130 characters (including codes)`; copy.disabled=!r.ok;
    status.textContent=r.output ? `Detected: ${r.type}. World ${r.world}.${r.area?' Removed area: '+r.area+'.':''} ${r.error||'Ready to test in game.'}` : r.error;
    if(r.output){let colour='#fff'; for(const part of r.output.split(/(#[YRW])/)){if(/^#[YRW]$/.test(part)){colour=({'#Y':'#ffff00','#R':'#ff6666','#W':'#ffffff'})[part];}else{const span=document.createElement('span');span.style.color=colour;span.textContent=part;preview.append(span);}}}
  }
  input.addEventListener('input',update);
  document.querySelectorAll('[data-sample]').forEach(b=>b.addEventListener('click',()=>{input.value=samples[Number(b.dataset.sample)];update();}));
  copy.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(output.value);status.textContent='Copied. Paste into game and verify the location link before sending.';}catch{output.focus();output.select();status.textContent='Clipboard unavailable. Copy the selected code manually.';}});
  document.querySelector('#invite-clear').addEventListener('click',()=>{input.value='';update();input.focus();}); update();
}
