import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/teacher/questions?exam_id=1
 * برای صفحه دانش‌آموز
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const exam_id = searchParams.get("exam_id");

  if (!exam_id) {
    return NextResponse.json(
      { error: "exam_id is required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("questions")
    .select(
      `
      *,
      choices (*)
    `
    )
    .eq("exam_id", exam_id)
    .order("id", { ascending: true });

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  // فرمت مناسب UI دانش‌آموز
  const result = data.map((q: any) => ({
    question: {
      id: q.id,
      exam_id: q.exam_id,
      text: q.text,
      score: q.score,
      type: q.type,
    },
    choices: q.choices ?? [],
  }));

  return NextResponse.json(result);
}

/**
 * POST /api/teacher/questions
 * برای معلم (قبلاً داشتی، دست نمی‌زنیم)
 */
export async function POST(req: Request) {
  const body = await req.json();

  const { exam_id, text, score, type } = body;

  const { data, error } = await supabase
    .from("questions")
    .insert({
      exam_id,
      text,
      score,
      type,
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
