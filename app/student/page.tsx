"use client";

import React, { useEffect, useMemo, useState } from "react";

type Choice = {
  id: number;
  question_id: number;
  text: string;
  is_correct?: boolean; // ممکنه از API نیاد
};

type Question = {
  id: number;
  exam_id: number;
  text: string;
  score: number;
  type?: "mcq" | "desc" | string; // برای اینکه خطا نده
  created_at?: string;
};

type QuestionWithChoices = {
  question: Question;
  choices?: Choice[];
};

export default function StudentPage() {
  // فعلا ثابت (مثل چیزی که تو UI نشون دادی)
  const examId = 1;
  const studentId = 1;

  const [loading, setLoading] = useState(false);
  const [finishing, setFinishing] = useState(false);

  const [questions, setQuestions] = useState<QuestionWithChoices[]>([]);
  const [error, setError] = useState<string | null>(null);

  // انتخاب‌های کاربر (در لحظه)
  const [selected, setSelected] = useState<Record<number, number>>({}); // question_id -> choice_id

  // نتیجه‌ی تصحیح
  const [result, setResult] = useState<null | {
    totalScore: number;
    maxScore: number;
    statusText?: string;
  }>(null);

  const maxScore = useMemo(() => {
    return questions.reduce((sum, q) => sum + (q.question.score ?? 0), 0);
  }, [questions]);

  async function fetchQuestions() {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // 👇 فرض: این روت GET رو پشتیبانی می‌کنه
      const res = await fetch(`/api/teacher/questions?exam_id=${examId}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`Failed to fetch questions (${res.status}) ${txt}`);
      }

      const data = await res.json();

      // دیتا ممکنه یکی از این شکل‌ها باشه:
      // 1) { questions: [...] }
      // 2) [...]
      const list: QuestionWithChoices[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.questions)
        ? data.questions
        : [];

      setQuestions(list);

      // اگر API خودش قبلاً selected رو می‌فرسته، اینجا می‌تونی پر کنی.
      // فعلا چیزی نمی‌خوایم GET بزنیم به answers چون روتش POST-only هست.
      setSelected({});
    } catch (e: any) {
      setError(e?.message ?? "Error");
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  }

  async function submitAnswer(questionId: number, choiceId: number) {
    // UI فوری آپدیت بشه
    setSelected((prev) => ({ ...prev, [questionId]: choiceId }));

    try {
      const res = await fetch(`/api/student/answers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: studentId,
          question_id: questionId,
          selected_choice_id: choiceId,
        }),
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`ثبت پاسخ ناموفق بود (${res.status}) ${txt}`);
      }
    } catch (e: any) {
      // اگر ثبت جواب شکست خورد، همون انتخاب UI رو نگه می‌داریم ولی پیام خطا می‌دیم
      setError(e?.message ?? "خطا در ثبت پاسخ");
    }
  }

  async function finishAndGrade() {
    setFinishing(true);
    setError(null);

    try {
      // ✅ مرحله ۳: پیشنهاد استاندارد اینه که تصحیح توی سرور انجام بشه
      // اگر هنوز این روت رو نساختی، پایین همین پیام میگم دقیقاً چی باید باشه.
      const res = await fetch(`/api/student/finish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exam_id: examId,
          student_id: studentId,
        }),
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`تصحیح انجام نشد (${res.status}) ${txt}`);
      }

      const data = await res.json();

      // انتظار: { totalScore, maxScore, statusText? }
      setResult({
        totalScore: Number(data?.totalScore ?? 0),
        maxScore: Number(data?.maxScore ?? maxScore),
        statusText: data?.statusText ?? "آزمون تصحیح شد ✅",
      });
    } catch (e: any) {
      setError(e?.message ?? "خطا در تصحیح");
    } finally {
      setFinishing(false);
    }
  }

  useEffect(() => {
    fetchQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: 16, direction: "rtl" }}>
      <h1 style={{ fontSize: 32, fontWeight: 800, textAlign: "center", marginTop: 8 }}>
        صفحه دانش‌آموز
      </h1>
      <div style={{ textAlign: "center", marginTop: 6, opacity: 0.8 }}>
        آزمون #{examId} — دانش‌آموز #{studentId}
      </div>

      <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 18 }}>
        <button
          onClick={fetchQuestions}
          disabled={loading}
          style={{
            padding: "10px 14px",
            borderRadius: 12,
            border: "1px solid #ddd",
            background: "#fff",
            cursor: loading ? "not-allowed" : "pointer",
            minWidth: 150,
          }}
        >
          ↩️ فرش سوالات
        </button>

        <button
          onClick={finishAndGrade}
          disabled={finishing || questions.length === 0}
          style={{
            padding: "10px 14px",
            borderRadius: 12,
            border: "1px solid #111",
            background: "#111",
            color: "#fff",
            cursor: finishing ? "not-allowed" : "pointer",
            minWidth: 220,
          }}
        >
          ✅ پایان آزمون و تصحیح
        </button>
      </div>

      {error && (
        <div
          style={{
            marginTop: 14,
            padding: 12,
            borderRadius: 12,
            border: "1px solid #f2c2c2",
            background: "#fff5f5",
            color: "#8a1f1f",
            textAlign: "center",
            whiteSpace: "pre-wrap",
          }}
        >
          {error}
        </div>
      )}

      {result && (
        <div
          style={{
            marginTop: 14,
            padding: 14,
            borderRadius: 16,
            border: "1px solid #bfe6bf",
            background: "#f3fff3",
            textAlign: "center",
            fontWeight: 700,
          }}
        >
          <div style={{ marginBottom: 6 }}>{result.statusText}</div>
          <div style={{ fontSize: 20 }}>
            🎉 نتیجه آزمون — نمره: {result.totalScore} از {result.maxScore}
          </div>
        </div>
      )}

      <div style={{ marginTop: 18, opacity: 0.8, textAlign: "center" }}>
        مجموع امتیاز آزمون: {maxScore}
      </div>

      <div style={{ marginTop: 18, display: "grid", gap: 16 }}>
        {loading ? (
          <div style={{ textAlign: "center", marginTop: 40 }}>در حال دریافت سوالات...</div>
        ) : questions.length === 0 ? (
          <div style={{ textAlign: "center", marginTop: 40 }}>
            سوالی پیدا نشد. اول با دکمه‌های معلم سوال اضافه کن 😉
          </div>
        ) : (
          questions.map((qwrap) => {
            const q = qwrap.question;
            const qType = q.type ?? "mcq";
            const isMcq = qType === "mcq";

            return (
              <div
                key={q.id}
                style={{
                  border: "1px solid #eee",
                  borderRadius: 16,
                  padding: 16,
                  background: "#fff",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <div style={{ fontWeight: 800, fontSize: 18 }}>
                    سوال {q.id} ({qType})
                  </div>
                  <div style={{ opacity: 0.7 }}>امتیاز: {q.score ?? 0}</div>
                </div>

                <div style={{ marginTop: 10, fontSize: 16 }}>{q.text}</div>

                {isMcq ? (
                  <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
                    {(qwrap.choices ?? []).map((c) => {
                      const picked = selected[q.id] === c.id;
                      return (
                        <button
                          key={c.id}
                          onClick={() => submitAnswer(q.id, c.id)}
                          style={{
                            padding: "12px 12px",
                            borderRadius: 14,
                            border: picked ? "2px solid #7aa7ff" : "1px solid #ddd",
                            background: picked ? "#eaf2ff" : "#fff",
                            cursor: "pointer",
                            textAlign: "right",
                            fontSize: 16,
                          }}
                        >
                          {picked ? "✅ " : ""}
                          {c.text}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ marginTop: 10, opacity: 0.8 }}>
                    (فعلاً سوال تشریحی فقط نمایش داده می‌شود)
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
