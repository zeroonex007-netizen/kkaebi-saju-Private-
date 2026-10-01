// 만세력 계산 (브라우저와 서버가 같이 씀)
export const STEMS=["甲","乙","丙","丁","戊","己","庚","辛","壬","癸"];
export const STEM_KO=["갑","을","병","정","무","기","경","신","임","계"];
export const STEM_EL=["목","목","화","화","토","토","금","금","수","수"];
export const BR=["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"];
export const BR_KO=["자","축","인","묘","진","사","오","미","신","유","술","해"];
export const BR_EL=["수","토","목","목","토","화","화","토","금","금","토","수"];
// 절입일 근사치 [월, 일, 월지]
const TERMS=[[1,6,1],[2,4,2],[3,6,3],[4,5,4],[5,6,5],[6,6,6],[7,7,7],[8,8,8],[9,8,9],[10,8,10],[11,7,11],[12,7,0]];

function jdn(y,m,d){const a=Math.floor((14-m)/12),Y=y+4800-a,M=m+12*a-3;
  return d+Math.floor((153*M+2)/5)+365*Y+Math.floor(Y/4)-Math.floor(Y/100)+Math.floor(Y/400)-32045;}
export const dayP=(y,m,d)=>{const i=((jdn(y,m,d)+49)%60+60)%60;return{s:i%10,b:i%12};};
const addDays=(y,m,d,n)=>{const t=new Date(Date.UTC(y,m-1,d+n));return[t.getUTCFullYear(),t.getUTCMonth()+1,t.getUTCDate(),t.getUTCDay()];};

export function saju(y,m,d,h){
  let sy=y;if(m<2||(m===2&&d<4))sy--;
  const yi=((sy-4)%60+60)%60,ys=yi%10;
  let mb=0;for(const[tm,td,b]of TERMS)if(m>tm||(m===tm&&d>=td))mb=b;
  const ms=((ys%5)*2+2+((mb-2+12)%12))%10;
  const day=(h!==null&&h>=23)?dayP(...addDays(y,m,d,1).slice(0,3)):dayP(y,m,d);
  let hour=null;if(h!==null){const hb=Math.floor((h+1)/2)%12;hour={s:((day.s%5)*2+hb)%10,b:hb};}
  return{year:{s:ys,b:yi%12},month:{s:ms,b:mb},day,hour};
}
export function sajuOf(birth,time){const[y,m,d]=birth.split("-").map(Number);return saju(y,m,d,time==="모름"?null:Number(time.split(":")[0]));}
export const gz=x=>x?STEM_KO[x.s]+BR_KO[x.b]+"("+STEMS[x.s]+BR[x.b]+")":"모름";
export function elCount(p){const c={목:0,화:0,토:0,금:0,수:0};
  for(const k of["year","month","day","hour"])if(p[k]){c[STEM_EL[p[k].s]]++;c[BR_EL[p[k].b]]++;}return c;}

// 한국 시간 기준 오늘
export function todayKST(){const t=new Date(Date.now()+9*3600e3);return[t.getUTCFullYear(),t.getUTCMonth()+1,t.getUTCDate()];}
const WD="일월화수목금토";
// 일지 삼합·육합, 충 제외로 후보일 고르기
export function goodDays(p,n){
  const me=p.day.b,out=[],[y,m,d]=todayKST();
  for(let i=1;i<=60&&out.length<n;i++){const[Y,M,D,w]=addDays(y,m,d,i);const dp=dayP(Y,M,D);
    if(dp.b===(me+6)%12)continue;
    if((dp.b%4===me%4&&dp.b!==me)||dp.b===(13-me)%12)out.push({label:`${M}/${D}(${WD[w]})`,gz:gz(dp)});}
  return out;
}

// 일간 10유형 (공유 카드용)
export const TYPES=[
 ["쭉쭉 뻗는 큰나무","한번 정하면 끝까지 자라는 대장 체질"],
 ["어디서든 피는 들꽃","사람 사이를 살랑살랑 잇는 다정 체질"],
 ["모두를 비추는 햇님","있기만 해도 분위기가 환해지는 주인공"],
 ["밤을 밝히는 촛불","조용하지만 꺼지지 않는 섬세한 열정"],
 ["듬직한 큰 산","흔들리지 않는 믿음직한 버팀목"],
 ["포근한 텃밭","뭐든 키워내는 따뜻한 돌봄 장인"],
 ["단단한 원석","맺고 끊음 확실한 의리파"],
 ["반짝이는 보석","예민하고 섬세한 완벽주의 미학가"],
 ["넓고 깊은 바다","생각이 깊고 품이 넓은 자유로운 영혼"],
 ["보슬보슬 이슬비","눈치 백단, 마음을 읽는 직관러"]];
