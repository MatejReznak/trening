/* =========================================================
   DENNÍK + SYNCHRONIZÁCIA (GitHub, súkromný repozitár) + ODPORÚČANIA
   ========================================================= */
const WHO2={m:'Mama',t:'Tato'};
const ACT={train:{i:'🏋️',n:'Tréning'},sm:{i:'🧘',n:'SM systém'},pil:{i:'🤸',n:'Pilates'},hike:{i:'🥾',n:'Turistika'},swim:{i:'🏊',n:'Plávanie'},walk:{i:'🚶',n:'Prechádzka'}};
const VARN={home:'doma',gym:'domáca posilňovňa',fit:'fitko'};
const pad2=n=>String(n).padStart(2,'0');
const dstr=d=>d.getFullYear()+'-'+pad2(d.getMonth()+1)+'-'+pad2(d.getDate());
const today=()=>dstr(new Date());
const dparse=s=>{const [y,m,d]=s.split('-').map(Number);return new Date(y,m-1,d);};
const daysBetween=(a,b)=>Math.round((dparse(b)-dparse(a))/864e5);
const addDays=(s,n)=>{const d=dparse(s);d.setDate(d.getDate()+n);return dstr(d);};
const monday=s=>{const d=dparse(s);const k=(d.getDay()+6)%7;d.setDate(d.getDate()-k);return dstr(d);};
const fmtD=s=>{const d=dparse(s);return ['Ne','Po','Ut','St','Št','Pi','So'][d.getDay()]+' '+d.getDate()+'.'+(d.getMonth()+1)+'.';};
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7);

/* ---------- data ---------- */
const DKEY='tr-dennik',CKEY='tr-sync';
let DB={v:1,e:[],cfg:{}};
try{const s=JSON.parse(localStorage.getItem(DKEY)||'null');if(s&&s.e)DB=s;}catch(e){}
let SC={owner:'MatejReznak',repo:'trening-data',file:'dennik.json'};
try{Object.assign(SC,JSON.parse(localStorage.getItem(CKEY)||'{}'));}catch(e){}
const saveSC=()=>{try{localStorage.setItem(CKEY,JSON.stringify(SC));}catch(e){}};
function dbSave(push){DB._t=Date.now();try{localStorage.setItem(DKEY,JSON.stringify(DB));}catch(e){}if(push!==false){SC.dirty=true;saveSC();syncSoon(1500);}}
const live=()=>DB.e.filter(x=>!x.del);
function entries(who){return live().filter(x=>x.who===who).sort((a,b)=>a.d<b.d?-1:a.d>b.d?1:(a.c||0)-(b.c||0));}
function addEntry(o){const x=Object.assign({id:uid(),c:Date.now(),u:Date.now()},o);DB.e.push(x);return x;}
function delEntry(id){const x=DB.e.find(e=>e.id===id);if(x){x.del=true;x.u=Date.now();}}
/* shared settings (levels, variant) live in DB.cfg so both phones agree */
function pushCfg(){DB.cfg={LV:Object.assign({},LV),VAR,u:Date.now()};dbSave();}
function pullCfg(){if(DB.cfg&&DB.cfg.LV){LV=Object.assign({m:1,t:1},DB.cfg.LV);if(DB.cfg.VAR)VAR=DB.cfg.VAR;save();}}
const _save0=save;save=function(){_save0();if(!SYNCING)pushCfg();};
let SYNCING=false;

/* ---------- GitHub sync (contents API) ---------- */
const API='https://api.github.com';
let syncT=null,busy=false,again=false;
function syncSoon(ms){clearTimeout(syncT);if(SC.token)syncT=setTimeout(sync,ms||800);}
function setSync(t,err){const el=document.getElementById('syncSt');if(el){el.textContent=t;el.classList.toggle('err',!!err);}const b=document.getElementById('syncBadge');if(b){b.textContent=err?'⚠':(SC.token?'☁':'📱');b.title=t;}}
const b64e=s=>btoa(unescape(encodeURIComponent(s)));
const b64d=s=>{const bin=atob(s.replace(/\n/g,''));const u=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);return new TextDecoder().decode(u);};
async function gh(path,opt){
  const r=await fetch(API+path,Object.assign({cache:'no-store'},opt||{},{headers:Object.assign({'Authorization':'Bearer '+SC.token,'Accept':'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'},(opt&&opt.headers)||{})}));
  if(r.status===401)throw new Error('Token je neplatný alebo vypršal.');
  if(r.status===403)throw new Error('Token nemá právo zapisovať do repozitára '+SC.repo+'.');
  return r;}
