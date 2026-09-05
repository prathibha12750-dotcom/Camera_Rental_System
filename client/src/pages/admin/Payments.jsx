import { useEffect, useState } from "react";
import api from "../../services/api";

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [invoices, setInvoices] = useState([]);

  const [loading, setLoading] = useState(true);
  const [loadingInvoices, setLoadingInvoices] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [formMessage, setFormMessage] = useState("");

  const [formData, setFormData] = useState({
    invoice: "",
    amount: "",
    paymentMethod: "",
    notes: "",
  });

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/admin/payments");

      setPayments(response.data?.data?.payments || []);
    } catch (error) {
      handleApiError(error, setError, "Failed to load payments.");
    } finally {
      setLoading(false);
    }
  };

  const fetchInvoices = async () => {
    try {
      setLoadingInvoices(true);

      const response = await api.get("/admin/invoices");

      setInvoices(response.data?.data?.invoices || []);
    } catch (error) {
      handleApiError(error, setError, "Failed to load invoices.");
    } finally {
      setLoadingInvoices(false);
    }
  };

  useEffect(() => {
    fetchPayments();
    fetchInvoices();
  }, []);

  const handleApiError = (error, setter, defaultMessage) => {
    const status = error.response?.status;

    if (status === 401) {
      setter("Your session has expired. Please log in again.");
    } else if (status === 403) {
      setter("You do not have permission to perform this action.");
    } else if (status === 404) {
      setter("Requested API endpoint was not found.");
    } else if (status === 409) {
      setter(
        error.response?.data?.message ||
          "This action conflicts with existing data."
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
  };

  const selectedInvoice = invoices.find(
    (invoice) => invoice._id === formData.invoice
  );

  const invoiceTotal = Number(
    selectedInvoice?.totalAmount || 0
  );

  const paidAmount = payments
    .filter(
      (payment) =>
        payment.invoice?._id === formData.invoice &&
        payment.paymentStatus === "COMPLETED"
    )
    .reduce(
      (total, payment) => total + Number(payment.amount || 0),
      0
    );

  const remainingAmount = Math.max(
    invoiceTotal - paidAmount,
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
      setFormMessage("Please enter a valid payment amount.");
      return;
    }

    if (amount <= 0) {
      setFormMessage(
        "Payment amount must be greater than zero."
      );
      return;
    }

    if (amount > remainingAmount) {
      setFormMessage(
        `Payment cannot exceed the remaining amount of ${formatAmount(
          remainingAmount
        )}.`
      );
      return;
    }

    if (!formData.paymentMethod) {
      setFormMessage("Please select a payment method.");
      return;
    }

    try {
      setSubmitting(true);

      const response = await api.post("/admin/payments", {
        invoice: formData.invoice,
        amount,
        paymentMethod: formData.paymentMethod,
        notes: formData.notes.trim(),
      });

      setFormMessage(
        response.data?.message ||
          "Payment recorded successfully."
      );

      setFormData({
        invoice: "",
        amount: "",
        paymentMethod: "",
        notes: "",
      });

      await fetchPayments();
      await fetchInvoices();
    } catch (error) {
      handleApiError(
        error,
        setFormMessage,
        "Failed to record payment."
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

  const getPaymentStatusClass = (status) => {
    if (status === "COMPLETED") {
      return "bg-green-100 text-green-700";
    }

    if (status === "REFUNDED") {
      return "bg-red-100 text-red-700";
    }

    return "bg-gray-100 text-gray-700";
  };

  const getInvoiceStatusClass = (status) => {
    if (status === "PAID") {
      return "bg-green-100 text-green-700";
    }

    if (status === "PARTIALLY_PAID") {
      return "bg-yellow-100 text-yellow-700";
    }

    return "bg-gray-100 text-gray-700";
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
          <p className="text-sm text-gray-500">
            Loading payments...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-950">
          Payment Management
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Record and monitor customer payments.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Record Payment */}
      <div className="mb-6 rounded-2xl bg-white shadow-sm">
        <div className="border-b border-gray-100 px-6 py-5">
          <h2 className="font-semibold text-gray-950">
            Record Payment
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Manually record a payment received from a customer.
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
                disabled={loadingInvoices || submitting}
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
                    {invoice.customer?.name || "Customer"} -{" "}
                    {formatAmount(invoice.totalAmount)}
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

            {/* Invoice Total */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Invoice Total
              </label>

              <input
                type="text"
                value={
                  selectedInvoice
                    ? formatAmount(invoiceTotal)
                    : ""
                }
                readOnly
                placeholder="Select an invoice first"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-700 outline-none"
              />
            </div>

            {/* Already Paid */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Already Paid
              </label>

              <input
                type="text"
                value={
                  selectedInvoice
                    ? formatAmount(paidAmount)
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
                Remaining Amount
              </label>

              <input
                type="text"
                value={
                  selectedInvoice
                    ? formatAmount(remainingAmount)
                    : ""
                }
                readOnly
                placeholder="Select an invoice first"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold text-orange-600 outline-none"
              />
            </div>

            {/* Payment Amount */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Payment Amount
              </label>

              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                disabled={!selectedInvoice || submitting}
                min="0.01"
                step="0.01"
                max={remainingAmount || undefined}
                placeholder="Enter payment amount"
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              />
            </div>

            {/* Payment Method */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Payment Method
              </label>

              <select
                name="paymentMethod"
                value={formData.paymentMethod}
                onChange={handleChange}
                disabled={submitting}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              >
                <option value="">
                  Select payment method
                </option>

                <option value="CASH">
                  Cash
                </option>

                <option value="BANK_TRANSFER">
                  Bank Transfer
                </option>

                <option value="CARD">
                  Card
                </option>
              </select>
            </div>

            {/* Notes */}
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Notes
              </label>

              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                disabled={submitting}
                rows="3"
                maxLength="500"
                placeholder="Optional payment notes"
                className="w-full resize-none rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
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
              disabled={submitting || loadingInvoices}
              className="rounded-xl bg-orange-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting
                ? "Recording..."
                : "Record Payment"}
            </button>
          </div>
        </form>
      </div>

      {/* Payment List */}
      <div className="rounded-2xl bg-white shadow-sm">
        <div className="border-b border-gray-100 px-6 py-5">
          <h2 className="font-semibold text-gray-950">
            Recorded Payments
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            {payments.length} payment
            {payments.length !== 1 ? "s" : ""} found
          </p>
        </div>

        {payments.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="font-medium text-gray-700">
              No payments found
            </p>

            <p className="mt-1 text-sm text-gray-500">
              Recorded payments will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-gray-100 bg-gray-50">
                <tr>
                  <th className="px-6 py-4 font-semibold text-gray-600">
                    Invoice
                  </th>

                  <th className="px-6 py-4 font-semibold text-gray-600">
                    Customer
                  </th>

                  <th className="px-6 py-4 font-semibold text-gray-600">
                    Amount
                  </th>

                  <th className="px-6 py-4 font-semibold text-gray-600">
                    Method
                  </th>

                  <th className="px-6 py-4 font-semibold text-gray-600">
                    Date
                  </th>

                  <th className="px-6 py-4 font-semibold text-gray-600">
                    Status
                  </th>

                  <th className="px-6 py-4 font-semibold text-gray-600">
                    Invoice Status
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {payments.map((payment) => (
                  <tr
                    key={payment._id}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {payment.invoice?.invoiceNumber || "-"}
                    </td>

                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">
                        {payment.customer?.name || "-"}
                      </div>

                      <div className="text-xs text-gray-500">
                        {payment.customer?.email || "-"}
                      </div>
                    </td>

                    <td className="px-6 py-4 font-semibold text-gray-900">
                      {formatAmount(payment.amount)}
                    </td>

                    <td className="px-6 py-4">
                      {payment.paymentMethod
                        ? payment.paymentMethod.replace(
                            "_",
                            " "
                          )
                        : "-"}
                    </td>

                    <td className="px-6 py-4 text-gray-600">
                      {formatDate(payment.paymentDate)}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getPaymentStatusClass(
                          payment.paymentStatus
                        )}`}
                      >
                        {payment.paymentStatus || "-"}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getInvoiceStatusClass(
                          payment.invoice?.paymentStatus
                        )}`}
                      >
                        {payment.invoice?.paymentStatus || "-"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Payments;