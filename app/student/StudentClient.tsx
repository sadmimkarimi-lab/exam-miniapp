"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

/* ===== Types ===== */
type Choice = {
  id: number;
  text: string;
};

type Question = {
  id: number;
  text: string;
  type?: string | null;
  score?: number | null;
  choices?: Choice[];
  selected_choice_id?: number | null;
};

/* ===== Helpers ===== */
async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
    ...init,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `${res.status}`);
  }
  return res.json();
}

/* ===== Component ===== */
export default function StudentClient() {
  const searchParams = useSearchParams();

  const examId = Number(searchParams.get("exam_id") || 1);
  const studentId = Number(searchParams.get("student_id") || 1);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<number, number | null>>({});
  const [loading, setLoading] = useState(false);
  const [grading, setGrading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const totalScore = useMemo(
    () => questions.reduce((s, q) => s + (q.score ?? 0), 0),
    [questions]
  );

  /* ===== Load Questions ===== */
  async function loadQuestions() {
    setLoading(true);
    setError("");
    try {
      const data = await fetchJson<any>(
        `/api/student/questions?exam_id=${examId}&student_id=${studentId}`
      );

      const list: Question[] = data.questions || data.data || data || [];
      setQuestions(list);

      const map: Record<number, number | null> = {};
      list.forEach((q) => (map[q.id] = q.selected_choice_id ?? null));
      setAnswers(map);

      if (!list.length) {
        setInfo("سوالی وجود ندارد. ابتدا معلم سوال اضافه کند.");
      } else {
        setInfo("سوالات با موفقیت دریافت شد ✅");
      }
    } catch (e: any) {
      setError(`Failed to fetch questions (${e.message})`);
    } finally {
      setLoading(false);
    }
  }

  /* ===== Save Answer ===== */
  async function selectChoice(questionId: number, choiceId: number) {
    setAnswers((p) => ({ ...p, [questionId]: choiceId }));

    try {
      await fetchJson("/api/student/answers", {
        method: "POST",
        body: JSON.stringify({
          student_id: studentId,
          question_id: questionId,
          selected_choice_id: choiceId,
        }),
      });
    } catch {
      setError("خطا در ثبت پاسخ");
    }
  }

  /* ===== Grade ===== */
  async function gradeExam() {
    setGrading(true);
    setError("");
    try {
      const res = await fetchJson<any>("/api/student/grade", {
        method: "POST",
        body: JSON.stringify({ student_id: studentId, exam_id: examId }),
      });

      setInfo(`آزمون تصحیح شد ✅ نمره: ${res.score ?? "?"} از ${totalScore}`);
    } catch (e: any) {
      setError(`تصحیح انجام نشد (${e.message})`);
    } finally {
      setGrading(false);
    }
  }

  useEffect(() => {
    loadQuestions();
  }, [examId, studentId]);

  /* ===== UI ===== */
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <header className="rounded-xl bg-white p-5 shadow">
          <h1 className="text-2xl font-bold">صفحه دانش‌آموز</h1>
          <p className="text-sm text-gray-500">
            آزمون #{examId} — دانش‌آموز #{studentId}
          </p>

          <div className="mt-4 flex gap-3">
            <button
              onClick={gradeExam}
              disabled={grading}
              className="rounded-lg bg-black px-4 py-2 text-white"
            >
              پایان آزمون و تصحیح
            </button>

            <button
              onClick={loadQuestions}
              disabled={loading}
              className="rounded-lg border px-4 py-2"
            >
              فرش سوالات
            </button>
          </div>

          {error && <div className="mt-3 text-red-600">{error}</div>}
          {info && <div className="mt-3 text-green-600">{info}</div>}
        </header>

        {questions.map((q, i) => (
          <div key={q.id} className="rounded-xl bg-white p-5 shadow">
            <div className="font-bold mb-2">
              سوال {i + 1} ({q.type || "mcq"}) — امتیاز {q.score}
            </div>

            <div className="mb-3">{q.text}</div>

            <div className="space-y-2">
              {q.choices?.map((c) => (
                <button
                  key={c.id}
                  onClick={() => selectChoice(q.id, c.id)}
                  className={`w-full rounded-lg border p-3 text-right ${
                    answers[q.id] === c.id
                      ? "bg-blue-100 border-blue-400"
                      : ""
                  }`}
                >
                  {c.text}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
