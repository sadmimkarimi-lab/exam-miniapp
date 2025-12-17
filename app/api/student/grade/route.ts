import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { student_id, exam_id } = await req.json();

    if (!student_id || !exam_id) {
      return NextResponse.json(
        { error: "Missing student_id or exam_id" },
        { status: 400 }
      );
    }

    // 1) سوالات آزمون (برای total_score و score هر سوال)
    const { data: questions, error: qErr } = await supabase
      .from("questions")
      .select("id, score")
      .eq("exam_id", exam_id);

    if (qErr) throw qErr;

    const questionIds = (questions ?? []).map((q: any) => q.id);
    const total_score = (questions ?? []).reduce(
      (sum: number, q: any) => sum + (q.score ?? 0),
      0
    );

    if (questionIds.length === 0) {
      return NextResponse.json({
        ok: true,
        exam_id,
        student_id,
        score: 0,
        total_score,
        correct_count: 0,
        total_questions: 0,
        saved: false,
      });
    }

    // 2) جواب‌های دانش‌آموز
    const { data: answers, error: aErr } = await supabase
      .from("student_answers")
      .select("question_id, selected_choice_id")
      .eq("student_id", student_id)
      .in("question_id", questionIds);

    if (aErr) throw aErr;

    const answerMap = new Map<number, number>();
    (answers ?? []).forEach((a: any) =>
      answerMap.set(a.question_id, a.selected_choice_id)
    );

    // 3) جواب‌های صحیح
    const { data: corrects, error: cErr } = await supabase
      .from("correct_answers")
      .select("question_id, correct_choice_id")
      .in("question_id", questionIds);

    if (cErr) throw cErr;

    const correctMap = new Map<number, number>();
    (corrects ?? []).forEach((c: any) =>
      correctMap.set(c.question_id, c.correct_choice_id)
    );

    // 4) محاسبه
    let score = 0;
    let correct_count = 0;

    for (const q of questions ?? []) {
      const chosen = answerMap.get(q.id);
      const correct = correctMap.get(q.id);

      if (chosen && correct && chosen === correct) {
        correct_count += 1;
        score += q.score ?? 0;
      }
    }

    // 5) ذخیره نتیجه (اگر جدول/ستون‌ها مطابق نباشه، فقط نتیجه رو برمی‌گردونیم)
    let saved = false;
    try {
      // اگر unique روی (student_id, exam_id) داری بهتره upsert کنی
      const { error: rErr } = await supabase.from("exam_results").upsert(
        {
          student_id,
          exam_id,
          score,
          total_score,
          correct_count,
          total_questions: (questions ?? []).length,
        },
        { onConflict: "student_id,exam_id" }
      );

      if (!rErr) saved = true;
    } catch {
      saved = false;
    }

    return NextResponse.json({
      ok: true,
      exam_id,
      student_id,
      score,
      total_score,
      correct_count,
      total_questions: (questions ?? []).length,
      saved,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Server error" },
      { status: 500 }
    );
  }
}
