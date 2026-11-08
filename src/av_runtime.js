/* ===== Realistic avatar runtime (MakeHuman-based, CC0) ===== */
const AV={};          // decoded avatars: AV.m, AV.t
const U60=60, FLY=128; // 2D units per metre, floor line in 2D
const D2R=Math.PI/180;
const v3=(x,y,z)=>new THREE.Vector3(x,y,z);
const to3=(p,z)=>v3((p[0]-100)/U60,(FLY-p[1])/U60,z||0);
const to2=(v)=>[100+v.x*U60,FLY-v.y*U60];

function b64bytes(s){const bin=atob(s);const u=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);return u;}
async function gunzip(u8){const ds=new DecompressionStream('gzip');return await new Response(new Blob([u8]).stream().pipeThrough(ds)).arrayBuffer();}
const TA={float32:Float32Array,int8:Int8Array,uint8:Uint8Array,uint16:Uint16Array,uint32:Uint32Array};

async function loadAvatars(){
  for(const who of ['m','t']){
    const d=window.AV_DATA[who];
    const buf=await gunzip(b64bytes(d.b));
    const arr=e=>new TA[e[2]](buf,e[0],e[1]/TA[e[2]].BYTES_PER_ELEMENT);
    const meshes=d.h.meshes.map(m=>{
      const g=new THREE.BufferGeometry();
      g.setAttribute('position',new THREE.BufferAttribute(arr(m.pos),3));
      g.setAttribute('normal',new THREE.BufferAttribute(arr(m.nrm),3,true));
      g.setAttribute('uv',new THREE.BufferAttribute(arr(m.uv),2,true));
      g.setAttribute('skinIndex',new THREE.BufferAttribute(arr(m.si),4));
      g.setAttribute('skinWeight',new THREE.BufferAttribute(arr(m.sw),4,true));
      if(m.col) g.setAttribute('color',new THREE.BufferAttribute(arr(m.col),3,true));
      g.setIndex(new THREE.BufferAttribute(arr(m.idx),1));
      g.computeBoundingSphere();
      return {name:m.name,mat:m.mat,geo:g,pos:arr(m.pos),si:arr(m.si),sw:arr(m.sw)};
    });
    const A=prepAvatar(who,d.h,meshes);
    A.tex=await loadAvTextures(d.h.tex);
    AV[who]=A;
  }
}
function loadImg(src){return new Promise((res,rej)=>{const im=new Image();im.onload=()=>res(im);im.onerror=rej;im.src=src;});}
async function loadAvTextures(t){
  const det=await loadImg(t.detail), mk=await loadImg(t.mask);
  const dt=new THREE.Texture(det);dt.encoding=THREE.sRGBEncoding;dt.anisotropy=4;dt.needsUpdate=true;
  const c=document.createElement('canvas');c.width=mk.width;c.height=mk.height;const g=c.getContext('2d');g.drawImage(mk,0,0);
  const src=g.getImageData(0,0,c.width,c.height).data;
  const ch=k=>{const cc=document.createElement('canvas');cc.width=c.width;cc.height=c.height;const gg=cc.getContext('2d');const id=gg.createImageData(c.width,c.height);
    for(let i=0;i<src.length;i+=4){const v=src[i+k];id.data[i]=v;id.data[i+1]=v;id.data[i+2]=v;id.data[i+3]=255;}gg.putImageData(id,0,0);
    const tx=new THREE.CanvasTexture(cc);tx.needsUpdate=true;return tx;};
  return {detail:dt,top:ch(0),bottom:ch(1),hair:ch(2)};
}

/* ---------- rest-pose analysis ---------- */
function prepAvatar(who,h,meshes){
  const B={};h.bones.forEach((b,i)=>B[b.n]={i,h:v3(...b.h),t:v3(...b.t)});
  const lm={};for(const k in h.lm) lm[k]=v3(...h.lm[k]);
  const names=h.bones.map(b=>b.n);
  armReweight(B,meshes);
  if(who==='m')smoothChest(meshes,v3(...h.lm.shC));
  const hipC=lm.hipC.clone(), shC=lm.shC.clone();
  const Tv=shC.clone().sub(hipC), Tlen=Tv.length(), up=Tv.clone().normalize();
  const latR=v3(0,0,1).addScaledVector(up,-up.z).normalize();
  const fwdR=up.clone().cross(latR).normalize();
  const FR=new THREE.Matrix4().makeBasis(fwdR,up,latR); // rest torso frame
  const torso={};
  ['pelvis','spine05','spine04','spine03','spine02','spine01','neck01','clavicle.L','clavicle.R','shoulder.L','shoulder.R','upperarm.L','upperarm.R','thigh.L','thigh.R'].forEach(n=>{
    const p=B[n].h, d=p.clone().sub(hipC), t=d.dot(up)/Tlen;
    const off=d.clone().sub(up.clone().multiplyScalar(t*Tlen));
    torso[n]={t,of:off.dot(fwdR),ou:0,ol:off.dot(latR)};
  });
  const L={T:Tlen*U60,
    TH:B['thigh.L'].h.distanceTo(B['shin.L'].h)*U60, SH:B['shin.L'].h.distanceTo(B['foot.L'].h)*U60,
    UA:B['upperarm.L'].h.distanceTo(B['forearm.L'].h)*U60, FA:B['forearm.L'].h.distanceTo(B['hand.L'].h)*U60,
    HD:lm.eyeC.distanceTo(shC)*U60, ankleH:B['foot.L'].h.y*U60, hipW:Math.abs(B['thigh.R'].h.z)*U60, shW:Math.abs(B['upperarm.R'].h.z)*U60,
    hipBack:6.2, shBack:5.6, kneeR:3.0, handT:1.5, elbowR:2.2};
  L.LEG=L.TH+L.SH; L.ARM=L.UA+L.FA;
  // hand rest frames
  const hand={};
  for(const s of ['L','R']){
    const w=B['hand.'+s].h, mid=B['finger3-1.'+s].h, ix=B['finger2-1.'+s].h, pk=B['finger5-1.'+s].h;
    const D=mid.clone().sub(w).normalize(); const Wd=ix.clone().sub(pk).normalize();
    let N=(s==='R'?Wd.clone().cross(D):D.clone().cross(Wd)).normalize();
    const palm=ix.clone().add(pk).multiplyScalar(.5).lerp(w,.35).addScaledVector(N,0.018);
    // thumb angle (about D) that lays the thumb tip flat in the palm plane (for floor/wall contact)
    const tb0=B['finger1-1.'+s].h,tip=B['finger1-3.'+s].t;let tf=0,bestE=9;
    for(let a=-80;a<=80;a+=1){const q=new THREE.Quaternion().setFromAxisAngle(D,a*D2R);const tp=tip.clone().sub(tb0).applyQuaternion(q).add(tb0);
      const e=Math.max(0,N.dot(tp.clone().sub(palm))+0.002)*100+Math.abs(a)*0.002;if(e<bestE){bestE=e;tf=a;}}
    const grip=ix.clone().add(pk).multiplyScalar(.5).addScaledVector(N,0.021).addScaledVector(D,0.008);
    hand[s]={D,W:Wd,N,palm,tf,grip};
  }
  // procedural sneakers (rigid on the foot bone) + foot reference points
  const foot={},shoe={};
  const skin=meshes.find(m=>m.name==='skin');
  const shm=meshes.find(m=>m.name==='shoes');
  for(const s of ['L','R']) shoe[s]=buildShoeData(who,s,B,shm);
  for(const s of ['L','R']){const A=B['foot.'+s].h,sd=shoe[s];
    foot[s]={toe:v3(sd.tx-A.x,sd.soleY-A.y,0),heel:v3(sd.hx-A.x,sd.soleY-A.y,0),ball:v3(sd.xb-A.x,sd.soleY-A.y,0),t1:v3(sd.top1[0]-A.x,sd.top1[1]-A.y,0),t2:v3(sd.top2[0]-A.x,sd.top2[1]-A.y,0),t3:v3(sd.top3[0]-A.x,sd.top3[1]-A.y,0)};}
  // sample vertices for ground snapping (every 5th of every mesh)
  const samp=[];
  meshes.forEach(m=>{if(m.name==='shoes'||m.name==='socks')return;const n=m.pos.length/3;const st=m.name==='skin'?6:3;for(let i=0;i<n;i+=st)samp.push([m.pos[3*i],m.pos[3*i+1],m.pos[3*i+2],m.si[4*i],m.si[4*i+1],m.si[4*i+2],m.si[4*i+3],m.sw[4*i]/255,m.sw[4*i+1]/255,m.sw[4*i+2]/255,m.sw[4*i+3]/255]);});
  for(const s of ['L','R']){const sd=shoe[s],fi=B['foot.'+s].i;for(let i=0;i<sd.pos.length;i+=3*3)if(sd.tw[i/3]<0.5)samp.push([sd.pos[i],sd.pos[i+1],sd.pos[i+2],fi,0,0,0,1,0,0,0]);}
  return {who,h,B,names,lm,hipC,shC,Tlen,up,latR,fwdR,FR,torso,L,hand,foot,shoe,meshes,samp};
}

