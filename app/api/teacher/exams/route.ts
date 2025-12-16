import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// (اختیاری) GET برای تست سریع
export async function GET() {
  const { data, error } = await supabase
    .from("exams")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ exams: data });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // UI شما teacher_id می‌فرسته
    const { teacher_id, title } = body;

    if (!teacher_id || !title) {
      return NextResponse.json(
        { error: "teacher_id و title الزامی است" },
        { status: 400 }
      );
    }

    // ✅ ستون واقعی دیتابیس: creator_user_id
    const payload = {
      creator_user_id: Number(teacher_id),
      title: String(title),
      is_published: false,
      // duration_min: null, // اگر خواستی بعداً اضافه کن
    };

    const { data, error } = await supabase
      .from("exams")
      .insert(payload)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ exam: data });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Server Error" },
      { status: 500 }
    );
  }
}
