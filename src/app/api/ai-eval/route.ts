import { NextResponse } from "next/server";

export async function POST(req: Request) {
  // ✅ 기본값 OFF: 자원/비용 0
  const enabled = (process.env.ENABLE_AI_EVAL ?? "").toLowerCase() === "true";
  const sampleRate = Number(process.env.AI_EVAL_SAMPLE_RATE ?? "0");

  const body = await req.json().catch(() => ({}));

  if (!enabled) {
    return NextResponse.json({ enabled: false, skipped: "disabled" });
  }

  // 샘플링(예: 0.1 = 10%만 실행). 0이면 사실상 실행 안 함.
  if (!(sampleRate > 0) || Math.random() > sampleRate) {
    return NextResponse.json({ enabled: true, skipped: "sampled_out" });
  }

  // ✅ 여기부터가 “나중에” 실제 LLM 평가를 붙일 자리
  // 지금은 틀만: 호출되면 그냥 스킵 처리
  // (원하면 다음 단계에서 Gemini로 4지선다 예측을 구현)
  return NextResponse.json({
    enabled: true,
    skipped: "not_implemented_yet",
    received: {
      conversation_id: body?.conversation_id,
      message_id: body?.message_id,
    },
  });
}
