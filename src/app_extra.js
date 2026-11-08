/* ===== 3D extras: muscles, "takto nie" (bad form), two views ===== */
const MUS_LAB={quads:'predná strana stehien',hams:'zadná strana stehien',glutes:'zadok',hipside:'bok bedra (stredný sedací)',calves:'lýtka',core:'brucho',back:'drieky',upper:'stred chrbta a lopatky',lats:'široký chrbtový',chest:'hrudník',shoulders:'ramená',arms:'paže'};
const MUS={h1:['quads','glutes','core'],h2:['glutes','hams','core'],h3:['chest','shoulders','arms','core'],h4:['upper','lats','arms'],h5:['quads','glutes','hipside'],h6:['hipside','glutes'],h7:['back','glutes','core','upper'],h8:['core'],h9:['core','shoulders','glutes'],
 g1:['quads','glutes','core'],g2:['hams','glutes','back'],g3:['chest','shoulders','arms'],g4:['lats','upper','arms'],g5:['quads','glutes','hipside'],g6:['glutes','hams'],g7:['hipside','glutes'],g8:['lats','upper','arms','core'],g9:['core','upper','arms','hipside'],
 f1:['quads','glutes'],f2:['lats','upper','arms'],f3:['chest','shoulders','arms'],f4:['upper','lats','arms'],f5:['hams','glutes','back'],f5b:['quads','glutes','hipside'],f6:['hams'],f6b:['quads'],f7:['hipside','glutes'],f8:['back','glutes','hams'],f9:['core'],f10:['quads','glutes','calves']};
const LEGS=new Set(['h1','h2','h5','h6','g1','g2','g5','g6','g7','f1','f5','f5b','f6','f6b','f7','f8']);
const BACKHIP=new Set(['h1','h5','g1','g2','g5','g6','f1','f5','f5b','f8','g8']);
/* bad-form demos: modify keyframes of the current variant */
function badMod(kind){return an=>{const L=an._L;an.k=an.k.map((p,i)=>{const q=JSON.parse(JSON.stringify(p));const deep=i>0||an.k.length===1;
  if(kind==='round'){q.c=(q.c||0)+(deep?-34:-10);q.h=(q.h||0)+(deep?20:6);}
  else if(kind==='kneesIn'){['nl','fl'].forEach(s=>{if(q[s]&&deep){q[s]=Object.assign({},q[s],{spK:-2.6});}});q.t=(q.t||0)+(deep?14:0);}
  else if(kind==='sag'){const sh=[q.x+L.T*Math.sin(dg(q.t)),q.y-L.T*Math.cos(dg(q.t))];q.y+=4.5;q.t=180-angOf([sh[0]-q.x,sh[1]-q.y]);q.c=(q.c||0)+12;q.h=(q.h||0)+14;}
  else if(kind==='arch'){if(deep){q.c=(q.c||0)+26;q.h=(q.h||0)-10;}}
  else if(kind==='lean'){if(deep){q.t=(q.t||0)+24;q.c=(q.c||0)-14;}}
  else if(kind==='leanBack'){q.t=(q.t||0)-22;q.h=(q.h||0)+6;}
  else if(kind==='shrug'){q.c=(q.c||0)-18;q.h=(q.h||0)+12;}
  return q;});return an;};}
/* breathing: 1 = výdych pri prechode k0→k1 (námaha), 0 = výdych pri návrate k1→k0, 'h' = výdrž (dýchaj plynulo) */
const BR={h1:0,h2:1,h3:0,h4:1,h5:0,h6:1,h7:1,h8:1,h9:'h',g1:0,g2:0,g3:0,g4:1,g5:0,g6:1,g7:1,g8:1,g9:'h',
 f1:1,f2:1,f3:1,f4:1,f5:0,f5b:0,f6:1,f6b:1,f7:1,f8:0,f9:1,f10:'w'};
const BRT={h1:'Nádych pri ceste dole, výdych pri vstávaní.',g1:'Nádych dole, výdych pri vstávaní.',h2:'Výdych pri dvíhaní panvy, nádych pri spúšťaní.',g6:'Výdych hore, nádych dole.',
 h3:'Nádych pri priblížení k opore, výdych pri odtlačení.',g3:'Nádych pri spúšťaní činiek, výdych pri tlaku hore.',h4:'Výdych pri ťahu k telu, nádych pri povolení.',g4:'Výdych pri ťahu, nádych pri spúšťaní.',
 h5:'Nádych pri kroku dozadu a klesaní, výdych pri návrate hore.',g5:'Nádych dole, výdych hore.',f5b:'Nádych dole, výdych hore.',h6:'Výdych pri dvíhaní nohy, nádych pri spúšťaní.',g7:'Výdych pri dvíhaní nohy, nádych dole.',
 h7:'Výdych pri vystieraní ruky a nohy, nádych pri návrate.',h8:'Výdych pri vystieraní, nádych pri návrate – driek stále pri zemi.',h9:'Dýchaj plynulo, nezadržiavaj dych.',g9:'Dýchaj plynulo, brucho spevnené.',
 g2:'Nádych pri predklone, výdych pri vzpriamení.',f5:'Nádych pri predklone, výdych pri vzpriamení.',g8:'Výdych pri ťahu hore, nádych pri spúšťaní.',
 f1:'Výdych pri tlaku nohami, nádych pri pokrčení.',f2:'Výdych pri ťahu dole, nádych pri púšťaní hore.',f3:'Výdych pri tlaku, nádych pri návrate.',f4:'Výdych pri ťahu, nádych pri povolení.',
 f6:'Výdych pri pokrčení, nádych pri návrate.',f6b:'Výdych pri vystretí nôh, nádych pri spúšťaní.',f7:'Výdych pri roztiahnutí, nádych pri návrate.',f8:'Nádych pri predklone, výdych pri vzpriamení.',
 f9:'Výdych pri vytlačení rúk, nádych pri návrate.',f10:'Dýchaj tak, aby si vedel rozprávať.'};
