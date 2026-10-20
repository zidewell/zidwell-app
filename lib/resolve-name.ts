// app/lib/resolve-name.ts
export function resolveFullName(row: any): string {
  const direct = String(row?.full_name ?? "").trim();
  if (direct && direct !== "—") return direct;

  const first = String(row?.first_name ?? "").trim();
  const last = String(row?.last_name ?? "").trim();
  const combined = [first, last].filter(Boolean).join(" ").trim();
  if (combined) return combined;

  const name = String(row?.name ?? "").trim();
  if (name) return name;

  const email = String(row?.email ?? "").trim();
  if (email && email.includes("@")) {
    const local = email.split("@")[0];
    const cleaned = local.replace(/[._-]+/g, " ").trim();
    if (cleaned) return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }

  return "—";
}

export function hasRealName(row: any): boolean {
  return !!(
    (row?.full_name && row.full_name !== "—") ||
    row?.first_name ||
    row?.last_name ||
    row?.name
  );
}