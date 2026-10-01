# 부적냥 사주 — 사이트 올리는 법

이마에 부적 붙인 무기력한 고양이 부적냥이 봐주는 990원 사주 사이트입니다. 카카오 로그인, 토스페이먼츠 결제(카드·카카오페이·네이버페이·토스페이), 별사탕 충전, 후기·초대 리워드가 들어 있습니다.

코드는 다 짜여 있고, **계정 5개를 만들어 키만 넣으면** 돌아갑니다. 처음이면 반나절 정도 걸립니다.

## 필요한 계정 (전부 무료로 시작)

| 서비스 | 용도 | 비용 |
|---|---|---|
| GitHub | 코드 보관 | 무료 |
| Vercel | 사이트 운영(호스팅) | 무료 → 사용자 늘면 월 $20 |
| Supabase | 회원·별사탕 DB | 무료 → 사용자 늘면 월 $25 |
| 카카오 디벨로퍼스 | 카카오 로그인 | 무료 |
| 토스페이먼츠 | 결제 | 가입 무료, 결제 수수료 |
| Anthropic Console | AI 풀이 | 사용한 만큼 (풀이 1회 수십 원) |

---

## 1. Supabase (DB)

1. supabase.com 가입 → **New project** (Region: Northeast Asia (Seoul))
2. 왼쪽 **SQL Editor** → `supabase/schema.sql` 내용을 통째로 붙여넣고 **Run**
3. **Project Settings → API**에서 세 가지를 복사해 둡니다.
   - Project URL
   - `anon` public 키 → 사이트에 넣는 키
   - `service_role` 키 → **절대 공개 금지**, Vercel에만 넣음

## 2. 카카오 로그인

1. developers.kakao.com → **내 애플리케이션 → 애플리케이션 추가** (앱 이름: 부적냥 사주, 사업자명: 영일경영전략연구소)
2. **제품 설정 → 카카오 로그인 → 활성화 ON**
3. **Redirect URI**에 `https://<프로젝트ID>.supabase.co/auth/v1/callback` 등록
4. **동의항목**: 닉네임(필수). 이메일은 비즈 앱 전환(사업자등록증 제출)이 필요하니 처음엔 빼도 됩니다.
5. **앱 키 → REST API 키**, **보안 → Client Secret 생성·활성화**
6. Supabase → **Authentication → Providers → Kakao** 켜고 REST API 키(Client ID)와 Client Secret 입력
7. Supabase → **Authentication → URL Configuration**
   - Site URL: 배포 주소 (예: `https://kkaebi.vercel.app`, 도메인 연결 후엔 그 도메인)
   - Redirect URLs에도 같은 주소 추가

## 3. 토스페이먼츠

1. developers.tosspayments.com 가입
2. 처음엔 `public/config.js`에 들어 있는 **토스 문서용 테스트 키**로 바로 테스트할 수 있습니다. (Vercel에는 짝이 되는 테스트 시크릿 키 `test_gsk_docs_OaPz8L5KdmQXkzRz3y47BMw6`를 넣으세요. 토스 문서에 공개된 키라 실제 돈은 안 나갑니다.)
3. 실결제 전환: 토스에 **전자결제 계약 신청**(사업자등록증, 통신판매업 신고증 제출) → 승인 후 **결제위젯** 라이브 키 2개로 교체
   - 클라이언트 키(`live_gck_…`) → `public/config.js`
   - 시크릿 키(`live_gsk_…`) → Vercel 환경변수 `TOSS_SECRET_KEY`
4. 토스 상점관리자에서 **결제위젯 → 결제 UI 설정**으로 카카오페이·네이버페이·토스페이를 켭니다.

> ⚠️ 키는 꼭 **결제위젯용**(gck/gsk)을 쓰세요. API 개별 연동 키(ck/sk)는 이 코드와 안 맞습니다.

## 4. Anthropic API 키

console.anthropic.com → 결제수단 등록 → **API Keys → Create Key**. 기본 모델은 저렴한 `claude-haiku-4-5-20251001`이고, 품질을 올리고 싶으면 환경변수 `ANTHROPIC_MODEL`을 `claude-sonnet-5-5`로 바꾸면 됩니다(비용 증가).

