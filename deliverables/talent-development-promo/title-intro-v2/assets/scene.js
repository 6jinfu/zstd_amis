window.createRibbonScene=function(canvas){
 const W=1728,H=1117;
 const renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,preserveDrawingBuffer:true,powerPreference:"high-performance"});
 renderer.setPixelRatio(2);
 renderer.setSize(W,H,false);
 renderer.outputColorSpace=THREE.SRGBColorSpace;
 renderer.toneMapping=THREE.ACESFilmicToneMapping;
 renderer.toneMappingExposure=1.18;
 renderer.setClearColor(0x000000,0);
 const scene=new THREE.Scene();
 const camera=new THREE.PerspectiveCamera(34,W/H,.1,60);
 const environment=document.createElement("canvas");environment.width=512;environment.height=256;
 const ctx=environment.getContext("2d");
 const grad=ctx.createLinearGradient(0,0,0,256);grad.addColorStop(0,"#ebf1fa");grad.addColorStop(.42,"#9eafc8");grad.addColorStop(.65,"#495e80");grad.addColorStop(1,"#dbe5f2");
 ctx.fillStyle=grad;ctx.fillRect(0,0,512,256);
 ctx.fillStyle="#ffffff";ctx.fillRect(18,18,88,170);ctx.fillRect(310,25,164,54);ctx.fillRect(214,160,35,84);
 const envTex=new THREE.CanvasTexture(environment);envTex.mapping=THREE.EquirectangularReflectionMapping;envTex.colorSpace=THREE.SRGBColorSpace;
 const pmrem=new THREE.PMREMGenerator(renderer);scene.environment=pmrem.fromEquirectangular(envTex).texture;pmrem.dispose();envTex.dispose();
 scene.add(new THREE.AmbientLight(0xc9daff,1.3));
 const key=new THREE.DirectionalLight(0xffffff,4);key.position.set(-5,8,8);scene.add(key);
 const fill=new THREE.DirectionalLight(0xa8c9ff,2);fill.position.set(6,-2,5);scene.add(fill);
 const rim=new THREE.DirectionalLight(0xffffff,2.8);rim.position.set(1,3,-5);scene.add(rim);
 function makeRibbon(rx,ry,width,twist){
  const vertices=[],indices=[],N=240,M=10;
  for(let i=0;i<=N;i++){
   const t=i/N*Math.PI*2,ct=Math.cos(t),st=Math.sin(t);
   const center=new THREE.Vector3(rx*ct,ry*st,.34*Math.sin(t*2));
   const normal=new THREE.Vector3(ct/rx,st/ry,0).normalize();
   const angle=t*twist+.22*Math.sin(t*2);
   const broad=normal.clone().multiplyScalar(Math.cos(angle)).add(new THREE.Vector3(0,0,Math.sin(angle)));
   const thin=normal.clone().multiplyScalar(-Math.sin(angle)).add(new THREE.Vector3(0,0,Math.cos(angle)));
   const band=width*(.84+.16*Math.cos(t*2-.7));
   for(let j=0;j<=M;j++){
    const a=j/M*Math.PI*2;
    const p=center.clone().addScaledVector(broad,Math.cos(a)*band).addScaledVector(thin,Math.sin(a)*.045);
    vertices.push(p.x,p.y,p.z);
    if(i<N&&j<M){const k=i*(M+1)+j;indices.push(k,k+1,k+M+1,k+1,k+M+2,k+M+1);}
   }
  }
  const geo=new THREE.BufferGeometry();geo.setAttribute("position",new THREE.Float32BufferAttribute(vertices,3));geo.setIndex(indices);geo.computeVertexNormals();return geo;
 }
 const colors=[0x89b9f5,0xe2edfc,0xc3dcfb,0xf3f6fb];
 const ribbons=colors.map((color,i)=>{
  const material=new THREE.MeshPhysicalMaterial({color,metalness:i===0?.38:.19,roughness:.24,clearcoat:1,clearcoatRoughness:.16,envMapIntensity:1.15,side:THREE.DoubleSide});
  const mesh=new THREE.Mesh(makeRibbon(3.65-i*.18,2.35-i*.10,.19+i*.018,i%2===0?1:-1),material);
  scene.add(mesh);return mesh;
 });
 const destinations=[[-6.7,-3.0,-1.2],[6.5,3.2,-.8],[-7.2,4.1,-3.0],[6.9,-4.1,-2.4]];
 const rotations=[[-.32,.5,-.45],[.68,-.66,.70],[-.60,-.40,-.75],[.34,.72,.45]];
 const clamp=x=>Math.max(0,Math.min(1,x));
 const ease=x=>{x=clamp(x);return x*x*x*(x*(x*6-15)+10);};
 const mix=(a,b,t)=>a+(b-a)*t;
 return function renderAt(t){
  const reveal=ease((t-.10)/1.55),spread=ease((t-.80)/2.65),exit=ease((t-7.15)/.85);
  camera.position.set(mix(-.6,0,reveal),mix(.25,0,reveal),mix(6.6,14.0,reveal)+.34*ease((t-3.3)/3.8)-exit*.8);
  camera.lookAt(0,0,0);
  ribbons.forEach((mesh,i)=>{
   const phase=i*Math.PI/2;
   const baseX=.37*Math.cos(phase),baseY=.37*Math.sin(phase);
   const drift=Math.max(0,t-3.45);
   mesh.position.set(mix(baseX,destinations[i][0],spread)+.045*Math.sin(drift*.5+i),mix(baseY,destinations[i][1],spread)+.055*Math.sin(drift*.6+phase),mix(i*.13,destinations[i][2],spread));
   mesh.rotation.set(mix(.62*Math.sin(phase),rotations[i][0],spread)+.036*drift,mix(.72*Math.cos(phase),rotations[i][1],spread)-.025*drift,mix(phase*.42-.65,rotations[i][2],spread)+mix(.60,0,spread)*(1-reveal));
   const scale=mix(.92,1.36-i*.055,spread);mesh.scale.setScalar(scale);
  });
  key.position.x=-5+t*.13;fill.intensity=2+.13*Math.sin(t*.6);
  renderer.render(scene,camera);
 };
};
