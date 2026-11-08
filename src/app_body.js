/* =========================================================
   VÁHA A OBVOD PÁSA (DB.body: "who|d" -> {who,d,kg,cm,u})
   ========================================================= */
function bodyList(w){return Object.values(DB.body||{}).filter(x=>x.who===w&&(x.kg!=null||x.cm!=null)).sort((a,b)=>a.d<b.d?-1:1);}
const num=v=>{const n=parseFloat(String(v).replace(',','.'));return isNaN(n)?null:n;};
const f1=n=>n==null?'–':(Math.round(n*10)/10).toString().replace('.',',');
function spark(pts,col,unit){if(pts.length<1)return '<p class="mute">Zatiaľ bez záznamu.</p>';const W=320,H=110,p=14;
  const xs=pts.map(q=>dparse(q.d).getTime()),ys=pts.map(q=>q.v);const x0=Math.min(...xs),x1=Math.max(...xs),y0=Math.min(...ys),y1=Math.max(...ys);
  const X=t=>x1===x0?W/2:p+(W-2*p)*(t-x0)/(x1-x0),Y=v=>y1===y0?H/2:H-p-(H-2*p)*(v-y0)/(y1-y0);
  const P=pts.map((q,i)=>[X(xs[i]),Y(q.v)]);const line=P.map(q=>q.join(',')).join(' ');
  const area=`${P[0][0]},${H-4} ${line} ${P[P.length-1][0]},${H-4}`;
  return `<svg viewBox="0 0 ${W} ${H}" class="spk"><defs><linearGradient id="g${col.slice(1)}${unit}" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="${col}" stop-opacity=".25"/><stop offset="1" stop-color="${col}" stop-opacity="0"/></linearGradient></defs>
    ${P.length>1?`<polygon points="${area}" fill="url(#g${col.slice(1)}${unit})"/><polyline points="${line}" fill="none" stroke="${col}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>`:''}
    ${P.map((q,i)=>`<circle cx="${q[0]}" cy="${q[1]}" r="${i===P.length-1?5:3.5}" fill="${i===P.length-1?col:'#fff'}" stroke="${col}" stroke-width="2"/>`).join('')}
    <text x="${P[P.length-1][0]}" y="${Math.max(12,P[P.length-1][1]-9)}" text-anchor="${P.length>1?'end':'middle'}" class="spkt">${f1(pts[pts.length-1].v)} ${unit}</text></svg>`;}
function bodyDiff(pts,unit){if(pts.length<2)return '';const d=pts[pts.length-1].v-pts[0].v;const c=d<0?'good':d>0?'up':'';return `<span class="bd ${c}">${d>0?'+':''}${f1(d)} ${unit} od ${fmtD(pts[0].d)}</span>`;}
function renderBody(){const el=document.getElementById('bodyBox');if(!el)return;const t=today();
  el.innerHTML=['m','t'].map(w=>{const L=bodyList(w);const kg=L.filter(x=>x.kg!=null).map(x=>({d:x.d,v:x.kg})),cm=L.filter(x=>x.cm!=null).map(x=>({d:x.d,v:x.cm}));
    const cur=(DB.body||{})[w+'|'+t]||{};const col=w==='m'?'#d9573b':'#1f6f9f';const last=L[L.length-1];
    const due=!last||daysBetween(last.d,t)>=7;
    return `<div class="bodyc ${w}"><div class="bch"><b>${WHO2[w]}</b>${due?'<span class="due">⏰ čas na týždenné meranie</span>':`<span class="mute">naposledy ${fmtD(last.d)}</span>`}</div>
      <div class="bin"><label>Váha (kg)<input inputmode="decimal" id="bk-${w}" value="${cur.kg!=null?f1(cur.kg):''}" placeholder="${last&&last.kg!=null?f1(last.kg):'napr. 72,5'}"></label>
      <label>Obvod pása (cm)<input inputmode="decimal" id="bc-${w}" value="${cur.cm!=null?f1(cur.cm):''}" placeholder="${last&&last.cm!=null?f1(last.cm):'napr. 88'}"></label>
      <button type="button" class="bsave" data-bw="${w}">Uložiť dnes</button></div>
      <div class="bgr"><div><small>Váha ${bodyDiff(kg,'kg')}</small>${spark(kg.slice(-26),col,'kg')}</div><div><small>Obvod pása ${bodyDiff(cm,'cm')}</small>${spark(cm.slice(-26),col,'cm')}</div></div></div>`;}).join('')+
    '<p class="mute">Merajte ráno nalačno, raz týždenne, vždy rovnako. Obvod pása v úrovni pupka. Dôležitý je trend za niekoľko týždňov, nie jeden deň.</p>';}
document.addEventListener('click',e=>{const b=e.target.closest('[data-bw]');if(!b)return;const w=b.dataset.bw,t=today();
  const kg=num(document.getElementById('bk-'+w).value),cm=num(document.getElementById('bc-'+w).value);
  if(kg==null&&cm==null){toast('Zadaj váhu alebo obvod pása');return;}
  if(kg!=null&&(kg<30||kg>250)){toast('Skontroluj váhu');return;}if(cm!=null&&(cm<40||cm>200)){toast('Skontroluj obvod pása');return;}
  DB.body=DB.body||{};DB.body[w+'|'+t]={who:w,d:t,kg,cm,u:Date.now()};dbSave();renderBody();toast(`⚖️ Uložené: ${WHO2[w]}${kg!=null?' '+f1(kg)+' kg':''}${cm!=null?' · '+f1(cm)+' cm':''}`);});
