import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * DELETE /api/teacher/choices/:id
 */
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const choiceId = params.id;

  const { error } = await supabase
    .from("choices")
    .delete()
    .eq("id", choiceId);

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
