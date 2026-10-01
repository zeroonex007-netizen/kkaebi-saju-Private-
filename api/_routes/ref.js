// 초대 코드로 가입: 나와 친구 둘 다 별사탕 +1
import { route, rpc } from "../_lib.js";

export default route(async (req, res, user, b) => {
  const code = typeof b.code === "string" ? b.code.slice(0, 16) : "";
  if (!code) return res.status(400).json({ error: "input" });
  res.json({ rewarded: await rpc("claim_referral", { uid: user.id, code }) });
});
