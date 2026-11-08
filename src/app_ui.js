/* ===== UI, levels, variants, 3D views ===== */
let VAR='home',LV={m:1,t:1},OV={};
function MAINL(){const l=VAR==='home'?HOME:VAR==='fit'?FIT:GYM;const mx=Math.max(LV.m,LV.t);return l.filter(ex=>!ex.minLv||mx>=ex.minLv);}
try{const s=JSON.parse(localStorage.getItem('tp3')||'{}');if(s.VAR)VAR=s.VAR;if(s.LV)LV=s.LV;if(s.OV)OV=s.OV;}catch(e){}
function save(){try{localStorage.setItem('tp3',JSON.stringify({VAR,LV,OV}));}catch(e){}}
const WHO={m:'Mama',t:'Tato'};
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
function vIdx(ex,who){if(ex.v.length<2||!ex.lv)return 0;const o=OV[ex.id]&&OV[ex.id][who];if(o!=null)return clamp(o,0,ex.v.length-1);const a=ex.lv[who];return clamp(a[Math.min(LV[who]-1,a.length-1)],0,ex.v.length-1);}
function seriesWord(n){return n===1?'séria':(n<5?'série':'sérií');}
function doseHTML(ex,who){
  if(ex.both) return null;
  const lvl=LV[who]-1,dl=ex.dose[who];let d=dl[Math.min(lvl,dl.length-1)];if(lvl>=dl.length&&d[0])d=[Math.min(4,d[0]+1)].concat(d.slice(1));const v=ex.v[vIdx(ex,who)];
  const reps=v.r||d[1];let w=(lvl<dl.length&&v.w&&v.w[who]&&v.w[who][lvl])||d[2]||'';if(v.weighted===false)w='';
  const extra=[w,ex.rest?('pauza '+ex.rest+' s'):''].filter(Boolean).join(' · ');
  return `<div class="${who}"><b>${WHO[who]}</b><span class="sets">${d[0]?`${d[0]} ${seriesWord(d[0])} × ${reps}`:reps}</span>${extra?`<small>${extra}</small>`:''}</div>`;
}
function vidHTML(ex,im,it){const L=[];const add=(href,lab)=>{if(href&&!L.some(x=>x[0]===href))L.push([href,lab]);};
  [...new Set([im,it])].forEach(x=>{const v=ex.v[x];if(v&&v.vid)add(v.vid,ex.v.length>1?v.lab:'');});add(ex.vid,'');
  if(!L.length)return '';return '<div class="yts">'+L.map(([h,l])=>`<a class="yt" href="${h}" target="_blank" rel="noopener">▶ Video / návod${l?' – '+l:''}</a>`).join('')+'</div>';}
