import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const body = await req.json();
  const { teacher_id, title } = body;

  if (!teacher_id || !title) {
    return NextResponse.json({ error: "teacher_id و title لازم است" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("exams")
    .insert({ teacher_id, title, is_published: false })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ exam: data });
}
