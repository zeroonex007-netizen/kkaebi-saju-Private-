// 첫 공유 보상: 계정당 1회 별사탕 +1
import { route, rpc } from "../_lib.js";

export default route(async (req, res, user) => {
  res.json({ rewarded: await rpc("share_reward", { uid: user.id }) });
});