## 5. 사이트 정보 넣기

`public/config.js`를 열어서 채웁니다.
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`
- `BIZ` — 사업자등록번호, 통신판매업 신고번호, 주소, 고객센터 이메일·전화 (하단에 표시 의무)

`public/terms.html`, `public/privacy.html`은 **초안**입니다. `[ ]` 표시된 부분을 채우고 검토 후 오픈하세요.

## 6. 배포 (Vercel)

1. github.com에서 새 저장소(Private) 만들고 이 폴더를 통째로 업로드
2. vercel.com → GitHub로 로그인 → **Add New → Project → 저장소 Import**
3. **Environment Variables**에 아래 4개 입력 후 **Deploy**

| 이름 | 값 |
|---|---|
| `SUPABASE_URL` | Supabase Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service_role 키 |
| `ANTHROPIC_API_KEY` | Anthropic 키 |
| `TOSS_SECRET_KEY` | 토스 결제위젯 시크릿 키 |

4. 배포 주소가 나오면 2-7번(Supabase URL Configuration)에 그 주소를 넣습니다.

## 7. 도메인 연결 (선택)

가비아 등에서 도메인 구입(연 1~3만 원) → Vercel 프로젝트 **Settings → Domains**에 추가 → 안내대로 DNS 설정. 바꾼 도메인을 Supabase URL Configuration에도 넣으세요.

## 8. 오픈 전 체크리스트

- [ ] 테스트 결제 → 별사탕 충전 → 풀이까지 한 바퀴 확인
- [ ] 하단 사업자 정보·통신판매업 신고번호 기재
- [ ] 이용약관·개인정보처리방침 확정 (국외 이전 고지 포함)
- [ ] 토스 라이브 키 교체
- [ ] Anthropic 콘솔에서 월 사용 한도(Spend limit) 설정

---

## 구조

```
public/            사이트 화면
  index.html       메인 앱
  saju.js          만세력 계산 (화면·서버 공용)
  products.js      메뉴·가격 (서버가 이 가격으로 검증)
  config.js        공개 설정 (Supabase anon 키, 토스 클라이언트 키, 사업자 정보)
  terms.html / privacy.html
api/               서버 (Vercel 함수)
  reading.js       990원 풀이 — 별사탕 차감, AI 실패 시 자동 환불
  chat.js          부적냥 고민 상담 — 하루 1회 무료
  daily.js         오늘의 무료 운세 — 하루 1회 생성 후 저장
  order.js         결제 주문 생성
  pay-confirm.js   토스 결제 승인 → 별사탕 충전 (중복 충전 방지)
  review.js        후기 → 별사탕 조각 (메뉴당 1회)
  share.js         첫 공유 보상 (계정당 1회)
  ref.js           초대 링크 가입 보상 (둘 다 +1)
  me.js / reviews.js
