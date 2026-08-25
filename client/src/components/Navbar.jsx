import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";

const dashboardRoutes = {
  CUSTOMER: "/customer",
  PHOTOGRAPHER: "/photographer",
  STAFF_ADMIN: "/admin",
};

const Navbar = () => {
  const navigate = useNavigate();

  const {
    user,
    isAuthenticated,
    logout,
    loading,
  } = useAuth();

  const handleLogout = async () => {
    await logout();

    navigate("/login", {
      replace: true,
    });
  };

  const dashboardPath = dashboardRoutes[user?.role];

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur">

      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">

        {/* ================= LOGO ================= */}
        <Link
          to="/"
          className="flex items-center gap-3"
        >

          {/* Logo */}
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-600 text-sm font-bold text-white shadow-sm">
            SCR
          </div>

          {/* Brand */}
          <div className="hidden sm:block">
            <p className="text-sm font-bold tracking-tight text-gray-950">
              Southern Camera Rental
            </p>

            <p className="text-[11px] text-gray-500">
              Rental & Booking System
            </p>
          </div>

        </Link>


        {/* ================= GUEST ================= */}
        {!loading && !isAuthenticated && (
          <div className="flex items-center gap-2">

            <Link
              to="/login"
              className="rounded-lg px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50 hover:text-gray-950"
            >
              Login
            </Link>

            <Link
              to="/register"
              className="rounded-lg bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-700"
            >
              Register
            </Link>

          </div>
        )}


        {/* ================= AUTHENTICATED ================= */}
        {!loading && isAuthenticated && (
          <div className="flex items-center gap-3">

            {/* Dashboard */}
            {dashboardPath && (
              <Link
                to={dashboardPath}
                className="rounded-lg px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-orange-50 hover:text-orange-600"
              >
                Dashboard
              </Link>
            )}


            {/* Divider */}
            <div className="hidden h-8 w-px bg-gray-200 sm:block" />


            {/* User Info */}
            <div className="hidden items-center gap-3 sm:flex">

              {/* User Details */}
              <div className="text-right">

                <p className="text-sm font-semibold leading-5 text-gray-950">
                  {user?.name}
                </p>

                <p className="text-xs font-medium text-gray-500">
                  {user?.role}
                </p>

              </div>


              {/* Avatar */}
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-100 text-sm font-bold text-orange-700 ring-4 ring-orange-50">
                {user?.name?.charAt(0)?.toUpperCase()}
              </div>

            </div>


            {/* Logout */}
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
            >
              Logout
            </button>

          </div>
        )}

        {loading && (
          <div
            className="h-9 w-28 animate-pulse rounded-lg bg-gray-100"
            aria-hidden="true"
          />
        )}

      </div>

    </nav>
  );
};

export default Navbar;