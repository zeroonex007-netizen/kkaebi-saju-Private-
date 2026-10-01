// 후기 작성 → 별사탕 조각 +1 (메뉴당 1회)
import { route, admin, rpc, clip } from "./_lib.js";
import { PRODUCTS } from "../public/products.js";

export default route(async (req, res, user, b) => {
  const body = clip(b.body, 300), stars = Number(b.stars);
  if (!PRODUCTS.some((p) => p.id === b.product) || body.length < 10 || !(stars >= 1 && stars <= 5))
    return res.status(400).json({ error: "input" });
  const { error } = await admin.from("reviews").insert({ user_id: user.id, product: b.product, stars: Math.round(stars), body });
  if (error) return res.status(409).json({ error: "already" });
  await rpc("add_piece", { uid: user.id });
  res.json({ ok: true });
});
