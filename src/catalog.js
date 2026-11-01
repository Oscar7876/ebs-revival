export const WEAPONS = [
  {id:'rifle',name:'光束步槍',type:'beam',typeLabel:'光束',power:680,hits:3,acc:86,speed:82,en:24,heat:15,weight:16,price:0,effect:'均衡型'},
  {id:'mg',name:'90mm 機關槍',type:'kinetic',typeLabel:'實彈',power:175,hits:12,acc:78,speed:94,en:8,heat:27,weight:11,price:3200,effect:'多段命中'},
  {id:'bazooka',name:'超級火箭砲',type:'kinetic',typeLabel:'實彈',power:2450,hits:1,acc:68,speed:48,en:18,heat:32,weight:30,price:7200,effect:'破甲特化'},
  {id:'saber',name:'光束軍刀',type:'melee',typeLabel:'近戰',power:1120,hits:2,acc:90,speed:96,en:16,heat:12,weight:8,price:4500,effect:'破盾斬擊'},
  {id:'missile',name:'飛彈莢艙',type:'missile',typeLabel:'飛彈',power:390,hits:6,acc:72,speed:63,en:22,heat:20,weight:22,price:6100,effect:'對重裝加成'},
  {id:'sniper',name:'長程光束狙擊槍',type:'beam',typeLabel:'光束',power:3100,hits:1,acc:96,speed:35,en:54,heat:40,weight:27,price:9800,effect:'精準狙擊'},
  {id:'emp',name:'電磁脈衝干擾器',type:'emp',typeLabel:'電磁脈衝',power:190,hits:3,acc:84,speed:70,en:32,heat:22,weight:18,price:8800,effect:'能源干擾'}
];

