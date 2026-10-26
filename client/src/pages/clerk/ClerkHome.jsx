
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import api from "../../services/api";

// ============================================================
// DASHBOARD ICONS
// ============================================================

const DashboardIcon = ({ name, className = "h-6 w-6" }) => {
  const commonProps = {
    className,
    fill: "none",
    viewBox: "0 0 24 24",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };

  const icons = {
    rentals: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M7 3v4M17 3v4M3 10h18M8 14h3M13 14h3M8 17h3" />
      </>
    ),

    payments: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M3 10h18M7 15h4" />
        <circle cx="18" cy="17" r="4" />
        <path d="m16.5 17 1 1 2-2" />
      </>
    ),

    maintenance: (
      <path d="M14.7 6.3a4 4 0 0 0-5 5L3 18l3 3 6.7-6.7a4 4 0 0 0 5-5l-2.4 2.4-3-3 2.4-2.4Z" />
    ),

    equipment: (
      <>
        <rect x="3" y="6" width="18" height="13" rx="2" />
        <path d="M8 6l1.5-2h5L16 6" />
        <circle cx="12" cy="12.5" r="3" />
      </>
    ),

    deposits: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M3 9h18M7 15h4" />
      </>
    ),

    refund: (
      <>
        <path d="M9 7H5V3" />
        <path d="M5 7a8 8 0 1 1-1 8" />
        <path d="M8 12h8M12 9l-3 3 3 3" />
      </>
    ),

    subscription: (
      <>
        <rect x="4" y="3" width="16" height="18" rx="2" />
        <path d="M8 8h8M8 12h8M8 16h4" />
        <path d="m15 16 2 2 4-4" />
      </>
    ),

    arrow: <path d="M5 12h14M13 6l6 6-6 6" />,

    check: <path d="m5 12 4 4L19 6" />,

    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),

    shield: (
      <>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),

    activity: <path d="M3 12h4l3-7 4 14 3-7h4" />,

    refresh: (
      <>
        <path d="M20 11a8 8 0 0 0-14-5L4 8" />
        <path d="M4 4v4h4" />
        <path d="M4 13a8 8 0 0 0 14 5l2-2" />
        <path d="M20 20v-4h-4" />
      </>
    ),

    alert: (
      <>
        <path d="M12 3 2 21h20L12 3Z" />
        <path d="M12 9v5M12 17h.01" />
      </>
    ),

    package: (
      <>
        <path d="m12 2 9 5-9 5-9-5 9-5Z" />
        <path d="M3 7v10l9 5 9-5V7M12 12v10" />
      </>
    ),
  };

  return <svg {...commonProps}>{icons[name] || icons.activity}</svg>;
};

// ============================================================
// MANAGEMENT MODULES
// ============================================================

const managementModules = [
  {
    title: "Rental Management",
    description:
      "Review rental requests, issue equipment, process returns, monitor overdue rentals, and complete transactions.",
    icon: "rentals",
    path: "/clerk/rentals",
    action: "Manage Rentals",
    category: "Rental Operations",
  },
  {
    title: "Payment Verification",
    description:
      "Review customer bank transfer receipts, verify rental payments, and approve or reject submitted transactions.",
    icon: "payments",
    path: "/clerk/payment-verification",
    action: "Verify Payments",
    category: "Financial Operations",
  },
  {
    title: "Damage & Maintenance",
    description:
      "Inspect reported equipment damage, manage maintenance records, and track repair progress.",
    icon: "maintenance",
    path: "/clerk/damage-maintenance",
    action: "View Damage Records",
    category: "Equipment Operations",
  },
  {
    title: "Equipment Status",
    description:
      "Check equipment availability, condition, rental status, pricing, and security deposit requirements.",
    icon: "equipment",
    path: "/clerk/equipment",
    action: "View Equipment",
    category: "Equipment Operations",
  },
  {
    title: "Security Deposits",
    description:
      "Review customer deposits, check required amounts, and manage deposit records and settlement information.",
    icon: "deposits",
    path: "/clerk/deposits",
    action: "Manage Deposits",
    category: "Financial Operations",
  },
  {
    title: "Refund Management",
    description:
      "Manage security deposit refunds, review pending settlements, and track refund history.",
    icon: "refund",
    path: "/clerk/refunds",
    action: "Manage Refunds",
    category: "Financial Operations",
  },
  {
    title: "Subscription Management",
    description:
      "Monitor photographer subscriptions, verify subscription receipts, and review payment history.",
    icon: "subscription",
    path: "/photographer-subscriptions",
    action: "Manage Subscriptions",
    category: "Photographer Operations",
  },
];

