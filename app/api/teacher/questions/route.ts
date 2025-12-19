import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/teacher/questions?exam_id=3
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const exam_id = Number(searchParams.get("exam_id"));

  if (!exam_id) {
    return NextResponse.json({ error: "exam_id is required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("questions")
    .select("*, choices(*)")
    .eq("exam_id", exam_id)
    .order("id", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}

// POST /api/teacher/questions
// body: { exam_id, text, score, type }
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const exam_id = Number(body.exam_id);
    const text = String(body.text ?? "").trim();
    const score = Number(body.score ?? 1);
    const type = (body.type === "desc" ? "desc" : "mcq") as "mcq" | "desc";

    if (!exam_id || !text) {
      return NextResponse.json(
        { error: "exam_id and text are required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("questions")
      .insert([{ exam_id, text, score, type }])
      .select("*, choices(*)")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Invalid JSON body" },
      { status: 400 }
    );
  }
}
