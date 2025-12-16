"use client";


import { useState } from "react";

async function post(url: string, body: any) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const txt = await res.text();
  try {
    return JSON.parse(txt);
  } catch {
    return txt;
  }
}

export default function Page() {
  const [log, setLog] = useState<any>("");

  async function createExam() {
    const out = await post("/api/teacher/exams", {
      teacher_id: 1,
      title: "آزمون شماره ۱",
    });
    setLog(out);
  }

  async function addEssayQuestion() {
    const out = await post("/api/teacher/questions", {
      exam_id: 1,
      type: "essay",
      text: "به صورت تشریحی توضیح بده…",
    });
    setLog(out);
  }

  async function addMcqQuestion() {
    const out = await post("/api/teacher/questions", {
      exam_id: 1,
      type: "mcq",
      text: "۲ + ۲ چند می‌شود؟",
      choices: ["1", "2", "4", "5"],
      correct_index: 2,
    });
    setLog(out);
  }

  return (
    <main style={{ maxWidth: 720, margin: "24px auto", padding: 16, fontFamily: "sans-serif", direction: "rtl" }}>
      <h1 style={{ fontSize: 20, fontWeight: 800 }}>تست API (مرحله ۳)</h1>
      <p style={{ opacity: 0.8 }}>
        این دکمه‌ها مستقیماً API را صدا می‌زنند. نتیجه پایین نمایش داده می‌شود.
      </p>

      <div style={{ display: "grid", gap: 10, marginTop: 16 }}>
        <button style={{ padding: 12, borderRadius: 12, border: "1px solid #ddd" }} onClick={createExam}>
          1) ساخت آزمون
        </button>
        <button style={{ padding: 12, borderRadius: 12, border: "1px solid #ddd" }} onClick={addEssayQuestion}>
          2) افزودن سوال تشریحی (برای exam_id=1)
        </button>
        <button style={{ padding: 12, borderRadius: 12, border: "1px solid #ddd" }} onClick={addMcqQuestion}>
          3) افزودن سوال چهارگزینه‌ای (برای exam_id=1)
        </button>
      </div>

      <pre style={{ marginTop: 16, padding: 12, borderRadius: 12, background: "#f6f6f6", overflowX: "auto" }}>
        {typeof log === "string" ? log : JSON.stringify(log, null, 2)}
      </pre>
    </main>
  );
}