function mergeDB(a,b){const m=new Map();[...a.e,...b.e].forEach(x=>{const o=m.get(x.id);if(!o||(x.u||0)>(o.u||0))m.set(x.id,x);});
  const cfg=((a.cfg&&a.cfg.u)||0)>=((b.cfg&&b.cfg.u)||0)?a.cfg:b.cfg;return {v:1,e:[...m.values()],cfg:cfg||{}};}
async function sync(){
  if(!SC.token)return;if(busy){again=true;return;}busy=true;setSync('Synchronizujem…');
  try{
    const p=`/repos/${SC.owner}/${SC.repo}/contents/${SC.file}`;
    let r=await gh(p);let remote=null,sha=null;
    if(r.status===404){const rr=await gh(`/repos/${SC.owner}/${SC.repo}`);if(rr.status===404)throw new Error('Repozitár '+SC.owner+'/'+SC.repo+' neexistuje alebo k nemu token nemá prístup.');}
    else if(!r.ok)throw new Error('GitHub odpovedal chybou '+r.status+'.');
    else{const j=await r.json();sha=j.sha;try{remote=JSON.parse(b64d(j.content));}catch(e){remote=null;}}
    const before=JSON.stringify(DB.e.length)+(DB._t||0);
    let merged=remote?mergeDB(DB,remote):DB;
    const changedLocal=!remote||JSON.stringify(merged.e.map(x=>x.id+x.u).sort())!==JSON.stringify(remote.e.map(x=>x.id+x.u).sort())||((merged.cfg&&merged.cfg.u)||0)!==((remote.cfg&&remote.cfg.u)||0);
    DB=Object.assign(merged,{_t:Date.now()});try{localStorage.setItem(DKEY,JSON.stringify(DB));}catch(e){}
    SYNCING=true;pullCfg();SYNCING=false;
    if(changedLocal){
      const who=SC.me?WHO2[SC.me]:'telefón';
      const body={message:`Denník: zmena (${who}, ${new Date().toLocaleString('sk-SK')})`,content:b64e(JSON.stringify(DB,null,1))};if(sha)body.sha=sha;
      const w=await gh(p,{method:'PUT',body:JSON.stringify(body),headers:{'Content-Type':'application/json'}});
      if(w.status===409||w.status===422){again=true;throw new Error('Súbežná zmena – skúšam znova…');}
      if(!w.ok)throw new Error('Zápis zlyhal ('+w.status+').');
    }
    SC.dirty=false;SC.when=Date.now();saveSC();
    setSync('Uložené na GitHube ✓ '+new Date().toLocaleTimeString('sk-SK',{hour:'2-digit',minute:'2-digit'}));
    refreshLog();try{build();}catch(e){}
  }catch(e){setSync(navigator.onLine===false?'Offline – uloží sa, keď bude internet.':e.message,true);}
  finally{busy=false;if(again){again=false;syncSoon(1200);}}
}
window.addEventListener('focus',()=>syncSoon(300));
document.addEventListener('visibilitychange',()=>{if(!document.hidden)syncSoon(300);});
window.addEventListener('online',()=>syncSoon(300));

