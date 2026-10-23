
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

const roundCurrency = (amount) =>
  Math.round((amount + Number.EPSILON) * 100) / 100;

/**
 * Calculate the overdue penalty for a rental.
 *
 * The rental's endDate must already contain
 * the agreed 6:00 PM Asia/Colombo deadline.
 *
 * This function only calculates amounts.
 * It does not modify MongoDB or deduct deposits.
 */
const calculateOverduePenalty = (
  rental,
  asOf = new Date()
) => {
  const noPenalty = {
    applicable: false,
    overdueDays: 0,
    overduePenaltyPerDay: 0,
    overduePenaltyAmount: 0,
  };

  if (!rental) {
    return noPenalty;
  }

  // Only rentals with a saved penalty snapshot
  // are eligible for automatic penalty calculation.
  const savedRate = rental.overduePenaltyRate;
  const savedPerDay = rental.overduePenaltyPerDay;

  if (
    savedRate == null ||
    savedPerDay == null
  ) {
    return noPenalty;
  }

  const rate = Number(savedRate);
  const penaltyPerDay = Number(savedPerDay);

  if (
    !Number.isFinite(rate) ||
    rate < 0 ||
    rate > 100 ||
    !Number.isFinite(penaltyPerDay) ||
    penaltyPerDay < 0
  ) {
    return noPenalty;
  }

  // An unissued rental must not incur a penalty.
  if (!rental.issuedAt) {
    return noPenalty;
  }

  // Only active or physically returned rentals
  // can be evaluated.
  if (
    !["ACTIVE", "RETURNED", "COMPLETED"].includes(
      rental.status
    )
  ) {
    return noPenalty;
  }

  const deadline = new Date(rental.endDate);

  if (Number.isNaN(deadline.getTime())) {
    return noPenalty;
  }

  // Once returned, freeze the calculation at
  // the actual recorded return time.
  const calculationTime =
    rental.returnedAt
      ? new Date(rental.returnedAt)
      : new Date(asOf);

  if (Number.isNaN(calculationTime.getTime())) {
    return noPenalty;
  }

  const millisecondsOverdue =
    calculationTime.getTime() - deadline.getTime();

  if (millisecondsOverdue <= 0) {
    return {
      ...noPenalty,
      overduePenaltyPerDay: penaltyPerDay,
    };
  }

  const overdueDays = Math.ceil(
    millisecondsOverdue / MILLISECONDS_PER_DAY
  );

  const overduePenaltyAmount = roundCurrency(
    overdueDays * penaltyPerDay
  );

  return {
    applicable: true,
    overdueDays,
    overduePenaltyPerDay: penaltyPerDay,
    overduePenaltyAmount,
  };
};

module.exports = {
  calculateOverduePenalty,
};
