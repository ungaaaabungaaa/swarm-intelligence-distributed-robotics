function grid(){const rows=Array.from({length:18},()=>Array(24).fill('.'));for(let x=0;x<24;x++){rows[0][x]='#';rows[17][x]='#';}for(let y=0;y<18;y++){rows[y][0]='#';rows[y][23]='#';}return rows;}
function rectangle(rows,x0,y0,x1,y1){for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)rows[y][x]='#';}
const warehouse=grid();
for(const[x0,y0,x1,y1]of [[5,3,6,7],[5,12,6,14],[11,5,12,13],[17,3,18,7],[17,12,18,14]])rectangle(warehouse,x0,y0,x1,y1);
const concave=grid();rectangle(concave,5,4,17,5);rectangle(concave,5,6,6,13);rectangle(concave,16,6,17,13);
const rooms=grid();for(let y=1;y<17;y++){if(y!==4&&y!==13)rooms[y][8]='#';if(y!==8)rooms[y][16]='#';}for(let x=1;x<8;x++)if(x!==4)rooms[9][x]='#';for(let x=9;x<16;x++)if(x!==12)rooms[6][x]='#';for(let x=17;x<23;x++)if(x!==20)rooms[12][x]='#';
export const SCENARIOS=Object.freeze({
 warehouse:{name:'Warehouse aisles',description:'Five storage blocks with open connecting aisles.',world:warehouse.map(row=>row.join(''))},
 concave:{name:'Concave courtyard',description:'A U-shaped obstacle tests map discovery and detours.',world:concave.map(row=>row.join(''))},
 rooms:{name:'Connected rooms',description:'Narrow doorways connect several rooms.',world:rooms.map(row=>row.join(''))}
});
export const POLICIES=Object.freeze({gossip:'Neighbor gossip + frontier',frontier:'Independent frontier',random:'Independent random walk'});
