import type { ReportView } from "@/interfaces/IBranchReport";

export function bangkokToday() {
  return new Date(Date.now() + 7 * 3600000).toISOString().slice(0, 10);
}
export function validReportDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
    && date.getUTCFullYear() >= 2000 && date.getUTCFullYear() <= 2200;
}
export function formatReportDate(key: string, options: Intl.DateTimeFormatOptions) {
  return new Date(`${key}T12:00:00Z`).toLocaleDateString("en-GB", { ...options, timeZone: "UTC" });
}
export function shiftReportDate(key: string, view: ReportView, direction: number) {
  const date = new Date(`${key}T12:00:00Z`);
  if (view === "day" || view === "week") date.setUTCDate(date.getUTCDate() + direction * (view === "week" ? 7 : 1));
  else {
    date.setUTCDate(1);
    if (view === "month") date.setUTCMonth(date.getUTCMonth() + direction);
    else date.setUTCFullYear(date.getUTCFullYear() + direction);
  }
  return date.toISOString().slice(0, 10);
}
export function reportLabel(period: { view: ReportView; start: string; end: string }) {
  if (period.view === "year") return period.start.slice(0, 4);
  if (period.view === "month") return formatReportDate(period.start, { month: "long", year: "numeric" });
  if (period.view === "day") return formatReportDate(period.start, { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  const last = shiftReportDate(period.end, "day", -1);
  return `${formatReportDate(period.start, { day: "numeric", month: "short", year: "numeric" })} – ${formatReportDate(last, { day: "numeric", month: "short", year: "numeric" })}`;
}
export const reportMoney = (value: number) => `฿${value.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
