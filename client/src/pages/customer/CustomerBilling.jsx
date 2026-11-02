
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";

const PAGE_SIZE = 10;

const money = (value) =>
  `LKR ${Number(value ?? 0).toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const dateText = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
};

const readable = (value) =>
  String(value || "Not available")
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const StatusBadge = ({ status }) => {
  const styles = {
    PAID: "bg-green-50 text-green-700 ring-green-200",
    COMPLETED: "bg-green-50 text-green-700 ring-green-200",
    PENDING: "bg-amber-50 text-amber-700 ring-amber-200",
    PARTIALLY_PAID:
      "bg-amber-50 text-amber-700 ring-amber-200",
    PENDING_VERIFICATION:
      "bg-blue-50 text-blue-700 ring-blue-200",
    REJECTED: "bg-red-50 text-red-700 ring-red-200",
    FAILED: "bg-red-50 text-red-700 ring-red-200",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
        styles[status] ||
        "bg-gray-100 text-gray-700 ring-gray-200"
      }`}
    >
      {readable(status)}
    </span>
  );
};

const SummaryCard = ({ label, value, description, accent }) => (
  <div
    className={`rounded-2xl border p-5 shadow-sm ${
      accent
        ? "border-orange-200 bg-orange-50"
        : "border-gray-200 bg-white"
    }`}
  >
    <p className="text-sm font-medium text-gray-600">{label}</p>
    <p className="mt-2 break-words text-xl font-bold text-gray-950">
      {value}
    </p>
    <p className="mt-2 text-xs text-gray-500">{description}</p>
  </div>
);

