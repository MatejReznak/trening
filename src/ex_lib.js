
/* ===== Exercise animation library (poses are functions of body lengths L, 2D units) ===== */
const FL=128;
const FYa=L=>FL-L.ankleH;
const dg=x=>x*D2R;
function standP(L,o){const FY=FYa(L);return Object.assign({x:100,y:FY-L.LEG*0.996,t:0,c:0,h:0,nl:{to:[101.5,FY]},fl:{to:[98.5,FY]},na:{a:[3,4],sp:1.6},fa:{a:[-2,-1],sp:1.6}},o||{});}
function hipFromFoot(L,foot,shinA,thighA){const knee=[foot[0]-L.SH*Math.sin(dg(shinA)),foot[1]-L.SH*Math.cos(dg(shinA))];return {hip:[knee[0]-L.TH*Math.sin(dg(thighA)),knee[1]-L.TH*Math.cos(dg(thighA))],knee};}
function shOf(L,p){return [p.x+L.T*Math.sin(dg(p.t)),p.y-L.T*Math.cos(dg(p.t))];}
function angOf(v){return Math.atan2(v[0],v[1])/D2R;}           // direction -> my angle convention
function tOf(hip,sh){return Math.atan2(sh[0]-hip[0],-(sh[1]-hip[1]))/D2R;}
function lineBody(L,ankle,beta){const c=Math.cos(dg(beta)),s=Math.sin(dg(beta));const hip=[ankle[0]+L.LEG*c,ankle[1]-L.LEG*s];const sh=[hip[0]+L.T*c,hip[1]-L.T*s];return {hip,sh,t:90-beta};}
function quadP(L,o){const kneeY=FL-L.kneeR,hipY=kneeY-L.TH,shY=FL-L.handT-L.ARM*0.965;const t=Math.acos(Math.max(-1,Math.min(1,-(shY-hipY)/L.T)))/D2R;const shx=100+L.T*Math.sin(dg(t));
  return Object.assign({x:100,y:hipY,t,c:0,h:0,nl:{a:[0,-90]},fl:{a:[0,-90]},na:{to:[shx+1.5,FL-L.handT],b:1},fa:{to:[shx+1.5,FL-L.handT],b:1}},o||{});}
function supP(L,o){return Object.assign({x:95,y:FL-L.hipBack,t:-90,c:0,h:0},o||{});}
const mix=(a,b)=>Object.assign(JSON.parse(JSON.stringify(a)),b);

/* ---- bridge helpers ---- */
function bridgeSet(L,lift,x0){x0=x0||94;const hy=FL-L.hipBack;const S=[x0-L.T,FL-L.shBack];
  const y=hy-lift;const x=S[0]+Math.sqrt(Math.max(1,L.T*L.T-(S[1]-y)*(S[1]-y)));const t=tOf([x,y],S);return {x,y,t,h:(-90-t)+1.6*Math.abs(t+90)};}