/* ---------- materials ---------- */
let AVMAT=null;
function avMats(){
  if(AVMAT) return AVMAT;
  const tex=(draw,rep)=>{const t0=document.createElement('canvas');t0.width=t0.height=256;draw(t0.getContext('2d'));
    const c=document.createElement('canvas');c.width=c.height=1024;const g=c.getContext('2d');const sz=1024/rep;
    for(let i=0;i<rep;i++)for(let j=0;j<rep;j++)g.drawImage(t0,i*sz,j*sz,sz,sz);
    const t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;t.anisotropy=4;return t;};
  const legT=tex(g=>{g.fillStyle='#164c78';g.fillRect(0,0,256,256);
    for(let i=0;i<70;i++){g.strokeStyle=['#2a76aa','#3d93c4','#62b9da','#0f3a5e'][i%4];g.lineWidth=1+Math.random()*2.5;g.beginPath();
      const y=Math.random()*256;g.moveTo(-10,y);for(let x=-10;x<=266;x+=12)g.lineTo(x,y+Math.sin(x/16+i*1.7)*9+Math.sin(x/5+i)*1.5);g.stroke();}},5);
  const heather=(base,sp,rep)=>tex(g=>{g.fillStyle=base;g.fillRect(0,0,256,256);for(let i=0;i<14000;i++){g.fillStyle=sp[i%sp.length];g.fillRect(Math.random()*256,Math.random()*256,1.3,1+Math.random()*2);}},rep);
  const S=o=>{const m=new THREE.MeshStandardMaterial(Object.assign({roughness:.7,metalness:0},o));if(o.color!==undefined)m.color.convertSRGBToLinear();return m;};
  const knitN=(()=>{const S0=1024;const c=document.createElement('canvas');c.width=c.height=S0;const g=c.getContext('2d');g.fillStyle='#808080';g.fillRect(0,0,S0,S0);
    for(let y=0;y<S0;y+=4)for(let x=0;x<S0;x+=4){const v=105+((x/4+y/4)%2)*55+Math.random()*35|0;g.fillStyle=`rgb(${v},${v},${v})`;g.fillRect(x+0.5,y,3,4);}
    const id=g.getImageData(0,0,S0,S0),d=id.data,o=g.createImageData(S0,S0),q=o.data;const H=(x,y)=>d[4*(((y+S0)%S0)*S0+((x+S0)%S0))]/255;
    for(let y=0;y<S0;y++)for(let x=0;x<S0;x++){const dx=(H(x+1,y)-H(x-1,y))*1.6,dy=(H(x,y+1)-H(x,y-1))*1.6,l=Math.hypot(dx,dy,1),i=4*(y*S0+x);q[i]=(-dx/l*.5+.5)*255;q[i+1]=(dy/l*.5+.5)*255;q[i+2]=(1/l*.5+.5)*255;q[i+3]=255;}
    g.putImageData(o,0,0);const t=new THREE.CanvasTexture(c);t.anisotropy=4;return t;})();
  const P=o=>{const m=new THREE.MeshPhysicalMaterial(Object.assign({roughness:.7,metalness:0},o));if(o.color!==undefined)m.color.convertSRGBToLinear();if(o.sheenColor!==undefined)m.sheenColor.convertSRGBToLinear();return m;};
  const nS=k=>new THREE.Vector2(k,k);
  AVMAT={
    skin:P({roughness:.6,sheen:.12,sheenRoughness:.6,sheenColor:new THREE.Color(0xd8a898),specularIntensity:.45,envMapIntensity:.45}),
    tank:P({color:0x222326,roughness:.55,normalMap:knitN,normalScale:nS(.25),sheen:.5,sheenRoughness:.5,sheenColor:new THREE.Color(0x777b84)}),
    legM:P({map:legT,roughness:.38,normalMap:knitN,normalScale:nS(.15),sheen:.6,sheenRoughness:.35,sheenColor:new THREE.Color(0x9fd2f0)}),
    tee:P({map:heather('#6b7d9d',['#7f91b0','#5a6c8b','#7383a1','#8a9bb8'],6),roughness:.9,normalMap:knitN,normalScale:nS(.35),sheen:.6,sheenRoughness:.8,sheenColor:new THREE.Color(0xb7c4dc)}),
    shorts:P({map:heather('#2a2e35',['#363b44','#202328','#2f343c'],6),roughness:.85,normalMap:knitN,normalScale:nS(.3),sheen:.4,sheenRoughness:.6,sheenColor:new THREE.Color(0x5a606a)}),
    hairM:P({vertexColors:true,roughness:.55,sheen:.35,sheenRoughness:.4,sheenColor:new THREE.Color(0xd8c8a0),envMapIntensity:.6}),
    hairT:S({vertexColors:true,roughness:.85}),
    shoe:S({vertexColors:true,roughness:.75}),
    sock:S({vertexColors:true,roughness:.9}),
    eyeW:P({color:0xf4f1ec,roughness:.15,clearcoat:1,clearcoatRoughness:.05}), iris:P({color:0x4d6273,roughness:.2,clearcoat:1,clearcoatRoughness:.05}), pupil:S({color:0x111111,roughness:.2}),
    glass:S({color:0x1a2533,roughness:.12,metalness:.35}), frame:S({color:0x2b2f36,roughness:.4,metalness:.3}),
    watchW:S({color:0xf0f0f0,roughness:.35}), watchB:S({color:0x141414,roughness:.35}), screen:S({color:0x0a0a0a,roughness:.1,metalness:.2}),
    hairtie:S({color:0x2c2c2c,roughness:.6}),
  };
  return AVMAT;
}

/* ---------- instance ---------- */
function avatarMats(A){
  if(A.mats) return A.mats;
  const M=avMats(),T=A.tex;
  const cl=(m,o)=>{const n=m.clone();Object.assign(n,o);n.needsUpdate=true;return n;};
  A.mats={
    skin:cl(M.skin,{map:T.detail,vertexColors:false}),
    hairM:cl(M.hairM,{map:T.detail,vertexColors:false,alphaMap:T.hair,alphaTest:.5,alphaToCoverage:true}),
    hairT:cl(M.hairT,{map:T.detail,vertexColors:false,alphaMap:T.hair,alphaTest:.5,alphaToCoverage:true}),
    tank:cl(M.tank,{alphaMap:T.top,alphaTest:.5,alphaToCoverage:true,side:THREE.DoubleSide}),
    tee:cl(M.tee,{alphaMap:T.top,alphaTest:.5,alphaToCoverage:true,side:THREE.DoubleSide}),
    legM:cl(M.legM,{alphaMap:T.bottom,alphaTest:.5,alphaToCoverage:true,side:THREE.DoubleSide}),
    shorts:cl(M.shorts,{alphaMap:T.bottom,alphaTest:.5,alphaToCoverage:true,side:THREE.DoubleSide}),
    shoe:M.shoe, sock:M.sock};
  return A.mats;
}
function makeAvatarInstance(who,parent){
  const A=AV[who],M=avatarMats(A);
  const g=new THREE.Group();parent.add(g);
  const bones=A.names.map((n,i)=>{const b=new THREE.Bone();b.name=n;b.position.copy(A.B[n].h);g.add(b);return b;});
  g.updateMatrixWorld(true);
  const skel=new THREE.Skeleton(bones);
  const meshes=A.meshes.filter(m=>m.name!=='shoes'&&m.name!=='socks').map(m=>{
    const sm=new THREE.SkinnedMesh(m.geo,M[m.mat]);sm.castShadow=true;
    if(M[m.mat].alphaMap){sm.customDepthMaterial=new THREE.MeshDepthMaterial({depthPacking:THREE.RGBADepthPacking,alphaMap:M[m.mat].alphaMap,alphaTest:.5});}sm.receiveShadow=true;sm.frustumCulled=false;
    g.add(sm);sm.bind(skel,new THREE.Matrix4());return sm;});
  const inst={who,A,g,bones,skel,meshes,att:{}};
  buildAccessories(inst);buildShoes(inst);
  inst.mats=bones.map(()=>new THREE.Matrix4());
  return inst;
}
/* accessories follow bones: follower.matrix = boneMatrix * T(-h) */
function follower(inst,bn){
  if(inst.att[bn]) return inst.att[bn];
  const o=new THREE.Object3D();o.matrixAutoUpdate=false;inst.g.add(o);inst.att[bn]=o;return o;}
