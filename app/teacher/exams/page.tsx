"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Exam = {
  id: number;
  title: string;
  show_result_to_student: boolean;
  is_published: boolean;
  created_at?: string;
};

export default function TeacherExamsPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("آزمون جدید");
  const [msg, setMsg] = useState<string>("");

  async function load() {
    setLoading(true);
    setMsg("");
    const res = await fetch("/api/teacher/exams", { cache: "no-store" });
    const j = await res.json();
    setExams(j.exams ?? []);
    setLoading(false);
  }

  async function createExam() {
    setMsg("");
    const res = await fetch("/api/teacher/exams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    const j = await res.json();
    if (!res.ok || !j.ok) {
      setMsg("❌ ساخت آزمون ناموفق بود");
      return;
    }
    setMsg("✅ آزمون ساخته شد");
    await load();
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div dir="rtl" style={{ maxWidth: 820, margin: "0 auto", padding: 16 }}>
      <h1 style={{ fontSize: 34, margin: 0 }}>پنل معلم</h1>
      <p style={{ opacity: 0.7, marginTop: 8 }}>مدیریت آزمون‌ها</p>

      <div style={{ background: "#fff", border: "1px solid #eee", borderRadius: 16, padding: 14, marginTop: 16 }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="عنوان آزمون"
            style={{ flex: "1 1 260px", padding: "10px 12px", borderRadius: 12, border: "1px solid #ddd" }}
          />
          <button
            onClick={createExam}
            style={{ padding: "10px 14px", borderRadius: 12, border: "1px solid #111", background: "#111", color: "#fff", fontWeight: 800 }}
          >
            ➕ ساخت آزمون
          </button>
          <button
            onClick={load}
            style={{ padding: "10px 14px", borderRadius: 12, border: "1px solid #ddd", background: "#fff", fontWeight: 800 }}
          >
            🔄 رفرش
          </button>
        </div>

        {msg && <div style={{ marginTop: 10 }}>{msg}</div>}
      </div>

      <div style={{ marginTop: 14, display: "grid", gap: 12 }}>
        {loading ? (
          <div style={{ padding: 12, opacity: 0.7 }}>در حال دریافت…</div>
        ) : exams.length === 0 ? (
          <div style={{ padding: 12, opacity: 0.7 }}>هنوز آزمونی ساخته نشده.</div>
        ) : (
          exams.map((e) => (
            <div key={e.id} style={{ background: "#fff", border: "1px solid #eee", borderRadius: 16, padding: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                <div style={{ fontWeight: 900, fontSize: 18 }}>{e.title} (#{e.id})</div>
                <div style={{ opacity: 0.75 }}>
                  {e.is_published ? "🟢 منتشر شده" : "🟡 پیش‌نویس"}{" "}
                  | نتیجه: {e.show_result_to_student ? "نمایش به دانش‌آموز ✅" : "مخفی ❌"}
                </div>
              </div>

              <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
                <Link
                  href={`/teacher/exams/${e.id}/settings`}
                  style={{ padding: "10px 12px", borderRadius: 12, border: "1px solid #ddd", textDecoration: "none", fontWeight: 800, color: "#111" }}
                >
                  ⚙️ تنظیمات
                </Link>

                <Link
                  href={`/student?exam_id=${e.id}&student_id=1`}
                  style={{ padding: "10px 12px", borderRadius: 12, border: "1px solid #ddd", textDecoration: "none", fontWeight: 800, color: "#111" }}
                >
                  👨‍🎓 لینک تست دانش‌آموز
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
