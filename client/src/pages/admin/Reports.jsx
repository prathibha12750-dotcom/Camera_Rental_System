import { useEffect, useState } from "react";
import api from "../../services/api";

const Reports = () => {
  const [dailyReport, setDailyReport] = useState(null);
  const [monthlyReport, setMonthlyReport] = useState(null);
  const [rentalReport, setRentalReport] = useState(null);
  const [equipmentReport, setEquipmentReport] = useState(null);
  const [photographerReport, setPhotographerReport] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError("");


  const [
    dailyResponse,
    monthlyResponse,
    rentalResponse,
    equipmentResponse,
    photographerResponse,
  ] = await Promise.all([
    api.get("/admin/reports/revenue/daily"),
    api.get("/admin/reports/revenue/monthly"),
    api.get("/admin/reports/rentals"),
    api.get("/admin/reports/equipment"),
    api.get("/admin/reports/photographers"),
  ]);


  setDailyReport(dailyResponse.data?.data || null);
  setMonthlyReport(monthlyResponse.data?.data || null);
  setRentalReport(rentalResponse.data?.data || null);
  setEquipmentReport(equipmentResponse.data?.data || null);
  setPhotographerReport(photographerResponse.data?.data || null);

    } catch (error) {
      const status = error.response?.status;

      if (status === 401) {
        setError("Your session has expired. Please log in again.");
      } else if (status === 403) {
        setError(
          "You do not have permission to view admin reports."
        );
      } else if (status === 404) {
        setError("The requested report could not be found.");
      } else {
        setError(
          error.response?.data?.message ||
            "Failed to load reports. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const formatAmount = (value) => {
    return `LKR ${Number(value || 0).toLocaleString()}`;
  };

  const formatDate = (value) => {
    if (!value) return "-";

    return new Date(value).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const formatMonth = (value) => {
    if (!value) return "-";

    return new Date(value).toLocaleDateString("en-GB", {
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className="p-6">
      {/* ======================================
          PAGE HEADER
      ====================================== */}

      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-950">
            Reports
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            View revenue reports and payment statistics.
          </p>
        </div>

        <button
          onClick={fetchReports}
          disabled={loading}
          className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Refreshing..." : "Refresh Reports"}
        </button>
      </div>

      {/* ======================================
          ERROR
      ====================================== */}

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ======================================
          LOADING
      ====================================== */}

      {loading ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm">
          <p className="text-sm text-gray-500">
            Loading reports...
          </p>
        </div>
      ) : (
        <>
          {/* ==================================
              SUMMARY CARDS
          ================================== */}

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {/* Daily Revenue */}

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-gray-500">
                Today's Revenue
              </p>

              <p className="mt-2 text-2xl font-bold text-gray-950">
                {formatAmount(dailyReport?.totalRevenue)}
              </p>

              <p className="mt-2 text-xs text-gray-500">
                {dailyReport?.paymentCount || 0} completed payment(s)
              </p>
            </div>

            {/* Monthly Revenue */}

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-gray-500">
                Monthly Revenue
              </p>

              <p className="mt-2 text-2xl font-bold text-gray-950">
                {formatAmount(monthlyReport?.totalRevenue)}
              </p>

              <p className="mt-2 text-xs text-gray-500">
                {monthlyReport?.paymentCount || 0} completed payment(s)
              </p>
            </div>

            {/* Daily Payments */}

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-gray-500">
                Today's Payments
              </p>

              <p className="mt-2 text-2xl font-bold text-gray-950">
                {dailyReport?.paymentCount || 0}
              </p>

              <p className="mt-2 text-xs text-gray-500">
                Completed payments today
              </p>
            </div>

            {/* Monthly Payments */}

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-gray-500">
                Monthly Payments
              </p>

              <p className="mt-2 text-2xl font-bold text-gray-950">
                {monthlyReport?.paymentCount || 0}
              </p>

              <p className="mt-2 text-xs text-gray-500">
                Completed payments this month
              </p>
            </div>
          </div>

          {/* ==================================
              REVENUE REPORTS
          ================================== */}

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            {/* Daily Revenue */}

            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-950">
                    Daily Revenue
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Revenue generated today.
                  </p>
                </div>

                <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-orange-700">
                  Daily
                </span>
              </div>

              <div className="mt-6 rounded-xl bg-gray-50 p-5">
                <p className="text-sm text-gray-500">
                  Report Date
                </p>

                <p className="mt-1 text-sm font-semibold text-gray-900">
                  {formatDate(dailyReport?.date)}
                </p>

                <div className="mt-5 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">
                      Total Revenue
                    </p>

                    <p className="mt-1 text-xl font-bold text-gray-950">
                      {formatAmount(dailyReport?.totalRevenue)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">
                      Payments
                    </p>

                    <p className="mt-1 text-xl font-bold text-gray-950">
                      {dailyReport?.paymentCount || 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Monthly Revenue */}

            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-950">
                    Monthly Revenue
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Revenue generated during the current month.
                  </p>
                </div>

                <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-orange-700">
                  Monthly
                </span>
              </div>

              <div className="mt-6 rounded-xl bg-gray-50 p-5">
                <p className="text-sm text-gray-500">
                  Report Month
                </p>

                <p className="mt-1 text-sm font-semibold text-gray-900">
                  {formatMonth(monthlyReport?.month)}
                </p>

                <div className="mt-5 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">
                      Total Revenue
                    </p>

                    <p className="mt-1 text-xl font-bold text-gray-950">
                      {formatAmount(monthlyReport?.totalRevenue)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">
                      Payments
                    </p>

                    <p className="mt-1 text-xl font-bold text-gray-950">
                      {monthlyReport?.paymentCount || 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* RENTAL REPORTS */}
            <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-5">
                <h2 className="text-lg font-semibold text-gray-950">
                  Rental Reports
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Overview of rental statuses and overdue rentals.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  { label: "Total Rentals", value: rentalReport?.totalRentals },
                  { label: "Pending Rentals", value: rentalReport?.pendingRentals },
                  { label: "Confirmed Rentals", value: rentalReport?.confirmedRentals },
                  { label: "Active Rentals", value: rentalReport?.activeRentals },
                  { label: "Returned Rentals", value: rentalReport?.returnedRentals },
                  { label: "Completed Rentals", value: rentalReport?.completedRentals },
                  { label: "Rejected Rentals", value: rentalReport?.rejectedRentals },
                  { label: "Cancelled Rentals", value: rentalReport?.cancelledRentals },
                  { label: "Overdue Rentals", value: rentalReport?.overdueRentals },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-xl bg-gray-50 p-4"
                  >
                    <p className="text-sm font-medium text-gray-500">
                      {item.label}
                    </p>
                    <p className="mt-2 text-2xl font-bold text-gray-950">
                      {item.value ?? 0}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* EQUIPMENT REPORTS */}
            <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-5">
                <h2 className="text-lg font-semibold text-gray-950">
                  Equipment Reports
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Overview of equipment availability, status, and condition.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  { label: "Total Equipment", value: equipmentReport?.totalEquipment },
                  { label: "Available Equipment", value: equipmentReport?.availableEquipment },
                  { label: "Reserved Equipment", value: equipmentReport?.reservedEquipment },
                  { label: "Rented Equipment", value: equipmentReport?.rentedEquipment },
                  { label: "Under Maintenance", value: equipmentReport?.equipmentUnderMaintenance },
                  { label: "Damaged Equipment", value: equipmentReport?.damagedEquipment },
                  { label: "Excellent Condition", value: equipmentReport?.excellentCondition },
                  { label: "Good Condition", value: equipmentReport?.goodCondition },
                  { label: "Fair Condition", value: equipmentReport?.fairCondition },
                  { label: "Damaged Condition", value: equipmentReport?.damagedCondition },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-xl bg-gray-50 p-4"
                  >
                    <p className="text-sm font-medium text-gray-500">
                      {item.label}
                    </p>
                    <p className="mt-2 text-2xl font-bold text-gray-950">
                      {item.value ?? 0}
                    </p>
                  </div>
                ))}
              </div>
              
              {/* =====================================
                  MOST RENTED EQUIPMENT - FR-103
              ===================================== */}

              <div className="mt-8">
                <h3 className="text-base font-semibold text-gray-900">
                  Most Rented Equipment
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                  Top 10 equipment items ranked by completed or
                  accepted rental transactions.
                </p>

                <div className="mt-4 overflow-x-auto rounded-xl border border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                          Rank
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                          Equipment
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                          Brand
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                          Rental Count
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-100 bg-white">
                      {(equipmentReport?.mostRentedEquipment ?? [])
                        .length === 0 ? (
                        <tr>
                          <td
                            colSpan={4}
                            className="px-4 py-8 text-center text-sm text-gray-500"
                          >
                            No rental data available.
                          </td>
                        </tr>
                      ) : (
                        equipmentReport.mostRentedEquipment.map(
                          (item, index) => (
                            <tr key={item.equipmentId}>
                              <td className="px-4 py-3 text-sm text-gray-700">
                                {index + 1}
                              </td>

                              <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                {item.equipmentName || "Unknown"}
                              </td>

                              <td className="px-4 py-3 text-sm text-gray-600">
                                {item.brand || "-"}
                              </td>

                              <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                                {item.rentalCount}
                              </td>
                            </tr>
                          )
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

            {/* Photographer Reports */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Photographer Reports
              </h2>

              {!photographerReport ? (
                <p className="text-gray-500">No photographer report data available.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    {
                      label: "Total Photographers",
                      value: photographerReport.totalPhotographers,
                    },
                    {
                      label: "Total Bookings",
                      value: photographerReport.totalBookings,
                    },
                    {
                      label: "Requested Bookings",
                      value: photographerReport.requestedBookings,
                    },
                    {
                      label: "Confirmed Bookings",
                      value: photographerReport.confirmedBookings,
                    },
                    {
                      label: "Completed Bookings",
                      value: photographerReport.completedBookings,
                    },
                    {
                      label: "Rejected Bookings",
                      value: photographerReport.rejectedBookings,
                    },
                    {
                      label: "Cancelled Bookings",
                      value: photographerReport.cancelledBookings,
                    },
                    {
                      label: "Upcoming Bookings",
                      value: photographerReport.upcomingBookings,
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="bg-gray-50 rounded-lg p-4 border border-gray-100"
                    >
                      <p className="text-sm text-gray-500">{item.label}</p>
                      <p className="text-2xl font-bold text-gray-900 mt-2">
                        {item.value ?? 0}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>


          </div>

          {/* ==================================
              REPORT SCOPE NOTICE
          ================================== */}

          <div className="mt-6 rounded-2xl border border-orange-200 bg-orange-50 p-5">
            <h3 className="text-sm font-semibold text-orange-900">
              Available Reports
            </h3>

            <p className="mt-1 text-sm text-orange-800">
              Daily and monthly revenue reports, rental reports, equipment reports, and photographer reports are available.
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default Reports;