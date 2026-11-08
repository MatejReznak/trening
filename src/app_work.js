/* =========================================================
   REŽIM „CVIČÍME“ – krok za krokom, série, pauza, hlas, zápis
   ========================================================= */
const WK={on:false};
let VOICE=(()=>{try{return localStorage.getItem('tr-voice')!=='0';}catch(e){return true;}})();
let AC=null;
function audioInit(){try{if(!AC)AC=new (window.AudioContext||window.webkitAudioContext)();AC.resume&&AC.resume();}catch(e){}}
function tone(f,t0,d,g){try{const o=AC.createOscillator(),G=AC.createGain();o.frequency.value=f;o.connect(G);G.connect(AC.destination);G.gain.setValueAtTime(g||0.25,AC.currentTime+t0);G.gain.exponentialRampToValueAtTime(0.001,AC.currentTime+t0+d);o.start(AC.currentTime+t0);o.stop(AC.currentTime+t0+d);}catch(e){}}
/* ---------- hlas trénera ---------- */
const VS={name:(()=>{try{return localStorage.getItem('tr-vname')||'';}catch(e){return '';}})(),rate:(()=>{try{return +localStorage.getItem('tr-vrate')||0.95;}catch(e){return 0.95;}})()};
function vList(){try{return speechSynthesis.getVoices().filter(v=>/^(sk|cs)/i.test(v.lang));}catch(e){return [];}}
function vScore(v){let s=/^sk/i.test(v.lang)?100:0;if(/premium|prémi/i.test(v.name))s+=30;else if(/enhanced|vylepš|rozšír|natural|neural|online/i.test(v.name))s+=20;if(/compact|kompakt|eloquence/i.test(v.name))s-=10;return s;}
function vBest(){const L=vList();if(VS.name){const f=L.find(v=>v.name===VS.name);if(f)return f;}return L.slice().sort((a,b)=>vScore(b)-vScore(a))[0]||null;}
function vQuality(v){return !v?'none':vScore(v)>=120?'good':'basic';}
function utter(t,o){const u=new SpeechSynthesisUtterance(t);const v=vBest();u.lang=v?v.lang:'sk-SK';if(v)u.voice=v;u.rate=VS.rate*((o&&o.fast)?1.08:1);u.pitch=1;return u;}
/* say = prehovor hneď (preruší predchádzajúce); sayNext = zaraď za to, čo práve hovorí */
function say(t,o){if(!VOICE||!window.speechSynthesis||!t)return;try{speechSynthesis.cancel();String(t).split('|').map(x=>x.trim()).filter(Boolean).forEach(x=>speechSynthesis.speak(utter(x,o)));}catch(e){}}
function sayNext(t,o){if(!VOICE||!window.speechSynthesis||!t)return;try{speechSynthesis.speak(utter(t,o));}catch(e){}}
const P2=(sg,pl)=>WK.who&&WK.who.length>1?pl:sg;
const NUMW=['nula','jeden','dva','tri','štyri','päť','šesť','sedem','osem','deväť','desať','jedenásť','dvanásť','trinásť','štrnásť','pätnásť','šestnásť','sedemnásť','osemnásť','devätnásť','dvadsať'];
const numW=n=>NUMW[n]||String(n);
const secW=n=>n===60?'jedna minúta':n===90?'minúta a pol':n===120?'dve minúty':numW(n)+' '+sk(n);
/* krátka hlavná rada, ktorú tréner povie pri každom cviku */
const CUE={h1:'Kolená smerujú ku špičkám, päty na zemi.',h2:'Tlač cez päty a hore stlač zadok.',h3:'Telo rovné ako doska.',h4:'Lopatky k sebe, ramená dole.',
 h5:'Trup vzpriamený, predné koleno nad členkom.',h6:'Trup sa netočí dozadu.',h7:'Panva sa nepreklápa, chrbát rovný.',h8:'Kríže stále pri zemi.',h9:'Brucho a zadok spevnené. A dýchaj.',
 g1:'Činka pri hrudi, päty na zemi, chrbát rovný.',g2:'Rovný chrbát, činky tesne pri stehnách.',g3:'Lopatky k sebe, lakte šikmo od tela.',g4:'Chrbát rovný, lakeť ťahaj popri tele.',
 g5:'Trup vzpriamený, predné koleno nad členkom.',g6:'Tlač cez päty a hore stlač zadok.',g7:'Trup sa netočí dozadu.',g8:'Ramená ďaleko od uší.',g9:'Vzpriamene, ramená dole a dozadu.',
 f1:'Kríže ostávajú opreté, kolená nezamykaj.',f2:'Najprv lopatky dole, potom ťahaj k hrudi.',f3:'Lopatky k sebe, lakte nezamykaj.',f4:'Trup sa nehýbe, lopatky k sebe.',
 f5:'Rovný chrbát, činky tesne pri stehnách.',f5b:'Trup vzpriamený, predné koleno nad členkom.',f6:'Zadok drž na sedadle.',f6b:'Plynulo, bez švihu.',f7:'Plynulo, len bez bolesti.',
 f8:'Len do priamky, nie za ňu.',f9:'Trup sa nesmie stočiť.',f10:'Tempo, pri ktorom sa dá rozprávať.'};
