// 서버 공용 도구 (밑줄로 시작하는 파일은 Vercel이 주소로 노출하지 않음)
import { createClient } from "@supabase/supabase-js";

export const admin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// 로그인한 사용자 확인 (브라우저가 보낸 Supabase 토큰 검증)
export async function getUser(req) {
  const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const { data, error } = await admin.auth.getUser(token);
  return error ? null : data.user;
}

// POST + 로그인 필수 라우트 감싸기
export function route(fn, { auth = true, method = "POST" } = {}) {
  return async (req, res) => {
    if (req.method !== method) return res.status(405).json({ error: "method" });
    try {
      const user = auth ? await getUser(req) : null;
      if (auth && !user) return res.status(401).json({ error: "login" });
      await fn(req, res, user, req.body || {});
    } catch (e) {
      console.error(e);
      if (!res.headersSent) res.status(500).json({ error: "server" });
    }
  };
}

export async function rpc(name, args) {
  const { data, error } = await admin.rpc(name, args);
  if (error) throw error;
  return data;
}

// Claude API 호출
export async function claude({ system, messages, max_tokens = 1500 }) {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || "claude-haiku-4-5-20251001",
      max_tokens, system, messages,
    }),
  });
  if (!r.ok) throw new Error("claude " + r.status + " " + (await r.text()));
  const j = await r.json();
  return j.content.filter((c) => c.type === "text").map((c) => c.text).join("").trim();
}

export function parseJSON(t) {
  const s = t.indexOf("{"), e = t.lastIndexOf("}");
  return JSON.parse(t.slice(s, e + 1));
}

// 입력값 검사
export const isDate = (v) => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);
export const isTime = (v) => v === "모름" || (typeof v === "string" && /^\d{2}:\d{2}$/.test(v));
export const isSex = (v) => v === "남" || v === "여";
export const clip = (v, n) => (typeof v === "string" ? v.trim().slice(0, n) : "");

// ── 토스 자동결제(빌링) ──
// 결제위젯 키(gck/gsk)와 별개인 "API 개별 연동" 시크릿 키가 필요합니다.
// 비어 있으면 토스 문서용 테스트 키로 동작(실제 돈 안 나감). 실결제는 토스 정기결제 계약 후 라이브 키를 넣으세요.
const BILLING_SK = () => process.env.TOSS_BILLING_SECRET_KEY || "test_sk_docs_OaPz8L5KdmQXkzRz3y47BMw6";
async function toss(path, body) {
  const r = await fetch("https://api.tosspayments.com" + path, {
    method: "POST",
    headers: { Authorization: "Basic " + Buffer.from(BILLING_SK() + ":").toString("base64"), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const j = await r.json().catch(() => ({}));
  return { ok: r.ok, ...j };
}
export const issueBillingKey = (authKey, customerKey) => toss("/v1/billing/authorizations/issue", { authKey, customerKey });
export const chargeBilling = (billingKey, customerKey, amount, orderId, orderName) =>
  toss("/v1/billing/" + encodeURIComponent(billingKey), { customerKey, amount, orderId, orderName });

// Google Gemini (무료 사용량 있음). GEMINI_API_KEY가 있을 때만 사용
// 구글이 모델을 자주 바꿔서, 안 되는 모델이면 다음 후보로 자동으로 넘어감
const GEMINI_MODELS = () => [process.env.GEMINI_MODEL, "gemini-flash-latest", "gemini-3.8-flash", "gemini-flash-lite-latest"].filter(Boolean);
export async function gemini({ system, messages, max_tokens = 2048 }) {
  let last = null;
  for (const model of GEMINI_MODELS()) {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: messages.map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] })),
        generationConfig: { maxOutputTokens: max_tokens, temperature: 0.9 },
      }),
    });
    if (r.status === 404 || r.status === 400) { last = new Error(`gemini ${r.status} ${model}: ` + (await r.text()).slice(0, 160)); continue; }
    if (!r.ok) throw new Error(`gemini ${r.status} ${model}: ` + (await r.text()).slice(0, 160));
    const j = await r.json();
    const text = (j.candidates?.[0]?.content?.parts || []).filter((p) => !p.thought).map((p) => p.text || "").join("").trim();
    if (text) return text;
    last = new Error(`gemini empty ${model}`);
  }
  throw last || new Error("gemini no model");
}
