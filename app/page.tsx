"use client";

import { useState } from "react";

export default function Page() {
  const [result, setResult] = useState<any>(null);

  // 🔹 این ID استاد است (فعلاً دستی)
  const TEACHER_ID = 1;

  async function createExam() {
    setResult(null);

    const res = await fetch("/api/teacher/exams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        teacher_id: TEACHER_ID,
        title: "آزمون تستی",
      }),
    });

    const data = await res.json();
    setResult(data);
  }

  async function addEssayQuestion() {
    setResult(null);

    const res = await fetch("/api/teacher/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        exam_id: 1,
        type: "essay",
        text: "این یک سوال تشریحی است",
      }),
    });

    const data = await res.json();
    setResult(data);
  }

  async function addMCQQuestion() {
    setResult(null);

    const res = await fetch("/api/teacher/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        exam_id: 1,
        type: "mcq",
        text: "پایتخت ایران کدام است؟",
        choices: ["تهران", "اصفهان", "شیراز", "تبریز"],
        correct_index: 0,
      }),
    });

    const data = await res.json();
    setResult(data);
  }

  return (
    <main style={{ padding: 24, maxWidth: 600, margin: "0 auto" }}>
      <h2>تست API (مرحله ۳)</h2>
      <p>این دکمه‌ها مستقیم API را صدا می‌زنند.</p>

      <button onClick={createExam} style={btn}>
        1) ساخت آزمون
      </button>

      <button onClick={addEssayQuestion} style={btn}>
        2) افزودن سوال تشریحی
      </button>

      <button onClick={addMCQQuestion} style={btn}>
        3) افزودن سوال چهارگزینه‌ای
      </button>

      <pre style={box}>
        {result ? JSON.stringify(result, null, 2) : "—"}
      </pre>
    </main>
  );
}

const btn: React.CSSProperties = {
  width: "100%",
  padding: 12,
  marginTop: 12,
  borderRadius: 8,
  border: "1px solid #ccc",
};

const box: React.CSSProperties = {
  marginTop: 20,
  padding: 12,
  background: "#f5f5f5",
  borderRadius: 8,
  whiteSpace: "pre-wrap",
};
