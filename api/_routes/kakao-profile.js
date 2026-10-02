// 카카오 로그인 직후: 카카오가 준 정보(닉네임·이름·성별·연령대·생일·출생연도·전화·사진) 저장
// 이름·성별·생년월일은 비어 있을 때만 채움(사주 입력칸 자동 채우기용)
import { route, admin } from "../_lib.js";

export default route(async (req, res, user, b) => {
  const token = typeof b.token === "string" ? b.token.slice(0, 400) : "";
  if (!token) return res.status(400).json({ error: "input" });
  const r = await fetch("https://kapi.kakao.com/v2/user/me", { headers: { Authorization: "Bearer " + token } });
  if (!r.ok) return res.status(400).json({ error: "kakao" });
  const k = await r.json(), acc = k.kakao_account || {}, prof = acc.profile || {};
  // 다른 사람 토큰으로 내 정보를 덮어쓰지 못하게: 로그인한 카카오 계정과 같은지 확인
  const ids = (user.identities || []).filter((i) => i.provider === "kakao").map((i) => String(i.id || i.identity_data?.provider_id || i.identity_data?.sub));
  if (!ids.includes(String(k.id))) return res.status(403).json({ error: "mismatch" });
  const phone = acc.phone_number ? acc.phone_number.replace(/^\+82\s?/, "0").replace(/\s/g, "") : null;
  const sex = acc.gender === "female" ? "여" : acc.gender === "male" ? "남" : null;
  const birth = acc.birthyear && /^\d{4}$/.test(acc.birthday || "") ? `${acc.birthyear}-${acc.birthday.slice(0, 2)}-${acc.birthday.slice(2)}` : null;
  for (const [key, v] of Object.entries({ name: acc.name || prof.nickname || null, sex, birth })) if (v) await admin.from("profiles").update({ [key]: v }).eq("id", user.id).is(key, null);
  await admin.from("profiles").update({
    nickname: prof.nickname || null, real_name: acc.name || null, phone, avatar_url: prof.profile_image_url || null,
    age_range: acc.age_range ? acc.age_range.replace("~", "-") : null, provider: "kakao",
  }).eq("id", user.id);
  res.json({ ok: true });
});
