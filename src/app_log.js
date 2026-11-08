/* =========================================================
   DENNÍK + SYNCHRONIZÁCIA (GitHub, súkromný repozitár) + ODPORÚČANIA
   ========================================================= */
const WHO2={m:'Mama',t:'Tato'};
const ACT={train:{i:'🏋️',n:'Tréning'},sm:{i:'🧘',n:'SM systém'},pil:{i:'🤸',n:'Pilates'},hike:{i:'🥾',n:'Turistika'},swim:{i:'🏊',n:'Plávanie'},walk:{i:'🚶',n:'Prechádzka'}};
const VARN={home:'doma',gym:'domáca posilňovňa',fit:'fitko'};
const VARI={home:{i:'🏠',n:'Tréning doma'},gym:{i:'🏋️',n:'Domáca posilňovňa'},fit:{i:'🏢',n:'Fitnescentrum'}};
const actI=x=>x.t==='train'&&VARI[x.var]?VARI[x.var].i:ACT[x.t].i,actN=x=>x.t==='train'&&VARI[x.var]?VARI[x.var].n:ACT[x.t].n;
const qaBtns=ds=>Object.entries(VARI).map(([k,a])=>`<button type="button" data-qa="train" data-v="${k}"${ds?` data-d="${ds}"`:''}>${a.i} ${a.n}</button>`).join('')+
  Object.entries(ACT).filter(([k])=>k!=='train').map(([k,a])=>`<button type="button" data-qa="${k}"${ds?` data-d="${ds}"`:''}>${a.i} ${a.n}</button>`).join('');
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
  {const since60=addDays(day,-60);const used=[...new Set(trains.filter(x=>x.d>=since60).map(x=>x.var||'home'))];
   const l2=trains.slice(-2).map(x=>x.var||'home');
   if(R.status==='go'&&used.length>=2&&l2.length===2&&l2[0]===l2[1]){
     const others=used.filter(v=>v!==l2[0]);const lastOf=v=>{const t=trains.filter(x=>(x.var||'home')===v);return t.length?t[t.length-1].d:'';};
     others.sort((a,b)=>lastOf(a)<lastOf(b)?-1:1);const nx=others[0];
     R.alt=nx;R.lines.push(`🔄 Posledné 2 tréningy boli ${l2[0]==='home'?'doma':l2[0]==='gym'?'v domácej posilňovni':'vo fitku'} – ak sa dá, dnes skúste ${VARI[nx].i} ${nx==='home'?'tréning doma':nx==='gym'?'domácu posilňovňu':'fitnescentrum'}.`);}}
  // week summary + next day
  const need=Math.max(0,2-wcount);
  const wv={};trains.filter(x=>x.d>=wk).forEach(x=>{const v=x.var||'home';wv[v]=(wv[v]||0)+1;});
  R.week=`Tento týždeň: ${wcount}× posilňovanie${vs(wv)}`+(need?` · cieľ 2–3, chýba ešte ${need}`:' · cieľ 2–3 ✓');
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
function dedupe(){const keep=new Map();let ch=false;
  live().forEach(x=>{const k=x.who+'|'+x.d+'|'+x.t;const o=keep.get(k);if(!o){keep.set(k,x);return;}
    const sc=y=>(y.ex?1e6+Object.keys(y.ex).length:0)+(y.u||0)/1e13;const [win,lose]=sc(x)>sc(o)?[x,o]:[o,x];keep.set(k,win);delEntry(lose.id);ch=true;});
  if(ch)dbSave();return ch;}
function refreshLog(){dedupe();RECS={m:recFor('m'),t:recFor('t')};renderToday();renderCal();renderCharts();renderPlan();}
function renderToday(){const el=document.getElementById('tdDate');if(el)el.textContent=fmtD(today());}
/* projected recommended training days (1 rest day between, max 3 per week) */
function recDays(w,until){const t=today();until=until||addDays(t,42);const tr=entries(w).filter(x=>x.t==='train').map(x=>x.d);const set=new Set(tr);
  let last=tr.filter(d=>d<t).pop();const out=new Set();const wc={};tr.forEach(d=>{const m=monday(d);wc[m]=(wc[m]||0)+1;});
  for(let k=0;k<4000;k++){const d=addDays(t,k);if(d>until)break;if(set.has(d)){last=d;continue;}const m=monday(d);
    if((!last||daysBetween(last,d)>=2)&&(wc[m]||0)<3){out.add(d);last=d;wc[m]=(wc[m]||0)+1;}}
  return out;}