export const MECHS = [
  {id:'m01',name:'先鋒原型一號',class:'平衡型',classTag:'balanced',hp:2800,en:160,atk:32,armor:31,speed:34,aim:36,cooling:32,maxLoad:90,price:0,oreCost:0,art:'/assets/mechs/m01.svg',desc:'標準泛用框體，適合入門與穩定發展。',def:{beam:0.04,kinetic:0.04,melee:0,missile:0,emp:0}},
  {id:'m02',name:'巨砲堡壘型',class:'重裝型',classTag:'heavy',hp:3600,en:145,atk:38,armor:52,speed:18,aim:28,cooling:24,maxLoad:132,price:9800,oreCost:38,art:'/assets/mechs/m02.svg',desc:'超厚裝甲與肩砲火力，適合重武裝。',def:{beam:0.06,kinetic:0.18,melee:-0.06,missile:0.10,emp:-0.03}},
  {id:'m03',name:'紫電偵察型',class:'輕量型',classTag:'light',hp:2100,en:185,atk:31,armor:18,speed:54,aim:44,cooling:39,maxLoad:68,price:6200,oreCost:22,art:'/assets/mechs/m03.svg',desc:'高速高命中，適合步槍與狙擊。',def:{beam:0.14,kinetic:-0.02,melee:-0.08,missile:0.02,emp:0}},
  {id:'m04',name:'烈紅近戰型',class:'突擊型',classTag:'light',hp:2550,en:170,atk:37,armor:25,speed:48,aim:38,cooling:34,maxLoad:82,price:7600,oreCost:26,art:'/assets/mechs/m04.svg',desc:'專精近戰衝鋒，揮刀節奏極快。',def:{beam:0.02,kinetic:0,melee:0.10,missile:-0.04,emp:0}},
  {id:'m05',name:'暴雨飛彈型',class:'火力型',classTag:'heavy',hp:3050,en:165,atk:35,armor:34,speed:27,aim:34,cooling:26,maxLoad:118,price:8900,oreCost:30,art:'/assets/mechs/m05.svg',desc:'飛彈掛點眾多，擅長範圍壓制。',def:{beam:0.03,kinetic:0.10,melee:-0.04,missile:0.14,emp:-0.02}},
  {id:'m06',name:'影披狙擊型',class:'輕量型',classTag:'light',hp:2200,en:180,atk:34,armor:20,speed:46,aim:50,cooling:35,maxLoad:75,price:8800,oreCost:28,art:'/assets/mechs/m06.svg',desc:'隱匿偵蒐，高命中、高先手。',def:{beam:0.10,kinetic:-0.02,melee:-0.08,missile:0.03,emp:0.02}},
  {id:'m07',name:'皇旗指揮型',class:'支援型',classTag:'support',hp:2900,en:195,atk:34,armor:30,speed:32,aim:40,cooling:38,maxLoad:92,price:9400,oreCost:34,art:'/assets/mechs/m07.svg',desc:'通訊與指揮能力優秀，能源系統穩定。',def:{beam:0.08,kinetic:0.03,melee:0,missile:0.04,emp:0.10}},
  {id:'m08',name:'黃鋼回收型',class:'支援型',classTag:'support',hp:3150,en:150,atk:30,armor:40,speed:22,aim:27,cooling:33,maxLoad:110,price:7000,oreCost:24,art:'/assets/mechs/m08.svg',desc:'工業重機改造，可承受高負重。',def:{beam:0.04,kinetic:0.08,melee:-0.02,missile:0.05,emp:0}},
  {id:'m09',name:'深海兩棲型',class:'重裝型',classTag:'heavy',hp:3300,en:175,atk:36,armor:42,speed:24,aim:30,cooling:29,maxLoad:106,price:9200,oreCost:33,art:'/assets/mechs/m09.svg',desc:'厚殼機體，對飛彈與光束有一定韌性。',def:{beam:0.09,kinetic:0.12,melee:-0.04,missile:0.12,emp:-0.04}},
  {id:'m10',name:'靜默干擾型',class:'支援型',classTag:'support',hp:2450,en:210,atk:29,armor:24,speed:36,aim:42,cooling:40,maxLoad:86,price:9600,oreCost:35,art:'/assets/mechs/m10.svg',desc:'電戰專精，散熱與電磁脈衝操作能力優秀。',def:{beam:0.03,kinetic:0,melee:0,missile:0.02,emp:0.16}},
  {id:'m11',name:'蒼槍突擊型',class:'平衡型',classTag:'balanced',hp:2950,en:178,atk:39,armor:30,speed:39,aim:37,cooling:31,maxLoad:95,price:9800,oreCost:36,art:'/assets/mechs/m11.svg',desc:'長兵器突擊框體，兼具速度與爆發。',def:{beam:0.04,kinetic:0.04,melee:0.06,missile:0,emp:0}},
  {id:'m12',name:'夜幕匿蹤型',class:'輕量型',classTag:'light',hp:2250,en:190,atk:35,armor:20,speed:55,aim:45,cooling:37,maxLoad:70,price:10200,oreCost:39,art:'/assets/mechs/m12.svg',desc:'高機動匿蹤框體，擅長先制與收割。',def:{beam:0.10,kinetic:-0.03,melee:-0.10,missile:0.04,emp:0.04}},
  {id:'m13',name:'砂塵火砲型',class:'重裝型',classTag:'heavy',hp:3500,en:155,atk:40,armor:49,speed:17,aim:29,cooling:23,maxLoad:136,price:10500,oreCost:40,art:'/assets/mechs/m13.svg',desc:'沙漠火力平台，超重裝備也能搭載。',def:{beam:0.05,kinetic:0.20,melee:-0.07,missile:0.08,emp:-0.03}},
  {id:'m14',name:'天翔變形型',class:'輕量型',classTag:'light',hp:2350,en:205,atk:34,armor:22,speed:58,aim:43,cooling:36,maxLoad:78,price:11000,oreCost:41,art:'/assets/mechs/m14.svg',desc:'高速巡航與突入能力極強。',def:{beam:0.10,kinetic:-0.04,melee:-0.08,missile:0.03,emp:0.02}},
  {id:'m15',name:'白羽醫療型',class:'支援型',classTag:'support',hp:2750,en:215,atk:28,armor:26,speed:33,aim:35,cooling:44,maxLoad:84,price:9300,oreCost:34,art:'/assets/mechs/m15.svg',desc:'能源與散熱系統極佳，適合長線作戰。',def:{beam:0.05,kinetic:0.02,melee:0.02,missile:0.04,emp:0.12}},
  {id:'m16',name:'城塞防衛型',class:'重裝型',classTag:'heavy',hp:3950,en:138,atk:33,armor:60,speed:14,aim:24,cooling:20,maxLoad:140,price:11800,oreCost:46,art:'/assets/mechs/m16.svg',desc:'超高防禦，最適合火箭砲與重盾戰法。',def:{beam:0.08,kinetic:0.24,melee:-0.10,missile:0.15,emp:-0.06}},
  {id:'m17',name:'雙刃決鬥型',class:'突擊型',classTag:'light',hp:2480,en:182,atk:41,armor:23,speed:50,aim:39,cooling:34,maxLoad:80,price:10800,oreCost:39,art:'/assets/mechs/m17.svg',desc:'近戰性能極致化，連續壓制能力高。',def:{beam:0.01,kinetic:-0.02,melee:0.12,missile:-0.03,emp:0}},
  {id:'m18',name:'光炮攻城型',class:'火力型',classTag:'heavy',hp:3380,en:190,atk:44,armor:39,speed:18,aim:34,cooling:25,maxLoad:134,price:12600,oreCost:48,art:'/assets/mechs/m18.svg',desc:'重型光束平台，一擊定勝負。',def:{beam:0.14,kinetic:0.06,melee:-0.08,missile:0.06,emp:-0.02}},
  {id:'m19',name:'鷹眼無人機型',class:'支援型',classTag:'support',hp:2600,en:205,atk:31,armor:27,speed:37,aim:47,cooling:41,maxLoad:88,price:10400,oreCost:38,art:'/assets/mechs/m19.svg',desc:'情報支援與精準射擊兼備。',def:{beam:0.06,kinetic:0.01,melee:-0.03,missile:0.03,emp:0.12}},
  {id:'m20',name:'熔岩重擊型',class:'重裝型',classTag:'heavy',hp:3720,en:168,atk:43,armor:46,speed:20,aim:28,cooling:42,maxLoad:125,price:13200,oreCost:50,art:'/assets/mechs/m20.svg',desc:'耐熱重擊框體，最不怕熱機。',def:{beam:0.06,kinetic:0.14,melee:0.02,missile:0.08,emp:-0.05}}
];

export const weaponById = id => WEAPONS.find(x=>x.id===id);
export const mechById = id => MECHS.find(x=>x.id===id);
