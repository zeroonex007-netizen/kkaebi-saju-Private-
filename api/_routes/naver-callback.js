// 네이버 로그인 완료: 네이버 계정 확인 → Supabase 회원 생성/조회 → 일회용 로그인 토큰을 붙여 사이트로 돌려보냄
import { admin } from "../_lib.js";
import { signState } from "./naver-start.js";

const back = (res, q) => res.redirect(302, "/?" + new URLSearchParams(q));

export default async function handler(req, res) {
  try {
    const { code, state, error } = req.query || {};
    if (error) return back(res, { login_error: "naver_cancel" });
    const [nonce, ts, sig] = String(state || "").split(".");
    const fresh = ts && Date.now() - parseInt(ts, 36) < 15 * 60 * 1000;
    if (!code || !nonce || !sig || !fresh || signState(nonce, ts) !== sig) return back(res, { login_error: "naver_state" });

    // 1) 코드 → 접근 토큰
    const tq = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: process.env.NAVER_CLIENT_ID,
      client_secret: process.env.NAVER_CLIENT_SECRET,
      code, state,
    });
    const tr = await fetch("https://nid.naver.com/oauth2.0/token?" + tq);
    const tj = await tr.json();
    if (!tj.access_token) return back(res, { login_error: "naver_token" });

    // 2) 네이버 프로필 (고유 id, 이메일, 이름·성별·생일·출생연도·휴대전화·프로필 사진·연령대)
    const pr = await fetch("https://openapi.naver.com/v1/nid/me", { headers: { Authorization: "Bearer " + tj.access_token } });
    const pj = await pr.json();
    const naverId = pj?.response?.id, email = (pj?.response?.email || "").toLowerCase();
    if (!naverId) return back(res, { login_error: "naver_profile" });
    if (!email) return back(res, { login_error: "naver_email" });

    // 3) 회원 만들기 (이미 있으면 넘어감)
    await admin.auth.admin.createUser({
      email, email_confirm: true,
      app_metadata: { provider: "naver", providers: ["naver"], naver_id: naverId },
      user_metadata: { name: pj.response.nickname || pj.response.name || "" },
    });

    // 4) 일회용 로그인 토큰 발급
    const { data, error: le } = await admin.auth.admin.generateLink({ type: "magiclink", email });
    if (le || !data?.properties?.hashed_token) return back(res, { login_error: "naver_link" });

    // 같은 이메일이 카카오로 이미 가입돼 있으면, 다른 사람이 이메일만 맞춰 들어오는 걸 막기 위해 거절
    const meta = data.user?.app_metadata || {};
    if (meta.naver_id !== naverId) return back(res, { login_error: "naver_exists" });

    await saveNaverProfile(data.user.id, pj.response);
    return back(res, { nv: data.properties.hashed_token });
  } catch (e) {
    console.error(e);
    return back(res, { login_error: "naver_server" });
  }
}

// 네이버에서 받은 정보 저장. 이름·성별·생년월일은 비어 있을 때만 채움(사주 입력칸 자동 채우기용)
async function saveNaverProfile(uid, r) {
  try {
    const sex = r.gender === "F" ? "여" : r.gender === "M" ? "남" : null;
    const birth = r.birthyear && /^\d{2}-\d{2}$/.test(r.birthday || "") ? `${r.birthyear}-${r.birthday}` : null;
    const fill = { name: r.name || r.nickname || null, sex, birth };
    for (const [k, v] of Object.entries(fill)) if (v) await admin.from("profiles").update({ [k]: v }).eq("id", uid).is(k, null);
    await admin.from("profiles").update({
      nickname: r.nickname || null, real_name: r.name || null, phone: r.mobile || null,
      avatar_url: r.profile_image || null, age_range: r.age || null, provider: "naver",
    }).eq("id", uid); // migration-004 전이면 조용히 실패하고 로그인은 그대로 진행
  } catch (e) { console.error(e); }
}
