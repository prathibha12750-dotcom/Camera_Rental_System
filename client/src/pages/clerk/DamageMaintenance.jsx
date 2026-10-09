
import { useEffect, useState } from "react";

import {
  getAllDamageRecords,
  updateDamageRecordStatus,
} from "../../services/rentalService";

const RECORDS_PER_PAGE = 8;

const DamageMaintenance = () => {
  // ==========================================
  // STATE
  // ==========================================

  const [damageRecords, setDamageRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [currentPage, setCurrentPage] = useState(1);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // ==========================================
  // LOAD DAMAGE RECORDS
  // ==========================================

  useEffect(() => {
    let cancelled = false;

    const loadDamageRecords = async () => {
      try {
        const result = await getAllDamageRecords();

        if (!cancelled) {
          setDamageRecords(
            result?.data?.damageRecords || []
          );
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.response?.data?.message ||
              "Failed to load damage records"
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadDamageRecords();

    return () => {
      cancelled = true;
    };
  }, []);

  // ==========================================
  // REFRESH DAMAGE RECORDS
  // ==========================================

  const refreshDamageRecords = async () => {
    const result = await getAllDamageRecords();

    setDamageRecords(
      result?.data?.damageRecords || []
    );
  };

  // ==========================================
  // UPDATE DAMAGE STATUS
  // ==========================================

  const handleDamageStatusUpdate = async (
    damageRecord,
    newStatus
  ) => {
    const confirmed = window.confirm(
      `Change damage status to ${newStatus.replaceAll(
        "_",
        " "
      )}?`
    );

    if (!confirmed) return;

    try {
      setActionLoading(damageRecord._id);
      setError("");
      setSuccess("");

      await updateDamageRecordStatus(
        damageRecord._id,
        newStatus
      );

      await refreshDamageRecords();

      setSuccess(
        `Damage record updated to ${newStatus.replaceAll(
          "_",
          " "
        )}.`
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to update damage status"
      );
    } finally {
      setActionLoading(null);
    }
  };

  // ==========================================
  // DATE FORMATTING
  // ==========================================

  const formatDate = (date) => {
    if (!date) return "—";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "—";
    }

    return parsedDate.toLocaleDateString("en-GB", {
      timeZone: "Asia/Colombo",
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Use the same timezone for date filtering.
  const getLocalDateKey = (date) => {
    if (!date) return "";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "";
    }

    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Colombo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(parsedDate);

    const getPart = (type) =>
      parts.find((part) => part.type === type)?.value || "";

    return `${getPart("year")}-${getPart("month")}-${getPart("day")}`;
  };

  // ==========================================
  // STATUS BADGE STYLES
  // ==========================================

  const getDamageStatusClass = (status) => {
    switch (status) {
      case "REPORTED":
        return "bg-red-100 text-red-800";

      case "UNDER_INSPECTION":
        return "bg-yellow-100 text-yellow-800";

      case "MAINTENANCE":
        return "bg-orange-100 text-orange-800";

      case "RESOLVED":
        return "bg-green-100 text-green-800";

      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  // ==========================================
  // FILTER DAMAGE RECORDS
  // ==========================================

  const filteredDamageRecords = damageRecords.filter(
    (record) => {
      const search = searchTerm.trim().toLowerCase();

      const searchableText = [
        record.equipment?.name,
        record.equipment?.brand,
        record.equipment?.model,
        record.equipment?.serialNumber,
        record.customer?.name,
        record.customer?.email,
        record.description,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !search || searchableText.includes(search);

      const matchesStatus =
        statusFilter === "ALL" ||
        record.status === statusFilter;

      const reportedDate = getLocalDateKey(
        record.createdAt
      );

      const matchesFrom =
        !dateFrom ||
        (reportedDate !== "" &&
          reportedDate >= dateFrom);

      const matchesTo =
        !dateTo ||
        (reportedDate !== "" &&
          reportedDate <= dateTo);

      return (
        matchesSearch &&
        matchesStatus &&
        matchesFrom &&
        matchesTo
      );
    }
  );

  // ==========================================
  // PAGINATION
  // ==========================================

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredDamageRecords.length / RECORDS_PER_PAGE
    )
  );

  const safeCurrentPage = Math.min(
    Math.max(currentPage, 1),
    totalPages
  );

  const startIndex =
    (safeCurrentPage - 1) * RECORDS_PER_PAGE;

  const paginatedDamageRecords =
    filteredDamageRecords.slice(
      startIndex,
      startIndex + RECORDS_PER_PAGE
    );

  // ==========================================
  // FILTER HELPERS
  // ==========================================

  const updateFilter = (setter, value) => {
    setter(value);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("ALL");
    setDateFrom("");
    setDateTo("");
    setCurrentPage(1);
  };

  const hasActiveFilters =
    searchTerm.trim() !== "" ||
    statusFilter !== "ALL" ||
    dateFrom !== "" ||
    dateTo !== "";

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-7xl">

        {/* PAGE HEADER */}

        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-orange-600">
            Clerk
          </p>

          <h1 className="mt-2 text-3xl font-bold text-gray-950">
            Damage &amp; Maintenance
          </h1>

          <p className="mt-2 max-w-3xl text-gray-600">
            Review equipment damage reported during rental
            returns and manage the inspection, maintenance,
            and resolution process.
          </p>
        </div>

        {/* ERROR MESSAGE */}

        {error && (
          <div
            role="alert"
            className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700"
          >
            {error}
          </div>
        )}

        {/* SUCCESS MESSAGE */}

        {success && (
          <div
            role="status"
            className="mt-6 rounded-xl border border-green-200 bg-green-50 p-4 font-medium text-green-700"
          >
            ✓ {success}
          </div>
        )}

        {/* DAMAGE RECORDS SECTION */}

        <section className="mt-8 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

          {/* SECTION HEADER */}

          <div className="border-b border-gray-200 px-6 py-5">
            <h2 className="text-xl font-semibold text-gray-950">
              Damage Records
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Track damaged equipment from initial report
              through maintenance and resolution.
            </p>
          </div>

          {/* FILTERS */}

          <div className="border-b border-gray-200 bg-gray-50/50 px-6 py-5">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">

              {/* SEARCH */}

              <div className="xl:col-span-1">
                <label
                  htmlFor="damage-search"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Search
                </label>

                <input
                  id="damage-search"
                  type="search"
                  placeholder="Equipment or customer..."
                  value={searchTerm}
                  onChange={(event) =>
                    updateFilter(
                      setSearchTerm,
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-orange-500"
                />
              </div>

              {/* STATUS FILTER */}

              <div>
                <label
                  htmlFor="damage-status"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Damage Status
                </label>

                <select
                  id="damage-status"
                  value={statusFilter}
                  onChange={(event) =>
                    updateFilter(
                      setStatusFilter,
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-orange-500"
                >
                  <option value="ALL">
                    All Statuses
                  </option>
                  <option value="REPORTED">
                    Reported
                  </option>
                  <option value="UNDER_INSPECTION">
                    Under Inspection
                  </option>
                  <option value="MAINTENANCE">
                    Maintenance
                  </option>
                  <option value="RESOLVED">
                    Resolved
                  </option>
                </select>
              </div>

              {/* FROM DATE */}

              <div>
                <label
                  htmlFor="damage-date-from"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Reported From
                </label>

                <input
                  id="damage-date-from"
                  type="date"
                  value={dateFrom}
                  max={dateTo || undefined}
                  onChange={(event) =>
                    updateFilter(
                      setDateFrom,
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-orange-500"
                />
              </div>

              {/* TO DATE */}

              <div>
                <label
                  htmlFor="damage-date-to"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Reported To
                </label>

                <input
                  id="damage-date-to"
                  type="date"
                  value={dateTo}
                  min={dateFrom || undefined}
                  onChange={(event) =>
                    updateFilter(
                      setDateTo,
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-orange-500"
                />
              </div>

              {/* CLEAR FILTERS */}

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={clearFilters}
                  disabled={!hasActiveFilters}
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Clear Filters
                </button>
              </div>
            </div>

            {/* FILTER RESULTS SUMMARY */}

            {!loading && (
              <p className="mt-4 text-sm text-gray-500">
                {hasActiveFilters
                  ? `Found ${filteredDamageRecords.length} matching record(s) out of ${damageRecords.length}.`
                  : `${damageRecords.length} total damage record(s).`}
              </p>
            )}
          </div>

          {/* LOADING */}

          {loading ? (
            <p className="p-6 text-gray-600">
              Loading damage records...
            </p>
          ) : filteredDamageRecords.length === 0 ? (

            /* EMPTY STATE */

            <div className="p-10 text-center">
              <p className="font-medium text-gray-700">
                {hasActiveFilters
                  ? "No matching damage records"
                  : "No damage records found"}
              </p>

              <p className="mt-1 text-sm text-gray-500">
                {hasActiveFilters
                  ? "Try adjusting your search or filters."
                  : "Damage reported during equipment returns will appear here."}
              </p>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-4 text-sm font-semibold text-orange-600 hover:text-orange-700"
                >
                  Clear all filters
                </button>
              )}
            </div>
          ) : (
            <>
              {/* DAMAGE RECORDS TABLE */}

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                        Equipment
                      </th>

                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                        Customer
                      </th>

                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                        Damage
                      </th>

                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                        Status
                      </th>

                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                        Reported
                      </th>

                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100">
                    {paginatedDamageRecords.map((record) => (
                      <tr
                        key={record._id}
                        className="transition hover:bg-gray-50/70"
                      >

                        {/* EQUIPMENT */}

                        <td className="px-6 py-4">
                          <p className="font-semibold text-gray-950">
                            {record.equipment?.name ||
                              "Unknown Equipment"}
                          </p>

                          <p className="text-sm text-gray-500">
                            {record.equipment?.brand}{" "}
                            {record.equipment?.model}
                          </p>
                        </td>

                        {/* CUSTOMER */}

                        <td className="px-6 py-4">
                          <p className="font-medium text-gray-900">
                            {record.customer?.name || "—"}
                          </p>

                          <p className="text-sm text-gray-500">
                            {record.customer?.email || "—"}
                          </p>
                        </td>

                        {/* DAMAGE DESCRIPTION */}

                        <td className="max-w-xs px-6 py-4 text-sm text-gray-700">
                          {record.description || "—"}
                        </td>

                        {/* STATUS */}

                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getDamageStatusClass(
                              record.status
                            )}`}
                          >
                            {(record.status || "UNKNOWN").replaceAll(
                              "_",
                              " "
                            )}
                          </span>
                        </td>

                        {/* REPORTED DATE */}

                        <td className="px-6 py-4 text-sm text-gray-600">
                          {formatDate(record.createdAt)}
                        </td>

                        {/* ACTIONS */}

                        <td className="px-6 py-4">

                          {/* REPORTED */}

                          {record.status === "REPORTED" && (
                            <button
                              type="button"
                              onClick={() =>
                                handleDamageStatusUpdate(
                                  record,
                                  "UNDER_INSPECTION"
                                )
                              }
                              disabled={
                                actionLoading !== null
                              }
                              className="rounded-lg bg-orange-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {actionLoading === record._id
                                ? "Updating..."
                                : "Start Inspection"}
                            </button>
                          )}

                          {/* UNDER INSPECTION */}

                          {record.status ===
                            "UNDER_INSPECTION" && (
                            <button
                              type="button"
                              onClick={() =>
                                handleDamageStatusUpdate(
                                  record,
                                  "MAINTENANCE"
                                )
                              }
                              disabled={
                                actionLoading !== null
                              }
                              className="rounded-lg bg-orange-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {actionLoading === record._id
                                ? "Updating..."
                                : "Send to Maintenance"}
                            </button>
                          )}

                          {/* MAINTENANCE */}

                          {record.status === "MAINTENANCE" && (
                            <button
                              type="button"
                              onClick={() =>
                                handleDamageStatusUpdate(
                                  record,
                                  "RESOLVED"
                                )
                              }
                              disabled={
                                actionLoading !== null
                              }
                              className="rounded-lg bg-orange-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {actionLoading === record._id
                                ? "Updating..."
                                : "Mark Resolved"}
                            </button>
                          )}

                          {/* RESOLVED */}

                          {record.status === "RESOLVED" && (
                            <span className="text-sm font-medium text-green-600">
                              Resolved ✓
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* PAGINATION */}

              <div className="flex flex-col gap-3 border-t border-gray-200 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">

                <p className="text-sm text-gray-500">
                  Showing{" "}
                  <span className="font-medium text-gray-700">
                    {startIndex + 1}
                  </span>
                  {" – "}
                  <span className="font-medium text-gray-700">
                    {Math.min(
                      startIndex + RECORDS_PER_PAGE,
                      filteredDamageRecords.length
                    )}
                  </span>
                  {" of "}
                  <span className="font-medium text-gray-700">
                    {filteredDamageRecords.length}
                  </span>{" "}
                  damage records
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentPage((page) =>
                        Math.max(page - 1, 1)
                      )
                    }
                    disabled={safeCurrentPage === 1}
                    className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Previous
                  </button>

                  <span className="px-2 text-sm text-gray-600">
                    Page{" "}
                    <span className="font-semibold text-gray-900">
                      {safeCurrentPage}
                    </span>{" "}
                    of {totalPages}
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
                    className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
};

export default DamageMaintenance;
