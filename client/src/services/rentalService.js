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