"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import AdminNavbar from "@/components/AdminNavBar";
import {
  deleteReview,
  getReviews,
  updateReviewApproval,
  type ReviewApprovalResponse,
  type ReviewStatusFilter,
} from "@/hooks/useReview";
import type IReview from "@/interfaces/IReview";
import type IErrorResponse from "@/interfaces/IErrorResponse";
import {
  CheckCircleIcon,
  ClockIcon,
  TrashIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";

interface NotificationState {
  type: "success" | "error";
  message: string;
}

const ReviewManagement = () => {
  const [reviews, setReviews] = useState<IReview[]>([]);
  const [statusFilter, setStatusFilter] = useState<"all" | ReviewStatusFilter>(
    "all"
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [notification, setNotification] = useState<NotificationState | null>(
    null
  );
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Derived view state
  const filteredReviews = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) {
      return reviews;
    }

    return reviews.filter((review) => {
      const userName = review.user?.displayName?.toLowerCase() ?? "";
      const branchName = review.branch?.name?.toLowerCase() ?? "";
      const comment = review.comment?.toLowerCase() ?? "";

      return (
        userName.includes(query) ||
        branchName.includes(query) ||
        comment.includes(query)
      );
    });
  }, [reviews, searchTerm]);

  const totalReviews = filteredReviews.length;
  const approvedCount = filteredReviews.filter((review) => review.isApproved).length;
  const pendingCount = totalReviews - approvedCount;

  const showNotification = useCallback((state: NotificationState) => {
    setNotification(state);
  }, []);

  useEffect(() => {
    if (!notification) {
      return undefined;
    }

    const timer = setTimeout(() => setNotification(null), 4000);
    return () => clearTimeout(timer);
  }, [notification]);

  useEffect(() => {
    const controller = new AbortController();
    const fetchData = async () => {
      setLoading(true);
      setFetchError(null);

      try {
        const filterParam = statusFilter === "all" ? undefined : statusFilter;
        const result = await getReviews(filterParam, controller.signal);

        if (Array.isArray(result)) {
          setReviews(result);
        } else {
          const errorResponse = result as IErrorResponse;
          setFetchError(errorResponse.message || "Failed to load reviews");
          setReviews([]);
        }
      } catch (error) {
        if ((error as Error).name === "AbortError") {
          return;
        }
        console.error("Error fetching reviews:", error);
        setFetchError("An unexpected error occurred while loading reviews.");
        setReviews([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    return () => {
      controller.abort();
    };
  }, [statusFilter]);

  const handleApprovalToggle = async (review: IReview) => {
    const nextApprovalState = !review.isApproved;
    setActionLoadingId(review.id);

    try {
      const controller = new AbortController();
      const result = await updateReviewApproval(
        review.id,
        nextApprovalState,
        controller.signal
      );

      if ("review" in result) {
        const approvalResult = result as ReviewApprovalResponse;
        setReviews((prev) =>
          prev.map((item) =>
            item.id === review.id ? { ...item, ...approvalResult.review } : item
          )
        );
        showNotification({
          type: "success",
          message: approvalResult.message,
        });
      } else {
        const errorResult = result as IErrorResponse;
        showNotification({
          type: "error",
          message: errorResult.message || "Failed to update review status.",
        });
      }
    } catch (error) {
      if ((error as Error).name === "AbortError") {
        return;
      }
      console.error("Error updating review:", error);
      showNotification({
        type: "error",
        message: "An unexpected error occurred while updating the review.",
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    setActionLoadingId(reviewId);

    try {
      const controller = new AbortController();
      const result = await deleteReview(reviewId, controller.signal);

      if ("status" in result) {
        const errorResult = result as IErrorResponse;
        showNotification({
          type: "error",
          message: errorResult.message || "Failed to delete review.",
        });
      } else {
        setReviews((prev) => prev.filter((review) => review.id !== reviewId));
        showNotification({
          type: "success",
          message: result.message || "Review deleted successfully.",
        });
      }
    } catch (error) {
      if ((error as Error).name === "AbortError") {
        return;
      }
      console.error("Error deleting review:", error);
      showNotification({
        type: "error",
        message: "An unexpected error occurred while deleting the review.",
      });
    } finally {
      setActionLoadingId(null);
      setConfirmDeleteId(null);
    }
  };

  return (
    <>
      <AdminNavbar />
      <div className="p-6 bg-base-100 min-h-screen">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Review Management</h1>
            <p className="text-sm text-gray-500">
              Monitor customer feedback, approve pending reviews, or remove content
              that does not meet your guidelines.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {(["all", "approved", "pending"] as const).map((filter) => (
              <button
                key={filter}
                type="button"
                className={`btn ${
                  statusFilter === filter
                    ? "btn-primary text-white"
                    : "btn-outline"
                }`}
                onClick={() => setStatusFilter(filter)}
              >
                {filter === "all"
                  ? "All"
                  : filter === "approved"
                  ? "Approved"
                  : "Pending"}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="card bg-base-200 shadow-sm">
            <div className="card-body">
              <p className="text-sm text-gray-500">Total Reviews</p>
              <p className="text-2xl font-semibold">{totalReviews}</p>
            </div>
          </div>
          <div className="card bg-base-200 shadow-sm">
            <div className="card-body">
              <p className="text-sm text-gray-500">Approved</p>
              <p className="text-2xl font-semibold text-green-600">
                {approvedCount}
              </p>
            </div>
          </div>
          <div className="card bg-base-200 shadow-sm">
            <div className="card-body">
              <p className="text-sm text-gray-500">Pending</p>
              <p className="text-2xl font-semibold text-amber-500">
                {pendingCount}
              </p>
            </div>
          </div>
        </div>

        <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="w-full md:w-1/3">
            <label className="input input-bordered flex items-center gap-2">
              <input
                type="text"
                className="grow"
                placeholder="Search by user, branch, or comment"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </label>
          </div>
          {notification && (
            <div
              className={`alert ${
                notification.type === "success"
                  ? "alert-success"
                  : "alert-error"
              } shadow-sm`}
            >
              <span>{notification.message}</span>
            </div>
          )}
        </div>

        {fetchError && (
          <div className="alert alert-error mb-4">
            <span>{fetchError}</span>
          </div>
        )}

        <div className="card bg-base-200 shadow-sm">
          <div className="card-body p-0">
            {loading ? (
              <div className="flex justify-center items-center h-48">
                <span className="loading loading-spinner loading-lg"></span>
              </div>
            ) : filteredReviews.length === 0 ? (
              <div className="p-10 text-center text-gray-500">
                No reviews found for the selected filters.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr className="bg-base-300 text-base-content">
                      <th>User</th>
                      <th>Branch</th>
                      <th>Rating</th>
                      <th>Comment</th>
                      <th>Status</th>
                      <th>Created</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReviews.map((review) => (
                      <tr key={review.id} className="hover">
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="avatar">
                              <div className="mask mask-squircle w-12 h-12">
                                <Image
                                  src={
                                    review.user?.pictureUrl ||
                                    "https://i.pravatar.cc/100"
                                  }
                                  alt={review.user?.displayName || "User"}
                                  width={48}
                                  height={48}
                                  className="object-cover"
                                  unoptimized
                                />
                              </div>
                            </div>
                            <div>
                              <div className="font-semibold">
                                {review.user?.displayName || "Unknown User"}
                              </div>
                              <div className="text-sm text-gray-500">
                                #{review.userId}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="font-medium">
                            {review.branch?.name || "Unknown Branch"}
                          </div>
                          <div className="text-sm text-gray-500">
                            #{review.branchId}
                          </div>
                        </td>
                        <td>
                          <div className="font-semibold text-gray-700">
                            {review.rating.toFixed(1)} / 5
                          </div>
                        </td>
                        <td className="max-w-sm">
                          <div className="text-sm text-gray-600 whitespace-pre-line">
                            {review.comment?.trim() || "-"}
                          </div>
                        </td>
                        <td>
                          <span
                            className={`badge ${
                              review.isApproved
                                ? "badge-success"
                                : "badge-warning"
                            } gap-2`}
                          >
                            {review.isApproved ? (
                              <CheckCircleIcon className="w-4 h-4" />
                            ) : (
                              <ClockIcon className="w-4 h-4" />
                            )}
                            {review.isApproved ? "Approved" : "Pending"}
                          </span>
                        </td>
                        <td>
                          <div className="text-sm font-medium text-gray-700">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(review.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </td>
                        <td>
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              onClick={() => handleApprovalToggle(review)}
                              disabled={actionLoadingId === review.id}
                            >
                              {actionLoadingId === review.id ? (
                                <ArrowPathIcon className="w-4 h-4 animate-spin" />
                              ) : review.isApproved ? (
                                <>
                                  <ClockIcon className="w-4 h-4" />
                                  <span>Mark Pending</span>
                                </>
                              ) : (
                                <>
                                  <CheckCircleIcon className="w-4 h-4" />
                                  <span>Approve</span>
                                </>
                              )}
                            </button>
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm text-error"
                              onClick={() => setConfirmDeleteId(review.id)}
                              disabled={actionLoadingId === review.id}
                            >
                              {actionLoadingId === review.id ? (
                                <ArrowPathIcon className="w-4 h-4 animate-spin" />
                              ) : (
                                <>
                                  <TrashIcon className="w-4 h-4" />
                                  <span>Delete</span>
                                </>
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {confirmDeleteId && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-base-100 rounded-lg shadow-lg w-full max-w-md p-6">
              <h2 className="text-lg font-semibold mb-2">Delete review?</h2>
              <p className="text-sm text-gray-600 mb-6">
                This action cannot be undone. The review will be permanently removed
                from the system.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setConfirmDeleteId(null)}
                  disabled={actionLoadingId === confirmDeleteId}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-error"
                  onClick={() => handleDeleteReview(confirmDeleteId)}
                  disabled={actionLoadingId === confirmDeleteId}
                >
                  {actionLoadingId === confirmDeleteId ? (
                    <>
                      <ArrowPathIcon className="w-4 h-4 animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <span>Delete</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ReviewManagement;
