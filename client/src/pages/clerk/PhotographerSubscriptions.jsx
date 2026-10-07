import { useEffect, useState } from "react";
import api from "../../services/api";

const PhotographerSubscriptions = () => {
  const [photographers, setPhotographers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const photographersPerPage = 8;

  useEffect(() => {
    const loadPhotographers = async () => {
      try {
        setError("");

        const response = await api.get(
          "/admin/photographers/subscriptions"
        );

        setPhotographers(
          response.data?.data?.photographers ||
            []
        );
      } catch (err) {
        setError(
          err.response?.data?.message ||
            "Unable to load photographer subscriptions."
        );
      } finally {
        setLoading(false);
      }
    };

    loadPhotographers();
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-sm text-gray-500">
          Loading photographer
          subscriptions...
        </p>
      </div>
    );
  }

  const totalPages = Math.max(
  1,
  Math.ceil(
    photographers.length /
      photographersPerPage
  )
);

const startIndex =
  (currentPage - 1) *
  photographersPerPage;

const paginatedPhotographers =
  photographers.slice(
    startIndex,
    startIndex + photographersPerPage
  );

  return (
    <div className="space-y-6 p-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-orange-600">
          Photographer Management
        </p>

        <h1 className="mt-1 text-2xl font-bold text-gray-900">
          Photographer Subscriptions
        </h1>

        <p className="mt-2 text-sm text-gray-500">
          Review photographer account and
          subscription status.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

        <div className="max-w-sm">
        <div className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
            <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-6 w-6"
                aria-hidden="true"
            >
                <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"
                />
                <circle
                cx="9"
                cy="7"
                r="4"
                />
                <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"
                />
            </svg>
            </div>

            <div>
            <p className="text-sm font-medium text-gray-500">
                Total Photographers
            </p>

            <p className="mt-1 text-3xl font-bold tracking-tight text-gray-900">
                {photographers.length}
            </p>
            </div>
        </div>
        </div>

    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
    <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
            <tr>
            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Photographer
            </th>

            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Specialization
            </th>

            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Location
            </th>

            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Subscription
            </th>

            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Valid Until
            </th>

            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
            Latest Payment
            </th>

            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Account
            </th>
            </tr>
        </thead>

        <tbody className="divide-y divide-gray-100 bg-white">
            {paginatedPhotographers.map((photographer) => (
            <tr
                key={photographer.photographerId}
                className="transition hover:bg-gray-50"
            >
                <td className="px-5 py-4">
                <p className="font-semibold text-gray-900">
                    {photographer.name}
                </p>

                <p className="mt-1 text-xs text-gray-500">
                    {photographer.email}
                </p>
                </td>

                <td className="px-5 py-4 text-sm text-gray-600">
                {photographer.specialization ||
                    "Not specified"}
                </td>

                <td className="px-5 py-4 text-sm text-gray-600">
                {photographer.location ||
                    "Not specified"}
                </td>

                <td className="px-5 py-4">
                <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                    photographer.subscriptionStatus ===
                    "ACTIVE"
                        ? "bg-green-100 text-green-700"
                        : photographer.subscriptionStatus ===
                            "GRACE_PERIOD"
                        ? "bg-blue-100 text-blue-700"
                        : photographer.subscriptionStatus ===
                            "EXPIRED"
                            ? "bg-red-100 text-red-700"
                            : "bg-amber-100 text-amber-700"
                    }`}
                >
                    {photographer.subscriptionStatus}
                </span>
                </td>

                <td className="px-5 py-4 text-sm text-gray-600">
                {(() => {
                    const status =
                    photographer.subscriptionStatus;

                    let date = null;

                    if (status === "TRIAL") {
                    date = photographer.trialEndsAt;
                    } else if (status === "ACTIVE") {
                    date =
                        photographer.subscriptionEndDate;
                    } else if (
                    status === "GRACE_PERIOD"
                    ) {
                    date =
                        photographer.gracePeriodEndsAt;
                    }

                    if (!date) {
                    return (
                        <span className="text-gray-400">
                        —
                        </span>
                    );
                    }

                    return new Date(date).toLocaleString();
                })()}
                </td>

                <td className="px-5 py-4">
                {photographer.latestPayment ? (
                    <div className="space-y-1">
                    <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                        photographer.latestPayment
                            .paymentStatus === "COMPLETED"
                            ? "bg-green-100 text-green-700"
                            : photographer.latestPayment
                                .paymentStatus === "PENDING"
                            ? "bg-amber-100 text-amber-700"
                            : photographer.latestPayment
                                    .paymentStatus === "REJECTED"
                                ? "bg-red-100 text-red-700"
                                : "bg-gray-100 text-gray-700"
                        }`}
                    >
                        {photographer.latestPayment
                        .paymentStatus === "COMPLETED"
                        ? "APPROVED"
                        : photographer.latestPayment
                            .paymentStatus}
                    </span>

                    {photographer.latestPayment.reference && (
                        <p className="max-w-32 truncate text-xs text-gray-500">
                        {
                            photographer.latestPayment
                            .reference
                        }
                        </p>
                    )}
                    </div>
                ) : (
                    <span className="text-sm text-gray-400">
                    No payment
                    </span>
                )}
                </td>

                <td className="px-5 py-4">
                <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                    photographer.accountStatus ===
                    "ACTIVE"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                >
                    {photographer.accountStatus}
                </span>
                </td>
            </tr>
            ))}
        </tbody>
        </table>
        {photographers.length > 0 && (
        <div className="flex flex-col gap-3 border-t border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-gray-500">
            Showing{" "}
            <span className="font-semibold text-gray-700">
                {startIndex + 1}
            </span>
            {" - "}
            <span className="font-semibold text-gray-700">
                {Math.min(
                startIndex +
                    photographersPerPage,
                photographers.length
                )}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-gray-700">
                {photographers.length}
            </span>{" "}
            photographers
            </p>

            <div className="flex items-center gap-2">
            <button
                type="button"
                onClick={() =>
                setCurrentPage((page) =>
                    Math.max(page - 1, 1)
                )
                }
                disabled={currentPage === 1}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-600 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
                Previous
            </button>

            <span className="px-2 text-sm font-medium text-gray-600">
                Page {currentPage} of {totalPages}
            </span>

            <button
                type="button"
                onClick={() =>
                setCurrentPage((page) =>
                    Math.min(
                    page + 1,
                    totalPages
                    )
                )
                }
                disabled={
                currentPage === totalPages
                }
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-600 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
                Next
            </button>
            </div>
        </div>
        )}
    </div>

    {photographers.length === 0 && (
        <div className="px-5 py-12 text-center">
        <p className="text-sm font-medium text-gray-600">
            No photographers found.
        </p>
        </div>
    )}
    </div>
    </div>
  );
};

export default PhotographerSubscriptions;