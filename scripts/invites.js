export const LIMIT = 130;
const themes = {
  fleet: {open:'Deep-sea trouble!', calls:['All hands on deck!','Crew wanted!'], ends:["Bring your guns; let's sink this party!",'Bring the boom!','Join the crew!']},
  zone: {open:'Chaos needs company!', calls:['Squad up, bring the boom!','Squad up!'], ends:["Let's clean house!",'Join us!']},
  tower: {open:'The deep is calling!', calls:['Team up!','Join us!'], ends:["Let's give it a bad day!",'Bring the boom!']},
  nest: {open:'Bad neighbours spotted!', calls:['Squad up!','Join us!'], ends:['Bring the boom; eviction time!','Eviction time!']}
};
export function fitInvite(type, core) {
  const t=themes[type], candidates=[core];
  for(const opening of [t.open,'Rally up!','']) {
    for(const call of [...t.calls,'']) {
      for(const ending of [...t.ends,'']) {
        candidates.push((opening?'#R'+opening+' ':'')+core+(call?' #G'+call:'')+(ending?' #Y'+ending:''));
      }
    }
  }
  return candidates.filter(s=>s.length<=LIMIT).sort((a,b)=>b.length-a.length)[0] || core;
}
export function formatInvite(raw) {
  const text=raw.replace(/#\[k=[^\]]+\]/gi,'').replace(/#l\b/g,'').replace(/#c[0-9a-f]{6}/gi,'').replace(/#[RGBYWK]/g,'').trim();
  const type=[['tower',/calamity\s*tower/i],['nest',/calamity\s*nest/i],['zone',/calamity\s*zone/i],['fleet',/voyager\s*fleet/i]].find(([,re])=>re.test(text))?.[0];
  if(!type) return {ok:false,error:'No supported event detected. Paste a Zone, Tower, Nest or Voyager Fleet invite.'};
  const world=text.match(/\bWorld\s*(\d+)\b/i)?.[1];
  const coord=text.match(/\(\s*([+-]?\d+(?:\.\d+)?)\s*,\s*([+-]?\d+(?:\.\d+)?)\s*\)/);
  if(!world||!coord) return {ok:false,type,error:'World or coordinates missing. No location will be invented.'};
  const size=text.match(/\b(Small|Medium|Large)\s*calamity/i)?.[1];
  const level=text.match(/\bLv\s*(\d+)\b/i)?.[1];
  const towerName=type==='tower'?text.match(/calamity\s*tower\s*[-–—:]\s*(.+?)(?=\s+located\s+at|\s*\[\s*World|$)/i)?.[1]?.trim():'';
  const area=text.match(/\[\s*([^\[\]:]+)\s*:\s*\(/)?.[1]?.trim()||'';
  const title=type==='fleet'?'Voyager Fleet':`Calamity ${type[0].toUpperCase()+type.slice(1)}`;
  const prefix=size&&['zone','nest'].includes(type)?size[0].toUpperCase()+size.slice(1).toLowerCase()+' ':'';
  const location=`[World ${world}(${coord[1]},${coord[2]})]`;
  const core='#Y'+prefix+title+(towerName?' - '+towerName:'')+(level?' #RLv'+level:'')+' #W'+location;
  const output=fitInvite(type,core),count=output.length;
  return {ok:count<=LIMIT,type,world,area,size:prefix.trim(),level,towerName,location,output,count,error:count>LIMIT?'Essential details exceed 130 characters. Copy disabled; nothing was truncated.':''};
}
export const samples=[
'We are rallying to clear the Large calamity zone located at [World 11[Fragrant Cape:(-3283,-3338)]][Lv80]. Join us!',
'Crisis alert! We are rallying to challenge the Calamity Tower - Devouring Deep located at [World 1(-3725.00,-5637.00)]. Join the battle now!',
'We are working together to clear the SmallCalamity Nest located at [World 1[Falling Ember:(-2708,-5223)]][Lv80]. Come join us!',
"Uninvited guests from the deep! We've spotted the #[k=b5]Voyager Fleet#l near World 1. They're currently at (-4562.82,-7771.28). Join the fi"
];
if(typeof document!=='undefined') {
  const input=document.querySelector('#invite-input'),output=document.querySelector('#invite-output'),preview=document.querySelector('#invite-preview'),status=document.querySelector('#invite-status'),count=document.querySelector('#invite-count'),copy=document.querySelector('#invite-copy');
  const rules=document.querySelector('details ul');
  if(rules) {const li=document.createElement('li');li.textContent='Expanded invitations use red openings, yellow events and punchlines, green calls to join, and white locations. The longest complete template fitting 130 characters is selected automatically.';rules.append(li);}
  function update() {
    const r=formatInvite(input.value);output.value=r.output||'';preview.replaceChildren();count.textContent=`${r.count||0}/130 characters (including codes)${r.output?' · '+Math.max(0,LIMIT-r.count)+' remaining':''}`;copy.disabled=!r.ok;
    status.textContent=r.output?`Detected: ${r.type}. World ${r.world}.${r.area?' Removed area: '+r.area+'.':''} ${r.error||'Invitation fitted to budget. Ready to test in game.'}`:r.error;
    if(r.output) {let colour='#fff';for(const part of r.output.split(/(#[YRWG])/)) {if(/^#[YRWG]$/.test(part)) colour=({'#Y':'#ffff00','#R':'#ff0000','#W':'#ffffff','#G':'#00ff00'})[part];else {const span=document.createElement('span');span.style.color=colour;span.textContent=part;preview.append(span);}}}
  }
  input.addEventListener('input',update);
  document.querySelectorAll('[data-sample]').forEach(b=>b.addEventListener('click',()=>{input.value=samples[Number(b.dataset.sample)];update();}));
  copy.addEventListener('click',async()=>{try {await navigator.clipboard.writeText(output.value);status.textContent='Copied. Paste into game and verify the location link before sending.';}catch {output.focus();output.select();status.textContent='Clipboard unavailable. Copy selected code manually.';}});
  document.querySelector('#invite-clear').addEventListener('click',()=>{input.value='';update();input.focus();});update();
}