supabase/schema.sql  DB 테이블과 별사탕 함수
```

## 리워드 규칙

- **후기**: 메뉴당 1회, 별사탕 조각 1개(≈330원). 3개면 별사탕 1개. 홈에 "별사탕 조각 지급 후기"로 표시됩니다(표시광고법).
- **첫 공유**: 계정당 1회 별사탕 1개. 공유는 실제로 했는지 확인할 방법이 없어서 하루 1회가 아니라 계정당 1회로 묶었습니다.
- **초대**: 친구가 내 링크로 가입(24시간 이내)하면 둘 다 1개씩. 카카오 계정을 여러 개 만드는 부정 이용은 약관 제6조로 막고, 많아지면 휴대폰 본인인증을 추가하세요.

## 다음에 붙일 것

- **네이버 로그인**: `api/naver-start.js`, `api/naver-callback.js`로 직접 연동돼 있습니다. 네이버 개발자센터에서 받은 Client ID·Secret을 Vercel 환경변수 `NAVER_CLIENT_ID`, `NAVER_CLIENT_SECRET`에 넣으면 켜집니다.
- **음력 입력·정확한 절기**: 한국천문연구원 음양력 API 연동
- **월 990원 구독**: 토스 자동결제(빌링) 연동
- **관리자 화면**: 매출, 별사탕 수동 지급·회수, 후기 숨김

로컬에서 미리 보려면: `npm install` 후 `npx vercel dev`


---

## 2차 업데이트: 매일 루프 · 레벨 · 도감 · 부적 패스

### 적용 방법 (3단계)
1. **DB:** Supabase > SQL Editor에 `supabase/migration-002.sql`을 통째로 붙여넣고 Run (여러 번 실행해도 안전)
2. **Vercel 환경변수 추가:** `CRON_SECRET` = 아무 긴 랜덤 문자열 (32자 이상). 자동 결제 작업을 아무나 못 부르게 막는 열쇠입니다.
3. **Redeploy**

### 기능
- **출석:** 접속하면 자동. 3일 연속마다 조각, 7일 연속마다 별사탕
- **복주머니:** 하루 1번(패스 2번). 확률 별사탕 10% · 조각 35% · 카드 15% · 경험치 40% (화면에 공개)
- **공유 미션:** 내 링크를 서로 다른 3명이 열면 그날만 쓰는 반짝 별사탕 1개. 별사탕을 쓸 때 반짝 별사탕이 먼저 차감됨
- **부적 도감:** 60갑자 카드. 내 사주·궁합 상대·뽑기로 획득, 10/30/60장 달성 보상
- **레벨:** Lv.1 아기 부적냥 ~ Lv.10 부적냥 대왕, 레벨업마다 조각, Lv.5·Lv.10 별사탕
- **부적 패스:** 월 4,900원 자동결제, 매달 별사탕 6개 + 뽑기 2번 + 경험치 2배 + 배지. 매일 한국시간 오전 10시(`vercel.json` cron)에 결제일이 된 구독을 갱신

### 부적 패스 실결제 켜기
자동결제(빌링)는 결제위젯과 **별도 계약**입니다. 토스 상점관리자에서 **정기결제(자동결제)** 를 추가 신청해 승인받은 뒤:
- `public/config.js`의 `TOSS_BILLING_CLIENT_KEY` → **API 개별 연동 클라이언트 키**(`live_ck_…`)
- Vercel 환경변수 `TOSS_BILLING_SECRET_KEY` → **API 개별 연동 시크릿 키**(`live_sk_…`)

그전까지는 토스 문서용 테스트 키로 동작해 실제 돈은 나가지 않습니다.


---

## 3차 업데이트: 이미지 부적 · 부적 선물하기

### 적용 방법
Supabase > SQL Editor에 `supabase/migration-003.sql`을 통째로 붙여넣고 **Run** (여러 번 실행해도 안전, 예전 버전을 돌렸어도 다시 Run)

### 기능
- **부적 상점 6종:** 재물·연애·합격·취뽀·귀인·무탈. 별사탕 1개(990원). 내 이름·일주·사주에서 가장 부족한 오행이 들어간 1080×1920 폰 배경화면, 부적냥이 이름을 부르며 비는 기원문과 일련번호 포함
- **부적냥 처방전:** 풀이가 끝나면 부족한 오행 + 메뉴(연애운·궁합→연애, 연운→재물, 대운→취뽀, 택일→목적별) 기준으로 부적 1~2개 추천
- **부적 선물하기:** 별사탕 1개로 친구 이름이 들어간 부적을 카톡으로 전송 → 친구가 링크로 가입·로그인하면 친구 부적함에 들어감(내 초대 링크도 같이 붙어서 가입 보상까지). 안 열어본 선물은 홈에서 다시 보내기 가능
- 같은 부적은 한 번만 결제, 다시 저장은 무료. 디지털 이미지라 받은 뒤 환불 불가(구매 화면·약관 제5조의4에 고지)

### 문구 원칙
부적냥이 **진심으로 빌어주는** 톤으로 쓰되, "반드시 붙는다·무조건 합격" 같은 **결과 보장 표현은 쓰지 않습니다**(표시광고법). 결과를 보장하지 않는다는 문장은 약관에만 둡니다.
