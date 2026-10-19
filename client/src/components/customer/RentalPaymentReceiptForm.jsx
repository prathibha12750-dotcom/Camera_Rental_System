
import { useState } from "react";
import api from "../../services/api";

const RentalPaymentReceiptForm = ({
  invoiceId,
  onSubmitted,
}) => {
  const [paymentReference, setPaymentReference] = useState("");
  const [receipt, setReceipt] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    setMessage("");
    setError("");

    if (!invoiceId) {
      setError("Rental invoice is not available.");
      return;
    }

    if (!paymentReference.trim()) {
      setError("Please enter your bank payment reference.");
      return;
    }

    if (!receipt) {
      setError("Please select your payment receipt.");
      return;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "application/pdf",
    ];

    if (!allowedTypes.includes(receipt.type)) {
      setError("Only JPG, PNG, and PDF files are allowed.");
      return;
    }

    if (receipt.size > 5 * 1024 * 1024) {
      setError("Receipt must be 5 MB or smaller.");
      return;
    }

    const formData = new FormData();

    formData.append("invoiceId", invoiceId);
    formData.append(
      "paymentReference",
      paymentReference.trim()
    );
    formData.append("receipt", receipt);

    try {
      setSubmitting(true);

      const response = await api.post(
        "/customer/rental-payments/submit",
        formData
      );

      setMessage(
        response.data?.message ||
          "Receipt submitted for verification."
      );

      setPaymentReference("");
      setReceipt(null);

      if (onSubmitted) {
        onSubmitted();
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to submit payment receipt."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-5 space-y-4 border-t border-gray-200 pt-5"
    >
      <div>
        <h3 className="font-semibold text-gray-900">
          Submit Bank Payment Receipt
        </h3>

        <p className="mt-1 text-sm text-gray-500">
          Upload proof of your bank transfer.
          Your payment will be reviewed by staff.
        </p>
      </div>

      <div>
        <label
          htmlFor="paymentReference"
          className="mb-1 block text-sm font-medium text-gray-700"
        >
          Bank Payment Reference
        </label>

        <input
          id="paymentReference"
          type="text"
          maxLength={100}
          required
          value={paymentReference}
          onChange={(event) =>
            setPaymentReference(event.target.value)
          }
          placeholder="Enter transaction reference"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none"
        />
      </div>

      <div>
        <label
          htmlFor="paymentReceipt"
          className="mb-1 block text-sm font-medium text-gray-700"
        >
          Payment Receipt
        </label>

        <input
          id="paymentReceipt"
          type="file"
          accept=".jpg,.jpeg,.png,.pdf"
          required
          onChange={(event) =>
            setReceipt(event.target.files?.[0] || null)
          }
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />

        <p className="mt-1 text-xs text-gray-500">
          JPG, PNG, or PDF — maximum 5 MB.
        </p>
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </p>
      )}

      {message && (
        <p
          role="status"
          className="rounded-lg bg-green-50 p-3 text-sm text-green-700"
        >
          {message}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-lg bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting
          ? "Submitting..."
          : "Submit Receipt for Verification"}
      </button>
    </form>
  );
};

export default RentalPaymentReceiptForm;