const cueOf=ex=>CUE[ex.id]||((ex.how||[])[0]||'');
const PARTW={warm:'Rozcvička.',main:'Hlavná časť.',cool:'Na záver strečing.'};
function stepIntro(i,first){const st=WK.steps[i];if(!st)return '';const prev=WK.steps[i-1];const part=(first||!prev||prev.part!==st.part)?PARTW[st.part]+'|':'';
  return part+(first||part?'':'Ďalší cvik: ')+st.ex.n+'.|'+cueOf(st.ex);}
function renderVoice(){const el=document.getElementById('voiceBox');if(!el)return;if(!window.speechSynthesis){el.innerHTML='<p class="mute">Tento prehliadač hlas nepodporuje.</p>';return;}
  const L=vList(),b=vBest(),q=vQuality(b);
  el.innerHTML=`<p>${q==='good'?'✅ Používa sa kvalitný hlas <b>'+b.name+'</b>.':q==='basic'?'⚠️ Používa sa základný hlas <b>'+b.name+'</b> – znie roboticky.':'⚠️ Slovenský hlas sa nenašiel.'}</p>
   ${L.length>1?`<label>Hlas: <select id="vSel"><option value="">automaticky (najlepší)</option>${L.slice().sort((a,c)=>vScore(c)-vScore(a)).map(v=>`<option value="${v.name.replace(/"/g,'&quot;')}"${v.name===VS.name?' selected':''}>${v.name} (${v.lang})</option>`).join('')}</select></label>`:''}
   <label>Rýchlosť: <input type="range" id="vRate" min="0.8" max="1.15" step="0.05" value="${VS.rate}"> <span id="vRateN">${Math.round(VS.rate*100)} %</span></label>
   <div class="wkbtns"><button type="button" id="vTest">▶ Vyskúšať hlas</button></div>
   ${q!=='good'?`<details${q==='none'?' open':''}><summary>Ako získať ľudskejší hlas (zadarmo)</summary><ol>
    <li>Na iPade/iPhone otvor <b>Nastavenia → Prístupnosť → Hovorený obsah → Hlasy</b>.</li>
    <li>Vyber <b>Slovenčina → Laura</b> a stiahni verziu <b>Vylepšený</b> (Enhanced), prípadne <b>Prémiový</b>, ak je k dispozícii.</li>
    <li>Aplikáciu úplne zatvor a znova otvor – kvalitný hlas sa vyberie sám.</li></ol></details>`:''}`;}
