import { NextResponse } from "next/server";
import { askGemini } from "@/lib/gemini";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { user_id, mode, relation, input_text } = await req.json();

    if (!user_id || !mode || !input_text) {
      return NextResponse.json({ error: "missing fields" }, { status: 400 });
    }

    const output_text = await askGemini(mode, relation || "", input_text);

    const { data, error } = await supabaseAdmin
      .from("messages")
      .insert({ user_id, mode, relation, input_text, output_text })
      .select("id,output_text")
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (e: any) {
    console.error("/api/generate error:", e);
    return NextResponse.json(
      { error: e?.message || "server error" },
      { status: 500 }
    );
  }
}