"use client";

import { useEffect, useState } from "react";

type Exam = {
  id: number;
  title: string;
  show_result_to_student: boolean;
  is_published: boolean;
};

export default function ExamSettingsPage({ params }: { params: { id: string } }) {
  const examId = Number(params.id);

  const [exam, setExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  async function load() {
    setLoading(true);
    setMsg("");
    const res = await fetch(`/api/teacher/exams/${examId}`, { cache: "no-store" });
    const j = await res.json();
    setExam(j.exam);
    setLoading(false);
  }

  async function save(patch: Partial<Exam>) {
    setSaving(true);
    setMsg("");
    const res = await fetch(`/api/teacher/exams/${examId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const j = await res.json();
    if (!res.ok || !j.ok) {
      setMsg("❌ ذخیره انجام نشد");
      setSaving(false);
      return;
    }
    setExam(j.exam);
    setMsg("✅ ذخیره شد");
    setSaving(false);
  }

  useEffect(() => {
    load();
  }, []);

  if (loading) return <div dir="rtl" style={{ padding: 16 }}>در حال بارگذاری…</div>;
  if (!exam) return <div dir="rtl" style={{ padding: 16 }}>آزمون پیدا نشد.</div>;

  return (
    <div dir="rtl" style={{ maxWidth: 820, margin: "0 auto", padding: 16 }}>
      <h1 style={{ fontSize: 30, margin: 0 }}>تنظیمات آزمون #{exam.id}</h1>

      <div style={{ background: "#fff", border: "1px solid #eee", borderRadius: 16, padding: 14, marginTop: 16 }}>
        <label style={{ display: "block", fontWeight: 900, marginBottom: 8 }}>عنوان آزمون</label>
        <input
          value={exam.title}
          onChange={(e) => setExam({ ...exam, title: e.target.value })}
          style={{ width: "100%", padding: "10px 12px", borderRadius: 12, border: "1px solid #ddd" }}
        />

        <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
          <label style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <input
              type="checkbox"
              checked={exam.show_result_to_student}
              onChange={(e) => setExam({ ...exam, show_result_to_student: e.target.checked })}
            />
            نمایش نتیجه به دانش‌آموز بعد از تصحیح
          </label>

          <label style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <input
              type="checkbox"
              checked={exam.is_published}
              onChange={(e) => setExam({ ...exam, is_published: e.target.checked })}
            />
            آزمون منتشر/فعال باشد
          </label>
        </div>

        <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            disabled={saving}
            onClick={() => save({ title: exam.title, show_result_to_student: exam.show_result_to_student, is_published: exam.is_published })}
            style={{ padding: "10px 14px", borderRadius: 12, border: "1px solid #111", background: "#111", color: "#fff", fontWeight: 900 }}
          >
            {saving ? "در حال ذخیره…" : "💾 ذخیره"}
          </button>

          <a
            href={`/student?exam_id=${exam.id}&student_id=1`}
            style={{ padding: "10px 14px", borderRadius: 12, border: "1px solid #ddd", textDecoration: "none", fontWeight: 900, color: "#111" }}
          >
            👨‍🎓 تست دانش‌آموز
          </a>
        </div>

        {msg && <div style={{ marginTop: 10 }}>{msg}</div>}
      </div>
    </div>
  );
}