document.addEventListener('change',e=>{if(e.target.id==='vSel'){VS.name=e.target.value;try{localStorage.setItem('tr-vname',VS.name);}catch(_){}renderVoice();}});
document.addEventListener('input',e=>{if(e.target.id==='vRate'){VS.rate=+e.target.value;try{localStorage.setItem('tr-vrate',VS.rate);}catch(_){}const n=document.getElementById('vRateN');if(n)n.textContent=Math.round(VS.rate*100)+' %';}});
document.addEventListener('click',e=>{if(e.target.closest('#vTest')){const o=VOICE;VOICE=true;say('Ahoj, som váš tréner.|Ďalší cvik: Drep.|'+CUE.h1);VOICE=o;}});
try{speechSynthesis.addEventListener('voiceschanged',renderVoice);}catch(e){}
const vib=p=>{try{navigator.vibrate&&navigator.vibrate(p);}catch(e){}};
const sk=n=>n===1?'sekunda':n>=2&&n<=4?'sekundy':'sekúnd';
function secsOf(r){const m=String(r||'').match(/(\d+)\s*s\b/);if(m)return +m[1];const mm=String(r||'').match(/(\d+)\s*min/);return mm?+mm[1]*60:0;}

const SHORT={home:['h1','h2','h4','h7'],gym:['g1','g6','g4','h7'],fit:['f1','f4','f3','f9']};
const exById=id=>[...WARM,...HOME,...GYM,...FIT,...COOL].find(x=>x.id===id);
function wkStart(short){audioInit();const who=['m','t'].filter(w=>document.getElementById('ww-'+w).checked);if(!who.length){alert('Vyber, kto cvičí.');return;}
  const steps=[];if(short){['w1','w2'].forEach(id=>steps.push({ex:exById(id),part:'warm'}));SHORT[VAR].map(exById).filter(Boolean).forEach(ex=>steps.push({ex,part:'main'}));['c3','c4'].forEach(id=>steps.push({ex:exById(id),part:'cool'}));}
  else{WARM.forEach(ex=>steps.push({ex,part:'warm'}));MAINL().forEach(ex=>steps.push({ex,part:'main'}));COOL.forEach(ex=>steps.push({ex,part:'cool'}));}
  Object.assign(WK,{on:true,who,steps,i:0,log:{},start:Date.now(),d:today(),var:VAR,short:!!short});
  document.body.classList.add('wkon');document.getElementById('wk').hidden=false;wkStep(0);
  try{navigator.wakeLock&&navigator.wakeLock.request('screen').then(l=>WK.lock=l).catch(()=>{});}catch(e){}
  say((short?'Krátky tréning, pätnásť minút.|':'Ideme na to!|')+stepIntro(0,true));}
function wkClose(ask){if(ask&&!confirm('Ukončiť tréning bez uloženia?'))return;paceStop(true);WK.on=false;document.body.classList.remove('tvmode');clearInterval(WK.tid);document.body.classList.remove('wkon');document.getElementById('wk').hidden=true;
  const sv=document.getElementById('wkView');unregisterViews(sv);sv.innerHTML='';try{WK.lock&&WK.lock.release();}catch(e){}}
