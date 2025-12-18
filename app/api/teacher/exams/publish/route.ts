import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { exam_id } = await req.json();
    if (!exam_id) return NextResponse.json({ error: "Missing exam_id" }, { status: 400 });

    const { data, error } = await supabase
      .from("exams")
      .update({ results_published: true })
      .eq("id", exam_id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ ok: true, exam: data });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Server error" }, { status: 500 });
  }
}
