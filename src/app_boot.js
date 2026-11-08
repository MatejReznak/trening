/* boot */
try{pullCfg();}catch(e){}
function showTab(t){document.querySelectorAll('section.tab').forEach(x=>x.hidden=x.id!=='tab-'+t);document.querySelectorAll('#tabs button').forEach(b=>b.classList.toggle('on',b.dataset.tab===t));document.body.dataset.tab=t;window.scrollTo(0,0);if(t==='cal')renderCal();}
document.getElementById('tabs').addEventListener('click',e=>{const b=e.target.closest('[data-tab]');if(b)showTab(b.dataset.tab);});
document.body.dataset.tab='cal';
renderSync();refreshLog();start();syncSoon(400);
if('serviceWorker' in navigator&&location.protocol==='https:'&&/github\.io$/.test(location.hostname)){navigator.serviceWorker.register('sw.js').catch(()=>{});}
