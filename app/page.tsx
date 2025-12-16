"use client";

import { useState } from "react";

export default function Page() {
  const [mode, setMode] = useState<"home" | "teacher" | "student">("home");

  return (
    <main style={{ maxWidth: 720, margin: "24px auto", padding: 16, fontFamily: "sans-serif", direction: "rtl" }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>برنامک آزمون آنلاین</h1>
      <p style={{ opacity: 0.8, marginTop: 0 }}>
        نسخه اولیه (MVP) — قدم‌به‌قدم کاملش می‌کنیم 😊
      </p>

      {mode === "home" && (
        <>
          <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
            <button
              onClick={() => setMode("teacher")}
              style={{
                padding: "14px 12px",
                borderRadius: 12,
                border: "1px solid #ddd",
                fontSize: 16,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              👩‍🏫 ورود استاد / ساخت آزمون
            </button>

            <button
              onClick={() => setMode("student")}
              style={{
                padding: "14px 12px",
                borderRadius: 12,
                border: "1px solid #ddd",
                fontSize: 16,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              🧑‍🎓 ورود دانش‌آموز / شرکت در آزمون
            </button>
          </div>

          <div style={{ marginTop: 18, fontSize: 13, opacity: 0.75, lineHeight: 1.7 }}>
            <div>✅ سایت روی Vercel اجرا می‌شود</div>
            <div>✅ API سالم است</div>
            <div>🔜 مرحله بعد: اتصال واقعی به دیتابیس + فرم‌های ساخت آزمون</div>
          </div>
        </>
      )}

      {mode === "teacher" && (
        <section style={{ marginTop: 16, padding: 12, border: "1px solid #eee", borderRadius: 12 }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, marginTop: 0 }}>پنل استاد (فعلاً ساده)</h2>
          <p style={{ marginTop: 6, opacity: 0.85, lineHeight: 1.8 }}>
            اینجا در مرحله بعد:
            <br />• ساخت آزمون
            <br />• افزودن سوال چهارگزینه‌ای
            <br />• انتشار آزمون
          </p>
          <button onClick={() => setMode("home")} style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid #ddd" }}>
            ⬅️ برگشت
          </button>
        </section>
      )}

      {mode === "student" && (
        <section style={{ marginTop: 16, padding: 12, border: "1px solid #eee", borderRadius: 12 }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, marginTop: 0 }}>پنل دانش‌آموز (فعلاً ساده)</h2>
          <p style={{ marginTop: 6, opacity: 0.85, lineHeight: 1.8 }}>
            اینجا در مرحله بعد:
            <br />• لیست آزمون‌های منتشرشده
            <br />• شروع آزمون
            <br />• ثبت پاسخ‌ها و دیدن نتیجه
          </p>
          <button onClick={() => setMode("home")} style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid #ddd" }}>
            ⬅️ برگشت
          </button>
        </section>
      )}
    </main>
  );
}
