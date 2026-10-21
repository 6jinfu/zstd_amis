window.createRibbonScene=function(canvas){
 const W=1728,H=1117;
 const renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,preserveDrawingBuffer:true,powerPreference:"high-performance"});
 renderer.setPixelRatio(2);renderer.setSize(W,H,false);
 renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;renderer.setClearColor(0,0);
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(34,W/H,.1,60);
 const envCanvas=document.createElement("canvas");envCanvas.width=512;envCanvas.height=256;
 const ctx=envCanvas.getContext("2d"),grad=ctx.createLinearGradient(0,0,0,256);
 grad.addColorStop(0,"#f4f8ff");grad.addColorStop(.45,"#b6cbe2");grad.addColorStop(.72,"#6d8bb3");grad.addColorStop(1,"#eff5fc");
 ctx.fillStyle=grad;ctx.fillRect(0,0,512,256);ctx.fillStyle="#fff";ctx.fillRect(30,20,96,170);ctx.fillRect(278,12,186,58);ctx.fillRect(234,176,44,70);
 const env=new THREE.CanvasTexture(envCanvas);env.mapping=THREE.EquirectangularReflectionMapping;env.colorSpace=THREE.SRGBColorSpace;
 const pmrem=new THREE.PMREMGenerator(renderer);scene.environment=pmrem.fromEquirectangular(env).texture;pmrem.dispose();env.dispose();
 scene.add(new THREE.AmbientLight(0xd0e2ff,1.45));
 const key=new THREE.DirectionalLight(0xffffff,3.5);key.position.set(-5,7,8);scene.add(key);
 const fill=new THREE.DirectionalLight(0xc5e1ff,2.3);fill.position.set(6,-2,6);scene.add(fill);
 const rim=new THREE.DirectionalLight(0xffffff,2);rim.position.set(0,5,-4);scene.add(rim);
 const clamp=x=>Math.max(0,Math.min(1,x));
 const smooth=x=>{x=clamp(x);return x*x*x*(x*(6*x-15)+10);};
 const mix=(a,b,t)=>a+(b-a)*t;
 const N=180,M=8,TAU=Math.PI*2;
 const specs=[
  {color:0x82b7f2,width:.28,phase:0,side:1,level:.25,z:.65,offset:0},
  {color:0xe9f3ff,width:.34,phase:1.65,side:-1,level:-.65,z:-.6,offset:.18},
  {color:0xbdddfa,width:.13,phase:3.3,side:1,level:2.2,z:-1.6,offset:.34}
 ];
 function path(u,t,s){
  const arrived=smooth((t-.03-s.offset)/1.1),opened=smooth((t-1.2-s.offset)/2.15);
  const phase=s.phase+t*.34,angle=TAU*u+phase;
  const pulse=1+.035*Math.sin(t*2+s.phase);
  const loopX=3.15*Math.sin(angle)*pulse+.38*Math.sin(angle*2);
  const loopY=2.55*Math.cos(angle)*pulse+.22*Math.sin(angle*3);
  const loopZ=1.2*Math.sin(angle*2+.6);
  const xOpen=-12+24*u;
  const yOpen=s.side*(3.75-3.9*Math.pow(2*u-1,2))+s.level+.38*Math.sin(u*TAU+t*1.25+s.phase);
  const zOpen=s.z+.76*Math.sin(u*TAU+t*.72+s.phase);
  const enterX=-7.7*(1-arrived),enterY=-3.3*(1-arrived);
  const drift=.18*Math.sin(t*1.1+s.phase)*opened;
  const exit=smooth((t-7.1)/.9);
  return new THREE.Vector3(mix(loopX,xOpen,opened)+enterX+drift+exit*4,mix(loopY,yOpen,opened)+enterY+.12*Math.cos(t*.9+s.phase)*opened+exit*2,mix(loopZ,zOpen,opened));
 }
 const ribbons=specs.map((s,i)=>{
  const positions=new Float32Array((N+1)*(M+1)*3),indices=[];
  for(let a=0;a<N;a++)for(let b=0;b<M;b++){const k=a*(M+1)+b;indices.push(k,k+1,k+M+1,k+1,k+M+2,k+M+1);}
  const geo=new THREE.BufferGeometry();geo.setAttribute("position",new THREE.BufferAttribute(positions,3).setUsage(THREE.DynamicDrawUsage));geo.setIndex(indices);
  const material=new THREE.MeshPhysicalMaterial({color:s.color,metalness:i===0?.22:.14,roughness:.28,clearcoat:.9,clearcoatRoughness:.18,envMapIntensity:1.1,side:THREE.DoubleSide});
  const mesh=new THREE.Mesh(geo,material);mesh.frustumCulled=false;scene.add(mesh);return mesh;
 });
 const pearlMaterial=new THREE.MeshPhysicalMaterial({color:0xe8f3ff,metalness:.12,roughness:.18,clearcoat:1});
 const pearls=[.14,.09,.11].map((size,i)=>{const p=new THREE.Mesh(new THREE.SphereGeometry(size,24,16),pearlMaterial);scene.add(p);return p;});
 const up=new THREE.Vector3(0,0,1);
 function deform(mesh,s,t){
  const arr=mesh.geometry.attributes.position.array;
  for(let a=0;a<=N;a++){
   const u=a/N,p=path(u,t,s),prev=path(Math.max(0,u-.001),t,s),next=path(Math.min(1,u+.001),t,s);
   const tangent=next.sub(prev).normalize(),radial=new THREE.Vector3().crossVectors(tangent,up).normalize(),binormal=new THREE.Vector3().crossVectors(tangent,radial).normalize();
   const roll=u*TAU*.72+Math.sin(u*TAU+t*1.2+s.phase)*.48+s.phase*.4;
   const broad=radial.clone().multiplyScalar(Math.cos(roll)).addScaledVector(binormal,Math.sin(roll));
   const thin=radial.clone().multiplyScalar(-Math.sin(roll)).addScaledVector(binormal,Math.cos(roll));
   const taper=Math.pow(Math.max(.0001,Math.sin(Math.PI*u)),.42),width=s.width*taper*(.91+.09*Math.sin(u*TAU+t*.8));
   for(let b=0;b<=M;b++){
    const angle=b/M*TAU,k=(a*(M+1)+b)*3,w=Math.cos(angle)*width,d=Math.sin(angle)*.030*taper;
    arr[k]=p.x+broad.x*w+thin.x*d;arr[k+1]=p.y+broad.y*w+thin.y*d;arr[k+2]=p.z+broad.z*w+thin.z*d;
   }
  }
  mesh.geometry.attributes.position.needsUpdate=true;mesh.geometry.computeVertexNormals();
 }
 return function renderAt(t){
  camera.position.set(.10*Math.sin(t*.85),.06*Math.sin(t*.7),mix(12.2,14.6,smooth((t-.2)/2.6))+.08*Math.sin(t*1.3));camera.lookAt(0,.05,0);
  ribbons.forEach((mesh,i)=>deform(mesh,specs[i],t));
  pearls.forEach((p,i)=>{
   const u=.13+i*.30+.055*Math.sin(t*1.1+i*1.7),pos=path(u,t,specs[i]);
   p.position.copy(pos).add(new THREE.Vector3(.05,.20+i*.10,.16));p.scale.setScalar(.88+.12*Math.sin(t*1.7+i));
  });
  key.position.set(-5+1.25*Math.sin(t*.7),7,8);fill.intensity=2.3+.22*Math.sin(t*1.3);
  renderer.render(scene,camera);
 };
};
