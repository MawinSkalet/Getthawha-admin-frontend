"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  PhoneIcon,
  MapPinIcon,
  CalendarDaysIcon,
} from "@heroicons/react/24/outline";
import AdminNavbar from "@/components/AdminNavBar";
import { useParams } from "next/navigation";
import { getUserById } from "@/hooks/useUser";
import { getAllBooking } from "@/hooks/useBooking";
import type IUser from "@/interfaces/IUser";
import type IBooking from "@/interfaces/IBooking";

// Extend IUser for extra fields if needed
interface User extends IUser {
  email?: string;
  phone?: string;
  address?: string;
  registered?: string;
}

const UserData = () => {
  const params = useParams();
  const userId = params.id as string;

  // State management
  const [user, setUser] = useState<User | null>(null);
  const [bookings, setBookings] = useState<IBooking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<IBooking[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Fetch user data
  useEffect(() => {
    fetchUserData();
    fetchUserBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // Filter bookings based on search term
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredBookings(bookings);
    } else {
      const filtered = bookings.filter(
        (booking) =>
          booking.package.title
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          booking.branch.name
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          booking.date.includes(searchTerm)
      );
      setFilteredBookings(filtered);
    }
  }, [searchTerm, bookings]);

  // Fetch user data using useUser hook
  const fetchUserData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await getUserById(userId, new AbortController().signal);
      if ("message" in result) {
        setError(result.message || "Failed to load user data");
        setUser(null);
      } else {
        setUser(result as User);
      }
    } catch {
      setError("Failed to load user data");
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch user bookings using useBooking hook
  const fetchUserBookings = async () => {
    try {
      const result = await getAllBooking(1, new AbortController().signal);
      if ("message" in result) {
        console.error("Failed to load bookings:", result.message);
        setBookings([]);
      } else {
        // Filter bookings for this specific user
        const userBookings = (result as IBooking[]).filter(
          (booking) => booking.user.id === userId
        );
        setBookings(userBookings);
        setFilteredBookings(userBookings);
      }
    } catch (error) {
      console.error("Failed to load bookings:", error);
      setBookings([]);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleEditProfile = () => {
    setIsEditing(true);
  };

  const updateUserProfile = async (updatedData: Partial<User>) => {
    if (!user) return;
    // For now, just update local state since we don't have update hook
    setUser({ ...user, ...updatedData });
    setIsEditing(false);
  };

  const refreshBookings = () => {
    fetchUserBookings();
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
    active: bookings.length, // All bookings are considered active for now
    cancelled: 0, // No cancelled status in IBooking
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
            <button className="btn btn-sm btn-outline" onClick={fetchUserData}>
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
                <div className="avatar">
                  <div className="w-24 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                    <Image
                      src={user.pictureUrl || "https://i.pravatar.cc/100?img=15"}
                      alt="Profile"
                      width={96}
                      height={96}
                      className="w-24 h-24 object-cover"
                      unoptimized
                    />
                  </div>
                </div>
                <h2 className="card-title mt-4">{user.displayName}</h2>
                <p className="text-sm text-gray-500">{user.email}</p>
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
              <div className="card-body text-sm space-y-2">
                <div className="flex items-center gap-2">
                  <PhoneIcon className="w-5 h-5" />
                  <span>{user.phone || "N/A"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPinIcon className="w-5 h-5" />
                  <span>{user.address || "N/A"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CalendarDaysIcon className="w-5 h-5" />
                  <span>Registered: {user.registered || "N/A"}</span>
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
                  ฿
                  {bookings
                    .reduce(
                      (sum, booking) => sum + Number(booking.totalPrice),
                      0
                    )
                    .toLocaleString("en-US")}
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
                      <th>Duration (hrs)</th>
                      <th>Package</th>
                      <th>Branch</th>
                      <th>Total Price</th>
                      <th>Voucher</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBookings.length > 0 ? (
                      filteredBookings.map((booking) => (
                        <tr key={booking.id}>
                          <td>{new Date(booking.date).toLocaleDateString()}</td>
                          <td>{booking.duration}</td>
                          <td>{booking.package.title}</td>
                          <td>{booking.branch.name}</td>
                          <td>฿{booking.totalPrice.toLocaleString()}</td>
                          <td>{booking.voucher?.code || "None"}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={6}
                          className="text-center py-4 text-gray-500"
                        >
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
                  updateUserProfile(updatedData);
                }}
              >
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
                      defaultValue={user.email}
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
                      defaultValue={user.phone}
                      className="input input-bordered w-full"
                    />
                  </div>
                  <div>
                    <label className="label">
                      <span className="label-text">Address</span>
                    </label>
                    <textarea
                      name="address"
                      defaultValue={user.address}
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
                  <button type="submit" className="btn btn-primary">
                    Save Changes
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
