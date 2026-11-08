/* ===== props, dynamic objects, scene helpers ===== */
const X3=x=>(x-100)/U60, Y3=y=>(FLY-y)/U60;
let PMAT=null;
/* ---------- procedural textures ---------- */
const TEXC={};
function cvTex(key,size,draw,o){if(TEXC[key])return TEXC[key];const c=document.createElement('canvas');c.width=c.height=size;draw(c.getContext('2d'),size);
  const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;if(o&&o.srgb)t.encoding=THREE.sRGBEncoding;if(o&&o.rep)t.repeat.set(o.rep,o.rep);TEXC[key]=t;return t;}
function heightToNormal(g,size,strength){const id=g.getImageData(0,0,size,size),d=id.data,h=new Float32Array(size*size);for(let i=0;i<size*size;i++)h[i]=d[4*i]/255;
  const o=g.createImageData(size,size),q=o.data;for(let y=0;y<size;y++)for(let x=0;x<size;x++){const H=(xx,yy)=>h[((yy+size)%size)*size+((xx+size)%size)];
    const dx=(H(x+1,y)-H(x-1,y))*strength,dy=(H(x,y+1)-H(x,y-1))*strength;const l=Math.hypot(dx,dy,1);const i=4*(y*size+x);q[i]=(-dx/l*0.5+0.5)*255;q[i+1]=(dy/l*0.5+0.5)*255;q[i+2]=(1/l*0.5+0.5)*255;q[i+3]=255;}
  g.putImageData(o,0,0);}
function noiseFill(g,size,n,rmin,rmax,alpha){for(let i=0;i<n;i++){const v=Math.random()*255|0;g.fillStyle=`rgba(${v},${v},${v},${alpha})`;const r=rmin+Math.random()*(rmax-rmin);g.beginPath();g.arc(Math.random()*size,Math.random()*size,r,0,7);g.fill();}}
const NRM={
  leather:()=>cvTex('leather',256,(g,S)=>{g.fillStyle='#808080';g.fillRect(0,0,S,S);noiseFill(g,S,2600,0.8,2.6,0.25);noiseFill(g,S,900,2,5,0.12);heightToNormal(g,S,2.2);},{rep:6}),
  knit:()=>cvTex('knit',256,(g,S)=>{g.fillStyle='#808080';g.fillRect(0,0,S,S);for(let y=0;y<S;y+=4)for(let x=0;x<S;x+=4){const v=110+((x/4+y/4)%2)*60+Math.random()*30;g.fillStyle=`rgb(${v},${v},${v})`;g.beginPath();g.ellipse(x+2,y+2,1.6,2.1,0,0,7);g.fill();}heightToNormal(g,S,1.4);},{rep:14}),
  knurl:()=>cvTex('knurl',128,(g,S)=>{g.fillStyle='#808080';g.fillRect(0,0,S,S);g.strokeStyle='#d0d0d0';g.lineWidth=2;for(let i=-S;i<2*S;i+=8){g.beginPath();g.moveTo(i,0);g.lineTo(i+S,S);g.stroke();g.beginPath();g.moveTo(i,S);g.lineTo(i+S,0);g.stroke();}heightToNormal(g,S,3);},{rep:4}),
  rubber:()=>cvTex('rubberN',512,(g,S)=>{g.fillStyle='#808080';g.fillRect(0,0,S,S);noiseFill(g,S,16000,0.5,1.3,0.35);heightToNormal(g,S,1.5);},{rep:1}),
};
const MAPS={
  wood:()=>cvTex('wood',512,(g,S)=>{g.fillStyle='#b98f62';g.fillRect(0,0,S,S);for(let i=0;i<220;i++){const y=Math.random()*S;g.strokeStyle=`rgba(${90+Math.random()*40|0},${55+Math.random()*25|0},${25+Math.random()*15|0},${0.10+Math.random()*0.25})`;g.lineWidth=0.6+Math.random()*2.2;g.beginPath();g.moveTo(0,y);for(let x=0;x<=S;x+=16)g.lineTo(x,y+Math.sin(x/60+i)*3+Math.sin(x/13+i*3)*0.8);g.stroke();}},{srgb:true,rep:1}),
  floorWood:()=>cvTex('floorWood',1024,(g,S)=>{const rows=18,pw=S/rows;for(let r=0;r<rows;r++){let x=-(Math.random()*S*0.3);while(x<S){const L=S*(0.18+Math.random()*0.25);const base=[188+Math.random()*22,162+Math.random()*18,128+Math.random()*16];
      g.fillStyle=`rgb(${base.map(v=>v|0)})`;g.fillRect(x,r*pw,L,pw);for(let i=0;i<14;i++){const y=r*pw+Math.random()*pw;g.strokeStyle=`rgba(110,72,40,${0.06+Math.random()*0.16})`;g.lineWidth=0.5+Math.random()*1.2;g.beginPath();g.moveTo(x,y);for(let xx=0;xx<=L;xx+=20)g.lineTo(x+xx,y+Math.sin(xx/50+i)*1.5);g.stroke();}
      g.fillStyle='rgba(60,40,25,0.5)';g.fillRect(x,r*pw,1.5,pw);x+=L;}g.fillStyle='rgba(60,40,25,0.45)';g.fillRect(0,r*pw,S,1.5);}},{srgb:true,rep:1}),
  rubber:()=>cvTex('rubber',1024,(g,S)=>{g.fillStyle='#34373c';g.fillRect(0,0,S,S);for(let i=0;i<60000;i++){const c=Math.random();g.fillStyle=c<0.93?`rgba(${70+Math.random()*30|0},${72+Math.random()*30|0},${78+Math.random()*30|0},0.5)`:'rgba(120,128,138,0.65)';g.fillRect(Math.random()*S,Math.random()*S,1.2+Math.random()*1.6,1.2+Math.random()*1.6);}
      g.fillStyle='rgba(15,16,18,0.9)';for(let k=0;k<5;k++){g.fillRect(k*S/5,0,2,S);g.fillRect(0,k*S/5,S,2);}},{srgb:true,rep:1}),
  radial:()=>cvTex('radial',256,(g,S)=>{const gr=g.createRadialGradient(S/2,S/2,S*0.18,S/2,S/2,S/2);gr.addColorStop(0,'#fff');gr.addColorStop(0.7,'#bbb');gr.addColorStop(1,'#000');g.fillStyle=gr;g.fillRect(0,0,S,S);}),
  mat:()=>cvTex('matT',256,(g,S)=>{g.fillStyle='#7fb09c';g.fillRect(0,0,S,S);noiseFill(g,S,3000,0.5,1.2,0.08);},{srgb:true,rep:3}),
};