/* ---------- recommendations ---------- */
function recFor(who,day){
  day=day||today();const E=entries(who).filter(x=>x.d<=day);const R={who,lines:[],legLight:false,easier:false,status:'go'};
  const trains=E.filter(x=>x.t==='train');const last=trains[trains.length-1];
  const todayTrain=trains.some(x=>x.d===day);const yday=addDays(day,-1);
  const wk=monday(day);const wcount=trains.filter(x=>x.d>=wk).length;
  const ydayAct=E.filter(x=>x.d===yday&&(x.t==='hike'||x.t==='swim'));const todayAct=E.filter(x=>x.d===day&&(x.t==='hike'||x.t==='swim'));
  const todaySM=E.some(x=>x.d===day&&(x.t==='sm'||x.t==='pil'));
  if(todayTrain){R.status='done';R.lines.push('✅ Dnes už posilňovanie bolo. Zajtra voľno od posilňovania.');}
  else if(last&&daysBetween(last.d,day)<2){R.status='rest';R.lines.push('😴 Včera bolo posilňovanie – dnes deň voľna (stačí SM systém, prechádzka, plávanie).');}
  else{R.status='go';R.lines.push(wcount>=3?'💪 Tento týždeň už máte 3 tréningy – ďalší je bonus, nie povinnosť.':'💪 Dnes je vhodný deň na tréning.');}
  if(ydayAct.length||todayAct.length){R.legLight=true;R.lines.push('🥾 '+(todayAct.length?'Dnes':'Včera')+' '+[...ydayAct,...todayAct].map(x=>ACT[x.t].n.toLowerCase()).join(' a ')+' → cviky na nohy ľahšie (o verziu nižšie, o sériu menej).');}
  if(todaySM)R.lines.push('🧘 Dnes bol SM systém / pilates – rozcvičku a strečing môžete skrátiť.');
  const lastTwo=trains.slice(-2);const p2=x=>x.pain&&x.pain[who]&&(x.pain[who].b===2||x.pain[who].h===2);const p1=x=>x.pain&&x.pain[who]&&(x.pain[who].b>=1||x.pain[who].h>=1);
  if(last&&p2(last)){R.easier=true;R.lines.push('⚠️ Po minulom tréningu bola výrazná bolesť – cviky na nohy a chrbát o verziu ľahšie, menší rozsah.');}
  else if(last&&p1(last))R.lines.push('ℹ️ Minule mierna bolesť – sledujte to; ak sa zhorší, zvoľte ľahšiu verziu.');
  if(lastTwo.length===2&&lastTwo.every(p2))R.lines.push('🩺 Výrazná bolesť dvakrát po sebe – pred ďalším posilňovaním sa poraďte s lekárom alebo fyzioterapeutom.');
  // week summary + next day
  const need=Math.max(0,2-wcount);
  R.week=`Tento týždeň: ${wcount}× posilňovanie`+(need?` (cieľ 2–3, chýba ešte ${need})`:' (cieľ 2–3 ✓)');
  if(R.status!=='go'){let n=addDays(day,1);if(last&&daysBetween(last.d,n)<2)n=addDays(last.d,2);if(todayTrain)n=addDays(day,2);R.next='Najbližší vhodný deň: '+fmtD(n);}
  // 4-week cycle
  const first=trains[0];R.wk=first?((Math.floor(daysBetween(first.d,day)/7))%4)+1:1;
  R.deload=R.wk===4&&trains.length>=6;
  // level-up hint
  const since=addDays(day,-28);const recent=trains.filter(x=>x.d>=since);const rates=[];recent.forEach(x=>{const ex=x.ex||{};Object.values(ex).forEach(o=>{if(o[who]&&o[who].r)rates.push(o[who].r);});});
  if(recent.length>=6&&rates.length>=10&&rates.filter(r=>r==='e').length/rates.length>=0.6&&!recent.some(p1)&&LV[who]<4)R.lvlUp=`⬆️ Posledné 4 týždne sú cviky väčšinou ľahké a bez bolesti – skúste úroveň ${LV[who]+1}.`;
  return R;}
let RECS={m:recFor('m'),t:recFor('t')};
function lastLog(who,exId){const E=entries(who).filter(x=>x.t==='train'&&x.ex&&x.ex[exId]&&x.ex[exId][who]);return E.slice(-3).map(x=>x.ex[exId][who]).reverse();}
function progHint(who,ex){const L=lastLog(who,ex.id);if(!L.length)return '';
  const kg=(L[0].s||[]).map(s=>s[1]).filter(Boolean);const lastKg=kg.length?Math.max(...kg.map(parseFloat).filter(x=>!isNaN(x))):null;
  const step=/^f/.test(ex.id)?'o 1 plát (≈ 2,5–5 kg)':(/rdl|Squat|lungeBB/.test(String(ex.v[vIdx(ex,who)].anim))?'o 2,5 kg':'o 1–2 kg');
  let t='Minule: '+(L[0].s||[]).map(s=>s[0]+(s[1]?'×'+s[1]:'')).join(', ');
  if(L.length>=2&&L[0].r==='e'&&L[1].r==='e')t+=' · <b>2× ľahké → pridajte '+step+'</b>';
  else if(L[0].r==='e')t+=' · ľahké – ak aj nabudúce, pridajte';
  else if(L[0].r==='h'&&L[1]&&L[1].r==='h')t+=' · 2× ťažké → zostaňte alebo uberte';
  return t;}