/* ===== animations ===== */
const ANIM={
 march:L=>{const s=standP(L);return {k:[s,mix(s,{nl:{a:[72,-3]},na:{a:[-24,-12],sp:1.6},fa:{a:[34,58],sp:1.6}}),s,mix(s,{fl:{a:[72,-3]},na:{a:[34,58],sp:1.6},fa:{a:[-24,-12],sp:1.6}})],dur:650,hold:120};},
 armCircle:L=>{const s=standP(L);const k=[0,120,240,360].map(a=>mix(s,{na:{a:[a,a],sp:3},fa:{a:[a,a],sp:3}}));return {k,dur:950,wrap:1};},
 catCow:L=>{const q=quadP(L);return {k:[mix(q,{c:9,h:48}),mix(q,{c:-7,h:-28})],dur:1700,hold:450,hand:{all:'floor'}};},
 hinge:L=>{const s=standP(L,{na:{a:[1,1],sp:1.2},fa:{a:[1,1],sp:1.2}});const FY=FYa(L);return {k:[s,mix(s,{x:100-0.27*L.LEG,y:FY-L.LEG*0.93,t:68,h:6})],dur:1600,hold:400};},
 lungeArms:L=>{const FY=FYa(L);const a={x:98,y:FY-L.LEG*0.965,t:0,c:0,h:0,nl:{to:[115,FY]},fl:{to:[81,FY-1.5]},na:{a:[2,3],sp:1.5},fa:{a:[-2,-1],sp:1.5}};
   const b=mix(a,{x:95,y:FY-L.LEG*0.66,t:-6,nl:{to:[117,FY]},fl:{to:[70,FY-4.5]},na:{a:[172,172],sp:1},fa:{a:[172,172],sp:1}});return {k:[a,b],dur:1600,hold:600};},
 /* squats */
 chairSquat:L=>{const FY=FYa(L);const s=standP(L,{na:{a:[10,12],sp:1.5},fa:{a:[8,10],sp:1.5}});const {hip}=hipFromFoot(L,[101.5,FY],-21,73);
   const b=mix(s,{x:hip[0],y:hip[1],t:36,h:-8,na:{a:[82,84],sp:1.5},fa:{a:[82,84],sp:1.5}});const top=hip[1]+L.hipBack*0.95;
   return {k:[s,b],dur:1500,hold:450,props:[['chair',{x0:hip[0]-13,x1:hip[0]+7,top}]]};},
 squat:L=>{const FY=FYa(L);const s=standP(L,{na:{a:[10,12],sp:1.5},fa:{a:[8,10],sp:1.5}});const {hip}=hipFromFoot(L,[101.5,FY],-30,82);
   return {k:[s,mix(s,{x:hip[0],y:hip[1],t:31,h:-10,na:{a:[86,86],sp:1.5},fa:{a:[86,86],sp:1.5}})],dur:1500,hold:450};},
 squatPause:L=>{const a=ANIM.squat(L);a.holds=[500,2200];return a;},
 gobletBox:L=>{const FY=FYa(L);const {hip}=hipFromFoot(L,[101.5,FY],-22,74);
   const top=hip[1]+L.hipBack*0.95;const a=gob(L,standP(L),0),b=gob(L,mix(standP(L),{x:hip[0],y:hip[1],t:30,h:2}),0);
   return {k:[a,b],dur:1600,hold:450,props:[['chair',{x0:hip[0]-13,x1:hip[0]+7,top}]],dyn:'goblet',curl:{all:.45},hand:{all:'cup'}};},
 goblet:L=>{const FY=FYa(L);const {hip}=hipFromFoot(L,[101.5,FY],-32,86);
   return {k:[gob(L,standP(L),0),gob(L,mix(standP(L),{x:hip[0],y:hip[1],t:26,h:2}),0)],dur:1600,hold:450,dyn:'goblet',curl:{all:.45},hand:{all:'cup'}};},
 gobletPause:L=>{const a=ANIM.goblet(L);a.holds=[500,2200];return a;},
 /* bridges */
 bridge:L=>{const FY=FYa(L),x0=94;const feet=[x0+L.TH*1.3,FY];const b0=bridgeSet(L,0,x0),b1=bridgeSet(L,L.TH*0.62,x0);
   const base={c:0,nl:{to:feet,b:-1},fl:{to:[feet[0]-1.5,FY],b:-1},na:{a:[90,90],sp:2.6},fa:{a:[90,90],sp:2.6}};
   return {k:[Object.assign({},base,b0),Object.assign({},base,b1)],dur:1300,hold:500,hand:{all:'floor'}};},
 bridgeHold:L=>{const a=ANIM.bridge(L);a.holds=[400,2200];return a;},
 bridgeSingle:L=>{const FY=FYa(L),x0=94;const feet=[x0+L.TH*1.3,FY];const b0=bridgeSet(L,0,x0),b1=bridgeSet(L,L.TH*0.62,x0);
   const leg=b=>{const [k]=ik2([b.x,b.y],[feet[0]-1.5,FY],L.TH,L.SH,-1);const th=angOf([k[0]-b.x,k[1]-b.y]);return {a:[th,th]};};
   const base={c:0,fl:{to:[feet[0]-1.5,FY],b:-1},na:{a:[90,90],sp:2.6},fa:{a:[90,90],sp:2.6}};
   return {k:[Object.assign({},base,b0,{nl:leg(b0)}),Object.assign({},base,b1,{nl:leg(b1)})],dur:1300,hold:500,hand:{all:'floor'}};},
 bridgeDB:L=>{const a=ANIM.bridge(L);a.k=a.k.map(p=>{const q=JSON.parse(JSON.stringify(p));q.na={to:[p.x+2,p.y-4.5],b:-1,sp:1};q.fa={to:[p.x+2,p.y-4.5],b:-1,sp:1};return q;});a.hand={all:'pron'};a.curl={all:1};a.dyn='hipdb';return a;},
 hipThrust:L=>{const FY=FYa(L);const top=FL-0.42*U60;const S=[70,top-L.shBack*0.45];
   const hipTop=[S[0]+L.T,S[1]];const feet=[hipTop[0]+L.TH*0.98,FY];
   const yb=S[1]+0.62*L.T;const hipBot=[S[0]+Math.sqrt(L.T*L.T-(yb-S[1])*(yb-S[1])),yb];
   const mk=h=>{const t=tOf(h,S);return {x:h[0],y:h[1],t,c:0,h:Math.max(14,-t*0.9),nl:{to:feet,b:-1},fl:{to:[feet[0]-1.5,FY],b:-1},na:{to:[h[0]+2,h[1]-4.5],b:-1,sp:1},fa:{to:[h[0]+2,h[1]-4.5],b:-1,sp:1}};};
   return {k:[mk(hipBot),mk(hipTop)],dur:1300,hold:500,hand:{all:'pron'},curl:{all:1},dyn:'hipdb',props:[['benchHT',{x0:S[0]-48,x1:S[0]+3,top}]]};},
 /* push-ups */
 pushWall:L=>{const FY=FYa(L);const a=[72,FY-0.5];const t0=lineBody(L,a,70),t1=lineBody(L,a,61);const hand=[t0.sh[0]+L.ARM*0.955*Math.sin(dg(70)),t0.sh[1]+L.ARM*0.955*Math.cos(dg(70))];
   const mk=lb=>({x:lb.hip[0],y:lb.hip[1],t:lb.t,c:0,h:0,nl:{to:a},fl:{to:[a[0]+2,a[1]]},na:{to:hand,b:1},fa:{to:hand,b:1}});
   return {k:[mk(t0),mk(t1)],dur:1300,hold:450,hand:{all:'wall'},props:[['wall',{x:hand[0]+L.handT*0.9}]],yaw:-0.12};},
 pushTable:L=>{const FY=FYa(L);const a=[50,FY-0.5];const t0=lineBody(L,a,46),t1=lineBody(L,a,37.5);const hand=[t0.sh[0]+L.ARM*0.955*Math.sin(dg(46)),t0.sh[1]+L.ARM*0.955*Math.cos(dg(46))];
   const mk=lb=>({x:lb.hip[0],y:lb.hip[1],t:lb.t,c:0,h:0,nl:{to:a},fl:{to:[a[0]+2,a[1]]},na:{to:hand,b:1},fa:{to:hand,b:1}});
   return {k:[mk(t0),mk(t1)],dur:1300,hold:450,hand:{all:'floor'},props:[['table',{x0:hand[0]-4,x1:hand[0]+52,top:hand[1]+L.handT}]]};},
 pushKnees:L=>{const kp=[62,FL-L.kneeR];const mk=drop=>{const shY=FL-L.handT-L.ARM*0.95+drop;const b=Math.asin(Math.min(1,(kp[1]-shY)/(L.TH+L.T)))/D2R;const c=Math.cos(dg(b)),s=Math.sin(dg(b));
     const hip=[kp[0]+L.TH*c,kp[1]-L.TH*s];const sh=[hip[0]+L.T*c,hip[1]-L.T*s];return {hip,sh,t:90-b};};
   const top=mk(0),bot=mk(L.UA*0.6);const hand=[top.sh[0]+1.5,FL-L.handT];
   const P=g=>{const th=angOf([kp[0]-g.hip[0],kp[1]-g.hip[1]]);return {x:g.hip[0],y:g.hip[1],t:g.t,c:0,h:0,nl:{a:[th,-118]},fl:{a:[th,-114]},na:{to:hand,b:1,sp:1.5},fa:{to:hand,b:1,sp:1.5}};};
   return {k:[P(top),P(bot)],dur:1300,hold:450,hand:{all:'floor'}};},
 pushFloor:L=>{const ap=[34,FL-6.8];const mk=drop=>{const shY=FL-L.handT-L.ARM*0.95+drop;const b=Math.asin(Math.min(1,(ap[1]-shY)/(L.LEG+L.T)))/D2R;return lineBody(L,ap,b);};
   const top=mk(0),bot=mk(L.UA*0.62);const hand=[top.sh[0]+1.5,FL-L.handT];
   const P=g=>({x:g.hip[0],y:g.hip[1],t:g.t,c:0,h:0,nl:{to:ap},fl:{to:[ap[0]-1,ap[1]]},na:{to:hand,b:1,sp:1.5},fa:{to:hand,b:1,sp:1.5}});
   return {k:[P(top),P(bot)],dur:1300,hold:450,hand:{all:'floor'},toe:'down',footRelax:8};},
 /* band row seated */
 bandRow:L=>{const x0=72,hy=FL-L.hipBack*0.82;const feet=[x0+L.LEG*0.965,FL-3.4];
   const a={x:x0,y:hy,t:9,c:0,h:-4,nl:{to:feet,b:-1},fl:{to:[feet[0]-1,feet[1]],b:-1}};const sa=shOf(L,a);a.na={to:[sa[0]+L.ARM*0.9,sa[1]+L.ARM*0.3],b:1};a.fa=a.na;
   const b=mix(a,{t:-6,h:4});const sb=shOf(L,b);b.na={to:[x0+5,hy-L.T*0.52],b:1,sp:0.5};b.fa=b.na;
   return {k:[a,b],dur:1200,hold:450,curl:{all:.95},dyn:'bandRow'};},
 /* lunges */
 lungeBase:(L,o)=>{o=o||{};const FY=FYa(L);const s=standP(L,{x:97,nl:{to:[99,FY]},fl:{to:[96,FY]}});
   const knee=[101,FY-L.SH*0.99];const hip=[knee[0]-L.TH*Math.sin(dg(80)),knee[1]-L.TH*Math.cos(dg(80))];
   const b=mix(s,{x:hip[0],y:hip[1]+1,t:5,nl:{to:[99,FY]},fl:{to:[99-0.95*L.LEG,FY-4],b:-1}});
   return {s,b};},
 lungeSupport:L=>{const {s,b}=ANIM.lungeBase(L);const FY=FYa(L);const cx=113,ctop=FL-0.86*U60;
   const hand=[cx-1,ctop-L.handT];const S=mix(s,{na:{to:hand,b:1},fa:{a:[-2,0],sp:1.5}}),B=mix(b,{na:{to:hand,b:1},fa:{a:[4,6],sp:1.5}});
   return {k:[S,B],dur:1500,hold:500,hand:{R:'floor'},props:[['chairF',{x0:cx,x1:cx+26,top:FL-0.46*U60,back:ctop}]]};},
 lunge:L=>{const {s,b}=ANIM.lungeBase(L);const hips=p=>{const sh=shOf(L,p);return {to:[p.x+1,p.y-3.5],b:1,sp:4};};
   const S=mix(s,{na:hips(s),fa:hips(s)}),B=mix(b,{na:hips(b),fa:hips(b)});return {k:[S,B],dur:1500,hold:500};},
 lungeKnee:L=>{const a=ANIM.lunge(L);const s=a.k[0];const up=mix(s,{fl:{a:[78,-4]},na:s.na,fa:s.fa});return {k:[s,a.k[1],up],dur:1200,hold:400,holds:[300,450,700]};},
 lungeDB:L=>{const {s,b}=ANIM.lungeBase(L);const S=mix(s,{na:{a:[0,0],sp:2.2},fa:{a:[0,0],sp:2.2}}),B=mix(b,{na:{a:[4,4],sp:2.2},fa:{a:[4,4],sp:2.2}});
   return {k:[S,B],dur:1500,hold:500,curl:{all:1},dyn:'db2',hand:{all:'side'}};},
 lungeBW:L=>{const a=ANIM.lunge(L);return a;},
 /* side-lying abduction (side:true -> near=top=left) */
 sideAbd:L=>{const hipMid=FL-(L.hipW+4.3),shMid=FL-(L.shW+3.3);const dl=Math.asin(Math.max(-0.5,Math.min(0.5,(hipMid-shMid)/L.T)))/D2R;const t=-90+dl;
   const base={x:100,y:hipMid,t,c:0,h:-95-t,fl:{a:[90,90]},fa:{a:[-100,-100]},na:{a:[99,97]}};
   return {k:[mix(base,{nl:{a:[91,91]}}),mix(base,{nl:{a:[121,121]}})],dur:1300,hold:500,side:true};},
 sideAbdBand:L=>{const a=ANIM.sideAbd(L);a.dyn='bandKnees';return a;},
 /* bird dog */
 legOnly:L=>{const q=quadP(L);return {k:[q,mix(q,{nl:{a:[-88,-88]}}),q,mix(q,{fl:{a:[-88,-88]}})],dur:1400,hold:700,hand:{all:'floor'}};},
 birdDog:L=>{const q=quadP(L);return {k:[q,mix(q,{nl:{a:[-88,-88]},fa:{a:[95,95]},h:-4}),q,mix(q,{fl:{a:[-88,-88]},na:{a:[95,95]},h:-4})],dur:1400,hold:900,hand:{all:'floor'}};},
 birdCrunch:L=>{const q=quadP(L);const ext=mix(q,{nl:{a:[-88,-88]},fa:{a:[95,95]},h:-4});
   const cr=mix(q,{c:8,h:35,nl:{a:[62,-75],sp:-L.hipW*0.8},fa:{a:[-15,35],sp:-L.shW*0.7}});
   const mid=mix(q,{c:4,h:15,nl:{a:[-22,-118],sp:-L.hipW*0.4},fa:{a:[40,70],sp:-L.shW*0.35}});
   return {k:[q,ext,mid,cr,mid,ext],durs:[1200,550,550,550,550,1200],holds:[500,500,0,500,0,500],hand:{all:'floor'}};},
 /* dead bug */
 heelTap:L=>{const tt=supP(L,{nl:{a:[180,90]},fl:{a:[180,90]},na:{a:[180,180]},fa:{a:[180,180]}});return {k:[tt,mix(tt,{nl:{a:[132,40]}}),tt,mix(tt,{fl:{a:[132,40]}})],dur:1300,hold:500};},
 deadBug:L=>{const tt=supP(L,{nl:{a:[180,90]},fl:{a:[180,90]},na:{a:[180,180]},fa:{a:[180,180]}});
   return {k:[tt,mix(tt,{nl:{a:[101,101]},fa:{a:[262,262]}}),tt,mix(tt,{fl:{a:[101,101]},na:{a:[262,262]}})],dur:1500,hold:600,hand:{all:'floor'}};},
 /* planks */
 plankKnees:L=>{const kp=[60,FL-L.kneeR];const shY=FL-L.elbowR-L.UA*0.97;const b=Math.asin(Math.min(1,(kp[1]-shY)/(L.TH+L.T)))/D2R;const c=Math.cos(dg(b)),s=Math.sin(dg(b));
   const hip=[kp[0]+L.TH*c,kp[1]-L.TH*s],sh=[hip[0]+L.T*c,hip[1]-L.T*s];const th=angOf([kp[0]-hip[0],kp[1]-hip[1]]);
   const hand=[sh[0]+L.FA*0.95,FL-L.handT];const p={x:hip[0],y:hip[1],t:90-b,c:0,h:0,nl:{a:[th,-100]},fl:{a:[th,-97]},na:{to:hand,b:1,sp:-1},fa:{to:hand,b:1,sp:-1}};
   return {k:[p,mix(p,{c:-1.2})],dur:1800,hold:300,hand:{all:'floor'},curl:{all:.45}};},
 plankToes:L=>{const ap=[30,FL-6.8];const shY=FL-L.elbowR-L.UA*0.97;const b=Math.asin(Math.min(1,(ap[1]-shY)/(L.LEG+L.T)))/D2R;const g=lineBody(L,ap,b);
   const hand=[g.sh[0]+L.FA*0.95,FL-L.handT];const p={x:g.hip[0],y:g.hip[1],t:g.t,c:0,h:0,nl:{to:ap},fl:{to:[ap[0]-1,ap[1]]},na:{to:hand,b:1,sp:-1},fa:{to:hand,b:1,sp:-1}};
   return {k:[p,mix(p,{c:-1.2})],dur:1800,hold:300,hand:{all:'floor'},curl:{all:.45},toe:'down',footRelax:8};},
 plankLeg:L=>{const a=ANIM.plankToes(L);const p=a.k[0];const th=angOf([30-p.x,FL-6.8-p.y]);
   return Object.assign(a,{k:[p,mix(p,{nl:{a:[th-12,th-12]}}),p,mix(p,{fl:{a:[th-12,th-12]}})],dur:1000,hold:700});},
 /* RDL */
 rdl:(L,deep,bar)=>{const FY=FYa(L);const R0=[13,14],R1=[14,16],SP=bar?0.6:-2.3,SPB=bar?0.6:-0.6;const s=standP(L,{na:{a:R0,sp:SP},fa:{a:R0,sp:SP}});
   const b=mix(s,{x:100-(deep?0.3:0.19)*L.LEG,y:FY-L.LEG*(deep?0.925:0.955),t:deep?70:46,h:deep?8:4,nl:{to:[103,FY]},fl:{to:[100,FY]},na:{a:deep?R1:[R1[0]-2,R1[1]-2],sp:SPB},fa:{a:deep?R1:[R1[0]-2,R1[1]-2],sp:SPB}});
   return {k:[s,b],dur:1700,hold:450,hand:{all:'pron'},curl:{all:1},dyn:bar?'barbell':'db2'};},
 /* presses */
 floorPress:L=>{const FY=FYa(L);const x0=95;const p=supP(L,{x:x0,nl:{to:[x0+L.TH*1.25,FY],b:-1},fl:{to:[x0+L.TH*1.23,FY],b:-1}});
   return {k:[mix(p,{na:{a:[180,180],sp:2.5,spE:2.5},fa:{a:[180,180],sp:2.5,spE:2.5}}),mix(p,{na:{a:[96,180],sp:4,spE:7},fa:{a:[96,180],sp:4,spE:7}})],dur:1300,hold:450,hand:{all:'press'},curl:{all:1},dyn:'db2'};},
 benchPress:L=>{const FY=FYa(L);const top=FL-0.43*U60;const hy=top-L.hipBack*0.95,sy=top-L.shBack*0.95;const hip=[97,hy];const sh=[97-Math.sqrt(L.T*L.T-(sy-hy)*(sy-hy)),sy];
   const t=tOf(hip,sh);const p={x:hip[0],y:hip[1],t,c:0,h:-90-t,nl:{to:[hip[0]+L.TH*0.98,FY],b:-1},fl:{to:[hip[0]+L.TH*0.96,FY],b:-1}};
   return {k:[mix(p,{na:{a:[180,180],sp:2.5,spE:2.5},fa:{a:[180,180],sp:2.5,spE:2.5}}),mix(p,{na:{a:[58,180],sp:5,spE:8.5},fa:{a:[58,180],sp:5,spE:8.5}})],dur:1300,hold:450,hand:{all:'press'},curl:{all:1},dyn:'db2',
     props:[['benchP',{x0:sh[0]-15,x1:hip[0]+5,top}]],ground:true};},
 /* supported row */
 rowSupported:L=>{const FY=FYa(L);const hip=[80,FY-L.LEG*0.88];const t=72;const p0={x:hip[0],y:hip[1],t,c:0,h:12,nl:{to:[97,FY]},fl:{to:[72,FY]}};const sh=shOf(L,p0);
   const btop=sh[1]+L.ARM*0.78;const sup={to:[sh[0]+9,btop-L.handT],b:1};
   const hang=mix(p0,{fa:sup,na:{a:[4,2],sp:1.2,spE:1}});
   const pull=mix(p0,{fa:sup,na:{a:[-118,-6],sp:1.6,spE:2.2}});
   return {k:[hang,pull],dur:1200,hold:450,hand:{L:'floor',R:'side'},curl:{R:1,L:.1},dyn:'db1',props:[['bench',{x0:sh[0]+1,x1:sh[0]+53,top:btop}]]};},
 /* farmer */
 farmer:(L,one)=>{const FY=FYa(L);const s=standP(L,{na:{a:[0,0],sp:2.4},fa:{a:[0,0],sp:2.4}});
   const k=[mix(s,{y:s.y+1,nl:{to:[110,FY]},fl:{to:[90,FY]}}),mix(s,{nl:{to:[100,FY]},fl:{a:[24,-30]}}),mix(s,{y:s.y+1,nl:{to:[90,FY]},fl:{to:[110,FY]}}),mix(s,{fl:{to:[100,FY]},nl:{a:[24,-30]}})];
   return {k,dur:650,hold:60,curl:one?{R:1,L:.25}:{all:1},hand:{all:'side'},dyn:one?'db1':'db2'};},
 /* hanging */
 hang:(L,mode)=>{const barY=-14,wy=barY+4.2;const shDown=wy+L.ARM*0.97+4.3;
   const hp=(sy,legs,dx,hh,tt)=>Object.assign({x:100+(dx||0),y:sy+L.T,t:tt||0,c:0,h:hh||0,na:{to:[101,wy],b:1,sp:2.5,spE:4},fa:{to:[99,wy],b:1,sp:2.5,spE:4}},legs);
   const legs={nl:{a:[10,-28]},fl:{a:[6,-34]}};
   const props=[['bar',{y:barY}]];
   if(mode==='chair'){const hy=shDown+L.T;const ft=[100+0.62*L.LEG,hy+0.6*L.LEG];const lg={nl:{to:ft,b:-1},fl:{to:[ft[0]-1,ft[1]],b:-1}};
     props.push(['chair2',{x0:ft[0]-12,x1:ft[0]+12,top:ft[1]+L.ankleH+0.6}]);
     return {k:[hp(shDown,lg),hp(shDown-1.8,lg)],dur:1300,hold:900,hand:{all:'bar'},curl:{all:1},ground:false,props,footFloor:(FL-(ft[1]+L.ankleH+0.6))/60};}
   if(mode==='dead') return {k:[hp(shDown,legs),hp(shDown-1.8,legs)],dur:1400,hold:1000,hand:{all:'bar'},curl:{all:1},ground:false,props};
   const top=hp(barY+10.5,{nl:{a:[16,-24]},fl:{a:[12,-30]}},-10,-6,-8);const bot=hp(shDown,legs);
   if(mode==='neg') return {k:[top,bot],durs:[4000,700],holds:[700,600],hand:{all:'bar'},curl:{all:1},ground:false,props};
   return {k:[bot,top],dur:1300,hold:450,hand:{all:'bar'},curl:{all:1},ground:false,props};},
 /* cool-down */
 kneesChest:L=>{const FY=FYa(L);const p=supP(L,{nl:{to:[95+L.TH*1.25,FY],b:-1},fl:{to:[95+L.TH*1.23,FY],b:-1},na:{a:[90,90],sp:2.6},fa:{a:[90,90],sp:2.6}});
   const kn=[p.x+L.TH*Math.sin(dg(212)),p.y+L.TH*Math.cos(dg(212))];
   const q=mix(p,{nl:{a:[212,58]},fl:{a:[209,58]},na:{to:[kn[0]+3,kn[1]+1],b:-1},fa:{to:[kn[0]+3,kn[1]+1],b:-1}});
   return {k:[p,q],dur:1800,hold:900,hand:{all:'side'},curl:{all:.7}};},
 hamBand:L=>{const FY=FYa(L);const p=supP(L,{fl:{to:[95+L.TH*1.25,FY],b:-1},na:{a:[146,150],sp:1},fa:{a:[146,150],sp:1}});
   return {k:[mix(p,{nl:{a:[140,140]}}),mix(p,{nl:{a:[170,170]}})],dur:2000,hold:900,curl:{all:.9},dyn:'bandHam'};},
 hipFlexor:L=>{const FY=FYa(L);const mk=(ang,x)=>{const y=FL-L.kneeR-L.TH*Math.cos(dg(ang));return {x,y};};
   const a=mk(20,90),b=mk(33,95);const ft=[a.x+L.LEG*0.6,FY];
   const kn=[ft[0]+2,FY-L.SH*0.97];
   const A={x:a.x,y:a.y,t:0,c:0,h:0,nl:{to:ft,b:-1},fl:{a:[-20,-92]},na:{to:[kn[0]-2,kn[1]-2],b:1,sp:0.5},fa:{to:[kn[0]-2,kn[1]-2],b:1,sp:0.5}};
   const B=mix(A,{x:b.x,y:b.y,t:-6,fl:{a:[-33,-92]},na:{a:[172,172],sp:1},fa:{a:[172,172],sp:1}});
   return {k:[A,B],dur:2000,hold:1000};},
 chestOpen:L=>{const s=standP(L,{na:{a:[0,0],sp:1.6},fa:{a:[0,0],sp:1.6}});return {k:[s,mix(s,{t:-4,h:-8,na:{a:[-36,-30],sp:-5},fa:{a:[-36,-30],sp:-5}})],dur:1800,hold:1000,curl:{all:.3},hand:{all:'fwd'}};},
 childPose:L=>{const hy=FL-0.37*L.LEG;const kneeY=FL-L.kneeR;const th=Math.acos(Math.max(-1,Math.min(1,(kneeY-hy)/L.TH)))/D2R;
   const a={x:72,y:hy,t:0,c:0,h:0,nl:{a:[th,-88],sp:2},fl:{a:[th,-88],sp:2},na:{a:[22,40],sp:1},fa:{a:[22,40],sp:1}};
   const b=mix(a,{x:70,y:hy+1,t:96,c:3,h:12});const sb=shOf(L,b);b.na={to:[sb[0]+L.ARM*0.93,FL-L.handT],b:1,sp:1};b.fa=b.na;
   return {k:[a,b],dur:2200,hold:1100,hand:{all:'floor'}};},
};
function gob(L,p,o){const G=[12,140],t=p.t||0,SE=0.15;
  const arm={a:[G[0]+t*0.75,G[1]+t*-0.5],sp:-(L.shW-2.6),spE:-L.shW*SE};
  return Object.assign(JSON.parse(JSON.stringify(p)),{na:arm,fa:JSON.parse(JSON.stringify(arm))});}

