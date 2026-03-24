export type Row = {
  mode: "emotion" | "situation";
  relation: string | null;
  copied_choice: string | null;
  emotion_relief: string | null;
  emotion_self: string | null;
  emotion_relation: string | null;
  situation_understanding: string | null;
  situation_usability: string | null;
  situation_burden: string | null;
  sent_status: string | null;
  followup_reaction: string | null;
};

export const pct = (n: number, t: number) => (t ? ((n / t) * 100).toFixed(1) : "0.0");
export const count = (rows: any[], key: string, value: string) => rows.filter((r) => r[key] === value).length;
export const topRelations = (rows: Row[]) =>
  Object.entries(rows.reduce((a: Record<string, number>, r) => {
    const k = (r.relation || "(미입력)").trim();
    a[k] = (a[k] || 0) + 1;
    return a;
  }, {})).sort((a, b) => b[1] - a[1]).slice(0, 10);