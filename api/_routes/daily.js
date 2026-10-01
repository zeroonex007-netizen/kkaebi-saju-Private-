// 오늘의 무료 운세 (하루 한 번 만들어 저장해 두고 재사용)
import { route, admin, rpc } from "../_lib.js";
import { todayKST } from "../../public/saju.js";
import { dailyText } from "../_text.js";

export default route(async (req, res, user) => {
  const [y, m, d] = todayKST();
  const day = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  const { data: cached } = await admin.from("daily").select("text").eq("user_id", user.id).eq("day", day).maybeSingle();
  if (cached) return res.json({ text: cached.text });

  const { data: pr } = await admin.from("profiles").select("birth,birth_time").eq("id", user.id).single();
  if (!pr || !pr.birth) return res.status(400).json({ error: "profile" });

  const text = dailyText(pr.birth, pr.birth_time || "모름"); // AI 안 씀
  const { error: dupe } = await admin.from("daily").insert({ user_id: user.id, day, text });
  const xp = dupe ? null : await rpc("add_xp", { uid: user.id, amt: 5 });
  res.json({ text, xp });
});
