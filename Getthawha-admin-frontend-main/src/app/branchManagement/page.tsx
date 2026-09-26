"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import AdminNavbar from "@/components/AdminNavBar";
import {
  getAllBranch,
  createBranch,
  updateBranch,
  deleteBranch,
} from "@/hooks/useBranch";
import { uploadImage } from "@/hooks/useUpload";
import type IBranch from "@/interfaces/IBranch";
import type IBranchInput from "@/interfaces/IBranchInput";
import type IErrorResponse from "@/interfaces/IErrorResponse";
import {
  BuildingOfficeIcon,
  PhoneIcon,
  MapPinIcon,
  GlobeAltIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  PhotoIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";

interface BranchFormData extends IBranchInput {
  id?: string;
}

const BranchManagement = () => {
  // State management
  const [branches, setBranches] = useState<IBranch[]>([]);
  const [filteredBranches, setFilteredBranches] = useState<IBranch[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<IBranch | null>(null);
  const [formData, setFormData] = useState<BranchFormData>({
    name: "",
    address: "",
    googleMapUrl: "",
    phone: "",
    pictureUrl: "",
    googleMapEmbedUrl: "",
    description: "",
  });
  const [errors, setErrors] = useState<Partial<BranchFormData>>({});
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

  // Fetch branches on component mount
  useEffect(() => {
    fetchBranches();
  }, []);

  // Filter branches based on search term
  useEffect(() => {
    const filtered = branches.filter(
      (branch) =>
        branch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        branch.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        branch.phone.includes(searchTerm)
    );
    setFilteredBranches(filtered);
  }, [branches, searchTerm]);

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
  const fetchBranches = async () => {
    setIsLoading(true);
    try {
      const abortController = new AbortController();
      const result = await getAllBranch(abortController.signal);

      if (Array.isArray(result)) {
        setBranches(result);
      } else if ("message" in result) {
        console.error("Error fetching branches:", result.message);
        setNotification({
          open: true,
          type: "error",
          message: result.message,
        });
      }
    } catch (error) {
      console.error("Error fetching branches:", error);
      setNotification({
        open: true,
        type: "error",
        message: "Failed to fetch branches. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };
  const resetForm = useCallback(() => {
    setFormData({
      name: "",
      address: "",
      googleMapUrl: "",
      phone: "",
      pictureUrl: "",
      googleMapEmbedUrl: "",
      description: "",
    });
    setErrors({});
    setFormError(null);
    setSelectedImage(null);
    setImagePreview(null);
    setEditingBranch(null);
    setIsUploadingImage(false);
  }, []);

  const openModal = useCallback(
    (branch?: IBranch) => {
      if (branch) {
        setEditingBranch(branch);
        setFormData({
          id: branch.id,
          name: branch.name,
          address: branch.address,
          googleMapUrl: branch.googleMapUrl,
          phone: branch.phone,
          pictureUrl: branch.pictureUrl ?? "",
          googleMapEmbedUrl: branch.googleMapEmbedUrl ?? "",
          description: branch.description ?? "",
        });
        setImagePreview(branch.pictureUrl ?? null);
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
      // Prevent body scroll when modal is open
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [closeModal, isModalOpen]);

  // Form handlers
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name as keyof BranchFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  // Image select
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setErrors((prev) => ({
        ...prev,
        pictureUrl: "Select a valid image file",
      }));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, pictureUrl: "Image must be < 5MB" }));
      return;
    }
    setSelectedImage(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
    setErrors((prev) => ({ ...prev, pictureUrl: undefined }));
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setFormData((p) => ({ ...p, pictureUrl: "" }));
    // Clear any image-related errors
    setErrors((prev) => ({ ...prev, pictureUrl: undefined }));
  };

  // Form validation
  const validateForm = (): boolean => {
    const newErrors: Partial<BranchFormData> = {};

    if (!formData.name.trim()) newErrors.name = "Branch name is required";
    if (!formData.address.trim()) newErrors.address = "Address is required";
    if (!formData.phone.trim()) newErrors.phone = "Phone number is required";

    // Basic phone validation
    if (formData.phone && !/^[\d\s\-\+\(\)]+$/.test(formData.phone)) {
      newErrors.phone = "Please enter a valid phone number";
    }

    // Basic URL validation for Google Maps (optional)
    if (
      formData.googleMapUrl &&
      formData.googleMapUrl.trim() !== "" &&
      !formData.googleMapUrl.startsWith("http")
    ) {
      newErrors.googleMapUrl =
        "Please enter a valid URL starting with http or https";
    }

    // Optional validation for pictureUrl
    if (
      formData.pictureUrl &&
      formData.pictureUrl.trim() !== "" &&
      !formData.pictureUrl.startsWith("http")
    ) {
      newErrors.pictureUrl =
        "Please enter a valid URL starting with http or https";
    }

    // Optional validation for googleMapEmbedUrl
    if (
      formData.googleMapEmbedUrl &&
      formData.googleMapEmbedUrl.trim() !== "" &&
      !formData.googleMapEmbedUrl.startsWith("http")
    ) {
      newErrors.googleMapEmbedUrl =
        "Please enter a valid URL starting with http or https";
    }

    // Optional validation for description length
    if (formData.description && formData.description.length > 500) {
      newErrors.description = "Description must be 500 characters or less";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Enhanced submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!validateForm()) {
      setFormError("Please correct the errors below.");
      return;
    }

    setIsLoading(true);

    try {
      // Upload image first if new one selected
      let finalPictureUrl = formData.pictureUrl;
      if (selectedImage) {
        setIsUploadingImage(true);
        try {
          finalPictureUrl = await uploadImage(selectedImage);
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : "Unknown error";
          setFormError(`Image upload failed: ${message}`);
          setIsUploadingImage(false);
          setIsLoading(false);
          return;
        }
        setIsUploadingImage(false);
      }

      const abortController = new AbortController();
      const branchInput: IBranchInput = {
        name: formData.name,
        address: formData.address,
        googleMapUrl: formData.googleMapUrl,
        phone: formData.phone,
        pictureUrl: finalPictureUrl || "",
        googleMapEmbedUrl: formData.googleMapEmbedUrl,
        description: formData.description,
      };

      let result;
      if (editingBranch) {
        result = await updateBranch(
          editingBranch.id,
          branchInput,
          abortController.signal
        );
      } else {
        result = await createBranch(branchInput, abortController.signal);
      }

      if ("message" in result) {
        const errorResult = result as IErrorResponse;
        setFormError(
          errorResult.message || "An error occurred. Please try again."
        );
      } else {
        await fetchBranches();
        closeModal();

        // Show success toast
        setSuccessMessage(
          editingBranch
            ? "Branch updated successfully!"
            : "Branch created successfully!"
        );
        setShowSuccessToast(true);
      }
    } catch (error) {
      console.error("Error saving branch:", error);
      setFormError("Failed to save branch. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Delete branch
  const handleDeleteBranch = (id: string, name: string) => {
    setConfirmDialog({
      open: true,
      title: "Delete Branch",
      message: `Are you sure you want to delete the branch "${name}"? This action cannot be undone.`,
      onConfirm: () => confirmDeleteBranch(id),
    });
  };

  const confirmDeleteBranch = async (id: string) => {
    setIsLoading(true);
    try {
      const abortController = new AbortController();
      const result = await deleteBranch(id, abortController.signal);

      if (
        "message" in result &&
        result.message !== "Branch deleted successfully"
      ) {
        const errorResult = result as IErrorResponse;
        setNotification({
          open: true,
          type: "error",
          message: errorResult.message,
        });
      } else {
        await fetchBranches();
        setNotification({
          open: true,
          type: "success",
          message: "Branch deleted successfully!",
        });
      }
    } catch (error) {
      console.error("Error deleting branch:", error);
      setNotification({
        open: true,
        type: "error",
        message: "Failed to delete branch. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
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
                Branch Management
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                Manage your branch locations and information
              </p>
            </div>
            <button
              onClick={() => openModal()}
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 shadow-sm"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              Add Branch
            </button>
          </div>
        </div>

        {/* Search and Stats */}
        <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search branches..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span>Total: {branches.length}</span>
              </div>
              <button
                onClick={fetchBranches}
                className="text-blue-600 hover:text-blue-700 font-medium"
                disabled={isLoading}
              >
                {isLoading ? "Refreshing..." : "Refresh"}
              </button>
            </div>
          </div>
        </div>

        {/* Branches Grid/List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading branches...</span>
            </div>
          ) : filteredBranches.length === 0 ? (
            <div className="text-center py-16">
              {searchTerm ? (
                <>
                  <MagnifyingGlassIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No branches found
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Try adjusting your search terms or create a new branch.
                  </p>
                </>
              ) : (
                <>
                  <BuildingOfficeIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No branches yet
                  </h3>
                  <p className="text-gray-500 mb-6">
                    Get started by creating your first branch location.
                  </p>
                  <button
                    onClick={() => openModal()}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
                  >
                    <PlusIcon className="w-5 h-5 mr-2" />
                    Add First Branch
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="overflow-hidden">
              {/* Mobile Card View */}
              <div className="block sm:hidden">
                {filteredBranches.map((branch) => (
                  <div key={branch.id} className="border-b border-gray-200 p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        {branch.pictureUrl ? (
                          <Image
                            src={branch.pictureUrl}
                            alt={branch.name}
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
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {branch.name}
                          </h4>
                          <p className="text-xs text-gray-500 mt-1">
                            {branch.address}
                          </p>
                          <p className="text-xs text-gray-500">
                            {branch.phone}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => openModal(branch)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() =>
                            handleDeleteBranch(branch.id, branch.name)
                          }
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
                        Branch
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Location
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredBranches.map((branch) => (
                      <tr
                        key={branch.id}
                        className="hover:bg-gray-50 transition-colors duration-150"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            {branch.pictureUrl ? (
                              <Image
                                src={branch.pictureUrl}
                                alt={branch.name}
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
                                {branch.name}
                              </div>
                              {branch.description && (
                                <div className="text-xs text-gray-500 truncate max-w-xs">
                                  {branch.description}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 flex items-center">
                            <PhoneIcon className="w-4 h-4 text-gray-400 mr-2" />
                            {branch.phone}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-500 flex items-center">
                            <MapPinIcon className="w-4 h-4 text-gray-400 mr-2" />
                            <span className="truncate max-w-xs">
                              {branch.address}
                            </span>
                          </div>
                          {branch.googleMapUrl && (
                            <a
                              href={branch.googleMapUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:text-blue-700 flex items-center mt-1"
                            >
                              <GlobeAltIcon className="w-3 h-3 mr-1" />
                              View Map
                            </a>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => openModal(branch)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-150"
                              title="Edit branch"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() =>
                                handleDeleteBranch(branch.id, branch.name)
                              }
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-150"
                              title="Delete branch"
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
            {/* Background overlay - frosted */}
            <div
              className="fixed inset-0 bg-black/20 backdrop-blur-sm transition-opacity"
              aria-hidden="true"
              onClick={closeModal}
            ></div>

            {/* This element is to trick the browser into centering the modal contents. */}
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
              aria-labelledby="modal-headline"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/30">
                <h2
                  id="modal-headline"
                  className="text-xl font-semibold text-gray-900"
                >
                  {editingBranch ? "Edit Branch" : "Add New Branch"}
                </h2>
                <button
                  type="button"
                  onClick={closeModal}
                  className="p-2 hover:bg-white/40 rounded-lg transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="Close modal"
                >
                  <XMarkIcon className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Modal Body - Scrollable */}
              <div className="max-h-[70vh] overflow-y-auto ">
                <form onSubmit={handleSubmit} className="p-6">
                  {formError && (
                    <div className="mb-4 p-4 bg-red-50/90 border border-red-200/80 rounded-lg flex items-center">
                      <ExclamationTriangleIcon className="w-5 h-5 text-red-500 mr-3 flex-shrink-0" />
                      <span className="text-sm text-red-700">{formError}</span>
                    </div>
                  )}

                  <div className="space-y-6">
                    {/* Basic Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Branch Name *
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-150 ${
                            errors.name ? "border-red-500" : "border-gray-300"
                          }`}
                          placeholder="Enter branch name"
                        />
                        {errors.name && (
                          <p className="text-xs text-red-500 mt-1">
                            {errors.name}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Phone Number *
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-150 ${
                            errors.phone ? "border-red-500" : "border-gray-300"
                          }`}
                          placeholder="02-123-4567"
                        />
                        {errors.phone && (
                          <p className="text-xs text-red-500 mt-1">
                            {errors.phone}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Google Maps URL
                        </label>
                        <input
                          type="url"
                          name="googleMapUrl"
                          value={formData.googleMapUrl}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-150 ${
                            errors.googleMapUrl
                              ? "border-red-500"
                              : "border-gray-300"
                          }`}
                          placeholder="https://goo.gl/maps/..."
                        />
                        {errors.googleMapUrl && (
                          <p className="text-xs text-red-500 mt-1">
                            {errors.googleMapUrl}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Address */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Address *
                      </label>
                      <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-150 ${
                          errors.address ? "border-red-500" : "border-gray-300"
                        }`}
                        placeholder="123 Sukhumvit Rd, Bangkok 10110"
                      />
                      {errors.address && (
                        <p className="text-xs text-red-500 mt-1">
                          {errors.address}
                        </p>
                      )}
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                      </label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows={3}
                        maxLength={500}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-150 ${
                          errors.description
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                        placeholder="Brief description of this branch..."
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>Optional</span>
                        <span>{formData.description?.length || 0}/500</span>
                      </div>
                      {errors.description && (
                        <p className="text-xs text-red-500 mt-1">
                          {errors.description}
                        </p>
                      )}
                    </div>

                    {/* Image Upload */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Branch Image
                      </label>
                      <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors duration-150">
                        {imagePreview ||
                        (formData.pictureUrl && !selectedImage) ? (
                          <div className="relative inline-block">
                            <Image
                              src={imagePreview || formData.pictureUrl || ""}
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

                    {/* Google Map Embed URL */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Google Map Embed URL
                      </label>
                      <input
                        type="url"
                        name="googleMapEmbedUrl"
                        value={formData.googleMapEmbedUrl}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-150 ${
                          errors.googleMapEmbedUrl
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                        placeholder="https://www.google.com/maps/embed?..."
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Optional: for embedding maps
                      </p>
                      {errors.googleMapEmbedUrl && (
                        <p className="text-xs text-red-500 mt-1">
                          {errors.googleMapEmbedUrl}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Modal Footer */}
                  <div className="flex items-center justify-end space-x-3 pt-6 border-t border-white/30 mt-8">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="px-4 py-2 text-gray-800 bg-white/70 border border-white/30 rounded-lg hover:bg-white/80 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={isLoading}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-blue-600/90 hover:bg-blue-700 text-white rounded-lg transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={isLoading || isUploadingImage}
                    >
                      {isLoading && (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      )}
                      {isLoading
                        ? "Saving..."
                        : editingBranch
                        ? "Update Branch"
                        : "Create Branch"}
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

export default BranchManagement;