function wkStep(i,keep){
  if(!keep)clearInterval(WK.tid);paceStop(true);WK.i=i;const st=WK.steps[i];const ex=st.ex;const box=document.getElementById('wk');
  const sv=document.getElementById('wkView');unregisterViews(sv);
  const vi=vIdx(ex,WK.who[0]);const who0=WK.who[0];
  const vs=[[who0,vi]];WK.who.slice(1).forEach(w=>{const x=vIdx(ex,w);if(x!==vi)vs.push([w,x]);});
  sv.innerHTML=`<div class="wkcard${vs.length>1?' two':''}">${vs.map(([w,x])=>`<div class="v3" data-who="${w}" data-vi="${x}"><canvas></canvas><span class="ld">Načítavam…</span>${vs.length>1?`<span class="tag ${w}">${WHO2[w]}</span>`:''}${viewTools(ex)}</div>`).join('')}</div>`;
  registerViews(sv,ex,i);
  const parts=WK.short?{warm:'⚡ Krátky · rozcvička',main:'⚡ Krátky · hlavná časť',cool:'⚡ Krátky · strečing'}:{warm:'Rozcvička',main:'Hlavná časť',cool:'Strečing'};
  document.getElementById('wkHead').innerHTML=`<span>${parts[st.part]} · ${i+1}/${WK.steps.length}</span><b>${ex.n}</b>`;
  document.getElementById('wkProg').style.width=(100*i/WK.steps.length)+'%';
  const per=WK.who.map(w=>{let D=doseOf(ex,w);if(WK.short&&st.part==='main')D=Object.assign({},D,{sets:Math.min(D.sets||1,2),why:[...(D.why||[]),'krátky tréning']});const v=ex.v[vIdx(ex,w)];const L=lastLog(w,ex.id)[0];
    const lastKg=L&&L.s&&L.s.length?L.s[L.s.length-1][1]:'';const mk=String(D.w||'').match(/(\d+(?:[.,]\d+)?)\s*(?:[–-]\s*\d+(?:[.,]\d+)?)?\s*kg/);const defKg=lastKg||(mk?mk[1]:'');
    const repsN=parseInt(D.reps)||'';
    return {w,D,v,defKg:(v.weighted===false||ex.both)?'':defKg,repsN,done:keep&&keep[w]||0};});
  WK.cur={ex,per};
  if(st.part!=='main'){
    const secs=secsOf(ex.both||'');
    document.getElementById('wkBody').innerHTML=`<p class="wkdose">${ex.both||''}</p>
      <div class="wkbtns"><button type="button" class="bk" id="wkBack"${WK.i===0?' disabled':''}>← Späť</button>${secs?`<button type="button" class="big" id="wkT" data-s="${secs}">⏱ Spustiť ${secs} s</button>`:''}<button type="button" class="big go" id="wkNext">Hotovo → ďalej</button></div><ol class="wkhow">${(ex.how||[]).map(h=>`<li>${h}</li>`).join('')}</ol>`;
  }else wkRenderMain();
}
function autoIdx(ex,w){const o=OV[ex.id]&&OV[ex.id][w];if(o==null)return vIdx(ex,w);delete OV[ex.id][w];const a=vIdx(ex,w);OV[ex.id][w]=o;return a;}
function wkKeep(){const k={};(WK.cur&&WK.cur.per||[]).forEach(p=>k[p.w]=p.done);return k;}
function wkLvHTML(){return WK.who.map(w=>`<div class="wklvr"><b class="${w}">${WHO2[w]}</b>${[1,2,3,4].map(l=>`<button type="button" data-wl="${l}" data-w="${w}" class="${LV[w]===l?'on':''}">${l}</button>`).join('')}</div>`).join('')+'<small>Zmena úrovne zruší ručné úpravy cvikov danej osoby.</small>';}
function wkRenderMain(){const {ex,per}=WK.cur;
  document.getElementById('wkBody').innerHTML=per.map(p=>{const s=p.D.sets||1;const all=p.done>=s;
    return `<div class="wkp ${p.w}${all?' fin':''}"><div class="wkph"><b>${WHO2[p.w]}</b> ${ex.v.length>1?`<span class="wkvar"><button type="button" data-wv="-1" data-w="${p.w}" ${vIdx(ex,p.w)<=0?'disabled':''} aria-label="Ľahšie">‹</button><em>${p.v.lab}</em><button type="button" data-wv="1" data-w="${p.w}" ${vIdx(ex,p.w)>=ex.v.length-1?'disabled':''} aria-label="Ťažšie">›</button></span>`:`<span>${p.v.lab}</span>`}</div>
     ${(()=>{const a=autoIdx(ex,p.w),c=vIdx(ex,p.w);return a!==c?`<small class="adj">ručne zmenené · odporúčané: ${ex.v[a].lab}</small>`:'';})()}
     <div class="wkset">${all?'✓ všetky série hotové':`Séria <b>${p.done+1}</b> z ${s} · ${p.D.reps}`}</div>
     ${p.D.why&&p.D.why.length?`<small class="adj">↓ ${p.D.why.join(', ')}</small>`:''}
     <div class="wkin"><label>Opak.<input inputmode="numeric" data-f="r" data-w="${p.w}" value="${p.repsN}"></label>${p.defKg!==''||p.D.w?`<label>kg<input inputmode="decimal" data-f="k" data-w="${p.w}" value="${p.defKg}"></label>`:''}
     <button type="button" class="sd" data-w="${p.w}" ${all?'disabled':''}>✓ Séria hotová</button></div>
     <div class="dots">${Array.from({length:s},(_,k)=>`<i class="${k<p.done?'on':''}"></i>`).join('')}</div>
     ${all?`<div class="rate" data-w="${p.w}">Ako to šlo? <button type="button" data-r="e">😌 Ľahké</button><button type="button" data-r="o">🙂 Akurát</button><button type="button" data-r="h">😮‍💨 Ťažké</button></div>`:''}
     <small class="prog">${progHint(p.w,ex)}</small></div>`;}).join('')+
    `${BR[ex.id]===0||BR[ex.id]===1?`<div class="wkbtns"><button type="button" class="big pace" id="wkPace">🗣 Počítaj so mnou</button></div>`:''}<div class="wkbtns"><button type="button" class="bk" id="wkBack"${WK.i===0?' disabled':''}>← Späť</button><button type="button" class="big go" id="wkNext">${per.every(p=>p.done>=(p.D.sets||1))?'Ďalší cvik →':'Preskočiť cvik →'}</button></div>
    <p class="mute wkt">${(ex.how||[]).slice(0,3).map((h,k)=>(k+1)+'. '+h).join(' ')}</p>${ex.warn?`<p class="warn">${ex.warn}</p>`:''}`;
  const lg=WK.log[ex.id]||{};per.forEach(p=>{if(lg[p.w]&&lg[p.w].r){const b=document.querySelector(`.rate[data-w="${p.w}"] [data-r="${lg[p.w].r}"]`);b&&b.classList.add('on');}});}