let RD={m:new Set(),t:new Set()},RDend='';
const MES=['január','február','marec','apríl','máj','jún','júl','august','september','október','november','december'];
let calYM=null,calSel=null;
function vs(o){const k=Object.keys(VARI).filter(v=>o[v]);return k.length?' ('+k.map(v=>VARI[v].i+o[v]).join(' ')+')':'';}
function renderCal(){const el=document.getElementById('cal');if(!el)return;const t=today();if(!calSel)calSel=t;
  if(!calYM)calYM=t.slice(0,7);const [Y,M]=calYM.split('-').map(Number);
  const first=`${calYM}-01`;const last=dstr(new Date(Y,M,0));const start=monday(first);const end=addDays(monday(last),6);
  RD={m:recDays('m',end),t:recDays('t',end)};RDend=end;const isCur=calYM===t.slice(0,7);
  let h=`<div class="calnav"><button type="button" class="cnb" data-cm="-1" aria-label="Predchádzajúci mesiac">‹</button><b>${MES[M-1]} ${Y}</b><button type="button" class="cnb" data-cm="1" aria-label="Ďalší mesiac">›</button></div>`+
    `<div class="caltd"><span>Dnes je <b>${fmtD(t)}${Y!==+t.slice(0,4)||!isCur?' '+t.slice(0,4):''}</b></span>${isCur?'':'<button type="button" class="cnt" data-cm="0">↩ Späť na dnes</button>'}</div>`;
  h+='<div class="calh">'+['Po','Ut','St','Št','Pi','So','Ne'].map(x=>`<span>${x}</span>`).join('')+'</div><div class="calg">';
  const L=live();let nTr={m:0,t:0},nV={m:{},t:{}};
  for(let ds=start;ds<=end;ds=addDays(ds,1)){const E=L.filter(x=>x.d===ds);const inM=ds.slice(0,7)===calYM;
    if(inM)['m','t'].forEach(w=>{const tr=E.filter(x=>x.who===w&&x.t==='train');if(tr.length){nTr[w]++;const v=tr[tr.length-1].var||'home';nV[w][v]=(nV[w][v]||0)+1;}});
    const ic=who=>[...new Set(E.filter(x=>x.who===who).map(actI))].join('');
    const rk=['m','t'].filter(w=>RD[w].has(ds));
    h+=`<button type="button" class="cd${ds===t?' tod':''}${ds>t?' fut':''}${inM?'':' out'}${ds===calSel?' sel':''}${rk.length?' rec':''}" data-d="${ds}">${rk.length?`<span class="rk">${rk.map(w=>`<u class="${w}"></u>`).join('')}</span>`:''}<i>${dparse(ds).getDate()}</i><b class="m">${ic('m')}</b><b class="t">${ic('t')}</b></button>`;}
  h+='</div>';
  el.innerHTML='<div class="calL">'+h+`<p class="mute calsum">${MES[M-1][0].toUpperCase()+MES[M-1].slice(1)}: tréningy – mama ${nTr.m}×${vs(nV.m)}, tato ${nTr.t}×${vs(nV.t)}</p>`+
    '<div class="leg">'+Object.values(VARI).map(a=>a.i+' '+a.n).join(' · ')+' · '+Object.entries(ACT).filter(([k])=>k!=='train').map(([k,a])=>a.i+' '+a.n).join(' · ')+' · <b class="m">■</b> mama <b class="t">■</b> tato · <span class="lgrec">▢</span> odporúčaný deň na tréning (bodka = kto)</div></div><div id="dayList" class="calday"></div>';
  showDay(calSel);}