// ============================================================
// PRIORITY ACTIONS
// ============================================================

const priorityActions = [
  {
    title: "Review Rental Requests",
    description: "Check new requests and prepare equipment for issue.",
    icon: "rentals",
    path: "/clerk/rentals",
  },
  {
    title: "Verify Rental Payments",
    description: "Review submitted customer payment receipts.",
    icon: "payments",
    path: "/clerk/payment-verification",
  },
  {
    title: "Review Subscription Payments",
    description: "Verify photographer subscription receipts.",
    icon: "subscription",
    path: "/subscription-payments",
  },
  {
    title: "Process Returns & Deposits",
    description: "Complete inspections and review deposit settlements.",
    icon: "deposits",
    path: "/clerk/rentals",
  },
];

// ============================================================
// STATISTIC CARD
// ============================================================

const StatCard = ({
  title,
  value,
  description,
  icon,
  path,
  loading,
  error,
}) => {
  return (
    <Link
      to={path}
      className="group flex min-w-0 flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-orange-300 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
          <DashboardIcon name={icon} className="h-5 w-5" />
        </div>

        <DashboardIcon
          name="arrow"
          className="h-4 w-4 text-gray-400 transition-transform group-hover:translate-x-1 group-hover:text-orange-600"
        />
      </div>

      <div className="mt-4">
        {loading ? (
          <div
            className="h-9 w-16 animate-pulse rounded-lg bg-gray-100"
            aria-label="Loading statistic"
          />
        ) : (
          <p className="text-3xl font-bold tracking-tight text-gray-950">
            {error ? "—" : value}
          </p>
        )}

        <h3 className="mt-2 text-sm font-bold text-gray-900">
          {title}
        </h3>

        <p className="mt-1 text-xs leading-5 text-gray-500">
          {error ? "Unable to load this statistic" : description}
        </p>
      </div>
    </Link>
  );
};

// ============================================================
// MANAGEMENT CARD
// ============================================================

const ManagementCard = ({ module }) => (
  <Link
    to={module.path}
    className="group flex h-full min-w-0 flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-orange-300 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 sm:p-6"
  >
    <div className="flex items-start justify-between gap-3">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600 transition-colors group-hover:bg-orange-100">
        <DashboardIcon name={module.icon} />
      </div>

      <span className="rounded-full bg-gray-100 px-3 py-1 text-right text-[10px] font-semibold text-gray-500">
        {module.category}
      </span>
    </div>

    <h3 className="mt-5 text-lg font-bold text-gray-900 transition-colors group-hover:text-orange-600">
      {module.title}
    </h3>

    <p className="mt-2 flex-1 text-sm leading-6 text-gray-600">
      {module.description}
    </p>

    <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-4">
      <span className="text-sm font-semibold text-orange-600">
        {module.action}
      </span>

      <DashboardIcon
        name="arrow"
        className="h-5 w-5 text-orange-600 transition-transform group-hover:translate-x-1"
      />
    </div>
  </Link>
);

// ============================================================
// PRIORITY ACTION
// ============================================================

const PriorityAction = ({ action }) => (
  <Link
    to={action.path}
    className="group flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3 transition-all hover:border-orange-200 hover:bg-orange-50 focus-visible:outline-2 focus-visible:outline-orange-500 sm:p-4"
  >
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-orange-600 shadow-sm">
      <DashboardIcon name={action.icon} className="h-5 w-5" />
    </div>

    <div className="min-w-0 flex-1">
      <h4 className="text-sm font-semibold text-gray-900 group-hover:text-orange-700">
        {action.title}
      </h4>

      <p className="mt-1 text-xs leading-5 text-gray-500">
        {action.description}
      </p>
    </div>

    <DashboardIcon
      name="arrow"
      className="h-4 w-4 shrink-0 text-gray-400 transition-transform group-hover:translate-x-1 group-hover:text-orange-600"
    />
  </Link>
);

// ============================================================
// CLERK DASHBOARD
// ============================================================

