"use client";

import { useEffect, useState } from "react";
import { ArrowPathIcon, ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import PerformanceChart from "./PerformanceChart";
import { getBaseUrl } from "@/lib/api";
import { bangkokToday, shiftReportDate, validReportDate } from "@/lib/reportDates";
import type { PerformanceReport, ReportView } from "@/interfaces/IBranchReport";
import styles from "./DashboardPerformance.module.css";

const views: ReportView[] = ["day", "week", "month", "year"];

export default function DashboardPerformance({ refreshKey }: { refreshKey: number }) {
  const [{ view, date }, setPeriod] = useState<{ view: ReportView; date: string }>(() => ({ view: "month", date: bangkokToday() }));
  const [metric, setMetric] = useState<"bookings" | "revenue">("bookings");
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState<{ key: string; data?: PerformanceReport; error?: string }>({ key: "" });
  const requestKey = `${view}-${date}-${refreshKey}-${revision}`;
  const loading = result.key !== requestKey;
  const previousDate = shiftReportDate(date, view, -1), nextDate = shiftReportDate(date, view, 1);
  const resetLabel = { day: "Today", week: "This week", month: "This month", year: "This year" }[view];

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const query = new URLSearchParams({ view, date });
        const response = await fetch(`${getBaseUrl()}/admin/dashboard/performance?${query}`, { credentials: "include", cache: "no-store", signal: controller.signal });
        if (!response.ok) throw new Error(response.status === 401 || response.status === 403 ? "Your session has expired. Sign in again to view performance." : "Could not load dashboard performance. Try again.");
        const body: { data: PerformanceReport } = await response.json();
        if (!controller.signal.aborted) setResult({ key: requestKey, data: body.data });
      } catch (error) {
        if (!controller.signal.aborted) setResult({ key: requestKey, error: error instanceof Error ? error.message : "Could not load dashboard performance. Try again." });
      }
    }
    void load();
    return () => controller.abort();
  }, [view, date, requestKey]);

  function changePeriod(nextView: ReportView, nextAnchor = date) {
    if (validReportDate(nextAnchor)) setPeriod({ view: nextView, date: nextAnchor });
  }

  return <article className={styles.performance} aria-label="All branch performance">
    <header className={styles.heading}>
      <div><h2>All branch performance</h2><p>Bookings and revenue across every branch.</p></div>
      <button type="button" className={styles.icon} aria-label="Refresh dashboard performance" disabled={loading} onClick={() => setRevision((value) => value + 1)}><ArrowPathIcon /></button>
    </header>
    <div className={styles.period} aria-label="Dashboard reporting period">
      <div className={styles.ranges} role="group" aria-label="Dashboard time range">{views.map((item) => <button type="button" key={item} aria-pressed={view === item} onClick={() => changePeriod(item)}>{item.charAt(0).toUpperCase() + item.slice(1)}</button>)}</div>
      <div className={styles.navigation}>
        <button type="button" className={styles.icon} aria-label={`Previous ${view}`} disabled={!validReportDate(previousDate)} onClick={() => changePeriod(view, previousDate)}><ChevronLeftIcon /></button>
        {view === "year" ? <input key={date} aria-label="Dashboard report year" type="number" min={2000} max={2200} defaultValue={date.slice(0, 4)} onBlur={(event) => { const value = `${event.target.value}-01-01`; if (validReportDate(value)) changePeriod(view, value); else event.target.value = date.slice(0, 4); }} onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); }} /> : <input aria-label={view === "month" ? "Dashboard report month" : view === "week" ? "Date within dashboard week" : "Dashboard report date"} type={view === "month" ? "month" : "date"} min={view === "month" ? "2000-01" : "2000-01-01"} max={view === "month" ? "2200-12" : "2200-12-31"} value={view === "month" ? date.slice(0, 7) : date} onChange={(event) => changePeriod(view, view === "month" ? `${event.target.value}-01` : event.target.value)} />}
        <button type="button" className={styles.icon} aria-label={`Next ${view}`} disabled={!validReportDate(nextDate)} onClick={() => changePeriod(view, nextDate)}><ChevronRightIcon /></button>
        <button type="button" className={styles.current} onClick={() => changePeriod(view, bangkokToday())}>{resetLabel}</button>
      </div>
    </div>
    <div aria-busy={loading}>
      {loading ? <div className={styles.state} role="status">Loading performance…</div> : result.error ? <div className={styles.state} role="alert"><p>{result.error}</p><button type="button" className={styles.retry} onClick={() => setRevision((value) => value + 1)}>Try again</button></div> : result.data && <PerformanceChart key={requestKey} report={result.data} scopeName="All branches" metric={metric} onMetricChange={setMetric} onDrillDown={changePeriod} />}
    </div>
    {!loading && result.data?.statistics.bookings === 0 && <p className={styles.notice}>No appointments in this period. Choose another date or time range.</p>}
    <p className={styles.notice}>Revenue includes confirmed and completed appointments. Dates use Bangkok time.</p>
  </article>;
}
