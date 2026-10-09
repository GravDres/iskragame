'use strict';
(function(I){
const G=I.Mesh;
const M={
  perspective(fov,aspect,near,far){const f=1/Math.tan(fov/2),nf=1/(near-far);return new Float32Array([f/aspect,0,0,0,0,f,0,0,0,0,(far+near)*nf,-1,0,0,2*far*near*nf,0]);},
  view(eye,yaw,pitch){const cp=Math.cos(pitch),sp=Math.sin(pitch),sy=Math.sin(yaw),cy=Math.cos(yaw),x=[cy,0,sy],z=[-sy*cp,-sp,cy*cp],y=[-sy*sp,cp,cy*sp],dot=(a,b)=>a.reduce((s,v,k)=>s+v*b[k],0);return new Float32Array([x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-dot(x,eye),-dot(y,eye),-dot(z,eye),1]);},
  multiply(a,b){const r=new Float32Array(16);for(let c=0;c<4;c++)for(let row=0;row<4;row++)for(let k=0;k<4;k++)r[c*4+row]+=a[k*4+row]*b[c*4+k];return r;}
};
const VERTEX=`precision mediump float;attribute highp vec3 aPos;attribute vec2 aUV;attribute vec4 aColor;attribute vec3 aNormal;attribute vec2 aSurface;
uniform highp mat4 uVP;uniform vec3 uEye;varying vec2 vUV;varying vec4 vColor;varying vec3 vNormal;varying vec3 vWorld;varying vec2 vSurface;varying float vDistance;
void main(){gl_Position=uVP*vec4(aPos,1.0);vUV=aUV;vColor=aColor;vNormal=aNormal;vWorld=aPos;vSurface=aSurface;vDistance=distance(aPos,uEye);}`;
const FRAGMENT=`precision mediump float;
uniform sampler2D uTex;uniform vec3 uEye;uniform vec3 uFog;uniform vec3 uSun;uniform vec3 uSunColor;uniform float uLight;uniform float uFar;uniform float uTime;uniform float uHand;
uniform vec4 uLamp0;uniform vec4 uLamp1;uniform vec4 uLamp2;uniform vec4 uShadow0;uniform vec4 uShadow1;uniform vec4 uShadow2;
varying vec2 vUV;varying vec4 vColor;varying vec3 vNormal;varying vec3 vWorld;varying vec2 vSurface;varying float vDistance;
float shadow(vec4 q,vec3 n){float d=length(vWorld.xz-q.xz)/max(q.w,.001);float plane=1.0-smoothstep(.05,.6,abs(vWorld.y-q.y));return 1.0-(1.0-smoothstep(.1,1.0,d))*plane*max(n.y,0.0)*.48;}
vec3 lamp(vec4 q,vec3 n,vec3 albedo){vec3 v=q.xyz-vWorld;float d=length(v);float a=pow(max(0.0,1.0-d/max(abs(q.w),.001)),2.0);vec3 col=q.w>0.0?vec3(1.0,.49,.15):vec3(.12,.76,.69);return col*a*(.25+max(dot(n,normalize(v)),0.0))*(albedo+.16)*1.8;}
void main(){vec3 n=normalize(vNormal);bool water=vSurface.x<-.5;if(water){n=normalize(n+vec3(sin(vWorld.x*2.7+uTime*1.3)*.035,0.0,cos(vWorld.z*2.1-uTime)*.035));}
vec3 albedo=pow(max(texture2D(uTex,vUV).rgb*vColor.rgb,vec3(.001)),vec3(2.2));float rough=clamp(vSurface.y,.08,1.0),metal=clamp(vSurface.x,0.0,1.0);vec3 view=normalize(uEye-vWorld);
vec3 sun=normalize(mix(uSun,vec3(-.3,.8,.6),uHand));vec3 halfV=normalize(sun+view);float diffuse=max(dot(n,sun),0.0);float hemi=n.y*.28+.72;
vec3 ambient=mix(vec3(.036,.060,.09),vec3(.25,.32,.35),uLight);vec3 color=albedo*(ambient*hemi+uSunColor*diffuse*(uLight*1.08+uHand*.35));
float spec=pow(max(dot(n,halfV),0.0),mix(100.0,9.0,rough))*pow(1.0-rough,1.4);color+=mix(vec3(.24),albedo,metal)*uSunColor*spec*(.3+metal*1.6)*(uLight+uHand*.5);
color*=mix(shadow(uShadow0,n)*shadow(uShadow1,n)*shadow(uShadow2,n),1.0,uHand);color+=mix(lamp(uLamp0,n,albedo)+lamp(uLamp1,n,albedo)+lamp(uLamp2,n,albedo),vec3(0.0),uHand);
if(water){float fresnel=pow(1.0-max(dot(n,view),0.0),3.0);color=mix(color,vec3(.25,.43,.47),fresnel*.75);}
color+=albedo*max(vColor.a,0.0)*3.0;float rim=pow(1.0-max(dot(n,view),0.0),4.0)*(1.0-rough)*.13;color+=vec3(.19,.37,.38)*rim;
color=color/(color+vec3(.65));color=pow(max(color,vec3(0.0)),vec3(.4545));float fog=pow(smoothstep(uFar*.35,uFar,vDistance),1.5);color=mix(color,uFog,fog*(1.0-uHand));
gl_FragColor=vec4(color,1.0);}`;
const SKY=`
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
varying mediump vec2 v;uniform float uDay;uniform float uYaw;uniform float uPitch;uniform float uAspect;uniform float uTime;uniform float uFov;uniform vec3 uSun;
float hash(vec2 p){p=fract(p*.1031);p+=dot(p,p.yx+19.19);return fract((p.x+p.y)*p.x);}float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+1.),f.x),f.y);}float fbm(vec2 p){return noise(p)*.55+noise(p*2.03)*.27+noise(p*4.01)*.13;}
void main(){vec3 ray=normalize(vec3(v.x*uAspect*uFov,v.y*uFov,-1.));float cp=cos(uPitch),sp=sin(uPitch),cy=cos(uYaw),sy=sin(uYaw);ray.yz=mat2(cp,sp,-sp,cp)*ray.yz;ray.xz=mat2(cy,sy,-sy,cy)*ray.xz;
float sun=clamp(uSun.y*1.4,0.0,1.0),warm=pow(1.0-clamp(uSun.y,0.0,1.0),2.0)*sun;float h=clamp(ray.y*.85+.22,0.0,1.0);vec3 top=mix(vec3(.014,.025,.053),vec3(.18,.40,.59),sun);vec3 horizon=mix(vec3(.065,.09,.14),mix(vec3(.65,.73,.68),vec3(.86,.65,.38),warm*.75),sun);vec3 col=mix(horizon,top,pow(h,.62));
float sd=max(dot(ray,normalize(uSun)),0.0);col+=vec3(1.,.71,.32)*pow(sd,30.)*sun*.30;col+=vec3(1.,.91,.64)*smoothstep(.99935,.99975,sd)*sun;
if(ray.y>.03){vec2 p=ray.xz/(ray.y+.22)*1.4+vec2(uTime*.004,0.);float cloud=smoothstep(.56,.72,fbm(p));float detail=fbm(p*3.);col=mix(col,mix(vec3(.37,.47,.45),vec3(.86,.86,.73),detail),cloud*sun*.52);}
float angle=atan(ray.x,-ray.z);float ridge=.01+fbm(vec2(angle*6.,2.))* .20;if(ray.y<ridge){col=mix(col,mix(vec3(.045,.085,.12),vec3(.30,.43,.42),sun),.80);}
float ridge2=-.012+fbm(vec2(angle*8.+17.,5.))*.14;if(ray.y<ridge2){col=mix(col,mix(vec3(.033,.07,.09),vec3(.22,.34,.32),sun),.85);}
vec2 starCell=floor(ray.xy*450.);float stars=step(.998,hash(starCell))*pow(1.-sun,4.)*smoothstep(.15,.7,ray.y);col+=stars*.7;gl_FragColor=vec4(col,1.);}`;
const MATERIALS={5:[-1,.14],8:[.20,.58],10:[.12,.20],12:[.10,.32],15:[.09,.20],17:[.03,.90],18:[.30,.36],22:[.04,.52],23:[.18,.30],24:[.25,.65],25:[.68,.28],30:[.14,.23],31:[.08,.40]};
class Renderer{
  constructor(canvas){this.canvas=canvas;this.gl=canvas.getContext('webgl',{alpha:false,antialias:true,depth:true,powerPreference:'high-performance'})||canvas.getContext('experimental-webgl');if(!this.gl)throw Error('Требуется WebGL. Обнови Android System WebView.');const gl=this.gl;this.program=this.createProgram(VERTEX,FRAGMENT);this.loc={};for(const n of ['aPos','aUV','aColor','aNormal','aSurface'])this.loc[n]=gl.getAttribLocation(this.program,n);for(const n of ['uVP','uEye','uFog','uLight','uFar','uTex','uSun','uSunColor','uTime','uHand','uLamp0','uLamp1','uLamp2','uShadow0','uShadow1','uShadow2'])this.loc[n]=gl.getUniformLocation(this.program,n);
    this.skyProgram=this.createProgram('attribute vec2 aPos;varying mediump vec2 v;void main(){v=aPos;gl_Position=vec4(aPos,0.999,1.);}',SKY);this.skyBuffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,this.skyBuffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);this.dynamic=gl.createBuffer();this.handBuffer=gl.createBuffer();this.outlineBuffer=gl.createBuffer();this.texture=this.makeAtlas();this.quality=.85;this.resolution='auto';this.drawCalls=0;this.vertices=0;gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.enable(gl.CULL_FACE);gl.cullFace(gl.BACK);this.resize();
  }
  createProgram(vs,fs){const g=this.gl,compile=(type,src)=>{const sh=g.createShader(type);g.shaderSource(sh,src);g.compileShader(sh);if(!g.getShaderParameter(sh,g.COMPILE_STATUS))throw Error(g.getShaderInfoLog(sh));return sh;},p=g.createProgram(),v=compile(g.VERTEX_SHADER,vs),f=compile(g.FRAGMENT_SHADER,fs);g.attachShader(p,v);g.attachShader(p,f);g.linkProgram(p);if(!g.getProgramParameter(p,g.LINK_STATUS))throw Error(g.getProgramInfoLog(p));g.deleteShader(v);g.deleteShader(f);return p;}
  makeAtlas(){const g=this.gl,c=document.createElement('canvas');c.width=1024;c.height=512;const ctx=c.getContext('2d'),S=128,colors=['#7d9361','#75674c','#85735b','#92948b','#c1ac82','#527c78','#665139','#927c57','#4e6746','#939182','#d8e2db','#a4cbd0','#555d59','#81d1b5','#9d8055','#a18a73','#bad4cc','#444d4a','#e2bd77','#828f82','#aa8f7b','#ffffff','#d1cdb8','#4c435b','#8b9689','#b48859','#6b8068','#b0916c','#7c9663','#66584b','#9fbfc2','#d6c596'];let seed=820471;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)|0;return(seed>>>0)/4294967295;};
    for(let t=0;t<32;t++){const x=t%8*S,y=Math.floor(t/8)*S;ctx.fillStyle=colors[t];ctx.fillRect(x,y,S,S);if(t===21)continue;for(let i=0;i<280;i++){const v=random()>.5?255:0;ctx.fillStyle=`rgba(${v},${v},${v},${.012+random()*.032})`;ctx.fillRect(x+Math.floor(random()*S),y+Math.floor(random()*S),2+random()*10,1+random()*6);}
      if(t===1){ctx.fillStyle='#7a8e5b';ctx.fillRect(x,y,S,18);for(let i=0;i<40;i++)ctx.fillRect(x+i*3.2,y+16,2,random()*12);}
      if(t===6||t===7){for(let i=0;i<35;i++){ctx.fillStyle='rgba(28,22,15,.15)';ctx.fillRect(x+random()*S,y+random()*20,1,S);}}
      if(t===9||t===24){for(let i=0;i<12;i++){const a=x+7+random()*105,b=y+7+random()*105;ctx.fillStyle=t===9?'#aaa18c':'#b09371';ctx.beginPath();ctx.moveTo(a,b);ctx.lineTo(a+7,b-3);ctx.lineTo(a+11,b+3);ctx.lineTo(a+4,b+8);ctx.fill();}}
      if(t===14||t===29){ctx.fillStyle='rgba(35,26,18,.22)';for(let i=0;i<4;i++)ctx.fillRect(x,y+i*32,S,2);for(let i=0;i<22;i++){ctx.fillStyle='rgba(255,237,195,.055)';ctx.fillRect(x+random()*S,y+random()*S,random()*70,1);}}
      if(t===15||t===19||t===27||t===30){ctx.fillStyle=t===30?'#c4d6d0':'#555e50';for(let i=0;i<4;i++){ctx.fillRect(x,y+i*32,S,2);ctx.fillRect(x+(i%2?31:90),y+i*32,2,32);}}
      if(t===22){ctx.strokeStyle='#b4b0a0';ctx.beginPath();ctx.moveTo(x+10,y);ctx.lineTo(x+58,y+53);ctx.lineTo(x+47,y+93);ctx.lineTo(x+81,y+S);ctx.stroke();}
      if(t===16){ctx.strokeStyle='#627f77';ctx.strokeRect(x+3,y+3,S-6,S-6);ctx.fillStyle='rgba(255,255,255,.2)';ctx.fillRect(x+13,y+12,3,66);}
      if(t===18){ctx.fillStyle='#574a34';ctx.fillRect(x,y,S,9);ctx.fillRect(x,y+S-9,S,9);ctx.fillRect(x,y,9,S);ctx.fillRect(x+S-9,y,9,S);ctx.fillStyle='#f5de9a';ctx.fillRect(x+26,y+26,76,76);}
      if(t===25){ctx.strokeStyle='#8a6a48';ctx.strokeRect(x+2,y+2,S-4,S-4);for(const p of [[12,12],[112,12],[12,112],[112,112]]){ctx.fillStyle='#d4b07e';ctx.fillRect(x+p[0],y+p[1],5,5);}}
      if(t===26||t===28){for(let i=0;i<20;i++){ctx.fillStyle='rgba(68,96,55,.10)';ctx.fillRect(x+random()*S,y+random()*S,4+random()*16,3+random()*10);}}
    }
    const tex=g.createTexture();g.bindTexture(g.TEXTURE_2D,tex);g.texImage2D(g.TEXTURE_2D,0,g.RGBA,g.RGBA,g.UNSIGNED_BYTE,c);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_MIN_FILTER,g.LINEAR);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_MAG_FILTER,g.LINEAR);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_WRAP_S,g.CLAMP_TO_EDGE);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_WRAP_T,g.CLAMP_TO_EDGE);return tex;
  }
  resize(){const d=Math.min(devicePixelRatio||1,1.7)*this.quality,aspect=innerWidth/innerHeight;let h=this.resolution==='auto'?Math.floor(innerHeight*d):Math.min(parseInt(this.resolution,10)||720,Math.floor(innerHeight*(devicePixelRatio||1))),w=Math.floor(h*aspect);h=Math.max(1,h);w=Math.max(1,w);if(this.canvas.width!==w||this.canvas.height!==h){this.canvas.width=w;this.canvas.height=h;}this.gl.viewport(0,0,w,h);this.projection=M.perspective((this.fov||74)*Math.PI/180,w/h,.055,240);}
  mesh(world,c){const out=[],water=[];c.lamps=[];const roots=[],natural=(x,z)=>roots.some(t=>Math.abs(x-t.x)<=3&&Math.abs(z-t.z)<=3);for(let gx=Math.floor(c.cx*16/8)-1;gx<=Math.floor((c.cx*16+15)/8)+1;gx++)for(let gz=Math.floor(c.cz*16/8)-1;gz<=Math.floor((c.cz*16+15)/8)+1;gz++){const t=world.treeRoot(gx,gz);if(t&&world.get(t.x,t.h+1,t.z)===6)roots.push(t);}
    for(let lx=0;lx<16;lx++)for(let lz=0;lz<16;lz++)for(let y=1;y<72;y++){const b=c.data[(lx*16+lz)*72+y];if(!b)continue;const x=c.cx*16+lx,z=c.cz*16+lz,block=I.BLOCKS[b];if((b===6||b===7)&&natural(x,z)&&!world.edits.has(x+','+y+','+z))continue;let exposed=0;for(const f of G.FACES){const nb=world.get(x+f.n[0],y+f.n[1],z+f.n[2]);if(nb===0||nb===5)exposed++;}if(!exposed)continue;
      if(b===12){G.crystal(out,x+.48,y,z+.47,.33,1.22,.34,[.14,.65,.47],.85);G.crystal(out,x+.18,y,z+.23,.12,.65,.16,[.25,.73,.60],.55);c.lamps.push([x+.5,y+.7,z+.5,-4.5]);continue;}
      if(b===17){G.bevel(out,x+.20,y,z+.20,.6,.72,.6,[.25,.19,.1],.055,[.65,.35]);G.bevel(out,x+.29,y+.10,z+.29,.42,.50,.42,[.88,.58,.24],.045,[.1,.3],1.3);G.bevel(out,x+.15,y+.69,z+.15,.7,.1,.7,[.19,.16,.10],.028,[.8,.32]);c.lamps.push([x+.5,y+.4,z+.5,5]);continue;}
      for(let fi=0;fi<6;fi++){const f=G.FACES[fi],n=f.n,nb=world.get(x+n[0],y+n[1],z+n[2]);if(b===5){if(nb===0&&fi===2)G.face(water,x,y-.13,z,1,1,1,f,5,[.72,.90,.87],0,null,[-1,.16]);continue;}if(nb!==0&&nb!==5)continue;let tile=fi===2&&block.top!==undefined?block.top:fi===3&&block.bottom!==undefined?block.bottom:block.tile;const variant=.94+world.hash(x,z,91)*.08,path=Math.abs(x-384)<2&&z>=366&&z<=391&&(b===1||b===26);if(path&&fi===2)tile=2;
        const ao=f.v.map(v=>{const axes=n[0]?[1,2]:n[1]?[0,2]:[0,1],a=[0,0,0],bb=[0,0,0];a[axes[0]]=v[axes[0]]?1:-1;bb[axes[1]]=v[axes[1]]?1:-1;const s1=world.solid(x+n[0]+a[0],y+n[1]+a[1],z+n[2]+a[2])?1:0,s2=world.solid(x+n[0]+bb[0],y+n[1]+bb[1],z+n[2]+bb[2])?1:0,corner=world.solid(x+n[0]+a[0]+bb[0],y+n[1]+a[1]+bb[1],z+n[2]+a[2]+bb[2])?1:0;return s1&&s2?.68:1-(s1+s2+corner)*.085;});G.face(out,x,y,z,1,1,1,f,tile,[variant,variant,variant],block.glow?.5:0,ao,MATERIALS[tile]||[0,.88]);
      }
      if((b===1||b===26)&&world.get(x,y+1,z)===0&&!world.edits.has(x+','+y+','+z)){const hash=world.hash(x,z,96),onPath=Math.abs(x-384)<2&&z>=366&&z<=391;if(!onPath&&hash<.15){for(let k=0;k<5;k++){const xx=x+.2+world.hash(x+k,z,97)*.6,zz=z+.2+world.hash(x,z+k,98)*.6,h=.15+world.hash(x+k,z+k,99)*.2,a=[xx-.025,y+1,zz],bb=[xx+.025,y+1,zz],cc=[xx+.08,y+1+h,zz+.04],col=[.25,.38,.19];G.tri(out,a,bb,cc,col);G.tri(out,cc,bb,a,col);}}if(!onPath&&hash>.985)G.ellipsoid(out,x+.5,y+1.08,z+.5,.27,.14,.21,[.37,.39,.32],[.04,.85],0,7,4);}
    }
    for(const t of roots)if(Math.floor(t.x/16)===c.cx&&Math.floor(t.z/16)===c.cz)I.Models.tree(out,t,world);this.freeChunk(c);c.mesh=this.upload(out);c.water=water.length?this.upload(water):null;c.dirty=false;
  }
  upload(data){if(!data.length)return null;const g=this.gl,buffer=g.createBuffer();g.bindBuffer(g.ARRAY_BUFFER,buffer);g.bufferData(g.ARRAY_BUFFER,new Float32Array(data),g.STATIC_DRAW);return {buffer,count:data.length/G.STRIDE};}
  freeChunk(c){if(c.mesh)this.gl.deleteBuffer(c.mesh.buffer);if(c.water)this.gl.deleteBuffer(c.water.buffer);c.mesh=null;c.water=null;}
  attributes(buffer){const g=this.gl,l=this.loc;g.bindBuffer(g.ARRAY_BUFFER,buffer);for(const [n,size,offset] of [['aPos',3,0],['aUV',2,12],['aColor',4,20],['aNormal',3,36],['aSurface',2,48]]){g.enableVertexAttribArray(l[n]);g.vertexAttribPointer(l[n],size,g.FLOAT,false,56,offset);}}
  draw(mesh){if(!mesh)return;this.attributes(mesh.buffer);this.gl.drawArrays(this.gl.TRIANGLES,0,mesh.count);this.drawCalls++;this.vertices+=mesh.count;}
  drawDynamic(data,buffer){if(!data.length)return;const g=this.gl;g.bindBuffer(g.ARRAY_BUFFER,buffer);g.bufferData(g.ARRAY_BUFFER,new Float32Array(data),g.DYNAMIC_DRAW);this.draw({buffer,count:data.length/G.STRIDE});}
  render(game){this.resize();const g=this.gl,p=game.player,eye=[p.x,p.y+1.58,p.z],phase=game.time/900%1*6.2831853,height=Math.sin(phase),sun=[Math.cos(phase)*.7,height,.45],light=I.clamp(height*1.5,0,1),warm=1-I.clamp(height,0,1),sunColor=[1,.92-warm*.17,.72-warm*.23],fog=[.11+light*(.33+warm*.10),.16+light*(.37+warm*.04),.22+light*(.30-warm*.07)];this.drawCalls=0;this.vertices=0;g.clear(g.COLOR_BUFFER_BIT|g.DEPTH_BUFFER_BIT);g.disable(g.DEPTH_TEST);g.disable(g.CULL_FACE);g.useProgram(this.skyProgram);const ap=g.getAttribLocation(this.skyProgram,'aPos');g.bindBuffer(g.ARRAY_BUFFER,this.skyBuffer);g.enableVertexAttribArray(ap);g.vertexAttribPointer(ap,2,g.FLOAT,false,0,0);for(const [n,v] of Object.entries({uDay:phase/6.2831853,uYaw:p.yaw,uPitch:p.pitch,uAspect:this.canvas.width/this.canvas.height,uTime:game.time,uFov:Math.tan((this.fov||74)*Math.PI/360)}))g.uniform1f(g.getUniformLocation(this.skyProgram,n),v);g.uniform3fv(g.getUniformLocation(this.skyProgram,'uSun'),sun);g.drawArrays(g.TRIANGLES,0,6);g.disableVertexAttribArray(ap);g.enable(g.DEPTH_TEST);g.enable(g.CULL_FACE);
    g.useProgram(this.program);g.activeTexture(g.TEXTURE0);g.bindTexture(g.TEXTURE_2D,this.texture);g.uniform1i(this.loc.uTex,0);g.uniformMatrix4fv(this.loc.uVP,false,M.multiply(this.projection,M.view(eye,p.yaw,p.pitch)));g.uniform3fv(this.loc.uEye,eye);g.uniform3fv(this.loc.uFog,fog);g.uniform3fv(this.loc.uSun,sun);g.uniform3fv(this.loc.uSunColor,sunColor);g.uniform1f(this.loc.uLight,light);g.uniform1f(this.loc.uFar,game.world.radius*16+17);g.uniform1f(this.loc.uTime,game.time);g.uniform1f(this.loc.uHand,0);
    const visible=game.visible||[],lamps=visible.flatMap(c=>c.lamps||[]).filter(a=>Math.abs(a[1]-eye[1])<7).sort((a,b)=>Math.hypot(a[0]-p.x,a[1]-eye[1],a[2]-p.z)-Math.hypot(b[0]-p.x,b[1]-eye[1],b[2]-p.z)),shadows=game.enemies.slice().sort((a,b)=>Math.hypot(a.x-p.x,a.z-p.z)-Math.hypot(b.x-p.x,b.z-p.z));for(let k=0;k<3;k++){g.uniform4fv(this.loc['uLamp'+k],lamps[k]||[0,0,0,0]);const e=shadows[k];g.uniform4fv(this.loc['uShadow'+k],e?[e.x,e.y+.01,e.z,I.ENEMIES[e.type].scale*.52]:[0,0,0,0]);}
    for(const c of visible)this.draw(c.mesh);for(const c of visible)this.draw(c.water);const out=[];for(const e of game.enemies)I.Models.creature(out,e,game.time);for(const remote of Object.values(game.remotePlayers||{}))this.avatar(out,remote,game.time);
    for(const q of game.hazards||[])I.Models.warning(out,q);for(const q of game.projectiles)I.Models.projectile(out,q);for(const q of game.particles){const s=q.size*q.life/q.max;if(s>.008)G.ellipsoid(out,q.x,q.y,q.z,s*.5,s*.5,s*.5,q.color,[0,.7],q.glow?1.1:0,6,3);}this.drawDynamic(out,this.dynamic);
    if(game.target&&game.active){const t=game.target,data=[],corners=[[0,0,0],[1,0,0],[1,1,0],[0,1,0],[0,0,1],[1,0,1],[1,1,1],[0,1,1]];for(const [a,b] of [[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]])for(const k of [a,b]){const v=corners[k];G.vertex(data,[t.x-.005+v[0]*1.01,t.y-.005+v[1]*1.01,t.z-.005+v[2]*1.01],[0,1,0],[.88,.75,.46],.7);}g.bindBuffer(g.ARRAY_BUFFER,this.outlineBuffer);g.bufferData(g.ARRAY_BUFFER,new Float32Array(data),g.DYNAMIC_DRAW);this.attributes(this.outlineBuffer);g.drawArrays(g.LINES,0,data.length/G.STRIDE);}
    if(game.active&&!game.modal){g.clear(g.DEPTH_BUFFER_BIT);g.uniformMatrix4fv(this.loc.uVP,false,this.projection);g.uniform3fv(this.loc.uEye,[0,0,0]);g.uniform1f(this.loc.uFar,10000);g.uniform1f(this.loc.uHand,1);g.uniform1f(this.loc.uLight,.9);const held=[];I.Models.held(held,game);this.drawDynamic(held,this.handBuffer);}
  }
  avatar(out,p,time){I.Models.adventurer(out,p,time);}
}
I.Renderer=Renderer;I.Matrix=M;
})(ISKRA);