function timerRun(secs,label,after){clearInterval(WK.tid);const end=Date.now()+secs*1000;const tb=document.getElementById('wkTimer');tb.hidden=false;let lastS=-1;tb.innerHTML=`<b></b><span>${label}</span><button type="button" id="wkSkip">Preskočiť</button>`;const tbB=tb.querySelector('b');
  say(label+', '+secW(secs)+'.');
  const tick=()=>{const s=Math.max(0,Math.ceil((end-Date.now())/1000));if(s===lastS)return;lastS=s;tbB.textContent=Math.floor(s/60)+':'+pad2(s%60);
    if(s===10&&secs>15)say('Ešte desať sekúnd.');if(s<=3&&s>0)tone(660,0,0.15);
    if(s<=0){clearInterval(WK.tid);tone(880,0,0.3);tone(880,0.35,0.3);tone(1175,0.7,0.45);vib([200,100,200]);tb.hidden=true;after&&after();}};
  WK.tid=setInterval(tick,200);tick();}
document.addEventListener('click',e=>{if(!WK.on){if(e.target.closest('#wkGo'))wkStart();else if(e.target.closest('#wkShort'))wkStart(true);return;}
  const t=e.target;
  if(t.closest('#wkX'))return wkClose(true);
  if(t.closest('#wkBack'))return wkStep(Math.max(0,WK.i-1));
  if(t.closest('#wkPace')){PACE?paceStop():paceStart();return;}
  if(t.closest('#wkTv')){document.body.classList.toggle('tvmode');t.closest('#wkTv').classList.toggle('on');return;}
  if(t.closest('#wkLv')){const b=document.getElementById('wkLvBox');b.hidden=!b.hidden;if(!b.hidden)b.innerHTML=wkLvHTML();return;}
  const wl=t.closest('[data-wl]');if(wl){const w=wl.dataset.w;LV[w]=+wl.dataset.wl;for(const k in OV){if(OV[k])delete OV[k][w];}save();try{build();refreshLog();}catch(_){}
    document.getElementById('wkLvBox').innerHTML=wkLvHTML();wkStep(WK.i,wkKeep());toast(WHO2[w]+': úroveň '+LV[w]);return;}
  const wv=t.closest('[data-wv]');if(wv){const w=wv.dataset.w,ex=WK.cur.ex;const c=vIdx(ex,w);OV[ex.id]=OV[ex.id]||{};OV[ex.id][w]=clamp(c+(+wv.dataset.wv),0,ex.v.length-1);save();try{rerenderCard(ex.id);}catch(_){}
    wkStep(WK.i,wkKeep());return;}
  if(t.closest('#wkVoice')){VOICE=!VOICE;try{localStorage.setItem('tr-voice',VOICE?'1':'0');}catch(_){}t.closest('#wkVoice').textContent=VOICE?'🔊':'🔇';return;}
  if(t.closest('#wkSkip')){clearInterval(WK.tid);document.getElementById('wkTimer').hidden=true;say('Dobre, ideme ďalej.');return;}
  if(t.closest('#wkT')){const s=+t.closest('#wkT').dataset.s;timerRun(s,P2('Drž','Držte'),()=>say('Výborne, hotovo.'));return;}
  if(t.closest('#wkNext')){if(WK.i+1>=WK.steps.length)return wkFinish();wkStep(WK.i+1);say(stepIntro(WK.i));return;}
  const sd=t.closest('.sd');if(sd){const w=sd.dataset.w;const p=WK.cur.per.find(x=>x.w===w);const ex=WK.cur.ex;
    const r=document.querySelector(`.wkin input[data-f=r][data-w="${w}"]`),k=document.querySelector(`.wkin input[data-f=k][data-w="${w}"]`);
    const lg=WK.log[ex.id]=WK.log[ex.id]||{};lg[w]=lg[w]||{s:[],v:p.v.lab};lg[w].s.push([r?r.value:'',k?k.value:'']);
    p.defKg=k?k.value:p.defKg;p.repsN=r?r.value:p.repsN;p.done++;wkRenderMain();
    const s=p.D.sets||1;const allDone=WK.cur.per.every(x=>x.done>=(x.D.sets||1));
    if(allDone)say('Cvik hotový, výborne.|'+P2('Ohodnoť, ako to išlo.','Ohodnoťte, ako to išlo.'));
    else if(p.done<s&&ex.rest)timerRun(ex.rest,'Oddych',()=>say((WK.who.length>1?WHO2[w]+', ':'')+'ďalšia séria. Pripraviť sa.|'+cueOf(ex)));
    else if(p.done>=s)say(WHO2[w]+' má všetky série. Výborne.');
    return;}
  const rb=t.closest('.rate button');if(rb){const w=rb.closest('.rate').dataset.w;const ex=WK.cur.ex;const lg=WK.log[ex.id]=WK.log[ex.id]||{};lg[w]=lg[w]||{s:[]};lg[w].r=rb.dataset.r;
    rb.parentNode.querySelectorAll('button').forEach(b=>b.classList.toggle('on',b===rb));return;}
});
function wkFinish(){clearInterval(WK.tid);const sv=document.getElementById('wkView');unregisterViews(sv);sv.innerHTML='';
  document.getElementById('wkHead').innerHTML='<span>Koniec</span><b>Výborne! Ako sa cíti chrbát a bedro?</b>';document.getElementById('wkProg').style.width='100%';
  const opt=(w,k)=>['bez bolesti','mierna','výrazná'].map((n,v)=>`<label><input type="radio" name="p${w}${k}" value="${v}" ${v===0?'checked':''}> ${n}</label>`).join('');
  document.getElementById('wkBody').innerHTML=WK.who.map(w=>`<div class="wkp ${w}"><b>${WHO2[w]}</b><div class="pain"><span>Chrbát / kríže</span>${opt(w,'b')}</div><div class="pain"><span>Bedro</span>${opt(w,'h')}</div></div>`).join('')+
   `<p class="mute">Myslí sa bolesť počas cvičenia alebo hneď po ňom, nie obyčajná únava svalov.</p><div class="wkbtns"><button type="button" class="big go" id="wkSave">💾 Uložiť tréning</button></div>`;
  say('Výborne, tréning je hotový!|'+P2('Ako sa cíti chrbát a bedro?','Ako sa cítia chrbát a bedrá?'));}