function cardHTML(ex,i,kind){
  const lev=!!ex.lv||ex.v.length>1;
  const im=vIdx(ex,'m'),it=vIdx(ex,'t');
  let views;
  if(!lev||im===it){const who=i%2?'t':'m';const lab=ex.v.length>1?`Mama aj tato · ${ex.v[im].lab}`:'Mama aj tato rovnako';
    views=[{who,vi:im,tag:lab,cls:''}];}
  else views=[{who:'m',vi:im,tag:`Mama · ${ex.v[im].lab}`,cls:'m'},{who:'t',vi:it,tag:`Tato · ${ex.v[it].lab}`,cls:'t'}];
  const vh=views.map((w,k)=>`<div class="v3" data-k="${k}" data-who="${w.who}" data-vi="${w.vi}"><canvas></canvas><span class="tag ${w.cls}">${w.tag}</span><span class="ld">Načítavam 3D postavu…</span><span class="hint"><span class="h0">👆 ťukni a otoč</span><span class="h1">↔ otáčaj prstom · ťukni = hotovo</span></span><button class="rst" type="button" aria-label="Pôvodný pohľad">↺</button>${viewTools(ex)}</div>`).join('');
  let vrows='';
  if(ex.v.length>1) vrows='<div class="vrows">'+['m','t'].map(w=>{const x=vIdx(ex,w);return `<div class="vrow ${w}"><span class="who">${WHO[w]}</span><button type="button" data-ex="${ex.id}" data-who="${w}" data-d="-1" ${x===0?'disabled':''}>‹ ${ex.nav?ex.nav[0]:'Ľahšie'}</button><span class="vl">${ex.v[x].lab}</span><button type="button" data-ex="${ex.id}" data-who="${w}" data-d="1" ${x===ex.v.length-1?'disabled':''}>${ex.nav?ex.nav[1]:'Ťažšie'} ›</button></div>`;}).join('')+'</div>';
  const notes=[...new Set([im,it])].map(x=>ex.v[x].note?`<li><b>${ex.v[x].lab}:</b> ${ex.v[x].note}</li>`:'').join('');
  const dose=ex.both?`<div class="both"><b>Obaja</b><span class="sets">${ex.both}</span></div>`:doseHTML(ex,'m')+doseHTML(ex,'t');
  return `<div class="ex" id="ex-${ex.id}"><div class="fig"><span class="num">${i+1}</span>${vh}</div>
   <div class="body"><h3>${ex.n}</h3>${vrows}<ol>${ex.how.map(h=>`<li>${h}</li>`).join('')}</ol>
   ${notes?`<ul class="vnote">${notes}</ul>`:''}
   <div class="warn"><b>Pozor:</b> ${ex.warn}</div><div class="dose">${dose}</div>
   ${vidHTML(ex,im,it)}</div></div>`;
}
/* ---------- views ---------- */
const VIEWS=[];let GLR=null,GLok=false,AVready=false;
const DPR=Math.min(window.devicePixelRatio||1,2);
let io=null;
function initIO(){io=new IntersectionObserver(es=>es.forEach(e=>{const v=VIEWS.find(x=>x.el===e.target);if(!v)return;v.visible=e.isIntersecting;if(!v.visible&&v.active)setActive(v,false);}),{rootMargin:'200px 0px'});}
function registerViews(card,ex,i){
  card.querySelectorAll('.v3').forEach(el=>{
    const v={el,ex,who:el.dataset.who,vi:+el.dataset.vi,canvas:el.querySelector('canvas'),yaw:null,pitch:0.2,active:false,visible:false,phase:(i*977)%3000};
    v.ctx=v.canvas.getContext('2d');VIEWS.push(v);if(io)io.observe(el);bindRotate(v);
  });
}
function unregisterViews(card){for(let i=VIEWS.length-1;i>=0;i--){if(card.contains(VIEWS[i].el)){if(io)io.unobserve(VIEWS[i].el);disposeView(VIEWS[i]);VIEWS.splice(i,1);}}}
function disposeView(v){if(!v.scene)return;v.scene.traverse(o=>{if(o.geometry&&!o.isSkinnedMesh)o.geometry.dispose();});v.scene=null;}
function setActive(v,on){VIEWS.forEach(o=>{if(o!==v&&o.active){o.active=false;o.el.classList.remove('active');}});v.active=on;v.el.classList.toggle('active',on);}
function bindRotate(v){
  const el=v.el;let down=null,moved=0;
  el.addEventListener('pointerdown',e=>{if(e.target.closest('.rst'))return;down={x:e.clientX,y:e.clientY};moved=0;if(v.active){try{el.setPointerCapture(e.pointerId);}catch(_){}}});
  el.addEventListener('pointermove',e=>{if(!down)return;const dx=e.clientX-down.x,dy=e.clientY-down.y;moved+=Math.abs(dx)+Math.abs(dy);
    if(v.active){v.yaw=(v.yaw==null?0.45:v.yaw)-dx*0.012;v.pitch=clamp(v.pitch+dy*0.006,-0.05,0.95);down.x=e.clientX;down.y=e.clientY;e.preventDefault();}});
  el.addEventListener('pointerup',e=>{if(e.target.closest('.rst')){v.yaw=v.yaw0;v.pitch=0.2;return;}if(down&&moved<8)setActive(v,!v.active);down=null;});
  el.addEventListener('pointercancel',()=>{down=null;});
}
document.addEventListener('pointerdown',e=>{if(!e.target.closest('.v3'))VIEWS.forEach(v=>{if(v.active)setActive(v,false);});});
function buildView(v){
  const A=AV[v.who];const variant=v.ex.v[v.vi];let an;if(v.bad&&BAD[v.ex.id]){const raw=variant.anim(A.L);raw._L=A.L;badMod(BAD[v.ex.id][0])(raw);an=normalizeAnim(raw,A.L);}else an=animFor(variant.anim,A.L);v.an=an;
  const sc=makeScene();const env=GYM.includes(v.ex)?'gym':FIT.includes(v.ex)?'fit':HOME.includes(v.ex)?'home':VAR;const bb=buildProps(sc,an.props,{env});const inst=makeAvatarInstance(v.who,sc);const D=buildDyn(sc,inst,an.dyn,an.props);
  v.opt={hand:an.hand,curl:an.curl,side:an.side,ground:an.ground,footFloor:an.footFloor,footRelax:an.footRelax,footN:an.footN,footOff:an.footOff};
  const box=bb.clone();
  an.k.forEach(p=>{poseInstance(inst,p,v.opt);updateDyn(D,inst);inst.bones.forEach(b=>box.expandByPoint(b.position));[].concat(...Object.values(D.objs||{})).forEach(o=>{if(o&&o.isObject3D)box.expandByObject(o);});});
  box.max.y+=0.14;box.min.y=Math.min(box.min.y,0);
  v.box=box;v.scene=sc;v.inst=inst;v.dyn=D;v.cam=new THREE.PerspectiveCamera(28,1.5,.05,40);
  v.yaw0=an.yaw!=null?an.yaw:0.45;if(v.yaw==null)v.yaw=v.yaw0;
  v.el.classList.add('ready');if(v.mus)setMuscles(v,true);
}
function camFor(v,aspect){
  const c=v.box.getCenter(v3(0,0,0)),sz=v.box.getSize(v3(0,0,0));
  const fit=Math.max(sz.y,Math.max(sz.x,sz.z*0.6)/aspect)*0.5/Math.tan(14*D2R)*1.06+0.75;
  const cp=Math.cos(v.pitch);v.cam.aspect=aspect;v.cam.updateProjectionMatrix();
  v.cam.position.set(c.x+Math.sin(v.yaw)*cp*fit,c.y+Math.sin(v.pitch)*fit,c.z+Math.cos(v.yaw)*cp*fit);v.cam.lookAt(c);
}
let rr=0;
function renderViews(now){
  const vis=VIEWS.filter(v=>v.visible);if(!vis.length)return;
  let maxW=1,maxH=1;
  for(const v of vis){const w=Math.max(1,Math.round(v.el.clientWidth*DPR)),h=Math.max(1,Math.round(v.el.clientHeight*DPR));
    if(v.canvas.width!==w||v.canvas.height!==h){v.canvas.width=w;v.canvas.height=h;}maxW=Math.max(maxW,w);maxH=Math.max(maxH,h);}
  const gc=GLR.domElement;if(gc.width<maxW||gc.height<maxH)GLR.setSize(Math.max(gc.width,maxW),Math.max(gc.height,maxH),false);
  let built=false;const budget=6;let n=0;
  const order=vis.map((v,i)=>vis[(i+rr)%vis.length]);rr++;
  for(const v of order){
    if(!v.scene){if(built)continue;buildView(v);built=true;}
    if(n++>=budget)break;
    const p=poseAtTime(v.an,now+v.phase);poseInstance(v.inst,p,v.opt);updateDyn(v.dyn,v.inst);
    const w=v.canvas.width,h=v.canvas.height;
    if(v.dual){const y0=v.yaw,p0=v.pitch;GLR.setScissorTest(true);GLR.setViewport(0,0,w,h);GLR.setScissor(0,0,w,h);GLR.clear();
      const R=[];if(h>w*0.9){const hh=Math.floor(h/2);R.push([0,h-hh,w,hh],[0,0,w,h-hh]);}else{const hw=Math.floor(w/2);R.push([0,0,hw,h],[hw,0,w-hw,h]);}
      [[0.08,0.12],[Math.PI/2-0.12,0.12]].forEach(([yw,pt],k)=>{const r=R[k];v.yaw=yw;v.pitch=pt;camFor(v,r[2]/r[3]);GLR.setViewport(r[0],r[1],r[2],r[3]);GLR.setScissor(r[0],r[1],r[2],r[3]);GLR.render(v.scene,v.cam);});
      v.yaw=y0;v.pitch=p0;}
    else{camFor(v,w/h);GLR.setViewport(0,0,w,h);GLR.setScissor(0,0,w,h);GLR.setScissorTest(true);GLR.clear();GLR.render(v.scene,v.cam);}
    v.ctx.clearRect(0,0,w,h);v.ctx.drawImage(gc,0,gc.height-h,w,h,0,0,w,h);
  }
}
/* ---------- SVG fallback (no WebGL) ---------- */
const L0={T:34,TH:24,SH:24,UA:16,FA:16,LEG:48,ARM:32,ankleH:3,hipW:5.5,shW:9.5,hipBack:6,shBack:5.6,kneeR:3,handT:1.5,elbowR:2.2,HD:11};
function svgFrame(v,now){
  if(!v.an2){v.an2=normalizeAnim(v.ex.v[v.vi].anim(L0),L0);}
  const p=poseAtTime(v.an2,now+v.phase),L=L0;
  const hip=[p.x,p.y],sh=[p.x+L.T*Math.sin(p.t*D2R),p.y-L.T*Math.cos(p.t*D2R)],hh=(p.t+(p.h||0))*D2R,head=[sh[0]+11*Math.sin(hh),sh[1]-11*Math.cos(hh)];
  const lg=(r,s)=>limb2(r,s||{a:[0,0]},L.TH,L.SH,-1),am=(r,s)=>limb2(r,s||{a:[3,3]},L.UA,L.FA,1);
  const P=q=>q[0].toFixed(1)+' '+q[1].toFixed(1);
  const seg=(r,l,c,w)=>`<path d="M${P(r)} L${P(l[0])} L${P(l[1])}" stroke="${c}" stroke-width="${w}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
  const C=v.who==='m'?'#2a2b30':'#5f74a0',F='#b9c3cf';
  v.svg.innerHTML=`<rect x="4" y="128" width="192" height="3" fill="#d6cdbd"/>`+seg(hip,lg(hip,p.fl),F,5)+seg(sh,am(sh,p.fa),F,4.5)+`<path d="M${P(hip)} L${P(sh)}" stroke="${C}" stroke-width="8" stroke-linecap="round"/><circle cx="${head[0].toFixed(1)}" cy="${head[1].toFixed(1)}" r="7" fill="#e3ad8a"/>`+seg(hip,lg(hip,p.nl),C,5.5)+seg(sh,am(sh,p.na),'#e3ad8a',5);
}
function frame(now){
  try{
    if(GLok&&AVready)renderViews(now);
    else if(!GLok){for(const v of VIEWS){if(!v.visible)continue;if(!v.svg){v.svg=document.createElementNS('http://www.w3.org/2000/svg','svg');v.svg.setAttribute('viewBox','0 0 200 134');v.el.appendChild(v.svg);v.el.classList.add('ready','flat');}svgFrame(v,now);}}
  }catch(e){console.error(e);}
  requestAnimationFrame(frame);
}
/* ---------- page build ---------- */
function fill(id,list){
  const el=document.getElementById(id);
  [...el.children].forEach(c=>unregisterViews(c));
  el.innerHTML=list.map((ex,i)=>cardHTML(ex,i)).join('');
  [...el.children].forEach((c,i)=>registerViews(c,list[i],i));
}
function rerenderCard(exId){
  const lists={warm:WARM,main:MAINL(),cool:COOL};
  for(const id in lists){const i=lists[id].findIndex(e=>e.id===exId);if(i<0)continue;
    const old=document.getElementById('ex-'+exId);unregisterViews(old);
    const tmp=document.createElement('div');tmp.innerHTML=cardHTML(lists[id][i],i);const nc=tmp.firstElementChild;old.replaceWith(nc);registerViews(nc,lists[id][i],i);}
}
function build(){
  fill('warm',WARM);fill('main',MAINL());fill('cool',COOL);
  document.getElementById('mainTitle').textContent='2. Hlavná časť – '+({home:'doma',gym:'domáca posilňovňa',fit:'fitnescentrum'}[VAR]);
  const lmax=Math.max(LV.m,LV.t);document.getElementById('mainTime').textContent=VAR==='fit'?(lmax===1?'≈ 40–45 min':lmax>=3?'≈ 60–70 min':'≈ 50–60 min'):(lmax===1?'≈ 25–30 min':lmax===4?'≈ 45–55 min':'≈ 35–45 min');
  document.querySelectorAll('#segVar button,#segVar2 button').forEach(b=>b.classList.toggle('on',b.dataset.v===VAR));
  document.querySelectorAll('.lvseg').forEach(g=>g.querySelectorAll('button').forEach(b=>b.classList.toggle('on',+b.dataset.l===LV[g.dataset.who])));
  document.getElementById('lvNote').innerHTML=lvNote();
}
const LVN=['začiatočník','mierne pokročilý','pokročilý','veľmi pokročilý'];
function lvNote(){return `<b>Mama:</b> úroveň ${LV.m} (${LVN[LV.m-1]}) · <b>Tato:</b> úroveň ${LV.t} (${LVN[LV.t-1]}). Úroveň mení verziu cvikov, počet sérií, opakovaní aj váhu; pri ťažších verziách pribudnú pod popisom aj ich vlastné pokyny. Pri každom cviku sa dá ešte prepnúť <b>‹ Ľahšie / Ťažšie ›</b>.`;}
['segVar','segVar2'].forEach(id=>{const g=document.getElementById(id);g&&g.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;VAR=b.dataset.v;save();build();});});
document.querySelectorAll('.lvseg').forEach(g=>g.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const who=g.dataset.who;LV[who]=+b.dataset.l;for(const k in OV){if(OV[k])delete OV[k][who];}save();build();}));
document.addEventListener('click',e=>{const b=e.target.closest('.vrow button');if(!b)return;const ex=[...WARM,...HOME,...GYM,...FIT,...COOL].find(x=>x.id===b.dataset.ex);if(!ex)return;
  const who=b.dataset.who;const cur=vIdx(ex,who);OV[ex.id]=OV[ex.id]||{};OV[ex.id][who]=clamp(cur+(+b.dataset.d),0,ex.v.length-1);save();rerenderCard(ex.id);});
/* timer */
(function(){let end=0,tid=null,ac=null;const tv=document.getElementById('tv'),box=document.getElementById('timer');if(!box)return;const fmt=s=>Math.floor(s/60)+':'+String(s%60).padStart(2,'0');
  function beep(){try{if(!ac)return;[0,0.35,0.7].forEach(t=>{const o=ac.createOscillator(),g=ac.createGain();o.frequency.value=880;o.connect(g);g.connect(ac.destination);g.gain.setValueAtTime(0.25,ac.currentTime+t);g.gain.exponentialRampToValueAtTime(0.001,ac.currentTime+t+0.3);o.start(ac.currentTime+t);o.stop(ac.currentTime+t+0.3);});}catch(e){}}
  function tick(){const s=Math.max(0,Math.ceil((end-Date.now())/1000));tv.textContent=fmt(s);if(s<=0){clearInterval(tid);tid=null;box.classList.remove('done');void box.offsetWidth;box.classList.add('done');beep();}}
  box.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;try{if(!ac)ac=new (window.AudioContext||window.webkitAudioContext)();ac.resume&&ac.resume();}catch(_){}
    if(b.id==='tstop'){clearInterval(tid);tid=null;tv.textContent='0:00';return;}end=Date.now()+(+b.dataset.s)*1000;clearInterval(tid);tid=setInterval(tick,250);tick();});})();
/* ---------- start ---------- */
async function start(){
  initIO();build();requestAnimationFrame(frame);
  try{
    const ls=src=>new Promise((res,rej)=>{const sc=document.createElement('script');sc.src=src;sc.onload=res;sc.onerror=rej;document.head.appendChild(sc);});
    const ls2=async(a,b)=>{try{await ls(a);}catch(e){await ls(b);}};
    if(!window.DecompressionStream&&!window.fflate) await ls2('https://cdn.jsdelivr.net/npm/fflate@0.8.2/umd/index.js','https://unpkg.com/fflate@0.8.2/umd/index.js');
    if(!window.THREE) await ls2('https://cdn.jsdelivr.net/npm/three@0.149.0/build/three.min.js','https://unpkg.com/three@0.149.0/build/three.min.js');
    if(!window.AV_DATA) await ls('avatars.js?v=2');
    if(!window.THREE||!window.AV_DATA) throw new Error('chýba knižnica 3D');
    GLR=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});
    GLR.setPixelRatio(1);GLR.outputEncoding=THREE.sRGBEncoding;GLR.shadowMap.enabled=true;GLR.shadowMap.type=THREE.PCFSoftShadowMap;GLR.setClearColor(0x000000,0);GLR.autoClear=false;
    initLook(GLR);
    GLok=true;
    await loadAvatars();AVready=true;
  }catch(e){console.warn('3D fallback',e);GLok=false;document.body.classList.add('no3d');try{const n=document.createElement('div');n.className='no3dmsg';n.textContent='3D postavy sa nepodarilo načítať ('+(e&&e.message||e&&e.type||e)+') – zobrazujú sa zjednodušené. Skús obnoviť stránku alebo iný prehliadač (Chrome).';document.body.prepend(n);}catch(_){}}
}