function amesh(geo,mat,parent,pos,scale,quat){const m=new THREE.Mesh(geo,mat);m.castShadow=true;m.receiveShadow=true;if(pos)m.position.copy(pos);if(scale)m.scale.copy(scale);if(quat)m.quaternion.copy(quat);parent.add(m);return m;}
function buildAccessories(inst){
  const A=inst.A,M=avMats(),lm=A.lm;const hf=follower(inst,'head');
  const sph=new THREE.SphereGeometry(1,24,16);
  // eyes
  [lm.eyeL,lm.eyeR].forEach(e=>{
    const c=e.clone().add(v3(-0.004,0,0));
    amesh(sph,M.eyeW,hf,c,v3(.0118,.0118,.0118));
    amesh(sph,M.iris,hf,c.clone().add(v3(.0098,0,0)),v3(.0028,.0058,.0058));
    amesh(sph,M.pupil,hf,c.clone().add(v3(.0119,0,0)),v3(.0012,.0026,.0026));
  });
  if(inst.who==='m'){
    // bun (hair tied back) + hair tie + sunglasses on head
    const top=lm.headTop,back=lm.headBack;
    const bunC=v3(back.x-0.012,(back.y+top.y)/2+0.012,0);
    amesh(sph,M.hairM,hf,bunC,v3(.042,.036,.04)).geometry=sph;
    const bunMat=new THREE.MeshStandardMaterial({color:0x9c7647,roughness:.6});bunMat.color.convertSRGBToLinear();
    hf.children[hf.children.length-1].material=bunMat;
    amesh(sph,bunMat,hf,bunC.clone().add(v3(-0.03,-0.03,0)),v3(.03,.04,.028));
    amesh(new THREE.TorusGeometry(.03,.006,8,20),M.hairtie,hf,bunC.clone().add(v3(.012,-.006,0)),null,new THREE.Quaternion().setFromAxisAngle(v3(0,0,1),Math.PI/2.6));
    const gl=new THREE.Group();gl.position.set(top.x+0.042,top.y+0.006,0);gl.rotation.z=0.72;hf.add(gl);
    [-1,1].forEach(sg=>{amesh(sph,M.glass,gl,v3(0,0,sg*0.029),v3(.0035,.018,.022));amesh(new THREE.TorusGeometry(1,.12,6,24),M.frame,gl,v3(0,0,sg*0.029),v3(.018,.021,.018),new THREE.Quaternion().setFromAxisAngle(v3(0,1,0),Math.PI/2));});
    amesh(new THREE.BoxGeometry(.004,.004,.022),M.frame,gl,v3(0,.012,0));
  }
  // watch on left wrist
  const fl=follower(inst,'forearm2.L');
  const w=A.B['hand.L'].h,e=A.B['forearm.L'].h;const p=e.clone().lerp(w,.9);
  const dir=w.clone().sub(e).normalize();
  const q=new THREE.Quaternion().setFromUnitVectors(v3(0,1,0),dir);
  const band=new THREE.Mesh(new THREE.CylinderGeometry(.03,.03,.02,20,1,true),inst.who==='m'?M.watchW:M.watchB);band.position.copy(p);band.quaternion.copy(q);band.material.side=THREE.DoubleSide;fl.add(band);
  const face=amesh(new THREE.BoxGeometry(.034,.01,.04),inst.who==='m'?M.watchW:M.watchB,fl,p.clone().addScaledVector(A.hand.L.N,-0.026),null,q);
  amesh(new THREE.BoxGeometry(.028,.011,.033),M.screen,face,v3(0,0.0012,0));
}

/* ---------- pose driving ---------- */
let _m=null,_m2=null,ONE=null;function ensureT(){if(!_m){_m=new THREE.Matrix4();_m2=new THREE.Matrix4();ONE=new THREE.Vector3(1,1,1);}}
function frameQ(Y,Zref,X){ // returns quaternion of basis (X=Y×Z, Y, Z)
  ensureT();
  const y=Y.clone().normalize();let z=Zref.clone().addScaledVector(y,-Zref.dot(y));
  if(z.lengthSq()<1e-6) z=(X||v3(1,0,0)).clone().cross(y);
  z.normalize();const x=y.clone().cross(z).normalize();
  _m.makeBasis(x,y,z);return new THREE.Quaternion().setFromRotationMatrix(_m);}
function restQ(Y,Zref){return frameQ(Y,Zref);}
function relQ(curQ,restQ_){return curQ.clone().multiply(restQ_.clone().invert());}
function ik2(r,t,l1,l2,b){
  let dx=t[0]-r[0],dy=t[1]-r[1],d=Math.hypot(dx,dy);d=Math.min(Math.max(d,0.5),l1+l2-0.01);
  const base=Math.atan2(dy,dx),a=Math.acos(Math.min(1,Math.max(-1,(l1*l1+d*d-l2*l2)/(2*l1*d))));
  const ang=base+b*a,m=[r[0]+l1*Math.cos(ang),r[1]+l1*Math.sin(ang)];
  const ex=t[0]-m[0],ey=t[1]-m[1],e=Math.hypot(ex,ey)||1;return [m,[m[0]+ex/e*l2,m[1]+ey/e*l2]];}
function limb2(r,s,l1,l2,db){
  if(s.a){const u=[Math.sin(s.a[0]*D2R),Math.cos(s.a[0]*D2R)],f=[Math.sin(s.a[1]*D2R),Math.cos(s.a[1]*D2R)];
    const m=[r[0]+l1*u[0],r[1]+l1*u[1]];return [m,[m[0]+l2*f[0],m[1]+l2*f[1]]];}
  return ik2(r,s.to,l1,l2,s.b??db);}

