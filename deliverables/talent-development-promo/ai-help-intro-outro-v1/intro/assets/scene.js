window.createAirScene=function(canvas,options={}){
 const W=1728,H=1117,ratio=2;
 canvas.width=W*ratio;canvas.height=H*ratio;
 const c=canvas.getContext("2d",{alpha:false});c.scale(ratio,ratio);
 const clamp=x=>Math.max(0,Math.min(1,x));
 const smooth=x=>{x=clamp(x);return x*x*x*(x*(6*x-15)+10);};
 const out=x=>1-Math.pow(1-clamp(x),3);
 const mix=(a,b,t)=>a+(b-a)*t;
 const TAU=Math.PI*2;
 function point(u,t,lane){
  const spread=smooth((t-.08)/2.35),leave=options.exit===false?0:smooth((t-6.95)/1.05);
  const angle=2.68+u*2.13;
  const cx=mix(1240,1558,spread)+17*Math.sin(t*.46)+leave*150;
  const cy=mix(1040,945,spread)+12*Math.cos(t*.55)+leave*55;
  const rx=1045+lane*143,ry=1300+lane*114;
  const flutter=9*Math.sin(u*TAU*1.45-t*1.35)+5*Math.sin(u*TAU*2.4-t*.82);
  return {x:cx+(rx+flutter)*Math.cos(angle),y:cy+(ry+flutter)*Math.sin(angle)};
 }
 function curve(t,lane,from=0,to=1){
  c.beginPath();
  for(let i=0;i<=120;i++){const p=point(mix(from,to,i/120),t,lane);if(i===0)c.moveTo(p.x,p.y);else c.lineTo(p.x,p.y);}
 }
 function band(t){
  const reveal=out((t+.22)/1.95),p=[];
  for(let i=0;i<=150;i++){
   const u=i/150*reveal,a=point(u,t,0),b=point(u+.001,t,0);
   const dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy);
   const width=(64+30*Math.sin(u*Math.PI)+12*Math.sin(u*TAU-t*.85))*Math.sin(Math.PI*Math.min(.98,u/reveal));
   p.push({a,x:-dy/len,y:dx/len,width});
  }
  const g=c.createLinearGradient(420,250,1030,980);
  g.addColorStop(0,"rgba(255,255,255,.78)");g.addColorStop(.35,"rgba(255,255,255,.99)");g.addColorStop(.72,"rgba(255,255,255,.88)");g.addColorStop(1,"rgba(234,242,255,.18)");
  c.fillStyle=g;c.beginPath();
  p.forEach((q,i)=>{const x=q.a.x+q.x*q.width,y=q.a.y+q.y*q.width;if(i===0)c.moveTo(x,y);else c.lineTo(x,y);});
  for(let i=p.length-1;i>=0;i--){const q=p[i];c.lineTo(q.a.x-q.x*q.width*.55,q.a.y-q.y*q.width*.55);}
  c.closePath();c.fill();
  c.lineWidth=1.2;c.strokeStyle="rgba(255,255,255,.85)";curve(t,0,0,reveal);c.stroke();
 }
 function halo(x,y,r,color,opacity){
  const g=c.createRadialGradient(x,y,0,x,y,r);
  g.addColorStop(0,color);g.addColorStop(1,"rgba(255,255,255,0)");
  c.globalAlpha=opacity;c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);c.globalAlpha=1;
 }
 function pearl(x,y,r,alpha,roll){
  c.save();c.globalAlpha=alpha;c.translate(x,y);c.rotate(roll);
  const g=c.createRadialGradient(-r*.35,-r*.42,0,-r*.35,-r*.42,r*1.6);
  g.addColorStop(0,"#ffffff");g.addColorStop(.40,"#fdfdff");g.addColorStop(.70,"#f1eeff");g.addColorStop(.90,"#e2e1ff");g.addColorStop(1,"#d8dfff");
  c.fillStyle=g;c.beginPath();c.ellipse(0,0,r,r*(1+.014*Math.sin(roll*3)),0,0,TAU);c.fill();
  const wash=c.createRadialGradient(-r*.5,-r*.56,0,-r*.5,-r*.56,r*1.4);
  wash.addColorStop(0,"rgba(255,255,255,.38)");wash.addColorStop(1,"rgba(255,255,255,0)");
  c.fillStyle=wash;c.fill();c.restore();
 }
 return function renderAt(t){
  const exit=options.exit===false?0:smooth((t-7.03)/.97),entered=out((t+.15)/1.65);
  c.clearRect(0,0,W,H);
  const base=c.createLinearGradient(0,H,W,0);
  base.addColorStop(0,"#f2f3ff");base.addColorStop(.47,"#f3f8ff");base.addColorStop(1,"#d2e5ff");
  c.fillStyle=base;c.fillRect(0,0,W,H);
  halo(845+22*Math.sin(t*.6),565,825,"rgba(255,255,255,.98)",1);
  halo(1530-23*Math.cos(t*.75),250,570,"rgba(187,216,255,.36)",.68);
  halo(230,1100,520,"rgba(226,226,255,.40)",.40);
  c.globalAlpha=.72*entered*(1-exit*.65);
  for(let k=3;k>=1;k--){
   const end=out((t-.11*k+.26)/1.86);
   c.strokeStyle=k===2?"rgba(164,172,255,.44)":"rgba(169,187,255,.43)";
   c.lineWidth=k===2?1.55:1.20;curve(t,k*.8,0,end);c.stroke();
  }
  c.globalAlpha=entered*(1-exit*.78);band(t);c.globalAlpha=1;
  const u=.46+.035*out(t/2.1)+.012*Math.sin(t*.65),small=point(u,t,1.40);
  const arrive=out((t-.08)/1.2),follow=smooth((t-.20)/1.85);
  pearl(small.x+mix(-60,0,follow),small.y+mix(96,0,follow),mix(35,40,arrive),arrive*(1-exit),-.12+t*.09);
  const rightX=1450-25*Math.sin(t*.52)+mix(85,0,out((t-.18)/1.45))+exit*120;
  const rightY=244+17*Math.sin(t*.68+.35)-exit*65;
  pearl(rightX,rightY,104+2.4*Math.sin(t*.86+.6),out((t-.10)/1.2)*(1-exit),-.05+.1*Math.sin(t*.43));
  const near=out((t-.36)/1.62);
  pearl(236+mix(-165,0,near)+25*Math.sin(t*.46),1100+mix(150,0,near)-27*Math.sin(t*.61),222+3*Math.sin(t*.8),near*.92*(1-exit),-.1+.065*Math.cos(t*.7));
  pearl(1850-24*Math.sin(t*.6),815+19*Math.sin(t*.52),183,.75*out((t-.45)/1.4)*(1-exit),.04);
  const sheen=smooth((t-.6)/1.2)*(1-smooth((t-2.1)/1.1));
  halo(340+t*410,365,380,"rgba(255,255,255,.68)",sheen*.35);
 };
};