function breathOf(ex,an,t){const b=BR[ex.id];if(b==null)return WARM.includes(ex)||COOL.includes(ex)?{k:'calm'}:null;if(b==='h'||b==='w')return {k:'calm'};
  const ph=phaseAt(an,t);const eff=b===1?ph.i%2===0:ph.i%2===1;return {k:ph.move?(eff?'out':'in'):'pause',eff,i:ph.i,move:ph.move};}
const BRL={out:'⬆ Výdych – námaha',in:'⬇ Nádych',calm:'🫁 Dýchaj pokojne'};
const BADZ={kneesIn:['knees'],round:['back','upper'],arch:['back'],sag:['core','back'],shrug:['upper','shoulders'],leanBack:['back','upper']};
const BAD={h1:['kneesIn','kolená padajú dovnútra a päty sa dvíhajú'],g1:['kneesIn','kolená padajú dovnútra'],h5:['kneesIn','predné koleno padá dovnútra, trup sa hrbí'],g5:['kneesIn','predné koleno padá dovnútra'],f5b:['kneesIn','predné koleno padá dovnútra'],
 g2:['round','okrúhly chrbát – najčastejšia chyba, ktorá zaťažuje platničky'],f5:['round','okrúhly chrbát – zaťažuje platničky'],h4:['shrug','zhrbené plecia ťahané k ušiam'],g4:['round','okrúhly chrbát a ťahanie rukou namiesto lopatky'],f4:['round','hrbenie a kývanie trupom'],
 h3:['sag','prepadnuté boky a hlava dole'],h9:['sag','prepadnuté boky (prehnutý driek)'],h2:['arch','prehnutý driek – boky príliš vysoko'],g6:['arch','prehnutý driek namiesto stlačenia zadku'],f8:['arch','záklon za priamku – preťaženie driekov'],f2:['leanBack','zakláňanie a ťahanie trupom']};
/* --- muscle overlay --- */
function musWeights(A,mesh,keys,col){col=col||[0.85,0.16,0.08];
  const ck=mesh.name+':'+keys.join(',')+':'+col.join(',');A._mw=A._mw||{};if(A._mw[ck])return A._mw[ck];
  const g=mesh.geo,P=g.attributes.position,N=g.attributes.normal,SI=g.attributes.skinIndex,SW=g.attributes.skinWeight,n=P.count;
  const hipY=A.hipC.y,shY=A.shC.y;const nm=A.names;const out=new Float32Array(n*3);
  const bw=(i,test)=>{let w=0;for(let k=0;k<4;k++){const b=nm[SI.getComponent?SI.getComponent(i,k):SI.array[4*i+k]];if(test(b))w+=SW.getComponent?SW.getComponent(i,k):SW.array[4*i+k]/255;}return w;};
  const has=s=>b=>b&&b.indexOf(s)===0;
  const sm=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
  for(let i=0;i<n;i++){const y=P.getY(i),z=Math.abs(P.getZ(i)),nx=N.getX(i),nz=Math.abs(N.getZ(i));let s=0;
    const th=bw(i,has('thigh')),sp=bw(i,b=>/^spine0[45]|pelvis/.test(b)),spU=bw(i,b=>/^spine0[123]|clavicle/.test(b)),arm=bw(i,b=>/upperarm|forearm/.test(b)),shd=bw(i,b=>/^shoulder|^upperarm/.test(b)),shin=bw(i,has('shin'));
    for(const k of keys){let v=0;
      if(k==='quads')v=th*sm(0,0.35,nx)*sm(hipY+0.05,hipY-0.02,y);
      else if(k==='hams')v=th*sm(0,-0.35,nx)*sm(hipY-0.12,hipY-0.2,y);
      else if(k==='glutes')v=(th+sp)*sm(-0.1,-0.5,nx)*sm(hipY-0.2,hipY-0.12,y)*sm(hipY+0.12,hipY+0.04,y);
      else if(k==='hipside')v=(th+sp)*sm(0.45,0.85,nz)*sm(hipY-0.16,hipY-0.06,y)*sm(hipY+0.12,hipY+0.04,y);
      else if(k==='calves')v=shin*sm(0,-0.4,nx);
      else if(k==='core')v=(sp+spU*0.6)*sm(0.15,0.55,nx)*sm(hipY,hipY+0.06,y)*sm(shY-0.16,shY-0.24,y);
      else if(k==='back')v=(sp+spU)*sm(-0.15,-0.55,nx)*sm(hipY+0.02,hipY+0.08,y)*sm(hipY+0.3,hipY+0.22,y)*sm(0.1,0.05,z);
      else if(k==='upper')v=(spU+shd*0.5)*sm(-0.15,-0.5,nx)*sm(shY-0.26,shY-0.18,y)*sm(0.16,0.1,z);
      else if(k==='lats')v=(spU+sp*0.5)*sm(-0.05,-0.4,nx)*sm(0.05,0.1,z)*sm(hipY+0.12,hipY+0.2,y)*sm(shY-0.02,shY-0.1,y);
      else if(k==='chest')v=(spU+shd*0.4)*sm(0.25,0.6,nx)*sm(shY-0.24,shY-0.16,y)*sm(shY+0.02,shY-0.04,y);
      else if(k==='shoulders')v=shd*sm(shY-0.14,shY-0.06,y);
      else if(k==='arms')v=arm*sm(shY-0.06,shY-0.14,y);
      else if(k==='knees'){const kn=hipY*0.5;v=(th+shin)*sm(kn-0.12,kn-0.05,y)*sm(kn+0.12,kn+0.05,y);}
      s=Math.max(s,Math.min(1,v*1.25));}
    out[3*i]=s*col[0];out[3*i+1]=s*col[1];out[3*i+2]=s*col[2];}
  A._mw[ck]=out;return out;}
