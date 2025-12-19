"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function ExamQuestionsPage() {
  const { id } = useParams();

  const [text, setText] = useState("");
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  async function loadQuestions() {
    setLoading(true);
    try {
      const res = await fetch(`/api/teacher/questions?exam_id=${id}`);
      const data = await res.json();
      setQuestions(data.questions || []);
    } finally {
      setLoading(false);
    }
  }

  async function addQuestion() {
    if (!text.trim()) return;

    await fetch("/api/teacher/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        exam_id: Number(id),
        text,
        type: "mcq",
        score: 1,
      }),
    });

    setText("");
    loadQuestions();
  }

  useEffect(() => {
    loadQuestions();
  }, []);

  return (
    <div style={{ padding: 24, maxWidth: 700, margin: "0 auto" }}>
      <h1 style={{ fontSize: 28, marginBottom: 12 }}>سوالات آزمون #{id}</h1>

      <div style={{ background: "#fff", border: "1px solid #eee", borderRadius: 12, padding: 12 }}>
        <textarea
          placeholder="متن سوال را بنویس..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          style={{ width: "100%", minHeight: 90, padding: 10, borderRadius: 10, border: "1px solid #ddd" }}
        />

        <button
          onClick={addQuestion}
          style={{
            marginTop: 10,
            padding: "10px 14px",
            borderRadius: 10,
            border: "none",
            background: "#111",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          ➕ افزودن سوال
        </button>
      </div>

      <div style={{ marginTop: 18 }}>
        {loading ? (
          <div>در حال دریافت سوالات...</div>
        ) : questions.length === 0 ? (
          <div>هنوز سوالی ثبت نشده.</div>
        ) : (
          questions.map((q, i) => (
            <div
              key={q.id}
              style={{
                marginTop: 10,
                background: "#fff",
                border: "1px solid #eee",
                borderRadius: 12,
                padding: 12,
              }}
            >
              <b>{i + 1}.</b> {q.text}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