/* adjusted variant / dose, used by cards and workout mode */
const _vIdx0=vIdx;
vIdx=function(ex,who){let i=_vIdx0(ex,who);const R=RECS[who];if(!R||(OV[ex.id]&&OV[ex.id][who]!=null))return i;
  if((R.legLight&&LEGS.has(ex.id))||(R.easier&&BACKHIP.has(ex.id)))i=Math.max(0,i-1);return i;};
function doseOf(ex,who){
  if(ex.both)return {sets:0,reps:ex.both,w:'',rest:0};
  const lvl=LV[who]-1,dl=ex.dose[who];let d=dl[Math.min(lvl,dl.length-1)];if(lvl>=dl.length&&d[0])d=[Math.min(4,d[0]+1)].concat(d.slice(1));const v=ex.v[vIdx(ex,who)];
  const reps=v.r||d[1];let w=(lvl<dl.length&&v.w&&v.w[who]&&v.w[who][lvl])||d[2]||'';if(v.weighted===false)w='';
  let sets=d[0],why=[];const R=RECS[who];
  if(sets&&R){if(R.legLight&&LEGS.has(ex.id)){sets=Math.max(1,sets-1);why.push('po turistike/plávaní');}
    if(R.deload&&sets>1){sets=sets-1;why.push('ľahší 4. týždeň');}
    if(R.wk===1&&!R.deload&&sets>2&&entries(who).filter(x=>x.t==='train').length<3){sets=sets-1;why.push('1. týždeň – učíme sa techniku');}}
  return {sets,reps,w,rest:ex.rest||0,why};}
doseHTML=function(ex,who){if(ex.both)return null;const D=doseOf(ex,who);
  const extra=[D.w,D.rest?('pauza '+D.rest+' s'):''].filter(Boolean).join(' · ');const ph=progHint(who,ex);
  return `<div class="${who}"><b>${WHO[who]}</b><span class="sets">${D.sets?`${D.sets} ${seriesWord(D.sets)} × ${D.reps}`:D.reps}</span>${extra?`<small>${extra}</small>`:''}${D.why&&D.why.length?`<small class="adj">↓ ${D.why.join(', ')}</small>`:''}${ph?`<small class="prog">${ph}</small>`:''}</div>`;};

/* ---------- Today panel, diary, calendar, charts ---------- */
function refreshLog(){RECS={m:recFor('m'),t:recFor('t')};renderToday();renderCal();renderCharts();renderPlan();}
function renderToday(){const el=document.getElementById('today');if(!el)return;
  el.innerHTML=['m','t'].map(w=>{const R=RECS[w];return `<div class="tdy ${w}"><h4>${WHO2[w]} <span class="st ${R.status}">${{go:'tréning',rest:'voľno',done:'hotovo'}[R.status]}</span></h4>${R.lines.map(l=>`<p>${l}</p>`).join('')}<p class="mute">${R.week}${R.next?' · '+R.next:''}</p><p class="mute">Cyklus: týždeň ${R.wk} zo 4${R.deload?' (ľahší týždeň)':''}</p>${R.lvlUp?`<p class="up">${R.lvlUp}</p>`:''}</div>`;}).join('');}
function renderCal(){const el=document.getElementById('cal');if(!el)return;const t=today();const start=addDays(monday(t),-28);let h='<div class="calh"><span></span>'+['Po','Ut','St','Št','Pi','So','Ne'].map(x=>`<span>${x}</span>`).join('')+'</div>';
  for(let w=0;w<5;w++){h+='<div class="calr"><span class="wkl">'+fmtD(addDays(start,w*7)).split(' ')[1]+'</span>';for(let d=0;d<7;d++){const ds=addDays(start,w*7+d);const E=live().filter(x=>x.d===ds);
    const ic=who=>[...new Set(E.filter(x=>x.who===who).map(x=>ACT[x.t].i))].join('');
    h+=`<button type="button" class="cd${ds===t?' tod':''}${ds>t?' fut':''}" data-d="${ds}"><i>${dparse(ds).getDate()}</i><b class="m">${ic('m')}</b><b class="t">${ic('t')}</b></button>`;}h+='</div>';}
  el.innerHTML=h+'<div class="leg">'+Object.values(ACT).map(a=>a.i+' '+a.n).join(' · ')+' · <b class="m">■</b> mama <b class="t">■</b> tato</div><div id="dayList"></div>';}
