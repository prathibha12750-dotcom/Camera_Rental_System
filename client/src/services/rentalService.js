import api from "./api";

export const checkAvailability = async (data) => {
  const response = await api.post(
    "/rentals/check-availability",
    data
  );

  return response.data;
};

export const createRentalRequest = async (data) => {
  const response = await api.post("/rentals", data);

  return response.data;
};

export const cancelRental = async (rentalId) => {
  const response = await api.patch(
    `/rentals/${rentalId}/cancel`
  );

  return response.data;
};

export const getAllRentals = async () => {
  const response = await api.get("/rentals");
  return response.data;
};

export const approveRental = async (rentalId) => {
  const response = await api.patch(
    `/rentals/${rentalId}/approve`
  );

  return response.data;
};

export const rejectRental = async (rentalId) => {
  const response = await api.patch(
    `/rentals/${rentalId}/reject`
  );

  return response.data;
};

export const issueRental = async (rentalId) => {
  const response = await api.patch(
    `/rentals/${rentalId}/issue`
  );

  return response.data;
};

export const returnRental = async (rentalId, data) => {
  const response = await api.patch(
    `/rentals/${rentalId}/return`,
    data
  );

  return response.data;
};

export const completeRental = async (rentalId) => {
  const response = await api.patch(
    `/rentals/${rentalId}/complete`
  );

  return response.data;
};

export const getOverdueRentals = async () => {
  const response = await api.get("/rentals/overdue");
  return response.data;
};

export const getAllDamageRecords = async () => {
  const response = await api.get("/rentals/damage-records");
  return response.data;
};

// ==========================================
// UPDATE DAMAGE STATUS AND REPAIR COST
// CLERK / STAFF ADMIN
// ==========================================

export const updateDamageRecordStatus = async (
  damageRecordId,
  status,
  repairCost
) => {
  const payload = { status };

  // Include repair cost only when explicitly provided.
  if (repairCost !== undefined) {
    payload.repairCost = repairCost;
  }

  const response = await api.patch(
    `/rentals/damage-records/${damageRecordId}/status`,
    payload
  );

  return response.data;
};

 // ==========================================
 // GET EQUIPMENT RENTAL CALENDAR
 // ==========================================

 export const getRentalCalendar = async (equipmentId) => {
   const response = await api.get(
     `/rentals/calendar/${equipmentId}`
   );

   return response.data;
 };

 
 // ==========================================
 // SECURITY DEPOSIT SETTLEMENT
 // ==========================================

export const previewRentalDepositSettlement = async (
  rentalId
) => {
  const response = await api.patch(
    `/rentals/${rentalId}/deposit-settlement`
  );
  return response.data;
};

// ==========================================
// REVIEW DAMAGE DEDUCTION
// ==========================================

export const reviewDamageDeduction = async (
  damageId,
  data
) => {
  const response = await api.patch(
    `/rentals/damage-records/${damageId}/deduction-review`,
    data
  );
  return response.data;
};

// ==========================================
// VALIDATE REFUND PREPARATION
// ==========================================

export const prepareRentalDepositRefund = async (
  rentalId,
  refundMethod
) => {
  const response = await api.post(
    `/rentals/${rentalId}/deposit-refund/prepare`,
    { refundMethod }
  );
  return response.data;
};

// ==========================================
// CREATE PENDING REFUND
// ==========================================

export const createPendingRentalRefund = async (
  rentalId,
  refundMethod
) => {
  const response = await api.post(
    `/rentals/${rentalId}/deposit-refund/pending`,
    { refundMethod }
  );
  return response.data;
};

// ==========================================
// CONFIRM ACTUAL REFUND PAYOUT
// ==========================================

export const confirmRentalRefundPayout = async (
  rentalId,
  refundId,
  data
) => {
  const response = await api.patch(
    `/rentals/${rentalId}/deposit-refund/${refundId}/confirm`,
    data
  );
  return response.data;
};

// ==========================================
// SETTLE FULL DEPOSIT DEDUCTION
// ==========================================

export const settleFullRentalDepositDeduction = async (
  rentalId
) => {
  const response = await api.post(
    `/rentals/${rentalId}/deposit-deduction/full`
  );
  return response.data;
};


/**
 * Get invoices for Clerk/Admin rental management.
 */
export const getAllInvoices = async () => {
  const response = await api.get("/admin/invoices");
  return response.data;
};

/**
 * Get refund records associated with an invoice.
 */
export const getRefundsByInvoice = async (invoiceId) => {
  const response = await api.get(
    `/admin/refunds/invoice/${invoiceId}`
  );

  return response.data;
};