document.addEventListener('click',e=>{const b=e.target.closest('[data-cm]');if(!b)return;const k=+b.dataset.cm;
  if(!k){calYM=today().slice(0,7);calSel=today();}else{const [Y,M]=calYM.split('-').map(Number);const d=new Date(Y,M-1+k,1);calYM=dstr(d).slice(0,7);}
  renderCal();});
/* swipe left/right on calendar */
(function(){let x0=null,y0=null;document.addEventListener('touchstart',e=>{const c=e.target.closest('#cal');if(!c){x0=null;return;}x0=e.touches[0].clientX;y0=e.touches[0].clientY;},{passive:true});
  document.addEventListener('touchend',e=>{if(x0==null)return;const dx=e.changedTouches[0].clientX-x0,dy=e.changedTouches[0].clientY-y0;x0=null;
    if(Math.abs(dx)>60&&Math.abs(dx)>2*Math.abs(dy)){const [Y,M]=calYM.split('-').map(Number);calYM=dstr(new Date(Y,M-1+(dx<0?1:-1),1)).slice(0,7);renderCal();}},{passive:true});})();
/* new day (app left open over midnight / reopened next day) → refresh dates */
let _lastDay=today();
function dayCheck(){const t=today();if(t===_lastDay)return;const was=_lastDay;_lastDay=t;
  if(calSel===was)calSel=t;
  if(calYM===was.slice(0,7))calYM=t.slice(0,7);refreshLog();try{build();}catch(e){}}
document.addEventListener('visibilitychange',()=>{if(!document.hidden)dayCheck();});setInterval(dayCheck,60000);
document.addEventListener('click',e=>{const b=e.target.closest('.cd');if(!b)return;calSel=b.dataset.d;document.querySelectorAll('.cd.sel').forEach(x=>x.classList.remove('sel'));b.classList.add('sel');showDay(calSel);
  if(innerWidth<900){const dl=document.getElementById('dayList');dl&&dl.scrollIntoView({behavior:'smooth',block:'nearest'});}});
function dayHas(w,ds,t,v){return live().find(x=>x.who===w&&x.d===ds&&(t==='train'?x.t==='train'&&(x.var||'home')===v:x.t===t));}
function dayRec(ds){const t=today();if(ds<t)return '';
  const per={};['m','t'].forEach(w=>{let L;const tr=live().find(x=>x.who===w&&x.d===ds&&x.t==='train');
    if(ds===t){const R=RECS[w];L=[...R.lines,`<span class="mute">${R.week}${R.next?' · '+R.next:''} · cyklus: týždeň ${R.wk}/4${R.deload?' (ľahší)':''}</span>`];if(R.lvlUp)L.push(`<b class="up">${R.lvlUp}</b>`);}
    else if(tr)L=['✅ Tréning naplánovaný.'];
    else L=[(ds>RDend?recDays(w,ds):RD[w]).has(ds)?'💪 Vhodný deň na tréning.':'😴 Voľno od posilňovania – prechádzka, plávanie, SM systém alebo turistika podľa chuti.'];
    per[w]=L;});
  if(per.m.join()===per.t.join())return `<div class="dayrec both"><p><b>Mama aj tato</b></p>${per.m.map(l=>`<p>${l}</p>`).join('')}</div>`;
  return ['m','t'].map(w=>`<div class="dayrec ${w}"><p><b>${WHO2[w]}</b></p>${per[w].map(l=>`<p>${l}</p>`).join('')}</div>`).join('');}
function dayBtns(ds){const W=quickWho();const st=(t,v)=>{const n=W.filter(w=>dayHas(w,ds,t,v)).length;return !W.length||!n?'':n===W.length?'on':'part';};
  return Object.entries(VARI).map(([k,a])=>`<button type="button" class="${st('train',k)}" data-qa="train" data-v="${k}" data-d="${ds}">${a.i} ${a.n}</button>`).join('')+
    Object.entries(ACT).filter(([k])=>k!=='train').map(([k,a])=>`<button type="button" class="${st(k)}" data-qa="${k}" data-d="${ds}">${a.i} ${a.n}</button>`).join('');}
