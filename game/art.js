'use strict';
(function(I){
// Original, coloured silhouettes for the backpack and quick access bar.
I.itemArt=function(id){const it=I.ITEMS[id];if(!it)return '';const silver='#c7dbe2',edge='#f0f9fa',dark='#2a4051',gold='#dda96a',wood='#98674b',c=it.color||'#8bdbcc';let body='';
 const path=(d,fill,stroke='#102232',width=1.2)=>`<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${width}" stroke-linejoin="round"/>`,line=(d,stroke=edge,width=1.3)=>path(d,'none',stroke,width);
 if(it.kind==='gun'||id==='launcher'){const pistol=id==='pistol',sniper=id==='sniper',shotgun=id==='shotgun',smg=id==='smg';body+=path(pistol?'M10 22h37v10H28l-3 21H14l4-21h-8z':id==='launcher'?'M7 20h45v16H25l-3 16H12l4-16H7z':`M4 25l12-3 9 2h27v10H32l-4 18H19l3-18H13L4 39z`,dark);body+=path(pistol?'M10 20h38v8H10z':id==='launcher'?'M6 19h49v15H6z':`M14 21h34v9H14z`,silver);body+=path(pistol?'M13 37h9l-2 12h-9z':'M21 37h7l-3 11h-6z',wood);body+=path(pistol?'M48 23h6v4h-6z':`M48 24h${sniper?14:10}v4H48z`,gold);if(sniper)body+=path('M24 15h17v5H24zM28 20v3m10-3v3',dark);if(shotgun)body+=path('M35 29h13v5H35z',wood);if(smg)body+=path('M34 33h7v18h-7z',dark);else if(!pistol&&id!=='launcher')body+=path('M32 33h6l-2 14h-7z',gold);body+=line(pistol?'M13 22h28M13 25h20':'M17 23h25M15 25h25',edge);}
 else if(id==='sword'||id==='spear'){body+=path('M14 53 48 7l7-2-1 8-34 45z',silver);body+=path('M14 47 46 10l-1 8-25 35z',edge);body+=path('M7 42 25 57l3-4L10 38z',gold);body+=path('M3 57l11-14 6 5L9 63z',wood);body+=path('M3 56l6 7-4 1-4-4z',gold);}
 else if(it.kind==='tool'||id==='hammer'){body+=path('M12 58 39 21l6 4-27 37z',wood);body+=line('M16 54 39 25','#c99863',2);body+=path(id==='axe'?'M35 15 48 9l13 11-10 18-14-9z':id==='hammer'?'M23 12l17-8 21 14-13 15-23-10z':'M19 14l13-7 22 3 9 13-5 6-12-12-15-3-8 6z',silver);body+=line(id==='pick'?'M25 12l8-3 18 3 8 11':'M35 15l13-3 9 10',edge,2);body+=path('M35 21l8-3 5 7-7 5z',gold);}
 else if(['fire','frost','storm'].includes(id)){body+=path('M13 60 35 17l5 3-21 42z',wood);body+=line('M19 52 34 23',gold,2);body+=path('M29 20l-3-10 7-7 12 3 2 12-9 9z',gold);body+=path('M29 11l7-7 8 6-4 12-7-1z',c);body+=line('M36 6l2 13M30 10l8 9 6-9',edge,1.3);body+=path('M23 11 27 2l1 11zM42 24l10-6-6 12z',c);}
 else if(id==='bow'||id==='crossbow'){body+=path('M15 6c30 5 37 26 28 50l-5-2c9-23-2-38-25-43z',wood);body+=line('M17 8 13 50 42 53','#ece2bd');body+=line('M7 42 55 20',silver,2);body+=path('M53 16l9 2-5 7z',silver);if(id==='crossbow')body+=path('M9 46 48 17l5 6-41 29z',dark);}
 else if(id==='grenade'){body+=path('M27 11h11v11H27z',silver);body+=path('M20 22l10-4 15 5 5 14-5 15-12 7-14-8-4-16z','#658567');body+=line('M21 29l23 3M20 40l25 3M26 24l-3 24M35 25v29','#aac5a0',1.6);body+=line('M34 11h10l4 14',gold,3);}
 else if(it.kind==='block'){body+=path('M32 6 57 19v29L32 61 7 48V19z',c);body+=path('M7 19l25 13v29L7 48z','#26445266');body+=path('M32 32l25-13v29L32 61z','#101d3555');body+=line('M7 19l25 13 25-13M32 32v29','#eff8dd88');body+=line('M14 18l18-9 18 9','#f1f8e877',2);}
 else if(it.kind==='summon'){body+=path('M21 20l10-9 11 9 7 26-16 12-17-12z',gold);body+=path('M33 7 44 25l-11 22-11-22z',c);body+=line('M33 9v35M23 25l10 8 10-8',edge);}
 else if(id==='potion'){body+=path('M25 6h14v15l10 16v16l-9 7H23l-9-7V37l11-16z',silver);body+=path('M19 37h25v14l-7 5H26l-7-5z','#e9809c');body+=path('M25 6h14v8H25z',gold);body+=line('M22 34v13',edge,3);}
 else return I.icon?I.icon(it.icon):'';
 return `<svg class="item-art" viewBox="0 0 64 64" aria-hidden="true">${body}</svg>`;
};
})(ISKRA);
