// 네이버 로그인 시작: 네이버 동의 화면으로 보냄
import { randomBytes } from "node:crypto";

export default function handler(req, res) {
  const id = process.env.NAVER_CLIENT_ID;
  if (!id) return res.redirect(302, "/?login_error=naver_setup");
  const state = randomBytes(16).toString("hex");
  const redirect = `https://${req.headers.host}/api/naver-callback`;
  res.setHeader("Set-Cookie", `nv_state=${state}; HttpOnly; Secure; SameSite=Lax; Path=/api; Max-Age=600`);
  const q = new URLSearchParams({ response_type: "code", client_id: id, redirect_uri: redirect, state });
  res.redirect(302, "https://nid.naver.com/oauth2.0/authorize?" + q);
}
