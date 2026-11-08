import { useEffect, useState } from "react";
import api from "../../services/api";

//added by abilash
import { jsPDF } from "jspdf";
//ended by abilash


const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  // ==========================================
  // PAYMENT HISTORY FILTERS
  // ==========================================

  const [paymentSearch, setPaymentSearch] = useState("");
  const [paymentStatusFilter, setPaymentStatusFilter] =
    useState("ALL");
  const [paymentMethodFilter, setPaymentMethodFilter] =
    useState("ALL");

  const [loading, setLoading] = useState(true);
  const [loadingInvoices, setLoadingInvoices] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  const [error, setError] = useState("");
  const [formMessage, setFormMessage] = useState("");

  
  //added by abilash

  // FR-167: Billing receipt viewer state
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [receiptLoading, setReceiptLoading] = useState(false);
  const [receiptError, setReceiptError] = useState("");
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);

  //ended by abilash


  const [formData, setFormData] = useState({
    invoice: "",
    amount: "",
    paymentMethod: "",
    notes: "",
  });

  // ==========================================
  // API ERROR HANDLER
  // ==========================================

  const handleApiError = (
    error,
    setter,
    defaultMessage
  ) => {
    const status = error.response?.status;

    if (status === 401) {
      setter(
        "Your session has expired. Please log in again."
      );
    } else if (status === 403) {
      setter(
        "You do not have permission to perform this action."
      );
    } else if (status === 404) {
      setter(
        "Requested API endpoint was not found."
      );
    } else if (status === 409) {
      setter(
        error.response?.data?.message ||
          "This action conflicts with existing data."
      );
    } else if (status >= 500) {
      setter(
        "Server error. Please try again later."
      );
    } else {
      setter(
        error.response?.data?.message ||
          defaultMessage
      );
    }
  };

  // ==========================================
  // FETCH PAYMENTS
  // ==========================================

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError("");

      const response =
        await api.get("/admin/payments");

      setPayments(
        response.data?.data?.payments || []
      );
    } catch (error) {
      handleApiError(
        error,
        setError,
        "Failed to load payments."
      );
    } finally {
      setLoading(false);
    }
  };


  // ==========================================
  // BILLING RECEIPT FUNCTIONS
  // ==========================================
  
//added by abilash


//added by abilash

// FR-167: Download the selected billing receipt as a PDF.
const handleDownloadReceipt = () => {
  if (!selectedReceipt) return;

  const pdf = new jsPDF();

  const receipt = selectedReceipt;

  const customerName = receipt.customer?.name || "Customer";
  const customerEmail = receipt.customer?.email || "-";
  const invoiceNumber = receipt.invoice?.invoiceNumber || "-";
  const paymentMethod =
    receipt.paymentMethod?.replaceAll("_", " ") || "-";

  const receiptNumber = receipt.receiptNumber || "Unknown";
  const issueDate = formatDate(receipt.issuedAt);
  const amount = formatAmount(receipt.amount);

  // Header
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(20);
  pdf.text("CAMERA RENTAL SYSTEM", 105, 25, {
    align: "center",
  });

  pdf.setFontSize(14);
  pdf.text("PAYMENT RECEIPT", 105, 37, {
    align: "center",
  });

  pdf.setDrawColor(210);
  pdf.line(20, 45, 190, 45);

  // Receipt details
  pdf.setFontSize(11);

  const addRow = (label, value, y) => {
    pdf.setFont("helvetica", "bold");
    pdf.text(label, 20, y);

    pdf.setFont("helvetica", "normal");
    pdf.text(String(value), 75, y);
  };

  addRow("Receipt Number:", receiptNumber, 60);
  addRow("Issue Date:", issueDate, 72);
  addRow("Invoice Number:", invoiceNumber, 84);
  addRow("Customer:", customerName, 96);
  addRow("Email:", customerEmail, 108);
  addRow("Payment Method:", paymentMethod, 120);

  pdf.line(20, 135, 190, 135);

  // Total amount received
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(13);
  pdf.text("Amount Received:", 20, 150);
  pdf.text(amount, 190, 150, {
    align: "right",
  });

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.setTextColor(110);
  pdf.text(
    "This receipt confirms a payment recorded in the Camera Rental System.",
    105,
    180,
    { align: "center" }
  );

  // Download PDF
  const safeReceiptNumber = receiptNumber.replace(
    /[^a-zA-Z0-9_-]/g,
    "_"
  );

  pdf.save(`Receipt-${safeReceiptNumber}.pdf`);
};

