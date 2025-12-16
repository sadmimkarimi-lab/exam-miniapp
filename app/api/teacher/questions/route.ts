import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);


export async function POST(req: Request) {
  const body = await req.json();
  const { exam_id, type, text } = body; // type: "mcq" | "essay"

  if (!exam_id || !type || !text) {
    return NextResponse.json({ error: "exam_id و type و text لازم است" }, { status: 400 });
  }

  // سوال را در جدول questions ذخیره می‌کنیم
  const { data: q, error: qErr } = await supabase
    .from("questions")
    .insert({ exam_id, text })
    .select("*")
    .single();

  if (qErr) return NextResponse.json({ error: qErr.message }, { status: 500 });

  // اگر تشریحی باشد، همینجا تمام
  if (type === "essay") {
    return NextResponse.json({ question: q, type });
  }

  // اگر چهارگزینه‌ای باشد باید choices و correct_answer هم بیاید
  const { choices, correct_index } = body; // choices: ["A","B","C","D"], correct_index: 0..3

  if (!Array.isArray(choices) || choices.length < 2 || correct_index === undefined) {
    return NextResponse.json(
      { error: "برای mcq باید choices و correct_index بفرستی" },
      { status: 400 }
    );
  }

  // ذخیره گزینه‌ها
  const rows = choices.map((t: string) => ({ question_id: q.id, text: String(t) }));
  const { data: insertedChoices, error: cErr } = await supabase
    .from("choices")
    .insert(rows)
    .select("*");

  if (cErr) return NextResponse.json({ error: cErr.message }, { status: 500 });

  const correctChoice = insertedChoices?.[Number(correct_index)];
  if (!correctChoice?.id) {
    return NextResponse.json({ error: "correct_index نامعتبر است" }, { status: 400 });
  }

  // ذخیره جواب درست (مخفی)
  const { error: aErr } = await supabase
    .from("correct_answers")
    .insert({ question_id: q.id, correct_choice_id: correctChoice.id });

  if (aErr) return NextResponse.json({ error: aErr.message }, { status: 500 });

  return NextResponse.json({ question: q, type, choices: insertedChoices });
}
