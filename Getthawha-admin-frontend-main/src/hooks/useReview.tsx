import type IReview from "@interfaces/IReview";
import type IErrorResponse from "@interfaces/IErrorResponse";
import { getBaseUrl } from "@/lib/api";

type ReviewStatusFilter = "approved" | "pending";

type ReviewApprovalResponse = {
  status: "success";
  message: string;
  review: IReview;
};

async function getReviews(
  status: ReviewStatusFilter | undefined,
  abortSignal: AbortSignal
) {
  const query = status ? `?status=${status}` : "";
  const response = await fetch(
    `${getBaseUrl()}/admin/review${query}`,
    {
      method: "GET",
      signal: abortSignal,
      credentials: "include",
    }
  );

  if (response.status === 401 || response.status === 500) {
    const errorResponse: IErrorResponse = await response.json();
    return errorResponse;
  }

  const data: IReview[] = await response.json();
  return data;
}

async function updateReviewApproval(
  id: string,
  isApproved: boolean,
  abortSignal: AbortSignal
) {
  const response = await fetch(
    `${getBaseUrl()}/admin/review/${id}/approval`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ isApproved }),
      signal: abortSignal,
      credentials: "include",
    }
  );

  if (
    response.status === 400 ||
    response.status === 401 ||
    response.status === 404 ||
    response.status === 500
  ) {
    const errorResponse: IErrorResponse = await response.json();
    return errorResponse;
  }

  const data: ReviewApprovalResponse = await response.json();
  return data;
}

async function deleteReview(id: string, abortSignal: AbortSignal) {
  const response = await fetch(
    `${getBaseUrl()}/admin/review/${id}`,
    {
      method: "DELETE",
      signal: abortSignal,
      credentials: "include",
    }
  );

  if (
    response.status === 401 ||
    response.status === 404 ||
    response.status === 500
  ) {
    const errorResponse: IErrorResponse = await response.json();
    return errorResponse;
  }

  return { message: "Review deleted successfully" };
}

export { getReviews, updateReviewApproval, deleteReview };
export type { ReviewStatusFilter, ReviewApprovalResponse };
