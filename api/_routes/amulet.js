// 이미지 부적 구매: 별사탕 1개 차감 → 내 부적함에 저장 (같은 부적은 다시 저장 무료)
import { route, admin, rpc } from "../_lib.js";
import { sajuOf, elCount } from "../../public/saju.js";
import { AMULETS, weakEl } from "../../public/products.js";

export default route(async (req, res, user, b) => {
  if (!AMULETS.some((a) => a.id === b.kind)) return res.status(400).json({ error: "kind" });
  const { data: p } = await admin.from("profiles").select("birth,birth_time").eq("id", user.id).single();
  const el = p && p.birth ? weakEl(elCount(sajuOf(p.birth, p.birth_time || "모름"))) : null;
  const r = await rpc("buy_amulet", { uid: user.id, k: b.kind, e: el });
  if (r.error === "coins") return res.status(402).json({ error: "coins" });
  res.json(r);
});
