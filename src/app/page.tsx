"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getOrCreateAnonUserId } from "@/lib/user";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const createConversation = async () => {
    setLoading(true);

    try {
      const user_id = getOrCreateAnonUserId();

      const r = await fetch("/api/conversation/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id }),
      });

      const j = await r.json().catch(() => ({}));

      if (!r.ok) {
        alert(j?.error ?? "Failed to create conversation");
        setLoading(false);
        return;
      }

      router.push(`/c/${j.id}`);
    } catch (e: any) {
      alert(e?.message ?? "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 text-center">

      <h1 className="text-3xl font-bold mb-3">
        감정 메시지 정리 AI
      </h1>

      <p className="text-gray-500 mb-8 max-w-md">
        화난 상태에서 보낸 메시지로 관계가 망가지는 일을 줄이기 위한 도구입니다.
        감정적으로 쓴 문장을 입력하면 AI가 **의도를 유지하면서 더 좋은 표현으로 정리**합니다.
      </p>

      <div className="grid grid-cols-3 gap-6 mb-10 text-sm">

        <div className="flex flex-col items-center">
          <div className="text-4xl">🔥</div>
          <p className="mt-2">화난 상태</p>
        </div>

        <div className="flex flex-col items-center">
          <div className="text-4xl">😓</div>
          <p className="mt-2">곤란한 상황</p>
        </div>

        <div className="flex flex-col items-center">
          <div className="text-4xl">🤝</div>
          <p className="mt-2">협상 / 비즈니스</p>
        </div>

      </div>

      <button
        className="px-6 py-3 rounded bg-black text-white text-lg disabled:opacity-50"
        onClick={createConversation}
        disabled={loading}
      >
        {loading ? "Starting..." : "메시지 정리 시작"}
      </button>

      <p className="text-xs text-gray-400 mt-6">
        입력한 메시지는 AI 교정 실험을 위해 익명으로 기록될 수 있습니다.
      </p>

    </main>
  );
}