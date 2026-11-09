
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

// ============================================================
// DATE HELPERS - SRI LANKA TIME
// ============================================================

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

const shiftMonth = (month, delta) => {
  const [year, number] = month.split("-").map(Number);
  return new Date(
    Date.UTC(year, number - 1 + delta, 1)
  )
    .toISOString()
    .slice(0, 7);
};

const monthLabel = (month) =>
  new Date(`${month}-01T00:00:00Z`).toLocaleDateString(
    "en-GB",
    { month: "long", year: "numeric", timeZone: "UTC" }
  );

const displayDate = (key) => {
  if (!key) return "Not selected";

  return new Date(`${key}T00:00:00Z`).toLocaleDateString(
    "en-GB",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    }
  );
};

const rentalDays = (start, end) => {
  if (!start || !end || end <= start) return 0;

  const difference =
    Date.parse(`${end}T00:00:00Z`) -
    Date.parse(`${start}T00:00:00Z`);

  return Math.round(difference / 86400000);
};

const isBlockedDay = (day, periods) =>
  periods.some(({ startDate, endDate }) => {
    const start = dateKey(new Date(startDate));
    const end = dateKey(new Date(endDate));

    // Both dates are unavailable, including the return date.
    return day >= start && day <= end;
  });

const periodHasBlockedDay = (start, end, periods) => {
  for (
    let day = start;
    day <= end;
    day = addDays(day, 1)
  ) {
    if (isBlockedDay(day, periods)) return true;
  }

  return false;
};

