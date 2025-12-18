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
  type?: string | null; // "mcq" | "text" | ...
  score?: number | null;
  choices?: Choice[];
  selected_choice_id?: number | null;
};

type QuestionsApiResponse =
  | { questions: Question[] }
  | { data: Question[] }
  | Question[];

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    cache: "no-store",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });

  // اگر خطا بود، متن خطا رو قشنگ برگردون
  if (!res.ok) {
    let msg = `${res.status}`;
    try {
      const t = await res.text();
      msg = t ? `${t} (${res.status})` : `${res.status}`;
    } catch {}
    throw new Error(msg);
  }

  return res.json();
}

export default function StudentPage() {
  const searchParams = useSearchParams();

  // از querystring بگیر، اگر نبود پیش‌فرض 1
  const examId = Number(searchParams.get("exam_id") || 1);
  const studentId = Number(searchParams.get("student_id") || 1);

  const [loading, setLoading] = useState(false);
  const [grading, setGrading] = useState(false);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedByQ, setSelectedByQ] = useState<Record<number, number | null>>(
    {}
  );

  const [info, setInfo] = useState<string>("");
  const [error, setError] = useState<string>("");

  const totalScore = useMemo(() => {
    return (questions || []).reduce((sum, q) => sum + (q.score ?? 0), 0);
  }, [questions]);

  const answeredCount = useMemo(() => {
    const ids = Object.keys(selectedByQ);
    let c = 0;
    for (const k of ids) if (selectedByQ[Number(k)]) c++;
    return c;
  }, [selectedByQ]);

  async function loadQuestions() {
    setError("");
    setInfo("");
    setLoading(true);
    try {
      const url = `/api/student/questions?exam_id=${examId}&student_id=${studentId}`;
      const data = await fetchJson<QuestionsApiResponse>(url, { method: "GET" });

      const list: Question[] = Array.isArray(data)
        ? data
        : "questions" in (data as any)
          ? ((data as any).questions as Question[])
          : "data" in (data as any)
            ? ((data as any).data as Question[])
            : [];

      setQuestions(list);

      // مقداردهی اولیه انتخاب‌ها (اگر قبلا جواب ثبت شده باشد)
      const map: Record<number, number | null> = {};
      for (const q of list) {
        map[q.id] = q.selected_choice_id ?? null;
      }
      setSelectedByQ(map);

      if (!list?.length) {
        setInfo("سوالی پیدا نشد. اول با پنل معلم چند سوال اضافه کن 🙂");
      } else {
        setInfo("سوال‌ها با موفقیت لود شد ✅");
      }
    } catch (e: any) {
      setError(`Failed to fetch questions: ${e?.message || "Error"}`);
    } finally {
      setLoading(false);
    }
  }

  async function saveAnswer(questionId: number, choiceId: number) {
    setError("");
    setInfo("");
    try {
      await fetchJson(`/api/student/answers`, {
        method: "POST",
        body: JSON.stringify({
          student_id: studentId,
          question_id: questionId,
          selected_choice_id: choiceId,
        }),
      });

      setInfo("پاسخ ثبت شد ✅");
    } catch (e: any) {
      setError(`ثبت پاسخ انجام نشد: ${e?.message || "Error"}`);
      // اگر ثبت نشد، انتخاب رو برگردون عقب (اختیاری)
      setSelectedByQ((prev) => ({ ...prev, [questionId]: prev[questionId] ?? null }));
    }
  }

  async function gradeExam() {
    setError("");
    setInfo("");
    setGrading(true);
    try {
      // مسیر درست شما: /api/student/grade (POST)
      const result = await fetchJson<any>(`/api/student/grade`, {
        method: "POST",
        body: JSON.stringify({ student_id: studentId, exam_id: examId }),
      });

      // نتیجه رو نمایش بده
      const score =
        result?.score ??
        result?.data?.score ??
        result?.result?.score ??
        result?.total_score ??
        null;

      if (score !== null && score !== undefined) {
        setInfo(`آزمون تصحیح شد ✅ نمره: ${score} از ${totalScore}`);
      } else {
        setInfo("آزمون تصحیح شد ✅");
      }
    } catch (e: any) {
      setError(`تصحیح انجام نشد: ${e?.message || "Error"}`);
    } finally {
      setGrading(false);
    }
  }

  useEffect(() => {
    // اولین بار خودکار سوال‌ها رو بگیر
    loadQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examId, studentId]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto w-full max-w-3xl px-4 py-8">
        {/* Header */}
        <div className="mb-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <h1 className="text-3xl font-extrabold tracking-tight">
            صفحه دانش‌آموز
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            آزمون #{examId} — دانش‌آموز #{studentId}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              onClick={gradeExam}
              disabled={grading}
              className="rounded-xl bg-slate-900 px-4 py-2 text-white shadow-sm transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {grading ? "در حال تصحیح..." : "✅ پایان آزمون و تصحیح"}
            </button>

            <button
              onClick={loadQuestions}
              disabled={loading}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-slate-900 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "در حال دریافت..." : "🔁 فرش سوالات"}
            </button>

            <div className="ml-auto text-sm text-slate-600">
              مجموع امتیاز:{" "}
              <span className="font-bold text-slate-900">{totalScore}</span>
              {"  "}
              <span className="mx-2 text-slate-300">|</span>
              پاسخ‌داده‌شده:{" "}
              <span className="font-bold text-slate-900">{answeredCount}</span>
              {" / "}
              <span className="font-bold text-slate-900">{questions.length}</span>
            </div>
          </div>

          {/* Alerts */}
          {error ? (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {info ? (
            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {info}
            </div>
          ) : null}
        </div>

        {/* Questions */}
        <div className="space-y-4">
          {questions?.length ? (
            questions.map((q, idx) => {
              const selected = selectedByQ[q.id] ?? null;
              const isMcq =
                (q.type || "").toLowerCase() === "mcq" ||
                (q.choices?.length ?? 0) > 0;

              return (
                <div
                  key={q.id}
                  className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-sm font-semibold text-slate-600">
                        سوال {idx + 1}{" "}
                        {q.type ? (
                          <span className="ml-2 rounded-lg bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
                            {q.type}
                          </span>
                        ) : null}
                      </div>

                      <div className="mt-2 text-lg font-bold leading-8">
                        {q.text}
                      </div>
                    </div>

                    <div className="shrink-0 rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white">
                      امتیاز: {q.score ?? 0}
                    </div>
                  </div>

                  {/* MCQ */}
                  {isMcq ? (
                    <div className="mt-4 space-y-2">
                      {(q.choices || []).map((c) => {
                        const active = selected === c.id;
                        return (
                          <button
                            key={c.id}
                            onClick={() => {
                              setSelectedByQ((prev) => ({
                                ...prev,
                                [q.id]: c.id,
                              }));
                              saveAnswer(q.id, c.id);
                            }}
                            className={[
                              "w-full rounded-xl border px-4 py-3 text-right transition",
                              active
                                ? "border-blue-300 bg-blue-50 ring-2 ring-blue-200"
                                : "border-slate-200 bg-white hover:bg-slate-50",
                            ].join(" ")}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-sm font-medium">
                                {c.text}
                              </span>
                              <span className="text-lg">
                                {active ? "✅" : "⬜️"}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                      {!q.choices?.length ? (
                        <div className="mt-2 text-sm text-slate-600">
                          گزینه‌ای برای این سوال ثبت نشده.
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    // Non-MCQ placeholder (فعلا چون جدول student_answers فقط choice_id دارد)
                    <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                      این سوال تشریحی است. (برای تشریحی باید یک ستون/جدول جدا برای
                      متن جواب اضافه کنیم.)
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-slate-200">
              <div className="text-lg font-bold">سوالی پیدا نشد</div>
              <div className="mt-2 text-sm text-slate-600">
                اول از بخش معلم چند سوال (MCQ) اضافه کن، بعد برگرد اینجا 😊
              </div>
              <button
                onClick={loadQuestions}
                className="mt-4 rounded-xl bg-slate-900 px-4 py-2 text-white shadow-sm"
              >
                🔁 تلاش دوباره
              </button>
            </div>
          )}
        </div>

        <div className="mt-8 text-center text-xs text-slate-400">
          v1 — Student UI
        </div>
      </div>
    </div>
  );
}
