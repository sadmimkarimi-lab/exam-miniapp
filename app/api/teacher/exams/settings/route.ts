import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { exam_id, show_results_immediately, results_published } = await req.json();

    if (!exam_id) {
      return NextResponse.json({ error: "Missing exam_id" }, { status: 400 });
    }

    const patch: any = {};
    if (typeof show_results_immediately === "boolean") patch.show_results_immediately = show_results_immediately;
    if (typeof results_published === "boolean") patch.results_published = results_published;

    const { data, error } = await supabase
      .from("exams")
      .update(patch)
      .eq("id", exam_id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ ok: true, exam: data });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Server error" }, { status: 500 });
  }
}
