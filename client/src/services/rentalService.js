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

export const updateDamageRecordStatus = async (
  damageRecordId,
  status
) => {
  const response = await api.patch(
    `/rentals/damage-records/${damageRecordId}/status`,
    { status }
  );

  return response.data;
};