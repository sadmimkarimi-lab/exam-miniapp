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
        { error: "Missing required fields: student_id, exam_id" },
        { status: 400 }
      );
    }

    // 1) سوالات آزمون
    const { data: questions, error: qErr } = await supabase
      .from("questions")
      .select("id, score, type")
      .eq("exam_id", exam_id);

    if (qErr) throw qErr;
    if (!questions || questions.length === 0) {
      return NextResponse.json(
        { error: "No questions found for this exam" },
        { status: 404 }
      );
    }

    const questionIds = questions.map((q) => q.id);

    // 2) پاسخ‌های درست
    const { data: corrects, error: cErr } = await supabase
      .from("correct_answers")
      .select("question_id, correct_choice_id")
      .in("question_id", questionIds);

    if (cErr) throw cErr;

    const correctMap = new Map<number, number>();
    (corrects ?? []).forEach((r) => correctMap.set(r.question_id, r.correct_choice_id));

    // 3) پاسخ‌های دانش‌آموز
    const { data: answers, error: aErr } = await supabase
      .from("student_answers")
      .select("question_id, selected_choice_id")
      .eq("student_id", student_id)
      .in("question_id", questionIds);

    if (aErr) throw aErr;

    const answerMap = new Map<number, number>();
    (answers ?? []).forEach((a) => answerMap.set(a.question_id, a.selected_choice_id));

    // 4) محاسبه نمره (فعلاً فقط MCQ)
    let total = 0;
    let score = 0;

    const details = questions.map((q) => {
      total += q.score ?? 1;

      const correctChoiceId = correctMap.get(q.id);
      const selectedChoiceId = answerMap.get(q.id);

      const isMcq = (q.type ?? "mcq") === "mcq"; // اگر type نداری، پیشفرض mcq
      const isCorrect =
        isMcq && correctChoiceId != null && selectedChoiceId != null
          ? selectedChoiceId === correctChoiceId
          : false;

      if (isCorrect) score += q.score ?? 1;

      return {
        question_id: q.id,
        selected_choice_id: selectedChoiceId ?? null,
        correct_choice_id: correctChoiceId ?? null,
        is_correct: isCorrect,
        earned: isCorrect ? (q.score ?? 1) : 0,
        max: q.score ?? 1,
        type: q.type ?? "mcq",
      };
    });

    // 5) ذخیره نتیجه
    const { data: saved, error: sErr } = await supabase
      .from("exam_results")
      .upsert(
        { student_id, exam_id, score, total },
        { onConflict: "student_id,exam_id" }
      )
      .select()
      .single();

    if (sErr) throw sErr;

    return NextResponse.json({
      ok: true,
      result: saved,
      details,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Server error" },
      { status: 500 }
    );
  }
}
