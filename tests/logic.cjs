'use strict';
// Checks real world generation, collision, combat, saves and mod validation.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
global.window=global;
global.requestAnimationFrame=()=>{};
const storage=new Map();
global.localStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)};
for(const f of ['content.js','world.js'])vm.runInThisContext(fs.readFileSync(path.join(root,'game',f),'utf8'),{filename:f});
const I=ISKRA;
I.Renderer=class{constructor(){this.canvas={width:1280,height:720};}resize(){}freeChunk(){}render(){}mesh(c){c.dirty=false;}};
vm.runInThisContext(fs.readFileSync(path.join(root,'game/game.js'),'utf8'),{filename:'game.js'});
let count=0;
function check(name,fn){fn();count++;console.log('PASS',name);}
check('deterministic terrain and independent seeds',()=>{
 const a=new I.World(730241),b=new I.World(730241),c=new I.World(123);
 assert.equal(a.height(82,271),b.height(82,271));
 assert.deepEqual(a.chunk(10,12).data,b.chunk(10,12).data);
 assert.notDeepEqual(a.chunk(10,12).data,c.chunk(10,12).data);
});
check('large map, four biomes, immutable floor and edges',()=>{
 const w=new I.World();assert.equal(I.World.SIZE,768);
 assert.equal(new Set([[50,500],[700,500],[400,100],[384,384]].map(([x,z])=>w.biome(x,z))).size,4);
 assert.equal(w.get(384,0,384),16);assert.equal(w.get(-1,20,1),16);assert.equal(w.get(2,80,2),0);
 assert.equal(w.set(384,0,384,0),false);assert.equal(w.set(0,10,384,0),false);
});
check('edit, raycast, collision, save and chunk regeneration',()=>{
 const w=new I.World();assert.ok(w.set(384,20,384,14));
 assert.equal(w.get(384,20,384),14);assert.equal(w.solid(384,20,384),true);
 const hit=w.ray([384.5,20.5,387],[0,0,-1],6);assert.equal(hit.b,14);assert.deepEqual(hit.previous,[384,20,385]);
 const data=w.export(),restored=new I.World(data.seed);restored.restore(data);assert.equal(restored.get(384,20,384),14);
 w.chunks.clear();assert.equal(w.get(384,20,384),14);
 assert.throws(()=>restored.restore({edits:[['800,3,3',1]]}));
});
const game=new I.Game({});game.settings.sound=false;game.start('survival');game.enemies=[];
check('joystick forward follows camera and movement respects collisions',()=>{
 const p=game.player;p.yaw=0;p.pitch=0;p.ground=true;game.input.z=1;
 for(let i=0;i<10;i++)game.move(.02);assert.ok(p.z<384.5);
 p.yaw=Math.PI/2;const x=p.x;for(let i=0;i<10;i++)game.move(.02);assert.ok(p.x>x);
 game.input.z=0;for(let i=0;i<30;i++)game.move(.02);assert.ok(p.y>=18-.05);assert.ok(p.ground);
});
check('mining yields a resource and placement spends inventory',()=>{
 game.player.x=384.5;game.player.z=384.5;game.player.y=18.05;game.world.set(384,19,381,3);
 game.target={x:384,y:19,z:381,b:3,previous:[384,19,382]};const before=game.inventory.stone;
 game.slot=0;for(let i=0;i<100;i++)game.mine(.02);assert.equal(game.world.get(384,19,381),0);assert.ok(game.inventory.stone>before);
 game.slot=5;const dirt=game.inventory.dirt;assert.ok(game.place());assert.equal(game.inventory.dirt,dirt-1);assert.equal(game.world.get(384,19,382),2);
});
check('craft costs enforced and successful craft changes inventory',()=>{
 const wood=game.inventory.wood;assert.ok(game.craft(0));assert.equal(game.inventory.wood,wood-2);
 assert.equal(game.craft(I.RECIPES.findIndex(r=>r.item==='launcher')),false);
});
check('guns hit full enemy body and spend ammunition',()=>{
 game.player.yaw=0;game.player.pitch=0;game.world.set(384,19,382,0);game.world.set(384,19,381,0);
 const e=game.spawnEnemy('golem',384.5,380.5);e.y=18.05;const hp=e.hp,ammo=game.inventory.ammo;
 assert.ok(game.fireWeapon('pistol'));assert.ok(e.hp<hp);assert.equal(game.inventory.ammo,ammo-1);
 game.inventory.ammo=0;assert.equal(game.fireWeapon('rifle'),false);game.inventory.ammo=100;
});
check('fire/frost projectiles apply damage and status; mana is consumed',()=>{
 game.enemies=[];const e=game.spawnEnemy('golem',384.5,382.2);e.y=18.05;
 const mana=game.player.mana;game.fireWeapon('frost');for(let i=0;i<10;i++)game.updateProjectiles(.02);
 assert.ok(e.freeze>0);assert.ok(e.hp<I.ENEMIES.golem.health);assert.equal(game.player.mana,mana-10);
 game.fireWeapon('fire');for(let i=0;i<10;i++)game.updateProjectiles(.02);assert.ok(e.burn>0);
});
check('seven bosses, ten normal enemy species, distinct special attacks',()=>{
 assert.equal(I.BOSS_IDS.length,7);assert.equal(Object.values(I.ENEMIES).filter(e=>!e.boss).length,10);
 game.mode='hunt';game.enemies=[];game.summon('stormlord');assert.equal(game.enemies[0].type,'stormlord');
 assert.equal(game.enemies[0].hp,1200);game.radialVolley(game.enemies[0],'storm',10,14);assert.ok(game.projectiles.length>=10);
});
check('survival save restores player, inventory, edits and boss progress',()=>{
 game.mode='survival';game.player.hp=62;game.player.mana=43;game.kills=9;game.bosses=['root'];game.world.set(386,20,384,13);
 assert.ok(game.save(true));const data=JSON.parse(localStorage.getItem('iskra.save.survival'));
 const next=new I.Game({});next.settings.sound=false;next.start('survival',true);
 assert.equal(next.player.hp,62);assert.equal(next.player.mana,43);assert.equal(next.kills,9);assert.deepEqual(next.bosses,['root']);assert.equal(next.world.get(386,20,384),13);
});
check('creative mode has all blocks, does not spend ammo and ignores damage',()=>{
 const g=new I.Game({});g.settings.sound=false;g.start('creative');const ammo=g.inventory.ammo;
 g.fireWeapon('rifle');assert.equal(g.inventory.ammo,ammo);g.damage(200);assert.equal(g.player.hp,100);
 assert.ok(Object.values(I.ITEMS).filter(x=>x.kind==='block').length>=25);
});
check('boss level, previous victory and relic gates spend nothing on rejection',()=>{
 const g=new I.Game({});g.settings.sound=false;g.start('survival');g.enemies=[];
 const r=I.RECIPES.findIndex(x=>x.item==='relic_root');g.inventory.wood=100;g.inventory.crystal=100;
 assert.equal(g.craft(r),false);assert.equal(g.inventory.wood,100);g.gainXP(100);assert.equal(g.level,2);assert.equal(g.xp,0);
 assert.ok(g.craft(r));assert.equal(g.inventory.relic_root,1);assert.ok(g.summon('root'));assert.equal(g.inventory.relic_root,0);
 g.inventory.relic_root=1;assert.equal(g.summon('root'),false);assert.equal(g.inventory.relic_root,1);g.enemies=[];
 g.level=3;g.inventory.relic_titan=1;assert.equal(g.summon('titan'),false);assert.equal(g.inventory.relic_titan,1);
 const e=g.spawnEnemy('root',390,384);g.killEnemy(g.enemies.indexOf(e));assert.ok(g.bosses.includes('root'));assert.equal(g.inventory.ancientEssence,2);
 assert.ok(g.summon('titan'));assert.equal(g.inventory.relic_titan,0);
});
check('all seven relic recipes form a playable victory chain',()=>{
 const g=new I.Game({});g.settings.sound=false;g.start('survival');g.enemies=[];
 for(const id of Object.keys(I.ITEMS))g.inventory[id]=10000;
 for(const id of I.BOSS_IDS){const d=I.ENEMIES[id];g.level=d.level;const r=I.RECIPES.findIndex(x=>x.item===d.relic);assert.ok(g.craft(r));const before=g.inventory[d.relic];assert.ok(g.summon(id));assert.equal(g.inventory[d.relic],before-1);g.killEnemy(0);assert.ok(g.bosses.includes(id));}
 assert.equal(new Set(I.BOSS_IDS.map(id=>I.ENEMIES[id].relic)).size,7);
});
check('boss special attacks are timed and ground hazards allow evasion',()=>{
 const g=new I.Game({});g.settings.sound=false;g.start('hunt');g.enemies=[];
 const root=g.spawnEnemy('root',384,364);root.attack=0;g.updateEnemies(.02);const phase=root.phase;
 for(let k=0;k<20;k++)g.updateEnemies(.02);assert.equal(root.phase,phase);
 g.bossPulse({x:g.player.x,z:g.player.z},6,18,'frost');const hp=g.player.hp;
 g.updateHazards(.5);assert.equal(g.player.hp,hp);g.updateHazards(.7);assert.equal(g.player.hp,hp-18);assert.equal(g.player.slow,3);
 g.player.hp=100;g.bossPulse({x:g.player.x,z:g.player.z},6,18);g.player.x+=10;g.updateHazards(1.2);assert.equal(g.player.hp,100);
});
check('magazine exhaustion blocks fire until reload; arrows use their own reserve',()=>{
 const g=new I.Game({});g.settings.sound=false;g.start('survival');g.enemies=[];g.slot=2;g.inventory.ammo=40;
 for(let k=0;k<12;k++)assert.ok(g.fireWeapon('pistol'));assert.equal(g.magazines.pistol,0);assert.equal(g.inventory.ammo,28);
 assert.equal(g.fireWeapon('pistol'),false);assert.ok(g.reloading);assert.equal(g.fireWeapon('pistol'),false);
 g.update(1.2);assert.equal(g.reloading,null);assert.equal(g.magazines.pistol,12);assert.ok(g.fireWeapon('pistol'));assert.equal(g.inventory.ammo,27);
 g.inventory.arrows=2;g.fireWeapon('bow');assert.equal(g.inventory.arrows,1);assert.equal(g.inventory.ammo,27);const q=g.projectiles.at(-1),vy=q.vy;g.updateProjectiles(.02);assert.ok(q.vy<vy);
});
check('progression and empty magazines survive a save; old saves remain compatible',()=>{
 const g=new I.Game({});g.settings.sound=false;g.start('survival');g.level=7;g.xp=130;g.bosses=['root','titan'];g.inventory.relic_frostking=2;g.magazines.pistol=0;g.explored=['4,4','3,4'];
 const next=new I.Game({});next.settings.sound=false;next.restore(g.snapshot());assert.equal(next.level,7);assert.equal(next.xp,130);assert.equal(next.magazines.pistol,0);assert.equal(next.inventory.relic_frostking,2);assert.deepEqual(next.explored,['4,4','3,4']);
 const old=g.snapshot();delete old.level;delete old.xp;delete old.magazines;delete old.explored;next.restore(old);assert.equal(next.level,1);assert.equal(next.xp,0);
});
check('mining placed blocks earns no XP and felling a natural tree clears its collider',()=>{
 const g=new I.Game({});g.settings.sound=false;g.start('survival');g.enemies=[];g.world.set(380,20,380,3);g.target={x:380,y:20,z:380,b:3};const xp=g.xp;g.mine(2);assert.equal(g.xp,xp);
 let t;for(let x=35;x<65&&!t;x++)for(let z=35;z<65&&!t;z++)t=g.world.treeRoot(x,z);
 assert.ok(t);const wood=g.inventory.wood;g.target={x:t.x,y:t.h+1,z:t.z,b:6};g.mine(2);assert.ok(g.inventory.wood>=wood+5);assert.ok(g.xp>xp);
 for(let y=t.h+1;y<=t.top;y++)assert.equal(g.world.get(t.x,y,t.z),0);
});
check('mods validate before applying and permit no executable scripts',()=>{
 const text=fs.readFileSync(path.join(root,'mods/elemental-arsenal.json'),'utf8');assert.equal(I.applyMod(text),'Стихийный арсенал');assert.equal(I.ITEMS.fire.damage,65);
 assert.throws(()=>I.applyMod('{"format":1,"name":"bad","weapons":{"fire":{"damage":999999}}}'));
 assert.throws(()=>I.applyMod('{"format":1,"name":"bad","weapons":{"fire":{"script":"eval"}}}'));
 const old=I.ITEMS.pistol.damage;assert.throws(()=>I.applyMod('{"format":1,"name":"bad","weapons":{"pistol":{"damage":50},"fire":{"damage":99999}}}'));assert.equal(I.ITEMS.pistol.damage,old);
});
console.log(`\n${count} gameplay checks passed.`);
