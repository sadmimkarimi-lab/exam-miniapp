import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { student_id, question_id, selected_choice_id } = await req.json();

    if (!student_id || !question_id || !selected_choice_id) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // اگر قبلاً برای این سوال جواب داده → update
    const { data: existing, error: existingErr } = await supabase
      .from("student_answers")
      .select("id")
      .eq("student_id", student_id)
      .eq("question_id", question_id)
      .maybeSingle();

    if (existingErr) throw existingErr;

    if (existing?.id) {
      const { data, error } = await supabase
        .from("student_answers")
        .update({ selected_choice_id })
        .eq("id", existing.id)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ updated: true, answer: data });
    }

    // در غیر اینصورت insert
    const { data, error } = await supabase
      .from("student_answers")
      .insert({
        student_id,
        question_id,
        selected_choice_id,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ created: true, answer: data });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Server error" },
      { status: 500 }
    );
  }
}
