"use client";

import React, { useEffect, useMemo, useState } from "react";
import LineChart from "./LineChart";
import useDashboard from "@/hooks/useDashboard";
import { updateBookingById, type UpdateBookingRequest } from "@/hooks/useBooking";
import type IBooking from "@/interfaces/IBooking";
import type IErrorResponse from "@/interfaces/IErrorResponse";
import { useHydrated } from "@/hooks/useHydrated";

function formatDateParts(year: number, month: number, day: number) {
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function timeAgo(date: Date) {
  if (!date || Number.isNaN(date.getTime())) return "Time unavailable";
  const seconds = Math.floor(Math.max(0, Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

function activityTime(date: Date, type: "booking" | "register") {
  if (!date || Number.isNaN(date.getTime())) return "Time unavailable";
  if (type === "booking") {
    return `${new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Asia/Bangkok",
    }).format(date)} · Bangkok time`;
  }
  return timeAgo(date);
}

function formatBookingDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { date: "Date unavailable", time: "—" };
  return {
    date: new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "Asia/Bangkok",
    }).format(date),
    time: new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Asia/Bangkok",
    }).format(date),
  };
}

function StatusPill({ status }: { status: string }) {
  const appearance: Record<string, string> = {
    pending: "border-[#E7D6AF] bg-[#FBF2DD] text-[#785819]",
    confirmed: "border-[#D8E3D3] bg-[#EFF5EC] text-[#496446]",
    completed: "border-[#DED6CC] bg-[#F3EFE9] text-[#66594D]",
    cancelled: "border-[#E8D4CF] bg-[#F8EEEB] text-[#8A5144]",
  };
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${appearance[status] || appearance.pending}`}>
      {status || "pending"}
    </span>
  );
}

function PendingBookingActions({
  booking,
  disabled,
  saving,
  onChangeStatus,
}: {
  booking: IBooking;
  disabled: boolean;
  saving: boolean;
  onChangeStatus: (booking: IBooking, status: IBooking["status"]) => void;
}) {
  if (booking.status !== "pending") {
    return <span className="text-sm text-[#A99C8E]">—</span>;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => onChangeStatus(booking, "confirmed")}
        disabled={disabled}
        aria-label={`Confirm booking for ${booking.customerName || booking.user?.displayName || "customer"}`}
        className="inline-flex h-9 items-center justify-center rounded-lg bg-[#8C6721] px-3 text-xs font-semibold text-white transition-colors hover:bg-[#735318] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B9892C] focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60"
      >
        {saving ? "Saving…" : "Confirm"}
      </button>
      <button
        type="button"
        onClick={() => onChangeStatus(booking, "cancelled")}
        disabled={disabled}
        aria-label={`Cancel booking for ${booking.customerName || booking.user?.displayName || "customer"}`}
        className="inline-flex h-9 items-center justify-center rounded-lg border border-[#E8D4CF] bg-white px-3 text-xs font-semibold text-[#8A5144] transition-colors hover:bg-[#F8EEEB] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A75E4F] focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60"
      >
        {saving ? "Saving…" : "Cancel"}
      </button>
    </div>
  );
}

const isErrorResponse = (value: unknown): value is IErrorResponse =>
  typeof value === "object" &&
  value !== null &&
  "status" in value &&
  "message" in value;

const isBooking = (value: unknown): value is IBooking =>
  typeof value === "object" && value !== null && "id" in value;

const AdminDashboardPage = () => {
  const {
    statistics,
    monthlyTrend,
    branchPerformance,
    activities,
    bookingsForDate,
    bookingsForMonth,
    loadingBookingsForMonth,
    bookingsForMonthError,
    updateBookingInView,
    loadingActivities,
    reload,
    loadRecentActivityByDate,
    loadBookingsForMonth,
    selectedActivityDate,
    selectedTrendYear,
    changeTrendYear,
  } = useDashboard();

  const currentYear = new Date().getFullYear();
  const trendYearOptions = useMemo(() => {
    const years = new Set(Array.from({ length: 5 }, (_, index) => currentYear - index));
    years.add(selectedTrendYear);
    return [...years].sort((left, right) => right - left);
  }, [currentYear, selectedTrendYear]);
  const hydrated = useHydrated();
  const [trendYearDraft, setTrendYearDraft] = useState(String(selectedTrendYear));
  const [selectedDateDraft, setSelectedDateDraft] = useState(() => {
    const today = new Date();
    return formatDateParts(today.getFullYear(), today.getMonth() + 1, today.getDate());
  });
  const [scheduleView, setScheduleView] = useState<"day" | "month">("day");
  const [selectedMonthDraft, setSelectedMonthDraft] = useState(() => {
    const today = new Date();
    return formatDateParts(today.getFullYear(), today.getMonth() + 1, 1).slice(0, 7);
  });
  const [lastUpdated] = useState(() => new Date().toLocaleString());
  const [updatingBookingId, setUpdatingBookingId] = useState<string | null>(null);
  const [bookingActionError, setBookingActionError] = useState<string | null>(null);

  useEffect(() => {
    if (scheduleView !== "month") return;
    const [year, month] = selectedMonthDraft.split("-").map(Number);
    if (year && month) loadBookingsForMonth(year, month);
  }, [loadBookingsForMonth, scheduleView, selectedMonthDraft]);

  const { day: selectedDay, month: selectedMonth, year: selectedYear } = selectedActivityDate;
  const selectedDateLabel = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "Asia/Bangkok",
  }).format(new Date(selectedYear, selectedMonth - 1, selectedDay, 12));
  const [scheduleYear, scheduleMonth] = selectedMonthDraft.split("-").map(Number);
  const selectedMonthLabel = scheduleYear && scheduleMonth
    ? new Intl.DateTimeFormat("en-US", {
        month: "long",
        year: "numeric",
        timeZone: "Asia/Bangkok",
      }).format(new Date(scheduleYear, scheduleMonth - 1, 1, 12))
    : "selected month";
  const displayedBookings = scheduleView === "month" ? bookingsForMonth : bookingsForDate;
  const scheduleLoading = scheduleView === "month" ? loadingBookingsForMonth : loadingActivities;

  const selectDate = (value: string) => {
    setSelectedDateDraft(value);
    if (!value) return;
    const [year, month, day] = value.split("-").map(Number);
    if (year && month && day) loadRecentActivityByDate(day, month, year);
  };

  const selectDateOffset = (offsetDays: number) => {
    const date = new Date();
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() + offsetDays);
    setSelectedDateDraft(formatDateParts(date.getFullYear(), date.getMonth() + 1, date.getDate()));
    loadRecentActivityByDate(date.getDate(), date.getMonth() + 1, date.getFullYear());
  };

  const selectedPreset = (offsetDays: number) => {
    const date = new Date();
    date.setDate(date.getDate() + offsetDays);
    return date.getFullYear() === selectedYear && date.getMonth() + 1 === selectedMonth && date.getDate() === selectedDay;
  };

  const selectedTrendYearChange = (value: string) => {
    setTrendYearDraft(value);
    const year = Number(value);
    if (Number.isInteger(year) && year >= 2000 && year <= 2200) changeTrendYear(year);
  };

  const handleBookingStatusChange = async (
    booking: IBooking,
    status: IBooking["status"]
  ) => {
    if (updatingBookingId) return;

    if (status === "cancelled") {
      const customer = booking.customerName?.trim() || booking.user?.displayName || "this customer";
      if (!window.confirm(`Cancel the appointment for ${customer}?`)) return;
    }

    const payload: UpdateBookingRequest = {
      status,
      date: booking.date,
      branchId: booking.branch.id,
      packageId: booking.package.id,
      userId: booking.user.id,
      voucherId: booking.voucher?.id ?? null,
    };

    setBookingActionError(null);
    setUpdatingBookingId(booking.id);
    try {
      const result = await updateBookingById(
        booking.id,
        payload,
        new AbortController().signal
      );

      if (isErrorResponse(result) && result.status === "error") {
        throw new Error(result.message || "Could not update this booking.");
      }
      if (!isBooking(result)) {
        throw new Error("The server returned an invalid booking response.");
      }

      updateBookingInView(result);
      reload();
    } catch (error) {
      setBookingActionError(
        error instanceof Error ? error.message : "Could not update this booking. Please try again."
      );
    } finally {
      setUpdatingBookingId(null);
    }
  };

  const applyTrendYearDraft = () => {
    const year = Number(trendYearDraft);
    if (Number.isInteger(year) && year >= 2000 && year <= 2200) changeTrendYear(year);
  };

  const stats = [
    { label: "Total bookings", value: statistics.totalBookings, note: "All recorded appointments", icon: "calendar" },
    { label: "Revenue", value: `฿${statistics.totalRevenue.toLocaleString()}`, note: "From confirmed and completed bookings", icon: "revenue" },
    { label: "Customers", value: statistics.totalUsers, note: "Registered accounts", icon: "customers" },
    { label: "Today's completed", value: statistics.todayBookings, note: "Completed appointments", icon: "today" },
  ];

  const branches = branchPerformance.map((branch) => ({
    name: branch.branchName,
    value: Number(branch.totalBookings) || 0,
  }));
  const maxBranchValue = Math.max(...branches.map((branch) => branch.value), 1);

  return (
    <main className="min-h-screen bg-[#F7F3EB] px-4 py-6 text-[#30231D] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1440px] space-y-6">
        <header className="flex flex-col gap-4 border-b border-[#E9DFCE] pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-[0.2em] text-[#9A752D]">Getthawha · Admin</p>
            <h1 className="font-serif text-3xl font-semibold tracking-tight text-[#3B261C] sm:text-4xl">Dashboard</h1>
            <p className="mt-1 text-sm text-[#857568]">Bookings and branch activity at a glance.</p>
          </div>
          <div className="text-sm text-[#857568]" suppressHydrationWarning>
            {hydrated ? `Updated ${lastUpdated}` : "Loading update time…"}
          </div>
        </header>

        <section aria-label="Business overview" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <article key={stat.label} className="rounded-2xl border border-[#E9DFCE] bg-[#FFFDFA] p-5 shadow-[0_2px_10px_rgba(59,38,28,0.04)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-[#756457]">{stat.label}</p>
                  <p className="mt-3 text-3xl font-semibold tracking-tight text-[#3B261C]">{typeof stat.value === "number" ? stat.value.toLocaleString() : stat.value}</p>
                </div>
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F4EAD4] text-[#8C6721]" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                    {stat.icon === "calendar" || stat.icon === "today" ? <><rect x="3.5" y="5" width="17" height="15" rx="2" /><path d="M7.5 3.5v3M16.5 3.5v3M3.5 9h17" /></> : stat.icon === "revenue" ? <><path d="M12 3.5v17M16.5 7.5c-.8-1-2.1-1.5-4.5-1.5-2.2 0-4 1.2-4 3s1.3 2.7 4 3 4.5 1.1 4.5 3-1.8 3-4.5 3c-2.1 0-3.9-.6-5-1.8" /></> : <><path d="M16 20v-1.5a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4V20" /><circle cx="10" cy="7.5" r="3.5" /><path d="M20 20v-1.5a4 4 0 0 0-3-3.9M16 4.2a3.5 3.5 0 0 1 0 6.6" /></>}
                  </svg>
                </span>
              </div>
              <p className="mt-3 border-t border-[#F0E9DE] pt-3 text-xs text-[#988A7D]">{stat.note}</p>
            </article>
          ))}
        </section>

        <section aria-labelledby="appointments-heading" className="overflow-hidden rounded-2xl border border-[#E9DFCE] bg-[#FFFDFA] shadow-[0_2px_12px_rgba(59,38,28,0.05)]">
          <div className="flex flex-col gap-4 border-b border-[#EEE7DC] p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#A27A2C]">Appointment schedule</p>
              <h2 id="appointments-heading" className="mt-1 font-serif text-2xl font-semibold text-[#3B261C]">{scheduleView === "month" ? `Appointments in ${selectedMonthLabel}` : `Bookings for ${selectedDateLabel}`}</h2>
              <p className="mt-1 text-sm text-[#857568]">Confirm or cancel pending appointments from this list.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div role="tablist" aria-label="Appointment schedule view" className="inline-flex h-10 rounded-lg border border-[#E4DAC9] bg-[#F8F4ED] p-1">
                {(["day", "month"] as const).map((view) => (
                  <button
                    type="button"
                    role="tab"
                    aria-selected={scheduleView === view}
                    key={view}
                    onClick={() => setScheduleView(view)}
                    className={`rounded-md px-3 text-sm font-semibold capitalize transition-colors ${scheduleView === view ? "bg-[#3B261C] text-[#FFF9ED] shadow-sm" : "text-[#6D5140] hover:bg-white"}`}
                  >
                    {view}
                  </button>
                ))}
              </div>
              {scheduleView === "day" ? (
                <>
                  <input
                    aria-label="Choose appointment date"
                    type="date"
                    value={selectedDateDraft}
                    onChange={(event) => selectDate(event.target.value)}
                    className="h-10 rounded-lg border border-[#DCCFBC] bg-white px-3 text-sm text-[#3B261C] outline-none focus:border-[#B9892C] focus:ring-2 focus:ring-[#B9892C]/20"
                  />
                  {[
                    { label: "Today", offset: 0 },
                    { label: "Yesterday", offset: -1 },
                  ].map((preset) => (
                    <button
                      type="button"
                      key={preset.label}
                      onClick={() => selectDateOffset(preset.offset)}
                      className={`h-10 rounded-lg border px-3 text-sm font-medium transition-colors ${selectedPreset(preset.offset) ? "border-[#3B261C] bg-[#3B261C] text-[#FFF9ED]" : "border-[#E4DAC9] bg-white text-[#6D5140] hover:bg-[#F7F2E9]"}`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </>
              ) : (
                <input
                  aria-label="Choose appointment month"
                  type="month"
                  value={selectedMonthDraft}
                  onChange={(event) => setSelectedMonthDraft(event.target.value)}
                  className="h-10 rounded-lg border border-[#DCCFBC] bg-white px-3 text-sm text-[#3B261C] outline-none focus:border-[#B9892C] focus:ring-2 focus:ring-[#B9892C]/20"
                />
              )}
            </div>
          </div>

          {bookingActionError && (
            <div role="alert" className="mx-5 mt-4 rounded-lg border border-[#E8D4CF] bg-[#F8EEEB] px-4 py-3 text-sm text-[#8A5144] sm:mx-6">
              {bookingActionError}
            </div>
          )}

          {scheduleLoading && displayedBookings.length === 0 ? (
            <div className="flex min-h-44 items-center justify-center gap-3 text-sm text-[#857568]">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#E9DFCE] border-t-[#B9892C]" />
              Loading appointments…
            </div>
          ) : scheduleView === "month" && bookingsForMonthError ? (
            <div role="alert" className="px-6 py-14 text-center text-sm text-[#8A5144]">{bookingsForMonthError}</div>
          ) : displayedBookings.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#F4EAD4] text-[#8C6721]">
                <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3.5" y="5" width="17" height="15" rx="2" /><path d="M7.5 3.5v3M16.5 3.5v3M3.5 9h17" /></svg>
              </div>
              <h3 className="mt-3 font-semibold text-[#49372B]">{scheduleView === "month" ? "No appointments this month" : "No appointments for this date"}</h3>
              <p className="mt-1 text-sm text-[#8B7D70]">{scheduleView === "month" ? "Choose another month to view its bookings." : "Choose another date to view its bookings."}</p>
            </div>
          ) : (
            <>
              <div className="hidden max-h-[640px] overflow-auto md:block">
                <table className="w-full min-w-[1040px] text-left">
                  <thead className="bg-[#F8F4ED] text-xs font-semibold uppercase tracking-[0.1em] text-[#806F60]">
                    <tr>
                      <th className="px-6 py-3.5">Customer</th>
                      <th className="px-4 py-3.5">Telephone</th>
                      <th className="px-4 py-3.5">Service date</th>
                      <th className="px-4 py-3.5">Service type</th>
                      <th className="px-4 py-3.5">Branch</th>
                      <th className="px-6 py-3.5">Status</th>
                      <th className="px-6 py-3.5">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0E9DE]">
                    {displayedBookings.map((booking) => {
                      const customer = booking.customerName?.trim() || booking.user?.displayName || "Guest";
                      const serviceDate = formatBookingDate(booking.date);
                      return (
                        <tr key={booking.id} className="transition-colors hover:bg-[#FCFAF6]">
                          <td className="px-6 py-4">
                            <span className="font-semibold text-[#3B261C]">{customer}</span>
                          </td>
                          <td className="px-4 py-4 text-sm">
                            {booking.customerPhone ? <a className="font-medium text-[#795B22] underline decoration-[#D6C18D] underline-offset-4 hover:text-[#3B261C]" href={`tel:${booking.customerPhone}`}>{booking.customerPhone}</a> : <span className="text-[#9A8D81]">Not provided</span>}
                          </td>
                          <td className="px-4 py-4">
                            <span className="block font-medium text-[#49372B]">{serviceDate.date}</span>
                            <span className="mt-0.5 block text-xs text-[#857568]">{serviceDate.time} · Bangkok time</span>
                          </td>
                          <td className="px-4 py-4 text-sm font-medium text-[#49372B]">{booking.package?.title || "Service unavailable"}</td>
                          <td className="px-4 py-4 text-sm text-[#6D5140]">{booking.branch?.name || "Branch unavailable"}</td>
                          <td className="px-6 py-4"><StatusPill status={booking.status} /></td>
                          <td className="px-6 py-4">
                            <PendingBookingActions
                              booking={booking}
                              disabled={updatingBookingId !== null}
                              saving={updatingBookingId === booking.id}
                              onChangeStatus={handleBookingStatusChange}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="max-h-[640px] space-y-3 overflow-y-auto p-4 md:hidden">
                {displayedBookings.map((booking) => {
                  const customer = booking.customerName?.trim() || booking.user?.displayName || "Guest";
                  const serviceDate = formatBookingDate(booking.date);
                  return (
                    <article key={booking.id} className="rounded-xl border border-[#E9DFCE] bg-white p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-semibold text-[#3B261C]">{customer}</h3>
                          <p className="mt-1 text-sm text-[#857568]">{serviceDate.date} · {serviceDate.time}</p>
                        </div>
                        <StatusPill status={booking.status} />
                      </div>
                      <dl className="mt-4 grid grid-cols-[6.5rem_1fr] gap-x-3 gap-y-2 border-t border-[#F0E9DE] pt-3 text-sm">
                        <dt className="text-[#8B7D70]">Telephone</dt>
                        <dd className="font-medium text-[#49372B]">{booking.customerPhone ? <a href={`tel:${booking.customerPhone}`} className="text-[#795B22] underline underline-offset-2">{booking.customerPhone}</a> : "Not provided"}</dd>
                        <dt className="text-[#8B7D70]">Service</dt>
                        <dd className="font-medium text-[#49372B]">{booking.package?.title || "Service unavailable"}</dd>
                        <dt className="text-[#8B7D70]">Branch</dt>
                        <dd className="font-medium text-[#49372B]">{booking.branch?.name || "Branch unavailable"}</dd>
                      </dl>
                      {booking.status === "pending" && (
                        <div className="mt-4 border-t border-[#F0E9DE] pt-3">
                          <PendingBookingActions
                            booking={booking}
                            disabled={updatingBookingId !== null}
                            saving={updatingBookingId === booking.id}
                            onChangeStatus={handleBookingStatusChange}
                          />
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            </>
          )}
          <div className="border-t border-[#EEE7DC] px-5 py-3 text-xs text-[#8B7D70] sm:px-6">
            {displayedBookings.length} appointment{displayedBookings.length === 1 ? "" : "s"} · Times shown in Bangkok time
          </div>
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(300px,0.85fr)]">
          <article className="rounded-2xl border border-[#E9DFCE] bg-[#FFFDFA] p-5 shadow-[0_2px_12px_rgba(59,38,28,0.04)] sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#A27A2C]">Performance</p>
                <h2 className="mt-1 font-serif text-2xl font-semibold text-[#3B261C]">Booking trends</h2>
                <p className="mt-1 text-sm text-[#857568]">Monthly bookings in {selectedTrendYear}.</p>
              </div>
              <div className="flex items-center gap-2">
                <select
                  aria-label="Trend year"
                  value={trendYearDraft}
                  onChange={(event) => selectedTrendYearChange(event.target.value)}
                  className="h-10 rounded-lg border border-[#DCCFBC] bg-white px-3 text-sm text-[#49372B] outline-none focus:border-[#B9892C] focus:ring-2 focus:ring-[#B9892C]/20"
                >
                  {trendYearOptions.map((year) => <option key={year} value={year}>{year}</option>)}
                </select>
                <input
                  aria-label="Enter another trend year"
                  inputMode="numeric"
                  type="number"
                  min="2000"
                  max="2200"
                  value={trendYearDraft}
                  onChange={(event) => setTrendYearDraft(event.target.value)}
                  onBlur={applyTrendYearDraft}
                  onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); applyTrendYearDraft(); } }}
                  className="h-10 w-24 rounded-lg border border-[#DCCFBC] bg-white px-3 text-sm text-[#49372B] outline-none focus:border-[#B9892C] focus:ring-2 focus:ring-[#B9892C]/20"
                />
                <button type="button" onClick={() => changeTrendYear(currentYear)} className="h-10 rounded-lg border border-[#E4DAC9] bg-white px-3 text-sm font-medium text-[#6D5140] hover:bg-[#F7F2E9]">This year</button>
              </div>
            </div>
            <div className="mt-5 h-[300px] sm:h-[340px]">
              <LineChart trend={monthlyTrend} loading={!monthlyTrend || monthlyTrend.length === 0} />
            </div>
          </article>

          <article className="rounded-2xl border border-[#E9DFCE] bg-[#FFFDFA] p-5 shadow-[0_2px_12px_rgba(59,38,28,0.04)] sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#A27A2C]">Daily log</p>
                <h2 className="mt-1 font-serif text-2xl font-semibold text-[#3B261C]">Recent activity</h2>
                <p className="mt-1 text-sm text-[#857568]">Updates from {selectedDateLabel}.</p>
              </div>
              <span className="mt-2 h-2.5 w-2.5 rounded-full bg-[#B9892C]" aria-label="Activity updates" />
            </div>
            <div className="mt-5 max-h-[340px] space-y-1 overflow-y-auto pr-1">
              {loadingActivities ? (
                <div className="py-10 text-center text-sm text-[#857568]">Loading activity…</div>
              ) : activities.length === 0 ? (
                <div className="rounded-xl bg-[#F8F4ED] px-4 py-8 text-center">
                  <p className="font-medium text-[#59483B]">No activity for this date</p>
                  <p className="mt-1 text-sm text-[#8B7D70]">New booking and account updates will appear here.</p>
                </div>
              ) : activities.map((item) => (
                <div key={`${item.type}-${item.id}`} className="flex gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-[#F8F4ED]">
                  <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${item.type === "booking" ? "bg-[#F4EAD4] text-[#8C6721]" : "bg-[#EEE8E0] text-[#6D5140]"}`} aria-hidden="true">
                    {item.type === "booking" ? "B" : "C"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium leading-5 text-[#49372B]">{item.title}</p>
                    <p className="mt-1 text-xs text-[#8B7D70]">{activityTime(item.time, item.type)}</p>
                  </div>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section aria-labelledby="branch-performance-heading" className="rounded-2xl border border-[#E9DFCE] bg-[#FFFDFA] p-5 shadow-[0_2px_12px_rgba(59,38,28,0.04)] sm:p-6">
          <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#A27A2C]">Locations</p>
              <h2 id="branch-performance-heading" className="mt-1 font-serif text-2xl font-semibold text-[#3B261C]">Branch performance</h2>
            </div>
            <p className="text-sm text-[#857568]">Booking distribution across branches</p>
          </div>
          {branches.length === 0 ? (
            <p className="rounded-xl bg-[#F8F4ED] px-4 py-8 text-center text-sm text-[#857568]">Branch data is not available yet.</p>
          ) : (
            <div className="grid grid-cols-1 gap-x-8 gap-y-5 md:grid-cols-2">
              {branches.map((branch) => (
                <div key={branch.name}>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <span className="truncate text-sm font-medium text-[#49372B]">{branch.name}</span>
                    <span className="shrink-0 text-sm font-semibold tabular-nums text-[#6D5140]">{branch.value.toLocaleString()} bookings</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-[#EFE8DD]">
                    <div className="h-full rounded-full bg-[#B9892C] transition-[width] duration-500" style={{ width: `${Math.max(branch.value > 0 ? 3 : 0, (branch.value / maxBranchValue) * 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
};

export default AdminDashboardPage;