/* ===== fitness-centre machines ===== */
function seatP(L,seatTop,hipX,t,o){const hy=seatTop-L.hipBack*0.92;return Object.assign({x:hipX,y:hy,t,c:0,h:-t*0.75},o||{});}
function seatFeet(L,p,dx){const FY=FYa(L)-0.75;const kx=p.x+L.TH*0.97;return {nl:{to:[kx+(dx||2),FY],b:-1},fl:{to:[kx+(dx||2)-1.5,FY],b:-1}};}
function seatTopFor(L){return FYa(L)-L.SH*0.97+L.hipBack*0.92-2.0;}  // knees ~90°, feet flat
Object.assign(ANIM,{
 legPress:L=>{const st=FL-0.40*U60,hx=86,t=-24;const p=seatP(L,st,hx,t,{h:10});const fy=p.y-2.5;
   const near=hx+0.60*L.LEG,far=hx+0.93*L.LEG;
   const mk=ax=>mix(p,{nl:{to:[ax,fy],b:-1,sp:1.2,spK:1.6},fl:{to:[ax,fy+0.5],b:-1,sp:1.2,spK:1.6},na:{to:[hx+3,p.y+2],b:1,sp:3.5},fa:{to:[hx+3,p.y+2],b:1,sp:3.5},fo:-X3(ax+L.ankleH*0.95)});
   return {k:[mk(near),mk(far)],dur:1500,hold:450,curl:{all:1},ground:false,footN:[-1,0],footRelax:10,
     props:[['legPress',{st,hx,t,fy,near,far,ah:L.ankleH*0.95,T:L.T,hb:L.hipBack}]],dyn:{type:'legPress',near:X3(near+L.ankleH*0.95)}};},
 latPull:L=>{const st=seatTopFor(L)+1,hx=96,t=-10;const p=seatP(L,st,hx,t);Object.assign(p,seatFeet(L,p,3));
   const sh=shOf(L,p);const top=[sh[0]+3,sh[1]-L.ARM*0.97];const bot=[sh[0]+5,sh[1]+3];
   const a=mix(p,{na:{to:top,b:1,sp:9,spE:6},fa:{to:top,b:1,sp:9,spE:6}}),b=mix(p,{t:-16,h:10,na:{to:bot,b:1,sp:10,spE:14},fa:{to:bot,b:1,sp:10,spE:14}});
   return {k:[a,b],dur:1400,hold:450,hand:{all:'pron'},curl:{all:1},ground:false,
     props:[['latPull',{st,hx,kneeY:p.y-L.TH*0.0-1.8,kx:hx+L.TH*0.75,topX:top[0],topY:top[1]}]],dyn:{type:'latPull',topY:Y3(top[1])}};},
 chestPress:L=>{const st=seatTopFor(L)+1.5,hx=92,t=-6;const p=seatP(L,st,hx,t);Object.assign(p,seatFeet(L,p,3));
   const sh=shOf(L,p);const hy=sh[1]+5.5;const near=sh[0]+4,far=sh[0]+L.ARM*0.9;
   const mk=x=>mix(p,{na:{to:[x,hy],b:1,sp:3,spE:9},fa:{to:[x,hy],b:1,sp:3,spE:9}});
   return {k:[mk(near),mk(far)],dur:1300,hold:450,curl:{all:1},ground:false,
     props:[['chestPress',{st,hx,t,hb:L.hipBack,T:L.T,hy,near}]],dyn:{type:'chestPress',near:X3(near)}};},
 cableRow:L=>{const st=FL-0.40*U60,hx=80;const p0=seatP(L,st,hx,4,{h:-4});const feetX=hx+L.LEG*0.86,fy=FYa(L)-6;
   const legs={nl:{to:[feetX,fy],b:-1,sp:1},fl:{to:[feetX-1,fy+0.5],b:-1,sp:1},fo:-X3(feetX+L.ankleH*0.95)};
   const a=mix(p0,Object.assign({t:16,h:-12},legs));const sa=shOf(L,a);a.na={to:[sa[0]+L.ARM*0.93,sa[1]+L.ARM*0.32],b:1,sp:-(L.shW-3.4),spE:-(L.shW*0.45)};a.fa=a.na;
   const b=mix(p0,Object.assign({t:-4,h:4},legs));const sb=shOf(L,b);b.na={to:[hx+6,p0.y-L.T*0.42],b:1,sp:-(L.shW-3.4),spE:1.5};b.fa=b.na;
   return {k:[a,b],dur:1300,hold:450,curl:{all:1},ground:false,footN:[-1,0],footRelax:12,
     props:[['cableRow',{st,hx,feetX:feetX+L.ankleH*0.95,fy}]],dyn:{type:'cableRow',px:X3(feetX+L.ankleH*0.95+3),py:Y3(fy)}};},
 legCurl:L=>{const st=seatTopFor(L)-6,hx=92,t=-12;const p=seatP(L,st,hx,t);
   const legA=s=>({a:[90,s],sp:1.2});
   const a=mix(p,{nl:legA(84),fl:legA(84),na:{to:[hx+4,p.y+3],b:1,sp:4},fa:{to:[hx+4,p.y+3],b:1,sp:4}}),b=mix(a,{nl:legA(2),fl:legA(2)});
   return {k:[a,b],dur:1400,hold:450,curl:{all:1},ground:false,footRelax:-30,
     props:[['legCurl',{st,hx,t,hb:L.hipBack,T:L.T,kx:hx+L.TH,ky:p.y,SH:L.SH}]],dyn:{type:'legCurl',kx:X3(hx+L.TH),ky:Y3(p.y)}};},
 hipAbdM:L=>{const st=seatTopFor(L)-0.9,hx=92,t=-14;const p=seatP(L,st,hx,t);const f=seatFeet(L,p,1);
   const a=mix(p,{nl:Object.assign({},f.nl,{a:[90,2],sp:0.8,spK:0.8}),fl:Object.assign({},f.fl,{a:[90,2],sp:0.8,spK:0.8}),na:{to:[hx+3,p.y+2],b:1,sp:4},fa:{to:[hx+3,p.y+2],b:1,sp:4}});
   delete a.nl.to;delete a.fl.to;const b=mix(a,{nl:{a:[90,2],sp:13,spK:13},fl:{a:[90,2],sp:13,spK:13}});
   return {k:[a,b],dur:1300,hold:500,curl:{all:1},ground:false,
     props:[['hipAbd',{st,hx,t,hb:L.hipBack,T:L.T,kx:hx+L.TH,ky:p.y}]],dyn:{type:'hipAbd',kx:X3(hx+L.TH*0.92),ky:Y3(p.y)}};},
 backExt:(L,full)=>{const ank=[72,FL-0.44*U60];const c=Math.SQRT1_2;const hip=[ank[0]+L.LEG*c,ank[1]-L.LEG*c];
   const arms={na:{a:[150,-150],sp:-4,spE:1},fa:{a:[150,-150],sp:-4,spE:1}};
   const up={x:hip[0],y:hip[1],t:45,c:0,h:0,nl:{a:[-45,-45],sp:1},fl:{a:[-45,-45],sp:1}};
   const arm=t=>({na:{a:[t+100,t-130],sp:-3.5,spE:2},fa:{a:[t+100,t-130],sp:-3.5,spE:2}});
   const a=Object.assign({},up,arm(45)),b=Object.assign(mix(up,{t:full?125:100,c:full?5:2,h:-20}),arm(full?125:100));
   return {k:[a,b],dur:1700,hold:500,curl:{all:.6},ground:false,footN:[c,c],footOff:(X3(ank[0])*c+Y3(ank[1])*c)-L.ankleH*0.95/U60,
     props:[['backExt',{ax:ank[0],ay:ank[1],hx:hip[0],hy:hip[1],ah:L.ankleH}]]};},
 pallof:(L,kneel)=>{const FY=FYa(L);let base;
   if(kneel){const kneeY=FL-L.kneeR;base={x:100,y:kneeY-L.TH*0.99,t:0,c:0,h:0,nl:{a:[0,-90],sp:2},fl:{a:[0,-90],sp:2}};}
   else base=standP(L,{y:FY-L.LEG*0.975,nl:{to:[101,FY],sp:2.6},fl:{to:[99,FY],sp:2.6}});
   const sh=shOf(L,base);const near=[sh[0]+5,sh[1]+6.5],far=[sh[0]+L.ARM*0.93,sh[1]+5];
   const mk=h=>mix(base,{na:{to:h,b:1,sp:-(L.shW-3.2),spE:-1},fa:{to:h,b:1,sp:-(L.shW-3.2),spE:-1}});
   return {k:[mk(near),mk(far)],dur:1300,hold:900,curl:{all:1},
     props:[['cableTower',{y:sh[1]+6}]],dyn:{type:'pallof',py:Y3(sh[1]+6)}};},
 bike:L=>{const cx=104,cy=FL-0.30*U60,r=0.17*U60;const hx=90;const hY=cy+r-L.ankleH*0.9-Math.sqrt(Math.pow(0.975*L.LEG,2)-Math.pow(10,2));const st=hY+L.hipBack*0.92;
   const p0={x:hx,y:hY,t:28,c:2,h:-24};const sh=shOf(L,p0);const hb=[sh[0]+L.ARM*0.78,sh[1]+L.ARM*0.5];
   const k=[];const N=12;
   for(let i=0;i<N;i++){const th=i/N*2*Math.PI;const pd=s=>{const a=th+(s?Math.PI:0);return [cx+r*Math.cos(a),cy+r*Math.sin(a)];};
     const R=pd(0),Lf=pd(1);const off=[-4.2,-L.ankleH*0.9];
     k.push(mix(p0,{y:p0.y+0.3*Math.sin(2*th),nl:{to:[R[0]+off[0],R[1]+off[1]],b:-1,sp:1.4},fl:{to:[Lf[0]+off[0],Lf[1]+off[1]],b:-1,sp:1.4},foR:Y3(R[1])+0.012,foL:Y3(Lf[1])+0.012,cr:th,
       na:{to:hb,b:1,sp:2.6},fa:{to:hb,b:1,sp:2.6}}));}
   k.push(k[0]);
   return {k,dur:110,wrap:1,curl:{all:1},hand:{all:'pron'},ground:false,footRelax:-10,
     props:[['bike',{cx,cy,st,hx,hb}]],dyn:{type:'bike',cx:X3(cx),cy:Y3(cy),r:r/U60}};},
 elliptical:L=>{const cx=100,cy=FL-0.24*U60,a=0.20*U60,b=0.06*U60;const k=[];const N=12;const FY0=cy;
   const base=standP(L);
   for(let i=0;i<N;i++){const th=i/N*2*Math.PI;const pf=s=>{const q=th+(s?Math.PI:0);return [cx+a*Math.cos(q),cy+b*Math.sin(q)];};
     const R=pf(0),Lf=pf(1);const hipY=Math.min(R[1],Lf[1])-L.LEG*0.985+L.ankleH*0.1;const hipX=100-6;
     const hr=s=>{const q=th+(s?Math.PI:0);return [hipX+L.ARM*0.55-5*Math.cos(q),hipY-L.T-L.ARM*0.05];};
     k.push(mix(base,{x:hipX,y:hipY-L.ankleH,t:6,h:-6,nl:{to:[R[0]-3,R[1]-L.ankleH],b:-1,sp:1.6},fl:{to:[Lf[0]-3,Lf[1]-L.ankleH],b:-1,sp:1.6},foR:Y3(R[1]),foL:Y3(Lf[1]),cr:th,
       na:{to:hr(1),b:1,sp:3},fa:{to:hr(0),b:1,sp:3}}));}
   k.push(k[0]);
   return {k,dur:115,wrap:1,curl:{all:1},ground:false,footRelax:0,
     props:[['elliptical',{cx,cy}]],dyn:{type:'elliptical',cx:X3(cx),cy:Y3(cy),a:a/U60,b:b/U60}};},
 treadmill:L=>{const al=5*D2R,deckY=FL-0.20*U60;const fy=x=>deckY-(x-100)*Math.tan(al);const N=12;const k=[];const S=17;
   for(let i=0;i<N;i++){const ph=i/N;
     const ft=q=>{q=(q%1+1)%1;if(q<0.62){const u=q/0.62;const x=100+S*(0.5-u);return [x,fy(x)-L.ankleH*0.98,0];}const u=(q-0.62)/0.38;const x=100+S*(-0.5+u);return [x,fy(x)-L.ankleH*0.98-5.5*Math.sin(Math.PI*u),1];};
     const R=ft(ph),Lf=ft(ph+0.5);const lowest=Math.max(R[1],Lf[1]);const hy=fy(100)-L.ankleH*0.98-Math.sqrt(Math.pow(0.996*L.LEG,2)-Math.pow(S/2,2))-0.5*Math.cos(4*Math.PI*ph);
     const sw=Math.sin(2*Math.PI*ph);
     k.push({x:100,y:hy,t:4,c:0,h:-4,nl:{to:[R[0],R[1]],b:-1,sp:1.5},fl:{to:[Lf[0],Lf[1]],b:-1,sp:1.5},
       na:{a:[-22*sw,-22*sw+48],sp:1.4},fa:{a:[22*sw,22*sw+48],sp:1.4}});}
   k.push(k[0]);
   const c=Math.cos(al),s2=Math.sin(al);const p0=[100,deckY];
   return {k,dur:95,wrap:1,curl:{all:.35},ground:false,footN:[-s2,c],footOff:(-X3(p0[0])*s2+Y3(p0[1])*c),
     props:[['treadmill',{deckY,al}]]};},
});
/* realistic tempo: slower lowering (eccentric), quicker lifting, short pauses at the ends
   [k0->k1 ms, k1->k0 ms, hold at k0, hold at k1] */
