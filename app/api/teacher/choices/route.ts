import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST /api/teacher/choices
 * body: { question_id, text, is_correct }
 */
export async function POST(req: Request) {
  const body = await req.json();
  const { question_id, text, is_correct } = body;

  if (!question_id || !text) {
    return NextResponse.json(
      { error: "question_id and text are required" },
      { status: 400 }
    );
  }

  // اگر این گزینه درست است، بقیه گزینه‌های سوال را غلط کن
  if (is_correct) {
    await supabase
      .from("choices")
      .update({ is_correct: false })
      .eq("question_id", question_id);
  }

  const { data, error } = await supabase
    .from("choices")
    .insert({
      question_id,
      text,
      is_correct: !!is_correct,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(data);
}
