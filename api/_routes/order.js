// 결제 주문 만들기: 가격은 서버의 PACKS 기준으로만 정함
import { route, admin } from "../_lib.js";
import { randomBytes } from "node:crypto";
import { PACKS } from "../../public/products.js";

export default route(async (req, res, user, b) => {
  const pack = PACKS.find((p) => p.id === b.pack);
  if (!pack) return res.status(400).json({ error: "pack" });
  const orderId = "kb_" + Date.now() + "_" + randomBytes(5).toString("hex");
  const { error } = await admin.from("orders").insert({ id: orderId, user_id: user.id, pack: pack.id, coins: pack.n, amount: pack.price });
  if (error) throw error;
  res.json({ orderId, amount: pack.price, orderName: `부적냥 사주 별사탕 ${pack.n}개` });
});