function propMats(){if(PMAT)return PMAT;
  const S=(c,r,m,o)=>{const x=new THREE.MeshStandardMaterial(Object.assign({color:c,roughness:r,metalness:m||0},o||{}));x.color.convertSRGBToLinear();return x;};
  const lea=NRM.leather(),kn=NRM.knurl();
  PMAT={wood:S(0xffffff,.55,0,{map:MAPS.wood()}),woodD:S(0xd9c2a5,.6,0,{map:MAPS.wood()}),pad:S(0x23272c,.55,0,{normalMap:lea,normalScale:new THREE.Vector2(.5,.5)}),metal:S(0x9aa3ad,.3,.7),dark:S(0x2e3238,.42,.55),plate:S(0x1d1f22,.5,.35),plateR:S(0x2a2d31,.45,.4),
    mat:S(0x86b5a2,.88,0,{map:MAPS.mat()}),wall:S(0xeee8de,.95),band:S(0xf0862b,.5),bandB:S(0x2f7fd0,.5),bar:S(0xd8dde2,.22,1,{normalMap:kn,normalScale:new THREE.Vector2(.6,.6)}),handle:S(0xd2d7dc,.25,1,{normalMap:kn,normalScale:new THREE.Vector2(.7,.7)}),
    frame:S(0xb9c0c8,.35,.6),frameD:S(0x2b2f35,.42,.55),uph:S(0x1e2226,.5,0,{normalMap:lea,normalScale:new THREE.Vector2(.55,.55)}),uphA:S(0xd2553f,.5),cable:S(0x15171a,.5,.2),chrome:S(0xeef1f4,.12,1),stack:S(0x2a2d31,.38,.6),
    belt:S(0x1b1d20,.85,0,{normalMap:NRM.rubber()}),deck:S(0x4a5058,.45,.5),screen:S(0x0d1620,.15,.3),
    gymF:S(0xffffff,.92,0,{map:MAPS.rubber(),normalMap:NRM.rubber(),alphaMap:MAPS.radial(),transparent:true}),
    homeF:S(0xd2cec8,.62,0,{map:MAPS.floorWood(),alphaMap:MAPS.radial(),transparent:true}),
    rubberC:S(0x111214,.8),silver:S(0xc5ccd3,.3,.85)};
  return PMAT;}
/* rounded box geometry with smooth normals */
const RBG={};
function rbGeo(w,h,d,r){r=Math.max(0.0008,Math.min(r,w/2-1e-4,h/2-1e-4,d/2-1e-4));const k=[w,h,d,r].map(v=>v.toFixed(4)).join();if(RBG[k])return RBG[k];
  const n=10,g=new THREE.BoxGeometry(1,1,1,n,n,n);const P=g.attributes.position,N=g.attributes.normal,half=[w/2,h/2,d/2];
  const inner=half.map(v=>v-r);const v=new THREE.Vector3(),c=new THREE.Vector3(),nn=new THREE.Vector3();
  for(let i=0;i<P.count;i++){const q=[P.getX(i),P.getY(i),P.getZ(i)];
    for(let a=0;a<3;a++){const t=Math.abs(q[a])*2,sg=Math.sign(q[a]);const A=0.2;q[a]=sg*(t<A?t/A*inner[a]:inner[a]+(t-A)/(1-A)*r);}
    v.set(q[0],q[1],q[2]);c.set(Math.max(-inner[0],Math.min(inner[0],v.x)),Math.max(-inner[1],Math.min(inner[1],v.y)),Math.max(-inner[2],Math.min(inner[2],v.z)));
    nn.subVectors(v,c);if(nn.lengthSq()>1e-12){nn.normalize();v.copy(c).addScaledVector(nn,r);N.setXYZ(i,nn.x,nn.y,nn.z);}P.setXYZ(i,v.x,v.y,v.z);}
  P.needsUpdate=true;N.needsUpdate=true;g.computeBoundingSphere();RBG[k]=g;return g;}
function pbox(sc,mat,x0,x1,y0,y1,z0,z1,rr){const w=x1-x0,h=y1-y0,d=z1-z0;const m=new THREE.Mesh(rbGeo(w,h,d,rr!=null?rr:Math.min(0.012,Math.min(w,h,d)*0.22)),mat);m.position.set((x0+x1)/2,(y0+y1)/2,(z0+z1)/2);m.castShadow=true;m.receiveShadow=true;sc.add(m);return m;}
function rbox(sc,mat,x0,x1,y0,y1,z0,z1,r){ // rounded pad via scaled box + edge cylinders (simple)
  return pbox(sc,mat,x0,x1,y0,y1,z0,z1);}
function buildProps(sc,props,opts){
  const M=propMats();const bb=new THREE.Box3();
  const add=o=>{bb.expandByObject(o);return o;};
  const isGym=(props||[]).some(x=>MACH[x[0]]);
  const fl=new THREE.Mesh(new THREE.PlaneGeometry(5.2,5.2),isGym?M.gymF:M.homeF);fl.rotation.x=-Math.PI/2;fl.position.y=0.0005;fl.receiveShadow=true;fl.renderOrder=-1;fl.material.depthWrite=false;sc.add(fl);
  if((!opts||opts.mat!==false)&&!isGym) pbox(sc,M.mat,-0.95,0.95,0.001,0.011,-0.33,0.33,0.005);
  for(const [type,p] of (props||[])){
    if(type==='chair'||type==='chair2'||type==='chairF'){
      const x0=X3(p.x0),x1=X3(p.x1),top=Y3(p.top),z=0.22;
      add(pbox(sc,M.wood,x0,x1,top-0.035,top,-z,z));
      [[x0+0.025,-z+0.025],[x0+0.025,z-0.025],[x1-0.025,-z+0.025],[x1-0.025,z-0.025]].forEach(([x,zz])=>add(pbox(sc,M.woodD,x-0.018,x+0.018,0,top-0.035,zz-0.018,zz+0.018)));
      const bx=type==='chair2'?x1:x0;const btop=p.back!=null?Y3(p.back):top+0.42;
      add(pbox(sc,M.wood,bx-(type==='chair2'?0.03:0),bx+(type==='chair2'?0:0.03),top,btop,-z,z));
    } else if(type==='table'){
      const x0=X3(p.x0),x1=X3(p.x1),top=Y3(p.top);
      add(pbox(sc,M.wood,x0,x1,top-0.04,top,-0.45,0.45));
      [[x0+0.04,-0.4],[x0+0.04,0.4],[x1-0.04,-0.4],[x1-0.04,0.4]].forEach(([x,z])=>add(pbox(sc,M.woodD,x-0.022,x+0.022,0,top-0.04,z-0.022,z+0.022)));
    } else if(type==='wall'){
      add(pbox(sc,M.wall,X3(p.x),X3(p.x)+0.12,0,2.3,-0.95,0.95));
    } else if(type==='bench'||type==='benchP'||type==='benchHT'){
      const x0=X3(p.x0),x1=X3(p.x1),top=Y3(p.top),L=x1-x0;const pt=0.065,w=0.27;
      const seatL=Math.min(0.40,L*0.36);
      add(rpad(sc,M.pad,v3(x1-seatL/2,top-pt/2,0),[seatL,pt,w]));add(rpad(sc,M.pad,v3(x0+(L-seatL-0.02)/2,top-pt/2,0),[L-seatL-0.02,pt,w]));
      const ry=top-pt-0.05;pbox(sc,M.dark,x0+0.06,x1-0.06,ry-0.03,ry+0.03,-0.03,0.03,0.008);
      [[x1-0.10,1],[x0+0.10,0]].forEach(([x,front])=>{pbox(sc,M.dark,x-0.028,x+0.028,0.05,ry-0.02,-0.028,0.028,0.008);pbox(sc,M.dark,x-0.03,x+0.03,0.02,0.07,-0.23,0.23,0.008);
        [-0.235,0.235].forEach(z=>{if(front){const c=pbox(sc,M.rubberC,x-0.032,x+0.032,0,0.03,z-0.022,z+0.022,0.01);}else{const wh=cylZ(sc,M.rubberC,x-0.035,0.035,z-0.012,z+0.012,0.035,20);}});});
      tube(sc,M.silver,v3(x0+0.25,ry-0.02,0),v3(x0+0.42,ry-0.12,0),0.012);
    } else if(MACH[type]){MACH[type](sc,p,M,add);
    } else if(type==='bar'){
      const y=Y3(p.y);const g=new THREE.CylinderGeometry(0.016,0.016,1.24,18);const b=new THREE.Mesh(g,M.bar);b.rotation.x=Math.PI/2;b.position.set(0,y,0);b.castShadow=true;sc.add(b);add(b);
      [-0.64,0.64].forEach(z=>{add(pbox(sc,M.dark,-0.035,0.035,0,y+0.06,z-0.035,z+0.035,0.012));pbox(sc,M.dark,-0.035,0.035,y-0.03,y+0.03,z-(z>0?0.06:-0.0),z+(z>0?0:0.06),0.01);
        pbox(sc,M.dark,-0.32,0.32,0,0.05,z-0.04,z+0.04,0.012);[-0.3,0.3].forEach(x=>pbox(sc,M.rubberC,x-0.03,x+0.03,0,0.012,z-0.045,z+0.045,0.005));});
    }
  }
  return bb;
}
function latheDisc(R,T,lip,hole){const pts=[];const r0=hole||0.016,e=Math.min(0.006,T*0.3);
  pts.push(new THREE.Vector2(r0,-T/2),new THREE.Vector2(R-e,-T/2),new THREE.Vector2(R-e*0.3,-T/2+e*0.3),new THREE.Vector2(R,-T/2+e),new THREE.Vector2(R,T/2-e),new THREE.Vector2(R-e*0.3,T/2-e*0.3),new THREE.Vector2(R-e,T/2));
  if(lip){pts.push(new THREE.Vector2(R-lip,T/2),new THREE.Vector2(R-lip-0.004,T/2-T*0.3),new THREE.Vector2(r0+0.02,T/2-T*0.3),new THREE.Vector2(r0+0.016,T/2));}
  pts.push(new THREE.Vector2(r0,T/2));return new THREE.LatheGeometry(pts,40);}
