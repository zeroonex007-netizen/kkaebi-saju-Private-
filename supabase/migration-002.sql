-- 부적냥 사주 2차 업데이트: 출석·뽑기·공유 미션·도감·레벨·부적 패스(월 구독)
-- Supabase > SQL Editor에 통째로 붙여넣고 Run. 여러 번 실행해도 안전하게 만들었습니다.

-- ── 1. 프로필에 칸 추가 ──
alter table public.profiles
  add column if not exists xp int not null default 0,
  add column if not exists streak int not null default 0,
  add column if not exists last_checkin date,
  add column if not exists gacha_day date,
  add column if not exists gacha_count int not null default 0,
  add column if not exists bonus_coins int not null default 0,   -- 반짝 별사탕 (bonus_day 당일만 사용)
  add column if not exists bonus_day date,
  add column if not exists mission_day date;                      -- 공유 미션 보상 받은 날

-- ── 2. 새 테이블 ──
create table if not exists public.share_visits (
  referrer uuid not null references public.profiles(id) on delete cascade,
  day date not null,
  visitor text not null,
  created_at timestamptz not null default now(),
  primary key (referrer, day, visitor)
);
create table if not exists public.collection (
  user_id uuid not null references public.profiles(id) on delete cascade,
  card int not null check (card between 0 and 59),        -- 60갑자 번호 (0=갑자 … 59=계해)
  source text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, card)
);
create table if not exists public.subscriptions (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  billing_key text,
  status text not null default 'active',                  -- active | canceled | past_due
  amount int not null,
  current_period_end timestamptz not null,
  next_billing_at timestamptz,
  fail_count int not null default 0,
  card_label text,
  created_at timestamptz not null default now(),
  canceled_at timestamptz
);
create table if not exists public.sub_payments (
  order_id text primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  amount int not null,
  status text not null,
  payment_key text,
  message text,
  created_at timestamptz not null default now()
);
alter table public.share_visits  enable row level security;
alter table public.collection    enable row level security;
alter table public.subscriptions enable row level security;
alter table public.sub_payments  enable row level security;

-- ── 3. 도우미 ──
create or replace function public.kst_today() returns date language sql stable as $$
  select (now() at time zone 'Asia/Seoul')::date $$;

create or replace function public.is_sub(uid uuid) returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from subscriptions where user_id = uid and status in ('active','canceled','past_due') and current_period_end > now()) $$;

-- 레벨: 경험치 기준표
create or replace function public.lvl(x int) returns int language sql immutable as $$
  select count(*)::int from unnest(array[0,30,80,150,250,400,600,850,1150,1500]) t where x >= t $$;

-- 경험치 지급 (패스 회원 2배) + 레벨업 보상: 매 레벨 조각 1개, Lv5·Lv10은 별사탕 1·3개 추가
create or replace function public.add_xp(uid uuid, amt int) returns jsonb
language plpgsql security definer set search_path = public as $$
declare m int := case when is_sub(uid) then 2 else 1 end; o int; n int; ol int; nl int; L int;
begin
  update profiles set xp = xp + amt * m where id = uid returning xp - amt * m, xp into o, n;
  ol := lvl(o); nl := lvl(n);
  if nl > ol then
    for L in ol + 1 .. nl loop
      perform add_piece(uid);
      if L = 5 then perform add_coins(uid, 1); end if;
      if L = 10 then perform add_coins(uid, 3); end if;
    end loop;
  end if;
  return jsonb_build_object('xp', n, 'gained', amt * m, 'level', nl, 'leveled', nl > ol);
end $$;

-- ── 4. 별사탕 쓰기: 반짝 별사탕(오늘분)부터 먼저 ──
create or replace function public.spend_any(uid uuid, n int) returns text
language plpgsql security definer set search_path = public as $$
begin
  update profiles set bonus_coins = bonus_coins - n where id = uid and bonus_day = kst_today() and bonus_coins >= n;
  if found then return 'bonus'; end if;
  update profiles set coins = coins - n where id = uid and coins >= n;
  if found then return 'paid'; end if;
  return null;
