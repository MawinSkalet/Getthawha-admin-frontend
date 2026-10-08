"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowLeftIcon, ArrowPathIcon, CalendarDaysIcon, ChevronLeftIcon, ChevronRightIcon, ClockIcon, MapPinIcon, MagnifyingGlassIcon, UsersIcon, XMarkIcon } from "@heroicons/react/24/outline";
import AdminImage from "@/components/AdminImage";
import PerformanceChart from "@/components/PerformanceChart";
import { getBaseUrl } from "@/lib/api";
import { getClientBranchImage } from "@/lib/clientImageFallbacks";
import { bangkokToday, reportLabel, reportMoney, shiftReportDate, validReportDate } from "@/lib/reportDates";
import type IBranchReport from "@/interfaces/IBranchReport";
import type { BookingStatus, ReportBooking, ReportView } from "@/interfaces/IBranchReport";
import styles from "./BranchReportPage.module.css";

const views: ReportView[] = ["day", "week", "month", "year"];
const statuses: BookingStatus[] = ["pending", "confirmed", "completed", "cancelled"];
const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);
function appointmentDate(value: string, time = false) {
  return new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Bangkok", ...(time ? { hour: "2-digit", minute: "2-digit", hour12: false } as const : { day: "numeric", month: "short", year: "numeric" } as const) }).format(new Date(value));
}
function Status({ value }: { value: BookingStatus }) {
  return <span className={`br-status br-${value}`}><i aria-hidden="true" />{capitalize(value)}</span>;
}

