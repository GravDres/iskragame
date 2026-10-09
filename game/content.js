'use strict';
const ISKRA = window.ISKRA = {};
ISKRA.VERSION = '0.2.0';
ISKRA.BLOCKS = [
  {name:'Воздух',solid:false},
  {name:'Дёрн',solid:true,tile:1,top:0,bottom:2,hard:0.55,drop:'dirt'},
  {name:'Земля',solid:true,tile:2,hard:0.45,drop:'dirt'},
  {name:'Камень',solid:true,tile:3,hard:1.0,drop:'stone'},
  {name:'Песок',solid:true,tile:4,hard:0.4,drop:'sand'},
  {name:'Вода',solid:false,tile:5,hard:99},
  {name:'Дерево',solid:true,tile:6,top:7,bottom:7,hard:0.8,drop:'wood'},
  {name:'Листва',solid:true,tile:8,hard:0.2,drop:'wood'},
  {name:'Железная руда',solid:true,tile:9,hard:1.4,drop:'iron'},
  {name:'Снег',solid:true,tile:10,hard:0.45,drop:'dirt'},
  {name:'Лёд',solid:true,tile:11,hard:0.8,drop:'ice'},
  {name:'Базальт',solid:true,tile:12,hard:1.2,drop:'stone'},
  {name:'Кристалл искры',solid:true,tile:13,hard:1.5,drop:'crystal',glow:true},
  {name:'Доски',solid:true,tile:14,hard:0.6,drop:'planks'},
  {name:'Кирпич',solid:true,tile:15,hard:1,drop:'brick'},
  {name:'Стекло',solid:true,tile:16,hard:0.4,drop:'glass'},
  {name:'Коренная порода',solid:true,tile:17,hard:Infinity},
  {name:'Фонарь',solid:true,tile:18,hard:0.3,drop:'lamp',glow:true},
  {name:'Булыжник',solid:true,tile:19,hard:1.0,drop:'cobble'},
  {name:'Глина',solid:true,tile:20,hard:0.6,drop:'clay'},
  {name:'Мрамор',solid:true,tile:22,hard:1.2,drop:'marble'},
  {name:'Обсидиан',solid:true,tile:23,hard:2.2,drop:'obsidian'},
  {name:'Медная руда',solid:true,tile:24,hard:1.1,drop:'copper'},
  {name:'Медный блок',solid:true,tile:25,hard:1.0,drop:'copperblock'},
  {name:'Мшистый камень',solid:true,tile:26,hard:0.9,drop:'moss'},
  {name:'Красный песчаник',solid:true,tile:27,hard:0.8,drop:'redstone'},
  {name:'Цветущий дёрн',solid:true,tile:28,hard:0.5,drop:'flowergrass'},
  {name:'Тёмные доски',solid:true,tile:29,hard:0.7,drop:'darkplanks'},
  {name:'Ледяной кирпич',solid:true,tile:30,hard:1.1,drop:'icebrick'},
  {name:'Светящийся камень',solid:true,tile:31,hard:1.4,drop:'glowstone',glow:true}
];
ISKRA.ITEMS = {
  pick:{name:'Стальная кирка',icon:'pick',color:'#cbd9e2',kind:'tool',damage:15,range:5,rate:0.34},
  axe:{name:'Походный топор',icon:'axe',color:'#ccbc8d',kind:'tool',damage:21,range:3.3,rate:0.42},
  sword:{name:'Клинок рубежа',icon:'sword',color:'#f2d690',kind:'melee',damage:30,range:3.6,rate:0.38},
  pistol:{name:'Пистолет «След»',icon:'pistol',color:'#cbd4dc',kind:'gun',damage:22,range:70,rate:0.32,ammo:1,spread:0.008},
  rifle:{name:'Автомат «Буря»',icon:'rifle',color:'#90b4c6',kind:'gun',damage:14,range:85,rate:0.105,ammo:1,spread:0.022},
  shotgun:{name:'Дробовик «Гром»',icon:'shotgun',color:'#dfa675',kind:'gun',damage:12,range:28,rate:0.8,ammo:2,pellets:7,spread:0.1},
  fire:{name:'Огненный посох',icon:'fire',color:'#ff9c58',kind:'magic',damage:38,range:65,rate:0.55,mana:12,speed:23,burn:3},
  frost:{name:'Ледяной посох',icon:'frost',color:'#7dd9ef',kind:'magic',damage:26,range:60,rate:0.5,mana:10,speed:27,freeze:3},
  dirt:{name:'Земля',icon:'block',color:'#997453',kind:'block',block:2},
  stone:{name:'Камень',icon:'block',color:'#9ca9ae',kind:'block',block:3},
  wood:{name:'Дерево',icon:'block',color:'#b98750',kind:'block',block:6},
  sand:{name:'Песок',icon:'block',color:'#e3c687',kind:'block',block:4},
  planks:{name:'Доски',icon:'block',color:'#ceaa70',kind:'block',block:13},
  brick:{name:'Кирпич',icon:'block',color:'#b57061',kind:'block',block:14},
  glass:{name:'Стекло',icon:'block',color:'#9cced0',kind:'block',block:15},
  lamp:{name:'Фонарь',icon:'block',color:'#ffe3a1',kind:'block',block:17},
  iron:{name:'Железо',icon:'ore',color:'#cfb6a1',kind:'resource'},
  crystal:{name:'Кристалл искры',icon:'crystal',color:'#68e8d6',kind:'resource'},
  ice:{name:'Лёд',icon:'block',color:'#a2dce5',kind:'block',block:10},
  ammo:{name:'Патроны',icon:'ammo',color:'#e0bb70',kind:'resource'},
  food:{name:'Провизия',icon:'food',color:'#a9d376',kind:'consumable'},
  potion:{name:'Зелье здоровья',icon:'potion',color:'#ff8389',kind:'consumable'},
  cobble:{name:'Булыжник',icon:'block',color:'#87938c',kind:'block',block:18},
  clay:{name:'Глина',icon:'block',color:'#ad8470',kind:'block',block:19},
  marble:{name:'Мрамор',icon:'block',color:'#d8d7c8',kind:'block',block:20},
  obsidian:{name:'Обсидиан',icon:'block',color:'#685a81',kind:'block',block:21},
  copper:{name:'Медь',icon:'ore',color:'#c98658',kind:'resource'},
  copperblock:{name:'Медный блок',icon:'block',color:'#c58d60',kind:'block',block:23},
  moss:{name:'Мшистый камень',icon:'block',color:'#738c62',kind:'block',block:24},
  redstone:{name:'Красный песчаник',icon:'block',color:'#be805b',kind:'block',block:25},
  flowergrass:{name:'Цветущий дёрн',icon:'block',color:'#8bac69',kind:'block',block:26},
  darkplanks:{name:'Тёмные доски',icon:'block',color:'#71625a',kind:'block',block:27},
  icebrick:{name:'Ледяной кирпич',icon:'block',color:'#9fcbd4',kind:'block',block:28},
  glowstone:{name:'Светящийся камень',icon:'block',color:'#f2dfa0',kind:'block',block:29},
  hammer:{name:'Молот голема',icon:'axe',color:'#b0a7a4',kind:'melee',damage:62,range:3.1,rate:0.9},
  spear:{name:'Копьё следопыта',icon:'sword',color:'#c6d6c8',kind:'melee',damage:24,range:5,rate:0.48},
  launcher:{name:'Ракетомёт «Разлом»',icon:'shotgun',color:'#d6ae77',kind:'magic',damage:95,range:80,rate:1.2,ammo:4,mana:0,speed:18,blast:3.5},
  storm:{name:'Посох грозы',icon:'crystal',color:'#bbb8ff',kind:'magic',damage:55,range:80,rate:0.7,mana:18,speed:40},
  grass:{name:'Дёрн',icon:'block',color:'#85a863',kind:'block',block:1},
  leaves:{name:'Листва',icon:'block',color:'#628e4d',kind:'block',block:7},
  snow:{name:'Снег',icon:'block',color:'#dfebe8',kind:'block',block:9},
  basalt:{name:'Базальт',icon:'block',color:'#74717e',kind:'block',block:11},
  crystalblock:{name:'Кристальный блок',icon:'crystal',color:'#8be9d2',kind:'block',block:12},
  bedrock:{name:'Коренная порода',icon:'block',color:'#666a73',kind:'block',block:16}
};
Object.assign(ISKRA.ITEMS,{
  smg:{name:'ПП «Стриж»',icon:'rifle',color:'#a6cbc4',kind:'gun',damage:11,range:45,rate:.075,ammo:1,spread:.035,magazine:32,reload:1.4},
  sniper:{name:'Винтовка «Дальний свет»',icon:'rifle',color:'#b8c7c4',kind:'gun',damage:88,range:110,rate:1.15,ammo:2,spread:.001,magazine:5,reload:2.1},
  bow:{name:'Лук «Тихолесье»',icon:'bow',color:'#c1aa7c',kind:'magic',damage:32,range:70,rate:.70,mana:0,ammo:1,ammoItem:'arrows',speed:30,gravity:8},
  crossbow:{name:'Арбалет «Вердикт»',icon:'bow',color:'#bbbfad',kind:'magic',damage:52,range:80,rate:.90,mana:0,ammo:1,ammoItem:'arrows',speed:42,gravity:5},
  grenade:{name:'Граната «Осколок»',icon:'ore',color:'#8ba17d',kind:'magic',damage:78,range:40,rate:1.4,mana:0,ammo:1,ammoItem:'grenades',speed:14,gravity:12,blast:4},
  arrows:{name:'Стрелы',icon:'bow',color:'#c9b588',kind:'resource'},
  grenades:{name:'Заряд гранаты',icon:'ore',color:'#94ab7e',kind:'resource'},
  ancientEssence:{name:'Древняя эссенция',icon:'crystal',color:'#d1aeeb',kind:'resource'}
});
Object.assign(ISKRA.ITEMS.pistol,{magazine:12,reload:1.1});Object.assign(ISKRA.ITEMS.rifle,{magazine:30,reload:1.6});Object.assign(ISKRA.ITEMS.shotgun,{magazine:6,reload:1.9});Object.assign(ISKRA.ITEMS.launcher,{magazine:1,reload:2.3});
ISKRA.RECIPES = [
  {item:'planks',count:8,cost:{wood:2}}, {item:'brick',count:6,cost:{stone:6}},
  {item:'glass',count:4,cost:{sand:4,crystal:1}}, {item:'lamp',count:3,cost:{wood:2,crystal:1}},
  {item:'sword',count:1,cost:{wood:3,iron:5}}, {item:'rifle',count:1,cost:{wood:5,iron:12}},
  {item:'shotgun',count:1,cost:{wood:4,iron:10}}, {item:'fire',count:1,cost:{wood:5,crystal:6}},
  {item:'frost',count:1,cost:{wood:5,crystal:4,ice:4}}, {item:'ammo',count:40,cost:{iron:2,stone:3}},
  {item:'potion',count:2,cost:{crystal:2,wood:2}}, {item:'food',count:3,cost:{wood:4}},
  {item:'cobble',count:8,cost:{stone:8}}, {item:'marble',count:4,cost:{stone:4,crystal:1}},
  {item:'copperblock',count:4,cost:{copper:4}}, {item:'moss',count:4,cost:{stone:3,wood:2}},
  {item:'darkplanks',count:8,cost:{wood:3}}, {item:'icebrick',count:6,cost:{ice:4,stone:2}},
  {item:'glowstone',count:3,cost:{stone:4,crystal:2}}, {item:'hammer',count:1,cost:{stone:12,iron:8}},
  {item:'spear',count:1,cost:{wood:5,iron:3}}, {item:'launcher',count:1,cost:{iron:18,crystal:12}},
  {item:'storm',count:1,cost:{wood:5,copper:8,crystal:10}},
  {item:'grass',count:4,cost:{dirt:4,wood:1}}, {item:'leaves',count:4,cost:{wood:2}},
  {item:'snow',count:4,cost:{ice:2}}, {item:'basalt',count:6,cost:{stone:6}},
  {item:'crystalblock',count:2,cost:{crystal:4}}
];
ISKRA.ENEMIES = {
  slime:{name:'Лесной слизень',health:45,damage:7,speed:1.7,color:[0.30,0.76,0.45],scale:0.8,loot:{crystal:1}},
  wolf:{name:'Сумрачный хищник',health:65,damage:12,speed:3.4,color:[0.34,0.39,0.48],scale:1,loot:{food:2}},
  golem:{name:'Каменный голем',health:130,damage:18,speed:1.15,color:[0.48,0.50,0.49],scale:1.35,loot:{stone:6,iron:2}},
  wisp:{name:'Пепельный стрелок',health:55,damage:10,speed:2,color:[0.91,0.45,0.21],scale:0.85,ranged:true,loot:{ammo:12}},
  root:{name:'Корень древнего леса',health:620,damage:20,speed:1.8,color:[0.40,0.56,0.28],scale:3,boss:true,loot:{crystal:14,iron:12,food:6}},
  titan:{name:'Пепельный титан',health:850,damage:26,speed:1.35,color:[0.62,0.27,0.18],scale:3.4,boss:true,ranged:true,loot:{crystal:20,iron:18,ammo:100}},
  frostking:{name:'Ледяной исполин',health:1000,damage:23,speed:1.6,color:[0.38,0.72,0.85],scale:3.2,boss:true,ranged:true,cost:9,loot:{crystal:25,ice:20,potion:3}},
  skeleton:{name:'Страж руин',health:80,damage:11,speed:2.0,color:[0.76,0.75,0.65],scale:1,ranged:true,loot:{iron:3,ammo:10}},
  spider:{name:'Пещерный паук',health:55,damage:9,speed:3.0,color:[0.34,0.25,0.26],scale:0.9,animal:true,loot:{crystal:2}},
  icewolf:{name:'Снежный клык',health:95,damage:15,speed:3.7,color:[0.75,0.83,0.85],scale:1.1,animal:true,loot:{ice:3,food:2}},
  scarab:{name:'Песчаный скарабей',health:75,damage:12,speed:2.4,color:[0.75,0.55,0.27],scale:0.9,animal:true,loot:{copper:3,sand:4}},
  shade:{name:'Тень глубин',health:110,damage:16,speed:2.8,color:[0.24,0.20,0.35],scale:1.1,ranged:true,loot:{obsidian:3,crystal:2}},
  sprout:{name:'Дикий древень',health:90,damage:12,speed:1.6,color:[0.37,0.49,0.26],scale:1.2,loot:{wood:6,food:1}},
  stormlord:{name:'Повелитель грозы',health:1200,damage:25,speed:2.3,color:[0.48,0.44,0.72],scale:3,boss:true,ranged:true,cost:12,loot:{storm:1,crystal:30,copper:20}},
  scarabking:{name:'Царь песков',health:1350,damage:29,speed:2.0,color:[0.77,0.51,0.22],scale:3.5,boss:true,animal:true,cost:15,loot:{crystal:32,copperblock:20,launcher:1}},
  abyss:{name:'Пожиратель бездны',health:1600,damage:30,speed:2.5,color:[0.28,0.18,0.40],scale:3.1,boss:true,ranged:true,cost:18,loot:{crystal:40,obsidian:30,hammer:1}},
  sentinel:{name:'Страж последней искры',health:2000,damage:35,speed:1.6,color:[0.72,0.68,0.42],scale:4,boss:true,ranged:true,cost:24,loot:{crystal:60,glowstone:30,potion:8}}
};
ISKRA.BOSS_IDS=['root','titan','frostking','stormlord','scarabking','abyss','sentinel'];
ISKRA.BOSS_INFO={root:'Корни замедляют, призывает листоскоров',titan:'Огненные снаряды и удар по площади',frostking:'Заморозка и ледяная волна',stormlord:'Быстрые снаряды и грозовой залп',scarabking:'Рывок и призыв скарабеев',abyss:'Притягивает в разлом, выпускает тёмные снаряды и тени',sentinel:'Все стихии и сильные удары'};
const names={slime:'Моховый сгустень',wolf:'Ночной рыскач',golem:'Рудокамень',wisp:'Искронос',skeleton:'Костяной дозорный',spider:'Пещерный иглоног',icewolf:'Инеевый рыскач',scarab:'Бронзоспин',shade:'Сумрачник',sprout:'Листоскор',root:'Арвель, Хранитель корней',titan:'Кхарос, Сердце пепла',frostking:'Нивея, Королева стужи',stormlord:'Тир’Вэл, Крыло грозы',scarabking:'Орук, Царь дюн',abyss:'Ноктар, Пасть разлома',sentinel:'Элион, Страж Искры'};
for(const [id,name] of Object.entries(names))ISKRA.ENEMIES[id].name=name;
const relics=['Печать живых корней','Угольное сердце','Осколок вечной зимы','Грозовой камертон','Золотой скарабей','Сфера разлома','Последняя искра'],levels=[2,3,5,7,9,11,14],costs=[{wood:8,crystal:3},{stone:12,iron:6,crystal:5,ancientEssence:1},{ice:8,crystal:8,ancientEssence:1},{copper:12,crystal:10,ancientEssence:1},{sand:16,copper:8,crystal:12,ancientEssence:1},{obsidian:10,crystal:16,ancientEssence:1},{iron:20,copper:20,crystal:24,ancientEssence:2}];
for(let n=0;n<ISKRA.BOSS_IDS.length;n++){const id=ISKRA.BOSS_IDS[n],d=ISKRA.ENEMIES[id],item='relic_'+id;d.level=levels[n];d.previous=n?ISKRA.BOSS_IDS[n-1]:null;d.relic=item;d.xp=140+n*75;d.loot.ancientEssence=n===0?2:3;ISKRA.ITEMS[item]={name:relics[n],icon:'crystal',color:['#b5d6a0','#f5a270','#a4e6f0','#c0b1fa','#e8cc84','#eab0d9','#a6efdc'][n],kind:'summon',boss:id};ISKRA.RECIPES.push({item,count:1,cost:costs[n],requires:{level:levels[n],boss:d.previous}});}
for(const d of Object.values(ISKRA.ENEMIES))if(!d.boss)d.xp=Math.round(d.health*.32)+6;
ISKRA.RECIPES.push({item:'smg',count:1,cost:{iron:8,copper:5,wood:4},requires:{level:3}},{item:'sniper',count:1,cost:{iron:20,copper:10,crystal:6},requires:{level:6}},{item:'bow',count:1,cost:{wood:8,stone:3}},{item:'crossbow',count:1,cost:{wood:10,iron:6}},{item:'arrows',count:24,cost:{wood:3,stone:2}},{item:'grenades',count:3,cost:{iron:4,stone:5,copper:2},requires:{level:4}},{item:'grenade',count:1,cost:{iron:2,stone:1},requires:{level:4}});
ISKRA.clamp = (v,a,b)=>Math.max(a,Math.min(b,v));
ISKRA.escape = s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
ISKRA.applyMod = function(text){
  if(text.length>150000) throw Error('Мод слишком большой (не больше 150 КБ).');
  const mod=JSON.parse(text);
  if(mod.format!==1 || typeof mod.name!=='string' || mod.name.length>60) throw Error('Нужен JSON-мод формата 1 с названием.');
  if(!mod.weapons || typeof mod.weapons!=='object') throw Error('В моде отсутствует раздел weapons.');
  const changes=[];
  for(const id of Object.keys(mod.weapons)){
    const base=ISKRA.ITEMS[id], data=mod.weapons[id];
    if(!base || !['gun','melee','magic','tool'].includes(base.kind)) throw Error('Неизвестное оружие: '+id);
    const next={...base};
    if(data.name!==undefined){ if(typeof data.name!=='string'||data.name.length>40) throw Error('Некорректное название.'); next.name=data.name; }
    const bounds={damage:[1,500],rate:[0.06,5],range:[1,120],mana:[0,100],speed:[1,50],spread:[0,0.3],pellets:[1,12],burn:[0,10],freeze:[0,10]};
    for(const k of Object.keys(data)){ if(k==='name')continue; if(!bounds[k])throw Error('Неизвестное поле: '+k); const n=data[k]; if(typeof n!=='number'||!Number.isFinite(n)||n<bounds[k][0]||n>bounds[k][1])throw Error('Недопустимое значение '+k); next[k]=k==='pellets'?Math.round(n):n; }
    changes.push([id,next]);
  }
  for(const [id,next] of changes) ISKRA.ITEMS[id]=next;
  return mod.name;
};
