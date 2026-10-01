// 부적 패스 해지: 다음 결제부터 멈춤, 이미 낸 기간까지는 혜택 유지
import { route, admin } from "../_lib.js";

export default route(async (req, res, user) => {
  const { data } = await admin.from("subscriptions")
    .update({ status: "canceled", canceled_at: new Date().toISOString(), next_billing_at: null, billing_key: null })
    .eq("user_id", user.id).select("current_period_end").maybeSingle();
  if (!data) return res.status(404).json({ error: "none" });
  res.json({ ok: true, until: data.current_period_end });
});
