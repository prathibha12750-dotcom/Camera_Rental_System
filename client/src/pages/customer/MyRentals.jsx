
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
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
  ACTIVE: "bg-indigo-50 text-indigo-700 border-indigo-200",
  RETURNED: "bg-purple-50 text-purple-700 border-purple-200",
  COMPLETED: "bg-green-50 text-green-700 border-green-200",
  REJECTED: "bg-red-50 text-red-700 border-red-200",
  CANCELLED: "bg-gray-100 text-gray-600 border-gray-200",
};

const formatDate = (value) => {
  if (!value) return "Not available";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "Not available"
    : date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
};

const formatMoney = (value) =>
  `LKR ${Number(value || 0).toLocaleString("en-LK")}`;

const StatusBadge = ({ status }) => (
  <span
    className={`inline-flex shrink-0 items-center rounded-full border px-3 py-1 text-xs font-semibold ${
      STATUS_COLORS[status] ||
      "border-gray-200 bg-gray-100 text-gray-700"
    }`}
  >
    {status?.replaceAll("_", " ") || "UNKNOWN"}
  </span>
);

const SummaryCard = ({ title, count, description, accent }) => (
  <div
    className={`rounded-2xl border p-5 shadow-sm ${
      accent
        ? "border-orange-200 bg-orange-50"
        : "border-gray-200 bg-white"
    }`}
  >
    <p className="text-sm font-medium text-gray-600">{title}</p>
    <p className="mt-2 text-3xl font-bold text-gray-950">
      {count}
    </p>
    <p className="mt-1 text-xs text-gray-500">
      {description}
    </p>
  </div>
);

