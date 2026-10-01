// 메뉴·요금 (브라우저와 서버가 같이 씀 — 가격은 서버가 이 파일 기준으로 검증)
export const PRODUCTS=[
 {id:"saju",em:"🔮",c:"c-lav",name:"990원 사주",sub:"용하다는 그 풀이",desc:"여덟 글자로 네 성격, 재물, 일, 사람 복까지 깨비가 콕콕 짚어줄게.",
  keys:[["summary","깨비의 총평"],["personality","성격"],["money","재물운"],["work","일과 진로"],["people","사람 복"],["advice","깨비의 한마디"]]},
 {id:"love",em:"💘",c:"c-pink",name:"990원 연애운",sub:"내 인연은 언제 와?",desc:"내 연애 스타일, 잘 맞는 사람, 인연이 들어오는 시기를 알려줄게.",isNew:true,love:true,
  keys:[["style","나의 연애 스타일"],["match","나랑 찰떡인 사람"],["timing","인연이 오는 시기"],["now","지금 상태에서 해야 할 것"],["advice","깨비의 연애 조언"]]},
 {id:"gunghap",em:"🫶",c:"c-pink",name:"990원 궁합",sub:"우리 사이 몇 점?",desc:"두 사람의 사주를 겹쳐서 점수, 잘 맞는 점, 부딪히는 점을 알려줄게.",partner:true,
  keys:[["score","궁합 점수와 한 줄 평"],["good","찰떡인 부분"],["clash","삐걱이는 부분"],["tip","오래가는 비법"]]},
 {id:"yearly",em:"🐎",c:"c-sun",name:"990원 연운",sub:"올해 남은 운",desc:"올해 남은 기간이랑 내년까지, 달마다 흐름을 미리 보여줄게.",
  keys:[["overall","올해 총평"],["months","남은 달 흐름"],["luck","운이 트이는 때"],["caution","조심할 때"],["next","내년 미리보기"]]},
 {id:"daewoon",em:"🌊",c:"c-mint",name:"990원 대운",sub:"물 들어올 때 노 저어",desc:"10년 단위 큰 흐름에서 지금이 어떤 시기인지 알려줄게.",
  keys:[["now","지금 대운"],["rise","치고 나갈 때"],["rest","숨 고를 때"],["advice","10년 계획 한마디"]]},
 {id:"taekil",em:"📅",c:"c-mint",name:"990원 택일",sub:"좋은 날 골라줄게",desc:"앞으로 60일 중에 너랑 잘 맞는 날을 골라줄게.",purpose:true,
  keys:[["pick","제일 좋은 날과 이유"],["others","다른 후보일"],["tip","그날 챙길 것"]]}
];
export const LOVE_STATES=["솔로","썸 타는 중","연애 중","이별 후"];
export const PURPOSES=["고백·첫 데이트","이사","면접·시험","결혼·상견례","새로운 시작"];
export const PACKS=[
 {id:"p1",n:1,price:990},
 {id:"p5",n:5,price:4500,tag:"9% 할인"},
 {id:"p11",n:11,price:9900,tag:"1개 더!"}
];
export const SYS="너는 '깨비'라는 귀여운 꼬마 도깨비 사주쟁이야. 명리학은 진짜 전문가처럼 정확하게 보되, 말투는 다정한 반말 친구처럼 해. 이모지는 문단마다 최대 1개. 맞는 말은 솔직하게, 위로가 필요하면 따뜻하게. 공포 조장, 단정적 예언, 건강·사망·임신 예측은 절대 하지 마. 투자·대출·법률 같은 중대한 결정은 전문가와 상의하라고 짚어줘.";
