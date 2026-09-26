"use client";
import AdminNavbar from "@/components/AdminNavBar";
import {
  CreditCardIcon,
  PlusIcon,
  ArrowPathIcon,
  PencilSquareIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { useState, useEffect, useCallback } from "react";
import {
  getAllVouchers,
  createVoucher,
  updateVoucher,
  deleteVoucher,
} from "@/hooks/useVoucher";
import IVoucher from "@/interfaces/IVoucher";

export default function VoucherManagementPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [vouchers, setVouchers] = useState<IVoucher[]>([]);
  const [codeInput, setCodeInput] = useState("");
  const [discountInput, setDiscountInput] = useState("");
  const [selectedVoucher, setSelectedVoucher] = useState<IVoucher | null>(null);
  const [editCodeInput, setEditCodeInput] = useState("");
  const [editDiscountInput, setEditDiscountInput] = useState("");
  const [editIsExpired, setEditIsExpired] = useState(false);
  const [voucherToDelete, setVoucherToDelete] = useState<IVoucher | null>(null);

  const fetchVouchers = useCallback(async (signal: AbortSignal) => {
    setIsLoading(true);
    const data = await getAllVouchers(signal);

    if (Array.isArray(data)) {
      setVouchers(data);
    }

    setIsLoading(false);
  }, []);

  const handleCreateVoucher = useCallback(async () => {
    if (!codeInput.trim() || !discountInput.trim()) {
      alert("Please fill in all fields.");
      return;
    }

    const newVoucher = {
      code: codeInput.trim(),
      discount: parseFloat(discountInput.trim()),
      isExpired: false,
    };

    const parsedDiscount = Number.isNaN(newVoucher.discount)
      ? null
      : newVoucher.discount;

    if (parsedDiscount === null) {
      alert("Discount must be a valid number.");
      return;
    }

    setIsMutating(true);

    const abortController = new AbortController();

    (
      document.getElementById("create-voucher-modal") as HTMLDialogElement
    ).close();

    try {
      const result = await createVoucher(newVoucher, abortController.signal);

      if (result && "status" in result && result.status === "error") {
        alert(result.message || "Failed to create voucher.");
        return;
      }

      setCodeInput("");
      setDiscountInput("");
      const refreshController = new AbortController();
      fetchVouchers(refreshController.signal);
    } catch (error) {
      console.error("Failed to create voucher:", error);
      alert("An unexpected error occurred while creating the voucher.");
    } finally {
      setIsMutating(false);
    }
  }, [codeInput, discountInput, fetchVouchers]);

  const openEditVoucherModal = useCallback((voucher: IVoucher) => {
    setSelectedVoucher(voucher);
    setEditCodeInput(voucher.code);
    setEditDiscountInput(voucher.discount.toString());
    setEditIsExpired(voucher.isExpired);
    (
      document.getElementById("edit-voucher-modal") as HTMLDialogElement
    ).showModal();
  }, []);

  const handleUpdateVoucher = useCallback(async () => {
    if (!selectedVoucher) {
      return;
    }

    if (!editCodeInput.trim() || !editDiscountInput.trim()) {
      alert("Please fill in all fields.");
      return;
    }

    const parsedDiscount = parseFloat(editDiscountInput.trim());
    if (Number.isNaN(parsedDiscount)) {
      alert("Discount must be a valid number.");
      return;
    }

    setIsMutating(true);

    const abortController = new AbortController();

    try {
      const result = await updateVoucher(
        selectedVoucher.id,
        {
          code: editCodeInput.trim(),
          discount: parsedDiscount,
          isExpired: editIsExpired,
        },
        abortController.signal
      );

      if (result && "status" in result && result.status === "error") {
        alert(result.message || "Failed to update voucher.");
        return;
      }

      setSelectedVoucher(null);
      (
        document.getElementById("edit-voucher-modal") as HTMLDialogElement
      ).close();

      const refreshController = new AbortController();
      fetchVouchers(refreshController.signal);
    } catch (error) {
      console.error("Failed to update voucher:", error);
      alert("An unexpected error occurred while updating the voucher.");
    } finally {
      setIsMutating(false);
    }
  }, [
    editCodeInput,
    editDiscountInput,
    editIsExpired,
    fetchVouchers,
    selectedVoucher,
  ]);

  const openDeleteVoucherModal = useCallback((voucher: IVoucher) => {
    setVoucherToDelete(voucher);
    (
      document.getElementById("delete-voucher-modal") as HTMLDialogElement
    ).showModal();
  }, []);

  const handleDeleteVoucher = useCallback(async () => {
    if (!voucherToDelete) {
      return;
    }

    setIsMutating(true);

    const abortController = new AbortController();

    try {
      const result = await deleteVoucher(
        voucherToDelete.id,
        abortController.signal
      );

      if (result && "status" in result && result.status === "error") {
        alert(result.message || "Failed to delete voucher.");
        return;
      }

      setVoucherToDelete(null);
      (
        document.getElementById("delete-voucher-modal") as HTMLDialogElement
      ).close();

      const refreshController = new AbortController();
      fetchVouchers(refreshController.signal);
    } catch (error) {
      console.error("Failed to delete voucher:", error);
      alert("An unexpected error occurred while deleting the voucher.");
    } finally {
      setIsMutating(false);
    }
  }, [fetchVouchers, voucherToDelete]);

  useEffect(() => {
    const abort = new AbortController();

    fetchVouchers(abort.signal);

    return () => {
      abort.abort(); // Clean up the fetch request on component unmount
    };
  }, [fetchVouchers]);

  return (
    <>
      <AdminNavbar />
      <dialog id="create-voucher-modal" className="modal">
        <div className="modal-box">
          <form method="dialog">
            {/* if there is a button in form, it will close the modal */}
            <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">
              ✕
            </button>
          </form>
          <h3 className="font-bold text-lg">Create Voucher</h3>
          <div className="py-4 flex flex-col items-center w-full">
            <fieldset className="fieldset w-full">
              <legend className="fieldset-legend">Code</legend>
              <input
                type="text"
                className="input w-full"
                placeholder="Type here"
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value)}
              />
            </fieldset>
            <fieldset className="fieldset w-full">
              <legend className="fieldset-legend">Discount</legend>
              <input
                type="number"
                className="input w-full"
                placeholder="Type here"
                value={discountInput}
                onChange={(e) => setDiscountInput(e.target.value)}
              />
            </fieldset>
          </div>
          <div className="modal-action">
            <button
              onClick={handleCreateVoucher}
              className="btn btn-primary"
              disabled={isMutating}
            >
              Create Voucher
            </button>
          </div>
        </div>
      </dialog>
      <dialog id="edit-voucher-modal" className="modal">
        <div className="modal-box">
          <form method="dialog">
            <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">
              ✕
            </button>
          </form>
          <h3 className="font-bold text-lg">Edit Voucher</h3>
          <div className="py-4 flex flex-col gap-4">
            <fieldset className="fieldset w-full">
              <legend className="fieldset-legend">Code</legend>
              <input
                type="text"
                className="input w-full"
                value={editCodeInput}
                onChange={(e) => setEditCodeInput(e.target.value)}
              />
            </fieldset>
            <fieldset className="fieldset w-full">
              <legend className="fieldset-legend">Discount</legend>
              <input
                type="number"
                className="input w-full"
                value={editDiscountInput}
                onChange={(e) => setEditDiscountInput(e.target.value)}
              />
            </fieldset>
            <fieldset className="fieldset w-full">
              <legend className="fieldset-legend">Is Expired</legend>
              <div className="flex items-center gap-2">
                <input
                  id="edit-is-expired"
                  type="checkbox"
                  className="checkbox"
                  checked={editIsExpired}
                  onChange={(e) => setEditIsExpired(e.target.checked)}
                />
                <label htmlFor="edit-is-expired" className="text-sm">
                  Mark as expired
                </label>
              </div>
            </fieldset>
          </div>
          <div className="modal-action">
            <button
              onClick={handleUpdateVoucher}
              className="btn btn-primary"
              disabled={isMutating}
            >
              Save Changes
            </button>
          </div>
        </div>
      </dialog>
      <dialog id="delete-voucher-modal" className="modal">
        <div className="modal-box">
          <form method="dialog">
            <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">
              ✕
            </button>
          </form>
          <h3 className="font-bold text-lg text-red-600">Confirm Delete</h3>
          <p className="py-4">
            Are you sure you want to delete voucher{" "}
            <span className="font-semibold">
              {voucherToDelete?.code ?? ""}
            </span>
            ? This action will mark the voucher as expired.
          </p>
          <div className="modal-action">
            <button
              className="btn btn-ghost"
              onClick={() => {
                (
                  document.getElementById(
                    "delete-voucher-modal"
                  ) as HTMLDialogElement
                ).close();
                setVoucherToDelete(null);
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteVoucher}
              className="btn btn-error"
              disabled={isMutating}
            >
              Confirm
            </button>
          </div>
        </div>
      </dialog>
      <div className="p-6 bg-gray-50 min-h-screen space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Voucher Management
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Manage all service vouchers, including creating new vouchers,
              editing existing ones, and viewing voucher details.
            </p>
          </div>
          <button
            onClick={() =>
              (
                document.getElementById(
                  "create-voucher-modal"
                ) as HTMLDialogElement
              ).showModal()
            }
            className="flex items-center gap-2 px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <PlusIcon className="w-5 h-5" />
            Add New Voucher
          </button>
        </div>

        {/* Vouchers List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                All Vouchers ({vouchers.length})
              </h2>
              <button
                onClick={() => fetchVouchers(new AbortController().signal)}
                className="text-blue-600 text-sm hover:text-blue-700 flex flex-row gap-2 cursor-pointer"
                disabled={isLoading}
              >
                {isLoading ? (
                  "Loading..."
                ) : (
                  <>
                    Refresh <ArrowPathIcon className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>

            {isLoading ? (
              <div className="text-center py-8">
                <div className="text-gray-500">Loading Vouchers...</div>
              </div>
            ) : vouchers.length === 0 ? (
              <div className="text-center py-8">
                <CreditCardIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No vouchers found
                </h3>
                <p className="text-gray-500 mb-4">
                  Get started by creating your first voucher.
                </p>
                <button
                  onClick={() =>
                    (
                      document.getElementById(
                        "create-voucher-modal"
                      ) as HTMLDialogElement
                    ).showModal()
                  }
                  className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  Add First Voucher
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-2 text-sm font-medium text-gray-500">
                        Code
                      </th>
                      <th className="text-left py-3 px-2 text-sm font-medium text-gray-500">
                        Discount
                      </th>
                      <th className="text-left py-3 px-2 text-sm font-medium text-gray-500">
                        Is Expired
                      </th>
                      <th className="text-left py-3 px-2 text-sm font-medium text-gray-500">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {vouchers.map((voucher) => (
                      <tr
                        key={voucher.id}
                        className="border-b border-gray-100 hover:bg-gray-50"
                      >
                        <td className="py-3 px-2">
                          <span className="font-medium text-gray-900">
                            {voucher.code}
                          </span>
                        </td>
                        <td className="py-3 px-2">
                          <span className="text-green-600 font-semibold">
                            ฿{voucher.discount.toLocaleString()}
                          </span>
                        </td>
                        <td className="py-3 px-2">
                          <span
                            className={`${
                              voucher.isExpired
                                ? "text-red-600"
                                : "text-green-600"
                            } font-semibold`}
                          >
                            {voucher.isExpired ? "Yes" : "No"}
                          </span>
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex gap-2">
                            <button
                              className="btn btn-sm btn-ghost text-blue-600"
                              onClick={() => openEditVoucherModal(voucher)}
                              disabled={isMutating}
                            >
                              <PencilSquareIcon className="w-5 h-5" />
                              Edit
                            </button>
                            <button
                              className="btn btn-sm btn-ghost text-red-600"
                              onClick={() => openDeleteVoucherModal(voucher)}
                              disabled={isMutating}
                            >
                              <TrashIcon className="w-5 h-5" />
                              Delete
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
      </div>
    </>
  );
}
