"use client";

const KEY = "ai-buffer-user";

export function getUserId() {
  if (typeof window === "undefined") return "";
  const old = localStorage.getItem(KEY);
  if (old) return old;
  const id = crypto.randomUUID();
  localStorage.setItem(KEY, id);
  return id;
}