
import api from "./api";

// ==========================================
// RENTAL AGREEMENT API SERVICE
// CLERK / STAFF ADMIN
// ==========================================

const agreementUrl = (rentalId) =>
  `/rental-agreements/${encodeURIComponent(rentalId)}`;

// ==========================================
// SAVE HANDOVER INSPECTION
// ==========================================

export const saveHandoverInspection = async (
  rentalId,
  data
) => {
  const response = await api.patch(
    `${agreementUrl(rentalId)}/handover-inspection`,
    data
  );

  return response.data;
};

// ==========================================
// GENERATE RENTAL AGREEMENT PDF
// ==========================================

export const generateRentalAgreement = async (
  rentalId
) => {
  const response = await api.post(
    `${agreementUrl(rentalId)}/generate`
  );

  return response.data;
};

// ==========================================
// UPLOAD SIGNED HANDOVER DOCUMENT
// ==========================================

export const uploadSignedHandover = async (
  rentalId,
  file
) => {
  const formData = new FormData();
  formData.append("signedDocument", file);

  const response = await api.post(
    `${agreementUrl(rentalId)}/handover-document`,
    formData
  );

  return response.data;
};

// ==========================================
// VERIFY SIGNED HANDOVER DOCUMENT
// ==========================================

export const verifySignedHandover = async (
  rentalId,
  confirmReviewed
) => {
  const response = await api.patch(
    `/rental-agreements/${encodeURIComponent(rentalId)}/verify-handover`,
    { confirmReviewed }
  );

  return response.data;
};

// ==========================================
// UPLOAD SIGNED RETURN ACKNOWLEDGEMENT
// ==========================================

export const uploadSignedReturn = async (
  rentalId,
  file
) => {
  const formData = new FormData();
  formData.append("signedDocument", file);

  const response = await api.post(
    `${agreementUrl(rentalId)}/return-document`,
    formData
  );

  return response.data;
};

// ==========================================
// VERIFY SIGNED RETURN ACKNOWLEDGEMENT
// ==========================================

export const verifySignedReturn = async (
  rentalId,
  confirmReviewed = true
) => {
  const response = await api.patch(
    `${agreementUrl(rentalId)}/verify-return`,
    { confirmReviewed }
  );

  return response.data;
};

// ==========================================
// GET RENTAL AGREEMENT DETAILS
// ==========================================

export const getRentalAgreement = async (rentalId) => {
  const response = await api.get(
    `/rental-agreements/${encodeURIComponent(rentalId)}`
  );

  return response.data;
};

// ==========================================
// GENERATE RETURN ACKNOWLEDGEMENT PDF
// CLERK / STAFF ADMIN
// ==========================================

export const generateReturnAcknowledgement = async (
  rentalId
) => {
  const response = await api.post(
    `${agreementUrl(rentalId)}/return-acknowledgement/generate`
  );

  return response.data;
};

// ==========================================
// DOWNLOAD GENERATED RETURN ACKNOWLEDGEMENT
// CLERK / STAFF ADMIN
// ==========================================

export const downloadReturnAcknowledgement = async (
  rentalId
) => {
  const response = await api.get(
    `${agreementUrl(rentalId)}/return-acknowledgement/download`,
    {
      responseType: "blob",
    }
  );

  const pdfBlob = new Blob([response.data], {
    type: "application/pdf",
  });

  const downloadUrl = window.URL.createObjectURL(pdfBlob);

  const link = document.createElement("a");
  link.href = downloadUrl;
  link.download = `SCR-Return-Acknowledgement-${rentalId}.pdf`;

  document.body.appendChild(link);
  link.click();
  link.remove();

  window.setTimeout(() => {
    window.URL.revokeObjectURL(downloadUrl);
  }, 1000);

  return true;
};

 // ============================================================
 // SHARED SECURE DOCUMENT DOWNLOAD HELPER
 // ============================================================

const downloadAgreementDocument = async (
  rentalId,
  endpoint,
  filename
) => {
  const response = await api.get(
    `${agreementUrl(rentalId)}${endpoint}`,
    {
      responseType: "blob",
    }
  );

  // Check for unexpected JSON error responses.
  const contentType = response.headers["content-type"] || "";

  if (contentType.includes("application/json")) {
    throw new Error("Unable to download the requested document.");
  }

  const blob = new Blob([response.data], {
    type: contentType || "application/octet-stream",
  });

  const downloadUrl = window.URL.createObjectURL(blob);

  try {
    const link = document.createElement("a");

    link.href = downloadUrl;
    link.download = filename;

    document.body.appendChild(link);
    link.click();
    link.remove();
  } finally {
    window.setTimeout(() => {
      window.URL.revokeObjectURL(downloadUrl);
    }, 1000);
  }

  return true;
};

// ============================================================
// DOWNLOAD GENERATED HANDOVER AGREEMENT
// ============================================================

export const downloadGeneratedHandover = async (rentalId) => {
  return downloadAgreementDocument(
    rentalId,
    "/handover/download",
    `SCR-Handover-Agreement-${rentalId}.pdf`
  );
};

// ============================================================
// DOWNLOAD SIGNED HANDOVER AGREEMENT
// ============================================================

export const downloadSignedHandover = async (
  rentalId,
  mimeType = "application/pdf"
) => {
  const extension =
    mimeType === "image/png"
      ? "png"
      : mimeType === "image/jpeg"
        ? "jpg"
        : "pdf";

  return downloadAgreementDocument(
    rentalId,
    "/handover-document/download",
    `SCR-Signed-Handover-${rentalId}.${extension}`
  );
};

// ============================================================
// DOWNLOAD SIGNED RETURN ACKNOWLEDGEMENT
// ============================================================

export const downloadSignedReturn = async (
  rentalId,
  mimeType = "application/pdf"
) => {
  const extension =
    mimeType === "image/png"
      ? "png"
      : mimeType === "image/jpeg"
        ? "jpg"
        : "pdf";

  return downloadAgreementDocument(
    rentalId,
    "/return-document/download",
    `SCR-Signed-Return-${rentalId}.${extension}`
  );
};