const MyRentals = () => {
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [cancellingId, setCancellingId] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    let active = true;

    const fetchRentals = async () => {
      try {
        const response = await api.get("/rentals/my-rentals");

        if (active) {
          setRentals(response.data?.data?.rentals || []);
        }
      } catch (err) {
        if (active) {
          setError(
            err.response?.data?.message ||
              "Failed to load your rentals."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchRentals();

    return () => {
      active = false;
    };
  }, []);

  const loadRentals = async () => {
    const response = await api.get("/rentals/my-rentals");
    setRentals(response.data?.data?.rentals || []);
  };

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
          "Failed to cancel rental request."
      );
    } finally {
      setCancellingId(null);
    }
  };

  const summary = useMemo(
    () => ({
      total: rentals.length,
      pending: rentals.filter(
        (rental) => rental.status === "PENDING"
      ).length,
      active: rentals.filter(
        (rental) => rental.status === "ACTIVE"
      ).length,
      completed: rentals.filter(
        (rental) => rental.status === "COMPLETED"
      ).length,
    }),
    [rentals]
  );

  const filteredRentals = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return rentals
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

        const matchesSearch = searchableText.includes(query);

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
            return Number(b.totalPrice || 0) -
              Number(a.totalPrice || 0);
          case "price_low":
            return Number(a.totalPrice || 0) -
              Number(b.totalPrice || 0);
          default:
            return (
              new Date(b.createdAt || b.startDate) -
              new Date(a.createdAt || a.startDate)
            );
        }
      });
  }, [rentals, searchTerm, statusFilter, sortBy]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredRentals.length / ITEMS_PER_PAGE)
  );

  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * ITEMS_PER_PAGE;

  const visibleRentals = filteredRentals.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("ALL");
    setSortBy("newest");
    setCurrentPage(1);
  };

  const hasFilters =
    searchTerm.trim() !== "" ||
    statusFilter !== "ALL" ||
    sortBy !== "newest";

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:py-10">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* HEADER */}
        <header>
          <p className="text-xs font-bold uppercase tracking-widest text-orange-600">
            Customer Rentals
          </p>
          <h1 className="mt-2 text-3xl font-bold text-gray-950">
            My Rentals
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Track your equipment rental requests and
            manage upcoming rentals.
          </p>
        </header>

        {successMessage && (
          <div
            role="status"
            className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700"
          >
            {successMessage}
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center text-gray-500">
            Loading rentals...
          </div>
        ) : (
          <>
            {/* SUMMARY CARDS */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <SummaryCard
                title="Total Rentals"
                count={summary.total}
                description="All rental requests"
              />
              <SummaryCard
                title="Pending Requests"
                count={summary.pending}
                description="Awaiting approval"
                accent
              />
              <SummaryCard
                title="Active Rentals"
                count={summary.active}
                description="Currently issued"
              />
              <SummaryCard
                title="Completed"
                count={summary.completed}
                description="Finished rentals"
              />
            </div>

            {/* SEARCH AND FILTERS */}
            <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
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
                    onChange={(event) => {
                      setSearchTerm(event.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="Search name, brand, or model..."
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                  />
                </div>

                <div className="lg:w-48">
                  <label
                    htmlFor="rental-status"
                    className="mb-2 block text-sm font-semibold text-gray-700"
                  >
                    Rental Status
                  </label>
                  <select
                    id="rental-status"
                    value={statusFilter}
                    onChange={(event) => {
                      setStatusFilter(event.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
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

                <div className="lg:w-52">
                  <label
                    htmlFor="rental-sort"
                    className="mb-2 block text-sm font-semibold text-gray-700"
                  >
                    Sort By
                  </label>
                  <select
                    id="rental-sort"
                    value={sortBy}
                    onChange={(event) => {
                      setSortBy(event.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="start_asc">Start Date: Earliest</option>
                    <option value="start_desc">Start Date: Latest</option>
                    <option value="price_high">Price: High to Low</option>
                    <option value="price_low">Price: Low to High</option>
                  </select>
                </div>

                {hasFilters && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="rounded-xl border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            </section>

            {/* RESULT COUNT */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-gray-600">
                Showing{" "}
                <strong className="text-gray-900">
                  {filteredRentals.length
                    ? startIndex + 1
                    : 0}
                  –
                  {Math.min(
                    startIndex + ITEMS_PER_PAGE,
                    filteredRentals.length
                  )}
                </strong>{" "}
                of {filteredRentals.length} rentals
              </p>
              <p className="text-xs text-gray-500">
                {rentals.length} total requests
              </p>
            </div>

            {/* EMPTY STATES */}
            {filteredRentals.length === 0 && (
              <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center">
                <h2 className="text-lg font-semibold text-gray-900">
                  {rentals.length
                    ? "No matching rentals"
                    : "No rental requests yet"}
                </h2>
                <p className="mt-2 text-sm text-gray-500">
                  {rentals.length
                    ? "Try adjusting your search or filters."
                    : "Your equipment rental requests will appear here."}
                </p>
                {hasFilters && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="mt-4 rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            )}

            {/* RENTAL CARDS */}
            <div className="grid gap-4 lg:grid-cols-2">
              {visibleRentals.map((rental) => (
                <article
                  key={rental._id}
                  className="min-w-0 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-orange-200 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="text-base font-bold text-gray-950">
                        {rental.equipment?.name || "Equipment"}
                      </h2>
                      <p className="mt-1 text-xs text-gray-500">
                        {[
                          rental.equipment?.brand,
                          rental.equipment?.model,
                        ]
                          .filter(Boolean)
                          .join(" ") || "Equipment rental"}
                      </p>
                    </div>
                    <StatusBadge status={rental.status} />
                  </div>

                  <div className="mt-5 rounded-xl bg-gray-50 px-4 py-3">
                    <p className="text-xs font-medium text-gray-500">
                      Rental Period
                    </p>
                    <p className="mt-1 text-sm font-semibold text-gray-900">
                      {formatDate(rental.startDate)}
                      <span className="mx-2 text-gray-400">
                        →
                      </span>
                      {formatDate(rental.endDate)}
                    </p>
                  </div>

                  <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4">
                    <div>
                      <p className="text-xs text-gray-500">
                        Total Rental Fee
                      </p>
                      <p className="mt-1 text-lg font-bold text-orange-600">
                        {formatMoney(rental.totalPrice)}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {rental.status === "PENDING" && (
                        <button
                          type="button"
                          disabled={cancellingId === rental._id}
                          onClick={() =>
                            handleCancelRental(rental._id)
                          }
                          className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                        >
                          {cancellingId === rental._id
                            ? "Cancelling..."
                            : "Cancel Request"}
                        </button>
                      )}

                      <Link
                        to={`/customer/rentals/${rental._id}`}
                        className="inline-flex items-center rounded-lg bg-orange-600 px-4 py-2 text-xs font-semibold text-white hover:bg-orange-700"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {/* PAGINATION */}
            {totalPages > 1 && (
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white px-5 py-4">
                <p className="text-sm text-gray-600">
                  Page {safePage} of {totalPages}
                </p>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={safePage === 1}
                    onClick={() =>
                      setCurrentPage(Math.max(1, safePage - 1))
                    }
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:opacity-40"
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
                      aria-current={
                        safePage === page ? "page" : undefined
                      }
                      className={`min-w-9 rounded-lg px-3 py-2 text-sm font-semibold ${
                        safePage === page
                          ? "bg-orange-600 text-white"
                          : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    type="button"
                    disabled={safePage === totalPages}
                    onClick={() =>
                      setCurrentPage(
                        Math.min(totalPages, safePage + 1)
                      )
                    }
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:opacity-40"
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
