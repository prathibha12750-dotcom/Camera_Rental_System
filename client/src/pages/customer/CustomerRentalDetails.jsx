
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../../services/api";
import RentalPaymentReceiptForm from "../../components/customer/RentalPaymentReceiptForm";
import BankTransferDetails from "../../components/customer/BankTransferDetails";

const statusStyles = {
  PENDING: "bg-amber-50 text-amber-700 ring-amber-200",
  CONFIRMED: "bg-blue-50 text-blue-700 ring-blue-200",
  ACTIVE: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  RETURNED: "bg-purple-50 text-purple-700 ring-purple-200",
  COMPLETED: "bg-green-50 text-green-700 ring-green-200",
  PAID: "bg-green-50 text-green-700 ring-green-200",
  REFUNDED: "bg-green-50 text-green-700 ring-green-200",
  PARTIALLY_PAID: "bg-amber-50 text-amber-700 ring-amber-200",
  REFUND_PENDING: "bg-amber-50 text-amber-700 ring-amber-200",
  REJECTED: "bg-red-50 text-red-700 ring-red-200",
  CANCELLED: "bg-gray-100 text-gray-600 ring-gray-200",
};

const StatusBadge = ({ status }) => (
  <span
    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${
      statusStyles[status] ||
      "bg-gray-100 text-gray-700 ring-gray-200"
    }`}
  >
    {status?.replaceAll("_", " ") || "Not available"}
  </span>
);

const DetailItem = ({ label, value }) => (
  <div className="min-w-0">
    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
      {label}
    </p>
    <div className="mt-1 break-words text-sm font-semibold text-gray-900">
      {value}
    </div>
  </div>
);

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
        const [
          rentalResponse,
          paymentsResponse,
          refundsResponse,
        ] = await Promise.all([
          api.get(`/rentals/my-rentals/${rentalId}`),
          api.get("/customer/payments"),
          api.get("/customer/refunds"),
        ]);

        if (!active) return;

        setDetails(rentalResponse.data?.data || null);
        setPayments(
          paymentsResponse.data?.data?.payments || []
        );
        setRefunds(
          refundsResponse.data?.data?.refunds || []
        );
      } catch (err) {
        if (active) {
          setError(
            err.response?.data?.message ||
              "Unable to load rental details."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    loadRentalDetails();

    return () => {
      active = false;
    };
  }, [rentalId]);

  const formatMoney = (amount) =>
    `LKR ${Number(amount || 0).toLocaleString(
      "en-LK",
      { minimumFractionDigits: 2, maximumFractionDigits: 2 }
    )}`;

  const formatDate = (date) =>
    date
      ? new Date(date).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "Not available";

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-16">
        <div className="mx-auto max-w-6xl animate-pulse space-y-5">
          <div className="h-9 w-64 rounded-lg bg-gray-200" />
          <div className="h-32 rounded-2xl bg-gray-200" />
          <div className="h-64 rounded-2xl bg-gray-200" />
        </div>
      </main>
    );
  }

  if (error || !details?.rental) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-12">
        <div className="mx-auto max-w-6xl">
          <Link
            to="/customer/rentals"
            className="font-semibold text-orange-600 hover:text-orange-700"
          >
            ← Back to My Rentals
          </Link>
          <div className="mt-6 rounded-2xl border border-red-200 bg-white p-6 text-red-700">
            {error || "Rental details not found."}
          </div>
        </div>
      </main>
    );
  }

  const { rental, invoice, deposit } = details;

  const rentalRefunds = refunds.filter((refund) => {
    const refundInvoiceId =
      refund.invoice?._id || refund.invoice;

    return (
      invoice?._id &&
      String(refundInvoiceId) === String(invoice._id)
    );
  });

  const latestRefund = rentalRefunds[0] || null;

  const invoicePayments = payments.filter(
    (payment) =>
      String(payment.invoice?._id || payment.invoice) ===
      String(invoice?._id)
  );

  const pendingPayment = invoicePayments.find(
    (payment) =>
      payment.paymentStatus === "PENDING_VERIFICATION"
  );

  const rejectedPayment = invoicePayments.find(
    (payment) => payment.paymentStatus === "REJECTED"
  );

  const canSubmitReceipt =
    rental.status === "CONFIRMED" &&
    invoice &&
    invoice.paymentStatus !== "PAID" &&
    !pendingPayment;

  const refreshPayments = async () => {
    try {
      const response = await api.get("/customer/payments");
      setPayments(response.data?.data?.payments || []);
    } catch (err) {
      console.error("Failed to refresh payments:", err);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* PAGE HEADER */}
        <div>
          <Link
            to="/customer/rentals"
            className="inline-flex text-sm font-semibold text-orange-600 hover:text-orange-700"
          >
            ← Back to My Rentals
          </Link>

          <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-orange-600">
                My Rentals
              </p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight text-gray-950">
                Rental Details
              </h1>
              <p className="mt-2 text-sm text-gray-500">
                Review your equipment rental, payment,
                and security deposit.
              </p>
            </div>

            <StatusBadge status={rental.status} />
          </div>

          <p className="mt-4 break-all text-xs text-gray-400">
            Rental Reference: {rental._id}
          </p>
        </div>

        {/* SUMMARY CARDS */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Rental Fee
            </p>
            <p className="mt-2 text-xl font-bold text-gray-950">
              {formatMoney(rental.totalPrice)}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Security Deposit
            </p>
            <p className="mt-2 text-xl font-bold text-gray-950">
              {formatMoney(
                invoice?.securityDeposit ??
                  rental.securityDeposit
              )}
            </p>
          </div>

          <div className="rounded-2xl border border-orange-200 bg-orange-50 p-5 shadow-sm">
            <p className="text-sm text-orange-800">
              Total Invoice Amount
            </p>
            <p className="mt-2 text-xl font-bold text-gray-950">
              {invoice
                ? formatMoney(invoice.totalAmount)
                : "Not available"}
            </p>
          </div>
        </div>

        {/* RENTAL OVERVIEW */}
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-gray-950">
                Rental Overview
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Equipment and rental period information
              </p>
            </div>
            <StatusBadge status={rental.status} />
          </div>

          <div className="mt-6 grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
            <DetailItem
              label="Equipment"
              value={
                rental.equipment?.name || "Unavailable"
              }
            />
            <DetailItem
              label="Brand"
              value={rental.equipment?.brand || "—"}
            />
            <DetailItem
              label="Model"
              value={rental.equipment?.model || "—"}
            />
            <DetailItem
              label="Start Date"
              value={formatDate(rental.startDate)}
            />
            <DetailItem
              label="End Date"
              value={formatDate(rental.endDate)}
            />
            <DetailItem
              label="Rental Fee"
              value={formatMoney(rental.totalPrice)}
            />
          </div>
        </section>

        {/* PAYMENT */}
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-gray-950">
                Payment & Receipt
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Invoice details and bank transfer payment
              </p>
            </div>
            {invoice && (
              <StatusBadge
                status={invoice.paymentStatus}
              />
            )}
          </div>

          {invoice ? (
            <>
              <div className="mt-6 grid gap-4 rounded-xl bg-gray-50 p-5 sm:grid-cols-3">
                <DetailItem
                  label="Invoice Number"
                  value={invoice.invoiceNumber}
                />
                <DetailItem
                  label="Total Amount"
                  value={formatMoney(invoice.totalAmount)}
                />
                <DetailItem
                  label="Payment Status"
                  value={
                    <StatusBadge
                      status={invoice.paymentStatus}
                    />
                  }
                />
              </div>

              {pendingPayment ? (
                <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-5">
                  <p className="font-semibold text-amber-900">
                    Payment Receipt Awaiting Verification
                  </p>
                  <p className="mt-2 text-sm text-amber-800">
                    Your receipt has been submitted.
                    Staff will review the bank transfer
                    before confirming your payment.
                  </p>
                  {pendingPayment.paymentReference && (
                    <p className="mt-3 break-all text-sm text-amber-900">
                      <strong>Bank Transaction Reference:</strong>{" "}
                      {pendingPayment.paymentReference}
                    </p>
                  )}
                </div>
              ) : (
                <>
                  {rejectedPayment &&
                    invoice.paymentStatus !== "PAID" && (
                      <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-5">
                        <p className="font-semibold text-red-800">
                          Previous Payment Receipt Rejected
                        </p>
                        <p className="mt-2 text-sm text-red-700">
                          <strong>Reason:</strong>{" "}
                          {rejectedPayment.rejectionReason ||
                            "No reason provided."}
                        </p>
                        <p className="mt-2 text-sm text-red-700">
                          You may submit another receipt
                          if your rental remains eligible.
                        </p>
                      </div>
                    )}

                  {canSubmitReceipt && (
                    <div className="mt-6 grid items-start gap-6 lg:grid-cols-2">
                      <div className="min-w-0">
                        <BankTransferDetails
                          invoiceNumber={
                            invoice.invoiceNumber
                          }
                        />
                      </div>

                      <div className="min-w-0 rounded-xl border border-gray-200 bg-gray-50 p-5">
                        <div className="mb-2">
                          <p className="text-xs font-semibold uppercase tracking-wide text-orange-600">
                            Payment Confirmation
                          </p>
                          <h3 className="mt-1 text-lg font-bold text-gray-950">
                            Upload Your Receipt
                          </h3>
                          <p className="mt-1 text-sm text-gray-500">
                            After transferring the money,
                            submit the bank transaction
                            reference and receipt.
                          </p>
                        </div>

                        <RentalPaymentReceiptForm
                          invoiceId={invoice._id}
                          onSubmitted={refreshPayments}
                        />
                      </div>
                    </div>
                  )}
                </>
              )}

              {invoice.paymentStatus === "PAID" && (
                <div className="mt-5 rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-800">
                  This rental invoice has been fully paid.
                </div>
              )}

              {rental.status !== "CONFIRMED" &&
                invoice.paymentStatus !== "PAID" && (
                  <p className="mt-5 rounded-xl bg-gray-50 p-4 text-sm text-gray-600">
                    Receipt submission is available only
                    for confirmed rentals.
                  </p>
                )}
            </>
          ) : (
            <p className="mt-5 rounded-xl bg-gray-50 p-5 text-sm text-gray-500">
              No invoice has been generated for this rental yet.
            </p>
          )}
        </section>

        {/* DEPOSIT AND REFUND */}
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
          <div>
            <h2 className="text-lg font-bold text-gray-950">
              Deposit & Refund
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Security deposit, deductions, and refund progress
            </p>
          </div>

          {invoice ? (
            <>
              <div className="mt-6 grid gap-4 rounded-xl bg-gray-50 p-5 sm:grid-cols-2">
                <DetailItem
                  label="Required Security Deposit"
                  value={formatMoney(
                    invoice.securityDeposit
                  )}
                />
                <DetailItem
                  label="Deposit Status"
                  value={
                    <StatusBadge
                      status={
                        deposit?.status || "NOT_RECORDED"
                      }
                    />
                  }
                />
              </div>

              {deposit &&
                [
                  "REFUND_PENDING",
                  "REFUNDED",
                  "PARTIALLY_REFUNDED",
                  "DEDUCTED",
                ].includes(deposit.status) && (
                  <div className="mt-5 rounded-xl border border-gray-200 p-5">
                    <h3 className="font-semibold text-gray-950">
                      Deposit Settlement Summary
                    </h3>

                    <div className="mt-4 grid gap-5 sm:grid-cols-2">
                      {details.deductionBreakdown ? (
                        <>
                          <DetailItem
                            label="Damage Deductions"
                            value={formatMoney(
                              details.deductionBreakdown
                                .damageRecovered
                            )}
                          />
                          <DetailItem
                            label="Overdue Penalty Recovered"
                            value={formatMoney(
                              details.deductionBreakdown
                                .overduePenaltyRecovered
                            )}
                          />
                          <DetailItem
                            label="Total Deposit Deductions"
                            value={formatMoney(
                              details.deductionBreakdown
                                .totalDeductedFromDeposit
                            )}
                          />
                        </>
                      ) : (
                        <DetailItem
                          label="Total Deposit Deductions"
                          value={formatMoney(
                            deposit.deductedAmount ?? 0
                          )}
                        />
                      )}

                      <DetailItem
                        label="Refundable Balance"
                        value={formatMoney(
                          Math.max(
                            0,
                            Number(deposit.amount ?? 0) -
                              Number(
                                deposit.deductedAmount ?? 0
                              )
                          )
                        )}
                      />
                    </div>

                    <p className="mt-4 text-xs text-gray-500">
                      The refundable balance is not confirmation
                      that the refund has been paid.
                    </p>
                  </div>
                )}

              {deposit?.status === "REFUND_PENDING" && (
                <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                  Your deposit refund is pending.
                  The payout has not yet been confirmed.
                </div>
              )}

              {latestRefund ? (
                <div className="mt-5 rounded-xl border border-gray-200 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="font-semibold text-gray-950">
                      Refund Information
                    </h3>
                    <StatusBadge
                      status={latestRefund.status}
                    />
                  </div>

                  <div className="mt-5 grid gap-5 sm:grid-cols-3">
                    <DetailItem
                      label="Refund Amount"
                      value={formatMoney(
                        latestRefund.amount
                      )}
                    />
                    <DetailItem
                      label="Refund Method"
                      value={
                        latestRefund.refundMethod?.replaceAll(
                          "_",
                          " "
                        ) || "Not available"
                      }
                    />
                    <DetailItem
                      label="Refund Status"
                      value={
                        latestRefund.status === "COMPLETED"
                          ? "Completed"
                          : "Pending Payout"
                      }
                    />
                  </div>

                  {latestRefund.status === "PENDING" && (
                    <p className="mt-5 rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
                      Your refund is being processed.
                      The payout has not yet been confirmed.
                    </p>
                  )}

                  {latestRefund.status === "COMPLETED" && (
                    <div className="mt-5 rounded-lg bg-green-50 p-4 text-sm text-green-800">
                      <p className="font-semibold">
                        Your refund has been marked as completed.
                      </p>

                      {latestRefund.confirmedAt && (
                        <p className="mt-2">
                          <strong>Confirmed On:</strong>{" "}
                          {formatDate(
                            latestRefund.confirmedAt
                          )}
                        </p>
                      )}

                      {latestRefund.payoutReference && (
                        <p className="mt-2 break-all">
                          <strong>Payout Reference:</strong>{" "}
                          {latestRefund.payoutReference}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <p className="mt-5 text-sm text-gray-500">
                  No refund record has been created for this rental yet.
                </p>
              )}
            </>
          ) : (
            <p className="mt-5 text-sm text-gray-500">
              Deposit information will appear after
              an invoice is generated.
            </p>
          )}
        </section>
      </div>
    </main>
  );
};

export default CustomerRentalDetails;
