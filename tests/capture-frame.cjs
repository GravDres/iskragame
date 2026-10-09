'use strict';
// Capture the actual engine geometry, shaders and draw state without a browser.
// replay-frame.py executes this frame in a real offscreen OpenGL ES context.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),zlib=require('node:zlib');
const root=path.resolve(__dirname,'..');let sequence=1,buffer=null,program=null,record=false;
const buffers=new Map(),programs=[],draws=[],enabled=new Set(),atlas=[];
const gl={
 ARRAY_BUFFER:34962,STATIC_DRAW:35044,DYNAMIC_DRAW:35048,FLOAT:5126,DEPTH_TEST:2929,CULL_FACE:2884,BACK:1029,LEQUAL:515,
 VERTEX_SHADER:35633,FRAGMENT_SHADER:35632,COMPILE_STATUS:35713,LINK_STATUS:35714,
 TEXTURE_2D:3553,RGBA:6408,UNSIGNED_BYTE:5121,TEXTURE_MIN_FILTER:10241,TEXTURE_MAG_FILTER:10240,NEAREST:9728,LINEAR:9729,
 TEXTURE_WRAP_S:10242,TEXTURE_WRAP_T:10243,CLAMP_TO_EDGE:33071,TEXTURE0:33984,
 COLOR_BUFFER_BIT:16384,DEPTH_BUFFER_BIT:256,TRIANGLES:4,LINES:1,
 createShader:type=>({type}),shaderSource:(s,src)=>s.src=src,compileShader:()=>{},getShaderParameter:()=>true,getShaderInfoLog:()=>'',deleteShader:()=>{},
 createProgram:()=>{const p={id:sequence++,shaders:[],uniforms:{}};programs.push(p);return p;},attachShader:(p,s)=>p.shaders.push(s),linkProgram:()=>{},getProgramParameter:()=>true,getProgramInfoLog:()=>'',
 getAttribLocation:(p,n)=>({aPos:0,aUV:1,aColor:2,aNormal:3,aSurface:4}[n]),getUniformLocation:(p,n)=>({p,n}),
 createBuffer:()=>({id:sequence++}),bindBuffer:(t,b)=>buffer=b,bufferData:(t,data)=>buffers.set(buffer.id,new Float32Array(data)),deleteBuffer:b=>buffers.delete(b.id),
 createTexture:()=>({}),bindTexture:()=>{},texImage2D:()=>{},texParameteri:()=>{},activeTexture:()=>{},
 viewport:()=>{},depthFunc:()=>{},cullFace:()=>{},enable:c=>enabled.add(c),disable:c=>enabled.delete(c),
 enableVertexAttribArray:()=>{},disableVertexAttribArray:()=>{},vertexAttribPointer:()=>{},useProgram:p=>program=p,
 uniform1i:(l,v)=>l.p.uniforms[l.n]=v,uniform1f:(l,v)=>l.p.uniforms[l.n]=v,uniform3fv:(l,v)=>l.p.uniforms[l.n]=Array.from(v),uniform4fv:(l,v)=>l.p.uniforms[l.n]=Array.from(v),uniformMatrix4fv:(l,t,v)=>l.p.uniforms[l.n]=Array.from(v),
 clear:mask=>{if(record)draws.push({clear:mask});},drawArrays:(mode,first,count)=>{if(record)draws.push({program:program.id,buffer:buffer.id,mode,count,enabled:[...enabled],uniforms:JSON.parse(JSON.stringify(program.uniforms))});}
};
const ctx={fillStyle:'#000',strokeStyle:'#000',path:[],fillRect(x,y,w,h){atlas.push(['rect',this.fillStyle,x,y,w,h]);},strokeRect(x,y,w,h){atlas.push(['stroke',this.strokeStyle,x,y,w,h]);},beginPath(){this.path=[];},moveTo(x,y){this.path.push([x,y]);},lineTo(x,y){this.path.push([x,y]);},fill(){atlas.push(['polygon',this.fillStyle,...this.path]);},stroke(){atlas.push(['line',this.strokeStyle,...this.path]);}};
global.window=global;global.innerWidth=1280;global.innerHeight=720;global.devicePixelRatio=1;global.requestAnimationFrame=()=>{};
global.localStorage={getItem:()=>null,setItem:()=>{}};global.document={createElement:()=>({getContext:()=>ctx})};
for(const file of ['content.js','world.js','geometry.js','models.js','creatures.js','engine.js','game.js'])vm.runInThisContext(fs.readFileSync(path.join(root,'game',file),'utf8'),{filename:file});
const weapon=process.argv[2]||'rifle';
const canvas={width:1280,height:720,getContext:()=>gl};const g=new ISKRA.Game(canvas);g.settings.sound=false;g.settings.quality='balanced';g.settings.resolution='720';g.applySettings();g.active=true;g.modal=false;g.slot=2;g.hotbar[2]=weapon;g.time=135;
const scene=process.argv[3]||'camp';
if(scene==='bosses'){g.player.z=397;g.player.yaw=0;g.player.pitch=.07;g.modal=true;ISKRA.BOSS_IDS.forEach((id,k)=>g.spawnEnemy(id,363+k*7,375));g.bossPulse(g.enemies[2],5,12,'frost');}
else{g.spawnEnemy('root',388,369);g.spawnEnemy('slime',379,377);g.spawnEnemy('golem',395,375);}
g.visible=g.world.loadAround(g.player.x,g.player.z);for(const c of g.visible)g.renderer.mesh(g.world,c);
record=true;g.renderer.render(g);const used=new Set(draws.filter(d=>d.buffer).map(d=>d.buffer)),encoded={};
for(const id of used){const a=buffers.get(id);encoded[id]=Buffer.from(a.buffer,a.byteOffset,a.byteLength).toString('base64');}
for(const id of used){const a=buffers.get(id);if(Array.from(a).some(v=>!Number.isFinite(v)))throw Error('Invalid model geometry in buffer '+id);}
const frame={width:canvas.width,height:canvas.height,stride:ISKRA.Mesh.STRIDE,atlasWidth:1024,atlasHeight:512,weapon:scene==='camp'?weapon:scene,programs,draws,buffers:encoded,atlas};fs.mkdirSync(path.join(root,'dist'),{recursive:true});fs.writeFileSync(path.join(root,'dist/frame.json.gz'),zlib.gzipSync(Buffer.from(JSON.stringify(frame))));
console.log('Captured actual engine frame:',draws.length,'commands,',g.renderer.vertices,'vertices');
