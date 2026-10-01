// 오늘의 무료 운세 (하루 한 번 만들어 저장해 두고 재사용)
import { route, admin, claude } from "./_lib.js";
import { sajuOf, gz, dayP, todayKST, STEM_EL } from "../public/saju.js";
import { SYS } from "../public/products.js";

const COLORS = ["민트", "라벤더", "코랄", "레몬", "하늘", "크림", "체리", "올리브", "네이비", "피치"];
const MENUS = ["떡볶이", "쌀국수", "김치찌개", "돈가스", "샐러드", "마라탕", "초밥", "제육볶음", "파스타", "국밥", "햄버거", "비빔밥"];

export default route(async (req, res, user) => {
  const [y, m, d] = todayKST();
  const day = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  const { data: cached } = await admin.from("daily").select("text").eq("user_id", user.id).eq("day", day).maybeSingle();
  if (cached) return res.json({ text: cached.text });

  const { data: pr } = await admin.from("profiles").select("birth,birth_time").eq("id", user.id).single();
  if (!pr || !pr.birth) return res.status(400).json({ error: "profile" });

  const p = sajuOf(pr.birth, pr.birth_time || "모름");
  const t = dayP(y, m, d), seed = (t.s * 7 + p.day.b * 3 + d) % 60;
  const color = COLORS[seed % COLORS.length], menu = MENUS[seed % MENUS.length];
  let text = `오늘은 ${gz(t)}일!\n${STEM_EL[t.s] === STEM_EL[p.day.s] ? "나랑 같은 기운이 들어와서 고집이 세지기 쉬워. 한 템포 쉬고 말하기!" : "새로운 기운이 들어오는 날이라 새 사람, 새 기회에 문 열어 둬."}\n행운의 색: ${color} · 행운의 메뉴: ${menu}`;
  try {
    text = await claude({
      system: SYS,
      messages: [{ role: "user", content: `일주 ${gz(p.day)}인 친구의 오늘(${day}, ${gz(t)}일) 운세를 써줘. 다른 말 없이 이 형식만:\n총운: (한 문장)\n연애: (한 문장)\n돈: (한 문장)\n행운의 색: ${color}\n행운의 메뉴: ${menu}` }],
      max_tokens: 400,
    });
  } catch (e) { console.error(e); }
  await admin.from("daily").upsert({ user_id: user.id, day, text });
  res.json({ text });
});
