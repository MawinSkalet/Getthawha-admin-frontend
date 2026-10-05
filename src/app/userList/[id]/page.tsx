"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  PhoneIcon,
  MapPinIcon,
  CalendarDaysIcon,
  EnvelopeIcon,
} from "@heroicons/react/24/outline";
import AdminNavbar from "@/components/AdminNavBar";
import UserAvatar from "@/components/UserAvatar";
import { useParams } from "next/navigation";
import { getUserById, updateUserById } from "@/hooks/useUser";
import type IUser from "@/interfaces/IUser";
import type IBooking from "@/interfaces/IBooking";

type UserBooking = Omit<IBooking, "user">;

interface User extends IUser {
  bookings?: UserBooking[];
}

const UserData = () => {
  const params = useParams();
  const routeUserId = params.id as string;
  const userId = (() => {
    try {
      return decodeURIComponent(routeUserId);
    } catch {
      return routeUserId;
    }
  })();

  // State management
  const [user, setUser] = useState<User | null>(null);
  const [bookings, setBookings] = useState<UserBooking[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSaveError, setProfileSaveError] = useState<string | null>(null);

  const filteredBookings = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return bookings.filter(
      (booking) =>
        (booking.package?.title || "Package unavailable").toLowerCase().includes(query) ||
        (booking.branch?.name || "Branch unavailable").toLowerCase().includes(query) ||
        booking.date.includes(searchTerm)
    );
  }, [bookings, searchTerm]);

  // Fetch user data using useUser hook
  const fetchUserData = useCallback(async (isCurrentRequest: () => boolean = () => true) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getUserById(userId, new AbortController().signal);
      if (!isCurrentRequest()) return;
      if ("message" in result) {
        setError(result.message || "Failed to load user data");
        setUser(null);
      } else {
        const loadedUser = result as User;
        setUser(loadedUser);
        setBookings(Array.isArray(loadedUser.bookings) ? loadedUser.bookings : []);
        setError(null);
      }
    } catch {
      if (!isCurrentRequest()) return;
      setError("Failed to load user data");
      setUser(null);
    } finally {
      if (isCurrentRequest()) setIsLoading(false);
    }
  }, [userId]);

  // Fetch user data when the route id changes.
  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      void fetchUserData(() => active);
    });
    return () => {
      active = false;
    };
  }, [fetchUserData]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleEditProfile = () => {
    setProfileSaveError(null);
    setIsEditing(true);
  };

  const updateUserProfile = async (updatedData: Partial<User>) => {
    if (!user) return;
    setIsSavingProfile(true);
    setProfileSaveError(null);
    try {
      const result = await updateUserById(user.id, {
        displayName: updatedData.displayName ?? user.displayName,
        email: updatedData.email ?? user.email ?? "",
        phone: updatedData.phone ?? user.phone ?? "",
        address: updatedData.address ?? user.address ?? "",
      });
      if ("message" in result) {
        setProfileSaveError(result.message || "Failed to update user profile");
        return;
      }
      setUser((current) => current ? { ...current, ...result } : current);
      setIsEditing(false);
    } catch {
      setProfileSaveError("Could not save the profile. Check the connection and try again.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const refreshBookings = () => {
    fetchUserData();
  };

  // Calculate stats from bookings with relative date
  const getLastBookingDate = () => {
    if (bookings.length === 0) return "No bookings yet";

    const lastDate = new Date(bookings[0].date);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - lastDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const formattedDate = lastDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    if (diffDays === 1) return `${formattedDate} (Yesterday)`;
    if (diffDays <= 7) return `${formattedDate} (${diffDays} days ago)`;
    return formattedDate;
  };

  const userStats = {
    total: bookings.length,
    active: bookings.filter((booking) => booking.status === "pending" || booking.status === "confirmed").length,
    spent: bookings
      .filter((booking) => booking.status === "confirmed" || booking.status === "completed")
      .reduce((sum, booking) => sum + Number(booking.totalPrice || 0), 0),
    lastDate: getLastBookingDate(),
  };

  // Loading state
  if (isLoading) {
    return (
      <>
        <AdminNavbar />
        <div className="p-6 bg-base-100 min-h-screen">
          <div className="flex items-center justify-center h-64">
            <div className="loading loading-spinner loading-lg"></div>
          </div>
        </div>
      </>
    );
  }

  // Error state
  if (error && !user) {
    return (
      <>
        <AdminNavbar />
        <div className="p-6 bg-base-100 min-h-screen">
          <div className="alert alert-error">
            <span>{error}</span>
            <button className="btn btn-sm btn-outline" onClick={() => void fetchUserData()}>
              Retry
            </button>
          </div>
        </div>
      </>
    );
  }

  // No user found
  if (!user) {
    return (
      <>
        <AdminNavbar />
        <div className="p-6 bg-base-100 min-h-screen">
          <div className="alert alert-warning">
            <span>User not found</span>
          </div>
        </div>
      </>
    );
  }

  const latestBookingWithPhone = bookings.find((booking) => booking.customerPhone?.trim());
  const latestBookingWithEmail = bookings.find((booking) => booking.customerEmail?.trim());
  const latestBookingWithBranch = bookings.find((booking) => booking.branch?.name);
  const profilePhone = user.phone?.trim() || latestBookingWithPhone?.customerPhone?.trim();
  const profileEmail = user.email?.trim() || latestBookingWithEmail?.customerEmail?.trim();
  const registeredDate = user.createdAt && !Number.isNaN(Date.parse(user.createdAt))
    ? new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(user.createdAt))
    : "Date unavailable";

  return (
    <>
      <AdminNavbar />
      <div className="p-6 bg-base-100 min-h-screen">
        <h1 className="text-3xl font-bold mb-6">User Details</h1>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Profile */}
          <div className="col-span-1">
            <div className="card bg-base-200 shadow-md">
              <div className="card-body items-center text-center">
                <UserAvatar
                  name={user.displayName}
                  pictureUrl={user.pictureUrl}
                  size="2xl"
                  className="ring ring-primary ring-offset-2 ring-offset-base-100"
                />
                <h2 className="card-title mt-4">{user.displayName}</h2>
                {profileEmail && (
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-[#75685B]">
                    <EnvelopeIcon className="h-4 w-4 shrink-0" />
                    <span className="break-all">{profileEmail}</span>
                  </p>
                )}
                <div className="card-actions mt-4">
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={handleEditProfile}
                  >
                    Edit Profile
                  </button>
                </div>
              </div>
            </div>

            <div className="card bg-base-200 shadow-md mt-4">
              <div className="card-body text-sm space-y-4">
                <div className="flex items-start gap-3">
                  <PhoneIcon className="mt-0.5 h-5 w-5 shrink-0 text-[#8A6418]" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#8B7D70]">Phone</p>
                    <p className="break-words text-[#38281F]">{profilePhone || "Not provided"}</p>
                    {!user.phone && latestBookingWithPhone && (
                      <p className="mt-0.5 text-xs text-[#8B7D70]">From the latest booking</p>
                    )}
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPinIcon className="mt-0.5 h-5 w-5 shrink-0 text-[#8A6418]" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#8B7D70]">Customer address</p>
                    <p className="break-words text-[#38281F]">{user.address || "Not provided"}</p>
                  </div>
                </div>
                {latestBookingWithBranch?.branch && (
                  <div className="flex items-start gap-3">
                    <MapPinIcon className="mt-0.5 h-5 w-5 shrink-0 text-[#8A6418]" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#8B7D70]">Last booked branch</p>
                      <p className="break-words text-[#38281F]">{latestBookingWithBranch.branch.name}</p>
                      {latestBookingWithBranch.branch.address && (
                        <p className="mt-0.5 break-words text-xs text-[#75685B]">{latestBookingWithBranch.branch.address}</p>
                      )}
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <CalendarDaysIcon className="mt-0.5 h-5 w-5 shrink-0 text-[#8A6418]" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#8B7D70]">Registered</p>
                    <p className="text-[#38281F]">{registeredDate}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="col-span-3 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="stat bg-base-200 rounded-box">
                <div className="stat-title">Total Bookings</div>
                <div className="stat-value">{userStats.total}</div>
              </div>
              <div className="stat bg-base-200 rounded-box">
                <div className="stat-title">Active Bookings</div>
                <div className="stat-value">{userStats.active}</div>
              </div>
              <div className="stat bg-base-200 rounded-box">
                <div className="stat-title">Total Spent</div>
                <div className="stat-value text-sm">
                  ฿{userStats.spent.toLocaleString("en-US")}
                </div>
              </div>
              <div className="stat bg-base-200 rounded-box">
                <div className="stat-title">Last Booking Date</div>
                <div className="stat-value text-sm">{userStats.lastDate}</div>
              </div>
            </div>

            {/* Booking History */}
            <div className="bg-base-200 rounded-box p-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Booking History</h2>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Search bookings..."
                    className="input input-sm input-bordered"
                    value={searchTerm}
                    onChange={handleSearchChange}
                  />
                  <button
                    className="btn btn-sm btn-outline"
                    onClick={refreshBookings}
                    title="Refresh bookings"
                  >
                    ↻
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Customer</th>
                      <th>Duration</th>
                      <th>Package</th>
                      <th>Branch</th>
                      <th>Status</th>
                      <th>Total Price</th>
                      <th>Voucher</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBookings.length > 0 ? (
                      filteredBookings.map((booking) => {
                        const duration = booking.package?.duration ?? booking.duration;
                        return (
                          <tr key={booking.id}>
                            <td>{new Date(booking.date).toLocaleDateString()}</td>
                            <td>
                              <div>{booking.customerName || user.displayName}</div>
                              {booking.customerPhone && (
                                <div className="text-xs text-base-content/60">{booking.customerPhone}</div>
                              )}
                              {booking.customerEmail && (
                                <div className="text-xs text-base-content/60">{booking.customerEmail}</div>
                              )}
                            </td>
                            <td>{duration ? `${duration} min` : "—"}</td>
                            <td>{booking.package?.title || "Package unavailable"}</td>
                            <td>{booking.branch?.name || "Branch unavailable"}</td>
                            <td>
                              <span className={`badge ${
                                booking.status === "confirmed" || booking.status === "completed"
                                  ? "badge-success"
                                  : booking.status === "cancelled"
                                    ? "badge-error"
                                    : "badge-warning"
                              }`}>
                                {booking.status}
                              </span>
                            </td>
                            <td>฿{Number(booking.totalPrice || 0).toLocaleString("en-US")}</td>
                            <td>{booking.voucher?.code || "None"}</td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={8} className="text-center py-4 text-gray-500">
                          {searchTerm
                            ? `No bookings found matching "${searchTerm}"`
                            : "No bookings found"}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Profile Modal */}
        {isEditing && (
          <div className="modal modal-open">
            <div className="modal-box">
              <h3 className="font-bold text-lg mb-4">Edit Profile</h3>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const updatedData = {
                    displayName: formData.get("displayName") as string,
                    email: formData.get("email") as string,
                    phone: formData.get("phone") as string,
                    address: formData.get("address") as string,
                  };
                  void updateUserProfile(updatedData);
                }}
              >
                {profileSaveError && (
                  <div className="alert alert-error mb-4" role="alert">{profileSaveError}</div>
                )}
                <div className="space-y-4">
                  <div>
                    <label className="label">
                      <span className="label-text">Display Name</span>
                    </label>
                    <input
                      type="text"
                      name="displayName"
                      defaultValue={user.displayName}
                      className="input input-bordered w-full"
                      required
                    />
                  </div>
                  <div>
                    <label className="label">
                      <span className="label-text">Email</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      defaultValue={profileEmail}
                      className="input input-bordered w-full"
                    />
                  </div>
                  <div>
                    <label className="label">
                      <span className="label-text">Phone</span>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      defaultValue={profilePhone}
                      className="input input-bordered w-full"
                    />
                  </div>
                  <div>
                    <label className="label">
                      <span className="label-text">Customer address</span>
                    </label>
                    <textarea
                      name="address"
                      defaultValue={user.address ?? ""}
                      className="textarea textarea-bordered w-full"
                      rows={3}
                    />
                  </div>
                </div>
                <div className="modal-action">
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={isSavingProfile}>
                    {isSavingProfile ? <span className="loading loading-spinner loading-sm" /> : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default UserData;
