
import { useRef, useState } from "react";
import api from "../../services/api";

const RentalPaymentReceiptForm = ({
  invoiceId,
  onSubmitted,
}) => {
  const [paymentReference, setPaymentReference] =
    useState("");
  const [receipt, setReceipt] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const fileInputRef = useRef(null);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files?.[0] || null;

    setError("");
    setReceipt(selectedFile);
  };

  const removeReceipt = () => {
    setReceipt(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setMessage("");
    setError("");

    if (!invoiceId) {
      setError("Rental invoice is not available.");
      return;
    }

    if (!paymentReference.trim()) {
      setError("Please enter your bank transaction reference.");
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
      removeReceipt();

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
      className="space-y-5"
    >
      <div>
        <label
          htmlFor="paymentReference"
          className="mb-2 block text-sm font-semibold text-gray-800"
        >
          Bank Transaction Reference
          <span className="ml-1 text-red-500">*</span>
        </label>

        <input
          id="paymentReference"
          type="text"
          maxLength={100}
          required
          disabled={submitting}
          value={paymentReference}
          onChange={(event) =>
            setPaymentReference(event.target.value)
          }
          placeholder="Enter bank transaction reference"
          className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 disabled:opacity-60"
        />

        <p className="mt-2 text-xs leading-5 text-gray-500">
          Enter the transaction ID or reference
          provided by your bank after the transfer.
        </p>
      </div>

      <div>
        <label
          htmlFor="paymentReceipt"
          className="mb-2 block text-sm font-semibold text-gray-800"
        >
          Payment Receipt
          <span className="ml-1 text-red-500">*</span>
        </label>

        <div className="rounded-xl border-2 border-dashed border-gray-300 bg-white p-5 text-center transition hover:border-orange-300">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-orange-50 text-2xl">
            📄
          </div>

          {receipt ? (
            <div className="mt-3">
              <p className="break-all text-sm font-semibold text-gray-900">
                {receipt.name}
              </p>

              <p className="mt-1 text-xs text-gray-500">
                {(receipt.size / (1024 * 1024)).toFixed(2)} MB
              </p>

              <button
                type="button"
                disabled={submitting}
                onClick={removeReceipt}
                className="mt-3 text-xs font-semibold text-red-600 hover:text-red-700 disabled:opacity-50"
              >
                Remove File
              </button>
            </div>
          ) : (
            <div className="mt-3">
              <p className="text-sm font-semibold text-gray-800">
                Upload your bank transfer receipt
              </p>

              <p className="mt-1 text-xs text-gray-500">
                JPG, PNG or PDF — maximum 5 MB
              </p>
            </div>
          )}

          <input
            ref={fileInputRef}
            id="paymentReceipt"
            type="file"
            accept=".jpg,.jpeg,.png,.pdf"
            required={!receipt}
            disabled={submitting}
            onChange={handleFileChange}
            className="mt-4 block w-full cursor-pointer rounded-lg border border-gray-200 bg-gray-50 p-2 text-xs text-gray-600 file:mr-3 file:rounded-md file:border-0 file:bg-orange-100 file:px-3 file:py-2 file:font-semibold file:text-orange-700 hover:file:bg-orange-200"
          />
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {message && (
        <div
          role="status"
          className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800"
        >
          {message}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="flex w-full items-center justify-center rounded-xl bg-orange-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting
          ? "Submitting Receipt..."
          : "Submit Receipt for Verification"}
      </button>

      <p className="text-center text-xs leading-5 text-gray-500">
        Your payment will be reviewed by staff.
        Submitting a receipt does not automatically
        mark your invoice as paid.
      </p>
    </form>
  );
};

export default RentalPaymentReceiptForm;
