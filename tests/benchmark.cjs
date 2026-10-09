'use strict';
// Reproducible CPU comparison. GL commands are recorded, not executed on a phone GPU.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
let source=fs.readFileSync(path.join(__dirname,'capture-frame.cjs'),'utf8').split('record=true;')[0].replace("path.resolve(__dirname,'..')",JSON.stringify(root));
source=source.replace('g.visible=g.world.loadAround(g.player.x,g.player.z);for(const c of g.visible)g.renderer.mesh(g.world,c);','');
const {g,gl}=new Function('require',source+'\nreturn {g,gl};')(require);
let start=performance.now();g.visible=g.world.loadAround(g.player.x,g.player.z);
const chunks=[];for(const c of g.visible){const begin=performance.now();g.renderer.mesh(g.world,c);chunks.push(performance.now()-begin);}
const meshMs=performance.now()-start;
let heldBuilds=0,creatureBuilds=0,uploads=0,bytes=0;
const oldHeld=ISKRA.Models.held,oldCreature=ISKRA.Models.creature,oldUpload=gl.bufferData;
ISKRA.Models.held=(...a)=>{heldBuilds++;return oldHeld(...a);};ISKRA.Models.creature=(...a)=>{creatureBuilds++;return oldCreature(...a);};gl.bufferData=(target,data,...args)=>{uploads++;bytes+=data.byteLength||0;return oldUpload(target,data,...args);};
const frames=[];for(let k=0;k<24;k++){g.time+=.016;const begin=performance.now();g.renderer.render(g);frames.push(performance.now()-begin);}
const sorted=frames.slice(5).sort((a,b)=>a-b);
const result={chunkCount:chunks.length,meshMs:+meshMs.toFixed(1),worstChunkMs:+Math.max(...chunks).toFixed(1),medianFrameCPUms:+sorted[Math.floor(sorted.length/2)].toFixed(2),vertices:g.renderer.vertices,drawCalls:g.renderer.drawCalls,heldBuilds,creatureBuilds,uploads,bytes,frames:24,note:'Node with captured GL, CPU measurements only; not phone FPS'};
ISKRA.Models.held=oldHeld;ISKRA.Models.creature=oldCreature;gl.bufferData=oldUpload;
// Exercise the actual incremental update loop, including data generation and VBO uploads.
const streaming=new ISKRA.Game({width:1280,height:720,getContext:()=>gl});streaming.settings.sound=false;streaming.active=true;streaming.modal=false;streaming.mode='creative';const costs=[];let completed=false;
for(let k=0;k<1200;k++){streaming.tick++;const t=performance.now();streaming.update(1/60);streaming.renderer.render(streaming);costs.push(performance.now()-t);if(streaming.visible.length===37&&streaming.visible.every(c=>!c.dirty)){completed=true;break;}}
costs.sort((a,b)=>a-b);result.streaming={completed,frames:costs.length,medianCPUms:+costs[Math.floor(costs.length/2)].toFixed(2),p95CPUms:+costs[Math.floor(costs.length*.95)].toFixed(2),maxCPUms:+costs.at(-1).toFixed(2),meshBudgetMS:2.2,note:'Budget bounds generator scheduling; generation, GC and individual steps can exceed it.'};
const output=path.join(root,'preview/benchmark-after.json');fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(result,null,2));console.log(JSON.stringify(result));
