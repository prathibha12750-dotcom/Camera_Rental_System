
import { useEffect, useState } from "react";
import api from "../../services/api";

const BankTransferDetails = ({ invoiceNumber }) => {
  const [bankDetails, setBankDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copiedField, setCopiedField] = useState("");

  useEffect(() => {
    let active = true;

    const loadBankDetails = async () => {
      try {
        const response = await api.get(
          "/payment-instructions/bank"
        );

        if (active) {
          setBankDetails(
            response.data?.data?.bankDetails || null
          );
        }
      } catch (err) {
        if (active) {
          setError(
            err.response?.data?.message ||
              "Bank transfer details are currently unavailable."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadBankDetails();

    return () => {
      active = false;
    };
  }, []);

  const copyValue = async (value, field) => {
    try {
      await navigator.clipboard.writeText(String(value));
      setCopiedField(field);
    } catch {
      setCopiedField("");
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="animate-pulse space-y-4">
          <div className="h-5 w-44 rounded bg-gray-200" />
          <div className="h-4 w-full rounded bg-gray-100" />
          <div className="h-4 w-3/4 rounded bg-gray-100" />
        </div>
      </div>
    );
  }

  if (error || !bankDetails) {
    return (
      <div
        role="alert"
        className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800"
      >
        {error ||
          "Bank transfer details are currently unavailable. Please contact the business."}
      </div>
    );
  }

  const fields = [
    {
      label: "Bank Name",
      value: bankDetails.bankName,
    },
    {
      label: "Account Holder",
      value: bankDetails.accountName,
    },
    {
      label: "Account Number",
      value: bankDetails.accountNumber,
    },
    {
      label: "Branch",
      value: bankDetails.branch,
    },
    ...(invoiceNumber
      ? [
          {
            label: "Transfer Description",
            value: invoiceNumber,
          },
        ]
      : []),
  ];

  return (
    <section className="overflow-hidden rounded-xl border border-orange-200 bg-white shadow-sm">
      <div className="border-b border-orange-100 bg-orange-50 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-xl">
            🏦
          </div>

          <div>
            <h3 className="font-bold text-gray-950">
              Bank Transfer Details
            </h3>
            <p className="mt-1 text-xs text-gray-600">
              Use these details to make your payment.
            </p>
          </div>
        </div>
      </div>

      <div className="divide-y divide-gray-100 px-5">
        {fields.map((field) => (
          <div
            key={field.label}
            className="flex items-center justify-between gap-3 py-3"
          >
            <div className="min-w-0">
              <p className="text-xs text-gray-500">
                {field.label}
              </p>
              <p className="mt-1 break-all text-sm font-semibold text-gray-900">
                {field.value}
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                copyValue(field.value, field.label)
              }
              className="shrink-0 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700"
              aria-label={`Copy ${field.label}`}
            >
              {copiedField === field.label
                ? "Copied"
                : "Copy"}
            </button>
          </div>
        ))}
      </div>

      <div className="border-t border-gray-100 bg-gray-50 px-5 py-4">
        <p className="text-sm font-semibold text-gray-900">
          How to pay
        </p>

        <div className="mt-3 space-y-3">
          {[
            "Transfer the invoice amount to the account above.",
            "Use your invoice number as the transfer description.",
            "Upload your receipt with the bank transaction reference.",
          ].map((step, index) => (
            <div
              key={index}
              className="flex items-start gap-3"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-100 text-xs font-bold text-orange-700">
                {index + 1}
              </span>
              <p className="text-xs leading-5 text-gray-600">
                {step}
              </p>
            </div>
          ))}
        </div>

        <p className="mt-4 border-t border-gray-200 pt-3 text-xs leading-5 text-gray-500">
          Payment is confirmed only after staff
          verifies your bank transfer.
        </p>
      </div>
    </section>
  );
};

export default BankTransferDetails;
