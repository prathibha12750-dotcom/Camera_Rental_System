import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../../services/api";
import RentalPaymentReceiptForm from "../../components/customer/RentalPaymentReceiptForm";

const CustomerRentalDetails = () => {
  const { rentalId } = useParams();

  const [details, setDetails] = useState(null);
  const [payments, setPayments] = useState([]);
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const loadRentalDetails = async () => {
      try {
        const [rentalResponse, paymentsResponse, refundsResponse] =
        await Promise.all([
            api.get(`/rentals/my-rentals/${rentalId}`),
            api.get("/customer/payments"),
            api.get("/customer/refunds"),
        ]);

        if (active) {
        setDetails(rentalResponse.data?.data || null);

        setPayments(
            paymentsResponse.data?.data?.payments || []
        );

        setRefunds(
            refundsResponse.data?.data?.refunds || []
        );
        }
      } catch (err) {
        if (active) {
          setError(
            err.response?.data?.message ||
              "Unable to load rental details."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadRentalDetails();

    return () => {
      active = false;
    };
  }, [rentalId]);

  const formatMoney = (amount) =>
    `LKR ${Number(amount || 0).toLocaleString()}`;

  const formatDate = (date) =>
    date
      ? new Date(date).toLocaleDateString("en-GB")
      : "Not available";

  if (loading) {
    return (
      <main className="p-8 text-center text-gray-600">
        Loading rental details...
      </main>
    );
  }

  if (error || !details?.rental) {
    return (
      <main className="mx-auto max-w-5xl p-8">
        <Link
          to="/customer/rentals"
          className="text-orange-600"
        >
          ← Back to My Rentals
        </Link>

        <p className="mt-6 text-red-600">
          {error || "Rental details not found."}
        </p>
      </main>
    );
  }

  const { rental, invoice, deposit } = details;

    // ==========================================
    // REFUND FOR THE CURRENT RENTAL
    // ==========================================

    const rentalRefunds = refunds.filter((refund) => {
    const refundInvoiceId =
        refund.invoice?._id || refund.invoice;

    return (
        invoice?._id &&
        String(refundInvoiceId) === String(invoice._id)
    );
    });

    // Latest refund record for this rental
    const latestRefund = rentalRefunds[0] || null;

    const invoicePayments = payments.filter(
    (payment) =>
        String(payment.invoice?._id) === String(invoice?._id)
    );

    const pendingPayment = invoicePayments.find(
    (payment) =>
        payment.paymentStatus === "PENDING_VERIFICATION"
    );

    const rejectedPayment = invoicePayments.find(
    (payment) =>
        payment.paymentStatus === "REJECTED"
    );

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <Link
          to="/customer/rentals"
          className="text-sm font-semibold text-orange-600 hover:text-orange-700"
        >
          ← Back to My Rentals
        </Link>

        <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-950">
            Rental Details
          </h1>

          <p className="mt-2 break-all text-sm text-gray-500">
            Rental Reference: {rental._id}
          </p>

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <section className="rounded-xl border border-gray-200 p-5">
              <h2 className="text-lg font-bold text-gray-900">
                Rental Overview
              </h2>

              <div className="mt-4 space-y-3 text-sm">
                <p>
                  <strong>Equipment:</strong>{" "}
                  {rental.equipment?.name || "Unavailable"}
                </p>
                <p>
                  <strong>Brand:</strong>{" "}
                  {rental.equipment?.brand || "—"}
                </p>
                <p>
                  <strong>Model:</strong>{" "}
                  {rental.equipment?.model || "—"}
                </p>
                <p>
                  <strong>Start Date:</strong>{" "}
                  {formatDate(rental.startDate)}
                </p>
                <p>
                  <strong>End Date:</strong>{" "}
                  {formatDate(rental.endDate)}
                </p>
                <p>
                  <strong>Status:</strong> {rental.status}
                </p>
                <p>
                  <strong>Rental Fee:</strong>{" "}
                  {formatMoney(rental.totalPrice)}
                </p>
              </div>
            </section>

            <section className="rounded-xl border border-gray-200 p-5">
              <h2 className="text-lg font-bold text-gray-900">
                Payment & Receipt
              </h2>

              {invoice ? (
                <div className="mt-4 space-y-3 text-sm">
                  <p>
                    <strong>Invoice:</strong>{" "}
                    {invoice.invoiceNumber}
                  </p>
                  <p>
                    <strong>Total Amount:</strong>{" "}
                    {formatMoney(invoice.totalAmount)}
                  </p>
                  <p>
                    <strong>Payment Status:</strong>{" "}
                    {invoice.paymentStatus}
                  </p>

                {pendingPayment ? (
                <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
                    <p className="font-semibold text-amber-800">
                    Payment Receipt Awaiting Verification
                    </p>

                    <p className="mt-2 text-sm text-amber-700">
                    Your payment receipt has been submitted successfully.
                    A Clerk or Admin will review it.
                    </p>

                    {pendingPayment.paymentReference && (
                    <p className="mt-2 text-sm text-amber-800">
                        <strong>Payment Reference:</strong>{" "}
                        {pendingPayment.paymentReference}
                    </p>
                    )}
                </div>
                ) : (
                <>
                    {rejectedPayment &&
                    invoice.paymentStatus !== "PAID" && (
                        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
                        <p className="font-semibold text-red-800">
                            Previous Payment Receipt Rejected
                        </p>

                        <p className="mt-2 text-sm text-red-700">
                            <strong>Reason:</strong>{" "}
                            {rejectedPayment.rejectionReason ||
                            "No reason provided."}
                        </p>

                        <p className="mt-2 text-sm text-red-700">
                            You may submit a new receipt if your
                            rental is still eligible.
                        </p>
                        </div>
                    )}

                    {rental.status === "CONFIRMED" &&
                    invoice.paymentStatus !== "PAID" && (
                        <RentalPaymentReceiptForm
                        invoiceId={invoice._id}
                        onSubmitted={() => {
                            api.get("/customer/payments").then((response) => {
                            setPayments(
                                response.data?.data?.payments || []
                            );
                            }).catch((error) => {
                            console.error(
                                "Failed to refresh payment status:",
                                error
                            );
                            });
                        }}
                        />
                    )}
                </>
                )}

                {invoice.paymentStatus === "PAID" && (
                <p className="rounded-lg bg-green-50 p-3 text-green-700">
                    This rental invoice has been fully paid.
                </p>
                )}

                {rental.status !== "CONFIRMED" &&
                invoice.paymentStatus !== "PAID" && (
                    <p className="text-gray-500">
                    Payment receipt submission is available only
                    for confirmed rentals.
                    </p>
                )}
                </div>
              ) : (
                <p className="mt-4 text-sm text-gray-500">
                  No invoice has been generated for this rental yet.
                </p>
              )}
            </section>

            <section className="rounded-xl border border-gray-200 p-5 md:col-span-2">
              <h2 className="text-lg font-bold text-gray-900">
                Deposit & Refund
              </h2>

              {invoice ? (
                <div className="mt-4 space-y-3 text-sm">
                  <p>
                    <strong>Required Security Deposit:</strong>{" "}
                    {formatMoney(invoice.securityDeposit)}
                  </p>

                  <p>
                    <strong>Deposit Status:</strong>{" "}
                    {deposit?.status || "Not recorded"}
                  </p>

                  {deposit &&
                    [
                        "REFUND_PENDING",
                        "REFUNDED",
                        "PARTIALLY_REFUNDED",
                        "DEDUCTED",
                    ].includes(deposit.status) && (
                        <div className="space-y-2 rounded-lg bg-gray-50 p-3">

                    {details.deductionBreakdown ? (
                      <>
                        <p>
                          <strong>Damage Deductions:</strong>{" "}
                          {formatMoney(
                            details.deductionBreakdown.damageRecovered
                          )}
                        </p>

                        <p>
                          <strong>Overdue Rental Penalty:</strong>{" "}
                          {formatMoney(
                            details.deductionBreakdown.overduePenaltyRecovered
                          )}
                        </p>

                        <div className="border-t border-gray-200 pt-2">
                          <p className="font-semibold text-gray-900">
                            <strong>Total Security Deposit Deductions:</strong>{" "}
                            {formatMoney(
                              details.deductionBreakdown.totalDeductedFromDeposit
                            )}
                          </p>
                        </div>
                      </>
                    ) : (
                      <p>
                        <strong>Total Security Deposit Deductions:</strong>{" "}
                        {formatMoney(deposit.deductedAmount ?? 0)}
                      </p>
                    )}

                        <p>
                            <strong>Refundable Balance:</strong>{" "}
                            {formatMoney(
                            Math.max(
                                0,
                                Number(deposit.amount ?? 0) -
                                Number(deposit.deductedAmount ?? 0)
                            )
                            )}
                        </p>

                        <p className="text-xs text-gray-500">
                            The refundable balance is not a confirmation
                            that a refund has been paid.
                        </p>

                        </div>
                    )}

                  {deposit?.status === "REFUND_PENDING" && (
                    <p className="rounded-lg bg-amber-50 p-3 text-amber-800">
                      Your security deposit refund is pending.
                      This does not mean the money has been paid.
                    </p>
                  )}

                {latestRefund ? (
                <div className="mt-4 space-y-3 rounded-xl border border-gray-200 bg-gray-50 p-4">

                    <h3 className="font-bold text-gray-900">
                    Refund Information
                    </h3>

                    <p>
                    <strong>Refund Amount:</strong>{" "}
                    {formatMoney(latestRefund.amount)}
                    </p>

                    <p>
                    <strong>Refund Method:</strong>{" "}
                    {latestRefund.refundMethod?.replaceAll("_", " ") || "Not available"}
                    </p>

                    <p>
                    <strong>Refund Status:</strong>{" "}
                    <span
                        className={
                        latestRefund.status === "COMPLETED"
                            ? "font-semibold text-green-700"
                            : "font-semibold text-amber-700"
                        }
                    >
                        {latestRefund.status === "COMPLETED"
                        ? "Completed"
                        : "Pending Payout"}
                    </span>
                    </p>

                    {latestRefund.status === "PENDING" && (
                    <p className="rounded-lg bg-amber-50 p-3 text-amber-800">
                        Your refund is being processed. The payout has
                        not yet been confirmed.
                    </p>
                    )}

                    {latestRefund.status === "COMPLETED" && (
                    <div className="space-y-2 rounded-lg bg-green-50 p-3 text-green-800">
                        <p>
                        Your refund has been marked as completed.
                        </p>

                        {latestRefund.confirmedAt && (
                        <p>
                            <strong>Confirmed On:</strong>{" "}
                            {formatDate(latestRefund.confirmedAt)}
                        </p>
                        )}

                        {latestRefund.payoutReference && (
                        <p className="break-all">
                            <strong>Payout Reference:</strong>{" "}
                            {latestRefund.payoutReference}
                        </p>
                        )}
                    </div>
                    )}

                </div>
                ) : (
                <p className="text-gray-500">
                    No refund record has been created for this rental yet.
                </p>
                )}
                </div>
              ) : (
                <p className="mt-4 text-sm text-gray-500">
                  Deposit information will appear after
                  an invoice is generated.
                </p>
              )}
            </section>
          </div>
        </div>
      </div>
    </main>
  );
};

export default CustomerRentalDetails;
