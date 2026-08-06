"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  XMarkIcon,
  CalendarIcon,
  ClockIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "@heroicons/react/24/outline";
import AdminNavbar from "@/components/AdminNavBar";
import { searchUser } from "@/hooks/useUser";
import { getAllBranch } from "@/hooks/useBranch";
import {
  getAllBooking,
  createBooking,
  updateBookingById,
  type UpdateBookingRequest,
} from "@/hooks/useBooking";
import { getAllPackages } from "@/hooks/usePackage";
import { getAllVouchers } from "@/hooks/useVoucher";
import IUser from "@/interfaces/IUser";
import IBranch from "@/interfaces/IBranch";
import IBooking from "@/interfaces/IBooking";
import IPackage from "@/interfaces/IPackage";
import IVoucher from "@/interfaces/IVoucher";
import type IErrorResponse from "@/interfaces/IErrorResponse";

const isErrorResponse = (value: unknown): value is IErrorResponse =>
  typeof value === "object" &&
  value !== null &&
  "status" in value &&
  "message" in value;

const isBooking = (value: unknown): value is IBooking =>
  typeof value === "object" && value !== null && "id" in value;

const BOOKING_STATUSES: ReadonlyArray<IBooking["status"]> = [
  "pending",
  "confirmed",
  "cancelled",
  "completed",
];

const isBookingStatus = (value: string): value is IBooking["status"] =>
  BOOKING_STATUSES.includes(value as IBooking["status"]);

