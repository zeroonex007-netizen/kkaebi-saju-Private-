// 매일 1번 Vercel이 자동 실행: 결제일이 된 깨비 패스를 갱신 결제
// 실패하면 하루 뒤 다시 시도, 3번 연속 실패하면 자동 해지
import { randomBytes } from "node:crypto";
import { admin, rpc, chargeBilling } from "./_lib.js";
import { SUB } from "../public/products.js";

export default async function handler(req, res) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.authorization !== `Bearer ${secret}`) return res.status(401).json({ error: "unauthorized" });

  const { data: due } = await admin.from("subscriptions").select("*")
    .in("status", ["active", "past_due"]).not("billing_key", "is", null)
    .lte("next_billing_at", new Date().toISOString()).limit(200);

  const out = { charged: 0, failed: 0, canceled: 0 };
  for (const s of due || []) {
    const orderId = "sub_" + Date.now() + "_" + randomBytes(4).toString("hex");
    const pay = await chargeBilling(s.billing_key, s.user_id, s.amount, orderId, `${SUB.name} 1개월`);
    if (pay.ok && pay.status === "DONE") {
      await rpc("sub_paid", { uid: s.user_id, oid: orderId, pkey: pay.paymentKey, amt: s.amount, coins_n: SUB.coins });
      out.charged++;
    } else {
      const fails = (s.fail_count || 0) + 1;
      await admin.from("sub_payments").insert({ order_id: orderId, user_id: s.user_id, amount: s.amount, status: "failed", message: pay.message || pay.code });
      await admin.from("subscriptions").update(fails >= 3
        ? { status: "canceled", canceled_at: new Date().toISOString(), next_billing_at: null, billing_key: null, fail_count: fails }
        : { status: "past_due", fail_count: fails, next_billing_at: new Date(Date.now() + 86400e3).toISOString() }
      ).eq("user_id", s.user_id);
      fails >= 3 ? out.canceled++ : out.failed++;
    }
  }
  res.json(out);
}
