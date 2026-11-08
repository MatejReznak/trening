/* =========================================================
   PRIPOMIENKY (Web Push cez GitHub Actions v repozitári denníka)
   ========================================================= */
const vapidPub=()=>DB.vapid&&DB.vapid.pub;
const DEV=(()=>{try{let d=localStorage.getItem('tr-dev');if(!d){d=uid();localStorage.setItem('tr-dev',d);}return d;}catch(e){return 'x';}})();
const b64u=s=>{const p='='.repeat((4-s.length%4)%4);const r=atob((s+p).replace(/-/g,'+').replace(/_/g,'/'));return Uint8Array.from([...r].map(c=>c.charCodeAt(0)));};
const isStandalone=()=>matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
const pushOK=()=>'serviceWorker' in navigator&&'PushManager' in window&&'Notification' in window;
function myPush(){return (DB.push||{})[DEV];}
function renderPush(){const el=document.getElementById('pushBox');if(!el)return;const P=myPush();const on=P&&!P.off&&Notification&&Notification.permission==='granted';
  const hours=Array.from({length:17},(_,i)=>i+5);const h=P?P.hour:17;const who=P?P.who:(SC.me?[SC.me]:['m','t']);
  let note='';
  if(!pushOK())note=isStandalone()?'Toto zariadenie upozornenia nepodporuje (treba iPadOS / iOS 16.4 alebo novší).':'Najprv si aplikáciu pridaj na plochu (Safari → Zdieľať → Pridať na plochu) a otvor ju odtiaľ – potom sa dajú zapnúť upozornenia.';
  else if(!SC.token)note='Pripomienky posiela GitHub – najprv nižšie pripoj ukladanie (token).';
  if(!vapidPub()){el.innerHTML=`<p>🔧 <b>Jednorazové nastavenie</b> (stačí raz, na jednom zariadení, s pripojeným ukladaním):</p>
   <ol class="tight"><li>Ťukni na <b>Vytvoriť kľúče</b>.</li><li>Skopíruj zobrazený <b>súkromný kľúč</b>.</li><li>Na GitHube otvor repozitár <b>trening-data</b> → Settings → Secrets and variables → Actions → <b>New repository secret</b>, názov <code>VAPID_PRIVATE</code>, hodnota = skopírovaný kľúč → Add secret.</li></ol>
   <div class="row"><button type="button" id="pGen" ${SC.token?'':'disabled'}>🔑 Vytvoriť kľúče</button></div>${SC.token?'':'<p class="warn">Najprv nižšie pripoj ukladanie (token).</p>'}<div id="pKey"></div>`;return;}
  el.innerHTML=`<p>${on?'🔔 Pripomienky sú <b>zapnuté</b> na tomto zariadení.':'🔕 Pripomienky sú vypnuté.'} V odporúčaný deň príde upozornenie „Dnes je vhodný deň na tréning“.</p>
   <div class="prow"><label>O koľkej: <select id="pHour">${hours.map(x=>`<option value="${x}"${x==h?' selected':''}>${x}:00</option>`).join('')}</select></label>
   <label><input type="checkbox" id="pM"${who.includes('m')?' checked':''}> Mama</label><label><input type="checkbox" id="pT"${who.includes('t')?' checked':''}> Tato</label></div>
   ${note?`<p class="warn">${note}</p>`:''}
   <div class="row">${on?'<button type="button" id="pSave">💾 Uložiť zmenu</button><button type="button" id="pOff">Vypnúť</button><button type="button" id="pTest">Skúšobné upozornenie</button>':`<button type="button" id="pOn" ${!pushOK()||!SC.token?'disabled':''}>🔔 Zapnúť pripomienky</button>`}</div>
   <p class="mute">Upozornenie príde v zvolenú hodinu (môže sa oneskoriť o pár minút). Ak v ten deň už tréning zapísaný je, nepríde.</p>`;}
function pushPrefs(){return {hour:+document.getElementById('pHour').value,who:['m','t'].filter(w=>document.getElementById(w==='m'?'pM':'pT').checked)};}
async function pushOn(){try{const perm=await Notification.requestPermission();if(perm!=='granted'){toast('Upozornenia neboli povolené');return;}
  const reg=await navigator.serviceWorker.ready;let sub=await reg.pushManager.getSubscription();if(!sub)sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:b64u(vapidPub())});
  DB.push=DB.push||{};DB.push[DEV]=Object.assign({sub:sub.toJSON(),dev:navigator.userAgent.slice(0,80),u:Date.now()},pushPrefs());dbSave();renderPush();toast('🔔 Pripomienky zapnuté');}
  catch(e){toast('Nepodarilo sa zapnúť: '+(e.message||e));}}
document.addEventListener('click',async e=>{const id=e.target.id;
  if(id==='pOn')pushOn();
  else if(id==='pSave'){Object.assign(DB.push[DEV],pushPrefs(),{u:Date.now()});dbSave();renderPush();toast('💾 Uložené');}
  else if(id==='pOff'){DB.push[DEV]=Object.assign(DB.push[DEV]||{},{off:true,sub:null,u:Date.now()});dbSave();try{const r=await navigator.serviceWorker.ready;const s=await r.pushManager.getSubscription();s&&s.unsubscribe();}catch(_){}renderPush();toast('🔕 Vypnuté');}
  else if(id==='pTest'){try{const r=await navigator.serviceWorker.ready;r.showNotification('💪 Tréning',{body:'Takto bude vyzerať pripomienka.',icon:'icon-192.png'});}catch(_){toast('Nepodarilo sa');}}});

const b64uEnc=u8=>btoa(String.fromCharCode(...u8)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
document.addEventListener('click',async e=>{if(e.target.id==='pCopy'){const t=document.getElementById('pPriv');t.select();try{await navigator.clipboard.writeText(t.value);}catch(_){document.execCommand('copy');}toast('📋 Skopírované');return;}
  if(e.target.id!=='pGen')return;
  try{const kp=await crypto.subtle.generateKey({name:'ECDSA',namedCurve:'P-256'},true,['sign','verify']);const j=await crypto.subtle.exportKey('jwk',kp.privateKey);
    const pub=b64uEnc(new Uint8Array([4,...b64u(j.x),...b64u(j.y)]));DB.vapid={pub,u:Date.now()};dbSave();
    document.getElementById('pKey').innerHTML=`<p><b>Súkromný kľúč</b> (vlož ho do GitHub tajomstva <code>VAPID_PRIVATE</code>, nikam inam ho neposielaj):</p><textarea id="pPriv" readonly rows="2" style="width:100%;font:14px monospace">${j.d}</textarea><div class="row"><button type="button" id="pCopy">📋 Kopírovať</button><button type="button" id="pDone">Hotovo, kľúč je na GitHube</button></div>`;}
  catch(err){toast('Nepodarilo sa: '+err.message);}});
document.addEventListener('click',e=>{if(e.target.id==='pDone')renderPush();});