const DBG={};
function makeDumbbell(sc,kg){const M=propMats();const g=new THREE.Group();
  if(!DBG.h){DBG.h=new THREE.CylinderGeometry(0.0145,0.0145,0.135,18);DBG.sl=new THREE.CylinderGeometry(0.0125,0.0125,0.06,16);DBG.p1=latheDisc(0.062,0.026,0.012,0.0135);DBG.p2=latheDisc(0.052,0.022,0.01,0.0135);DBG.p3=latheDisc(0.044,0.018,0,0.0135);
    DBG.col=new THREE.CylinderGeometry(0.024,0.024,0.018,20);DBG.inner=new THREE.CylinderGeometry(0.021,0.021,0.008,20);}
  const h=new THREE.Mesh(DBG.h,M.handle);g.add(h);
  const n=kg&&kg>12?3:2;
  for(const s of [-1,1]){const inr=new THREE.Mesh(DBG.inner,M.silver);inr.position.y=s*0.071;g.add(inr);
    const sl=new THREE.Mesh(DBG.sl,M.chrome);sl.position.y=s*0.1;g.add(sl);
    let y=0.075;[DBG.p1,DBG.p2,DBG.p3].slice(0,n).forEach((geo,i)=>{const T=[0.026,0.022,0.018][i];const p=new THREE.Mesh(geo,M.plate);p.position.y=s*(y+T/2);if(s<0)p.rotation.x=Math.PI;g.add(p);y+=T+0.001;});
    const c=new THREE.Mesh(DBG.col,M.chrome);c.position.y=s*(y+0.009);g.add(c);}
  g.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});sc.add(g);return g;}
function makeBarbell(sc){const M=propMats();const g=new THREE.Group();
  const bar=new THREE.Mesh(new THREE.CylinderGeometry(0.014,0.014,1.32,16),M.bar);g.add(bar);
  for(const s of [-1,1]){const sl=new THREE.Mesh(new THREE.CylinderGeometry(0.025,0.025,0.26,18),M.chrome);sl.position.y=s*0.79;g.add(sl);
    const st=new THREE.Mesh(new THREE.CylinderGeometry(0.034,0.034,0.03,20),M.chrome);st.position.y=s*0.65;g.add(st);
    const p=new THREE.Mesh(latheDisc(0.15,0.034,0.025,0.026),M.plate);p.position.y=s*0.685;if(s<0)p.rotation.x=Math.PI;g.add(p);
    const p2=new THREE.Mesh(latheDisc(0.11,0.028,0.018,0.026),M.plateR);p2.position.y=s*0.719;if(s<0)p2.rotation.x=Math.PI;g.add(p2);
    const col=new THREE.Mesh(new THREE.CylinderGeometry(0.036,0.036,0.035,16),M.dark);col.position.y=s*0.752;g.add(col);}
  g.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});sc.add(g);return g;}
