import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import api from "../../services/api";

const PAGE_SIZE = 5;

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("en-LK", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
};

const formatMoney = (value) =>
  typeof value === "number"
    ? `LKR ${value.toLocaleString("en-LK", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`
    : "—";

const statusClasses = (status) => {
  const styles = {
    ACTIVE: "bg-emerald-100 text-emerald-700",
    INACTIVE: "bg-red-100 text-red-700",
    TRIAL: "bg-blue-100 text-blue-700",
    GRACE_PERIOD: "bg-amber-100 text-amber-700",
    EXPIRED: "bg-red-100 text-red-700",
    REQUESTED: "bg-amber-100 text-amber-700",
    CONFIRMED: "bg-blue-100 text-blue-700",
    COMPLETED: "bg-emerald-100 text-emerald-700",
    REJECTED: "bg-red-100 text-red-700",
    CANCELLED: "bg-gray-100 text-gray-600",
  };

  return styles[status] || "bg-gray-100 text-gray-600";
};

const StatusBadge = ({ status }) => (
  <span
    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
      statusClasses(status)
    }`}
  >
    {(status || "UNKNOWN").replaceAll("_", " ")}
  </span>
);

const InfoItem = ({ label, value }) => (
  <div>
    <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
      {label}
    </p>
    <div className="mt-1 text-sm font-medium text-gray-800">
      {value ?? "—"}
    </div>
  </div>
);

const SummaryCard = ({ label, value, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="rounded-2xl border border-gray-200 bg-white p-5 text-left shadow-sm transition hover:border-orange-300 hover:shadow-md"
  >
    <p className="text-sm text-gray-500">{label}</p>
    <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
  </button>
);

export default function PhotographerDetails() {
  const { photographerId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const basePath = user?.role === "STAFF_ADMIN" ? "/admin" : "/clerk";

  const [account, setAccount] = useState(null);
  const [profile, setProfile] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [savingStatus, setSavingStatus] = useState(false);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState("ALL");

useEffect(() => {
  let cancelled = false;

  const fetchDetails = async () => {
    try {
      const [detailsResponse, historyResponse] = await Promise.all([
        api.get(`/admin/photographers/${photographerId}`),
        api.get(`/admin/photographers/${photographerId}/history`),
      ]);

      if (cancelled) return;

      const details = detailsResponse.data?.data || {};
      const history = historyResponse.data?.data || {};

      setAccount(details.user || null);
      setProfile(details.photographer || null);
      setBookings(history.bookings || []);
      setSummary(history.summary || null);
      setError("");
    } catch (err) {
      if (cancelled) return;

      setError(
        err.response?.data?.message ||
          "Unable to load photographer details."
      );
    } finally {
      if (!cancelled) {
        setLoading(false);
      }
    }
  };

  fetchDetails();

  return () => {
    cancelled = true;
  };
}, [photographerId]);

  const filteredBookings = useMemo(() => {
    if (filter === "ALL") return bookings;
    return bookings.filter((booking) => booking.status === filter);
  }, [bookings, filter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredBookings.length / PAGE_SIZE)
  );

  const visibleBookings = filteredBookings.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  const changeFilter = (nextFilter) => {
    setFilter(nextFilter);
    setPage(1);
  };

  const changeAccountStatus = async () => {
    if (!account || savingStatus) return;

    const nextStatus =
      account.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";

    if (
      !window.confirm(
        `Are you sure you want to ${
          nextStatus === "ACTIVE" ? "enable" : "disable"
        } this photographer account?`
      )
    ) {
      return;
    }

    setSavingStatus(true);
    setActionError("");
    setActionMessage("");

    try {
      await api.patch(`/admin/users/${account._id}/status`, {
        status: nextStatus,
      });

      setAccount((previous) =>
        previous ? { ...previous, status: nextStatus } : previous
      );

      setActionMessage(
        `Photographer account ${
          nextStatus === "ACTIVE" ? "enabled" : "disabled"
        } successfully.`
      );
    } catch (err) {
      setActionError(
        err.response?.data?.message ||
          "Unable to update photographer account status."
      );
    } finally {
      setSavingStatus(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-full bg-gray-100 px-6 py-12 text-center text-gray-500">
        Loading photographer details...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-full bg-gray-100 px-6 py-8">
        <div className="mx-auto max-w-5xl rounded-2xl bg-white p-8 shadow-sm">
          <p className="text-red-600">{error}</p>
          <button
            type="button"
            onClick={() => navigate(`${basePath}/users`)}
            className="mt-5 font-semibold text-orange-600 hover:text-orange-700"
          >
            ← Back to User Management
          </button>
        </div>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="p-8 text-gray-500">
        Photographer account not found.
      </div>
    );
  }

  const scrollToBookings = () => {
    document.getElementById("photographer-bookings")?.scrollIntoView({
      behavior: "smooth",
    });
  };

  return (
    <div className="min-h-full bg-gray-100 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <button
          type="button"
          onClick={() => navigate(`${basePath}/users`)}
          className="text-sm font-semibold text-orange-600 hover:text-orange-700"
        >
          ← Back to User Management
        </button>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-orange-600">
                User Management
              </p>
              <h1 className="mt-2 text-2xl font-bold text-gray-900">
                Photographer Details
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Profile, subscription, and booking history
              </p>
            </div>
            <StatusBadge status={account.status} />
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-5 border-t border-gray-100 pt-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-100 text-2xl font-bold text-orange-700">
              {account.name?.charAt(0)?.toUpperCase() || "P"}
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-bold text-gray-900">
                {account.name}
              </h2>
              <p className="break-all text-sm text-gray-500">
                {account.email}
              </p>
            </div>

            <button
              type="button"
              disabled={savingStatus}
              onClick={changeAccountStatus}
              className={`rounded-xl px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50 ${
                account.status === "ACTIVE"
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-emerald-600 hover:bg-emerald-700"
              }`}
            >
              {savingStatus
                ? "Updating..."
                : account.status === "ACTIVE"
                  ? "Disable Account"
                  : "Enable Account"}
            </button>
          </div>

          {actionError && (
            <p className="mt-4 text-sm text-red-600">{actionError}</p>
          )}
          {actionMessage && (
            <p className="mt-4 text-sm text-emerald-700">
              {actionMessage}
            </p>
          )}

          <div className="mt-6 grid gap-5 border-t border-gray-100 pt-6 sm:grid-cols-2 lg:grid-cols-4">
            <InfoItem label="Role" value={account.role} />
            <InfoItem label="Joined" value={formatDate(account.createdAt)} />
            <InfoItem
              label="Last Updated"
              value={formatDate(account.updatedAt)}
            />
            <InfoItem
              label="Password Setup"
              value={
                account.mustChangePassword
                  ? "Password change required"
                  : "Completed"
              }
            />
          </div>

          <div className="mt-5 break-all text-xs text-gray-400">
            User ID: {account._id}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900">
            Professional Profile
          </h2>

          {profile ? (
            <>
              <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <InfoItem
                  label="Specialization"
                  value={profile.specialization || "Not provided"}
                />
                <InfoItem
                  label="Location"
                  value={profile.location || "Not provided"}
                />
                <InfoItem
                  label="Hourly Rate"
                  value={formatMoney(profile.hourlyRate)}
                />
                <InfoItem
                  label="Packages"
                  value={profile.packageRates?.length || 0}
                />
              </div>

              <div className="mt-6 border-t border-gray-100 pt-5">
                <InfoItem
                  label="Biography"
                  value={profile.bio || "No biography provided."}
                />
              </div>

              {profile.packageRates?.length > 0 && (
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {profile.packageRates.map((item) => (
                    <div
                      key={item._id}
                      className="rounded-xl border border-gray-200 bg-gray-50 p-4"
                    >
                      <div className="flex justify-between gap-3">
                        <p className="font-semibold text-gray-900">
                          {item.name}
                        </p>
                        <p className="whitespace-nowrap text-sm font-bold text-orange-600">
                          {formatMoney(item.price)}
                        </p>
                      </div>
                      <p className="mt-2 text-sm text-gray-500">
                        {item.description || "No description"}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <p className="mt-4 text-sm text-gray-500">
              No professional profile was found for this account.
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-gray-900">
              Subscription Information
            </h2>
            {profile && (
              <StatusBadge status={profile.subscriptionStatus} />
            )}
          </div>

          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <InfoItem
              label="Trial Ends"
              value={formatDate(profile?.trialEndsAt)}
            />
            <InfoItem
              label="Subscription Starts"
              value={formatDate(profile?.subscriptionStartDate)}
            />
            <InfoItem
              label="Subscription Ends"
              value={formatDate(profile?.subscriptionEndDate)}
            />
            <InfoItem
              label="Grace Period Ends"
              value={formatDate(profile?.gracePeriodEndsAt)}
            />
          </div>
        </div>

        <div>
          <h2 className="mb-4 text-lg font-bold text-gray-900">
            Booking Overview
          </h2>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryCard
              label="Total Bookings"
              value={summary?.totalBookings ?? 0}
              onClick={() => {
                changeFilter("ALL");
                scrollToBookings();
              }}
            />
            <SummaryCard
              label="Requested"
              value={summary?.requestedBookings ?? 0}
              onClick={() => {
                changeFilter("REQUESTED");
                scrollToBookings();
              }}
            />
            <SummaryCard
              label="Confirmed"
              value={summary?.confirmedBookings ?? 0}
              onClick={() => {
                changeFilter("CONFIRMED");
                scrollToBookings();
              }}
            />
            <SummaryCard
              label="Completed"
              value={summary?.completedBookings ?? 0}
              onClick={() => {
                changeFilter("COMPLETED");
                scrollToBookings();
              }}
            />
            <SummaryCard
              label="Rejected"
              value={summary?.rejectedBookings ?? 0}
              onClick={() => {
                changeFilter("REJECTED");
                scrollToBookings();
              }}
            />
            <SummaryCard
              label="Cancelled"
              value={summary?.cancelledBookings ?? 0}
              onClick={() => {
                changeFilter("CANCELLED");
                scrollToBookings();
              }}
            />
            <SummaryCard
              label="Upcoming"
              value={summary?.upcomingBookings ?? 0}
              onClick={scrollToBookings}
            />
            <SummaryCard
              label="Completed Booking Value"
              value={formatMoney(summary?.completedBookingValue ?? 0)}
              onClick={() => {
                changeFilter("COMPLETED");
                scrollToBookings();
              }}
            />
          </div>
        </div>

        <div
          id="photographer-bookings"
          className="scroll-mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Booking History
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                All bookings associated with this photographer
              </p>
            </div>

            <select
              value={filter}
              onChange={(event) => changeFilter(event.target.value)}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 focus:border-orange-500 focus:outline-none"
            >
              {[
                "ALL",
                "REQUESTED",
                "CONFIRMED",
                "COMPLETED",
                "REJECTED",
                "CANCELLED",
              ].map((value) => (
                <option key={value} value={value}>
                  {value === "ALL" ? "All Bookings" : value}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-5 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Booking Date</th>
                  <th className="px-4 py-3">Time</th>
                  <th className="px-4 py-3">Pricing</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {visibleBookings.map((booking) => (
                  <tr key={booking._id} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <p className="font-medium text-gray-900">
                        {booking.customer?.name || "Unknown Customer"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {booking.customer?.email || "—"}
                      </p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-gray-700">
                      {formatDate(booking.date)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-gray-700">
                      {booking.startTime} – {booking.endTime}
                    </td>
                    <td className="px-4 py-4 text-gray-700">
                      {booking.pricingType === "PACKAGE"
                        ? booking.packageNameAtBooking || "Package"
                        : "Hourly"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 font-medium text-gray-900">
                      {formatMoney(booking.totalAmount)}
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge status={booking.status} />
                    </td>
                  </tr>
                ))}

                {visibleBookings.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-12 text-center text-gray-500"
                    >
                      No bookings found for this filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-4">
              <p className="text-sm text-gray-500">
                Page {page} of {totalPages}
              </p>

              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={page === 1}
                  onClick={() => setPage((current) => current - 1)}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={page === totalPages}
                  onClick={() => setPage((current) => current + 1)}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
