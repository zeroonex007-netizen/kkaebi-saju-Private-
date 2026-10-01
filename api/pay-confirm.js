// 토스페이먼츠 결제 승인 → 별사탕 충전 (같은 주문은 한 번만 충전)
import { route, admin, rpc } from "./_lib.js";

export default route(async (req, res, user, b) => {
  const { paymentKey, orderId } = b;
  if (typeof paymentKey !== "string" || typeof orderId !== "string") return res.status(400).json({ error: "input" });

  const { data: o } = await admin.from("orders").select("*").eq("id", orderId).maybeSingle();
  if (!o || o.user_id !== user.id) return res.status(404).json({ error: "order" });
  if (o.status === "done") return res.json({ ok: true, coins: 0, already: true });
  if (Number(b.amount) !== o.amount) return res.status(400).json({ error: "amount" });

  const r = await fetch("https://api.tosspayments.com/v1/payments/confirm", {
    method: "POST",
    headers: {
      Authorization: "Basic " + Buffer.from(process.env.TOSS_SECRET_KEY + ":").toString("base64"),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ paymentKey, orderId, amount: o.amount }),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok && j.code !== "ALREADY_PROCESSED_PAYMENT") return res.status(400).json({ error: j.code || "toss", message: j.message });

  const coins = await rpc("complete_order", { oid: orderId, pkey: paymentKey });
  res.json({ ok: true, coins });
});
