import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/student/questions?exam_id=1
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const exam_id = Number(searchParams.get("exam_id"));

    if (!exam_id || Number.isNaN(exam_id)) {
      return NextResponse.json({ error: "exam_id لازم است" }, { status: 400 });
    }

    const { data: questions, error: qErr } = await supabase
      .from("questions")
      .select("id, exam_id, type, text, score")
      .eq("exam_id", exam_id)
      .order("id", { ascending: true });

    if (qErr) return NextResponse.json({ error: qErr.message }, { status: 500 });

    const qIds = (questions ?? []).map((q) => q.id);
    let choices: any[] = [];

    if (qIds.length) {
      const { data: ch, error: cErr } = await supabase
        .from("choices")
        .select("id, question_id, text")
        .in("question_id", qIds)
        .order("id", { ascending: true });

      if (cErr) return NextResponse.json({ error: cErr.message }, { status: 500 });
      choices = ch ?? [];
    }

    const choicesByQ: Record<number, any[]> = {};
    for (const c of choices) {
      const qid = c.question_id as number;
      if (!choicesByQ[qid]) choicesByQ[qid] = [];
      choicesByQ[qid].push({ id: c.id, text: c.text });
    }

    const payload = (questions ?? []).map((q) => ({
      id: q.id,
      exam_id: q.exam_id,
      type: q.type,
      text: q.text,
      score: q.score,
      choices: choicesByQ[q.id] ?? [],
    }));

    // مهم: هیچ correct_answers برنمی‌گردونیم (برای امنیت)
    return NextResponse.json({ exam_id, questions: payload }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
