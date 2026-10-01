// 990원 메뉴 풀이: 별사탕 1개 차감 → AI 풀이 → 실패하면 환불
import { route, admin, rpc, claude, parseJSON, isDate, isTime, isSex, clip } from "./_lib.js";
import { sajuOf, gz, elCount, goodDays, todayKST, STEM_KO, STEM_EL } from "../public/saju.js";
import { PRODUCTS, SYS, LOVE_STATES, PURPOSES } from "../public/products.js";

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

  if (!(await rpc("spend_coin", { uid: user.id, n: 1 }))) return res.status(402).json({ error: "coins" });

  await admin.from("profiles").update({ name, sex: me.sex, birth: me.birth, birth_time: me.time }).eq("id", user.id);

  try {
    const p = sajuOf(me.birth, me.time), c = elCount(p);
    const [y, m, d] = todayKST();
    let ctx = `이름 ${name}(${me.sex}), 양력 ${me.birth} ${me.time}\n연주 ${gz(p.year)} 월주 ${gz(p.month)} 일주 ${gz(p.day)} 시주 ${gz(p.hour)}\n일간 ${STEM_KO[p.day.s]}${STEM_EL[p.day.s]}, 오행 ${JSON.stringify(c)}\n오늘 ${y}-${m}-${d}`;
    const worry = clip(b.worry, 200);
    if (worry) ctx += `\n하고 싶은 말: ${worry}`;
    if (prod.love) ctx += `\n현재 연애 상태: ${LOVE_STATES.includes(b.loveState) ? b.loveState : "솔로"}`;
    if (partner) {
      const pp = sajuOf(partner.birth, "모름");
      ctx += `\n상대방 ${partner.name}(${partner.sex}), 양력 ${partner.birth}, 연주 ${gz(pp.year)} 월주 ${gz(pp.month)} 일주 ${gz(pp.day)}, 오행 ${JSON.stringify(elCount(pp))}`;
    }
    let days = null;
    if (prod.purpose) {
      days = goodDays(p, 6);
      ctx += `\n목적 ${PURPOSES.includes(b.purpose) ? b.purpose : PURPOSES[0]}\n후보일(일지 삼합·육합, 충 제외): ${days.map((x) => x.label + " " + x.gz).join(", ")}`;
    }
    const fmt = "{" + prod.keys.map(([k]) => `"${k}":""`).join(",") + "}";
    const prompt = `[메뉴] ${prod.name}: ${prod.desc}\n[사주]\n${ctx}\n\n각 항목 3~5문장, 반드시 다음 키만 가진 JSON 하나로만 답해:\n${fmt}\n항목 의미: ${prod.keys.map(([k, t]) => k + "=" + t).join(", ")}`;
    const sections = parseJSON(await claude({ system: SYS, messages: [{ role: "user", content: prompt }], max_tokens: 2000 }));
    res.json({ sections, days });
  } catch (e) {
    await rpc("add_coins", { uid: user.id, n: 1 });
    throw e;
  }
});