function poseInstance(inst,p,opt){
  ensureT();
  const A=inst.A,L=A.L,B=A.B;opt=opt||{};
  if(opt.ground!==false&&inst._lb==null&&!opt._pre){poseInstance(inst,p,Object.assign({},opt,{_pre:true}));inst._fr=null;inst._tp=null;}
  inst._p=p;
  const side=!!opt.side;
  const lat=side?v3(0,-1,0):v3(0,0,1);
  const out={}; // name -> {p:Vector3,q:Quaternion}
  // torso in 2D
  const hip2=[p.x,p.y], sh2=[p.x+L.T*Math.sin(p.t*D2R), p.y-L.T*Math.cos(p.t*D2R)];
  const H=to3(hip2),S=to3(sh2);
  const dx=(sh2[0]-hip2[0])/L.T,dy=(sh2[1]-hip2[1])/L.T,c=(p.c||0)*L.T/34;
  const C=to3([(hip2[0]+sh2[0])/2+dy*c,(hip2[1]+sh2[1])/2-dx*c]);
  const bez=t=>H.clone().multiplyScalar((1-t)*(1-t)).addScaledVector(C,2*(1-t)*t).addScaledVector(S,t*t);
  const tan=t=>C.clone().sub(H).multiplyScalar(2*(1-t)).addScaledVector(S.clone().sub(C),2*t).normalize();
  const tlen=H.distanceTo(S);
  const frameAt=t=>{const tt=Math.min(1,Math.max(0,t));const Y=tan(tt);return frameQ(Y,lat);};
  const pointAt=(t,o)=>{const tt=Math.min(1,Math.max(0,t));let P=bez(tt);if(t<0)P.addScaledVector(tan(0),t*tlen);if(t>1)P.addScaledVector(tan(1),(t-1)*tlen);
    const q=frameAt(t);const off=v3(o.of,o.ou,o.ol).applyQuaternion(q);return P.add(off);};
  const restT=new THREE.Quaternion().setFromRotationMatrix(A.FR);
  const torsoBone=(n,t,o)=>{const q=frameAt(t);out[n]={p:pointAt(t,o),q:q.clone().multiply(restT.clone().invert())};};
  for(const n in A.torso){if(n.startsWith('upperarm')||n.startsWith('thigh'))continue;const o=A.torso[n];torsoBone(n,o.t,o);}
  // head & neck chain
  const hd2=[Math.sin((p.t+(p.h||0))*D2R),-Math.cos((p.t+(p.h||0))*D2R)];
  const hd=v3(hd2[0],-hd2[1],0).normalize();
  const qHead=frameQ(hd,lat).multiply(restT.clone().invert());
  const qChest=out['neck01'].q.clone();
  const n1=out['neck01'].p;
  const qn1=qChest.clone().slerp(qHead,.2),qn2=qChest.clone().slerp(qHead,.45),qn3=qChest.clone().slerp(qHead,.7);
  out['neck01'].q=qn1;
  const d1=B['neck02'].h.clone().sub(B['neck01'].h),d2=B['neck03'].h.clone().sub(B['neck02'].h),d3=B['head'].h.clone().sub(B['neck03'].h);
  const n2=n1.clone().add(d1.applyQuaternion(qn1));out['neck02']={p:n2,q:qn2};
  const n3=n2.clone().add(d2.applyQuaternion(qn2));out['neck03']={p:n3,q:qn3};
  out['head']={p:n3.clone().add(d3.applyQuaternion(qn3)),q:qHead};
  // limbs: near(+lat) = R normally; side-lying: near(top)=L
  const nearS=side?'L':'R', farS=side?'R':'L';
  const assign=[[nearS,p.na,p.nl,1],[farS,p.fa,p.fl,-1]];
  const fwd=frameAt(.5).clone();const bodyFwd=v3(1,0,0).applyQuaternion(fwd);
  for(const [s,arm,leg,sg] of assign){
    // ----- arm
    const oa=A.torso['upperarm.'+s];let root=pointAt(oa.t,oa);
    const spA=(arm&&arm.sp||0)/U60, spE=(arm&&arm.spE!=null?arm.spE:(arm&&arm.sp||0)*0.5)/U60;
    const outward=side?v3(0,0,0):v3(0,0,s==='R'?1:-1);
    const solveArm=rt=>{const [e2,w2]=limb2(to2(rt),arm||{a:[3,3]},L.UA,L.FA,1);
      return [to3(e2,rt.z).addScaledVector(outward,spE),to3(w2,rt.z).addScaledVector(outward,spA)];};
    let [E3,W3]=solveArm(root);
    // clavicle/scapula elevation when the arm goes above shoulder height (shrug -> natural shoulder line)
    const qChestS=out['spine01'].q;const tUp=A.up.clone().applyQuaternion(qChestS).normalize();
    const latS=(side?lat.clone():lat.clone().multiplyScalar(s==='R'?1:-1));
    {const ud=E3.clone().sub(root).normalize();const elev=Math.acos(Math.max(-1,Math.min(1,-ud.dot(tUp))))/D2R; // 0 = arm down
      const k=Math.max(0,Math.min(1,(elev-70)/100));const ang=(k*k*(3-2*k))*24*D2R;
      if(ang>1e-3){const cn='clavicle.'+s,cl=out[cn];const axc=latS.clone().cross(tUp).normalize();const qr=new THREE.Quaternion().setFromAxisAngle(axc,ang);
        const piv=cl.p.clone();cl.q=qr.clone().multiply(cl.q);
        const mv=x=>x.clone().sub(piv).applyQuaternion(qr).add(piv);
        const sb=out['shoulder.'+s];sb.p=mv(sb.p);sb.q=qr.clone().multiply(sb.q);
        root=mv(root);[E3,W3]=solveArm(root);}}
    // upper arm + forearm frames share the elbow hinge axis (no candy-wrap twisting)
    const uaR=B['forearm.'+s].h.clone().sub(B['upperarm.'+s].h).normalize(),faR=B['hand.'+s].h.clone().sub(B['forearm.'+s].h).normalize();
    const hR=uaR.clone().cross(A.fwdR).normalize();
    const uC=E3.clone().sub(root).normalize(),fC=W3.clone().sub(E3).normalize();
    const uR2=uaR.clone().applyQuaternion(qChestS);const sw=new THREE.Quaternion().setFromUnitVectors(uR2,uC);
    const hT=hR.clone().applyQuaternion(qChestS).applyQuaternion(sw);
    let hC=uC.clone().cross(fC);const bend=Math.asin(Math.min(1,hC.length()))/D2R*(uC.dot(fC)<0?-1:1);
    let hh=hT.clone();
    if(hC.lengthSq()>1e-6){hC.normalize();if(hC.dot(hT)>-0.2){const bb=Math.max(0,Math.min(1,(Math.abs(bend)-8)/25));hh=hT.clone().multiplyScalar(1-bb).addScaledVector(hC,bb);}}
    hh.addScaledVector(uC,-hh.dot(uC));if(hh.lengthSq()<1e-6)hh=hT.clone();hh.normalize();
    const qUA=frameQ(uC,hh).multiply(frameQ(uaR,hR).invert());
    out['upperarm.'+s]={p:root,q:qUA};
    const hF=hh.clone().addScaledVector(fC,-hh.dot(fC));if(hF.lengthSq()<1e-6)hF.copy(hh);
    const qFA=frameQ(fC,hF.normalize()).multiply(frameQ(faR,hR.clone().addScaledVector(faR,-hR.dot(faR)).normalize()).invert());
    out['forearm.'+s]={p:E3,q:qFA};
    // hand orientation
    const hm=(p.hm&&p.hm[s])||(opt.hand&&(opt.hand[s]||opt.hand.all))||'relax';
    const fd=W3.clone().sub(E3).normalize();
    const medial=side?v3(0,0,0):v3(0,0,s==='R'?-1:1);
    let Dd=fd.clone(),Nd=medial.clone().addScaledVector(fd,-medial.dot(fd));
    if(hm==='floor'){let pr=v3(fd.x,0,fd.z);if(pr.length()<0.35)pr=v3(bodyFwd.x,0,0);if(pr.length()<0.1)pr=v3(1,0,0);Dd=pr.normalize();Nd=v3(0,-1,0);}
    else if(hm==='wall'){Dd=v3(0,1,0);Nd=v3(1,0,0);}
    else if(hm==='bar'){Dd=v3(0,1,0);Nd=v3(1,0,0);}
    else if(hm==='press'){Nd=tan(.5).clone().negate();}
    else if(hm==='pron'){Nd=bodyFwd.clone().negate();}
    else if(hm==='up'){Nd=v3(0,1,0);}
    else if(hm==='fwd'){Nd=bodyFwd.clone();}
    else if(hm==='cup'){Nd=medial.clone().multiplyScalar(0.55).add(v3(0,0.85,0)).normalize();Dd=v3(0,1,0).addScaledVector(medial,0.35).addScaledVector(bodyFwd,0.25).normalize();}
    if(Nd.lengthSq()<1e-4) Nd=v3(0,-1,0);
    const hr=A.hand[s];
    const qRestH=new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(hr.D,hr.N.clone().addScaledVector(hr.D,-hr.N.dot(hr.D)).normalize(),hr.D.clone().cross(hr.N).normalize()));
    const Nn=Nd.clone().addScaledVector(Dd,-Nd.dot(Dd)).normalize();
    const qCurH=new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(Dd,Nn,Dd.clone().cross(Nn).normalize()));
    const qH=qCurH.multiply(qRestH.invert());
    out['hand.'+s]={p:W3,q:qH};
    const f2=B['forearm2.'+s].h.distanceTo(B['forearm.'+s].h)/B['hand.'+s].h.distanceTo(B['forearm.'+s].h);
    out['forearm2.'+s]={p:E3.clone().lerp(W3,f2),q:qFA.clone().slerp(qH,.5)};
    const sh=out['shoulder.'+s];sh.q=sh.q.clone().slerp(qUA,.55);
    // fingers
    const curl=(p.curl&&p.curl[s]!=null)?p.curl[s]:(opt.curl&&(opt.curl[s]??opt.curl.all))??(hm==='floor'||hm==='wall'?0.05:hm==='bar'||hm==='grip'?1:0.25);
    const axis=hr.W.clone(); // curl around knuckle axis (rest)
    for(let f=1;f<=5;f++){
      let q=qH.clone(),pos=null;
      const amt=f===1?[0.35,0.55,0.45]:[1.05,1.2,0.8];
      for(let j=1;j<=3;j++){
        const n=`finger${f}-${j}.${s}`;const rb=B[n];
        if(j===1){pos=W3.clone().add(rb.h.clone().sub(B['hand.'+s].h).applyQuaternion(qH));}
        const ang=curl*amt[j-1]*(s==='R'?-1:1)*(f===1?0.7:1);
        const ax=f===1?hr.D.clone():axis.clone();
        if(f===1&&j===1&&(hm==='floor'||hm==='wall'))q=q.clone().multiply(new THREE.Quaternion().setFromAxisAngle(hr.D,hr.tf*D2R));
        q=q.clone().multiply(new THREE.Quaternion().setFromAxisAngle(ax,-ang));
        out[n]={p:pos.clone(),q:q.clone()};
        if(j<3){const nn=`finger${f}-${j+1}.${s}`;pos=pos.clone().add(B[nn].h.clone().sub(rb.h).applyQuaternion(q));}
      }
    }
    // ----- leg
    const ol=A.torso['thigh.'+s];const hr3=pointAt(ol.t,ol);const h2=to2(hr3);
    const [k2,a2]=limb2(h2,leg||{a:[0,0]},L.TH,L.SH,-1);
    const spL=(leg&&leg.sp||0)/U60;
    const K3=to3(k2,hr3.z).addScaledVector(outward,(leg&&leg.spK!=null?leg.spK/U60:spL*.5)),A3=to3(a2,hr3.z).addScaledVector(outward,spL);
    out['thigh.'+s]={p:hr3,q:relQ(frameQ(K3.clone().sub(hr3),lat),restQ(B['shin.'+s].h.clone().sub(B['thigh.'+s].h),A.latR))};
    out['shin.'+s]={p:K3,q:relQ(frameQ(A3.clone().sub(K3),lat),restQ(B['foot.'+s].h.clone().sub(B['shin.'+s].h),A.latR))};
    // foot: continuous solver (no discrete search -> no popping)
    const sd=A3.clone().sub(K3).normalize();
    const T0=lat.clone().cross(sd).normalize();
    const fr=A.foot[s];
    const PN=opt.footN?v3(opt.footN[0],opt.footN[1],0).normalize():v3(0,1,0);
    const pOff=(p['fo'+s]!=null?p['fo'+s]:(p.fo!=null?p.fo:(opt.footOff!=null?opt.footOff:null)));
    const FY=pOff!=null?pOff:(opt.footFloor||0)-(opt.ground!==false?Math.max(0,inst._lb||0):0);
    const hOf=P=>P.dot(PN)-FY;
    const qAt=r=>{const Tt=T0.clone().applyAxisAngle(lat,r*D2R);const Uu=lat.clone().cross(Tt).normalize();return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(Tt,Uu,lat.clone().normalize()));};
    const ys=r=>{const q=qAt(r);return [hOf(A3.clone().add(fr.toe.clone().applyQuaternion(q))),hOf(A3.clone().add(fr.heel.clone().applyQuaternion(q)))];};
    const RMIN=-75,RMAX=32; // plantar .. dorsi (deg, relative to perpendicular-to-shin)
    // angle that makes the sole horizontal (choose solution closest to neutral)
    const svw=fr.toe.clone().sub(fr.heel).applyQuaternion(qAt(0));
    let rFlat=-18;
    if(Math.abs(lat.y)<0.8){const upv=PN.clone();const e1=upv.clone().cross(lat).normalize();
      const phi=Math.atan2(svw.dot(upv),svw.dot(e1))/D2R;let r1=-phi,r2=180-phi;const wrap=x=>((x+540)%360)-180;r1=wrap(r1);r2=wrap(r2);const C=-21;rFlat=Math.abs(wrap(r1-C))<Math.abs(wrap(r2-C))?r1:r2;}
    // ensure toes point forward-ish: if flat solution would flip foot backwards, keep within range
    const ankH=hOf(A3);
    const fl=fr.toe.x-fr.heel.x;
    const w=Math.min(1,Math.max(0,(0.20-ankH)/0.11)); const wS=w*w*(3-2*w);
    const rRelax=opt.footRelax!=null?opt.footRelax:-18;
    const exc=rFlat>RMAX?rFlat-RMAX:(rFlat<RMIN?RMIN-rFlat:0);const wr0=Math.max(0,Math.min(1,(35-exc)/25));const wReach=wr0*wr0*(3-2*wr0);
    const flatT=Math.max(RMIN,Math.min(RMAX,rFlat));
    let rT=opt.footRelax!=null?rRelax:rRelax+((rRelax+(flatT-rRelax)*wReach)-rRelax)*wS;
    rT=Math.max(RMIN,Math.min(RMAX,rT));
    let r=rT,tau=0;
    if(!opt.noFootFix){
      const sinus=pt=>{const q0=qAt(0),q9=qAt(90),q18=qAt(180);const y0=hOf(A3.clone().add(pt.clone().applyQuaternion(q0))),y9=hOf(A3.clone().add(pt.clone().applyQuaternion(q9))),y18=hOf(A3.clone().add(pt.clone().applyQuaternion(q18)));const c=(y0+y18)/2;return [c,(y0-y18)/2,y9-c];};
      const SH=sinus(fr.heel),SB=sinus(fr.ball),ST=sinus(fr.toe),S1=sinus(fr.t1),S2=sinus(fr.t2),S3=sinus(fr.t3);
      const toesOK=Math.abs(lat.y)<0.8;
      const dv=fr.toe.clone().sub(fr.ball),dl=dv.length();let phd0=0;
      if(toesOK){const w0=dv.clone().applyQuaternion(qAt(0));const upv=PN.clone(),e1=upv.clone().cross(lat).normalize();phd0=Math.atan2(w0.dot(upv),w0.dot(e1))/D2R;}
      const KP=1e7, KA=1.5e5*wS;
      const ev=rr=>{const c=Math.cos(rr*D2R),sn=Math.sin(rr*D2R);const yh=SH[0]+SH[1]*c+SH[2]*sn,yb=SB[0]+SB[1]*c+SB[2]*sn;let yt=ST[0]+ST[1]*c+ST[2]*sn,tu=0;
        if(yt<0&&toesOK){let ph=phd0+rr;ph=((ph+540)%360)-180;if(ph>-170&&ph<90){const need=Math.asin(Math.max(-1,Math.min(1,-yb/dl)))/D2R;tu=Math.max(0,Math.min(85,need-ph));yt=yb+dl*Math.sin((ph+tu)*D2R);}}
        return [yh,yb,yt,tu];};
      const f=rr=>{const [yh,yb,yt]=ev(rr);const c=Math.cos(rr*D2R),sn=Math.sin(rr*D2R);const y1=S1[0]+S1[1]*c+S1[2]*sn,y2=Math.min(S2[0]+S2[1]*c+S2[2]*sn,S3[0]+S3[1]*c+S3[2]*sn);
        const n1=yh<0?yh:0,n2=yb<0?yb:0,n3=yt<0?yt:0,n4=y1<0?y1:0,n5=y2<0?y2:0;const lo=Math.max(0,Math.min(yh,yb,yt,y1,y2));
        return (rr-rT)*(rr-rT)+KP*(n1*n1+n2*n2+n3*n3+n4*n4+n5*n5)+KA*0.0009*(1-Math.exp(-lo*lo/0.0009));};
      const RA=RMIN-28,RB=RMAX+8;
      const st=inst._fr||(inst._fr={});const prev=st[s];
      let br;
      if(prev==null){let bv=Infinity;br=rT;for(let rr=Math.max(RA,rT-60);rr<=Math.min(RB,rT+60);rr+=1){const v=f(rr);if(v<bv){bv=v;br=rr;}}}
      else br=prev;
      let cur=br,fc=f(cur);
      for(let step=4;step>0.03;){const a1=Math.min(RB,cur+step),a2=Math.max(RA,cur-step);const f1=f(a1),f2=f(a2);
        if(f1<fc&&f1<=f2){cur=a1;fc=f1;}else if(f2<fc){cur=a2;fc=f2;}else step*=0.5;}
      if(prev!=null){const md=18;cur=Math.max(prev-md,Math.min(prev+md,cur));}
      st[s]=cur;r=cur;tau=ev(r)[3];
      const pt=(inst._tp||(inst._tp={}))[s];if(pt!=null)tau=Math.max(pt-20,Math.min(pt+20,tau));inst._tp[s]=tau;
    }
    (inst.toeA||(inst.toeA={}))[s]=tau;
    
    const best=qAt(r);
    out['foot.'+s]={p:A3,q:best};
  }
  // apply to bones + ground snap
  const names=A.names;
  const mats=inst.mats;
  for(let i=0;i<names.length;i++){const o=out[names[i]];
    if(!o){mats[i].identity();continue;}
    mats[i].compose(o.p,o.q,ONE).multiply(_m2.makeTranslation(-B[names[i]].h.x,-B[names[i]].h.y,-B[names[i]].h.z));}
  let lift=0;
  if(opt.ground!==false){
    let mn=9,mb=9;const tmp=v3(0,0,0),acc=v3(0,0,0);const fL=B['foot.L'].i,fR=B['foot.R'].i,ankY=B['foot.L'].h.y+0.035;
    for(const s of A.samp){acc.set(0,0,0);for(let k=0;k<4;k++){const w=s[7+k];if(!w)continue;tmp.set(s[0],s[1],s[2]).applyMatrix4(mats[s[3+k]]);acc.addScaledVector(tmp,w);}
      if(acc.y<mn)mn=acc.y;const isF=s[1]<ankY||((s[3]===fL||s[3]===fR)&&s[7]>0.5);if(!isF&&acc.y<mb)mb=acc.y;}
    inst._lb=mb<8?-mb+0.001:0;
    lift=Math.max(-mn+0.001,inst._lb);
  }
  inst.lift=lift;
  for(let i=0;i<names.length;i++){const o=out[names[i]];const b=inst.bones[i];
    if(o){b.position.copy(o.p);b.position.y+=lift;b.quaternion.copy(o.q);}
    else{b.position.copy(B[names[i]].h);b.quaternion.identity();}
  }
  if(inst.shoe)for(const s of ['L','R']){const sh=inst.shoe[s],fb=inst.bones[A.B['foot.'+s].i];sh.fb.position.copy(fb.position);sh.fb.quaternion.copy(fb.quaternion);
    sh.tb.quaternion.setFromAxisAngle(A.latR,((inst.toeA&&inst.toeA[s])||0)*D2R);}
  inst.g.updateMatrixWorld(true);
  for(const bn in inst.att){const bi=A.B[bn].i;const b=inst.bones[bi];inst.att[bn].matrix.copy(b.matrix).multiply(_m2.makeTranslation(-B[bn].h.x,-B[bn].h.y,-B[bn].h.z));inst.att[bn].matrixWorldNeedsUpdate=true;}
  inst.out=out;
  return out;
}
/* palm center (world) for props */
function palmOf(inst,s){const A=inst.A,b=inst.bones[A.B['hand.'+s].i];const p=A.hand[s].palm.clone().sub(A.B['hand.'+s].h).applyQuaternion(b.quaternion).add(b.position);return p;}
function gripOf(inst,s){const A=inst.A,b=inst.bones[A.B['hand.'+s].i];return A.hand[s].grip.clone().sub(A.B['hand.'+s].h).applyQuaternion(b.quaternion).add(b.position);}
function palmAxis(inst,s){const A=inst.A,b=inst.bones[A.B['hand.'+s].i];return A.hand[s].W.clone().applyQuaternion(b.quaternion);}
function boneWorld(inst,n,rest){const A=inst.A,b=inst.bones[A.B[n].i];return rest.clone().sub(A.B[n].h).applyQuaternion(b.quaternion).add(b.position);}