(function(){const T={
  squat:[1900,1200,450,250],chairSquat:[1900,1200,450,300],squatPause:[1900,1200,450,2000],
  goblet:[2000,1200,450,250],gobletBox:[2000,1200,450,350],gobletPause:[2000,1200,450,2000],
  bridge:[1000,1600,350,1000],bridgeHold:[1000,1600,350,2000],bridgeDB:[1000,1700,350,1000],hipThrust:[1000,1700,350,1000],
  floorPress:[1800,1100,350,500],benchPress:[1900,1100,350,250],rowSupported:[1000,1800,350,450],
  lunge:[1700,1200,450,250],lungeDB:[1700,1200,450,250],lungeSupport:[1700,1200,450,250],
  sideAbd:[1000,1500,350,900],
  legPress:[2000,1100,400,350],latPull:[1100,2000,350,450],chestPress:[1100,2000,350,300],cableRow:[1100,1900,350,550],
  legCurl:[1100,1900,350,450],hipAbdM:[1000,1800,350,800],pushWall:[1700,1100,350,250],pushTable:[1700,1100,350,250],pushKnees:[1700,1100,350,250],pushFloor:[1700,1100,350,250]};
 const wrap=(name,t)=>{const f=ANIM[name];if(!f)return;ANIM[name]=function(...a){const an=f.apply(this,a);if(an&&an.k&&an.k.length===2&&!an.wrap){an.durs=[t[0],t[1]];an.holds=[t[2],t[3]];delete an.dur;delete an.hold;}return an;};};
 for(const n in T)wrap(n,T[n]);
 const r=ANIM.rdl;ANIM.rdl=function(L,deep,bar){const an=r(L,deep,bar);an.durs=[2000,1200];an.holds=[450,300];return an;};
 const be=ANIM.backExt;ANIM.backExt=function(L,full){const an=be(L,full);an.durs=[1800,1300];an.holds=[700,250];return an;};
 const pa=ANIM.pallof;ANIM.pallof=function(L,k){const an=pa(L,k);an.durs=[1200,1200];an.holds=[400,2000];return an;};
})();

