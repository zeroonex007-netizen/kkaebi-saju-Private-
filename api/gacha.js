// 복주머니 뽑기 (하루 1번, 깨비 패스는 2번)
import { route, rpc } from "./_lib.js";

export default route(async (req, res, user) => {
  const r = await rpc("gacha", { uid: user.id });
  if (r.error) return res.status(429).json(r);
  res.json(r);
});
