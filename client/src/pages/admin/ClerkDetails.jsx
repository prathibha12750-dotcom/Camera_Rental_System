
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import api from "../../services/api";

const PAGE_SIZE = 5;

const SECTIONS = [
  {
    key: "rentalApprovals",
    countKey: "totalRentalApprovals",
    title: "Rental Approvals",
    description: "Equipment rental requests approved by this clerk.",
  },
  {
    key: "equipmentReturns",
    countKey: "totalEquipmentReturns",
    title: "Equipment Returns",
    description: "Equipment returns received by this clerk.",
  },
  {
    key: "damageReports",
    countKey: "totalDamageReports",
    title: "Damage Reports",
    description: "Equipment damage reported by this clerk.",
  },
  {
    key: "deductionReviews",
    countKey: "totalDeductionReviews",
    title: "Damage Deduction Reviews",
    description: "Security deposit damage deductions reviewed by this clerk.",
  },
  {
    key: "overduePenaltyReviews",
    countKey: "totalOverduePenaltyReviews",
    title: "Overdue Penalty Reviews",
    description: "Overdue rental penalties reviewed by this clerk.",
  },
  {
    key: "depositSettlements",
    countKey: "totalDepositSettlements",
    title: "Deposit Settlements",
    description: "Security deposits settled by this clerk.",
  },
  {
    key: "refundConfirmations",
    countKey: "totalRefundConfirmations",
    title: "Refund Confirmations",
    description: "Refund payouts confirmed by this clerk.",
  },
];

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
    PENDING: "bg-amber-100 text-amber-700",
    CONFIRMED: "bg-blue-100 text-blue-700",
    COMPLETED: "bg-emerald-100 text-emerald-700",
    RETURNED: "bg-blue-100 text-blue-700",
    REPORTED: "bg-amber-100 text-amber-700",
    UNDER_INSPECTION: "bg-blue-100 text-blue-700",
    MAINTENANCE: "bg-purple-100 text-purple-700",
    RESOLVED: "bg-emerald-100 text-emerald-700",
    APPROVED: "bg-emerald-100 text-emerald-700",
    REJECTED: "bg-red-100 text-red-700",
    SETTLED: "bg-emerald-100 text-emerald-700",
    REFUNDED: "bg-emerald-100 text-emerald-700",
    PARTIALLY_REFUNDED: "bg-blue-100 text-blue-700",
    REFUND_PENDING: "bg-amber-100 text-amber-700",
    DEDUCTED: "bg-purple-100 text-purple-700",
    HELD: "bg-blue-100 text-blue-700",
    NOT_APPLICABLE: "bg-gray-100 text-gray-600",
  };

  return styles[status] || "bg-gray-100 text-gray-700";
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
    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
      {label}
    </p>
    <div className="mt-2 break-words text-sm font-semibold text-gray-900">
      {value ?? "—"}
    </div>
  </div>
);

