import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  const body = await req.json()
  const { title, teacher_id } = body

  if (!title || !teacher_id) {
    return NextResponse.json(
      { error: 'title و teacher_id لازم است' },
      { status: 400 }
    )
  }

  const { data, error } = await supabase
    .from('exams')
    .insert({ title, teacher_id })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ exam: data })
}
