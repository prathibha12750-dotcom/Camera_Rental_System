
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getEquipmentById } from "../../services/equipmentService";
import {
  checkAvailability,
  createRentalRequest,
  getRentalCalendar,
} from "../../services/rentalService";

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
    // Rental intervals are [startDate, endDate).
    const start = dateKey(new Date(startDate));
    const end = dateKey(new Date(endDate));
    return day >= start && day < end;
  });

const periodHasBlockedDay = (start, end, periods) => {
  for (let day = start; day < end; day = addDays(day, 1)) {
    if (isBlockedDay(day, periods)) return true;
  }
  return false;
};

export default function EquipmentDetails() {
  const { id } = useParams();

  const [equipment, setEquipment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [calendar, setCalendar] = useState(null);
  const [calendarLoading, setCalendarLoading] =
    useState(true);
  const [calendarError, setCalendarError] = useState("");
  const [month, setMonth] = useState(
    todayKey().slice(0, 7)
  );

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [availability, setAvailability] = useState(null);
  const [availabilityError, setAvailabilityError] =
    useState("");
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
          equipmentResult?.data?.equipment || null
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

  const handleCheckAvailability = async () => {
    if (!startDate || !endDate) {
      setAvailabilityError(
        "Select both a start date and an end date."
      );
      return;
    }

    if (
      startDate < todayKey() ||
      startDate >= endDate
    ) {
      setAvailabilityError(
        "Choose a future rental period with the end date after the start date."
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
          "Failed to check availability."
      );
    } finally {
      setChecking(false);
    }
  };

  const handleRentalRequest = async () => {
    if (!availability?.available || requesting) return;

    setRequesting(true);
    setRequestError("");
    setRequestMessage("");

    try {
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
      <main className="p-8 text-gray-600">
        Loading equipment details and calendar...
      </main>
    );
  }

  if (error) {
    return (
      <main className="p-8 text-red-700">{error}</main>
    );
  }

  if (!equipment) {
    return (
      <main className="p-8">
        Equipment not found.
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <p className="text-sm font-semibold uppercase tracking-wider text-orange-600">
          Equipment Rental
        </p>

        <h1 className="mt-2 text-3xl font-bold text-gray-950">
          {equipment.name}
        </h1>

        <p className="mt-2 text-gray-600">
          {equipment.brand} {equipment.model}
        </p>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-950">
              Equipment Information
            </h2>

            <div className="mt-5 space-y-3 text-sm">
              <p>
                <strong>Category:</strong>{" "}
                {equipment.category?.name || "N/A"}
              </p>
              <p>
                <strong>Brand:</strong> {equipment.brand}
              </p>
              <p>
                <strong>Model:</strong> {equipment.model}
              </p>
              <p>
                <strong>Condition:</strong>{" "}
                {equipment.condition}
              </p>
              <p>
                <strong>Status:</strong>{" "}
                {equipment.status}
              </p>
              <p>
                <strong>Security Deposit:</strong> LKR{" "}
                {Number(
                  equipment.securityDeposit || 0
                ).toLocaleString()}
              </p>
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-950">
              Rental Information
            </h2>

            <p className="mt-5 text-sm text-gray-500">
              Rental price
            </p>

            <p className="text-3xl font-bold text-orange-600">
              LKR{" "}
              {Number(
                equipment.rentalPricePerDay || 0
              ).toLocaleString()}{" "}
              <span className="text-base font-normal text-gray-500">
                / day
              </span>
            </p>

            <p className="mt-6 text-sm leading-6 text-gray-600">
              {equipment.description ||
                "No description available."}
            </p>

            <div className="mt-6 border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-950">
                Select Rental Dates
              </h3>

              <p className="mt-2 text-sm text-gray-500">
                Select the start date, then select an
                end date. Unavailable and past dates
                cannot be selected.
              </p>

              <div className="mt-4 flex items-center justify-between">
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
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
