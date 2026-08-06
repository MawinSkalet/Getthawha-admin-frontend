import type IBooking from "@/interfaces/IBooking";
import type IErrorResponse from "@interfaces/IErrorResponse";

type UpdateBookingRequest = {
  userId: string;
  branchId: string;
  packageId: string;
  voucherId: string | null;
  date: string | Date;
  status: IBooking["status"];
};

async function getAllBooking(page = 1, abortSignal: AbortSignal) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/booking?page=${page}`,
    {
      method: "GET",
      signal: abortSignal,
      credentials: "include",
    }
  );

  if (response.status == 401 || response.status == 500) {
    const errorResponse: IErrorResponse = await response.json();
    return errorResponse;
  }

  const data: IBooking[] = await response.json();
  return data;
}

async function createBooking(
  branchId: string,
  packageId: string,
  date: Date,
  userId: string,
  voucherId: string | null,
  abortSignal: AbortSignal
) {
  // Use ISO 8601 in UTC with Z to match backend schema
  const toISOZ = (d: Date) => d.toISOString();

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/booking`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        branchId,
        packageId,
        date: toISOZ(date),
        userId,
        voucherId,
      }),
      signal: abortSignal,
      credentials: "include",
    }
  );

  if (
    response.status == 401 ||
    response.status == 400 ||
    response.status == 500
  ) {
    const errorResponse: IErrorResponse = await response.json();
    return errorResponse;
  }

  const data: IBooking = await response.json();
  return data;
}

// Update a booking by id with the fields required by the backend update logic
async function updateBookingById(
  bookingId: string,
  payload: UpdateBookingRequest,
  abortSignal: AbortSignal
) {
  const normalizeDate = (value: string | Date) => {
    if (value instanceof Date) {
      return value.toISOString();
    }

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? value : parsed.toISOString();
  };

  const body = {
    ...payload,
    voucherId: payload.voucherId ?? null,
    date: normalizeDate(payload.date),
  };

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/booking/${bookingId}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: abortSignal,
      credentials: "include",
    }
  );

  if (
    response.status == 401 ||
    response.status == 400 ||
    response.status == 500 ||
    response.status == 404
  ) {
    const errorResponse: IErrorResponse = await response.json();
    return errorResponse;
  }

  const data: IBooking = await response.json();
  return data;
}

export { getAllBooking, createBooking, updateBookingById };
export type { UpdateBookingRequest };
