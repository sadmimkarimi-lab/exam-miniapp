"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

type Choice = {
  id: number;
  text: string;
};

type Question = {
  id: number;
  text: string;
  type: string;
  score: number;
  choices?: Choice[];
  selected_choice_id: number | null;
};

export default function StudentClient() {
  const sp = useSearchParams();

  const exam_id = Number(sp.get("exam_id") ?? 1);
  const student_id = Number(sp.get("student_id") ?? 1);

  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [grading, setGrading] = useState(false);
  const [gradeResult, setGradeResult] = useState<any>(null);

  const totalScore = useMemo(
    () => questions.reduce((sum, q) => sum + (q.score ?? 0), 0),
    [questions]
  );

  // ----------------------------
  // Fetch questions
  // ----------------------------
  async function fetchQuestions() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/student/questions?exam_id=${exam_id}&student_id=${student_id}`
      );
      const j = await res.json();

      if (!res.ok) throw new Error(j.error || "Failed to fetch questions");

      setQuestions(j.questions ?? []);
    } catch (e: any) {
      setError(e.message);
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exam_id, student_id]);

  // ----------------------------
  // Select answer (MCQ)
  // ----------------------------
  async function selectChoice(question_id: number, choice_id: number) {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === question_id ? { ...q, selected_choice_id: choice_id } : q
      )
    );

    try {
      const res = await fetch("/api/student/answers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id,
          question_id,
          selected_choice_id: choice_id,
        }),
      });

      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Failed to save answer");
    } catch (e: any) {
      setError(e.message);
    }
  }

  // ----------------------------
  // Grade exam
  // ----------------------------
  async function gradeExam() {
    setGrading(true);
    setError(null);

    try {
      const res = await fetch("/api/student/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exam_id, student_id }),
      });

      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Grading failed");

      setGradeResult(j);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setGrading(false);
    }
  }

  // ----------------------------
  // Render
  // ----------------------------
  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: 20 }}>
      <h1 style={{ fontSize: 32, fontWeight: 700 }}>صفحه دانش‌آموز</h1>
      <p style={{ color: "#666", marginBottom: 16 }}>
        آزمون #{exam_id} — دانش‌آموز #{student_id}
      </p>

      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <button onClick={fetchQuestions}>🔄 فرش سوالات</button>
        <button onClick={gradeExam} disabled={grading}>
          ✅ پایان آزمون و تصحیح
        </button>
      </div>

      {error && (
        <div
          style={{
            background: "#fee2e2",
            border: "1px solid #fecaca",
            color: "#991b1b",
            padding: 12,
            borderRadius: 10,
            marginBottom: 16,
          }}
        >
          {error}
        </div>
      )}

      {gradeResult && (
        <div
          style={{
            background: "#ecfdf5",
            border: "1px solid #bbf7d0",
            padding: 14,
            borderRadius: 14,
            marginBottom: 20,
          }}
        >
          🎉 <b>نتیجه آزمون</b>
          <div>نمره: {gradeResult.score} از {gradeResult.total_score}</div>
          <div>
            پاسخ صحیح: {gradeResult.correct_count} /{" "}
            {gradeResult.total_questions}
          </div>
        </div>
      )}

      {loading && <p>در حال دریافت سوالات...</p>}

      {!loading && questions.length === 0 && (
        <p>سوالی وجود ندارد.</p>
      )}

      {questions.map((q, index) => {
        const isLocked = q.selected_choice_id !== null;

        return (
          <div
            key={q.id}
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: 18,
              padding: 16,
              marginBottom: 16,
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: 8 }}>
              سوال {index + 1} (mcq) — امتیاز: {q.score}
            </div>

            <div style={{ marginBottom: 12 }}>{q.text}</div>

            {q.choices?.map((c) => {
              const isSelected = q.selected_choice_id === c.id;

              return (
                <button
                  key={c.id}
                  type="button"
                  disabled={isLocked}
                  onClick={() => {
                    if (isLocked) return;
                    selectChoice(q.id, c.id);
                  }}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: 14,
                    border: isSelected
                      ? "2px solid #16a34a"
                      : "1px solid #e5e7eb",
                    background: isSelected ? "#ecfdf5" : "#fff",
                    opacity: isLocked && !isSelected ? 0.55 : 1,
                    cursor: isLocked ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginTop: 10,
                    fontSize: 16,
                  }}
                >
                  <span>{c.text}</span>
                  <span>{isSelected ? "✅" : ""}</span>
                </button>
              );
            })}
          </div>
        );
      })}

      <div style={{ marginTop: 24, color: "#555" }}>
        مجموع امتیاز آزمون: <b>{totalScore}</b>
      </div>
    </div>
  );
}
