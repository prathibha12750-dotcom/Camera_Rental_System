import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { useAuth } from "../../context/useAuth";

  //added by abilash
  import {
    Wallet,
    ClipboardList,
    AlertTriangle,
    CalendarDays,
    Users,
    UserCheck,
    Camera,
    CreditCard,
    PackageCheck,
    PackageX,
    Wrench,
    UserCog,
    BarChart3,
  } from "lucide-react";
  //ended by abilash


//added by abilash
// Dashboard statistic icons

const statisticIcons = {
  "Monthly Revenue": Wallet,
  "Active Rentals": ClipboardList,
  "Overdue Rentals": AlertTriangle,
  "Upcoming Bookings": CalendarDays,
  "Total Customers": Users,
  "Total Photographers": UserCheck,
  "Total Equipment": Camera,
  "Total Payments": CreditCard,
  "Available Equipment": PackageCheck,
  "Damaged Equipment": PackageX,
  "Equipment Under Maintenance": Wrench,
  "Total Clerks": UserCog,
};

const StatCardIcon = ({ title }) => {
  const Icon = statisticIcons[title] || BarChart3;

  return (
    <Icon
      className="h-5 w-5"
      strokeWidth={1.9}
      aria-hidden="true"
    />
  );
};
//ended by abilash