document.addEventListener('click',e=>{const b=e.target.closest('.cd');if(!b)return;showDay(b.dataset.d);});
function showDay(ds){const el=document.getElementById('dayList');if(!el)return;const E=live().filter(x=>x.d===ds);
  el.innerHTML=`<h4>${fmtD(ds)}</h4>`+(E.length?E.map(x=>`<div class="dl ${x.who}"><span>${ACT[x.t].i} <b>${WHO2[x.who]}</b> – ${ACT[x.t].n}${x.var?' ('+VARN[x.var]+')':''}${x.ex?' · '+Object.keys(x.ex).length+' cvikov':''}${x.pain&&x.pain[x.who]?painTxt(x.pain[x.who]):''}</span><button type="button" data-del="${x.id}">✕</button></div>`).join(''):'<p class="mute">Žiadny záznam.</p>')+
    `<div class="qadd">Pridať na tento deň: ${Object.entries(ACT).map(([k,a])=>`<button type="button" data-qa="${k}" data-d="${ds}">${a.i} ${a.n}</button>`).join('')}</div>`;}
const painTxt=p=>{const n=['bez bolesti','mierna','výrazná'];return ` · chrbát: ${n[p.b||0]}, bedro: ${n[p.h||0]}`;};
document.addEventListener('click',e=>{const d=e.target.closest('[data-del]');if(d){if(confirm('Zmazať tento záznam?')){delEntry(d.dataset.del);dbSave();refreshLog();build();const op=document.querySelector('#dayList h4');}return;}
  const q=e.target.closest('[data-qa]');if(q){const who=quickWho();if(!who.length){alert('Vyber mamu alebo tatu.');return;}
    const ds=q.dataset.d||document.getElementById('qDate').value||today();
    if(q.dataset.qa==='train'){who.forEach(w=>addEntry({who:w,d:ds,t:'train',var:VAR,quick:1}));}else who.forEach(w=>addEntry({who:w,d:ds,t:q.dataset.qa}));
    dbSave();refreshLog();build();showDay(ds);toast(ACT[q.dataset.qa].i+' Zapísané: '+who.map(w=>WHO2[w]).join(' a ')+' – '+ACT[q.dataset.qa].n+' ('+fmtD(ds)+')');}});
function quickWho(){return ['m','t'].filter(w=>{const c=document.getElementById('qw-'+w);return !c||c.checked;});}
function toast(t){let el=document.getElementById('toast');if(!el){el=document.createElement('div');el.id='toast';document.body.appendChild(el);}el.textContent=t;el.classList.add('on');clearTimeout(el._t);el._t=setTimeout(()=>el.classList.remove('on'),2600);}
function renderCharts(){const el=document.getElementById('charts');if(!el)return;const all=[...HOME,...GYM,...FIT];const rows=[];
  all.forEach(ex=>{const ser={};['m','t'].forEach(w=>{ser[w]=entries(w).filter(x=>x.t==='train'&&x.ex&&x.ex[ex.id]&&x.ex[ex.id][w]).map(x=>{const s=x.ex[ex.id][w].s||[];const kg=s.map(q=>parseFloat(String(q[1]||'').replace(',','.'))).filter(n=>!isNaN(n));const rp=s.map(q=>parseInt(q[0])).filter(n=>!isNaN(n));return {d:x.d,kg:kg.length?Math.max(...kg):null,rp:rp.length?rp.reduce((a,b)=>a+b,0):0};});});
    if(ser.m.length+ser.t.length>=2)rows.push([ex,ser]);});
  if(!rows.length){el.innerHTML='<p class="mute">Grafy pokroku sa objavia po pár zapísaných tréningoch v režime „Cvičíme“ (zapisujú sa kilá a opakovania).</p>';return;}
  el.innerHTML=rows.map(([ex,ser])=>{const useKg=[...ser.m,...ser.t].some(p=>p.kg!=null);const val=p=>useKg?p.kg:p.rp;const pts=[...ser.m,...ser.t].filter(p=>val(p)!=null);
    const ds=[...new Set(pts.map(p=>p.d))].sort();const mx=Math.max(...pts.map(val)),mn=Math.min(...pts.map(val));const W=300,H=90;
    const X=d=>ds.length<2?W/2:12+(W-24)*ds.indexOf(d)/(ds.length-1),Y=v=>H-12-(H-26)*(mx===mn?0.5:(v-mn)/(mx-mn));
    const line=(arr,c)=>{const a=arr.filter(p=>val(p)!=null);return a.length?`<polyline fill="none" stroke="${c}" stroke-width="2.5" points="${a.map(p=>X(p.d)+','+Y(val(p))).join(' ')}"/>`+a.map(p=>`<circle cx="${X(p.d)}" cy="${Y(val(p))}" r="3.5" fill="${c}"/>`).join(''):'';};
    return `<div class="chart"><b>${ex.n}</b> <small>${useKg?'najväčšia váha (kg)':'opakovania spolu'} · ${mn}–${mx}</small><svg viewBox="0 0 ${W} ${H}">${line(ser.m,'#d9573b')}${line(ser.t,'#1f6f9f')}</svg></div>`;}).join('');}
