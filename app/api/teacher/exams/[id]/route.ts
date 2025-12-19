import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TEACHER_ID = 1;

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id);

    const { data, error } = await supabase
      .from("exams")
      .select("id, title, teacher_id, show_result_to_student, is_published, created_at")
      .eq("id", id)
      .eq("teacher_id", TEACHER_ID)
      .single();

    if (error) throw error;

    return NextResponse.json({ ok: true, exam: data });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message ?? "Server error" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id);
    const body = await req.json();

    const patch: any = {};
    if (typeof body.title === "string") patch.title = body.title;
    if (typeof body.show_result_to_student === "boolean")
      patch.show_result_to_student = body.show_result_to_student;
    if (typeof body.is_published === "boolean") patch.is_published = body.is_published;

    const { data, error } = await supabase
      .from("exams")
      .update(patch)
      .eq("id", id)
      .eq("teacher_id", TEACHER_ID)
      .select("id, title, show_result_to_student, is_published")
      .single();

    if (error) throw error;

    return NextResponse.json({ ok: true, exam: data });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message ?? "Server error" }, { status: 500 });
  }
}