const ClerkHome = () => {
  const { user } = useAuth();

  const displayName = user?.name?.trim() || "Clerk";

  const [stats, setStats] = useState({
    pendingRentals: null,
    overdueRentals: null,
    pendingPayments: null,
    activeRentals: null,
  });

  const [statsErrors, setStatsErrors] = useState({
    rentals: false,
    overdue: false,
    payments: false,
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  // ============================================================
  // FETCH LIVE DASHBOARD STATISTICS
  // ============================================================

  const fetchDashboardStats = useCallback(async (signal) => {
    const requests = await Promise.allSettled([
      api.get("/rentals", { signal }),
      api.get("/rentals/overdue", { signal }),
      api.get("/rentals/payments/pending", { signal }),
    ]);

    if (signal?.aborted) {
      return;
    }

    const [rentalsResult, overdueResult, paymentsResult] = requests;

    const rentalsOk =
      rentalsResult.status === "fulfilled" &&
      rentalsResult.value.data?.success === true &&
      Array.isArray(rentalsResult.value.data?.data?.rentals);

    const overdueOk =
      overdueResult.status === "fulfilled" &&
      overdueResult.value.data?.success === true &&
      Number.isInteger(overdueResult.value.data?.count);

    const paymentsOk =
      paymentsResult.status === "fulfilled" &&
      paymentsResult.value.data?.success === true &&
      Number.isInteger(paymentsResult.value.data?.data?.count);

    const rentals = rentalsOk
      ? rentalsResult.value.data.data.rentals
      : [];

    setStats({
      pendingRentals: rentalsOk
        ? rentals.filter((rental) => rental.status === "PENDING").length
        : null,

      overdueRentals: overdueOk
        ? overdueResult.value.data.count
        : null,

      pendingPayments: paymentsOk
        ? paymentsResult.value.data.data.count
        : null,

      activeRentals: rentalsOk
        ? rentals.filter((rental) => rental.status === "ACTIVE").length
        : null,
    });

    setStatsErrors({
      rentals: !rentalsOk,
      overdue: !overdueOk,
      payments: !paymentsOk,
    });

    setLastUpdated(new Date());
  }, []);

  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {
    const controller = new AbortController();

    const load = async () => {
      try {
        await fetchDashboardStats(controller.signal);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    load();

    return () => controller.abort();
  }, [fetchDashboardStats]);

  // ============================================================
  // MANUAL REFRESH
  // ============================================================

  const handleRefresh = async () => {
    if (refreshing || loading) return;

    setRefreshing(true);

    try {
      await fetchDashboardStats();
    } finally {
      setRefreshing(false);
    }
  };

  const statisticCards = [
    {
      title: "Pending Rentals",
      value: stats.pendingRentals,
      description: "Rental requests awaiting review",
      icon: "rentals",
      path: "/clerk/rentals",
      error: statsErrors.rentals,
    },
    {
      title: "Overdue Rentals",
      value: stats.overdueRentals,
      description: "Active rentals past their return deadline",
      icon: "clock",
      path: "/clerk/rentals",
      error: statsErrors.overdue,
    },
    {
      title: "Payments to Verify",
      value: stats.pendingPayments,
      description: "Rental receipts awaiting verification",
      icon: "payments",
      path: "/clerk/payment-verification",
      error: statsErrors.payments,
    },
    {
      title: "Active Rentals",
      value: stats.activeRentals,
      description: "Equipment currently issued to customers",
      icon: "package",
      path: "/clerk/rentals",
      error: statsErrors.rentals,
    },
  ];

  const hasStatsError = Object.values(statsErrors).some(Boolean);

  return (
    <main className="min-h-full min-w-0 bg-gray-50">
      <div className="mx-auto max-w-7xl space-y-7 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">

        {/* ==========================================
            HEADER
        ========================================== */}

        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="mb-3 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-orange-500" />

                <span className="text-xs font-bold uppercase tracking-widest text-orange-600">
                  Clerk Workspace
                </span>
              </div>

              <h1 className="text-2xl font-bold tracking-tight text-gray-950 sm:text-3xl">
                Operations Dashboard
              </h1>

              <p className="mt-2 text-sm font-medium text-gray-700">
                Welcome back, {displayName}
              </p>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
                Manage equipment rentals, verify payments,
                monitor returns, and keep daily operations
                running smoothly.
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-3 self-start rounded-xl border border-orange-100 bg-orange-50 px-4 py-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-orange-600">
                <DashboardIcon name="shield" />
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-orange-500">
                  Workspace Role
                </p>
                <p className="text-sm font-bold text-gray-900">
                  Clerk Operations
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ==========================================
            LIVE STATISTICS
        ========================================== */}

        <section>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Live Operations Overview
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Current rental and payment statistics from the system.
              </p>
            </div>

            <button
              type="button"
              onClick={handleRefresh}
              disabled={loading || refreshing}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-orange-300 hover:text-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <DashboardIcon
                name="refresh"
                className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
              />
              {refreshing ? "Refreshing..." : "Refresh Stats"}
            </button>
          </div>

          {hasStatsError && !loading && (
            <div
              role="alert"
              className="mb-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"
            >
              <DashboardIcon
                name="alert"
                className="mt-0.5 h-5 w-5 shrink-0"
              />
              <span>
                Some dashboard statistics could not be loaded.
                Check the server connection and try refreshing.
              </span>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {statisticCards.map((card) => (
              <StatCard
                key={card.title}
                {...card}
                loading={loading}
              />
            ))}
          </div>

          {lastUpdated && !loading && (
            <p className="mt-3 text-right text-xs text-gray-400">
              Last checked: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </section>

        {/* ==========================================
            WORKSPACE OVERVIEW
        ========================================== */}

        <section>
          <div className="mb-4">
            <h2 className="text-xl font-bold text-gray-900">
              Workspace Overview
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Quick access to your daily operational responsibilities.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              {
                title: "Rental Operations",
                description: "Requests, issues, returns and overdue rentals.",
                icon: "rentals",
                path: "/clerk/rentals",
              },
              {
                title: "Payment Verification",
                description: "Customer payment receipts awaiting review.",
                icon: "payments",
                path: "/clerk/payment-verification",
              },
              {
                title: "Equipment Maintenance",
                description: "Inspections, damage reports and repairs.",
                icon: "maintenance",
                path: "/clerk/damage-maintenance",
              },
              {
                title: "Photographer Subscriptions",
                description: "Subscriptions, receipts and payment history.",
                icon: "subscription",
                path: "/photographer-subscriptions",
              },
            ].map((item) => (
              <Link
                key={item.title}
                to={item.path}
                className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:border-orange-300 hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                    <DashboardIcon name={item.icon} className="h-5 w-5" />
                  </div>

                  <DashboardIcon
                    name="arrow"
                    className="h-4 w-4 text-gray-400 transition-transform group-hover:translate-x-1"
                  />
                </div>

                <h3 className="mt-4 text-base font-bold text-gray-900">
                  {item.title}
                </h3>

                <p className="mt-1 text-xs leading-5 text-gray-500">
                  {item.description}
                </p>
              </Link>
            ))}
          </div>
        </section>

        {/* ==========================================
            PRIORITY ACTIONS
        ========================================== */}

        <section className="grid gap-5 lg:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6 lg:col-span-2">
            <div className="mb-5">
              <h2 className="text-xl font-bold text-gray-900">
                Priority Actions
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Frequently used workflows for daily operations.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {priorityActions.map((action) => (
                <PriorityAction key={action.title} action={action} />
              ))}
            </div>
          </div>

          <aside className="flex flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
              <DashboardIcon name="shield" />
            </div>

            <h2 className="mt-5 text-lg font-bold text-gray-900">
              Operational Checklist
            </h2>

            <p className="mt-2 text-sm leading-6 text-gray-500">
              Important checks during daily Clerk operations.
            </p>

            <div className="mt-5 space-y-4">
              {[
                "Verify receipts before approving payments.",
                "Inspect equipment during returns.",
                "Review damage before deposit settlement.",
                "Confirm refund payouts before completing rentals.",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-50 text-orange-600">
                    <DashboardIcon name="check" className="h-3.5 w-3.5" />
                  </span>

                  <p className="text-sm leading-6 text-gray-600">
                    {item}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-auto pt-6">
              <div className="rounded-xl border border-orange-100 bg-orange-50 p-4">
                <p className="text-xs font-semibold text-orange-700">
                  Reminder
                </p>

                <p className="mt-1 text-xs leading-5 text-gray-600">
                  Confirm payment and deposit records before
                  finalizing financial transactions.
                </p>
              </div>
            </div>
          </aside>
        </section>

        {/* ==========================================
            MANAGEMENT MODULES
        ========================================== */}

        <section>
          <div className="mb-5">
            <h2 className="text-xl font-bold text-gray-900">
              Management Modules
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Access the tools available for your Clerk responsibilities.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {managementModules.map((module) => (
              <ManagementCard key={module.title} module={module} />
            ))}
          </div>
        </section>

        {/* ==========================================
            FOOTER
        ========================================== */}

        <footer className="border-t border-gray-200 pt-5">
          <div className="flex flex-col gap-2 text-xs text-gray-400 sm:flex-row sm:items-center sm:justify-between">
            <p>Southern Camera Rental</p>
            <p>Clerk Operations Workspace</p>
          </div>
        </footer>

      </div>
    </main>
  );
};

export default ClerkHome;
