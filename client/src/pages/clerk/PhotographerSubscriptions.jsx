
import { useEffect, useState } from "react";
import api from "../../services/api";

const PHOTOGRAPHERS_PER_PAGE = 8;

const getSubscriptionStatusStyle = (status) => {
  switch (status) {
    case "ACTIVE":
      return "bg-green-100 text-green-700";
    case "GRACE_PERIOD":
      return "bg-blue-100 text-blue-700";
    case "EXPIRED":
      return "bg-red-100 text-red-700";
    default:
      return "bg-amber-100 text-amber-700";
  }
};

const getPaymentStatusStyle = (status) => {
  switch (status) {
    case "COMPLETED":
      return "bg-green-100 text-green-700";
    case "PENDING":
      return "bg-amber-100 text-amber-700";
    case "REJECTED":
      return "bg-red-100 text-red-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

const getSubscriptionValidUntil = (photographer) => {
  const status = photographer.subscriptionStatus;

  let date = null;

  if (status === "TRIAL") {
    date = photographer.trialEndsAt;
  } else if (status === "ACTIVE") {
    date = photographer.subscriptionEndDate;
  } else if (status === "GRACE_PERIOD") {
    date = photographer.gracePeriodEndsAt;
  }

  if (!date) {
    return "—";
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "—";
  }

  return parsedDate.toLocaleString();
};

const PhotographerSubscriptions = ({
  embedded = false,
}) => {
  const [photographers, setPhotographers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    let active = true;

    const loadPhotographers = async () => {
      try {
        const response = await api.get(
          "/admin/photographers/subscriptions"
        );

        if (!active) {
          return;
        }

        setError("");

        setPhotographers(
          response.data?.data?.photographers || []
        );
      } catch (err) {
        if (!active) {
          return;
        }

        setError(
          err.response?.data?.message ||
            "Unable to load photographer subscriptions."
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadPhotographers();

    return () => {
      active = false;
    };
  }, []);

  const totalPages = Math.max(
    1,
    Math.ceil(
      photographers.length / PHOTOGRAPHERS_PER_PAGE
    )
  );

  const startIndex =
    (currentPage - 1) * PHOTOGRAPHERS_PER_PAGE;

  const paginatedPhotographers = photographers.slice(
    startIndex,
    startIndex + PHOTOGRAPHERS_PER_PAGE
  );

  const activeSubscriptions = photographers.filter(
    (photographer) =>
      photographer.subscriptionStatus === "ACTIVE"
  ).length;

  const gracePeriodSubscriptions = photographers.filter(
    (photographer) =>
      photographer.subscriptionStatus === "GRACE_PERIOD"
  ).length;

  const expiredSubscriptions = photographers.filter(
    (photographer) =>
      photographer.subscriptionStatus === "EXPIRED"
  ).length;

  if (loading) {
    return (
      <div
        className={
          embedded
            ? "px-6 pb-6"
            : "p-6"
        }
      >
        <p className="text-sm text-gray-500">
          Loading photographer subscriptions...
        </p>
      </div>
    );
  }

  return (
    <div
      className={
        embedded
          ? "space-y-6 px-6 pb-6"
          : "space-y-6 p-6"
      }
    >
      {!embedded && (
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-orange-600">
            Photographer Management
          </p>

          <h1 className="mt-1 text-2xl font-bold text-gray-900">
            Photographer Subscriptions
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Review photographer account and subscription
            status.
          </p>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {/* Subscription summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">
            Total Photographers
          </p>

          <p className="mt-2 text-3xl font-bold text-gray-900">
            {photographers.length}
          </p>
        </div>

        <div className="rounded-2xl border border-green-200 bg-green-50 p-5 shadow-sm">
          <p className="text-sm font-medium text-green-700">
            Active Subscriptions
          </p>

          <p className="mt-2 text-3xl font-bold text-green-800">
            {activeSubscriptions}
          </p>
        </div>

        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 shadow-sm">
          <p className="text-sm font-medium text-blue-700">
            Grace Period
          </p>

          <p className="mt-2 text-3xl font-bold text-blue-800">
            {gracePeriodSubscriptions}
          </p>
        </div>

        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 shadow-sm">
          <p className="text-sm font-medium text-red-700">
            Expired Subscriptions
          </p>

          <p className="mt-2 text-3xl font-bold text-red-800">
            {expiredSubscriptions}
          </p>
        </div>
      </div>

      {/* Photographer subscription table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-5 py-4">
          <h2 className="text-base font-semibold text-gray-900">
            Photographer Subscription Records
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            View subscription periods, payment information,
            and account status.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {[
                  "Photographer",
                  "Specialization",
                  "Location",
                  "Subscription",
                  "Valid Until",
                  "Latest Payment",
                  "Account",
                ].map((heading) => (
                  <th
                    key={heading}
                    scope="col"
                    className="whitespace-nowrap px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 bg-white">
              {paginatedPhotographers.map(
                (photographer) => (
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
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getSubscriptionStatusStyle(
                          photographer.subscriptionStatus
                        )}`}
                      >
                        {photographer.subscriptionStatus ||
                          "UNKNOWN"}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-600">
                      {getSubscriptionValidUntil(
                        photographer
                      )}
                    </td>

                    <td className="px-5 py-4">
                      {photographer.latestPayment ? (
                        <div className="space-y-1">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getPaymentStatusStyle(
                              photographer.latestPayment
                                .paymentStatus
                            )}`}
                          >
                            {photographer.latestPayment
                              .paymentStatus === "COMPLETED"
                              ? "APPROVED"
                              : photographer.latestPayment
                                  .paymentStatus ||
                                "UNKNOWN"}
                          </span>

                          {photographer.latestPayment
                            .reference && (
                            <p
                              className="max-w-32 truncate text-xs text-gray-500"
                              title={
                                photographer.latestPayment
                                  .reference
                              }
                            >
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
                        {photographer.accountStatus ||
                          "UNKNOWN"}
                      </span>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>

        {photographers.length === 0 && (
          <div className="px-5 py-12 text-center">
            <p className="text-sm font-medium text-gray-600">
              No photographers found.
            </p>
          </div>
        )}

        {/* Pagination */}
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
                  startIndex + PHOTOGRAPHERS_PER_PAGE,
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
                    Math.min(page + 1, totalPages)
                  )
                }
                disabled={currentPage === totalPages}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-600 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PhotographerSubscriptions;