end $$;
create or replace function public.refund_any(uid uuid, n int, kind text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if kind = 'bonus' then update profiles set bonus_coins = bonus_coins + n where id = uid and bonus_day = kst_today();
  elsif kind = 'paid' then update profiles set coins = coins + n where id = uid; end if;
end $$;

-- ── 5. 출석 ──
create or replace function public.checkin(uid uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
declare t date := kst_today(); s int; reward text := null; x jsonb;
begin
  update profiles set streak = case when last_checkin = t - 1 then streak + 1 else 1 end, last_checkin = t
    where id = uid and (last_checkin is null or last_checkin < t) returning streak into s;
  if s is null then return jsonb_build_object('already', true); end if;
  if s % 7 = 0 then perform add_coins(uid, 1); reward := 'coin';
  elsif s % 3 = 0 then perform add_piece(uid); reward := 'piece'; end if;
  x := add_xp(uid, 10);
  return jsonb_build_object('already', false, 'streak', s, 'reward', reward, 'xp', x);
end $$;

-- ── 6. 도감 카드 ──
create or replace function public.add_card(uid uuid, c int, src text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare total int; bonus int := 0;
begin
  insert into collection (user_id, card, source) values (uid, c, src) on conflict do nothing;
  if not found then return jsonb_build_object('new', false, 'card', c); end if;
  select count(*) into total from collection where user_id = uid;
  if total = 10 then bonus := 1; elsif total = 30 then bonus := 2; elsif total = 60 then bonus := 5; end if;
  if bonus > 0 then perform add_coins(uid, bonus); end if;
  perform add_xp(uid, 15);
  return jsonb_build_object('new', true, 'card', c, 'total', total, 'bonus', bonus);
end $$;

-- ── 7. 복주머니 뽑기 (하루 1번, 패스 회원 2번) ──
-- 확률: 별사탕 10% · 조각 35% · 도감 카드 15% · 경험치 +20 40%
create or replace function public.gacha(uid uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
declare t date := kst_today(); lim int := case when is_sub(uid) then 2 else 1 end; ok boolean; r float := random(); res jsonb; c int;
begin
  update profiles set gacha_count = case when gacha_day = t then gacha_count + 1 else 1 end, gacha_day = t
    where id = uid and (gacha_day is distinct from t or gacha_count < lim);
  if not found then return jsonb_build_object('error', 'done'); end if;
  if r < 0.10 then perform add_coins(uid, 1); res := jsonb_build_object('prize', 'coin');
  elsif r < 0.45 then perform add_piece(uid); res := jsonb_build_object('prize', 'piece');
  elsif r < 0.60 then c := floor(random() * 60)::int; res := jsonb_build_object('prize', 'card', 'card', add_card(uid, c, 'gacha'));
  else res := jsonb_build_object('prize', 'xp'); perform add_xp(uid, 15); end if;
  return res || jsonb_build_object('xp', add_xp(uid, 5));
end $$;

-- ── 8. 공유 미션: 내 링크를 연 서로 다른 방문자 3명 → 반짝 별사탕 1개 (하루 1번) ──
create or replace function public.record_visit(code text, v text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare r uuid; t date := kst_today(); cnt int;
begin
  select id into r from profiles where ref_code = code;
  if r is null then return jsonb_build_object('ok', false); end if;
  insert into share_visits (referrer, day, visitor) values (r, t, v) on conflict do nothing;
  select count(*) into cnt from share_visits where referrer = r and day = t;
  if cnt >= 3 then
    update profiles set bonus_coins = case when bonus_day = t then bonus_coins + 1 else 1 end, bonus_day = t, mission_day = t
      where id = r and (mission_day is null or mission_day < t);
    if found then perform add_xp(r, 20); end if;
  end if;
  return jsonb_build_object('ok', true);
end $$;

-- ── 9. 구독 결제 성공 처리 (같은 주문 1번만) ──
create or replace function public.sub_paid(uid uuid, oid text, pkey text, amt int, coins_n int) returns boolean
language plpgsql security definer set search_path = public as $$
begin
  insert into sub_payments (order_id, user_id, amount, status, payment_key) values (oid, uid, amt, 'done', pkey) on conflict do nothing;
  if not found then return false; end if;
  update subscriptions set
    current_period_end = greatest(current_period_end, now()) + interval '1 month',
    next_billing_at = greatest(current_period_end, now()) + interval '1 month',
    status = 'active', fail_count = 0
    where user_id = uid;
  perform add_coins(uid, coins_n);
  return true;
end $$;

revoke execute on function public.add_xp(uuid,int), public.spend_any(uuid,int), public.refund_any(uuid,int,text),
  public.checkin(uuid), public.add_card(uuid,int,text), public.gacha(uuid), public.record_visit(text,text),
  public.sub_paid(uuid,text,text,int,int), public.is_sub(uuid)
  from public, anon, authenticated;