/* ===== level-4 variants: barbell on the back, leg extension ===== */
function bbArms(L,p){const sh=shOf(L,p);const u=[Math.sin(dg(p.t)),-Math.cos(dg(p.t))],f=[Math.cos(dg(p.t)),Math.sin(dg(p.t))];
  const h=[sh[0]-f[0]*2.6+u[0]*0.5,sh[1]-f[1]*2.6+u[1]*0.5];return {na:{to:h,b:-1,sp:L.shW*1.05,spE:L.shW*1.3},fa:{to:h,b:-1,sp:L.shW*1.05,spE:L.shW*1.3}};}
Object.assign(ANIM,{
 backSquat:L=>{const FY=FYa(L);const s=standP(L,{nl:{to:[101.5,FY],sp:2.2},fl:{to:[98.5,FY],sp:2.2}});const {hip}=hipFromFoot(L,[101.5,FY],-30,84);
   const b=mix(s,{x:hip[0],y:hip[1],t:38,h:-26});Object.assign(s,bbArms(L,s));Object.assign(b,bbArms(L,b));
   return {k:[s,b],durs:[2100,1300],holds:[500,250],hand:{all:'pron'},curl:{all:1},dyn:'barbellBack'};},
 lungeBB:L=>{const {s,b}=ANIM.lungeBase(L);const S=Object.assign(mix(s,{}),bbArms(L,s)),B=Object.assign(mix(b,{}),bbArms(L,b));
   return {k:[S,B],durs:[1800,1300],holds:[500,250],hand:{all:'pron'},curl:{all:1},dyn:'barbellBack'};},
 legExt:L=>{const st=seatTopFor(L)-6,hx=92,t=-12;const p=seatP(L,st,hx,t);
   const legA=s=>({a:[90,s],sp:1.2});
   const a=mix(p,{nl:legA(4),fl:legA(4),na:{to:[hx+4,p.y+3],b:1,sp:4},fa:{to:[hx+4,p.y+3],b:1,sp:4}}),b=mix(a,{nl:legA(84),fl:legA(84)});
   return {k:[a,b],durs:[1100,2000],holds:[400,700],curl:{all:1},ground:false,footRelax:-5,
     props:[['legCurl',{st,hx,t,hb:L.hipBack,T:L.T,kx:hx+L.TH,ky:p.y,SH:L.SH,ext:1}]],dyn:{type:'legCurl',kx:X3(hx+L.TH),ky:Y3(p.y),ext:1}};},
});

ANIM.backSquatR=L=>{const a=ANIM.backSquat(L);a.props=[['rack',{y:Y3(shOf(L,a.k[0])[1])-0.05}]];return a;};
ANIM.lungeBBR=L=>{const a=ANIM.lungeBB(L);a.props=[['rack',{y:Y3(shOf(L,a.k[0])[1])-0.05,x:-0.55}]];return a;};
