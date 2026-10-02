// 이메일로 시작하기 (테스트 기간용): 인증 메일 없이 바로 가입
// 카카오·네이버가 안 되는 사람을 위한 것. 오픈 후 막으려면 Vercel 환경변수 EMAIL_SIGNUP=off
import { route, admin } from "../_lib.js";

export default route(async (req, res, _u, b) => {
  if (process.env.EMAIL_SIGNUP === "off") return res.status(403).json({ error: "off" });
  const email = typeof b.email === "string" ? b.email.trim().toLowerCase().slice(0, 120) : "";
  const password = typeof b.password === "string" ? b.password.slice(0, 72) : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 6) return res.status(400).json({ error: "input" });
  const { error } = await admin.auth.admin.createUser({
    email, password, email_confirm: true,
    app_metadata: { provider: "email", providers: ["email"] },
    user_metadata: { name: email.split("@")[0] },
  });
  if (error) return res.status(/already|registered|exists/i.test(error.message) ? 409 : 400).json({ error: /already|registered|exists/i.test(error.message) ? "exists" : "fail" });
  res.json({ ok: true });
}, { auth: false });
