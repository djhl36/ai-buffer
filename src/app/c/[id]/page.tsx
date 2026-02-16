"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { getOrCreateAnonUserId } from "@/lib/user";

type MsgRow = {
  id: string;
  draft_text: string;
  ai_text: string | null;
  send_choice: "AI" | "RAW" | null;
  created_at: string;
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

const REL_Q = "이 표현 이후, 나는…";
const REL_CHOICES: Choice[] = [
  { key: "a", label: "관계가 더 나아질 것 같다" },
  { key: "b", label: "전달은 충분히 됐다" },
  { key: "c", label: "전달은 됐지만 마음이 걸린다" },
  { key: "d", label: "괜히 손해 본 느낌이다" },
];

export default function ConversationPage() {
  const params = useParams<{ id: string }>();
  const conversationId = params?.id;
  const userId = useMemo(() => getOrCreateAnonUserId(), []);

  const [draft, setDraft] = useState("");
  const [aiPreview, setAiPreview] = useState("");
  const [loading, setLoading] = useState(false);

  const [msgs, setMsgs] = useState<MsgRow[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const [lastMsgId, setLastMsgId] = useState<string | null>(null);
  const [ratingOpen, setRatingOpen] = useState(false);
  const [evalDraft, setEvalDraft] = useState<{ emotion?: "a"|"b"|"c"|"d"; self?: "a"|"b"|"c"|"d"; relation?: "a"|"b"|"c"|"d" }>({});
  const [followupMap, setFollowupMap] = useState<Record<string, "pos"|"neu"|"neg">>({});

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  const currentMsg = msgs.length ? msgs[msgs.length - 1] : null;
  const historyMsgs = msgs.length > 1 ? msgs.slice(0, -1) : [];

  const ChoiceGrid = ({
    q, choices, value, onPick,
  }: {
    q: string; choices: Choice[]; value?: Choice["key"]; onPick: (k: Choice["key"]) => void;
  }) => (
    <div className="mt-4">
      <div className="text-sm font-semibold text-black">{q}</div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {choices.map((c) => {
          const selected = value === c.key;
          return (
            <button
              key={c.key}
              className={[
                "text-left px-2.5 py-2 rounded border text-xs leading-snug",
                selected ? "bg-black text-white border-black" : "bg-white text-black border-gray-300 hover:border-gray-500",
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

  const generateSuggestion = async () => {
    if (!conversationId) return;
    if (!draft.trim()) return;
    setLoading(true);

    // 1) AI 제안 생성(기존 /api/suggest 사용)
    const r1 = await fetch("/api/suggest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ draft: draft.trim() }),
    });
    const raw = await r1.text();
    let j1: any = {};
    try { j1 = raw ? JSON.parse(raw) : {}; } catch { j1 = {}; }
    if (!r1.ok) {
      alert(j1?.error ?? "AI error");
      setLoading(false);
      return;
    }
    const aiText = (j1?.ai ?? "").toString();
    setAiPreview(aiText);

    // 2) DB 저장은 서버 API로
    const r2 = await fetch("/api/messages/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: userId,
        conversation_id: conversationId,
        draft_text: draft.trim(),
        ai_text: aiText,
      }),
    });

    const raw2 = await r2.text(); // ✅ 먼저 text로 받기
    let j2: any = {};
    try {
      j2 = raw2 ? JSON.parse(raw2) : {};
    } catch {
      // JSON이 아니면(404 HTML 등) 그대로 보여줌
      alert(`save failed (non-JSON). status=${r2.status}\n` + raw2.slice(0, 300));
      setLoading(false);
      return;
    }

    if (!r2.ok) {
      alert(`save failed. status=${r2.status}\n` + (j2?.error ?? raw2));
      setLoading(false);
      return;
    }


    setLastMsgId(j2.message_id);
    setDraft("");
    setLoading(false);
    await loadMessages();
  };

  const chooseAndCopy = async (choice: "AI" | "RAW") => {
    if (!conversationId || !lastMsgId) return;

    const row = msgs.find((m) => m.id === lastMsgId) ?? currentMsg;
    const text = choice === "AI" ? (row?.ai_text ?? aiPreview) : (row?.draft_text ?? "");
    if (!text) return;

    await navigator.clipboard.writeText(text);

    const r = await fetch("/api/messages/choose", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, conversation_id: conversationId, message_id: lastMsgId, choice }),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) {
      alert(j?.error ?? "choose error");
      return;
    }

    setEvalDraft({});
    setRatingOpen(true);
    await loadMessages();
  };

  const submitEvaluation = async () => {
    if (!conversationId || !lastMsgId) return;
    const { emotion, self, relation } = evalDraft;
    if (!emotion || !self || !relation) {
      alert("세 항목을 모두 선택해줘.");
      return;
    }

    const payload = {
      emotion, self, relation,
      emotion_label: EMOTION_CHOICES.find((c) => c.key === emotion)?.label,
      self_label: SELF_CHOICES.find((c) => c.key === self)?.label,
      relation_label: REL_CHOICES.find((c) => c.key === relation)?.label,
    };

    const r = await fetch("/api/eval/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, conversation_id: conversationId, message_id: lastMsgId, payload }),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) {
      alert(j?.error ?? "eval error");
      return;
    }

    setRatingOpen(false);

    // AI eval 틀은 그대로 유지(기본 OFF면 서버가 즉시 skip)
    try {
      const row = msgs.find((m) => m.id === lastMsgId) ?? currentMsg;
      await fetch("/api/ai-eval", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversation_id: conversationId,
          message_id: lastMsgId,
          user_id: userId,
          draft_text: row?.draft_text ?? "",
          ai_text: row?.ai_text ?? "",
          send_choice: row?.send_choice ?? null,
          user_eval: { emotion, self, relation },
        }),
      });
    } catch {}

    await loadMessages();
  };

  const recordFollowup = async (messageId: string, reaction: "pos" | "neu" | "neg") => {
    if (!conversationId) return;

    const r = await fetch("/api/followup/record", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, conversation_id: conversationId, message_id: messageId, reaction }),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) {
      alert(j?.error ?? "followup error");
      return;
    }

    setFollowupMap((m) => ({ ...m, [messageId]: reaction }));
  };

  return (
    <main className="p-6 max-w-2xl mx-auto text-white">
      <div className="flex items-baseline justify-between">
        <h1 className="text-xl font-semibold">Conversation</h1>
        <button className="px-2 py-1 rounded border text-xs" onClick={() => setShowHistory((v) => !v)}>
          {showHistory ? "이전 기록 숨기기" : `이전 기록 보기 (${historyMsgs.length})`}
        </button>
      </div>

      {currentMsg && (
        <section className="mt-6">
          <div className="border rounded p-3 bg-white/5">
            <div className="text-sm font-medium">이번 메시지</div>

            <div className="mt-3 text-sm font-medium">원문</div>
            <div className="mt-1 whitespace-pre-wrap text-sm">{currentMsg.draft_text}</div>

            {currentMsg.ai_text && (
              <>
                <div className="mt-3 text-sm font-medium">AI 버전</div>
                <div className="mt-1 whitespace-pre-wrap text-sm">{currentMsg.ai_text}</div>
              </>
            )}

            {currentMsg.send_choice && (
              <div className="mt-2 text-xs text-gray-300">선택: {currentMsg.send_choice}</div>
            )}

            {currentMsg.send_choice && (
              <div className="mt-3 flex items-center gap-2">
                <div className="text-xs text-gray-300">상대 반응 기록:</div>
                <button className="px-2 py-1 rounded border text-xs" onClick={() => recordFollowup(currentMsg.id, "pos")}>긍정</button>
                <button className="px-2 py-1 rounded border text-xs" onClick={() => recordFollowup(currentMsg.id, "neu")}>중립</button>
                <button className="px-2 py-1 rounded border text-xs" onClick={() => recordFollowup(currentMsg.id, "neg")}>부정</button>
                {followupMap[currentMsg.id] && (
                  <span className="text-xs text-gray-300">저장됨: {followupMap[currentMsg.id]}</span>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {showHistory && historyMsgs.length > 0 && (
        <section className="mt-4">
          <div className="text-xs text-gray-300 mb-2">이전 기록</div>
          <div className="space-y-3">
            {historyMsgs.map((m) => (
              <div key={m.id} className="border rounded p-3 bg-white/5">
                <div className="text-sm font-medium">원문</div>
                <div className="mt-1 whitespace-pre-wrap text-sm">{m.draft_text}</div>
                {m.ai_text && (
                  <>
                    <div className="mt-3 text-sm font-medium">AI 버전</div>
                    <div className="mt-1 whitespace-pre-wrap text-sm">{m.ai_text}</div>
                  </>
                )}
                {m.send_choice && <div className="mt-2 text-xs text-gray-300">선택: {m.send_choice}</div>}
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="mt-6 border rounded p-3 bg-white/5">
        <textarea
          className="w-full border rounded p-2 text-sm text-white bg-transparent"
          rows={4}
          placeholder="보낼 메시지를 입력..."
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        <div className="mt-2 flex gap-2">
          <button className="px-3 py-2 rounded bg-white text-black disabled:opacity-50" onClick={generateSuggestion} disabled={loading || !draft.trim()}>
            {loading ? "Generating..." : "AI 제안 생성"}
          </button>
        </div>

        {aiPreview && (
          <div className="mt-4 border-t border-white/20 pt-3">
            <div className="text-sm font-medium">AI 제안(미리보기)</div>
            <div className="mt-1 whitespace-pre-wrap text-sm border rounded p-2 bg-white/5">{aiPreview}</div>
            <div className="mt-2 flex gap-2">
              <button className="px-3 py-2 rounded border text-white" onClick={() => chooseAndCopy("RAW")}>원문 복사</button>
              <button className="px-3 py-2 rounded bg-white text-black" onClick={() => chooseAndCopy("AI")}>AI 버전 복사</button>
            </div>
            <p className="mt-2 text-xs text-gray-300">복사 후 외부 메신저에 붙여넣어 전송.</p>
          </div>
        )}
      </section>

      {ratingOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white text-black rounded-lg shadow-xl p-4 w-full max-w-md">
            <div className="text-lg font-bold text-black">전송 후 느낌</div>
            <p className="mt-1 text-xs text-gray-700">지금 느낌에 가장 가까운 문장을 골라줘.</p>

            <ChoiceGrid q={EMOTION_Q} choices={EMOTION_CHOICES} value={evalDraft.emotion} onPick={(k) => setEvalDraft((s) => ({ ...s, emotion: k }))} />
            <ChoiceGrid q={SELF_Q} choices={SELF_CHOICES} value={evalDraft.self} onPick={(k) => setEvalDraft((s) => ({ ...s, self: k }))} />
            <ChoiceGrid q={REL_Q} choices={REL_CHOICES} value={evalDraft.relation} onPick={(k) => setEvalDraft((s) => ({ ...s, relation: k }))} />

            <div className="mt-4 flex justify-end gap-2">
              <button className="px-3 py-2 rounded border text-black" onClick={() => setRatingOpen(false)}>나중에</button>
              <button className="px-3 py-2 rounded bg-black text-white" onClick={submitEvaluation}>저장</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
