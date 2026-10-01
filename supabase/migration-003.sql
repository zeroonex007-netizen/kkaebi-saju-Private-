-- 부적냥 3차 업데이트: 이미지 부적 판매 (별사탕 1개 = 990원)
-- Supabase > SQL Editor에 통째로 붙여넣고 Run. 여러 번 실행해도 안전합니다.

create table if not exists public.amulets (
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null,
  el text,                                   -- 받을 때 기준 부족한 오행 (목·화·토·금·수)
  serial bigint generated always as identity, -- 부적 일련번호
  created_at timestamptz not null default now(),
  primary key (user_id, kind)
);
alter table public.amulets enable row level security;

-- 같은 부적은 한 번만 결제, 이후 다시 저장은 무료
create or replace function public.buy_amulet(uid uuid, k text, e text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare a amulets; used text;
begin
  select * into a from amulets where user_id = uid and kind = k;
  if found then return jsonb_build_object('owned', true, 'kind', a.kind, 'el', a.el, 'serial', a.serial, 'created_at', a.created_at); end if;
  used := spend_any(uid, 1);
  if used is null then return jsonb_build_object('error', 'coins'); end if;
  insert into amulets (user_id, kind, el) values (uid, k, e) returning * into a;
  perform add_xp(uid, 10);
  return jsonb_build_object('owned', false, 'kind', a.kind, 'el', a.el, 'serial', a.serial, 'created_at', a.created_at, 'used', used);
end $$;

revoke execute on function public.buy_amulet(uuid,text,text) from public, anon, authenticated;
