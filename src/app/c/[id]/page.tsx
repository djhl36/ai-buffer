"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { getOrCreateAnonUserId } from "@/lib/user";

type FeatureType = "emotion" | "situation";

type MsgRow = {
  id: string;
  draft_text: string;
  ai_text: string | null;
  send_choice: "AI" | "RAW" | null;
  created_at: string;
  relation: string | null;
  feature_type: FeatureType | null;
  sent_status: "send" | "edited_send" | "not_send" | null;
  followup_reaction: "pos" | "neu" | "neg" | null;
};

type Choice = { key: "a" | "b" | "c" | "d"; label: string };

const EMOTION_Q = "이렇게 말하고 나니…";
const EMOTION_CHOICES: Choice[] = [
  { key: "a", label: "속이 한결 가벼워졌다" },
  { key: "b", label: "조금 나아진 느낌이다" },
  { key: "c", label: "크게 달라지진 않았다" },
  { key: "d", label: "여전히 감정이 차오른다" },
];

const SELF_Q = "필터를 한 번 거치고 나니…";
const SELF_CHOICES: Choice[] = [
  { key: "a", label: "나답게, 단정해진 느낌이다" },
  { key: "b", label: "선은 지켰다" },
  { key: "c", label: "괜히 더 조심하게 된다" },
  { key: "d", label: "내가 손해 보는 느낌이다" },
];

const REL_Q = "AI 필터 사용으로, 이 관계는 ";
const REL_CHOICES: Choice[] = [
  { key: "a", label: "더 나아질 것 같다" },
  { key: "b", label: "이전과 비슷할 것 같다" },
  { key: "c", label: "살짝 불편해질 것 있다" },
  { key: "d", label: "나를 안 좋게 볼 것 같다" },
];

type SituationEvalState = {
  understanding?: "accurate" | "mostly" | "different" | "wrong";
  utility?: "usable" | "edit" | "idea" | "bad";
  direction?: "my_direction" | "ai_direction" | "neutral" | "worse";
};

