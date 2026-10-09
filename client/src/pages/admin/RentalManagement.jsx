
import { useEffect, useState } from "react";
import { useAuth } from "../../context/useAuth";

import {
  getAllRentals,
  approveRental,
  rejectRental,
  issueRental,
  returnRental,
  completeRental,
  getOverdueRentals,
} from "../../services/rentalService";

const RENTALS_PER_PAGE = 8;

const RentalManagement = () => {
  const { user } = useAuth();
  const isClerk = user?.role === "CLERK";

  // ==========================================
  // STATE
  // ==========================================

  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [actionLoading, setActionLoading] = useState(null);

  const [returningRental, setReturningRental] = useState(null);
  const [returnData, setReturnData] = useState({
    condition: "GOOD",
    damageDescription: "",
  });

  const [showOverdueOnly, setShowOverdueOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // New filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // ==========================================
  // INITIAL LOAD
  // ==========================================

  useEffect(() => {
    let cancelled = false;

    const fetchInitialRentals = async () => {
      try {
        const result = await getAllRentals();

        if (!cancelled) {
          setRentals(result?.data?.rentals || []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.response?.data?.message ||
              "Failed to load rentals."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void fetchInitialRentals();

    return () => {
      cancelled = true;
    };
  }, []);

  // ==========================================
  // LOAD / REFRESH RENTALS
  // ==========================================

  const fetchRentals = async (overdueOnly = showOverdueOnly) => {
    try {
      setLoading(true);
      setError("");

      const result = overdueOnly
        ? await getOverdueRentals()
        : await getAllRentals();

      setRentals(result?.data?.rentals || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to load rentals."
      );
    } finally {
      setLoading(false);
    }
  };

  const refreshRentals = async () => {
    await fetchRentals(showOverdueOnly);
  };

  // ==========================================
  // OVERDUE FILTER
  // ==========================================

  const handleOverdueFilter = async () => {
    const nextOverdueOnly = !showOverdueOnly;

    setShowOverdueOnly(nextOverdueOnly);
    setCurrentPage(1);

    await fetchRentals(nextOverdueOnly);
  };

  // ==========================================
  // FILTER HELPERS
  // ==========================================

  const updateFilter = (setter, value) => {
    setter(value);
    setCurrentPage(1);
  };

  const clearFilters = async () => {
    setSearchTerm("");
    setStatusFilter("ALL");
    setDateFrom("");
    setDateTo("");
    setCurrentPage(1);

    if (showOverdueOnly) {
      setShowOverdueOnly(false);
      await fetchRentals(false);
    }
  };

  const hasActiveFilters =
    searchTerm.trim() !== "" ||
    statusFilter !== "ALL" ||
    dateFrom !== "" ||
    dateTo !== "" ||
    showOverdueOnly;

  // ==========================================
  // DATE HELPERS
  // ==========================================

  const formatDate = (date) => {
    if (!date) return "—";

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return "—";
    }

    return parsed.toLocaleDateString("en-GB", {
      timeZone: "Asia/Colombo",
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getDateKey = (date) => {
    if (!date) return "";

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return "";
    }

    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Colombo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(parsed);

    const getPart = (type) =>
      parts.find((part) => part.type === type)?.value || "";

    return `${getPart("year")}-${getPart("month")}-${getPart("day")}`;
  };

  // ==========================================
  // FILTER RENTALS
  // ==========================================

  const filteredRentals = rentals.filter((rental) => {
    const search = searchTerm.trim().toLowerCase();

    const searchableText = [
      rental._id,
      rental.customer?.name,
      rental.customer?.email,
      rental.equipment?.name,
      rental.equipment?.brand,
      rental.equipment?.model,
      rental.equipment?.serialNumber,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const matchesSearch =
      !search || searchableText.includes(search);

    const matchesStatus =
      statusFilter === "ALL" ||
      rental.status === statusFilter;

    const rentalStartDate = getDateKey(rental.startDate);
    const rentalEndDate = getDateKey(rental.endDate);

    // Show rentals whose periods overlap the selected dates.
    const matchesFrom =
      !dateFrom ||
      (rentalEndDate !== "" &&
        rentalEndDate >= dateFrom);

    const matchesTo =
      !dateTo ||
      (rentalStartDate !== "" &&
        rentalStartDate <= dateTo);

    return (
      matchesSearch &&
      matchesStatus &&
      matchesFrom &&
      matchesTo
    );
  });

  // ==========================================
  // PAGINATION
  // ==========================================

  const totalPages = Math.max(
    1,
    Math.ceil(filteredRentals.length / RENTALS_PER_PAGE)
  );

  const safeCurrentPage = Math.min(
    Math.max(currentPage, 1),
    totalPages
  );

  const startIndex =
    (safeCurrentPage - 1) * RENTALS_PER_PAGE;

  const paginatedRentals = filteredRentals.slice(
    startIndex,
    startIndex + RENTALS_PER_PAGE
  );

  // ==========================================
  // ACTION HELPERS
  // ==========================================

  const runRentalAction = async (
    rental,
    action,
    successMessage,
    fallbackError
  ) => {
    try {
      setActionLoading(rental._id);
      setError("");
      setSuccess("");

      await action(rental._id);
      await refreshRentals();

      setSuccess(successMessage);
    } catch (err) {
      setError(
        err.response?.data?.message || fallbackError
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleApprove = async (rental) => {
    if (
      !window.confirm(
        `Approve rental request for "${rental.equipment?.name}"?`
      )
    ) {
      return;
    }

    await runRentalAction(
      rental,
      approveRental,
      "Rental approved successfully.",
      "Failed to approve rental."
    );
  };

  const handleReject = async (rental) => {
    if (
      !window.confirm(
        `Reject rental request for "${rental.equipment?.name}"?`
      )
    ) {
      return;
    }

    await runRentalAction(
      rental,
      rejectRental,
      "Rental rejected successfully.",
      "Failed to reject rental."
    );
  };

  const handleIssue = async (rental) => {
    if (
      !window.confirm(
        `Issue "${rental.equipment?.name}" to ${
          rental.customer?.name || "this customer"
        }?`
      )
    ) {
      return;
    }

    await runRentalAction(
      rental,
      issueRental,
      "Equipment issued successfully.",
      "Failed to issue equipment."
    );
  };

  const handleComplete = async (rental) => {
    if (
      !window.confirm(
        `Complete rental for "${rental.equipment?.name}"?`
      )
    ) {
      return;
    }

    await runRentalAction(
      rental,
      completeRental,
      "Rental completed successfully.",
      "Failed to complete rental."
    );
  };

  // ==========================================
  // RETURN EQUIPMENT
  // ==========================================

  const openReturnForm = (rental) => {
    setReturningRental(rental);
    setReturnData({
      condition: "GOOD",
      damageDescription: "",
    });
    setError("");
    setSuccess("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleReturn = async () => {
    if (!returningRental) return;

    if (
      returnData.condition === "DAMAGED" &&
      !returnData.damageDescription.trim()
    ) {
      setError(
        "Please provide a damage description for damaged equipment."
      );
      return;
    }

    try {
      setActionLoading(returningRental._id);
      setError("");
      setSuccess("");

      await returnRental(returningRental._id, {
        condition: returnData.condition,
        damageDescription:
          returnData.condition === "DAMAGED"
            ? returnData.damageDescription.trim()
            : "",
      });

      await refreshRentals();

      setReturningRental(null);
      setReturnData({
        condition: "GOOD",
        damageDescription: "",
      });

      setSuccess("Equipment returned successfully.");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to return equipment."
      );
    } finally {
      setActionLoading(null);
    }
  };

  // ==========================================
  // RENTAL STATUS STYLES
  // ==========================================

  const getRentalStatusClass = (status) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "CONFIRMED":
        return "bg-blue-100 text-blue-800";
      case "ACTIVE":
        return "bg-green-100 text-green-800";
      case "RETURNED":
        return "bg-purple-100 text-purple-800";
      case "COMPLETED":
        return "bg-emerald-100 text-emerald-800";
      case "REJECTED":
        return "bg-red-100 text-red-800";
      case "CANCELLED":
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-7xl">

        {/* HEADER */}

        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-orange-600">
              {isClerk ? "Clerk" : "Admin"}
            </p>

            <h1 className="mt-2 text-3xl font-bold text-gray-950">
              Rental Management
            </h1>

            <p className="mt-2 text-gray-600">
              Manage rental requests, equipment issuing,
              returns, overdue rentals, and completion.
            </p>
          </div>

          <button
            type="button"
            onClick={handleOverdueFilter}
            disabled={loading}
            className={
              showOverdueOnly
                ? "rounded-xl bg-red-600 px-5 py-3 font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                : "rounded-xl border border-red-300 bg-white px-5 py-3 font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
            }
          >
            {showOverdueOnly
              ? "Show All Rentals"
              : "Show Overdue Rentals"}
          </button>
        </div>

        {/* FILTER SECTION */}

        <section className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-950">
                Filter Rentals
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Search and filter rental records.
              </p>
            </div>

            <button
              type="button"
              onClick={clearFilters}
              disabled={!hasActiveFilters || loading}
              className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40"
            >
              Clear Filters
            </button>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">

            {/* SEARCH */}

            <label className="block text-sm font-medium text-gray-700">
              Search Rentals
              <input
                type="search"
                value={searchTerm}
                onChange={(event) =>
                  updateFilter(
                    setSearchTerm,
                    event.target.value
                  )
                }
                placeholder="Customer, equipment, rental ID..."
                className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm"
              />
            </label>

            {/* STATUS */}

            <label className="block text-sm font-medium text-gray-700">
              Rental Status
              <select
                value={statusFilter}
                onChange={(event) =>
                  updateFilter(
                    setStatusFilter,
                    event.target.value
                  )
                }
                className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm"
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="ACTIVE">Active</option>
                <option value="RETURNED">Returned</option>
                <option value="COMPLETED">Completed</option>
                <option value="REJECTED">Rejected</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </label>

            {/* DATE FROM */}

            <label className="block text-sm font-medium text-gray-700">
              Rental Period From
              <input
                type="date"
                value={dateFrom}
                max={dateTo || undefined}
                onChange={(event) =>
                  updateFilter(
                    setDateFrom,
                    event.target.value
                  )
                }
                className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm"
              />
            </label>

            {/* DATE TO */}

            <label className="block text-sm font-medium text-gray-700">
              Rental Period To
              <input
                type="date"
                value={dateTo}
                min={dateFrom || undefined}
                onChange={(event) =>
                  updateFilter(
                    setDateTo,
                    event.target.value
                  )
                }
                className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm"
              />
            </label>
          </div>

          {!loading && !error && (
            <p className="mt-4 text-sm text-gray-500">
              {filteredRentals.length} matching rental(s)
              {hasActiveFilters
                ? ` from ${rentals.length} loaded records`
                : ""}
              .
            </p>
          )}
        </section>

        {/* ERROR */}

        {error && (
          <div
            role="alert"
            className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700"
          >
            {error}
          </div>
        )}

        {/* SUCCESS */}

        {success && (
          <div
            role="status"
            className="mt-6 rounded-xl border border-green-200 bg-green-50 p-4 font-medium text-green-700"
          >
            ✓ {success}
          </div>
        )}

        {/* RETURN FORM */}

        {returningRental && (
          <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-950">
                  Return Equipment
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  {returningRental.equipment?.name}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setReturningRental(null);
                  setError("");
                }}
                disabled={actionLoading !== null}
                className="text-sm font-semibold text-gray-500 hover:text-gray-900 disabled:opacity-50"
              >
                Close
              </button>
            </div>

            <div className="mt-6 grid gap-4">
              <label className="block text-sm font-semibold text-gray-700">
                Returned Condition
                <select
                  value={returnData.condition}
                  onChange={(event) =>
                    setReturnData((previous) => ({
                      ...previous,
                      condition: event.target.value,
                    }))
                  }
                  className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3"
                >
                  <option value="EXCELLENT">Excellent</option>
                  <option value="GOOD">Good</option>
                  <option value="FAIR">Fair</option>
                  <option value="DAMAGED">Damaged</option>
                </select>
              </label>

              {returnData.condition === "DAMAGED" && (
                <label className="block text-sm font-semibold text-gray-700">
                  Damage Description
                  <textarea
                    value={returnData.damageDescription}
                    onChange={(event) =>
                      setReturnData((previous) => ({
                        ...previous,
                        damageDescription: event.target.value,
                      }))
                    }
                    placeholder="Describe the damage..."
                    className="mt-2 min-h-28 w-full rounded-xl border border-gray-300 px-4 py-3"
                  />
                </label>
              )}

              <button
                type="button"
                onClick={handleReturn}
                disabled={actionLoading !== null}
                className="w-fit rounded-xl bg-orange-600 px-5 py-3 font-semibold text-white hover:bg-orange-700 disabled:opacity-50"
              >
                {actionLoading === returningRental._id
                  ? "Processing Return..."
                  : "Confirm Return"}
              </button>
            </div>
          </section>
        )}

        {/* OVERDUE SUMMARY */}

        {showOverdueOnly && !loading && !error && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="font-semibold text-red-700">
              {rentals.length} overdue rental
              {rentals.length === 1 ? "" : "s"} found
            </p>
          </div>
        )}

        {/* LOADING */}

        {loading && (
          <p className="mt-8 text-gray-600">
            Loading rentals...
          </p>
        )}

        {/* EMPTY STATE */}

        {!loading && !error && filteredRentals.length === 0 && (
          <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-8 text-center">
            <p className="font-semibold text-gray-700">
              {hasActiveFilters
                ? "No matching rentals found."
                : "No rentals found."}
            </p>

            {hasActiveFilters && (
              <p className="mt-2 text-sm text-gray-500">
                Try changing the search or filters.
              </p>
            )}
          </div>
        )}

        {/* RENTALS TABLE */}

        {!loading && !error && filteredRentals.length > 0 && (
          <section className="mt-8 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {[
                      "Customer",
                      "Equipment",
                      "Rental Period",
                      "Total",
                      "Status",
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
                  {paginatedRentals.map((rental) => (
                    <tr key={rental._id}>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-gray-950">
                          {rental.customer?.name ||
                            "Unknown Customer"}
                        </p>
                        <p className="text-sm text-gray-500">
                          {rental.customer?.email || "—"}
                        </p>
                      </td>

                      <td className="px-6 py-4">
                        <p className="font-semibold text-gray-950">
                          {rental.equipment?.name ||
                            "Unknown Equipment"}
                        </p>
                        <p className="text-sm text-gray-500">
                          {rental.equipment?.brand}{" "}
                          {rental.equipment?.model}
                        </p>
                      </td>

                      <td className="px-6 py-4 text-sm text-gray-700">
                        <p>{formatDate(rental.startDate)}</p>
                        <p className="text-gray-500">
                          to {formatDate(rental.endDate)}
                        </p>

                        {rental.daysOverdue > 0 && (
                          <p className="mt-1 font-semibold text-red-600">
                            {rental.daysOverdue} day
                            {rental.daysOverdue === 1
                              ? ""
                              : "s"}{" "}
                            overdue
                          </p>
                        )}
                      </td>

                      <td className="px-6 py-4 font-medium text-gray-900">
                        LKR{" "}
                        {Number(
                          rental.totalPrice || 0
                        ).toLocaleString()}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${getRentalStatusClass(
                            rental.status
                          )}`}
                        >
                          {rental.status || "—"}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-2">

                          {rental.status === "PENDING" && (
                            <>
                              <button
                                type="button"
                                onClick={() =>
                                  handleApprove(rental)
                                }
                                disabled={actionLoading !== null}
                                className="rounded-lg bg-orange-600 px-3 py-2 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-50"
                              >
                                {actionLoading === rental._id
                                  ? "Processing..."
                                  : "Approve"}
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  handleReject(rental)
                                }
                                disabled={actionLoading !== null}
                                className="rounded-lg border border-red-300 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                              >
                                Reject
                              </button>
                            </>
                          )}

                          {rental.status === "CONFIRMED" && (
                            <button
                              type="button"
                              onClick={() =>
                                handleIssue(rental)
                              }
                              disabled={actionLoading !== null}
                              className="rounded-lg bg-orange-600 px-3 py-2 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-50"
                            >
                              {actionLoading === rental._id
                                ? "Issuing..."
                                : "Issue Equipment"}
                            </button>
                          )}

                          {rental.status === "ACTIVE" && (
                            <button
                              type="button"
                              onClick={() =>
                                openReturnForm(rental)
                              }
                              disabled={actionLoading !== null}
                              className="rounded-lg bg-orange-600 px-3 py-2 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-50"
                            >
                              Return Equipment
                            </button>
                          )}

                          {rental.status === "RETURNED" && (
                            <button
                              type="button"
                              onClick={() =>
                                handleComplete(rental)
                              }
                              disabled={actionLoading !== null}
                              className="rounded-lg bg-orange-600 px-3 py-2 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-50"
                            >
                              {actionLoading === rental._id
                                ? "Completing..."
                                : "Complete Rental"}
                            </button>
                          )}

                          {![
                            "PENDING",
                            "CONFIRMED",
                            "ACTIVE",
                            "RETURNED",
                          ].includes(rental.status) && (
                            <span className="text-sm text-gray-400">
                              —
                            </span>
                          )}
                        </div>
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
                  startIndex + RENTALS_PER_PAGE,
                  filteredRentals.length
                )}{" "}
                of {filteredRentals.length} rentals
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

export default RentalManagement;
