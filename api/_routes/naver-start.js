// 네이버 로그인 시작: 네이버 동의 화면으로 보냄
// state는 쿠키 대신 서명값으로 만들어서, 폰이 다른 브라우저/앱으로 넘겼다 돌아와도 확인되게 함
import { randomBytes, createHmac } from "node:crypto";

export const signState = (nonce, ts) =>
  createHmac("sha256", process.env.SUPABASE_SERVICE_ROLE_KEY || "kkaebi").update(nonce + "." + ts).digest("hex").slice(0, 32);

export default function handler(req, res) {
  const id = process.env.NAVER_CLIENT_ID;
  if (!id) return res.redirect(302, "/?login_error=naver_setup");
  const nonce = randomBytes(8).toString("hex"), ts = Date.now().toString(36);
  const state = `${nonce}.${ts}.${signState(nonce, ts)}`;
  const redirect = `https://${req.headers.host}/api/naver-callback`;
  const q = new URLSearchParams({ response_type: "code", client_id: id, redirect_uri: redirect, state });
  res.redirect(302, "https://nid.naver.com/oauth2.0/authorize?" + q);
}