function showDay(ds){const el=document.getElementById('dayList');if(!el)return;const E=live().filter(x=>x.d===ds).sort((a,b)=>a.who<b.who?-1:1);const t=today();
  el.innerHTML=`<h4>${ds===t?'Dnes · ':''}${fmtD(ds)}${ds.slice(0,4)!==t.slice(0,4)?' '+ds.slice(0,4):''}</h4>${dayRec(ds)}`+
    E.map(x=>`<div class="dl ${x.who}"><span>${actI(x)} <b>${WHO2[x.who]}</b> – ${actN(x)}${x.ex&&Object.keys(x.ex).length?' · '+Object.keys(x.ex).length+' cvikov':''}${x.pain&&x.pain[x.who]?painTxt(x.pain[x.who]):''}</span><button type="button" data-del="${x.id}" aria-label="Zmazať">✕</button></div>`).join('')+
    `<div class="qadd"><span>${ds>t?'Naplánovať':'Zapísať'} pre: <b>${quickWho().map(w=>WHO2[w]).join(' a ')||'– vyber hore Mama / Tato –'}</b> · ťuknutím zapneš / vypneš</span>${dayBtns(ds)}</div>`;}
const painTxt=p=>{const n=['bez bolesti','mierna','výrazná'];return ` · chrbát: ${n[p.b||0]}, bedro: ${n[p.h||0]}`;};
function afterChange(){dbSave();refreshLog();try{build();}catch(_){}}
function undoable(msg,xs){toast(msg,()=>{xs.forEach(x=>{delete x.del;x.u=Date.now();});afterChange();toast('↩ Vrátené');});}
document.addEventListener('click',e=>{const d=e.target.closest('[data-del]');if(d){const x=DB.e.find(y=>y.id===d.dataset.del);if(!x)return;delEntry(x.id);afterChange();undoable(`🗑 Zmazané: ${WHO2[x.who]} – ${actN(x)}`,[x]);return;}
  const q=e.target.closest('[data-qa]');if(!q)return;const W=quickWho();if(!W.length){toast('Vyber hore, kto: Mama / Tato');return;}
  const ds=q.dataset.d||calSel||today(),t=q.dataset.qa,v=q.dataset.v||VAR;const qx={t,var:v};
  if(W.every(w=>dayHas(w,ds,t,v))){const xs=W.map(w=>dayHas(w,ds,t,v));xs.forEach(x=>delEntry(x.id));afterChange();undoable(`${actI(qx)} Zrušené: ${W.map(w=>WHO2[w]).join(' a ')} – ${actN(qx)}`,xs);return;}
  W.forEach(w=>{if(dayHas(w,ds,t,v))return;if(t==='train'){const o=live().find(x=>x.who===w&&x.d===ds&&x.t==='train');if(o){o.var=v;o.u=Date.now();return;}addEntry({who:w,d:ds,t,var:v,quick:1});}else addEntry({who:w,d:ds,t});});
  afterChange();toast(`${actI(qx)} Zapísané: ${W.map(w=>WHO2[w]).join(' a ')} – ${actN(qx)} (${fmtD(ds)})`);});
function quickWho(){return ['m','t'].filter(w=>{const c=document.getElementById('ww-'+w);return !c||c.checked;});}
document.addEventListener('change',e=>{if(e.target.id==='ww-m'||e.target.id==='ww-t')showDay(calSel||today());});
function toast(t,undo){let el=document.getElementById('toast');if(!el){el=document.createElement('div');el.id='toast';document.body.appendChild(el);}el.textContent=t;if(undo){const b=document.createElement('button');b.type='button';b.textContent='Vrátiť';b.onclick=()=>{el.classList.remove('on');undo();};el.appendChild(b);}el.classList.add('on');clearTimeout(el._t);el._t=setTimeout(()=>el.classList.remove('on'),undo?5000:2600);}

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