const formatMoney = (value) => {
  const amount = Number(value);

  if (!Number.isFinite(amount)) return "LKR —";

  return `LKR ${amount.toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const getStatusStyle = (status) => {
  switch (status) {
    case "AVAILABLE":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "RESERVED":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "RENTED":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "MAINTENANCE":
      return "border-orange-200 bg-orange-50 text-orange-700";
    case "DAMAGED":
      return "border-red-200 bg-red-50 text-red-700";
    default:
      return "border-gray-200 bg-gray-100 text-gray-700";
  }
};

// ============================================================
// REUSABLE UI
// ============================================================

const SectionHeading = ({ eyebrow, title, description }) => (
  <div>
    {eyebrow && (
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-orange-600">
        {eyebrow}
      </p>
    )}

    <h2 className="mt-1 text-xl font-bold tracking-tight text-gray-950 sm:text-2xl">
      {title}
    </h2>

    {description && (
      <p className="mt-2 text-sm leading-6 text-gray-500">
        {description}
      </p>
    )}
  </div>
);

const DetailRow = ({ label, value }) => (
  <div className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 py-3.5 last:border-b-0">
    <span className="text-sm text-gray-500">{label}</span>
    <span className="max-w-[65%] break-words text-right text-sm font-semibold text-gray-900">
      {value || "Not specified"}
    </span>
  </div>
);

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function EquipmentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const {
    user,
    isAuthenticated,
    loading: authLoading,
  } = useAuth();

  // Equipment
  const [equipment, setEquipment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Gallery
  const [activeImage, setActiveImage] = useState(0);
  const [showImageModal, setShowImageModal] = useState(false);

  // Calendar
  const [calendar, setCalendar] = useState(null);
  const [calendarLoading, setCalendarLoading] = useState(true);
  const [calendarError, setCalendarError] = useState("");

  const [month, setMonth] = useState(
    todayKey().slice(0, 7)
  );

  // Rental dates
  const [startDate, setStartDate] = useState(
    location.state?.startDate || ""
  );

  const [endDate, setEndDate] = useState(
    location.state?.endDate || ""
  );

  // Availability and request
  const [availability, setAvailability] = useState(null);
  const [availabilityError, setAvailabilityError] = useState("");
  const [checking, setChecking] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [requestMessage, setRequestMessage] = useState("");
  const [requestError, setRequestError] = useState("");

  // Description expansion
  const [descriptionExpanded, setDescriptionExpanded] =
    useState(false);

  // ============================================================
  // LOAD EQUIPMENT AND CALENDAR
  // ============================================================

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
        if (cancelled) return;

        setError(
          err.response?.data?.message ||
            "Failed to load equipment or rental calendar."
        );
      })
      .finally(() => {
        if (cancelled) return;

        setLoading(false);
        setCalendarLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  // ============================================================
  // GALLERY
  // ============================================================

  const images =
    equipment?.images?.length > 0
      ? equipment.images
      : equipment?.imageUrl
        ? [equipment.imageUrl]
        : [];

  useEffect(() => {
    if (images.length <= 1 || showImageModal) return;

    const interval = setInterval(() => {
      setActiveImage((current) =>
        current >= images.length - 1 ? 0 : current + 1
      );
    }, 5000);

    return () => clearInterval(interval);
  }, [images.length, showImageModal]);

  const handlePreviousImage = () => {
    if (!images.length) return;

    setActiveImage((current) =>
      current === 0 ? images.length - 1 : current - 1
    );
  };

  const handleNextImage = () => {
    if (!images.length) return;

    setActiveImage((current) =>
      current >= images.length - 1 ? 0 : current + 1
    );
  };

  // ============================================================
  // CALENDAR REFRESH
  // ============================================================

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

  // ============================================================
  // DATE SELECTION
  // ============================================================

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
        "Your selected period crosses unavailable dates. Please choose another end date."
      );
      return;
    }

    setEndDate(day);
  };

  const clearDates = () => {
    setStartDate("");
    setEndDate("");
    resetCheck();
  };

  // ============================================================
  // CHECK AVAILABILITY
  // ============================================================

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
        "The selected rental period contains unavailable dates."
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

  // ============================================================
  // SUBMIT RENTAL REQUEST
  // ============================================================

  const handleRentalRequest = async () => {
    if (authLoading || requesting) return;

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
      const latestAvailability = await checkAvailability({
        equipmentId: id,
        startDate,
        endDate,
      });

      setAvailability(latestAvailability);

      if (!latestAvailability?.available) {
        setRequestError(
          latestAvailability?.message ||
            "Equipment is no longer available for these dates."
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

  // ============================================================
  // CALENDAR DATA
  // ============================================================

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

  const numberOfDays = rentalDays(startDate, endDate);

  const dailyRate = Number(
    equipment?.rentalPricePerDay || 0
  );

  const securityDeposit = Number(
    equipment?.securityDeposit || 0
  );

  // Illustrative frontend estimate only.
  // The backend invoice remains authoritative.
  const estimatedRentalCharge = numberOfDays * dailyRate;

  const estimatedTotal =
    estimatedRentalCharge + securityDeposit;

  const currentImage = images[activeImage] || images[0];

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-7xl animate-pulse">
          <div className="h-7 w-40 rounded bg-gray-200" />
          <div className="mt-5 h-12 w-80 max-w-full rounded bg-gray-200" />

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <div className="h-[420px] rounded-3xl bg-gray-200" />
            <div className="h-[420px] rounded-3xl bg-gray-200" />
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-10">
        <div className="mx-auto max-w-7xl">
          <div
            role="alert"
            className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700"
          >
            {error}
          </div>

          <button
            type="button"
            onClick={() => navigate("/customer/equipment")}
            className="mt-5 font-semibold text-orange-600"
          >
            ← Back to Equipment
          </button>
        </div>
      </main>
    );
  }

  if (!equipment) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-10">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-2xl font-bold">
            Equipment not found
          </h1>

          <button
            type="button"
            onClick={() => navigate("/customer/equipment")}
            className="mt-4 font-semibold text-orange-600"
          >
            Browse Equipment
          </button>
        </div>
      </main>
    );
  }

  // ============================================================
  // PAGE
  // ============================================================

  return (
    <>
      <main className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:py-10">
        <div className="mx-auto max-w-7xl">
          {/* BREADCRUMB */}
          <nav
            aria-label="Breadcrumb"
            className="mb-6 flex flex-wrap items-center gap-2 text-sm"
          >
            <button
              type="button"
              onClick={() => navigate("/customer/equipment")}
              className="font-medium text-gray-500 hover:text-orange-600"
            >
              Equipment
            </button>

            <span className="text-gray-300">/</span>

            <span className="text-gray-500">
              {equipment.category?.name || "Equipment"}
            </span>

            <span className="text-gray-300">/</span>

            <span className="font-semibold text-gray-900">
              {equipment.name}
            </span>
          </nav>

          {/* HEADER */}
          <div className="mb-7">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-600">
              Professional Equipment Rental
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl">
              {equipment.name}
            </h1>

            <p className="mt-2 text-sm text-gray-500 sm:text-base">
              {[equipment.brand, equipment.model]
                .filter(Boolean)
                .join(" ")}
            </p>
          </div>

          {/* ====================================================
              MAIN PRODUCT LAYOUT
          ==================================================== */}

          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
            {/* IMAGE GALLERY */}
            <section className="min-w-0 rounded-3xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="relative">
                <button
                  type="button"
                  disabled={!currentImage}
                  onClick={() => setShowImageModal(true)}
                  aria-label="Enlarge equipment image"
                  className="group relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-2xl bg-gray-100 disabled:cursor-default"
                >
                  {currentImage ? (
                    <img
                      src={currentImage}
                      alt={equipment.name}
                      className="h-full w-full object-contain p-4 transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex flex-col items-center text-gray-400">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        className="h-16 w-16"
                        aria-hidden="true"
                      >
                        <path d="M4 7h4l2-2h4l2 2h4v12H4V7Z" />
                        <circle cx="12" cy="13" r="3" />
                      </svg>

                      <span className="mt-3 text-sm">
                        Image unavailable
                      </span>
                    </div>
                  )}

                  {currentImage && (
                    <span className="absolute bottom-4 right-4 rounded-full bg-gray-950/80 px-3 py-2 text-xs font-medium text-white">
                      View larger image
                    </span>
                  )}
                </button>

                <span
                  className={`absolute left-4 top-4 rounded-full border px-3 py-1.5 text-xs font-bold ${getStatusStyle(
                    equipment.status
                  )}`}
                >
                  {equipment.status || "UNKNOWN"}
                </span>

                {images.length > 1 && (
                  <>
                    <button
                      type="button"
                      aria-label="Previous image"
                      onClick={handlePreviousImage}
                      className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white text-2xl text-gray-800 shadow-md transition hover:bg-orange-50"
                    >
                      ‹
                    </button>

                    <button
                      type="button"
                      aria-label="Next image"
                      onClick={handleNextImage}
                      className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white text-2xl text-gray-800 shadow-md transition hover:bg-orange-50"
                    >
                      ›
                    </button>
                  </>
                )}
              </div>

              {/* THUMBNAILS */}
              {images.length > 1 && (
                <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
                  {images.map((image, index) => (
                    <button
                      key={`${image}-${index}`}
                      type="button"
                      aria-label={`View image ${index + 1}`}
                      aria-pressed={activeImage === index}
                      onClick={() => setActiveImage(index)}
                      className={`h-20 w-24 shrink-0 overflow-hidden rounded-xl border-2 bg-gray-50 p-1 transition ${
                        activeImage === index
                          ? "border-orange-500 ring-2 ring-orange-100"
                          : "border-gray-200 hover:border-gray-400"
                      }`}
                    >
                      <img
                        src={image}
                        alt={`${equipment.name} view ${index + 1}`}
                        className="h-full w-full object-contain"
                      />
                    </button>
                  ))}
                </div>
              )}

              <p className="mt-4 text-xs text-gray-400">
                {images.length > 1
                  ? `${images.length} equipment photos available`
                  : "Equipment photo"}
              </p>
            </section>

            {/* PRODUCT INFORMATION */}
            <section className="min-w-0 rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-gray-600">
                  {equipment.category?.name || "Equipment"}
                </span>

                <span
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${getStatusStyle(
                    equipment.status
                  )}`}
                >
                  {equipment.status || "UNKNOWN"}
                </span>
              </div>

              <h2 className="mt-5 text-2xl font-bold text-gray-950">
                {equipment.name}
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                {[equipment.brand, equipment.model]
                  .filter(Boolean)
                  .join(" ")}
              </p>

              {/* PRICING */}
              <div className="mt-6 rounded-2xl border border-orange-100 bg-orange-50/60 p-5">
                <p className="text-sm font-medium text-gray-600">
                  Rental price
                </p>

                <div className="mt-1 flex flex-wrap items-baseline gap-2">
                  <span className="text-3xl font-bold tracking-tight text-orange-600 sm:text-4xl">
                    {formatMoney(equipment.rentalPricePerDay)}
                  </span>

                  <span className="text-sm text-gray-500">
                    / day
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-orange-100 pt-4">
                  <span className="text-sm text-gray-600">
                    Security deposit
                  </span>

                  <span className="text-sm font-bold text-gray-900">
                    {formatMoney(equipment.securityDeposit)}
                  </span>
                </div>

                <p className="mt-2 text-xs leading-5 text-gray-500">
                  The security deposit is separate from rental
                  charges and is subject to the rental agreement
                  and return inspection.
                </p>
              </div>

              {/* DESCRIPTION */}
              <div className="mt-6">
                <h3 className="text-base font-bold text-gray-950">
                  About this equipment
                </h3>

                <p
                  className={`mt-3 whitespace-pre-line text-sm leading-7 text-gray-600 ${
                    descriptionExpanded ? "" : "line-clamp-5"
                  }`}
                >
                  {equipment.description ||
                    "No additional description is available for this equipment."}
                </p>

                {equipment.description?.length > 250 && (
                  <button
                    type="button"
                    onClick={() =>
                      setDescriptionExpanded((value) => !value)
                    }
                    className="mt-2 text-sm font-semibold text-orange-600 hover:text-orange-700"
                  >
                    {descriptionExpanded
                      ? "Show less"
                      : "Read full description"}
                  </button>
                )}
              </div>

              {/* QUICK DETAILS */}
              <div className="mt-6 grid grid-cols-2 gap-3">
                {[
                  ["Brand", equipment.brand],
                  ["Model", equipment.model],
                  [
                    "Category",
                    equipment.category?.name,
                  ],
                  ["Condition", equipment.condition],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="min-w-0 rounded-xl border border-gray-100 bg-gray-50 p-3.5"
                  >
                    <p className="text-xs text-gray-500">
                      {label}
                    </p>

                    <p className="mt-1 break-words text-sm font-semibold text-gray-900">
                      {value || "Not specified"}
                    </p>
                  </div>
                ))}
              </div>

              <a
                href="#rental-booking"
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gray-950 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-orange-600"
              >
                Check Dates & Availability
                <span aria-hidden="true">↓</span>
              </a>
            </section>
          </div>

          {/* ====================================================
              SPECIFICATIONS
          ==================================================== */}

          <section className="mt-7 rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
            <SectionHeading
              eyebrow="Product Information"
              title="Equipment Specifications"
              description="Review the equipment details before choosing your rental dates."
            />

            <div className="mt-5 grid gap-x-10 md:grid-cols-2">
              <div>
                <DetailRow
                  label="Equipment Name"
                  value={equipment.name}
                />

                <DetailRow
                  label="Brand"
                  value={equipment.brand}
                />

                <DetailRow
                  label="Model"
                  value={equipment.model}
                />
              </div>

              <div>
                <DetailRow
                  label="Category"
                  value={equipment.category?.name}
                />

                <DetailRow
                  label="Condition"
                  value={equipment.condition}
                />

                <DetailRow
                  label="Availability Status"
                  value={equipment.status}
                />
              </div>
            </div>
          </section>

          {/* ====================================================
              RENTAL BOOKING
          ==================================================== */}

          <section
            id="rental-booking"
            className="mt-7 scroll-mt-24"
          >
            <div className="mb-5">
              <SectionHeading
                eyebrow="Rental Booking"
                title="Choose Your Rental Dates"
                description="Select your rental period, check availability, and submit your rental request."
              />
            </div>

            <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
              {/* CALENDAR CARD */}
              <div className="min-w-0 rounded-3xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-gray-950">
                      Availability Calendar
                    </h3>

                    <p className="mt-1 text-xs text-gray-500">
                      Select the start date, then the end date.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={reloadCalendar}
                    disabled={calendarLoading}
                    className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 transition hover:bg-gray-50 disabled:opacity-50"
                  >
                    {calendarLoading ? "Loading..." : "Refresh"}
                  </button>
                </div>

                {/* MONTH NAVIGATION */}
                <div className="mt-6 flex items-center justify-between rounded-xl bg-gray-50 p-2">
                  <button
                    type="button"
                    aria-label="Previous month"
                    disabled={
                      month <= todayKey().slice(0, 7)
                    }
                    onClick={() =>
                      setMonth((value) =>
                        shiftMonth(value, -1)
                      )
                    }
                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-xl text-gray-700 hover:bg-orange-50 disabled:opacity-30"
                  >
                    ‹
                  </button>

                  <span className="text-base font-bold text-gray-950">
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
                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-xl text-gray-700 hover:bg-orange-50"
                  >
                    ›
                  </button>
                </div>

                {/* CALENDAR GRID */}
                <div className="mt-5 grid grid-cols-7 gap-1.5 text-center sm:gap-2">
                  {[
                    "Sun",
                    "Mon",
                    "Tue",
                    "Wed",
                    "Thu",
                    "Fri",
                    "Sat",
                  ].map((day) => (
                    <span
                      key={day}
                      className="py-2 text-xs font-bold text-gray-500"
                    >
                      {day}
                    </span>
                  ))}

                  {days.map((day, index) => {
                    if (!day) {
                      return (
                        <span key={`blank-${index}`} />
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

                    const isToday = day === todayKey();

                    return (
                      <button
                        key={day}
                        type="button"
                        disabled={disabled}
                        onClick={() => selectDay(day)}
                        aria-pressed={Boolean(selected)}
                        aria-label={`${displayDate(day)}${
                          disabled
                            ? ", unavailable"
                            : selected
                              ? ", selected"
                              : ", available"
                        }`}
                        title={
                          past
                            ? "Past date"
                            : blocked
                              ? "Unavailable"
                              : "Available"
                        }
                        className={`relative flex aspect-square min-h-9 items-center justify-center rounded-xl text-sm font-semibold transition sm:min-h-11 ${
                          selected
                            ? "bg-orange-600 text-white shadow-sm"
                            : between
                              ? "bg-orange-100 text-orange-800"
                              : disabled
                                ? "cursor-not-allowed bg-gray-100 text-gray-400 line-through"
                                : "bg-white text-gray-800 hover:bg-orange-50 hover:text-orange-600"
                        } ${
                          isToday && !selected
                            ? "ring-1 ring-orange-300"
                            : ""
                        }`}
                      >
                        {Number(day.slice(-2))}
                      </button>
                    );
                  })}
                </div>

                {/* LEGEND */}
                <div className="mt-6 flex flex-wrap gap-x-5 gap-y-3 border-t border-gray-100 pt-5 text-xs text-gray-600">
                  <span className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded bg-white ring-1 ring-gray-300" />
                    Available
                  </span>

                  <span className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded bg-gray-200" />
                    Unavailable / Past
                  </span>

                  <span className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded bg-orange-600" />
                    Selected
                  </span>

                  <span className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded bg-orange-100" />
                    Selected range
                  </span>
                </div>

                {calendar?.message && (
                  <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
                    {calendar.message}
                  </p>
                )}

                {calendarError && (
                  <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
                    {calendarError}
                  </p>
                )}
              </div>

              {/* BOOKING SUMMARY CARD */}
              <div className="min-w-0 rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
                <h3 className="text-lg font-bold text-gray-950">
                  Your Rental Summary
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                  Review your selected rental period and
                  estimated charges.
                </p>

                {/* DATES */}
                <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <p className="text-xs font-medium text-gray-500">
                      Start Date
                    </p>

                    <p className="mt-2 text-sm font-bold text-gray-950">
                      {displayDate(startDate)}
                    </p>
                  </div>

                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <p className="text-xs font-medium text-gray-500">
                      End Date
                    </p>

                    <p className="mt-2 text-sm font-bold text-gray-950">
                      {displayDate(endDate)}
                    </p>
                  </div>
                </div>

                {(startDate || endDate) && (
                  <button
                    type="button"
                    onClick={clearDates}
                    className="mt-3 text-xs font-semibold text-orange-600 hover:underline"
                  >
                    Clear selected dates
                  </button>
                )}

                {/* COST BREAKDOWN */}
                <div className="mt-6 rounded-2xl bg-gray-50 p-4">
                  <h4 className="text-sm font-bold text-gray-900">
                    Estimated Cost
                  </h4>

                  <div className="mt-4 space-y-3">
                    <div className="flex justify-between gap-3 text-sm">
                      <span className="text-gray-500">
                        Daily rental rate
                      </span>

                      <span className="font-semibold text-gray-900">
                        {formatMoney(dailyRate)}
                      </span>
                    </div>

                    <div className="flex justify-between gap-3 text-sm">
                      <span className="text-gray-500">
                        Rental duration
                      </span>

                      <span className="font-semibold text-gray-900">
                        {numberOfDays > 0
                          ? `${numberOfDays} day${
                              numberOfDays !== 1 ? "s" : ""
                            }`
                          : "Select dates"}
                      </span>
                    </div>

                    <div className="flex justify-between gap-3 text-sm">
                      <span className="text-gray-500">
                        Estimated rental charge
                      </span>

                      <span className="font-semibold text-gray-900">
                        {numberOfDays > 0
                          ? formatMoney(estimatedRentalCharge)
                          : "—"}
                      </span>
                    </div>

                    <div className="flex justify-between gap-3 text-sm">
                      <span className="text-gray-500">
                        Security deposit
                      </span>

                      <span className="font-semibold text-gray-900">
                        {formatMoney(securityDeposit)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3 border-t border-gray-200 pt-4">
                    <span className="text-sm font-bold text-gray-950">
                      Estimated total
                    </span>

                    <span className="text-lg font-bold text-orange-600">
                      {numberOfDays > 0
                        ? formatMoney(estimatedTotal)
                        : "—"}
                    </span>
                  </div>

                  <p className="mt-3 text-xs leading-5 text-gray-500">
                    This is an indicative estimate using
                    the daily rate and date difference.
                    Final charges, rental-day rules,
                    and deposit amounts are determined
                    by the backend invoice.
                  </p>
                </div>

                {/* AVAILABILITY ACTION */}
                <button
                  type="button"
                  onClick={handleCheckAvailability}
                  disabled={
                    checking ||
                    requesting ||
                    calendarLoading ||
                    !calendar ||
                    calendar.blocked ||
                    !startDate ||
                    !endDate
                  }
                  className="mt-5 w-full rounded-xl bg-gray-950 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {checking
                    ? "Checking Availability..."
                    : "Check Availability"}
                </button>

                <p className="mt-3 text-center text-xs text-gray-500">
                  Availability must be verified before requesting.
                </p>

                {/* ERRORS */}
                {availabilityError && (
                  <p
                    role="alert"
                    className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                  >
                    {availabilityError}
                  </p>
                )}

                {/* AVAILABILITY RESULT */}
                {availability && (
                  <div
                    role="status"
                    className={`mt-4 rounded-xl border p-4 text-sm ${
                      availability.available
                        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                        : "border-red-200 bg-red-50 text-red-700"
                    }`}
                  >
                    <p className="font-bold">
                      {availability.available
                        ? "Available for selected dates"
                        : "Unavailable for selected dates"}
                    </p>

                    <p className="mt-1">
                      {availability.message ||
                        (availability.available
                          ? "You can proceed with your rental request."
                          : "Please choose another rental period.")}
                    </p>
                  </div>
                )}

                {/* REQUEST ACTION */}
                {availability?.available && (
                  <button
                    type="button"
                    onClick={handleRentalRequest}
                    disabled={requesting || authLoading}
                    className="mt-4 w-full rounded-xl bg-orange-600 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {requesting
                      ? "Submitting Request..."
                      : !isAuthenticated
                        ? "Login to Request Rental"
                        : "Request Rental"}
                  </button>
                )}

                {requestMessage && (
                  <p
                    role="status"
                    className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
                  >
                    {requestMessage}
                  </p>
                )}

                {requestError && (
                  <p
                    role="alert"
                    className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                  >
                    {requestError}
                  </p>
                )}

                <div className="mt-5 border-t border-gray-100 pt-4">
                  <p className="text-xs leading-5 text-gray-500">
                    Rental requests are subject to approval.
                    Submitting a request does not automatically
                    confirm the booking.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* ====================================================
          FULLSCREEN IMAGE VIEWER
      ==================================================== */}

      {showImageModal && currentImage && (
        <div
          role="presentation"
          onClick={() => setShowImageModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4"
        >
          <button
            type="button"
            aria-label="Close image viewer"
            onClick={() => setShowImageModal(false)}
            className="absolute right-5 top-5 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-2xl text-white hover:bg-white/25"
          >
            ×
          </button>

          {images.length > 1 && (
            <button
              type="button"
              aria-label="Previous image"
              onClick={(event) => {
                event.stopPropagation();
                handlePreviousImage();
              }}
              className="absolute left-3 top-1/2 z-20 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-3xl text-white hover:bg-white/25"
            >
              ‹
            </button>
          )}

          <img
            src={currentImage}
            alt={equipment.name}
            onClick={(event) => event.stopPropagation()}
            className="max-h-[88vh] max-w-[90vw] object-contain"
          />

          {images.length > 1 && (
            <button
              type="button"
              aria-label="Next image"
              onClick={(event) => {
                event.stopPropagation();
                handleNextImage();
              }}
              className="absolute right-3 top-1/2 z-20 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-3xl text-white hover:bg-white/25"
            >
              ›
            </button>
          )}

          {images.length > 1 && (
            <span className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-white/15 px-4 py-2 text-xs font-medium text-white">
              {activeImage + 1} / {images.length}
            </span>
          )}
        </div>
      )}
    </>
  );
}
