import { useEffect, useState } from "react";
import api from "../../services/api";

const Invoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [showCreateForm, setShowCreateForm] = useState(false);

  const [formData, setFormData] = useState({
    customer: "",
    serviceDetails: "",
    serviceAmount: "",
    securityDeposit: "",
  });

  // ==========================================
  // FETCH INVOICES
  // ==========================================

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const response = await api.get("/admin/invoices");

      setInvoices(response.data?.data?.invoices || []);
    } catch (error) {
      const status = error.response?.status;

      if (status === 401) {
        setErrorMessage("Your session has expired. Please log in again.");
      } else if (status === 403) {
        setErrorMessage("You do not have permission to view invoices.");
      } else if (status === 404) {
        setErrorMessage("Invoice service was not found.");
      } else if (status >= 500) {
        setErrorMessage("Server error. Please try again later.");
      } else {
        setErrorMessage(
          error.response?.data?.message ||
            "Failed to load invoices."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // FETCH CUSTOMERS
  // ==========================================

  const fetchCustomers = async () => {
    try {
      setCustomersLoading(true);
      setFormError("");

      const response = await api.get("/admin/customers");

      setCustomers(response.data?.data?.customers || []);
    } catch (error) {
      const status = error.response?.status;

      if (status === 401) {
        setFormError(
          "Your session has expired. Please log in again."
        );
      } else if (status === 403) {
        setFormError(
          "You do not have permission to view customers."
        );
      } else if (status === 404) {
        setFormError("Customer service was not found.");
      } else if (status >= 500) {
        setFormError(
          "Server error while loading customers."
        );
      } else {
        setFormError(
          error.response?.data?.message ||
            "Failed to load customers."
        );
      }
    } finally {
      setCustomersLoading(false);
    }
  };

  // ==========================================
  // INITIAL LOAD
  // ==========================================

  useEffect(() => {
    fetchInvoices();
  }, []);

  // ==========================================
  // OPEN CREATE FORM
  // ==========================================

  const handleOpenCreateForm = () => {
    setShowCreateForm(true);
    setFormError("");
    setSuccessMessage("");

    if (customers.length === 0) {
      fetchCustomers();
    }
  };

  // ==========================================
  // CLOSE CREATE FORM
  // ==========================================

  const handleCloseCreateForm = () => {
    if (creating) {
      return;
    }

    setShowCreateForm(false);
    setFormError("");

    setFormData({
      customer: "",
      serviceDetails: "",
      serviceAmount: "",
      securityDeposit: "",
    });
  };

  // ==========================================
  // HANDLE INPUT CHANGE
  // ==========================================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setFormError("");
    setSuccessMessage("");
  };

  // ==========================================
  // CREATE INVOICE
  // ==========================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    setFormError("");
    setSuccessMessage("");

    // ------------------------------------------
    // Frontend validation
    // ------------------------------------------

    if (!formData.customer) {
      setFormError("Please select a customer.");
      return;
    }

    if (!formData.serviceDetails.trim()) {
      setFormError("Service details are required.");
      return;
    }

    if (formData.serviceAmount === "") {
      setFormError("Service amount is required.");
      return;
    }

    const serviceAmount = Number(formData.serviceAmount);
    const securityDeposit =
      formData.securityDeposit === ""
        ? 0
        : Number(formData.securityDeposit);

    if (Number.isNaN(serviceAmount)) {
      setFormError("Service amount must be a valid number.");
      return;
    }

    if (serviceAmount < 0) {
      setFormError("Service amount cannot be negative.");
      return;
    }

    if (Number.isNaN(securityDeposit)) {
      setFormError(
        "Security deposit must be a valid number."
      );
      return;
    }

    if (securityDeposit < 0) {
      setFormError(
        "Security deposit cannot be negative."
      );
      return;
    }

    // ------------------------------------------
    // Send request
    // ------------------------------------------

    try {
      setCreating(true);

      const response = await api.post("/admin/invoices", {
        customer: formData.customer,
        serviceDetails: formData.serviceDetails.trim(),
        serviceAmount,
        securityDeposit,
      });

      const createdInvoice =
        response.data?.data?.invoice;

      setSuccessMessage(
        createdInvoice?.invoiceNumber
          ? `Invoice ${createdInvoice.invoiceNumber} created successfully.`
          : "Invoice created successfully."
      );

      setFormData({
        customer: "",
        serviceDetails: "",
        serviceAmount: "",
        securityDeposit: "",
      });

      setShowCreateForm(false);

      // Refresh invoice list
      await fetchInvoices();
    } catch (error) {
      const status = error.response?.status;

      if (status === 400) {
        setFormError(
          error.response?.data?.message ||
            "Invalid invoice information."
        );
      } else if (status === 401) {
        setFormError(
          "Your session has expired. Please log in again."
        );
      } else if (status === 403) {
        setFormError(
          "You do not have permission to create invoices."
        );
      } else if (status === 404) {
        setFormError(
          "Invoice service or customer was not found."
        );
      } else if (status === 409) {
        setFormError(
          error.response?.data?.message ||
            "This invoice conflicts with existing data."
        );
      } else if (status >= 500) {
        setFormError(
          "Server error. Please try again later."
        );
      } else {
        setFormError(
          error.response?.data?.message ||
            "Failed to create invoice."
        );
      }
    } finally {
      setCreating(false);
    }
  };

  // ==========================================
  // FORMAT AMOUNT
  // ==========================================

  const formatAmount = (amount) => {
    if (amount === null || amount === undefined) {
      return "—";
    }

    return `Rs. ${Number(amount).toLocaleString("en-LK", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // ==========================================
  // FORMAT DATE
  // ==========================================

  const formatDate = (date) => {
    if (!date) {
      return "—";
    }

    return new Date(date).toLocaleDateString("en-LK", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // ==========================================
  // STATUS STYLES
  // ==========================================

  const getStatusClasses = (status) => {
    switch (status) {
      case "PAID":
        return "bg-green-100 text-green-700";

      case "PARTIALLY_PAID":
        return "bg-yellow-100 text-yellow-700";

      case "PENDING":
        return "bg-gray-100 text-gray-700";

      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  // ==========================================
  // LIVE TOTAL PREVIEW
  // ==========================================

  const serviceAmountPreview =
    formData.serviceAmount === ""
      ? 0
      : Number(formData.serviceAmount) || 0;

  const securityDepositPreview =
    formData.securityDeposit === ""
      ? 0
      : Number(formData.securityDeposit) || 0;

  const totalPreview =
    serviceAmountPreview + securityDepositPreview;

  // ==========================================
  // LOADING STATE
  // ==========================================

  if (loading) {
    return (
      <div className="p-6">
        <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
          <p className="text-sm text-gray-500">
            Loading invoices...
          </p>
        </div>
      </div>
    );
  }

  // ==========================================
  // PAGE
  // ==========================================

  return (
    <div className="p-6">

      {/* ======================================
          PAGE HEADER
      ====================================== */}

      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-950">
            Invoices
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Create and manage customer invoices.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreateForm}
          className="rounded-xl bg-orange-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-700"
        >
          + Create Invoice
        </button>
      </div>

      {/* ======================================
          SUCCESS MESSAGE
      ====================================== */}

      {successMessage && (
        <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
          <p className="text-sm font-medium text-green-700">
            {successMessage}
          </p>
        </div>
      )}

      {/* ======================================
          CREATE INVOICE FORM
      ====================================== */}

      {showCreateForm && (
        <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm">

          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-950">
                Create Invoice
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Enter the invoice details below.
              </p>
            </div>

            <button
              type="button"
              onClick={handleCloseCreateForm}
              disabled={creating}
              className="rounded-lg px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>
          </div>

          {/* FORM ERROR */}

          {formError && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-sm font-medium text-red-700">
                {formError}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit}>

            <div className="grid gap-6 md:grid-cols-2">

              {/* CUSTOMER */}

              <div className="md:col-span-2">
                <label
                  htmlFor="customer"
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  Customer
                </label>

                <select
                  id="customer"
                  name="customer"
                  value={formData.customer}
                  onChange={handleChange}
                  disabled={customersLoading || creating}
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100 disabled:cursor-not-allowed disabled:bg-gray-100"
                >
                  <option value="">
                    {customersLoading
                      ? "Loading customers..."
                      : "Select a customer"}
                  </option>

                  {customers.map((customer) => (
                    <option
                      key={customer._id}
                      value={customer._id}
                    >
                      {customer.name} — {customer.email}
                    </option>
                  ))}
                </select>
              </div>

              {/* SERVICE DETAILS */}

              <div className="md:col-span-2">
                <label
                  htmlFor="serviceDetails"
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  Service Details
                </label>

                <textarea
                  id="serviceDetails"
                  name="serviceDetails"
                  value={formData.serviceDetails}
                  onChange={handleChange}
                  disabled={creating}
                  rows={4}
                  placeholder="Example: Camera body and 24-70mm lens rental"
                  className="w-full resize-none rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 disabled:cursor-not-allowed disabled:bg-gray-100"
                />
              </div>

              {/* SERVICE AMOUNT */}

              <div>
                <label
                  htmlFor="serviceAmount"
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  Service Amount
                </label>

                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-500">
                    Rs.
                  </span>

                  <input
                    id="serviceAmount"
                    name="serviceAmount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.serviceAmount}
                    onChange={handleChange}
                    disabled={creating}
                    placeholder="0.00"
                    className="w-full rounded-xl border border-gray-300 py-3 pl-12 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 disabled:cursor-not-allowed disabled:bg-gray-100"
                  />
                </div>
              </div>

              {/* SECURITY DEPOSIT */}

              <div>
                <label
                  htmlFor="securityDeposit"
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  Security Deposit
                  <span className="ml-2 font-normal text-gray-400">
                    Optional
                  </span>
                </label>

                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-500">
                    Rs.
                  </span>

                  <input
                    id="securityDeposit"
                    name="securityDeposit"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.securityDeposit}
                    onChange={handleChange}
                    disabled={creating}
                    placeholder="0.00"
                    className="w-full rounded-xl border border-gray-300 py-3 pl-12 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 disabled:cursor-not-allowed disabled:bg-gray-100"
                  />
                </div>
              </div>

            </div>

            {/* TOTAL PREVIEW */}

            <div className="mt-6 rounded-2xl bg-gray-50 p-5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">
                  Service Amount
                </span>

                <span className="font-medium text-gray-900">
                  {formatAmount(serviceAmountPreview)}
                </span>
              </div>

              <div className="mt-3 flex items-center justify-between text-sm">
                <span className="text-gray-500">
                  Security Deposit
                </span>

                <span className="font-medium text-gray-900">
                  {formatAmount(securityDepositPreview)}
                </span>
              </div>

              <div className="my-4 border-t border-gray-200" />

              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-900">
                  Total Amount
                </span>

                <span className="text-xl font-bold text-orange-600">
                  {formatAmount(totalPreview)}
                </span>
              </div>
            </div>

            {/* FORM ACTIONS */}

            <div className="mt-6 flex justify-end gap-3">

              <button
                type="button"
                onClick={handleCloseCreateForm}
                disabled={creating}
                className="rounded-xl border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={creating || customersLoading}
                className="rounded-xl bg-orange-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {creating
                  ? "Creating..."
                  : "Create Invoice"}
              </button>

            </div>
          </form>
        </div>
      )}

      {/* ======================================
          INVOICE TABLE
      ====================================== */}

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">

        {invoices.length === 0 ? (
          <div className="px-6 py-16 text-center">

            <h2 className="text-lg font-semibold text-gray-900">
              No invoices found
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              There are currently no invoices in the system.
            </p>

          </div>
        ) : (
          <div className="overflow-x-auto">

            <table className="min-w-full">

              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Invoice
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Customer
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Service
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Total
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Status
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Date
                  </th>

                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">

                {invoices.map((invoice) => (
                  <tr
                    key={invoice._id}
                    className="transition hover:bg-gray-50"
                  >

                    <td className="whitespace-nowrap px-6 py-4">
                      <p className="font-semibold text-gray-900">
                        {invoice.invoiceNumber}
                      </p>
                    </td>

                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">
                        {invoice.customer?.name || "Unknown"}
                      </p>

                      <p className="text-xs text-gray-500">
                        {invoice.customer?.email || "—"}
                      </p>
                    </td>

                    <td className="max-w-xs px-6 py-4">
                      <p className="truncate text-sm text-gray-700">
                        {invoice.serviceDetails || "—"}
                      </p>
                    </td>

                    <td className="whitespace-nowrap px-6 py-4 font-semibold text-gray-900">
                      {formatAmount(invoice.totalAmount)}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(
                          invoice.paymentStatus
                        )}`}
                      >
                        {invoice.paymentStatus || "UNKNOWN"}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {formatDate(invoice.createdAt)}
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

export default Invoices;