import { useEffect, useState } from "react";
import {
  useParams,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import { getEquipmentById } from "../../services/equipmentService";
import {
  checkAvailability,
  createRentalRequest,
  getRentalCalendar,
} from "../../services/rentalService";

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

const COLOMBO = "Asia/Colombo";

const dateKey = (date) => {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: COLOMBO,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const value = (type) =>
    parts.find((part) => part.type === type)?.value;

  return `${value("year")}-${value("month")}-${value("day")}`;
};

const todayKey = () => dateKey(new Date());

const addDays = (key, days) => {
  const date = new Date(`${key}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

const monthLabel = (month) =>
  new Date(`${month}-01T00:00:00Z`).toLocaleDateString(
    "en-GB",
    {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }
  );

const shiftMonth = (month, delta) => {
  const [year, m] = month.split("-").map(Number);
  const date = new Date(Date.UTC(year, m - 1 + delta, 1));
  return date.toISOString().slice(0, 7);
};

const isBlockedDay = (day, periods) =>
  periods.some(({ startDate, endDate }) => {
    // Both start and end dates are unavailable.
    // The customer can keep the equipment until
    // 6:00 PM on the selected end date.
    const start = dateKey(new Date(startDate));
    const end = dateKey(new Date(endDate));

    return day >= start && day <= end;
  });

const periodHasBlockedDay = (start, end, periods) => {
  // Include the selected return date because
  // the equipment remains reserved until 6:00 PM.
  for (
    let day = start;
    day <= end;
    day = addDays(day, 1)
  ) {
    if (isBlockedDay(day, periods)) {
      return true;
    }
  }

  return false;
};

export default function EquipmentDetails() {
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

  // ==========================================
  // IMAGE GALLERY
  // ==========================================

  const [activeImage, setActiveImage] = useState(0);
  const [showImageModal, setShowImageModal] = useState(false);

  // ==========================================
  // RENTAL AVAILABILITY CALENDAR
  // ==========================================

  const [calendar, setCalendar] = useState(null);
  const [calendarLoading, setCalendarLoading] = useState(true);
  const [calendarError, setCalendarError] = useState("");

  const [month, setMonth] = useState(
    todayKey().slice(0, 7)
  );

  // ==========================================
  // RENTAL DATES
  // ==========================================

  const [startDate, setStartDate] = useState(
    location.state?.startDate || ""
  );

  const [endDate, setEndDate] = useState(
    location.state?.endDate || ""
  );

  // ==========================================
  // AVAILABILITY CHECK
  // ==========================================

  const [availability, setAvailability] = useState(null);
  const [availabilityError, setAvailabilityError] = useState("");
  const [checking, setChecking] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [requestMessage, setRequestMessage] = useState("");
  const [requestError, setRequestError] = useState("");

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      getEquipmentById(id),
      getRentalCalendar(id),
    ])
      .then(([equipmentResult, calendarResult]) => {
        if (cancelled) return;

      setEquipment(
        equipmentResult?.equipment ||
        equipmentResult?.data?.equipment ||
        null
      );
        setCalendar(calendarResult?.data || null);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err.response?.data?.message ||
              "Failed to load equipment or rental calendar."
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
          setCalendarLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  // ==========================================
  // IMAGE GALLERY
  // ==========================================

  const images =
    equipment?.images?.length > 0
      ? equipment.images
      : equipment?.imageUrl
        ? [equipment.imageUrl]
        : [];

  // Automatically change gallery images.
  useEffect(() => {
    if (images.length <= 1) return;

    const interval = setInterval(() => {
      setActiveImage((current) =>
        current >= images.length - 1 ? 0 : current + 1
      );
    }, 4000);

    return () => clearInterval(interval);
  }, [images.length]);

  const handlePreviousImage = () => {
    if (images.length === 0) return;

    setActiveImage((current) =>
      current === 0 ? images.length - 1 : current - 1
    );
  };

  const handleNextImage = () => {
    if (images.length === 0) return;

    setActiveImage((current) =>
      current >= images.length - 1 ? 0 : current + 1
    );
  };

  // ==========================================
  // RENTAL AVAILABILITY CALENDAR
  // ==========================================

  const reloadCalendar = async () => {
    setCalendarLoading(true);
    setCalendarError("");

    try {
      const result = await getRentalCalendar(id);
      setCalendar(result?.data || null);
      return result?.data || null;
    } catch (err) {
      setCalendarError(
        err.response?.data?.message ||
          "Could not refresh unavailable dates."
      );
      return null;
    } finally {
      setCalendarLoading(false);
    }
  };

  const resetCheck = () => {
    setAvailability(null);
    setAvailabilityError("");
    setRequestError("");
    setRequestMessage("");
  };

  const selectDay = (day) => {
    if (
      !calendar ||
      calendar.blocked ||
      day < todayKey() ||
      isBlockedDay(
        day,
        calendar.unavailablePeriods || []
      )
    ) {
      return;
    }

    resetCheck();

    if (!startDate || endDate || day <= startDate) {
      setStartDate(day);
      setEndDate("");
      return;
    }

    if (
      periodHasBlockedDay(
        startDate,
        day,
        calendar.unavailablePeriods || []
      )
    ) {
      setAvailabilityError(
        "The selected period crosses unavailable dates. Choose another end date."
      );
      return;
    }

    setEndDate(day);
  };

  // ==========================================
  // CHECK RENTAL AVAILABILITY
  // ==========================================

  const handleCheckAvailability = async () => {
    if (!startDate || !endDate) {
      setAvailabilityError(
        "Please select both start and end dates."
      );
      return;
    }

    if (startDate < todayKey() || startDate >= endDate) {
      setAvailabilityError(
        "Choose a valid rental period with the end date after the start date."
      );
      return;
    }

    if (
      !calendar ||
      calendar.blocked ||
      periodHasBlockedDay(
        startDate,
        endDate,
        calendar.unavailablePeriods || []
      )
    ) {
      setAvailability(null);
      setAvailabilityError(
        "The selected rental period contains unavailable dates. Please choose another period."
      );
      return;
    }

    setChecking(true);
    resetCheck();

    try {
      const result = await checkAvailability({
        equipmentId: id,
        startDate,
        endDate,
      });

      setAvailability(result);

      if (!result?.available) {
        await reloadCalendar();
      }
    } catch (err) {
      setAvailabilityError(
        err.response?.data?.message ||
          "Failed to check equipment availability."
      );
    } finally {
      setChecking(false);
    }
  };

  // ==========================================
  // SUBMIT RENTAL REQUEST
  // ==========================================

  const handleRentalRequest = async () => {
    if (authLoading || requesting) return;

    // Guests must log in before requesting rentals.
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

    // Only customer accounts can submit requests.
    if (user?.role !== "CUSTOMER") {
      setRequestError(
        "Only customer accounts can request equipment rentals."
      );
      return;
    }

    if (
      !startDate ||
      !endDate ||
      !availability?.available
    ) {
      setRequestError(
        "Please select rental dates and check availability first."
      );
      return;
    }

    setRequesting(true);
    setRequestError("");
    setRequestMessage("");

    try {
      // Recheck availability before submitting.
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

        await reloadCalendar();
        return;
      }

      const result = await createRentalRequest({
        equipmentId: id,
        startDate,
        endDate,
      });

      setRequestMessage(
        result?.message ||
          "Rental request submitted successfully."
      );

      setAvailability(null);
      setStartDate("");
      setEndDate("");

      await reloadCalendar();
    } catch (err) {
      setRequestError(
        err.response?.data?.message ||
          "Failed to submit rental request."
      );

      setAvailability(null);
      await reloadCalendar();
    } finally {
      setRequesting(false);
    }
  };

  const firstWeekday = new Date(
    `${month}-01T00:00:00Z`
  ).getUTCDay();

  const daysInMonth = new Date(
    Date.UTC(
      Number(month.slice(0, 4)),
      Number(month.slice(5, 7)),
      0
    )
  ).getUTCDate();

  const days = Array.from(
    { length: firstWeekday + daysInMonth },
    (_, index) =>
      index < firstWeekday
        ? null
        : `${month}-${String(
            index - firstWeekday + 1
          ).padStart(2, "0")}`
  );

  const periods = calendar?.unavailablePeriods || [];

  const inputStyle =
    "rounded-xl border border-gray-300 px-4 py-3";

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

          {/* Page header */}
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
                    Category
                  </p>
                  <p className="mt-1 font-semibold text-gray-900">
                    {equipment.category?.name || "N/A"}
                  </p>
                </div>

                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-xs text-gray-500">
                    Condition
                  </p>
                  <p className="mt-1 font-semibold text-gray-900">
                    {equipment.condition || "N/A"}
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

          {/* =========================================
              RENTAL AVAILABILITY CALENDAR
          ========================================== */}

          <section className="mt-8 rounded-3xl border border-gray-200 bg-white p-7 shadow-sm">
            <div className="mb-6">
              <p className="text-sm font-semibold uppercase tracking-wider text-orange-600">
                Rental Calendar
              </p>

              <h2 className="mt-1 text-2xl font-bold text-gray-950">
                Select Rental Dates
              </h2>

              <p className="mt-2 text-sm text-gray-500">
                Select your start date and then your end date.
                Unavailable and past dates cannot be selected.
              </p>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <button
                type="button"
                aria-label="Previous month"
                disabled={month <= todayKey().slice(0, 7)}
                onClick={() =>
                  setMonth((value) => shiftMonth(value, -1))
                }
                className="rounded-lg border px-3 py-2 disabled:opacity-30"
              >
                ←
              </button>

              <span className="font-semibold">
                {monthLabel(month)}
              </span>

                <button
                  type="button"
                  aria-label="Next month"
                  onClick={() =>
                    setMonth((value) =>
                      shiftMonth(value, 1)
                    )
                  }
                  className="rounded-lg border px-3 py-2"
                >
                  →
                </button>
              </div>

              <div className="mt-4 grid grid-cols-7 gap-1 text-center text-xs">
                {[
                  "Su", "Mo", "Tu", "We",
                  "Th", "Fr", "Sa",
                ].map((day) => (
                  <span
                    key={day}
                    className="py-2 font-semibold text-gray-500"
                  >
                    {day}
                  </span>
                ))}

                {days.map((day, index) => {
                  if (!day) {
                    return (
                      <span
                        key={`blank-${index}`}
                      />
                    );
                  }

                  const past = day < todayKey();
                  const blocked =
                    calendar?.blocked ||
                    isBlockedDay(day, periods);

                  const disabled =
                    calendarLoading ||
                    !calendar ||
                    past ||
                    blocked;

                  const selected =
                    day === startDate ||
                    day === endDate;

                  const between =
                    startDate &&
                    endDate &&
                    day > startDate &&
                    day < endDate;

                  return (
                    <button
                      key={day}
                      type="button"
                      disabled={disabled}
                      onClick={() =>
                        selectDay(day)
                      }
                      title={
                        past
                          ? "Past date"
                          : blocked
                          ? "Unavailable"
                          : "Available"
                      }
                      className={`rounded-lg py-2 text-sm ${
                        selected
                          ? "bg-orange-600 font-bold text-white"
                          : between
                          ? "bg-orange-100 text-orange-800"
                          : disabled
                          ? "bg-gray-100 text-gray-400 line-through"
                          : "bg-white text-gray-900 hover:bg-orange-50"
                      } ${
                        disabled
                          ? "cursor-not-allowed"
                          : "cursor-pointer"
                      }`}
                    >
                      {Number(day.slice(-2))}
                    </button>
                  );
                })}
              </div>

              <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-500">
                <span>■ Available</span>
                <span className="text-gray-400">
                  ■ Unavailable / past
                </span>
                <span className="text-orange-600">
                  ■ Selected
                </span>
              </div>

              {calendar?.message && (
                <p className="mt-3 text-sm font-medium text-red-700">
                  {calendar.message}
                </p>
              )}

              {calendarError && (
                <p className="mt-3 text-sm text-red-700">
                  {calendarError}
                </p>
              )}

              <button
                type="button"
                onClick={reloadCalendar}
                disabled={calendarLoading}
                className="mt-3 text-sm font-semibold text-orange-700 underline disabled:opacity-50"
              >
                Refresh unavailable dates
              </button>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="text-sm font-medium text-gray-700">
                  Start Date
                  <input
                    type="text"
                    readOnly
                    value={startDate}
                    placeholder="Select on calendar"
                    className={`mt-2 w-full ${inputStyle}`}
                  />
                </label>

                <label className="text-sm font-medium text-gray-700">
                  End Date
                  <input
                    type="text"
                    readOnly
                    value={endDate}
                    placeholder="Select on calendar"
                    className={`mt-2 w-full ${inputStyle}`}
                  />
                </label>
              </div>

              <button
                type="button"
                onClick={() => {
                  setStartDate("");
                  setEndDate("");
                  resetCheck();
                }}
                className="mt-3 text-sm font-semibold text-gray-600 underline"
              >
                Clear selection
              </button>

              <button
                type="button"
                onClick={handleCheckAvailability}
                disabled={
                  checking ||
                  calendarLoading ||
                  !calendar ||
                  calendar.blocked ||
                  !startDate ||
                  !endDate
                }
                className="mt-4 w-full rounded-xl bg-gray-950 px-4 py-3 font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
              >
                {checking
                  ? "Checking..."
                  : "Check Availability"}
              </button>

              {availabilityError && (
                <p className="mt-4 text-sm text-red-600">
                  {availabilityError}
                </p>
              )}

              {availability && (
                <p
                  className={`mt-4 rounded-xl p-4 text-sm ${
                    availability.available
                      ? "bg-green-50 text-green-700"
                      : "bg-red-50 text-red-700"
                  }`}
                >
                  {availability.message ||
                    (availability.available
                      ? "Equipment is available."
                      : "Equipment is unavailable.")}
                </p>
              )}

              {availability?.available && (
                <button
                  type="button"
                  onClick={handleRentalRequest}
                  disabled={requesting}
                  className="mt-4 w-full rounded-xl bg-orange-600 px-4 py-3 font-semibold text-white hover:bg-orange-700 disabled:opacity-50"
                >
                  {requesting
                    ? "Submitting Request..."
                    : "Request Rental"}
                </button>
              )}

              {requestMessage && (
                <p className="mt-4 rounded-xl bg-green-50 p-4 text-sm text-green-700">
                  {requestMessage}
                </p>
              )}
              
              {requestError && (
                <p className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-700">
                  {requestError}
                </p>
              )}
          </section>
        </div>
      </main>
      
      {/* =========================================
          FULLSCREEN IMAGE VIEWER
      ========================================== */}

      {showImageModal && currentImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-5"
          onClick={() => setShowImageModal(false)}
          role="presentation"
        >
          <button
            type="button"
            aria-label="Close image viewer"
            onClick={() => setShowImageModal(false)}
            className="absolute right-6 top-6 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-2xl text-white transition hover:bg-white/20"
          >
            ×
          </button>

          {images.length > 1 && (
            <button
              type="button"
              aria-label="Previous image"
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
              aria-label="Next image"
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
}

