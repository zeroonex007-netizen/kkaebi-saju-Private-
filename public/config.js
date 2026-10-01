// 공개해도 되는 키만 여기에 넣으세요. (service_role 키, 토스 시크릿 키, Anthropic 키는 절대 여기 X → Vercel 환경변수)
window.KKAEBI_CONFIG = {
  SUPABASE_URL: "https://eulinqcucvjqtncusqom.supabase.co",
  SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1bGlucWN1Y3ZqcXRuY3VzcW9tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA4MzA1NzAsImV4cCI6MjEwNjQwNjU3MH0.bDmMLrjJGIGxgMYLInlON44hcizO2qeEeEy6p8oYEyk",
  // 토스페이먼츠 결제위젯 '클라이언트 키'. 아래는 토스 문서용 테스트 키 (실제 돈 안 나감)
  // 카카오 디벨로퍼스 > 앱 > 플랫폼 키 > JavaScript 키 (공개해도 되는 키)
  KAKAO_JS_KEY: "6d27b6bb085994fc5c94d499391e2209",
  TOSS_CLIENT_KEY: "test_gck_docs_Ovk5rk1EwkEbP0W43n07xlzm",
  // 부적 패스(월 구독) 카드 등록용 "API 개별 연동" 클라이언트 키. 아래는 토스 문서용 테스트 키 (실제 돈 안 나감)
  TOSS_BILLING_CLIENT_KEY: "test_ck_docs_Ovk5rk1EwkEbP0W43n07xlzm",
  BIZ: {
    name: "영일경영전략연구소",
    owner: "강기훈",
    regNo: "429-20-02172",          // 사업자등록번호
    ecomNo: "",                       // 통신판매업 신고번호 (신고 후 입력, 비어 있으면 "신고 진행 중"으로 표시)
    address: "충청남도 천안시 서북구 월봉로 126, 901-d36호 (쌍용동, 대림프라자)",
    email: "",                        // 고객센터 이메일
    phone: ""                         // 고객센터 전화 (없으면 비워 두기)
  }
};
