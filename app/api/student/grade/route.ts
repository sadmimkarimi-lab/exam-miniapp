import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const exam_id = Number(body.exam_id);
    const student_id = Number(body.student_id);

    if (!exam_id || !student_id) {
      return NextResponse.json(
        { error: "Missing student_id or exam_id" },
        { status: 400 }
      );
    }

    // 1) سوال‌های آزمون
    const { data: questionsRaw, error: qErr } = await supabase
      .from("questions")
      .select("id, score")
      .eq("exam_id", exam_id);

    if (qErr) throw qErr;

    const questions = (questionsRaw ?? []).map((q: any) => ({
      id: Number(q.id),
      score: Number(q.score ?? 0),
    }));

    const questionIds = questions.map((q) => q.id);
    const total_score = questions.reduce((sum, q) => sum + q.score, 0);

    if (questionIds.length === 0) {
      return NextResponse.json({
        ok: true,
        exam_id,
        student_id,
        score: 0,
        total_score: 0,
        correct_count: 0,
        total_questions: 0,
        saved: false,
      });
    }

    // 2) جواب‌های دانش‌آموز
    const { data: answersRaw, error: aErr } = await supabase
      .from("student_answers")
      .select("question_id, selected_choice_id")
      .eq("student_id", student_id)
      .in("question_id", questionIds);

    if (aErr) throw aErr;

    const answerMap = new Map<number, number>();
    (answersRaw ?? []).forEach((a: any) => {
      answerMap.set(Number(a.question_id), Number(a.selected_choice_id));
    });

    // 3) جواب‌های صحیح
    const { data: correctsRaw, error: cErr } = await supabase
      .from("correct_answers")
      .select("question_id, correct_choice_id")
      .in("question_id", questionIds);

    if (cErr) throw cErr;

    const correctMap = new Map<number, number>();
    (correctsRaw ?? []).forEach((c: any) => {
      correctMap.set(Number(c.question_id), Number(c.correct_choice_id));
    });

    // 4) محاسبه نمره
    let score = 0;
    let correct_count = 0;

    for (const q of questions) {
      const chosen = answerMap.get(q.id);
      const correct = correctMap.get(q.id);

      if (chosen != null && correct != null && chosen === correct) {
        correct_count += 1;
        score += q.score;
      }
    }

    // 5) ذخیره نتیجه (نیازمند ستون‌های correct_count و total_questions)
    let saved = false;
    const { error: rErr } = await supabase.from("exam_results").upsert(
      {
        student_id,
        exam_id,
        score,
        total_score,
        correct_count,
        total_questions: questions.length,
      },
      { onConflict: "student_id,exam_id" }
    );

    if (!rErr) saved = true;

    return NextResponse.json({
      ok: true,
      exam_id,
      student_id,
      score,
      total_score,
      correct_count,
      total_questions: questions.length,
      saved,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Server error" },
      { status: 500 }
    );
  }
}
