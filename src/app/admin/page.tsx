import { supabaseServer } from "@/lib/supabaseServer";

type EventRow = {
  type: string;
  payload: any;
  created_at: string;
};

export default async function AdminPage() {
  // 최근 N개 이벤트만 (가벼운 MVP)
  const LIMIT = 2000;

  const { data, error } = await supabaseServer
    .from("events")
    .select("type,payload,created_at")
    .order("created_at", { ascending: false })
    .limit(LIMIT);

  if (error) {
    return (
      <main className="p-6">
        <h1 className="text-xl font-semibold">Admin Stats</h1>
        <p className="mt-4 text-red-600">Error: {error.message}</p>
      </main>
    );
  }

  const ev = (data ?? []) as EventRow[];

  const sendChoices = ev.filter((e) => e.type === "send_choice");
  const aiSends = sendChoices.filter((e) => e.payload?.choice === "AI").length;
  const rawSends = sendChoices.filter((e) => e.payload?.choice === "RAW").length;
  const totalSends = sendChoices.length;
  const aiRate = totalSends ? (aiSends / totalSends) * 100 : 0;

  const evals = ev.filter((e) => e.type === "post_send_eval_v2");
  const pct = (key: string, val: string) =>
    evals.length ? (evals.filter((e) => e.payload?.[key] === val).length / evals.length) * 100 : 0;

  const followups = ev.filter((e) => e.type === "followup");
  const followupPct = (val: string) =>
    followups.length ? (followups.filter((e) => e.payload?.reaction === val).length / followups.length) * 100 : 0;

  return (
    <main className="p-6 max-w-3xl mx-auto">
      <h1 className="text-xl font-semibold">Admin Stats</h1>
      <p className="mt-2 text-sm opacity-70">최근 {LIMIT}개 이벤트 기준</p>

      <section className="mt-6 border rounded p-4">
        <h2 className="font-semibold">Send Choice</h2>
        <div className="mt-2 text-sm">
          총 전송 선택: <b>{totalSends}</b>
        </div>
        <div className="mt-1 text-sm">
          AI: <b>{aiSends}</b> / RAW: <b>{rawSends}</b> / AI 선택률: <b>{aiRate.toFixed(1)}%</b>
        </div>
      </section>

      <section className="mt-6 border rounded p-4">
        <h2 className="font-semibold">Post-send Eval (v2)</h2>
        <div className="mt-2 text-sm">
          총 평가 수: <b>{evals.length}</b>
        </div>

        <div className="mt-4 text-sm font-semibold">감정(emotion)</div>
        <ul className="mt-2 text-sm list-disc pl-5">
          <li>a: {pct("emotion", "a").toFixed(1)}%</li>
          <li>b: {pct("emotion", "b").toFixed(1)}%</li>
          <li>c: {pct("emotion", "c").toFixed(1)}%</li>
          <li>d: {pct("emotion", "d").toFixed(1)}%</li>
        </ul>

        <div className="mt-4 text-sm font-semibold">자존감(self)</div>
        <ul className="mt-2 text-sm list-disc pl-5">
          <li>a: {pct("self", "a").toFixed(1)}%</li>
          <li>b: {pct("self", "b").toFixed(1)}%</li>
          <li>c: {pct("self", "c").toFixed(1)}%</li>
          <li>d: {pct("self", "d").toFixed(1)}%</li>
        </ul>

        <div className="mt-4 text-sm font-semibold">관계(relation)</div>
        <ul className="mt-2 text-sm list-disc pl-5">
          <li>a: {pct("relation", "a").toFixed(1)}%</li>
          <li>b: {pct("relation", "b").toFixed(1)}%</li>
          <li>c: {pct("relation", "c").toFixed(1)}%</li>
          <li>d: {pct("relation", "d").toFixed(1)}%</li>
        </ul>
      </section>

      <section className="mt-6 border rounded p-4">
        <h2 className="font-semibold">Followup</h2>
        <div className="mt-2 text-sm">
          총 반응 기록 수: <b>{followups.length}</b>
        </div>
        <div className="mt-2 text-sm">
          긍정: <b>{followupPct("pos").toFixed(1)}%</b> / 중립:{" "}
          <b>{followupPct("neu").toFixed(1)}%</b> / 부정: <b>{followupPct("neg").toFixed(1)}%</b>
        </div>
      </section>
    </main>
  );
}
