'use strict';
(function(I){
const SIZE=768,HEIGHT=72,CHUNK=16;
class World {
  constructor(seed=730241){this.seed=seed|0;this.chunks=new Map();this.edits=new Map();this.editChunks=new Map();this.radius=3;this.spawn=[384.5,20,384.5];this.shrine=[384,366];this.dirty=[];}
  hash(x,z,s=0){let n=Math.imul(x|0,374761393)^Math.imul(z|0,668265263)^Math.imul(this.seed+s,1442695041);n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967295;}
  noise(x,z,scale,s=0){x/=scale;z/=scale;const ix=Math.floor(x),iz=Math.floor(z);let a=x-ix,b=z-iz;a=a*a*(3-2*a);b=b*b*(3-2*b);return (this.hash(ix,iz,s)*(1-a)+this.hash(ix+1,iz,s)*a)*(1-b)+(this.hash(ix,iz+1,s)*(1-a)+this.hash(ix+1,iz+1,s)*a)*b;}
  biome(x,z){if(z<210)return 'Снежные высоты';if(x>530)return 'Песчаный край';if(x<200)return 'Пепельные земли';return 'Изумрудный лес';}
  height(x,z){const d=Math.hypot(x-384,z-384);if(d<14)return 17;let h=14+this.noise(x,z,72,2)*11+this.noise(x,z,22,3)*5;if(z<210)h+=this.noise(x,z,58,5)*20;if(x<200)h+=this.noise(x,z,33,6)*12;const river=Math.abs(Math.sin(x*0.015+Math.sin(z*0.012)*1.2));if(river<0.13&&d>30)h-=8*(1-river/0.13);if(d<22)h=17+(h-17)*(d-14)/8;return I.clamp(Math.floor(h),5,55);}
  treeRoot(gx,gz){const x=gx*8+2+Math.floor(this.hash(gx,gz,9)*4),z=gz*8+2+Math.floor(this.hash(gx,gz,10)*4);if(this.hash(gx,gz,11)>0.43||Math.hypot(x-384,z-384)<24||x<205||x>525)return null;const h=this.height(x,z);if(h<=13)return null;return {x,z,h,top:h+5+Math.floor(this.hash(gx,gz,12)*3)};}
  chunk(cx,cz){const key=cx+','+cz;let c=this.chunks.get(key);if(c)return c;c={cx,cz,key,data:new Uint8Array(CHUNK*CHUNK*HEIGHT),mesh:null,water:null,dirty:true,revision:0,surfaceCache:new Int16Array(512).fill(-1)};this.chunks.set(key,c);
    for(let lx=0;lx<16;lx++)for(let lz=0;lz<16;lz++){
      const x=cx*16+lx,z=cz*16+lz;if(x<0||z<0||x>=SIZE||z>=SIZE)continue;
      const h=this.height(x,z),snow=z<210,desert=x>530,ash=x<200;
      for(let y=0;y<HEIGHT;y++){
        let b=0;
        if(y===0)b=16;else if(y<h-3){b=ash&&y<8?21:ash?11:desert&&y>h-7?25:3;if(y>3&&y<h-5&&this.noise(x+y*2.7,z-y*1.9,13,21)>0.74)b=0;else if(this.hash(x+y*17,z-y*11,18)<0.045)b=8;else if(y<14&&this.hash(x+y*31,z-y*7,19)<0.012)b=12;else if(this.hash(x+y*21,z+y*17,32)<0.04)b=22;else if(y<20&&this.noise(x+y,z-y,8,33)>.78)b=20;}
        else if(y<h)b=desert?4:h<15?19:2;else if(y===h)b=snow?9:desert?4:ash?11:this.hash(x,z,34)<.07?26:1;else if(y<=12)b=snow?10:5;
        c.data[(lx*16+lz)*HEIGHT+y]=b;
      }
    }
    for(let gx=Math.floor(cx*16/8)-1;gx<=Math.floor((cx*16+15)/8)+1;gx++)for(let gz=Math.floor(cz*16/8)-1;gz<=Math.floor((cz*16+15)/8)+1;gz++){
      const t=this.treeRoot(gx,gz);if(!t)continue;
      for(let x=t.x-2;x<=t.x+2;x++)for(let z=t.z-2;z<=t.z+2;z++)for(let y=t.top-2;y<=t.top+1;y++){
        if(x<cx*16||x>=cx*16+16||z<cz*16||z>=cz*16+16||y>=HEIGHT)continue;
        if(Math.abs(x-t.x)+Math.abs(z-t.z)+(y===t.top+1?1:0)>3)continue;
        const idx=((x-cx*16)*16+z-cz*16)*HEIGHT+y;if(c.data[idx]===0)c.data[idx]=7;
      }
      if(t.x>=cx*16&&t.x<cx*16+16&&t.z>=cz*16&&t.z<cz*16+16)for(let y=t.h+1;y<=t.top;y++)c.data[((t.x-cx*16)*16+t.z-cz*16)*HEIGHT+y]=6;
    }
    // A small abandoned outpost and the boss summoning shrine belong to the same world seed.
    for(let lx=0;lx<16;lx++)for(let lz=0;lz<16;lz++){
      const x=cx*16+lx,z=cz*16+lz,dx=x-384,dz=z-366;
      const h=this.height(x,z);
      if(Math.abs(dx)<=5&&Math.abs(dz)<=5){c.data[(lx*16+lz)*HEIGHT+h]=14;if(Math.abs(dx)===4&&Math.abs(dz)===4)for(let y=h+1;y<=h+4;y++)c.data[(lx*16+lz)*HEIGHT+y]=11;if(Math.abs(dx)<=1&&Math.abs(dz)<=1)c.data[(lx*16+lz)*HEIGHT+h+1]=12;}
      const hx=x-400,hz=z-390;
      if(Math.abs(hx)<=4&&Math.abs(hz)<=3){c.data[(lx*16+lz)*HEIGHT+h]=13;if(Math.abs(hx)===4||Math.abs(hz)===3){if(!(hz===3&&Math.abs(hx)<=1))for(let y=h+1;y<=h+3;y++)c.data[(lx*16+lz)*HEIGHT+y]=(y===h+2&&Math.abs(hx)<3)?15:13;}if(this.hash(x,z,60)>0.22)c.data[(lx*16+lz)*HEIGHT+h+4]=13;}
    }
    for(const [k,b] of this.editChunks.get(key)||[]){const p=k.split(',').map(Number);c.data[((p[0]&15)*16+(p[2]&15))*HEIGHT+p[1]]=b;}
    this.dirty.push(c);return c;
  }
  get(x,y,z){x=Math.floor(x);y=Math.floor(y);z=Math.floor(z);if(y<0)return 16;if(y>=HEIGHT)return 0;if(x<0||z<0||x>=SIZE||z>=SIZE)return 16;const c=this.chunk(Math.floor(x/16),Math.floor(z/16));return c.data[((x&15)*16+(z&15))*HEIGHT+y];}
  solid(x,y,z){return I.BLOCKS[this.get(x,y,z)].solid;}
  set(x,y,z,b){x=Math.floor(x);y=Math.floor(y);z=Math.floor(z);if(x<1||z<1||x>=SIZE-1||z>=SIZE-1||y<=0||y>=HEIGHT||!I.BLOCKS[b])return false;if(this.get(x,y,z)===b)return false;const c=this.chunk(x>>4,z>>4);c.data[((x&15)*16+(z&15))*HEIGHT+y]=b;const key=x+','+y+','+z;this.edits.set(key,b);if(!this.editChunks.has(c.key))this.editChunks.set(c.key,new Map());this.editChunks.get(c.key).set(key,b);const column=(x&15)*16+(z&15);c.surfaceCache[column]=-1;c.surfaceCache[column+256]=-1;this.mark(c);for(const [dx,dz] of [[-1,0],[1,0],[0,-1],[0,1]])if((dx&&((x&15)===0||(x&15)===15))||(dz&&((z&15)===0||(z&15)===15))){const n=this.chunks.get(((x+dx)>>4)+','+((z+dz)>>4));if(n)this.mark(n);}return true;}
  mark(c){c.revision++;if(!c.dirty){c.dirty=true;this.dirty.push(c);}}
  treeAt(x,y,z){for(let gx=Math.floor(x/8)-1;gx<=Math.floor(x/8)+1;gx++)for(let gz=Math.floor(z/8)-1;gz<=Math.floor(z/8)+1;gz++){const t=this.treeRoot(gx,gz);if(t&&t.x===x&&t.z===z&&y>t.h&&y<=t.top)return t;}return null;}
  fellTree(t){const removed=[];for(let x=t.x-2;x<=t.x+2;x++)for(let z=t.z-2;z<=t.z+2;z++)for(let y=t.h+1;y<=t.top+1;y++){const b=this.get(x,y,z),key=x+','+y+','+z;if(this.edits.has(key))continue;if((b===6&&x===t.x&&z===t.z)||(b===7&&y>=t.top-2))if(this.set(x,y,z,0))removed.push({x,y,z,b});}return removed;}
  surface(x,z,ignoreFoliage=false){x=Math.floor(x);z=Math.floor(z);if(x<0||z<0||x>=SIZE||z>=SIZE)return 18;const c=this.chunk(x>>4,z>>4),column=(x&15)*16+(z&15),key=column+(ignoreFoliage?256:0);if(c.surfaceCache[key]>=0)return c.surfaceCache[key];for(let y=HEIGHT-1;y>=0;y--){const b=c.data[column*HEIGHT+y];if(I.BLOCKS[b].solid&&(!ignoreFoliage||(b!==6&&b!==7)))return c.surfaceCache[key]=y+1;}return c.surfaceCache[key]=18;}
  ray(origin,dir,reach=6){let previous=null;for(let t=0;t<=reach;t+=0.055){const x=Math.floor(origin[0]+dir[0]*t),y=Math.floor(origin[1]+dir[1]*t),z=Math.floor(origin[2]+dir[2]*t);const b=this.get(x,y,z);if(b&&b!==5)return {x,y,z,b,t,previous};previous=[x,y,z];}return null;}
  collision(x,y,z,r=0.3,h=1.78){for(let bx=Math.floor(x-r);bx<=Math.floor(x+r);bx++)for(let by=Math.floor(y+0.02);by<=Math.floor(y+h);by++)for(let bz=Math.floor(z-r);bz<=Math.floor(z+r);bz++)if(this.solid(bx,by,bz))return true;return false;}
  loadAround(x,z,incremental=false){const cx=Math.floor(x/16),cz=Math.floor(z/16),coords=[];for(let a=-this.radius;a<=this.radius;a++)for(let b=-this.radius;b<=this.radius;b++)if(a*a+b*b<=(this.radius+.5)**2&&cx+a>=0&&cz+b>=0&&cx+a<SIZE/16&&cz+b<SIZE/16)coords.push([cx+a,cz+b,a*a+b*b]);coords.sort((a,b)=>a[2]-b[2]);let made=0;for(const p of coords){const key=p[0]+','+p[1];if(this.chunks.has(key))continue;if(incremental&&made>=1)break;this.chunk(p[0],p[1]);made++;}return coords.map(p=>this.chunks.get(p[0]+','+p[1])).filter(Boolean);}
  prune(x,z,renderer){const cx=x>>4,cz=z>>4;for(const [key,c] of this.chunks)if(Math.abs(c.cx-cx)>this.radius+2||Math.abs(c.cz-cz)>this.radius+2){if(renderer)renderer.freeChunk(c);this.chunks.delete(key);}this.dirty=this.dirty.filter(c=>this.chunks.get(c.key)===c);}
  export(){return {seed:this.seed,edits:Array.from(this.edits)};}
  restore(data){if(!data||!Array.isArray(data.edits)||data.edits.length>60000)throw Error('Повреждённое сохранение.');for(const [k,b] of data.edits){if(typeof k!=='string'||!/^\d+,\d+,\d+$/.test(k)||!Number.isInteger(b)||!I.BLOCKS[b])throw Error('Повреждённый блок.');const [x,y,z]=k.split(',').map(Number);if(x>=SIZE||z>=SIZE||y<=0||y>=HEIGHT)throw Error('Блок вне мира.');this.edits.set(k,b);const chunk=(x>>4)+','+(z>>4);if(!this.editChunks.has(chunk))this.editChunks.set(chunk,new Map());this.editChunks.get(chunk).set(k,b);}}
}
World.SIZE=SIZE;World.HEIGHT=HEIGHT;World.CHUNK=CHUNK;I.World=World;
})(ISKRA);
