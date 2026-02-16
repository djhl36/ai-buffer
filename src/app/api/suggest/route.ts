import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const draft = body?.draft;

    if (!draft || typeof draft !== "string") {
      return NextResponse.json({ error: "draft required" }, { status: 400 });
    }

    const key = process.env.GOOGLE_API_KEY;
    if (!key) {
      return NextResponse.json({ error: "GOOGLE_API_KEY missing" }, { status: 500 });
    }

    const instruction = `너는 '의도를 보존한 채 표현만 최적화'하는 도우미다.
금지: 훈계/도덕판단/조작전략/의도왜곡/감정삭제.
해야 할 일: 공격성/장황함/방어유발 표현만 줄이고, 원 의도를 유지하며 전달 효율이 높은 한글 메시지 1개를 출력한다.`;

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
            parts: [{ text: `${instruction}\n\n원문:\n${draft}` }],
          },
        ],
        generationConfig: { temperature: 0.4 },
      }),
    });

    const text = await resp.text(); // ✅ 무조건 text로 읽고
    let data: any = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      // 구글이 JSON 아닌 걸 준 경우 그대로 반환
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

    const ai =
      data?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text ?? "").join("")?.trim() ?? "";

    return NextResponse.json({ ai });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Server crash", message: e?.message ?? String(e) },
      { status: 500 }
    );
  }
}
