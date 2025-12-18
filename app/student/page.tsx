"use client";

import { useEffect, useMemo, useState } from "react";

type Choice = {
  id: number;
  text: string;
};

type Question = {
  id: number;
  exam_id: number;
  text: string;
  type: "mcq" | "descriptive" | string;
  score: number;
  choices?: Choice[];
};

type GradeResult = {
  score: number;
  total: number;
  correctCount?: number;
  questionCount?: number;
};

const STUDENT_ID = 1;
const EXAM_ID = 1;

export default function StudentPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<number, number>>({}); // questionId -> choiceId

  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [savingQId, setSavingQId] = useState<number | null>(null);

  const [grading, setGrading] = useState(false);
  const [grade, setGrade] = useState<GradeResult | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const totalScore = useMemo(
    () => questions.reduce((sum, q) => sum + (q.score ?? 0), 0),
    [questions]
  );

  async function fetchQuestions() {
    setLoadingQuestions(true);
    setError(null);
    setSuccessMsg(null);

    try {
      // خیلی مهم: چون route.ts شما POST هست، اینجا هم POST می‌زنیم تا 405 نخوریم
      const res = await fetch("/api/student/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ student_id: STUDENT_ID, exam_id: EXAM_ID }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.error || `Failed to fetch questions (${res.status})`);
      }

      const list: Question[] = Array.isArray(data?.questions) ? data.questions : data;
      setQuestions(list || []);
    } catch (e: any) {
      setQuestions([]);
      setError(e?.message ?? "Failed to fetch questions");
    } finally {
      setLoadingQuestions(false);
    }
  }

  async function saveAnswer(questionId: number, choiceId: number) {
    setSavingQId(questionId);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch("/api/student/answers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: STUDENT_ID,
          question_id: questionId,
          selected_choice_id: choiceId,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.error || `Failed to save answer (${res.status})`);
      }

      setSuccessMsg("✅ پاسخ ثبت شد");
    } catch (e: any) {
      setError(e?.message ?? "Failed to save answer");
    } finally {
      setSavingQId(null);
      // پیام سبز بعد 1.5 ثانیه بره
      setTimeout(() => setSuccessMsg(null), 1500);
    }
  }

  async function gradeExamOnce() {
    setGrading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      // خیلی مهم: grade هم POST هست، پس POST
      const res = await fetch("/api/student/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ student_id: STUDENT_ID, exam_id: EXAM_ID }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.error || `Grading failed (${res.status})`);
      }

      setGrade({
        score: data?.score ?? 0,
        total: data?.total ?? totalScore,
        correctCount: data?.correctCount,
        questionCount: data?.questionCount,
      });

      setSuccessMsg("✅ آزمون تصحیح شد");
    } catch (e: any) {
      setError(e?.message ?? "Grading failed");
    } finally {
      setGrading(false);
      setTimeout(() => setSuccessMsg(null), 1500);
    }
  }

  useEffect(() => {
    fetchQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto w-full max-w-3xl px-4 py-8">
        {/* Header */}
        <div className="mb-6 text-right">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            صفحه دانش‌آموز
          </h1>
          <div className="mt-2 text-sm text-slate-600">
            آزمون #{EXAM_ID} — دانش‌آموز #{STUDENT_ID}
          </div>
        </div>

        {/* Actions */}
        <div className="mb-5 flex flex-wrap items-center justify-end gap-3">
          <button
            onClick={gradeExamOnce}
            disabled={grading || loadingQuestions}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {grading ? "در حال تصحیح..." : "✅ پایان آزمون و تصحیح"}
          </button>

          <button
            onClick={fetchQuestions}
            disabled={loadingQuestions}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loadingQuestions ? "در حال دریافت..." : "🔁 فرش سوالات"}
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-right text-sm text-red-700">
            {error}
          </div>
        )}
        {successMsg && (
          <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-right text-sm text-emerald-700">
            {successMsg}
          </div>
        )}

        {/* Summary */}
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 text-right shadow-sm">
          <div className="text-sm text-slate-600">مجموع امتیاز آزمون:</div>
          <div className="mt-1 text-2xl font-bold text-slate-900">{totalScore}</div>

          {grade && (
            <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="text-sm font-semibold text-emerald-800">🎉 نتیجه آزمون</div>
              <div className="mt-2 text-lg font-bold text-emerald-900">
                نمره: {grade.score} از {grade.total}
              </div>
              {(grade.correctCount != null || grade.questionCount != null) && (
                <div className="mt-1 text-sm text-emerald-800">
                  درست: {grade.correctCount ?? "-"} / کل: {grade.questionCount ?? "-"}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Questions */}
        {loadingQuestions ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-right shadow-sm">
            در حال دریافت سوال‌ها...
          </div>
        ) : questions.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-right shadow-sm text-slate-700">
            سوالی پیدا نشد. اول با دکمه‌های معلم چند سوال اضافه کن 😉
          </div>
        ) : (
          <div className="space-y-4">
            {questions.map((q) => {
              const selected = answers[q.id];

              return (
                <div
                  key={q.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 text-right shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="text-sm text-slate-500">امتیاز: {q.score ?? 0}</div>
                    <div className="text-lg font-bold text-slate-900">
                      سوال {q.id} <span className="text-slate-500">({q.type})</span>
                    </div>
                  </div>

                  <div className="mt-2 text-base text-slate-800">{q.text}</div>

                  {/* MCQ */}
                  {q.type === "mcq" && Array.isArray(q.choices) && q.choices.length > 0 && (
                    <div className="mt-4 grid grid-cols-1 gap-2">
                      {q.choices.map((c) => {
                        const isSelected = selected === c.id;

                        return (
                          <button
                            key={c.id}
                            onClick={() => {
                              // فقط انتخاب + ذخیره
                              setAnswers((prev) => ({ ...prev, [q.id]: c.id }));
                              saveAnswer(q.id, c.id);
                            }}
                            disabled={savingQId === q.id}
                            className={[
                              "w-full rounded-xl border px-4 py-3 text-right text-sm font-semibold transition",
                              isSelected
                                ? "border-blue-300 bg-blue-50 text-blue-900"
                                : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50",
                              savingQId === q.id ? "opacity-70" : "",
                            ].join(" ")}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <span className="truncate">{c.text}</span>
                              {isSelected && <span className="text-lg">✅</span>}
                            </div>
                          </button>
                        );
                      })}
                      {savingQId === q.id && (
                        <div className="mt-1 text-xs text-slate-500">در حال ذخیره...</div>
                      )}
                    </div>
                  )}

                  {/* Descriptive */}
                  {q.type !== "mcq" && (
                    <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                      این سوال تشریحی است (فعلاً فقط نمایش داده می‌شود).
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
