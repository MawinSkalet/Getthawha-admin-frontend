"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getBookingByDate } from "@/hooks/useCalendar";
import type IBooking from "@/interfaces/IBooking";
import { getBaseUrl } from "@/lib/api";

// Types
type Statistics = {
  totalBookings: number;
  totalRevenue: number;
  totalUsers: number;
  todayBookings: number;
};

type TrendItem = {
  name: string;
  totalBookings: number;
};

type BranchPerformanceItem = {
  branchId: string;
  branchName: string;
  totalBookings: number;
};

type ActivityItem = {
  id: string;
  type: "booking" | "register";
  title: string;
  time: Date;
};

const MONTH_NAMES: ReadonlyArray<string> = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

// Helper to parse various timestamp fields; returns invalid Date if not present
function parseItemDate(
  ...candidates: Array<string | number | Date | undefined | null>
): Date {
  for (const c of candidates) {
    if (c === undefined || c === null || c === "") {
      continue;
    }

    if (c instanceof Date) {
      if (!Number.isNaN(c.getTime())) {
        return c;
      }
      continue;
    }

    if (typeof c === "string" || typeof c === "number") {
      const t = new Date(c);
      if (!Number.isNaN(t.getTime())) {
        return t;
      }
    }
  }
  return new Date(NaN);
}

function getTimeSafe(d: Date): number {
  const t = d instanceof Date ? d.getTime() : NaN;
  return isNaN(t) ? 0 : t;
}

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && !Number.isNaN(value)) {
    return value;
  }
  const numeric = Number(value);
  return Number.isNaN(numeric) ? fallback : numeric;
}

function toStringSafe(value: unknown, fallback = "Unknown"): string {
  if (typeof value === "string" && value.trim() !== "") {
    return value;
  }
  if (typeof value === "number" && !Number.isNaN(value)) {
    return String(value);
  }
  return fallback;
}

// Narrowing helpers
function hasData<T = unknown>(value: unknown): value is { data: T } {
  return typeof value === "object" && value !== null && "data" in value;
}

