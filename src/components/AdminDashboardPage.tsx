"use client";

import React, { useEffect, useMemo, useState } from "react";
import LineChart from "./LineChart";
import useDashboard from "@/hooks/useDashboard";

function timeAgo(d: Date) {
  if (!d || isNaN(d.getTime())) return "unknown";
  // Handle future timestamps by using absolute diff to avoid always "just now"
  const diffMs = Math.abs(Date.now() - d.getTime());
  const sec = Math.floor(diffMs / 1000);
  const min = Math.floor(sec / 60);
  const hr = Math.floor(min / 60);
  const day = Math.floor(hr / 24);
  if (day > 0) return `${day} day${day > 1 ? "s" : ""} ago`;
  if (hr > 0) return `${hr} hour${hr > 1 ? "s" : ""} ago`;
  if (min > 0) return `${min} minute${min > 1 ? "s" : ""} ago`;
  if (sec > 5) return `${sec} seconds ago`;
  return "just now";
}

function formatDateParts(year: number, month: number, day: number) {
  const paddedYear = year.toString().padStart(4, "0");
  const paddedMonth = month.toString().padStart(2, "0");
  const paddedDay = day.toString().padStart(2, "0");
  return `${paddedYear}-${paddedMonth}-${paddedDay}`;
}

const AdminDashboardPage = () => {
  const {
    statistics,
    monthlyTrend,
    branchPerformance,
    activities,
    loadingActivities,
    loadRecentActivityByDate,
    selectedActivityDate,
    selectedTrendYear,
    changeTrendYear,
  } = useDashboard();

  const currentYear = new Date().getFullYear();
  const buildYearOptions = (selected: number) => {
    const range = new Set<number>();
    for (let i = 0; i < 5; i += 1) {
      range.add(currentYear - i);
    }
    range.add(selected);
    return Array.from(range).sort((a, b) => b - a);
  };

  const { day: selectedDay, month: selectedMonth, year: selectedYear } =
    selectedActivityDate;

  const trendYearOptions = buildYearOptions(selectedTrendYear);

  const [trendYearDraft, setTrendYearDraft] = useState<string>(
    () => selectedTrendYear.toString()
  );

  useEffect(() => {
    setTrendYearDraft(selectedTrendYear.toString());
  }, [selectedTrendYear]);

  const [activityDateDraft, setActivityDateDraft] = useState<string>(() =>
    formatDateParts(selectedYear, selectedMonth, selectedDay)
  );

  useEffect(() => {
    setActivityDateDraft(
      formatDateParts(selectedYear, selectedMonth, selectedDay)
    );
  }, [selectedDay, selectedMonth, selectedYear]);

  const isoToday = useMemo(() => {
    const today = new Date();
    return formatDateParts(
      today.getFullYear(),
      today.getMonth() + 1,
      today.getDate()
    );
  }, []);

  const quickActivityPresets = useMemo(
    () => [
      { label: "Today", offsetDays: 0 },
      { label: "Yesterday", offsetDays: -1 },
    ],
    []
  );

  const applyActivityOffset = (offsetDays: number) => {
    const base = new Date();
    base.setHours(0, 0, 0, 0);
    base.setDate(base.getDate() + offsetDays);
    loadRecentActivityByDate(
      base.getDate(),
      base.getMonth() + 1,
      base.getFullYear()
    );
  };

  const isPresetSelected = (offsetDays: number) => {
    const base = new Date();
    base.setHours(0, 0, 0, 0);
    base.setDate(base.getDate() + offsetDays);
    return (
      base.getFullYear() === selectedYear &&
      base.getMonth() + 1 === selectedMonth &&
      base.getDate() === selectedDay
    );
  };

  const handleActivityDateInputChange = (value: string) => {
    setActivityDateDraft(value);
    if (!value) return;
    const [yearStr, monthStr, dayStr] = value.split("-");
    if (!yearStr || !monthStr || !dayStr) return;
    const parsedYear = Number(yearStr);
    const parsedMonth = Number(monthStr);
    const parsedDay = Number(dayStr);
    if (
      Number.isNaN(parsedYear) ||
      Number.isNaN(parsedMonth) ||
      Number.isNaN(parsedDay)
    ) {
      return;
    }
    loadRecentActivityByDate(parsedDay, parsedMonth, parsedYear);
  };

  const handleTrendYearDirectChange = () => {
    if (!trendYearDraft.trim()) {
      return;
    }
    changeTrendYear(trendYearDraft);
  };

  const handleTrendYearInputKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleTrendYearDirectChange();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <div className="text-sm text-gray-500">
            Last updated: {new Date().toLocaleString()}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {[
            {
              title: "Total Bookings",
              value: statistics.totalBookings?.toLocaleString() || "0",
              icon: "📅",
              gradient: "from-blue-500 to-blue-600",
              bg: "bg-blue-50",
            },
            {
              title: "Total Revenue",
              value: `฿${statistics.totalRevenue?.toLocaleString() || "0"}`,
              icon: "💰",
              gradient: "from-green-500 to-green-600",
              bg: "bg-green-50",
            },
            {
              title: "Total Users",
              value: statistics.totalUsers?.toLocaleString() || "0",
              icon: "👥",
              gradient: "from-purple-500 to-purple-600",
              bg: "bg-purple-50",
            },
            {
              title: "Today's Bookings",
              value: statistics.todayBookings?.toLocaleString() || "0",
              icon: "⚡",
              gradient: "from-orange-500 to-orange-600",
              bg: "bg-orange-50",
            },
          ].map((stat, index) => (
            <div
              key={index}
              className={`${stat.bg} rounded-xl p-6 hover:shadow-lg transition-all duration-200 border border-white/50`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="text-2xl">{stat.icon}</div>
                <div
                  className={`w-12 h-12 bg-gradient-to-r ${stat.gradient} rounded-lg flex items-center justify-center text-white text-sm font-bold shadow-sm`}
                >
                  {stat.value.toString().slice(-2)}
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-600">
                  {stat.title}
                </p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Chart */}
          <div className="xl:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Booking Trends
                  </h2>
                  <div className="flex items-center space-x-2 mt-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-sm text-gray-500">
                      Monthly Bookings
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-start gap-3 md:items-end">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-gray-600">
                      Select year
                    </span>
                    <div className="join">
                      {trendYearOptions.map((yearOption) => (
                        <button
                          type="button"
                          key={yearOption}
                          className={`btn btn-sm join-item ${
                            yearOption === selectedTrendYear
                              ? "btn-primary"
                              : "btn-ghost"
                          }`}
                          onClick={() => changeTrendYear(yearOption)}
                        >
                          {yearOption}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <label
                      htmlFor="trend-year-input"
                      className="font-medium text-gray-600"
                    >
                      Custom year
                    </label>
                    <input
                      id="trend-year-input"
                      type="number"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      className="input input-sm input-bordered w-24"
                      value={trendYearDraft}
                      onChange={(event) =>
                        setTrendYearDraft(event.target.value)
                      }
                      onBlur={handleTrendYearDirectChange}
                      onKeyDown={handleTrendYearInputKeyDown}
                    />
                    <button
                      type="button"
                      className="btn btn-sm btn-ghost"
                      onClick={() => changeTrendYear(currentYear)}
                    >
                      Current year
                    </button>
                  </div>
                </div>
              </div>
              <div className="h-96">
                <LineChart
                  trend={monthlyTrend}
                  loading={!monthlyTrend || monthlyTrend.length === 0}
                />
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold text-gray-900">
                  Recent Activity
                </h2>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              </div>
              <div className="flex flex-col items-start gap-2 text-sm sm:flex-row sm:items-center">
                <label
                  htmlFor="activity-date-input"
                  className="font-medium text-gray-600"
                >
                  View activity for
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    id="activity-date-input"
                    type="date"
                    className="input input-sm input-bordered"
                    max={isoToday}
                    value={activityDateDraft}
                    onChange={(event) =>
                      handleActivityDateInputChange(event.target.value)
                    }
                  />
                  <div className="join">
                    {quickActivityPresets.map((preset) => (
                      <button
                        type="button"
                        key={preset.label}
                        className={`btn btn-sm join-item ${
                          isPresetSelected(preset.offsetDays)
                            ? "btn-secondary"
                            : "btn-ghost"
                        }`}
                        onClick={() => applyActivityOffset(preset.offsetDays)}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto">
              {loadingActivities ? (
                <div className="flex items-center justify-center py-12">
                  <div className="flex items-center space-x-2 text-gray-500">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 008-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    <span>Loading...</span>
                  </div>
                </div>
              ) : activities.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📋</div>
                  <p className="text-gray-500 font-medium">
                    No recent activity
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    New activities will appear here
                  </p>
                </div>
              ) : (
                activities.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        item.type === "booking"
                          ? "bg-green-100 text-green-600"
                          : "bg-blue-100 text-blue-600"
                      }`}
                    >
                      {item.type === "booking" ? "📅" : "👤"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {item.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        {timeAgo(item.time)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Branch Performance */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Branch Performance
          </h2>

          <div className="space-y-4">
            {(() => {
              const branches = branchPerformance.map((branch) => ({
                name: branch.branchName,
                value: Number(branch.totalBookings),
              }));
              const maxValue = Math.max(...branches.map((b) => b.value), 1);

              return branches.map((branch, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      {branch.name}
                    </span>
                    <span className="text-sm text-gray-500">
                      {branch.value} bookings
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500 ease-out"
                      style={{
                        width: `${(branch.value / maxValue) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ));
            })()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
