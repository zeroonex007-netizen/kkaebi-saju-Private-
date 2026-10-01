-- 부적냥 3차 업데이트: 이미지 부적 판매 + 부적 선물하기 (별사탕 1개 = 990원)
-- Supabase > SQL Editor에 통째로 붙여넣고 Run. 여러 번 실행해도 안전합니다. (예전 버전을 이미 돌렸어도 다시 Run 하세요)

create table if not exists public.amulets (
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null,
  el text,                                    -- 받을 때 기준 부족한 오행 (목·화·토·금·수)
  serial bigint generated always as identity, -- 부적 일련번호
  created_at timestamptz not null default now(),
  primary key (user_id, kind)
);
alter table public.amulets add column if not exists from_name text;  -- 선물 받은 부적이면 보낸 사람
alter table public.amulets add column if not exists to_name text;    -- 선물 받은 부적에 적힌 받는 사람 이름
alter table public.amulets enable row level security;

create table if not exists public.gifts (
  code text primary key,
  sender uuid not null references public.profiles(id) on delete cascade,
  kind text not null,
  from_name text not null,
  to_name text not null,
  msg text,
  created_at timestamptz not null default now(),
  claimed_by uuid references public.profiles(id) on delete set null,
  claimed_at timestamptz
);
alter table public.gifts enable row level security;

-- 내 부적: 같은 부적은 한 번만 결제, 이후 다시 저장은 무료
create or replace function public.buy_amulet(uid uuid, k text, e text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare a amulets; used text;
begin
  select * into a from amulets where user_id = uid and kind = k;
  if found then return to_jsonb(a) - 'user_id' || jsonb_build_object('owned', true); end if;
  used := spend_any(uid, 1);
  if used is null then return jsonb_build_object('error', 'coins'); end if;
  insert into amulets (user_id, kind, el) values (uid, k, e) returning * into a;
  perform add_xp(uid, 10);
  return to_jsonb(a) - 'user_id' || jsonb_build_object('owned', false, 'used', used);
end $$;

-- 선물 보내기: 별사탕 1개 차감 → 선물 코드 발급 (카톡 링크로 전달)
create or replace function public.send_gift(uid uuid, k text, fname text, tname text, m text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare c text := substr(md5(random()::text || clock_timestamp()::text || uid::text), 1, 10); used text;
begin
  used := spend_any(uid, 1);
  if used is null then return jsonb_build_object('error', 'coins'); end if;
  insert into gifts (code, sender, kind, from_name, to_name, msg) values (c, uid, k, fname, tname, nullif(m, ''));
  perform add_xp(uid, 15);
  return jsonb_build_object('code', c, 'used', used);
end $$;

-- 선물 받기: 내 부적함에 추가 (이미 같은 부적이 있으면 별사탕 1개로 대신 지급)
create or replace function public.claim_gift(uid uuid, c text, e text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare g gifts; dup boolean := false;
begin
  select * into g from gifts where code = c for update;
  if not found then return jsonb_build_object('error', 'notfound'); end if;
  if g.claimed_by = uid then return jsonb_build_object('already', true, 'kind', g.kind); end if;
  if g.claimed_by is not null then return jsonb_build_object('error', 'taken'); end if;
  if g.sender = uid then return jsonb_build_object('error', 'self'); end if;
  insert into amulets (user_id, kind, el, from_name, to_name) values (uid, g.kind, e, g.from_name, g.to_name) on conflict do nothing;
  if not found then dup := true; perform add_coins(uid, 1); end if;
  update gifts set claimed_by = uid, claimed_at = now() where code = c;
  perform add_xp(uid, 10);
  return jsonb_build_object('kind', g.kind, 'from_name', g.from_name, 'to_name', g.to_name, 'dup', dup);
end $$;

revoke execute on function public.buy_amulet(uuid,text,text), public.send_gift(uuid,text,text,text,text),
  public.claim_gift(uuid,text,text) from public, anon, authenticated;