function makeBand(sc,mat){const m=new THREE.Mesh(new THREE.CylinderGeometry(0.007,0.007,1,8),mat||propMats().band);m.castShadow=true;sc.add(m);return m;}
function placeSeg3(o,a,b){const d=b.clone().sub(a);const L=d.length()||1e-4;o.position.copy(a).addScaledVector(d,.5);o.scale.set(1,L,1);o.quaternion.setFromUnitVectors(v3(0,1,0),d.multiplyScalar(1/L));}
function orientY(o,pos,axis){o.position.copy(pos);o.quaternion.setFromUnitVectors(v3(0,1,0),axis.clone().normalize());}
function buildDyn(sc,inst,dyn,props){
  if(dyn&&typeof dyn==='object')return machDyn(sc,inst,dyn,props);
  const D={type:dyn,objs:[]};if(!dyn) return D;
  if(dyn==='db2') D.objs=[makeDumbbell(sc),makeDumbbell(sc)];
  else if(dyn==='db1'||dyn==='goblet'||dyn==='hipdb') D.objs=[makeDumbbell(sc)];
  else if(dyn==='barbell'||dyn==='barbellBack') D.objs=[makeBarbell(sc)];
  else if(dyn==='bandRow') D.objs=[makeBand(sc),makeBand(sc)];
  else if(dyn==='bandKnees') D.objs=[makeBand(sc,propMats().bandB)];
  else if(dyn==='bandHam') D.objs=[makeBand(sc),makeBand(sc)];
  return D;
}
function updateDyn(D,inst){
  if(!D||!D.type) return;if(D.type==='mach')return machUpdate(D,inst);const t=D.type,o=D.objs;
  if(t==='db2'){['R','L'].forEach((s,i)=>orientY(o[i],gripOf(inst,s),palmAxis(inst,s)));}
  else if(t==='db1'){orientY(o[0],gripOf(inst,'R'),palmAxis(inst,'R'));}
  else if(t==='goblet'){const a=palmOf(inst,'R'),b=palmOf(inst,'L');const c=a.clone().lerp(b,.5);
    const fw=boneWorld(inst,'spine01',inst.A.lm.shC.clone().add(v3(0.2,0,0))).sub(boneWorld(inst,'spine01',inst.A.lm.shC));fw.y=0;fw.normalize();
    orientY(o[0],c.addScaledVector(fw,0.012).add(v3(0,0.075,0)),v3(0,1,0));}
  else if(t==='barbellBack'){const a=gripOf(inst,'R'),b=gripOf(inst,'L');const n=boneWorld(inst,'neck01',inst.A.B['neck01'].h);const c=a.clone().lerp(b,.5);c.y=Math.max(c.y,n.y-0.06);c.addScaledVector(v3(1,0,0).applyQuaternion(inst.bones[inst.A.B["spine01"].i].quaternion).setY(0).normalize(),-0.025);const ax=a.clone().sub(b);ax.y=0;orientY(o[0],c,ax.lengthSq()>1e-6?ax:v3(0,0,1));}
  else if(t==='barbell'){const a=gripOf(inst,'R'),b=gripOf(inst,'L');const c=a.clone().lerp(b,.5);orientY(o[0],c,a.clone().sub(b));}
  else if(t==='hipdb'){const p=boneWorld(inst,'pelvis',inst.A.lm.hipC.clone().add(v3(0.12,0.06,0)));orientY(o[0],p,v3(0,0,1));}
  else if(t==='bandRow'){['R','L'].forEach((s,i)=>{const ft=boneWorld(inst,'foot.'+s,inst.A.B['foot.'+s].t.clone().add(v3(0.03,-0.02,0)));placeSeg3(o[i],ft,gripOf(inst,s));});}
  else if(t==='bandKnees'){const a=boneWorld(inst,'shin.R',inst.A.B['shin.R'].h.clone().add(v3(0,0.06,0))),b=boneWorld(inst,'shin.L',inst.A.B['shin.L'].h.clone().add(v3(0,0.06,0)));placeSeg3(o[0],a,b);}
  else if(t==='bandHam'){const s=inst.A.foot&&'R';const ft=boneWorld(inst,'foot.R',inst.A.B['foot.R'].t.clone().add(v3(0.02,-0.02,0)));['R','L'].forEach((s,i)=>placeSeg3(o[i],gripOf(inst,s),ft));}
}
let ENVTEX=null;
function initLook(renderer){if(ENVTEX||!renderer)return;try{const pm=new THREE.PMREMGenerator(renderer);const room=new THREE.Scene();
  const wall=new THREE.MeshStandardMaterial({side:THREE.BackSide,color:0x9a9a9c,roughness:1});const box=new THREE.Mesh(new THREE.BoxGeometry(14,7,14),wall);box.position.y=3;room.add(box);
  const fl=new THREE.Mesh(new THREE.PlaneGeometry(14,14),new THREE.MeshStandardMaterial({color:0x707072,roughness:1}));fl.rotation.x=-Math.PI/2;fl.position.y=-0.49;room.add(fl);
  const L=(x,y,z,sx,sy,sz,i,warm)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz),new THREE.MeshBasicMaterial({color:new THREE.Color(i,i*(warm?0.98:1),i*(warm?0.95:1))}));m.position.set(x,y,z);room.add(m);};
  L(0,6.3,0,5,0.1,2.2,9);L(-6.8,3,1.5,0.1,2.4,4,4.5,1);L(6.8,2.6,-2,0.1,2,2.5,2.4);L(0,2.4,6.8,5,2,0.1,1.8,1);
  room.add(new THREE.HemisphereLight(0xffffff,0x6a6a6c,1.2));
  ENVTEX=pm.fromScene(room,0.035).texture;pm.dispose();}catch(e){ENVTEX=null;}}
function makeScene(){
  const sc=new THREE.Scene();if(ENVTEX){sc.environment=ENVTEX;}
  sc.add(new THREE.HemisphereLight(0xffffff,0xb9ad9a,ENVTEX?0.25:0.75));
  const d=new THREE.DirectionalLight(0xfffaf4,ENVTEX?1.0:1.05);d.position.set(1.6,3.4,2.4);d.castShadow=true;d.shadow.mapSize.set(1024,1024);
  Object.assign(d.shadow.camera,{left:-2.4,right:2.4,top:2.8,bottom:-1.2,near:.5,far:9});d.shadow.bias=-0.0004;d.shadow.normalBias=0.012;sc.add(d);
  const f2=new THREE.DirectionalLight(0xe8f0ff,ENVTEX?0.18:0.25);f2.position.set(-2,1.5,-1.5);sc.add(f2);
  const fl=new THREE.Mesh(new THREE.PlaneGeometry(14,14),new THREE.ShadowMaterial({opacity:.18}));fl.rotation.x=-Math.PI/2;fl.receiveShadow=true;sc.add(fl);
  return sc;
}
/* animation timing */
const easeIO=k=>k*k*k*(10-15*k+6*k*k); // minimum-jerk profile (how people actually move)
function rawPoseAt(an,now){
  const k=an.k,n=an.wrap?k.length-1:k.length;
  const dur=i=>an.durs?an.durs[i%an.durs.length]:(an.dur||1200);
  const hold=i=>an.holds?an.holds[i%an.holds.length]:(an.wrap?0:(an.hold!=null?an.hold:450));
  let tot=0;for(let i=0;i<n;i++)tot+=hold(i)+dur(i);
  let T=((now%tot)+tot)%tot,i=0;
  for(;i<n;i++){const h=hold(i),d=dur(i);if(T<h) return k[i];T-=h;if(T<d){const kk=an.wrap?T/d:easeIO(T/d);return lerpPose(k[i],k[(i+1)%k.length],kk);}T-=d;}
  return k[0];
}
function poseAtTime(an,now){
  const p=rawPoseAt(an,now);if(an.wrap||an.natural===false)return p;
  const o=Object.assign({},p);
  // arms trail the trunk slightly, head trails a bit more -> less robotic
  const pa=rawPoseAt(an,now-80),ph=rawPoseAt(an,now-140);
  if(pa.na&&p.na&&!(p.na.to&&pa.na.a))o.na=pa.na;if(pa.fa&&p.fa&&!(p.fa.to&&pa.fa.a))o.fa=pa.fa;
  if(ph.h!=null)o.h=ph.h;
  // breathing + tiny postural sway (never fully frozen)
  const w=x=>Math.sin(2*Math.PI*now/x);
  o.t=(o.t||0)+0.35*w(3700)+0.15*w(1700);o.c=(o.c||0)+0.25*w(4300);o.h=(o.h||0)+0.9*w(5300)+0.4*w(2300);
  return o;
}
function lerpPose(a,b,k){
  if(typeof a==='number') return a+(b-a)*k;
  if(Array.isArray(a)) return a.map((v,i)=>lerpPose(v,b[i],k));
  if(a&&typeof a==='object'){const o={};for(const key in a){if(key==='b'){o[key]=a[key];continue;}
    const bv=(b&&b[key]!==undefined)?b[key]:a[key];
    if(a[key]&&b&&b[key]&&typeof a[key]==='object'&&((a[key].a&&b[key].to)||(a[key].to&&b[key].a))){o[key]=k<0.5?a[key]:b[key];continue;}
    o[key]=lerpPose(a[key],bv,k);}
    if(b) for(const key in b) if(o[key]===undefined) o[key]=b[key];
    return o;}
  return a;
}
/* normalise mixed limb specs (angle vs target) to angles so they interpolate smoothly */
function normalizeAnim(an,L){
  const limbs=[['na',1,false],['fa',1,false],['nl',-1,true],['fl',-1,true]];
  for(const [key,b,leg] of limbs){
    const kinds=new Set(an.k.map(p=>p[key]?(p[key].a?'a':'to'):'none'));
    if(kinds.size<=1) continue;
    an.k=an.k.map(p=>{const q=Object.assign({},p);const s=p[key]||(leg?{a:[0,0]}:{a:[3,3]});
      if(s.a){q[key]=s;return q;}
      const root=leg?[p.x,p.y]:[p.x+L.T*Math.sin(p.t*D2R),p.y-L.T*Math.cos(p.t*D2R)];
      const [m,e]=ik2(root,s.to,leg?L.TH:L.UA,leg?L.SH:L.FA,s.b??b);
      q[key]={a:[Math.atan2(m[0]-root[0],m[1]-root[1])/D2R,Math.atan2(e[0]-m[0],e[1]-m[1])/D2R],sp:s.sp,spE:s.spE};
      // unwrap relative to previous? keep simple
      return q;});
  }
  return an;
}
function animFor(fn,L){const an=fn(L);return normalizeAnim(an,L);}

