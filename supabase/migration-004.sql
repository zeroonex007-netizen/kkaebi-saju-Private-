-- 부적냥 4차 업데이트: 네이버 로그인으로 받은 회원 정보 저장 칸
-- Supabase > SQL Editor에 통째로 붙여넣고 Run. 여러 번 실행해도 안전합니다.
alter table public.profiles
  add column if not exists nickname text,     -- 네이버 닉네임
  add column if not exists real_name text,    -- 네이버 회원이름
  add column if not exists phone text,        -- 휴대전화번호 (본인 확인·부정 이용 방지·문의 연락)
  add column if not exists avatar_url text,   -- 프로필 사진
  add column if not exists age_range text,    -- 연령대 (예: 20-29)
  add column if not exists provider text;     -- kakao | naver
create index if not exists profiles_phone_idx on public.profiles (phone);
