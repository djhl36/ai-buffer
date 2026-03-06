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

  const thoughtIdx = text.lastIndexOf("Final");
  if (thoughtIdx !== -1) {
    const tail = text.slice(thoughtIdx).split("\n").slice(1).join("\n").trim();
    if (tail) return tail;
  }

  const lines = text
    .split("\n")
    .map((v) => v.trim())
    .filter(Boolean);

  if (!lines.length) return "";

  return lines[lines.length - 1].trim();
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    const draft = body?.draft;
    const relation = body?.relation ?? "";
    const user_id = body?.user_id;
    const conversation_id = body?.conversation_id;

    const key = process.env.GOOGLE_API_KEY;

    if (!draft || typeof draft !== "string") {
      return NextResponse.json({ error: "draft required" }, { status: 400 });
    }

    if (!key) {
      return NextResponse.json({ error: "GOOGLE_API_KEY missing" }, { status: 500 });
    }

    const instruction = `
너는 감정적으로 작성된 메시지를 정리하는 도우미다.

목표
- 감정 표현은 줄이고
- 핵심 의도는 유지
- 건설적인 메시지로 변환
- 실제로 바로 보낼 수 있는 한국어 메시지 한 개만 만든다

중요 규칙
- 설명, 분석, 사고과정, 이유, 해설 절대 금지
- 제목, 머리말, 불릿, 라벨 절대 금지
- 오직 최종 메시지 본문만 출력
- JSON 형식으로만 응답
- 형식은 반드시 아래와 같아야 한다
{"message":"여기에 최종 메시지"}

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

원문:
${draft}`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.4,
          responseMimeType: "application/json",
        },
      }),
    });

    const text = await resp.text();
    let data: any = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      return NextResponse.json(
        { error: "Gemini returned non-JSON", raw: text.slice(0, 500) },
        { status: 500 }
      );
    }

    if (!resp.ok) {
      return NextResponse.json(
        { error: "Gemini error", status: resp.status, details: data },
        { status: 500 }
      );
    }

    const raw =
      data?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text ?? "").join("")?.trim() ?? "";

    const ai = extractFinalMessage(raw);

    if (!ai) {
      return NextResponse.json({ error: "empty ai message" }, { status: 500 });
    }

    let message_id: string | null = null;

    if (user_id && conversation_id) {
      const { data: msg, error: msgError } = await supabaseServer
        .from("messages")
        .insert({
          user_id,
          conversation_id,
          draft_text: draft,
          ai_text: ai,
        })
        .select("id")
        .single();

      if (msgError) {
        return NextResponse.json({ error: msgError.message }, { status: 500 });
      }

      message_id = msg.id;

      await supabaseServer.from("events").insert({
        user_id,
        conversation_id,
        message_id,
        type: "generate",
        feature_type: "emotion",
        payload: {
          relation,
          input_length: draft.length,
          ai_length: ai.length,
        },
      });
    }

    return NextResponse.json({ ai, message_id });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "server error" },
      { status: 500 }
    );
  }
}