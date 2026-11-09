import {
  ClipboardCheck,
  PackageCheck,
  FileText,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "../../context/useAuth";
import { 
    getRentalAgreement, 
    saveHandoverInspection, 
    generateRentalAgreement, 
    uploadSignedHandover, 
    verifySignedHandover,
    uploadSignedReturn,
    verifySignedReturn,
    downloadReturnAcknowledgement,
    downloadGeneratedHandover,
    downloadSignedHandover,
    downloadSignedReturn,
} from "../../services/rentalAgreementService";

const TABS = [
  {
    id: "handover",
    label: "Handover",
    icon: ClipboardCheck,
  },
  {
    id: "return",
    label: "Return",
    icon: PackageCheck,
  },
  {
    id: "documents",
    label: "Documents",
    icon: FileText,
  },
];

const AgreementDownloadButton = ({
  available,
  loading,
  disabled,
  onClick,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!available || loading || disabled}
      className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
        available && !loading && !disabled
          ? "bg-blue-600 text-white hover:bg-blue-700"
          : "cursor-not-allowed bg-gray-100 text-gray-400"
      }`}
    >
      {loading ? "Downloading..." : "Download"}
    </button>
  );
};

export default function RentalAgreementModal({
  rental,
  onClose,
}) {
  const [activeTab, setActiveTab] = useState("handover");

const { user } = useAuth();
const canManageInspection = ["CLERK", "STAFF_ADMIN"].includes(
  user?.role
);

const [inspection, setInspection] = useState({
  condition: "GOOD",
  accessories: [],
  damageDescription: "",
  notes: "",
  specialNotes: "",
});

const [savingInspection, setSavingInspection] = useState(false);
const [inspectionError, setInspectionError] = useState("");
const [inspectionSuccess, setInspectionSuccess] = useState("");

const [generatingAgreement, setGeneratingAgreement] = useState(false);
const [inspectionSaved, setInspectionSaved] = useState(false);
const [agreementGenerated, setAgreementGenerated] = useState(false);
const [agreementNumber, setAgreementNumber] = useState("");
const [signedHandoverFile, setSignedHandoverFile] = useState(null);
const [uploadingHandover, setUploadingHandover] = useState(false);
const [handoverUploaded, setHandoverUploaded] = useState(false);
const [handoverUploadError, setHandoverUploadError] = useState("");
const [handoverUploadSuccess, setHandoverUploadSuccess] = useState("");
const [handoverReviewed, setHandoverReviewed] = useState(false);
const [verifyingHandover, setVerifyingHandover] = useState(false);
const [handoverVerified, setHandoverVerified] = useState(false);
const [verificationError, setVerificationError] = useState("");
const [verificationSuccess, setVerificationSuccess] = useState("");
const [savedAgreement, setSavedAgreement] = useState(null);
const [loadingAgreement, setLoadingAgreement] = useState(true);
const [agreementLoadError, setAgreementLoadError] = useState("");

const [downloadingDocument, setDownloadingDocument] = useState(null);
const [documentDownloadError, setDocumentDownloadError] = useState("");

// ==========================================
// RETURN ACKNOWLEDGEMENT STATUS
// ==========================================

const [returnPdfGenerated, setReturnPdfGenerated] = useState(false);
const [signedReturnUploaded, setSignedReturnUploaded] = useState(false);
const [returnVerified, setReturnVerified] = useState(false);

// ==========================================
// SIGNED RETURN DOCUMENT UPLOAD
// ==========================================

const [signedReturnFile, setSignedReturnFile] = useState(null);
const [uploadingSignedReturn, setUploadingSignedReturn] = useState(false);
const [returnUploadError, setReturnUploadError] = useState("");
const [returnUploadSuccess, setReturnUploadSuccess] = useState("");

// ==========================================
// SIGNED RETURN VERIFICATION
// ==========================================

const [returnReviewed, setReturnReviewed] = useState(false);
const [verifyingReturn, setVerifyingReturn] = useState(false);
const [returnVerificationError, setReturnVerificationError] = useState("");
const [returnVerificationSuccess, setReturnVerificationSuccess] = useState("");

useEffect(() => {
  if (!rental?._id) return;

  let cancelled = false;

  const loadAgreement = async () => {
    try {
      const result = await getRentalAgreement(rental._id);

      if (cancelled) return;

      const agreement = result.data.agreement;

      setSavedAgreement(agreement);

      setInspection({
        condition:
          agreement.handoverInspection?.condition || "GOOD",
        accessories:
        agreement.handoverInspection?.accessories?.map(
            (item) => ({
            name: item.name || "",
            quantity: item.quantity ?? 1,
            condition: item.condition || "",
            notes: item.notes || "",
            })
        ) || [],
        damageDescription:
          agreement.handoverInspection?.damageDescription || "",
        notes:
          agreement.handoverInspection?.notes || "",
        specialNotes: agreement.specialNotes || "",
      });

      setInspectionSaved(
        Boolean(agreement.handoverInspection?.inspectedAt)
      );

    setAgreementGenerated(
    Boolean(
        agreement.generatedPdf?.storageKey ||
        agreement.generatedPdf?.generatedAt ||
        agreement.generatedPdf?.uploadedAt ||
        agreement.generatedAt
    )
    );

      setAgreementNumber(
        agreement.agreementNumber || ""
      );

      setHandoverUploaded(
        Boolean(agreement.signedHandoverDocument)
      );

      setHandoverVerified(
        Boolean(agreement.handoverVerifiedAt)
      );
    // ==========================================
    // LOAD RETURN ACKNOWLEDGEMENT STATUS
    // ==========================================

    setReturnPdfGenerated(
    Boolean(agreement.generatedReturnPdf?.storageKey)
    );

    setSignedReturnUploaded(
    Boolean(
        agreement.signedReturnDocument?.uploadedAt ||
        agreement.signedReturnDocument?.originalName ||
        agreement.returnVerifiedAt
    )
    );

    setReturnVerified(
    Boolean(agreement.returnVerifiedAt)
    );
    } catch (error) {
      if (!cancelled) {
        setAgreementLoadError(
          error.response?.data?.message ||
            "Failed to load rental agreement."
        );
      }
    } finally {
      if (!cancelled) {
        setLoadingAgreement(false);
      }
    }
  };

  loadAgreement();

  return () => {
    cancelled = true;
  };
}, [rental?._id]);

const addAccessory = () => {
  setInspection((previous) => ({
    ...previous,
    accessories: [
      ...previous.accessories,
      {
        name: "",
        quantity: 1,
        condition: "",
        notes: "",
      },
    ],
  }));
};

const updateAccessory = (index, field, value) => {
  setInspection((previous) => ({
    ...previous,
    accessories: previous.accessories.map((accessory, i) =>
      i === index
        ? { ...accessory, [field]: value }
        : accessory
    ),
  }));
};

const removeAccessory = (index) => {
  setInspection((previous) => ({
    ...previous,
    accessories: previous.accessories.filter(
      (_, i) => i !== index
    ),
  }));
};

const handleSaveInspection = async (event) => {
  event.preventDefault();
  setInspectionSaved(false);

  if (!canManageInspection || rental.status !== "CONFIRMED") {
    return;
  }

  setInspectionError("");
  setInspectionSuccess("");

  if (
    inspection.condition === "DAMAGED" &&
    !inspection.damageDescription.trim()
  ) {
    setInspectionError(
      "Please describe the existing equipment damage."
    );
    return;
  }

    const accessories = inspection.accessories.map((item) => ({
    name: item.name.trim(),
    quantity: Number(item.quantity),
    condition: item.condition || null,
    notes: item.notes.trim(),
    }));

  if (
    accessories.some(
      (item) =>
        !item.name ||
        !Number.isSafeInteger(item.quantity) ||
        item.quantity < 1
    )
  ) {
    setInspectionError(
      "Each accessory must have a name and a valid quantity."
    );
    return;
  }

  try {
    setSavingInspection(true);

    const result = await saveHandoverInspection(rental._id, {
      condition: inspection.condition,
      accessories,
      damageDescription:
        inspection.condition === "DAMAGED"
          ? inspection.damageDescription.trim()
          : "",
      notes: inspection.notes.trim(),
      specialNotes: inspection.specialNotes.trim(),
    });

    setInspectionSaved(true);

    setInspectionSuccess(
    result?.message ||
        "Handover inspection saved successfully."
    );

  } catch (error) {
    setInspectionError(
      error.response?.data?.message ||
        "Failed to save handover inspection."
    );
  } finally {
    setSavingInspection(false);
  }
};

const handleGenerateAgreement = async () => {
  if (
    !canManageInspection ||
    rental.status !== "CONFIRMED" ||
    !inspectionSaved ||
    agreementGenerated ||
    generatingAgreement
  ) {
    return;
  }

  const confirmed = window.confirm(
    "Generate the rental agreement PDF?\n\n" +
      "Once generated, the handover inspection " +
      "can no longer be edited."
  );

  if (!confirmed) return;

  setInspectionError("");
  setInspectionSuccess("");

  try {
    setGeneratingAgreement(true);

    const result = await generateRentalAgreement(rental._id);

setAgreementGenerated(true);
setInspectionSaved(false);

setAgreementNumber(
  result?.data?.agreementNumber ||
    savedAgreement?.agreementNumber ||
    ""
);

setSavedAgreement((previous) => {
  if (!previous) return previous;

  return {
    ...previous,
    status: "GENERATED",
    agreementNumber:
      result?.data?.agreementNumber ||
      result?.data?.agreement?.agreementNumber ||
      previous.agreementNumber,
    generatedPdf:
      result?.data?.agreement?.generatedPdf ||
      previous.generatedPdf,
    generatedAt:
      result?.data?.agreement?.generatedAt ||
      new Date().toISOString(),
  };
});

    setInspectionSuccess(
      result?.message ||
        "Rental agreement PDF generated successfully."
    );
  } catch (error) {
    setInspectionError(
      error.response?.data?.message ||
        "Failed to generate rental agreement PDF."
    );
  } finally {
    setGeneratingAgreement(false);
  }
};

const handleUploadSignedHandover = async () => {
  setHandoverUploadError("");
  setHandoverUploadSuccess("");

  if (
    !canManageInspection ||
    rental.status !== "CONFIRMED" ||
    !agreementGenerated ||
    handoverUploaded ||
    uploadingHandover
  ) {
    return;
  }

  if (!signedHandoverFile) {
    setHandoverUploadError(
      "Please select a signed handover document."
    );
    return;
  }

  const allowedTypes = [
    "application/pdf",
    "image/jpeg",
    "image/png",
  ];

  if (!allowedTypes.includes(signedHandoverFile.type)) {
    setHandoverUploadError(
      "Only PDF, JPG, and PNG files are allowed."
    );
    return;
  }

  if (signedHandoverFile.size > 5 * 1024 * 1024) {
    setHandoverUploadError(
      "The document must not exceed 5 MB."
    );
    return;
  }

  try {
    setUploadingHandover(true);

    const result = await uploadSignedHandover(
      rental._id,
      signedHandoverFile
    );

    setHandoverUploaded(true);
    setSignedHandoverFile(null);

    setHandoverUploadSuccess(
      result?.message ||
        "Signed handover document uploaded successfully."
    );
  } catch (error) {
    setHandoverUploadError(
      error.response?.data?.message ||
        "Failed to upload the signed handover document."
    );
  } finally {
    setUploadingHandover(false);
  }
};

const handleVerifySignedHandover = async () => {
  setVerificationError("");
  setVerificationSuccess("");

  if (!canManageInspection || rental.status !== "CONFIRMED") {
    return;
  }

  if (!handoverUploaded) {
    setVerificationError(
      "Upload the signed handover document first."
    );
    return;
  }

  if (!handoverReviewed) {
    setVerificationError(
      "Please confirm that you have reviewed the signed document."
    );
    return;
  }

  if (handoverVerified || verifyingHandover) {
    return;
  }

  const confirmed = window.confirm(
    "Confirm that you have reviewed the signed handover " +
      "document and want to verify it?\n\n" +
      "This will mark the agreement as HANDOVER_SIGNED."
  );

  if (!confirmed) return;

  try {
    setVerifyingHandover(true);

    const result = await verifySignedHandover(
      rental._id,
      true
    );

    setHandoverVerified(true);

    setSavedAgreement((previous) =>
    previous
        ? {
            ...previous,
            status: "HANDOVER_SIGNED",
            handoverVerifiedAt:
            result?.data?.handoverVerifiedAt ||
            new Date().toISOString(),
        }
        : previous
    );

    setVerificationSuccess(
      result?.message ||
        "Signed handover document verified successfully."
    );
  } catch (error) {
    setVerificationError(
      error.response?.data?.message ||
        "Failed to verify the signed handover document."
    );
  } finally {
    setVerifyingHandover(false);
  }
};

const handleUploadSignedReturn = async () => {
  setReturnUploadError("");
  setReturnUploadSuccess("");

    if (
    !canManageInspection ||
    rental.status !== "RETURNED" ||
    savedAgreement?.status !== "HANDOVER_SIGNED" ||
    !agreementGenerated ||
    !handoverVerified ||
    !savedAgreement?.returnInspection?.inspectedAt ||
    signedReturnUploaded ||
    uploadingSignedReturn
    ) {
    return;
    }

  if (!signedReturnFile) {
    setReturnUploadError(
      "Please select a signed return acknowledgement document."
    );
    return;
  }

  const allowedTypes = [
    "application/pdf",
    "image/jpeg",
    "image/png",
  ];

  if (!allowedTypes.includes(signedReturnFile.type)) {
    setReturnUploadError(
      "Only PDF, JPG, and PNG files are allowed."
    );
    return;
  }

  if (signedReturnFile.size === 0) {
    setReturnUploadError("The selected file is empty.");
    return;
  }

  if (signedReturnFile.size > 5 * 1024 * 1024) {
    setReturnUploadError(
      "The document must not exceed 5 MB."
    );
    return;
  }

  const confirmed = window.confirm(
    "Upload this signed return acknowledgement?\n\n" +
      "Make sure the document contains the required signatures " +
      "and corresponds to the correct rental."
  );

  if (!confirmed) return;

  try {
    setUploadingSignedReturn(true);

    const result = await uploadSignedReturn(
      rental._id,
      signedReturnFile
    );

    setSignedReturnUploaded(true);
    setSignedReturnFile(null);

    setSavedAgreement((previous) =>
      previous
        ? {
            ...previous,
            signedReturnDocument:
              result?.data?.signedReturnDocument ||
              previous.signedReturnDocument,
          }
        : previous
    );

    setReturnUploadSuccess(
      result?.message ||
        "Signed return acknowledgement uploaded successfully."
    );
  } catch (error) {
    setReturnUploadError(
      error.response?.data?.message ||
        "Failed to upload the signed return acknowledgement."
    );
  } finally {
    setUploadingSignedReturn(false);
  }
};

const handleVerifySignedReturn = async () => {
  setReturnVerificationError("");
  setReturnVerificationSuccess("");

  if (!canManageInspection) {
    setReturnVerificationError(
      "You do not have permission to verify return documents."
    );
    return;
  }

  if (rental.status !== "RETURNED") {
    setReturnVerificationError(
      "Only returned rentals can have their return documents verified."
    );
    return;
  }

    if (
    savedAgreement?.status !== "HANDOVER_SIGNED" ||
    !agreementGenerated ||
    !handoverVerified ||
    !savedAgreement?.returnInspection?.inspectedAt ||
    !signedReturnUploaded
    ) {
    setReturnVerificationError(
        "Complete the return inspection and upload the " +
        "signed two-page rental agreement before verification."
    );
    return;
    }

  if (returnVerified || verifyingReturn) {
    return;
  }

  if (!returnReviewed) {
    setReturnVerificationError(
      "Please confirm that you have reviewed the signed return document."
    );
    return;
  }

  const confirmed = window.confirm(
    "Verify this signed return acknowledgement?\n\n" +
      "Confirm that the uploaded document belongs to this rental, " +
      "contains the required signatures, and matches the recorded " +
      "equipment return inspection.\n\n" +
      "The agreement status will become RETURN_SIGNED."
  );

  if (!confirmed) return;

  try {
    setVerifyingReturn(true);

    const result = await verifySignedReturn(
      rental._id,
      true
    );

    // Update the modal immediately after successful verification.
    setReturnVerified(true);
    setReturnReviewed(false);

    setSavedAgreement((previous) =>
      previous
        ? {
            ...previous,
            status: "RETURN_SIGNED",
            returnVerifiedAt:
              result?.data?.returnVerifiedAt ||
              new Date().toISOString(),
          }
        : previous
    );

    setReturnVerificationSuccess(
      result?.message ||
        "Signed return acknowledgement verified successfully."
    );
  } catch (error) {
    setReturnVerificationError(
      error.response?.data?.message ||
        "Failed to verify the signed return acknowledgement."
    );
  } finally {
    setVerifyingReturn(false);
  }
};

 // ============================================================
 // DOWNLOAD RENTAL AGREEMENT DOCUMENT
 // ============================================================

const handleDocumentDownload = async (documentType) => {
  if (!rental?._id || downloadingDocument) {
    return;
  }

  setDownloadingDocument(documentType);
  setDocumentDownloadError("");

  try {
    switch (documentType) {
      case "generatedHandover":
        await downloadGeneratedHandover(rental._id);
        break;

      case "signedHandover":
        await downloadSignedHandover(
          rental._id,
          savedAgreement?.signedHandoverDocument?.mimeType
        );
        break;

      case "generatedReturn":
        await downloadReturnAcknowledgement(rental._id);
        break;

      case "signedReturn":
        await downloadSignedReturn(
          rental._id,
          savedAgreement?.signedReturnDocument?.mimeType
        );
        break;

      default:
        throw new Error("Unsupported agreement document.");
    }
} catch (error) {
  console.error("Agreement document download failed:", error);

  let message =
    error?.response?.data?.message ||
    error?.message ||
    "Unable to download the selected document.";

  // Axios returns error responses as Blob objects when
  // responseType: "blob" is used.
  if (error?.response?.data instanceof Blob) {
    try {
      const responseText = await error.response.data.text();
      const responseData = JSON.parse(responseText);

      message = responseData.message || message;
    } catch {
      // Preserve the original error if the response is not JSON.
    }
  }

  setDocumentDownloadError(message);
} finally {
    setDownloadingDocument(null);
  }
};

  if (!rental) return null;

  const equipmentName =
    rental.equipment?.name ||
    rental.equipment?.model ||
    "Rental Equipment";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="rental-agreement-title"
        className="flex h-[min(90dvh,850px)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        {/* Header */}
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-gray-200 px-6 py-5">
          <div>
            <h2
              id="rental-agreement-title"
              className="text-xl font-bold text-gray-900"
            >
              Rental Agreement
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              {equipmentName}
            </p>

            <p className="mt-1 text-xs text-gray-400">
              Rental ID: {rental._id}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close rental agreement"
            className="rounded-lg px-3 py-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
          >
            ✕
          </button>
        </div>

        {/* Agreement Tab Navigation */}
        <div className="shrink-0 border-b border-gray-200 bg-white px-4 py-3 sm:px-6">
        <div
            role="tablist"
            aria-label="Rental agreement sections"
            className="grid grid-cols-3 gap-1.5 rounded-xl bg-gray-100 p-1.5"
        >
            {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
                <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveTab(tab.id)}
                className={`flex min-w-0 flex-col items-center justify-center gap-1.5 rounded-lg px-2 py-3 text-xs font-semibold transition-all duration-200 sm:flex-row sm:gap-2 sm:text-sm ${
                    isActive
                    ? "bg-white text-orange-700 shadow-sm ring-1 ring-orange-200"
                    : "text-gray-500 hover:bg-white/70 hover:text-gray-800"
                }`}
                >
                <Icon
                    size={17}
                    strokeWidth={isActive ? 2.3 : 1.8}
                    className={
                    isActive ? "text-orange-600" : "text-gray-400"
                    }
                />

                <span className="truncate">{tab.label}</span>
                </button>
            );
            })}
        </div>
        </div>

        {/* Content */}
        <div className="min-h-0 flex-1 overflow-y-auto p-6">
        {loadingAgreement && (
        <p className="py-6 text-center text-sm text-gray-500">
            Loading agreement details...
        </p>
        )}

        {agreementLoadError && (
        <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
            {agreementLoadError}
        </div>
        )}
        {activeTab === "handover" &&
            !loadingAgreement &&
            !agreementLoadError && (
        <section className="space-y-5">
            <div>
            <h3 className="text-lg font-bold text-gray-900">
                Equipment Handover Inspection
            </h3>
            <p className="mt-1 text-sm text-gray-500">
                Record the equipment condition and accessories
                before generating the rental agreement.
            </p>
            </div>

            {!canManageInspection && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                Only staff administrators can save handover
                inspections.
            </div>
            )}

            {rental.status !== "CONFIRMED" && (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                Handover inspection is available only for
                confirmed rentals.
            </div>
            )}

            {savedAgreement?.status !== "DRAFT" && savedAgreement && (
            <div className="rounded-xl border border-green-200 bg-green-50 p-4">
                <p className="text-sm font-semibold text-green-800">
                Handover inspection completed
                </p>

                <p className="mt-1 text-sm text-green-700">
                Agreement: {savedAgreement.agreementNumber}
                </p>

                <p className="mt-1 text-sm text-green-700">
                Status: {savedAgreement.status}
                </p>

                {agreementGenerated && (
                <div className="mt-4">
                    <button
                    type="button"
                    onClick={() =>
                        handleDocumentDownload("generatedHandover")
                    }
                    className="inline-flex items-center gap-2 rounded-lg bg-green-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-800"
                    >
                    Download Agreement PDF
                    </button>
                </div>
                )}

                <p className="mt-2 text-xs text-green-700">
                The handover inspection is locked because
                the agreement has already been generated.
                </p>
            </div>
            )}

            {canManageInspection &&
                rental.status === "CONFIRMED" &&
                savedAgreement?.status === "DRAFT" && (
            <form onSubmit={handleSaveInspection} className="space-y-5">
                <label className="block">
                <span className="text-sm font-semibold text-gray-700">
                    Equipment Condition
                </span>
                <select
                    value={inspection.condition}
                    onChange={(event) =>
                    setInspection((previous) => ({
                        ...previous,
                        condition: event.target.value,
                    }))
                    }
                    disabled={savingInspection}
                    className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm"
                >
                    <option value="EXCELLENT">Excellent</option>
                    <option value="GOOD">Good</option>
                    <option value="FAIR">Fair</option>
                    <option value="DAMAGED">Damaged</option>
                </select>
                </label>

                {inspection.condition === "DAMAGED" && (
                <label className="block">
                    <span className="text-sm font-semibold text-gray-700">
                    Existing Damage Description
                    </span>
                    <textarea
                    required
                    maxLength={2000}
                    rows={3}
                    value={inspection.damageDescription}
                    onChange={(event) =>
                        setInspection((previous) => ({
                        ...previous,
                        damageDescription: event.target.value,
                        }))
                    }
                    disabled={savingInspection}
                    placeholder="Describe any existing scratches, dents, or other damage..."
                    className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm"
                    />
                </label>
                )}

                <div className="rounded-xl border border-gray-200 p-4">
                <div className="flex items-center justify-between gap-3">
                    <div>
                    <h4 className="text-sm font-bold text-gray-900">
                        Included Accessories
                    </h4>
                    <p className="mt-1 text-xs text-gray-500">
                        Record batteries, chargers, lenses,
                        memory cards, and other included items.
                    </p>
                    </div>

                    <button
                    type="button"
                    onClick={addAccessory}
                    disabled={
                        savingInspection ||
                        inspection.accessories.length >= 30
                    }
                    className="rounded-lg border border-orange-300 px-3 py-2 text-xs font-semibold text-orange-700 hover:bg-orange-50 disabled:opacity-50"
                    >
                    + Add
                    </button>
                </div>

                <div className="mt-4 space-y-3">
                    {inspection.accessories.length === 0 && (
                    <p className="text-sm text-gray-500">
                        No accessories added.
                    </p>
                    )}

                    {inspection.accessories.map((accessory, index) => (
                    <div
                        key={index}
                        className="space-y-3 rounded-xl bg-gray-50 p-3"
                    >
                        <div className="grid gap-3 sm:grid-cols-[1fr_100px]">
                        <input
                            required
                            maxLength={150}
                            placeholder="Accessory name"
                            value={accessory.name}
                            disabled={savingInspection}
                            onChange={(event) =>
                            updateAccessory(
                                index,
                                "name",
                                event.target.value
                            )
                            }
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        />

                        <input
                            required
                            type="number"
                            min="1"
                            step="1"
                            placeholder="Qty"
                            value={accessory.quantity}
                            disabled={savingInspection}
                            onChange={(event) =>
                            updateAccessory(
                                index,
                                "quantity",
                                event.target.value
                            )
                            }
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        />
                        </div>

                        <label className="block">
                        <span className="mb-1 block text-xs font-semibold text-gray-600">
                            Accessory Condition
                        </span>

                        <select
                            value={accessory.condition || ""}
                            onChange={(event) =>
                            updateAccessory(
                                index,
                                "condition",
                                event.target.value
                            )
                            }
                            disabled={savingInspection}
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                        >
                            <option value="">Not recorded</option>
                            <option value="EXCELLENT">Excellent</option>
                            <option value="GOOD">Good</option>
                            <option value="FAIR">Fair</option>
                            <option value="DAMAGED">Damaged</option>
                        </select>
                        </label>

                        <input
                        maxLength={500}
                        placeholder="Accessory notes (optional)"
                        value={accessory.notes}
                        disabled={savingInspection}
                        onChange={(event) =>
                            updateAccessory(
                            index,
                            "notes",
                            event.target.value
                            )
                        }
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        />

                        <button
                        type="button"
                        onClick={() => removeAccessory(index)}
                        disabled={savingInspection}
                        className="text-xs font-semibold text-red-600 hover:text-red-700 disabled:opacity-50"
                        >
                        Remove Accessory
                        </button>
                    </div>
                    ))}
                </div>
                </div>

                <label className="block">
                <span className="text-sm font-semibold text-gray-700">
                    Inspection Notes
                </span>
                <textarea
                    maxLength={2000}
                    rows={3}
                    value={inspection.notes}
                    disabled={savingInspection}
                    onChange={(event) =>
                    setInspection((previous) => ({
                        ...previous,
                        notes: event.target.value,
                    }))
                    }
                    placeholder="Additional inspection observations..."
                    className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm"
                />
                </label>

                <label className="block">
                <span className="text-sm font-semibold text-gray-700">
                    Special Agreement Notes
                </span>
                <textarea
                    maxLength={2000}
                    rows={3}
                    value={inspection.specialNotes}
                    disabled={savingInspection}
                    onChange={(event) =>
                    setInspection((previous) => ({
                        ...previous,
                        specialNotes: event.target.value,
                    }))
                    }
                    placeholder="Any special terms or instructions..."
                    className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm"
                />
                </label>

                {inspectionError && (
                <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                    {inspectionError}
                </p>
                )}

                {inspectionSuccess && (
                <p role="status" className="rounded-lg bg-green-50 p-3 text-sm text-green-700">
                    {inspectionSuccess}
                </p>
                )}

                <button
                type="submit"
                disabled={savingInspection}
                className="rounded-xl bg-orange-600 px-5 py-3 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-50"
                >
                {savingInspection
                    ? "Saving Inspection..."
                    : "Save Handover Inspection"}
                </button>

                <div className="border-t border-gray-200 pt-5">
                <h4 className="text-sm font-bold text-gray-900">
                    Generate Rental Agreement
                </h4>

                <p className="mt-1 text-sm text-gray-500">
                    Generate the agreement PDF after saving the
                    handover inspection. The inspection becomes
                    locked once the agreement is generated.
                </p>

                {agreementGenerated && (
                    <div className="mt-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
                    Agreement generated successfully.
                    {agreementNumber && (
                        <p className="mt-1 font-semibold">
                        Agreement No: {agreementNumber}
                        </p>
                    )}
                    </div>
                )}

                <button
                    type="button"
                    onClick={handleGenerateAgreement}
                    disabled={
                    !inspectionSaved ||
                    agreementGenerated ||
                    savingInspection ||
                    generatingAgreement
                    }
                    className="mt-4 rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {generatingAgreement
                    ? "Generating Agreement..."
                    : agreementGenerated
                        ? "Agreement Generated"
                        : "Generate Agreement PDF"}
                </button>

                {agreementGenerated && (
                <button
                    type="button"
                    onClick={() =>
                    handleDocumentDownload("generatedHandover")
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-800 transition hover:bg-gray-50"
                >
                    Download Agreement PDF
                </button>
                )}

                {!inspectionSaved && !agreementGenerated && (
                    <p className="mt-2 text-xs text-gray-500">
                    Save the handover inspection first to enable
                    agreement generation.
                    </p>
                )}
                </div>

            </form>
            )}
                        
            <div className="mt-6 rounded-xl border border-gray-200 p-5">
            <h4 className="text-base font-bold text-gray-900">
                Upload Signed Handover Document
            </h4>

            <p className="mt-2 text-sm text-gray-600">
                Upload the signed agreement after it has been
                generated and signed by the relevant parties.
                Supported formats: PDF, JPG, PNG (maximum 5 MB).
            </p>

            {handoverUploaded ? (
            <div className="mt-4 rounded-lg bg-green-50 p-4 text-sm text-green-800">
                <p className="font-semibold">
                Signed handover document uploaded
                </p>

                <p className="mt-1">
                {handoverVerified
                    ? "The signed handover has been verified."
                    : "Staff verification is still required."}
                </p>

                {savedAgreement?.signedHandoverDocument?.originalName && (
                <p className="mt-2 break-all text-xs">
                    File: {savedAgreement.signedHandoverDocument.originalName}
                </p>
                )}
            </div>
            ) : (
                <div className="mt-4 space-y-4">
                <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    disabled={!agreementGenerated || uploadingHandover}
                    onChange={(event) => {
                    setSignedHandoverFile(
                        event.target.files?.[0] || null
                    );
                    setHandoverUploadError("");
                    }}
                    className="block w-full rounded-lg border border-gray-300 p-3 text-sm"
                />

                {handoverUploadError && (
                    <p role="alert" className="text-sm text-red-600">
                    {handoverUploadError}
                    </p>
                )}

                {handoverUploadSuccess && (
                    <p role="status" className="text-sm text-green-700">
                    {handoverUploadSuccess}
                    </p>
                )}

                <button
                    type="button"
                    onClick={handleUploadSignedHandover}
                    disabled={
                    !agreementGenerated ||
                    !signedHandoverFile ||
                    uploadingHandover
                    }
                    className="rounded-xl bg-orange-600 px-5 py-3 text-sm font-semibold text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {uploadingHandover
                    ? "Uploading Document..."
                    : "Upload Signed Handover"}
                </button>
                </div>
            )}
            </div>

            <div className="mt-6 rounded-xl border border-gray-200 p-5">
            <h4 className="text-base font-bold text-gray-900">
                Verify Signed Handover
            </h4>

            <p className="mt-2 text-sm text-gray-600">
                Verify the uploaded signed agreement before
                issuing equipment to the customer.
            </p>

            {handoverVerified ? (
                <div
                role="status"
                className="mt-4 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800"
                >
                Signed handover verified successfully.
                The agreement is now HANDOVER_SIGNED.
                </div>
            ) : (
                <div className="mt-4 space-y-4">
                <label className="flex items-start gap-3">
                    <input
                    type="checkbox"
                    checked={handoverReviewed}
                    onChange={(event) =>
                        setHandoverReviewed(event.target.checked)
                    }
                    disabled={!handoverUploaded || verifyingHandover}
                    className="mt-1 h-4 w-4 accent-orange-600"
                    />

                    <span className="text-sm text-gray-700">
                    I confirm that I have reviewed the uploaded
                    signed handover document and verified that
                    the required signatures are present.
                    </span>
                </label>

                {verificationError && (
                    <p role="alert" className="text-sm text-red-600">
                    {verificationError}
                    </p>
                )}

                {verificationSuccess && (
                    <p role="status" className="text-sm text-green-700">
                    {verificationSuccess}
                    </p>
                )}

                <button
                    type="button"
                    onClick={handleVerifySignedHandover}
                    disabled={
                    !handoverUploaded ||
                    !handoverReviewed ||
                    verifyingHandover
                    }
                    className="rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {verifyingHandover
                    ? "Verifying..."
                    : "Verify Signed Handover"}
                </button>
                </div>
            )}
            </div>

        </section>
        )}

        {activeTab === "return" &&
        !loadingAgreement &&
        !agreementLoadError && (
            <section className="space-y-5">
            <div>
                <h3 className="text-lg font-bold text-gray-900">
                Equipment Return Acknowledgement
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                Complete the return section on the same two-page
                rental agreement used during equipment handover.
                Upload and verify the completed signed document
                after the equipment return inspection.
                </p>

            </div>

            <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
                <h4 className="text-sm font-bold text-gray-900">
                Rental Return Agreement Status
                </h4>

                <div className="mt-4 space-y-3">
                {[
                {
                    label: "Original two-page agreement generated",
                    complete: agreementGenerated,
                },
                {
                    label: "Signed handover verified",
                    complete: handoverVerified,
                },
                {
                    label: "Return inspection recorded",
                    complete: Boolean(
                    savedAgreement?.returnInspection?.inspectedAt
                    ),
                },
                {
                    label: "Completed agreement uploaded",
                    complete: signedReturnUploaded,
                },
                {
                    label: "Completed agreement verified",
                    complete: returnVerified,
                },
                ].map((item) => (
                    <div
                    key={item.label}
                    className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3"
                    >
                    <span className="text-sm font-medium text-gray-700">
                        {item.label}
                    </span>

                    <span
                        className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                        item.complete
                            ? "bg-green-100 text-green-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                    >
                        {item.complete ? "Completed" : "Pending"}
                    </span>
                    </div>
                ))}
                </div>
            </div>

            {/* ==========================================
                ORIGINAL TWO-PAGE AGREEMENT
            ========================================== */}

            <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h4 className="text-base font-bold text-gray-900">
                Original Two-Page Rental Agreement
            </h4>

            <p className="mt-2 text-sm text-gray-600">
                Use the original printed rental agreement issued at
                handover. Complete the return inspection section on
                page two, record any damage or missing accessories,
                and obtain the required signatures.
            </p>

            <p className="mt-2 text-sm text-gray-600">
                Do not generate a separate return acknowledgement.
                Upload the completed and signed agreement below.
            </p>

            <button
                type="button"
                onClick={() => handleDocumentDownload("generatedHandover")}
                disabled={!agreementGenerated || Boolean(downloadingDocument)}
                className="mt-4 rounded-xl border border-orange-300 bg-orange-50 px-5 py-3 text-sm font-semibold text-orange-700 transition hover:bg-orange-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
                {downloadingDocument === "generatedHandover"
                ? "Downloading Agreement..."
                : "Download Original Agreement"}
            </button>

            {documentDownloadError && (
                <p role="alert" className="mt-3 text-sm text-red-600">
                {documentDownloadError}
                </p>
            )}
            </div>

            {/* ==========================================
                UPLOAD SIGNED RETURN ACKNOWLEDGEMENT
            ========================================== */}

            <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h4 className="text-base font-bold text-gray-900">
                Upload Completed Rental Agreement
            </h4>

            <p className="mt-2 text-sm text-gray-600">
            After the equipment return inspection, complete page two
            of the original printed rental agreement and obtain the
            required signatures. Scan or photograph the completed
            agreement, including both pages, and upload it for staff
            verification. Supported formats: PDF, JPG, PNG
            (maximum 5 MB).
            </p>

            {signedReturnUploaded ? (
                <div
                role="status"
                className="mt-4 rounded-xl border border-green-200 bg-green-50 p-4"
                >
                <p className="text-sm font-semibold text-green-800">
                    Signed return document uploaded
                </p>

                <p className="mt-1 text-sm text-green-700">
                    {returnVerified
                    ? "The signed return acknowledgement has been verified."
                    : "The signed document is awaiting staff verification."}
                </p>

                {savedAgreement?.signedReturnDocument?.originalName && (
                    <p className="mt-2 break-all text-xs text-green-700">
                    File: {savedAgreement.signedReturnDocument.originalName}
                    </p>
                )}
                </div>
            ) : (
                <div className="mt-4 space-y-4">
                <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    disabled={
                    !canManageInspection ||
                    rental.status !== "RETURNED" ||
                    savedAgreement?.status !== "HANDOVER_SIGNED" ||
                    !agreementGenerated ||
                    !handoverVerified ||
                    !savedAgreement?.returnInspection?.inspectedAt ||
                    uploadingSignedReturn
                    }
                    onChange={(event) => {
                    setSignedReturnFile(event.target.files?.[0] || null);
                    setReturnUploadError("");
                    setReturnUploadSuccess("");
                    }}
                    className="block w-full rounded-xl border border-gray-300 bg-white p-3 text-sm text-gray-700"
                />

                <button
                    type="button"
                    onClick={handleUploadSignedReturn}
                    disabled={
                    !canManageInspection ||
                    rental.status !== "RETURNED" ||
                    savedAgreement?.status !== "HANDOVER_SIGNED" ||
                    !agreementGenerated ||
                    !handoverVerified ||
                    !savedAgreement?.returnInspection?.inspectedAt ||
                    !signedReturnFile ||
                    uploadingSignedReturn
                    }
                    className="rounded-xl bg-orange-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
                >

                {uploadingSignedReturn
                ? "Uploading Agreement..."
                : "Upload Completed Agreement"}

                </button>

                </div>
            )}

            {returnUploadError && (
                <p
                role="alert"
                className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                >
                {returnUploadError}
                </p>
            )}

            {returnUploadSuccess && (
                <p
                role="status"
                className="mt-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700"
                >
                {returnUploadSuccess}
                </p>
            )}
            </div>

            {/* ==========================================
                VERIFY SIGNED RETURN ACKNOWLEDGEMENT
            ========================================== */}

            <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h4 className="text-base font-bold text-gray-900">
                Verify Completed Rental Agreement
            </h4>

            <p className="mt-2 text-sm text-gray-600">
                Staff must review the uploaded signed return document
                and confirm that it matches the recorded equipment
                return inspection before verification.
            </p>

            {returnVerified ? (
                <div
                role="status"
                className="mt-4 rounded-xl border border-green-200 bg-green-50 p-4"
                >
                <div className="flex items-center gap-2">
                    <span className="text-lg text-green-700">✓</span>
                    <p className="text-sm font-semibold text-green-800">
                    Signed Return Verified
                    </p>
                </div>

                <p className="mt-2 text-sm text-green-700">
                    The return acknowledgement has been reviewed and
                    verified successfully.
                </p>

                {savedAgreement?.returnVerifiedAt && (
                    <p className="mt-2 text-xs text-green-700">
                    Verified at:{" "}
                    {new Date(
                        savedAgreement.returnVerifiedAt
                    ).toLocaleString()}
                    </p>
                )}
                </div>
            ) : (
                <div className="mt-4 space-y-4">
                {!signedReturnUploaded && (
                    <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                    Upload the signed return acknowledgement before
                    proceeding with verification.
                    </p>
                )}

                <label className="flex cursor-pointer items-start gap-3">
                    <input
                    type="checkbox"
                    checked={returnReviewed}
                    onChange={(event) => {
                        setReturnReviewed(event.target.checked);
                        setReturnVerificationError("");
                    }}
                    disabled={
                        !canManageInspection ||
                        rental.status !== "RETURNED" ||
                        savedAgreement?.status !== "HANDOVER_SIGNED" ||
                        !signedReturnUploaded ||
                        verifyingReturn
                    }
                    className="mt-1 h-4 w-4 rounded border-gray-300 accent-orange-600"
                    />

                    <span className="text-sm text-gray-700">
                    I confirm that I have reviewed the uploaded signed
                    return acknowledgement, verified the required
                    signatures, and checked that the document matches
                    the recorded equipment return inspection.
                    </span>
                </label>

                <button
                    type="button"
                    onClick={handleVerifySignedReturn}
                    disabled={
                    !canManageInspection ||
                    rental.status !== "RETURNED" ||
                    savedAgreement?.status !== "HANDOVER_SIGNED" ||
                    !agreementGenerated ||
                    !handoverVerified ||
                    !savedAgreement?.returnInspection?.inspectedAt ||
                    !signedReturnUploaded ||
                    !returnReviewed ||
                    verifyingReturn
                    }
                    className="rounded-xl bg-orange-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
                >                                    
                {verifyingReturn
                ? "Verifying Agreement..."
                : "Verify Completed Agreement"}
                </button>
                </div>
            )}

            {returnVerificationError && (
                <p
                role="alert"
                className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                >
                {returnVerificationError}
                </p>
            )}

            {returnVerificationSuccess && (
                <p
                role="status"
                className="mt-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700"
                >
                {returnVerificationSuccess}
                </p>
            )}
            </div>

            {returnVerified && (
                <div
                role="status"
                className="rounded-xl border border-green-200 bg-green-50 p-4"
                >
                <p className="text-sm font-semibold text-green-800">
                    Return acknowledgement verified
                </p>

                <p className="mt-1 text-sm text-green-700">
                    The signed return document has been verified.
                    The agreement status is RETURN_SIGNED.
                </p>
                </div>
            )}

            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                <p className="text-sm font-semibold text-blue-900">
                Security Deposit Settlement
                </p>

                <p className="mt-1 text-sm text-blue-800">
                Return acknowledgement verification does not
                automatically approve deductions, issue refunds,
                or complete the rental. Deposit settlement is
                managed separately in Rental Management.
                </p>
            </div>
            </section>
        )}

        {activeTab === "documents" && (
        <section className="space-y-5">
            <div>
            <h3 className="text-lg font-semibold text-gray-900">
                Agreement Documents
            </h3>
                <p className="mt-2 text-sm text-gray-600">
                View and download the original two-page rental agreement,
                the signed handover document, and the completed agreement
                uploaded after equipment return.
                </p>
            </div>

            {documentDownloadError && (
            <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
            >
                {documentDownloadError}
            </div>
            )}

            {loadingAgreement ? (
            <p className="text-sm text-gray-500">
                Loading agreement documents...
            </p>
            ) : agreementLoadError ? (
            <p
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
            >
                {agreementLoadError}
            </p>
            ) : (
            <>
                {/* HANDOVER DOCUMENTS */}
                <div className="rounded-xl border border-gray-200 bg-white p-5">
                <div className="mb-4">
                    <h4 className="font-semibold text-gray-900">
                    Original Rental Agreement
                    </h4>

                    <p className="mt-1 text-sm text-gray-500">
                    Original documents recorded when equipment was
                    issued to the customer.
                    </p>
                </div>

                {[
                    {
                    label: "Original Two-Page Agreement",
                    available: Boolean(
                    savedAgreement?.generatedPdf?.storageKey ||
                    savedAgreement?.generatedPdf?.generatedAt ||
                    savedAgreement?.generatedPdf?.uploadedAt ||
                    savedAgreement?.generatedAt
                    ),
                    type: "generatedHandover",
                    },
                    {
                    label: "Signed Agreement at Handover",
                    available: Boolean(
                        savedAgreement?.signedHandoverDocument?.uploadedAt ||
                        savedAgreement?.signedHandoverDocument?.originalName ||
                        savedAgreement?.handoverVerifiedAt
                    ),
                    type: "signedHandover",
                    },
                ].map((document) => (
                    <div
                    key={document.type}
                    className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 py-4"
                    >
                    <span className="text-sm font-medium text-gray-700">
                        {document.label}
                    </span>

                    <div className="flex items-center gap-3">
                        <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            document.available
                            ? "bg-green-100 text-green-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                        >
                        {document.available ? "Available" : "Pending"}
                        </span>

                        <AgreementDownloadButton
                        available={document.available}
                        loading={downloadingDocument === document.type}
                        disabled={Boolean(downloadingDocument)}
                        onClick={() =>
                            handleDocumentDownload(document.type)
                        }
                        />
                    </div>
                    </div>
                ))}

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 py-4">
                    <span className="text-sm font-medium text-gray-700">
                    Handover Verification
                    </span>

                    <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        savedAgreement?.handoverVerifiedAt
                        ? "bg-green-100 text-green-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                    >
                    {savedAgreement?.handoverVerifiedAt
                        ? "Verified"
                        : "Pending"}
                    </span>
                </div>
                </div>

                {/* RETURN DOCUMENTS */}
                <div className="rounded-xl border border-gray-200 bg-white p-5">
                <div className="mb-4">
                    <h4 className="font-semibold text-gray-900">
                    Equipment Return
                    </h4>
                    <p className="mt-1 text-sm text-gray-500">
                    The completed original agreement is uploaded after
                    equipment return. Older rentals may also have a
                    separate return acknowledgement PDF.
                    </p>
                </div>
                {[
                ...(returnPdfGenerated
                    ? [
                        {
                        label: "Legacy Return Acknowledgement PDF",
                        available: true,
                        type: "generatedReturn",
                        },
                    ]
                    : []),
                {
                    label: "Completed Signed Rental Agreement",
                    available: signedReturnUploaded,
                    type: "signedReturn",
                },
                ].map((document) => (
                    <div
                    key={document.type}
                    className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 py-4"
                    >
                    <span className="text-sm font-medium text-gray-700">
                        {document.label}
                    </span>

                    <div className="flex items-center gap-3">
                        <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            document.available
                            ? "bg-green-100 text-green-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                        >
                        {document.available ? "Available" : "Pending"}
                        </span>

                        <AgreementDownloadButton
                        available={document.available}
                        loading={downloadingDocument === document.type}
                        disabled={Boolean(downloadingDocument)}
                        onClick={() =>
                            handleDocumentDownload(document.type)
                        }
                        />
                    </div>
                    </div>
                ))}

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 py-4">
                    <span className="text-sm font-medium text-gray-700">
                    Return Verification
                    </span>

                    <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        returnVerified
                        ? "bg-green-100 text-green-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                    >
                    {returnVerified ? "Verified" : "Pending"}
                    </span>
                </div>
                </div>

                {/* DEPOSIT SETTLEMENT INFORMATION */}
                <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                <p className="text-sm text-blue-800">
                    Agreement documentation and security deposit settlement
                    are managed separately. Document verification does not
                    automatically refund the deposit or complete the rental.
                </p>
                </div>
            </>
            )}
        </section>
        )}

        </div>

        {/* Footer */}
        <div className="flex shrink-0 justify-end border-t border-gray-200 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
