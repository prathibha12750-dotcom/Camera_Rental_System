
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

  // ==========================================
  // LOAD EQUIPMENT AND CATEGORIES
  // ==========================================

  useEffect(() => {
    let cancelled = false;

    const loadInitialData = async () => {
      try {
        const [equipmentResult, categoryResult] =
          await Promise.all([
            getAllEquipment(),
            getAllCategories(),
          ]);

        if (cancelled) return;

        setEquipment(
          equipmentResult?.data?.equipment || []
        );

        setCategories(
          categoryResult?.data?.categories || []
        );
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
    setEquipment(result?.data?.equipment || []);
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

    const itemCategory =
      typeof item.category === "object"
        ? item.category?._id
        : item.category;

    const matchesCategory =
      categoryFilter === "ALL" ||
      itemCategory === categoryFilter;

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
  // PAGINATION AFTER FILTERING
  // ==========================================

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredEquipment.length / EQUIPMENT_PER_PAGE
    )
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
    window.scrollTo({ top: 0, behavior: "smooth" });
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
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
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

    if (!editingId && formData.condition === "DAMAGED") {
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

    // Never send operational status from this form.

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
  // BADGE STYLES
  // ==========================================

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

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* HEADER */}

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
            className="rounded-xl bg-orange-600 px-5 py-3 font-semibold text-white hover:bg-orange-700"
          >
            + Add Equipment
          </button>
        </div>

        {/* SUCCESS */}

        {success && (
          <div
            role="status"
            className="rounded-xl border border-green-200 bg-green-50 p-4 text-green-700"
          >
            ✓ {success}
          </div>
        )}

        {/* ADD / EDIT FORM */}

        {showForm && (
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                {editingId
                  ? "Edit Equipment"
                  : "Add Equipment"}
              </h2>
              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
                className="text-sm font-semibold text-gray-500 hover:text-gray-900"
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
                    minLength={field === "name" ? 2 : undefined}
                    maxLength={field === "name" ? 150 : undefined}
                    placeholder={placeholder}
                    value={formData[field]}
                    onChange={(e) =>
                      updateField(field, e.target.value)
                    }
                    className="rounded-xl border border-gray-300 px-4 py-3"
                  />
                ))}

                <select
                  required
                  value={formData.category}
                  onChange={(e) =>
                    updateField("category", e.target.value)
                  }
                  className="rounded-xl border border-gray-300 px-4 py-3"
                >
                  <option value="">Select Category</option>
                  {categories
                    .filter(
                      (category) =>
                        category.status === "ACTIVE" ||
                        (editingId &&
                          category._id === formData.category)
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

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  placeholder="Rental Price Per Day (LKR)"
                  value={formData.rentalPricePerDay}
                  onChange={(e) =>
                    updateField(
                      "rentalPricePerDay",
                      e.target.value
                    )
                  }
                  className="rounded-xl border border-gray-300 px-4 py-3"
                />

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  placeholder="Security Deposit (LKR)"
                  value={formData.securityDeposit}
                  onChange={(e) =>
                    updateField(
                      "securityDeposit",
                      e.target.value
                    )
                  }
                  className="rounded-xl border border-gray-300 px-4 py-3"
                />

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
                  onChange={(e) =>
                    updateField("condition", e.target.value)
                  }
                  className="rounded-xl border border-gray-300 px-4 py-3 disabled:bg-gray-100"
                >
                  <option value="EXCELLENT">Excellent</option>
                  <option value="GOOD">Good</option>
                  <option value="FAIR">Fair</option>
                  {editingId &&
                    formData.condition === "DAMAGED" && (
                      <option value="DAMAGED">
                        Damaged
                      </option>
                    )}
                </select>

                <textarea
                  maxLength={1000}
                  placeholder="Description"
                  value={formData.description}
                  onChange={(e) =>
                    updateField(
                      "description",
                      e.target.value
                    )
                  }
                  className="min-h-28 rounded-xl border border-gray-300 px-4 py-3 md:col-span-2"
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
                  className="rounded-xl bg-red-50 p-4 text-sm text-red-700"
                >
                  {formError}
                </div>
              )}

              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-orange-600 px-5 py-3 font-semibold text-white hover:bg-orange-700 disabled:opacity-50"
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

        {/* FILTERS */}

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
              className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40"
            >
              Clear Filters
            </button>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">

            <label className="block text-sm font-medium text-gray-700">
              Search Equipment
              <input
                type="search"
                placeholder="Name, brand, model, serial..."
                value={searchTerm}
                onChange={(e) =>
                  updateFilter(
                    setSearchTerm,
                    e.target.value
                  )
                }
                className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm"
              />
            </label>

            <label className="block text-sm font-medium text-gray-700">
              Category
              <select
                value={categoryFilter}
                onChange={(e) =>
                  updateFilter(
                    setCategoryFilter,
                    e.target.value
                  )
                }
                className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm"
              >
                <option value="ALL">All Categories</option>
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

            <label className="block text-sm font-medium text-gray-700">
              Condition
              <select
                value={conditionFilter}
                onChange={(e) =>
                  updateFilter(
                    setConditionFilter,
                    e.target.value
                  )
                }
                className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm"
              >
                <option value="ALL">All Conditions</option>
                <option value="EXCELLENT">Excellent</option>
                <option value="GOOD">Good</option>
                <option value="FAIR">Fair</option>
                <option value="DAMAGED">Damaged</option>
              </select>
            </label>

            <label className="block text-sm font-medium text-gray-700">
              Availability Status
              <select
                value={statusFilter}
                onChange={(e) =>
                  updateFilter(
                    setStatusFilter,
                    e.target.value
                  )
                }
                className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm"
              >
                <option value="ALL">All Statuses</option>
                <option value="AVAILABLE">Available</option>
                <option value="RESERVED">Reserved</option>
                <option value="RENTED">Rented</option>
                <option value="MAINTENANCE">Maintenance</option>
                <option value="DAMAGED">Damaged</option>
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

        {/* LOADING AND ERROR */}

        {loading && (
          <div className="rounded-2xl border bg-white p-8 text-gray-600">
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

        {/* EMPTY RESULTS */}

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
                  className="mt-3 text-sm font-semibold text-orange-600"
                >
                  Clear all filters
                </button>
              )}
            </div>
          )}

        {/* EQUIPMENT TABLE */}

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
                          className="px-6 py-4 text-left text-sm font-semibold text-gray-700"
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
                        className="hover:bg-gray-50"
                      >
                        <td className="px-6 py-4">
                          <p className="font-semibold text-gray-950">
                            {item.name || "Unnamed Equipment"}
                          </p>
                          <p className="mt-1 text-sm text-gray-500">
                            {item.brand || "—"}{" "}
                            {item.model || ""}
                          </p>
                          <p className="mt-1 text-xs text-gray-400">
                            Serial: {item.serialNumber || "—"}
                          </p>
                        </td>

                        <td className="px-6 py-4 text-sm text-gray-700">
                          {item.category?.name || "—"}
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${getConditionClass(
                              item.condition
                            )}`}
                          >
                            {item.condition || "—"}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                              item.status
                            )}`}
                          >
                            {item.status || "—"}
                          </span>
                        </td>

                        <td className="px-6 py-4 font-medium text-gray-900">
                          LKR{" "}
                          {Number(
                            item.rentalPricePerDay || 0
                          ).toLocaleString()}
                        </td>

                        <td className="px-6 py-4 font-medium text-gray-900">
                          LKR{" "}
                          {Number(
                            item.securityDeposit || 0
                          ).toLocaleString()}
                        </td>

                        <td className="px-6 py-4">
                          <button
                            type="button"
                            onClick={() => openEditForm(item)}
                            className="rounded-lg border border-orange-300 px-3 py-2 text-sm font-semibold text-orange-600 hover:bg-orange-50"
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* PAGINATION */}

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
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:opacity-40"
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
                    disabled={safeCurrentPage === totalPages}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:opacity-40"
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
