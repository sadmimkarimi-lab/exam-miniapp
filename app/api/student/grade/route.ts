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

    // 1) سوالات آزمون
    const { data: questions, error: qErr } = await supabase
      .from("questions")
      .select("id, score")
      .eq("exam_id", exam_id);

    if (qErr) throw qErr;

    const questionIds = (questions ?? []).map((q) => q.id);
    if (questionIds.length === 0) {
      return NextResponse.json(
        { error: "No questions found for this exam" },
        { status: 404 }
      );
    }

    // برای محاسبه total
    const total = (questions ?? []).reduce((sum, q) => sum + (q.score ?? 0), 0);

    // 2) جواب‌های دانش‌آموز برای همین سوال‌ها
    const { data: answers, error: aErr } = await supabase
      .from("student_answers")
      .select("question_id, selected_choice_id")
      .eq("student_id", student_id)
      .in("question_id", questionIds);

    if (aErr) throw aErr;

    const answerMap = new Map<number, number>();
    (answers ?? []).forEach((a: any) => {
      answerMap.set(a.question_id, a.selected_choice_id);
    });

    // 3) جواب‌های صحیح
    const { data: corrects, error: cErr } = await supabase
      .from("correct_answers")
      .select("question_id, correct_choice_id")
      .in("question_id", questionIds);

    if (cErr) throw cErr;

    const correctMap = new Map<number, number>();
    (corrects ?? []).forEach((c: any) => {
      correctMap.set(c.question_id, c.correct_choice_id);
    });

    // 4) محاسبه نمره
    let score = 0;
    let correctCount = 0;

    for (const q of questions ?? []) {
      const chosen = answerMap.get(q.id);
      const correctChoice = correctMap.get(q.id);

      if (chosen && correctChoice && chosen === correctChoice) {
        score += q.score ?? 0;
        correctCount += 1;
      }
    }

    const questionCount = questionIds.length;

    // 5) ذخیره در exam_results (insert or update)
    const { data: existingResult, error: er1 } = await supabase
      .from("exam_results")
      .select("id")
      .eq("student_id", student_id)
      .eq("exam_id", exam_id)
      .maybeSingle();

    if (er1) throw er1;

    if (existingResult?.id) {
      const { error: updErr } = await supabase
        .from("exam_results")
        .update({ score, total })
        .eq("id", existingResult.id);

      if (updErr) throw updErr;
    } else {
      const { error: insErr } = await supabase
        .from("exam_results")
        .insert({ student_id, exam_id, score, total });

      if (insErr) throw insErr;
    }

    return NextResponse.json({
      ok: true,
      student_id,
      exam_id,
      score,
      total,
      correctCount,
      questionCount,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Server error" },
      { status: 500 }
    );
  }
}
