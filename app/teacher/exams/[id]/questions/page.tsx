"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Question = {
  id: number;
  text: string;
  type: "mcq" | "desc";
  choices: Choice[];
};

type Choice = {
  id: number;
  text: string;
  is_correct: boolean;
};

export default function QuestionsPage() {
  const { id: examId } = useParams();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [text, setText] = useState("");
  const [type, setType] = useState<"mcq" | "desc">("mcq");

  useEffect(() => {
    fetch(`/api/teacher/questions?exam_id=${examId}`)
      .then(res => res.json())
      .then(setQuestions);
  }, [examId]);

  async function addQuestion() {
    if (!text) return;

    await fetch("/api/teacher/questions", {
      method: "POST",
      body: JSON.stringify({
        exam_id: examId,
        text,
        type,
        score: 1,
      }),
    });

    setText("");
    location.reload();
  }

  async function deleteQuestion(id: number) {
    await fetch(`/api/teacher/questions/${id}`, { method: "DELETE" });
    location.reload();
  }

  async function addChoice(questionId: number, text: string, isCorrect: boolean) {
    await fetch("/api/teacher/choices", {
      method: "POST",
      body: JSON.stringify({
        question_id: questionId,
        text,
        is_correct: isCorrect,
      }),
    });
    location.reload();
  }

  async function deleteChoice(id: number) {
    await fetch(`/api/teacher/choices/${id}`, { method: "DELETE" });
    location.reload();
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>سوالات آزمون #{examId}</h2>

      <textarea
        placeholder="متن سوال"
        value={text}
        onChange={e => setText(e.target.value)}
      />

      <br />

      <select value={type} onChange={e => setType(e.target.value as any)}>
        <option value="mcq">چهارگزینه‌ای</option>
        <option value="desc">تشریحی</option>
      </select>

      <br />
      <button onClick={addQuestion}>➕ افزودن سوال</button>

      <hr />

      {questions.map(q => (
        <div key={q.id} style={{ border: "1px solid #ccc", padding: 10 }}>
          <b>{q.text}</b> ({q.type})
          <button onClick={() => deleteQuestion(q.id)}>🗑 حذف سوال</button>

          {q.type === "mcq" && (
            <>
              {q.choices.map(c => (
                <div key={c.id}>
                  {c.text} {c.is_correct && "✅"}
                  <button onClick={() => deleteChoice(c.id)}>❌</button>
                </div>
              ))}

              {q.choices.length < 4 && (
                <AddChoiceForm
                  onAdd={(t, c) => addChoice(q.id, t, c)}
                />
              )}
            </>
          )}
        </div>
      ))}
    </div>
  );
}

function AddChoiceForm({
  onAdd,
}: {
  onAdd: (text: string, isCorrect: boolean) => void;
}) {
  const [text, setText] = useState("");
  const [correct, setCorrect] = useState(false);

  return (
    <div>
      <input
        placeholder="متن گزینه"
        value={text}
        onChange={e => setText(e.target.value)}
      />
      <label>
        <input
          type="checkbox"
          checked={correct}
          onChange={e => setCorrect(e.target.checked)}
        />
        صحیح
      </label>
      <button
        onClick={() => {
          onAdd(text, correct);
          setText("");
          setCorrect(false);
        }}
      >
        افزودن گزینه
      </button>
    </div>
  );
}
