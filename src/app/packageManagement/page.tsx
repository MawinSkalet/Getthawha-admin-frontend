"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import AdminNavbar from "@/components/AdminNavBar";
import AdminImage from "@/components/AdminImage";
import { getClientPackageImage } from "@/lib/clientImageFallbacks";
import {
  deletePackageGroup,
  getAllPackages,
  savePackageGroup,
} from "@/hooks/usePackage";
import { uploadImage } from "@/hooks/useUpload";
import type IPackage from "@/interfaces/IPackage";
import type IPackageGroupInput from "@/interfaces/IPackageGroupInput";
import type IErrorResponse from "@interfaces/IErrorResponse";
import {
  CheckCircleIcon,
  ClockIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  PhotoIcon,
  PlusIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

const DURATIONS = [60, 90, 120] as const;
type Duration = (typeof DURATIONS)[number];
type PackageType = "service" | "promotion";
type VisibilityFilter = "active" | "hidden" | "all";

const MENU_CATEGORIES = [
  "Thai Massage",
  "Foot Massage",
  "Head, Back & Shoulder Massage",
  "Nourishing Treatment Massage",
  "Traditional Lanna Massage",
  "The Best Massage",
  "Premium Experience",
  "Other",
] as const;

const MENU_ITEM_ORDER = [
  "นวดไทย (thai massage)",
  "นวดไทยใส่ยาหม่อง (thai massage + herbal balm)",
  "นวดไทยใส่น้ำมัน (thai massage + oil)",
  "นวดไทยล้านนา ประคบสมุนไพร (thai lanna massage with herbal compress)",
  "นวดเท้า (foot massage)",
  "นวดเท้าใส่ยาหม่อง (foot massage + herbal balm)",
  "นวดเท้า คอ หัว ไหล่ (foot massage + head + shoulder)",
  "นวดเท้า หลัง ไหล่ ศีรษะ (foot massage + back + head + shoulder)",
  "นวดหลังไหล่ (back + shoulder massage)",
  "นวดศีรษะ หลัง ไหล่ (head, back & shoulder massage)",
  "นวดน้ำมัน (oil massage)",
  "นวดน้ำมันอโรม่า (aroma oil massage)",
  "นวดน้ำมันเซรั่มมะพร้าว (coconut oil serum massage)",
  "ขัดผิวกาย (body scrub)",
  "นวดไทยล้านนา ประคบสมุนไพร พิเศษ (traditional lanna herbal)",
  "นวดน้ำมัน ประคบสมุนไพร (oil massage + herbal compress)",
  "นวดน้ำมันอโรม่า ประคบสมุนไพร (aroma oil + herbal compress)",
  "นวดออฟฟิศซินโดรม (office syndrome massage)",
  "นวดไทยล้านนา ประคบสมุนไพร ชุดสุดคุ้ม (best value lanna herbal)",
  "อบตัว ขัดผิวกาย (thai herbal steam + body scrub)",
  "นวดหินร้อน (hot stone + aroma oil massage)",
];

interface PackageGroup {
  key: string;
  title: string;
  category: string;
  type: PackageType;
  variants: IPackage[];
}

interface PackageFormData {
  type: PackageType;
  category: string;
  title: string;
  description: string;
  prices: Record<Duration, string>;
  enabledDurations: Record<Duration, boolean>;
  pictureUrl: string;
  note: string;
  isActive: boolean;
}

const emptyForm = (): PackageFormData => ({
  type: "service",
  category: MENU_CATEGORIES[0],
  title: "",
  description: "",
  prices: { 60: "", 90: "", 120: "" },
  enabledDurations: { 60: true, 90: true, 120: true },
  pictureUrl: "",
  note: "",
  isActive: true,
});

function baseTitle(title: string) {
  return title.replace(/\s*\(\d+\s*mins?\)\s*$/i, "").trim();
}

function inferCategory(title: string, type: PackageType) {
  const value = baseTitle(title).toLocaleLowerCase();
  if (type === "promotion") return "The Best Massage";
  if (/hot stone|หินร้อน/.test(value)) return "Premium Experience";
  if (/traditional lanna herbal|oil massage \+ herbal compress|aroma oil \+ herbal compress|ประคบสมุนไพร พิเศษ|น้ำมัน ประคบสมุนไพร/.test(value)) {
    return "Traditional Lanna Massage";
  }
  if (/foot massage|นวดเท้า/.test(value)) return "Foot Massage";
  if (/back \+ shoulder massage|head, back & shoulder massage|นวดหลังไหล่|นวดศีรษะ หลัง ไหล่/.test(value)) {
    return "Head, Back & Shoulder Massage";
  }
  if (/oil massage|aroma oil|coconut oil|body scrub|ขัดผิว|นวดน้ำมัน/.test(value)) {
    return "Nourishing Treatment Massage";
  }
  if (/thai massage|นวดไทย|thai lanna/.test(value)) return "Thai Massage";
  return "Other";
}

function buildGroups(packages: IPackage[]): PackageGroup[] {
  const groups = new Map<string, PackageGroup>();
  for (const pkg of packages) {
    const title = baseTitle(pkg.title);
    const category = pkg.category || inferCategory(pkg.title, pkg.type);
    const key = `${category.toLocaleLowerCase()}|${pkg.type}|${title.toLocaleLowerCase()}`;
    const group = groups.get(key) ?? {
      key,
      title,
      category,
      type: pkg.type,
      variants: [],
    };
    group.variants.push(pkg);
    groups.set(key, group);
  }

  return [...groups.values()].map((group) => ({
    ...group,
    variants: [...group.variants].sort((a, b) => a.duration - b.duration),
  }));
}

function groupActive(group: PackageGroup) {
  return group.variants.some((variant) => variant.isActive);
}

function PackageManagement() {
  const [packages, setPackages] = useState<IPackage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | PackageType>("all");
  const [visibilityFilter, setVisibilityFilter] =
    useState<VisibilityFilter>("active");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<PackageGroup | null>(null);
  const [formData, setFormData] = useState<PackageFormData>(emptyForm);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<PackageGroup | null>(null);
  const [notification, setNotification] = useState("");

  const fetchPackages = useCallback(async () => {
    try {
      const result = await getAllPackages(new AbortController().signal);
      if (Array.isArray(result)) {
        setPackages(result);
      } else {
        setNotification(result.message || "Could not load the service menu.");
      }
    } catch {
      setNotification("Could not load the service menu. Check the API connection and try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (active) void fetchPackages();
    });
    return () => {
      active = false;
    };
  }, [fetchPackages]);

  useEffect(() => {
    if (!successMessage && !notification) return;
    const timer = window.setTimeout(() => {
      setSuccessMessage("");
      setNotification("");
    }, 4000);
    return () => window.clearTimeout(timer);
  }, [successMessage, notification]);

  const allGroups = useMemo(() => buildGroups(packages), [packages]);
  const activeVariants = packages.filter((pkg) => pkg.isActive).length;
  const hiddenVariants = packages.length - activeVariants;
  const visibleGroups = useMemo(() => {
    const query = searchTerm.trim().toLocaleLowerCase();
    return allGroups
      .filter((group) => filterType === "all" || group.type === filterType)
      .filter((group) => {
        if (visibilityFilter === "active") return groupActive(group);
        if (visibilityFilter === "hidden") {
          return group.variants.every((variant) => !variant.isActive);
        }
        return true;
      })
      .filter((group) => {
        if (!query) return true;
        return (
          `${group.title} ${group.category} ${group.variants[0]?.description ?? ""}`
            .toLocaleLowerCase()
            .includes(query) ||
          group.variants.some((variant) => String(variant.price).includes(query))
        );
      })
      .sort((a, b) => {
        const categoryDifference =
          MENU_CATEGORIES.indexOf(a.category as (typeof MENU_CATEGORIES)[number]) -
          MENU_CATEGORIES.indexOf(b.category as (typeof MENU_CATEGORIES)[number]);
        if (categoryDifference) return categoryDifference;
        const indexA = MENU_ITEM_ORDER.indexOf(a.title.toLocaleLowerCase());
        const indexB = MENU_ITEM_ORDER.indexOf(b.title.toLocaleLowerCase());
        if (indexA !== -1 || indexB !== -1) {
          if (indexA === -1) return 1;
          if (indexB === -1) return -1;
          if (indexA !== indexB) return indexA - indexB;
        }
        return a.title.localeCompare(b.title, "th");
      });
  }, [allGroups, filterType, searchTerm, visibilityFilter]);

  const openCreate = () => {
    setEditingGroup(null);
    setFormData(emptyForm());
    setSelectedImage(null);
    setImagePreview(null);
    setFormError("");
    setIsModalOpen(true);
  };

  const openEdit = (group: PackageGroup) => {
    const first = group.variants[0];
    const prices: Record<Duration, string> = { 60: "", 90: "", 120: "" };
    const enabledDurations: Record<Duration, boolean> = {
      60: false,
      90: false,
      120: false,
    };
    for (const variant of group.variants) {
      if (DURATIONS.includes(variant.duration as Duration)) {
        const duration = variant.duration as Duration;
        prices[duration] = String(variant.price);
        enabledDurations[duration] = true;
      }
    }
    setEditingGroup(group);
    setFormData({
      type: group.type,
      category: group.category,
      title: group.title,
      description: first.description || "",
      prices,
      enabledDurations,
      pictureUrl: first.pictureUrl || "",
      note: first.note || "",
      isActive: group.variants.some((variant) => variant.isActive),
    });
    setSelectedImage(null);
    setImagePreview(first.pictureUrl || null);
    setFormError("");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (isSaving) return;
    setIsModalOpen(false);
    setEditingGroup(null);
    setFormData(emptyForm());
    setSelectedImage(null);
    setImagePreview(null);
    setFormError("");
  };

  const setField = <K extends keyof PackageFormData>(
    key: K,
    value: PackageFormData[K]
  ) => setFormData((current) => ({ ...current, [key]: value }));

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setFormError("Choose an image file (PNG, JPG, or WebP).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setFormError("Image must be smaller than 5 MB.");
      return;
    }
    setFormError("");
    setSelectedImage(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(String(reader.result || ""));
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");
    const title = baseTitle(formData.title);
    const variants = DURATIONS.filter(
      (duration) => formData.enabledDurations[duration]
    ).map((duration) => ({
      duration,
      price: Number(formData.prices[duration]),
    }));

    if (!title || !formData.description.trim() || !formData.category) {
      setFormError("Add a service name, category, and description.");
      return;
    }
    if (variants.length === 0) {
      setFormError("Select at least one duration and enter its price.");
      return;
    }
    if (variants.some((variant) => !Number.isFinite(variant.price) || variant.price <= 0)) {
      setFormError("Every selected duration needs a price greater than ฿0.");
      return;
    }

    setIsSaving(true);
    try {
      let pictureUrl =
        formData.pictureUrl.trim() ||
        getClientPackageImage(title, formData.category);
      if (selectedImage) pictureUrl = await uploadImage(selectedImage);

      const input: IPackageGroupInput = {
        type: formData.type,
        category: formData.category,
        title,
        description: formData.description.trim(),
        pictureUrl,
        note: formData.note.trim() || null,
        isActive: formData.isActive,
        variants,
      };
      const result = await savePackageGroup(
        editingGroup?.variants[0].id ?? null,
        input,
        new AbortController().signal
      );
      if (!Array.isArray(result)) {
        setFormError(
          (result as IErrorResponse).message ||
            "The menu item could not be saved. Please try again."
        );
        return;
      }

      await fetchPackages();
      setIsModalOpen(false);
      setEditingGroup(null);
      setSelectedImage(null);
      setImagePreview(null);
      setSuccessMessage(
        editingGroup ? "Menu item updated." : "Menu item added to the booking page."
      );
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "The menu item could not be saved. Check the API and try again."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    const group = confirmDelete;
    setIsSaving(true);
    try {
      const result = await deletePackageGroup(
        group.variants[0].id,
        new AbortController().signal
      );
      if ("message" in result && result.message !== "Package group deleted successfully") {
        setNotification(result.message);
      } else {
        await fetchPackages();
        setSuccessMessage("Menu item removed from the booking page.");
      }
    } catch {
      setNotification("Could not remove the menu item. Please try again.");
    } finally {
      setConfirmDelete(null);
      setIsSaving(false);
    }
  };

  const groupsByCategory = MENU_CATEGORIES.map((category) => ({
    category,
    groups: visibleGroups.filter((group) => group.category === category),
  })).filter((section) => section.groups.length > 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavbar />

      {(successMessage || notification) && (
        <div
          role="status"
          className={`fixed right-4 top-20 z-50 flex max-w-md items-center gap-2 rounded-lg px-4 py-3 text-sm shadow-lg ${
            notification ? "bg-red-700 text-white" : "bg-emerald-700 text-white"
          }`}
        >
          {notification ? (
            <ExclamationTriangleIcon className="h-5 w-5 shrink-0" />
          ) : (
            <CheckCircleIcon className="h-5 w-5 shrink-0" />
          )}
          {notification || successMessage}
          <button
            type="button"
            aria-label="Dismiss message"
            onClick={() => {
              setNotification("");
              setSuccessMessage("");
            }}
            className="ml-2 rounded p-1 hover:bg-white/10"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
      )}

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
              Getthawha · Official menu
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-stone-900">
              Service & promotion menu
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-stone-600">
              Manage a menu item once, with its 60, 90, and 120 minute prices together. These prices are the ones customers see when booking.
            </p>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-700 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-800 focus:outline-none focus:ring-2 focus:ring-amber-600 focus:ring-offset-2"
          >
            <PlusIcon className="h-5 w-5" />
            Add menu item
          </button>
        </header>

        <section className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3" aria-label="Menu totals">
          <div className="rounded-xl border border-stone-200 bg-white p-4">
            <p className="text-sm text-stone-500">Menu items shown on booking</p>
            <p className="mt-1 text-2xl font-semibold text-stone-900">
              {allGroups.filter(groupActive).length}
            </p>
          </div>
          <div className="rounded-xl border border-stone-200 bg-white p-4">
            <p className="text-sm text-stone-500">Active duration prices</p>
            <p className="mt-1 text-2xl font-semibold text-stone-900">{activeVariants}</p>
          </div>
          <div className="rounded-xl border border-stone-200 bg-white p-4">
            <p className="text-sm text-stone-500">Hidden duration prices</p>
            <p className="mt-1 text-2xl font-semibold text-stone-900">{hiddenVariants}</p>
          </div>
        </section>

        <section className="mb-6 rounded-xl border border-stone-200 bg-white p-4 sm:p-5" aria-label="Search and filters">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_190px_190px_auto]">
            <label className="relative block">
              <span className="sr-only">Search menu</span>
              <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-400" />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search name, category, or price"
                className="w-full rounded-lg border border-stone-300 py-2.5 pl-10 pr-3 text-sm text-stone-900 outline-none focus:border-amber-700 focus:ring-2 focus:ring-amber-700/20"
              />
            </label>
            <label className="sr-only" htmlFor="type-filter">Filter by type</label>
            <select
              id="type-filter"
              value={filterType}
              onChange={(event) => setFilterType(event.target.value as "all" | PackageType)}
              className="rounded-lg border border-stone-300 px-3 py-2.5 text-sm text-stone-800 outline-none focus:border-amber-700 focus:ring-2 focus:ring-amber-700/20"
            >
              <option value="all">All types</option>
              <option value="service">Services</option>
              <option value="promotion">Promotions</option>
            </select>
            <label className="sr-only" htmlFor="visibility-filter">Filter by visibility</label>
            <select
              id="visibility-filter"
              value={visibilityFilter}
              onChange={(event) => setVisibilityFilter(event.target.value as VisibilityFilter)}
              className="rounded-lg border border-stone-300 px-3 py-2.5 text-sm text-stone-800 outline-none focus:border-amber-700 focus:ring-2 focus:ring-amber-700/20"
            >
              <option value="active">Visible on booking</option>
              <option value="hidden">Hidden from booking</option>
              <option value="all">All menu items</option>
            </select>
            <button
              type="button"
              onClick={() => {
                setIsLoading(true);
                void fetchPackages();
              }}
              disabled={isLoading}
              className="rounded-lg border border-stone-300 px-4 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-50"
            >
              {isLoading ? "Refreshing…" : "Refresh"}
            </button>
          </div>
          <p className="mt-3 text-xs text-stone-500">
            The customer booking page only shows active prices. Hidden prices stay here so you can restore them later.
          </p>
        </section>

        {isLoading ? (
          <div className="rounded-xl border border-stone-200 bg-white py-20 text-center text-sm text-stone-500">
            Loading the official menu…
          </div>
        ) : groupsByCategory.length === 0 ? (
          <div className="rounded-xl border border-stone-200 bg-white px-6 py-16 text-center">
            <PhotoIcon className="mx-auto h-10 w-10 text-stone-400" />
            <h2 className="mt-3 text-lg font-semibold text-stone-900">No menu items found</h2>
            <p className="mt-1 text-sm text-stone-600">Change the filters or add an item with its prices.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {groupsByCategory.map(({ category, groups }) => (
              <section key={category} aria-labelledby={`menu-${category}`}>
                <div className="mb-3 flex items-center gap-3">
                  <h2 id={`menu-${category}`} className="text-sm font-bold uppercase tracking-[0.14em] text-stone-800">
                    {category}
                  </h2>
                  <span className="rounded-full bg-stone-200 px-2.5 py-0.5 text-xs font-medium text-stone-600">
                    {groups.length} {groups.length === 1 ? "item" : "items"}
                  </span>
                  <div className="h-px flex-1 bg-stone-200" />
                </div>
                <div className="grid gap-3 xl:grid-cols-2">
                  {groups.map((group) => {
                    const activeCount = group.variants.filter((variant) => variant.isActive).length;
                    const isFullyActive = activeCount === group.variants.length;
                    const isFullyHidden = activeCount === 0;
                    const primary = group.variants[0];
                    return (
                      <article key={group.key} className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5">
                        <div className="flex flex-col gap-4 sm:flex-row">
                          <div className="flex min-w-0 flex-1 gap-3">
                            <AdminImage
                              src={primary.pictureUrl}
                              fallbackSrc={getClientPackageImage(group.title, group.category)}
                              alt={`${group.title} service`}
                              width={72}
                              height={72}
                              sizes="72px"
                              className="h-[72px] w-[72px] shrink-0 rounded-lg object-cover"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-base font-semibold text-stone-900">{group.title}</h3>
                                <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${group.type === "promotion" ? "bg-rose-50 text-rose-800" : "bg-amber-50 text-amber-900"}`}>
                                  {group.type === "promotion" ? "Promotion" : "Service"}
                                </span>
                                <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${isFullyActive ? "bg-emerald-50 text-emerald-800" : isFullyHidden ? "bg-stone-100 text-stone-600" : "bg-orange-50 text-orange-800"}`}>
                                  {isFullyActive ? "Visible" : isFullyHidden ? "Hidden" : "Partly visible"}
                                </span>
                              </div>
                              <p className="mt-1 line-clamp-2 text-sm text-stone-600">{primary.description}</p>
                            </div>
                          </div>
                          <div className="flex shrink-0 gap-2 sm:self-start">
                            <button
                              type="button"
                              onClick={() => openEdit(group)}
                              aria-label={`Edit ${group.title}`}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
                            >
                              <PencilIcon className="h-4 w-4" /> Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDelete(group)}
                              aria-label={`Delete ${group.title}`}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50"
                            >
                              <TrashIcon className="h-4 w-4" /> Remove
                            </button>
                          </div>
                        </div>

                        <div className="mt-4 grid grid-cols-3 gap-2">
                          {DURATIONS.map((duration) => {
                            const variant = group.variants.find((item) => item.duration === duration);
                            return (
                              <div key={duration} className={`rounded-lg border px-3 py-2 ${variant?.isActive ? "border-amber-200 bg-amber-50/70" : "border-stone-200 bg-stone-50"}`}>
                                <div className="flex items-center gap-1 text-xs text-stone-500">
                                  <ClockIcon className="h-3.5 w-3.5" /> {duration} min
                                </div>
                                {variant ? (
                                  <div className="mt-1 flex items-center gap-1 text-sm font-semibold text-stone-900">
                                    <CurrencyDollarIcon className="h-4 w-4 text-amber-700" />
                                    ฿{Number(variant.price).toLocaleString()}
                                    {!variant.isActive && <span className="ml-1 text-[10px] font-medium text-stone-500">hidden</span>}
                                  </div>
                                ) : (
                                  <p className="mt-1 text-sm text-stone-400">—</p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        {group.variants.length > 3 && (
                          <p className="mt-2 text-xs text-orange-800">
                            This item has extra duration variants. Edit it to move to the standard 60 / 90 / 120 minute menu.
                          </p>
                        )}
                      </article>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/45 p-3 sm:p-6" onMouseDown={(event) => { if (event.target === event.currentTarget) closeModal(); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="package-dialog-title" className="my-auto max-h-[95vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-start justify-between border-b border-stone-200 bg-white px-5 py-4 sm:px-7">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-amber-700">Official menu item</p>
                <h2 id="package-dialog-title" className="mt-1 text-xl font-semibold text-stone-900">
                  {editingGroup ? "Edit menu item" : "Add menu item"}
                </h2>
                <p className="mt-1 text-sm text-stone-500">Set the service once, then enter every available duration price.</p>
              </div>
              <button type="button" onClick={closeModal} aria-label="Close form" className="rounded-lg p-2 text-stone-500 hover:bg-stone-100">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 px-5 py-5 sm:px-7">
              {formError && (
                <div role="alert" className="flex gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
                  <ExclamationTriangleIcon className="h-5 w-5 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-medium text-stone-700">
                  Menu section <span className="text-rose-600">*</span>
                  <select value={formData.category} onChange={(event) => setField("category", event.target.value)} className="mt-1.5 w-full rounded-lg border border-stone-300 px-3 py-2.5 font-normal text-stone-900 outline-none focus:border-amber-700 focus:ring-2 focus:ring-amber-700/20">
                    {MENU_CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
                  </select>
                </label>
                <label className="block text-sm font-medium text-stone-700">
                  Catalog type <span className="text-rose-600">*</span>
                  <select value={formData.type} onChange={(event) => setField("type", event.target.value as PackageType)} className="mt-1.5 w-full rounded-lg border border-stone-300 px-3 py-2.5 font-normal text-stone-900 outline-none focus:border-amber-700 focus:ring-2 focus:ring-amber-700/20">
                    <option value="service">Service</option>
                    <option value="promotion">Promotion</option>
                  </select>
                </label>
              </div>

              <label className="block text-sm font-medium text-stone-700">
                Service or promotion name <span className="text-rose-600">*</span>
                <input value={formData.title} onChange={(event) => setField("title", event.target.value)} placeholder="Example: Thai Massage" className="mt-1.5 w-full rounded-lg border border-stone-300 px-3 py-2.5 font-normal text-stone-900 outline-none focus:border-amber-700 focus:ring-2 focus:ring-amber-700/20" />
                <span className="mt-1 block text-xs font-normal text-stone-500">Enter the name once; the selected duration is added to each price automatically.</span>
              </label>

              <label className="block text-sm font-medium text-stone-700">
                Description <span className="text-rose-600">*</span>
                <textarea value={formData.description} onChange={(event) => setField("description", event.target.value)} rows={3} placeholder="Describe what this treatment includes" className="mt-1.5 w-full resize-y rounded-lg border border-stone-300 px-3 py-2.5 font-normal text-stone-900 outline-none focus:border-amber-700 focus:ring-2 focus:ring-amber-700/20" />
              </label>

              <fieldset>
                <legend className="text-sm font-semibold text-stone-800">Duration and price <span className="font-normal text-stone-500">(THB)</span></legend>
                <div className="mt-2 grid gap-3 sm:grid-cols-3">
                  {DURATIONS.map((duration) => (
                    <div key={duration} className={`rounded-xl border p-3 ${formData.enabledDurations[duration] ? "border-amber-300 bg-amber-50/50" : "border-stone-200 bg-stone-50"}`}>
                      <label className="flex items-center gap-2 text-sm font-medium text-stone-800">
                        <input type="checkbox" checked={formData.enabledDurations[duration]} onChange={(event) => setFormData((current) => ({
                          ...current,
                          enabledDurations: { ...current.enabledDurations, [duration]: event.target.checked },
                        }))} className="h-4 w-4 rounded border-stone-300 accent-amber-700" />
                        {duration} minutes
                      </label>
                      <label className="mt-3 block text-xs font-medium text-stone-500" htmlFor={`price-${duration}`}>Price</label>
                      <div className="mt-1 flex items-center rounded-lg border border-stone-300 bg-white px-3 focus-within:border-amber-700 focus-within:ring-2 focus-within:ring-amber-700/20">
                        <span className="text-sm text-stone-500">฿</span>
                        <input id={`price-${duration}`} type="number" min="0.01" step="0.01" disabled={!formData.enabledDurations[duration]} value={formData.prices[duration]} onChange={(event) => setFormData((current) => ({
                          ...current,
                          prices: { ...current.prices, [duration]: event.target.value },
                        }))} placeholder="0" className="w-full border-0 bg-transparent px-2 py-2 text-sm text-stone-900 outline-none disabled:text-stone-400" />
                      </div>
                    </div>
                  ))}
                </div>
              </fieldset>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-stone-700">Photo <span className="font-normal text-stone-500">(optional)</span></label>
                  <div className="mt-1.5 flex min-h-28 items-center gap-3 rounded-xl border border-dashed border-stone-300 p-3">
                    {imagePreview ? (
                      <AdminImage src={imagePreview} fallbackSrc={getClientPackageImage(editingGroup?.title || formData.title, formData.category)} alt="Menu item preview" width={88} height={72} sizes="88px" className="h-[72px] w-[88px] rounded-lg object-cover" />
                    ) : (
                      <div className="flex h-[72px] w-[88px] items-center justify-center rounded-lg bg-stone-100 text-stone-400"><PhotoIcon className="h-7 w-7" /></div>
                    )}
                    <div className="min-w-0 flex-1">
                      <label className="inline-flex cursor-pointer rounded-lg border border-stone-300 px-3 py-2 text-xs font-medium text-stone-700 hover:bg-stone-50">
                        {imagePreview ? "Replace photo" : "Choose photo"}
                        <input type="file" accept="image/*" onChange={handleImageChange} className="sr-only" />
                      </label>
                      {imagePreview && <button type="button" onClick={() => { setSelectedImage(null); setImagePreview(null); setField("pictureUrl", ""); }} className="ml-2 text-xs font-medium text-rose-700 hover:underline">Remove</button>}
                      <p className="mt-2 text-xs text-stone-500">PNG, JPG, or WebP up to 5 MB.</p>
                    </div>
                  </div>
                </div>

                <label className="block text-sm font-medium text-stone-700">
                  Note <span className="font-normal text-stone-500">(optional)</span>
                  <textarea value={formData.note} onChange={(event) => setField("note", event.target.value)} rows={4} placeholder="Internal or customer-facing note" className="mt-1.5 w-full resize-y rounded-lg border border-stone-300 px-3 py-2.5 font-normal text-stone-900 outline-none focus:border-amber-700 focus:ring-2 focus:ring-amber-700/20" />
                </label>
              </div>

              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-stone-200 bg-stone-50 p-3">
                <input type="checkbox" checked={formData.isActive} onChange={(event) => setField("isActive", event.target.checked)} className="mt-0.5 h-4 w-4 rounded border-stone-300 accent-amber-700" />
                <span>
                  <span className="block text-sm font-semibold text-stone-800">Show this item on the booking page</span>
                  <span className="mt-0.5 block text-xs text-stone-500">Turn this off to hide every duration while keeping the item in admin.</span>
                </span>
              </label>

              <div className="flex flex-col-reverse gap-2 border-t border-stone-200 pt-4 sm:flex-row sm:justify-end">
                <button type="button" onClick={closeModal} disabled={isSaving} className="rounded-lg border border-stone-300 px-4 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-50">Cancel</button>
                <button type="submit" disabled={isSaving} className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-amber-800 disabled:cursor-not-allowed disabled:opacity-60">
                  {isSaving && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
                  {isSaving ? "Saving menu…" : editingGroup ? "Save changes" : "Add to menu"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
          <section role="alertdialog" aria-modal="true" aria-labelledby="delete-title" className="w-full max-w-md rounded-xl bg-white p-5 shadow-2xl">
            <h2 id="delete-title" className="text-lg font-semibold text-stone-900">Remove this menu item?</h2>
            <p className="mt-2 text-sm text-stone-600">
              <strong>{confirmDelete.title}</strong> and all {confirmDelete.variants.length} duration prices will be hidden from new bookings. Existing bookings remain in history.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setConfirmDelete(null)} disabled={isSaving} className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50">Keep item</button>
              <button type="button" onClick={() => void handleDelete()} disabled={isSaving} className="rounded-lg bg-rose-700 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-800 disabled:opacity-60">Remove item</button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default PackageManagement;
