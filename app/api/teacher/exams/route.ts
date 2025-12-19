import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TEACHER_ID = 1;

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("exams")
      .select("id, title, teacher_id, show_result_to_student, is_published, created_at")
      .eq("teacher_id", TEACHER_ID)
      .order("id", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ ok: true, exams: data ?? [] });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message ?? "Server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const title = (body?.title ?? "آزمون جدید").toString();

    const { data, error } = await supabase
      .from("exams")
      .insert({
        teacher_id: TEACHER_ID,
        title,
        show_result_to_student: false,
        is_published: false,
      })
      .select("id")
      .single();

    if (error) throw error;

    return NextResponse.json({ ok: true, exam_id: data.id });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message ?? "Server error" }, { status: 500 });
  }
}
