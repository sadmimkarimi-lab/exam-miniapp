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
      return NextResponse.json({ error: "Missing student_id or exam_id" }, { status: 400 });
    }

    // 0) تنظیمات آزمون (کنترل نمایش نتیجه)
    const { data: exam, error: examErr } = await supabase
      .from("exams")
      .select("id, show_results_immediately, results_published")
      .eq("id", exam_id)
      .single();

    if (examErr) throw examErr;

    // 1) سوالات + امتیاز کل
    const { data: questions, error: qErr } = await supabase
      .from("questions")
      .select("id, score")
      .eq("exam_id", exam_id);

    if (qErr) throw qErr;

    const questionIds = (questions ?? []).map((q: any) => q.id);
    const total_score = (questions ?? []).reduce((sum: number, q: any) => sum + (q.score ?? 0), 0);

    if (questionIds.length === 0) {
      return NextResponse.json({
        ok: true,
        exam_id,
        student_id,
        score: 0,
        total_score,
        correct_count: 0,
        total_questions: 0,
        hidden: !(exam.show_results_immediately && exam.results_published),
        message: "سوالی برای این آزمون وجود ندارد.",
      });
    }

    // 2) پاسخ‌های دانش‌آموز
    const { data: answers, error: aErr } = await supabase
      .from("student_answers")
      .select("question_id, selected_choice_id")
      .eq("student_id", student_id)
      .in("question_id", questionIds);

    if (aErr) throw aErr;

    const answerMap = new Map<number, number>();
    (answers ?? []).forEach((a: any) => answerMap.set(a.question_id, a.selected_choice_id));

    // 3) جواب‌های صحیح
    const { data: corrects, error: cErr } = await supabase
      .from("correct_answers")
      .select("question_id, correct_choice_id")
      .in("question_id", questionIds);

    if (cErr) throw cErr;

    const correctMap = new Map<number, number>();
    (corrects ?? []).forEach((c: any) => correctMap.set(c.question_id, c.correct_choice_id));

    // 4) محاسبه نمره
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

    // 5) ذخیره نتیجه (upsert)
    const { error: upErr } = await supabase.from("exam_results").upsert(
      {
        student_id,
        exam_id,
        score,
        total_score,
        correct_count,
        total_questions: questionIds.length,
      },
      { onConflict: "student_id,exam_id" }
    );

    if (upErr) throw upErr;

    // 6) خروجی بر اساس تنظیم معلم
    const canShow = !!exam.show_results_immediately && !!exam.results_published;

    if (!canShow) {
      return NextResponse.json({
        ok: true,
        exam_id,
        student_id,
        hidden: true,
        message: "✅ آزمون ثبت شد. نتیجه پس از تصحیح/انتشار توسط معلم نمایش داده می‌شود.",
      });
    }

    return NextResponse.json({
      ok: true,
      exam_id,
      student_id,
      hidden: false,
      score,
      total_score,
      correct_count,
      total_questions: questionIds.length,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Server error" }, { status: 500 });
  }
}
