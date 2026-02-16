export function getOrCreateAnonUserId() {
  if (typeof window === "undefined") return "server";
  const key = "anon_user_id";
  let v = localStorage.getItem(key);
  if (!v) {
    v = crypto.randomUUID();
    localStorage.setItem(key, v);
  }
  return v;
}