document.addEventListener('click',e=>{if(!e.target.closest('#wkSave'))return;const mins=Math.round((Date.now()-WK.start)/60000);
  const summ=wkSummary();
  WK.who.forEach(w=>{const pain={};pain[w]={b:+(document.querySelector(`input[name=p${w}b]:checked`)||{}).value||0,h:+(document.querySelector(`input[name=p${w}h]:checked`)||{}).value||0};
    const ex={};for(const id in WK.log){if(WK.log[id][w])ex[id]={[w]:WK.log[id][w]};}
    live().filter(x=>x.who===w&&x.d===WK.d&&x.t==='train').forEach(x=>delEntry(x.id));
    addEntry(Object.assign({who:w,d:WK.d,t:'train',var:WK.var,ex,pain,min:mins},WK.short?{short:1}:{}));});
  dbSave();wkClose(false);refreshLog();build();
  calSel=WK.d;showTab('cal');celebrate(mins,summ);});

/* ---------- summary + celebration ---------- */
function wkSummary(){const out={};const mx=s=>{const k=(s||[]).map(q=>parseFloat(String(q[1]||'').replace(',','.'))).filter(n=>!isNaN(n));return k.length?Math.max(...k):null;};
  const rs=s=>(s||[]).map(q=>parseInt(q[0])).filter(n=>!isNaN(n)).reduce((a,b)=>a+b,0);
  WK.who.forEach(w=>{let sets=0,reps=0;const pr=[];for(const id in WK.log){const L=WK.log[id][w];if(!L||!L.s)continue;sets+=L.s.length;reps+=rs(L.s);
      const prev=lastLog(w,id)[0];const ex=exById(id);if(!prev||!ex)continue;const a=mx(prev.s),b=mx(L.s);
      if(a!=null&&b!=null&&b>a)pr.push(`${ex.n}: ${f1(a)} → <b>${f1(b)} kg</b>`);else if(a==null&&b==null&&rs(L.s)>rs(prev.s))pr.push(`${ex.n}: ${rs(prev.s)} → <b>${rs(L.s)} opakovaní</b>`);}
    out[w]={sets,reps,pr};});return out;}
