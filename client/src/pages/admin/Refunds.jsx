import { useEffect, useState } from "react";
import api from "../../services/api";

const Refunds = () => {
  const [invoices, setInvoices] = useState([]);
  const [deposits, setDeposits] = useState([]);
  const [refunds, setRefunds] = useState([]);

  const [selectedInvoice, setSelectedInvoice] = useState("");
  const [selectedDeposit, setSelectedDeposit] = useState("");

  const [amount, setAmount] = useState("");
  const [refundMethod, setRefundMethod] = useState("CASH");
  const [notes, setNotes] = useState("");

  const [loadingInvoices, setLoadingInvoices] = useState(true);
  const [loadingDeposits, setLoadingDeposits] = useState(false);
  const [loadingRefunds, setLoadingRefunds] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ==========================================
  // FETCH INVOICES
  // ==========================================

  const fetchInvoices = async () => {
    try {
      setLoadingInvoices(true);
      setError("");

      const response = await api.get("/admin/invoices");

      setInvoices(response.data?.data?.invoices || []);
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Failed to load invoices. Please try again."
      );
    } finally {
      setLoadingInvoices(false);
    }
  };

  // ==========================================
  // FETCH DEPOSITS FOR SELECTED INVOICE
  // ==========================================

  const fetchDeposits = async (invoiceId) => {
    if (!invoiceId) {
      setDeposits([]);
      setSelectedDeposit("");
      return;
    }

    try {
      setLoadingDeposits(true);
      setError("");

      const response = await api.get(
        `/admin/deposits/invoice/${invoiceId}`
      );

      setDeposits(response.data?.data?.deposits || []);
      setSelectedDeposit("");
      setAmount("");
    } catch (error) {
      setDeposits([]);
      setSelectedDeposit("");

      setError(
        error.response?.data?.message ||
          "Failed to load deposits for this invoice."
      );
    } finally {
      setLoadingDeposits(false);
    }
  };

  // ==========================================
  // FETCH REFUNDS FOR SELECTED INVOICE
  // ==========================================

  const fetchRefunds = async (invoiceId) => {
    if (!invoiceId) {
      setRefunds([]);
      return;
    }

    try {
      setLoadingRefunds(true);

      const response = await api.get(
        `/admin/refunds/invoice/${invoiceId}`
      );

      setRefunds(response.data?.data?.refunds || []);
    } catch (error) {
      setRefunds([]);

      setError(
        error.response?.data?.message ||
          "Failed to load refund history."
      );
    } finally {
      setLoadingRefunds(false);
    }
  };

  // ==========================================
  // INITIAL LOAD
  // ==========================================

  useEffect(() => {
    fetchInvoices();
  }, []);

  // ==========================================
  // HANDLE INVOICE CHANGE
  // ==========================================

  const handleInvoiceChange = async (event) => {
    const invoiceId = event.target.value;

    setSelectedInvoice(invoiceId);
    setSuccess("");
    setError("");

    await fetchDeposits(invoiceId);
    await fetchRefunds(invoiceId);
  };

  // ==========================================
  // SELECTED INVOICE
  // ==========================================

  const selectedInvoiceData = invoices.find(
    (invoice) => invoice._id === selectedInvoice
  );

  // ==========================================
  // SELECTED DEPOSIT
  // ==========================================

  const selectedDepositData = deposits.find(
    (deposit) => deposit._id === selectedDeposit
  );

  // ==========================================
  // CUSTOMER
  // ==========================================

  const customer = selectedInvoiceData?.customer;

  // ==========================================
  // FORM SUBMIT
  // ==========================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    // ----------------------------------------
    // Frontend validation
    // ----------------------------------------

    if (!selectedInvoice) {
      setError("Please select an invoice.");
      return;
    }

    if (!selectedDeposit) {
      setError("Please select a deposit.");
      return;
    }

    if (!amount) {
      setError("Please enter the refund amount.");
      return;
    }

    const refundAmount = Number(amount);

    if (refundAmount <= 0) {
      setError("Refund amount must be greater than zero.");
      return;
    }

    if (
      selectedDepositData &&
      refundAmount > selectedDepositData.amount
    ) {
      setError(
        "Refund amount cannot exceed the deposit amount."
      );
      return;
    }

    if (!refundMethod) {
      setError("Please select a refund method.");
      return;
    }

    try {
      setSubmitting(true);

      await api.post("/admin/refunds", {
        deposit: selectedDeposit,
        amount: refundAmount,
        refundMethod,
        notes: notes.trim(),
      });

      setSuccess("Security deposit refunded successfully.");

      setAmount("");
      setNotes("");

      // Refresh deposits and refund history
      await fetchDeposits(selectedInvoice);
      await fetchRefunds(selectedInvoice);
    } catch (error) {
      const status = error.response?.status;

      if (status === 400) {
        setError(
          error.response?.data?.message ||
            "Invalid refund details."
        );
      } else if (status === 404) {
        setError(
          error.response?.data?.message ||
            "Deposit or invoice not found."
        );
      } else if (status === 401) {
        setError("Your session has expired. Please log in again.");
      } else if (status === 403) {
        setError(
          "You do not have permission to record refunds."
        );
      } else {
        setError(
          error.response?.data?.message ||
            "Failed to record refund. Please try again."
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  // ==========================================
  // FORMAT CURRENCY
  // ==========================================

  const formatAmount = (value) => {
    return `LKR ${Number(value || 0).toLocaleString()}`;
  };

  // ==========================================
  // FORMAT DATE
  // ==========================================

  const formatDate = (value) => {
    if (!value) return "-";

    return new Date(value).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // ==========================================
  // STATUS BADGE
  // ==========================================

  const getStatusClass = (status) => {
    if (status === "COMPLETED") {
      return "bg-green-100 text-green-700";
    }

    if (status === "PENDING") {
      return "bg-yellow-100 text-yellow-700";
    }

    return "bg-gray-100 text-gray-700";
  };

  return (
    <div className="p-6">
      {/* ======================================
          PAGE HEADER
      ====================================== */}

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-950">
          Refund Management
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Record security deposit refunds and view refund history.
        </p>
      </div>

      {/* ======================================
          SUCCESS MESSAGE
      ====================================== */}

      {success && (
        <div className="mb-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      )}

      {/* ======================================
          ERROR MESSAGE
      ====================================== */}

      {error && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* ====================================
            REFUND FORM
        ==================================== */}

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-1">
          <h2 className="text-lg font-semibold text-gray-950">
            Record Refund
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Refund a held security deposit.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            {/* Invoice */}

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Invoice
              </label>

              <select
                value={selectedInvoice}
                onChange={handleInvoiceChange}
                disabled={loadingInvoices || submitting}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              >
                <option value="">
                  {loadingInvoices
                    ? "Loading invoices..."
                    : "Select an invoice"}
                </option>

                {invoices.map((invoice) => (
                  <option key={invoice._id} value={invoice._id}>
                    {invoice.invoiceNumber} -{" "}
                    {invoice.customer?.name || "Customer"}
                  </option>
                ))}
              </select>
            </div>

            {/* Customer */}

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Customer
              </label>

              <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                <p className="text-sm font-medium text-gray-900">
                  {customer?.name || "-"}
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  {customer?.email || "-"}
                </p>
              </div>
            </div>

            {/* Deposit */}

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Security Deposit
              </label>

              <select
                value={selectedDeposit}
                onChange={(event) => {
                  setSelectedDeposit(event.target.value);
                  setAmount("");
                  setError("");
                  setSuccess("");
                }}
                disabled={
                  !selectedInvoice ||
                  loadingDeposits ||
                  submitting
                }
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              >
                <option value="">
                  {loadingDeposits
                    ? "Loading deposits..."
                    : !selectedInvoice
                    ? "Select an invoice first"
                    : deposits.length === 0
                    ? "No deposits found"
                    : "Select a deposit"}
                </option>

                {deposits.map((deposit) => (
                  <option
                    key={deposit._id}
                    value={deposit._id}
                    disabled={deposit.status !== "HELD"}
                  >
                    {formatAmount(deposit.amount)} -{" "}
                    {deposit.status}
                  </option>
                ))}
              </select>
            </div>

            {/* Deposit information */}

            {selectedDepositData && (
              <div className="rounded-xl bg-gray-50 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">
                    Deposit Amount
                  </span>

                  <span className="text-sm font-semibold text-gray-900">
                    {formatAmount(selectedDepositData.amount)}
                  </span>
                </div>

                <div className="mt-2 flex items-center justify-between">
                  <span className="text-sm text-gray-500">
                    Deposit Status
                  </span>

                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${getStatusClass(
                      selectedDepositData.status
                    )}`}
                  >
                    {selectedDepositData.status}
                  </span>
                </div>

                <div className="mt-2 flex items-center justify-between">
                  <span className="text-sm text-gray-500">
                    Deposit Date
                  </span>

                  <span className="text-sm text-gray-700">
                    {formatDate(selectedDepositData.depositDate)}
                  </span>
                </div>
              </div>
            )}

            {/* Refund Amount */}

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Refund Amount
              </label>

              <input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                disabled={!selectedDeposit || submitting}
                placeholder="Enter refund amount"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              />

              {selectedDepositData && (
                <p className="mt-1 text-xs text-gray-500">
                  Maximum refundable amount:{" "}
                  {formatAmount(selectedDepositData.amount)}
                </p>
              )}
            </div>

            {/* Refund Method */}

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Refund Method
              </label>

              <select
                value={refundMethod}
                onChange={(event) =>
                  setRefundMethod(event.target.value)
                }
                disabled={submitting}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              >
                <option value="CASH">Cash</option>
                <option value="BANK_TRANSFER">
                  Bank Transfer
                </option>
                <option value="CARD">Card</option>
              </select>
            </div>

            {/* Notes */}

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Notes
              </label>

              <textarea
                rows="3"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                disabled={submitting}
                placeholder="Optional refund notes"
                className="w-full resize-none rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              />
            </div>

            {/* Submit */}

            <button
              type="submit"
              disabled={
                submitting ||
                !selectedInvoice ||
                !selectedDeposit ||
                !amount
              }
              className="w-full rounded-xl bg-orange-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              {submitting ? "Recording Refund..." : "Record Refund"}
            </button>
          </form>
        </div>

        {/* ====================================
            REFUND HISTORY
        ==================================== */}

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-950">
                Refund History
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                {selectedInvoice
                  ? `Refund records for ${
                      selectedInvoiceData?.invoiceNumber || "selected invoice"
                    }`
                  : "Select an invoice to view refund history."}
              </p>
            </div>
          </div>

          <div className="mt-6 overflow-x-auto">
            {!selectedInvoice ? (
              <div className="rounded-xl border border-dashed border-gray-300 px-6 py-12 text-center">
                <p className="text-sm font-medium text-gray-700">
                  No invoice selected
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  Select an invoice from the refund form to view its
                  refund history.
                </p>
              </div>
            ) : loadingRefunds ? (
              <div className="py-12 text-center">
                <p className="text-sm text-gray-500">
                  Loading refund history...
                </p>
              </div>
            ) : refunds.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-300 px-6 py-12 text-center">
                <p className="text-sm font-medium text-gray-700">
                  No refunds found
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  No refund has been recorded for this invoice yet.
                </p>
              </div>
            ) : (
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-200 text-left">
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Date
                    </th>

                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Customer
                    </th>

                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Amount
                    </th>

                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Method
                    </th>

                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {refunds.map((refund) => (
                    <tr
                      key={refund._id}
                      className="border-b border-gray-100 last:border-0"
                    >
                      <td className="px-4 py-4 text-sm text-gray-700">
                        {formatDate(refund.refundDate)}
                      </td>

                      <td className="px-4 py-4">
                        <p className="text-sm font-medium text-gray-900">
                          {refund.customer?.name || "-"}
                        </p>

                        <p className="mt-1 text-xs text-gray-500">
                          {refund.customer?.email || "-"}
                        </p>
                      </td>

                      <td className="px-4 py-4 text-sm font-semibold text-gray-900">
                        {formatAmount(refund.amount)}
                      </td>

                      <td className="px-4 py-4 text-sm text-gray-700">
                        {refund.refundMethod === "BANK_TRANSFER"
                          ? "Bank Transfer"
                          : refund.refundMethod}
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${getStatusClass(
                            refund.status
                          )}`}
                        >
                          {refund.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Refunds;