const AddBooking = () => {
  const router = useRouter();

  const [users, setUsers] = useState<IUser[]>([]);
  const [displayNameQuery, setDisplayNameQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<IUser | null>(null);

  const [branches, setBranches] = useState<IBranch[]>([]);
  const [filteredBranches, setFilteredBranches] = useState<IBranch[]>([]);
  const [branchFilter, setBranchFilter] = useState("");
  const [selectedBranch, setSelectedBranch] = useState<IBranch | null>(null);

  const [packages, setPackages] = useState<IPackage[]>([]);
  const [filteredPackages, setFilteredPackages] = useState<IPackage[]>([]);
  const [packageFilter, setPackageFilter] = useState("");
  const [selectedPackage, setSelectedPackage] = useState<IPackage | null>(null);

  const [vouchers, setVouchers] = useState<IVoucher[]>([]);
  const [filteredVouchers, setFilteredVouchers] = useState<IVoucher[]>([]);
  const [voucherFilter, setVoucherFilter] = useState("");
  const [selectedVoucher, setSelectedVoucher] = useState<IVoucher | null>(null);

  // Modern date/time selection (separate fields like reference)
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [bookings, setBookings] = useState<IBooking[]>([]);
  const [statusFilter, setStatusFilter] = useState<"all" | IBooking["status"]>(
    "all"
  );

  // State for expanding/collapsing the bookings table
  const [showAllBookings, setShowAllBookings] = useState(false);
  const [isLoadingMoreBookings, setIsLoadingMoreBookings] = useState(false);
  // Track which booking row is being updated to disable buttons and avoid double clicks
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchBookings = useCallback(
    async (page: number = 1, signal?: AbortSignal) => {
      try {
        const bookingData = await getAllBooking(
          page,
          signal || new AbortController().signal
        );

        if (Array.isArray(bookingData)) {
          if (page === 1) {
            setBookings(bookingData);
          } else {
            // Append new bookings for pagination
            setBookings((prev) => [...prev, ...bookingData]);
          }
        } else {
          console.error("Failed to fetch bookings:", bookingData);
        }
      } catch (error: unknown) {
        // Only log non-abort errors
        if (error instanceof Error && error.name !== "AbortError") {
          console.error("Error fetching bookings:", error);
        }
      }
    },
    []
  );

  // Function to handle "View All" navigation
  const handleViewAllBookings = useCallback(() => {
    router.push("/bookingCalendar");
  }, [router]);

  // Function to toggle showing more bookings
  const handleToggleShowAll = useCallback(async () => {
    if (!showAllBookings) {
      setIsLoadingMoreBookings(true);
      // Load more bookings (page 2, 3, etc.)
      await fetchBookings(2);
      setIsLoadingMoreBookings(false);
    }
    setShowAllBookings(!showAllBookings);
  }, [showAllBookings, fetchBookings]);

  const handleStatusFilterChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      const value = event.target.value;
      if (value === "all") {
        setStatusFilter("all");
      } else if (isBookingStatus(value)) {
        setStatusFilter(value);
      }
    },
    []
  );

  useEffect(() => {
    // Create separate abort controllers for each operation
    const branchController = new AbortController();
    const packageController = new AbortController();
    const voucherController = new AbortController();
    const bookingController = new AbortController();

    const fetchBranches = async () => {
      try {
        const branchData = await getAllBranch(branchController.signal);

        if (Array.isArray(branchData)) {
          setBranches(branchData);
          setFilteredBranches(branchData);
        } else {
          console.error("Failed to fetch branches:", branchData);
        }
      } catch (error: unknown) {
        // Only log non-abort errors
        if (error instanceof Error && error.name !== "AbortError") {
          console.error("Error fetching branches:", error);
        }
      }
    };

    const fetchPackages = async () => {
      try {
        const packageData = await getAllPackages(packageController.signal);

        if (Array.isArray(packageData)) {
          setPackages(packageData);
          setFilteredPackages(packageData);
        } else {
          console.error("Failed to fetch packages:", packageData);
        }
      } catch (error: unknown) {
        // Only log non-abort errors
        if (error instanceof Error && error.name !== "AbortError") {
          console.error("Error fetching packages:", error);
        }
      }
    };

    const fetchVouchers = async () => {
      try {
        const voucherData = await getAllVouchers(voucherController.signal);

        if (Array.isArray(voucherData)) {
          setVouchers(voucherData);
          setFilteredVouchers(voucherData);
        } else {
          console.error("Failed to fetch vouchers:", voucherData);
        }
      } catch (error: unknown) {
        // Only log non-abort errors
        if (error instanceof Error && error.name !== "AbortError") {
          console.error("Error fetching vouchers:", error);
        }
      }
    };

    fetchBranches();
    fetchBookings(1, bookingController.signal);
    fetchPackages();
    fetchVouchers();

    return () => {
      branchController.abort();
      packageController.abort();
      voucherController.abort();
      bookingController.abort();
    };
  }, [fetchBookings]);

  const handleSearchUser = useCallback(async (query: string) => {
    setDisplayNameQuery(query);

    if (query.trim() === "") {
      setUsers([]);
      return;
    }

    const abortController = new AbortController();
    try {
      const results = await searchUser(query, abortController.signal);

      if (Array.isArray(results)) {
        setUsers(results);
      } else {
        setUsers([]);
      }
    } catch (error: unknown) {
      // Only log non-abort errors
      if (error instanceof Error && error.name !== "AbortError") {
        console.error("Error searching users:", error);
      }
      setUsers([]);
    }
  }, []);

  const handleFilterBranch = useCallback(
    (query: string) => {
      setBranchFilter(query);
      const filteredBranches = branches.filter((branch) =>
        branch.name.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredBranches(filteredBranches);
    },
    [branches]
  );

  const handleFilterPackage = useCallback(
    (query: string) => {
      setPackageFilter(query);
      const filteredPackages = packages.filter((pkg) =>
        pkg.title.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredPackages(filteredPackages);
    },
    [packages]
  );

  const handleFilterVoucher = useCallback(
    (query: string) => {
      setVoucherFilter(query);
      const filteredVouchers = vouchers.filter((voucher) =>
        voucher.code.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredVouchers(filteredVouchers);
    },
    [vouchers]
  );

  const handleAddBooking = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (
        !selectedUser ||
        !selectedBranch ||
        !selectedPackage ||
        !date ||
        !time
      ) {
        alert("Please fill in all fields correctly.");
        return;
      }

      try {
        // Combine date and time into a Date object
        const dateTime = new Date(`${date}T${time}:00`);

        const response = await createBooking(
          selectedBranch.id,
          selectedPackage.id,
          dateTime,
          selectedUser.id,
          selectedVoucher ? selectedVoucher.id : null,
          new AbortController().signal
        );

        if (response instanceof Error) {
          alert(`Failed to create booking: ${response.message}`);
          return;
        }

        // Reset form fields after successful booking
        setSelectedUser(null);
        setSelectedBranch(null);
        setSelectedPackage(null);
        setSelectedVoucher(null);
        setDate("");
        setTime("");

        // Refetch bookings to update the list
        fetchBookings();
        alert("Booking created successfully!");
      } catch (error) {
        console.error("Error creating booking:", error);
        alert("Failed to create booking. Please try again.");
        return;
      }
    },
    [
      selectedUser,
      selectedBranch,
      selectedPackage,
      date,
      time,
      selectedVoucher,
      fetchBookings,
    ]
  );

  // Row action handlers
  const handleUpdateStatus = useCallback(
    async (booking: IBooking, status: IBooking["status"]) => {
      try {
        const payload: UpdateBookingRequest = {
          status,
          date: booking.date,
          branchId: booking.branch.id,
          packageId: booking.package.id,
          userId: booking.user.id,
          voucherId: booking.voucher?.id ?? null,
        };

        const resp = await updateBookingById(
          booking.id,
          payload,
          new AbortController().signal
        );

        if (isErrorResponse(resp) && resp.status !== "success") {
          alert(`Failed to update booking: ${resp.message}`);
          return;
        }

        if (!isBooking(resp)) {
          const errMsg = isErrorResponse(resp) ? resp.message : "Unknown error";
          alert(`Failed to update booking: ${errMsg}`);
          return;
        }

        const updated = resp;
        setBookings((prev) =>
          prev.map((b) => (b.id === updated.id ? updated : b))
        );
        // Refetch first page to ensure full consistency with server
        await fetchBookings(1);
      } catch (e) {
        console.error("Failed to update booking status", e);
        alert("Failed to update booking status.");
      }
    },
    [fetchBookings]
  );

  const visibleBookings = bookings.filter((b) =>
    statusFilter === "all" ? true : b.status === statusFilter
  );

  return (
    <>
      <AdminNavbar />
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6 space-y-6">
        {/* Simple Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Manual Booking</h1>
            <p className="text-gray-600 mt-1">
              Create and manage customer bookings
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:space-x-4">
            <div className="bg-white px-4 py-2 rounded-lg shadow-sm border w-full sm:w-auto">
              <span className="text-sm text-gray-500">Total Bookings</span>
              <p className="text-xl font-semibold text-blue-600">
                {bookings.length}
              </p>
            </div>
            <button
              onClick={handleViewAllBookings}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors w-full sm:w-auto"
            >
              View Calendar
            </button>
          </div>
        </div>

        {/* Simple Booking Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Create New Booking
            </h2>
            <p className="text-gray-600 mt-1">
              Fill in the details below to create a manual booking
            </p>
          </div>

          <div className="p-6">
            <form className="space-y-6" onSubmit={handleAddBooking}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Customer Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Customer *
                  </label>
                  {selectedUser ? (
                    <div className="bg-gray-50 border border-gray-300 rounded-lg p-3 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Image
                          src={selectedUser.pictureUrl}
                          alt={selectedUser.displayName || "User Avatar"}
                          width={40}
                          height={40}
                          className="w-10 h-10 rounded-full object-cover"
                          unoptimized
                        />
                        <div>
                          <p className="font-medium text-gray-900">
                            {selectedUser.displayName}
                          </p>
                          <p className="text-sm text-gray-500">
                            Selected Customer
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedUser(null)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <XMarkIcon className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <div className="relative">
                      <input
                        type="text"
                        value={displayNameQuery}
                        onChange={(e) => handleSearchUser(e.target.value)}
                        placeholder="Search customer by name..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      {users.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {users.map((user) => (
                            <div
                              key={user.id}
                              onClick={() => setSelectedUser(user)}
                              className="flex items-center space-x-3 p-3 hover:bg-gray-50 cursor-pointer"
                            >
                              <Image
                                src={user.pictureUrl}
                                alt={user.displayName || "User Avatar"}
                                width={32}
                                height={32}
                                className="w-8 h-8 rounded-full object-cover"
                                unoptimized
                              />
                              <p className="font-medium text-gray-900">
                                {user.displayName}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Service Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Service *
                  </label>
                  {selectedPackage ? (
                    <div className="bg-gray-50 border border-gray-300 rounded-lg p-3 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">
                          {selectedPackage.title}
                        </p>
                        <p className="text-lg font-semibold text-green-600">
                          ฿{selectedPackage.price.toLocaleString()}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedPackage(null)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <XMarkIcon className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <div className="relative">
                      <input
                        type="text"
                        value={packageFilter}
                        onChange={(e) => handleFilterPackage(e.target.value)}
                        placeholder="Search services..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      {filteredPackages.length > 0 && packageFilter && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {filteredPackages.map((_package) => (
                            <div
                              key={_package.id}
                              onClick={() => setSelectedPackage(_package)}
                              className="flex items-center justify-between p-3 hover:bg-gray-50 cursor-pointer"
                            >
                              <div>
                                <p className="font-medium text-gray-900">
                                  {_package.title}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {_package.description}
                                </p>
                              </div>
                              <span className="font-semibold text-green-600">
                                ฿{_package.price.toLocaleString()}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Branch Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Branch *
                  </label>
                  {selectedBranch ? (
                    <div className="bg-gray-50 border border-gray-300 rounded-lg p-3 flex items-center justify-between">
                      <p className="font-medium text-gray-900">
                        {selectedBranch.name}
                      </p>
                      <button
                        type="button"
                        onClick={() => setSelectedBranch(null)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <XMarkIcon className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <div className="relative">
                      <input
                        type="text"
                        value={branchFilter}
                        onChange={(e) => handleFilterBranch(e.target.value)}
                        placeholder="Search branches..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      {filteredBranches.length > 0 && branchFilter && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {filteredBranches.map((branch) => (
                            <div
                              key={branch.id}
                              onClick={() => setSelectedBranch(branch)}
                              className="p-3 hover:bg-gray-50 cursor-pointer"
                            >
                              <p className="font-medium text-gray-900">
                                {branch.name}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Voucher Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Apply Voucher (Optional)
                  </label>
                  {selectedVoucher ? (
                    <div className="bg-gray-50 border border-gray-300 rounded-lg p-3 flex items-center justify-between">
                      <p className="font-medium text-gray-900">
                        {selectedVoucher.code}
                      </p>
                      <button
                        type="button"
                        onClick={() => setSelectedVoucher(null)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <XMarkIcon className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <div className="relative">
                      <input
                        type="text"
                        value={voucherFilter}
                        onChange={(e) => handleFilterVoucher(e.target.value)}
                        placeholder="Search vouchers or leave empty..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      {filteredVouchers.length > 0 && voucherFilter && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {filteredVouchers.map((_voucher) => (
                            <div
                              key={_voucher.id}
                              onClick={() => setSelectedVoucher(_voucher)}
                              className="p-3 hover:bg-gray-50 cursor-pointer"
                            >
                              <p className="font-medium text-gray-900">
                                {_voucher.code}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Date and Time Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <CalendarIcon className="w-4 h-4 inline mr-1" />
                    Select Date *
                  </label>
                  <select
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  >
                    <option value="">Choose Date</option>
                    {Array.from({ length: 30 }, (_, i) => {
                      const d = new Date();
                      d.setDate(d.getDate() + i);
                      const dateStr = d.toISOString().split("T")[0];
                      const label = d.toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      });
                      return (
                        <option key={dateStr} value={dateStr}>
                          {label}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <ClockIcon className="w-4 h-4 inline mr-1" />
                    Select Time *
                  </label>
                  <select
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  >
                    <option value="">Choose Time</option>
                    {Array.from({ length: 24 }, (_, h) =>
                      Array.from({ length: 2 }, (_, half) => {
                        if (h < 8 || h > 21) return null;
                        const hour = h.toString().padStart(2, "0");
                        const minute = (half * 30).toString().padStart(2, "0");
                        const val = `${hour}:${minute}`;
                        const display = new Date(
                          `2000-01-01T${val}`
                        ).toLocaleTimeString("en-US", {
                          hour: "numeric",
                          minute: "2-digit",
                          hour12: true,
                        });
                        return (
                          <option key={val} value={val}>
                            {display}
                          </option>
                        );
                      })
                    )
                      .flat()
                      .filter(Boolean)}
                  </select>
                </div>
              </div>

              {/* Simple Summary */}
              {(selectedUser ||
                selectedPackage ||
                selectedBranch ||
                date ||
                time) && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-3">
                    Booking Summary
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p>
                        <strong>Customer:</strong>{" "}
                        {selectedUser?.displayName || "Not selected"}
                      </p>
                      <p>
                        <strong>Service:</strong>{" "}
                        {selectedPackage?.title || "Not selected"}
                      </p>
                      <p>
                        <strong>Branch:</strong>{" "}
                        {selectedBranch?.name || "Not selected"}
                      </p>
                    </div>
                    <div>
                      <p>
                        <strong>Date:</strong>{" "}
                        {date
                          ? new Date(date).toLocaleDateString()
                          : "Not selected"}
                      </p>
                      <p>
                        <strong>Time:</strong> {time || "Not selected"}
                      </p>
                      <p className="text-lg font-semibold text-green-600">
                        <strong>
                          Total: ฿
                          {selectedPackage?.price.toLocaleString() || "0"}
                        </strong>
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedUser(null);
                    setSelectedBranch(null);
                    setSelectedPackage(null);
                    setSelectedVoucher(null);
                    setDate("");
                    setTime("");
                  }}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors w-full sm:w-auto"
                >
                  Clear All
                </button>
                <button
                  type="submit"
                  disabled={
                    !selectedUser ||
                    !selectedBranch ||
                    !selectedPackage ||
                    !date ||
                    !time
                  }
                  className="px-6 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors w-full sm:w-auto"
                >
                  Create Booking
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Simple Recent Bookings Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Recent Bookings
                </h2>
                <p className="text-gray-600 mt-1">
                  View and manage your latest customer bookings
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:space-x-3">
                <span className="text-sm text-gray-500">
                  {visibleBookings.length} total
                </span>
                <button
                  onClick={handleToggleShowAll}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors flex items-center space-x-1 w-full sm:w-auto justify-center"
                  disabled={isLoadingMoreBookings}
                >
                  {isLoadingMoreBookings ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                      <span>Loading...</span>
                    </>
                  ) : (
                    <>
                      <span>{showAllBookings ? "Show Less" : "Show More"}</span>
                      {showAllBookings ? (
                        <ChevronUpIcon className="w-4 h-4" />
                      ) : (
                        <ChevronDownIcon className="w-4 h-4" />
                      )}
                    </>
                  )}
                </button>
                <select
                  value={statusFilter}
                  onChange={handleStatusFilterChange}
                  className="border border-gray-300 rounded-md text-sm px-2 py-1 bg-white w-full sm:w-auto"
                  title="Filter by status"
                >
                  <option value="all">All statuses</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="completed">Completed</option>
                </select>
                <button
                  onClick={handleViewAllBookings}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm w-full sm:w-auto"
                >
                  View Calendar →
                </button>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            {visibleBookings.length > 0 ? (
              <>
                {/* Mobile list */}
                <div className="md:hidden space-y-3 p-4">
                  {(showAllBookings
                    ? visibleBookings
                    : visibleBookings.slice(0, 5)
                  ).map((booking) => (
                    <div
                      key={booking.id}
                      className="border border-gray-200 rounded-lg bg-white p-4 shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <Image
                          src={booking.user.pictureUrl}
                          alt={booking.user.displayName || "User Avatar"}
                          width={40}
                          height={40}
                          className="w-10 h-10 rounded-full object-cover"
                          unoptimized
                        />
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            {booking.user.displayName}
                          </p>
                          <p className="text-sm text-gray-500">
                            {booking.package.title}
                          </p>
                        </div>
                        <div>
                          {booking.status === "pending" && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              Pending
                            </span>
                          )}
                          {booking.status === "confirmed" && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Confirmed
                            </span>
                          )}
                          {booking.status === "cancelled" && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Cancelled
                            </span>
                          )}
                          {booking.status === "completed" && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Completed
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-gray-500">Date</p>
                          <p className="font-medium text-gray-900">
                            {new Date(booking.date).toLocaleDateString(
                              "en-US",
                              { month: "short", day: "numeric" }
                            )}
                            ,{" "}
                            {new Date(booking.date).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: true,
                            })}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Branch</p>
                          <p className="font-medium text-gray-900">
                            {booking.branch.name}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Voucher</p>
                          <p className="font-medium text-gray-900">
                            {booking.voucher ? booking.voucher.code : "None"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-gray-500">Total</p>
                          <p className="font-semibold text-gray-900">
                            ฿{booking.totalPrice.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {booking.status === "pending" && (
                          <>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (updatingId) return;
                                setUpdatingId(booking.id);
                                Promise.resolve(
                                  handleUpdateStatus(booking, "confirmed")
                                ).finally(() => setUpdatingId(null));
                              }}
                              disabled={updatingId === booking.id}
                              className="px-3 py-1.5 text-sm rounded-md bg-blue-50 text-blue-700 disabled:opacity-50"
                            >
                              Confirm
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (updatingId) return;
                                setUpdatingId(booking.id);
                                Promise.resolve(
                                  handleUpdateStatus(booking, "cancelled")
                                ).finally(() => setUpdatingId(null));
                              }}
                              disabled={updatingId === booking.id}
                              className="px-3 py-1.5 text-sm rounded-md bg-red-50 text-red-700 disabled:opacity-50"
                            >
                              Cancel
                            </button>
                          </>
                        )}
                        {booking.status === "confirmed" && (
                          <>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (updatingId) return;
                                setUpdatingId(booking.id);
                                Promise.resolve(
                                  handleUpdateStatus(booking, "completed")
                                ).finally(() => setUpdatingId(null));
                              }}
                              disabled={updatingId === booking.id}
                              className="px-3 py-1.5 text-sm rounded-md bg-green-50 text-green-700 disabled:opacity-50"
                            >
                              Complete
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (updatingId) return;
                                setUpdatingId(booking.id);
                                Promise.resolve(
                                  handleUpdateStatus(booking, "cancelled")
                                ).finally(() => setUpdatingId(null));
                              }}
                              disabled={updatingId === booking.id}
                              className="px-3 py-1.5 text-sm rounded-md bg-red-50 text-red-700 disabled:opacity-50"
                            >
                              Cancel
                            </button>
                          </>
                        )}
                        {booking.status === "completed" && (
                          <span className="text-gray-400 text-sm">
                            No actions
                          </span>
                        )}
                        {booking.status === "cancelled" && (
                          <span className="text-gray-400 text-sm">
                            Cancelled
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop table */}
                <div className="hidden md:block">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                          Customer
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                          Service
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                          Status
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                          Date & Time
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                          Branch
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                          Voucher
                        </th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">
                          Total
                        </th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {(showAllBookings
                        ? visibleBookings
                        : visibleBookings.slice(0, 5)
                      ).map((booking) => (
                        <tr
                          key={booking.id}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="py-4 px-4">
                            <div className="flex items-center space-x-3">
                              <Image
                                src={booking.user.pictureUrl}
                                alt={booking.user.displayName || "User Avatar"}
                                width={32}
                                height={32}
                                className="w-8 h-8 rounded-full object-cover"
                                unoptimized
                              />
                              <p className="font-medium text-gray-900">
                                {booking.user.displayName}
                              </p>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <p className="font-medium text-gray-900">
                              {booking.package.title}
                            </p>
                          </td>
                          <td className="py-4 px-4">
                            {booking.status === "pending" && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                Pending
                              </span>
                            )}
                            {booking.status === "confirmed" && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                Confirmed
                              </span>
                            )}
                            {booking.status === "cancelled" && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                Cancelled
                              </span>
                            )}
                            {booking.status === "completed" && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Completed
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-4">
                            <div className="space-y-1">
                              <p className="font-medium text-gray-900">
                                {new Date(booking.date).toLocaleDateString(
                                  "en-US",
                                  {
                                    month: "short",
                                    day: "numeric",
                                    year: "2-digit",
                                  }
                                )}
                              </p>
                              <p className="text-sm text-gray-500">
                                {new Date(booking.date).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  hour12: true,
                                })}
                              </p>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <p className="font-medium text-gray-900">
                              {booking.branch.name}
                            </p>
                          </td>
                          <td className="py-4 px-4">
                            {booking.voucher ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                {booking.voucher.code}
                              </span>
                            ) : (
                              <span className="text-sm text-gray-400">
                                None
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-4 text-right">
                            <p className="font-semibold text-gray-900">
                              ฿{booking.totalPrice.toLocaleString()}
                            </p>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex justify-end gap-2">
                              {booking.status === "pending" && (
                                <>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      if (updatingId) return;
                                      setUpdatingId(booking.id);
                                      Promise.resolve(
                                        handleUpdateStatus(booking, "confirmed")
                                      ).finally(() => setUpdatingId(null));
                                    }}
                                    disabled={updatingId === booking.id}
                                    className="text-blue-600 hover:text-blue-800 text-sm"
                                    title="Confirm"
                                  >
                                    Confirm
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      if (updatingId) return;
                                      setUpdatingId(booking.id);
                                      Promise.resolve(
                                        handleUpdateStatus(booking, "cancelled")
                                      ).finally(() => setUpdatingId(null));
                                    }}
                                    disabled={updatingId === booking.id}
                                    className="text-red-600 hover:text-red-800 text-sm"
                                    title="Cancel"
                                  >
                                    Cancel
                                  </button>
                                </>
                              )}
                              {booking.status === "confirmed" && (
                                <>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      if (updatingId) return;
                                      setUpdatingId(booking.id);
                                      Promise.resolve(
                                        handleUpdateStatus(booking, "completed")
                                      ).finally(() => setUpdatingId(null));
                                    }}
                                    disabled={updatingId === booking.id}
                                    className="text-green-600 hover:text-green-800 text-sm"
                                    title="Mark as Completed"
                                  >
                                    Complete
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      if (updatingId) return;
                                      setUpdatingId(booking.id);
                                      Promise.resolve(
                                        handleUpdateStatus(booking, "cancelled")
                                      ).finally(() => setUpdatingId(null));
                                    }}
                                    disabled={updatingId === booking.id}
                                    className="text-red-600 hover:text-red-800 text-sm"
                                    title="Cancel"
                                  >
                                    Cancel
                                  </button>
                                </>
                              )}
                              {booking.status === "completed" && (
                                <span className="text-gray-400 text-sm">
                                  No actions
                                </span>
                              )}
                              {booking.status === "cancelled" && (
                                <span className="text-gray-400 text-sm">
                                  Cancelled
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📅</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No bookings yet
                </h3>
                <p className="text-gray-500 mb-4">
                  Start creating bookings to see them appear here
                </p>
              </div>
            )}
          </div>

          {/* Simple Footer */}
          {visibleBookings.length > 0 && (
            <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>
                  Showing{" "}
                  {showAllBookings
                    ? visibleBookings.length
                    : Math.min(5, visibleBookings.length)}{" "}
                  of {visibleBookings.length} bookings
                </span>
                <span>
                  Total Revenue: ฿
                  {visibleBookings
                    .reduce((sum, b) => sum + Number(b.totalPrice), 0)
                    .toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default AddBooking;
