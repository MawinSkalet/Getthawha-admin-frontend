"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import AdminNavbar from "@/components/AdminNavBar";
import {
  getAllPackages,
  createPackage,
  updatePackage,
  deletePackage,
} from "@/hooks/usePackage";
import { uploadImage } from "@/hooks/useUpload";
import type IPackage from "@/interfaces/IPackage";
import type IPackageInput from "@/interfaces/IPackageInput";
import type IErrorResponse from "@/interfaces/IErrorResponse";
import {
  CubeIcon,
  CurrencyDollarIcon,
  ClockIcon,
  PhotoIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

interface PackageFormData {
  id?: string;
  type: "service" | "promotion";
  title: string;
  description: string;
  price: number;
  duration: number;
  pictureUrl: string;
  note: string;
}

const PackageManagement = () => {
  // State management
  const [packages, setPackages] = useState<IPackage[]>([]);
  const [filteredPackages, setFilteredPackages] = useState<IPackage[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "service" | "promotion">(
    "all"
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<IPackage | null>(null);
  const [formData, setFormData] = useState<PackageFormData>({
    type: "service",
    title: "",
    description: "",
    price: 0,
    duration: 0,
    pictureUrl: "",
    note: "",
  });
  const [errors, setErrors] = useState<
    Partial<Record<keyof PackageFormData, string>>
  >({});
  const [formError, setFormError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Add notification and confirmation dialog states
  const [notification, setNotification] = useState<{
    open: boolean;
    type: "success" | "error";
    message: string;
  }>({ open: false, type: "success", message: "" });

  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ open: false, title: "", message: "", onConfirm: () => {} });

  // Fetch packages on component mount
  useEffect(() => {
    fetchPackages();
  }, []);

  // Filter packages based on search term and type
  useEffect(() => {
    const filtered = packages.filter((pkg) => {
      const matchesSearch =
        pkg.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pkg.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pkg.price.toString().includes(searchTerm);

      const matchesType = filterType === "all" || pkg.type === filterType;

      return matchesSearch && matchesType;
    });
    setFilteredPackages(filtered);
  }, [packages, searchTerm, filterType]);

  // Success toast effect
  useEffect(() => {
    if (showSuccessToast) {
      const timer = setTimeout(() => {
        setShowSuccessToast(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showSuccessToast]);

  // API functions
  const fetchPackages = async () => {
    setIsLoading(true);
    try {
      const abortController = new AbortController();
      const result = await getAllPackages(abortController.signal);

      if (Array.isArray(result)) {
        setPackages(result);
      } else if ("message" in result) {
        console.error("Error fetching packages:", result.message);
        setNotification({
          open: true,
          type: "error",
          message: result.message,
        });
      }
    } catch (error) {
      console.error("Error fetching packages:", error);
      setNotification({
        open: true,
        type: "error",
        message: "Failed to fetch packages. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = useCallback(() => {
    setFormData({
      type: "service",
      title: "",
      description: "",
      price: 0,
      duration: 0,
      pictureUrl: "",
      note: "",
    });
    setErrors({});
    setFormError(null);
    setSelectedImage(null);
    setImagePreview(null);
    setEditingPackage(null);
    setIsUploadingImage(false);
  }, []);

  const openModal = useCallback(
    (pkg?: IPackage) => {
      if (pkg) {
        setEditingPackage(pkg);
        setFormData({
        id: pkg.id,
        type: (pkg.type as PackageFormData["type"]) ?? "service",
        title: pkg.title,
        description: pkg.description,
        price: pkg.price,
        duration: pkg.duration,
        pictureUrl: pkg.pictureUrl || "",
        note: pkg.note || "",
      });
      setImagePreview(pkg.pictureUrl || null);
    } else {
      resetForm();
      }
      setIsModalOpen(true);
    },
    [resetForm]
  );

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    resetForm();
  }, [resetForm]);

  // Handle keyboard events for modal
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isModalOpen) {
        closeModal();
      }
    };

    if (isModalOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [closeModal, isModalOpen]);

  // Form handlers
  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "price" || name === "duration"
          ? Number(value)
          : (value as string),
    }));

    // Clear error when user starts typing
    if (errors[name as keyof PackageFormData]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  // Handle image selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        setErrors((prev) => ({
          ...prev,
          pictureUrl: "Please select a valid image file",
        }));
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors((prev) => ({
          ...prev,
          pictureUrl: "Image size must be less than 5MB",
        }));
        return;
      }

      setSelectedImage(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Clear any existing error
      setErrors((prev) => ({ ...prev, pictureUrl: undefined }));
    }
  };

  // Remove selected image
  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setFormData((prev) => ({ ...prev, pictureUrl: "" }));
    setErrors((prev) => ({ ...prev, pictureUrl: undefined }));
  };

  // Form validation
  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof PackageFormData, string>> = {};

    if (!formData.type || !["service", "promotion"].includes(formData.type)) {
      newErrors.type = "Type must be Service or Promotion";
    }
    if (!formData.title.trim()) newErrors.title = "Package title is required";
    if (!formData.description.trim())
      newErrors.description = "Description is required";
    if (!formData.price || formData.price <= 0)
      newErrors.price = "Price must be greater than 0";
    if (!formData.duration || formData.duration <= 0)
      newErrors.duration = "Duration must be greater than 0";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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
      let finalPictureUrl = formData.pictureUrl;

      // Upload image if a new one was selected
      if (selectedImage) {
        setIsUploadingImage(true);
        try {
          finalPictureUrl = await uploadImage(selectedImage);
        } catch (uploadError: unknown) {
          const message =
            uploadError instanceof Error
              ? uploadError.message
              : "Failed to upload image. Please try again.";
          setFormError(message);
          setIsUploadingImage(false);
          setIsLoading(false);
          return;
        }
        setIsUploadingImage(false);
      }

      const packageInput: IPackageInput = {
        type: formData.type,
        title: formData.title,
        description: formData.description,
        price: formData.price,
        duration: formData.duration,
        pictureUrl: finalPictureUrl || null,
        note:
          !formData.note || formData.note.trim() === "" ? null : formData.note,
      };

      let result;
      if (editingPackage) {
        result = await updatePackage(
          editingPackage.id,
          packageInput,
          abortController.signal
        );
      } else {
        result = await createPackage(packageInput, abortController.signal);
      }

      if ("message" in result) {
        const errorResult = result as IErrorResponse;
        setFormError(
          errorResult.message || "An error occurred. Please try again."
        );
      } else {
        await fetchPackages();
        closeModal();

        // Show success toast
        setSuccessMessage(
          editingPackage
            ? "Package updated successfully!"
            : "Package created successfully!"
        );
        setShowSuccessToast(true);
      }
    } catch (error) {
      console.error("Error saving package:", error);
      setFormError("Failed to save package. Please try again.");
    } finally {
      setIsLoading(false);
      setIsUploadingImage(false);
    }
  };

  // Delete package
  const handleDeletePackage = (id: string, title: string) => {
    setConfirmDialog({
      open: true,
      title: "Delete Package",
      message: `Are you sure you want to delete the package "${title}"? This action cannot be undone.`,
      onConfirm: () => confirmDeletePackage(id),
    });
  };

  const confirmDeletePackage = async (id: string) => {
    setIsLoading(true);
    try {
      const abortController = new AbortController();
      const result = await deletePackage(id, abortController.signal);

      if (
        "message" in result &&
        result.message !== "Package deleted successfully"
      ) {
        const errorResult = result as IErrorResponse;
        setNotification({
          open: true,
          type: "error",
          message: errorResult.message,
        });
      } else {
        await fetchPackages();
        setNotification({
          open: true,
          type: "success",
          message: "Package deleted successfully!",
        });
      }
    } catch (error) {
      console.error("Error deleting package:", error);
      setNotification({
        open: true,
        type: "error",
        message: "Failed to delete package. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Format duration for display
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavbar />

      {/* Success Toast */}
      {showSuccessToast && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-slide-in-right">
          <CheckCircleIcon className="w-5 h-5" />
          {successMessage}
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Package Management
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                Manage all service packages, including creating new packages,
                editing existing ones, and viewing package details.
              </p>
            </div>
            <button
              onClick={() => openModal()}
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 shadow-sm"
              disabled={isLoading}
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              Add Package
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search packages..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <select
                value={filterType}
                onChange={(e) =>
                  setFilterType(
                    e.target.value as "all" | "service" | "promotion"
                  )
                }
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Types</option>
                <option value="service">Services</option>
                <option value="promotion">Promotions</option>
              </select>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span>Total: {packages.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>Filtered: {filteredPackages.length}</span>
              </div>
              <button
                onClick={fetchPackages}
                className="text-blue-600 hover:text-blue-700 font-medium"
                disabled={isLoading}
              >
                {isLoading ? "Refreshing..." : "Refresh"}
              </button>
            </div>
          </div>
        </div>

        {/* Packages Grid/List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading packages...</span>
            </div>
          ) : filteredPackages.length === 0 ? (
            <div className="text-center py-16">
              {searchTerm || filterType !== "all" ? (
                <>
                  <MagnifyingGlassIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No packages found
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Try adjusting your search terms or filters, or create a new
                    package.
                  </p>
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      setFilterType("all");
                    }}
                    className="text-blue-600 hover:text-blue-700 font-medium mr-4"
                  >
                    Clear filters
                  </button>
                </>
              ) : (
                <>
                  <CubeIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No packages yet
                  </h3>
                  <p className="text-gray-500 mb-6">
                    Get started by creating your first service package.
                  </p>
                  <button
                    onClick={() => openModal()}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
                  >
                    <PlusIcon className="w-5 h-5 mr-2" />
                    Add First Package
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="overflow-hidden">
              {/* Mobile Card View */}
              <div className="block sm:hidden">
                {filteredPackages.map((pkg: IPackage) => (
                  <div key={pkg.id} className="border-b border-gray-200 p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        {pkg.pictureUrl ? (
                          <Image
                            src={pkg.pictureUrl}
                            alt={pkg.title}
                            width={48}
                            height={48}
                            className="w-12 h-12 rounded-lg object-cover"
                            unoptimized
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                            <PhotoIcon className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-sm font-medium text-gray-900 truncate">
                              {pkg.title}
                            </h4>
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                pkg.type === "promotion"
                                  ? "bg-purple-100 text-purple-800"
                                  : "bg-blue-100 text-blue-800"
                              }`}
                            >
                              {pkg.type || "service"}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 truncate mb-1">
                            {pkg.description}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>฿{pkg.price.toLocaleString()}</span>
                            <span>{formatDuration(pkg.duration)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => openModal(pkg)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeletePackage(pkg.id, pkg.title)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden sm:block">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Package
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Price & Duration
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredPackages.map((pkg: IPackage) => (
                      <tr
                        key={pkg.id}
                        className="hover:bg-gray-50 transition-colors duration-150"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            {pkg.pictureUrl ? (
                              <Image
                                src={pkg.pictureUrl}
                                alt={pkg.title}
                                width={40}
                                height={40}
                                className="w-10 h-10 rounded-lg object-cover mr-4"
                                unoptimized
                              />
                            ) : (
                              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mr-4">
                                <PhotoIcon className="w-5 h-5 text-gray-400" />
                              </div>
                            )}
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {pkg.title}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              pkg.type === "promotion"
                                ? "bg-purple-100 text-purple-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {pkg.type || "service"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 flex items-center mb-1">
                            <CurrencyDollarIcon className="w-4 h-4 text-gray-400 mr-1" />
                            ฿{pkg.price.toLocaleString()}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center">
                            <ClockIcon className="w-4 h-4 text-gray-400 mr-1" />
                            {formatDuration(pkg.duration)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 truncate max-w-xs">
                            {pkg.description}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => openModal(pkg)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-150"
                              title="Edit package"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() =>
                                handleDeletePackage(pkg.id, pkg.title)
                              }
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-150"
                              title="Delete package"
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
            </div>
          )}
        </div>
      </div>

      {/* Modern Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div
              className="fixed inset-0 bg-black/20 backdrop-blur-sm transition-opacity"
              aria-hidden="true"
              onClick={closeModal}
            ></div>

            <span
              className="hidden sm:inline-block sm:align-middle sm:h-screen"
              aria-hidden="true"
            >
              &#8203;
            </span>

            {/* Modal panel */}
            <div
              className="relative inline-block align-bottom rounded-xl text-left overflow-hidden transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full
  bg-white border border-gray-200 shadow-2xl"
              role="dialog"
              aria-modal="true"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingPackage ? "Edit Package" : "Add New Package"}
                </h2>
                <button
                  type="button"
                  onClick={closeModal}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <XMarkIcon className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="max-h-[70vh] overflow-y-auto">
                <form onSubmit={handleSubmit} className="p-6">
                  {formError && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
                      <ExclamationTriangleIcon className="w-5 h-5 text-red-500 mr-3 flex-shrink-0" />
                      <span className="text-sm text-red-700">{formError}</span>
                    </div>
                  )}

                  <div className="space-y-6">
                    {/* Type and Title */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Type *
                        </label>
                        <select
                          name="type"
                          value={formData.type}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-150 ${
                            errors.type ? "border-red-500" : "border-gray-300"
                          }`}
                        >
                          <option value="service">Service</option>
                          <option value="promotion">Promotion</option>
                        </select>
                        {errors.type && (
                          <p className="text-xs text-red-500 mt-1">
                            {errors.type}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Package Title *
                        </label>
                        <input
                          type="text"
                          name="title"
                          value={formData.title}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-150 ${
                            errors.title ? "border-red-500" : "border-gray-300"
                          }`}
                          placeholder="Enter package title"
                        />
                        {errors.title && (
                          <p className="text-xs text-red-500 mt-1">
                            {errors.title}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description *
                      </label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows={3}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-150 ${
                          errors.description
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                        placeholder="Enter package description"
                      />
                      {errors.description && (
                        <p className="text-xs text-red-500 mt-1">
                          {errors.description}
                        </p>
                      )}
                    </div>

                    {/* Price and Duration */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Price (THB) *
                        </label>
                        <input
                          type="number"
                          name="price"
                          value={formData.price}
                          onChange={handleInputChange}
                          min="0"
                          step="0.01"
                          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-150 ${
                            errors.price ? "border-red-500" : "border-gray-300"
                          }`}
                          placeholder="0.00"
                        />
                        {errors.price && (
                          <p className="text-xs text-red-500 mt-1">
                            {errors.price}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Duration (minutes) *
                        </label>
                        <input
                          type="number"
                          name="duration"
                          value={formData.duration}
                          onChange={handleInputChange}
                          min="0"
                          step="1"
                          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-150 ${
                            errors.duration
                              ? "border-red-500"
                              : "border-gray-300"
                          }`}
                          placeholder="0"
                        />
                        {errors.duration && (
                          <p className="text-xs text-red-500 mt-1">
                            {errors.duration}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Image Upload */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Package Image
                      </label>
                      <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors duration-150">
                        {imagePreview ? (
                          <div className="relative inline-block">
                            <Image
                              src={imagePreview}
                              alt="Preview"
                              width={128}
                              height={128}
                              className="mx-auto h-32 w-32 object-cover rounded-lg"
                              unoptimized
                            />
                            <button
                              type="button"
                              onClick={handleRemoveImage}
                              className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm transition-colors duration-150"
                            >
                              ×
                            </button>
                          </div>
                        ) : (
                          <div>
                            <PhotoIcon className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                            <p className="text-sm text-gray-600 mb-1">
                              Click to upload or drag and drop
                            </p>
                            <p className="text-xs text-gray-500">
                              PNG, JPG, GIF up to 5MB
                            </p>
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageSelect}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                      </div>
                      {isUploadingImage && (
                        <div className="flex items-center justify-center mt-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                          <span className="text-sm text-blue-600">
                            Uploading image...
                          </span>
                        </div>
                      )}
                      {errors.pictureUrl && (
                        <p className="text-xs text-red-500 mt-1">
                          {errors.pictureUrl}
                        </p>
                      )}
                    </div>

                    {/* Additional Notes */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Additional Notes
                      </label>
                      <textarea
                        name="note"
                        value={formData.note}
                        onChange={handleInputChange}
                        rows={2}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-150 ${
                          errors.note ? "border-red-500" : "border-gray-300"
                        }`}
                        placeholder="Enter any additional notes (optional)"
                      />
                      {errors.note && (
                        <p className="text-xs text-red-500 mt-1">
                          {errors.note}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Modal Footer */}
                  <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200 mt-8">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="px-4 py-2 text-gray-800 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={isLoading}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={isLoading || isUploadingImage}
                    >
                      {isLoading && (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      )}
                      {isLoading
                        ? "Saving..."
                        : editingPackage
                        ? "Update Package"
                        : "Create Package"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notification Modal */}
      {notification.open && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative bg-white rounded-lg shadow-lg w-full max-w-md m-4">
            <div className="p-6 text-center">
              <div className="mb-4">
                {notification.type === "success" ? (
                  <svg
                    className="w-16 h-16 text-green-500 mx-auto"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-16 h-16 text-red-500 mx-auto"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                )}
              </div>
              <h3 className="mb-2 text-lg font-medium text-gray-900">
                {notification.type === "success" ? "Success!" : "Error!"}
              </h3>
              <p className="mb-6 text-sm text-gray-600">
                {notification.message}
              </p>
              <button
                className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
                onClick={() =>
                  setNotification({ ...notification, open: false })
                }
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {confirmDialog.open && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative bg-white rounded-lg shadow-lg w-full max-w-md m-4">
            <div className="p-6 text-center">
              <div className="mb-4">
                <svg
                  className="w-16 h-16 text-orange-500 mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <h3 className="mb-2 text-lg font-medium text-gray-900">
                {confirmDialog.title}
              </h3>
              <p className="mb-6 text-sm text-gray-600">
                {confirmDialog.message}
              </p>
              <div className="flex justify-center space-x-4">
                <button
                  className="text-gray-500 bg-white hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-blue-300 rounded-lg border border-gray-200 text-sm font-medium px-5 py-2.5 hover:text-gray-900 focus:z-10"
                  onClick={() =>
                    setConfirmDialog({ ...confirmDialog, open: false })
                  }
                >
                  Cancel
                </button>
                <button
                  className="text-white bg-red-600 hover:bg-red-800 focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
                  onClick={() => {
                    confirmDialog.onConfirm();
                    setConfirmDialog({ ...confirmDialog, open: false });
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PackageManagement;
