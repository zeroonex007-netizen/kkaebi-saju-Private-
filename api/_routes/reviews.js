// 홈 화면용 최근 후기 (작성자 정보는 내보내지 않음)
import { route, admin } from "../_lib.js";

export default route(async (req, res) => {
  const { data } = await admin.from("reviews").select("product,stars,body,rewarded,created_at")
    .order("created_at", { ascending: false }).limit(20);
  res.setHeader("Cache-Control", "s-maxage=60");
  res.json({ reviews: data || [] });
}, { auth: false, method: "GET" });
