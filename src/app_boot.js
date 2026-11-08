/* boot */
try{pullCfg();}catch(e){}
(function(){const q=document.getElementById('qDate');if(q)q.value=today();})();
(function(){const q=document.getElementById('qbtns');if(q)q.innerHTML=qaBtns();})();
renderSync();refreshLog();start();syncSoon(400);
if('serviceWorker' in navigator&&location.protocol==='https:'&&/github\.io$/.test(location.hostname)){navigator.serviceWorker.register('sw.js').catch(()=>{});}
