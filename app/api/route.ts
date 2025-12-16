import { supabaseAdmin } from "../../lib/supabase";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const action = url.searchParams.get("action");

  if (action === "dbtest") {
    const eitaa_user_id = "TEST_10001";

    const { data: existing, error: selErr } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("eitaa_user_id", eitaa_user_id)
      .maybeSingle();

    if (selErr) {
      return new Response("DB SELECT ERROR: " + selErr.message, { status: 500 });
    }

    let user = existing;

    if (!user) {
      const { data: created, error: insErr } = await supabaseAdmin
        .from("users")
        .insert({
          eitaa_user_id,
          first_name: "Elaha",
          last_name: "Test",
          username: "elaha_test",
        })
        .select("*")
        .single();

      if (insErr) {
        return new Response("DB INSERT ERROR: " + insErr.message, { status: 500 });
      }

      user = created;
    }

    return new Response("DB OK ✅ user_id=" + user.id, { status: 200 });
  }

  return new Response("API OK", { status: 200 });
}

export async function POST() {
  return new Response("API OK", { status: 200 });
}
