"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getUserId } from "@/lib/user";

type Item = {
  id: string;
  mode: "emotion" | "situation";
  relation: string | null;
  input_text: string;
  output_text: string;
  copied_choice: string | null;
  sent_status: string | null;
  followup_reaction: string | null;
  created_at: string;
};

export default function Page() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const r = await fetch(`/api/history?user_id=${encodeURIComponent(getUserId())}`);
      const j = await r.json();
      if (r.ok) setItems(j.items || []);
    } finally {
      setLoading(false);
    }
  }

  async function patch(id: string, body: Record<string, string>) {
    await fetch("/api/mark-outcome", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...body }),
    });
    await load();
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <main className="mx-auto max-w-4xl px-4 py-6 sm:px-5 sm:py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/" className="text-sm text-gray-500">
            ← 홈
          </Link>
          <h1 className="mt-2 text-2xl font-bold">내 기록 보기</h1>
          <p className="mt-1 text-sm text-gray-600">
            이전에 만든 메시지와 보냄 여부, 상대 반응을 기록할 수 있어요.
          </p>
        </div>

        <button
          type="button"
          onClick={load}
          className="rounded-full border border-gray-300 px-4 py-2 text-sm"
        >
          새로고침
        </button>
      </div>

      {loading ? (
        <div className="mt-6 text-sm text-gray-500">불러오는 중...</div>
      ) : items.length === 0 ? (
        <div className="mt-6 rounded-3xl border border-gray-200 bg-white p-6 text-sm text-gray-500">
          아직 기록이 없습니다.
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {items.map((item) => (
            <section
              key={item.id}
              className="rounded-[24px] border border-gray-200 bg-white p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                <span className="rounded-full bg-gray-100 px-2 py-1">
                  {item.mode === "emotion" ? "감정" : "상황"}
                </span>
                <span>{new Date(item.created_at).toLocaleString()}</span>
                {item.relation ? <span>· {item.relation}</span> : null}
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <div className="text-sm font-semibold">입력</div>
                  <div className="mt-2 rounded-2xl bg-gray-50 p-3 text-sm leading-6">
                    {item.input_text}
                  </div>
                </div>

                <div>
                  <div className="text-sm font-semibold">생성 결과</div>
                  <div className="mt-2 rounded-2xl bg-gray-50 p-3 text-sm leading-6">
                    {item.output_text}
                  </div>
                </div>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <div className="text-sm font-semibold">보냄 여부</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Choice
                      active={item.sent_status === "send"}
                      onClick={() => patch(item.id, { sent_status: "send" })}
                    >
                      그대로 보냄
                    </Choice>
                    <Choice
                      active={item.sent_status === "edited_send"}
                      onClick={() => patch(item.id, { sent_status: "edited_send" })}
                    >
                      수정 후 보냄
                    </Choice>
                    <Choice
                      active={item.sent_status === "not_send"}
                      onClick={() => patch(item.id, { sent_status: "not_send" })}
                    >
                      안 보냄
                    </Choice>
                  </div>
                </div>

                <div>
                  <div className="text-sm font-semibold">상대 반응</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Choice
                      active={item.followup_reaction === "pos"}
                      onClick={() => patch(item.id, { followup_reaction: "pos" })}
                    >
                      좋음
                    </Choice>
                    <Choice
                      active={item.followup_reaction === "neu"}
                      onClick={() => patch(item.id, { followup_reaction: "neu" })}
                    >
                      중립
                    </Choice>
                    <Choice
                      active={item.followup_reaction === "neg"}
                      onClick={() => patch(item.id, { followup_reaction: "neg" })}
                    >
                      나쁨
                    </Choice>
                  </div>
                </div>
              </div>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}

function Choice({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-sm ${
        active ? "border-black bg-black text-white" : "border-gray-300 bg-white"
      }`}
    >
      {children}
    </button>
  );
}