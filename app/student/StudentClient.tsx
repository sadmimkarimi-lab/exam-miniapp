"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

type Choice = { id: number; text: string };
type Question = {
  id: number;
  text: string;
  type?: string;
  score?: number;
  choices?: Choice[];
  selected_choice_id?: number | null;
};

export default function StudentClient() {
  const sp = useSearchParams();

  // اگر پارامتر نبود، پیش‌فرض همون 1 می‌ذاریم که سریع تست کنی
  const exam_id = Number(sp.get("exam_id") ?? 1);
  const student_id = Number(sp.get("student_id") ?? 1);

  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [grading, setGrading] = useState(false);
  const [gradeResult, setGradeResult] = useState<any>(null);

  const totalScore = useMemo(() => {
    return (questions ?? []).reduce((sum, q) => sum + (q.score ?? 0), 0);
  }, [questions]);

  async function fetchQuestions() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/student/questions?exam_id=${exam_id}&student_id=${student_id}`, { cache: "no-store" });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error ?? "Failed to fetch questions");

      setQuestions(j?.questions ?? []);
    } catch (e: any) {
      setError(e?.message ?? "Failed to fetch questions");
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exam_id, student_id]);

  async function selectChoice(question_id: number, choice_id: number) {
    // UI optimistic
    setQuestions((prev) =>
      prev.map((q) => (q.id === question_id ? { ...q, selected_choice_id: choice_id } : q))
    );

    try {
      const res = await fetch("/api/student/answers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ student_id, question_id, selected_choice_id: choice_id }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error ?? "Failed to save answer");
    } catch (e: any) {
      setError(e?.message ?? "Failed to save answer");
    }
  }

  async function gradeExam() {
    setGrading(true);
    setError(null);
    try {
      const res = await fetch("/api/student/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ student_id, exam_id }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error ?? "Grading failed");
      setGradeResult(j);
    } catch (e: any) {
      setError(e?.message ?? "Grading failed");
      setGradeResult(null);
    } finally {
      setGrading(false);
    }
  }

  return (
    <div dir="rtl" style={{ maxWidth: 880, margin: "0 auto", padding: 16, fontFamily: "IRANSans, Vazirmatn, system-ui" }}>
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: 40, margin: 0 }}>صفحه دانش‌آموز</h1>
        <div style={{ opacity: 0.7, marginTop: 6 }}>
          آزمون #{exam_id} — دانش‌آموز #{student_id}
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
        <button
          onClick={gradeExam}
          disabled={grading}
          style={{
            padding: "12px 14px",
            borderRadius: 12,
            border: "1px solid #111",
            background: grading ? "#444" : "#111",
            color: "#fff",
            cursor: grading ? "not-allowed" : "pointer",
            minWidth: 180,
            fontWeight: 700,
          }}
        >
          ✅ پایان آزمون و تصحیح
        </button>

        <button
          onClick={fetchQuestions}
          disabled={loading}
          style={{
            padding: "12px 14px",
            borderRadius: 12,
            border: "1px solid #ddd",
            background: "#fff",
            cursor: loading ? "not-allowed" : "pointer",
            minWidth: 150,
            fontWeight: 700,
          }}
        >
          🔁 فرش سوالات
        </button>

        <div style={{ marginInlineStart: "auto", alignSelf: "center", opacity: 0.75 }}>
          مجموع امتیاز آزمون: <b>{totalScore}</b>
        </div>
      </div>

      {error && (
        <div style={{ marginBottom: 12, padding: 12, borderRadius: 12, background: "#fff1f2", border: "1px solid #fecdd3", color: "#9f1239" }}>
          {error}
        </div>
      )}

      {gradeResult?.ok && (
        <div
          style={{
            marginBottom: 16,
            padding: 14,
            borderRadius: 14,
            background: gradeResult.hidden ? "#fff7ed" : "#ecfdf5",
            border: gradeResult.hidden ? "1px solid #fed7aa" : "1px solid #bbf7d0",
          }}
        >
          <div style={{ fontWeight: 900, fontSize: 18, marginBottom: 6 }}>
            {gradeResult.hidden ? "⏳ نتیجه هنوز قابل نمایش نیست" : "🎉 نتیجه آزمون"}
          </div>

          {gradeResult.hidden ? (
            <div style={{ opacity: 0.9 }}>{gradeResult.message ?? "نتیجه بعداً نمایش داده می‌شود."}</div>
          ) : (
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
              <div>نمره: <b>{gradeResult.score}</b> از <b>{gradeResult.total_score}</b></div>
              <div>پاسخ صحیح: <b>{gradeResult.correct_count}</b> / <b>{gradeResult.total_questions}</b></div>
            </div>
          )}
        </div>
      )}

      {loading ? (
        <div style={{ padding: 16, textAlign: "center", opacity: 0.7 }}>در حال دریافت سوالات…</div>
      ) : questions.length === 0 ? (
        <div style={{ padding: 16, textAlign: "center", opacity: 0.7 }}>😌 سوالی پیدا نشد. اول با دکمه‌های معلم سوال اضافه کن</div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {questions.map((q, idx) => (
            <div key={q.id} style={{ border: "1px solid #eee", borderRadius: 16, padding: 14, background: "#fff" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                <div style={{ fontWeight: 900, fontSize: 18 }}>
                  سوال {idx + 1} {q.type ? <span style={{ opacity: 0.6 }}>({q.type})</span> : null}
                </div>
                <div style={{ opacity: 0.75 }}>امتیاز: <b>{q.score ?? 0}</b></div>
              </div>

              <div style={{ marginTop: 8, fontSize: 16, lineHeight: 1.9 }}>{q.text}</div>

              {q.choices?.length ? (
                <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
                  {q.choices.map((c) => {
                    const selected = q.selected_choice_id === c.id;
                    return (
                      <button
                        key={c.id}
                        onClick={() => selectChoice(q.id, c.id)}
                        style={{
                          textAlign: "right",
                          padding: "12px 12px",
                          borderRadius: 14,
                          border: selected ? "2px solid #16a34a" : "1px solid #ddd",
                          background: selected ? "#ecfdf5" : "#fff",
                          cursor: "pointer",
                          fontWeight: selected ? 800 : 600,
                        }}
                      >
                        {selected ? "✅ " : ""}{c.text}
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
