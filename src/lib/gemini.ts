export async function askGemini(
  mode: "emotion" | "situation",
  relation: string,
  input: string
) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY missing");

  const prompt =
    mode === "emotion"
      ? `너는 감정적인 문장을 상대에게 보낼 수 있게 정리하는 도우미다.
규칙:
- 공격성은 줄인다
- 핵심 의도는 유지한다
- 너무 차갑거나 기계적이면 안 된다
- 한국어 메시지 1개만 만든다
- JSON만 반환한다
형식: {"message":"..."}
관계: ${relation || "일반적인 관계"}
입력: ${input}`
      : `너는 상황 설명을 바탕으로 바로 보낼 수 있는 한국어 메시지 초안을 만드는 도우미다.
규칙:
- 자연스럽고 짧게
- 예의는 지키되 과하게 딱딱하지 않게
- 메시지 1개만 만든다
- JSON만 반환한다
형식: {"message":"..."}
관계: ${relation || "일반적인 관계"}
상황: ${input}`;

  const url =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

  try {
    const r = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": key,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.5,
        },
      }),
      cache: "no-store",
    });

    const text = await r.text();

    if (!r.ok) {
      throw new Error(`Gemini HTTP ${r.status}: ${text}`);
    }

    const j = JSON.parse(text);
    const raw =
      j?.candidates?.[0]?.content?.parts?.map((v: any) => v?.text || "").join("") || "";

    try {
      return JSON.parse(raw).message?.trim() || raw.trim();
    } catch {
      return raw.trim();
    }
  } catch (e: any) {
    console.error("Gemini fetch error:", e);
    console.error("Gemini fetch cause:", e?.cause);
    throw new Error(e?.message || "Gemini fetch failed");
  }
}