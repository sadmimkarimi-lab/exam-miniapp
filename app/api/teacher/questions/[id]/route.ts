import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * DELETE /api/teacher/questions/:id
 */
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const questionId = params.id;

  // اول گزینه‌های سوال پاک شود
  await supabase.from("choices").delete().eq("question_id", questionId);

  // بعد خود سوال
  const { error } = await supabase
    .from("questions")
    .delete()
    .eq("id", questionId);

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
