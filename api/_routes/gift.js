// 부적 선물: info(로그인 없이 미리보기) · send(별사탕 1개로 선물 코드 발급) · claim(받기)
import { route, admin, rpc, getUser, clip } from "../_lib.js";
import { sajuOf, elCount } from "../../public/saju.js";
import { AMULETS, weakEl } from "../../public/products.js";

async function myEl(uid) {
  const { data: p } = await admin.from("profiles").select("birth,birth_time").eq("id", uid).single();
  return p && p.birth ? weakEl(elCount(sajuOf(p.birth, p.birth_time || "모름"))) : null;
}

export default route(async (req, res, _u, b) => {
  const code = typeof b.code === "string" ? b.code.replace(/[^0-9a-f]/g, "").slice(0, 10) : "";
  if (b.action === "info") {
    const { data: g } = await admin.from("gifts").select("kind,from_name,to_name,msg,claimed_by").eq("code", code).maybeSingle();
    if (!g) return res.status(404).json({ error: "notfound" });
    return res.json({ kind: g.kind, from_name: g.from_name, to_name: g.to_name, msg: g.msg, claimed: !!g.claimed_by });
  }
  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: "login" });
  if (b.action === "send") {
    const from = clip(b.from, 12), to = clip(b.to, 12);
    if (!AMULETS.some((a) => a.id === b.kind) || !from || !to) return res.status(400).json({ error: "input" });
    const r = await rpc("send_gift", { uid: user.id, k: b.kind, fname: from, tname: to, m: clip(b.msg, 60) });
    if (r.error === "coins") return res.status(402).json({ error: "coins" });
    return res.json(r);
  }
  if (b.action === "claim") {
    const r = await rpc("claim_gift", { uid: user.id, c: code, e: await myEl(user.id) });
    if (r.error) return res.status(r.error === "notfound" ? 404 : 409).json(r);
    return res.json(r);
  }
  res.status(400).json({ error: "action" });
}, { auth: false });
