"use client";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AdminNavbar from "@/components/AdminNavBar";
import UserAvatar from "@/components/UserAvatar";
import { getBookingByDate, getDailyBookingsStatus } from "@/hooks/useCalendar";
import IBooking from "@/interfaces/IBooking";
import IDailyBookingsStatus from "@/interfaces/IDailyBookingsStatus";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CalendarDaysIcon,
  ClockIcon,
  MapPinIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";

interface DateDetail {
  day: number;
  month: number;
  year: number;
  isToday: boolean;
}

const bookingStatusLabels: Record<IBooking["status"], string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
};

const bookingStatusStyles: Record<IBooking["status"], string> = {
  pending: "border-[#E7D6AF] bg-[#FBF2DD] text-[#785819]",
  confirmed: "border-[#D8E3D3] bg-[#EFF5EC] text-[#496446]",
  completed: "border-[#DED6CC] bg-[#F3EFE9] text-[#66594D]",
  cancelled: "border-[#E8D4CF] bg-[#F8EEEB] text-[#8A5144]",
};

const bookingStatusAccent: Record<IBooking["status"], string> = {
  pending: "bg-[#B9892C]",
  confirmed: "bg-[#718468]",
  completed: "bg-[#A99C8E]",
  cancelled: "bg-[#A75E4F]",
};

