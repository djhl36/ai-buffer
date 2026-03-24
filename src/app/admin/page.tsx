import { supabaseAdmin } from "@/lib/supabase";
import { count, pct, topRelations, type Row } from "@/lib/stats";

export const dynamic = "force-dynamic";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ key?: string }>;
}) {
  const { key } = await searchParams;

  if (key !== process.env.ADMIN_PASSWORD) {
    return <main className="p-6">접근 불가</main>;
  }

  const { data } = await supabaseAdmin
    .from("messages")
    .select(
      "mode,relation,copied_choice,emotion_relief,emotion_self,emotion_relation,situation_understanding,situation_usability,situation_burden,sent_status,followup_reaction,created_at"
    )
    .order("created_at", { ascending: false })
    .limit(3000);

  const rows = (data || []) as Row[];

  const emotion = rows.filter((r) => r.mode === "emotion");
  const situation = rows.filter((r) => r.mode === "situation");
  const copied = rows.filter((r) => r.copied_choice);

  return (
    <main className="mx-auto max-w-5xl p-6">
      <h1 className="text-2xl font-bold">Admin Stats</h1>
      <p className="mt-2 text-sm text-gray-500">
        최근 {rows.length}개 데이터
      </p>

      {/* 기본 수치 */}
      <section className="mt-6 grid gap-4 md:grid-cols-3">
        <Card label="전체 생성" value={rows.length} />
        <Card label="감정 정리" value={emotion.length} />
        <Card label="상황 생성" value={situation.length} />
      </section>

      {/* 복사율 */}
      <section className="mt-6 rounded-2xl border p-4">
        <h2 className="font-semibold">복사 선택</h2>
        <p className="mt-2 text-sm">
          AI 복사율:{" "}
          <b>{pct(count(copied, "copied_choice", "ai"), copied.length)}%</b>
        </p>
        <p className="mt-1 text-sm">
          원문 복사율:{" "}
          <b>{pct(count(copied, "copied_choice", "raw"), copied.length)}%</b>
        </p>
      </section>

      {/* 관계 */}
      <section className="mt-6 grid gap-4 md:grid-cols-2">
        <Box title="Emotion 관계 Top">
          {topRelations(emotion).map(([k, v]) => (
            <RowItem key={k} label={k} value={v} />
          ))}
        </Box>

        <Box title="Situation 관계 Top">
          {topRelations(situation).map(([k, v]) => (
            <RowItem key={k} label={k} value={v} />
          ))}
        </Box>
      </section>

      {/* 결과 */}
      <section className="mt-6 rounded-2xl border p-4">
        <h2 className="font-semibold">전송 결과</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2 text-sm">
          <div>
            <div className="font-medium">보냈는지</div>
            <Stat rows={rows} field="sent_status" value="send" label="그대로 보냄" />
            <Stat rows={rows} field="sent_status" value="edited_send" label="수정 후 보냄" />
            <Stat rows={rows} field="sent_status" value="not_send" label="안 보냄" />
          </div>

          <div>
            <div className="font-medium">상대 반응</div>
            <Stat rows={rows} field="followup_reaction" value="pos" label="좋음" />
            <Stat rows={rows} field="followup_reaction" value="neu" label="중립" />
            <Stat rows={rows} field="followup_reaction" value="neg" label="나쁨" />
          </div>
        </div>
      </section>
    </main>
  );
}

/* ---------- UI 컴포넌트 ---------- */

function Card({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border p-4">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="mt-2 text-3xl font-bold">{value}</div>
    </div>
  );
}

function Box({ title, children }: any) {
  return (
    <div className="rounded-2xl border p-4">
      <h2 className="font-semibold">{title}</h2>
      <div className="mt-3 space-y-2 text-sm">{children}</div>
    </div>
  );
}

function RowItem({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between rounded-xl bg-gray-50 px-3 py-2">
      <span>{label}</span>
      <b>{value}</b>
    </div>
  );
}

function Stat({
  rows,
  field,
  value,
  label,
}: {
  rows: Row[];
  field: string;
  value: string;
  label: string;
}) {
  return (
    <div className="mt-1">
      {label}: <b>{pct(count(rows, field, value), rows.length)}%</b>
    </div>
  );
}