import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const exam_id = Number(url.searchParams.get("exam_id"));
    const student_id = Number(url.searchParams.get("student_id"));

    if (!exam_id || !student_id) {
      return NextResponse.json(
        { error: "Missing exam_id or student_id" },
        { status: 400 }
      );
    }

    // سوالات + گزینه‌ها
    const { data: questions, error: qErr } = await supabase
      .from("questions")
      .select(
        "id, exam_id, text, type, score, choices(id, question_id, text)"
      )
      .eq("exam_id", exam_id)
      .order("id", { ascending: true });

    if (qErr) throw qErr;

    const questionIds = (questions ?? []).map((q: any) => q.id);

    // جواب‌های قبلی دانش‌آموز (برای نمایش انتخاب قبلی)
    let answers: any[] = [];
    if (questionIds.length > 0) {
      const { data: aData, error: aErr } = await supabase
        .from("student_answers")
        .select("question_id, selected_choice_id")
        .eq("student_id", student_id)
        .in("question_id", questionIds);

      if (aErr) throw aErr;
      answers = aData ?? [];
    }

    const answerMap = new Map<number, number>();
    answers.forEach((a: any) => answerMap.set(a.question_id, a.selected_choice_id));

    const merged = (questions ?? []).map((q: any) => ({
      ...q,
      selected_choice_id: answerMap.get(q.id) ?? null,
    }));

    return NextResponse.json({ questions: merged });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Server error" },
      { status: 500 }
    );
  }
}
