// Offline cache pre tréningový plán. Denník (api.github.com) sa nikdy necachuje.
const C='trening-v3';
const CORE=['./','index.html','avatars.js','manifest.json','icon-192.png','icon-512.png','icon-180.png',
 'https://cdn.jsdelivr.net/npm/three@0.149.0/build/three.min.js'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>Promise.all(CORE.map(u=>c.add(new Request(u,{mode:u.startsWith('http')?'no-cors':'same-origin'})).catch(()=>{})))).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==C).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{
  const r=e.request,u=new URL(r.url);
  if(r.method!=='GET'||u.hostname==='api.github.com')return;
  const page=r.mode==='navigate'||u.pathname.endsWith('/index.html');
  if(page){ // najprv sieť (nová verzia), offline z cache
    e.respondWith(fetch(r).then(res=>{const cp=res.clone();caches.open(C).then(c=>c.put('index.html',cp));return res;}).catch(()=>caches.match('index.html')));
    return;
  }
  e.respondWith(caches.match(r).then(hit=>hit||fetch(r).then(res=>{if(res.ok||res.type==='opaque'){const cp=res.clone();caches.open(C).then(c=>c.put(r,cp));}return res;})));
});
