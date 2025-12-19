"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Choice = {
  id: number;
  text: string;
  is_correct: boolean;
};

type Question = {
  id: number;
  text: string;
  type: "mcq" | "desc";
  score: number;
  choices: Choice[];
};

export default function QuestionsPage() {
  const { id: examId } = useParams();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [text, setText] = useState("");
  const [type, setType] = useState<"mcq" | "desc">("mcq");

  async function load() {
    const res = await fetch(`/api/teacher/questions?exam_id=${examId}`, {
      cache: "no-store",
    });
    const j = await res.json();
    setQuestions(j.questions ?? []);
  }

  async function addQuestion() {
    if (!text) return alert("متن سوال خالیه");

    await fetch("/api/teacher/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        exam_id: examId,
        text,
        type,
        score: 1,
      }),
    });

    setText("");
    load();
  }

  async function deleteQuestion(id: number) {
    if (!confirm("سوال حذف شود؟")) return;
    await fetch(`/api/teacher/questions/${id}`, { method: "DELETE" });
    load();
  }

  async function addChoice(question: Question, text: string, isCorrect: boolean) {
    if (question.choices.length >= 4)
      return alert("حداکثر ۴ گزینه مجاز است");

    await fetch("/api/teacher/choices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question_id: question.id,
        text,
        is_correct: isCorrect,
      }),
    });

    load();
  }

  async function deleteChoice(id: number) {
    await fetch(`/api/teacher/choices/${id}`, { method: "DELETE" });
    load();
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div dir="rtl" style={{ maxWidth: 800, margin: "0 auto", padding: 16 }}>
      <h2>سوالات آزمون #{examId}</h2>

      {/* افزودن سوال */}
      <div style={{ background: "#fff", padding: 12, borderRadius: 12 }}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="متن سوال..."
          style={{ width: "100%", padding: 8 }}
        />

        <select value={type} onChange={(e) => setType(e.target.value as any)}>
          <option value="mcq">چهارگزینه‌ای</option>
          <option value="desc">تشریحی</option>
        </select>

        <button onClick={addQuestion}>➕ افزودن سوال</button>
      </div>

      {/* لیست سوالات */}
      {questions.map((q) => (
        <div key={q.id} style={{ background: "#f9f9f9", marginTop: 16, padding: 12, borderRadius: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <b>{q.text}</b>
            <button onClick={() => deleteQuestion(q.id)}>🗑 حذف سوال</button>
          </div>

          {/* گزینه‌ها */}
          {q.type === "mcq" && (
            <div style={{ marginTop: 10 }}>
              {q.choices.map((c) => (
                <div key={c.id} style={{ display: "flex", gap: 8 }}>
                  <span>{c.text} {c.is_correct && "✅"}</span>
                  <button onClick={() => deleteChoice(c.id)}>❌</button>
                </div>
              ))}

              {q.choices.length < 4 && (
                <AddChoiceForm onAdd={(t, ok) => addChoice(q, t, ok)} />
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function AddChoiceForm({ onAdd }: { onAdd: (text: string, ok: boolean) => void }) {
  const [text, setText] = useState("");
  const [ok, setOk] = useState(false);

  return (
    <div style={{ marginTop: 8 }}>
      <input value={text} onChange={(e) => setText(e.target.value)} placeholder="متن گزینه" />
      <label>
        <input type="checkbox" checked={ok} onChange={(e) => setOk(e.target.checked)} />
        جواب صحیح
      </label>
      <button onClick={() => { onAdd(text, ok); setText(""); setOk(false); }}>
        ➕ افزودن گزینه
      </button>
    </div>
  );
}
