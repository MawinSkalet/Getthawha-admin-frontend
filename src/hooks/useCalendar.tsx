import type IBooking from "@/interfaces/IBooking";
import type IErrorResponse from "@interfaces/IErrorResponse";
import type IDailyBookingsStatus from "@interfaces/IDailyBookingsStatus";

async function getBookingByDate(
  day: number,
  month: number,
  year: number,
  abortSignal: AbortSignal
) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/calendar/date/${day}/${month}/${year}`,
      {
        method: "GET",
        signal: abortSignal,
        credentials: "include",
      }
    );

    if (!response.ok) {
      if (response.status === 401 || response.status === 500) {
        const errorResponse: IErrorResponse = await response.json();
        throw new Error(
          `Error ${errorResponse.status}: ${errorResponse.message}`
        );
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: { status: string; data: IBooking[] } = await response.json();
    return data;
  } catch (error: unknown) {
    // Don't log abort errors as they are expected during cleanup
    if (error instanceof Error && error.name === "AbortError") {
      throw error; // Re-throw abort errors silently
    }
    // Log other errors
    console.error("Failed to fetch bookings by date:", error);
    throw error;
  }
}

async function getDailyBookingsStatus(
  month: number,
  year: number,
  abortSignal: AbortSignal
) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/calendar/${year}/${month}`,
      {
        method: "GET",
        signal: abortSignal,
        credentials: "include",
      }
    );

    if (!response.ok) {
      if (response.status === 401 || response.status === 500) {
        const errorResponse: IErrorResponse = await response.json();
        throw new Error(
          `Error ${errorResponse.status}: ${errorResponse.message}`
        );
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: IDailyBookingsStatus = await response.json();
    return data;
  } catch (error: unknown) {
    // Don't log abort errors as they are expected during cleanup
    if (error instanceof Error && error.name === "AbortError") {
      throw error; // Re-throw abort errors silently
    }
    // Log other errors
    console.error("Failed to fetch daily bookings status:", error);
    throw error;
  }
}

export { getBookingByDate, getDailyBookingsStatus };
