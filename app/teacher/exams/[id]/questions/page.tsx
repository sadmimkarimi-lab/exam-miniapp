"use client";

import { useEffect, useMemo, useState } from "react";

type Choice = {
  id: number;
  question_id: number;
  text: string;
  is_correct: boolean;
};

type Question = {
  id: number;
  exam_id: number;
  text: string;
  type: "mcq" | "desc";
  score: number;
  choices: Choice[];
};

export default function TeacherExamQuestionsPage({
  params,
}: {
  params: { id: string };
}) {
  const examId = Number(params.id);

  const [loading, setLoading] = useState(true);
  const [savingQ, setSavingQ] = useState(false);
  const [savingChoiceFor, setSavingChoiceFor] = useState<number | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);

  // New question form
  const [qText, setQText] = useState("");
  const [qType, setQType] = useState<"mcq" | "desc">("mcq");
  const [qScore, setQScore] = useState<number>(1);

  // Per-question choice draft
  const [choiceText, setChoiceText] = useState<Record<number, string>>({});
  const [choiceIsCorrect, setChoiceIsCorrect] = useState<Record<number, boolean>>(
    {}
  );

  const title = useMemo(() => `سوالات آزمون #${examId}`, [examId]);

  async function fetchQuestions() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/teacher/questions?exam_id=${examId}`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to fetch questions");
      setQuestions(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e?.message || "خطا در دریافت سوالات");
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!Number.isFinite(examId)) return;
    fetchQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examId]);

  async function addQuestion() {
    const text = qText.trim();
    if (!text) return;

    setSavingQ(true);
    setError(null);

    try {
      const res = await fetch("/api/teacher/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exam_id: examId,
          text,
          score: Number(qScore) || 1,
          type: qType,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to add question");

      setQText("");
      setQType("mcq");
      setQScore(1);

      await fetchQuestions();
    } catch (e: any) {
      setError(e?.message || "خطا در ثبت سوال");
    } finally {
      setSavingQ(false);
    }
  }

  async function addChoice(questionId: number) {
    const text = (choiceText[questionId] || "").trim();
    if (!text) return;

    const is_correct = !!choiceIsCorrect[questionId];

    setSavingChoiceFor(questionId);
    setError(null);

    try {
      const res = await fetch("/api/teacher/choices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question_id: questionId,
          text,
          is_correct,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to add choice");

      // reset drafts
      setChoiceText((prev) => ({ ...prev, [questionId]: "" }));
      setChoiceIsCorrect((prev) => ({ ...prev, [questionId]: false }));

      await fetchQuestions();
    } catch (e: any) {
      setError(e?.message || "خطا در ثبت گزینه");
    } finally {
      setSavingChoiceFor(null);
    }
  }

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ fontSize: 40, marginBottom: 12, direction: "rtl" }}>{title}</h1>

      {error && (
        <div
          style={{
            margin: "12px 0 18px",
            padding: 12,
            borderRadius: 12,
            border: "1px solid #f3b4b4",
            background: "#ffe7e7",
            direction: "ltr",
          }}
        >
          {error}
        </div>
      )}

      {/* Add Question */}
      <div
        style={{
          border: "1px solid #eee",
          borderRadius: 16,
          padding: 16,
          marginBottom: 18,
          direction: "rtl",
        }}
      >
        <div style={{ marginBottom: 10, fontSize: 18, fontWeight: 700 }}>
          افزودن سوال
        </div>

        <textarea
          value={qText}
          onChange={(e) => setQText(e.target.value)}
          placeholder="متن سوال را بنویس..."
          style={{
            width: "100%",
            minHeight: 90,
            padding: 12,
            borderRadius: 12,
            border: "1px solid #ddd",
            outline: "none",
            resize: "vertical",
            fontSize: 16,
          }}
        />

        <div
          style={{
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
            marginTop: 12,
            alignItems: "center",
          }}
        >
          <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span>نوع:</span>
            <select
              value={qType}
              onChange={(e) => setQType(e.target.value as any)}
              style={{ padding: "8px 10px", borderRadius: 10, border: "1px solid #ddd" }}
            >
              <option value="mcq">چهارگزینه‌ای (mcq)</option>
              <option value="desc">تشریحی (desc)</option>
            </select>
          </label>

          <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span>امتیاز:</span>
            <input
              type="number"
              value={qScore}
              onChange={(e) => setQScore(Number(e.target.value))}
              min={0}
              style={{ width: 90, padding: "8px 10px", borderRadius: 10, border: "1px solid #ddd" }}
            />
          </label>

          <button
            onClick={addQuestion}
            disabled={savingQ || !qText.trim()}
            style={{
              marginRight: "auto",
              padding: "10px 14px",
              borderRadius: 12,
              border: "1px solid #111",
              background: savingQ ? "#333" : "#111",
              color: "#fff",
              fontWeight: 700,
              cursor: savingQ ? "not-allowed" : "pointer",
            }}
          >
            {savingQ ? "در حال ثبت..." : "➕ افزودن سوال"}
          </button>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div style={{ padding: 12, direction: "rtl" }}>در حال دریافت...</div>
      ) : questions.length === 0 ? (
        <div style={{ padding: 12, direction: "rtl" }}>هنوز سوالی ثبت نشده.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {questions.map((q, idx) => (
            <div
              key={q.id}
              style={{
                border: "1px solid #eee",
                borderRadius: 16,
                padding: 16,
                direction: "rtl",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                <div style={{ fontSize: 18, fontWeight: 800 }}>
                  {idx + 1}. {q.text}
                </div>
                <div style={{ opacity: 0.7, fontWeight: 700 }}>
                  ({q.type}) — امتیاز: {q.score}
                </div>
              </div>

              {/* Choices (only for mcq) */}
              {q.type === "mcq" && (
                <div style={{ marginTop: 14 }}>
                  <div style={{ fontWeight: 800, marginBottom: 8 }}>گزینه‌ها</div>

                  {q.choices?.length ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {q.choices.map((c) => (
                        <div
                          key={c.id}
                          style={{
                            padding: 10,
                            borderRadius: 12,
                            border: "1px solid #e8e8e8",
                            background: c.is_correct ? "#e9fff0" : "#fff",
                            display: "flex",
                            justifyContent: "space-between",
                            gap: 10,
                          }}
                        >
                          <span>{c.text}</span>
                          <span style={{ fontWeight: 800 }}>
                            {c.is_correct ? "✅ صحیح" : "—"}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ opacity: 0.7 }}>هنوز گزینه‌ای ثبت نشده.</div>
                  )}

                  {/* Add Choice */}
                  <div
                    style={{
                      marginTop: 12,
                      display: "flex",
                      gap: 10,
                      flexWrap: "wrap",
                      alignItems: "center",
                    }}
                  >
                    <input
                      value={choiceText[q.id] || ""}
                      onChange={(e) =>
                        setChoiceText((prev) => ({ ...prev, [q.id]: e.target.value }))
                      }
                      placeholder="متن گزینه..."
                      style={{
                        flex: 1,
                        minWidth: 220,
                        padding: "10px 12px",
                        borderRadius: 12,
                        border: "1px solid #ddd",
                        outline: "none",
                      }}
                    />

                    <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <input
                        type="checkbox"
                        checked={!!choiceIsCorrect[q.id]}
                        onChange={(e) =>
                          setChoiceIsCorrect((prev) => ({ ...prev, [q.id]: e.target.checked }))
                        }
                      />
                      جواب صحیح
                    </label>

                    <button
                      onClick={() => addChoice(q.id)}
                      disabled={
                        savingChoiceFor === q.id || !(choiceText[q.id] || "").trim()
                      }
                      style={{
                        padding: "10px 14px",
                        borderRadius: 12,
                        border: "1px solid #111",
                        background: savingChoiceFor === q.id ? "#333" : "#111",
                        color: "#fff",
                        fontWeight: 800,
                        cursor: savingChoiceFor === q.id ? "not-allowed" : "pointer",
                      }}
                    >
                      {savingChoiceFor === q.id ? "ثبت..." : "➕ افزودن گزینه"}
                    </button>
                  </div>

                  <div style={{ marginTop: 10, opacity: 0.7, fontSize: 13 }}>
                    نکته: اگر «جواب صحیح» را تیک بزنی، API خودش بقیه گزینه‌های همان سوال را
                    غلط می‌کند.
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
