
const COLOMBO_OFFSET = "+05:30";

const RETURN_CLOSING_TIME = "18:00:00";

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

// Validate a calendar date such as 2026-10-22.
const isValidDateKey = (value) => {
  if (
    typeof value !== "string" ||
    !DATE_ONLY_PATTERN.test(value)
  ) {
    return false;
  }

  const parsed = new Date(`${value}T00:00:00Z`);

  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value
  );
};

// Convert a date key to the beginning of that
// calendar day in Sri Lanka.
const getRentalStartDate = (dateKey) => {
  if (!isValidDateKey(dateKey)) {
    throw new Error("Invalid rental start date");
  }

  return new Date(
    `${dateKey}T00:00:00${COLOMBO_OFFSET}`
  );
};

// Convert the selected end date to the shop's
// closing time in Sri Lanka.
const getRentalReturnDeadline = (dateKey) => {
  if (!isValidDateKey(dateKey)) {
    throw new Error("Invalid rental end date");
  }

  return new Date(
    `${dateKey}T${RETURN_CLOSING_TIME}${COLOMBO_OFFSET}`
  );
};

// Get the Sri Lankan calendar date as YYYY-MM-DD.
const getColomboDateKey = (date) => {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Colombo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const value = (type) =>
    parts.find((part) => part.type === type)?.value;

  return `${value("year")}-${value("month")}-${value("day")}`;
};

// Count billable rental days from selected
// calendar dates, not elapsed hours.
const getRentalDayCount = (startKey, endKey) => {
  if (
    !isValidDateKey(startKey) ||
    !isValidDateKey(endKey)
  ) {
    throw new Error("Invalid rental dates");
  }

  const start = new Date(`${startKey}T00:00:00Z`);
  const end = new Date(`${endKey}T00:00:00Z`);

  const millisecondsPerDay = 24 * 60 * 60 * 1000;

  const days = Math.round(
    (end.getTime() - start.getTime()) /
      millisecondsPerDay
  );

  if (days <= 0) {
    throw new Error(
      "Rental end date must be after start date"
    );
  }

  return days;
};

module.exports = {
  isValidDateKey,
  getRentalStartDate,
  getRentalReturnDeadline,
  getColomboDateKey,
  getRentalDayCount,
};
