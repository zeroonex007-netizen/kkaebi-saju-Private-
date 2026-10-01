// 부적냥 고민 상담
// - 기본: 부적냥 문장으로 답함. 무료·무제한, 토큰 0원
// - GEMINI_API_KEY가 있으면: 구글 Gemini 무료 사용량으로 AI 답변(무료). 실패하면 기본 방식으로 자동 전환
// - ANTHROPIC_API_KEY만 있으면: Claude 답변. 하루 1회 무료, 이후 질문당 별사탕 1개
import { route, admin, rpc, claude, gemini, clip } from "../_lib.js";
import { chatReply, sajuContext } from "../_text.js";
import { sajuOf, gz, elCount } from "../../public/saju.js";
import { SYS } from "../../public/products.js";

export default route(async (req, res, user, b) => {
  const raw = Array.isArray(b.messages) ? b.messages.slice(-12) : [];
  const messages = raw
    .filter((x) => x && (x.role === "user" || x.role === "assistant"))
    .map((x) => ({ role: x.role, content: clip(x.content, x.role === "user" ? 300 : 1500) }))
    .filter((x) => x.content);
  while (messages.length && messages[0].role !== "user") messages.shift();
  if (!messages.length || messages[messages.length - 1].role !== "user") return res.status(400).json({ error: "input" });

  const last = messages[messages.length - 1].content;
  if (!process.env.ANTHROPIC_API_KEY || process.env.GEMINI_API_KEY) {
    const { data: pr } = await admin.from("profiles").select("name,sex,birth,birth_time").eq("id", user.id).single();
    const canned = () => res.json({ text: chatReply(messages, pr || {}), free: true, canned: true });
    // 위기 표현은 AI에 맡기지 않고 항상 상담전화 안내
    if (!process.env.GEMINI_API_KEY || /죽고|자살|자해|살기 ?싫|사라지고 ?싶/.test(last)) return canned();
    try {
      const system = SYS + "\n상담 규칙: 3~6문장. 공감 한 줄 → 아래 사주 정보로 근거 있게 짚기 → 할까 말까 질문엔 오늘 기운 보고 분명하게 답하되, 퇴사·이별·투자·대출·건강 같은 큰 결정은 대신 정하지 말고 본인이 정하라고 할 것 → 오늘 해볼 작은 행동 하나 → 대화를 이어갈 질문 하나. 로또 번호 같은 부탁은 부적냥 말투로 들어주되 과소비는 말릴 것. 사주 용어는 쉽게 풀어서.\n" + (sajuContext(pr) ? "[친구 사주]\n" + sajuContext(pr) : "[친구 사주] 아직 생일 정보 없음. 필요하면 메뉴 하나 보면 자동 저장된다고 안내.");
      return res.json({ text: await gemini({ system, messages }), free: true, canned: false });
    } catch (e) { console.error(e); return canned(); }
  }

  const free = await rpc("use_free_chat", { uid: user.id });
  let kind = null;
  if (!free) {
    kind = await rpc("spend_any", { uid: user.id, n: 1 });
    if (!kind) return res.status(402).json({ error: "coins" });
  }

  try {
    const { data: pr } = await admin.from("profiles").select("name,birth,birth_time").eq("id", user.id).single();
    let system = SYS + "\n수다 규칙: 3~6문장, 공감 먼저, 사주 이야기 한두 개, 오늘 해볼 작은 행동 하나로 마무리.";
    if (pr && pr.birth) {
      const p = sajuOf(pr.birth, pr.birth_time || "모름");
      system += `\n친구 정보: ${pr.name || "친구"}, 일주 ${gz(p.day)}, 오행 ${JSON.stringify(elCount(p))}`;
    }
    const text = await claude({ system, messages, max_tokens: 700 });
    res.json({ text, free });
  } catch (e) {
    if (kind) await rpc("refund_any", { uid: user.id, n: 1, kind });
    throw e;
  }
});
