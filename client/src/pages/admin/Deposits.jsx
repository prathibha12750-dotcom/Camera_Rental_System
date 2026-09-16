import { useEffect, useState } from "react";
import api from "../../services/api";

const Deposits = () => {
  const [invoices, setInvoices] = useState([]);
  const [deposits, setDeposits] = useState([]);

  const [loadingInvoices, setLoadingInvoices] = useState(true);
  const [loadingDeposits, setLoadingDeposits] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [formMessage, setFormMessage] = useState("");

  const [formData, setFormData] = useState({
    invoice: "",
    amount: "",
  });

  const fetchInvoices = async () => {
    try {
      setLoadingInvoices(true);
      setError("");

      const response = await api.get("/admin/invoices");

      setInvoices(response.data?.data?.invoices || []);
    } catch (error) {
      handleApiError(
        error,
        setError,
        "Failed to load invoices."
      );
    } finally {
      setLoadingInvoices(false);
    }
  };

  const fetchDeposits = async (invoiceId) => {
    if (!invoiceId) {
      setDeposits([]);
      return;
    }

    try {
      setLoadingDeposits(true);
      setError("");

      const response = await api.get(
        `/admin/deposits/invoice/${invoiceId}`
      );

      setDeposits(response.data?.data?.deposits || []);
    } catch (error) {
      handleApiError(
        error,
        setError,
        "Failed to load deposit information."
      );
    } finally {
      setLoadingDeposits(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handleApiError = (error, setter, defaultMessage) => {
    const status = error.response?.status;

    if (status === 401) {
      setter("Your session has expired. Please log in again.");
    } else if (status === 403) {
      setter("You do not have permission to perform this action.");
    } else if (status === 404) {
      setter("Requested resource was not found.");
    } else if (status === 409) {
      setter(
        error.response?.data?.message ||
          "This deposit has already been recorded."
      );
    } else if (status >= 500) {
      setter("Server error. Please try again later.");
    } else {
      setter(
        error.response?.data?.message ||
          defaultMessage
      );
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setFormMessage("");

    if (name === "invoice") {
      setFormData((previous) => ({
        ...previous,
        invoice: value,
        amount: "",
      }));

      fetchDeposits(value);
    }
  };

  const selectedInvoice = invoices.find(
    (invoice) => invoice._id === formData.invoice
  );

  const requiredDeposit = Number(
    selectedInvoice?.securityDeposit || 0
  );

  const heldDeposit = deposits.find(
    (deposit) => deposit.status === "HELD"
  );

  const alreadyRecordedAmount = Number(
    heldDeposit?.amount || 0
  );

  const remainingDeposit = Math.max(
    requiredDeposit - alreadyRecordedAmount,
    0
  );

  const handleSubmit = async (event) => {
    event.preventDefault();

    setFormMessage("");
    setError("");

    if (!formData.invoice) {
      setFormMessage("Please select an invoice.");
      return;
    }

    const amount = Number(formData.amount);

    if (!formData.amount || Number.isNaN(amount)) {
      setFormMessage("Please enter a valid deposit amount.");
      return;
    }

    if (amount <= 0) {
      setFormMessage(
        "Deposit amount must be greater than zero."
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

    if (heldDeposit) {
      setFormMessage(
        "A security deposit has already been recorded for this invoice."
      );
      return;
    }

    try {
      setSubmitting(true);

      const response = await api.post("/admin/deposits", {
        invoice: formData.invoice,
        amount,
      });

      setFormMessage(
        response.data?.message ||
          "Security deposit recorded successfully."
      );

      setFormData({
        invoice: "",
        amount: "",
      });

      setDeposits([]);
    } catch (error) {
      handleApiError(
        error,
        setFormMessage,
        "Failed to record security deposit."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const formatAmount = (amount) => {
    return `LKR ${Number(amount || 0).toLocaleString()}`;
  };

  const formatDate = (date) => {
    if (!date) return "-";

    return new Date(date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusClass = (status) => {
    if (status === "HELD") {
      return "bg-yellow-100 text-yellow-700";
    }

    if (status === "REFUNDED") {
      return "bg-green-100 text-green-700";
    }

    return "bg-gray-100 text-gray-700";
  };

  return (
    <div className="p-6">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-950">
          Security Deposit Management
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Record and monitor customer security deposits.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Record Deposit */}
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
            {/* Invoice */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Invoice
              </label>

              <select
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

            {/* Customer */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Customer
              </label>

              <input
                type="text"
                value={
                  selectedInvoice?.customer?.name || ""
                }
                readOnly
                placeholder="Select an invoice first"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600 outline-none"
              />
            </div>

            {/* Required Deposit */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Required Security Deposit
              </label>

              <input
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

            {/* Already Recorded */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Already Recorded
              </label>

              <input
                type="text"
                value={
                  selectedInvoice
                    ? formatAmount(alreadyRecordedAmount)
                    : ""
                }
                readOnly
                placeholder="Select an invoice first"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-700 outline-none"
              />
            </div>

            {/* Remaining */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Remaining Deposit
              </label>

              <input
                type="text"
                value={
                  selectedInvoice
                    ? formatAmount(remainingDeposit)
                    : ""
                }
                readOnly
                placeholder="Select an invoice first"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold text-orange-600 outline-none"
              />
            </div>

            {/* Deposit Amount */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Deposit Amount
              </label>

              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                disabled={!selectedInvoice || submitting}
                min="0.01"
                step="0.01"
                max={requiredDeposit || undefined}
                placeholder="Enter deposit amount"
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              />
            </div>
          </div>

          {formMessage && (
            <div className="mt-5 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
              {formMessage}
            </div>
          )}

          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              disabled={
                submitting ||
                loadingInvoices ||
                !selectedInvoice ||
                !!heldDeposit
              }
              className="rounded-xl bg-orange-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting
                ? "Recording..."
                : "Record Deposit"}
            </button>
          </div>
        </form>
      </div>

      {/* Selected Invoice Deposit History */}
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
          ) : deposits.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <p className="font-medium text-gray-700">
                No deposit recorded
              </p>

              <p className="mt-1 text-sm text-gray-500">
                No security deposit has been recorded for this
                invoice yet.
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
                  {deposits.map((deposit) => (
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
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Deposits;