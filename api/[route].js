// 모든 /api/<이름> 요청을 한 함수에서 받아 나눠 줌
// (Vercel 무료 플랜은 함수 12개 제한 → 실제 처리는 _routes/ 안에 두고 여기서 하나로 묶음)
import amulet from "./_routes/amulet.js";
import chat from "./_routes/chat.js";
import checkin from "./_routes/checkin.js";
import cronBilling from "./_routes/cron-billing.js";
import daily from "./_routes/daily.js";
import gift from "./_routes/gift.js";
import emailSignup from "./_routes/email-signup.js";
import gacha from "./_routes/gacha.js";
import kakaoProfile from "./_routes/kakao-profile.js";
import me from "./_routes/me.js";
import naverCallback from "./_routes/naver-callback.js";
import naverStart from "./_routes/naver-start.js";
import order from "./_routes/order.js";
import payConfirm from "./_routes/pay-confirm.js";
import reading from "./_routes/reading.js";
import ref from "./_routes/ref.js";
import review from "./_routes/review.js";
import reviews from "./_routes/reviews.js";
import share from "./_routes/share.js";
import subCancel from "./_routes/sub-cancel.js";
import subStart from "./_routes/sub-start.js";
import visit from "./_routes/visit.js";

const ROUTES = {
  amulet, chat, checkin, "cron-billing": cronBilling, daily, "email-signup": emailSignup, gacha, gift, "kakao-profile": kakaoProfile, me,
  "naver-callback": naverCallback, "naver-start": naverStart, order, "pay-confirm": payConfirm,
  reading, ref, review, reviews, share, "sub-cancel": subCancel, "sub-start": subStart, visit,
};

export default function handler(req, res) {
  const fn = Object.hasOwn(ROUTES, req.query.route) ? ROUTES[req.query.route] : null;
  if (!fn) return res.status(404).json({ error: "not_found" });
  return fn(req, res);
}