function addOverlay(inst,keys,col){const out=[];
  inst.meshes.forEach((sm,j)=>{const src=inst.A.meshes.filter(m=>m.name!=='shoes'&&m.name!=='socks')[j];if(!src||!/skin|top|bottom/.test(src.name))return;
    const g0=src.geo,g=new THREE.BufferGeometry();['position','normal','uv','skinIndex','skinWeight'].forEach(a=>g.setAttribute(a,g0.attributes[a]));g.setIndex(g0.index);
    g.setAttribute('color',new THREE.BufferAttribute(musWeights(inst.A,src,keys,col),3));
    const mat=new THREE.MeshBasicMaterial({vertexColors:true,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-2});
    if(sm.material.alphaMap){mat.alphaMap=sm.material.alphaMap;mat.alphaTest=.5;}
    const o=new THREE.SkinnedMesh(g,mat);o.frustumCulled=false;o.renderOrder=3;inst.g.add(o);o.bind(sm.skeleton,sm.bindMatrix);out.push(o);});return out;}
function setMuscles(v,on){const inst=v.inst;if(!inst)return;const keys=MUS[v.ex.id]||[];
  if(on&&!inst.mus&&keys.length)inst.mus=addOverlay(inst,keys);
  if(inst.mus)inst.mus.forEach(o=>o.visible=on);}
/* toolbar inside each 3D view */
function viewTools(ex){const b=BAD[ex.id];return `<div class="vbr"></div><span class="lbl-ok">✅ Správne</span><span class="lbl-bad">❌ Takto nie</span><div class="vtools"><button type="button" data-t="dual" title="Zboku a spredu">⇆ 2 pohľady</button><button type="button" data-t="slow" title="Spomaliť ukážku">🐢 Pomaly</button>${MUS[ex.id]?'<button type="button" data-t="mus">💪 Svaly</button>':''}${b?'<button type="button" data-t="bad" class="bt">⚠ Takto nie</button>':''}</div><div class="vinfo"></div>`;}
document.addEventListener('click',e=>{const b=e.target.closest('.vtools button');if(!b)return;e.stopPropagation();
  const el=b.closest('.v3');const v=VIEWS.find(x=>x.el===el);if(!v)return;const t=b.dataset.t;
  if(t==='dual'){v.dual=!v.dual;b.classList.toggle('on',v.dual);}
  else if(t==='slow'){v.slow=!v.slow;b.classList.toggle('on',v.slow);}
  else if(t==='mus'){v.mus=!v.mus;b.classList.toggle('on',v.mus);setMuscles(v,v.mus);
    el.querySelector('.vinfo').innerHTML=v.mus?'Pracuje: '+(MUS[v.ex.id]||[]).map(k=>MUS_LAB[k]).join(', '):'';}
  else if(t==='bad'){v.bad=!v.bad;b.classList.toggle('on',v.bad);el.classList.toggle('isbad',v.bad);
    el.querySelector('.vinfo').innerHTML=v.bad?'<b>❌ Chyba:</b> '+BAD[v.ex.id][1]+' <span class="mute">(vľavo správne, vpravo chyba – červená ukazuje kde)</span>':'';disposeView(v);v.inst=null;if(v.mus){v.mus=false;el.querySelector('[data-t=mus]')&&el.querySelector('[data-t=mus]').classList.remove('on');}}
},true);
document.addEventListener('pointerup',e=>{if(e.target.closest('.vtools'))e.stopPropagation();},true);
document.addEventListener('pointerdown',e=>{if(e.target.closest('.vtools'))e.stopPropagation();},true);