/* ===== fitness machines ===== */
function obox(sc,mat,c,size,rz,rx){const m=new THREE.Mesh(rbGeo(size[0],size[1],size[2],Math.min(0.012,Math.min(...size)*0.25)),mat);m.position.copy(c);if(rz)m.rotation.z=rz;if(rx)m.rotation.x=rx;m.castShadow=true;m.receiveShadow=true;sc.add(m);return m;}
function rpad(sc,mat,c,size,rz){ // upholstered pad: soft rounded edges + stitched seam line
  const g=new THREE.Group();const [lx,ly,lz]=size;const t=Math.min(lx,ly,lz);
  const core=new THREE.Mesh(rbGeo(lx,ly,lz,t*0.42),mat);g.add(core);
  const M=propMats();const base=new THREE.Mesh(rbGeo(lx*0.92+(lx===t?0.012:0),ly*0.92+(ly===t?0.012:0),lz*0.94,0.006),M.frameD);
  // thin plywood/steel base on the back side of the pad
  const ax=lx===t?0:(ly===t?1:2);const off=new THREE.Vector3();off.setComponent(ax,-[lx,ly,lz][ax]*0.5-0.004);base.scale.setComponent(ax,0.18/ ([lx,ly,lz][ax]/t));base.position.copy(off);g.add(base);
  g.position.copy(c);if(rz)g.rotation.z=rz;g.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});sc.add(g);return g;}
function cylZ(sc,mat,x,y,z0,z1,r,seg){const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,Math.abs(z1-z0),seg||16),mat);m.rotation.x=Math.PI/2;m.position.set(x,y,(z0+z1)/2);m.castShadow=true;m.receiveShadow=true;sc.add(m);return m;}
function cylX(sc,mat,x0,x1,y,z,r){const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,Math.abs(x1-x0),14),mat);m.rotation.z=Math.PI/2;m.position.set((x0+x1)/2,y,z);m.castShadow=true;sc.add(m);return m;}
function tube(sc,mat,a,b,r){const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,1,12),mat);placeSeg3(m,a,b);m.castShadow=true;m.receiveShadow=true;sc.add(m);return m;}
function post(sc,M,x,z,h,w){return obox(sc,M.frameD,v3(x,h/2,z),[w||0.07,h,w||0.07]);}
function makeStack(sc,M,x,z,y0,n){ // weight stack: guide rods + plates; returns moving group
  n=n||14;const pw=0.30,pd=0.11,ph=0.028;
  obox(sc,M.frameD,v3(x,y0-0.02,z),[pd+0.08,0.04,pw+0.12]);
  [-1,1].forEach(sg=>tube(sc,M.chrome,v3(x,y0,z+sg*0.1),v3(x,y0+n*ph+0.75,z+sg*0.1),0.009));
  const mv=new THREE.Group();sc.add(mv);
  for(let i=0;i<n;i++){const top=i>=n-4;const m=new THREE.Mesh(new THREE.BoxGeometry(pd,ph-0.003,pw),M.stack);m.position.set(x,y0+ph*(i+0.5),z);m.castShadow=true;m.receiveShadow=true;(top?mv:sc).add(m);}
  const pin=new THREE.Mesh(new THREE.CylinderGeometry(0.007,0.007,0.12,8),M.uphA);pin.rotation.z=Math.PI/2;pin.position.set(x+0.06,y0+ph*(n-3.5),z);mv.add(pin);
  const rod=new THREE.Mesh(new THREE.CylinderGeometry(0.006,0.006,0.6,8),M.chrome);rod.position.set(x,y0+n*ph+0.3,z);mv.add(rod);
  // shroud
  obox(sc,M.frameD,v3(x,y0+n*ph+0.8,z),[pd+0.08,0.05,pw+0.12]);
  return mv;}
