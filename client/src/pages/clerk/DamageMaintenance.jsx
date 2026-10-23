
import { useEffect, useState } from "react";

import {
  getAllDamageRecords,
  updateDamageRecordStatus,
} from "../../services/rentalService";

const RECORDS_PER_PAGE = 8;

const formatStatus = (status) =>
  (status || "UNKNOWN").replaceAll("_", " ");

const formatMoney = (amount) =>
  `LKR ${Number(amount || 0).toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatDate = (date) => {
  if (!date) return "—";

  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "—";

  return parsed.toLocaleDateString("en-GB", {
    timeZone: "Asia/Colombo",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getLocalDateKey = (date) => {
  if (!date) return "";

  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "";

  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Colombo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(parsed);

  const part = (type) =>
    parts.find((item) => item.type === type)?.value || "";

  return `${part("year")}-${part("month")}-${part("day")}`;
};

const statusStyles = {
  REPORTED: "bg-red-50 text-red-700 ring-red-200",
  UNDER_INSPECTION:
    "bg-amber-50 text-amber-700 ring-amber-200",
  MAINTENANCE:
    "bg-orange-50 text-orange-700 ring-orange-200",
  RESOLVED:
    "bg-emerald-50 text-emerald-700 ring-emerald-200",
};

const StatusBadge = ({ status }) => (
  <span
    className={`inline-flex whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset ${
      statusStyles[status] ||
      "bg-gray-100 text-gray-700 ring-gray-200"
    }`}
  >
    {formatStatus(status)}
  </span>
);

const DamageMaintenance = () => {
  // ==========================================
  // STATE
  // ==========================================

  const [damageRecords, setDamageRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [currentPage, setCurrentPage] = useState(1);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Resolution dialog
  const [resolvingDamage, setResolvingDamage] = useState(null);
  const [repairCost, setRepairCost] = useState("");
  const [resolutionError, setResolutionError] = useState("");
  const [confirmResolution, setConfirmResolution] = useState(false);

  // ==========================================
  // LOAD RECORDS
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
              "Failed to load damage records."
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

  const refreshDamageRecords = async () => {
    const result = await getAllDamageRecords();

    setDamageRecords(
      result?.data?.damageRecords || []
    );
  };

const handleManualRefresh = async () => {
  if (refreshing || actionLoading !== null) return;

  try {
    setRefreshing(true);
    setError("");
    setSuccess("");

    await refreshDamageRecords();

    setSuccess("Damage records refreshed successfully.");
  } catch (err) {
    setError(
      err.response?.data?.message ||
        "Failed to refresh damage records."
    );
  } finally {
    setRefreshing(false);
  }
};

  // ==========================================
  // NORMAL STATUS UPDATES
  // ==========================================

  const handleDamageStatusUpdate = async (
    record,
    newStatus
  ) => {
    if (actionLoading !== null) return;

    const confirmed = window.confirm(
      `Change damage status to ${formatStatus(newStatus)}?`
    );

    if (!confirmed) return;

    try {
      setActionLoading(record._id);
      setError("");
      setSuccess("");

      await updateDamageRecordStatus(
        record._id,
        newStatus
      );

      await refreshDamageRecords();

      setSuccess(
        `Damage status updated to ${formatStatus(newStatus)}.`
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to update damage status."
      );
    } finally {
      setActionLoading(null);
    }
  };

  // ==========================================
  // RESOLUTION DIALOG
  // ==========================================

  const openResolutionDialog = (record) => {
    if (actionLoading !== null) return;

    setResolvingDamage(record);

    // Always require explicit cost confirmation.
    // Do not silently reuse an old cost.
    setRepairCost("");
    setResolutionError("");
    setConfirmResolution(false);
    setError("");
  };

  const closeResolutionDialog = () => {
    if (actionLoading !== null) return;

    setResolvingDamage(null);
    setRepairCost("");
    setResolutionError("");
    setConfirmResolution(false);
  };

  const handleConfirmResolution = async (event) => {
    event.preventDefault();

    if (!resolvingDamage || actionLoading !== null) {
      return;
    }

    const trimmedCost = repairCost.trim();
    const amount = Number(trimmedCost);

    if (trimmedCost === "") {
      setResolutionError(
        "Please enter the repair cost. Enter 0 if no repair cost was incurred."
      );
      return;
    }

    if (
      !/^\d+(\.\d{1,2})?$/.test(trimmedCost) ||
      !Number.isFinite(amount) ||
      amount < 0 ||
      !Number.isSafeInteger(Math.round(amount * 100))
    ) {
      setResolutionError(
        "Enter a valid non-negative amount with up to two decimal places."
      );
      return;
    }

    if (!confirmResolution) {
      setResolutionError(
        "Please confirm the damage assessment before continuing."
      );
      return;
    }

    const damageId = resolvingDamage._id;

    try {
      setActionLoading(damageId);
      setResolutionError("");
      setError("");
      setSuccess("");

      await updateDamageRecordStatus(
        damageId,
        "RESOLVED",
        amount
      );

      // The database update succeeded.
      // Close the dialog even if the refresh fails.
      setResolvingDamage(null);
      setRepairCost("");
      setConfirmResolution(false);

      setSuccess(
        `Damage resolved with a recorded repair cost of ${formatMoney(amount)}. Customer deposit deductions require separate approval.`
      );

      try {
        await refreshDamageRecords();
      } catch {
        setError(
          "The resolution was saved, but the list could not refresh. Reload the page to view the latest records."
        );
      }
    } catch (err) {
      setResolutionError(
        err.response?.data?.message ||
          "Failed to resolve the damage record."
      );
    } finally {
      setActionLoading(null);
    }
  };

  // ==========================================
  // FILTERING
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
        (reportedDate && reportedDate >= dateFrom);

      const matchesTo =
        !dateTo ||
        (reportedDate && reportedDate <= dateTo);

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

  const updateFilter = (setter, value) => {
    setter(value);
    setCurrentPage(1);
  };

const handleSummaryCardClick = (status) => {
  // Clicking the selected card again shows all statuses.
  const nextStatus = statusFilter === status ? "ALL" : status;

  setStatusFilter(nextStatus);
  setSearchTerm("");
  setDateFrom("");
  setDateTo("");
  setCurrentPage(1);

  document.getElementById("damage-records-section")?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
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

  const busy = actionLoading !== null;

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">

        {/* PAGE HEADER */}
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-600">
            Clerk Workspace
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
            Damage &amp; Maintenance
          </h1>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Review reported equipment damage, track
            inspections, manage maintenance, and record
            repair costs before resolving damage cases.
          </p>
        </div>

        {/* ALERTS */}
        {error && (
          <div
            role="alert"
            className="mt-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {success && (
          <div
            role="status"
            className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-medium text-emerald-800"
          >
            ✓ {success}
          </div>
        )}

        {/* SUMMARY CARDS */}
        <div className="mt-7 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            {
              label: "Reported",
              status: "REPORTED",
              accent: "text-red-600",
            },
            {
              label: "Under Inspection",
              status: "UNDER_INSPECTION",
              accent: "text-amber-600",
            },
            {
              label: "In Maintenance",
              status: "MAINTENANCE",
              accent: "text-orange-600",
            },
            {
              label: "Resolved",
              status: "RESOLVED",
              accent: "text-emerald-600",
            },

            ].map((item) => (
              <button
                key={item.status}
                type="button"
                onClick={() => handleSummaryCardClick(item.status)}
                aria-pressed={statusFilter === item.status}
                className={`rounded-2xl border bg-white p-5 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-orange-300 hover:shadow-md focus-visible:outline-2 focus-visible:outline-orange-500 ${
                  statusFilter === item.status
                    ? "border-orange-500 ring-2 ring-orange-100"
                    : "border-slate-200"
                }`}
              >

              <p className="text-xs font-semibold text-slate-500 sm:text-sm">
                {item.label}
              </p>

              <p
                className={`mt-2 text-3xl font-bold ${item.accent}`}
              >
                {
                  damageRecords.filter(
                    (record) =>
                      record.status === item.status
                  ).length
                }
              </p>
            </button>
          ))}
        </div>

        {statusFilter !== "ALL" && (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3">
            <p className="text-sm font-medium text-orange-800">
              Showing {formatStatus(statusFilter)} records
              <span className="ml-2 font-bold">
                ({filteredDamageRecords.length})
              </span>
            </p>

            <button
              type="button"
              onClick={() => {
                setStatusFilter("ALL");
                setCurrentPage(1);
              }}
              className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-orange-700 ring-1 ring-orange-200 transition hover:bg-orange-100"
            >
              Show All Records
            </button>
          </div>
        )}

        {/* RECORDS */}
          <section
            id="damage-records-section"
            className="mt-7 scroll-mt-24 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
          >

          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 px-5 py-5 sm:px-6">
            <div>
              <h2 className="text-lg font-bold text-slate-950">
                Damage Records
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Review and manage equipment damage cases.
              </p>
            </div>

            <button
              type="button"
              onClick={handleManualRefresh}
              disabled={refreshing || busy || loading}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <svg
                className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M20 11a8 8 0 0 0-14-5L4 8" />
                <path d="M4 4v4h4" />
                <path d="M4 13a8 8 0 0 0 14 5l2-2" />
                <path d="M20 20v-4h-4" />
              </svg>

              {refreshing ? "Refreshing..." : "Refresh Records"}
            </button>
          </div>

          {/* FILTERS */}
          <div className="border-b border-slate-200 bg-slate-50/60 px-5 py-5 sm:px-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">

              <div>
                <label
                  htmlFor="damage-search"
                  className="mb-2 block text-xs font-semibold text-slate-700"
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
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                />
              </div>

              <div>
                <label
                  htmlFor="damage-status"
                  className="mb-2 block text-xs font-semibold text-slate-700"
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
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-orange-500"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="REPORTED">Reported</option>
                  <option value="UNDER_INSPECTION">
                    Under Inspection
                  </option>
                  <option value="MAINTENANCE">
                    Maintenance
                  </option>
                  <option value="RESOLVED">Resolved</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="damage-date-from"
                  className="mb-2 block text-xs font-semibold text-slate-700"
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
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label
                  htmlFor="damage-date-to"
                  className="mb-2 block text-xs font-semibold text-slate-700"
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
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-orange-500"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={clearFilters}
                  disabled={!hasActiveFilters}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Clear Filters
                </button>
              </div>
            </div>

            {!loading && (
              <p className="mt-4 text-xs text-slate-500">
                {hasActiveFilters
                  ? `${filteredDamageRecords.length} matching record(s) out of ${damageRecords.length}`
                  : `${damageRecords.length} total damage record(s)`}
              </p>
            )}
          </div>

          {/* TABLE */}
          {loading ? (
            <div className="px-6 py-12 text-center text-sm text-slate-500">
              Loading damage records...
            </div>
          ) : filteredDamageRecords.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <p className="font-semibold text-slate-800">
                {hasActiveFilters
                  ? "No matching damage records"
                  : "No damage records found"}
              </p>

              <p className="mt-2 text-sm text-slate-500">
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

            <div className="grid gap-4 p-4 sm:p-5 xl:grid-cols-2">
              {paginatedDamageRecords.map((record) => (
                <article
                  key={record._id}
                  className="flex min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-orange-200 hover:shadow-md sm:p-5"
                >
                  {/* EQUIPMENT AND STATUS */}
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="break-words text-base font-bold text-slate-950">
                        {record.equipment?.name || "Unknown Equipment"}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {[
                          record.equipment?.brand,
                          record.equipment?.model,
                        ]
                          .filter(Boolean)
                          .join(" ") || "—"}
                      </p>
                    </div>

                    <StatusBadge status={record.status} />
                  </div>

                  {/* CUSTOMER AND DATE */}
                  <div className="mt-4 grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Customer
                      </p>

                      <p className="mt-1 break-words text-sm font-semibold text-slate-800">
                        {record.customer?.name || "—"}
                      </p>

                      <p className="mt-1 break-all text-xs text-slate-500">
                        {record.customer?.email || "—"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Reported Date
                      </p>

                      <p className="mt-1 text-sm font-medium text-slate-700">
                        {formatDate(record.createdAt)}
                      </p>
                    </div>
                  </div>

                  {/* DAMAGE DESCRIPTION */}
                  <div className="mt-4 flex-1 rounded-xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Damage Description
                    </p>

                    <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">
                      {record.description || "—"}
                    </p>

                    {record.status === "RESOLVED" &&
                      record.repairCost != null && (
                        <p className="mt-3 border-t border-slate-200 pt-3 text-sm font-semibold text-slate-700">
                          Repair Cost: {formatMoney(record.repairCost)}
                        </p>
                      )}
                  </div>

                  {/* ACTIONS */}
                  <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
                    {record.status === "REPORTED" && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() =>
                          handleDamageStatusUpdate(
                            record,
                            "UNDER_INSPECTION"
                          )
                        }
                        className="rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {actionLoading === record._id
                          ? "Updating..."
                          : "Start Inspection"}
                      </button>
                    )}

                    {record.status === "UNDER_INSPECTION" && (
                      <>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() =>
                            handleDamageStatusUpdate(
                              record,
                              "MAINTENANCE"
                            )
                          }
                          className="rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {actionLoading === record._id
                            ? "Updating..."
                            : "Start Maintenance"}
                        </button>

                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => openResolutionDialog(record)}
                          className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Resolve
                        </button>
                      </>
                    )}

                    {record.status === "MAINTENANCE" && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => openResolutionDialog(record)}
                        className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Complete Repair
                      </button>
                    )}

                    {record.status === "RESOLVED" && (
                      <span className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700">
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2"
                          aria-hidden="true"
                        >
                          <path d="m5 12 4 4L19 6" />
                        </svg>
                        Resolved
                      </span>
                    )}
                  </div>
                </article>
              ))}
            </div>

              {/* PAGINATION */}
              <div className="flex flex-col gap-4 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-500">
                  Showing{" "}
                  <span className="font-semibold text-slate-700">
                    {startIndex + 1}
                  </span>
                  {" – "}
                  <span className="font-semibold text-slate-700">
                    {Math.min(
                      startIndex + RECORDS_PER_PAGE,
                      filteredDamageRecords.length
                    )}
                  </span>
                  {" of "}
                  <span className="font-semibold text-slate-700">
                    {filteredDamageRecords.length}
                  </span>
                  {" records"}
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={safeCurrentPage === 1}
                    onClick={() =>
                      setCurrentPage((page) =>
                        Math.max(1, page - 1)
                      )
                    }
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Previous
                  </button>

                  <span className="px-2 text-sm text-slate-600">
                    {safeCurrentPage} / {totalPages}
                  </span>

                  <button
                    type="button"
                    disabled={safeCurrentPage === totalPages}
                    onClick={() =>
                      setCurrentPage((page) =>
                        Math.min(totalPages, page + 1)
                      )
                    }
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      </div>

      {/* ==========================================
          RESOLVE DAMAGE MODAL
          ========================================== */}

      {resolvingDamage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="resolve-damage-title"
            className="my-auto w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl"
          >
            {/* MODAL HEADER */}
            <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                  Damage Resolution
                </p>

                <h2
                  id="resolve-damage-title"
                  className="mt-1 text-xl font-bold text-slate-950"
                >
                  {resolvingDamage.status === "MAINTENANCE"
                    ? "Complete Repair"
                    : "Resolve Damage"}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Review the damage assessment before
                  closing this record.
                </p>
              </div>

              <button
                type="button"
                aria-label="Close dialog"
                disabled={busy}
                onClick={closeResolutionDialog}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  className="h-5 w-5"
                  aria-hidden="true"
                >
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleConfirmResolution}>
              <div className="max-h-[65vh] space-y-5 overflow-y-auto px-6 py-6">

                {/* DAMAGE SUMMARY */}
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    Equipment
                  </p>

                  <p className="mt-1 font-semibold text-slate-900">
                    {resolvingDamage.equipment?.name ||
                      "Unknown Equipment"}
                  </p>

                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-xs text-slate-500">
                        Customer
                      </p>
                      <p className="mt-1 text-sm font-medium text-slate-800">
                        {resolvingDamage.customer?.name ||
                          "—"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500">
                        Current Status
                      </p>
                      <div className="mt-1">
                        <StatusBadge
                          status={resolvingDamage.status}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 border-t border-slate-200 pt-4">
                    <p className="text-xs text-slate-500">
                      Reported Damage
                    </p>

                    <p className="mt-1 text-sm leading-6 text-slate-800">
                      {resolvingDamage.description || "—"}
                    </p>
                  </div>

                  {resolvingDamage.repairCost != null && (
                    <div className="mt-3 text-xs text-slate-500">
                      Previously recorded repair cost:{" "}
                      <span className="font-semibold text-slate-700">
                        {formatMoney(
                          resolvingDamage.repairCost
                        )}
                      </span>
                    </div>
                  )}
                </div>

                {/* REPAIR COST */}
                <div>
                  <label
                    htmlFor="damage-repair-cost"
                    className="block text-sm font-semibold text-slate-800"
                  >
                    Repair Cost (LKR){" "}
                    <span className="text-red-500">*</span>
                  </label>

                  <p className="mt-1 text-xs text-slate-500">
                    Enter the actual assessed repair cost.
                    Use 0 if no repair expense was incurred.
                  </p>

                  <div className="mt-3 flex overflow-hidden rounded-xl border border-slate-300 focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-100">
                    <span className="flex items-center border-r border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-600">
                      LKR
                    </span>

                    <input
                      id="damage-repair-cost"
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      autoFocus
                      value={repairCost}
                      disabled={busy}
                      onChange={(event) => {
                        setRepairCost(event.target.value);
                        setResolutionError("");
                      }}
                      placeholder="0.00"
                      className="w-full bg-white px-4 py-3 text-base font-semibold text-slate-900 outline-none disabled:opacity-50"
                    />
                  </div>

                  {repairCost.trim() !== "" &&
                    Number.isFinite(Number(repairCost)) &&
                    Number(repairCost) >= 0 && (
                      <p className="mt-2 text-xs font-medium text-slate-600">
                        Recorded amount:{" "}
                        {formatMoney(repairCost)}
                      </p>
                    )}
                </div>

                {/* IMPORTANT FINANCIAL NOTE */}
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-sm font-bold text-amber-900">
                    Deposit deduction is a separate step
                  </p>

                  <p className="mt-1 text-xs leading-5 text-amber-800">
                    Recording a repair cost does not
                    automatically charge the customer or
                    deduct money from their security deposit.
                    Any deduction must be reviewed and
                    approved through the deposit settlement
                    process.
                  </p>
                </div>

                {/* CONFIRMATION */}
                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-4">
                  <input
                    type="checkbox"
                    checked={confirmResolution}
                    disabled={busy}
                    onChange={(event) => {
                      setConfirmResolution(
                        event.target.checked
                      );
                      setResolutionError("");
                    }}
                    className="mt-0.5 h-4 w-4 accent-emerald-600"
                  />

                  <span className="text-sm leading-5 text-slate-700">
                    I confirm that the damage assessment is
                    complete, the equipment is ready to be
                    marked resolved, and the entered repair
                    cost is accurate.
                  </span>
                </label>

                {/* VALIDATION ERROR */}
                {resolutionError && (
                  <div
                    role="alert"
                    className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                  >
                    {resolutionError}
                  </div>
                )}
              </div>

              {/* MODAL FOOTER */}
              <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  disabled={busy}
                  onClick={closeResolutionDialog}
                  className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={busy || !confirmResolution}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {busy ? (
                    "Saving Resolution..."
                  ) : (
                    <>
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-4 w-4"
                        aria-hidden="true"
                      >
                        <path d="m5 12 4 4L19 6" />
                      </svg>
                      Confirm Resolution
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
};

export default DamageMaintenance;
