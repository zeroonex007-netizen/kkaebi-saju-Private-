-- 부적냥 사주 DB 스키마 — Supabase 대시보드 > SQL Editor에 통째로 붙여넣고 Run
-- 별사탕 증감은 전부 아래 함수로만, 서버(service_role)만 호출할 수 있습니다.

create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  name text, sex text, birth date, birth_time text,
  coins int not null default 0 check (coins >= 0),
  pieces int not null default 0 check (pieces between 0 and 2),
  ref_code text unique not null default substr(md5(random()::text || clock_timestamp()::text), 1, 8),
  referred_by uuid references public.profiles(id),
  shared_once boolean not null default false,
  free_chat_day date,
  created_at timestamptz not null default now()
);

create table public.orders (
  id text primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  pack text not null, coins int not null, amount int not null,
  status text not null default 'ready',          -- ready | done
  payment_key text,
  created_at timestamptz not null default now()
);

create table public.reviews (
  id bigserial primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  product text not null,
  stars int not null check (stars between 1 and 5),
  body text not null check (char_length(body) between 10 and 300),
  rewarded boolean not null default true,           -- 리워드 지급 후기 표시용
  created_at timestamptz not null default now(),
  unique (user_id, product)
);

create table public.daily (
  user_id uuid references public.profiles(id) on delete cascade,
  day date not null,
  text text not null,
  primary key (user_id, day)
);

-- 브라우저에서 직접 읽고 쓰지 못하게 RLS만 켜고 정책은 두지 않음 (모든 접근은 /api 경유)
alter table public.profiles enable row level security;
alter table public.orders   enable row level security;
alter table public.reviews  enable row level security;
alter table public.daily    enable row level security;

-- 가입하면 프로필 자동 생성
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin insert into public.profiles (id) values (new.id); return new; end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- 별사탕 차감 (모자라면 false)
create or replace function public.spend_coin(uid uuid, n int) returns boolean
language plpgsql security definer set search_path = public as $$
begin update profiles set coins = coins - n where id = uid and coins >= n; return found; end $$;

-- 별사탕 지급 (AI 실패 시 환불 등)
create or replace function public.add_coins(uid uuid, n int) returns void
language sql security definer set search_path = public as $$
  update profiles set coins = coins + n where id = uid; $$;

-- 별사탕 조각 +1 (3개 모이면 별사탕 1개)
create or replace function public.add_piece(uid uuid) returns void
language sql security definer set search_path = public as $$
  update profiles set pieces = (pieces + 1) % 3, coins = coins + (pieces + 1) / 3 where id = uid; $$;

-- 결제 완료 처리 (같은 주문은 한 번만 지급)
create or replace function public.complete_order(oid text, pkey text) returns int
language plpgsql security definer set search_path = public as $$
declare u uuid; c int;
begin
  update orders set status = 'done', payment_key = pkey
    where id = oid and status = 'ready' returning user_id, coins into u, c;
  if u is null then return 0; end if;
  update profiles set coins = coins + c where id = u;
  return c;
end $$;

-- 하루 1회 무료 수다 (한국 시간 기준)
create or replace function public.use_free_chat(uid uuid) returns boolean
language plpgsql security definer set search_path = public as $$
declare today date := (now() at time zone 'Asia/Seoul')::date;
begin
  update profiles set free_chat_day = today
    where id = uid and (free_chat_day is null or free_chat_day < today);
  return found;
end $$;

-- 첫 공유 보상 (계정당 1회)
create or replace function public.share_reward(uid uuid) returns boolean
language plpgsql security definer set search_path = public as $$
begin update profiles set shared_once = true, coins = coins + 1 where id = uid and not shared_once; return found; end $$;

-- 초대 보상: 가입 24시간 안에 초대 코드를 쓰면 나와 친구 둘 다 +1
create or replace function public.claim_referral(uid uuid, code text) returns boolean
language plpgsql security definer set search_path = public as $$
declare r uuid;
begin
  select id into r from profiles where ref_code = code;
  if r is null or r = uid then return false; end if;
  update profiles set referred_by = r, coins = coins + 1
    where id = uid and referred_by is null and created_at > now() - interval '1 day';
  if not found then return false; end if;
  update profiles set coins = coins + 1 where id = r;
  return true;
end $$;

-- 위 함수들은 서버 전용
revoke execute on function public.spend_coin(uuid,int), public.add_coins(uuid,int), public.add_piece(uuid),
  public.complete_order(text,text), public.use_free_chat(uuid), public.share_reward(uuid),
  public.claim_referral(uuid,text)
  from public, anon, authenticated;