const Pagination = ({
  page,
  totalPages,
  onChange,
  totalItems,
}) => {
  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 px-5 py-4">
      <p className="text-xs text-gray-500">
        Page {page} of {totalPages} · {totalItems} records
      </p>

      <div className="flex gap-2">
        <button
          type="button"
          disabled={page === 1}
          onClick={() => onChange(page - 1)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Previous
        </button>
        <button
          type="button"
          disabled={page === totalPages}
          onClick={() => onChange(page + 1)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
};

const CustomerBilling = () => {
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);

  const [loadingInvoices, setLoadingInvoices] = useState(true);
  const [loadingPayments, setLoadingPayments] = useState(true);

  const [invoiceError, setInvoiceError] = useState("");
  const [paymentError, setPaymentError] = useState("");

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [invoicePage, setInvoicePage] = useState(1);
  const [paymentPage, setPaymentPage] = useState(1);

  useEffect(() => {
    let active = true;

    const loadInvoices = async () => {
      try {
        const response = await api.get("/customer/invoices");

        if (active) {
          setInvoices(response.data?.data?.invoices || []);
        }
      } catch (error) {
        if (active) {
          setInvoiceError(
            error.response?.data?.message ||
              "Failed to load your invoices."
          );
        }
      } finally {
        if (active) setLoadingInvoices(false);
      }
    };

    const loadPayments = async () => {
      try {
        const response = await api.get("/customer/payments");

        if (active) {
          setPayments(response.data?.data?.payments || []);
        }
      } catch (error) {
        if (active) {
          setPaymentError(
            error.response?.data?.message ||
              "Failed to load your payment history."
          );
        }
      } finally {
        if (active) setLoadingPayments(false);
      }
    };

    loadInvoices();
    loadPayments();

    return () => {
      active = false;
    };
  }, []);

  const summary = useMemo(() => {
    const totalInvoiced = invoices.reduce(
      (sum, invoice) => sum + Number(invoice.totalAmount || 0),
      0
    );

    const paidInvoices = invoices.filter(
      (invoice) => invoice.paymentStatus === "PAID"
    ).length;

    const pendingInvoices = invoices.filter(
      (invoice) => invoice.paymentStatus !== "PAID"
    ).length;

    // Only verified/recorded payments contribute to this
    // estimate. Unverified bank receipts are excluded.
    const verifiedPayments = payments.filter((payment) =>
      ["COMPLETED", "PAID"].includes(payment.paymentStatus)
    );

    const paidByInvoice = new Map();

    verifiedPayments.forEach((payment) => {
      const invoiceId =
        payment.invoice?._id || payment.invoice;

      if (!invoiceId) return;

      const key = String(invoiceId);

      paidByInvoice.set(
        key,
        (paidByInvoice.get(key) || 0) +
          Number(payment.amount || 0)
      );
    });

    const outstanding = invoices.reduce((sum, invoice) => {
      if (invoice.paymentStatus === "PAID") return sum;

      const recordedPaid =
        paidByInvoice.get(String(invoice._id)) || 0;

      return (
        sum +
        Math.max(
          0,
          Number(invoice.totalAmount || 0) - recordedPaid
        )
      );
    }, 0);

    return {
      totalInvoiced,
      outstanding,
      paidInvoices,
      pendingInvoices,
    };
  }, [invoices, payments]);

  const filteredInvoices = useMemo(() => {
    const query = search.trim().toLowerCase();

    return invoices
      .filter((invoice) => {
        const matchesSearch =
          !query ||
          String(invoice.invoiceNumber || "")
            .toLowerCase()
            .includes(query) ||
          String(invoice.serviceDetails || "")
            .toLowerCase()
            .includes(query);

        const matchesStatus =
          filter === "ALL" ||
          (filter === "PAID" &&
            invoice.paymentStatus === "PAID") ||
          (filter === "UNPAID" &&
            invoice.paymentStatus !== "PAID");

        return matchesSearch && matchesStatus;
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt || 0) -
          new Date(a.createdAt || 0)
      );
  }, [invoices, search, filter]);

  const sortedPayments = useMemo(
    () =>
      [...payments].sort(
        (a, b) =>
          new Date(b.createdAt || 0) -
          new Date(a.createdAt || 0)
      ),
    [payments]
  );

  const invoicePages = Math.max(
    1,
    Math.ceil(filteredInvoices.length / PAGE_SIZE)
  );

  const paymentPages = Math.max(
    1,
    Math.ceil(sortedPayments.length / PAGE_SIZE)
  );

  const visibleInvoices = filteredInvoices.slice(
    (invoicePage - 1) * PAGE_SIZE,
    invoicePage * PAGE_SIZE
  );

  const visiblePayments = sortedPayments.slice(
    (paymentPage - 1) * PAGE_SIZE,
    paymentPage * PAGE_SIZE
  );

  const handleSearch = (value) => {
    setSearch(value);
    setInvoicePage(1);
  };

  const handleFilter = (value) => {
    setFilter(value);
    setInvoicePage(1);
  };

  const invoiceAction = (invoice) => {
    const rentalId =
      invoice.rental?._id || invoice.rental;

    if (!rentalId) {
      return (
        <span className="text-xs text-gray-400">
          Not available
        </span>
      );
    }

    return (
      <Link
        to={`/customer/rentals/${rentalId}`}
        className="inline-flex whitespace-nowrap rounded-lg bg-orange-600 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-orange-700"
      >
        {invoice.paymentStatus === "PAID"
          ? "View Rental"
          : "View Payment"}
      </Link>
    );
  };

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-7">
        {/* HEADER */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-orange-600">
            Customer Account
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-950">
            Invoices & Payments
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Track invoices, review payment statuses, and
            access your rental payment instructions.
          </p>
        </div>

        {/* ERRORS */}
        {(invoiceError || paymentError) && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {invoiceError && <p>{invoiceError}</p>}
            {paymentError && <p>{paymentError}</p>}
          </div>
        )}

        {/* FINANCIAL SUMMARY */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            label="Total Invoiced"
            value={
              loadingInvoices
                ? "Loading..."
                : money(summary.totalInvoiced)
            }
            description="Combined value of your invoices"
          />

          <SummaryCard
            label="Estimated Outstanding"
            value={
              loadingInvoices || loadingPayments
                ? "Loading..."
                : money(summary.outstanding)
            }
            description="Based on recorded verified payments"
            accent
          />

          <SummaryCard
            label="Paid Invoices"
            value={
              loadingInvoices
                ? "Loading..."
                : summary.paidInvoices
            }
            description="Invoices marked as fully paid"
          />

          <SummaryCard
            label="Unpaid Invoices"
            value={
              loadingInvoices
                ? "Loading..."
                : summary.pendingInvoices
            }
            description="Pending or partially paid invoices"
          />
        </div>

        {/* INVOICES */}
        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-gray-950">
                  My Invoices
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  View invoice amounts and payment status.
                </p>
              </div>

              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
                {filteredInvoices.length} invoices
              </span>
            </div>

            <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center">
              <input
                type="search"
                value={search}
                onChange={(event) =>
                  handleSearch(event.target.value)
                }
                placeholder="Search invoice or service..."
                aria-label="Search invoices"
                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100 lg:max-w-sm"
              />

              <div className="flex flex-wrap gap-2">
                {[
                  ["ALL", "All"],
                  ["UNPAID", "Unpaid"],
                  ["PAID", "Paid"],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => handleFilter(value)}
                    className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${
                      filter === value
                        ? "bg-orange-600 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {loadingInvoices ? (
            <p className="p-8 text-sm text-gray-500">
              Loading invoices...
            </p>
          ) : filteredInvoices.length === 0 ? (
            <div className="p-12 text-center">
              <p className="font-semibold text-gray-800">
                No matching invoices
              </p>
              <p className="mt-2 text-sm text-gray-500">
                Try another search or payment filter.
              </p>
            </div>
          ) : (
            <>
              {/* DESKTOP TABLE */}
              <div className="hidden overflow-x-auto md:block">
                <table className="min-w-full text-left">
                  <thead className="bg-gray-50">
                    <tr>
                      {[
                        "Invoice",
                        "Service",
                        "Service Fee",
                        "Deposit",
                        "Total",
                        "Status",
                        "Action",
                      ].map((heading) => (
                        <th
                          key={heading}
                          className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500"
                        >
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100">
                    {visibleInvoices.map((invoice) => (
                      <tr
                        key={invoice._id}
                        className="transition hover:bg-gray-50"
                      >
                        <td className="whitespace-nowrap px-4 py-4 text-sm font-semibold text-gray-900">
                          {invoice.invoiceNumber}
                        </td>
                        <td className="max-w-xs px-4 py-4 text-sm text-gray-600">
                          {invoice.serviceDetails || "—"}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-600">
                          {money(invoice.serviceAmount)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-600">
                          {money(invoice.securityDeposit)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-sm font-semibold text-gray-950">
                          {money(invoice.totalAmount)}
                        </td>
                        <td className="px-4 py-4">
                          <StatusBadge
                            status={invoice.paymentStatus}
                          />
                        </td>
                        <td className="px-4 py-4">
                          {invoiceAction(invoice)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* MOBILE CARDS */}
              <div className="divide-y divide-gray-100 md:hidden">
                {visibleInvoices.map((invoice) => (
                  <div
                    key={invoice._id}
                    className="space-y-3 p-5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-bold text-gray-950">
                        {invoice.invoiceNumber}
                      </p>
                      <StatusBadge
                        status={invoice.paymentStatus}
                      />
                    </div>

                    <p className="text-sm text-gray-600">
                      {invoice.serviceDetails || "—"}
                    </p>

                    <div className="grid grid-cols-2 gap-3 rounded-lg bg-gray-50 p-3">
                      <div>
                        <p className="text-xs text-gray-500">
                          Service Fee
                        </p>
                        <p className="mt-1 text-sm font-medium">
                          {money(invoice.serviceAmount)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">
                          Deposit
                        </p>
                        <p className="mt-1 text-sm font-medium">
                          {money(invoice.securityDeposit)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs text-gray-500">
                          Total Amount
                        </p>
                        <p className="font-bold text-gray-950">
                          {money(invoice.totalAmount)}
                        </p>
                      </div>
                      {invoiceAction(invoice)}
                    </div>
                  </div>
                ))}
              </div>

              <Pagination
                page={invoicePage}
                totalPages={invoicePages}
                totalItems={filteredInvoices.length}
                onChange={setInvoicePage}
              />
            </>
          )}
        </section>

        {/* PAYMENT HISTORY */}
        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 p-5 sm:p-6">
            <h2 className="text-xl font-bold text-gray-950">
              Payment History
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Review your recorded transactions and
              verification statuses.
            </p>
          </div>

          {loadingPayments ? (
            <p className="p-8 text-sm text-gray-500">
              Loading payment history...
            </p>
          ) : payments.length === 0 ? (
            <div className="p-12 text-center">
              <p className="font-semibold text-gray-800">
                No payment records found
              </p>
              <p className="mt-2 text-sm text-gray-500">
                Your payment history will appear here.
              </p>
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="min-w-full text-left">
                  <thead className="bg-gray-50">
                    <tr>
                      {[
                        "Invoice",
                        "Service",
                        "Amount",
                        "Method",
                        "Status",
                        "Date",
                      ].map((heading) => (
                        <th
                          key={heading}
                          className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500"
                        >
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100">
                    {visiblePayments.map((payment) => (
                      <tr
                        key={payment._id}
                        className="hover:bg-gray-50"
                      >
                        <td className="whitespace-nowrap px-4 py-4 text-sm font-semibold text-gray-900">
                          {payment.invoice?.invoiceNumber || "—"}
                        </td>
                        <td className="max-w-xs px-4 py-4 text-sm text-gray-600">
                          {payment.invoice?.serviceDetails || "—"}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-sm font-semibold text-gray-900">
                          {money(payment.amount)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-600">
                          {readable(payment.paymentMethod)}
                        </td>
                        <td className="px-4 py-4">
                          <StatusBadge
                            status={payment.paymentStatus}
                          />
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-600">
                          {dateText(payment.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="divide-y divide-gray-100 md:hidden">
                {visiblePayments.map((payment) => (
                  <div
                    key={payment._id}
                    className="space-y-3 p-5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-bold text-gray-900">
                        {payment.invoice?.invoiceNumber || "—"}
                      </p>
                      <StatusBadge
                        status={payment.paymentStatus}
                      />
                    </div>

                    <p className="text-sm text-gray-600">
                      {payment.invoice?.serviceDetails || "—"}
                    </p>

                    <div className="flex flex-wrap items-end justify-between gap-3">
                      <div>
                        <p className="text-xs text-gray-500">
                          Payment Amount
                        </p>
                        <p className="mt-1 font-bold text-gray-950">
                          {money(payment.amount)}
                        </p>
                      </div>
                      <div className="text-right text-xs text-gray-500">
                        <p>{readable(payment.paymentMethod)}</p>
                        <p className="mt-1">
                          {dateText(payment.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <Pagination
                page={paymentPage}
                totalPages={paymentPages}
                totalItems={sortedPayments.length}
                onChange={setPaymentPage}
              />
            </>
          )}
        </section>
      </div>
    </main>
  );
};

export default CustomerBilling;
