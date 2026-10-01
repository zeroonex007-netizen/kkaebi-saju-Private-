// 990원 메뉴 풀이: 별사탕 1개 차감 → 부적냥 문장 조합 풀이(AI 안 씀, 토큰 0원) → 실패하면 환불
import { route, admin, rpc, isDate, isTime, isSex, clip } from "../_lib.js";
import { sajuOf, goodDays, cardOf } from "../../public/saju.js";
import { PRODUCTS } from "../../public/products.js";
import { compose } from "../_text.js";

export default route(async (req, res, user, b) => {
  const prod = PRODUCTS.find((p) => p.id === b.product);
  const me = b.me || {};
  const name = clip(me.name, 20);
  if (!prod || !name || !isSex(me.sex) || !isDate(me.birth) || !isTime(me.time))
    return res.status(400).json({ error: "input" });

  let partner = null;
  if (prod.partner) {
    const p = b.partner || {};
    if (!clip(p.name, 20) || !isSex(p.sex) || !isDate(p.birth)) return res.status(400).json({ error: "partner" });
    partner = { name: clip(p.name, 20), sex: p.sex, birth: p.birth };
  }

  const kind = await rpc("spend_any", { uid: user.id, n: 1 });
  if (!kind) return res.status(402).json({ error: "coins" });

  await admin.from("profiles").update({ name, sex: me.sex, birth: me.birth, birth_time: me.time }).eq("id", user.id);

  try {
    const p = sajuOf(me.birth, me.time);
    const sections = compose(prod.id, { worry: clip(b.worry, 200), loveState: b.loveState, purpose: b.purpose, partner }, { name, sex: me.sex, birth: me.birth, time: me.time });
    const days = prod.purpose ? goodDays(p, 6) : null;
    // 보상: 경험치 + 도감 카드 (내 일주, 궁합이면 상대 일주)
    const rewards = { xp: await rpc("add_xp", { uid: user.id, amt: 30 }), cards: [] };
    rewards.cards.push(await rpc("add_card", { uid: user.id, c: cardOf(p.day), src: "reading" }));
    if (partner) rewards.cards.push(await rpc("add_card", { uid: user.id, c: cardOf(sajuOf(partner.birth, "모름").day), src: "partner" }));
    res.json({ sections, days, rewards, used: kind });
  } catch (e) {
    await rpc("refund_any", { uid: user.id, n: 1, kind });
    throw e;
  }
});