export default function ConversationPage() {
  const params = useParams<{ id: string }>();
  const conversationId = params?.id;
  const userId = useMemo(() => getOrCreateAnonUserId(), []);

  const [relation, setRelation] = useState("");
  const [emotionDraft, setEmotionDraft] = useState("");
  const [situationDraft, setSituationDraft] = useState("");

  const [emotionResult, setEmotionResult] = useState("");
  const [situationResult, setSituationResult] = useState("");
  const [loadingFeature, setLoadingFeature] = useState<FeatureType | null>(null);

  const [lastMsgId, setLastMsgId] = useState<string | null>(null);
  const [lastFeatureType, setLastFeatureType] = useState<FeatureType | null>(null);
  const [lastRawText, setLastRawText] = useState("");

  const [msgs, setMsgs] = useState<MsgRow[]>([]);
  const [showHistory, setShowHistory] = useState(true);

  const [emotionRatingOpen, setEmotionRatingOpen] = useState(false);
  const [emotionEvalDraft, setEmotionEvalDraft] = useState<{
    emotion?: "a" | "b" | "c" | "d";
    self?: "a" | "b" | "c" | "d";
    relation?: "a" | "b" | "c" | "d";
  }>({});

  const [situationRatingOpen, setSituationRatingOpen] = useState(false);
  const [situationEvalDraft, setSituationEvalDraft] = useState<SituationEvalState>({});

  const normalizeAiText = (text: string) => {
    let cleaned = (text ?? "").trim();

    try {
      const parsed = JSON.parse(cleaned);
      if (typeof parsed?.message === "string") {
        cleaned = parsed.message.trim();
      }
    } catch {}

    cleaned = cleaned
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```$/g, "")
      .replace(/^\s*\[THOUGHT\]:[\s\S]*$/im, "")
      .replace(/^[\s\S]*?\{"message"\s*:\s*"/, "")
      .replace(/"\s*\}\s*$/, "")
      .replace(/^\s*#{1,6}\s*정리된 메시지\s*\n?/im, "")
      .replace(/^\s*정리된 메시지\s*[:：]?\s*\n?/im, "")
      .replace(/^\s*수정된 메시지\s*[:：]?\s*\n?/im, "")
      .trim();

    return cleaned;
  };

  const loadMessages = async () => {
    if (!conversationId) return;

    const r = await fetch("/api/messages/list", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversation_id: conversationId }),
    });

    const j = await r.json().catch(() => ({}));
    if (!r.ok) {
      alert(j?.error ?? "failed to load");
      return;
    }

    setMsgs(j.messages ?? []);
  };

  useEffect(() => {
    loadMessages();
  }, [conversationId]);

  const generateEmotion = async () => {
    if (!conversationId || !emotionDraft.trim()) return;

    setLoadingFeature("emotion");
    const rawText = emotionDraft.trim();

    const r = await fetch("/api/suggest-emotion", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        relation,
        draft: rawText,
        conversation_id: conversationId,
        user_id: userId,
      }),
    });

    const j = await r.json().catch(() => ({}));

    if (!r.ok) {
      alert(j?.error ?? "AI error");
      setLoadingFeature(null);
      return;
    }

    const aiText = normalizeAiText((j?.ai ?? "").toString());

    setLastMsgId(j?.message_id ?? null);
    setLastFeatureType("emotion");
    setLastRawText(rawText);
    setEmotionResult(aiText);
    setEmotionDraft("");
    setLoadingFeature(null);
    await loadMessages();
  };

  const generateSituation = async () => {
    if (!conversationId || !situationDraft.trim()) return;

    setLoadingFeature("situation");
    const rawText = situationDraft.trim();

    const r = await fetch("/api/suggest-situation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        relation,
        situation: rawText,
        conversation_id: conversationId,
        user_id: userId,
      }),
    });

    const j = await r.json().catch(() => ({}));

    if (!r.ok) {
      alert(j?.error ?? "AI error");
      setLoadingFeature(null);
      return;
    }

    const aiText = normalizeAiText((j?.ai ?? "").toString());

    setLastMsgId(j?.message_id ?? null);
    setLastFeatureType("situation");
    setLastRawText(rawText);
    setSituationResult(aiText);
    setSituationDraft("");
    setLoadingFeature(null);
    await loadMessages();
  };

  const chooseAndCopy = async (choice: "AI" | "RAW", targetMessageId?: string) => {
    const messageId = targetMessageId ?? lastMsgId;
    if (!conversationId || !messageId) return;

    const row = msgs.find((m) => m.id === messageId);
    const feature = row?.feature_type ?? lastFeatureType;

    const rawText = row?.draft_text ?? lastRawText;
    const aiText =
      feature === "emotion"
        ? normalizeAiText(row?.ai_text ?? emotionResult)
        : normalizeAiText(row?.ai_text ?? situationResult);

    const text = choice === "AI" ? aiText : rawText;
    if (!text) return;

    await navigator.clipboard.writeText(text);

    const r = await fetch("/api/messages/choose", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: userId,
        conversation_id: conversationId,
        message_id: messageId,
        choice,
      }),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) {
      alert(j?.error ?? "choose error");
      return;
    }

    setLastMsgId(messageId);
    setLastFeatureType(feature ?? null);

    if (feature === "emotion") {
      setEmotionEvalDraft({});
      setEmotionRatingOpen(true);
    } else if (feature === "situation") {
      setSituationEvalDraft({});
      setSituationRatingOpen(true);
    }

    await loadMessages();
  };

  const submitEmotionEvaluation = async () => {
    if (!conversationId || !lastMsgId) return;

    const { emotion, self, relation } = emotionEvalDraft;
    if (!emotion || !self || !relation) {
      alert("세 항목을 모두 선택해줘.");
      return;
    }

    const payload = {
      emotion,
      self,
      relation,
      emotion_label: EMOTION_CHOICES.find((c) => c.key === emotion)?.label,
      self_label: SELF_CHOICES.find((c) => c.key === self)?.label,
      relation_label: REL_CHOICES.find((c) => c.key === relation)?.label,
    };

    const r = await fetch("/api/eval/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: userId,
        conversation_id: conversationId,
        message_id: lastMsgId,
        payload,
      }),
    });

    const j = await r.json().catch(() => ({}));
    if (!r.ok) {
      alert(j?.error ?? "eval error");
      return;
    }

    setEmotionRatingOpen(false);
    await loadMessages();
  };

  const submitSituationEvaluation = async () => {
    if (!conversationId || !lastMsgId) return;

    const { understanding, utility, direction } = situationEvalDraft;
    if (!understanding || !utility || !direction) {
      alert("세 항목을 모두 선택해줘.");
      return;
    }

    const payload = {
      understanding,
      utility,
      direction,
    };

    const r = await fetch("/api/eval/situation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: userId,
        conversation_id: conversationId,
        message_id: lastMsgId,
        payload,
      }),
    });

    const j = await r.json().catch(() => ({}));
    if (!r.ok) {
      alert(j?.error ?? "eval error");
      return;
    }

    setSituationRatingOpen(false);
    await loadMessages();
  };

  const recordSentStatus = async (
    messageId: string,
    featureType: FeatureType | null,
    sent: "send" | "edited_send" | "not_send"
  ) => {
    if (!conversationId || !featureType) return;

    const r = await fetch("/api/outcome/record", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: userId,
        conversation_id: conversationId,
        message_id: messageId,
        feature_type: featureType,
        sent,
      }),
    });

    const j = await r.json().catch(() => ({}));
    if (!r.ok) {
      alert(j?.error ?? "sent status error");
      return;
    }

    await loadMessages();
  };

  const recordFollowup = async (messageId: string, reaction: "pos" | "neu" | "neg") => {
    if (!conversationId) return;

    const r = await fetch("/api/followup/record", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: userId,
        conversation_id: conversationId,
        message_id: messageId,
        reaction,
      }),
    });

    const j = await r.json().catch(() => ({}));
    if (!r.ok) {
      alert(j?.error ?? "followup error");
      return;
    }

    await loadMessages();
  };

  const ChoiceGrid = ({
    q,
    choices,
    value,
    onPick,
  }: {
    q: string;
    choices: Choice[];
    value?: Choice["key"];
    onPick: (k: Choice["key"]) => void;
  }) => (
    <div className="mt-3">
      <div className="text-sm font-semibold text-black">{q}</div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {choices.map((c) => {
          const selected = value === c.key;
          return (
            <button
              key={c.key}
              className={[
                "text-left px-2.5 py-2 rounded border text-xs leading-snug min-h-[64px]",
                selected
                  ? "bg-black text-white border-black"
                  : "bg-white text-black border-gray-300 hover:border-gray-500",
              ].join(" ")}
              onClick={() => onPick(c.key)}
            >
              {c.label}
            </button>
          );
        })}
      </div>
    </div>
  );

  const SituationChoiceGrid = ({
    q,
    field,
    options,
  }: {
    q: string;
    field: keyof SituationEvalState;
    options: { value: any; label: string }[];
  }) => (
    <div className="mt-3">
      <div className="text-sm font-semibold text-black">{q}</div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {options.map((opt) => {
          const selected = situationEvalDraft[field] === opt.value;
          return (
            <button
              key={opt.value}
              className={[
                "text-left px-2.5 py-2 rounded border text-xs leading-snug min-h-[64px]",
                selected
                  ? "bg-black text-white border-black"
                  : "bg-white text-black border-gray-300 hover:border-gray-500",
              ].join(" ")}
              onClick={() => setSituationEvalDraft((s) => ({ ...s, [field]: opt.value }))}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );

  const currentMsg = msgs.length ? msgs[msgs.length - 1] : null;
  const historyMsgs = msgs.length > 0 ? [...msgs].reverse() : [];

  const SentButtons = ({
    messageId,
    featureType,
    selected,
  }: {
    messageId: string;
    featureType: FeatureType | null;
    selected: MsgRow["sent_status"];
  }) => (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      <div className="text-xs text-gray-400">실제로 보냈는지:</div>
      <button
        className={[
          "px-2 py-1 rounded border text-xs",
          selected === "send" ? "bg-white text-black border-white" : "border-gray-500 text-gray-200",
        ].join(" ")}
        onClick={() => recordSentStatus(messageId, featureType, "send")}
      >
        그대로 보냄
      </button>
      <button
        className={[
          "px-2 py-1 rounded border text-xs",
          selected === "edited_send" ? "bg-white text-black border-white" : "border-gray-500 text-gray-200",
        ].join(" ")}
        onClick={() => recordSentStatus(messageId, featureType, "edited_send")}
      >
        수정 후 보냄
      </button>
      <button
        className={[
          "px-2 py-1 rounded border text-xs",
          selected === "not_send" ? "bg-white text-black border-white" : "border-gray-500 text-gray-200",
        ].join(" ")}
        onClick={() => recordSentStatus(messageId, featureType, "not_send")}
      >
        안 보냄
      </button>
    </div>
  );

  const FollowupButtons = ({
    messageId,
    selected,
  }: {
    messageId: string;
    selected: MsgRow["followup_reaction"];
  }) => (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      <div className="text-xs text-gray-400">실제 반응:</div>
      <button
        className={[
          "px-2 py-1 rounded border text-xs",
          selected === "pos" ? "bg-white text-black border-white" : "border-gray-500 text-gray-200",
        ].join(" ")}
        onClick={() => recordFollowup(messageId, "pos")}
      >
        좋음
      </button>
      <button
        className={[
          "px-2 py-1 rounded border text-xs",
          selected === "neu" ? "bg-white text-black border-white" : "border-gray-500 text-gray-200",
        ].join(" ")}
        onClick={() => recordFollowup(messageId, "neu")}
      >
        중립
      </button>
      <button
        className={[
          "px-2 py-1 rounded border text-xs",
          selected === "neg" ? "bg-white text-black border-white" : "border-gray-500 text-gray-200",
        ].join(" ")}
        onClick={() => recordFollowup(messageId, "neg")}
      >
        나쁨
      </button>
    </div>
  );

  return (
    <main className="p-6 max-w-3xl mx-auto text-white">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">메시지 생성</h1>
          <p className="mt-1 text-sm text-gray-400">
            관계를 먼저 입력하고, 상황 생성 또는 감정 정리 중 하나를 사용해.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button className="px-3 py-2 rounded border text-xs" onClick={() => setShowHistory((v) => !v)}>
            {showHistory ? "이전 기록 숨기기" : `이전 기록 보기 (${historyMsgs.length})`}
          </button>
        </div>
      </div>

      <section className="mt-6 border rounded p-4 bg-white/5">
        <label className="text-xs text-gray-300">누구에게 보내는 메시지인가요?</label>
        <input
          className="mt-1 w-full border rounded p-2 text-sm bg-transparent"
          placeholder="예: 상사 / 친구 / 연인 / 거래처 / 교수"
          value={relation}
          onChange={(e) => setRelation(e.target.value)}
        />
      </section>

      <section className="mt-6 border rounded p-4 bg-white/5">
        <div className="text-sm font-semibold">😓 상황에 맞는 메시지 초안 만들기</div>
        <p className="mt-1 text-xs text-gray-400">
          무슨 말을 해야 할지 모르겠을 때, 상황을 설명하면 보낼 수 있는 초안을 만들어줘.
        </p>
        <textarea
          className="mt-3 w-full border rounded p-2 text-sm text-white bg-transparent"
          rows={5}
          placeholder="예: 동아리 후배가 고백을 했는데 거절해야 한다. 관계는 너무 어색해지고 싶지 않고, 상처는 최소화하고 싶다."
          value={situationDraft}
          onChange={(e) => setSituationDraft(e.target.value)}
        />
        <div className="mt-2">
          <button
            className="px-3 py-2 rounded bg-white text-black disabled:opacity-50"
            onClick={generateSituation}
            disabled={loadingFeature !== null || !situationDraft.trim()}
          >
            {loadingFeature === "situation" ? "Generating..." : "상황 메시지 생성"}
          </button>
        </div>

        {situationResult && (
          <div className="mt-4 border-t border-white/10 pt-4">
            <div className="text-sm font-semibold">생성된 메시지</div>
            <div className="mt-3 whitespace-pre-wrap text-sm border rounded p-3 bg-black/20 min-h-[96px]">
              {situationResult}
            </div>

            {lastFeatureType === "situation" && lastMsgId && (
              <>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button className="px-3 py-2 rounded border text-white" onClick={() => chooseAndCopy("RAW")}>
                    원문 복사
                  </button>
                  <button className="px-3 py-2 rounded bg-white text-black" onClick={() => chooseAndCopy("AI")}>
                    복사
                  </button>
                </div>

                <div className="mt-3">
                  <SentButtons
                    messageId={lastMsgId}
                    featureType={lastFeatureType}
                    selected={currentMsg?.id === lastMsgId ? currentMsg?.sent_status ?? null : null}
                  />
                  <FollowupButtons
                    messageId={lastMsgId}
                    selected={currentMsg?.id === lastMsgId ? currentMsg?.followup_reaction ?? null : null}
                  />
                </div>
              </>
            )}
          </div>
        )}
      </section>

      <section className="mt-6 border rounded p-4 bg-white/5">
        <div className="text-sm font-semibold">🔥 하고 싶은 말을 정리해서 메시지로 바꾸기</div>
        <p className="mt-1 text-xs text-gray-400">
          감정적으로 쓴 문장을 입력하면, 의도는 유지하고 표현만 정리해줘.
        </p>
        <textarea
          className="mt-3 w-full border rounded p-2 text-sm text-white bg-transparent"
          rows={5}
          placeholder="예: 왜 맨날 내가 다 처리해야 돼? 진짜 너무한 거 아니야?"
          value={emotionDraft}
          onChange={(e) => setEmotionDraft(e.target.value)}
        />
        <div className="mt-2">
          <button
            className="px-3 py-2 rounded bg-white text-black disabled:opacity-50"
            onClick={generateEmotion}
            disabled={loadingFeature !== null || !emotionDraft.trim()}
          >
            {loadingFeature === "emotion" ? "Generating..." : "감정 메시지 정리"}
          </button>
        </div>

        {emotionResult && (
          <div className="mt-4 border-t border-white/10 pt-4">
            <div className="text-sm font-semibold">생성된 메시지</div>
            <div className="mt-3 whitespace-pre-wrap text-sm border rounded p-3 bg-black/20 min-h-[96px]">
              {emotionResult}
            </div>

            {lastFeatureType === "emotion" && lastMsgId && (
              <>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button className="px-3 py-2 rounded border text-white" onClick={() => chooseAndCopy("RAW")}>
                    원문 복사
                  </button>
                  <button className="px-3 py-2 rounded bg-white text-black" onClick={() => chooseAndCopy("AI")}>
                    복사
                  </button>
                </div>

                <div className="mt-3">
                  <SentButtons
                    messageId={lastMsgId}
                    featureType={lastFeatureType}
                    selected={currentMsg?.id === lastMsgId ? currentMsg?.sent_status ?? null : null}
                  />
                  <FollowupButtons
                    messageId={lastMsgId}
                    selected={currentMsg?.id === lastMsgId ? currentMsg?.followup_reaction ?? null : null}
                  />
                </div>
              </>
            )}
          </div>
        )}
      </section>

      {showHistory && (
        <section className="mt-6 border rounded p-4 bg-white/5">
          <div className="text-sm font-semibold">이전 기록</div>
          <div className="mt-3 space-y-3">
            {historyMsgs.length === 0 && <div className="text-sm text-gray-400">아직 기록이 없어.</div>}

            {historyMsgs.map((m) => {
              const sentText =
                m.send_choice === "RAW" ? m.draft_text : normalizeAiText(m.ai_text ?? "");

              return (
                <div key={m.id} className="border rounded p-3 bg-black/20">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400">
                    <span>{m.feature_type === "emotion" ? "감정 정리" : "상황 생성"}</span>
                    <span>·</span>
                    <span>{m.relation || "관계 미입력"}</span>
                    <span>·</span>
                    <span>{new Date(m.created_at).toLocaleString("ko-KR")}</span>
                  </div>

                  <div className="mt-3">
                    <div className="text-xs text-gray-400">입력</div>
                    <div className="mt-1 whitespace-pre-wrap text-sm">{m.draft_text}</div>
                  </div>

                  {m.ai_text && (
                    <div className="mt-3">
                      <div className="text-xs text-gray-400">생성된 메시지</div>
                      <div className="mt-1 whitespace-pre-wrap text-sm">{normalizeAiText(m.ai_text)}</div>
                    </div>
                  )}

                  {m.send_choice && (
                    <div className="mt-3">
                      <div className="text-xs text-gray-400">실제로 선택한 내용</div>
                      <div className="mt-1 whitespace-pre-wrap text-sm">{sentText || "(없음)"}</div>
                    </div>
                  )}

                  <div className="mt-3 flex flex-wrap gap-2">
                    <button className="px-2.5 py-1.5 rounded border text-xs" onClick={() => chooseAndCopy("RAW", m.id)}>
                      원문 복사
                    </button>
                    <button className="px-2.5 py-1.5 rounded bg-white text-black text-xs" onClick={() => chooseAndCopy("AI", m.id)}>
                      복사
                    </button>
                  </div>

                  <SentButtons messageId={m.id} featureType={m.feature_type} selected={m.sent_status} />
                  <FollowupButtons messageId={m.id} selected={m.followup_reaction} />
                </div>
              );
            })}
          </div>
        </section>
      )}

      {emotionRatingOpen && (
        <div className="fixed inset-0 bg-black/45 flex items-center justify-center p-3 z-50">
          <div className="bg-white text-black rounded-lg shadow-xl w-full max-w-md p-4">
            <div className="text-lg font-bold text-black">전송 후 느낌</div>
            <p className="mt-1 text-xs text-gray-700">지금 느낌에 가장 가까운 문장을 골라줘.</p>

            <ChoiceGrid
              q={EMOTION_Q}
              choices={EMOTION_CHOICES}
              value={emotionEvalDraft.emotion}
              onPick={(k) => setEmotionEvalDraft((s) => ({ ...s, emotion: k }))}
            />
            <ChoiceGrid
              q={SELF_Q}
              choices={SELF_CHOICES}
              value={emotionEvalDraft.self}
              onPick={(k) => setEmotionEvalDraft((s) => ({ ...s, self: k }))}
            />
            <ChoiceGrid
              q={REL_Q}
              choices={REL_CHOICES}
              value={emotionEvalDraft.relation}
              onPick={(k) => setEmotionEvalDraft((s) => ({ ...s, relation: k }))}
            />

            <div className="mt-4 flex justify-end gap-2">
              <button className="px-3 py-2 rounded border text-black" onClick={() => setEmotionRatingOpen(false)}>
                나중에
              </button>
              <button className="px-3 py-2 rounded bg-black text-white" onClick={submitEmotionEvaluation}>
                저장
              </button>
            </div>
          </div>
        </div>
      )}

      {situationRatingOpen && (
        <div className="fixed inset-0 bg-black/45 flex items-center justify-center p-3 z-50">
          <div className="bg-white text-black rounded-lg shadow-xl w-full max-w-lg p-4">
            <div className="text-lg font-bold text-black">상황 피드백</div>
            <p className="mt-1 text-xs text-gray-700">세 항목만 빠르게 골라줘.</p>

            <SituationChoiceGrid
              q="AI가 상황을 이해한 정도는…"
              field="understanding"
              options={[
                { value: "accurate", label: "내 상황을 정확히 이해한 표현 같다" },
                { value: "mostly", label: "대체로 맞지만 조금 어색하다" },
                { value: "different", label: "내 상황과 조금 다르다" },
                { value: "wrong", label: "상황을 잘못 이해했다" },
              ]}
            />

            <SituationChoiceGrid
              q="이 메시지는…"
              field="utility"
              options={[
                { value: "usable", label: "바로 사용할 수 있는 메시지다" },
                { value: "edit", label: "조금 수정하면 사용할 수 있다" },
                { value: "idea", label: "아이디어 정도는 됐다" },
                { value: "bad", label: "도움이 되지 않았다" },
              ]}
            />

            <SituationChoiceGrid
              q="이 표현 이후 상황은…"
              field="direction"
              options={[
                { value: "my_direction", label: "내가 원하는 방향으로 이어질 것 같다" },
                { value: "ai_direction", label: "AI가 제안한 방향으로 이어질 것 같다" },
                { value: "neutral", label: "전달은 되겠지만 마음이 걸린다" },
                { value: "worse", label: "오히려 상황이 나빠질 것 같다" },
              ]}
            />

            <div className="mt-4 flex justify-end gap-2">
              <button className="px-3 py-2 rounded border text-black" onClick={() => setSituationRatingOpen(false)}>
                나중에
              </button>
              <button className="px-3 py-2 rounded bg-black text-white" onClick={submitSituationEvaluation}>
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}