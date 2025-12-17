"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type QuestionType = "mcq" | "desc";

type QuestionRow = {
  id: number;
  exam_id: number;
  text: string;
  score: number | null;
  type: QuestionType | null;
  created_at?: string;
};

type ChoiceRow = {
  id: number;
  question_id: number;
  text: string;
  created_at?: string;
};

type QuestionWithChoices = QuestionRow & {
  choices: ChoiceRow[];
};

export default function StudentPage() {
  // فعلاً ثابت؛ بعداً می‌تونیم از querystring/route params بگیریم
  const examId = 1;
  const studentId = 1;

  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [questions, setQuestions] = useState<QuestionWithChoices[]>([]);
  const [selected, setSelected] = useState<Record<number, number>>({}); // question_id -> choice_id

  const [submitting, setSubmitting] = useState(false);
  const [finishMsg, setFinishMsg] = useState<string | null>(null);

  const [result, setResult] = useState<{
    total: number;
    correct: number;
    score: number;
  } | null>(null);

  const totalScore = useMemo(() => {
    return questions.reduce((sum, q) => sum + (q.score ?? 1), 0);
  }, [questions]);

  async function fetchQuestions() {
    setLoading(true);
    setFetchError(null);

    try {
      // 1) سوال‌ها
      const { data: qData, error: qErr } = await supabase
        .from("questions")
        .select("id, exam_id, text, score, type, created_at")
        .eq("exam_id", examId)
        .order("id", { ascending: true });

      if (qErr) throw new Error(qErr.message);

      const qs = (qData ?? []) as QuestionRow[];

      if (qs.length === 0) {
        setQuestions([]);
        setLoading(false);
        return;
      }

      // 2) گزینه‌ها (فقط برای سوال‌های mcq هم می‌گیریم، مشکلی نداره)
      const qIds = qs.map((q) => q.id);

      const { data: cData, error: cErr } = await supabase
        .from("choices")
        .select("id, question_id, text, created_at")
        .in("question_id", qIds)
        .order("id", { ascending: true });

      if (cErr) throw new Error(cErr.message);

      const choices = (cData ?? []) as ChoiceRow[];

      // 3) ترکیب
      const map = new Map<number, ChoiceRow[]>();
      for (const c of choices) {
        if (!map.has(c.question_id)) map.set(c.question_id, []);
        map.get(c.question_id)!.push(c);
      }

      const merged: QuestionWithChoices[] = qs.map((q) => ({
        ...q,
        type: (q.type ?? "mcq") as QuestionType, // اگر null بود، فرض می‌گیریم mcq
        score: q.score ?? 1,
        choices: map.get(q.id) ?? [],
      }));

      setQuestions(merged);
    } catch (e: any) {
      setFetchError(e?.message ?? "Failed to fetch questions");
    } finally {
      setLoading(false);
    }
  }

  async function saveAnswer(questionId: number, choiceId: number) {
    // UI state
    setSelected((prev) => ({ ...prev, [questionId]: choiceId }));
    setFinishMsg(null);

    // ذخیره در DB با API که فقط POST دارد
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

      if (!res.ok) {
        const t = await res.text();
        throw new Error(`Save failed (${res.status}): ${t}`);
      }
    } catch (e: any) {
      // اگر ذخیره fail شد، پیام بده ولی انتخاب رو نگه می‌داریم
      setFinishMsg(e?.message ?? "خطا در ثبت پاسخ");
    }
  }

  async function finishAndGrade() {
    setSubmitting(true);
    setFinishMsg(null);

    try {
      // 1) correct_answers برای سوال‌های همین آزمون
      const qIds = questions.map((q) => q.id);

      const { data: caData, error: caErr } = await supabase
        .from("correct_answers")
        .select("question_id, correct_choice_id")
        .in("question_id", qIds);

      if (caErr) throw new Error(caErr.message);

      const correctMap = new Map<number, number>();
      for (const row of caData ?? []) {
        correctMap.set(row.question_id, row.correct_choice_id);
      }

      // 2) محاسبه
      let correctCount = 0;
      let score = 0;
      let total = 0;

      for (const q of questions) {
        // فقط سوال‌های mcq که correct_answer دارند را نمره می‌دهیم
        if (q.type !== "mcq") continue;

        const correctChoice = correctMap.get(q.id);
        if (!correctChoice) continue;

        total += q.score ?? 1;

        const picked = selected[q.id];
        if (picked && picked === correctChoice) {
          correctCount += 1;
          score += q.score ?? 1;
        }
      }

      setResult({ total, correct: correctCount, score });

      // 3) ذخیره نتیجه در exam_results (اگر جدول رو داری)
      // ستون‌ها رو فرض گرفتیم: exam_id, student_id, score, total_score, created_at
      const { error: insErr } = await supabase.from("exam_results").insert({
        exam_id: examId,
        student_id: studentId,
        score,
        total_score: total,
      });

      if (insErr) {
        // اگر ستونا فرق داره، فقط پیام می‌دیم
        setFinishMsg(
          `نمره محاسبه شد ✅ ولی ذخیره نتیجه مشکل داشت: ${insErr.message}`
        );
      } else {
        setFinishMsg("✅ آزمون تصحیح شد و نتیجه ذخیره شد");
      }
    } catch (e: any) {
      setFinishMsg(e?.message ?? "خطا در تصحیح آزمون");
    } finally {
      setSubmitting(false);
    }
  }

  function resetLocal() {
    setSelected({});
    setResult(null);
    setFinishMsg(null);
  }

  useEffect(() => {
    fetchQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main
      style={{
        maxWidth: 720,
        margin: "0 auto",
        padding: "24px 16px 64px",
        direction: "rtl",
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
      }}
    >
      <header style={{ textAlign: "center", marginBottom: 18 }}>
        <h1 style={{ fontSize: 28, margin: "8px 0" }}>صفحه دانش‌آموز</h1>
        <div style={{ opacity: 0.7 }}>آزمون #{examId} — دانش‌آموز #{studentId}</div>
      </header>

      <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 14 }}>
        <button
          onClick={fetchQuestions}
          disabled={loading}
          style={btnStyle("secondary")}
        >
          ↩️ فرش سوالات
        </button>

        <button
          onClick={finishAndGrade}
          disabled={loading || submitting || questions.length === 0}
          style={btnStyle("primary")}
        >
          ✅ پایان آزمون و تصحیح
        </button>

        <button
          onClick={resetLocal}
          disabled={loading || submitting}
          style={btnStyle("secondary")}
        >
          🔄 ریست انتخاب‌ها
        </button>
      </div>

      {fetchError && (
        <div style={alertStyle("error")}>
          {fetchError}
        </div>
      )}

      {finishMsg && (
        <div style={alertStyle("info")}>
          {finishMsg}
        </div>
      )}

      {result && (
        <div style={resultCard}>
          <div style={{ fontSize: 20, fontWeight: 700 }}>🎉 نتیجه آزمون</div>
          <div style={{ marginTop: 6 }}>
            درست: <b>{result.correct}</b>
          </div>
          <div style={{ marginTop: 6 }}>
            نمره: <b>{result.score}</b> از <b>{result.total}</b>
          </div>
        </div>
      )}

      <div style={{ marginTop: 18, opacity: 0.75 }}>
        مجموع امتیاز آزمون (براساس سوال‌ها): {totalScore}
      </div>

      <section style={{ marginTop: 14 }}>
        {loading ? (
          <div style={{ padding: 16, opacity: 0.7 }}>در حال دریافت سوالات...</div>
        ) : questions.length === 0 ? (
          <div style={{ padding: 16, opacity: 0.7 }}>
            سوالی پیدا نشد. (اول با دکمه‌های معلم چند سوال بساز)
          </div>
        ) : (
          questions.map((q) => (
            <div key={q.id} style={card}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                <div style={{ fontWeight: 700 }}>
                  سوال {q.id}{" "}
                  {q.type === "mcq" ? <span style={{ opacity: 0.6 }}>(mcq)</span> : <span style={{ opacity: 0.6 }}>(تشریحی)</span>}
                </div>
                <div style={{ opacity: 0.65 }}>امتیاز: {q.score ?? 1}</div>
              </div>

              <div style={{ marginTop: 10, fontSize: 16 }}>{q.text}</div>

              {q.type === "desc" ? (
                <div style={{ marginTop: 10, padding: 12, borderRadius: 12, background: "#fafafa", opacity: 0.8 }}>
                  این سوال تشریحی است (فعلاً توی نسخه‌ی ساده، فقط نمایش داده می‌شود).
                </div>
              ) : (
                <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
                  {q.choices.map((c) => {
                    const isPicked = selected[q.id] === c.id;
                    return (
                      <button
                        key={c.id}
                        onClick={() => saveAnswer(q.id, c.id)}
                        disabled={submitting}
                        style={{
                          ...choiceBtn,
                          ...(isPicked ? pickedChoice : {}),
                        }}
                      >
                        <span>{c.text}</span>
                        {isPicked && <span style={{ marginRight: 8 }}>✅</span>}
                      </button>
                    );
                  })}
                  {q.choices.length === 0 && (
                    <div style={{ opacity: 0.7 }}>
                      برای این سوال گزینه‌ای ثبت نشده.
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </section>
    </main>
  );
}

function btnStyle(kind: "primary" | "secondary"): React.CSSProperties {
  const base: React.CSSProperties = {
    border: "1px solid #ddd",
    padding: "12px 14px",
    borderRadius: 14,
    cursor: "pointer",
    fontWeight: 700,
    minWidth: 150,
  };
  if (kind === "primary") {
    return { ...base, background: "#111", color: "#fff", borderColor: "#111" };
  }
  return { ...base, background: "#fff", color: "#111" };
}

function alertStyle(kind: "error" | "info"): React.CSSProperties {
  return {
    marginTop: 10,
    padding: "12px 14px",
    borderRadius: 14,
    border: "1px solid",
    borderColor: kind === "error" ? "#ffb4b4" : "#c7d2fe",
    background: kind === "error" ? "#fff1f1" : "#eef2ff",
    color: "#111",
  };
}

const card: React.CSSProperties = {
  marginTop: 14,
  border: "1px solid #e7e7e7",
  borderRadius: 18,
  padding: 16,
  background: "#fff",
};

const choiceBtn: React.CSSProperties = {
  border: "1px solid #e6e6e6",
  borderRadius: 14,
  padding: "14px 14px",
  background: "#fff",
  cursor: "pointer",
  textAlign: "right",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  fontSize: 15,
};

const pickedChoice: React.CSSProperties = {
  background: "#e8f3ff",
  borderColor: "#b6dcff",
};

const resultCard: React.CSSProperties = {
  marginTop: 12,
  padding: 16,
  borderRadius: 18,
  border: "1px solid #b7f0c1",
  background: "#f1fff3",
};