async function fetchRegistrationActivities(
  day: number,
  month: number,
  year: number,
  abortSignal?: AbortSignal
): Promise<ActivityItem[]> {
  try {
    const res = await fetch(
      `${getBaseUrl()}/admin/dashboard/recent-activity/${day}/${month}/${year}`,
      {
        method: "GET",
        credentials: "include",
        signal: abortSignal,
      }
    );

    if (!res.ok) return [];
    const data: unknown = await res.json();
    if (!Array.isArray(data)) return [];

    return data.slice(0, 10).map((user, index: number) => {
      if (!user || typeof user !== "object") {
        return {
          id: `user-error-${index}`,
          type: "register",
          title: "New user registered",
          time: new Date(NaN),
        };
      }

      const record = user as Record<string, unknown>;
      const id =
        (record.id as string | undefined) || `user-${index}-${Date.now()}`;
      const name =
        (record.displayName as string | undefined) ||
        (record.name as string | undefined) ||
        (record.email as string | undefined) ||
        "New user";
      const time = parseItemDate(
        record.createdAt as string | number | Date | undefined,
        record.created_at as string | number | Date | undefined,
        record.registeredAt as string | number | Date | undefined,
        record.joinDate as string | number | Date | undefined
      );

      return {
        id,
        type: "register",
        title: `${name} registered`,
        time,
      };
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "AbortError") {
      throw error;
    }
    return [];
  }
}

async function fetchBookingActivities(
  day: number,
  month: number,
  year: number,
  abortSignal?: AbortSignal
): Promise<ActivityItem[]> {
  try {
    const signal = abortSignal ?? new AbortController().signal;
    const response = await getBookingByDate(day, month, year, signal);
    const bookings: IBooking[] = Array.isArray(response?.data)
      ? response.data
      : [];

    return bookings.slice(0, 10).map((booking, index) => {
      const id = booking.id || `booking-${index}-${Date.now()}`;
      const customerName = booking.user?.displayName || "Customer";
      const packageTitle = booking.package?.title
        ? ` - ${booking.package.title}`
        : "";
      const time = parseItemDate(
        booking.date,
        (booking as unknown as { createdAt?: string }).createdAt
      );

      return {
        id,
        type: "booking",
        title: `New booking by ${customerName}${packageTitle}`.trim(),
        time,
      };
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "AbortError") {
      throw error;
    }
    return [];
  }
}

function mergeActivities(
  bookings: ActivityItem[],
  registrations: ActivityItem[]
): ActivityItem[] {
  return [...bookings, ...registrations]
    .sort((a, b) => getTimeSafe(b.time) - getTimeSafe(a.time))
    .slice(0, 8);
}

// Simple dashboard data loader hook
export default function useDashboard() {
  const [statistics, setStatistics] = useState<Statistics>({
    totalBookings: 0,
    totalRevenue: 0,
    totalUsers: 0,
    todayBookings: 0,
  });

  const [monthlyTrend, setMonthlyTrend] = useState<TrendItem[]>([
    { name: "January", totalBookings: 0 },
    { name: "February", totalBookings: 0 },
    { name: "March", totalBookings: 0 },
    { name: "April", totalBookings: 0 },
    { name: "May", totalBookings: 0 },
    { name: "June", totalBookings: 0 },
    { name: "July", totalBookings: 0 },
    { name: "August", totalBookings: 0 },
    { name: "September", totalBookings: 0 },
    { name: "October", totalBookings: 0 },
    { name: "November", totalBookings: 0 },
    { name: "December", totalBookings: 0 },
  ]);

  const [branchPerformance, setBranchPerformance] = useState<
    BranchPerformanceItem[]
  >([
    {
      branchId: "placeholder",
      branchName: "Loading...",
      totalBookings: 0,
    },
  ]);

  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loadingActivities, setLoadingActivities] = useState<boolean>(true);

  const nowRef = useRef(new Date());
  const initialDate = nowRef.current;
  const [trendYear, setTrendYear] = useState<number>(
    initialDate.getFullYear()
  );
  const trendYearRef = useRef(trendYear);
  useEffect(() => {
    trendYearRef.current = trendYear;
  }, [trendYear]);

  const [selectedActivityDate, setSelectedActivityDate] = useState<{
    day: number;
    month: number;
    year: number;
  }>({
    day: initialDate.getDate(),
    month: initialDate.getMonth() + 1,
    year: initialDate.getFullYear(),
  });
  const selectedActivityDateRef = useRef(selectedActivityDate);
  useEffect(() => {
    selectedActivityDateRef.current = selectedActivityDate;
  }, [selectedActivityDate]);

  // Prevent state updates after unmount or abort
  const mountedRef = useRef(true);
  const activeLoadControllerRef = useRef<AbortController | null>(null);
  const activityControllerRef = useRef<AbortController | null>(null);
  const load = useCallback(async (signal?: AbortSignal) => {
    try {
      const statsResponse = await fetch(
        `${getBaseUrl()}/admin/dashboard`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          cache: "no-store",
          signal,
        }
      );
      const statsJson: unknown = await statsResponse.json();
      if (signal?.aborted || !mountedRef.current) return;
      if (hasData<Partial<Statistics>>(statsJson)) {
        const statsData = statsJson.data as Partial<Statistics>;
        setStatistics({
          totalBookings: toNumber(statsData.totalBookings),
          totalRevenue: toNumber(statsData.totalRevenue),
          totalUsers: toNumber(statsData.totalUsers),
          todayBookings: toNumber(statsData.todayBookings),
        });
      }

      const trendYearValue = Number(trendYearRef.current);
      const trendYearQuery =
        Number.isFinite(trendYearValue) && trendYearValue > 0
          ? `?year=${Math.floor(trendYearValue)}`
          : "";
      const monthlyResponse = await fetch(
        `${getBaseUrl()}/admin/dashboard/trending${trendYearQuery}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          cache: "no-store",
          signal,
        }
      );
      const monthlyJson: unknown = await monthlyResponse.json();
      if (signal?.aborted || !mountedRef.current) return;
      if (Array.isArray(monthlyJson)) {
        const normalized: TrendItem[] = monthlyJson.map((item) => {
          if (item && typeof item === "object") {
            const record = item as Record<string, unknown>;
            const total = toNumber(record.totalBookings);
            if (typeof record.name === "string" && record.name) {
              return { name: record.name, totalBookings: total };
            }
            if (record.month !== undefined) {
              const monthIndex = Math.max(
                0,
                Math.min(11, Math.floor(toNumber(record.month, 1) - 1))
              );
              return {
                name: MONTH_NAMES[monthIndex],
                totalBookings: total,
              };
            }
            return { name: "Unknown", totalBookings: total };
          }
          return { name: "Unknown", totalBookings: 0 };
        });
        setMonthlyTrend(normalized);
      }

      const branchResponse = await fetch(
        `${getBaseUrl()}/admin/dashboard/branch-performance`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          cache: "no-store",
          signal,
        }
      );
      const branchJson: unknown = await branchResponse.json();
      if (signal?.aborted || !mountedRef.current) return;
      if (Array.isArray(branchJson)) {
        const branches = branchJson.map((item) => {
          if (item && typeof item === "object") {
            const record = item as Record<string, unknown>;
            return {
              branchId: toStringSafe(record.branchId ?? record.id ?? ""),
              branchName: toStringSafe(
                record.branchName ?? record.name ?? "Unknown"
              ),
              totalBookings: toNumber(record.totalBookings),
            };
          }
          return {
            branchId: "",
            branchName: "Unknown",
            totalBookings: 0,
          };
        });
        setBranchPerformance(branches);
      }
    } catch {
      // Keep dashboard resilient
    }

    if (signal?.aborted || !mountedRef.current) return;
    setLoadingActivities(true);
    try {
      const { day, month, year } = selectedActivityDateRef.current;
      const activitiesForToday = await getRecentActivityByDate(
        day,
        month,
        year,
        signal
      );

      if (signal?.aborted || !mountedRef.current) return;
      setActivities(activitiesForToday);
    } catch {
      if (signal?.aborted || !mountedRef.current) return;
      setActivities([]);
    } finally {
      if (signal?.aborted || !mountedRef.current) return;
      setLoadingActivities(false);
    }
  }, []);

  const startLoad = useCallback(() => {
    if (!mountedRef.current) return;
    const controller = new AbortController();
    activeLoadControllerRef.current?.abort();
    activeLoadControllerRef.current = controller;
    void load(controller.signal).finally(() => {
      if (activeLoadControllerRef.current === controller) {
        activeLoadControllerRef.current = null;
      }
    });
  }, [load]);

  useEffect(() => {
    mountedRef.current = true;
    startLoad();
    return () => {
      mountedRef.current = false;
      activeLoadControllerRef.current?.abort();
      activityControllerRef.current?.abort();
    };
  }, [startLoad]);

  const reload = useCallback(() => {
    startLoad();
  }, [startLoad]);

  const changeTrendYear = useCallback(
    (yearInput: number | string) => {
      const numericYear = Number(yearInput);
      if (!Number.isFinite(numericYear) || numericYear <= 0) {
        return;
      }
      const normalizedYear = Math.floor(numericYear);
      if (trendYearRef.current === normalizedYear) {
        return;
      }
      trendYearRef.current = normalizedYear;
      setTrendYear(normalizedYear);
      startLoad();
    },
    [startLoad]
  );

  // Load recent registration activity for a specific date (day/month/year)
  // Assumes backend route: /admin/dashboard/recent-activity/year/:day/:month/:year
  const loadRecentActivityByDate = useCallback(
    async (
      dayInput: number | string,
      monthInput: number | string,
      yearInput: number | string
    ) => {
      if (!mountedRef.current) return;

      const dayNumber = Number(dayInput);
      const monthNumber = Number(monthInput);
      const yearNumber = Number(yearInput);

      if (
        Number.isNaN(dayNumber) ||
        Number.isNaN(monthNumber) ||
        Number.isNaN(yearNumber)
      ) {
        return;
      }

      const normalizedMonth = Math.min(
        12,
        Math.max(1, Math.floor(monthNumber))
      );
      const normalizedYear = Math.max(0, Math.floor(yearNumber));
      const daysInMonth = new Date(
        normalizedYear,
        normalizedMonth,
        0
      ).getDate();
      const normalizedDay = Math.min(
        daysInMonth,
        Math.max(1, Math.floor(dayNumber))
      );

      const nextDate = {
        day: normalizedDay,
        month: normalizedMonth,
        year: normalizedYear,
      };

      selectedActivityDateRef.current = nextDate;
      setSelectedActivityDate(nextDate);

      activityControllerRef.current?.abort();
      const controller = new AbortController();
      activityControllerRef.current = controller;
      setLoadingActivities(true);
      try {
        const activitiesForDay = await getRecentActivityByDate(
          nextDate.day,
          nextDate.month,
          nextDate.year,
          controller.signal
        );
        if (!mountedRef.current || controller.signal.aborted) return;
        setActivities(activitiesForDay);
      } catch (error: unknown) {
        if (!mountedRef.current) return;
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }
        setActivities([]);
      } finally {
        if (activityControllerRef.current === controller) {
          activityControllerRef.current = null;
        }
        if (!mountedRef.current) return;
        setLoadingActivities(false);
      }
    },
    []
  );

  return {
    statistics,
    monthlyTrend,
    branchPerformance,
    activities,
    loadingActivities,
    reload,
    loadRecentActivityByDate,
    selectedActivityDate,
    selectedTrendYear: trendYear,
    changeTrendYear,
  };
}

// Standalone API helper for fetching recent activity for a date without using the hook state
export async function getRecentActivityByDate(
  day: number | string,
  month: number | string,
  year: number | string,
  abortSignal?: AbortSignal
): Promise<ActivityItem[]> {
  const dayNumber = Number(day);
  const monthNumber = Number(month);
  const yearNumber = Number(year);

  if (
    Number.isNaN(dayNumber) ||
    Number.isNaN(monthNumber) ||
    Number.isNaN(yearNumber)
  ) {
    return [];
  }

  try {
    const [bookingActivities, registrationActivities] = await Promise.all([
      fetchBookingActivities(dayNumber, monthNumber, yearNumber, abortSignal),
      fetchRegistrationActivities(
        dayNumber,
        monthNumber,
        yearNumber,
        abortSignal
      ),
    ]);

    return mergeActivities(bookingActivities, registrationActivities);
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "AbortError") {
      throw error;
    }
    return [];
  }
}
