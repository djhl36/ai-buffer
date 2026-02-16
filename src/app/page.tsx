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
    <main className="min-h-screen flex items-center justify-center p-6">
      <button
        className="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
        onClick={createConversation}
        disabled={loading}
      >
        {loading ? "Creating..." : "Start"}
      </button>
    </main>
  );
}