export default function BookingCalendarPage() {
  const bookingRef = useRef<HTMLDivElement>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [bookingsLoading, setBookingsLoading] = useState(true);

  const initDate = new Date();
  const [currentMonth, setCurrentMonth] = useState(initDate.getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(initDate.getFullYear());

  const [selectedDay, setSelectedDay] = useState<number | null>(
    initDate.getDate()
  );
  const [selectedMonth, setSelectedMonth] = useState<number | null>(
    initDate.getMonth() + 1
  );
  const [selectedYear, setSelectedYear] = useState<number | null>(
    initDate.getFullYear()
  );

  const [bookings, setBookings] = useState<IBooking[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [dailyBookingsStatus, setDailyBookingsStatus] =
    useState<IDailyBookingsStatus | null>(null);

  const fullCalendar = useMemo(() => {
    const today = new Date();
    const currentDay = today.getDate();
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    const firstDayOfMonth = new Date(currentYear, currentMonth - 1, 1).getDay();
    const calendar: DateDetail[] = [];

    // Fill in the empty days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      calendar.push({
        day: 0,
        month: currentMonth,
        year: currentYear,
        isToday: false,
      });
    }

    // Fill in the days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      calendar.push({
        day,
        month: currentMonth,
        year: currentYear,
        isToday:
          day === currentDay &&
          currentMonth === today.getMonth() + 1 &&
          currentYear === today.getFullYear(),
      });
    }

    return calendar;
  }, [currentMonth, currentYear]);

  useEffect(() => {

    const abortController = new AbortController();
    const { signal } = abortController;

    const fetchDailyBookingsStatus = async () => {
      try {
        const data = await getDailyBookingsStatus(
          currentMonth,
          currentYear,
          signal
        );
        setDailyBookingsStatus(data);
      } catch (error: unknown) {
        // Only log non-abort errors
        if (error instanceof Error && error.name !== "AbortError") {
          console.error("Failed to fetch daily bookings status:", error);
        }
      } finally {
        // Only update loading state if not aborted
        if (!signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    fetchDailyBookingsStatus();

    return () => {
      abortController.abort();
    };
  }, [currentMonth, currentYear]);

  // Handle day click with loading state
  const handleDayClick = (day: number) => {
    setSelectedDay(day);
    setSelectedMonth(currentMonth);
    setSelectedYear(currentYear);
    setBookingsLoading(true);
  };

  const Days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const Months = [
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

  const handleMonthChange = (direction: "prev" | "next") => {
    setIsLoading(true);
    if (direction === "prev") {
      if (currentMonth === 1) {
        setCurrentMonth(12);
        setCurrentYear(currentYear - 1);
      } else {
        setCurrentMonth(currentMonth - 1);
      }
    } else {
      if (currentMonth === 12) {
        setCurrentMonth(1);
        setCurrentYear(currentYear + 1);
      } else {
        setCurrentMonth(currentMonth + 1);
      }
    }
  };

  // Enhanced booking fetching with loading state
  useEffect(() => {
    const abortController = new AbortController();
    const { signal } = abortController;

    if (selectedDay && selectedMonth && selectedYear) {
      getBookingByDate(selectedDay, selectedMonth, selectedYear, signal)
        .then((data) => {
          if (!signal.aborted) {
            setBookings(data.data || []);
          }
        })
        .catch((error: unknown) => {
          // Only log and handle non-abort errors
          if (error instanceof Error && error.name !== "AbortError") {
            console.error("Failed to fetch bookings:", error);
            if (!signal.aborted) {
              setBookings([]);
            }
          }
        })
        .finally(() => {
          // Only update loading state if not aborted
          if (!signal.aborted) {
            setBookingsLoading(false);
          }
        });
    }

    return () => {
      abortController.abort();
    };
  }, [selectedDay, selectedMonth, selectedYear]);

  const filteredBookings = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return normalizedSearch
      ? bookings.filter(
          (booking) =>
            booking.user.displayName
              ?.toLowerCase()
              .includes(normalizedSearch) ||
            booking.package.title
              .toLowerCase()
              .includes(normalizedSearch) ||
            booking.branch.name.toLowerCase().includes(normalizedSearch)
        )
      : bookings;
  }, [bookings, searchTerm]);

  // Get booking count for a specific day
  const getBookingCount = useCallback(
    (day: number): number => {
      if (day < 1 || day > 31 || !dailyBookingsStatus) return 0;
      const dayKey = day.toString() as keyof typeof dailyBookingsStatus.data;
      // Since the data structure returns boolean, we can't get actual count
      // Return 1 if there are bookings, 0 if not
      return dailyBookingsStatus.data[dayKey] ? 1 : 0;
    },
    [dailyBookingsStatus]
  );

  // Format selected date for display
  const formatSelectedDate = () => {
    if (!selectedDay || !selectedMonth || !selectedYear) return "Select a date";
    const date = new Date(selectedYear, selectedMonth - 1, selectedDay);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Check if a date is in the past
  const isDatePast = useCallback(
    (day: number, month: number, year: number): boolean => {
      const today = new Date();
      const dateToCheck = new Date(year, month - 1, day);
      const todayWithoutTime = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
      );
      return dateToCheck < todayWithoutTime;
    },
    []
  );

  // Check if a date is today
  const isDateToday = useCallback(
    (day: number, month: number, year: number): boolean => {
      const today = new Date();
      return (
        day === today.getDate() &&
        month === today.getMonth() + 1 &&
        year === today.getFullYear()
      );
    },
    []
  );

  // Check if a date is in the future
  const isDateFuture = useCallback(
    (day: number, month: number, year: number): boolean => {
      const today = new Date();
      const dateToCheck = new Date(year, month - 1, day);
      const todayWithoutTime = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
      );
      return dateToCheck > todayWithoutTime;
    },
    []
  );

  return (
    <>
      <AdminNavbar />

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto p-6 space-y-6">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <CalendarDaysIcon className="w-8 h-8 text-blue-600" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Booking Calendar
                  </h1>
                  <p className="text-sm text-gray-600">
                    View and manage bookings by date
                  </p>
                </div>
              </div>

              {/* Month Navigation */}
              <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-1">
                <button
                  onClick={() => handleMonthChange("prev")}
                  className="p-2 hover:bg-white rounded-md transition-colors"
                  disabled={isLoading}
                >
                  <ChevronLeftIcon className="w-5 h-5 text-gray-600" />
                </button>
                <div className="px-4 py-2 font-semibold text-gray-900 min-w-[140px] text-center">
                  {Months[currentMonth - 1]} {currentYear}
                </div>
                <button
                  onClick={() => handleMonthChange("next")}
                  className="p-2 hover:bg-white rounded-md transition-colors"
                  disabled={isLoading}
                >
                  <ChevronRightIcon className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-1 mb-4">
              {Days.map((day, index) => (
                <div key={index} className="p-3 text-center">
                  <h3 className="text-sm font-medium text-gray-700">{day}</h3>
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
              </div>
            ) : (
              <div className="grid grid-cols-7 gap-1">
                {fullCalendar.map((dateDetail: DateDetail, index: number) => {
                  const bookingCount = getBookingCount(dateDetail.day);
                  const isSelected =
                    dateDetail.day === selectedDay &&
                    dateDetail.month === selectedMonth &&
                    dateDetail.year === selectedYear;
                  const isPast = isDatePast(
                    dateDetail.day,
                    dateDetail.month,
                    dateDetail.year
                  );
                  const isToday = isDateToday(
                    dateDetail.day,
                    dateDetail.month,
                    dateDetail.year
                  );
                  const isFuture = isDateFuture(
                    dateDetail.day,
                    dateDetail.month,
                    dateDetail.year
                  );

                  return (
                    <div key={index} className="aspect-square">
                      {dateDetail.day !== 0 ? (
                        <button
                          onClick={() => handleDayClick(dateDetail.day)}
                          className={`
                            w-full h-full p-2 rounded-lg border-2 transition-all duration-200 relative group
                            ${
                              isSelected
                                ? "border-blue-500 bg-blue-50 text-blue-700"
                                : isPast
                                ? "border-transparent hover:border-gray-200 hover:bg-gray-25"
                                : isToday
                                ? "border-blue-300 bg-blue-50 hover:border-blue-400"
                                : "border-transparent hover:border-blue-300 hover:bg-blue-25"
                            }
                            ${isPast ? "opacity-60" : "opacity-100"}
                          `}
                        >
                          <div className="flex flex-col items-center justify-center h-full">
                            <span
                              className={`
                              text-sm font-medium transition-colors
                              ${
                                isPast
                                  ? "text-gray-400"
                                  : isToday
                                  ? "text-blue-700 font-bold"
                                  : "text-gray-900"
                              }
                              ${isSelected ? "text-blue-700" : ""}
                            `}
                            >
                              {dateDetail.day}
                            </span>

                            {bookingCount > 0 && (
                              <div
                                className={`
                                absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 rounded-full text-xs font-bold
                                flex items-center justify-center transition-all duration-200
                                ${
                                  isPast
                                    ? "bg-gray-400 text-white opacity-70"
                                    : isToday
                                    ? "bg-orange-500 text-white animate-pulse"
                                    : isFuture
                                    ? "bg-green-500 text-white shadow-lg group-hover:animate-bounce"
                                    : "bg-blue-500 text-white"
                                }
                                ${isSelected ? "ring-2 ring-white" : ""}
                              `}
                              >
                                {bookingCount}
                              </div>
                            )}

                            {/* Add a subtle dot indicator for future bookings */}
                            {bookingCount > 0 && isFuture && (
                              <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                            )}

                            {/* Add today indicator */}
                            {isToday && (
                              <div className="absolute inset-0 rounded-lg ring-2 ring-blue-400 ring-opacity-50 animate-pulse pointer-events-none"></div>
                            )}
                          </div>
                        </button>
                      ) : (
                        <div className="w-full h-full"></div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Bookings Section */}
          {selectedDay && selectedMonth && selectedYear && (
            <div
              ref={bookingRef}
              className="overflow-hidden rounded-2xl border border-[#E9DFCE] bg-[#FFFDFA] shadow-[0_2px_12px_rgba(59,38,28,0.05)]"
            >
              <div className="border-b border-[#EEE7DC] p-5 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-xl font-semibold text-[#3B261C]">
                        Bookings
                      </h2>
                      <span className="rounded-full bg-[#F4EAD4] px-2.5 py-1 text-xs font-semibold text-[#735318]">
                        {bookings.length} {bookings.length === 1 ? "booking" : "bookings"}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-[#857568]">
                      {formatSelectedDate()}
                    </p>
                  </div>

                  <div className="relative w-full sm:max-w-xs">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#9A8D81]" />
                    <input
                      type="text"
                      aria-label="Search bookings"
                      placeholder="Search bookings..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="h-11 w-full rounded-xl border border-[#DCCFBC] bg-white pl-10 pr-4 text-sm text-[#30231D] placeholder:text-[#9A8D81] focus:border-[#B9892C] focus:outline-none focus:ring-2 focus:ring-[#B9892C]/20"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3 p-4 sm:p-6">
                {bookingsLoading ? (
                  <div className="flex items-center justify-center gap-3 py-12 text-sm text-[#756457]">
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#E9DFCE] border-t-[#B9892C]" />
                    <span>Loading bookings...</span>
                  </div>
                ) : filteredBookings.length === 0 ? (
                  <div className="py-12 text-center">
                    <CalendarDaysIcon className="mx-auto mb-4 h-11 w-11 text-[#B7A998]" />
                    <h3 className="mb-2 text-lg font-semibold text-[#3B261C]">
                      No bookings found
                    </h3>
                    <p className="text-sm text-[#756457]">
                      {searchTerm
                        ? "No bookings match your search."
                        : "No bookings scheduled for this date."}
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {filteredBookings.map((booking) => {
                      const bookingDate = new Date(booking.date);
                      const timeString = Number.isNaN(bookingDate.getTime())
                        ? "Time unavailable"
                        : bookingDate.toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                            timeZone: "Asia/Bangkok",
                          });
                      const status = bookingStatusLabels[booking.status]
                        ? booking.status
                        : "pending";
                      const customerName = booking.user?.displayName || "Customer";
                      const serviceName = booking.package?.title || "Service unavailable";
                      const branchName = booking.branch?.name || "Branch unavailable";

                      return (
                        <article
                          key={booking.id}
                          className="relative overflow-hidden rounded-xl border border-[#E9DFCE] bg-[#FFFDFA] p-4 shadow-[0_1px_4px_rgba(59,38,28,0.04)] transition-shadow hover:shadow-[0_4px_14px_rgba(59,38,28,0.08)] sm:p-5"
                        >
                          <span
                            aria-hidden="true"
                            className={`absolute inset-y-4 left-0 w-1 rounded-r-full ${bookingStatusAccent[status]}`}
                          />
                          <div className="pl-3">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                              <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                                <UserAvatar
                                  name={customerName}
                                  pictureUrl={booking.user?.pictureUrl}
                                  size="lg"
                                />
                                <div className="min-w-0">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <h3 className="truncate text-base font-semibold text-[#3B261C] sm:text-lg">
                                      {customerName}
                                    </h3>
                                    <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${bookingStatusStyles[status]}`}>
                                      {bookingStatusLabels[status]}
                                    </span>
                                  </div>
                                  <p className="mt-1 text-sm text-[#857568]">Appointment</p>
                                </div>
                              </div>

                              <div className="flex items-center justify-between gap-4 pl-[60px] sm:justify-end sm:pl-0">
                                <span className="inline-flex items-center gap-2 rounded-lg bg-[#F7F3EB] px-3 py-2 text-sm font-semibold text-[#49372B]">
                                  <ClockIcon className="h-4 w-4 text-[#8C6721]" />
                                  {timeString}
                                </span>
                                <div className="min-w-[90px] text-right">
                                  <p className="text-xs text-[#857568]">Total</p>
                                  <p className="text-lg font-bold text-[#8C6721]">
                                    ฿{Number(booking.totalPrice).toLocaleString("en-US", {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    })}
                                  </p>
                                </div>
                              </div>
                            </div>

                            <dl className="mt-4 grid gap-3 border-t border-[#F0E9DE] pt-4 sm:grid-cols-2 sm:gap-6">
                              <div className="min-w-0">
                                <dt className="text-xs text-[#8B7D70]">Service</dt>
                                <dd className="mt-1 truncate text-sm font-medium text-[#49372B]" title={serviceName}>
                                  {serviceName}
                                </dd>
                              </div>
                              <div className="min-w-0">
                                <dt className="text-xs text-[#8B7D70]">Branch</dt>
                                <dd className="mt-1 flex items-center gap-1.5 truncate text-sm font-medium text-[#49372B]">
                                  <MapPinIcon className="h-4 w-4 shrink-0 text-[#8C6721]" />
                                  <span className="truncate">{branchName}</span>
                                </dd>
                              </div>
                            </dl>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
