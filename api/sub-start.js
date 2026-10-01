// 깨비 패스 시작: 카드 등록(authKey) → 빌링키 발급 → 첫 달 결제 → 별사탕 지급
import { randomBytes } from "node:crypto";
import { route, admin, rpc, issueBillingKey, chargeBilling } from "./_lib.js";
import { SUB } from "../public/products.js";

export default route(async (req, res, user, b) => {
  if (typeof b.authKey !== "string" || !b.authKey) return res.status(400).json({ error: "input" });
  const customerKey = user.id;

  const issued = await issueBillingKey(b.authKey, customerKey);
  if (!issued.ok || !issued.billingKey) return res.status(400).json({ error: issued.code || "billing", message: issued.message });
  const card_label = issued.card ? `${issued.cardCompany || ""} ${issued.cardNumber || ""}`.trim() : null;

  const { data: cur } = await admin.from("subscriptions").select("*").eq("user_id", user.id).maybeSingle();
  // 해지했지만 기간이 남은 경우: 결제 없이 다시 켜고, 기간 끝날 때 자동 결제
  if (cur && new Date(cur.current_period_end) > new Date()) {
    await admin.from("subscriptions").update({
      billing_key: issued.billingKey, card_label, status: "active", canceled_at: null,
      next_billing_at: cur.current_period_end, fail_count: 0,
    }).eq("user_id", user.id);
    return res.json({ ok: true, resumed: true });
  }

  await admin.from("subscriptions").upsert({
    user_id: user.id, billing_key: issued.billingKey, card_label, status: "active", amount: SUB.price,
    current_period_end: new Date().toISOString(), next_billing_at: new Date().toISOString(), fail_count: 0, canceled_at: null,
  });
  const orderId = "sub_" + Date.now() + "_" + randomBytes(4).toString("hex");
  const pay = await chargeBilling(issued.billingKey, customerKey, SUB.price, orderId, `${SUB.name} 1개월`);
  if (!pay.ok || pay.status !== "DONE") {
    await admin.from("subscriptions").delete().eq("user_id", user.id);
    await admin.from("sub_payments").insert({ order_id: orderId, user_id: user.id, amount: SUB.price, status: "failed", message: pay.message || pay.code });
    return res.status(402).json({ error: pay.code || "charge", message: pay.message });
  }
  await rpc("sub_paid", { uid: user.id, oid: orderId, pkey: pay.paymentKey, amt: SUB.price, coins_n: SUB.coins });
  res.json({ ok: true, coins: SUB.coins });
});
