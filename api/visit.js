// 공유 링크 방문 기록: 내 링크를 연 서로 다른 사람 3명 → 링크 주인에게 반짝 별사탕
import { createHash } from "node:crypto";
import { route, rpc, getUser, admin } from "./_lib.js";
import { todayKST } from "../public/saju.js";

export default route(async (req, res, _u, b) => {
  const code = typeof b.code === "string" ? b.code.slice(0, 16) : "";
  if (!code) return res.status(400).json({ error: "input" });
  // 자기 링크를 자기가 여는 건 세지 않음
  const viewer = await getUser(req);
  if (viewer) {
    const { data } = await admin.from("profiles").select("ref_code").eq("id", viewer.id).single();
    if (data && data.ref_code === code) return res.json({ ok: false, self: true });
  }
  const ip = (req.headers["x-forwarded-for"] || "").split(",")[0].trim();
  const ua = req.headers["user-agent"] || "";
  const visitor = createHash("sha256")
    .update([ip, ua, todayKST().join("-"), process.env.SUPABASE_SERVICE_ROLE_KEY || ""].join("|"))
    .digest("hex").slice(0, 32);
  res.json(await rpc("record_visit", { code, v: visitor }));
}, { auth: false });