/* ---------- sneakers ---------- */
function buildShoeData(who,s,B,skin){
  const fi=B['foot.'+s].i, A=B['foot.'+s].h, ay=A.y;
  const P=skin.pos,SI=skin.si,SW=skin.sw;const V=[];
  for(let i=0;i<P.length/3;i++){const z=P[3*i+2];if((s==='R')!==(z>0))continue;const y=P[3*i+1];if(y>ay+0.03)continue;
    V.push([P[3*i],y,z]);}
  let hx=9,tx=-9,soleY=9;V.forEach(v=>{hx=Math.min(hx,v[0]);tx=Math.max(tx,v[0]);soleY=Math.min(soleY,v[1]);});
  const len=tx-hx;const male=who==='t';
  const N=26,SOLE=male?0.016:0.014;
  const colY=ay-0.006; // collar height
  const sl=[];
  for(let j=0;j<=N;j++){const x=hx+len*j/N,win=len/N*1.6;let z0=9,z1=-9,yt=-9,cnt=0;
    V.forEach(v=>{if(Math.abs(v[0]-x)<win&&v[1]<colY+0.004){z0=Math.min(z0,v[2]);z1=Math.max(z1,v[2]);yt=Math.max(yt,v[1]);cnt++;}});
    sl.push({x,z0,z1,yt,cnt});}
  // fill empty, smooth
  for(let j=0;j<=N;j++)if(!sl[j].cnt){const o=sl[j-1]||sl[j+1];Object.assign(sl[j],{z0:o.z0,z1:o.z1,yt:o.yt});}
  const sm=k=>{const t=sl.map(o=>o[k]);for(let j=0;j<=N;j++){const a=t[Math.max(0,j-1)],b=t[j],c=t[Math.min(N,j+1)];sl[j][k]=k==='z0'?Math.min(a,b,c)*.5+b*.5:Math.max(a,b,c)*.5+b*.5;}};
  sm('z0');sm('z1');sm('yt');
  const y0=soleY+SOLE*0.6, n=2.7;
  const ax=A.x;
  sl.forEach(o=>{const mg=0.0012;o.zc=(o.z0+o.z1)/2;o.hw=(o.z1-o.z0)/2+mg;
    let top=Math.min(o.yt+0.006,colY);
    if(o.x<ax-0.012) top=Math.max(top,Math.min(o.yt+0.006,ay+0.004)); // heel counter a bit higher
    o.yb=y0;o.top=Math.max(top,y0+0.02);
    // enforce enclosure of all foot verts in the superellipse (for this slice)
    const win=len/N*1.6;let sc=1;const yc=(o.yb+o.top)/2,hh=(o.top-o.yb)/2;
    V.forEach(v=>{if(Math.abs(v[0]-o.x)>win||v[1]>o.top||v[1]<o.yb)return;const e=Math.pow(Math.abs(v[2]-o.zc)/(o.hw+0.0005),n)+Math.pow(Math.abs(v[1]-yc)/(hh+0.0001),n);if(e>sc)sc=e;});
    o.hw*=Math.pow(sc,1/n);});
  // upper-envelope smoothing (fills dips, keeps enclosure) + gentle blur
  for(const k of ['hw','top','zc'])for(let p=0;p<6;p++){const t=sl.map(o=>o[k]);for(let j=1;j<N;j++){const av=(t[j-1]+t[j+1])/2;sl[j][k]=k==='zc'?(t[j-1]+2*t[j]+t[j+1])/4:Math.max(t[j],av*0.6+t[j]*0.4);}}
  // end tapers (rounded toe and heel)
  const ring=[],M=28;
  const addSlice=(x,zc,hw,yb,top,kind)=>{const yc=(yb+top)/2,hh=(top-yb)/2;const r=[];
    for(let i=0;i<M;i++){const th=i/M*Math.PI*2,c=Math.cos(th),sn=Math.sin(th);
      const z=zc+hw*Math.sign(c)*Math.pow(Math.abs(c),2/n), y=yc+hh*Math.sign(sn)*Math.pow(Math.abs(sn),2/n);r.push([x,y,z]);}
    ring.push({r,kind,x});};
  const f=sl[N],h0=sl[0];
  [[-0.010,0.25],[-0.007,0.62],[-0.0035,0.86]].forEach(([dx,k])=>addSlice(h0.x+dx,h0.zc,h0.hw*k,h0.yb,h0.yb+(h0.top-h0.yb)*(0.35+0.65*k),'heel'));
  sl.forEach(o=>addSlice(o.x,o.zc,o.hw,o.yb,o.top,'mid'));
  [[0.003,0.9],[0.006,0.7],[0.0085,0.42],[0.010,0.15]].forEach(([dx,k])=>addSlice(f.x+dx,f.zc,f.hw*(0.55+0.45*k),f.yb,f.yb+(f.top-f.yb)*k,'toe'));
  // geometry: upper
  const pos=[],col=[],idx=[];
  const C=male?{up:[0.80,0.73,0.62],acc:[0.62,0.52,0.40],toe:[0.74,0.67,0.56],sole:[0.95,0.94,0.91],tread:[0.36,0.33,0.30],lin:[0.42,0.42,0.44],lace:[0.93,0.91,0.87]}
                :{up:[0.55,0.57,0.61],acc:[0.95,0.55,0.47],toe:[0.47,0.49,0.53],sole:[0.96,0.95,0.93],tread:[0.30,0.30,0.32],lin:[0.10,0.10,0.11],lace:[0.95,0.95,0.95]};
  const lin=c=>c.map(v=>Math.pow(v,2.2));
  const push=(p,c)=>{pos.push(p[0],p[1],p[2]);const l=lin(c);col.push(l[0],l[1],l[2]);return pos.length/3-1;};
  const base=pos.length/3;const R0=ring.length;
  ring.forEach((rg,j)=>rg.r.forEach(p=>{const u=(p[0]-hx)/len;let c=C.up;
    const side=Math.abs(p[2]-(sl[Math.max(0,Math.min(N,Math.round(u*N)))].zc))>0;
    if(rg.kind==='toe'||u>0.86)c=C.toe;
    const yr=(p[1]-y0);if(yr<0.007)c=C.acc;
    if(yr<0.03&&yr>0.011&&u>0.3&&u<0.78&&rg.kind==='mid'){const wv=Math.sin((u-0.3)/0.48*Math.PI);if(yr<0.011+0.016*wv&&yr>0.011+0.016*wv-0.006)c=C.acc;}
    if(rg.kind==='heel'||u<0.06)c=C.acc;
    push(p,c);}));
  for(let j=0;j<R0-1;j++)for(let i=0;i<M;i++){const a=base+j*M+i,b=base+j*M+(i+1)%M,c2=base+(j+1)*M+i,d=base+(j+1)*M+(i+1)%M;idx.push(a,c2,b,b,c2,d);}
  // caps
  const capH=push(ring[0].r[0].map((_,k)=>ring[0].r.reduce((a,p)=>a+p[k],0)/M),C.acc);
  for(let i=0;i<M;i++)idx.push(capH,base+i,base+(i+1)%M);
  const lt=base+(R0-1)*M;const capT=push(ring[R0-1].r[0].map((_,k)=>ring[R0-1].r.reduce((a,p)=>a+p[k],0)/M),C.toe);
  for(let i=0;i<M;i++)idx.push(capT,lt+(i+1)%M,lt+i);
  // collar opening: dark lining ellipse just under the top in the ankle zone
  const oc=sl.filter(o=>o.x>ax-0.03&&o.x<ax+0.04);
  if(oc.length){const cx=(oc[0].x+oc[oc.length-1].x)/2,rx=(oc[oc.length-1].x-oc[0].x)/2,zc=oc.reduce((a,o)=>a+o.zc,0)/oc.length,rz=Math.min(...oc.map(o=>o.hw))*0.92,yy=colY+0.0012;
    const c0=push([cx,yy,zc],C.lin);const K=24;const rim=[];
    for(let i=0;i<=K;i++){const th=i/K*Math.PI*2;rim.push(push([cx+rx*Math.cos(th),yy,zc+rz*Math.sin(th)],C.lin));}
    for(let i=0;i<K;i++)idx.push(c0,rim[i+1],rim[i]);
    // padded collar rim (torus-like ring)
    const RR=[];for(let i=0;i<=K;i++){const th=i/K*Math.PI*2;for(let k=0;k<6;k++){const ph=k/6*Math.PI*2;const rr=0.0045;
      const ox=Math.cos(th),oz=Math.sin(th);RR.push(push([cx+(rx+rr*Math.cos(ph))*ox,yy+rr*Math.sin(ph),zc+(rz+rr*Math.cos(ph))*oz],k<3?C.up:C.lin));}}
    const rb=RR[0];for(let i=0;i<K;i++)for(let k=0;k<6;k++){const a=rb+i*6+k,b=rb+i*6+(k+1)%6,c2=rb+(i+1)*6+k,d=rb+(i+1)*6+(k+1)%6;idx.push(a,b,c2,b,d,c2);}
  }
  // laces: thin bars across the instep
  const lacesAt=[0.47,0.53,0.59,0.65];
  lacesAt.forEach(u=>{const o=sl[Math.round(u*N)];const x=o.x,yt=o.top+0.0008,w=o.hw*0.36;
    const q=[[x-0.0035,yt,o.zc-w],[x+0.0035,yt,o.zc-w],[x+0.0035,yt,o.zc+w],[x-0.0035,yt,o.zc+w]].map(p=>push(p,C.lace));
    const q2=[[x-0.0035,yt+0.0018,o.zc-w],[x+0.0035,yt+0.0018,o.zc-w],[x+0.0035,yt+0.0018,o.zc+w],[x-0.0035,yt+0.0018,o.zc+w]].map(p=>push(p,C.lace));
    idx.push(q2[0],q2[2],q2[1],q2[0],q2[3],q2[2]);
    for(let e=0;e<4;e++){const a=q[e],b=q[(e+1)%4],c2=q2[e],d=q2[(e+1)%4];idx.push(a,b,d,a,d,c2);} });
  // sole: rounded slab following the outline
  const sb=pos.length/3;const SM=20;const sRings=[];
  const outl=[];
  const so=k=>({x:h0.x-0.016+(f.x+0.0165-(h0.x-0.016))*k});
  for(let j=0;j<=N+6;j++){const t=j/(N+6);const x=hx-0.0105+(len+0.0205)*t;
    // interpolate outline width
    let o;const u=(x-hx)/len*N;const j0=Math.max(0,Math.min(N,Math.floor(u))),j1=Math.min(N,j0+1),fr=Math.max(0,Math.min(1,u-j0));
    const zc=sl[j0].zc*(1-fr)+sl[j1].zc*fr;let hw=(sl[j0].hw*(1-fr)+sl[j1].hw*fr)+0.003;
    const ex=x<hx?(hx-x)/0.0105:(x>tx?(x-tx)/0.010:0);hw*=Math.sqrt(Math.max(0.02,1-ex*ex));
    outl.push({x,zc,hw});}
  outl.forEach(o=>{const r=[];for(let i=0;i<SM;i++){const th=i/SM*Math.PI*2,c=Math.cos(th),sn=Math.sin(th);
     const z=o.zc+o.hw*Math.sign(c)*Math.pow(Math.abs(c),2/6), y=soleY+SOLE/2+SOLE/2*Math.sign(sn)*Math.pow(Math.abs(sn),2/6);
     r.push(push([o.x,y,z],sn<-0.5?C.tread:C.sole));}sRings.push(r);});
  for(let j=0;j<sRings.length-1;j++)for(let i=0;i<SM;i++){const a=sRings[j][i],b=sRings[j][(i+1)%SM],c2=sRings[j+1][i],d=sRings[j+1][(i+1)%SM];idx.push(a,c2,b,b,c2,d);}
  [0,sRings.length-1].forEach((j,e)=>{const r=sRings[j];const cc=push(r.reduce((a,v)=>[a[0]+pos[3*v]/SM,a[1]+pos[3*v+1]/SM,a[2]+pos[3*v+2]/SM],[0,0,0]),C.sole);
    for(let i=0;i<SM;i++)e?idx.push(cc,r[i],r[(i+1)%SM]):idx.push(cc,r[(i+1)%SM],r[i]);});
  const xb=hx+0.70*len;const sAt=u=>sl[Math.round(u*N)];const top1=[hx+0.55*len,sAt(0.55).top],top2=[hx+0.80*len,sAt(0.80).top*0.85+y0*0.15];let top3=[tx,soleY];for(let i=0;i<pos.length;i+=3){const u=(pos[i]-hx)/len;if(u>0.9&&u<1.05&&pos[i+1]>top3[1]&&pos[i]>top3[0]-0.03)top3=[pos[i],pos[i+1]];}
  const tw=new Float32Array(pos.length/3);
  for(let i=0;i<tw.length;i++){const t=Math.max(0,Math.min(1,(pos[3*i]-(xb-0.012))/0.026));tw[i]=t*t*(3-2*t);}
  return {pos:new Float32Array(pos),col:new Float32Array(col),idx,tw,xb,top1,top2,top3,hx:hx-0.0105,tx:tx+0.010,soleY};
}
function buildShoes(inst){
  const A=inst.A;const M=avMats();
  if(!M.sneaker){M.sneaker=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.72,metalness:0,side:THREE.DoubleSide});}
  inst.shoe={};
  for(const s of ['L','R']){const sd=A.shoe[s],H=A.B['foot.'+s].h;
    if(!sd.geo){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(sd.pos,3));g.setAttribute('color',new THREE.BufferAttribute(sd.col,3));
      const n=sd.tw.length,si=new Uint16Array(4*n),sw=new Float32Array(4*n);for(let i=0;i<n;i++){si[4*i+1]=1;sw[4*i]=1-sd.tw[i];sw[4*i+1]=sd.tw[i];}
      g.setAttribute('skinIndex',new THREE.BufferAttribute(si,4));g.setAttribute('skinWeight',new THREE.BufferAttribute(sw,4));
      g.setIndex(sd.idx);g.computeVertexNormals();g.computeBoundingSphere();sd.geo=g;}
    const fb=new THREE.Bone(),tb=new THREE.Bone();fb.position.copy(H);fb.add(tb);tb.position.set(sd.xb-H.x,sd.soleY-H.y,0);inst.g.add(fb);
    inst.g.updateMatrixWorld(true);
    const m=new THREE.SkinnedMesh(sd.geo,M.sneaker);m.castShadow=true;m.receiveShadow=true;m.frustumCulled=false;inst.g.add(m);
    m.bind(new THREE.Skeleton([fb,tb]),new THREE.Matrix4());
    inst.shoe[s]={fb,tb,m};}
}