function renderPlan(){const el=document.getElementById('plan4');if(!el)return;const R=RECS;
  const rows=[['1','Učíme sa techniku','o sériu menej pri cvikoch s 3+ sériami, pomaly a presne'],['2','Normálne','série a váhy podľa úrovne'],['3','Normálne, skúste pridať','ak bolo minule „ľahké“, pridajte váhu alebo 1–2 opakovania'],['4','Ľahší týždeň','o sériu menej – telo si odpočinie a zosilnie']];
  el.innerHTML=`<table class="p4"><tr><th>Týždeň</th><th>Čo</th><th>Ako</th></tr>${rows.map(r=>`<tr class="${(R.m.wk==r[0]||R.t.wk==r[0])?'cur':''}"><td>${r[0]}</td><td><b>${r[1]}</b></td><td>${r[2]}</td></tr>`).join('')}</table><p class="mute">Teraz: mama týždeň ${R.m.wk}, tato týždeň ${R.t.wk} (počíta sa od prvého zapísaného tréningu). Po 4 týždňoch sa cyklus opakuje; keď sú cviky dlhodobo ľahké, stránka navrhne vyššiu úroveň.</p>`;}

/* ---------- settings / sync UI ---------- */
function renderSync(){const el=document.getElementById('syncBox');if(!el)return;
  el.innerHTML=`<p id="syncSt" class="mute">${SC.token?'Pripojené k '+SC.owner+'/'+SC.repo:'Zatiaľ sa ukladá len v tomto telefóne.'}</p>
  <label>Kto používa tento telefón (pre popis zmien): <select id="sMe"><option value="">spoločný</option><option value="m"${SC.me==='m'?' selected':''}>Mama</option><option value="t"${SC.me==='t'?' selected':''}>Tato</option></select></label>
  ${SC.token?`<div class="row"><button type="button" id="sNow">⟳ Synchronizovať teraz</button><button type="button" id="sOff">Odpojiť</button></div>`:
  `<label>GitHub token <input id="sTok" type="password" autocomplete="off" placeholder="github_pat_…"></label><label>Repozitár <input id="sRepo" value="${SC.owner}/${SC.repo}"></label><div class="row"><button type="button" id="sOn">Pripojiť</button></div>`}
  <div class="row"><button type="button" id="sExp">⬇ Záloha (súbor)</button><label class="btn">⬆ Obnoviť zo súboru<input id="sImp" type="file" accept=".json" hidden></label></div>`;
  setSync(document.getElementById('syncSt').textContent);}
document.addEventListener('click',async e=>{const id=e.target.id;
  if(id==='sOn'){const t=document.getElementById('sTok').value.trim(),r=document.getElementById('sRepo').value.trim().split('/');if(!t){alert('Vlož token.');return;}SC.token=t;if(r.length===2){SC.owner=r[0];SC.repo=r[1];}SC.dirty=true;saveSC();renderSync();await sync();}
  else if(id==='sOff'){if(confirm('Odpojiť? Záznamy ostanú v telefóne, len sa prestanú ukladať na GitHub.')){delete SC.token;saveSC();renderSync();}}
  else if(id==='sNow')sync();
  else if(id==='sExp'){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(DB,null,1)],{type:'application/json'}));a.download='dennik-'+today()+'.json';a.click();}});
document.addEventListener('change',e=>{if(e.target.id==='sMe'){SC.me=e.target.value;saveSC();}
  if(e.target.id==='sImp'){const f=e.target.files[0];if(!f)return;f.text().then(t=>{try{const o=JSON.parse(t);DB=mergeDB(DB,o);dbSave();refreshLog();build();toast('Obnovené zo zálohy ✓');}catch(_){alert('Súbor sa nedá načítať.');}});}});
