// 내 정보: 별사탕, 조각, 초대 코드, 저장된 생년월일, 후기 남긴 메뉴
import { route, admin } from "./_lib.js";

export default route(async (req, res, user) => {
  const { data: p } = await admin.from("profiles")
    .select("name,sex,birth,birth_time,coins,pieces,ref_code,shared_once,free_chat_day").eq("id", user.id).single();
  const { data: rv } = await admin.from("reviews").select("product").eq("user_id", user.id);
  res.json({ ...p, reviewed: (rv || []).map((r) => r.product) });
});
