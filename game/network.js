'use strict';
(function(I){
class Network {
  constructor(game){this.game=game;this.role=null;this.id='host';this.timer=0;this.status='Комната не создана';this.address='';this.peerCount=0;this.transport=null;this.pending=new Map();this.wire=[];}
  available(){return typeof Android!=='undefined'&&typeof Android.host==='function';}
  host(){if(!this.available()){this.game.notify('Совместная игра по Wi-Fi доступна в Android APK.');return;}this.stop();this.role='host';this.id='host';this.status='Создание комнаты…';Android.host(JSON.stringify(this.game.snapshot()));this.game.modal=false;if(this.game.ui)this.game.ui.closeModal();}
  join(address){if(!this.available()){this.game.notify('Подключение по Wi-Fi доступно в Android APK.');return;}if(!/^\d{1,3}(\.\d{1,3}){3}$/.test(address)||address.split('.').some(n=>+n>255)){this.game.notify('Введи IPv4-адрес хозяина, например 192.168.1.5.');return;}this.stop();this.role='client';this.status='Подключение…';Android.join(address);}
  stop(){if(this.available())Android.disconnect();this.role=null;this.game.remotePlayers={};this.peerCount=0;this.pending.clear();this.status='Комната не создана';}
  send(data){if(this.available())Android.send(JSON.stringify(data));}
  action(a){if(!this.role)return;if(a.type==='remoteDamage'&&this.role==='host'){this.send({type:'damage',player:a.player,damage:a.damage});return;}if(this.role==='client')this.send({type:'action',action:a});else if(a.type==='block')this.send({type:'block',...a});}
  update(dt){if(!this.role)return;this.timer+=dt;if(this.timer<.12)return;this.timer=0;const p=this.game.player,state={id:this.id,x:p.x,y:p.y,z:p.z,yaw:p.yaw,hp:p.hp};this.send({type:'player',player:state});if(this.role==='host'){this.send({type:'state',time:this.game.time,enemies:this.game.enemies,projectiles:this.game.projectiles,kills:this.game.kills,bosses:this.game.bosses,level:this.game.level,xp:this.game.xp,hazards:this.game.hazards});if(this.tickSnapshot===undefined)this.tickSnapshot=0;if(++this.tickSnapshot%40===0)Android.updateHost(JSON.stringify(this.game.snapshot()));}}
  validPlayer(p){return p&&[p.x,p.y,p.z,p.yaw].every(Number.isFinite)&&p.x>=0&&p.x<=768&&p.z>=0&&p.z<=768&&p.y>-10&&p.y<110;}
  receive(message){try{const m=typeof message==='string'?JSON.parse(message):message,g=this.game;if(!m||typeof m.type!=='string')return;
    if(m.type==='hosted'){this.address=m.address;this.status='Комната: '+m.address+' · порт 24871';g.notify('Комната открыта: '+m.address);}
    else if(m.type==='welcome'){this.id=m.id;g.restore(m.state);g.mode=m.state.mode;g.enemies=[];g.projectiles=[];g.active=true;g.modal=false;g.visible=g.world.loadAround(g.player.x,g.player.z);this.status='Подключено к миру друга';if(g.ui)g.ui.showGame();g.notify('Ты в мире друга. Стройте и сражайтесь вместе.');}
    else if(m.type==='joined'){this.peerCount++;g.notify('Друг присоединился к миру.');this.send({type:'sync',world:g.world.export()});}
    else if(m.type==='left'){delete g.remotePlayers[m.id];this.peerCount=Math.max(0,this.peerCount-1);g.notify('Игрок покинул мир.');}
    else if(m.type==='player'){const p=m.player;if(this.validPlayer(p)&&p.id!==this.id){g.remotePlayers[p.id]={...p};}}
    else if(m.type==='state'&&this.role==='client'){if(Array.isArray(m.enemies)&&m.enemies.length<=40)g.enemies=m.enemies.filter(e=>I.ENEMIES[e.type]&&this.validPlayer({...e,yaw:0})&&Number.isFinite(e.hp));if(Array.isArray(m.projectiles)&&m.projectiles.length<=100)g.projectiles=m.projectiles.filter(q=>[q.x,q.y,q.z,q.vx,q.vy,q.vz,q.life].every(Number.isFinite));if(Number.isFinite(m.time))g.time=m.time;g.kills=m.kills|0;g.bosses=Array.isArray(m.bosses)?m.bosses.filter(id=>I.ENEMIES[id]?.boss):[];if(Number.isFinite(m.level))g.level=I.clamp(m.level|0,1,20);if(Number.isFinite(m.xp))g.xp=I.clamp(m.xp,0,g.xpNeeded()-1);if(Array.isArray(m.hazards))g.hazards=m.hazards.slice(0,20).filter(q=>[q.x,q.y,q.z,q.radius,q.time].every(Number.isFinite));}
    else if(m.type==='sync'&&this.role==='client'&&m.world?.seed===g.world.seed){const checked=new I.World(m.world.seed);checked.restore(m.world);for(const [key,b] of checked.edits){const [x,y,z]=key.split(',').map(Number);g.world.set(x,y,z,b);}}
    else if(m.type==='block'){if([m.x,m.y,m.z,m.b].every(Number.isInteger)&&I.BLOCKS[m.b])g.world.set(m.x,m.y,m.z,m.b);}
    else if(m.type==='damage'&&m.player===this.id&&Number.isFinite(m.damage))g.damage(I.clamp(m.damage,0,100));
    else if(m.type==='action'&&this.role==='host')this.hostAction(m.sender,m.action);
    else if(m.type==='error'){this.status=m.message;g.notify(m.message);if(this.role==='client'){this.role=null;g.modal=true;if(g.ui)g.ui.showPause();}}
    if(g.ui)g.ui.updateNetwork();
  }catch(e){this.game.notify('Сетевые данные не прочитаны.');}}
  hostAction(sender,a){if(!a||typeof a.type!=='string')return;const g=this.game,p=g.remotePlayers[sender];if(!p)return;
    if(a.type==='block'){if(![a.x,a.y,a.z,a.b].every(Number.isInteger)||!I.BLOCKS[a.b]||a.y<=0)return;if(Math.hypot(a.x-p.x,a.y-(p.y+1),a.z-p.z)>8)return;if(g.world.set(a.x,a.y,a.z,a.b))this.send({type:'block',x:a.x,y:a.y,z:a.z,b:a.b});}
    else if(a.type==='fire'&&I.ITEMS[a.weapon]&&['gun','magic'].includes(I.ITEMS[a.weapon].kind)){if(!Array.isArray(a.origin)||!Array.isArray(a.dir)||a.origin.length!==3||a.dir.length!==3||![...a.origin,...a.dir].every(Number.isFinite)||Math.hypot(...a.dir)<.8||Math.hypot(...a.dir)>1.2||Math.hypot(a.origin[0]-p.x,a.origin[2]-p.z)>2)return;const now=performance.now(),last=this.pending.get(sender)||0;if(now-last<I.ITEMS[a.weapon].rate*800)return;this.pending.set(sender,now);g.fireWeapon(a.weapon,true,a.origin,a.dir);}
    else if(a.type==='melee'){const e=g.enemies.find(e=>e.id===a.id);if(e&&Math.hypot(e.x-p.x,e.z-p.z)<5)g.hurtEnemy(e,30);}
    else if(a.type==='summon'&&I.ENEMIES[a.boss]?.boss)g.summon(a.boss);
  }
}
I.Network=Network;window.nativeEvent=function(raw){if(window.game&&window.game.network)window.game.network.receive(raw);};
})(ISKRA);
