
import { useAuth } from "../../context/useAuth";
import { useEffect, useState } from "react";

import { getEquipmentById } from "../../services/equipmentService";
import {
  checkAvailability,
  createRentalRequest,
} from "../../services/rentalService";
import {
  useParams,
  useNavigate,
  useLocation,
} from "react-router-dom";

const EquipmentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const {
  user,
  isAuthenticated,
  loading: authLoading,
} = useAuth();

  const [equipment, setEquipment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Image gallery
  const [activeImage, setActiveImage] = useState(0);
  const [showImageModal, setShowImageModal] = useState(false);

  // Rental dates
  const [startDate, setStartDate] = useState(
    location.state?.startDate || ""
  );

  const [endDate, setEndDate] = useState(
    location.state?.endDate || ""
  );
  const [availability, setAvailability] = useState(null);
  const [checking, setChecking] = useState(false);
  const [availabilityError, setAvailabilityError] = useState("");

  // Rental request
  const [requesting, setRequesting] = useState(false);
  const [requestMessage, setRequestMessage] = useState("");
  const [requestError, setRequestError] = useState("");

  useEffect(() => {
    const loadEquipment = async () => {
      try {
        setLoading(true);
        setError("");

        const result = await getEquipmentById(id);

        setEquipment(result?.data?.equipment || null);
      } catch (err) {
        setError(
          err.response?.data?.message ||
            "Failed to load equipment details"
        );
      } finally {
        setLoading(false);
      }
    };

    loadEquipment();
  }, [id]);

 // ------------------------------------------
// IMAGE GALLERY
// ------------------------------------------

const images =
  equipment?.images?.length > 0
    ? equipment.images
    : equipment?.imageUrl
      ? [equipment.imageUrl]
      : [];

// Automatically switch images every 4 seconds
useEffect(() => {
  if (images.length <= 1) return;

  const interval = setInterval(() => {
    setActiveImage((current) =>
      current === images.length - 1 ? 0 : current + 1
    );
  }, 4000);

  return () => clearInterval(interval);
}, [images.length, activeImage]);

const handlePreviousImage = () => {
  if (images.length === 0) return;

  setActiveImage((current) =>
    current === 0 ? images.length - 1 : current - 1
  );
};

const handleNextImage = () => {
  if (images.length === 0) return;

  setActiveImage((current) =>
    current === images.length - 1 ? 0 : current + 1
  );
};

  // ------------------------------------------
  // AVAILABILITY
  // ------------------------------------------

  const handleCheckAvailability = async () => {
    if (!startDate || !endDate) {
      setAvailabilityError(
        "Please select both start and end dates."
      );
      return;
    }

    if (new Date(endDate) < new Date(startDate)) {
      setAvailabilityError(
        "End date cannot be before start date."
      );
      return;
    }

    try {
      setChecking(true);
      setAvailabilityError("");
      setAvailability(null);
      setRequestMessage("");
      setRequestError("");

      const result = await checkAvailability({
        equipmentId: id,
        startDate,
        endDate,
      });

      setAvailability(result);
    } catch (err) {
      setAvailabilityError(
        err.response?.data?.message ||
          "Failed to check availability"
      );
    } finally {
      setChecking(false);
    }
  };

  // ------------------------------------------
  // RENTAL REQUEST
  // ------------------------------------------

  
const handleRentalRequest = async () => {
  // Wait until authentication state is ready
  if (authLoading || requesting) return;

  // Redirect guests to login
  if (!isAuthenticated) {
    navigate("/login", {
      state: {
        from: `/customer/equipment/${id}`,
        startDate,
        endDate,
      },
    });
    return;
  }

  // Only customers can request rentals
  if (user?.role !== "CUSTOMER") {
    setRequestError(
      "Only customer accounts can request equipment rentals."
    );
    return;
  }

  // Make sure dates are selected
  if (!startDate || !endDate || !availability?.available) {
    setRequestError(
      "Please select dates and check availability first."
    );
    return;
  }

  try {
    setRequesting(true);
    setRequestMessage("");
    setRequestError("");

    // Recheck availability before submitting
    const latestAvailability = await checkAvailability({
      equipmentId: id,
      startDate,
      endDate,
    });

    setAvailability(latestAvailability);

    if (!latestAvailability?.available) {
      setRequestError(
        latestAvailability?.message ||
          "Equipment is no longer available for the selected dates."
      );
      return;
    }

    const result = await createRentalRequest({
      equipmentId: id,
      startDate,
      endDate,
    });

    setRequestMessage(
      result.message ||
        "Rental request submitted successfully."
    );
  } catch (err) {
    setRequestError(
      err.response?.data?.message ||
        "Failed to submit rental request."
    );
  } finally {
    setRequesting(false);
  }
};


  // ------------------------------------------
  // STATUS STYLE
  // ------------------------------------------

  const getStatusStyle = (status) => {
    switch (status) {
      case "AVAILABLE":
        return "bg-green-100 text-green-700 border-green-200";

      case "RESERVED":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";

      case "RENTED":
        return "bg-blue-100 text-blue-700 border-blue-200";

      case "MAINTENANCE":
        return "bg-orange-100 text-orange-700 border-orange-200";

      case "DAMAGED":
        return "bg-red-100 text-red-700 border-red-200";

      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  // ------------------------------------------
  // LOADING
  // ------------------------------------------

  if (loading) {
    return (
      <main className="min-h-[calc(100vh-4rem)] bg-gray-50 px-6 py-10">
        <div className="mx-auto max-w-7xl">
          <div className="animate-pulse space-y-6">
            <div className="h-6 w-32 rounded bg-gray-200" />
            <div className="h-12 w-96 rounded bg-gray-200" />

            <div className="grid gap-8 lg:grid-cols-2">
              <div className="h-[500px] rounded-3xl bg-gray-200" />
              <div className="h-[500px] rounded-3xl bg-gray-200" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  // ------------------------------------------
  // ERROR
  // ------------------------------------------

  if (error) {
    return (
      <main className="min-h-[calc(100vh-4rem)] bg-gray-50 px-6 py-10">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
            {error}
          </div>
        </div>
      </main>
    );
  }

  // ------------------------------------------
  // NOT FOUND
  // ------------------------------------------

  if (!equipment) {
    return (
      <main className="min-h-[calc(100vh-4rem)] bg-gray-50 px-6 py-10">
        <div className="mx-auto max-w-7xl">
          <p className="text-gray-600">
            Equipment not found.
          </p>
        </div>
      </main>
    );
  }

  const currentImage = images[activeImage];

  return (
    <>
      <main className="min-h-[calc(100vh-4rem)] bg-gray-50 px-6 py-10">
        <div className="mx-auto max-w-7xl">

          {/* Back button */}
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mb-6 flex items-center gap-2 text-sm font-semibold text-gray-600 transition hover:text-gray-950"
          >
            ← Back to Equipment
          </button>

          {/* Header */}
          <div className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-600">
              Equipment Rental
            </p>

            <h1 className="mt-2 text-4xl font-bold tracking-tight text-gray-950">
              {equipment.name}
            </h1>

            <p className="mt-2 text-lg text-gray-500">
              {equipment.brand} {equipment.model}
            </p>
          </div>

          {/* Main Product Section */}
          <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">

            {/* =========================================
                IMAGE GALLERY
            ========================================== */}

            <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm">

              {/* Main image */}
              <div
                className="group relative flex aspect-[4/3] cursor-zoom-in items-center justify-center overflow-hidden rounded-2xl bg-gray-100"
                onClick={() => {
                  if (currentImage) {
                    setShowImageModal(true);
                  }
                }}
              >
                {currentImage ? (
                  <img
                    src={currentImage}
                    alt={equipment.name}
                    className="h-full w-full object-contain transition duration-500 group-hover:scale-105"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                ) : (
                  <div className="text-center">
                    <div className="text-7xl text-gray-300">
                      ◇
                    </div>

                    <p className="mt-3 text-sm font-medium text-gray-400">
                      No Equipment Image
                    </p>
                  </div>
                )}

                {/* Status */}
                <div
                  className={`absolute left-5 top-5 rounded-full border px-4 py-2 text-xs font-bold shadow-sm ${getStatusStyle(
                    equipment.status
                  )}`}
                >
                  {equipment.status}
                </div>

                {/* Zoom indicator */}
                {currentImage && (
                  <div className="absolute bottom-5 right-5 rounded-full bg-black/70 px-4 py-2 text-xs font-semibold text-white opacity-0 transition group-hover:opacity-100">
                    Click to enlarge
                  </div>
                )}

                {/* Previous */}
                {images.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePreviousImage();
                    }}
                    className="absolute left-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-xl text-gray-800 shadow-md transition hover:bg-white"
                  >
                    ‹
                  </button>
                )}

                {/* Next */}
                {images.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNextImage();
                    }}
                    className="absolute right-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-xl text-gray-800 shadow-md transition hover:bg-white"
                  >
                    ›
                  </button>
                )}
              </div>

              {/* Thumbnails */}
              {images.length > 0 && (
                <div className="mt-4 flex gap-3 overflow-x-auto">
                  {images.map((image, index) => (
                    <button
                      key={`${image}-${index}`}
                      type="button"
                      onClick={() => setActiveImage(index)}
                      className={`h-20 w-24 flex-shrink-0 overflow-hidden rounded-xl border-2 transition ${
                        activeImage === index
                          ? "border-orange-500"
                          : "border-gray-200 hover:border-gray-400"
                      }`}
                    >
                      <img
                        src={image}
                        alt={`${equipment.name} ${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* =========================================
                PRODUCT INFORMATION
            ========================================== */}

            <div className="rounded-3xl border border-gray-200 bg-white p-7 shadow-sm">

              {/* Category */}
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-gray-100 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-600">
                  {equipment.category?.name || "Equipment"}
                </span>

                <span
                  className={`rounded-full border px-4 py-2 text-xs font-bold ${getStatusStyle(
                    equipment.status
                  )}`}
                >
                  {equipment.status}
                </span>
              </div>

              {/* Product title */}
              <h2 className="mt-6 text-3xl font-bold text-gray-950">
                {equipment.name}
              </h2>

              <p className="mt-1 text-gray-500">
                {equipment.brand} {equipment.model}
              </p>

              {/* Price */}
              <div className="mt-8 border-y border-gray-100 py-6">
                <p className="text-sm font-medium text-gray-500">
                  Rental price
                </p>

                <div className="mt-1 flex items-end gap-2">
                  <span className="text-4xl font-bold text-orange-600">
                    LKR{" "}
                    {equipment.rentalPricePerDay?.toLocaleString()}
                  </span>

                  <span className="mb-1 text-sm text-gray-500">
                    / day
                  </span>
                </div>

                <p className="mt-3 text-sm text-gray-500">
                  Security deposit:{" "}
                  <span className="font-semibold text-gray-800">
                    LKR{" "}
                    {equipment.securityDeposit?.toLocaleString()}
                  </span>
                </p>
              </div>

              {/* Description */}
              <div className="mt-6">
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-950">
                  Description
                </h3>

                <p className="mt-3 text-sm leading-7 text-gray-600">
                  {equipment.description ||
                    "No description available for this equipment."}
                </p>
              </div>

              {/* Quick specifications */}
              <div className="mt-7 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-xs text-gray-500">
                    Brand
                  </p>
                  <p className="mt-1 font-semibold text-gray-900">
                    {equipment.brand}
                  </p>
                </div>

                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-xs text-gray-500">
                    Model
                  </p>
                  <p className="mt-1 font-semibold text-gray-900">
                    {equipment.model}
                  </p>
                </div>

                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-xs text-gray-500">
                    Condition
                  </p>
                  <p className="mt-1 font-semibold text-gray-900">
                    {equipment.condition}
                  </p>
                </div>

                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-xs text-gray-500">
                    Category
                  </p>
                  <p className="mt-1 font-semibold text-gray-900">
                    {equipment.category?.name || "N/A"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* =========================================
              RENTAL SECTION
          ========================================== */}

          <div className="mt-8 rounded-3xl border border-gray-200 bg-white p-7 shadow-sm">

            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wider text-orange-600">
                  Rental
                </p>

                <h2 className="mt-1 text-2xl font-bold text-gray-950">
                  Check Availability
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Select your rental period to check whether this equipment is available.
                </p>
              </div>

              <div className="rounded-xl bg-orange-50 px-4 py-3 text-sm">
                <span className="text-gray-500">
                  Daily rate
                </span>

                <span className="ml-2 font-bold text-orange-600">
                  LKR{" "}
                  {equipment.rentalPricePerDay?.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="mt-7 grid gap-5 md:grid-cols-2">

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Start Date
                </label>

                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setAvailability(null);
                    setRequestMessage("");
                    setRequestError("");
                    setAvailabilityError("");
                  }}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  End Date
                </label>

                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setAvailability(null);
                    setRequestMessage("");
                    setRequestError("");
                    setAvailabilityError("");
                  }}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleCheckAvailability}
              disabled={checking}
              className="mt-5 w-full rounded-xl bg-gray-950 px-5 py-4 font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {checking
                ? "Checking Availability..."
                : "Check Availability"}
            </button>

            {/* Availability */}
            {availability && (
              <div
                className={`mt-5 rounded-2xl border p-5 ${
                  availability.available
                    ? "border-green-200 bg-green-50"
                    : "border-red-200 bg-red-50"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="text-xl">
                    {availability.available ? "✓" : "!"}
                  </div>

                  <div>
                    <p
                      className={`font-bold ${
                        availability.available
                          ? "text-green-700"
                          : "text-red-700"
                      }`}
                    >
                      {availability.available
                        ? "Equipment Available"
                        : "Equipment Unavailable"}
                    </p>

                    <p
                      className={`mt-1 text-sm ${
                        availability.available
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {availability.available
                        ? "This equipment can be rented for your selected dates."
                        : availability.message ||
                          "Equipment is not available for these dates."}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {availabilityError && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
                {availabilityError}
              </div>
            )}

            {/* Request button */}
            {availability?.available && (
              <button
                type="button"
                onClick={handleRentalRequest}
                disabled={requesting || authLoading}
                className="mt-5 w-full rounded-xl bg-orange-600 px-5 py-4 font-bold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {requesting
                  ? "Submitting Rental Request..."
                  : "Request Rental"}
              </button>
            )}

            {requestMessage && (
              <div className="mt-5 rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-700">
                ✓ {requestMessage}
              </div>
            )}

            {requestError && (
              <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
                {requestError}
              </div>
            )}
          </div>

          {/* =========================================
              EQUIPMENT DETAILS
          ========================================== */}

          <div className="mt-8 rounded-3xl border border-gray-200 bg-white p-7 shadow-sm">

            <h2 className="text-2xl font-bold text-gray-950">
              Equipment Specifications
            </h2>

            <div className="mt-6 divide-y divide-gray-100">

              <div className="flex justify-between gap-4 py-4">
                <span className="text-sm text-gray-500">
                  Equipment Name
                </span>

                <span className="text-right text-sm font-semibold text-gray-900">
                  {equipment.name}
                </span>
              </div>

              <div className="flex justify-between gap-4 py-4">
                <span className="text-sm text-gray-500">
                  Brand
                </span>

                <span className="text-right text-sm font-semibold text-gray-900">
                  {equipment.brand}
                </span>
              </div>

              <div className="flex justify-between gap-4 py-4">
                <span className="text-sm text-gray-500">
                  Model
                </span>

                <span className="text-right text-sm font-semibold text-gray-900">
                  {equipment.model}
                </span>
              </div>

              <div className="flex justify-between gap-4 py-4">
                <span className="text-sm text-gray-500">
                  Category
                </span>

                <span className="text-right text-sm font-semibold text-gray-900">
                  {equipment.category?.name || "N/A"}
                </span>
              </div>

              <div className="flex justify-between gap-4 py-4">
                <span className="text-sm text-gray-500">
                  Condition
                </span>

                <span className="text-right text-sm font-semibold text-gray-900">
                  {equipment.condition}
                </span>
              </div>

              <div className="flex justify-between gap-4 py-4">
                <span className="text-sm text-gray-500">
                  Availability
                </span>

                <span className="text-right text-sm font-semibold text-gray-900">
                  {equipment.status}
                </span>
              </div>

              <div className="flex justify-between gap-4 py-4">
                <span className="text-sm text-gray-500">
                  Serial Number
                </span>

                <span className="text-right text-sm font-semibold text-gray-900">
                  {equipment.serialNumber || "Not available"}
                </span>
              </div>

            </div>
          </div>

        </div>
      </main>

      {/* =========================================
          FULL SCREEN IMAGE VIEWER
      ========================================== */}

      {showImageModal && currentImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-5"
          onClick={() => setShowImageModal(false)}
        >
          <button
            type="button"
            onClick={() => setShowImageModal(false)}
            className="absolute right-6 top-6 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-2xl text-white transition hover:bg-white/20"
          >
            ×
          </button>

          {images.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handlePreviousImage();
              }}
              className="absolute left-5 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-3xl text-white hover:bg-white/20"
            >
              ‹
            </button>
          )}

          <img
            src={currentImage}
            alt={equipment.name}
            className="max-h-[90vh] max-w-[90vw] object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          {images.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleNextImage();
              }}
              className="absolute right-5 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-3xl text-white hover:bg-white/20"
            >
              ›
            </button>
          )}
        </div>
      )}
    </>
  );
};

export default EquipmentDetails;

