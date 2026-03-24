"use client";

import { useState } from "react";
import Link from "next/link";
import { getUserId } from "@/lib/user";

type Mode = "emotion" | "situation";

const emotionQs = {
  relief: [
    "속이 한결 가벼워졌다",
    "조금 나아진 느낌이다",
    "크게 달라지진 않았다",
    "여전히 감정이 차오른다",
  ],
  self: [
    "나답게 단정해진 느낌이다",
    "선은 지켰다",
    "괜히 더 조심하게 된다",
    "내가 손해 보는 느낌이다",
  ],
  relation: [
    "더 나아질 것 같다",
    "이전과 비슷할 것 같다",
    "살짝 불편해질 것 같다",
    "나를 안 좋게 볼 것 같다",
  ],
};

const situationQs = {
  understanding: [
    "정확히 이해했다",
    "대체로 맞다",
    "조금 다르다",
    "잘못 이해했다",
  ],
  usability: [
    "바로 사용할 수 있다",
    "조금 수정하면 된다",
    "아이디어 정도다",
    "도움이 안 된다",
  ],
  burden: [
    "많이 줄었다",
    "조금 줄었다",
    "별 차이 없다",
    "오히려 더 부담스럽다",
  ],
};

export default function FormPage({ mode }: { mode: Mode }) {
  const [relation, setRelation] = useState("");
  const [input, setInput] = useState("");
  const [result, setResult] = useState("");
  const [id, setId] = useState("");
  const [loading, setLoading] = useState(false);

  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackStep, setFeedbackStep] = useState(1);
  const [feedback, setFeedback] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  const [outcomeOpen, setOutcomeOpen] = useState(false);

  const title = mode === "emotion" ? "감정 메시지 정리" : "상황 메시지 생성";
  const desc =
    mode === "emotion"
      ? "감정적으로 쓴 문장을 입력하면, 의도는 유지하고 표현만 정리해줘."
      : "상황을 설명하면, 지금 보내기 좋은 자연스러운 메시지를 만들어줘.";
  const placeholder =
    mode === "emotion"
      ? "예: 왜 맨날 내가 다 처리해야 돼? 진짜 너무한 거 아니야?"
      : "예: 동아리 후배가 고백을 했는데 거절해야 한다. 너무 어색해지지는 않았으면 좋겠다.";

  async function generate() {
    if (!input.trim() || loading) return;
    setLoading(true);
    setSaved(false);

    try {
      const r = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: getUserId(),
          mode,
          relation,
          input_text: input.trim(),
        }),
      });

      const j = await r.json();
      if (!r.ok) {
        alert(j.error || "생성 실패");
        return;
      }

      setResult(j.output_text || "");
      setId(j.id || "");
    } catch (e) {
      console.error(e);
      alert("생성 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  async function copyText(choice: "ai" | "raw") {
    const text = choice === "ai" ? result : input;
    if (!text || !id) return;

    try {
      await navigator.clipboard.writeText(text);

      await fetch("/api/mark-copy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, copied_choice: choice }),
      });

      setFeedback({});
      setFeedbackStep(1);
      setFeedbackOpen(true);
    } catch (e) {
      console.error(e);
      alert("복사 실패");
    }
  }

  async function saveFeedback() {
    const body =
      mode === "emotion"
        ? {
            id,
            emotion_relief: feedback.relief,
            emotion_self: feedback.self,
            emotion_relation: feedback.relation,
          }
        : {
            id,
            situation_understanding: feedback.understanding,
            situation_usability: feedback.usability,
            situation_burden: feedback.burden,
          };

    try {
      const r = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (r.ok) {
        setSaved(true);
        setFeedbackOpen(false);
        setOutcomeOpen(true);
      } else {
        const j = await r.json();
        alert(j.error || "피드백 저장 실패");
      }
    } catch (e) {
      console.error(e);
      alert("피드백 저장 중 오류");
    }
  }

  async function markOutcome(key: "sent_status" | "followup_reaction", value: string) {
    if (!id) return;
    try {
      await fetch("/api/mark-outcome", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, [key]: value }),
      });
    } catch (e) {
      console.error(e);
    }
  }

  async function quickSaveSent(value: "send" | "edited_send" | "not_send") {
    await markOutcome("sent_status", value);
    setOutcomeOpen(false);
    alert("보냄 여부가 기록되었습니다. 상대 반응은 내 기록 보기에서 나중에 남길 수 있어요.");
  }

  function Pick({ items, name }: { items: string[]; name: string }) {
    return (
      <div className="mt-2 grid gap-2">
        {items.map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setFeedback((s) => ({ ...s, [name]: v }))}
            className={`rounded-xl border px-3 py-2.5 text-left text-[13px] leading-5 sm:text-sm ${
              feedback[name] === v
                ? "border-black bg-black text-white"
                : "border-gray-300 bg-white"
            }`}
          >
            {v}
          </button>
        ))}
      </div>
    );
  }

  const step1Done =
    mode === "emotion" ? !!feedback.relief : !!feedback.understanding;

  const step2Done =
    mode === "emotion"
      ? !!feedback.self && !!feedback.relation
      : !!feedback.usability && !!feedback.burden;

  return (
    <main className="mx-auto max-w-3xl px-4 py-6 sm:px-5 sm:py-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/" className="text-sm text-gray-500">
            ← 홈
          </Link>
          <h1 className="mt-2 text-xl font-bold sm:text-2xl">{title}</h1>
          <p className="mt-1 text-sm leading-6 text-gray-600">{desc}</p>
        </div>

        <Link
          href="/history"
          className="rounded-full border border-gray-300 px-4 py-2 text-sm text-gray-700"
        >
          내 기록 보기
        </Link>
      </div>

      <section className="mt-5 rounded-[24px] border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
        <label className="text-sm font-medium">누구에게 보내는 메시지인가요?</label>
        <input
          value={relation}
          onChange={(e) => setRelation(e.target.value)}
          placeholder="예: 상사 / 친구 / 연인 / 거래처 / 교수"
          className="mt-2 w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm outline-none"
        />

        <label className="mt-4 block text-sm font-medium">내용 입력</label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={6}
          placeholder={placeholder}
          className="mt-2 w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm outline-none"
        />

        <button
          type="button"
          onClick={generate}
          disabled={loading || !input.trim()}
          className="mt-4 rounded-2xl bg-black px-4 py-3 text-sm font-semibold text-white disabled:opacity-40"
        >
          {loading ? "생성 중..." : mode === "emotion" ? "감정 메시지 정리" : "상황 메시지 생성"}
        </button>
      </section>

      {!!result && (
        <section className="mt-5 rounded-[24px] border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="text-sm font-semibold">생성된 메시지</div>
          <div className="mt-3 whitespace-pre-wrap rounded-2xl bg-gray-50 p-4 text-sm leading-7">
            {result}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => copyText("raw")}
              className="rounded-2xl border border-gray-300 px-4 py-2.5 text-sm font-semibold"
            >
              원문 복사
            </button>
            <button
              type="button"
              onClick={() => copyText("ai")}
              className="rounded-2xl bg-black px-4 py-2.5 text-sm font-semibold text-white"
            >
              AI 문장 복사
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2 text-sm">
            <button
              type="button"
              onClick={() => setOutcomeOpen(true)}
              className="rounded-full border px-3 py-1.5"
            >
              보냄/반응 기록하기
            </button>
          </div>

          {saved && <p className="mt-3 text-sm text-green-600">피드백 저장 완료</p>}
        </section>
      )}

      {feedbackOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3">
          <div className="flex h-[min(88vh,640px)] w-full max-w-md flex-col overflow-hidden rounded-[28px] bg-white shadow-xl">
            <div className="border-b border-gray-200 px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <div className="text-base font-bold sm:text-lg">
                  {mode === "emotion" ? "전송 후 느낌" : "상황 피드백"}
                </div>
                <div className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-semibold text-gray-600">
                  {feedbackStep}/2
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4">
              {feedbackStep === 1 ? (
                mode === "emotion" ? (
                  <>
                    <div className="text-sm font-semibold">1. 이렇게 말하고 나니…</div>
                    <Pick name="relief" items={emotionQs.relief} />
                  </>
                ) : (
                  <>
                    <div className="text-sm font-semibold">
                      1. AI가 내 상황을 얼마나 잘 이해했는가
                    </div>
                    <Pick name="understanding" items={situationQs.understanding} />
                  </>
                )
              ) : mode === "emotion" ? (
                <div className="space-y-5">
                  <div>
                    <div className="text-sm font-semibold">2. 필터를 한 번 거치고 나니…</div>
                    <Pick name="self" items={emotionQs.self} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">3. AI 필터 사용으로, 이 관계는</div>
                    <Pick name="relation" items={emotionQs.relation} />
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  <div>
                    <div className="text-sm font-semibold">2. 이 메시지는…</div>
                    <Pick name="usability" items={situationQs.usability} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">
                      3. AI의 도움으로, 상황에 대한 부담감이…
                    </div>
                    <Pick name="burden" items={situationQs.burden} />
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-gray-200 bg-white px-4 py-3">
              <div className="flex gap-2">
                {feedbackStep === 1 ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setFeedbackOpen(false)}
                      className="flex-1 rounded-2xl border border-gray-300 px-4 py-2.5 text-sm"
                    >
                      나중에
                    </button>
                    <button
                      type="button"
                      disabled={!step1Done}
                      onClick={() => setFeedbackStep(2)}
                      className="flex-1 rounded-2xl bg-black px-4 py-2.5 text-sm text-white disabled:opacity-40"
                    >
                      다음
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setFeedbackStep(1)}
                      className="flex-1 rounded-2xl border border-gray-300 px-4 py-2.5 text-sm"
                    >
                      이전
                    </button>
                    <button
                      type="button"
                      disabled={!step2Done}
                      onClick={saveFeedback}
                      className="flex-1 rounded-2xl bg-black px-4 py-2.5 text-sm text-white disabled:opacity-40"
                    >
                      제출
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {outcomeOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-3">
          <div className="w-full max-w-sm rounded-[28px] bg-white p-5 shadow-xl">
            <div className="text-base font-bold">보낸 결과를 기록할까요?</div>
            <p className="mt-2 text-sm leading-6 text-gray-600">
              지금 바로 보냄 여부를 남길 수 있어요. 상대 반응은 나중에
              <span className="font-semibold"> 내 기록 보기</span>에서 업데이트해도 됩니다.
            </p>

            <div className="mt-4 grid gap-2">
              <button
                type="button"
                onClick={() => quickSaveSent("send")}
                className="rounded-2xl border border-gray-300 px-4 py-3 text-sm text-left"
              >
                그대로 보냈어요
              </button>
              <button
                type="button"
                onClick={() => quickSaveSent("edited_send")}
                className="rounded-2xl border border-gray-300 px-4 py-3 text-sm text-left"
              >
                조금 수정해서 보냈어요
              </button>
              <button
                type="button"
                onClick={() => quickSaveSent("not_send")}
                className="rounded-2xl border border-gray-300 px-4 py-3 text-sm text-left"
              >
                아직 안 보냈어요
              </button>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setOutcomeOpen(false)}
                className="flex-1 rounded-2xl border border-gray-300 px-4 py-3 text-sm"
              >
                닫기
              </button>
              <Link
                href="/history"
                className="flex-1 rounded-2xl bg-black px-4 py-3 text-center text-sm text-white"
              >
                내 기록 보기
              </Link>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}