/* ---------- arm/armpit weight cleanup: sleeve + arm skin follow the arm, not the ribs ---------- */
function armReweight(B,meshes){
  const sp=new Set(['spine01','spine02','spine03','clavicle.L','clavicle.R'].map(n=>B[n]&&B[n].i));
  for(const s of ['L','R']){
    const ua=B['upperarm.'+s].h,fa=B['forearm.'+s].h,ax=fa.clone().sub(ua).normalize();
    const iUA=B['upperarm.'+s].i,iSH=B['shoulder.'+s].i,sg=s==='R'?1:-1;
    // arm radius from clean upper-arm skin
    const skin=meshes.find(m=>m.name==='skin');const rs=[];
    for(let i=0;i<skin.pos.length/3;i++){if(skin.pos[3*i+2]*sg<0.05)continue;let w=0;for(let k=0;k<4;k++)if(skin.si[4*i+k]===iUA)w+=skin.sw[4*i+k]/255;if(w<0.95)continue;
      const d=v3(skin.pos[3*i],skin.pos[3*i+1],skin.pos[3*i+2]).sub(ua);const t=d.dot(ax);if(t<0.06||t>0.13)continue;rs.push(d.addScaledVector(ax,-t).length());}
    rs.sort((a,b)=>a-b);const aR=rs.length?rs[Math.floor(rs.length*0.6)]:0.045;
    const med=v3(0,0,-sg).addScaledVector(ax,-v3(0,0,-sg).dot(ax)).normalize();
    for(const m of meshes){if(!m.si)continue;const n=m.pos.length/3;const off=m.name==='skin'?0:0.012;
      for(let i=0;i<n;i++){if(m.pos[3*i+2]*sg<0.03)continue;
        const d=v3(m.pos[3*i],m.pos[3*i+1],m.pos[3*i+2]).sub(ua);const t=d.dot(ax);if(t<-0.04||t>0.14)continue;
        const pr=d.clone().addScaledVector(ax,-t);const rad=pr.length();const mc=rad>1e-6?pr.dot(med)/rad:0;
        const lim=aR+off+0.006+(mc<0?0.012:0); // lateral side can bulge more (deltoid)
        const fR=1-Math.min(1,Math.max(0,(rad-lim)/0.018));
        const fT=Math.min(1,Math.max(0,(t+0.01)/0.06));
        const f=fR*fR*(3-2*fR)*fT*fT*(3-2*fT);if(f<=0.01)continue;
        // move spine/clavicle weight to upper arm (and a little to shoulder near the joint)
        const W={};for(let k=0;k<4;k++){const w=m.sw[4*i+k];if(w)W[m.si[4*i+k]]=(W[m.si[4*i+k]]||0)+w/255;}
        let mv=0;for(const b in W)if(sp.has(+b)){const x=W[b]*f;W[b]-=x;mv+=x;}
        if(mv<=0)continue;const toSh=mv*0.3*(1-fT);W[iUA]=(W[iUA]||0)+mv-toSh;W[iSH]=(W[iSH]||0)+toSh;
        const ent=Object.entries(W).filter(e=>e[1]>0.004).sort((a,b)=>b[1]-a[1]).slice(0,4);const tot=ent.reduce((a,e)=>a+e[1],0);
        let acc=0;for(let k=0;k<4;k++){if(k<ent.length){const v=k===ent.length-1?255-acc:Math.round(ent[k][1]/tot*255);m.si[4*i+k]=+ent[k][0];m.sw[4*i+k]=v;acc+=v;}else{m.si[4*i+k]=0;m.sw[4*i+k]=0;}}
      }}
  }
}

