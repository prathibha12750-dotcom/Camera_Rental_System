import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

const AdminHome = () => {
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const StatIcon = ({ type }) => {
    const commonProps = {
      className: "h-5 w-5",
      fill: "none",
      viewBox: "0 0 24 24",
      stroke: "currentColor",
      strokeWidth: 1.8,
      "aria-hidden": true,
    };

    if (type === "users") {
      return (
        <svg {...commonProps}>
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
    }

    if (type === "equipment") {
      return (
        <svg {...commonProps}>
          <rect x="3" y="6" width="18" height="13" rx="2" />
          <path d="M8 6l1.5-2h5L16 6" />
          <circle cx="12" cy="12.5" r="3" />
        </svg>
      );
    }

    if (type === "rental") {
      return (
        <svg {...commonProps}>
          <path d="M7 3v3M17 3v3" />
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M3 10h18" />
        </svg>
      );
    }

    if (type === "booking") {
      return (
        <svg {...commonProps}>
          <rect x="3" y="4" width="18" height="17" rx="2" />
          <path d="M8 2v4M16 2v4M3 9h18M8 13h3M13 13h3" />
        </svg>
      );
    }

    if (type === "payment") {
      return (
        <svg {...commonProps}>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="M3 9h18M7 15h4" />
        </svg>
      );
    }

    return (
      <svg {...commonProps}>
        <path d="M4 19V9M10 19V5M16 19v-8M22 19H2" />
      </svg>
    );
  };

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

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) {
      return "-";
    }

    return `Rs. ${Number(amount).toLocaleString("en-LK")}`;
  };

  const formatNumber = (value) => {
    if (value === null || value === undefined) {
      return "-";
    }

    return Number(value).toLocaleString("en-LK");
  };

  const statCards = [
  {
    title: "Total Customers",
    value: formatNumber(stats?.totalCustomers),
    icon: "users",
  },
  {
    title: "Total Photographers",
    value: formatNumber(stats?.totalPhotographers),
    icon: "users",
  },
  {
    title: "Total Equipment",
    value: formatNumber(stats?.totalEquipment),
    icon: "equipment",
  },
  {
    title: "Active Rentals",
    value: formatNumber(stats?.activeRentals),
    icon: "rental",
  },
  {
    title: "Overdue Rentals",
    value: formatNumber(stats?.overdueRentals),
    icon: "rental",
  },
  {
    title: "Upcoming Bookings",
    value: formatNumber(
      stats?.upcomingPhotographerBokings
    ),
    icon: "booking",
  },
  {
    title: "Total Payments",
    value: formatNumber(stats?.totalPayments),
    icon: "payment",
  },
  {
    title: "Monthly Revenue",
    value: formatCurrency(stats?.monthlyRevenue),
    icon: "revenue",
  },
];

  return (
    <main className="min-h-full bg-gray-100 px-6 py-8">
      <div className="mx-auto max-w-7xl">

        {/* Page Header */}
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-orange-600">
            Administration
          </p>

          <h1 className="mt-2 text-3xl font-bold text-gray-950">
            System Overview
          </h1>

          <p className="mt-2 max-w-2xl text-gray-600">
            Monitor users, equipment, rentals, bookings, payments,
            and revenue across Southern Camera Rental.
          </p>
        </div>

        {/* Quick Management Links */}
        <div className="mb-8 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {[
            {
              title: "Users",
              description: "Manage customer and system user accounts.",
              route: "/admin/users",
              icon: "U",
            },
            {
              title: "Photographers",
              description: "Review and manage photographer accounts.",
              route: "/admin/photographer-applications",
              icon: "P",
            },
            {
              title: "Equipment",
              description: "Manage camera equipment and rental inventory.",
              route: "/admin/equipment",
              icon: "E",
            },
            {
              title: "Rentals",
              description:
                "Manage rental requests, issuing, returns and rental status.",
              route: "/admin/rentals",
              icon: "R",
            },
          ].map((item) => (
            <button
              key={item.title}
              type="button"
              onClick={() => navigate(item.route)}
              className="group flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-6 text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-orange-300 hover:shadow-md"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 font-bold text-orange-600">
                {item.icon}
              </div>

              <h2 className="mt-5 text-lg font-semibold text-gray-950 transition group-hover:text-orange-600">
                {item.title}
              </h2>

              <p className="mt-2 text-sm leading-6 text-gray-600">
                {item.description}
              </p>

              <span className="mt-auto pt-5 text-sm font-semibold text-orange-600">
                Manage {item.title} →
              </span>
            </button>
          ))}
        </div>

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
            {/* Statistics Cards */}
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {statCards.map((card) => (
                <div
                  key={card.title}
                  className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        {card.title}
                      </p>

                      <p className="mt-3 text-3xl font-bold tracking-tight text-gray-950">
                        {card.value}
                      </p>
                    </div>

                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                      <StatIcon type={card.icon} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Dashboard Information */}
            <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    aria-hidden="true"
                  >
                    <path d="M4 19V10M10 19V5M16 19v-7M22 19H2" />
                  </svg>
                </div>

                <div>
                  <h2 className="text-lg font-semibold text-gray-950">
                    System Activity
                  </h2>

                  <p className="mt-1 text-sm leading-6 text-gray-600">
                    Use the dashboard statistics and management modules to
                    monitor customers, photographers, equipment, rentals,
                    bookings, payments, and revenue across the system.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
};

export default AdminHome;