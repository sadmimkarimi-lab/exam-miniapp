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
  type: string; // "mcq" | "desc" (هرچی تو دیتابیس داری)
  score: number;
  choices?: Choice[];
  selected_choice_id?: number | null;
};

type GradeResult = {
  ok: boolean;
  exam_id: number;
  student_id: number;
  score: number;
  total_score: number;
  correct_count: number;
  total_questions: number;
  saved?: boolean;
};

export default function StudentPage() {
  // فعلاً ثابت (بعداً می‌تونی از querystring یا login بگیری)
  const examId = 1;
  const studentId = 1;

  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingAnswerId, setSavingAnswerId] = useState<number | null>(null);

  const [fetchError, setFetchError] = useState<string>("");
  const [actionError, setActionError] = useState<string>("");

  const [gradeLoading, setGradeLoading] = useState(false);
  const [gradeResult, setGradeResult] = useState<GradeResult | null>(null);

  const totalScore = useMemo(
    () => questions.reduce((sum, q) => sum + (q.score ?? 0), 0),
    [questions]
  );

  async function fetchQuestions() {
    setLoading(true);
    setFetchError("");
    setActionError("");
    setGradeResult(null);

    try {
      const res = await fetch(
        `/api/student/questions?exam_id=${examId}&student_id=${studentId}`,
        { method: "GET", cache: "no-store" }
      );

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || `Failed to fetch questions (${res.status})`);
      }

      setQuestions(Array.isArray(data?.questions) ? data.questions : []);
    } catch (e: any) {
      setFetchError(e?.message || "Failed to fetch questions");
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function selectChoice(questionId: number, choiceId: number) {
    setActionError("");
    setSavingAnswerId(questionId);

    // optimistic UI
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === questionId ? { ...q, selected_choice_id: choiceId } : q
      )
    );

    try {
      const res = await fetch("/api/student/answers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: studentId,
          question_id: questionId,
          selected_choice_id: choiceId,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `Save failed (${res.status})`);
    } catch (e: any) {
      setActionError(e?.message || "ثبت پاسخ انجام نشد");
      // rollback: دوباره از سرور بگیر تا درست شه
      await fetchQuestions();
    } finally {
      setSavingAnswerId(null);
    }
  }

  async function finishAndGrade() {
    setActionError("");
    setGradeResult(null);
    setGradeLoading(true);

    try {
      const res = await fetch("/api/student/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ student_id: studentId, exam_id: examId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `تصحیح انجام نشد (${res.status})`);

      setGradeResult(data as GradeResult);
    } catch (e: any) {
      setActionError(e?.message || "تصحیح انجام نشد");
    } finally {
      setGradeLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <header className="text-center space-y-2">
          <h1 className="text-4xl font-black">صفحه دانش‌آموز</h1>
          <p className="text-slate-600">
            آزمون #{examId} — دانش‌آموز #{studentId}
          </p>
        </header>

        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            onClick={finishAndGrade}
            disabled={gradeLoading || loading}
            className="rounded-2xl px-5 py-3 font-bold shadow-sm border border-slate-200 bg-black text-white disabled:opacity-60"
          >
            ✅ پایان آزمون و تصحیح
          </button>

          <button
            onClick={fetchQuestions}
            disabled={loading || gradeLoading}
            className="rounded-2xl px-5 py-3 font-bold shadow-sm border border-slate-200 bg-white disabled:opacity-60"
          >
            🔁 فرش سوالات
          </button>
        </div>

        {fetchError ? (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-700 font-semibold text-center">
            {fetchError}
          </div>
        ) : null}

        {actionError ? (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800 font-semibold text-center">
            {actionError}
          </div>
        ) : null}

        <div className="mt-6 text-center text-slate-700">
          <span className="font-bold">مجموع امتیاز آزمون:</span> {totalScore}
        </div>

        {gradeResult ? (
          <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-center">
            <div className="text-lg font-black">🎉 نتیجه آزمون</div>
            <div className="mt-2 text-2xl font-black">
              نمره: {gradeResult.score} از {gradeResult.total_score}
            </div>
            <div className="mt-1 text-slate-700">
              تعداد درست: {gradeResult.correct_count} از {gradeResult.total_questions}
              {typeof gradeResult.saved === "boolean" ? (
                <span className="ml-2">
                  — {gradeResult.saved ? "✅ ذخیره شد" : "⚠️ ذخیره نشد"}
                </span>
              ) : null}
            </div>
          </div>
        ) : null}

        <section className="mt-8 space-y-5">
          {loading ? (
            <div className="text-center text-slate-600 font-semibold">
              در حال گرفتن سوالات...
            </div>
          ) : null}

          {!loading && questions.length === 0 ? (
            <div className="text-center text-slate-600 font-semibold">
              سوالی پیدا نشد. اول با دکمه‌های معلم سوال اضافه کن 😉
            </div>
          ) : null}

          {questions.map((q) => {
            const isMCQ = (q.type || "").toLowerCase() === "mcq";
            return (
              <div
                key={q.id}
                className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="text-lg font-black">
                    سوال {q.id} {isMCQ ? "(mcq)" : ""}
                  </div>
                  <div className="text-slate-600 font-bold">امتیاز: {q.score}</div>
                </div>

                <div className="mt-2 text-slate-800 leading-7">{q.text}</div>

                {!isMCQ ? (
                  <div className="mt-3 text-slate-500 text-sm">
                    (این سوال تشریحی است — فعلاً تصحیح خودکار ندارد)
                  </div>
                ) : (
                  <div className="mt-4 grid gap-3">
                    {(q.choices || []).map((c) => {
                      const selected = q.selected_choice_id === c.id;
                      return (
                        <button
                          key={c.id}
                          onClick={() => selectChoice(q.id, c.id)}
                          disabled={savingAnswerId === q.id}
                          className={[
                            "rounded-2xl border px-4 py-3 text-right font-semibold shadow-sm",
                            selected
                              ? "border-blue-300 bg-blue-50"
                              : "border-slate-200 bg-white hover:bg-slate-50",
                            savingAnswerId === q.id ? "opacity-60" : "",
                          ].join(" ")}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span>{c.text}</span>
                            {selected ? <span>✅</span> : <span className="opacity-0">✅</span>}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </section>
      </div>
    </main>
  );
}
