// 공개해도 되는 키만 여기에 넣으세요. (service_role 키, 토스 시크릿 키, Anthropic 키는 절대 여기 X → Vercel 환경변수)
window.KKAEBI_CONFIG = {
  SUPABASE_URL: "https://YOUR-PROJECT.supabase.co",
  SUPABASE_ANON_KEY: "YOUR-SUPABASE-ANON-KEY",
  // 토스페이먼츠 결제위젯 '클라이언트 키'. 아래는 토스 문서용 테스트 키 (실제 돈 안 나감)
  TOSS_CLIENT_KEY: "test_gck_docs_Ovk5rk1EwkEbP0W43n07xlzm",
  BIZ: {
    name: "영일경영전략연구소",
    owner: "강기훈",
    regNo: "000-00-00000",          // 사업자등록번호
    ecomNo: "0000-충남천안-0000",     // 통신판매업 신고번호
    address: "충청남도 천안시 서북구 ○○로 00",
    email: "help@example.com",
    phone: "000-0000-0000"
  }
};
