import api from "./api";


// ==========================================
// GET MY SUBSCRIPTION
// ==========================================

export const getMySubscription =
  async () => {
    const response = await api.get(
      "/photographer/subscription"
    );

    return response.data;
  };


// ==========================================
// PAY / RENEW SUBSCRIPTION
// ==========================================

export const payPhotographerSubscription =
  async ({
    paymentMethod,
    reference,
    receipt,
  }) => {
    const formData = new FormData();

    formData.append(
      "paymentMethod",
      paymentMethod
    );

    if (reference?.trim()) {
      formData.append(
        "reference",
        reference.trim()
      );
    }

    formData.append(
      "receipt",
      receipt
    );

    const response = await api.post(
      "/photographer/subscription/payment",
      formData
    );

    return response.data;
  };


  export const getMySubscriptionPayments =
  async () => {
    const response = await api.get(
      "/photographer/subscription/payments"
    );

    return response.data;
  };