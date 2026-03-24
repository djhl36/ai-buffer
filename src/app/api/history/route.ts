import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const user_id = searchParams.get("user_id");

    if (!user_id) {
      return NextResponse.json({ error: "missing user_id" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("messages")
      .select(
        "id,mode,relation,input_text,output_text,copied_choice,sent_status,followup_reaction,created_at"
      )
      .eq("user_id", user_id)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) throw error;

    return NextResponse.json({ items: data || [] });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "server error" },
      { status: 500 }
    );
  }
}