const AdminHome = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  //added by abilash
  // Revenue Analytics State
  const [revenueTrend, setRevenueTrend] = useState([]);
  const [revenueTrendLoading, setRevenueTrendLoading] = useState(true);
  const [revenueTrendError, setRevenueTrendError] = useState("");
  //ended by abilash


  //added by abilash
  const [recentActivities, setRecentActivities] = useState([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [activitiesError, setActivitiesError] = useState(false);
  //ended by abilash

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/admin/dashboard");

        setStats(response.data.data);
      } catch (err) {
        console.error("Dashboard stats error:", err);

        if (err.response?.status === 401) {
          setError(
            "Your session has expired. Please log in again."
          );
        } else if (err.response?.status === 403) {
          setError(
            "You do not have permission to access the admin dashboard."
          );
        } else if (err.response?.status === 404) {
          setError(
            "Dashboard endpoint was not found."
          );
        } else {
          setError(
            err.response?.data?.message ||
              "Failed to load dashboard statistics."
          );
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, []);

  
  //added by abilash
  // Fetch last six months of revenue for Admin Analytics

  useEffect(() => {
    let cancelled = false;

    const fetchRevenueTrend = async () => {
      try {
        setRevenueTrendLoading(true);
        setRevenueTrendError("");

        const response = await api.get(
          "/admin/reports/revenue/trend"
        );

        const months = response.data?.data?.months;

        if (!Array.isArray(months) || months.length !== 6) {
          throw new Error("Invalid revenue trend response");
        }

        if (!cancelled) {
          setRevenueTrend(months);
        }

      } catch (err) {
        console.error("Revenue trend fetch failed:", err);

        if (!cancelled) {
          setRevenueTrendError(
            "Unable to load revenue analytics."
          );
          setRevenueTrend([]);
        }

      } finally {
        if (!cancelled) {
          setRevenueTrendLoading(false);
        }
      }
    };

    fetchRevenueTrend();

    return () => {
      cancelled = true;
    };
  }, []);

  //ended by abilash

  
  //added by abilash
  // Fetch latest system activities for Admin Dashboard
  useEffect(() => {
    let cancelled = false;

    const fetchRecentActivities = async () => {
      try {
        const response = await api.get("/admin/activity-logs", {
          params: { page: 1 },
        });

        if (!cancelled) {
          setRecentActivities(
            (response.data?.data?.logs || []).slice(0, 5)
          );
          setActivitiesError(false);
        }
      } catch (err) {
        console.error("Failed to fetch recent activities:", err);

        if (!cancelled) {
          setActivitiesError(true);
        }
      } finally {
        if (!cancelled) {
          setActivitiesLoading(false);
        }
      }
    };

    fetchRecentActivities();

    return () => {
      cancelled = true;
    };
  }, []);
  //ended by abilash



  //added by abilash
  // Format Sri Lankan Rupees with a maximum of 2 decimal places
  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) {
      return "-";
    }

    return `Rs. ${Number(amount).toLocaleString("en-LK", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`;
  };
  //ended by abilash


  const formatNumber = (value) => {
    if (value === null || value === undefined) {
      return "-";
    }

    return Number(value).toLocaleString("en-LK");
  };

  
  //added by abilash
  // Redesigned dashboard statistics with priority ordering
  const statCards = [

    {
      title: "Monthly Revenue",
      value: formatCurrency(stats?.monthlyRevenue),
      tone: "revenue",
    },
    {
      title: "Active Rentals",
      value: formatNumber(stats?.activeRentals),
      tone: "active",
    },
    {
      title: "Overdue Rentals",
      value: formatNumber(stats?.overdueRentals),
      tone: "alert",
    },
    {
      title: "Upcoming Bookings",
      value: formatNumber(
        stats?.upcomingPhotographerBookings ??
          stats?.upcomingPhotographerBokings
      ),
      tone: "booking",
    },
    {
      title: "Total Customers",
      value: formatNumber(stats?.totalCustomers),
    },
    {
      title: "Total Photographers",
      value: formatNumber(stats?.totalPhotographers),
    },
    {
      title: "Total Equipment",
      value: formatNumber(stats?.totalEquipment),
    },
    {
      title: "Total Payments",
      value: formatNumber(stats?.totalPayments),
    },
    {
      title: "Available Equipment",
      value: formatNumber(stats?.availableEquipment),
    },
    {
      title: "Damaged Equipment",
      value: formatNumber(stats?.damagedEquipment),
    },
    {
      title: "Equipment Under Maintenance",
      value: formatNumber(stats?.equipmentUnderMaintenance),
    },
    {
      title: "Total Clerks",
      value: formatNumber(stats?.totalClerks),
    },
  ];

  // Calculate chart scale and six-month revenue total
  const revenueMax = Math.max(
    1,
    ...revenueTrend.map((item) =>
      Math.max(0, Number(item.totalRevenue) || 0)
    )
  );

  const sixMonthRevenue = revenueTrend.reduce(
    (total, item) =>
      total + Math.max(0, Number(item.totalRevenue) || 0),
    0
  );

  const averageMonthlyRevenue =
    revenueTrend.length > 0
      ? sixMonthRevenue / revenueTrend.length
      : 0;

  const completedPayments = revenueTrend.reduce(
    (total, item) =>
      total + Math.max(0, Number(item.paymentCount) || 0),
    0
  );

  const bestRevenueMonth = revenueTrend.reduce(
    (best, item) => {
      const amount = Number(item.totalRevenue) || 0;

      if (amount <= 0) return best;

      if (!best || amount > (Number(best.totalRevenue) || 0)) {
        return item;
      }

      return best;
    },
    null
  );


  return (

    <main className="min-h-full w-full bg-slate-50 px-4 py-5 sm:px-6 sm:py-7 xl:px-8">
      {/* added by abilash */}
      {/* Responsive dashboard content container */}
      <div className="mx-auto w-full max-w-screen-2xl">
      {/* ended by abilash */}


        {/* Page Header */}
        
        {/* added by abilash */}
        {/* Redesigned Admin Dashboard Header */}
        <div className="mb-8 rounded-2xl bg-slate-950 px-6 py-7 text-white shadow-sm sm:px-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-orange-400">
                Admin Dashboard
              </p>

              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Welcome back, {user?.name || "Admin"}
              </h1>

              <p className="mt-3 text-sm leading-6 text-slate-300">
                Monitor your rentals, equipment, bookings and
                business performance in one place.
              </p>
            </div>

            <div className="shrink-0">
              <div className="rounded-xl border border-slate-700 bg-slate-800/70 px-5 py-3">
                <p className="text-xs font-medium text-slate-400">
                  Today
                </p>

                <p className="mt-1 text-sm font-semibold text-white">
                  {new Date().toLocaleDateString("en-LK", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>
        {/* ended by abilash */}



{/* added by abilash */}
{/* Redesigned Admin Quick Actions */}
<section className="mb-8">

  <div className="mb-4">
    <h2 className="text-lg font-bold text-slate-900">
      Quick Actions
    </h2>
    <p className="mt-1 text-sm text-slate-500">
      Quickly access frequently used management features.
    </p>
  </div>

  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
    {[
      {
        title: "Manage Users",
        description: "Customer and staff accounts",
        path: "/admin/users",
        icon: "U",
      },
      {
        title: "Applications",
        description: "Photographer applications",
        path: "/admin/photographer-applications",
        icon: "P",
      },
      {
        title: "Equipment",
        description: "Equipment inventory",
        path: "/admin/equipment",
        icon: "E",
      },
      {
        title: "Rentals",
        description: "Rental operations",
        path: "/admin/rentals",
        icon: "R",
      },
      {
        title: "Payment Verification",
        description: "Review and verify rental payment receipts",
        path: "/admin/payment-verification",
        icon: "PV",
      },   
    ].map((item) => (
      <button
        key={item.title}
        type="button"
        onClick={() => navigate(item.path)}
        className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-orange-300 hover:shadow-md"
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-lg font-bold text-orange-600 transition group-hover:bg-orange-600 group-hover:text-white">
          {item.icon}
        </span>

        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-slate-900">
            {item.title}
          </span>

          <span className="mt-1 block text-xs text-slate-500">
            {item.description}
          </span>
        </span>

        <svg
          className="h-4 w-4 shrink-0 text-slate-400 transition group-hover:translate-x-1 group-hover:text-orange-600"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 12h14m-6-6 6 6-6 6"
          />
        </svg>
      </button>
    ))}
  </div>

</section>
{/* ended by abilash */}


        {/* Error State */}
        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-5">
            <p className="font-semibold text-red-800">
              Unable to load dashboard
            </p>

            <p className="mt-1 text-sm text-red-700">
              {error}
            </p>
          </div>
        )}

        {/* Loading / Statistics */}
        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div
                key={index}
                className="h-32 animate-pulse rounded-2xl border border-gray-200 bg-white"
              />
            ))}
          </div>
        ) : (

          <>                     
            {/* added by abilash */}
            {/* Redesigned Admin Dashboard Statistic Cards */}

            <section>
              <div className="mb-4">
                <h2 className="text-lg font-bold text-slate-900">
                  Business Overview
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Key statistics from your rental and booking system.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {statCards.map((card) => (
                  <div
                    key={card.title}
                    className={`rounded-2xl border p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                      card.tone === "revenue"
                        ? "border-orange-200 bg-orange-50/50"
                        : card.tone === "active"
                        ? "border-emerald-200 bg-emerald-50/50"
                        : card.tone === "alert"
                        ? "border-red-200 bg-red-50/50"
                        : card.tone === "booking"
                        ? "border-blue-200 bg-blue-50/50"
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      
                      {/* added by abilash */}
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                          card.tone === "revenue"
                            ? "bg-orange-100 text-orange-600"
                            : card.tone === "active"
                            ? "bg-emerald-100 text-emerald-600"
                            : card.tone === "alert"
                            ? "bg-red-100 text-red-600"
                            : card.tone === "booking"
                            ? "bg-blue-100 text-blue-600"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        <StatCardIcon title={card.title} />
                      </div>
                      {/* ended by abilash */}


                      <p className="text-sm font-medium text-slate-600">
                        {card.title}
                      </p>
                    </div>

                    <p
                      className={`mt-4 text-3xl font-bold tracking-tight ${
                        card.tone === "alert"
                          ? "text-red-700"
                          : "text-slate-950"
                      }`}
                    >
                      {card.value}
                    </p>

                    {card.tone === "alert" && (
                      <p className="mt-2 text-xs font-medium text-red-600">
                        Requires attention
                      </p>
                    )}

                    {card.tone === "revenue" && (
                      <p className="mt-2 text-xs text-slate-500">
                        Revenue this month
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* ended by abilash */}

            
            {/* added by abilash */}
            {/* Admin Dashboard - Needs Attention */}

            <section className="mt-8">
              <div className="mb-4">
                <h2 className="text-lg font-bold text-slate-900">
                  Needs Attention
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Monitor operational issues that may require action.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {[
                  {
                    title: "Overdue Rentals",
                    count: stats?.overdueRentals,
                    description: "Review rentals past their expected return date.",
                    path: "/admin/rentals",
                    border: "border-red-200",
                    background: "bg-red-50",
                    text: "text-red-700",
                  },
                  {
                    title: "Damaged Equipment",
                    count: stats?.damagedEquipment,
                    description: "Review damaged equipment in the inventory.",
                    path: "/admin/equipment",
                    border: "border-orange-200",
                    background: "bg-orange-50",
                    text: "text-orange-700",
                  },
                  {
                    title: "Under Maintenance",
                    count: stats?.equipmentUnderMaintenance,
                    description: "Monitor equipment currently under maintenance.",
                    path: "/admin/equipment",
                    border: "border-amber-200",
                    background: "bg-amber-50",
                    text: "text-amber-700",
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className={`rounded-2xl border bg-white p-5 shadow-sm ${item.border}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-semibold text-slate-800">
                          {item.title}
                        </h3>

                        <p className="mt-2 text-xs leading-5 text-slate-500">
                          {item.description}
                        </p>
                      </div>

                      <span
                        className={`rounded-xl px-3 py-2 text-xl font-bold ${item.background} ${item.text}`}
                      >
                        {formatNumber(item.count)}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => navigate(item.path)}
                      className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-orange-600 transition hover:text-orange-700"
                    >
                      View Details
                      <span aria-hidden="true">→</span>
                    </button>
                  </div>
                ))}
              </div>
            </section>

            {/* ended by abilash */}

            
            {/* added by abilash */}
            {/* Admin Dashboard - Monthly Revenue Analytics */}

            <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

              <div className="mb-6 flex flex-wrap items-start justify-between gap-4">

                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-slate-900">
                      Revenue Analytics
                    </h2>
                  </div>

                  <p className="mt-1 text-sm text-slate-500">
                    Monthly revenue from completed payments.
                  </p>
                </div>

                <span className="rounded-lg bg-orange-50 px-3 py-2 text-xs font-semibold text-orange-700">
                  Last 6 Months
                </span>

              </div>

              {revenueTrendLoading ? (

                <div className="flex h-56 items-center justify-center">
                  <p className="text-sm text-slate-500">
                    Loading revenue analytics...
                  </p>
                </div>

              ) : revenueTrendError ? (

                <div className="rounded-xl bg-red-50 p-4">
                  <p className="text-sm text-red-600">
                    {revenueTrendError}
                  </p>
                </div>

              ) : revenueTrend.length === 0 ? (

                <p className="text-sm text-slate-500">
                  No revenue data available.
                </p>

              ) : (

                <>
                  {/* Six-month revenue summary */}
                  <div className="mb-6">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Total Revenue — Last 6 Months
                    </p>

                    <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
                      {formatCurrency(sixMonthRevenue)}
                    </p>
                  </div>
                  
                  {/* added by abilash */}
                  {/* Revenue Performance Summary */}

                  <div className="mb-8 grid gap-4 sm:grid-cols-3">

                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs font-medium text-slate-500">
                        Average Monthly Revenue
                      </p>

                      <p className="mt-2 text-xl font-bold text-slate-900">
                        {formatCurrency(averageMonthlyRevenue)}
                      </p>
                    </div>

                    <div className="rounded-xl border border-orange-200 bg-orange-50/50 p-4">
                      <p className="text-xs font-medium text-slate-500">
                        Highest Revenue Month
                      </p>

                      <p className="mt-2 text-xl font-bold text-slate-900">
                        {bestRevenueMonth?.label || "No revenue yet"}
                      </p>

                      {bestRevenueMonth && (
                        <p className="mt-1 text-xs text-orange-700">
                          {formatCurrency(bestRevenueMonth.totalRevenue)}
                        </p>
                      )}
                    </div>

                    <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
                      <p className="text-xs font-medium text-slate-500">
                        Completed Payments
                      </p>

                      <p className="mt-2 text-xl font-bold text-slate-900">
                        {formatNumber(completedPayments)}
                      </p>
                    </div>

                  </div>

                  {/* ended by abilash */}


                  {/* Revenue Bar Chart */}
                  <div className="overflow-x-auto pb-2">

                    <div className="flex min-w-[520px] items-end gap-3">

                      {revenueTrend.map((item) => {
                        const amount = Math.max(
                          0,
                          Number(item.totalRevenue) || 0
                        );

                        const height =
                          amount === 0
                            ? 0
                            : Math.max(
                                5,
                                (amount / revenueMax) * 100
                              );

                        return (
                          <div
                            key={item.month}
                            className="flex min-w-0 flex-1 flex-col items-center"
                          >

                            <div className="flex h-48 w-full items-end justify-center border-b border-slate-200 bg-slate-50/50 px-2">

                              <div
                                role="img"
                                aria-label={`${item.label}: ${formatCurrency(amount)}`}
                                title={`${item.label}: ${formatCurrency(amount)}`}
                                className="w-full max-w-14 rounded-t-lg bg-gradient-to-t from-orange-600 to-orange-400 transition-all duration-300 hover:from-orange-700 hover:to-orange-500"
                                style={{
                                  height: `${height}%`,
                                }}
                              />

                            </div>

                            <p className="mt-3 text-xs font-semibold text-slate-700">
                              {item.label}
                            </p>

                            <p className="mt-1 text-[11px] font-medium text-slate-500">
                              {formatCurrency(amount)}
                            </p>

                          </div>
                        );
                      })}

                    </div>

                  </div>

                  {sixMonthRevenue === 0 && (
                    <p className="mt-4 text-center text-xs text-slate-500">
                      No completed payments recorded during this period.
                    </p>
                  )}

                </>
              )}

            </section>

            {/* ended by abilash */}

            
            {/* added by abilash */}
            {/* Recent System Activities */}

            <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Recent System Activities
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Latest activities recorded across the system.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => navigate("/admin/activity-logs")}
                  className="text-sm font-semibold text-orange-600 hover:text-orange-700"
                >
                  View All Activities →
                </button>
              </div>

              {activitiesLoading ? (
                <p className="text-sm text-slate-500">
                  Loading recent activities...
                </p>
              ) : activitiesError ? (
                <p className="text-sm text-red-600">
                  Unable to load recent activities.
                </p>
              ) : recentActivities.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No system activities recorded yet.
                </p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {recentActivities.map((activity) => (
                    <div
                      key={activity._id}
                      className="flex flex-wrap items-center justify-between gap-3 py-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                          ●
                        </div>

                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {activity.action?.replace(/_/g, " ")}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {activity.actor?.name || activity.actorRole || "System"}
                            {" · "}
                            {activity.entityType}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span
                          className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${
                            activity.outcome === "SUCCESS"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-red-50 text-red-700"
                          }`}
                        >
                          {activity.outcome}
                        </span>

                        <p className="mt-2 text-xs text-slate-400">
                          {new Date(activity.createdAt).toLocaleString("en-LK")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </section>

            {/* ended by abilash */}

          </>
        )}
      </div>
    </main>
  );
};

export default AdminHome;