'use strict';
(function(I){
// Position, UV, colour/emission, normal, metalness/roughness.
const STRIDE=14, WHITE=21;
const FACES=[
 {n:[1,0,0],v:[[1,0,0],[1,1,0],[1,1,1],[1,0,1]]},
 {n:[-1,0,0],v:[[0,0,1],[0,1,1],[0,1,0],[0,0,0]]},
 {n:[0,1,0],v:[[0,1,1],[1,1,1],[1,1,0],[0,1,0]]},
 {n:[0,-1,0],v:[[0,0,0],[1,0,0],[1,0,1],[0,0,1]]},
 {n:[0,0,1],v:[[1,0,1],[1,1,1],[0,1,1],[0,0,1]]},
 {n:[0,0,-1],v:[[0,0,0],[0,1,0],[1,1,0],[1,0,0]]}
];
const UV=[[0,1],[0,0],[1,0],[1,1]],INDEX=[0,1,2,0,2,3];
function normal(a,b,c){const u=b.map((v,k)=>v-a[k]),v=c.map((v,k)=>v-a[k]),n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]],l=Math.hypot(...n)||1;return n.map(v=>v/l);}
function vertex(out,p,n,col,glow=0,surface=[0,.8],uv=[.6875,.625]){out.push(...p,...uv,...col,glow,...n,...surface);}
function tri(out,a,b,c,col,glow=0,surface=[0,.8],expected=null){let n=normal(a,b,c);if(expected&&n.reduce((s,v,k)=>s+v*expected[k],0)<0){[b,c]=[c,b];n=normal(a,b,c);}vertex(out,a,n,col,glow,surface);vertex(out,b,n,col,glow,surface);vertex(out,c,n,col,glow,surface);}
function quad(out,a,b,c,d,col,glow=0,surface=[0,.8],expected=null){tri(out,a,b,c,col,glow,surface,expected);tri(out,a,c,d,col,glow,surface,expected);}
function face(out,x,y,z,sx,sy,sz,f,tile,col,glow=0,ao=null,surface=[0,.85]){const tx=tile%8,ty=Math.floor(tile/8);for(const k of INDEX){const v=f.v[k],uv=UV[k],shade=ao?ao[k]:1;vertex(out,[x+v[0]*sx,y+v[1]*sy,z+v[2]*sz],f.n,col.map(v=>v*shade),glow,surface,[(tx+(uv[0]?.986:.014))/8,(ty+(uv[1]?.986:.014))/4]);}}
function box(out,x,y,z,sx,sy,sz,col,tile=WHITE,glow=0,surface=[0,.8]){for(const f of FACES)face(out,x,y,z,sx,sy,sz,f,tile,col,glow,null,surface);}
function bevel(out,x,y,z,sx,sy,sz,col,b=.025,surface=[0,.6],glow=0){const p=[x,y,z],size=[sx,sy,sz];b=Math.min(b,sx*.24,sy*.24,sz*.24);
  for(const f of FACES){const axis=f.n.findIndex(v=>v!==0),vs=f.v.map(v=>v.map((v,k)=>p[k]+(k===axis?v*size[k]:b+v*(size[k]-2*b))));quad(out,...vs,col,glow,surface,f.n);}
  for(let free=0;free<3;free++){const axes=[0,1,2].filter(k=>k!==free);for(const sa of [0,1])for(const sb of [0,1]){const pts=[];for(const [end,side] of [[0,0],[1,0],[1,1],[0,1]]){const q=p.slice();q[free]+=b+end*(size[free]-b*2);q[axes[0]]+=side?(sa?size[axes[0]]-b:b):(sa?size[axes[0]]:0);q[axes[1]]+=side?(sb?size[axes[1]]:0):(sb?size[axes[1]]-b:b);pts.push(q);}const n=[0,0,0];n[axes[0]]=sa?1:-1;n[axes[1]]=sb?1:-1;quad(out,...pts,col,glow,surface,n);}}
  for(const a of [0,1])for(const bbit of [0,1])for(const c of [0,1]){const bits=[a,bbit,c],pts=[0,1,2].map(axis=>p.map((v,k)=>v+(k===axis?(bits[k]?size[k]:0):(bits[k]?size[k]-b:b))));tri(out,...pts,col,glow,surface,bits.map(v=>v?1:-1));}
}
function ellipsoid(out,x,y,z,rx,ry,rz,col,surface=[0,.65],glow=0,sectors=10,rings=5){const point=(a,b)=>{const p=a*Math.PI/rings,t=b*Math.PI*2/sectors;return [x+rx*Math.sin(p)*Math.cos(t),y+ry*Math.cos(p),z+rz*Math.sin(p)*Math.sin(t)];};for(let a=0;a<rings;a++)for(let b=0;b<sectors;b++){const p=point(a,b),q=point(a+1,b),r=point(a+1,b+1),s=point(a,b+1),expected=[(p[0]+q[0]+r[0])/3-x,(p[1]+q[1]+r[1])/3-y,(p[2]+q[2]+r[2])/3-z];if(a>0)tri(out,p,q,s,col,glow,surface,expected);if(a<rings-1)tri(out,q,r,s,col,glow,surface,expected);}}
function cylinder(out,a,b,r1,r2,col,surface=[0,.65],glow=0,segments=10,caps=true){const axis=b.map((v,k)=>v-a[k]),length=Math.hypot(...axis);if(length<.0001)return;const n=axis.map(v=>v/length),ref=Math.abs(n[1])>.95?[1,0,0]:[0,1,0],u=normal([0,0,0],n,ref),v=[n[1]*u[2]-n[2]*u[1],n[2]*u[0]-n[0]*u[2],n[0]*u[1]-n[1]*u[0]],point=(base,r,t)=>base.map((q,k)=>q+r*(u[k]*Math.cos(t)+v[k]*Math.sin(t)));for(let i=0;i<segments;i++){const t=i*Math.PI*2/segments,t2=(i+1)*Math.PI*2/segments,p=point(a,r1,t),q=point(b,r2,t),r=point(b,r2,t2),s=point(a,r1,t2),expected=p.map((q,k)=>q-a[k]);quad(out,p,q,r,s,col,glow,surface,expected);if(caps){tri(out,a,s,p,col,glow,surface,n.map(v=>-v));tri(out,b,q,r,col,glow,surface,n);}}}
function crystal(out,x,y,z,rx,h,rz,col,glow=.2,surface=[.05,.22]){const ring=[],top=[x,y+h,z],bottom=[x,y,z];for(let i=0;i<6;i++){const a=i*Math.PI/3;ring.push([x+Math.cos(a)*rx,y+h*.28,z+Math.sin(a)*rz]);}for(let i=0;i<6;i++){const p=ring[i],q=ring[(i+1)%6],expected=[p[0]-x,0,p[2]-z];tri(out,p,q,top,col,glow,surface,expected);tri(out,q,p,bottom,col,glow,surface,expected);}}
function rotate(out,start,origin,yaw=0,pitch=0,roll=0){const cy=Math.cos(yaw),sy=Math.sin(yaw),cp=Math.cos(pitch),sp=Math.sin(pitch),cr=Math.cos(roll),sr=Math.sin(roll);const turn=v=>{let [x,y,z]=v;[x,z]=[cy*x-sy*z,sy*x+cy*z];[y,z]=[cp*y-sp*z,sp*y+cp*z];return [cr*x-sr*y,sr*x+cr*y,z];};for(let i=start;i<out.length;i+=STRIDE){const p=turn([out[i]-origin[0],out[i+1]-origin[1],out[i+2]-origin[2]]),n=turn(out.slice(i+9,i+12));for(let k=0;k<3;k++){out[i+k]=origin[k]+p[k];out[i+9+k]=n[k];}}}
I.Mesh={STRIDE,FACES,vertex,tri,quad,face,box,bevel,ellipsoid,cylinder,crystal,rotate,normal};I.box=box;
})(ISKRA);
