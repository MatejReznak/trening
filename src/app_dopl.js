/* ===== Doplnkové cvičenia (nepovinné) ===== */
const DX=(id,n,anim,how,warn,both,o)=>Object.assign({id,n,v:[V('',anim)],how,warn,both},o||{});
const cl=(id,o)=>{const e=exById(id);const x=Object.assign({},e,{id:'x'+id},o||{});if(BR[id]!==undefined)BR[x.id]=BR[id];if(BRT[id])BRT[x.id]=BRT[id];if(typeof BAD!=='undefined'&&BAD[id])BAD[x.id]=BAD[id];return x;};
const TT={who:'t',tag:'Tato · pravá ruka',nav:['Ľahšie','Ťažšie']};const LV3={m:[0],t:[0]};
const DOPL=[
 {id:'elb',ico:'💪',n:'Lakeť – tenisový lakeť',sub:'Pre tata, pravá ruka',
  freq:'Strečing a výdrž <b>každý deň</b> (pokojne 2× denne). Cviky s jednoručkou <b>1× denne alebo obdeň</b>. Celé to trvá asi 10 minút.',
  info:`<div class="box" style="border-left:5px solid var(--tato)"><h3 style="color:var(--tato)">Ako postupne pridávať záťaž</h3>
   <ol class="tight"><li><b>Týždeň 1–3 – upokojiť a rozhýbať:</b> cviky 1, 2 a 6. Bez činky.</li>
   <li><b>Týždeň 3–8 – posilniť šľachu:</b> pridaj cviky 3 a 5. Začni s <b>0,5–1 kg</b> (stačí aj pollitrová fľaša s vodou).</li>
   <li><b>Od 6.–8. týždňa – sila:</b> pridaj cvik 4. Až potom sa postupne vracaj k zhybom a ťažkému veslovaniu.</li></ol>
   <p><b>Úrovne 1–3:</b> pri každom cviku si tlačidlami Ľahšie / Ťažšie nastavíš úroveň – ukáže sa odporúčaná váha a počet opakovaní.</p>
   <p><b>Kedy pridať váhu:</b> keď zvládneš 3× 15 opakovaní dva tréningy po sebe a bolesť je najviac 3 z 10, prejdi o úroveň vyššie (alebo pridaj <b>0,5 kg</b>).</p>
   <p><b>Pravidlo bolesti:</b> pri cvičení najviac <b>4 z 10</b> a do 24–48 hodín sa má lakeť upokojiť na pôvodnú úroveň. Ak nie, uber váhu alebo opakovania, prípadne sa vráť o fázu späť.</p>
   <p><b>Popri tom:</b> ťažké veci dvíhaj dlaňou nahor, pri práci s náradím a myšou rob prestávky. V hlavnom tréningu zatiaľ voľ ľahšie verzie veslovania a zhybov.</p>
   <p class="mute">Zlepšenie býva cítiť po 6–8 týždňoch pravidelného cvičenia. K lekárovi alebo fyzioterapeutovi choď, ak lakeť bolí aj v pokoji alebo v noci, opuchne, ruka slabne alebo tŕpne, alebo sa to do 8 týždňov nelepší.</p></div>`,
  ex:[
   DX('e1','Strečing vystieračov zápästia',ANIM.elbStretch,['Pravú ruku vystri pred seba, dlaň smeruje dole.','Ľavou rukou jemne ohni pravé zápästie tak, aby prsty smerovali k zemi.','Ťah cítiš na vrchnej strane predlaktia. Drž a voľne dýchaj.'],'Len príjemný ťah, žiadna ostrá bolesť v lakti.','3× 30 s · fáza 1',TT),
   DX('e2','Izometrická výdrž zápästia',ANIM.elbIso,['Lakeť pri tele, predlaktie vodorovne, dlaň dole, ruka v päsť.','Ľavú ruku polož zhora na pravú.','Pravým zápästím tlač nahor, ľavá ruka nepustí – nič sa nehýbe.'],'Bolesť najviac 4 z 10.','',Object.assign({lv:LV3,v:[V('Úroveň 1',ANIM.elbIso,{dose:'5× 30 s · tlač na polovicu sily'}),V('Úroveň 2',ANIM.elbIso,{dose:'5× 45 s · tlač na polovicu sily'}),V('Úroveň 3',ANIM.elbIso,{dose:'5× 45 s · tlač asi na ¾ sily'})]},TT)),
   DX('e3','Pomalé spúšťanie zápästia s jednoručkou',ANIM.elbEcc,['Sadni si a predkloň sa. Pravé predlaktie polož na pravé stehno, zápästie presahuje koleno, dlaň dole.','Ľavou rukou pomôž zdvihnúť činku hore.','Ľavú ruku daj preč a pravá sama spúšťa činku dole 4–5 sekúnd.'],'Hore si vždy pomôž druhou rukou – pracuje len spúšťanie. Rovnako sa to dá s predlaktím na stole.','',Object.assign({lv:LV3,v:[V('Úroveň 1 · 0,5–1 kg',ANIM.elbEcc,{dose:'3× 10 · 0,5–1 kg (aj fľaša s vodou) · od 3. týždňa'}),V('Úroveň 2 · 1,5–2 kg',ANIM.elbEcc,{dose:'3× 12 · 1,5–2 kg'}),V('Úroveň 3 · 3–4 kg',ANIM.elbEcc,{dose:'3× 15 · 3–4 kg'})]},TT)),
   DX('e4','Zdvih zápästia s jednoručkou',ANIM.elbExt,['Rovnaká poloha: sed, predlaktie na stehne, dlaň dole.','Zdvihni zápästie pomaly hore (2 s).','Pomaly spúšťaj dole (3 s). Ľavá ruka už nepomáha.'],'Pridaj až keď pomalé spúšťanie ide ľahko a bez bolesti.','',Object.assign({lv:LV3,v:[V('Úroveň 1 · 1 kg',ANIM.elbExt,{dose:'3× 10 · 1 kg · od 6.–8. týždňa'}),V('Úroveň 2 · 2 kg',ANIM.elbExt,{dose:'3× 12 · 2 kg'}),V('Úroveň 3 · 3–4 kg',ANIM.elbExt,{dose:'3× 12 · 3–4 kg'})]},TT)),
   DX('e5','Rotácie predlaktia',ANIM.elbRot,['Sed, predlaktie na stehne, jednoručku drž v pästi.','Pomaly otoč dlaň nahor.','Pomaly otoč dlaň nadol. Lakeť a predlaktie ostávajú ležať.'],'Ťažšie je to, keď činku chytíš za jeden koniec ako kladivo – začni ľahko.','',Object.assign({lv:LV3,v:[V('Úroveň 1 · 0,5–1 kg',ANIM.elbRot,{dose:'2× 10 · 0,5–1 kg · od 3. týždňa'}),V('Úroveň 2 · 1,5–2 kg',ANIM.elbRot,{dose:'3× 12 · 1,5–2 kg'}),V('Úroveň 3 · 3 kg',ANIM.elbRot,{dose:'3× 15 · 3 kg alebo úchop za koniec činky'})]},TT)),
   DX('e6','Stisk loptičky',ANIM.elbGrip,['Do dlane vezmi mäkkú loptičku alebo zrolovaný uterák.','Stlač a drž 5 sekúnd.','Pomaly povoľ.'],'Stláčaj len do sily, ktorá nebolí.','',Object.assign({lv:LV3,v:[V('Úroveň 1',ANIM.elbGrip,{dose:'3× 10 · mäkká loptička alebo uterák, stisk 5 s'}),V('Úroveň 2',ANIM.elbGrip,{dose:'3× 12 · tvrdšia loptička, stisk 5 s'}),V('Úroveň 3',ANIM.elbGrip,{dose:'3× 15 · posilňovač stisku, stisk 5 s'})]},TT))]},
 {id:'sm',ico:'🧵',n:'SM systém s lanom',sub:'Mama aj tato',
  freq:'Ideálne <b>každý deň 5–10 minút</b>, pokojne aj ako rozcvička pred tréningom. Každý cvik 10–15 pomalých opakovaní.',
  info:`<div class="note">Lano je uviazané o nohu stola asi vo výške kolien. Stojte na podložke, chodidlá na šírku bokov, kolená mierne povolené, brucho ľahko zatiahnuté. Pohyb vedie lopatka, ruka sa vracia pomaly. Ak chcete istotu v rovnováhe, postavte sa pri tyč. Presnú techniku a výber cvikov nechajte na vašu inštruktorku – toto je pripomienka základných ťahov.</div>`,
  ex:[
   DX('s1','Ťah oboch rúk vzad',ANIM.smBack,['Postav sa čelom k stolu, lano drž v oboch rukách, ruky pred telom.','S výdychom ťahaj obe ruky popri tele dozadu a dole, lopatky k sebe a dole.','Pomaly vráť ruky dopredu.'],'Neprehýbaj sa v krížoch a nedvíhaj ramená k ušiam.','10–15×'),
   DX('s2','Ťah jednej ruky vzad',ANIM.smBackOne,['Čelom k stolu, obe ruky pred telom.','Jednu ruku ťahaj dozadu, druhá ostáva vpredu.','Vráť a vystriedaj ruky.'],'Panva a hlava ostávajú rovno, pohyb ide z lopatky.','10× na každú ruku'),
   DX('s3','Ťah oboch rúk vpred',ANIM.smFwd,['Postav sa chrbtom k stolu, ruky s lanom mierne za telom.','S výdychom ťahaj obe ruky dopredu pred telo.','Pomaly vráť späť.'],'Hrudník ostáva vzpriamený, nehrb sa.','10–15×'),
   DX('s4','Ťah jednej ruky vpred',ANIM.smFwdOne,['Chrbtom k stolu, obe ruky mierne za telom.','Jednu ruku ťahaj dopredu, druhá ostáva vzadu.','Vráť a vystriedaj ruky.'],'Brucho ľahko zatiahnuté, kríže sa neprehýbajú.','10× na každú ruku'),
   DX('s5','Rozpaženie – otvorenie hrudníka',ANIM.smOpen,['Čelom k stolu, ruky s lanom predpažené pred telom.','S výdychom ťahaj ruky do strán a mierne dozadu, lopatky k sebe.','Pomaly vráť ruky pred telo.'],'Ramená dole, nezakláňaj sa.','10–15×'),
   DX('s6','Ťah vzad v stoji na jednej nohe',ANIM.smBackLeg,['Čelom k stolu, zdvihni jedno koleno a nájdi rovnováhu (pokojne pri tyči).','Ťahaj obe ruky popri tele dozadu.','Po sérii vymeň nohu.'],'Panva ostáva rovno, stojné koleno mierne povolené.','8–10× na každej nohe'),
   DX('s7','Ťah oboch rúk vpred a hore',ANIM.smFwdUp,['Chrbtom k stolu, ruky mierne za telom.','S výdychom ťahaj obe ruky dopredu a hore nad úroveň hlavy.','Pomaly vráť späť.'],'Rebrá drž dole, v krížoch sa neprehýbaj. Len do výšky bez bolesti v ramene.','10×')]},
 {id:'str',ico:'🧘',n:'Strečing',sub:'Mama aj tato',
  freq:'Po každom tréningu alebo <b>večer 3–5× týždenne</b>. Každú polohu drž 30 sekúnd a voľne dýchaj.',info:'',
  ex:[cl('w3'),cl('c4'),cl('c3'),cl('c2'),cl('c1'),cl('c5')]},
 {id:'back',ico:'🦴',n:'Chrbát a stred tela',sub:'Najmä pre mamu (platnička)',
  freq:'<b>3–4× týždenne</b>, stačí 1–2 série. Pomaly a s rovným chrbtom.',info:'',
  ex:[cl('h7'),cl('h8'),cl('h2'),cl('h9')]}
];
window.DOPL_ALL=DOPL.flatMap(g=>g.ex);
Object.assign(BR,{e1:'h',e2:'h',e3:'w',e4:'w',e5:'w',e6:'h',s1:1,s2:1,s3:1,s4:1,s5:1,s6:1,s7:1});
Object.assign(BRT,{e1:'Dýchaj pokojne, s výdychom ťah jemne prehĺb.',e2:'Nezadržiavaj dych – pokojne dýchaj počas celej výdrže.',e3:'Dýchaj plynulo, pri spúšťaní pomaly vydychuj.',e4:'Výdych pri zdvihu, nádych pri spúšťaní.',e5:'Dýchaj plynulo, nezadržiavaj dych.',e6:'Pri stisku vydychuj.',
 s1:'Výdych pri ťahu dozadu, nádych pri návrate.',s2:'Výdych pri ťahu, nádych pri návrate.',s3:'Výdych pri ťahu dopredu, nádych pri návrate.',s4:'Výdych pri ťahu, nádych pri návrate.',s5:'Výdych pri rozpažení, nádych pri návrate.',s6:'Výdych pri ťahu, nádych pri návrate.',s7:'Výdych pri ťahu hore, nádych pri návrate.'});window.DOPL=DOPL;
function renderDopl(){const el=document.getElementById('doplBox');if(!el||el.dataset.ok)return;el.dataset.ok=1;
  el.innerHTML=DOPL.map(g=>`<details class="dgrp" data-g="${g.id}"><summary><span class="di">${g.ico}</span><span class="dt"><b>${g.n}</b><small>${g.sub} · ${g.ex.length} cvikov</small></span><span class="dch">›</span></summary>
    <div class="dfreq">🗓️ <b>Ako často:</b> ${g.freq}</div>${g.info||''}<div class="list" id="dl-${g.id}"></div></details>`).join('');
  el.querySelectorAll('details').forEach(d=>d.addEventListener('toggle',()=>{const g=DOPL.find(x=>x.id===d.dataset.g);const box=document.getElementById('dl-'+g.id);
    if(d.open){if(!box.children.length)fill('dl-'+g.id,g.ex);}else{[...box.children].forEach(c=>unregisterViews(c));box.innerHTML='';}}));}
