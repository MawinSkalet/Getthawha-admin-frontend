"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import AdminNavbar from "@/components/AdminNavBar";
import { getBookingByDate, getDailyBookingsStatus } from "@/hooks/useCalendar";
import IBooking from "@/interfaces/IBooking";
import IDailyBookingsStatus from "@/interfaces/IDailyBookingsStatus";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CalendarDaysIcon,
  ClockIcon,
  MapPinIcon,
  UserIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";

interface DateDetail {
  day: number;
  month: number;
  year: number;
  isToday: boolean;
}

export default function BookingCalendarPage() {
  const bookingRef = useRef<HTMLDivElement>(null);

  const [fullCalendar, setFullCalendar] = useState<DateDetail[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [bookingsLoading, setBookingsLoading] = useState(false);

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
  const [filteredBookings, setFilteredBookings] = useState<IBooking[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [dailyBookingsStatus, setDailyBookingsStatus] =
    useState<IDailyBookingsStatus | null>(null);

  useEffect(() => {
    setIsLoading(true);
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

    setFullCalendar(calendar);

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
      setBookingsLoading(true);
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

  // Filter bookings based on search and status
  useEffect(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const filtered = normalizedSearch
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

    setFilteredBookings(filtered);
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
              className="bg-white rounded-lg shadow-sm border border-gray-200"
            >
              <div className="p-6 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      Bookings
                    </h2>
                    <p className="text-sm text-gray-600">
                      {formatSelectedDate()}
                    </p>
                  </div>

                  {/* Search and Filter */}
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search bookings..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6">
                {bookingsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full mr-3"></div>
                    <span className="text-gray-600">Loading bookings...</span>
                  </div>
                ) : filteredBookings.length === 0 ? (
                  <div className="text-center py-12">
                    <CalendarDaysIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No bookings found
                    </h3>
                    <p className="text-gray-600">
                      {searchTerm
                        ? "No bookings match your search."
                        : "No bookings scheduled for this date."}
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {filteredBookings.map((booking) => {
                      const bookingDate = new Date(booking.date);
                      const isUpcoming = bookingDate > new Date();
                      const isBookingToday =
                        bookingDate.toDateString() ===
                        new Date().toDateString();

                      // Format time with more detail
                      const timeString = bookingDate.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      });

                      return (
                        <div
                          key={booking.id}
                          className={`
                            border rounded-lg p-4 transition-all duration-200 relative
                            ${
                              isUpcoming
                                ? "border-green-200 bg-green-50 hover:bg-green-100 shadow-md hover:shadow-lg"
                                : isBookingToday
                                ? "border-orange-200 bg-orange-50 hover:bg-orange-100 shadow-md"
                                : "border-gray-200 bg-gray-50 hover:bg-gray-100 opacity-75"
                            }
                          `}
                        >
                          {/* Prominent Time Badge */}
                          <div
                            className={`
                            absolute top-4 right-4 px-3 py-2 rounded-lg font-bold text-lg shadow-md
                            ${
                              isUpcoming
                                ? "bg-green-600 text-white"
                                : isBookingToday
                                ? "bg-orange-500 text-white animate-pulse"
                                : "bg-gray-500 text-white"
                            }
                          `}
                          >
                            {timeString}
                          </div>

                          <div className="relative pr-20 pb-8">
                            {/* Status indicator */}
                            <div
                              className={`
                              absolute left-0 top-0 bottom-0 w-1 rounded-l-lg
                              ${
                                isUpcoming
                                  ? "bg-green-500"
                                  : isBookingToday
                                  ? "bg-orange-500"
                                  : "bg-gray-400"
                              }
                            `}
                            ></div>

                            <div className="flex items-center gap-4 flex-1 ml-4">
                              {/* User Avatar with status ring */}
                              <div className="flex-shrink-0 relative">
                                <Image
                                  src={booking.user.pictureUrl}
                                  alt={
                                    booking.user.displayName || "User Avatar"
                                  }
                                  width={48}
                                  height={48}
                                  className={`
                                    w-12 h-12 rounded-full object-cover border-2 transition-all
                                    ${
                                      isUpcoming
                                        ? "border-green-300 ring-2 ring-green-200"
                                        : isBookingToday
                                        ? "border-orange-300 ring-2 ring-orange-200"
                                        : "border-gray-300"
                                    }
                                  `}
                                  unoptimized
                                />
                                {/* Status dot */}
                                <div
                                  className={`
                                  absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white
                                  ${
                                    isUpcoming
                                      ? "bg-green-500"
                                      : isBookingToday
                                      ? "bg-orange-500 animate-pulse"
                                      : "bg-gray-400"
                                  }
                                `}
                                ></div>
                              </div>

                              {/* Booking Details */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-3">
                                  <UserIcon
                                    className={`
                                    w-4 h-4 
                                    ${
                                      isUpcoming
                                        ? "text-green-600"
                                        : isBookingToday
                                        ? "text-orange-600"
                                        : "text-gray-400"
                                    }
                                  `}
                                  />
                                  <span
                                    className={`
                                    font-semibold text-lg
                                    ${
                                      isUpcoming
                                        ? "text-green-900"
                                        : isBookingToday
                                        ? "text-orange-900"
                                        : "text-gray-600"
                                    }
                                  `}
                                  >
                                    {booking.user.displayName}
                                  </span>
                                  {/* Status badges */}
                                  {isUpcoming && (
                                    <span className="px-2 py-1 bg-green-200 text-green-800 text-xs font-medium rounded-full">
                                      Upcoming
                                    </span>
                                  )}
                                  {isBookingToday && (
                                    <span className="px-2 py-1 bg-orange-200 text-orange-800 text-xs font-medium rounded-full animate-pulse">
                                      Today
                                    </span>
                                  )}
                                </div>

                                {/* Enhanced Time Display */}
                                <div className="mb-3">
                                  <div
                                    className={`
                                    inline-flex items-center gap-2 px-4 py-2 rounded-full text-base font-semibold
                                    ${
                                      isUpcoming
                                        ? "bg-green-100 text-green-800 border border-green-300"
                                        : isBookingToday
                                        ? "bg-orange-100 text-orange-800 border border-orange-300"
                                        : "bg-gray-100 text-gray-600 border border-gray-300"
                                    }
                                  `}
                                  >
                                    <ClockIcon
                                      className={`
                                      w-5 h-5
                                      ${
                                        isUpcoming
                                          ? "text-green-500"
                                          : isBookingToday
                                          ? "text-orange-500"
                                          : "text-gray-400"
                                      }
                                    `}
                                    />
                                    <span>{timeString}</span>
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                  <div className="flex items-center gap-2">
                                    <MapPinIcon
                                      className={`
                                      w-4 h-4 
                                      ${
                                        isUpcoming
                                          ? "text-green-500"
                                          : isBookingToday
                                          ? "text-orange-500"
                                          : "text-gray-400"
                                      }
                                    `}
                                    />
                                    <span
                                      className={
                                        isUpcoming || isBookingToday
                                          ? "text-gray-700"
                                          : "text-gray-500"
                                      }
                                    >
                                      {booking.branch.name}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-2 md:col-span-2">
                                    <span
                                      className={`
                                      font-medium 
                                      ${
                                        isUpcoming
                                          ? "text-green-900"
                                          : isBookingToday
                                          ? "text-orange-900"
                                          : "text-gray-600"
                                      }
                                    `}
                                    >
                                      {booking.package.title}
                                    </span>
                                    {booking.voucher?.code && (
                                      <span
                                        className={`
                                        px-2 py-1 text-xs font-medium rounded
                                        ${
                                          isUpcoming
                                            ? "bg-green-100 text-green-800"
                                            : isBookingToday
                                            ? "bg-orange-100 text-orange-800"
                                            : "bg-gray-100 text-gray-600"
                                        }
                                      `}
                                      >
                                        {booking.voucher.code}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Price positioned at bottom right with Thai Baht */}
                            <div
                              className={`
                              absolute bottom-0 right-0 px-3 py-2 rounded-lg shadow-md border-2
                              flex items-center gap-1 text-xl font-bold
                              ${
                                isUpcoming
                                  ? "bg-green-50 border-green-300 text-green-700"
                                  : isBookingToday
                                  ? "bg-orange-50 border-orange-300 text-orange-700"
                                  : "bg-gray-50 border-gray-300 text-gray-600"
                              }
                            `}
                            >
                              <span className="text-lg">฿</span>
                              <span>{booking.totalPrice}</span>
                            </div>
                          </div>
                        </div>
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
