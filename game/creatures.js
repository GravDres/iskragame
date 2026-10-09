'use strict';
(function(I){
const G=I.Mesh,oldCreature=I.Models.creature,rock=[.08,.82],metal=[.8,.28],organic=[0,.64],glass=[.12,.18],gold=[.84,.57,.23],steel=[.46,.59,.68];
function creature(out,e,time){
 const d=I.ENEMIES[e.type];if(!d.boss&&!['wisp','shade'].includes(e.type)){oldCreature(out,e,time);return;}
 const start=out.length,scale=d.scale,kind=e.type;
 const orb=(x,y,z,rx,ry,rz,c,m=organic,glow=0)=>G.ellipsoid(out,x,y,z,rx,ry,rz,c,m,glow,14,7);
 const link=(a,b,r1,r2,c,m=organic,glow=0)=>G.cylinder(out,a,b,r1,r2,c,m,glow,10);
 const plate=(x,y,z,w,h,deep,c,m=metal)=>G.bevel(out,x,y,z,w,h,deep,c,.035,m);
 const ring=(x,y,z,r,thick,c,axis='z',glow=0)=>{for(let k=0;k<24;k++){const a=k*Math.PI/12,b=(k+1)*Math.PI/12,p=t=>axis==='y'?[x+Math.cos(t)*r,y,z+Math.sin(t)*r]:axis==='x'?[x,y+Math.cos(t)*r,z+Math.sin(t)*r]:[x+Math.cos(t)*r,y+Math.sin(t)*r,z];link(p(a),p(b),thick,thick,c,metal,glow);}};
 const eye=(x,y,z,size,c)=>{orb(x,y,z,size,size*.7,size*.35,[.02,.04,.055],glass);orb(x,y,z-.024,size*.65,size*.55,size*.26,c,glass,.8);orb(x-size*.18,y+size*.15,z-.047,size*.16,size*.16,size*.12,[.94,1,1],glass,1.2);};
 if(kind==='root'){
  const bark=[.31,.19,.115],leaf=[.18,.36,.26];orb(0,.95,0,.36,.60,.29,bark);orb(0,1.48,-.10,.29,.32,.23,[.41,.27,.15]);
  for(const side of [-1,1]){link([side*.22,.62,0],[side*.30,.20,.04],.15,.09,bark);for(let k=0;k<3;k++)link([side*.30,.20,.04],[side*(.37+k*.13),.03,-.24+k*.16],.065,.008,bark);link([side*.27,1.22,0],[side*.54,.95,-.04],.18,.14,bark);link([side*.54,.95,-.04],[side*.66,.48,-.24],.13,.07,bark);for(let k=0;k<3;k++)link([side*.64,.50,-.22],[side*(.61+k*.055),.28,-.34],.029,.004,bark);link([side*.17,1.67,0],[side*.33,2.03,.06],.08,.026,bark);link([side*.31,1.99,.05],[side*.62,2.15,.11],.025,.003,bark);link([side*.32,1.95,.06],[side*.31,2.21,.08],.025,.002,bark);orb(side*.48,1.28,.06,.25,.20,.26,leaf);orb(side*.47,2.12,.1,.19,.1,.19,leaf);eye(side*.13,1.53,-.32,.058,[.75,.99,.49]);for(let k=0;k<3;k++)link([side*.35,1.22+k*.06,-.08],[side*.43,.91+k*.06,-.12],.012,.006,[.40,.60,.26]);}
  G.crystal(out,0,.80,-.30,.12,.38,.09,[.3,.91,.65],.7,glass);for(const side of [-1,1])link([side*.22,1.10,-.26],[side*.12,.80,-.31],.041,.026,bark);plate(-.05,1.30,-.31,.10,.035,.024,[.10,.075,.04],organic);
 }else if(kind==='titan'){
  const stone=[.13,.15,.17],lava=[1,.26,.035];orb(0,1,0,.43,.52,.31,stone,rock);plate(-.32,.97,-.31,.64,.30,.12,[.22,.25,.27],rock);orb(0,1.55,0,.24,.28,.23,stone,rock);
  for(const side of [-1,1]){orb(side*.50,1.23,0,.27,.28,.26,stone,rock);link([side*.52,1.09,0],[side*.65,.66,-.08],.19,.17,stone,rock);orb(side*.65,.57,-.11,.22,.26,.21,[.23,.26,.27],rock);link([side*.23,.62,0],[side*.27,.19,0],.16,.13,stone,rock);plate(side*.27-.14,.02,-.23,.28,.19,.40,stone,rock);G.crystal(out,side*.52,1.34,.04,.15,.46,.15,[.08,.09,.10],0,rock);G.crystal(out,side*.16,1.76,.02,.065,.30,.06,[.16,.18,.20],0,rock);eye(side*.09,1.57,-.22,.05,lava);link([side*.35,1.29,-.19],[side*.49,1.16,-.23],.022,.012,lava,glass,.8);link([side*.49,1.16,-.23],[side*.47,.94,-.22],.012,.016,lava,glass,.8);}
  G.crystal(out,0,.83,-.40,.14,.34,.09,lava,.9,glass);link([-.19,.93,-.34],[0,.85,-.42],.017,.025,lava,glass,.8);link([0,1.10,-.35],[.20,1.20,-.28],.020,.012,lava,glass,.8);
 }else if(kind==='frostking'){
  const robe=[.16,.32,.49],snow=[.69,.84,.92],ice=[.25,.74,.88];orb(0,1.03,0,.21,.42,.18,robe);orb(0,1.55,-.025,.17,.22,.155,snow);
  for(let k=0;k<12;k++){const a=k*Math.PI/6,b=(k+1)*Math.PI/6,p=(t,r,y)=>[Math.cos(t)*r,y,Math.sin(t)*r];G.quad(out,p(a,.20,.94),p(b,.20,.94),p(b,.53,.06),p(a,.53,.06),k%2?robe:[.23,.43,.59],0,organic);G.tri(out,p(a,.52,.07),p(b,.52,.07),p((a+b)*.5,.35,-.02),ice,.10,glass);}
  for(const side of [-1,1]){orb(side*.25,1.26,0,.13,.14,.17,snow,glass);link([side*.23,1.26,0],[side*.45,1.02,-.10],.075,.052,snow);link([side*.45,1.02,-.10],[side*.47,1.23,-.30],.046,.023,snow);eye(side*.075,1.59,-.18,.029,ice);G.crystal(out,side*.51,1.21,-.31,.055,.37,.08,ice,.32,glass);G.tri(out,[side*.30,1.19,.07],[side*.83,.68,.18],[side*.44,.27,.13],robe,.03,glass);}
  ring(0,1.77,0,.20,.016,steel,'y');for(let k=0;k<7;k++){const a=k*Math.PI*2/7;G.crystal(out,Math.cos(a)*.18,1.75,Math.sin(a)*.18,.035,.22+(k%2)*.08,.04,snow,.18,glass);}G.crystal(out,0,1.14,-.22,.065,.16,.045,ice,.8,glass);ring(0,.12,0,.64,.014,ice,'y',.25);
 }else if(kind==='stormlord'){
  const feather=[.20,.29,.42],light=[.37,.53,.70],energy=[.50,.73,1];orb(0,.91,.05,.24,.40,.22,feather);orb(0,1.47,-.08,.21,.26,.21,light);G.crystal(out,0,1.34,-.37,.085,.17,.24,gold,.05,metal);eye(-.11,1.54,-.245,.035,energy);eye(.11,1.54,-.245,.035,energy);
  for(const side of [-1,1]){link([side*.17,.67,0],[side*.22,.28,-.02],.09,.045,gold,metal);for(let k=0;k<3;k++)link([side*.22,.24,-.02],[side*(.15+k*.075),.04,-.22],.035,.008,gold,metal);link([side*.19,1.2,.12],[side*.90,1.61,.13],.11,.048,light);link([side*.90,1.61,.13],[side*1.60,1.42,.06],.045,.010,light);for(let k=0;k<8;k++){const a=[side*(.37+k*.15),1.40+Math.sin(k*.4)*.18,.12],b=[side*(.62+k*.15),.42+k*.105,.22],c=[side*(.80+k*.15),.54+k*.10,.24];G.tri(out,a,b,c,k%2?light:feather,0,organic);G.tri(out,c,b,a,k%2?light:feather,0,organic);link(a,b,.018,.002,energy,glass,.08);}G.crystal(out,side*.13,1.63,.02,.036,.42,.055,gold,.05,metal);}
  ring(0,1.44,.20,.41,.015,gold);G.crystal(out,0,.82,-.25,.10,.27,.07,energy,.8,glass);
 }else if(kind==='scarabking'){
  const shell=[.35,.30,.14],blue=[.15,.53,.53];orb(0,.58,.24,.43,.40,.58,shell,metal);orb(0,.46,-.37,.34,.23,.30,gold,metal);plate(-.032,.69,-.04,.064,.29,.58,gold);
  for(const side of [-1,1]){orb(side*.24,.61,.25,.20,.28,.48,[.55,.43,.20],metal);for(let k=0;k<3;k++){const a=[side*.24,.52,-.2+k*.3],b=[side*.63,.42,-.32+k*.33],c=[side*.83,.07,-.44+k*.35];link(a,b,.075,.048,gold,metal);link(b,c,.048,.008,shell,metal);orb(b[0],b[1],b[2],.067,.065,.068,blue,glass,.10);}link([side*.18,.30,-.55],[side*.29,.22,-.83],.09,.065,gold,metal);link([side*.29,.22,-.83],[side*.11,.31,-.95],.062,.003,gold,metal);eye(side*.16,.55,-.64,.068,[.28,.99,.90]);G.tri(out,[side*.17,.83,.24],[side*.87,1.10,.43],[side*.59,.49,.86],[.67,.53,.27],.04,metal);}
  for(let k=0;k<5;k++)G.crystal(out,(k-2)*.065,.73,-.24,.03,.23-Math.abs(k-2)*.04,.035,gold,.08,metal);orb(0,.97,.32,.085,.08,.09,blue,glass,.8);
 }else if(kind==='abyss'){
  const shell=[.13,.085,.19],energy=[.81,.24,.67];orb(0,1.02,0,.44,.45,.31,shell,metal);orb(0,1.08,-.28,.29,.30,.11,[.28,.13,.30],glass);eye(0,1.10,-.36,.24,energy);ring(0,1.10,-.31,.34,.034,[.36,.24,.41]);
  for(let k=0;k<8;k++){const a=k*Math.PI/4,b=a+.21,root=[Math.cos(a)*.32,.97+Math.sin(a)*.34,.04],mid=[Math.cos(b)*.69,.64+Math.sin(b)*.43,.13],tip=[Math.cos(b+.25)*.82,.22+Math.sin(b)*.22,-.20];link(root,mid,.075,.047,shell);link(mid,tip,.044,.012,[.24,.13,.28]);link([tip[0],tip[1],tip[2]],[tip[0]*.89,tip[1]+.10,tip[2]-.14],.012,.002,energy,glass,.6);}
  for(const side of [-1,1]){G.crystal(out,side*.32,1.36,.06,.07,.47,.09,shell,0,metal);G.crystal(out,side*.53,1.16,.06,.07,.34,.09,[.26,.15,.30],0,metal);}G.crystal(out,0,.45,-.1,.09,.18,.08,energy,.7,glass);
 }else if(kind==='sentinel'){
  const armor=[.46,.61,.63],energy=[1,.80,.33];orb(0,1.02,0,.28,.38,.25,armor,metal);orb(0,1.51,0,.20,.22,.17,[.19,.25,.30],metal);plate(-.15,1.43,-.18,.30,.10,.045,gold);eye(0,1.50,-.24,.070,energy);orb(0,.96,-.24,.10,.13,.066,energy,glass,.8);
  ring(0,.96,0,.53,.026,gold,'y');ring(0,1.04,.06,.51,.021,steel,'x');ring(0,1.59,.14,.36,.018,gold);
  for(const side of [-1,1]){orb(side*.35,1.26,0,.19,.17,.18,armor,metal);link([side*.35,1.18,0],[side*.54,.87,-.13],.095,.060,armor,metal);link([side*.54,.87,-.13],[side*.40,.69,-.24],.059,.037,gold,metal);for(let k=0;k<4;k++){const x=side*(.32+k*.19),y=1.51-k*.18;G.crystal(out,x,y,.15,.073,.44,.095,k%2?gold:armor,.04,metal);link([side*.22,1.25,.15],[x,y+.14,.15],.017,.012,gold,metal);}link([side*.13,.76,0],[side*.20,.29,.04],.090,.034,armor,metal);G.crystal(out,side*.20,.11,.04,.05,.23,.06,gold,.08,metal);}
 }else if(kind==='wisp'){
  const glow=[1,.38,.085];orb(0,.92,0,.19,.29,.17,[.25,.16,.11],organic);orb(0,.99,-.08,.12,.18,.13,glow,glass,.8);eye(0,1.10,-.23,.08,[1,.87,.3]);for(let k=0;k<5;k++){const a=k*Math.PI*2/5;G.crystal(out,Math.cos(a)*.22,.62,Math.sin(a)*.22,.04,.55,.035,glow,.5,glass);}ring(0,.96,0,.31,.012,gold,'y');
 }else{
  const col=[.105,.16,.23],energy=[.18,.90,.85];orb(0,1.34,0,.22,.26,.19,col);orb(0,.99,0,.24,.30,.17,col);eye(0,1.35,-.20,.065,energy);for(let k=0;k<7;k++){const a=k*Math.PI*2/7;G.tri(out,[Math.cos(a)*.22,.92,Math.sin(a)*.16],[Math.cos(a+.2)*.31,.06,Math.sin(a+.2)*.27],[Math.cos(a+.6)*.22,.90,Math.sin(a+.6)*.16],col,.025,organic);}for(const side of [-1,1]){link([side*.20,1.13,0],[side*.41,.90,-.04],.07,.04,col);link([side*.41,.90,-.04],[side*.46,.71,-.28],.04,.004,energy,glass,.3);}
 }
 for(let k=start;k<out.length;k+=G.STRIDE){out[k]=e.x+out[k]*scale;out[k+1]=e.y+out[k+1]*scale;out[k+2]=e.z+out[k+2]*scale;}G.rotate(out,start,[e.x,e.y,e.z],e.yaw||0);
}
I.Models.creature=creature;
})(ISKRA);
