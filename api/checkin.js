// 출석 체크 (하루 1번, 연속 출석 보상)
import { route, rpc } from "./_lib.js";

export default route(async (req, res, user) => {
  res.json(await rpc("checkin", { uid: user.id }));
});