function seatAndBack(sc,M,hx,st,t,hb,len,add){const sy=Y3(st),hX=X3(hx);
  add(rpad(sc,M.uph,v3(hX-(t!=null&&t<-15?0.05:0.0),sy-0.045,0),[0.40,0.09,0.40]));
  post(sc,M,hX+0.03,0,sy-0.09);obox(sc,M.frameD,v3(hX+0.03,0.025,0),[0.55,0.05,0.12]);
  if(t!=null){const tr=t*D2R,u=v3(Math.sin(tr),Math.cos(tr),0),nb=v3(-Math.cos(tr),Math.sin(tr),0);const hy=Y3(st-hb*0.92);
    const c=v3(hX,hy,0).addScaledVector(u,(len||0.6)/2+0.02).addScaledVector(nb,hb/U60*0.78+0.04);
    add(rpad(sc,M.uph,c,[0.08,len||0.6,0.40],-tr));
    const b0=c.clone().addScaledVector(nb,0.06);tube(sc,M.frameD,b0,v3(b0.x-0.05,sy-0.08,0),0.025);}
}
const MACH={
 legPress(sc,p,M,add){seatAndBack(sc,M,p.hx,p.st,p.t,p.hb,0.62,add);
   const y=Y3(p.fy)-0.32;[-0.2,0.2].forEach(z=>cylX(sc,M.chrome,X3(p.near)-0.05,X3(p.far)+0.35,y,z,0.018));
   obox(sc,M.frameD,v3((X3(p.hx)-0.3+X3(p.far)+0.6)/2,0.03,0),[X3(p.far)+0.6-X3(p.hx)+0.3,0.06,0.5]);
   [X3(p.near)-0.05,X3(p.far)+0.35].forEach(x=>post(sc,M,x,0,y+0.02,0.06));
   p._stack=makeStack(sc,M,X3(p.far)+0.62,0,0.08,14);
   // side handles
   [-1,1].forEach(sg=>{tube(sc,M.frameD,v3(X3(p.hx)+0.02,Y3(p.st)-0.08,sg*0.22),v3(X3(p.hx)+0.07,Y3(p.st)+0.02,sg*0.31),0.014);cylX(sc,M.uph,X3(p.hx)+0.0,X3(p.hx)+0.14,Y3(p.st)+0.03,sg*0.31,0.017);});
 },
 latPull(sc,p,M,add){seatAndBack(sc,M,p.hx,p.st,null,0,0,add);
   const kx=X3(p.kx),ky=Y3(p.kneeY)+0.115;[-1,1].forEach(sg=>cylZ(sc,M.uph,kx,ky,sg*0.03,sg*0.20,0.048,18));
   tube(sc,M.frameD,v3(kx,ky,0),v3(X3(p.hx)+0.1,Y3(p.st)-0.1,0),0.02);
   const px=X3(p.hx)-0.42;post(sc,M,px,0,2.3,0.09);obox(sc,M.frameD,v3((px+X3(p.topX)+0.05)/2,2.27,0),[X3(p.topX)+0.05-px+0.1,0.07,0.09]);
   cylZ(sc,M.chrome,X3(p.topX),2.21,-0.03,0.03,0.045,20);obox(sc,M.frameD,v3(px+0.0,0.03,0),[0.9,0.06,0.6]);
   p._stack=makeStack(sc,M,px-0.17,0,0.08,16);
 },
 chestPress(sc,p,M,add){seatAndBack(sc,M,p.hx,p.st,p.t,p.hb,0.66,add);
   const bx=X3(p.hx)-0.32;[-0.42,0.42].forEach(z=>post(sc,M,bx,z,Y3(p.hy)+0.7,0.07));obox(sc,M.frameD,v3(bx,Y3(p.hy)+0.7,0),[0.08,0.07,0.92]);
   obox(sc,M.frameD,v3(bx+0.15,0.03,0),[0.7,0.06,0.95]);p._stack=makeStack(sc,M,bx-0.25,0,0.08,14);
   p._piv=[v3(bx+0.02,Y3(p.hy)+0.62,-0.42),v3(bx+0.02,Y3(p.hy)+0.62,0.42)];
 },
 cableRow(sc,p,M,add){const sy=Y3(p.st);const x0=X3(p.hx)-0.4,x1=X3(p.feetX)-0.08;
   add(rpad(sc,M.uph,v3(X3(p.hx)+0.05,sy-0.045,0),[0.42,0.09,0.36]));obox(sc,M.frameD,v3((x0+x1)/2,sy-0.13,0),[x1-x0,0.08,0.12]);
   [x0+0.08,X3(p.hx)+0.2].forEach(x=>post(sc,M,x,0,sy-0.1,0.06));
   const fx=X3(p.feetX),fy=Y3(p.fy);obox(sc,M.frameD,v3(fx+0.018,fy-0.02,0),[0.035,0.34,0.44]);post(sc,M,fx+0.1,0,fy+0.1,0.07);
   cylZ(sc,M.chrome,fx+0.14,fy,-0.025,0.025,0.04,18);
   const tx=fx+0.42;post(sc,M,tx,0,2.0,0.08);obox(sc,M.frameD,v3((x0+tx)/2,0.03,0),[tx-x0+0.2,0.06,0.5]);p._stack=makeStack(sc,M,tx+0.15,0,0.08,14);
 },
 legCurl(sc,p,M,add){seatAndBack(sc,M,p.hx,p.st,p.t,p.hb,0.62,add);
   const kx=X3(p.kx),ky=Y3(p.ky);if(!p.ext){cylZ(sc,M.uph,kx-0.08,ky+0.11,-0.2,0.2,0.045,18);tube(sc,M.frameD,v3(kx-0.08,ky+0.11,-0.27),v3(kx-0.1,Y3(p.st)-0.1,-0.27),0.02);}
   cylZ(sc,M.chrome,kx,ky,-0.34,-0.24,0.035,18);obox(sc,M.frameD,v3(kx,ky/2,-0.3),[0.07,ky,0.07]);
   const bx=X3(p.hx)-0.4;p._stack=makeStack(sc,M,bx,0,0.08,14);obox(sc,M.frameD,v3((bx+kx)/2,0.03,-0.1),[kx-bx+0.3,0.06,0.6]);
 },
 hipAbd(sc,p,M,add){seatAndBack(sc,M,p.hx,p.st,p.t,p.hb,0.62,add);
   const kx=X3(p.kx);[-1,1].forEach(sg=>obox(sc,M.frameD,v3(kx+0.02,Y3(p.st)-0.28,sg*0.05),[0.08,0.06,0.06]));
   // foot pegs
   [-1,1].forEach(sg=>cylX(sc,M.frameD,kx+0.05,kx+0.22,0.14,sg*0.12,0.018));
   const bx=X3(p.hx)-0.42;p._stack=makeStack(sc,M,bx,0,0.08,14);obox(sc,M.frameD,v3((bx+kx)/2,0.03,0),[kx-bx+0.4,0.06,0.6]);
   p._piv=v3(kx+0.02,Y3(p.st)-0.28,0);
 },
 backExt(sc,p,M,add){const c=Math.SQRT1_2,w=v3(c,c,0),fr=v3(c,-c,0);const A=v3(X3(p.ax),Y3(p.ay),0),H=v3(X3(p.hx),Y3(p.hy),0);
   const plate=A.clone().addScaledVector(w,-p.ah/U60-0.018);obox(sc,M.frameD,plate,[0.035,0.30,0.42],-Math.PI/4);
   const rol=A.clone().addScaledVector(w,0.05).addScaledVector(fr,-0.10);[-1,1].forEach(sg=>cylZ(sc,M.uph,rol.x,rol.y,sg*0.02,sg*0.18,0.04,16));
   const pad=H.clone().addScaledVector(w,-0.10).addScaledVector(fr,0.135);add(rpad(sc,M.uph,pad,[0.08,0.36,0.40],-Math.PI/4));
   const beamA=plate.clone().addScaledVector(fr,0.12),beamB=pad.clone().addScaledVector(fr,0.07);tube(sc,M.frameD,beamA,beamB,0.035);
   tube(sc,M.frameD,beamA,v3(beamA.x-0.05,0.04,0),0.03);tube(sc,M.frameD,beamB,v3(beamB.x+0.15,0.04,0),0.03);
   tube(sc,M.frameD,rol.clone().addScaledVector(fr,-0.02),beamA,0.02);obox(sc,M.frameD,v3((beamA.x+beamB.x)/2+0.05,0.025,0),[beamB.x-beamA.x+0.5,0.05,0.6]);
 },
 rack(sc,p,M,add){const x=p.x||0,y=p.y,H=2.0;
   [-0.62,0.62].forEach(z=>{[-0.32,0.32].forEach(dx=>post(sc,M,x+dx,z,H,0.07));pbox(sc,M.frameD,x-0.4,x+0.4,0,0.05,z-0.05,z+0.05,0.012);
     pbox(sc,M.frameD,x-0.36,x+0.36,H-0.04,H+0.02,z-0.035,z+0.035,0.01);
     pbox(sc,M.uphA,x+0.27,x+0.4,y-0.03,y+0.03,z-0.03,z+0.03,0.008);
     pbox(sc,M.silver,x-0.42,x+0.62,0.48,0.53,z-0.03,z+0.03,0.01);});
   [0.02,H-0.03].forEach(yy=>pbox(sc,M.frameD,x+0.29,x+0.35,yy-0.03,yy+0.03,-0.62,0.62,0.01));},
 cableTower(sc,p,M,add){const x=X3(100),z=-0.9;post(sc,M,x-0.1,z,2.2,0.09);post(sc,M,x+0.1,z,2.2,0.09);obox(sc,M.frameD,v3(x,2.2,z),[0.3,0.07,0.1]);
   obox(sc,M.frameD,v3(x,0.03,z),[0.5,0.06,0.6]);cylZ(sc,M.chrome,x,Y3(p.y),z+0.04,z+0.1,0.04,18);obox(sc,M.frameD,v3(x,Y3(p.y),z+0.07),[0.1,0.12,0.04]);
   p._stack=makeStack(sc,M,x,z-0.18,0.08,14);},
 bike(sc,p,M,add){const cx=X3(p.cx),cy=Y3(p.cy),sx=X3(p.hx)-0.07,sy=Y3(p.st);
   obox(sc,M.frameD,v3(cx,0.03,0),[1.15,0.06,0.12]);[-0.55,0.55].forEach(dx=>obox(sc,M.frameD,v3(cx+dx,0.03,0),[0.08,0.06,0.55]));
   tube(sc,M.frameD,v3(cx,cy,0),v3(sx+0.03,sy-0.08,0),0.03);tube(sc,M.frameD,v3(sx+0.03,sy-0.04,0),v3(sx+0.06,sy-0.32,0),0.02);
   add(rpad(sc,M.uph,v3(sx,sy+0.025,0),[0.26,0.05,0.16]));
   const hx=X3(p.hb[0]),hy=Y3(p.hb[1]);tube(sc,M.frameD,v3(cx+0.3,0.05,0),v3(hx-0.05,hy-0.05,0),0.03);tube(sc,M.frameD,v3(cx-0.1,0.05,0),v3(cx,cy,0),0.03);
   cylZ(sc,M.uph,hx,hy,-0.27,0.27,0.016);
   const fw=cylZ(sc,M.frameD,cx+0.32,0.3,-0.02,0.02,0.24,32);cylZ(sc,M.chrome,cx+0.32,0.3,-0.025,0.025,0.06,16);
   tube(sc,M.frameD,v3(cx,cy,0),v3(cx+0.32,0.3,0),0.025);obox(sc,M.screen,v3(hx+0.03,hy+0.08,0),[0.05,0.1,0.16],0.5);},
 elliptical(sc,p,M,add){const cx=X3(p.cx),cy=Y3(p.cy);obox(sc,M.frameD,v3(cx+0.1,0.06,0),[1.6,0.12,0.24]);obox(sc,M.frameD,v3(cx+0.62,0.6,0),[0.12,1.15,0.14],0.2);
   obox(sc,M.screen,v3(cx+0.54,1.25,0),[0.06,0.2,0.32],0.6);cylZ(sc,M.frameD,cx+0.66,0.28,-0.16,0.16,0.18,28);
   p._piv=v3(cx+0.52,1.02,0);},
 treadmill(sc,p,M,add){const al=p.al,x0=X3(100),y0=Y3(p.deckY);const u=v3(Math.cos(al),Math.sin(al),0);
   const c=v3(x0,y0-0.04,0);obox(sc,M.belt,c.clone().addScaledVector(u,0.05),[1.6,0.08,0.52],al);
   [-0.31,0.31].forEach(z=>obox(sc,M.deck,v3(x0,y0-0.035,z).addScaledVector(u,0.05),[1.65,0.09,0.1],al));
   const fx=x0+0.85,fy=y0+0.85*Math.tan(al);[-0.33,0.33].forEach(z=>{tube(sc,M.frameD,v3(fx,fy,z),v3(fx-0.06,1.2,z*0.9),0.03);tube(sc,M.frameD,v3(fx-0.06,1.05,z*0.95),v3(fx-0.55,1.02,z*0.95),0.018);});
   obox(sc,M.frameD,v3(fx-0.05,1.24,0),[0.12,0.08,0.75]);obox(sc,M.screen,v3(fx-0.1,1.3,0),[0.04,0.16,0.4],0.6);
   obox(sc,M.frameD,v3(x0-0.8,0.03,0),[0.1,0.06,0.62]);},
};
function machDyn(sc,inst,dyn,props){const M=propMats();const D={type:'mach',m:dyn.type,dyn,objs:{}};const pr=(props||[]).find(x=>MACH[x[0]]);const P=pr?pr[1]:{};D.P=P;const o=D.objs;
  const cab=()=>{const m=new THREE.Mesh(new THREE.CylinderGeometry(0.005,0.005,1,6),M.cable);sc.add(m);return m;};
  if(dyn.type==='legPress'){o.plate=new THREE.Group();const pl=new THREE.Mesh(new THREE.BoxGeometry(0.035,0.58,0.56),M.frameD);pl.position.x=0.0175;o.plate.add(pl);
    const tr=new THREE.Mesh(new THREE.BoxGeometry(0.02,0.5,0.5),M.uph);tr.position.x=-0.002;o.plate.add(tr);
    const car=new THREE.Mesh(new THREE.BoxGeometry(0.2,0.06,0.5),M.frameD);car.position.set(0.1,-0.29,0);o.plate.add(car);o.plate.traverse(m=>{if(m.isMesh)m.castShadow=true;});sc.add(o.plate);o.c=cab();}
  else if(dyn.type==='latPull'){o.bar=new THREE.Mesh(new THREE.CylinderGeometry(0.014,0.014,1.15,12),M.bar);o.bar.castShadow=true;sc.add(o.bar);
    o.grip=[0,1].map(()=>{const g=new THREE.Mesh(new THREE.CylinderGeometry(0.019,0.019,0.16,12),M.uph);sc.add(g);return g;});o.c=cab();}
  else if(dyn.type==='chestPress'){o.h=[0,1].map(()=>{const g=new THREE.Mesh(new THREE.CylinderGeometry(0.02,0.02,0.15,12),M.uph);g.castShadow=true;sc.add(g);return g;});
    o.lv=[0,1].map(()=>{const m=new THREE.Mesh(new THREE.CylinderGeometry(0.022,0.022,1,10),M.frameD);m.castShadow=true;sc.add(m);return m;});}
  else if(dyn.type==='cableRow'||dyn.type==='pallof'){o.h=new THREE.Mesh(new THREE.CylinderGeometry(0.016,0.016,0.14,10),M.uph);o.h.castShadow=true;sc.add(o.h);o.c=cab();
    o.v=[0,1].map(()=>{const m=new THREE.Mesh(new THREE.CylinderGeometry(0.008,0.008,1,8),M.chrome);sc.add(m);return m;});}
  else if(dyn.type==='legCurl'){o.r=new THREE.Mesh(new THREE.CylinderGeometry(0.045,0.045,0.36,18),M.uph);o.r.rotation.x=Math.PI/2;o.r.castShadow=true;sc.add(o.r);
    o.lv=new THREE.Mesh(new THREE.CylinderGeometry(0.022,0.022,1,10),M.frameD);o.lv.castShadow=true;sc.add(o.lv);}
  else if(dyn.type==='hipAbd'){o.p=[0,1].map(()=>{const g=new THREE.Mesh(new THREE.BoxGeometry(0.2,0.2,0.06),M.uph);g.castShadow=true;sc.add(g);return g;});
    o.lv=[0,1].map(()=>{const m=new THREE.Mesh(new THREE.CylinderGeometry(0.02,0.02,1,10),M.frameD);m.castShadow=true;sc.add(m);return m;});}
  else if(dyn.type==='bike'){o.cr=[0,1].map(()=>{const m=new THREE.Mesh(new THREE.CylinderGeometry(0.013,0.013,1,8),M.chrome);sc.add(m);return m;});
    o.pd=[0,1].map(()=>{const m=new THREE.Mesh(new THREE.BoxGeometry(0.11,0.022,0.09),M.frameD);m.castShadow=true;sc.add(m);return m;});}
  else if(dyn.type==='elliptical'){o.pd=[0,1].map(()=>{const m=new THREE.Mesh(new THREE.BoxGeometry(0.36,0.035,0.13),M.frameD);m.castShadow=true;sc.add(m);return m;});
    o.arm=[0,1].map(()=>{const m=new THREE.Mesh(new THREE.CylinderGeometry(0.018,0.018,1,10),M.frame);m.castShadow=true;sc.add(m);return m;});
    o.link=[0,1].map(()=>{const m=new THREE.Mesh(new THREE.CylinderGeometry(0.02,0.02,1,10),M.frameD);sc.add(m);return m;});}
  return D;}
