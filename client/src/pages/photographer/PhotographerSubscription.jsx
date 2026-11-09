import { useEffect, useRef, useState } from "react";

import {
  getMySubscription,
  getMySubscriptionPayments,
  payPhotographerSubscription,
} from "../../services/photographerSubscriptionService";


const PhotographerSubscription = () => {
  const [subscriptionData, setSubscriptionData] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [paymentMethod, setPaymentMethod] =
    useState("CARD");

  const [reference, setReference] =
    useState("");

  const [receipt, setReceipt] =
    useState(null);

  const receiptInputRef =
    useRef(null);

  const [paying, setPaying] =
    useState(false);

  const [successMessage, setSuccessMessage] =
    useState("");

  const [paymentHistory, setPaymentHistory] =
    useState([]);

  const [paymentHistoryLoading, setPaymentHistoryLoading] =
    useState(true);

  const [paymentHistoryError, setPaymentHistoryError] =
    useState("");


  // ==========================================
  // LOAD SUBSCRIPTION
  // ==========================================

  useEffect(() => {
    const loadSubscription = async () => {
      try {
        setLoading(true);
        setError("");

        const response =
          await getMySubscription();

        setSubscriptionData(
          response.data
        );
      } catch (err) {
        setError(
          err.response?.data?.message ||
            "Unable to load subscription details."
        );
      } finally {
        setLoading(false);
      }
    };

    loadSubscription();
  }, []);


  // ==========================================
  // LOAD PAYMENT HISTORY
  // ==========================================

  const loadPaymentHistory = async () => {
    try {
      setPaymentHistoryLoading(true);
      setPaymentHistoryError("");

      const response =
        await getMySubscriptionPayments();

      setPaymentHistory(
        response.data?.payments || []
      );
    } catch (err) {
      setPaymentHistoryError(
        err.response?.data?.message ||
          "Unable to load subscription payment history."
      );
    } finally {
      setPaymentHistoryLoading(false);
    }
  };


  useEffect(() => {
    const loadInitialPaymentHistory =
      async () => {
        try {
          const response =
            await getMySubscriptionPayments();

          setPaymentHistory(
            response.data?.payments || []
          );
        } catch (err) {
          setPaymentHistoryError(
            err.response?.data?.message ||
              "Unable to load subscription payment history."
          );
        } finally {
          setPaymentHistoryLoading(false);
        }
      };

    loadInitialPaymentHistory();
  }, []);


  // ==========================================
  // FORMAT DATE
  // ==========================================

  const formatDate = (date) => {
    if (!date) {
      return "Not available";
    }

    return new Date(date).toLocaleString();
  };


  // ==========================================
  // FORMAT MONEY
  // ==========================================

  const formatMoney = (amount) => {
    return new Intl.NumberFormat(
      "en-LK",
      {
        style: "currency",
        currency: "LKR",
        minimumFractionDigits: 2,
      }
    ).format(amount);
  };


  // ==========================================
  // SUBSCRIPTION STATUS DISPLAY
  // ==========================================

  const getStatusClasses = (status) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-700";

      case "TRIAL":
        return "bg-blue-100 text-blue-700";

      case "GRACE_PERIOD":
        return "bg-amber-100 text-amber-700";

      case "EXPIRED":
        return "bg-red-100 text-red-700";

      default:
        return "bg-gray-100 text-gray-700";
    }
  };


  const getStatusLabel = (status) => {
    if (status === "GRACE_PERIOD") {
      return "Grace Period";
    }

    if (!status) {
      return "Unknown";
    }

    return (
      status.charAt(0) +
      status.slice(1).toLowerCase()
    );
  };


  // ==========================================
  // PAYMENT STATUS DISPLAY
  // ==========================================

  const getPaymentStatusClasses = (status) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 text-green-700";

      case "PENDING":
        return "bg-amber-100 text-amber-700";

      case "REJECTED":
        return "bg-red-100 text-red-700";

      case "FAILED":
        return "bg-red-100 text-red-700";

      default:
        return "bg-gray-100 text-gray-700";
    }
  };


  const getPaymentStatusLabel = (status) => {
    switch (status) {
      case "COMPLETED":
        return "Approved";

      case "PENDING":
        return "Pending";

      case "REJECTED":
        return "Rejected";

      case "FAILED":
        return "Failed";

      default:
        return status || "Unknown";
    }
  };


  // ==========================================
  // RECEIPT SELECTION
  // ==========================================

  const handleReceiptChange = (event) => {
    const file =
      event.target.files?.[0];

    setError("");
    setSuccessMessage("");

    if (!file) {
      setReceipt(null);
      return;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "application/pdf",
    ];

    const maxFileSize =
      5 * 1024 * 1024;

    if (!allowedTypes.includes(file.type)) {
      setReceipt(null);

      event.target.value = "";

      setError(
        "Only JPG, JPEG, PNG, and PDF receipts are allowed."
      );

      return;
    }

    if (file.size > maxFileSize) {
      setReceipt(null);

      event.target.value = "";

      setError(
        "Payment receipt must not exceed 5 MB."
      );

      return;
    }

    setReceipt(file);
  };


  // ==========================================
  // PAYMENT
  // ==========================================

  const handlePayment = async (event) => {
    event.preventDefault();

    if (!receipt) {
      setError(
        "Please upload your payment receipt before submitting."
      );

      setSuccessMessage("");
      return;
    }

    try {
      setPaying(true);
      setError("");
      setSuccessMessage("");

      const response =
        await payPhotographerSubscription({
          paymentMethod,
          reference,
          receipt,
        });

      // Payment is only submitted for Clerk
      // verification at this stage.
      // Do NOT remove subscriptionRenewalRequired.

      setSuccessMessage(
        response.message ||
          "Payment receipt submitted successfully. Your payment is awaiting Clerk verification."
      );

      setReference("");
      setReceipt(null);

      if (receiptInputRef.current) {
        receiptInputRef.current.value = "";
      }

      // Reload subscription information.
      // Subscription status should remain unchanged
      // until Clerk approval.

      const updated =
        await getMySubscription();

      setSubscriptionData(
        updated.data
      );

      // Reload history so the new PENDING
      // submission appears immediately.

      await loadPaymentHistory();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to submit payment receipt."
      );
    } finally {
      setPaying(false);
    }
  };


  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="p-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <p className="text-sm text-gray-500">
            Loading subscription details...
          </p>
        </div>
      </div>
    );
  }


  if (!subscriptionData) {
    return (
      <div className="p-6">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <p className="text-sm text-red-700">
            {error ||
              "Subscription details are unavailable."}
          </p>
        </div>
      </div>
    );
  }


  const {
    plan,
    subscription,
    latestPayment,
  } = subscriptionData;


  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">

      {/* HEADER */}

      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-orange-600">
          Photographer Account
        </p>

        <h1 className="mt-1 text-2xl font-bold text-gray-900 sm:text-3xl">
          Subscription
        </h1>

        <p className="mt-2 max-w-3xl text-sm text-gray-500">
          View your current photographer plan,
          subscription period, and renewal
          information.
        </p>
      </div>


      {/* MESSAGES */}

      {successMessage && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {successMessage}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}


      {/* PLAN + STATUS */}

      <div className="grid gap-6 lg:grid-cols-2">

        {/* PLAN */}

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-500">
            Current Plan
          </p>

          <h2 className="mt-2 text-xl font-bold text-gray-900">
            Monthly Photographer Plan
          </h2>

          <div className="mt-5">
            <span className="text-3xl font-bold text-gray-900">
              {formatMoney(plan.amount)}
            </span>

            <span className="ml-2 text-sm text-gray-500">
              / {plan.durationDays} days
            </span>
          </div>

          <div className="mt-6 space-y-3 border-t border-gray-100 pt-5 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-gray-500">
                Free trial
              </span>

              <span className="font-medium text-gray-900">
                {plan.trialDurationHours} hours
              </span>
            </div>

            <div className="flex justify-between gap-4">
              <span className="text-gray-500">
                Subscription period
              </span>

              <span className="font-medium text-gray-900">
                {plan.durationDays} days
              </span>
            </div>

            <div className="flex justify-between gap-4">
              <span className="text-gray-500">
                Renewal grace period
              </span>

              <span className="font-medium text-gray-900">
                {plan.gracePeriodDays} day
              </span>
            </div>
          </div>
        </section>


        {/* STATUS */}

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Subscription Status
              </p>

              <h2 className="mt-2 text-xl font-bold text-gray-900">
                Your subscription
              </h2>
            </div>

            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(
                subscription.status
              )}`}
            >
              {getStatusLabel(
                subscription.status
              )}
            </span>
          </div>

          <div className="mt-6 space-y-4 text-sm">
            <div>
              <p className="text-gray-500">
                Trial ends
              </p>

              <p className="mt-1 font-medium text-gray-900">
                {formatDate(
                  subscription.trialEndsAt
                )}
              </p>
            </div>

            <div>
              <p className="text-gray-500">
                Current period starts
              </p>

              <p className="mt-1 font-medium text-gray-900">
                {formatDate(
                  subscription.subscriptionStartDate
                )}
              </p>
            </div>

            <div>
              <p className="text-gray-500">
                Current period ends
              </p>

              <p className="mt-1 font-medium text-gray-900">
                {formatDate(
                  subscription.subscriptionEndDate
                )}
              </p>
            </div>

            <div>
              <p className="text-gray-500">
                Grace period ends
              </p>

              <p className="mt-1 font-medium text-gray-900">
                {formatDate(
                  subscription.gracePeriodEndsAt
                )}
              </p>
            </div>
          </div>
        </section>
      </div>


      {/* RENEWAL */}

      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="max-w-2xl">
          <p className="text-sm font-medium text-orange-600">
            Subscription Renewal
          </p>

          <h2 className="mt-1 text-xl font-bold text-gray-900">
            Renew for another{" "}
            {plan.durationDays} days
          </h2>

          <p className="mt-2 text-sm leading-6 text-gray-500">
            Your subscription fee is{" "}
            {formatMoney(plan.amount)}. Early
            renewals preserve your remaining paid
            subscription time.
          </p>
        </div>

        <form
          onSubmit={handlePayment}
          className="mt-6 grid gap-4 md:grid-cols-2"
        >
          <div>
            <label
              htmlFor="paymentMethod"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Payment Method
            </label>

            <select
              id="paymentMethod"
              value={paymentMethod}
              onChange={(event) =>
                setPaymentMethod(
                  event.target.value
                )
              }
              className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            >
              <option value="CARD">
                Card
              </option>

              <option value="BANK_TRANSFER">
                Bank Transfer
              </option>
            </select>
          </div>

          <div>
            <label
              htmlFor="reference"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Payment Reference
            </label>

            <input
              id="reference"
              type="text"
              value={reference}
              onChange={(event) =>
                setReference(
                  event.target.value
                )
              }
              placeholder="Optional reference"
              maxLength={150}
              className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            />
          </div>

          <div className="md:col-span-2">
            <label
              htmlFor="receipt"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Payment Receipt
              <span className="ml-1 text-red-500">
                *
              </span>
            </label>

            <input
              ref={receiptInputRef}
              id="receipt"
              type="file"
              accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
              onChange={handleReceiptChange}
              required
              className="block w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-700 file:mr-4 file:rounded-lg file:border-0 file:bg-orange-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-orange-700 hover:file:bg-orange-100"
            />

            <p className="mt-2 text-xs text-gray-500">
              Upload the receipt provided for your payment.
              JPG, JPEG, PNG, or PDF only. Maximum file size:
              5 MB.
            </p>

            {receipt && (
              <div className="mt-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
                <p className="text-xs font-medium text-green-700">
                  Selected receipt
                </p>

                <p className="mt-1 break-all text-sm text-green-800">
                  {receipt.name}
                </p>
              </div>
            )}
          </div>

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={paying}
              className="rounded-xl bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {paying
                ? "Submitting..."
                : "Submit Payment Receipt"}
            </button>
          </div>
        </form>
      </section>


      {/* LATEST PAYMENT */}

      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900">
          Latest Subscription Payment
        </h2>

        {!latestPayment ? (
          <p className="mt-4 text-sm text-gray-500">
            No completed subscription payments
            have been recorded yet.
          </p>
        ) : (
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                Amount
              </p>

              <p className="mt-1 font-semibold text-gray-900">
                {formatMoney(
                  latestPayment.amount
                )}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                Method
              </p>

              <p className="mt-1 font-semibold text-gray-900">
                {latestPayment.paymentMethod ===
                "BANK_TRANSFER"
                  ? "Bank Transfer"
                  : latestPayment.paymentMethod}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                Payment Date
              </p>

              <p className="mt-1 font-semibold text-gray-900">
                {formatDate(
                  latestPayment.paymentDate
                )}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                Covered Until
              </p>

              <p className="mt-1 font-semibold text-gray-900">
                {formatDate(
                  latestPayment.periodEnd
                )}
              </p>
            </div>
          </div>
        )}
      </section>


      {/* SUBSCRIPTION PAYMENT HISTORY */}

      <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-6 py-5">
          <h2 className="text-lg font-bold text-gray-900">
            Subscription Payment History
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Review your submitted subscription payments,
            verification status, and approved subscription
            periods.
          </p>
        </div>


        {paymentHistoryLoading ? (
          <div className="px-6 py-8 text-center">
            <p className="text-sm text-gray-500">
              Loading payment history...
            </p>
          </div>
        ) : paymentHistoryError ? (
          <div className="px-6 py-6">
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-sm text-red-700">
                {paymentHistoryError}
              </p>
            </div>
          </div>
        ) : paymentHistory.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <p className="text-sm font-medium text-gray-700">
              No subscription payments yet
            </p>

            <p className="mt-1 text-sm text-gray-500">
              Your submitted subscription payments
              will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Submitted / Payment Date
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Amount
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Method
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Reference
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Status
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Subscription Period
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 bg-white">
                {paymentHistory.map((payment) => (
                  <tr
                    key={payment._id}
                    className="transition hover:bg-gray-50"
                  >
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">
                      {formatDate(
                        payment.paymentDate ||
                          payment.submittedAt ||
                          payment.createdAt
                      )}
                    </td>

                    <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-gray-900">
                      {formatMoney(
                        payment.amount
                      )}
                    </td>

                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">
                      {payment.paymentMethod ===
                      "BANK_TRANSFER"
                        ? "Bank Transfer"
                        : payment.paymentMethod}
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-700">
                      {payment.reference || "—"}
                    </td>

                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getPaymentStatusClasses(
                          payment.paymentStatus
                        )}`}
                      >
                        {getPaymentStatusLabel(
                          payment.paymentStatus
                        )}
                      </span>
                    </td>

                    <td className="min-w-[280px] px-6 py-4 text-sm text-gray-700">
                      {payment.paymentStatus ===
                      "COMPLETED" ? (
                        <>
                          <div>
                            <span className="text-gray-500">
                              From:{" "}
                            </span>

                            <span className="font-medium text-gray-900">
                              {formatDate(
                                payment.periodStart
                              )}
                            </span>
                          </div>

                          <div className="mt-1">
                            <span className="text-gray-500">
                              Until:{" "}
                            </span>

                            <span className="font-medium text-gray-900">
                              {formatDate(
                                payment.periodEnd
                              )}
                            </span>
                          </div>
                        </>
                      ) : payment.paymentStatus ===
                        "PENDING" ? (
                        <span className="font-medium text-amber-700">
                          Awaiting Clerk approval
                        </span>
                      ) : payment.paymentStatus ===
                        "REJECTED" ? (
                        <div>
                          <p className="font-medium text-red-700">
                            No subscription period granted
                          </p>

                          {payment.rejectionReason && (
                            <p className="mt-1 max-w-sm whitespace-normal text-xs leading-5 text-red-600">
                              Reason:{" "}
                              {payment.rejectionReason}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-500">
                          No subscription period
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};


export default PhotographerSubscription;