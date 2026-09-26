"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  UserIcon,
  PlusIcon,
  TrashIcon,
  XMarkIcon,
  EnvelopeIcon,
  UserCircleIcon,
  EyeIcon,
  EyeSlashIcon,
} from "@heroicons/react/24/outline";
import AdminNavbar from "@/components/AdminNavBar";
import { getAllStaff, createStaff, deleteStaff } from "@/hooks/useStaff";
import IStaff from "@/interfaces/IStaff";
import IStaffInput from "@/interfaces/IStaffInput";

interface StaffFormData extends IStaffInput {
  id?: string;
  confirmPassword?: string;
}

const StaffManagement = () => {
  // State management
  const [staff, setStaff] = useState<IStaff[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState<StaffFormData>({
    userName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Partial<StaffFormData>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Add notification state
  const [notification, setNotification] = useState<{
    open: boolean;
    type: "success" | "error";
    message: string;
  }>({ open: false, type: "success", message: "" });

  // Add confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ open: false, title: "", message: "", onConfirm: () => {} });

  const formRef = useRef<HTMLFormElement>(null);

  // Fetch staff on component mount
  useEffect(() => {
    fetchStaff();
  }, []);

  // API functions
  const fetchStaff = async () => {
    setIsLoading(true);
    try {
      const abortController = new AbortController();
      const response = await getAllStaff(abortController.signal);

      if (Array.isArray(response)) {
        setStaff(response);
      } else {
        console.error("Failed to fetch staff:", response);
        setNotification({
          open: true,
          type: "error",
          message: response.message || "Failed to fetch staff",
        });
      }
    } catch (error) {
      console.error("Error fetching staff:", error);
      setNotification({
        open: true,
        type: "error",
        message: "Failed to fetch staff",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Form handlers
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name as keyof StaffFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  // Form validation
  const validateForm = (): boolean => {
    const newErrors: Partial<StaffFormData> = {};

    if (!formData.userName.trim()) {
      newErrors.userName = "Username is required";
    } else if (formData.userName.length < 3) {
      newErrors.userName = "Username must be at least 3 characters";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    if (!formData.password.trim()) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Open form for creating new staff
  const handleCreateStaff = () => {
    setFormData({
      userName: "",
      email: "",
      password: "",
      confirmPassword: "",
    });
    setErrors({});
    setFormError(null);
    setShowPassword(false);
    setShowConfirmPassword(false);
    setIsFormOpen(true);
  };

  // Submit form (create or update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!validateForm()) {
      setFormError("Please correct the errors below.");
      return;
    }

    setIsLoading(true);

    try {
      const abortController = new AbortController();
      const staffInput: IStaffInput = {
        userName: formData.userName,
        email: formData.email,
        password: formData.password,
      };

      const response = await createStaff(staffInput, abortController.signal);

      if (
        "status" in response &&
        typeof response.status === "string" &&
        response.status === "error"
      ) {
        setFormError(response.message || "Operation failed");
      } else {
        setNotification({
          open: true,
          type: "success",
          message: "Staff created successfully",
        });
        setIsFormOpen(false);
        fetchStaff();
      }
    } catch (error) {
      console.error("Error saving staff:", error);
      setFormError("An error occurred while saving staff");
    } finally {
      setIsLoading(false);
    }
  };

  // Delete staff
  const handleDeleteStaff = (id: string, userName: string) => {
    setConfirmDialog({
      open: true,
      title: "Delete Staff",
      message: `Are you sure you want to delete "${userName}"? This action cannot be undone.`,
      onConfirm: () => confirmDeleteStaff(id),
    });
  };

  const confirmDeleteStaff = async (id: string) => {
    setConfirmDialog({ ...confirmDialog, open: false });

    try {
      const abortController = new AbortController();
      const response = await deleteStaff(id, abortController.signal);

      if (
        "status" in response &&
        typeof response.status === "string" &&
        response.status === "error"
      ) {
        setNotification({
          open: true,
          type: "error",
          message: response.message || "Failed to delete staff",
        });
      } else {
        setNotification({
          open: true,
          type: "success",
          message: "Staff deleted successfully",
        });
        fetchStaff();
      }
    } catch (error) {
      console.error("Error deleting staff:", error);
      setNotification({
        open: true,
        type: "error",
        message: "Failed to delete staff",
      });
    }
  };

  // Cancel form
  const handleCancel = () => {
    setIsFormOpen(false);
    setFormData({ userName: "", email: "", password: "", confirmPassword: "" });
    setErrors({});
    setFormError(null);
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  return (
    <>
      <AdminNavbar />
      <div className="p-6 bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Staff Management
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Manage your staff members, their email addresses and login
              credentials.
            </p>
          </div>
          <button
            onClick={handleCreateStaff}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <PlusIcon className="w-5 h-5" />
            Add Staff
          </button>
        </div>

        {/* Staff List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Staff Members
              </h2>
              <span className="text-sm text-gray-500">
                {staff.length} total staff
              </span>
            </div>

            {isLoading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-gray-500">Loading staff...</p>
              </div>
            ) : staff.length === 0 ? (
              <div className="text-center py-12">
                <UserIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No staff members found</p>
                <button
                  onClick={handleCreateStaff}
                  className="mt-2 text-blue-600 hover:text-blue-700"
                >
                  Create your first staff member
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                        Staff Member
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                        Email
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                        Created Date
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {staff.map((staffMember) => (
                      <tr
                        key={staffMember.id}
                        className="border-b border-gray-200 hover:bg-gray-50"
                      >
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <UserCircleIcon className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">
                                {staffMember.userName}
                              </div>
                              <div className="text-sm text-gray-500">
                                ID: {staffMember.id.slice(0, 8)}...
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2 text-gray-900">
                            <EnvelopeIcon className="w-4 h-4 text-gray-400" />
                            <span className="text-sm">{staffMember.email}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-gray-500">
                          {staffMember.createdAt
                            ? new Date(
                                staffMember.createdAt
                              ).toLocaleDateString()
                            : "N/A"}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex justify-end">
                            <button
                              onClick={() =>
                                handleDeleteStaff(
                                  staffMember.id,
                                  staffMember.userName
                                )
                              }
                              className="text-red-600 hover:text-red-700 p-1"
                              title="Delete Staff"
                            >
                              <TrashIcon className="w-4 h-4" />
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

        {/* Form Modal */}
        {isFormOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Add New Staff
                  </h3>
                  <button
                    onClick={handleCancel}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>

                <form
                  ref={formRef}
                  onSubmit={handleSubmit}
                  className="space-y-4"
                >
                  {formError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                      {formError}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Username *
                    </label>
                    <input
                      type="text"
                      name="userName"
                      value={formData.userName}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.userName ? "border-red-300" : "border-gray-300"
                      }`}
                      placeholder="Enter username (min 3 characters)"
                    />
                    {errors.userName && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.userName}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.email ? "border-red-300" : "border-gray-300"
                      }`}
                      placeholder="Enter email address"
                    />
                    {errors.email && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.email}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.password ? "border-red-300" : "border-gray-300"
                        }`}
                        placeholder="Enter password (min 6 characters)"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? (
                          <EyeSlashIcon className="w-5 h-5" />
                        ) : (
                          <EyeIcon className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.password}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Confirm Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.confirmPassword
                            ? "border-red-300"
                            : "border-gray-300"
                        }`}
                        placeholder="Confirm password"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                      >
                        {showConfirmPassword ? (
                          <EyeSlashIcon className="w-5 h-5" />
                        ) : (
                          <EyeIcon className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.confirmPassword}
                      </p>
                    )}
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={isLoading}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                      disabled={isLoading}
                    >
                      {isLoading ? "Saving..." : "Create Staff"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Dialog */}
        {confirmDialog.open && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {confirmDialog.title}
                </h3>
                <p className="text-gray-600 mb-6">{confirmDialog.message}</p>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() =>
                      setConfirmDialog({ ...confirmDialog, open: false })
                    }
                    className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDialog.onConfirm}
                    className="px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notification Toast */}
        {notification.open && (
          <div className="fixed top-4 right-4 z-50">
            <div
              className={`max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden ${
                notification.type === "success"
                  ? "border-l-4 border-green-400"
                  : "border-l-4 border-red-400"
              }`}
            >
              <div className="p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    {notification.type === "success" ? (
                      <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                        <svg
                          className="w-4 h-4 text-green-600"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    ) : (
                      <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                        <svg
                          className="w-4 h-4 text-red-600"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="ml-3 w-0 flex-1 pt-0.5">
                    <p className="text-sm font-medium text-gray-900">
                      {notification.message}
                    </p>
                  </div>
                  <div className="ml-4 flex-shrink-0 flex">
                    <button
                      className="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500"
                      onClick={() =>
                        setNotification({ ...notification, open: false })
                      }
                    >
                      <XMarkIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default StaffManagement;
