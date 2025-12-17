"use client";

import { useEffect, useMemo, useState } from "react";

type Choice = { id: number; text: string };
type Question = {
  id: number;
  exam_id: number;
  type: string; // "mcq" | "essay" | ...
  text: string;
  score: number;
  choices: Choice[];
};

// خروجی‌های احتمالی grade (چون قبلاً چند مدل ساختیم)
type GradeResponse = {
  ok?: boolean;
  error?: string;
  meta?: { score?: number; total?: number; answeredCount?: number };
  result?: { score?: number; total?: number };
  // بعضی نسخه‌ها اینا رو مستقیم می‌دن
  score?: number;
  total?: number;
};

export default function StudentPage() {
  // فعلاً دستی (بعداً با ایتا/لاگین واقعی می‌کنیم)
  const EXAM_ID = 1;
  const STUDENT_ID = 1;

  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [msg, setMsg] = useState<string>("");

  // وضعیت انتخاب‌های دانش‌آموز در UI (برای اینکه بفهمه چی انتخاب کرده)
  const [picked, setPicked] = useState<Record<number, number>>({}); // {question_id: choice_id}

  // وضعیت تصحیح
  const [grading, setGrading] = useState(false);
  const [gradeError, setGradeError] = useState<string>("");
  const [gradeResult, setGradeResult] = useState<{ score: number; total: number } | null>(null);

  const mcqCount = useMemo(
    () => questions.filter((q) => (q.type ?? "mcq") === "mcq").length,
    [questions]
  );

  async function loadQuestions() {
    setLoading(true);
    setMsg("");
    setGradeError("");
    setGradeResult(null);

    const res = await fetch(`/api/student/questions?exam_id=${EXAM_ID}`, { cache: "no-store" });
    const data = await res.json();

    if (!res.ok) {
      setMsg(data?.error || "خطا در گرفتن سوالات");
      setQuestions([]);
      setLoading(false);
      return;
    }

    const qs: Question[] = data.questions || [];
    setQuestions(qs);
    setLoading(false);
  }

  useEffect(() => {
    loadQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function answer(question_id: number, selected_choice_id: number) {
    setMsg("در حال ثبت پاسخ...");

    // UI رو سریع آپدیت می‌کنیم (حس بهتر)
    setPicked((prev) => ({ ...prev, [question_id]: selected_choice_id }));

    const res = await fetch("/api/student/answers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        student_id: STUDENT_ID,
        question_id,
        selected_choice_id,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setMsg(data?.error || "ثبت پاسخ ناموفق بود");
      return;
    }

    setMsg("✅ پاسخ ثبت شد");
  }

  async function gradeExam() {
    setGrading(true);
    setGradeError("");
    setGradeResult(null);

    try {
      const res = await fetch("/api/student/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ student_id: STUDENT_ID, exam_id: EXAM_ID }),
      });

      const data: GradeResponse = await res.json();

      if (!res.ok) {
        setGradeError(data?.error || "خطا در تصحیح آزمون");
        return;
      }

      // سازگاری با خروجی‌های مختلف
      const score =
        data?.meta?.score ??
        data?.result?.score ??
        data?.score ??
        0;

      const total =
        data?.meta?.total ??
        data?.result?.total ??
        data?.total ??
        0;

      setGradeResult({ score: Number(score), total: Number(total) });
      setMsg("✅ آزمون تصحیح شد");
    } catch (e: any) {
      setGradeError(e?.message || "خطای ناشناخته");
    } finally {
      setGrading(false);
    }
  }

  return (
    <main
      style={{
        maxWidth: 720,
        margin: "24px auto",
        padding: 16,
        direction: "rtl",
        fontFamily: "sans-serif",
      }}
    >
      <header style={{ display: "grid", gap: 6, marginBottom: 14 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>صفحه دانش‌آموز</h1>
        <p style={{ opacity: 0.85, margin: 0 }}>
          آزمون #{EXAM_ID} — دانش‌آموز #{STUDENT_ID}
        </p>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 8 }}>
          <button
            onClick={loadQuestions}
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid #ddd",
              background: "#fff",
            }}
          >
            🔄 رفرش سوالات
          </button>

          <button
            onClick={gradeExam}
            disabled={grading || questions.length === 0 || mcqCount === 0}
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid #ddd",
              background: grading ? "#f3f3f3" : "#111",
              color: grading ? "#777" : "#fff",
              cursor: grading ? "not-allowed" : "pointer",
            }}
            title={mcqCount === 0 ? "فعلاً فقط سوالات چهارگزینه‌ای تصحیح می‌شوند" : ""}
          >
            {grading ? "در حال تصحیح..." : "✅ پایان آزمون و تصحیح"}
          </button>
        </div>
      </header>

      {/* پیام‌های عمومی */}
      {msg ? (
        <div
          style={{
            padding: 12,
            borderRadius: 12,
            background: "#f5f5f5",
            marginBottom: 12,
            border: "1px solid #eee",
          }}
        >
          {msg}
        </div>
      ) : null}

      {/* نتیجه تصحیح */}
      {gradeError ? (
        <div
          style={{
            padding: 12,
            borderRadius: 12,
            background: "#fff5f5",
            marginBottom: 12,
            border: "1px solid #ffd0d0",
            color: "crimson",
          }}
        >
          ❌ {gradeError}
        </div>
      ) : null}

      {gradeResult ? (
        <div
          style={{
            padding: 12,
            borderRadius: 12,
            background: "#f6ffed",
            marginBottom: 12,
            border: "1px solid #b7eb8f",
          }}
        >
          <div style={{ fontWeight: 800 }}>🎉 نتیجه آزمون</div>
          <div style={{ marginTop: 6 }}>
            نمره: <b>{gradeResult.score}</b> از <b>{gradeResult.total}</b>
          </div>
        </div>
      ) : null}

      {/* محتوای سوالات */}
      {loading ? (
        <p>در حال بارگذاری…</p>
      ) : questions.length === 0 ? (
        <p>سوالی پیدا نشد. (اول با دکمه‌های معلم چند سوال بساز)</p>
      ) : (
        questions.map((q) => (
          <div
            key={q.id}
            style={{
              border: "1px solid #ddd",
              borderRadius: 12,
              padding: 12,
              marginBottom: 12,
              background: "#fff",
            }}
          >
            <div style={{ fontWeight: 800, marginBottom: 6 }}>
              سوال {q.id} ({q.type})
            </div>

            <div style={{ marginBottom: 10 }}>{q.text}</div>

            {(q.type ?? "mcq") === "mcq" ? (
              <div style={{ display: "grid", gap: 8 }}>
                {q.choices.map((c) => {
                  const isPicked = picked[q.id] === c.id;
                  return (
                    <button
                      key={c.id}
                      onClick={() => answer(q.id, c.id)}
                      style={{
                        padding: 10,
                        borderRadius: 10,
                        border: "1px solid #ccc",
                        textAlign: "right",
                        background: isPicked ? "#e6f4ff" : "#fff",
                      }}
                    >
                      {isPicked ? "✅ " : ""}
                      {c.text}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p style={{ opacity: 0.7, margin: 0 }}>
                (فعلاً برای تشریحی UI نداریم. تصحیح تشریحی بعداً با پنل استاد اضافه می‌شود.)
              </p>
            )}
          </div>
        ))
      )}

      <footer style={{ opacity: 0.7, marginTop: 18, fontSize: 12 }}>
        نکته: تصحیح خودکار فعلاً فقط برای سوالات <b>چهارگزینه‌ای</b> انجام می‌شود.
      </footer>
    </main>
  );
}