const SummaryCard = ({ title, value, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="rounded-2xl border border-gray-200 bg-white p-5 text-left shadow-sm transition hover:border-orange-300 hover:bg-orange-50 hover:shadow-md focus-visible:outline-2 focus-visible:outline-orange-600"
  >
    <p className="text-sm font-medium text-gray-600">{title}</p>
    <div className="mt-3 flex items-center justify-between">
      <span className="text-3xl font-bold text-gray-950">{value}</span>
      <span className="text-lg text-orange-600" aria-hidden="true">
        →
      </span>
    </div>
    <p className="mt-2 text-xs font-medium text-orange-600">
      View records
    </p>
  </button>
);

const getRecordDate = (record, sectionKey) => {
  const fields = {
    rentalApprovals: "approvedAt",
    equipmentReturns: "returnedAt",
    damageReports: "createdAt",
    deductionReviews: "deductionReviewedAt",
    overduePenaltyReviews: "overduePenaltyReviewedAt",
    depositSettlements: "settledAt",
    refundConfirmations: "confirmedAt",
  };

  return record[fields[sectionKey]] || record.createdAt;
};

const getRecordStatus = (record, sectionKey) => {
  if (sectionKey === "deductionReviews") {
    return record.deductionApprovalStatus;
  }

  if (sectionKey === "overduePenaltyReviews") {
    return record.overduePenaltyStatus;
  }

  if (sectionKey === "equipmentReturns") {
    return record.condition;
  }

  return record.status;
};

const getRecordAmount = (record, sectionKey) => {
  switch (sectionKey) {
    case "rentalApprovals":
      return formatMoney(record.totalPrice);

    case "damageReports":
      return formatMoney(record.repairCost);

    case "deductionReviews":
      return formatMoney(record.approvedDeductionAmount);

    case "overduePenaltyReviews":
      return formatMoney(record.overduePenaltyAmount);

    case "depositSettlements":
      return formatMoney(record.amount);

    case "refundConfirmations":
      return formatMoney(record.amount);

    default:
      return "—";
  }
};

const getAmountLabel = (sectionKey) => {
  const labels = {
    rentalApprovals: "Rental Price",
    damageReports: "Repair Cost",
    deductionReviews: "Approved Deduction",
    overduePenaltyReviews: "Penalty Amount",
    depositSettlements: "Deposit Amount",
    refundConfirmations: "Refund Amount",
  };

  return labels[sectionKey] || "Amount";
};

const HistorySection = ({ section, records }) => {
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(records.length / PAGE_SIZE));

  const currentPage = Math.min(page, totalPages);

  const visibleRecords = records.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  return (
    <section
      id={`clerk-${section.key}`}
      className="scroll-mt-24 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-950">
            {section.title}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {section.description}
          </p>
        </div>

        <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
          {records.length} Records
        </span>
      </div>

      {records.length === 0 ? (
        <div className="mt-5 rounded-xl bg-gray-50 px-5 py-10 text-center">
          <p className="text-sm text-gray-500">
            No {section.title.toLowerCase()} found for this clerk.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-5 overflow-x-auto">
            <table className="min-w-[800px] w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Equipment / Reference</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">
                    {getAmountLabel(section.key)}
                  </th>
                  <th className="px-4 py-3">Status / Condition</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {visibleRecords.map((record) => (
                  <tr
                    key={record._id}
                    className="transition hover:bg-gray-50"
                  >
                    <td className="px-4 py-4">
                      <p className="font-semibold text-gray-900">
                        {record.customer?.name || "Customer unavailable"}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {record.customer?.email || "—"}
                      </p>
                    </td>

                    <td className="px-4 py-4">
                      <p className="font-medium text-gray-800">
                        {record.equipment?.name ||
                          (record.invoice
                            ? "Invoice reference"
                            : "—")}
                      </p>

                      <p className="mt-1 break-all text-xs text-gray-400">
                        {record.equipment?._id ||
                          record.invoice ||
                          record.rental ||
                          record._id}
                      </p>

                      {record.description && (
                        <p className="mt-2 max-w-xs text-xs text-gray-500">
                          {record.description}
                        </p>
                      )}

                      {record.refundMethod && (
                        <p className="mt-1 text-xs text-gray-500">
                          Method: {record.refundMethod.replaceAll("_", " ")}
                        </p>
                      )}

                      {section.key === "depositSettlements" && (
                        <div className="mt-2 text-xs text-gray-500">
                          <p>
                            Deducted: {formatMoney(record.deductedAmount)}
                          </p>
                          <p>
                            Refunded: {formatMoney(record.refundedAmount)}
                          </p>
                        </div>
                      )}
                    </td>

                    <td className="whitespace-nowrap px-4 py-4 text-gray-700">
                      {formatDate(getRecordDate(record, section.key))}
                    </td>

                    <td className="whitespace-nowrap px-4 py-4 font-semibold text-gray-900">
                      {getRecordAmount(record, section.key)}
                    </td>

                    <td className="px-4 py-4">
                      <StatusBadge
                        status={getRecordStatus(record, section.key)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-gray-100 pt-4">
              <p className="text-sm text-gray-500">
                Showing {(currentPage - 1) * PAGE_SIZE + 1}–
                {Math.min(currentPage * PAGE_SIZE, records.length)} of{" "}
                {records.length}
              </p>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() =>
                    setPage((previous) => Math.max(1, previous - 1))
                  }
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>

                <span className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() =>
                    setPage((previous) =>
                      Math.min(totalPages, previous + 1)
                    )
                  }
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
};

export default function ClerkDetails() {
  const { clerkId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const isAdmin = user?.role === "STAFF_ADMIN";

  const [clerk, setClerk] = useState(null);
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [statusUpdating, setStatusUpdating] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [statusError, setStatusError] = useState("");

  useEffect(() => {
    let isActive = true;

    const loadClerkDetails = async () => {
      try {
        const [detailsResponse, historyResponse] = await Promise.all([
          api.get(`/admin/clerks/${clerkId}`),
          api.get(`/admin/clerks/${clerkId}/history`),
        ]);

        if (!isActive) return;

        setClerk(detailsResponse.data?.data?.clerk || null);
        setHistory(historyResponse.data?.data || null);
        setError("");
      } catch (err) {
        if (!isActive) return;

        setError(
          err.response?.data?.message ||
            "Unable to load clerk details."
        );
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    loadClerkDetails();

    return () => {
      isActive = false;
    };
  }, [clerkId]);

  const recordsBySection = useMemo(() => {
    const result = {};

    for (const section of SECTIONS) {
      result[section.key] = Array.isArray(history?.[section.key])
        ? history[section.key]
        : [];
    }

    return result;
  }, [history]);

  const handleStatusChange = async () => {
    if (!isAdmin || !clerk || statusUpdating) return;

    const nextStatus =
      clerk.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";

    const action =
      nextStatus === "ACTIVE" ? "activate" : "deactivate";

    const confirmed = window.confirm(
      `Are you sure you want to ${action} ${clerk.name}'s account?`
    );

    if (!confirmed) return;

    setStatusUpdating(true);
    setStatusMessage("");
    setStatusError("");

    try {
      await api.patch(`/admin/users/${clerk._id}/status`, {
        status: nextStatus,
      });

      setClerk((previous) =>
        previous ? { ...previous, status: nextStatus } : previous
      );

      setStatusMessage(
        `Clerk account ${
          nextStatus === "ACTIVE" ? "activated" : "deactivated"
        } successfully.`
      );
    } catch (err) {
      setStatusError(
        err.response?.data?.message ||
          "Unable to update clerk account status."
      );
    } finally {
      setStatusUpdating(false);
    }
  };

  const scrollToSection = (sectionKey) => {
    document.getElementById(`clerk-${sectionKey}`)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  if (loading) {
    return (
      <div className="min-h-full bg-gray-100 px-6 py-12 text-center text-gray-500">
        Loading clerk details...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-full bg-gray-100 px-6 py-8">
        <div className="mx-auto max-w-5xl rounded-2xl bg-white p-8 shadow-sm">
          <p role="alert" className="text-red-600">
            {error}
          </p>
          <button
            type="button"
            onClick={() => navigate("/admin/users")}
            className="mt-5 font-semibold text-orange-600 hover:text-orange-700"
          >
            ← Back to User Management
          </button>
        </div>
      </div>
    );
  }

  if (!clerk) {
    return (
      <div className="min-h-full bg-gray-100 p-8 text-gray-500">
        Clerk account not found.
      </div>
    );
  }

  return (
    <main className="min-h-full bg-gray-100 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <button
          type="button"
          onClick={() => navigate("/admin/users")}
          className="text-sm font-semibold text-orange-600 hover:text-orange-700"
        >
          ← Back to User Management
        </button>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-orange-600">
            User Management
          </p>

          <h1 className="mt-2 text-2xl font-bold text-gray-950">
            Clerk Details
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Review account information and operational work records.
          </p>
        </div>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-100 text-2xl font-bold text-orange-700">
                {clerk.name?.charAt(0)?.toUpperCase() || "C"}
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-950">
                  {clerk.name}
                </h2>
                <p className="mt-1 break-all text-sm text-gray-500">
                  {clerk.email}
                </p>
              </div>
            </div>

            <StatusBadge status={clerk.status} />
          </div>

          {isAdmin && (
            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-gray-100 pt-5">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">
                  Account Management
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {clerk.status === "ACTIVE"
                    ? "Deactivate this account to prevent clerk access."
                    : "Activate this account to restore clerk access."}
                </p>
              </div>

              <button
                type="button"
                disabled={statusUpdating}
                onClick={handleStatusChange}
                className={`rounded-xl px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 ${
                  clerk.status === "ACTIVE"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-emerald-600 hover:bg-emerald-700"
                }`}
              >
                {statusUpdating
                  ? "Updating..."
                  : clerk.status === "ACTIVE"
                    ? "Deactivate Account"
                    : "Activate Account"}
              </button>
            </div>
          )}

          {statusMessage && (
            <p role="status" className="mt-4 text-sm text-emerald-700">
              {statusMessage}
            </p>
          )}

          {statusError && (
            <p role="alert" className="mt-4 text-sm text-red-600">
              {statusError}
            </p>
          )}

          <div className="mt-6 grid gap-5 border-t border-gray-100 pt-6 sm:grid-cols-2 lg:grid-cols-3">
            <InfoItem label="Full Name" value={clerk.name} />
            <InfoItem label="Email Address" value={clerk.email} />
            <InfoItem label="Role" value={clerk.role} />
            <InfoItem
              label="Registration Date"
              value={formatDate(clerk.createdAt)}
            />
            <InfoItem
              label="Last Updated"
              value={formatDate(clerk.updatedAt)}
            />
            <InfoItem
              label="Password Setup"
              value={
                clerk.mustChangePassword
                  ? "Password change required"
                  : "No password change required"
              }
            />
          </div>

          <p className="mt-6 break-all border-t border-gray-100 pt-4 text-xs text-gray-400">
            Clerk User ID: {clerk._id}
          </p>
        </section>

        <section>
          <div className="mb-4">
            <h2 className="text-lg font-bold text-gray-950">
              Clerk Work Overview
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Operations associated with this clerk in existing records.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {SECTIONS.map((section) => (
              <SummaryCard
                key={section.key}
                title={section.title}
                value={
                  history?.summary?.[section.countKey] ??
                  recordsBySection[section.key].length
                }
                onClick={() => scrollToSection(section.key)}
              />
            ))}
          </div>
        </section>

        <div className="space-y-6">
          {SECTIONS.map((section) => (
            <HistorySection
              key={`${clerkId}-${section.key}`}
              section={section}
              records={recordsBySection[section.key]}
            />
          ))}
        </div>
      </div>
    </main>
  );
}
