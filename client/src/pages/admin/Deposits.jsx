
import { useEffect, useRef, useState } from "react";
import api from "../../services/api";
import { useAuth } from "../../context/useAuth";

// ============================================================
// HELPERS
// ============================================================

const formatAmount = (amount) =>
  `LKR ${Number(amount || 0).toLocaleString("en-LK")}`;

const formatDate = (date) => {
  if (!date) return "-";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return "-";

  return parsed.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getErrorMessage = (error, defaultMessage) => {
  const status = error?.response?.status;

  if (status === 401) {
    return "Your session has expired. Please log in again.";
  }

  if (status === 403) {
    return "You do not have permission to perform this action.";
  }

  if (status === 404) {
    return "Requested resource was not found.";
  }

  if (status === 409) {
    return (
      error?.response?.data?.message ||
      "A security deposit has already been recorded."
    );
  }

  if (status >= 500) {
    return "Server error. Please try again later.";
  }

  return (
    error?.response?.data?.message ||
    error?.message ||
    defaultMessage
  );
};

const getStatusClass = (status) => {
  switch (String(status || "").toUpperCase()) {
    case "HELD":
      return "bg-yellow-100 text-yellow-800";

    case "REFUND_PENDING":
      return "bg-orange-100 text-orange-800";

    case "REFUNDED":
    case "PARTIALLY_REFUNDED":
      return "bg-green-100 text-green-800";

    case "DEDUCTED":
      return "bg-purple-100 text-purple-800";

    default:
      return "bg-gray-100 text-gray-700";
  }
};

const extractDeposits = (response) => {
  const data = response?.data?.data;

  if (Array.isArray(data)) return data;

  if (Array.isArray(data?.deposits)) {
    return data.deposits;
  }

  if (Array.isArray(response?.data?.deposits)) {
    return response.data.deposits;
  }

  throw new Error(
    "Unexpected deposit response. Deposit recording is disabled until the existing records can be verified."
  );
};

// ============================================================
// MAIN COMPONENT
// ============================================================

const Deposits = () => {
  const { user } = useAuth();

  const isClerk = user?.role === "CLERK";

  const [invoices, setInvoices] = useState([]);
  const [deposits, setDeposits] = useState([]);

  const [loadingInvoices, setLoadingInvoices] = useState(true);
  const [loadingDeposits, setLoadingDeposits] = useState(false);

  const [depositsVerified, setDepositsVerified] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [formMessage, setFormMessage] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const depositsPerPage = 8;

  const [formData, setFormData] = useState({
    invoice: "",
    amount: "",
  });

  // Request tracking prevents an older invoice response
  // from replacing the currently selected invoice's data.
  const depositRequestRef = useRef(0);
  const submittingRef = useRef(false);

  // ============================================================
  // FETCH INVOICES
  // ============================================================

  useEffect(() => {
    let cancelled = false;

    const fetchInitialInvoices = async () => {
      try {
        const response = await api.get("/admin/invoices");

        if (cancelled) return;

        const invoiceList =
          response.data?.data?.invoices;

        if (!Array.isArray(invoiceList)) {
          throw new Error(
            "Unexpected invoice response format."
          );
        }

        setInvoices(invoiceList);
      } catch (err) {
        if (!cancelled) {
          setError(
            getErrorMessage(
              err,
              "Failed to load invoices."
            )
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingInvoices(false);
        }
      }
    };

    void fetchInitialInvoices();

    return () => {
      cancelled = true;
    };
  }, []);

  // ============================================================
  // FETCH DEPOSITS FOR SELECTED INVOICE
  // ============================================================

  const fetchDeposits = async (invoiceId) => {
    const requestId = ++depositRequestRef.current;

    setDeposits([]);
    setDepositsVerified(false);

    if (!invoiceId) {
      setLoadingDeposits(false);
      return false;
    }

    setLoadingDeposits(true);
    setError("");

    try {
      const response = await api.get(
        `/admin/deposits/invoice/${invoiceId}`
      );

      if (requestId !== depositRequestRef.current) {
        return false;
      }

      const depositList = extractDeposits(response);

      setDeposits(depositList);
      setDepositsVerified(true);

      return true;
    } catch (err) {
      if (requestId !== depositRequestRef.current) {
        return false;
      }

      setDeposits([]);
      setDepositsVerified(false);

      setError(
        getErrorMessage(
          err,
          "Failed to load deposit information."
        )
      );

      return false;
    } finally {
      if (requestId === depositRequestRef.current) {
        setLoadingDeposits(false);
      }
    }
  };

  // ============================================================
  // HANDLE FORM CHANGES
  // ============================================================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormMessage("");

    if (name === "invoice") {
      setFormData({
        invoice: value,
        amount: "",
      });

      setCurrentPage(1);

      void fetchDeposits(value);
      return;
    }

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // ============================================================
  // SELECTED INVOICE AND DEPOSIT CALCULATIONS
  // ============================================================

  const selectedInvoice = invoices.find(
    (invoice) =>
      String(invoice._id) === String(formData.invoice)
  );

  const requiredDeposit = Number(
    selectedInvoice?.securityDeposit || 0
  );

  // Count all existing recorded deposits, not just HELD.
  // A deposit remains recorded when its status changes to
  // REFUND_PENDING, REFUNDED, or another settlement status.
  const alreadyRecordedAmount = deposits.reduce(
    (total, deposit) => {
      const amount = Number(deposit.amount || 0);

      return (
        total +
        (Number.isFinite(amount) && amount > 0
          ? amount
          : 0)
      );
    },
    0
  );

  const remainingDeposit = Math.max(
    requiredDeposit - alreadyRecordedAmount,
    0
  );

  // This system currently uses one security deposit per
  // invoice. Conservatively block another deposit whenever
  // any existing deposit record is found.
  const existingDeposit = deposits.length > 0;

  const canRecordDeposit =
    Boolean(selectedInvoice) &&
    depositsVerified &&
    !loadingDeposits &&
    !loadingInvoices &&
    !submitting &&
    !existingDeposit &&
    requiredDeposit > 0 &&
    remainingDeposit > 0;

  // ============================================================
  // SUBMIT NEW DEPOSIT
  // ============================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (submittingRef.current) return;

    setFormMessage("");
    setError("");

    if (!formData.invoice || !selectedInvoice) {
      setFormMessage("Please select a valid invoice.");
      return;
    }

    if (!depositsVerified || loadingDeposits) {
      setFormMessage(
        "Existing deposit records have not been verified. Please select the invoice again."
      );
      return;
    }

    if (existingDeposit) {
      setFormMessage(
        "A security deposit is already recorded for this invoice. Do not record another deposit, including when the existing deposit is pending refund or has been settled."
      );
      return;
    }

    const amount = Number(formData.amount);

    if (
      !formData.amount ||
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      setFormMessage(
        "Please enter a valid deposit amount greater than zero."
      );
      return;
    }

    if (amount > requiredDeposit) {
      setFormMessage(
        `Deposit cannot exceed the required security deposit of ${formatAmount(
          requiredDeposit
        )}.`
      );
      return;
    }

    if (amount > remainingDeposit) {
      setFormMessage(
        `Deposit cannot exceed the remaining amount of ${formatAmount(
          remainingDeposit
        )}.`
      );
      return;
    }

    const selectedInvoiceId = formData.invoice;

    submittingRef.current = true;
    setSubmitting(true);

    try {
      // Verify the latest records immediately before creating
      // a deposit. This reduces the chance of duplicates.
      const checkResponse = await api.get(
        `/admin/deposits/invoice/${selectedInvoiceId}`
      );

      const latestDeposits =
        extractDeposits(checkResponse);

      if (latestDeposits.length > 0) {
        if (
          depositRequestRef.current >= 0
        ) {
          setDeposits(latestDeposits);
          setDepositsVerified(true);
        }

        setFormMessage(
          "A deposit already exists for this invoice. No new deposit was recorded."
        );

        return;
      }

      // Ensure the selected invoice has not changed.
      // Form controls are disabled while submitting.
      const response = await api.post(
        "/admin/deposits",
        {
          invoice: selectedInvoiceId,
          amount,
        }
      );

      setFormMessage(
        response.data?.message ||
          "Security deposit recorded successfully."
      );

      // Keep the selected invoice visible and refresh its
      // deposit history instead of clearing the page.
      setFormData({
        invoice: selectedInvoiceId,
        amount: "",
      });

      await fetchDeposits(selectedInvoiceId);
    } catch (err) {
      setFormMessage(
        getErrorMessage(
          err,
          "Failed to record security deposit."
        )
      );

      // Refresh after any error. The server may have saved
      // the deposit before a network error occurred.
      await fetchDeposits(selectedInvoiceId);
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  // ============================================================
  // PAGINATION
  // ============================================================

  const totalPages = Math.ceil(
    deposits.length / depositsPerPage
  );

  const startIndex =
    (currentPage - 1) * depositsPerPage;

  const paginatedDeposits = deposits.slice(
    startIndex,
    startIndex + depositsPerPage
  );

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="p-6">
      {/* PAGE HEADER */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-950">
          Security Deposit Management
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          {isClerk
            ? "Record and monitor customer security deposits for rental operations."
            : "Record and monitor customer security deposits."}
        </p>
      </div>

      {/* ERROR */}
      {error && (
        <div
          role="alert"
          className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {/* RECORD DEPOSIT */}
      <div className="mb-6 rounded-2xl bg-white shadow-sm">
        <div className="border-b border-gray-100 px-6 py-5">
          <h2 className="font-semibold text-gray-950">
            Record Security Deposit
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Record the security deposit received for an invoice.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-6"
        >
          <div className="grid gap-5 md:grid-cols-2">
            {/* INVOICE */}
            <div>
              <label
                htmlFor="deposit-invoice"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Invoice
              </label>

              <select
                id="deposit-invoice"
                name="invoice"
                value={formData.invoice}
                onChange={handleChange}
                disabled={
                  loadingInvoices || submitting
                }
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
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
                    {invoice.invoiceNumber} -{" "}
                    {invoice.customer?.name || "Customer"}
                  </option>
                ))}
              </select>
            </div>

            {/* CUSTOMER */}
            <div>
              <label
                htmlFor="deposit-customer"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Customer
              </label>

              <input
                id="deposit-customer"
                type="text"
                value={
                  selectedInvoice?.customer?.name || ""
                }
                readOnly
                placeholder="Select an invoice first"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600 outline-none"
              />
            </div>

            {/* REQUIRED DEPOSIT */}
            <div>
              <label
                htmlFor="required-deposit"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Required Security Deposit
              </label>

              <input
                id="required-deposit"
                type="text"
                value={
                  selectedInvoice
                    ? formatAmount(requiredDeposit)
                    : ""
                }
                readOnly
                placeholder="Select an invoice first"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-700 outline-none"
              />
            </div>

            {/* ALREADY RECORDED */}
            <div>
              <label
                htmlFor="already-recorded"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Already Recorded
              </label>

              <input
                id="already-recorded"
                type="text"
                value={
                  selectedInvoice && depositsVerified
                    ? formatAmount(alreadyRecordedAmount)
                    : ""
                }
                readOnly
                placeholder={
                  loadingDeposits
                    ? "Checking deposits..."
                    : "Select an invoice first"
                }
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-700 outline-none"
              />
            </div>

            {/* REMAINING DEPOSIT */}
            <div>
              <label
                htmlFor="remaining-deposit"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Remaining Deposit
              </label>

              <input
                id="remaining-deposit"
                type="text"
                value={
                  selectedInvoice && depositsVerified
                    ? formatAmount(remainingDeposit)
                    : ""
                }
                readOnly
                placeholder={
                  loadingDeposits
                    ? "Checking deposits..."
                    : "Select an invoice first"
                }
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold text-orange-600 outline-none"
              />
            </div>

            {/* NEW DEPOSIT AMOUNT */}
            <div>
              <label
                htmlFor="new-deposit-amount"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Deposit Amount
              </label>

              <input
                id="new-deposit-amount"
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                disabled={!canRecordDeposit}
                min="0.01"
                step="0.01"
                max={
                  remainingDeposit > 0
                    ? remainingDeposit
                    : undefined
                }
                placeholder="Enter deposit amount"
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:opacity-60"
              />
            </div>
          </div>

          {/* EXISTING DEPOSIT WARNING */}
          {selectedInvoice &&
            depositsVerified &&
            existingDeposit && (
              <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                <p className="text-sm font-semibold text-amber-900">
                  Security deposit already recorded
                </p>

                <p className="mt-1 text-sm text-amber-800">
                  This invoice already has a deposit
                  record. A new deposit cannot be
                  recorded, even if the existing
                  deposit is being refunded or has
                  already been settled.
                </p>

                <p className="mt-2 text-xs text-amber-700">
                  Review the deposit history below
                  to see its current status.
                </p>
              </div>
            )}

          {/* LOADING / LOOKUP FAILURE */}
          {selectedInvoice &&
            loadingDeposits && (
              <p className="mt-4 text-sm text-gray-500">
                Verifying existing security deposits...
              </p>
            )}

          {selectedInvoice &&
            !loadingDeposits &&
            !depositsVerified && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                Existing deposit records could not
                be verified. Recording is disabled
                for safety. Select the invoice again
                to retry.
              </div>
            )}

          {/* FORM MESSAGE */}
          {formMessage && (
            <div
              role="status"
              className="mt-5 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700"
            >
              {formMessage}
            </div>
          )}

          {/* SUBMIT */}
          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              disabled={!canRecordDeposit}
              className="rounded-xl bg-orange-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting
                ? "Recording..."
                : existingDeposit
                  ? "Deposit Already Recorded"
                  : "Record Deposit"}
            </button>
          </div>
        </form>
      </div>

      {/* DEPOSIT HISTORY */}
      {formData.invoice && (
        <div className="rounded-2xl bg-white shadow-sm">
          <div className="border-b border-gray-100 px-6 py-5">
            <h2 className="font-semibold text-gray-950">
              Deposit History
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Deposits recorded for the selected invoice.
            </p>
          </div>

          {loadingDeposits ? (
            <div className="px-6 py-10 text-center">
              <p className="text-sm text-gray-500">
                Loading deposit history...
              </p>
            </div>
          ) : !depositsVerified ? (
            <div className="px-6 py-10 text-center">
              <p className="text-sm text-red-600">
                Unable to verify deposit history.
              </p>
            </div>
          ) : deposits.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <p className="font-medium text-gray-700">
                No deposit recorded
              </p>

              <p className="mt-1 text-sm text-gray-500">
                No security deposit has been
                recorded for this invoice yet.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-gray-100 bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 font-semibold text-gray-600">
                      Customer
                    </th>

                    <th className="px-6 py-4 font-semibold text-gray-600">
                      Amount
                    </th>

                    <th className="px-6 py-4 font-semibold text-gray-600">
                      Date
                    </th>

                    <th className="px-6 py-4 font-semibold text-gray-600">
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {paginatedDeposits.map((deposit) => (
                    <tr
                      key={deposit._id}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">
                          {deposit.customer?.name || "-"}
                        </div>

                        <div className="text-xs text-gray-500">
                          {deposit.customer?.email || "-"}
                        </div>
                      </td>

                      <td className="px-6 py-4 font-semibold text-gray-900">
                        {formatAmount(deposit.amount)}
                      </td>

                      <td className="px-6 py-4 text-gray-600">
                        {formatDate(deposit.depositDate)}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                            deposit.status
                          )}`}
                        >
                          {deposit.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* PAGINATION */}
              {totalPages > 1 && (
                <div className="flex flex-col gap-3 border-t border-gray-200 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-gray-600">
                    Showing {startIndex + 1} -{" "}
                    {Math.min(
                      startIndex + depositsPerPage,
                      deposits.length
                    )}{" "}
                    of {deposits.length} deposits
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
                      className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Previous
                    </button>

                    <span className="px-2 text-sm text-gray-600">
                      Page {currentPage} of {totalPages}
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        setCurrentPage((page) =>
                          Math.min(page + 1, totalPages)
                        )
                      }
                      disabled={
                        currentPage === totalPages
                      }
                      className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Deposits;
