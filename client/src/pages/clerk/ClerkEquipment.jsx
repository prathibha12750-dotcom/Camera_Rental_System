
import { useEffect, useState } from "react";

import {
  getAllEquipment,
  createEquipment,
  updateEquipment,
} from "../../services/equipmentService";

import { getAllCategories } from "../../services/categoryService";

const EQUIPMENT_PER_PAGE = 8;

const emptyForm = {
  name: "",
  category: "",
  brand: "",
  model: "",
  serialNumber: "",
  rentalPricePerDay: "",
  securityDeposit: "",
  condition: "GOOD",
  description: "",
};

const ClerkEquipment = () => {
  // ==========================================
  // STATE
  // ==========================================

  const [equipment, setEquipment] = useState([]);
  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [currentPage, setCurrentPage] = useState(1);

  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [conditionFilter, setConditionFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ ...emptyForm });
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  // NEW: Equipment details modal
  const [selectedEquipment, setSelectedEquipment] = useState(null);

  // ==========================================
  // LOAD EQUIPMENT AND CATEGORIES
  // ==========================================

  useEffect(() => {
    let cancelled = false;

    const loadInitialData = async () => {
      try {
        const [equipmentResult, categoryResult] = await Promise.all([
          getAllEquipment(),
          getAllCategories(),
        ]);

        if (cancelled) return;

        setEquipment(equipmentResult?.data?.equipment || []);
        setCategories(categoryResult?.data?.categories || []);
      } catch (err) {
        if (!cancelled) {
          setError(
            err.response?.data?.message ||
              "Failed to load equipment."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadInitialData();

    return () => {
      cancelled = true;
    };
  }, []);

  const refreshEquipment = async () => {
    const result = await getAllEquipment();
    const updatedEquipment = result?.data?.equipment || [];

    setEquipment(updatedEquipment);

    // Keep the details modal synchronized after updates.
    setSelectedEquipment((previous) => {
      if (!previous) return null;

      return (
        updatedEquipment.find(
          (item) => item._id === previous._id
        ) || null
      );
    });
  };

  // ==========================================
  // FILTER HELPERS
  // ==========================================

  const updateFilter = (setter, value) => {
    setter(value);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setCategoryFilter("ALL");
    setConditionFilter("ALL");
    setStatusFilter("ALL");
    setCurrentPage(1);
  };

  const hasActiveFilters =
    searchTerm.trim() !== "" ||
    categoryFilter !== "ALL" ||
    conditionFilter !== "ALL" ||
    statusFilter !== "ALL";

  const getCategoryId = (item) =>
    typeof item.category === "object"
      ? item.category?._id
      : item.category;

  const getCategoryName = (item) => {
    if (item.category?.name) {
      return item.category.name;
    }

    const categoryId = getCategoryId(item);

    return (
      categories.find(
        (category) => category._id === categoryId
      )?.name || "Not available"
    );
  };

  const filteredEquipment = equipment.filter((item) => {
    const search = searchTerm.trim().toLowerCase();

    const searchableText = [
      item.name,
      item.brand,
      item.model,
      item.serialNumber,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const matchesSearch =
      !search || searchableText.includes(search);

    const matchesCategory =
      categoryFilter === "ALL" ||
      getCategoryId(item) === categoryFilter;

    const matchesCondition =
      conditionFilter === "ALL" ||
      item.condition === conditionFilter;

    const matchesStatus =
      statusFilter === "ALL" ||
      item.status === statusFilter;

    return (
      matchesSearch &&
      matchesCategory &&
      matchesCondition &&
      matchesStatus
    );
  });

  // ==========================================
  // PAGINATION
  // ==========================================

  const totalPages = Math.max(
    1,
    Math.ceil(filteredEquipment.length / EQUIPMENT_PER_PAGE)
  );

  const safeCurrentPage = Math.min(
    Math.max(currentPage, 1),
    totalPages
  );

  const startIndex =
    (safeCurrentPage - 1) * EQUIPMENT_PER_PAGE;

  const paginatedEquipment = filteredEquipment.slice(
    startIndex,
    startIndex + EQUIPMENT_PER_PAGE
  );

  // ==========================================
  // EQUIPMENT DETAILS MODAL
  // ==========================================

  const openEquipmentDetails = (item) => {
    setSelectedEquipment(item);
  };

  const closeEquipmentDetails = () => {
    setSelectedEquipment(null);
  };

  // Close modal with Escape key.
  useEffect(() => {
    if (!selectedEquipment) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setSelectedEquipment(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedEquipment]);

  // ==========================================
  // FORM HELPERS
  // ==========================================

  const resetForm = () => {
    setFormData({ ...emptyForm });
    setEditingId(null);
    setFormError("");
  };

  const openAddForm = () => {
    resetForm();
    setSuccess("");
    setShowForm(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const openEditForm = (item) => {
    setEditingId(item._id);

    setFormData({
      name: item.name || "",
      category:
        item.category?._id || item.category || "",
      brand: item.brand || "",
      model: item.model || "",
      serialNumber: item.serialNumber || "",
      rentalPricePerDay:
        item.rentalPricePerDay ?? "",
      securityDeposit: item.securityDeposit ?? "",
      condition: item.condition || "GOOD",
      description: item.description || "",
    });

    setFormError("");
    setSuccess("");

    // Close details modal before opening the form.
    setSelectedEquipment(null);
    setShowForm(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const closeForm = () => {
    resetForm();
    setShowForm(false);
  };

  const updateField = (field, value) => {
    setFormData((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  // ==========================================
  // SAVE EQUIPMENT
  // ==========================================

  const handleSave = async (event) => {
    event.preventDefault();

    if (saving) return;

    setFormError("");
    setSuccess("");

    const requiredFields = [
      "name",
      "category",
      "brand",
      "model",
      "serialNumber",
      "rentalPricePerDay",
      "securityDeposit",
    ];

    if (
      requiredFields.some(
        (field) =>
          String(formData[field] ?? "").trim() === ""
      )
    ) {
      setFormError("Please fill in all required fields.");
      return;
    }

    const rentalPrice = Number(
      formData.rentalPricePerDay
    );

    const deposit = Number(formData.securityDeposit);

    if (
      !Number.isFinite(rentalPrice) ||
      !Number.isFinite(deposit) ||
      rentalPrice < 0 ||
      deposit < 0
    ) {
      setFormError(
        "Rental price and security deposit must be valid non-negative numbers."
      );
      return;
    }

    if (
      !editingId &&
      formData.condition === "DAMAGED"
    ) {
      setFormError(
        "Record damage through the Damage & Maintenance workflow."
      );
      return;
    }

    const payload = {
      ...formData,
      rentalPricePerDay: rentalPrice,
      securityDeposit: deposit,
    };

    // Do not send operational availability status.
    // Rental, return, damage, and maintenance
    // workflows control equipment status.

    try {
      setSaving(true);

      if (editingId) {
        await updateEquipment(editingId, payload);
      } else {
        await createEquipment(payload);
      }

      await refreshEquipment();

      setSuccess(
        editingId
          ? "Equipment updated successfully."
          : "Equipment added successfully."
      );

      closeForm();
      setCurrentPage(1);
    } catch (err) {
      setFormError(
        err.response?.data?.message ||
          "Unable to save equipment."
      );
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // DISPLAY HELPERS
  // ==========================================

  const formatMoney = (amount) => {
    if (
      amount === null ||
      amount === undefined ||
      amount === ""
    ) {
      return "Not available";
    }

    const value = Number(amount);

    if (!Number.isFinite(value)) {
      return "Not available";
    }

    return `LKR ${value.toLocaleString("en-LK", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDate = (date) => {
    if (!date) return "Not available";

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return "Not available";
    }

    return parsed.toLocaleDateString("en-GB", {
      timeZone: "Asia/Colombo",
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "AVAILABLE":
        return "bg-green-100 text-green-800";
      case "RESERVED":
        return "bg-blue-100 text-blue-800";
      case "RENTED":
        return "bg-orange-100 text-orange-800";
      case "MAINTENANCE":
        return "bg-yellow-100 text-yellow-800";
      case "DAMAGED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getConditionClass = (condition) => {
    switch (condition) {
      case "EXCELLENT":
        return "bg-green-100 text-green-800";
      case "GOOD":
        return "bg-blue-100 text-blue-800";
      case "FAIR":
        return "bg-yellow-100 text-yellow-800";
      case "DAMAGED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const detailField = (label, value) => (
    <div className="min-w-0 rounded-xl border border-gray-100 bg-gray-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </p>

      <p className="mt-2 break-words text-sm font-semibold text-gray-900">
        {value === null ||
        value === undefined ||
        value === ""
          ? "Not available"
          : value}
      </p>
    </div>
  );

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-gray-50 px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* ======================================
            EQUIPMENT DETAILS MODAL
        ====================================== */}

        {selectedEquipment && (
          <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-950/60 p-3 backdrop-blur-sm sm:p-6"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                closeEquipmentDetails();
              }
            }}
          >
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="equipment-details-title"
              className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
            >
              {/* MODAL HEADER */}

              <div className="flex items-start justify-between gap-4 border-b border-gray-200 px-5 py-5 sm:px-7">
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-widest text-orange-600">
                    Equipment Information
                  </p>

                  <h2
                    id="equipment-details-title"
                    className="mt-2 break-words text-2xl font-bold text-gray-950"
                  >
                    {selectedEquipment.name ||
                      "Unnamed Equipment"}
                  </h2>

                  <p className="mt-2 break-words text-sm text-gray-500">
                    {[
                      selectedEquipment.brand,
                      selectedEquipment.model,
                    ]
                      .filter(Boolean)
                      .join(" ") || "Equipment details"}
                  </p>

                  <p className="mt-1 break-all text-xs text-gray-400">
                    Serial Number:{" "}
                    {selectedEquipment.serialNumber || "—"}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeEquipmentDetails}
                  aria-label="Close equipment details"
                  className="shrink-0 rounded-xl p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* SCROLLABLE MODAL CONTENT */}

              <div className="space-y-6 overflow-y-auto px-5 py-6 sm:px-7">

                {/* STATUS OVERVIEW */}

                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className={`inline-flex rounded-full px-3 py-1.5 text-xs font-bold ${
                      getStatusClass(selectedEquipment.status)
                    }`}
                  >
                    {selectedEquipment.status || "UNKNOWN"}
                  </span>

                  <span
                    className={`inline-flex rounded-full px-3 py-1.5 text-xs font-bold ${
                      getConditionClass(
                        selectedEquipment.condition
                      )
                    }`}
                  >
                    Condition:{" "}
                    {selectedEquipment.condition || "Unknown"}
                  </span>
                </div>

                {/* BASIC DETAILS */}

                <section>
                  <h3 className="mb-3 text-base font-bold text-gray-950">
                    General Information
                  </h3>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {detailField(
                      "Equipment Name",
                      selectedEquipment.name
                    )}

                    {detailField(
                      "Category",
                      getCategoryName(selectedEquipment)
                    )}

                    {detailField(
                      "Brand",
                      selectedEquipment.brand
                    )}

                    {detailField(
                      "Model",
                      selectedEquipment.model
                    )}

                    {detailField(
                      "Serial Number",
                      selectedEquipment.serialNumber
                    )}

                    {detailField(
                      "Availability Status",
                      selectedEquipment.status
                    )}
                  </div>
                </section>

                {/* RENTAL PRICING */}

                <section>
                  <h3 className="mb-3 text-base font-bold text-gray-950">
                    Rental Pricing
                  </h3>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-orange-100 bg-orange-50 p-5">
                      <p className="text-xs font-semibold uppercase tracking-wide text-orange-700">
                        Rental Price Per Day
                      </p>

                      <p className="mt-2 text-xl font-extrabold text-gray-950">
                        {formatMoney(
                          selectedEquipment.rentalPricePerDay
                        )}
                      </p>
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                        Security Deposit
                      </p>

                      <p className="mt-2 text-xl font-extrabold text-gray-950">
                        {formatMoney(
                          selectedEquipment.securityDeposit
                        )}
                      </p>
                    </div>
                  </div>
                </section>

                {/* EQUIPMENT DESCRIPTION */}

                <section>
                  <h3 className="mb-3 text-base font-bold text-gray-950">
                    Equipment Description
                  </h3>

                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
                    {selectedEquipment.description?.trim() ? (
                      <p className="whitespace-pre-wrap break-words text-sm leading-7 text-gray-700">
                        {selectedEquipment.description}
                      </p>
                    ) : (
                      <p className="text-sm italic text-gray-500">
                        No description has been added for this equipment.
                      </p>
                    )}
                  </div>
                </section>

                {/* RECORD INFORMATION */}

                <section>
                  <h3 className="mb-3 text-base font-bold text-gray-950">
                    Record Information
                  </h3>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {detailField(
                      "Created Date",
                      formatDate(selectedEquipment.createdAt)
                    )}

                    {detailField(
                      "Last Updated",
                      formatDate(selectedEquipment.updatedAt)
                    )}
                  </div>
                </section>

                <p className="text-xs leading-relaxed text-gray-500">
                  Equipment availability is managed through rental,
                  return, damage, and maintenance workflows.
                </p>
              </div>

              {/* MODAL FOOTER */}

              <div className="flex flex-wrap items-center justify-end gap-3 border-t border-gray-200 bg-gray-50 px-5 py-4 sm:px-7">
                <button
                  type="button"
                  onClick={closeEquipmentDetails}
                  className="rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
                >
                  Close
                </button>

                <button
                  type="button"
                  onClick={() =>
                    openEditForm(selectedEquipment)
                  }
                  className="rounded-xl bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-700"
                >
                  Edit Equipment
                </button>
              </div>
            </section>
          </div>
        )}

        {/* ======================================
            PAGE HEADER
        ====================================== */}

        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-orange-600">
              Clerk
            </p>

            <h1 className="mt-2 text-3xl font-bold text-gray-950">
              Equipment Status
            </h1>

            <p className="mt-2 text-gray-600">
              Manage equipment details and monitor rental
              availability.
            </p>
          </div>

          <button
            type="button"
            onClick={openAddForm}
            className="rounded-xl bg-orange-600 px-5 py-3 font-semibold text-white transition hover:bg-orange-700"
          >
            + Add Equipment
          </button>
        </div>

        {/* SUCCESS MESSAGE */}

        {success && (
          <div
            role="status"
            className="rounded-xl border border-green-200 bg-green-50 p-4 text-green-700"
          >
            ✓ {success}
          </div>
        )}

        {/* ======================================
            ADD / EDIT EQUIPMENT FORM
        ====================================== */}

        {showForm && (
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-semibold text-gray-950">
                {editingId
                  ? "Edit Equipment"
                  : "Add Equipment"}
              </h2>

              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
                className="text-sm font-semibold text-gray-500 hover:text-gray-900 disabled:opacity-50"
              >
                Close
              </button>
            </div>

            <form
              onSubmit={handleSave}
              className="mt-6 space-y-5"
            >
              <div className="grid gap-4 md:grid-cols-2">
                {[
                  ["name", "Equipment Name"],
                  ["brand", "Brand"],
                  ["model", "Model"],
                  ["serialNumber", "Serial Number"],
                ].map(([field, placeholder]) => (
                  <input
                    key={field}
                    type="text"
                    required
                    minLength={
                      field === "name" ? 2 : undefined
                    }
                    maxLength={
                      field === "name" ? 150 : undefined
                    }
                    placeholder={placeholder}
                    value={formData[field]}
                    onChange={(event) =>
                      updateField(
                        field,
                        event.target.value
                      )
                    }
                    className="rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                  />
                ))}

                {/* CATEGORY */}

                <select
                  required
                  value={formData.category}
                  onChange={(event) =>
                    updateField(
                      "category",
                      event.target.value
                    )
                  }
                  className="rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-orange-500"
                >
                  <option value="">
                    Select Category
                  </option>

                  {categories
                    .filter(
                      (category) =>
                        category.status === "ACTIVE" ||
                        (editingId &&
                          category._id ===
                            formData.category)
                    )
                    .map((category) => (
                      <option
                        key={category._id}
                        value={category._id}
                      >
                        {category.name}
                      </option>
                    ))}
                </select>

                {/* RENTAL PRICE */}

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  placeholder="Rental Price Per Day (LKR)"
                  value={formData.rentalPricePerDay}
                  onChange={(event) =>
                    updateField(
                      "rentalPricePerDay",
                      event.target.value
                    )
                  }
                  className="rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-orange-500"
                />

                {/* SECURITY DEPOSIT */}

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  placeholder="Security Deposit (LKR)"
                  value={formData.securityDeposit}
                  onChange={(event) =>
                    updateField(
                      "securityDeposit",
                      event.target.value
                    )
                  }
                  className="rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-orange-500"
                />

                {/* CONDITION */}

                <select
                  value={formData.condition}
                  disabled={
                    Boolean(editingId) &&
                    equipment.some(
                      (item) =>
                        item._id === editingId &&
                        ["DAMAGED", "MAINTENANCE"].includes(
                          item.status
                        )
                    )
                  }
                  onChange={(event) =>
                    updateField(
                      "condition",
                      event.target.value
                    )
                  }
                  className="rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-orange-500 disabled:bg-gray-100"
                >
                  <option value="EXCELLENT">
                    Excellent
                  </option>
                  <option value="GOOD">
                    Good
                  </option>
                  <option value="FAIR">
                    Fair
                  </option>

                  {editingId &&
                    formData.condition === "DAMAGED" && (
                      <option value="DAMAGED">
                        Damaged
                      </option>
                    )}
                </select>

                {/* DESCRIPTION */}

                <textarea
                  maxLength={1000}
                  placeholder="Description"
                  value={formData.description}
                  onChange={(event) =>
                    updateField(
                      "description",
                      event.target.value
                    )
                  }
                  className="min-h-28 rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-orange-500 md:col-span-2"
                />
              </div>

              <p className="text-sm text-gray-500">
                Availability status is controlled through
                rental, return, damage, and maintenance
                workflows.
              </p>

              {formError && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                >
                  {formError}
                </div>
              )}

              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-orange-600 px-5 py-3 font-semibold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? "Saving..."
                  : editingId
                    ? "Update Equipment"
                    : "Save Equipment"}
              </button>
            </form>
          </section>
        )}

        {/* ======================================
            FILTER EQUIPMENT
        ====================================== */}

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-950">
                Filter Equipment
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Find equipment by details, category,
                condition, or availability.
              </p>
            </div>

            <button
              type="button"
              onClick={clearFilters}
              disabled={!hasActiveFilters}
              className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-40"
            >
              Clear Filters
            </button>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">

            {/* SEARCH */}

            <label className="block text-sm font-medium text-gray-700">
              Search Equipment

              <input
                type="search"
                placeholder="Name, brand, model, serial..."
                value={searchTerm}
                onChange={(event) =>
                  updateFilter(
                    setSearchTerm,
                    event.target.value
                  )
                }
                className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-orange-500"
              />
            </label>

            {/* CATEGORY */}

            <label className="block text-sm font-medium text-gray-700">
              Category

              <select
                value={categoryFilter}
                onChange={(event) =>
                  updateFilter(
                    setCategoryFilter,
                    event.target.value
                  )
                }
                className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-orange-500"
              >
                <option value="ALL">
                  All Categories
                </option>

                {categories.map((category) => (
                  <option
                    key={category._id}
                    value={category._id}
                  >
                    {category.name}
                  </option>
                ))}
              </select>
            </label>

            {/* CONDITION */}

            <label className="block text-sm font-medium text-gray-700">
              Condition

              <select
                value={conditionFilter}
                onChange={(event) =>
                  updateFilter(
                    setConditionFilter,
                    event.target.value
                  )
                }
                className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-orange-500"
              >
                <option value="ALL">
                  All Conditions
                </option>
                <option value="EXCELLENT">
                  Excellent
                </option>
                <option value="GOOD">
                  Good
                </option>
                <option value="FAIR">
                  Fair
                </option>
                <option value="DAMAGED">
                  Damaged
                </option>
              </select>
            </label>

            {/* AVAILABILITY */}

            <label className="block text-sm font-medium text-gray-700">
              Availability Status

              <select
                value={statusFilter}
                onChange={(event) =>
                  updateFilter(
                    setStatusFilter,
                    event.target.value
                  )
                }
                className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-orange-500"
              >
                <option value="ALL">
                  All Statuses
                </option>
                <option value="AVAILABLE">
                  Available
                </option>
                <option value="RESERVED">
                  Reserved
                </option>
                <option value="RENTED">
                  Rented
                </option>
                <option value="MAINTENANCE">
                  Maintenance
                </option>
                <option value="DAMAGED">
                  Damaged
                </option>
              </select>
            </label>
          </div>

          {!loading && (
            <p className="mt-4 text-sm text-gray-500">
              {hasActiveFilters
                ? `${filteredEquipment.length} matching equipment item(s) out of ${equipment.length}.`
                : `${equipment.length} total equipment item(s).`}
            </p>
          )}
        </section>

        {/* ======================================
            LOADING / ERROR / EMPTY STATE
        ====================================== */}

        {loading && (
          <div className="rounded-2xl border border-gray-200 bg-white p-8 text-gray-600">
            Loading equipment...
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700"
          >
            {error}
          </div>
        )}

        {!loading &&
          !error &&
          filteredEquipment.length === 0 && (
            <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center">
              <p className="font-semibold text-gray-800">
                {hasActiveFilters
                  ? "No matching equipment found"
                  : "No equipment found"}
              </p>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-3 text-sm font-semibold text-orange-600 hover:text-orange-700"
                >
                  Clear all filters
                </button>
              )}
            </div>
          )}

        {/* ======================================
            EQUIPMENT TABLE
        ====================================== */}

        {!loading &&
          !error &&
          filteredEquipment.length > 0 && (
            <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {[
                        "Equipment",
                        "Category",
                        "Condition",
                        "Status",
                        "Price / Day",
                        "Security Deposit",
                        "Actions",
                      ].map((heading) => (
                        <th
                          key={heading}
                          className="px-5 py-4 text-left text-sm font-semibold text-gray-700"
                        >
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100">
                    {paginatedEquipment.map((item) => (
                      <tr
                        key={item._id}
                        onClick={() =>
                          openEquipmentDetails(item)
                        }
                        className="cursor-pointer transition hover:bg-orange-50/50"
                      >

                        {/* EQUIPMENT NAME */}

                        <td className="px-5 py-4">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              openEquipmentDetails(item);
                            }}
                            className="text-left font-semibold text-gray-950 transition hover:text-orange-600 hover:underline focus-visible:rounded focus-visible:outline-2 focus-visible:outline-orange-500"
                          >
                            {item.name ||
                              "Unnamed Equipment"}
                          </button>

                          <p className="mt-1 text-sm text-gray-500">
                            {item.brand || "—"}{" "}
                            {item.model || ""}
                          </p>

                          <p className="mt-1 text-xs text-gray-400">
                            Serial:{" "}
                            {item.serialNumber || "—"}
                          </p>
                        </td>

                        {/* CATEGORY */}

                        <td className="px-5 py-4 text-sm text-gray-700">
                          {getCategoryName(item)}
                        </td>

                        {/* CONDITION */}

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getConditionClass(
                              item.condition
                            )}`}
                          >
                            {item.condition || "—"}
                          </span>
                        </td>

                        {/* AVAILABILITY */}

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                              item.status
                            )}`}
                          >
                            {item.status || "—"}
                          </span>
                        </td>

                        {/* DAILY PRICE */}

                        <td className="px-5 py-4 text-sm font-semibold text-gray-900">
                          {formatMoney(
                            item.rentalPricePerDay
                          )}
                        </td>

                        {/* SECURITY DEPOSIT */}

                        <td className="px-5 py-4 text-sm font-semibold text-gray-900">
                          {formatMoney(
                            item.securityDeposit
                          )}
                        </td>

                        {/* ACTIONS */}

                        <td className="px-5 py-4">
                          <div className="flex flex-wrap items-center gap-2">

                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                openEquipmentDetails(item);
                              }}
                              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700"
                            >
                              View
                            </button>

                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                openEditForm(item);
                              }}
                              className="rounded-lg border border-orange-300 bg-white px-3 py-2 text-xs font-semibold text-orange-600 transition hover:bg-orange-50"
                            >
                              Edit
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* ==================================
                  PAGINATION
              ================================== */}

              <div className="flex flex-col gap-3 border-t border-gray-200 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-gray-500">
                  Showing {startIndex + 1}–
                  {Math.min(
                    startIndex + EQUIPMENT_PER_PAGE,
                    filteredEquipment.length
                  )}{" "}
                  of {filteredEquipment.length} equipment items
                </p>

                <div className="flex items-center gap-2">

                  <button
                    type="button"
                    onClick={() =>
                      setCurrentPage((page) =>
                        Math.max(
                          Math.min(page, totalPages) - 1,
                          1
                        )
                      )
                    }
                    disabled={safeCurrentPage === 1}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Previous
                  </button>

                  <span className="px-2 text-sm text-gray-600">
                    Page {safeCurrentPage} of {totalPages}
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      setCurrentPage((page) =>
                        Math.min(page + 1, totalPages)
                      )
                    }
                    disabled={
                      safeCurrentPage === totalPages
                    }
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            </section>
          )}
      </div>
    </main>
  );
};

export default ClerkEquipment;
