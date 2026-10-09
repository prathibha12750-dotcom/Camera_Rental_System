
import { useEffect, useState } from "react";
import api from "../../services/api";
import { cancelRental } from "../../services/rentalService";

const ITEMS_PER_PAGE = 8;

const STATUS_OPTIONS = [
  "ALL",
  "PENDING",
  "CONFIRMED",
  "ACTIVE",
  "RETURNED",
  "COMPLETED",
  "REJECTED",
  "CANCELLED",
];

const STATUS_COLORS = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  CONFIRMED: "bg-blue-50 text-blue-700 border-blue-200",
  ACTIVE: "bg-green-50 text-green-700 border-green-200",
  RETURNED: "bg-purple-50 text-purple-700 border-purple-200",
  COMPLETED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  REJECTED: "bg-red-50 text-red-700 border-red-200",
  CANCELLED: "bg-gray-100 text-gray-600 border-gray-200",
};

const formatDate = (date) => {
  if (!date) return "N/A";

  const parsed = new Date(date);

  return Number.isNaN(parsed.getTime())
    ? "N/A"
    : parsed.toLocaleDateString();
};

const MyRentals = () => {
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [cancellingId, setCancellingId] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("newest");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // ==========================================
  // LOAD RENTALS
  // ==========================================

  const loadRentals = async () => {
    try {
      setError("");

      const response = await api.get("/rentals/my-rentals");

      setRentals(response.data?.data?.rentals || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to load your rentals"
      );
    }
  };

  // ==========================================
  // INITIAL LOAD
  // ==========================================

  useEffect(() => {
    let cancelled = false;

    const fetchRentals = async () => {
      try {
        const response = await api.get("/rentals/my-rentals");

        if (!cancelled) {
          setRentals(response.data?.data?.rentals || []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.response?.data?.message ||
              "Failed to load your rentals"
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchRentals();

    return () => {
      cancelled = true;
    };
  }, []);

  // ==========================================
  // CANCEL RENTAL
  // ==========================================

  const handleCancelRental = async (rentalId) => {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this rental request?"
    );

    if (!confirmed) return;

    try {
      setCancellingId(rentalId);
      setError("");
      setSuccessMessage("");

      await cancelRental(rentalId);

      setSuccessMessage(
        "Rental request cancelled successfully."
      );

      await loadRentals();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to cancel rental request"
      );
    } finally {
      setCancellingId(null);
    }
  };

  // ==========================================
  // SEARCH + FILTER + SORT
  // ==========================================

  const filteredRentals = rentals
    .filter((rental) => {
      const equipment = rental.equipment || {};

      const searchableText = [
        equipment.name,
        equipment.brand,
        equipment.model,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = searchableText.includes(
        searchTerm.trim().toLowerCase()
      );

      const matchesStatus =
        statusFilter === "ALL" ||
        rental.status === statusFilter;

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "oldest":
          return (
            new Date(a.createdAt || a.startDate) -
            new Date(b.createdAt || b.startDate)
          );

        case "start_asc":
          return new Date(a.startDate) - new Date(b.startDate);

        case "start_desc":
          return new Date(b.startDate) - new Date(a.startDate);

        case "price_high":
          return (b.totalPrice || 0) - (a.totalPrice || 0);

        case "price_low":
          return (a.totalPrice || 0) - (b.totalPrice || 0);

        case "newest":
        default:
          return (
            new Date(b.createdAt || b.startDate) -
            new Date(a.createdAt || a.startDate)
          );
      }
    });

  // ==========================================
  // PAGINATION
  // ==========================================

  const totalPages = Math.max(
    1,
    Math.ceil(filteredRentals.length / ITEMS_PER_PAGE)
  );

  const safeCurrentPage = Math.min(currentPage, totalPages);

  const startIndex =
    (safeCurrentPage - 1) * ITEMS_PER_PAGE;

  const paginatedRentals = filteredRentals.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  const showingFrom =
    filteredRentals.length === 0 ? 0 : startIndex + 1;

  const showingTo = Math.min(
    startIndex + ITEMS_PER_PAGE,
    filteredRentals.length
  );

  const handleSearchChange = (value) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleStatusChange = (value) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const handleSortChange = (value) => {
    setSortBy(value);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("ALL");
    setSortBy("newest");
    setCurrentPage(1);
  };

  const hasActiveFilters =
    searchTerm !== "" ||
    statusFilter !== "ALL" ||
    sortBy !== "newest";

  // ==========================================
  // PAGE
  // ==========================================

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-gray-50 px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-7xl">

        {/* HEADER */}

        <p className="text-sm font-semibold uppercase tracking-wider text-orange-600">
          Customer Rentals
        </p>

        <h1 className="mt-2 text-3xl font-bold text-gray-950">
          My Rentals
        </h1>

        <p className="mt-2 text-gray-600">
          View and manage your equipment rental requests.
        </p>

        {/* SUCCESS MESSAGE */}

        {successMessage && (
          <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
            {successMessage}
          </div>
        )}

        {/* ERROR MESSAGE */}

        {error && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* LOADING */}

        {loading ? (
          <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-10 text-center text-gray-600">
            Loading rentals...
          </div>
        ) : (
          <>
            {/* FILTER SECTION */}

            <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end">

                {/* SEARCH */}

                <div className="flex-1">
                  <label
                    htmlFor="rental-search"
                    className="mb-2 block text-sm font-semibold text-gray-700"
                  >
                    Search Equipment
                  </label>

                  <input
                    id="rental-search"
                    type="search"
                    value={searchTerm}
                    onChange={(e) =>
                      handleSearchChange(e.target.value)
                    }
                    placeholder="Search by name, brand or model..."
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                  />
                </div>

                {/* STATUS */}

                <div className="w-full lg:w-48">
                  <label
                    htmlFor="rental-status"
                    className="mb-2 block text-sm font-semibold text-gray-700"
                  >
                    Rental Status
                  </label>

                  <select
                    id="rental-status"
                    value={statusFilter}
                    onChange={(e) =>
                      handleStatusChange(e.target.value)
                    }
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                  >
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {status === "ALL"
                          ? "All Statuses"
                          : status.charAt(0) +
                            status.slice(1).toLowerCase()}
                      </option>
                    ))}
                  </select>
                </div>

                {/* SORT */}

                <div className="w-full lg:w-52">
                  <label
                    htmlFor="rental-sort"
                    className="mb-2 block text-sm font-semibold text-gray-700"
                  >
                    Sort By
                  </label>

                  <select
                    id="rental-sort"
                    value={sortBy}
                    onChange={(e) =>
                      handleSortChange(e.target.value)
                    }
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="start_asc">Start Date: Earliest</option>
                    <option value="start_desc">Start Date: Latest</option>
                    <option value="price_high">Price: High to Low</option>
                    <option value="price_low">Price: Low to High</option>
                  </select>
                </div>

                {/* RESET */}

                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="rounded-xl border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            </div>

            {/* RESULT COUNT */}

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-gray-600">
                Showing{" "}
                <span className="font-semibold text-gray-900">
                  {showingFrom}–{showingTo}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-gray-900">
                  {filteredRentals.length}
                </span>{" "}
                rentals
              </p>

              <p className="text-sm text-gray-500">
                Total requests: {rentals.length}
              </p>
            </div>

            {/* EMPTY STATES */}

            {rentals.length === 0 && !error && (
              <div className="mt-5 rounded-2xl border border-gray-200 bg-white p-10 text-center">
                <h2 className="text-lg font-semibold text-gray-900">
                  No rental requests yet
                </h2>

                <p className="mt-2 text-sm text-gray-600">
                  Your equipment rental requests will appear here.
                </p>
              </div>
            )}

            {rentals.length > 0 &&
              filteredRentals.length === 0 && (
                <div className="mt-5 rounded-2xl border border-gray-200 bg-white p-10 text-center">
                  <h2 className="text-lg font-semibold text-gray-900">
                    No matching rentals
                  </h2>

                  <p className="mt-2 text-sm text-gray-600">
                    Try changing your search or status filter.
                  </p>

                  <button
                    type="button"
                    onClick={clearFilters}
                    className="mt-4 rounded-xl bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-700"
                  >
                    Clear Filters
                  </button>
                </div>
              )}

{/* ==========================================
    RENTAL CARDS - TWO COLUMN LAYOUT
========================================== */}

<div className="mt-5 grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
  {paginatedRentals.map((rental) => (
    <div
      key={rental._id}
      className="min-w-0 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-orange-200 hover:shadow-md"
    >
      {/* EQUIPMENT HEADER */}

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-base font-semibold text-gray-950">
            {rental.equipment?.name || "Equipment"}
          </h2>

          <p className="mt-1 truncate text-xs text-gray-500">
            {[
              rental.equipment?.brand,
              rental.equipment?.model,
            ]
              .filter(Boolean)
              .join(" ") || "Equipment rental"}
          </p>
        </div>

        {/* STATUS BADGE */}

        <span
          className={`inline-flex shrink-0 rounded-full border px-3 py-1 text-[11px] font-semibold ${
            STATUS_COLORS[rental.status] ||
            "border-gray-200 bg-gray-100 text-gray-700"
          }`}
        >
          {rental.status}
        </span>
      </div>

      {/* RENTAL DATES */}

      <div className="mt-4 grid grid-cols-2 gap-4 border-t border-gray-100 pt-4">
        <div>
          <p className="text-xs text-gray-500">
            Start Date
          </p>

          <p className="mt-1 text-sm font-semibold text-gray-900">
            {formatDate(rental.startDate)}
          </p>
        </div>

        <div>
          <p className="text-xs text-gray-500">
            End Date
          </p>

          <p className="mt-1 text-sm font-semibold text-gray-900">
            {formatDate(rental.endDate)}
          </p>
        </div>
      </div>

      {/* PRICE AND ACTION */}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4">
        <div>
          <p className="text-xs text-gray-500">
            Total Price
          </p>

          <p className="mt-1 text-base font-bold text-orange-600">
            LKR{" "}
            {Number(
              rental.totalPrice || 0
            ).toLocaleString()}
          </p>
        </div>

        {/* CANCEL PENDING RENTAL */}

        {rental.status === "PENDING" && (
          <button
            type="button"
            onClick={() =>
              handleCancelRental(rental._id)
            }
            disabled={cancellingId === rental._id}
            className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {cancellingId === rental._id
              ? "Cancelling..."
              : "Cancel Request"}
          </button>
        )}
      </div>
    </div>
  ))}
</div>


            {/* PAGINATION */}

            {totalPages > 1 && (
              <div className="mt-8 flex flex-col items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white px-5 py-4 sm:flex-row">

                <p className="text-sm text-gray-600">
                  Page {safeCurrentPage} of {totalPages}
                </p>

                <div className="flex flex-wrap items-center justify-center gap-2">

                  <button
                    type="button"
                    onClick={() =>
                      setCurrentPage((page) =>
                        Math.max(1, page - 1)
                      )
                    }
                    disabled={safeCurrentPage === 1}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Previous
                  </button>

                  {Array.from(
                    { length: totalPages },
                    (_, index) => index + 1
                  ).map((page) => (
                    <button
                      key={page}
                      type="button"
                      onClick={() => setCurrentPage(page)}
                      aria-label={`Go to page ${page}`}
                      aria-current={
                        safeCurrentPage === page
                          ? "page"
                          : undefined
                      }
                      className={`h-9 min-w-9 rounded-lg px-3 text-sm font-semibold transition ${
                        safeCurrentPage === page
                          ? "bg-orange-600 text-white"
                          : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={() =>
                      setCurrentPage((page) =>
                        Math.min(totalPages, page + 1)
                      )
                    }
                    disabled={safeCurrentPage === totalPages}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
};

export default MyRentals;
