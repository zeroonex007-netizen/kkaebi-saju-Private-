// 부적냥 고민 상담
// - ANTHROPIC_API_KEY가 없으면(기본): 부적냥 문장으로 답함. 무료·무제한, 토큰 0원
// - 키를 넣으면: AI 답변. 하루 1회 무료, 이후 질문당 별사탕 1개
import { route, admin, rpc, claude, clip } from "../_lib.js";
import { chatReply } from "../_text.js";
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

  if (!process.env.ANTHROPIC_API_KEY) {
    const { data: pr } = await admin.from("profiles").select("name,birth,birth_time").eq("id", user.id).single();
    return res.json({ text: chatReply(messages, { ...pr, name: pr && pr.name }), free: true, canned: true });
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
