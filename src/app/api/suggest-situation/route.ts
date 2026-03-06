import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

function extractFinalMessage(raw: string) {
  const text = (raw ?? "").trim();

  if (!text) return "";

  try {
    const parsed = JSON.parse(text);
    if (typeof parsed?.message === "string") {
      return parsed.message.trim();
    }
  } catch {}

  const cleaned = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/g, "")
    .replace(/^\s*\[THOUGHT\]:[\s\S]*$/im, "")
    .replace(/^\s*#{1,6}\s*정리된 메시지\s*\n?/im, "")
    .replace(/^\s*정리된 메시지\s*[:：]?\s*\n?/im, "")
    .replace(/^\s*수정된 메시지\s*[:：]?\s*\n?/im, "")
    .trim();

  const lines = cleaned
    .split("\n")
    .map((v) => v.trim())
    .filter(Boolean);

  if (!lines.length) return "";

  if (lines.length === 1) return lines[0];

  return lines[lines.length - 1];
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    const situation = body?.situation;
    const relation = body?.relation ?? "";
    const user_id = body?.user_id;
    const conversation_id = body?.conversation_id;

    const key = process.env.GOOGLE_API_KEY;

    if (!situation || typeof situation !== "string") {
      return NextResponse.json({ error: "situation required" }, { status: 400 });
    }

    if (!key) {
      return NextResponse.json({ error: "GOOGLE_API_KEY missing" }, { status: 500 });
    }

    const instruction = `
너는 커뮤니케이션 상황에서 실제로 보낼 메시지 초안을 작성해주는 도우미다.

목표
- 입력된 상황을 이해하고
- 관계에 맞는 말투로
- 바로 보낼 수 있는 한국어 메시지 한 개만 만든다

중요 규칙
- 설명, 분석, 사고과정, 이유, 해설 절대 금지
- 제목, 머리말, 불릿, 라벨 절대 금지
- 오직 최종 메시지 본문만 출력
- 출력은 최대한 짧고 자연스럽게
- 반드시 메시지 본문만 출력

관계
${relation || "일반적인 인간관계"}
`;

    const url =
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

    const resp = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-goog-api-key": key,
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `${instruction}

상황:
${situation}`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.5,
        },
      }),
    });

    const rawText = await resp.text();

    let data: any = {};
    try {
      data = rawText ? JSON.parse(rawText) : {};
    } catch {
      return NextResponse.json(
        {
          error: "Gemini returned non-JSON",
          raw: rawText.slice(0, 1000),
        },
        { status: 500 }
      );
    }

    if (!resp.ok) {
      return NextResponse.json(
        {
          error: "Gemini error",
          status: resp.status,
          details: data,
        },
        { status: 500 }
      );
    }

    const raw =
      data?.candidates?.[0]?.content?.parts
        ?.map((p: any) => p?.text ?? "")
        .join("")
        ?.trim() ?? "";

    const ai = extractFinalMessage(raw);

    if (!ai) {
      return NextResponse.json(
        {
          error: "empty ai message",
          raw,
        },
        { status: 500 }
      );
    }

    let message_id: string | null = null;

    if (user_id && conversation_id) {
      const { data: msg, error: msgError } = await supabaseServer
        .from("messages")
        .insert({
          user_id,
          conversation_id,
          draft_text: situation,
          ai_text: ai,
        })
        .select("id")
        .single();

      if (msgError) {
        return NextResponse.json({ error: msgError.message }, { status: 500 });
      }

      message_id = msg.id;

      const { error: eventError } = await supabaseServer.from("events").insert({
        user_id,
        conversation_id,
        message_id,
        type: "generate",
        feature_type: "situation",
        payload: {
          relation,
          input_length: situation.length,
          ai_length: ai.length,
        },
      });

      if (eventError) {
        return NextResponse.json({ error: eventError.message }, { status: 500 });
      }
    }

    return NextResponse.json({ ai, message_id });
  } catch (e: any) {
    return NextResponse.json(
      {
        error: "server error",
        message: e?.message ?? String(e),
      },
      { status: 500 }
    );
  }
}