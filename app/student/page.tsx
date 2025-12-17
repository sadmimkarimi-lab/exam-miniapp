"use client";

import { useEffect, useState } from "react";

type Choice = { id: number; text: string };
type Question = {
  id: number;
  exam_id: number;
  type: string;
  text: string;
  score: number;
  choices: Choice[];
};

export default function StudentPage() {
  // فعلاً دستی (بعداً با ایتا/لاگین واقعی می‌کنیم)
  const EXAM_ID = 1;
  const STUDENT_ID = 1;

  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [msg, setMsg] = useState<string>("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      setMsg("");
      const res = await fetch(`/api/student/questions?exam_id=${EXAM_ID}`);
      const data = await res.json();
      if (!res.ok) {
        setMsg(data?.error || "خطا در گرفتن سوالات");
        setQuestions([]);
      } else {
        setQuestions(data.questions || []);
      }
      setLoading(false);
    })();
  }, []);

  async function answer(question_id: number, selected_choice_id: number) {
    setMsg("در حال ثبت پاسخ...");
    const res = await fetch("/api/student/answers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ student_id: STUDENT_ID, question_id, selected_choice_id }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMsg(data?.error || "ثبت پاسخ ناموفق بود");
      return;
    }
    setMsg("✅ پاسخ ثبت شد");
  }

  return (
    <main style={{ maxWidth: 720, margin: "24px auto", padding: 16, direction: "rtl", fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: 20, fontWeight: 800 }}>صفحه دانش‌آموز</h1>
      <p style={{ opacity: 0.8 }}>آزمون #{EXAM_ID} — دانش‌آموز #{STUDENT_ID}</p>

      {loading ? (
        <p>در حال بارگذاری…</p>
      ) : (
        <>
          {msg ? (
            <div style={{ padding: 12, borderRadius: 12, background: "#f5f5f5", marginBottom: 12 }}>{msg}</div>
          ) : null}

          {questions.length === 0 ? (
            <p>سوالی پیدا نشد. (اول با دکمه‌های معلم چند سوال بساز)</p>
          ) : (
            questions.map((q) => (
              <div key={q.id} style={{ border: "1px solid #ddd", borderRadius: 12, padding: 12, marginBottom: 12 }}>
                <div style={{ fontWeight: 700, marginBottom: 8 }}>
                  سوال {q.id} ({q.type})
                </div>
                <div style={{ marginBottom: 10 }}>{q.text}</div>

                {q.type === "mcq" ? (
                  <div style={{ display: "grid", gap: 8 }}>
                    {q.choices.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => answer(q.id, c.id)}
                        style={{ padding: 10, borderRadius: 10, border: "1px solid #ccc", textAlign: "right" }}
                      >
                        {c.text}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p style={{ opacity: 0.7 }}>
                    (فعلاً برای تشریحی UI نمی‌سازیم. فقط چهارگزینه‌ای را ثبت می‌کنیم.)
                  </p>
                )}
              </div>
            ))
          )}
        </>
      )}
    </main>
  );
}
