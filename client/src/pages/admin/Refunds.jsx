
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { useAuth } from "../../context/useAuth";

const REFUNDS_PER_PAGE = 8;

const getList = (response, key) => {
  const data = response?.data?.data;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.[key])) return data[key];

  return [];
};

const formatAmount = (value) =>
  `LKR ${Number(value || 0).toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatDate = (value) => {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getStatusStyles = (status) => {
  switch (String(status || "").toUpperCase()) {
    case "COMPLETED":
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";
    case "PENDING":
      return "bg-amber-50 text-amber-700 ring-amber-200";
    case "REJECTED":
    case "CANCELLED":
    case "FAILED":
      return "bg-red-50 text-red-700 ring-red-200";
    default:
      return "bg-slate-100 text-slate-700 ring-slate-200";
  }
};

const Refunds = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [invoices, setInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState("");
  const [refunds, setRefunds] = useState([]);

  const [loadingInvoices, setLoadingInvoices] = useState(true);
  const [loadingRefunds, setLoadingRefunds] = useState(false);

  const [invoiceError, setInvoiceError] = useState("");
  const [refundError, setRefundError] = useState("");

  const [currentPage, setCurrentPage] = useState(1);

  const isClerk = user?.role === "CLERK";
  const isAdmin = user?.role === "STAFF_ADMIN";

  const selectedInvoiceData = useMemo(
    () =>
      invoices.find(
        (invoice) => String(invoice._id) === selectedInvoice
      ),
    [invoices, selectedInvoice]
  );

  const customer = selectedInvoiceData?.customer;

  // ==========================================
  // LOAD INVOICES
  // ==========================================

  useEffect(() => {
    let cancelled = false;

    const loadInvoices = async () => {
      try {
        const response = await api.get("/admin/invoices");

        if (!cancelled) {
          setInvoices(getList(response, "invoices"));
          setInvoiceError("");
        }
      } catch (error) {
        if (!cancelled) {
          setInvoiceError(
            error.response?.data?.message ||
              "Failed to load invoices."
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingInvoices(false);
        }
      }
    };

    loadInvoices();

    return () => {
      cancelled = true;
    };
  }, []);

  // ==========================================
  // LOAD REFUNDS FOR SELECTED INVOICE
  // ==========================================

  useEffect(() => {
    if (!selectedInvoice) return;

    let cancelled = false;

    const loadRefunds = async () => {
      try {
        const response = await api.get(
          `/admin/refunds/invoice/${selectedInvoice}`
        );

        if (!cancelled) {
          setRefunds(getList(response, "refunds"));
          setRefundError("");
        }
      } catch (error) {
        if (!cancelled) {
          setRefunds([]);
          setRefundError(
            error.response?.data?.message ||
              "Failed to load refund history."
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingRefunds(false);
        }
      }
    };

    loadRefunds();

    return () => {
      cancelled = true;
    };
  }, [selectedInvoice]);

  // ==========================================
  // HANDLE INVOICE CHANGE
  // ==========================================

  const handleInvoiceChange = (event) => {
    const invoiceId = event.target.value;

    setSelectedInvoice(invoiceId);
    setRefunds([]);
    setRefundError("");
    setCurrentPage(1);
    setLoadingRefunds(Boolean(invoiceId));
  };

  // ==========================================
  // REFUND SUMMARY
  // ==========================================

  const summary = useMemo(() => {
    return refunds.reduce(
      (acc, refund) => {
        const status = String(
          refund.status || ""
        ).toUpperCase();

        const amount = Number(refund.amount || 0);

        if (status === "PENDING") {
          acc.pendingCount += 1;
          acc.pendingAmount += amount;
        }

        if (status === "COMPLETED") {
          acc.completedCount += 1;
          acc.completedAmount += amount;
        }

        return acc;
      },
      {
        pendingCount: 0,
        pendingAmount: 0,
        completedCount: 0,
        completedAmount: 0,
      }
    );
  }, [refunds]);

  // ==========================================
  // PAGINATION
  // ==========================================

  const totalPages = Math.max(
    1,
    Math.ceil(refunds.length / REFUNDS_PER_PAGE)
  );

  const safeCurrentPage = Math.min(
    currentPage,
    totalPages
  );

  const startIndex =
    (safeCurrentPage - 1) * REFUNDS_PER_PAGE;

  const paginatedRefunds = refunds.slice(
    startIndex,
    startIndex + REFUNDS_PER_PAGE
  );

  // ==========================================
  // RENTAL MANAGEMENT NAVIGATION
  // ==========================================

  const handleManageDeposits = () => {
    if (isClerk) {
      navigate("/clerk/rentals");
      return;
    }

    if (isAdmin) {
      navigate("/admin/rentals");
    }
  };

  // ==========================================
// NAVIGATE TO A REFUND'S RENTAL SETTLEMENT
// ==========================================

const handleManagePayout = () => {
  const rentalId =
    selectedInvoiceData?.rental?._id ||
    selectedInvoiceData?.rental;

  if (!rentalId) {
    setRefundError(
      "The rental linked to this invoice could not be identified."
    );
    return;
  }

  const basePath = isClerk
    ? "/clerk/rentals"
    : "/admin/rentals";

  navigate(
    `${basePath}?settleRental=${encodeURIComponent(rentalId)}`
  );
};

  // ==========================================
  // UI
  // ==========================================

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* HEADER */}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
                Financial Management
              </span>

              <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-medium text-slate-700">
                Read Only
              </span>
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              Refund Management
            </h1>

            <p className="mt-2 max-w-2xl text-sm text-slate-500">
              Review security deposit refunds, monitor pending
              payouts, and view completed refund records.
            </p>
          </div>

          {(isClerk || isAdmin) && (
            <button
              type="button"
              onClick={handleManageDeposits}
              className="rounded-xl bg-orange-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-700"
            >
              Go to Rental Management
            </button>
          )}
        </div>

        {/* WORKFLOW INFORMATION */}

        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
          <div className="flex gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-lg text-blue-700">
              i
            </div>

            <div>
              <h2 className="text-sm font-semibold text-blue-950">
                Refund processing workflow
              </h2>

              <p className="mt-1 text-sm leading-6 text-blue-800">
                This page is for viewing refund records only.
                To review damage deductions, prepare a refund,
                or confirm an actual payout, open
                {" "}
                <strong>
                  Rental Management → Manage Deposits
                </strong>.
                A pending refund does not mean that money
                has already been paid to the customer.
              </p>
            </div>
          </div>
        </div>

        {/* INVOICE SELECTION */}

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-slate-950">
              Find Refund Records
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Select an invoice to view its customer and
              refund history.
            </p>
          </div>

          {invoiceError && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {invoiceError}
            </div>
          )}

          <div className="grid gap-5 lg:grid-cols-2">
            <div>
              <label
                htmlFor="refund-invoice"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Invoice
              </label>

              <select
                id="refund-invoice"
                value={selectedInvoice}
                onChange={handleInvoiceChange}
                disabled={loadingInvoices}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100 disabled:cursor-not-allowed disabled:bg-slate-100"
              >
                <option value="">
                  {loadingInvoices
                    ? "Loading invoices..."
                    : "Select an invoice"}
                </option>

                {invoices.map((invoice) => (
                  <option
                    key={invoice._id}
                    value={invoice._id}
                  >
                    {invoice.invoiceNumber || "Invoice"} -{" "}
                    {invoice.customer?.name || "Customer"}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <p className="mb-2 text-sm font-semibold text-slate-700">
                Customer
              </p>

              <div className="min-h-[46px] rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-sm font-semibold text-slate-900">
                  {customer?.name || "No customer selected"}
                </p>

                {customer?.email && (
                  <p className="mt-1 text-xs text-slate-500">
                    {customer.email}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* SUMMARY */}

        {selectedInvoice && !loadingRefunds && !refundError && (
          <div className="grid gap-4 sm:grid-cols-3">

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-slate-500">
                Total Refund Records
              </p>

              <p className="mt-3 text-3xl font-bold text-slate-950">
                {refunds.length}
              </p>

              <p className="mt-2 text-xs text-slate-400">
                For selected invoice
              </p>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-slate-500">
                Pending Refunds
              </p>

              <p className="mt-3 text-xl font-bold text-amber-700">
                {formatAmount(summary.pendingAmount)}
              </p>

              <p className="mt-2 text-xs text-slate-500">
                {summary.pendingCount} awaiting payout confirmation
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-slate-500">
                Completed Refunds
              </p>

              <p className="mt-3 text-xl font-bold text-emerald-700">
                {formatAmount(summary.completedAmount)}
              </p>

              <p className="mt-2 text-xs text-slate-500">
                {summary.completedCount} confirmed payouts
              </p>
            </div>
          </div>
        )}

        {/* REFUND HISTORY */}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
            <h2 className="text-lg font-semibold text-slate-950">
              Refund History
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {selectedInvoice
                ? `Refund records for ${
                    selectedInvoiceData?.invoiceNumber ||
                    "selected invoice"
                  }`
                : "Select an invoice to view refund records."}
            </p>
          </div>

          {refundError && (
            <div className="m-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {refundError}
            </div>
          )}

          {!selectedInvoice ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl text-slate-500">
                &#128196;
              </div>

              <h3 className="text-base font-semibold text-slate-800">
                No invoice selected
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Choose an invoice above to view its refund history.
              </p>
            </div>
          ) : loadingRefunds ? (
            <div className="px-6 py-16 text-center">
              <p className="text-sm text-slate-500">
                Loading refund history...
              </p>
            </div>
          ) : refundError ? null : refunds.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <h3 className="text-base font-semibold text-slate-800">
                No refunds found
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                No refund records exist for this invoice.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100">
                  <thead className="bg-slate-50">
                    <tr>
                    {[
                      "Date",
                      "Customer",
                      "Refund Amount",
                      "Method",
                      "Status",
                      "Actions",
                    ].map((heading) => (
                        <th
                          key={heading}
                          className="whitespace-nowrap px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
                        >
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {paginatedRefunds.map((refund) => {
                      const status = String(
                        refund.status || "UNKNOWN"
                      ).toUpperCase();

                      return (
                        <tr
                          key={refund._id}
                          className="transition hover:bg-slate-50"
                        >
                          <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-700">
                            {formatDate(
                              refund.refundDate ||
                                refund.createdAt
                            )}
                          </td>

                          <td className="px-5 py-4">
                            <p className="text-sm font-semibold text-slate-900">
                              {refund.customer?.name || "-"}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              {refund.customer?.email || "-"}
                            </p>
                          </td>

                          <td className="whitespace-nowrap px-5 py-4 text-sm font-bold text-slate-900">
                            {formatAmount(refund.amount)}
                          </td>

                          <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-700">
                            {refund.refundMethod === "BANK_TRANSFER"
                              ? "Bank Transfer"
                              : refund.refundMethod === "CASH"
                              ? "Cash"
                              : refund.refundMethod === "CARD"
                              ? "Card"
                              : refund.refundMethod || "-"}
                          </td>

                          <td className="whitespace-nowrap px-5 py-4">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${getStatusStyles(
                                status
                              )}`}
                            >
                              {status}
                            </span>

                            {status === "PENDING" && (
                              <p className="mt-2 text-xs text-amber-700">
                                Awaiting payout confirmation
                              </p>
                            )}

                            {status === "COMPLETED" && (
                              <p className="mt-2 text-xs text-emerald-700">
                                Payout confirmed
                              </p>
                            )}
                          </td>

                          <td className="whitespace-nowrap px-5 py-4">
                            {status === "PENDING" ? (
                              <button
                                type="button"
                                onClick={handleManagePayout}
                                className="rounded-lg bg-orange-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-orange-700"
                              >
                                Manage Payout
                              </button>
                            ) : (
                              <span className="text-xs text-slate-400">
                                No action required
                              </span>
                            )}
                          </td>

                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* PAGINATION */}

              {totalPages > 1 && (
                <div className="flex flex-col gap-4 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-slate-500">
                    Showing {startIndex + 1}–
                    {Math.min(
                      startIndex + REFUNDS_PER_PAGE,
                      refunds.length
                    )} of {refunds.length} refunds
                  </p>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setCurrentPage((page) =>
                          Math.max(page - 1, 1)
                        )
                      }
                      disabled={safeCurrentPage === 1}
                      className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Previous
                    </button>

                    <span className="px-3 text-sm text-slate-600">
                      {safeCurrentPage} / {totalPages}
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        setCurrentPage((page) =>
                          Math.min(page + 1, totalPages)
                        )
                      }
                      disabled={safeCurrentPage === totalPages}
                      className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* FOOTER */}

        <div className="rounded-xl border border-slate-200 bg-white px-5 py-4">
          <p className="text-xs leading-5 text-slate-500">
            Refund records are read-only on this page.
            Refund preparation, damage deduction settlement,
            and payout confirmation are handled through
            Rental Management. Never confirm a payout
            before the actual payment has been completed.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Refunds;
