import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../context/useAuth";
import api from "../../services/api";

const AdminHome = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
      title: "Active Rentals",
      value: formatNumber(stats?.activeRentals),
    },
    {
      title: "Overdue Rentals",
      value: formatNumber(stats?.overdueRentals),
    },
    {
      title: "Upcoming Bookings",
      value: formatNumber(
        stats?.upcomingPhotographerBokings
      ),
    },
    {
      title: "Total Payments",
      value: formatNumber(stats?.totalPayments),
    },
    {
      title: "Monthly Revenue",
      value: formatCurrency(stats?.monthlyRevenue),
    },
  ];

  return (
    <main className="min-h-full bg-gray-100 px-6 py-8">
      <div className="mx-auto max-w-7xl">

        {/* Page Header */}
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-orange-600">
            Dashboard
          </p>

          <h1 className="mt-2 text-3xl font-bold text-gray-950">
            Welcome, {user?.name || "Admin"}
          </h1>

          <p className="mt-2 text-gray-600">
            Here's an overview of the CameraRent system.
          </p>
        </div>

        {/* Quick Management Links */}
        <div className="mb-8 grid gap-5 md:grid-cols-3">
          {[
            [
              "Users",
              "Manage customer and system user accounts.",
            ],
            [
              "Photographers",
              "Create and manage photographer accounts.",
            ],
            [
              "Equipment",
              "Manage camera equipment and rental inventory.",
            ],
          ].map(([title, description]) => (
            <div
              key={title}
              onClick={() => {
                if (title === "Equipment") {
                  navigate("/admin/equipment");
                }
              }}
              className={`rounded-2xl border border-gray-200 bg-white p-6 shadow-sm ${
                title === "Equipment"
                  ? "cursor-pointer transition hover:border-orange-300 hover:shadow-md"
                  : ""
              }`}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 font-bold text-orange-600">
                {title.charAt(0)}
              </div>

              <h2 className="mt-5 text-lg font-semibold text-gray-950">
                {title}
              </h2>

              <p className="mt-2 text-sm leading-6 text-gray-600">
                {description}
              </p>
            </div>
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
                  <p className="text-sm font-medium text-gray-500">
                    {card.title}
                  </p>

                  <p className="mt-3 text-3xl font-bold text-gray-950">
                    {card.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Dashboard Information */}
            <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-950">
                System Overview
              </h2>

              <p className="mt-2 text-sm leading-6 text-gray-600">
                Dashboard statistics are retrieved from the Staff
                Admin dashboard API. Equipment, rental and
                photographer booking statistics will appear
                automatically when their respective modules
                provide data.
              </p>
            </div>
          </>
        )}
      </div>
    </main>
  );
};

export default AdminHome;