/* soften chest detail under the top (both skin and top, same operation -> offset preserved) */
function smoothChest(meshes,shC){
  for(const m of meshes){if(m.name!=='skin'&&m.name!=='top')continue;const P=m.pos,n=P.length/3,I=m.geo.index.array;
    const key=i=>Math.round(P[3*i]*2000)+','+Math.round(P[3*i+1]*2000)+','+Math.round(P[3*i+2]*2000);
    const id=new Int32Array(n),map=new Map();let u=0;for(let i=0;i<n;i++){const k=key(i);let v=map.get(k);if(v===undefined){v=u++;map.set(k,v);}id[i]=v;}
    const w=new Float32Array(u),pos=new Float32Array(u*3),cnt=new Float32Array(u);
    for(let i=0;i<n;i++){const v=id[i];pos[3*v]=P[3*i];pos[3*v+1]=P[3*i+1];pos[3*v+2]=P[3*i+2];}
    for(let v=0;v<u;v++){const x=pos[3*v],y=pos[3*v+1];const dy=shC.y-y;const fy=dy<0.04||dy>0.30?0:Math.min(1,Math.min(dy-0.04,0.30-dy)/0.05);const fx=Math.min(1,Math.max(0,(x-shC.x-0.02)/0.04));w[v]=fy*fx;}
    const nb=new Map();const add=(a,b)=>{if(a===b)return;let s1=nb.get(a);if(!s1){s1=new Set();nb.set(a,s1);}s1.add(b);};
    for(let f=0;f<I.length;f+=3){const a=id[I[f]],b=id[I[f+1]],c=id[I[f+2]];add(a,b);add(b,a);add(b,c);add(c,b);add(a,c);add(c,a);}
    for(let it=0;it<8;it++){const np=pos.slice();for(let v=0;v<u;v++){if(w[v]<=0)continue;const s1=nb.get(v);if(!s1)continue;let ax=0,ay=0,az=0,k=0;s1.forEach(q=>{ax+=pos[3*q];ay+=pos[3*q+1];az+=pos[3*q+2];k++;});
      const l=0.5*w[v];np[3*v]+= (ax/k-pos[3*v])*l;np[3*v+1]+=(ay/k-pos[3*v+1])*l;np[3*v+2]+=(az/k-pos[3*v+2])*l;}pos.set(np);}
    for(let i=0;i<n;i++){const v=id[i];if(w[v]<=0)continue;P[3*i]=pos[3*v];P[3*i+1]=pos[3*v+1];P[3*i+2]=pos[3*v+2];}
    m.geo.attributes.position.needsUpdate=true;
    // recompute normals in region (seam-consistent)
    const fn=new Float32Array(u*3);const a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3();
    for(let f=0;f<I.length;f+=3){const A=id[I[f]],Bb=id[I[f+1]],C=id[I[f+2]];if(w[A]<=0&&w[Bb]<=0&&w[C]<=0)continue;a.fromArray(pos,3*A);b.fromArray(pos,3*Bb);c.fromArray(pos,3*C);
      const nn=b.sub(a).cross(c.sub(a));[A,Bb,C].forEach(v=>{fn[3*v]+=nn.x;fn[3*v+1]+=nn.y;fn[3*v+2]+=nn.z;});}
    const N=m.geo.attributes.normal;const dst=N.array;const sc=N.normalized?127:1;
    for(let i=0;i<n;i++){const v=id[i];if(w[v]<=0)continue;a.fromArray(fn,3*v).normalize();const o=new THREE.Vector3(N.getX(i),N.getY(i),N.getZ(i));const t=Math.min(1,w[v]*1.5);o.lerp(a,t).normalize();N.setXYZ(i,o.x,o.y,o.z);}
    N.needsUpdate=true;}
}
