"use client";

import React, { useEffect, useMemo, useState } from "react";

type Choice = { id: number; text: string; question_id?: number };
type Question = {
  id: number;
  exam_id: number;
  text: string;
  score: number;
  type?: string; // "mcq" | "essay" | ...
  choices?: Choice[];
};

// بعضی وقتا API ممکنه این شکلی بده: { question: {...}, choices: [...] }
type QuestionWithChoices = { question: Question; choices?: Choice[] };

function normalizeQuestions(data: any): Question[] {
  const list = Array.isArray(data) ? data : Array.isArray(data?.questions) ? data.questions : [];

  // حالت 1: مستقیم Question[] با choices داخلش
  if (list.length && list[0]?.id && (list[0]?.text || list[0]?.choices)) return list as Question[];

  // حالت 2: QuestionWithChoices[]
  if (list.length && list[0]?.question?.id) {
    return (list as QuestionWithChoices[]).map((x) => ({
      ...x.question,
      choices: x.choices ?? x.question.choices ?? [],
    }));
  }

  return [];
}

export default function StudentPage() {
  // فعلاً ثابت (بعداً لاگین می‌کنیم)
  const EXAM_ID = 1;
  const STUDENT_ID = 1;

  const [loading, setLoading] = useState(false);
  const [finishing, setFinishing] = useState(false);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [selected, setSelected] = useState<Record<number, number>>({}); // question_id -> choice_id

  const [status, setStatus] = useState<string>(""); // پیام‌های بالا
  const [error, setError] = useState<string>("");

  const [result, setResult] = useState<null | { score: number; total: number }>(null);

  const totalScore = useMemo(() => {
    return questions.reduce((sum, q) => sum + (q.score ?? 0), 0);
  }, [questions]);

  async function fetchQuestions() {
    setLoading(true);
    setError("");
    setStatus("");
    setResult(null);

    try {
      // ✅ روت درست برای دانش‌آموز
      // اگر روتت POST-only بود، پایین fallback گذاشتم.
      let res = await fetch(`/api/student/questions?exam_id=${EXAM_ID}`, {
        method: "GET",
        cache: "no-store",
      });

      if (res.status === 405) {
        // fallback: بعضی‌ها روت سوالات رو POST می‌سازن
        res = await fetch(`/api/student/questions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ exam_id: EXAM_ID }),
          cache: "no-store",
        });
      }

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || `Failed to fetch questions (${res.status})`);

      const qs = normalizeQuestions(data);
      setQuestions(qs);
      setSelected({});
      if (qs.length === 0) setStatus("سوالی پیدا نشد. اول با دکمه‌های معلم چند سوال اضافه کن 😉");
    } catch (e: any) {
      setQuestions([]);
      setError(e?.message || "خطا در گرفتن سوالات");
    } finally {
      setLoading(false);
    }
  }

  async function submitAnswer(questionId: number, choiceId: number) {
    // UI فوری آپدیت بشه
    setSelected((prev) => ({ ...prev, [questionId]: choiceId }));
    setError("");
    setStatus("در حال ثبت پاسخ...");

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
      if (!res.ok) throw new Error(data?.error || `ثبت پاسخ ناموفق بود (${res.status})`);

      setStatus("✅ پاسخ ثبت شد");
      // پیام رو خیلی زود پاک نکنیم
      setTimeout(() => setStatus(""), 800);
    } catch (e: any) {
      setError(e?.message || "ثبت پاسخ ناموفق بود");
      setStatus("");
    }
  }

  async function finishAndGrade() {
    setFinishing(true);
    setError("");
    setStatus("");

    try {
      // ✅ روت درستِ تصحیح: /api/student/grade (POST-only)
      const res = await fetch("/api/student/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ student_id: STUDENT_ID, exam_id: EXAM_ID }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || `تصحیح انجام نشد (${res.status})`);

      setResult({ score: data.score ?? 0, total: data.total ?? totalScore ?? 0 });
      setStatus("✅ آزمون تصحیح شد");
    } catch (e: any) {
      setError(e?.message || "تصحیح انجام نشد");
    } finally {
      setFinishing(false);
    }
  }

  useEffect(() => {
    fetchQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="mx-auto max-w-2xl px-4 py-8" style={{ direction: "rtl" }}>
      <h1 className="text-3xl font-black text-center">صفحه دانش‌آموز</h1>
      <p className="text-center mt-2 text-gray-600">
        آزمون #{EXAM_ID} — دانش‌آموز #{STUDENT_ID}
      </p>

      <div className="mt-6 flex gap-3 justify-center">
        <button
          onClick={finishAndGrade}
          disabled={finishing}
          className="px-5 py-3 rounded-2xl bg-black text-white font-bold disabled:opacity-60"
        >
          {finishing ? "در حال تصحیح..." : "✅ پایان آزمون و تصحیح"}
        </button>

        <button
          onClick={fetchQuestions}
          disabled={loading}
          className="px-5 py-3 rounded-2xl border font-bold disabled:opacity-60"
        >
          {loading ? "..." : "🔁 فرش سوالات"}
        </button>
      </div>

      {(error || status) && (
        <div
          className={`mt-4 rounded-2xl p-4 text-center border ${
            error ? "bg-red-50 border-red-200 text-red-700" : "bg-gray-50 border-gray-200"
          }`}
        >
          {error || status}
        </div>
      )}

      <div className="mt-6 text-center text-gray-700">
        مجموع امتیاز آزمون: <span className="font-black">{totalScore}</span>
      </div>

      {result && (
        <div className="mt-4 rounded-2xl p-5 border bg-green-50 border-green-200 text-center">
          <div className="text-xl font-black">🎉 نتیجه آزمون</div>
          <div className="mt-2 text-lg">
            نمره: <span className="font-black">{result.score}</span> از{" "}
            <span className="font-black">{result.total}</span>
          </div>
        </div>
      )}

      <div className="mt-8 space-y-4">
        {questions.map((q) => {
          const isMcq = (q.type || "").toLowerCase() === "mcq";
          const chosen = selected[q.id];

          return (
            <div key={q.id} className="rounded-2xl border p-5">
              <div className="flex justify-between items-center">
                <div className="text-lg font-black">
                  سوال {q.id} {q.type ? <span className="opacity-70">({q.type})</span> : null}
                </div>
                <div className="text-sm text-gray-600">امتیاز: {q.score ?? 0}</div>
              </div>

              <div className="mt-3 text-gray-800 leading-7">{q.text}</div>

              {isMcq ? (
                <div className="mt-4 space-y-3">
                  {(q.choices ?? []).map((c) => {
                    const active = chosen === c.id;
                    return (
                      <button
                        key={c.id}
                        onClick={() => submitAnswer(q.id, c.id)}
                        className={`w-full text-right rounded-2xl border px-4 py-3 font-semibold ${
                          active ? "bg-blue-50 border-blue-300" : "bg-white"
                        }`}
                      >
                        <span className="inline-flex items-center gap-2">
                          {active ? "✅" : "⬜️"} {c.text}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-4 rounded-2xl border bg-gray-50 p-4 text-gray-600">
                  این سوال تشریحی است (فعلاً برای تشریحی UI ارسال جواب نداریم).
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!loading && questions.length === 0 && !error && (
        <div className="mt-10 text-center text-gray-600">
          سوالی پیدا نشد. اول با دکمه‌های معلم چند سوال اضافه کن 😉
        </div>
      )}
    </main>
  );
}
