"use client";

import { useEffect, useMemo, useState } from "react";

type Choice = {
  id: number;
  question_id: number;
  text: string;
};

type Question = {
  id: number;
  exam_id: number;
  text: string;
  score: number;
  type?: string | null;
  choices?: Choice[];
};

type GradeResult = {
  ok: boolean;
  student_id: number;
  exam_id: number;
  score: number;
  total: number;
  correctCount: number;
  questionCount: number;
};

export default function StudentPage() {
  const studentId = 1;
  const examId = 1;

  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selected, setSelected] = useState<Record<number, number>>({});
  const [msg, setMsg] = useState<string>("");
  const [grade, setGrade] = useState<GradeResult | null>(null);
  const [grading, setGrading] = useState(false);

  const total = useMemo(
    () => questions.reduce((s, q) => s + (q.score ?? 0), 0),
    [questions]
  );

  async function loadQuestions() {
    setLoading(true);
    setMsg("");
    setGrade(null);

    try {
      // اینجا مستقیم از API معلم استفاده نمی‌کنیم؛
      // از supabase route عمومی خود پروژه‌ات هم اگر داری می‌تونی وصل کنی.
      // فعلاً از یک endpoint ساده استفاده می‌کنیم: /api/teacher/questions?exam_id=1
      const res = await fetch("/api/teacher/questions", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ exam_id: examId }),
});

      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || `Failed to fetch questions (${res.status})`);
      }

      const data = await res.json();

      // انتظار داریم data.questions یا data خودش آرایه باشه
      const list: Question[] = Array.isArray(data) ? data : data.questions ?? [];
      setQuestions(list);
    } catch (e: any) {
      setMsg(e?.message ?? "خطا در گرفتن سوالات");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submitAnswer(questionId: number, choiceId: number) {
    setMsg("");

    // optimistic UI
    setSelected((prev) => ({ ...prev, [questionId]: choiceId }));

    const res = await fetch("/api/student/answers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        student_id: studentId,
        question_id: questionId,
        selected_choice_id: choiceId,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setMsg(data?.error ?? "ثبت پاسخ ناموفق بود");
    } else {
      setMsg("✅ پاسخ ثبت شد");
      setTimeout(() => setMsg(""), 1200);
    }
  }

  async function finishAndGrade() {
    setGrading(true);
    setMsg("");
    setGrade(null);

    try {
      const res = await fetch("/api/student/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ student_id: studentId, exam_id: examId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error ?? "تصحیح ناموفق بود");
      }

      setGrade(data);
      setMsg("✅ آزمون تصحیح شد و نتیجه ذخیره شد");
    } catch (e: any) {
      setMsg(e?.message ?? "خطا در تصحیح");
    } finally {
      setGrading(false);
    }
  }

  return (
    <div style={{ maxWidth: 520, margin: "0 auto", padding: 16, direction: "rtl" }}>
      <h2 style={{ textAlign: "center", marginBottom: 6 }}>صفحه دانش‌آموز</h2>
      <div style={{ textAlign: "center", marginBottom: 12, opacity: 0.8 }}>
        آزمون #{examId} — دانش‌آموز #{studentId}
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
        <button
          onClick={finishAndGrade}
          disabled={grading || loading}
          style={{
            flex: 1,
            padding: 12,
            borderRadius: 12,
            border: "1px solid #ddd",
            background: "#111",
            color: "#fff",
            fontWeight: 700,
          }}
        >
          {grading ? "در حال تصحیح..." : "✅ پایان آزمون و تصحیح"}
        </button>

        <button
          onClick={loadQuestions}
          disabled={loading || grading}
          style={{
            padding: 12,
            borderRadius: 12,
            border: "1px solid #ddd",
            background: "#fff",
            fontWeight: 700,
          }}
        >
          ↩️ فرش سوالات
        </button>
      </div>

      {msg && (
        <div
          style={{
            marginBottom: 14,
            padding: 12,
            borderRadius: 12,
            border: "1px solid #e5e5e5",
            background: "#f8f8f8",
          }}
        >
          {msg}
        </div>
      )}

      {grade && (
        <div
          style={{
            marginBottom: 14,
            padding: 14,
            borderRadius: 14,
            border: "1px solid #bfe7bf",
            background: "#f1fff1",
          }}
        >
          <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 6 }}>
            🎉 نتیجه آزمون
          </div>
          <div style={{ fontSize: 20, fontWeight: 900 }}>
            نمره: {grade.score} از {grade.total}
          </div>
          <div style={{ opacity: 0.85, marginTop: 6 }}>
            درست‌ها: {grade.correctCount} از {grade.questionCount}
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ padding: 16, textAlign: "center" }}>در حال گرفتن سوالات...</div>
      ) : (
        questions.map((q, idx) => {
          const qType = (q.type ?? "mcq").toLowerCase();
          const isMcq = qType === "mcq";

          return (
            <div
              key={q.id}
              style={{
                border: "1px solid #e7e7e7",
                borderRadius: 16,
                padding: 14,
                marginBottom: 14,
                background: "#fff",
              }}
            >
              <div style={{ fontWeight: 900, marginBottom: 10 }}>
                سوال {idx + 1} ({qType}) — امتیاز: {q.score ?? 0}
              </div>

              <div style={{ marginBottom: 12, lineHeight: 1.9 }}>{q.text}</div>

              {!isMcq ? (
                <div style={{ opacity: 0.75 }}>
                  (فعلاً سوال تشریحی رو فقط نمایش می‌دیم. اگر خواستی، مرحله بعد ذخیره پاسخ تشریحی رو هم اضافه می‌کنیم.)
                </div>
              ) : (
                <div style={{ display: "grid", gap: 10 }}>
                  {(q.choices ?? []).map((c) => {
                    const active = selected[q.id] === c.id;
                    return (
                      <button
                        key={c.id}
                        onClick={() => submitAnswer(q.id, c.id)}
                        style={{
                          padding: 12,
                          borderRadius: 14,
                          border: active ? "2px solid #111" : "1px solid #ddd",
                          background: active ? "#eaf3ff" : "#fff",
                          textAlign: "right",
                          fontWeight: 700,
                        }}
                      >
                        {active ? "✅ " : ""}{c.text}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })
      )}

      <div style={{ textAlign: "center", opacity: 0.6, marginTop: 10 }}>
        مجموع امتیاز آزمون: {total}
      </div>
    </div>
  );
}
