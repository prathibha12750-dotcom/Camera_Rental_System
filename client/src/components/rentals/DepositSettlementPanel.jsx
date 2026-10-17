
import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "../../context/useAuth";

import {
  previewRentalDepositSettlement,
  reviewDamageDeduction,
  prepareRentalDepositRefund,
  createPendingRentalRefund,
  confirmRentalRefundPayout,
  settleFullRentalDepositDeduction,
  getAllInvoices,
  getRefundsByInvoice,
} from "../../services/rentalService";

// ============================================================
// HELPERS
// ============================================================

const formatMoney = (value) =>
  `LKR ${Number(value || 0).toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const getError = (error) =>
  error?.response?.data?.message ||
  error?.message ||
  "Something went wrong. Please try again.";

const getId = (value) =>
  typeof value === "string" ? value : value?._id || value?.id || "";

const getList = (result, possibleKeys = []) => {
  const data = result?.data ?? result;

  if (Array.isArray(data)) return data;

  for (const key of possibleKeys) {
    if (Array.isArray(data?.[key])) {
      return data[key];
    }
  }

  return [];
};

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function DepositSettlementPanel({
  rentalId,
  damageRecords = [],
  onUpdated,
}) {
  const { user } = useAuth();
  const isAdmin = user?.role === "STAFF_ADMIN";

  const [preview, setPreview] = useState(null);
  const [previewRentalId, setPreviewRentalId] = useState(null);

  const [refundMethod, setRefundMethod] = useState("BANK_TRANSFER");
  const [refundId, setRefundId] = useState("");
  const [payoutReference, setPayoutReference] = useState("");

  const [existingRefund, setExistingRefund] = useState(null);
  const [refundLookupRentalId, setRefundLookupRentalId] = useState(null);

  const [refundLookupStatus, setRefundLookupStatus] =
    useState("NOT_CHECKED");

  const [deductionAmounts, setDeductionAmounts] = useState({});

  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refundLookupLoading, setRefundLookupLoading] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // These refs are updated only outside rendering.
  const previewRequestRef = useRef(0);
  const refundRequestRef = useRef(0);
  const busyRef = useRef(false);

  // ============================================================
  // LOAD SETTLEMENT PREVIEW
  // ============================================================

  const loadPreview = useCallback(async () => {
    const requestId = ++previewRequestRef.current;
    const requestedRentalId = rentalId;

    if (!requestedRentalId) {
      setPreview(null);
      setPreviewRentalId(null);
      setLoading(false);
      return false;
    }

    setLoading(true);

    try {
      const result = await previewRentalDepositSettlement(
        requestedRentalId
      );

      if (requestId !== previewRequestRef.current) {
        return false;
      }

      if (!result?.data) {
        setPreview(null);
        setPreviewRentalId(null);
        setError("Settlement preview data is unavailable.");
        return false;
      }

      setPreview(result.data);
      setPreviewRentalId(requestedRentalId);

      return true;
    } catch (err) {
      if (requestId !== previewRequestRef.current) {
        return false;
      }

      setPreview(null);
      setPreviewRentalId(null);
      setError(getError(err));

      return false;
    } finally {
      if (requestId === previewRequestRef.current) {
        setLoading(false);
      }
    }
  }, [rentalId]);

  // ============================================================
  // LOAD EXISTING REFUND
  // ============================================================

  const loadExistingRefund = useCallback(async () => {
    const requestId = ++refundRequestRef.current;
    const requestedRentalId = rentalId;

    if (!requestedRentalId) {
      setExistingRefund(null);
      setRefundId("");
      setRefundLookupRentalId(null);
      setRefundLookupStatus("NOT_CHECKED");
      setRefundLookupLoading(false);
      return false;
    }

    setRefundLookupLoading(true);
    setRefundLookupStatus("LOADING");

    const isCurrentRequest = () =>
      requestId === refundRequestRef.current;

    try {
      const invoiceResult = await getAllInvoices();

      if (!isCurrentRequest()) {
        return false;
      }

      const invoices = getList(invoiceResult, [
        "invoices",
        "data",
        "results",
      ]);

      const invoice = invoices.find((item) => {
        const linkedRentalId = getId(
          item.rental ?? item.rentalId ?? item.rental_id
        );

        return (
          String(linkedRentalId) === String(requestedRentalId)
        );
      });

      if (!invoice?._id && !invoice?.id) {
        setExistingRefund(null);
        setRefundId("");
        setRefundLookupRentalId(null);
        setRefundLookupStatus("ERROR");

        setError(
          "Could not locate the rental invoice. Refund creation is unavailable until the invoice can be verified."
        );

        return false;
      }

      const invoiceId = getId(invoice);

      const refundResult = await getRefundsByInvoice(invoiceId);

      if (!isCurrentRequest()) {
        return false;
      }

      const refunds = getList(refundResult, [
        "refunds",
        "results",
        "items",
      ]);

      const activeRefund = refunds.find((refund) =>
        ["PENDING", "COMPLETED"].includes(
          String(refund.status || "").toUpperCase()
        )
      );

      setExistingRefund(activeRefund || null);
      setRefundLookupRentalId(requestedRentalId);
      setRefundLookupStatus("SUCCESS");

      if (activeRefund) {
        setRefundId(String(getId(activeRefund)));
      } else {
        setRefundId("");
      }

      return true;
    } catch (err) {
      if (!isCurrentRequest()) {
        return false;
      }

      console.error("Failed to load existing refund:", err);

      setExistingRefund(null);
      setRefundId("");
      setRefundLookupRentalId(null);
      setRefundLookupStatus("ERROR");

      setError(
        "Unable to verify existing refunds: " +
          getError(err) +
          ". Refund creation is unavailable until the lookup succeeds."
      );

      return false;
    } finally {
      if (isCurrentRequest()) {
        setRefundLookupLoading(false);
      }
    }
  }, [rentalId]);

  // ============================================================
  // LOAD DATA WHEN RENTAL CHANGES
  // ============================================================

  useEffect(() => {
    const timer = window.setTimeout(() => {
      // Invalidate requests from previously selected rentals.
      previewRequestRef.current += 1;
      refundRequestRef.current += 1;

      setPreview(null);
      setPreviewRentalId(null);

      setExistingRefund(null);
      setRefundLookupRentalId(null);
      setRefundId("");
      setPayoutReference("");

      setRefundLookupStatus("NOT_CHECKED");
      setDeductionAmounts({});

      setError("");
      setMessage("");

      void loadPreview();
      void loadExistingRefund();
    }, 0);

    return () => {
      window.clearTimeout(timer);

      // Prevent old requests from updating this component.
      previewRequestRef.current += 1;
      refundRequestRef.current += 1;
    };
  }, [loadPreview, loadExistingRefund]);

  // ============================================================
  // REFRESH INFORMATION
  // ============================================================

  const handleRefresh = async () => {
    if (busyRef.current) return;

    setError("");
    setMessage("");

    const [previewSucceeded, refundSucceeded] =
      await Promise.all([
        loadPreview(),
        loadExistingRefund(),
      ]);

    if (!previewSucceeded || !refundSucceeded) {
      setError(
        "Some settlement information could not be refreshed. Please try again."
      );
    }
  };

  // ============================================================
  // PERFORM FINANCIAL ACTION
  // ============================================================

  const performAction = async (action, refresh = true) => {
    if (busyRef.current || !rentalId) {
      return null;
    }

    busyRef.current = true;

    setBusy(true);
    setError("");
    setMessage("");

    let result;

    try {
      result = await action();
    } catch (err) {
      setError(getError(err));
      busyRef.current = false;
      setBusy(false);
      return null;
    }

    // The backend action succeeded.
    setMessage(
      result?.message || "Action completed successfully."
    );

    try {
      let refreshFailed = false;

      if (refresh) {
        const [previewSucceeded, refundSucceeded] =
          await Promise.all([
            loadPreview(),
            loadExistingRefund(),
          ]);

        refreshFailed =
          !previewSucceeded || !refundSucceeded;
      }

      if (onUpdated) {
        await onUpdated();
      }

      if (refreshFailed) {
        setMessage(
          "Action completed successfully, but some settlement information could not be refreshed. Please click Refresh before continuing."
        );
      }
    } catch (err) {
      console.error(
        "Action succeeded, but refreshing the UI failed:",
        err
      );

      setMessage(
        "Action completed, but some information could not be refreshed. Please click Refresh before continuing."
      );
    } finally {
      busyRef.current = false;
      setBusy(false);
    }

    return result;
  };

  // ============================================================
  // SAFETY CHECKS
  // ============================================================

  const previewIsCurrent =
    previewRentalId === rentalId &&
    preview !== null;

  const refundLookupIsCurrent =
    refundLookupRentalId === rentalId &&
    refundLookupStatus === "SUCCESS";

  const refundActionsAllowed =
    !busy &&
    !loading &&
    !refundLookupLoading &&
    previewIsCurrent &&
    refundLookupIsCurrent &&
    !existingRefund;

  // ============================================================
  // DAMAGE DEDUCTION REVIEW
  // ============================================================

  const handleDeductionReview = async (damage, decision) => {
    if (!previewIsCurrent || busyRef.current) {
      setError(
        "Settlement information is not ready. Refresh before continuing."
      );
      return;
    }

    const damageId = getId(damage);

    if (!damageId) {
      setError("Could not find the damage record ID.");
      return;
    }

    if (!["APPROVED", "REJECTED"].includes(decision)) {
      setError("Invalid deduction review decision.");
      return;
    }

    const repairCost = Number(damage.repairCost);

    if (
      decision === "APPROVED" &&
      (!Number.isFinite(repairCost) || repairCost <= 0)
    ) {
      setError(
        "A valid repair cost is required before approving a deduction."
      );
      return;
    }

    const amount =
      decision === "APPROVED"
        ? Number(deductionAmounts[damageId] ?? repairCost)
        : 0;

    if (
      !Number.isFinite(amount) ||
      amount < 0 ||
      amount > repairCost
    ) {
      setError(
        "Enter a valid deduction amount within the repair cost."
      );
      return;
    }

    await performAction(() =>
      reviewDamageDeduction(damageId, {
        decision,
        approvedDeductionAmount: amount,
      })
    );
  };

  // ============================================================
  // VALIDATE REFUND
  // ============================================================

  const handlePrepareRefund = async () => {
    if (!refundActionsAllowed) {
      setError(
        "Refund information could not be verified or a refund already exists. Refresh before continuing."
      );
      return;
    }

    const result = await performAction(
      () => prepareRentalDepositRefund(rentalId, refundMethod),
      false
    );

    if (result?.data) {
      setMessage(
        `Refund validated: ${formatMoney(
          result.data.proposedRefund
        )}. No payment has been created by this validation.`
      );
    }
  };

  // ============================================================
  // CREATE PENDING REFUND
  // ============================================================

  const handleCreateRefund = async () => {
    if (!refundActionsAllowed) {
      setError(
        "Cannot create a refund until the current rental's information is verified and no existing refund is found."
      );
      return;
    }

    if (Number(preview?.refundableAmount || 0) <= 0) {
      setError("There is no refundable balance.");
      return;
    }

    if (
      !window.confirm(
        "Create a pending security deposit refund? This does not mean the customer has been paid."
      )
    ) {
      return;
    }

    // Disable further creation attempts immediately.
    setRefundLookupStatus("LOADING");

    const result = await performAction(() =>
      createPendingRentalRefund(rentalId, refundMethod)
    );

    if (!result) {
      // Recheck the backend even if the request failed.
      // The request may have committed before a network error.
      await loadExistingRefund();
      return;
    }

    const newRefundId =
      result?.data?.refundId ||
      result?.data?.refund?._id ||
      result?.data?.refund?.id;

    if (newRefundId) {
      setRefundId(String(newRefundId));
    }
  };

  // ============================================================
  // CONFIRM ACTUAL REFUND PAYOUT
  // ============================================================

  const handleConfirmPayout = async () => {
    if (
      busyRef.current ||
      !previewIsCurrent ||
      !refundLookupIsCurrent
    ) {
      setError(
        "Refresh and verify the current rental before confirming a payout."
      );
      return;
    }

    const selectedRefundId = refundId.trim();
    const reference = payoutReference.trim();
  
    // Verify deposit is awaiting refund payout.
    if (preview?.depositStatus !== "REFUND_PENDING") {
      setError(
        "Payout cannot be confirmed because the security deposit is not in REFUND_PENDING status. Refresh the settlement information."
      );
      return;
    }

    if (!selectedRefundId || !reference) {
      setError(
        "Refund ID and payout reference are required."
      );
      return;
    }

    if (
      !existingRefund ||
      String(existingRefund.status || "").toUpperCase() !==
        "PENDING"
    ) {
      setError(
        "Payout confirmation requires an existing pending refund."
      );
      return;
    }

    if (String(getId(existingRefund)) !== selectedRefundId) {
      setError(
        "The entered refund ID does not match the pending refund found for this rental."
      );
      return;
    }

    if (
      !window.confirm(
        "Confirm that the customer has actually received this refund? Do not continue if payment has not been made."
      )
    ) {
      return;
    }

    const result = await performAction(() =>
      confirmRentalRefundPayout(
        rentalId,
        selectedRefundId,
        { payoutReference: reference }
      )
    );

    if (result) {
      setPayoutReference("");
    }
  };

  // ============================================================
  // FULL DEPOSIT DEDUCTION
  // ============================================================

  const handleFullDeduction = async () => {
    if (
      busyRef.current ||
      !previewIsCurrent ||
      !refundLookupIsCurrent ||
      existingRefund
    ) {
      setError(
        "The current rental's settlement information must be verified and must not have an existing refund."
      );
      return;
    }

    if (
      !window.confirm(
        "Confirm settlement of the entire security deposit as approved deductions? Continue only after verifying the approved deductions."
      )
    ) {
      return;
    }

    await performAction(() =>
      settleFullRentalDepositDeduction(rentalId)
    );
  };

  // ============================================================
  // RENDER
  // ============================================================

  if (!rentalId) {
    return (
      <p className="text-sm text-gray-500">
        Select a rental.
      </p>
    );
  }

  const pendingDamages = damageRecords.filter(
    (damage) =>
      (damage.deductionApprovalStatus || "PENDING") ===
      "PENDING"
  );

  const refundAmount = Number(
    previewIsCurrent ? preview?.refundableAmount || 0 : 0
  );

  const fullDeduction =
    previewIsCurrent &&
    Number(preview.depositAmount) > 0 &&
    refundAmount === 0;

  const buttonClass =
    "rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50";

  const refundStatus = String(
    existingRefund?.status || ""
  ).toUpperCase();

  return (
    <section className="space-y-5 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      {/* HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900">
            Security Deposit Settlement
          </h2>

          <p className="text-sm text-gray-500">
            Review deductions and settle the rental deposit.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={busy || loading || refundLookupLoading}
          className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
        >
          {loading || refundLookupLoading
            ? "Checking..."
            : "Refresh"}
        </button>
      </div>

      {/* ERROR MESSAGE */}
      {error && (
        <div
          role="alert"
          className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {/* SUCCESS MESSAGE */}
      {message && (
        <div
          role="status"
          className="rounded-lg bg-green-50 p-3 text-sm text-green-700"
        >
          {message}
        </div>
      )}

      {/* DEPOSIT SUMMARY */}
      {previewIsCurrent && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Deposit Amount", preview.depositAmount],
            ["Repair Cost", preview.totalRepairCost],
            [
              "Approved Deductions",
              preview.totalApprovedDeduction,
            ],
            ["Refundable Balance", preview.refundableAmount],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-lg border border-gray-200 bg-gray-50 p-3"
            >
              <p className="text-xs font-medium text-gray-500">
                {label}
              </p>

              <p className="mt-1 text-lg font-bold text-gray-900">
                {formatMoney(value)}
              </p>
            </div>
          ))}
        </div>
      )}

      {!previewIsCurrent && !loading && error && (
        <p className="text-sm text-gray-500">
          The settlement preview is unavailable. You can still
          check whether a pending refund already exists below.
        </p>
      )}

      <p className="text-xs text-amber-700">
        A preview does not confirm that the deposit has been
        settled.
      </p>

      {/* DAMAGE DEDUCTION REVIEW */}
      {isAdmin && (
        <div className="space-y-3 border-t pt-4">
          <h3 className="font-semibold text-gray-900">
            Damage Deduction Review
          </h3>

          {pendingDamages.length === 0 ? (
            <p className="text-sm text-gray-500">
              No pending damage deductions in the supplied
              records.
            </p>
          ) : (
            <div className="space-y-3">
              {pendingDamages.map((damage) => {
                const id = getId(damage);

                return (
                  <div
                    key={id}
                    className="rounded-lg border p-3"
                  >
                    <p className="font-medium text-gray-800">
                      {damage.description || "Damage record"}
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      Repair cost:{" "}
                      {formatMoney(damage.repairCost)}
                    </p>

                    <p className="mt-1 text-xs font-medium text-gray-600">
                      Damage status: {damage.status}
                    </p>

                    {damage.status !== "RESOLVED" && (
                      <p className="mt-1 text-xs text-amber-700">
                        Resolve this damage assessment before
                        reviewing its deduction.
                      </p>
                    )}

                    <div className="mt-3 flex flex-wrap items-end gap-2">
                      <label className="text-sm text-gray-700">
                        Approved amount

                        <input
                          type="number"
                          min="0"
                          max={Number(
                            damage.repairCost || 0
                          )}
                          step="0.01"
                          value={
                            deductionAmounts[id] ??
                            damage.repairCost ??
                            0
                          }
                          onChange={(event) =>
                            setDeductionAmounts((previous) => ({
                              ...previous,
                              [id]: event.target.value,
                            }))
                          }
                          className="mt-1 block w-40 rounded-lg border p-2"
                        />
                      </label>

                      <button
                        type="button"
                        disabled={
                          busy ||
                          !previewIsCurrent ||
                          damage.status !== "RESOLVED" ||
                          !id
                        }
                        onClick={() =>
                          handleDeductionReview(
                            damage,
                            "APPROVED"
                          )
                        }
                        className={buttonClass}
                      >
                        Approve
                      </button>

                      <button
                        type="button"
                        disabled={
                          busy ||
                          !previewIsCurrent ||
                          damage.status !== "RESOLVED" ||
                          !id
                        }
                        onClick={() =>
                          handleDeductionReview(
                            damage,
                            "REJECTED"
                          )
                        }
                        className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* REFUND PROCESSING */}
      <div className="space-y-3 border-t pt-4">
        <h3 className="font-semibold text-gray-900">
          Refund Processing
        </h3>

        {refundLookupStatus === "LOADING" ||
        refundLookupStatus === "NOT_CHECKED" ||
        !refundLookupIsCurrent ? (
          refundLookupStatus === "ERROR" ? (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 p-4"
            >
              <p className="text-sm font-semibold text-red-800">
                Unable to verify existing refunds
              </p>

              <p className="mt-1 text-sm text-red-700">
                Refund creation is disabled for safety.
                Click Refresh to try again.
              </p>
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              Checking for an existing refund...
            </p>
          )
        ) : existingRefund ? (
          <div className="space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <p className="font-semibold text-amber-900">
              Existing refund found
            </p>

            <p className="break-all text-sm text-gray-700">
              Refund ID: {getId(existingRefund)}
            </p>

            <p className="text-sm text-gray-700">
              Amount:{" "}
              {formatMoney(
                existingRefund.amount ??
                  existingRefund.refundAmount ??
                  existingRefund.totalAmount ??
                  0
              )}
            </p>

            <p className="text-sm text-gray-700">
              Method:{" "}
              {existingRefund.refundMethod ||
                existingRefund.method ||
                "Not provided"}
            </p>

            <p className="text-sm text-gray-700">
              Status: {refundStatus || "Unknown"}
            </p>

            {refundStatus === "PENDING" && (
              <p className="text-sm font-medium text-amber-800">
                This refund has not been confirmed as paid.
                Do not create another refund or confirm a
                payout until payment has actually occurred.
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-500">
            No active refund was found. The backend will
            perform final validation before creating one.
          </p>
        )}

        <label className="block text-sm font-medium text-gray-700">
          Refund Method

          <select
            value={refundMethod}
            onChange={(event) =>
              setRefundMethod(event.target.value)
            }
            className="mt-1 block w-full max-w-sm rounded-lg border p-2"
          >
            <option value="BANK_TRANSFER">
              Bank Transfer
            </option>
            <option value="CASH">Cash</option>
            <option value="CARD">Card</option>
          </select>
        </label>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={!refundActionsAllowed}
            onClick={handlePrepareRefund}
            className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
          >
            Validate Refund
          </button>

          <button
            type="button"
            disabled={
              !refundActionsAllowed ||
              refundAmount <= 0
            }
            onClick={handleCreateRefund}
            className={buttonClass}
          >
            {existingRefund
              ? "Refund Already Exists"
              : "Create Pending Refund"}
          </button>
        </div>
      </div>

      {/* CONFIRM REFUND PAYOUT */}
      <div className="space-y-3 border-t pt-4">
        <h3 className="font-semibold text-gray-900">
          Confirm Refund Payout
        </h3>

        <p className="text-sm text-gray-500">
          Only confirm after the customer has actually received
          the refund. Creating a pending refund is not proof
          of payment.
        </p>

        <label className="block text-sm font-medium text-gray-700">
          Pending Refund ID

          <input
            type="text"
            value={refundId}
            onChange={(event) =>
              setRefundId(event.target.value)
            }
            placeholder="Pending refund ID"
            className="mt-1 block w-full rounded-lg border p-2 text-sm"
          />
        </label>

        <label className="block text-sm font-medium text-gray-700">
          Bank transaction or payout reference

          <input
            type="text"
            maxLength={150}
            value={payoutReference}
            onChange={(event) =>
              setPayoutReference(event.target.value)
            }
            placeholder="Enter the actual payout reference"
            className="mt-1 block w-full rounded-lg border p-2 text-sm"
          />
        </label>

        <button
        type="button"
        disabled={
        busy ||
        loading ||
        refundLookupLoading ||
        !previewIsCurrent ||
        !refundLookupIsCurrent ||
        preview?.depositStatus !== "REFUND_PENDING" ||
        !refundId.trim() ||
        !payoutReference.trim() ||
        !existingRefund ||
        refundStatus !== "PENDING" ||
        String(getId(existingRefund)) !== refundId.trim()
        }
          onClick={handleConfirmPayout}
          className={buttonClass}
        >
          Confirm Actual Payout
        </button>
      </div>

      {/* FULL DEPOSIT DEDUCTION */}
      {fullDeduction && (
        <div className="space-y-3 border-t pt-4">
          <h3 className="font-semibold text-gray-900">
            Full Deposit Deduction
          </h3>

          <p className="text-sm text-gray-600">
            The preview indicates that approved deductions
            consume the full security deposit. Verify the
            approved deductions before settling the deposit.
          </p>

          <button
            type="button"
            disabled={
              busy ||
              !refundLookupIsCurrent ||
              Boolean(existingRefund)
            }
            onClick={handleFullDeduction}
            className={buttonClass}
          >
            Confirm Full Deduction Settlement
          </button>
        </div>
      )}
    </section>
  );
}