//ended by abilash


// FR-167: Fetch billing receipt for a selected payment.
const handleViewReceipt = async (paymentId) => {
  setSelectedReceipt(null);
  setReceiptError("");
  setReceiptLoading(true);
  setReceiptModalOpen(true);

  try {
    const response = await api.get(
      `/admin/billing-receipts/payment/${paymentId}`
    );

    setSelectedReceipt(response.data?.data?.receipt || null);
  } catch (error) {
    const message =
      error.response?.data?.message ||
      "Failed to load billing receipt.";

    setReceiptError(message);
  } finally {
    setReceiptLoading(false);
  }
};


  // ==========================================
  // FETCH INVOICES
  // ==========================================

  const fetchInvoices = async () => {

    try {
      setLoadingInvoices(true);

      const response =
        await api.get("/admin/invoices");

      setInvoices(
        response.data?.data?.invoices || []
      );
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

  // ==========================================
  // INITIAL LOAD
  // ==========================================

  useEffect(() => {
    let cancelled = false;

    const loadInitialData = async () => {
      try {
        const [
          paymentsResponse,
          invoicesResponse,
        ] = await Promise.all([
          api.get("/admin/payments"),
          api.get("/admin/invoices"),
        ]);

        if (cancelled) {
          return;
        }

        setPayments(
          paymentsResponse.data?.data?.payments || []
        );

        setInvoices(
          invoicesResponse.data?.data?.invoices || []
        );
      } catch (error) {
        if (cancelled) {
          return;
        }

        const status = error.response?.status;

        if (status === 401) {
          setError(
            "Your session has expired. Please log in again."
          );
        } else if (status === 403) {
          setError(
            "You do not have permission to perform this action."
          );
        } else if (status === 404) {
          setError(
            "Requested API endpoint was not found."
          );
        } else if (status === 409) {
          setError(
            error.response?.data?.message ||
              "This action conflicts with existing data."
          );
        } else if (status >= 500) {
          setError(
            "Server error. Please try again later."
          );
        } else {
          setError(
            error.response?.data?.message ||
              "Failed to load payment information."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setLoadingInvoices(false);
        }
      }
    };

    loadInitialData();

    return () => {
      cancelled = true;
    };
  }, []);

  // ==========================================
  // FORM CHANGE
  // ==========================================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setFormMessage("");
  };

  // ==========================================
  // INVOICES ELIGIBLE FOR PAYMENT
  // ==========================================

  const payableInvoices = invoices.filter((invoice) =>
    ["PENDING", "PARTIALLY_PAID"].includes(invoice.paymentStatus)
  );

  // ==========================================
  // SELECTED INVOICE
  // ==========================================

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
      (total, payment) =>
        total + Number(payment.amount || 0),
      0
    );

  const remainingAmount =
    Math.max(
      0,
      Math.round(
        (invoiceTotal - paidAmount) * 100
      )
    ) / 100;

  // ==========================================
  // RECORD PAYMENT
  // ==========================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    setFormMessage("");
    setError("");

    if (!formData.invoice) {
      setFormMessage(
        "Please select an invoice."
      );
      return;
    }

    const amount = Number(formData.amount);

    if (
      !formData.amount ||
      Number.isNaN(amount)
    ) {
      setFormMessage(
        "Please enter a valid payment amount."
      );
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
      setFormMessage(
        "Please select a payment method."
      );
      return;
    }

    try {
      setSubmitting(true);

      const response = await api.post("/admin/payments", {
        invoice: formData.invoice,
        amount,
        paymentMethod: formData.paymentMethod,
        note: formData.notes.trim(),
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

      setPaymentModalOpen(false);

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

  // ==========================================
  // FORMAT AMOUNT
  // ==========================================

  const formatAmount = (amount) => {
    return `LKR ${Number(
      amount || 0
    ).toLocaleString()}`;
  };

  // ==========================================
  // FORMAT DATE
  // ==========================================

  const formatDate = (date) => {
    if (!date) return "-";

    return new Date(date).toLocaleDateString(
      "en-GB",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  // ==========================================
  // PAYMENT DASHBOARD STATISTICS
  // ==========================================

  const completedPayments = payments.filter(
    (payment) => payment.paymentStatus === "COMPLETED"
  );

  const totalReceived = completedPayments.reduce(
    (total, payment) =>
      total + Math.round(Number(payment.amount || 0) * 100),
    0
  ) / 100;

  const completedPaymentCount = completedPayments.length;

  const outstandingInvoiceCount = invoices.filter(
    (invoice) =>
      invoice.paymentStatus === "PENDING" ||
      invoice.paymentStatus === "PARTIALLY_PAID"
  ).length;

  // ==========================================
  // FILTER PAYMENT HISTORY
  // ==========================================

  const filteredPayments = payments.filter((payment) => {
    const search = paymentSearch.trim().toLowerCase();

    const invoiceNumber =
      payment.invoice?.invoiceNumber?.toLowerCase() || "";

    const customerName =
      payment.customer?.name?.toLowerCase() || "";

    const customerEmail =
      payment.customer?.email?.toLowerCase() || "";

    const matchesSearch =
      !search ||
      invoiceNumber.includes(search) ||
      customerName.includes(search) ||
      customerEmail.includes(search);

    const matchesStatus =
      paymentStatusFilter === "ALL" ||
      payment.paymentStatus === paymentStatusFilter;

    const matchesMethod =
      paymentMethodFilter === "ALL" ||
      payment.paymentMethod === paymentMethodFilter;

    return matchesSearch && matchesStatus && matchesMethod;
  });

  // ==========================================
  // PAYMENT STATUS STYLE
  // ==========================================
  const getPaymentStatusClass = (status) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-50 text-green-700 ring-1 ring-green-200";

      case "PENDING":
        return "bg-amber-50 text-amber-700 ring-1 ring-amber-200";

      case "REFUNDED":
        return "bg-red-50 text-red-700 ring-1 ring-red-200";

      default:
        return "bg-gray-100 text-gray-600 ring-1 ring-gray-200";
    }
  };

  // ==========================================
  // INVOICE STATUS STYLE
  // ==========================================

  const getInvoiceStatusClass = (status) => {
    switch (status) {
      case "PAID":
        return "bg-green-50 text-green-700 ring-1 ring-green-200";

      case "PARTIALLY_PAID":
        return "bg-amber-50 text-amber-700 ring-1 ring-amber-200";

      case "PENDING":
        return "bg-gray-100 text-gray-600 ring-1 ring-gray-200";

      default:
        return "bg-gray-100 text-gray-600 ring-1 ring-gray-200";
    }
  };

  // ==========================================
  // LOADING
  // ==========================================

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

  // ==========================================
  // PAGE
  // ==========================================

  return (
    <div className="p-6">
    {/* ==========================================
        PAGE HEADER
    ========================================== */}

    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-950">
          Payment Management
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Record customer payments, monitor transactions,
          and manage billing receipts.
        </p>
      </div>

      <button
        type="button"
        onClick={() => {
          setFormMessage("");
          setPaymentModalOpen(true);
        }}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
      >
        <span className="text-lg leading-none">+</span>
        Record Payment
      </button>
    </div>

    {/* ==========================================
        PAYMENT STATISTICS
    ========================================== */}

    <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">

      {/* Total Received */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-gray-500">
            Total Received
          </p>

          <div className="rounded-xl bg-green-50 p-2.5 text-green-600">
            <span className="text-lg">↗</span>
          </div>
        </div>

        <p className="mt-4 text-2xl font-bold tracking-tight text-gray-950">
          {formatAmount(totalReceived)}
        </p>

        <p className="mt-2 text-xs text-gray-500">
          Sum of completed payment records
        </p>
      </div>

      {/* Completed Payments */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-gray-500">
            Completed Payments
          </p>

          <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600">
            <span className="text-lg">✓</span>
          </div>
        </div>

        <p className="mt-4 text-2xl font-bold tracking-tight text-gray-950">
          {completedPaymentCount}
        </p>

        <p className="mt-2 text-xs text-gray-500">
          Successfully recorded payments
        </p>
      </div>

      {/* Outstanding Invoices */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-gray-500">
            Outstanding Invoices
          </p>

          <div className="rounded-xl bg-orange-50 p-2.5 text-orange-600">
            <span className="text-lg">!</span>
          </div>
        </div>

        <p className="mt-4 text-2xl font-bold tracking-tight text-gray-950">
          {outstandingInvoiceCount}
        </p>

        <p className="mt-2 text-xs text-gray-500">
          Pending or partially paid invoices
        </p>
      </div>

    </div>

      {/* Error */}

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {/* ==========================================
          RECORD PAYMENT MODAL
      ========================================== */}

      {paymentModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="record-payment-title"
        >
          <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">

            {/* Modal Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-6 py-5">
              <div>
                <h2
                  id="record-payment-title"
                  className="text-xl font-bold text-gray-950"
                >
                  Record Payment
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Select an invoice and enter the received payment details.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (!submitting) {
                    setPaymentModalOpen(false);
                  }
                }}
                disabled={submitting}
                className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 disabled:opacity-50"
                aria-label="Close payment form"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Form Area */}
            <div className="min-h-0 overflow-y-auto">

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
                disabled={loadingInvoices || payableInvoices.length === 0 || submitting}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              >
              <option value="">
                {loadingInvoices
                  ? "Loading invoices..."
                  : payableInvoices.length === 0
                    ? "No outstanding invoices available"
                    : "Select an outstanding invoice"}
              </option>

                {payableInvoices.map((invoice) => (
                  <option
                    key={invoice._id}
                    value={invoice._id}
                  >
                    {invoice.invoiceNumber} -{" "}
                    {invoice.customer?.name ||
                      "Customer"}{" "}
                    -{" "}
                    {formatAmount(
                      invoice.totalAmount
                    )}
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
                  selectedInvoice?.customer
                    ?.name || ""
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

            {/* Remaining Amount */}

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Remaining Amount
              </label>

              <input
                type="text"
                value={
                  selectedInvoice
                    ? formatAmount(
                        remainingAmount
                      )
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
                disabled={
                  !selectedInvoice ||
                  submitting
                }
                min="0.01"
                step="0.01"             
                max={
                  selectedInvoice
                    ? remainingAmount
                    : undefined
                }
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
                value={
                  formData.paymentMethod
                }
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

          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={() => setPaymentModalOpen(false)}
              disabled={submitting}
              className="rounded-xl border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                submitting ||
                loadingInvoices
              }
              className="rounded-xl bg-orange-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting
                ? "Recording..."
                : "Record Payment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
)}

{/* Payment List */}

      <div className="rounded-2xl bg-white shadow-sm">
      {/* ==========================================
          PAYMENT SEARCH AND FILTERS
      ========================================== */}

      <div className="grid gap-3 border-b border-gray-100 p-5 md:grid-cols-3">

        {/* Search */}
        <div>
          <label
            htmlFor="payment-search"
            className="mb-2 block text-xs font-semibold text-gray-600"
          >
            Search Payments
          </label>

          <input
            id="payment-search"
            type="search"
            value={paymentSearch}
            onChange={(event) =>
              setPaymentSearch(event.target.value)
            }
            placeholder="Invoice, customer, or email..."
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
          />
        </div>

        {/* Payment Status */}
        <div>
          <label
            htmlFor="payment-status-filter"
            className="mb-2 block text-xs font-semibold text-gray-600"
          >
            Payment Status
          </label>

          <select
            id="payment-status-filter"
            value={paymentStatusFilter}
            onChange={(event) =>
              setPaymentStatusFilter(event.target.value)
            }
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
          >
            <option value="ALL">All Statuses</option>
            <option value="COMPLETED">Completed</option>
            <option value="PENDING">Pending</option>
            <option value="REFUNDED">Refunded</option>
          </select>
        </div>

        {/* Payment Method */}
        <div>
          <label
            htmlFor="payment-method-filter"
            className="mb-2 block text-xs font-semibold text-gray-600"
          >
            Payment Method
          </label>

          <select
            id="payment-method-filter"
            value={paymentMethodFilter}
            onChange={(event) =>
              setPaymentMethodFilter(event.target.value)
            }
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
          >
            <option value="ALL">All Methods</option>
            <option value="CASH">Cash</option>
            <option value="BANK_TRANSFER">Bank Transfer</option>
            <option value="CARD">Card</option>
          </select>
        </div>
      </div>
        <div className="border-b border-gray-100 px-6 py-5">
          <h2 className="font-semibold text-gray-950">
            Recorded Payments
          </h2>

          <p className="mt-1 text-sm text-gray-500">
          Showing {filteredPayments.length} of {payments.length} payments
          </p>
        </div>

        {filteredPayments.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="font-medium text-gray-700">
              No payments found
            </p>

            <p className="mt-1 text-sm text-gray-500">
              Recorded payments will appear
              here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50/80">
              <tr>
                {[
                  "Invoice",
                  "Customer",
                  "Amount",
                  "Method",
                  "Date",
                  "Payment Status",
                  "Invoice Status",
                  "Actions",
                ].map((heading) => (
                  <th
                    key={heading}
                    scope="col"
                    className="whitespace-nowrap px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-500"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 bg-white">
                {filteredPayments.map((payment) => (
                    <tr
                      key={payment._id}
                      className="transition-colors hover:bg-orange-50/40"
                    >
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {payment.invoice?.paymentStatus?.replaceAll("_", " ") || "-"}
                    </td>

                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">
                        {payment.customer
                          ?.name || "-"}
                      </div>

                      <div className="text-xs text-gray-500">
                        {payment.customer
                          ?.email || "-"}
                      </div>
                    </td>

                    <td className="px-6 py-4 font-semibold text-gray-900">
                      {formatAmount(
                        payment.amount
                      )}
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
                      {formatDate(
                        payment.paymentDate
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getPaymentStatusClass(
                          payment.paymentStatus
                        )}`}
                      >
                        {payment.paymentStatus?.replaceAll("_", " ") || "-"}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getInvoiceStatusClass(
                          payment.invoice
                            ?.paymentStatus
                        )}`}
                      >
                        {payment.invoice
                          ?.paymentStatus ||
                          "-"}
                      </span>
                    </td>
                    
                    {/* added by abilash */}
                    <td className="px-6 py-4">
                      {payment.paymentStatus === "COMPLETED" ? (
                      <button
                        type="button"
                        onClick={() => handleViewReceipt(payment._id)}
                        className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-xs font-semibold text-orange-700 transition hover:border-orange-300 hover:bg-orange-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
                        aria-label={`View receipt for ${
                          payment.invoice?.invoiceNumber || "payment"
                        }`}
                      >
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          aria-hidden="true"
                        >
                          <path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z" />
                          <path d="M9 8h6M9 12h6" />
                        </svg>

                        View Receipt
                      </button>
                      ) : (
                        <span className="text-sm text-gray-400">—</span>
                      )}
                    </td>
                    {/* ended by abilash */}

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
            
      {/* added by abilash */}

      {/* FR-167: Billing Receipt Viewer Modal */}
      {receiptModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Billing receipt"
        >
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                Billing Receipt
              </h2>

              <button
                type="button"
                onClick={() => setReceiptModalOpen(false)}
                className="rounded-lg px-3 py-2 text-gray-500 hover:bg-gray-100"
                aria-label="Close receipt"
              >
                ✕
              </button>
            </div>

            {receiptLoading ? (
              <p className="py-6 text-center text-gray-500">
                Loading receipt...
              </p>
            ) : receiptError ? (
              <p className="rounded-lg bg-red-50 p-4 text-red-700">
                {receiptError}
              </p>
            ) : selectedReceipt ? (
              <div className="space-y-4 text-sm">
                <div className="border-b border-gray-200 pb-4 text-center">
                  <h3 className="text-lg font-bold text-gray-900">
                    Camera Rental System
                  </h3>
                  <p className="text-gray-500">Payment Receipt</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-500">Receipt Number</p>
                    <p className="font-semibold">
                      {selectedReceipt.receiptNumber}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-500">Issue Date</p>
                    <p className="font-semibold">
                      {formatDate(selectedReceipt.issuedAt)}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-500">Invoice Number</p>
                    <p className="font-semibold">
                      {selectedReceipt.invoice?.invoiceNumber || "-"}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-500">Payment Method</p>
                    <p className="font-semibold">
                      {selectedReceipt.paymentMethod?.replaceAll("_", " ")}
                    </p>
                  </div>

                  <div className="col-span-2">
                    <p className="text-gray-500">Customer</p>
                    <p className="font-semibold">
                      {selectedReceipt.customer?.name || "-"}
                    </p>
                    <p className="text-gray-500">
                      {selectedReceipt.customer?.email || ""}
                    </p>
                  </div>
                </div>

                <div className="rounded-xl bg-orange-50 p-4 text-center">
                  <p className="text-gray-600">Amount Received</p>
                  <p className="text-2xl font-bold text-orange-700">
                    {formatAmount(selectedReceipt.amount)}
                  </p>
                </div>

                
                {/* added by abilash */}
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleDownloadReceipt}
                    className="rounded-lg bg-orange-600 px-5 py-2 font-medium text-white transition hover:bg-orange-700"
                  >
                    Download PDF
                  </button>

                  <button
                    type="button"
                    onClick={() => setReceiptModalOpen(false)}
                    className="rounded-lg bg-gray-900 px-5 py-2 text-white hover:bg-gray-800"
                  >
                    Close
                  </button>
                </div>
                {/* ended by abilash */}

              </div>
            ) : (
              <p className="text-gray-500">
                No receipt information available.
              </p>
            )}
          </div>
        </div>
      )}

      {/* ended by abilash */}

    </div>
  );
};

export default Payments;