
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import api from "../../services/api";

const CustomerDetails = () => {
  const navigate = useNavigate();
  const { customerId } = useParams();
  const { user } = useAuth();

  const isAdmin = user?.role === "STAFF_ADMIN";
  const basePath = isAdmin ? "/admin" : "/clerk";

  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [statusUpdating, setStatusUpdating] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [statusError, setStatusError] = useState("");

  const [deletingCustomer, setDeletingCustomer] = useState(false);
  const [deleteError, setDeleteError] = useState("");


// ==========================================
// CUSTOMER ACTIVITY HISTORY
// ==========================================

const [bookings, setBookings] = useState([]);
const [rentals, setRentals] = useState([]);

const HISTORY_PAGE_SIZE = 5;

const [bookingPage, setBookingPage] = useState(1);
const [rentalPage, setRentalPage] = useState(1);

const [historySummary, setHistorySummary] = useState({
  totalBookings: 0,
  totalRentals: 0,
});

const [historyLoading, setHistoryLoading] = useState(true);
const [historyError, setHistoryError] = useState("");

  useEffect(() => {
    let isActive = true;

    const loadCustomer = async () => {
      try {
        const response = await api.get(
          `/admin/customers/${customerId}`
        );

        if (!isActive) return;

        setCustomer(response.data?.data?.customer || null);
        setError("");
      } catch (err) {
        if (!isActive) return;

        setError(
          err.response?.data?.message ||
            "Unable to load customer details."
        );
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    loadCustomer();

    return () => {
      isActive = false;
    };
  }, [customerId]);

// ==========================================
// LOAD CUSTOMER BOOKING AND RENTAL HISTORY
// ==========================================

useEffect(() => {
  let isActive = true;

  const loadCustomerHistory = async () => {
    try {
      const response = await api.get(
        `/admin/customers/${customerId}/history`
      );

      if (!isActive) return;

      const data = response.data?.data;

      setBookings(data?.bookings || []);
      setRentals(data?.rentals || []);

      setBookingPage(1);
      setRentalPage(1);

      setHistorySummary({
        totalBookings: data?.summary?.totalBookings ?? 0,
        totalRentals: data?.summary?.totalRentals ?? 0,
      });

      setHistoryError("");
    } catch (err) {
      if (!isActive) return;

      setHistoryError(
        err.response?.data?.message ||
          "Unable to load customer activity history."
      );
    } finally {
      if (isActive) {
        setHistoryLoading(false);
      }
    }
  };

  loadCustomerHistory();

  return () => {
    isActive = false;
  };
}, [customerId]);

  const formatDate = (value) => {
    if (!value) return "Not available";

    const date = new Date(value);

    return Number.isNaN(date.getTime())
      ? "Not available"
      : date.toLocaleDateString();
  };

    // ==========================================
    // BOOKING HISTORY PAGINATION
    // ==========================================

    const bookingTotalPages = Math.max(
    1,
    Math.ceil(bookings.length / HISTORY_PAGE_SIZE)
    );

    const paginatedBookings = bookings.slice(
    (bookingPage - 1) * HISTORY_PAGE_SIZE,
    bookingPage * HISTORY_PAGE_SIZE
    ); 

    // ==========================================
    // RENTAL HISTORY PAGINATION
    // ==========================================

    const rentalTotalPages = Math.max(
    1,
    Math.ceil(rentals.length / HISTORY_PAGE_SIZE)
    );

    const paginatedRentals = rentals.slice(
    (rentalPage - 1) * HISTORY_PAGE_SIZE,
    rentalPage * HISTORY_PAGE_SIZE
    );

    const handleCustomerStatusChange = async () => {
    if (!customer || statusUpdating) return;

    const nextStatus =
        customer.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";

    const action =
        nextStatus === "ACTIVE" ? "activate" : "deactivate";

    const confirmed = window.confirm(
        `Are you sure you want to ${action} ${customer.name}'s account?`
    );

    if (!confirmed) return;

    setStatusUpdating(true);
    setStatusMessage("");
    setStatusError("");

    try {
        const response = await api.patch(
        `/admin/customers/${customerId}/status`,
        { status: nextStatus }
        );

        const updatedCustomer = response.data?.data?.customer;

        setCustomer((previous) => ({
        ...previous,
        status: updatedCustomer?.status ?? nextStatus,
        }));

        setStatusMessage(
        response.data?.message ||
            `Customer account ${action}d successfully.`
        );
    } catch (error) {
        setStatusError(
        error.response?.data?.message ||
            "Unable to update customer account status."
        );
    } finally {
        setStatusUpdating(false);
    }
    };

    // ==========================================
    // ADMIN-ONLY CUSTOMER DELETION
    // ==========================================

    const handleDeleteCustomer = async () => {
    // Only Admin can delete customers
    if (!isAdmin || !customer || deletingCustomer) return;

    const confirmed = window.confirm(
        `Are you sure you want to permanently delete ${customer.name}'s account?\n\n` +
        "This action cannot be undone.\n\n" +
        "Customers with linked records cannot be deleted."
    );

    if (!confirmed) return;

    setDeletingCustomer(true);
    setDeleteError("");

    try {
        await api.delete(`/admin/customers/${customerId}`);

        // Redirect to Admin User Management after deletion
        navigate("/admin/users", {
        replace: true,
        });
    } catch (error) {
        setDeleteError(
        error.response?.data?.message ||
            "Unable to delete customer account."
        );
    } finally {
        setDeletingCustomer(false);
    }
    };

  return (
    <main className="min-h-full bg-gray-100 px-6 py-8">
      <div className="mx-auto max-w-5xl">
        <button
          type="button"
          onClick={() => navigate(`${basePath}/users`)}
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-gray-600 transition hover:text-orange-600"
        >
          <span aria-hidden="true">←</span>
          Back to User Management
        </button>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wider text-orange-600">
            Customer Management
          </p>

          <h1 className="mt-2 text-2xl font-bold text-gray-950">
            Customer Details
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Review customer account information.
          </p>
        </div>

        <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          {loading && (
            <p className="text-sm text-gray-500">
              Loading customer details...
            </p>
          )}

          {!loading && error && (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          {!loading && !error && !customer && (
            <p className="text-sm text-gray-500">
              Customer not found.
            </p>
          )}

          {!loading && !error && customer && (
            <>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-950">
                    {customer.name}
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    {customer.email}
                  </p>
                </div>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    customer.status === "ACTIVE"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {customer.status === "ACTIVE"
                    ? "Active"
                    : "Inactive"}
                </span>
              </div>
              
            {/* ==========================================
                CUSTOMER ACCOUNT STATUS MANAGEMENT
            ========================================== */}

            <div className="mt-6 border-t border-gray-200 pt-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                <h3 className="text-sm font-semibold text-gray-900">
                    Account Management
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                    {customer.status === "ACTIVE"
                    ? "Deactivate this account to prevent customer access."
                    : "Activate this account to restore customer access."}
                </p>
                </div>

                <button
                type="button"
                onClick={handleCustomerStatusChange}
                disabled={statusUpdating}
                className={`rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${
                    customer.status === "ACTIVE"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-green-600 hover:bg-green-700"
                }`}
                >
                {statusUpdating
                    ? "Updating..."
                    : customer.status === "ACTIVE"
                    ? "Deactivate Account"
                    : "Activate Account"}
                </button>
            </div>

            {statusMessage && (
                <p role="status" className="mt-4 text-sm font-medium text-green-700">
                {statusMessage}
                </p>
            )}

            {statusError && (
                <p role="alert" className="mt-4 text-sm font-medium text-red-600">
                {statusError}
                </p>
            )}

            {/* ==========================================
                ADMIN-ONLY PERMANENT CUSTOMER DELETION
            ========================================== */}

            {isAdmin && (
            <div className="mt-6 border-t border-red-100 pt-5">
                <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h3 className="text-sm font-semibold text-red-700">
                    Danger Zone
                    </h3>

                    <p className="mt-1 text-sm text-gray-500">
                    Permanently delete this customer account.
                    Customers with linked records cannot be deleted.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={handleDeleteCustomer}
                    disabled={deletingCustomer || statusUpdating}
                    className="rounded-xl bg-red-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {deletingCustomer
                    ? "Deleting..."
                    : "Delete Customer"}
                </button>
                </div>

                {deleteError && (
                <p
                    role="alert"
                    className="mt-4 text-sm font-medium text-red-600"
                >
                    {deleteError}
                </p>
                )}
            </div>
            )}

            </div>

              <div className="mt-6 grid gap-5 border-t border-gray-100 pt-6 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Full Name
                  </p>
                  <p className="mt-2 text-sm font-semibold text-gray-900">
                    {customer.name}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Email Address
                  </p>
                  <p className="mt-2 break-all text-sm font-semibold text-gray-900">
                    {customer.email}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Account Role
                  </p>
                  <p className="mt-2 text-sm font-semibold text-gray-900">
                    {customer.role}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Registration Date
                  </p>
                  <p className="mt-2 text-sm font-semibold text-gray-900">
                    {formatDate(customer.createdAt)}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Last Updated
                  </p>
                  <p className="mt-2 text-sm font-semibold text-gray-900">
                    {formatDate(customer.updatedAt)}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Customer ID
                  </p>
                  <p className="mt-2 break-all text-sm font-semibold text-gray-900">
                    {customer._id}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ==========================================
            CUSTOMER ACTIVITY HISTORY SUMMARY
        ========================================== */}

        <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-950">
            Customer Activity History
        </h2>

        {historyLoading ? (
            <p className="mt-4 text-sm text-gray-500">
            Loading booking and rental history...
            </p>
        ) : historyError ? (
            <p role="alert" className="mt-4 text-sm text-red-600">
            {historyError}
            </p>
        ) : (
            <div className="mt-5 grid gap-4 sm:grid-cols-2">

            <button
            type="button"
            onClick={() => {
                document
                .getElementById("booking-history")
                ?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                });
            }}
            className="w-full cursor-pointer rounded-xl bg-orange-50 p-5 text-left transition-all duration-200 hover:bg-orange-100 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600"
            >
            <p className="text-sm font-medium text-gray-600">
                Photographer Bookings
            </p>

            <div className="mt-2 flex items-center justify-between">
                <p className="text-3xl font-bold text-orange-700">
                {historySummary.totalBookings}
                </p>

                <span className="text-xl text-orange-700" aria-hidden="true">
                →
                </span>
            </div>

            <p className="mt-2 text-xs font-medium text-orange-700">
                View booking history
            </p>
            </button>

            <button
            type="button"
            onClick={() => {
                document
                .getElementById("rental-history")
                ?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                });
            }}
            className="w-full cursor-pointer rounded-xl bg-blue-50 p-5 text-left transition-all duration-200 hover:bg-blue-100 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
            <p className="text-sm font-medium text-gray-600">
                Equipment Rentals
            </p>

            <div className="mt-2 flex items-center justify-between">
                <p className="text-3xl font-bold text-blue-700">
                {historySummary.totalRentals}
                </p>

                <span className="text-xl text-blue-700" aria-hidden="true">
                →
                </span>
            </div>

            <p className="mt-2 text-xs font-medium text-blue-700">
                View rental history
            </p>
            </button>

            </div>
        )}
        </div>

        {/* ==========================================
            PHOTOGRAPHER BOOKING HISTORY
        ========================================== */}

        <div
        id="booking-history"
        className="mt-6 scroll-mt-24 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
        >
        <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
            <h2 className="text-lg font-bold text-gray-950">
                Photographer Booking History
            </h2>

            <p className="mt-1 text-sm text-gray-500">
                All photographer bookings made by this customer.
            </p>
            </div>

            <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
            {historySummary.totalBookings} Bookings
            </span>
        </div>

        {historyLoading ? (
            <p className="mt-6 text-sm text-gray-500">
            Loading bookings...
            </p>
        ) : historyError ? (
            <p role="alert" className="mt-6 text-sm text-red-600">
            {historyError}
            </p>
        ) : bookings.length === 0 ? (
            <div className="mt-6 rounded-xl bg-gray-50 px-5 py-10 text-center">
            <p className="text-sm font-medium text-gray-600">
                No photographer bookings found for this customer.
            </p>
            </div>
        ) : (
            <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[850px] text-left">
                <thead className="bg-gray-50">
                <tr className="text-xs uppercase tracking-wide text-gray-500">
                    <th className="px-4 py-3 font-semibold">
                    Photographer
                    </th>
                    <th className="px-4 py-3 font-semibold">
                    Booking Date
                    </th>
                    <th className="px-4 py-3 font-semibold">
                    Time
                    </th>
                    <th className="px-4 py-3 font-semibold">
                    Pricing
                    </th>
                    <th className="px-4 py-3 font-semibold">
                    Amount
                    </th>
                    <th className="px-4 py-3 font-semibold">
                    Status
                    </th>
                </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                {paginatedBookings.map((booking) => (
                    <tr
                    key={booking._id}
                    className="transition hover:bg-gray-50"
                    >
                    <td className="px-4 py-4">
                        <p className="text-sm font-semibold text-gray-900">
                        {booking.photographer?.user?.name ||
                            "Photographer unavailable"}
                        </p>

                        <p className="mt-1 text-xs text-gray-500">
                        Booked {formatDate(booking.createdAt)}
                        </p>
                    </td>

                    <td className="px-4 py-4 text-sm text-gray-700">
                        {formatDate(booking.date)}
                    </td>

                    <td className="px-4 py-4 text-sm text-gray-700">
                        {booking.startTime || "—"}
                        {" - "}
                        {booking.endTime || "—"}
                    </td>

                    <td className="px-4 py-4">
                        <p className="text-sm font-medium text-gray-800">
                        {booking.pricingType === "PACKAGE"
                            ? "Package"
                            : "Hourly"}
                        </p>

                        {booking.pricingType === "PACKAGE" &&
                        booking.packageNameAtBooking && (
                            <p className="mt-1 text-xs text-gray-500">
                            {booking.packageNameAtBooking}
                            </p>
                        )}
                    </td>

                    <td className="px-4 py-4 text-sm font-semibold text-gray-900">
                        {typeof booking.totalAmount === "number"
                        ? `Rs. ${booking.totalAmount.toLocaleString()}`
                        : "—"}
                    </td>

                    <td className="px-4 py-4">
                        <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                            booking.status === "COMPLETED"
                            ? "bg-green-100 text-green-700"
                            : booking.status === "CONFIRMED"
                                ? "bg-blue-100 text-blue-700"
                                : booking.status === "REQUESTED"
                                ? "bg-yellow-100 text-yellow-700"
                                : booking.status === "REJECTED" ||
                                    booking.status === "CANCELLED"
                                    ? "bg-red-100 text-red-700"
                                    : "bg-gray-100 text-gray-700"
                        }`}
                        >
                        {booking.status}
                        </span>
                    </td>
                    </tr>
                ))}
                </tbody>
            </table>

            {/* BOOKING HISTORY PAGINATION */}

            <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-gray-100 pt-4">
            <p className="text-sm text-gray-500">
                Showing{" "}
                {(bookingPage - 1) * HISTORY_PAGE_SIZE + 1}
                {" - "}
                {Math.min(
                bookingPage * HISTORY_PAGE_SIZE,
                bookings.length
                )}
                {" of "}
                {bookings.length} bookings
            </p>

            <div className="flex items-center gap-3">
                <button
                type="button"
                onClick={() =>
                    setBookingPage((previous) =>
                    Math.max(1, previous - 1)
                    )
                }
                disabled={bookingPage === 1}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                Previous
                </button>

                <span className="text-sm font-medium text-gray-600">
                Page {bookingPage} of {bookingTotalPages}
                </span>

                <button
                type="button"
                onClick={() =>
                    setBookingPage((previous) =>
                    Math.min(bookingTotalPages, previous + 1)
                    )
                }
                disabled={bookingPage >= bookingTotalPages}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                Next
                </button>
            </div>
            </div>

            </div>
        )}
        </div>


        {/* ==========================================
            EQUIPMENT RENTAL HISTORY
        ========================================== */}

        <div
        id="rental-history"
        className="mt-6 scroll-mt-24 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
        >
        <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
            <h2 className="text-lg font-bold text-gray-950">
                Equipment Rental History
            </h2>

            <p className="mt-1 text-sm text-gray-500">
                All equipment rentals made by this customer.
            </p>
            </div>

            <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
            {historySummary.totalRentals} Rentals
            </span>
        </div>

        {historyLoading ? (
            <p className="mt-6 text-sm text-gray-500">
            Loading rentals...
            </p>
        ) : historyError ? (
            <p role="alert" className="mt-6 text-sm text-red-600">
            {historyError}
            </p>
        ) : rentals.length === 0 ? (
            <div className="mt-6 rounded-xl bg-gray-50 px-5 py-10 text-center">
            <p className="text-sm font-medium text-gray-600">
                No equipment rentals found for this customer.
            </p>
            </div>
        ) : (
            <>
            <div className="mt-6 overflow-x-auto">
                <table className="w-full min-w-[850px] text-left">
                <thead className="bg-gray-50">
                    <tr className="text-xs uppercase tracking-wide text-gray-500">
                    <th className="px-4 py-3 font-semibold">
                        Equipment
                    </th>
                    <th className="px-4 py-3 font-semibold">
                        Start Date
                    </th>
                    <th className="px-4 py-3 font-semibold">
                        End Date
                    </th>
                    <th className="px-4 py-3 font-semibold">
                        Total Price
                    </th>
                    <th className="px-4 py-3 font-semibold">
                        Status
                    </th>
                    <th className="px-4 py-3 font-semibold">
                        Requested On
                    </th>
                    </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                    {paginatedRentals.map((rental) => (
                    <tr
                        key={rental._id}
                        className="transition hover:bg-gray-50"
                    >
                        <td className="px-4 py-4">
                        <p className="text-sm font-semibold text-gray-900">
                            {rental.equipment?.name ||
                            "Equipment unavailable"}
                        </p>
                        </td>

                        <td className="px-4 py-4 text-sm text-gray-700">
                        {formatDate(rental.startDate)}
                        </td>

                        <td className="px-4 py-4 text-sm text-gray-700">
                        {formatDate(rental.endDate)}
                        </td>

                        <td className="px-4 py-4 text-sm font-semibold text-gray-900">
                        {typeof rental.totalPrice === "number"
                            ? `Rs. ${rental.totalPrice.toLocaleString()}`
                            : "—"}
                        </td>

                        <td className="px-4 py-4">
                        <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                            rental.status === "COMPLETED" ||
                            rental.status === "RETURNED"
                                ? "bg-green-100 text-green-700"
                                : rental.status === "ACTIVE"
                                ? "bg-blue-100 text-blue-700"
                                : rental.status === "CONFIRMED"
                                    ? "bg-indigo-100 text-indigo-700"
                                    : rental.status === "PENDING"
                                    ? "bg-yellow-100 text-yellow-700"
                                    : rental.status === "REJECTED" ||
                                        rental.status === "CANCELLED"
                                        ? "bg-red-100 text-red-700"
                                        : "bg-gray-100 text-gray-700"
                            }`}
                        >
                            {rental.status}
                        </span>
                        </td>

                        <td className="px-4 py-4 text-sm text-gray-700">
                        {formatDate(rental.createdAt)}
                        </td>
                    </tr>
                    ))}
                </tbody>
                </table>
            </div>

            {/* RENTAL HISTORY PAGINATION */}

            <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-gray-100 pt-4">
                <p className="text-sm text-gray-500">
                Showing{" "}
                {(rentalPage - 1) * HISTORY_PAGE_SIZE + 1}
                {" - "}
                {Math.min(
                    rentalPage * HISTORY_PAGE_SIZE,
                    rentals.length
                )}
                {" of "}
                {rentals.length} rentals
                </p>

                <div className="flex items-center gap-3">
                <button
                    type="button"
                    onClick={() =>
                    setRentalPage((previous) =>
                        Math.max(1, previous - 1)
                    )
                    }
                    disabled={rentalPage === 1}
                    className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                    Previous
                </button>

                <span className="text-sm font-medium text-gray-600">
                    Page {rentalPage} of {rentalTotalPages}
                </span>

                <button
                    type="button"
                    onClick={() =>
                    setRentalPage((previous) =>
                        Math.min(rentalTotalPages, previous + 1)
                    )
                    }
                    disabled={rentalPage >= rentalTotalPages}
                    className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                    Next
                </button>
                </div>
            </div>
            </>
        )}
        </div>

    </main>
  );
};

export default CustomerDetails;
