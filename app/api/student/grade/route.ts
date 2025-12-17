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
        { error: "student_id و exam_id الزامی هستند" },
        { status: 400 }
      );
    }

    // گرفتن پاسخ‌های دانش‌آموز
    const { data: answers, error: answersError } = await supabase
      .from("student_answers")
      .select("question_id, selected_choice_id")
      .eq("student_id", student_id)
      .eq("exam_id", exam_id);

    if (answersError) throw answersError;

    let score = 0;

    for (const answer of answers ?? []) {
      const { data: correct } = await supabase
        .from("correct_answers")
        .select("choice_id")
        .eq("question_id", answer.question_id)
        .single();

      if (correct && correct.choice_id === answer.selected_choice_id) {
        score += 1;
      }
    }

    // ذخیره نتیجه نهایی
    const { error: insertError } = await supabase
      .from("exam_results")
      .insert({
        student_id,
        exam_id,
        score,
      });

    if (insertError) throw insertError;

    return NextResponse.json({
      success: true,
      score,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "خطا در تصحیح آزمون" },
      { status: 500 }
    );
  }
}