function celebrate(mins,summ){let el=document.getElementById('cele');if(!el){el=document.createElement('div');el.id='cele';document.body.appendChild(el);}
  const n=Object.keys(summ).length;const wk={};Object.keys(summ).forEach(w=>{const m=monday(today());wk[w]=entries(w).filter(x=>x.t==='train'&&x.d>=m).length;});
  const praise=['Výborne!','Skvelá práca!','Super, len tak ďalej!','Paráda!','To je ono!'][Math.floor(Math.random()*5)];
  el.innerHTML=`<canvas></canvas><div class="celc"><div class="celbig">🎉</div><h2>${praise}</h2><p class="mute">Tréning hotový za ${mins} min</p>
   ${Object.entries(summ).map(([w,o])=>`<div class="celp ${w}"><b>${WHO2[w]}</b><div class="celn"><span><i>${o.sets}</i>sérií</span><span><i>${o.reps}</i>opakovaní</span><span><i>${wk[w]}</i>tréning${wk[w]===1?'':wk[w]<5?'y':'ov'} tento týždeň</span></div>${o.pr.length?`<p class="celpr">⭐ Lepšie ako minule:<br>${o.pr.join('<br>')}</p>`:''}</div>`).join('')}
   <button type="button" class="big go" id="celOk">Pokračovať</button></div>`;
  el.hidden=false;say(praise+' Tréning je uložený.');const cv=el.querySelector('canvas');confetti(cv);}