function BookingDialog({ booking, branchName, onClose }: { booking: ReportBooking; branchName: string; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, []);
  return <dialog ref={dialog} className="br-dialog" aria-labelledby="branch-booking-title" onClose={onClose}>
    <div className="br-dialog-head"><h2 id="branch-booking-title">Appointment details</h2><button type="button" aria-label="Close appointment details" onClick={onClose}><XMarkIcon /></button></div>
    <p className="br-muted br-booking-reference">Reference: {booking.id}</p>
    <dl>{[
      ["Customer", booking.customerName], ["Phone", booking.customerPhone || "Not provided"],
      ["Email", booking.customerEmail || "Not provided"], ["Branch", branchName],
      ["Appointment", `${appointmentDate(booking.date)} at ${appointmentDate(booking.date, true)} (Bangkok)`],
      ["Service", booking.serviceTitle], ["Duration", booking.duration ? `${booking.duration} minutes` : "Not provided"],
      ["Guests", booking.numberOfGuests], ["Status", <Status key="status" value={booking.status} />], ["Total price", reportMoney(booking.totalPrice)],
    ].map(([label, value]) => <div key={String(label)}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
    <button type="button" className="br-button" onClick={onClose}>Close details</button>
  </dialog>;
}

export default function BranchReportPage({ branchId }: { branchId: string }) {
  const router = useRouter(), pathname = usePathname(), searchParams = useSearchParams();
  const view = views.includes(searchParams.get("view") as ReportView) ? searchParams.get("view") as ReportView : "month";
  const inputDate = searchParams.get("date") || "";
  const date = validReportDate(inputDate) ? inputDate : bangkokToday();
  const statusParam = searchParams.get("status");
  const status = statuses.includes(statusParam as BookingStatus) ? statusParam! : "all";
  const search = (searchParams.get("search") || "").slice(0, 150);
  const pageParam = searchParams.get("page") || "1";
  const page = /^[1-9]\d{0,6}$/.test(pageParam) ? pageParam : "1";
  const query = new URLSearchParams({ view, date, status, search, page }).toString();
  const metric = searchParams.get("metric") === "revenue" ? "revenue" : "bookings";
  const [refresh, setRefresh] = useState(0);
  const requestKey = `${branchId}?${query}&refresh=${refresh}`;
  const [result, setResult] = useState<{ key: string; data?: IBranchReport; error?: string }>({ key: "" });
  const [booking, setBooking] = useState<ReportBooking | null>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [branchId]);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch(`${getBaseUrl()}/admin/dashboard/branches/${encodeURIComponent(branchId)}?${query}`, { credentials: "include", cache: "no-store", signal: controller.signal });
        if (response.status === 401 || response.status === 403) { router.replace("/login"); return; }
        const body = await response.json();
        if (!response.ok) throw new Error(body.message || "Could not load this report. Please try again.");
        if (!controller.signal.aborted) setResult({ key: requestKey, data: body.data });
      } catch (error) {
        if (!controller.signal.aborted) setResult({ key: requestKey, error: error instanceof Error ? error.message : "Could not load this report." });
      }
    }
    void load();
    return () => controller.abort();
  }, [branchId, query, requestKey, router]);

  const loading = result.key !== requestKey;
  // Keep the branch controls stable while hiding totals from the previous scope.
  const report = result.data;
  const scopeMatches = report?.branch.id === branchId && report.period.view === view && report.period.date === date;
  const scopedReport = scopeMatches && !result.error ? report : undefined;
  function update(values: Record<string, string>, nextBranchId = branchId) {
    const params = new URLSearchParams(query);
    params.set("metric", metric);
    params.set("page", "1");
    Object.entries(values).forEach(([key, value]) => params.set(key, value));
    setBooking(null);
    const path = nextBranchId === branchId ? pathname : `/branch-performance/${encodeURIComponent(nextBranchId)}`;
    router.replace(`${path}?${params}`, { scroll: false });
  }
  function setPeriod(nextView: ReportView, nextDate = date) {
    if (validReportDate(nextDate)) update({ view: nextView, date: nextDate });
  }
  const previousDate = shiftReportDate(date, view, -1), nextDate = shiftReportDate(date, view, 1);
  const resetLabel = { day: "Today", week: "This week", month: "This month", year: "This year" }[view];
  const periodLabel = scopedReport ? reportLabel(scopedReport.period) : !loading && result.error ? "Report unavailable" : "Loading reporting period…";
  const branchName = report?.branch.id === branchId ? report.branch.name : "Branch report";

  return <main className={styles.report}>
    <nav className="br-breadcrumbs" aria-label="Breadcrumb"><Link href="/#branch-performance"><ArrowLeftIcon />Back to dashboard</Link><span aria-hidden="true">/</span><span>Branch performance</span></nav>
    <header className="br-branch-heading">
      <div className="br-identity">
        {report?.branch.id === branchId && <AdminImage src={report.branch.pictureUrl} fallbackSrc={getClientBranchImage(report.branch.name)} alt={`${report.branch.name} branch`} width={100} height={78} sizes="100px" className="br-photo" />}
        <div><h1>{branchName}</h1><p className="br-location"><MapPinIcon />{report?.branch.id === branchId ? report.branch.address : "Appointments and branch performance"}</p>{report?.branch.id === branchId && (!report.branch.isActive || report.branch.deletedAt) && <p className="br-muted">Inactive branch · Historical appointments</p>}</div>
      </div>
      <div className="br-branch-controls">
        <label className="br-field"><span>Switch branch</span><select aria-label="Switch branch" value={branchId} disabled={!report} onChange={(event) => update({}, event.target.value)}>{report?.branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>) || <option value={branchId}>Loading branches…</option>}</select></label>
        <button type="button" className="br-icon-button" aria-label="Refresh branch report" disabled={loading} onClick={() => setRefresh((value) => value + 1)}><ArrowPathIcon /></button>
      </div>
    </header>

    <section className="br-period" aria-label="Reporting period">
      <div className="br-segmented" role="group" aria-label="Report time range">{views.map((item) => <button type="button" key={item} aria-pressed={view === item} onClick={() => setPeriod(item)}>{capitalize(item)}</button>)}</div>
      <div className="br-period-navigation">
        <button type="button" className="br-icon-button" aria-label={`Previous ${view}`} disabled={!validReportDate(previousDate)} onClick={() => setPeriod(view, previousDate)}><ChevronLeftIcon /></button>
        {view === "year" ? <label className="br-sr" htmlFor="report-year">Report year</label> : <label className="br-sr" htmlFor="report-date">{view === "month" ? "Report month" : view === "week" ? "Date within report week" : "Report date"}</label>}
        {view === "year" ? <input key={date} id="report-year" aria-label="Report year" type="number" min={2000} max={2200} defaultValue={date.slice(0, 4)} onBlur={(event) => { const value = `${event.target.value}-01-01`; if (validReportDate(value)) setPeriod(view, value); else event.target.value = date.slice(0, 4); }} onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); }} /> : <input id="report-date" aria-label={view === "month" ? "Report month" : view === "week" ? "Date within report week" : "Report date"} type={view === "month" ? "month" : "date"} min={view === "month" ? "2000-01" : "2000-01-01"} max={view === "month" ? "2200-12" : "2200-12-31"} value={view === "month" ? date.slice(0, 7) : date} onChange={(event) => setPeriod(view, view === "month" ? `${event.target.value}-01` : event.target.value)} />}
        <button type="button" className="br-icon-button" aria-label={`Next ${view}`} disabled={!validReportDate(nextDate)} onClick={() => setPeriod(view, nextDate)}><ChevronRightIcon /></button>
        <button type="button" className="br-button br-current" onClick={() => setPeriod(view, bangkokToday())}>{resetLabel}</button>
      </div>
      <p className="br-period-label" aria-live="polite">{periodLabel} · Appointment dates in Bangkok time</p>
    </section>

    {loading && !scopedReport ? <div className="br-loading" role="status" aria-live="polite"><ArrowPathIcon className="br-loading-icon" />Loading branch report…</div> : !loading && result.error ? <section className="br-panel br-empty" role="alert"><strong>{result.error}</strong><p>Refresh the report or return to the dashboard to choose a branch.</p><button type="button" className="br-button" onClick={() => setRefresh((value) => value + 1)}>Try again</button></section> : scopedReport && <>
      <section className="br-stats" aria-label="Branch summary">
        <article className="br-stat"><div className="br-stat-label">Total bookings<CalendarDaysIcon /></div><strong>{scopedReport.statistics.bookings.toLocaleString()}</strong><small>All statuses in this period</small></article>
        <article className="br-stat"><div className="br-stat-label">Revenue<span aria-hidden="true">฿</span></div><strong>{reportMoney(scopedReport.statistics.revenue)}</strong><small>Confirmed + completed</small></article>
        <article className="br-stat"><div className="br-stat-label">Customers<UsersIcon /></div><strong>{scopedReport.statistics.customers.toLocaleString()}</strong><small>With bookings in this period</small></article>
        <button type="button" className="br-stat br-pending-stat" onClick={() => { update({ status: "pending" }); document.getElementById("branch-appointments")?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "start" }); }}><div className="br-stat-label">Pending confirmation<ClockIcon /></div><strong>{scopedReport.statistics.pending.toLocaleString()}</strong><small>View pending appointments</small></button>
      </section>

      <div className="br-report-grid">
        <PerformanceChart key={`${branchId}-${view}-${scopedReport.period.start}-${refresh}`} report={scopedReport} scopeName={branchName} metric={metric} onMetricChange={(value) => update({ metric: value, page })} onDrillDown={setPeriod} />
        <section className="br-panel" aria-labelledby="popular-services-heading"><div className="br-panel-head"><div><h2 id="popular-services-heading">Popular services</h2><p>Most booked in this period</p></div></div>
          <div className="br-services">{scopedReport.services.length ? scopedReport.services.map((service) => <article className="br-service" key={service.id}><div className="br-service-top"><strong>{service.title}</strong><span>{service.bookings.toLocaleString()} bookings</span></div><div className="br-track"><span style={{ width: `${service.bookings / Math.max(1, scopedReport.services[0].bookings) * 100}%` }} /></div><small>{service.duration ? `${service.duration} min · ` : ""}{reportMoney(service.revenue)} revenue</small></article>) : <p className="br-muted">No services booked in this period.</p>}</div>
        </section>
      </div>

      <section id="branch-appointments" className="br-panel br-appointments" aria-labelledby="branch-appointments-heading" aria-busy={loading}>
        <div className="br-booking-head"><div><h2 id="branch-appointments-heading">Branch appointments</h2><p>{branchName} · {periodLabel}</p></div>
          <form className="br-search" onSubmit={(event) => { event.preventDefault(); const values = new FormData(event.currentTarget); update({ search: String(values.get("search") || "").trim() }); }}><MagnifyingGlassIcon /><input key={search} name="search" type="search" maxLength={150} defaultValue={search} placeholder="Name, phone or service" aria-label="Search branch appointments" /><button type="submit">Search</button></form>
        </div>
        <div className="br-filters" role="group" aria-label="Appointment status">{["all", ...statuses].map((item) => <button type="button" key={item} aria-pressed={status === item} onClick={() => update({ status: item })}>{item === "all" ? "All appointments" : capitalize(item)}<span>{item === "all" ? scopedReport.statistics.bookings : scopedReport.statusCounts[item as BookingStatus]}</span></button>)}</div>
        {search && <p className="br-search-summary">Results for “{search}”<button type="button" onClick={() => update({ search: "" })}>Clear search</button></p>}
        {loading && <p className="br-search-summary" role="status">Updating appointments…</p>}
        {scopedReport.appointments.total === 0 ? <div className="br-empty"><strong>{scopedReport.statistics.bookings ? "No matching appointments" : "No appointments in this period"}</strong><p>{scopedReport.statistics.bookings ? "Try another status, name, phone or service." : "Choose another period using Day, Week, Month or Year."}</p></div> : <>
          <div className="br-table-wrap"><table><thead><tr><th scope="col">Date / time</th><th scope="col">Customer</th><th scope="col">Service</th><th scope="col">Status</th><th scope="col" className="br-price">Total price</th><th scope="col"><span className="br-sr">Details</span></th></tr></thead><tbody>{scopedReport.appointments.rows.map((row) => <tr key={row.id}><td className="br-date-cell">{appointmentDate(row.date)}<small>{appointmentDate(row.date, true)}</small></td><td><span className="br-customer">{row.customerName}</span><small>{row.customerPhone || "Phone not provided"}</small></td><td>{row.serviceTitle}<small>{row.duration ? `${row.duration} minutes` : "Duration not provided"}</small></td><td><Status value={row.status} /></td><td className="br-price">{reportMoney(row.totalPrice)}</td><td className="br-price"><button type="button" className="br-view-booking" aria-label={`View appointment for ${row.customerName} on ${appointmentDate(row.date)}`} onClick={() => setBooking(row)}>View</button></td></tr>)}</tbody></table></div>
          <div className="br-mobile-bookings">{scopedReport.appointments.rows.map((row) => <article className="br-booking-card" key={row.id}><div className="br-booking-card-top"><div className="br-customer">{row.customerName}<small>{row.customerPhone || "Phone not provided"}</small></div><Status value={row.status} /></div><div className="br-service-line"><span>{row.serviceTitle}</span><b>{reportMoney(row.totalPrice)}</b></div><small>{row.duration ? `${row.duration} minutes` : "Duration not provided"}</small><div className="br-booking-card-bottom"><span>{appointmentDate(row.date)} · {appointmentDate(row.date, true)}</span><button type="button" className="br-view-booking" onClick={() => setBooking(row)}>View booking</button></div></article>)}</div>
        </>}
        <footer className="br-table-footer"><span>{scopedReport.appointments.total ? `Showing ${(scopedReport.appointments.page - 1) * scopedReport.appointments.pageSize + 1}–${Math.min(scopedReport.appointments.page * scopedReport.appointments.pageSize, scopedReport.appointments.total)} of ${scopedReport.appointments.total} appointments` : "0 appointments"}</span><div className="br-pagination"><button type="button" className="br-icon-button" aria-label="Previous appointment page" disabled={scopedReport.appointments.page <= 1} onClick={() => update({ page: String(scopedReport.appointments.page - 1) })}><ChevronLeftIcon /></button><span>{scopedReport.appointments.page} / {scopedReport.appointments.pages}</span><button type="button" className="br-icon-button" aria-label="Next appointment page" disabled={scopedReport.appointments.page >= scopedReport.appointments.pages} onClick={() => update({ page: String(scopedReport.appointments.page + 1) })}><ChevronRightIcon /></button></div></footer>
      </section>
      <p className="br-scope-foot">Revenue includes confirmed and completed appointments. Pending and cancelled appointments are excluded. All dates use Asia/Bangkok.</p>
    </>}
    {booking && <BookingDialog booking={booking} branchName={branchName} onClose={() => setBooking(null)} />}
  </main>;
}
