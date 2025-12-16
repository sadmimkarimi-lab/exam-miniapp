import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;

const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) throw new Error("Missing SUPABASE_URL / NEXT_PUBLIC_SUPABASE_URL");
if (!supabaseServiceKey) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // ورودی‌ها
    const title = body?.title;
    const teacher_id_raw = body?.teacher_id;

    // اعتبارسنجی
    const teacher_id = Number(teacher_id_raw);
    if (!title || !teacher_id_raw || Number.isNaN(teacher_id)) {
      return NextResponse.json(
        { error: "teacher_id و title الزامی است" },
        { status: 400 }
      );
    }

    // درج آزمون
    const { data, error } = await supabase
      .from("exams")
      .insert({
        teacher_id,
        title,
        is_published: false,
      })
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ exam: data }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Server Error" },
      { status: 500 }
    );
  }
}