document.addEventListener('click',e=>{if(e.target.closest('#celOk')){const el=document.getElementById('cele');el.hidden=true;el.innerHTML='';}});
function confetti(cv){const c=cv.getContext('2d');const W=cv.width=innerWidth*devicePixelRatio,H=cv.height=innerHeight*devicePixelRatio;const cols=['#d9573b','#1f6f9f','#2f7a3a','#f2b134','#8e5bd6'];
  const P=Array.from({length:160},()=>({x:Math.random()*W,y:-Math.random()*H*0.6,vx:(Math.random()-.5)*3,vy:2+Math.random()*4,r:4+Math.random()*6,a:Math.random()*6,va:(Math.random()-.5)*.3,c:cols[Math.floor(Math.random()*cols.length)]}));
  const t0=performance.now();(function f(t){c.clearRect(0,0,W,H);const k=devicePixelRatio;P.forEach(p=>{p.x+=p.vx*k;p.y+=p.vy*k;p.a+=p.va;c.save();c.translate(p.x,p.y);c.rotate(p.a);c.fillStyle=p.c;c.fillRect(-p.r*k/2,-p.r*k/4,p.r*k,p.r*k/2);c.restore();});
    if(t-t0<4000&&cv.isConnected)requestAnimationFrame(f);else c.clearRect(0,0,W,H);})(t0);}

/* ---------- hlasový tréner: počíta opakovania v tempe ukážky ---------- */
let PACE=null;
function paceStop(silent){if(!PACE)return;clearInterval(PACE.tid);PACE=null;const b=document.getElementById('wkPace');if(b){b.textContent='🗣 Počítaj so mnou';b.classList.remove('on');}if(!silent)say('Stop.');}
function paceStart(){const ex=WK.cur.ex;const V=VIEWS.filter(v=>document.getElementById('wkView').contains(v.el)&&v.an);if(!V.length){toast('Počkaj, kým sa načíta ukážka');return;}
  const target=Math.max(...WK.cur.per.map(p=>parseInt(p.D.reps)||10));V.forEach(v=>{v.clk=-v.phase-1500;});
  const v=V[0];let last='',n=0,done=false;const b=document.getElementById('wkPace');b.classList.add('on');
  say(cueOf(ex)+'|'+P2('Priprav sa.','Pripravte sa.'));
  PACE={tid:setInterval(()=>{const t=v.clk+v.phase;if(t<0)return;const br=breathOf(ex,v.an,t);if(!br||!br.move)return;const key=br.i+':'+Math.floor(t/phaseAt(v.an,t).tot);if(key===last)return;last=key;
    if(br.eff){if(done)return;n++;b.textContent=`⏹ ${n} / ${target}`;say(n>=target?'A posledné… výdych.':(n===target-1?numW(n)+', ešte jedno.':numW(n)+'… výdych'),{fast:1});if(n>=target){done=true;setTimeout(()=>{if(PACE){say('Výborne, séria hotová.|'+P2('Ťukni na Séria hotová.','Ťuknite na Séria hotová.'));paceStop(true);}},2600);}}
    else if(!done)say('nádych',{fast:1});},90)};}