function machUpdate(D,inst){const o=D.objs,P=D.P,d=D.dyn,p=inst._p||{};const st=P._stack;
  const pc=s=>gripOf(inst,s);
  if(D.m==='legPress'){const x=-(p.fo||0);o.plate.position.set(x,Y3(P.fy),0);if(st)st.position.y=Math.max(0,(x-d.near))*0.55;
    o.c.visible=false;}
  else if(D.m==='latPull'){const a=pc('R'),b=pc('L');const c=a.clone().lerp(b,.5);orientY(o.bar,c,a.clone().sub(b));[a,b].forEach((q,i)=>orientY(o.grip[i],q,a.clone().sub(b)));
    const top=v3(X3(P.topX),2.21,0);placeSeg3(o.c,c,top);if(st)st.position.y=Math.max(0,d.topY-c.y)*0.9;}
  else if(D.m==='chestPress'){['R','L'].forEach((s,i)=>{const q=pc(s);orientY(o.h[i],q,v3(0,1,0));const pv=P._piv[s==='R'?1:0];placeSeg3(o.lv[i],q.clone().add(v3(0,0.07,0)),pv);});
    if(st)st.position.y=Math.max(0,(pc('R').x-d.near))*0.6;}
  else if(D.m==='cableRow'){const a=pc('R'),b=pc('L');const c=a.clone().lerp(b,.5);orientY(o.h,c,a.clone().sub(b));const pl=v3(d.px,d.py,0);const tip=c.clone().addScaledVector(pl.clone().sub(c).normalize(),0.09);
    placeSeg3(o.v[0],a,tip);placeSeg3(o.v[1],b,tip);placeSeg3(o.c,tip,pl);if(st)st.position.y=Math.max(0,1.15-tip.distanceTo(pl))*0.8;}
  else if(D.m==='pallof'){const a=pc('R'),b=pc('L');const c=a.clone().lerp(b,.5);orientY(o.h,c,v3(0,1,0));const pl=v3(X3(100),d.py,-0.82);
    placeSeg3(o.c,c,pl);o.v.forEach(m=>m.visible=false);if(st)st.position.y=Math.max(0,c.distanceTo(pl)-0.75)*0.5;}
  else if(D.m==='legCurl'){const A=boneWorld(inst,'foot.R',inst.A.B['foot.R'].h),K=boneWorld(inst,'shin.R',inst.A.B['shin.R'].h);const dd=A.clone().sub(K);dd.z=0;dd.normalize();const n=v3(dd.y,-dd.x,0);
    const r=A.clone().addScaledVector(n,d.ext?-0.075:0.065).addScaledVector(dd,-0.03);r.z=0;o.r.position.copy(r);placeSeg3(o.lv,v3(d.kx,d.ky,-0.29),v3(r.x,r.y,-0.2));
    if(st){const ang=Math.atan2(dd.x,-dd.y);st.position.y=d.ext?Math.max(0,ang-0.2)*0.12:Math.max(0,ang<1.4?(1.45-ang)*0.12:0);}}
  else if(D.m==='hipAbd'){['R','L'].forEach((s,i)=>{const K=boneWorld(inst,'shin.'+s,inst.A.B['shin.'+s].h);const sg=s==='R'?1:-1;const pp=K.clone().add(v3(-0.03,-0.04,sg*0.085));o.p[i].position.copy(pp);
      placeSeg3(o.lv[i],pp.clone().add(v3(0,-0.1,0)),P._piv.clone().add(v3(0,0,sg*0.05)));});
    if(st){const K=boneWorld(inst,'shin.R',inst.A.B['shin.R'].h);st.position.y=Math.max(0,Math.abs(K.z)-0.12)*0.8;}}
  else if(D.m==='bike'){const th=p.cr||0;[0,1].forEach(i=>{const a=th+(i?Math.PI:0);const z=(i?-1:1)*0.115;const pp=v3(d.cx+d.r*Math.cos(a),d.cy-d.r*Math.sin(a),z);
      placeSeg3(o.cr[i],v3(d.cx,d.cy,z*0.7),pp);o.pd[i].position.copy(pp).add(v3(0,0.011,0));});}
  else if(D.m==='elliptical'){const th=p.cr||0;['R','L'].forEach((s,i)=>{const a=th+(i?Math.PI:0);const z=(i?-1:1)*0.12;const pp=v3(d.cx+d.a*Math.cos(a),d.cy-d.b*Math.sin(a)-0.018,z);
      o.pd[i].position.copy(pp);const h=pc(s==='R'?'L':'R');const hz=v3(h.x,h.y,(i?-1:1)*0.24);
      placeSeg3(o.arm[i],hz.clone().add(v3(0,0.08,0)),v3(P._piv.x,P._piv.y-0.55,z*1.4));placeSeg3(o.link[i],v3(P._piv.x,P._piv.y-0.55,z*1.4),pp.clone().add(v3(0.17,0,0)));});}
}
