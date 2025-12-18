'use client';

import { useEffect, useState } from 'react';

type Choice = {
  id: number;
  text: string;
};

type Question = {
  id: number;
  text: string;
  type: string;
  score: number;
  choices?: Choice[];
  selected_choice_id?: number | null;
};

export default function StudentPage() {
  const exam_id = 1;
  const student_id = 1;

  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [grading, setGrading] = useState(false);
  const [graded, setGraded] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // گرفتن سوالات
  const fetchQuestions = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/student/questions?exam_id=${exam_id}&student_id=${student_id}`
      );
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'خطا در دریافت سوالات');

      setQuestions(data.questions || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // ارسال جواب
  const submitAnswer = async (question_id: number, choice_id: number) => {
    if (graded) return;

    setQuestions(prev =>
      prev.map(q =>
        q.id === question_id ? { ...q, selected_choice_id: choice_id } : q
      )
    );

    await fetch('/api/student/answers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        student_id,
        question_id,
        selected_choice_id: choice_id,
      }),
    });
  };

  // تصحیح (فقط یک بار)
  const gradeExam = async () => {
    if (graded) return;

    setGrading(true);
    setError(null);

    try {
      const res = await fetch('/api/student/grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id, exam_id }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'خطا در تصحیح');

      setResult(data);
      setGraded(true);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setGrading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  return (
    <div style={{ maxWidth: 800, margin: 'auto', padding: 16 }}>
      <h1>صفحه دانش‌آموز</h1>
      <p>آزمون #{exam_id} — دانش‌آموز #{student_id}</p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button onClick={fetchQuestions} disabled={loading}>
          🔄 فرش سوالات
        </button>

        <button onClick={gradeExam} disabled={graded || grading}>
          ✅ پایان آزمون و تصحیح
        </button>
      </div>

      {error && (
        <div style={{ color: 'red', marginBottom: 16 }}>
          ❌ {error}
        </div>
      )}

      {graded && result && (
        <div
          style={{
            background: '#e6ffe6',
            padding: 12,
            borderRadius: 8,
            marginBottom: 16,
          }}
        >
          🎉 نتیجه آزمون  
          <div>
            نمره: {result.score} از {result.total_score}
          </div>
          <div>
            پاسخ صحیح: {result.correct_count} / {result.total_questions}
          </div>
        </div>
      )}

      {loading && <p>در حال دریافت سوالات...</p>}

      {!loading && questions.length === 0 && (
        <p>😅 سوالی پیدا نشد. اول معلم سوال اضافه کن.</p>
      )}

      {questions.map((q, index) => (
        <div
          key={q.id}
          style={{
            border: '1px solid #ccc',
            borderRadius: 8,
            padding: 12,
            marginBottom: 12,
          }}
        >
          <div style={{ fontWeight: 'bold' }}>
            سوال {index + 1} ({q.type}) — امتیاز: {q.score}
          </div>
          <p>{q.text}</p>

          {q.type === 'mcq' && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {q.choices?.map(c => (
                <button
                  key={c.id}
                  disabled={graded}
                  onClick={() => submitAnswer(q.id, c.id)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 6,
                    border:
                      q.selected_choice_id === c.id
                        ? '2px solid green'
                        : '1px solid #aaa',
                    background:
                      q.selected_choice_id === c.id
                        ? '#e6ffe6'
                        : '#f5f5f5',
                    cursor: graded ? 'not-allowed' : 'pointer',
                  }}
                >
                  {c.text}
                  {q.selected_choice_id === c.id && ' ✅'}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
