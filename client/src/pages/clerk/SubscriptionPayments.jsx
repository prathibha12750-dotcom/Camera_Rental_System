import { useEffect, useState } from "react";
import api from "../../services/api";

const SubscriptionPayments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processingId, setProcessingId] = useState(null);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);

const paymentsPerPage = 8;

  useEffect(() => {
    let active = true;

    const loadPayments = async () => {
      try {
        const response = await api.get(
          "/admin/subscription-payments/verification"
        );

        if (active) {
          setPayments(
            response.data?.data?.payments || []
          );
        }
      } catch (err) {
        if (active) {
          setError(
            err.response?.data?.message ||
              "Unable to load subscription payments."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadPayments();

    return () => {
      active = false;
    };
  }, []);

    const handleViewReceipt = async (payment) => {
    try {
        setError("");

        const response = await api.get(
        `/admin/subscription-payments/${payment._id}/receipt`,
        {
            responseType: "blob",
        }
        );

        const fileUrl =
        URL.createObjectURL(
            response.data
        );

        window.open(
        fileUrl,
        "_blank",
        "noopener,noreferrer"
        );

        setTimeout(() => {
        URL.revokeObjectURL(fileUrl);
        }, 60000);
    } catch (err) {
        setError(
        err.response?.data?.message ||
            "Unable to open the payment receipt."
        );
    }
    };

    const handleApprove = async (payment) => {
    const confirmed = window.confirm(
        `Approve the subscription payment from ${
        payment.user?.name || "this photographer"
        }?`
    );

    if (!confirmed) {
        return;
    }

    try {
        setProcessingId(payment._id);
        setError("");

        const response = await api.patch(
        `/admin/subscription-payments/${payment._id}/approve`
        );

        setPayments((currentPayments) =>
        currentPayments.map((item) =>
            item._id === payment._id
            ? {
                ...item,
                paymentStatus: "COMPLETED",
                paymentDate:
                    response.data?.data?.payment
                    ?.paymentDate,
                periodStart:
                    response.data?.data?.payment
                    ?.periodStart,
                periodEnd:
                    response.data?.data?.payment
                    ?.periodEnd,
                verifiedAt:
                    response.data?.data?.payment
                    ?.verifiedAt,
                }
            : item
        )
        );
    } catch (err) {
        setError(
        err.response?.data?.message ||
            "Unable to approve the subscription payment."
        );
    } finally {
        setProcessingId(null);
    }
    };

    const handleReject = async (payment) => {
    const rejectionReason = window.prompt(
        `Enter the reason for rejecting ${
        payment.user?.name || "this photographer"
        }'s payment:`
    );

    // Cancel was clicked.
    if (rejectionReason === null) {
        return;
    }

    const cleanedReason =
        rejectionReason.trim();

    if (!cleanedReason) {
        setError(
        "A rejection reason is required."
        );
        return;
    }

    if (cleanedReason.length > 500) {
        setError(
        "Rejection reason cannot exceed 500 characters."
        );
        return;
    }

    try {
        setProcessingId(payment._id);
        setError("");

        const response = await api.patch(
        `/admin/subscription-payments/${payment._id}/reject`,
        {
            rejectionReason:
            cleanedReason,
        }
        );

        setPayments((currentPayments) =>
        currentPayments.map((item) =>
            item._id === payment._id
            ? {
                ...item,
                paymentStatus:
                    "REJECTED",
                rejectionReason:
                    response.data?.data?.payment
                    ?.rejectionReason ||
                    cleanedReason,
                verifiedAt:
                    response.data?.data?.payment
                    ?.verifiedAt,
                verifiedBy:
                    response.data?.data?.payment
                    ?.verifiedBy,
                }
            : item
        )
        );
    } catch (err) {
        setError(
        err.response?.data?.message ||
            "Unable to reject the subscription payment."
        );
    } finally {
        setProcessingId(null);
    }
    };

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-sm text-gray-500">
          Loading subscription payments...
        </p>
      </div>
    );
  }

const filteredPayments = payments.filter(
  (payment) => {
    if (statusFilter === "ALL") {
      return true;
    }

    if (statusFilter === "APPROVED") {
      return (
        payment.paymentStatus === "COMPLETED"
      );
    }

    return (
      payment.paymentStatus === statusFilter
    );
  }
);

const totalPages = Math.max(
  1,
  Math.ceil(
    filteredPayments.length /
      paymentsPerPage
  )
);

const startIndex =
  (currentPage - 1) * paymentsPerPage;

const paginatedPayments =
  filteredPayments.slice(
    startIndex,
    startIndex + paymentsPerPage
  );

  return (
    <div className="space-y-6 p-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-orange-600">
          Subscription Verification
        </p>

        <h1 className="mt-1 text-2xl font-bold text-gray-900">
          Photographer Payments
        </h1>

        <p className="mt-2 text-sm text-gray-500">
          Review photographer subscription payment
          submissions and verify their payment receipts.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {!error && payments.length === 0 && (
        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <p className="font-medium text-gray-800">
            No subscription payments found.
          </p>

          <p className="mt-1 text-sm text-gray-500">
            Photographer payment submissions will
            appear here.
          </p>
        </div>
      )}

    <div className="mb-5 flex flex-wrap items-center gap-2">
    {[
        {
        label: "All",
        value: "ALL",
        count: payments.length,
        },
        {
        label: "Pending",
        value: "PENDING",
        count: payments.filter(
            (payment) =>
            payment.paymentStatus === "PENDING"
        ).length,
        },
        {
        label: "Approved",
        value: "APPROVED",
        count: payments.filter(
            (payment) =>
            payment.paymentStatus === "COMPLETED"
        ).length,
        },
        {
        label: "Rejected",
        value: "REJECTED",
        count: payments.filter(
            (payment) =>
            payment.paymentStatus === "REJECTED"
        ).length,
        },
    ].map((filter) => {
        const isActive =
        statusFilter === filter.value;

        return (
        <button
            key={filter.value}
            type="button"
            onClick={() => {
            setStatusFilter(filter.value);
            setCurrentPage(1);
            }}
            className={`inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 text-sm font-semibold transition ${
            isActive
                ? "border-orange-500 bg-orange-500 text-white shadow-sm"
                : "border-gray-200 bg-white text-gray-600 hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700"
            }`}
        >
            <span>{filter.label}</span>

            <span
            className={`rounded-full px-2 py-0.5 text-xs ${
                isActive
                ? "bg-white/20 text-white"
                : "bg-gray-100 text-gray-600"
            }`}
            >
            {filter.count}
            </span>
        </button>
        );
    })}
    </div>

    {payments.length > 0 && (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-5 py-4">
        <h2 className="font-semibold text-gray-900">
            Payment Submissions
        </h2>

        <p className="mt-1 text-sm text-gray-500">
            {payments.length} subscription payment
            {payments.length === 1 ? "" : "s"} found.
        </p>
        </div>

        <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
            <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Photographer
                </th>

                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Payment
                </th>

                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Reference
                </th>

                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Submitted
                </th>

                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Status
                </th>

                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Actions
                </th>                

            </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 bg-white">
            {paginatedPayments.map((payment) => (
                <tr
                key={payment._id}
                className="transition hover:bg-gray-50"
                >
                <td className="px-5 py-4">
                    <p className="text-sm font-semibold text-gray-900">
                    {payment.user?.name ||
                        "Photographer"}
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                    {payment.user?.email ||
                        "Email not available"}
                    </p>
                </td>

                <td className="px-5 py-4">
                    <p className="text-sm font-semibold text-gray-900">
                    {payment.currency}{" "}
                    {Number(
                        payment.amount || 0
                    ).toLocaleString()}
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                    {payment.paymentMethod
                        ?.replaceAll("_", " ") ||
                        "Not available"}
                    </p>
                </td>

                <td className="px-5 py-4 text-sm text-gray-600">
                    {payment.reference ||
                    "No reference"}
                </td>

                <td className="px-5 py-4 text-sm text-gray-600">
                    {payment.submittedAt
                    ? new Date(
                        payment.submittedAt
                        ).toLocaleString()
                    : "Not available"}
                </td>

                <td className="px-5 py-4">
                    <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                        payment.paymentStatus ===
                        "COMPLETED"
                        ? "bg-green-100 text-green-700"
                        : payment.paymentStatus ===
                            "REJECTED"
                            ? "bg-red-100 text-red-700"
                            : "bg-amber-100 text-amber-700"
                    }`}
                    >
                    {payment.paymentStatus}
                    </span>
                    {payment.paymentStatus === "REJECTED" &&
                    payment.rejectionReason && (
                        <p className="mt-2 max-w-48 text-xs leading-5 text-red-600">
                        {payment.rejectionReason}
                        </p>
                    )}
                </td>

                <td className="px-5 py-4">
                {payment.receiptUrl ? (
                    <div className="flex items-center gap-2 whitespace-nowrap">
                    <button
                        type="button"
                        onClick={() =>
                        handleViewReceipt(payment)
                        }
                        className="inline-flex h-8 items-center justify-center rounded-lg border border-orange-200 bg-orange-50 px-3 text-xs font-semibold text-orange-700 transition hover:border-orange-300 hover:bg-orange-100"
                    >
                        View
                    </button>

                    {payment.paymentStatus === "PENDING" && (
                        <button
                        type="button"
                        onClick={() =>
                            handleApprove(payment)
                        }
                        disabled={
                            processingId === payment._id
                        }
                        className="inline-flex h-8 items-center justify-center rounded-lg bg-green-600 px-3 text-xs font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                        {processingId === payment._id
                            ? "Processing..."
                            : "Approve"}
                        </button>
                    )}
                        {payment.paymentStatus === "PENDING" && (
                        <button
                            type="button"
                            onClick={() => handleReject(payment)}
                            disabled={processingId === payment._id}
                            className="inline-flex h-8 items-center justify-center rounded-lg border border-red-200 bg-red-50 px-3 text-xs font-semibold text-red-700 transition hover:border-red-300 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Reject
                        </button>
                        )}

                    </div>
                ) : (
                    <span className="text-xs text-gray-400">
                    No receipt
                    </span>
                )}
                </td>
                </tr>
            ))}
            </tbody>
        </table>

        {filteredPayments.length > 0 && (
        <div className="flex flex-col gap-3 border-t border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-gray-500">
            Showing{" "}
            <span className="font-semibold text-gray-700">
                {startIndex + 1}
            </span>
            {" - "}
            <span className="font-semibold text-gray-700">
                {Math.min(
                startIndex + paymentsPerPage,
                filteredPayments.length
                )}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-gray-700">
                {filteredPayments.length}
            </span>{" "}
            payments
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
    )}
    </div>
  );
};

export default SubscriptionPayments;