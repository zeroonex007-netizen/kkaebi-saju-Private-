// 내 정보: 별사탕·조각·반짝 별사탕, 레벨, 출석, 뽑기, 공유 미션, 도감, 깨비 패스
import { route, admin } from "./_lib.js";
import { todayKST } from "../public/saju.js";

export default route(async (req, res, user) => {
  const [y, m, d] = todayKST();
  const today = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  const [{ data: p }, { data: rv }, { data: cards }, { data: sub }, { count: visits }] = await Promise.all([
    admin.from("profiles").select("*").eq("id", user.id).single(),
    admin.from("reviews").select("product").eq("user_id", user.id),
    admin.from("collection").select("card").eq("user_id", user.id),
    admin.from("subscriptions").select("status,current_period_end,next_billing_at,card_label,amount").eq("user_id", user.id).maybeSingle(),
    admin.from("share_visits").select("*", { count: "exact", head: true }).eq("referrer", user.id).eq("day", today),
  ]);
  const isSub = !!(sub && sub.current_period_end && new Date(sub.current_period_end) > new Date());
  const gachaLimit = isSub ? 2 : 1;
  res.json({
    name: p.name, sex: p.sex, birth: p.birth, birth_time: p.birth_time,
    coins: p.coins, pieces: p.pieces, ref_code: p.ref_code, shared_once: p.shared_once,
    bonus: p.bonus_day === today ? p.bonus_coins : 0,
    // 어제나 오늘 출석했으면 연속 기록 유지, 아니면 끊긴 것
    xp: p.xp, streak: p.last_checkin && p.last_checkin >= new Date(Date.UTC(y, m - 1, d - 1)).toISOString().slice(0, 10) ? p.streak : 0,
    checked_today: p.last_checkin === today,
    gacha_left: Math.max(0, gachaLimit - (p.gacha_day === today ? p.gacha_count : 0)),
    mission: { visits: Math.min(visits || 0, 3), done: p.mission_day === today },
    cards: (cards || []).map((c) => c.card),
    sub: sub ? { ...sub, active: isSub } : null,
    reviewed: (rv || []).map((r) => r.product),
  });
});
