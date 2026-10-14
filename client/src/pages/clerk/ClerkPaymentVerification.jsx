
import { useEffect, useState } from "react";
import api from "../../services/api";

const ClerkPaymentVerification = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [approvingPaymentId, setApprovingPaymentId] = useState(null);
  const [rejectingPaymentId, setRejectingPaymentId] = useState(null);
  const [activeTab, setActiveTab] = useState("ALL");
  const [selectedPayment, setSelectedPayment] = useState(null);

  useEffect(() => {
    let active = true;

    const loadPayments = async () => {
      try {
        const response = await api.get(
        "/rentals/payments/history"
        );

        if (active) {
          setPayments(response.data?.data?.payments || []);
        }
      } catch (err) {
        if (active) {
          setError(
            err.response?.data?.message ||
              "Failed to load pending payments."
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

  const formatAmount = (amount) =>
    `LKR ${Number(amount || 0).toLocaleString("en-LK")}`;


const formatDate = (date) => {
  if (!date) return "Not available";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Not available";
  }

  return parsedDate.toLocaleString("en-LK", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const tabs = [
  { key: "ALL", label: "All" },
  { key: "PENDING_VERIFICATION", label: "Pending" },
  { key: "COMPLETED", label: "Approved" },
  { key: "REJECTED", label: "Rejected" },
];

const filteredPayments =
  activeTab === "ALL"
    ? payments
    : payments.filter(
        (payment) => payment.paymentStatus === activeTab
      );

const getTabCount = (status) =>
  status === "ALL"
    ? payments.length
    : payments.filter(
        (payment) => payment.paymentStatus === status
      ).length;
 
const handleRefresh = async () => {
  try {
    setError("");

    const response = await api.get(
      "/rentals/payments/history"
    );

    const updatedPayments =
      response.data?.data?.payments || [];

    setPayments(updatedPayments);

    // Keep the invoice popup synchronized if it is open.
    setSelectedPayment((current) => {
      if (!current) return null;

      return (
        updatedPayments.find(
          (payment) => payment._id === current._id
        ) || null
      );
    });
  } catch (err) {
    setError(
      err.response?.data?.message ||
        "Failed to refresh rental payment history."
    );
  }
};

const [openingReceiptId, setOpeningReceiptId] = useState(null);

const handleViewReceipt = async (paymentId) => {
  // Open the window immediately from the button click.
  // This avoids Chrome blocking it after an API request.
  const receiptWindow = window.open("", "_blank");

  if (!receiptWindow) {
    setError(
      "Your browser blocked the receipt window. Please allow pop-ups and try again."
    );
    return;
  }

  let receiptUrl = null;

  try {
    setOpeningReceiptId(paymentId);
    setError("");

    receiptWindow.document.title = "Loading Payment Receipt";
    receiptWindow.document.body.textContent =
      "Loading payment receipt. Please wait...";

    const response = await api.get(
      `/rentals/payments/${paymentId}/receipt`,
      {
        responseType: "blob",
      }
    );

    const contentType =
      response.headers["content-type"] ||
      response.data.type;

    const validTypes = [
      "image/jpeg",
      "image/png",
      "application/pdf",
    ];

    if (
      !validTypes.includes(
        contentType?.split(";")[0]?.trim()
      )
    ) {
      throw new Error("Unsupported receipt format.");
    }

    receiptUrl = URL.createObjectURL(response.data);

    if (!receiptWindow.closed) {
      receiptWindow.location.replace(receiptUrl);

      // Release the object URL after the browser has
      // had time to load the receipt.
      // Keep it available longer for PDF viewing.
      setTimeout(() => {
        URL.revokeObjectURL(receiptUrl);
      }, 60000);
    } else {
      URL.revokeObjectURL(receiptUrl);
    }
  } catch (err) {
    if (receiptUrl) {
      URL.revokeObjectURL(receiptUrl);
    }

    if (!receiptWindow.closed) {
      receiptWindow.close();
    }

    setError(
      err.response?.data?.message ||
        err.message ||
        "Failed to open payment receipt."
    );
  } finally {
    setOpeningReceiptId(null);
  }
};

const handleApprovePayment = async (paymentId) => {
  const confirmed = window.confirm(
    "Are you sure you want to approve this rental payment? Please verify the receipt and bank transfer details before continuing."
  );

  if (!confirmed) {
    return;
  }

  try {
    setApprovingPaymentId(paymentId);
    setError("");

    const response = await api.patch(
    `/rentals/payments/${paymentId}/approve`
    );

    const approvedPayment = response.data?.data?.payment;

    // Remove the approved payment from the pending list.

    setPayments((previousPayments) =>
    previousPayments.map((payment) =>
        payment._id === paymentId
        ? {
            ...payment,
            paymentStatus: "COMPLETED",
            rejectionReason: null,
            verifiedAt:
                approvedPayment?.verifiedAt || new Date().toISOString(),
            verifiedBy: approvedPayment?.verifiedBy || payment.verifiedBy,
            }
        : payment
    )
    );

    await handleRefresh();
    window.alert("Rental payment approved successfully.");
  } catch (err) {
    setError(
      err.response?.data?.message ||
        "Failed to approve rental payment."
    );
  } finally {
    setApprovingPaymentId(null);
  }
};

const handleRejectPayment = async (paymentId) => {
  const reason = window.prompt(
    "Enter the reason for rejecting this payment receipt:"
  );

  // User cancelled the prompt.
  if (reason === null) {
    return;
  }

  const rejectionReason = reason.trim();

  if (!rejectionReason) {
    window.alert("A rejection reason is required.");
    return;
  }

  if (rejectionReason.length > 500) {
    window.alert(
      "Rejection reason cannot exceed 500 characters."
    );
    return;
  }

  const confirmed = window.confirm(
    "Are you sure you want to reject this payment?"
  );

  if (!confirmed) {
    return;
  }

  try {
    setRejectingPaymentId(paymentId);
    setError("");

    const response = await api.patch(
    `/rentals/payments/${paymentId}/reject`,
    {
        rejectionReason,
    }
    );

    const rejectedPayment = response.data?.data?.payment;

    // Remove rejected payment from the pending list.

    setPayments((previousPayments) =>
    previousPayments.map((payment) =>
        payment._id === paymentId
        ? {
            ...payment,
            paymentStatus: "REJECTED",
            rejectionReason:
                rejectedPayment?.rejectionReason || rejectionReason,
            verifiedAt:
                rejectedPayment?.verifiedAt || null,
            verifiedBy:
                payment.verifiedBy || rejectedPayment?.verifiedBy,
            }
        : payment
    )
    );

    await handleRefresh();
    window.alert("Rental payment rejected successfully.");
  } catch (err) {
    setError(
      err.response?.data?.message ||
        "Failed to reject rental payment."
    );
  } finally {
    setRejectingPaymentId(null);
  }
};

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-6xl">

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-bold uppercase tracking-wider text-orange-600">
            Clerk Operations
          </p>

          <h1 className="mt-2 text-2xl font-bold text-gray-950">
            Rental Payment Verification
          </h1>

          <p className="mt-3 text-gray-600">
            Review customer payment submissions
            and verify pending rental receipts.
          </p>
        </div>

        <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          
        <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-gray-950">
            Rental Payment History
        </h2>

        <div className="flex items-center gap-3">
            <span className="rounded-full bg-orange-50 px-3 py-1 text-sm font-semibold text-orange-700">
            {getTabCount("PENDING_VERIFICATION")} Pending
            </span>

            <button
            type="button"
            onClick={handleRefresh}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-orange-300 hover:text-orange-600"
            >
            ↻ Refresh
            </button>
        </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2 border-b border-gray-200 pb-4">
        {tabs.map((tab) => (
            <button
            key={tab.key}
            type="button"
            onClick={() => {
                setActiveTab(tab.key);
                setError("");
            }}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                activeTab === tab.key
                ? "bg-orange-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-orange-50 hover:text-orange-600"
            }`}
            >
            {tab.label} ({getTabCount(tab.key)})
            </button>
        ))}
        </div>

          {loading && (
            <p className="mt-6 text-gray-500">
              Loading pending payments...
            </p>
          )}

          {!loading && error && (
            <div
              role="alert"
              className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          {!loading && !error && filteredPayments.length === 0 && (
            <div className="mt-6 rounded-xl bg-gray-50 p-8 text-center">
              <p className="font-semibold text-gray-800">
                No pending payments
              </p>
              <p className="mt-2 text-sm text-gray-500">
                New rental payment submissions will
                appear here.
              </p>
            </div>
          )}

          {!loading && !error && filteredPayments.length > 0 && (
            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="border-b border-gray-200 bg-gray-50 text-gray-600">
                  <tr>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Invoice</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Reference</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {filteredPayments.map((payment) => (
                    <tr
                      key={payment._id}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-4 py-4">
                        <p className="font-semibold text-gray-900">
                          {payment.customer?.name || "Unknown"}
                        </p>
                        <p className="text-xs text-gray-500">
                          {payment.customer?.email || ""}
                        </p>
                      </td>

                    <td className="px-4 py-4">
                    <button
                        type="button"
                        onClick={() => {
                            setError("");
                            setSelectedPayment(payment);
                        }}
                        className="font-semibold text-orange-600 underline-offset-4 transition hover:text-orange-700 hover:underline"
                        title="View invoice and payment details"
                    >
                        {payment.invoice?.invoiceNumber || "N/A"}
                    </button>
                    </td>

                      <td className="px-4 py-4 font-semibold text-gray-900">
                        {formatAmount(payment.amount)}
                      </td>

                      <td className="px-4 py-4 text-gray-700">
                        {payment.paymentReference || "N/A"}
                      </td>

                    <td className="px-4 py-4">
                    <div className="flex flex-col items-start gap-2">
                        <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            payment.paymentStatus === "COMPLETED"
                            ? "bg-green-100 text-green-700"
                            : payment.paymentStatus === "REJECTED"
                                ? "bg-red-100 text-red-700"
                                : "bg-amber-100 text-amber-700"
                        }`}
                        >
                        {payment.paymentStatus === "COMPLETED"
                            ? "Approved"
                            : payment.paymentStatus === "REJECTED"
                            ? "Rejected"
                            : "Pending"}
                        </span>

                        {payment.paymentStatus === "REJECTED" &&
                        payment.rejectionReason && (
                            <p className="max-w-[240px] whitespace-normal break-words text-xs text-red-600">
                            <span className="font-semibold">Reason: </span>
                            {payment.rejectionReason}
                            </p>
                        )}
                    </div>
                    </td>

                        <td className="px-4 py-4">
                        <div className="flex items-center gap-2 whitespace-nowrap">

                            {/* View Receipt */}
                            <button
                            type="button"
                            onClick={() => handleViewReceipt(payment._id)}
                            disabled={openingReceiptId === payment._id}
                            className="rounded-lg border border-orange-300 bg-orange-50 px-3 py-2 text-xs font-semibold text-orange-600 transition hover:bg-orange-100 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                            {openingReceiptId === payment._id
                                ? "Opening..."
                                : "View"}
                            </button>

                            {payment.paymentStatus === "PENDING_VERIFICATION" && (
                            <>
                            {/* Approve Payment */}
                            <button
                            type="button"
                            onClick={() => handleApprovePayment(payment._id)}
                            disabled={
                                approvingPaymentId === payment._id ||
                                rejectingPaymentId === payment._id
                            }
                            className="rounded-lg bg-green-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                            {approvingPaymentId === payment._id
                                ? "Approving..."
                                : "Approve"}
                            </button>

                            {/* Reject Payment */}
                            <button
                            type="button"
                            onClick={() => handleRejectPayment(payment._id)}
                            disabled={
                                rejectingPaymentId === payment._id ||
                                approvingPaymentId === payment._id
                            }
                            className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                            {rejectingPaymentId === payment._id
                                ? "Rejecting..."
                                : "Reject"}
                            </button>
                              </>
                            )}

                        </div>
                        </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

    {selectedPayment && (
    <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
        role="presentation"
        onClick={() => setSelectedPayment(null)}
    >
        <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="rental-payment-details-title"
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
        onClick={(event) => event.stopPropagation()}
        >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-gray-200 pb-4">
            <div>
            <h2
                id="rental-payment-details-title"
                className="text-xl font-bold text-gray-900"
            >
                Invoice & Payment Details
            </h2>
            <p className="mt-1 break-all text-sm text-gray-500">
                {selectedPayment.invoice?.invoiceNumber || "N/A"}
            </p>
            </div>

            <button
            type="button"
            onClick={() => setSelectedPayment(null)}
            className="rounded-lg px-3 py-1 text-xl text-gray-500 hover:bg-gray-100"
            aria-label="Close payment details"
            >
            ×
            </button>
        </div>

        {/* Payment status */}
        <div className="mt-5">
            <span
            className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                selectedPayment.paymentStatus === "COMPLETED"
                ? "bg-green-100 text-green-700"
                : selectedPayment.paymentStatus === "REJECTED"
                    ? "bg-red-100 text-red-700"
                    : "bg-amber-100 text-amber-700"
            }`}
            >
            {selectedPayment.paymentStatus === "COMPLETED"
                ? "Approved"
                : selectedPayment.paymentStatus === "REJECTED"
                ? "Rejected"
                : "Pending Verification"}
            </span>
        </div>

        {/* Invoice and payment information */}
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
            {[
            ["Customer", selectedPayment.customer?.name || "N/A"],
            ["Customer Email", selectedPayment.customer?.email || "N/A"],
            ["Invoice Total", formatAmount(selectedPayment.invoice?.totalAmount)],
            ["Invoice Status", selectedPayment.invoice?.paymentStatus || "N/A"],
            ["Payment Amount", formatAmount(selectedPayment.amount)],
            ["Payment Method", selectedPayment.paymentMethod?.replaceAll("_", " ") || "N/A"],
            ["Payment Reference", selectedPayment.paymentReference || "N/A"],
            ["Submitted At", formatDate(selectedPayment.submittedAt)],
            ["Verified At", formatDate(selectedPayment.verifiedAt)],
            ["Verified By", selectedPayment.verifiedBy?.name || "Not verified yet"],
            ].map(([label, value]) => (
            <div key={label} className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                {label}
                </p>
                <p className="mt-1 break-words text-sm font-semibold text-gray-900">
                {value}
                </p>
            </div>
            ))}
        </div>

        {/* Rejection reason */}
        {selectedPayment.paymentStatus === "REJECTED" &&
            selectedPayment.rejectionReason && (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4">
                <p className="text-sm font-bold text-red-700">
                Rejection Reason
                </p>
                <p className="mt-2 whitespace-pre-wrap break-words text-sm text-red-700">
                {selectedPayment.rejectionReason}
                </p>
            </div>
            )}

        {/* Footer */}
        <div className="mt-7 flex flex-wrap justify-end gap-3 border-t border-gray-200 pt-5">
            <button
            type="button"
            onClick={() => handleViewReceipt(selectedPayment._id)}
            disabled={openingReceiptId === selectedPayment._id}
            className="rounded-lg border border-orange-300 bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-700 hover:bg-orange-100 disabled:opacity-60"
            >
            {openingReceiptId === selectedPayment._id
                ? "Opening..."
                : "View Receipt"}
            </button>

            <button
            type="button"
            onClick={() => {
                setSelectedPayment(null);
                setError("");
            }}
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
            >
            Close
            </button>
        </div>
        </div>
    </div>
    )}

    </main>
  );
};

export default ClerkPaymentVerification;
