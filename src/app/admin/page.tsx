import { supabaseServer } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

type EventRow = {
  type: string;
  feature_type: "emotion" | "situation" | null;
  payload: any;
  created_at: string;
};

export default async function AdminPage() {
  const LIMIT = 3000;

  const { data, error } = await supabaseServer
    .from("events")
    .select("type,feature_type,payload,created_at")
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

  const generateEvents = ev.filter((e) => e.type === "generate");
  const emotionGenerates = generateEvents.filter((e) => e.feature_type === "emotion");
  const situationGenerates = generateEvents.filter((e) => e.feature_type === "situation");

  const sendChoices = ev.filter((e) => e.type === "send_choice");
  const aiSends = sendChoices.filter((e) => e.payload?.choice === "AI").length;
  const rawSends = sendChoices.filter((e) => e.payload?.choice === "RAW").length;
  const totalSends = sendChoices.length;
  const aiRate = totalSends ? (aiSends / totalSends) * 100 : 0;

  const emotionEvals = ev.filter(
    (e) => e.type === "post_send_eval" && e.feature_type === "emotion"
  );

  const situationEvals = ev.filter(
    (e) => e.type === "post_send_eval" && e.feature_type === "situation"
  );

  const followups = ev.filter((e) => e.type === "followup");

  const avg = (rows: EventRow[], key: string) => {
    const vals = rows
      .map((e) => Number(e.payload?.[key] ?? 0))
      .filter((n) => Number.isFinite(n) && n > 0);

    if (!vals.length) return 0;
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  };

  const pct = (rows: EventRow[], key: string, val: string) =>
    rows.length
      ? (rows.filter((e) => e.payload?.[key] === val).length / rows.length) * 100
      : 0;

  const countRelation = (rows: EventRow[]) => {
    const map = new Map<string, number>();

    for (const row of rows) {
      const relation = (row.payload?.relation ?? "").toString().trim() || "(미입력)";
      map.set(relation, (map.get(relation) ?? 0) + 1);
    }

    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
  };

  const topEmotionRelations = countRelation(emotionGenerates);
  const topSituationRelations = countRelation(situationGenerates);

  const situationSentCount = (val: string) =>
    situationEvals.filter((e) => e.payload?.sent === val).length;

  const situationUnderstandingPct = (val: string) =>
    pct(situationEvals, "understanding", val);

  const situationUtilityPct = (val: string) =>
    pct(situationEvals, "utility", val);

  const situationDirectionPct = (val: string) =>
    pct(situationEvals, "direction", val);

  const emotionPct = (key: string, val: string) =>
    pct(emotionEvals, key, val);

  const followupPct = (val: string) =>
    followups.length
      ? (followups.filter((e) => e.payload?.reaction === val).length / followups.length) * 100
      : 0;

  return (
    <main className="p-6 max-w-5xl mx-auto">
      <h1 className="text-xl font-semibold">Admin Stats</h1>
      <p className="mt-2 text-sm opacity-70">최근 {LIMIT}개 이벤트 기준</p>

      <section className="mt-6 border rounded p-4">
        <h2 className="font-semibold">Feature Usage</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <div className="border rounded p-3">
            <div className="text-sm font-medium">Emotion</div>
            <div className="mt-2 text-sm">
              생성 수: <b>{emotionGenerates.length}</b>
            </div>
            <div className="mt-1 text-sm">
              평균 입력 길이: <b>{avg(emotionGenerates, "input_length").toFixed(1)}</b>
            </div>
            <div className="mt-1 text-sm">
              평균 출력 길이: <b>{avg(emotionGenerates, "ai_length").toFixed(1)}</b>
            </div>
          </div>

          <div className="border rounded p-3">
            <div className="text-sm font-medium">Situation</div>
            <div className="mt-2 text-sm">
              생성 수: <b>{situationGenerates.length}</b>
            </div>
            <div className="mt-1 text-sm">
              평균 입력 길이: <b>{avg(situationGenerates, "input_length").toFixed(1)}</b>
            </div>
            <div className="mt-1 text-sm">
              평균 출력 길이: <b>{avg(situationGenerates, "ai_length").toFixed(1)}</b>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6 border rounded p-4">
        <h2 className="font-semibold">Top Relations</h2>

        <div className="mt-4 grid gap-6 md:grid-cols-2">
          <div>
            <div className="text-sm font-medium">Emotion 관계 Top 10</div>
            <div className="mt-2 space-y-1 text-sm">
              {topEmotionRelations.length ? (
                topEmotionRelations.map(([relation, count]) => (
                  <div key={`emotion-${relation}`} className="flex justify-between border rounded px-3 py-2">
                    <span>{relation}</span>
                    <b>{count}</b>
                  </div>
                ))
              ) : (
                <div className="text-sm opacity-70">데이터 없음</div>
              )}
            </div>
          </div>

          <div>
            <div className="text-sm font-medium">Situation 관계 Top 10</div>
            <div className="mt-2 space-y-1 text-sm">
              {topSituationRelations.length ? (
                topSituationRelations.map(([relation, count]) => (
                  <div key={`situation-${relation}`} className="flex justify-between border rounded px-3 py-2">
                    <span>{relation}</span>
                    <b>{count}</b>
                  </div>
                ))
              ) : (
                <div className="text-sm opacity-70">데이터 없음</div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6 border rounded p-4">
        <h2 className="font-semibold">Emotion Send Choice</h2>
        <div className="mt-2 text-sm">
          총 전송 선택: <b>{totalSends}</b>
        </div>
        <div className="mt-1 text-sm">
          AI: <b>{aiSends}</b> / RAW: <b>{rawSends}</b> / AI 선택률: <b>{aiRate.toFixed(1)}%</b>
        </div>
      </section>

      <section className="mt-6 border rounded p-4">
        <h2 className="font-semibold">Emotion Post-send Eval</h2>
        <div className="mt-2 text-sm">
          총 평가 수: <b>{emotionEvals.length}</b>
        </div>

        <div className="mt-4 text-sm font-semibold">감정(emotion)</div>
        <ul className="mt-2 text-sm list-disc pl-5">
          <li>a: {emotionPct("emotion", "a").toFixed(1)}%</li>
          <li>b: {emotionPct("emotion", "b").toFixed(1)}%</li>
          <li>c: {emotionPct("emotion", "c").toFixed(1)}%</li>
          <li>d: {emotionPct("emotion", "d").toFixed(1)}%</li>
        </ul>

        <div className="mt-4 text-sm font-semibold">자기감각(self)</div>
        <ul className="mt-2 text-sm list-disc pl-5">
          <li>a: {emotionPct("self", "a").toFixed(1)}%</li>
          <li>b: {emotionPct("self", "b").toFixed(1)}%</li>
          <li>c: {emotionPct("self", "c").toFixed(1)}%</li>
          <li>d: {emotionPct("self", "d").toFixed(1)}%</li>
        </ul>

        <div className="mt-4 text-sm font-semibold">관계(relation)</div>
        <ul className="mt-2 text-sm list-disc pl-5">
          <li>a: {emotionPct("relation", "a").toFixed(1)}%</li>
          <li>b: {emotionPct("relation", "b").toFixed(1)}%</li>
          <li>c: {emotionPct("relation", "c").toFixed(1)}%</li>
          <li>d: {emotionPct("relation", "d").toFixed(1)}%</li>
        </ul>
      </section>

      <section className="mt-6 border rounded p-4">
        <h2 className="font-semibold">Situation Post-send Eval</h2>
        <div className="mt-2 text-sm">
          총 평가 수: <b>{situationEvals.length}</b>
        </div>

        <div className="mt-4 text-sm font-semibold">실제 전송 여부</div>
        <ul className="mt-2 text-sm list-disc pl-5">
          <li>
            그대로 보냈다:{" "}
            <b>
              {situationEvals.length
                ? ((situationSentCount("send") / situationEvals.length) * 100).toFixed(1)
                : "0.0"}
              %
            </b>
          </li>
          <li>
            수정해서 보냈다:{" "}
            <b>
              {situationEvals.length
                ? ((situationSentCount("edited_send") / situationEvals.length) * 100).toFixed(1)
                : "0.0"}
              %
            </b>
          </li>
          <li>
            보내지 않았다:{" "}
            <b>
              {situationEvals.length
                ? ((situationSentCount("not_send") / situationEvals.length) * 100).toFixed(1)
                : "0.0"}
              %
            </b>
          </li>
        </ul>

        <div className="mt-4 text-sm font-semibold">상황 이해 정도</div>
        <ul className="mt-2 text-sm list-disc pl-5">
          <li>정확하다: {situationUnderstandingPct("accurate").toFixed(1)}%</li>
          <li>대체로 맞다: {situationUnderstandingPct("mostly").toFixed(1)}%</li>
          <li>조금 다르다: {situationUnderstandingPct("different").toFixed(1)}%</li>
          <li>잘못 이해했다: {situationUnderstandingPct("wrong").toFixed(1)}%</li>
        </ul>

        <div className="mt-4 text-sm font-semibold">해결 도움 정도</div>
        <ul className="mt-2 text-sm list-disc pl-5">
          <li>바로 사용할 수 있다: {situationUtilityPct("usable").toFixed(1)}%</li>
          <li>조금 수정하면 된다: {situationUtilityPct("edit").toFixed(1)}%</li>
          <li>아이디어 정도는 됐다: {situationUtilityPct("idea").toFixed(1)}%</li>
          <li>도움이 안 된다: {situationUtilityPct("bad").toFixed(1)}%</li>
        </ul>

        <div className="mt-4 text-sm font-semibold">이 표현 이후 상황</div>
        <ul className="mt-2 text-sm list-disc pl-5">
          <li>내가 원하는 방향: {situationDirectionPct("my_direction").toFixed(1)}%</li>
          <li>AI가 제안한 방향: {situationDirectionPct("ai_direction").toFixed(1)}%</li>
          <li>전달은 되지만 마음이 걸림: {situationDirectionPct("neutral").toFixed(1)}%</li>
          <li>오히려 나빠질 것 같음: {situationDirectionPct("worse").toFixed(1)}%</li>
        </ul>
      </section>

      <section className="mt-6 border rounded p-4">
        <h2 className="font-semibold">Followup</h2>
        <div className="mt-2 text-sm">
          총 반응 기록 수: <b>{followups.length}</b>
        </div>
        <div className="mt-2 text-sm">
          긍정: <b>{followupPct("pos").toFixed(1)}%</b> / 중립: <b>{followupPct("neu").toFixed(1)}%</b> / 부정:{" "}
          <b>{followupPct("neg").toFixed(1)}%</b>
        </div>
      </section>
    </main>
  );
}