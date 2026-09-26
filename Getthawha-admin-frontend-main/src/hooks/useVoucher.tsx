import IVoucher from "@/interfaces/IVoucher";
import IVoucherInput from "@/interfaces/IVoucherInput";
import type IErrorResponse from "@interfaces/IErrorResponse";
import { getBaseUrl } from "@/lib/api";

async function getAllVouchers(abortSignal: AbortSignal) {
  const response = await fetch(
    `${getBaseUrl()}/admin/voucher`,
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

  const data: IVoucher[] = await response.json();
  return data;
}

async function createVoucher(voucher: IVoucherInput, abortSignal: AbortSignal) {
  const response = await fetch(
    `${getBaseUrl()}/admin/voucher`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(voucher),
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

  const data: IVoucher = await response.json();
  return data;
}

async function updateVoucher(
  id: string,
  voucher: IVoucherInput,
  abortSignal: AbortSignal
) {
  const response = await fetch(
    `${getBaseUrl()}/admin/voucher/${id}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(voucher),
      signal: abortSignal,
      credentials: "include",
    }
  );

  if (
    response.status == 401 ||
    response.status == 400 ||
    response.status == 404 ||
    response.status == 500
  ) {
    const errorResponse: IErrorResponse = await response.json();
    return errorResponse;
  }

  const data: IVoucher = await response.json();
  return data;
}

async function deleteVoucher(id: string, abortSignal: AbortSignal) {
  const response = await fetch(
    `${getBaseUrl()}/admin/voucher/${id}`,
    {
      method: "DELETE",
      signal: abortSignal,
      credentials: "include",
    }
  );

  if (
    response.status == 401 ||
    response.status == 500 ||
    response.status == 404
  ) {
    const errorResponse: IErrorResponse = await response.json();
    return errorResponse;
  }

  return { success: true };
}

export { getAllVouchers, updateVoucher, createVoucher, deleteVoucher };
