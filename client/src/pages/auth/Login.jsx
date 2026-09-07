import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../../context/useAuth";

const dashboardRoutes = {
  CUSTOMER: "/",
  PHOTOGRAPHER: "/photographer",
  STAFF_ADMIN: "/admin",
};

const Login = () => {
  const navigate = useNavigate();

  const {
    login,
    user,
    isAuthenticated,
    loading: authLoading,
  } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // ==========================================
  // REDIRECT ALREADY AUTHENTICATED USER
  // ==========================================

  useEffect(() => {
    if (
      authLoading ||
      !isAuthenticated ||
      !user?.role
    ) {
      return;
    }

    if (
      user.role === "PHOTOGRAPHER" &&
      user.mustChangePassword
    ) {
      navigate(
        "/photographer/change-password",
        {
          replace: true,
        }
      );

      return;
    }

    navigate(
      dashboardRoutes[user.role] || "/",
      {
        replace: true,
      }
    );
  }, [
    authLoading,
    isAuthenticated,
    navigate,
    user?.role,
    user?.mustChangePassword,
  ]);

  // ==========================================
  // HANDLE INPUT CHANGE
  // ==========================================

  const handleChange = (event) => {
    const {
      name,
      value,
    } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // ==========================================
  // HANDLE LOGIN
  // ==========================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await login(
        formData.email.trim(),
        formData.password
      );

      const loggedInUser =
        response.data.user;

      if (
        loggedInUser.role === "PHOTOGRAPHER" &&
        loggedInUser.mustChangePassword
      ) {
        navigate(
          "/photographer/change-password",
          {
            replace: true,
          }
        );

        return;
      }

      navigate(
        dashboardRoutes[
          loggedInUser.role
        ] || "/",
        {
          replace: true,
        }
      );
    } catch (error) {
      const message =
        error.response?.data?.message ||
        "Login failed. Please check your credentials and try again.";

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f7f7f5]">


      {/* ==========================================
          LOGIN PAGE CONTENT
      ========================================== */}

      <section className="px-6 py-10 sm:py-14 lg:px-8">

        <div className="mx-auto grid max-w-6xl overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-xl lg:min-h-[650px] lg:grid-cols-[1fr_0.9fr]">


          {/* ==========================================
              LEFT INFORMATION PANEL
          ========================================== */}

          <section className="relative hidden overflow-hidden bg-gray-950 p-10 text-white lg:flex lg:flex-col lg:justify-between lg:p-12">

            {/* Decorative Background */}
            <div className="absolute -left-28 -top-28 h-72 w-72 rounded-full border-[48px] border-orange-500/10" />

            <div className="absolute -bottom-32 -right-24 h-80 w-80 rounded-full border-[55px] border-white/5" />


            {/* Main Content */}
            <div className="relative">

              <span className="inline-flex rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-orange-400">
                Welcome back
              </span>


              <h1 className="mt-7 max-w-lg text-4xl font-black leading-tight tracking-tight xl:text-5xl">
                Your equipment and photographer services,
                <span className="block text-orange-500">
                  all in one account.
                </span>
              </h1>


              <p className="mt-6 max-w-lg text-base leading-8 text-gray-300">

                Sign in to continue with the services
                available for your account.

                Customers can submit rental and photographer
                booking requests, while photographers and
                staff access their own dedicated dashboards.

              </p>


              {/* Benefits */}
              <div className="mt-10 space-y-4">

                {[
                  "Access your role-based dashboard",
                  "Manage equipment rental activities",
                  "Manage photographer booking activities",
                  "View and track your account information",
                ].map((item) => (

                  <div
                    key={item}
                    className="flex items-center gap-3"
                  >

                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-orange-500/15 text-xs font-bold text-orange-400">
                      ✓
                    </div>

                    <p className="text-sm text-gray-300">
                      {item}
                    </p>

                  </div>

                ))}

              </div>

            </div>


            {/* Security Box */}
            <div className="relative rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">

              <div className="flex items-start gap-4">

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500/15 text-orange-400">
                  🔒
                </div>

                <div>

                  <p className="font-semibold text-white">
                    Secure account access
                  </p>

                  <p className="mt-1 text-sm leading-6 text-gray-400">

                    Authentication and role-based authorization
                    help ensure users access only the features
                    available to their account type.

                  </p>

                </div>

              </div>

            </div>

          </section>



          {/* ==========================================
              RIGHT LOGIN FORM
          ========================================== */}

          <section className="flex items-center p-7 sm:p-10 lg:p-12">

            <div className="mx-auto w-full max-w-md">


              {/* Mobile Logo */}
              <div className="lg:hidden">

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-600 text-xs font-black text-white shadow-sm">
                  SCR
                </div>

              </div>


              {/* Heading */}
              <div className="mt-6 lg:mt-0">

                <p className="text-sm font-bold uppercase tracking-[0.15em] text-orange-600">
                  Account login
                </p>


                <h2 className="mt-3 text-3xl font-black tracking-tight text-gray-950 sm:text-4xl">
                  Sign in to continue
                </h2>


                <p className="mt-4 text-sm leading-7 text-gray-500">

                  Enter the email address and password
                  associated with your account.

                </p>

              </div>



              {/* Error Message */}
              {error && (

                <div
                  className="mt-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                  role="alert"
                >

                  <span className="mt-0.5 font-bold">
                    !
                  </span>

                  <span>
                    {error}
                  </span>

                </div>

              )}



              {/* Login Form */}
              <form
                onSubmit={handleSubmit}
                className="mt-8 space-y-5"
              >

                {/* Email */}
                <div>

                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-semibold text-gray-700"
                  >
                    Email address
                  </label>

                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    required
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
                  />

                </div>


                {/* Password */}
                <div>

                  <label
                    htmlFor="password"
                    className="mb-2 block text-sm font-semibold text-gray-700"
                  >
                    Password
                  </label>

                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    required
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
                  />

                </div>


                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={
                    loading ||
                    authLoading
                  }
                  className="inline-flex w-full items-center justify-center rounded-xl bg-orange-600 px-5 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-orange-700 focus:outline-none focus:ring-4 focus:ring-orange-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading
                    ? "Signing in..."
                    : "Sign in"}
                </button>

              </form>



              {/* Divider */}
              <div className="my-7 flex items-center gap-4">

                <div className="h-px flex-1 bg-gray-200" />

                <span className="text-xs font-medium uppercase tracking-wider text-gray-400">
                  New customer?
                </span>

                <div className="h-px flex-1 bg-gray-200" />

              </div>



              {/* Registration */}
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 text-center">

                <p className="text-sm font-semibold text-gray-900">
                  Need a customer account?
                </p>


                <p className="mt-2 text-sm leading-6 text-gray-500">

                  Create an account to submit equipment
                  rental requests and photographer booking
                  requests.

                </p>


                <Link
                  to="/register"
                  className="mt-4 inline-flex items-center justify-center font-semibold text-orange-600 transition hover:text-orange-700"
                >
                  Register as Customer

                  <span className="ml-1.5">
                    →
                  </span>
                </Link>

              </div>



              {/* Public Discovery Link */}
              <p className="mt-6 text-center text-xs leading-6 text-gray-400">

                Just exploring?{" "}

                <Link
                  to="/"
                  className="font-semibold text-gray-600 transition hover:text-orange-600"
                >
                  Return to the public discovery page
                </Link>

              </p>

            </div>

          </section>

        </div>

      </section>

    </main>
  );
};

export default Login;