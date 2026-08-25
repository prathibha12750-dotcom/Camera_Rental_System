import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../../context/useAuth";

const dashboardRoutes = {
  CUSTOMER: "/customer",
  PHOTOGRAPHER: "/photographer",
  STAFF_ADMIN: "/admin",
};

const Login = () => {
  const navigate = useNavigate();
  const { login, user, isAuthenticated, loading: authLoading } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && isAuthenticated && user?.role) {
      navigate(dashboardRoutes[user.role] || "/", { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate, user?.role]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await login(formData.email.trim(), formData.password);
      const loggedInUser = response.data.user;
      navigate(dashboardRoutes[loggedInUser.role] || "/", { replace: true });
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
    <main className="min-h-[calc(100vh-4rem)] bg-gray-50 px-6 py-12 sm:py-16">
      <div className="mx-auto grid max-w-6xl overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-xl lg:grid-cols-[0.9fr_1.1fr]">
        <section className="hidden bg-gray-950 p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-600 text-sm font-bold shadow-lg shadow-orange-950/30">
              SCR
            </div>
            <p className="mt-8 text-sm font-semibold uppercase tracking-[0.2em] text-orange-400">
              Southern Camera Rental
            </p>
            <h1 className="mt-4 max-w-md text-4xl font-bold leading-tight">
              Your next shoot starts here.
            </h1>
            <p className="mt-5 max-w-md leading-7 text-gray-300">
              Rent professional equipment and connect with photographers from one simple platform.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm font-medium text-white">Secure access</p>
            <p className="mt-1 text-sm leading-6 text-gray-400">
              Your account access is protected with authenticated sessions and role-based permissions.
            </p>
          </div>
        </section>

        <section className="p-7 sm:p-10 lg:p-12">
          <div className="mx-auto max-w-md">
            <div className="lg:hidden">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-600 text-sm font-bold text-white">
                SCR
              </div>
            </div>

            <p className="mt-6 text-sm font-semibold text-orange-600">Welcome back</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-gray-950">
              Sign in to your account
            </h2>
            <p className="mt-3 text-sm leading-6 text-gray-500">
              Enter your credentials to continue to your dashboard.
            </p>

            {error && (
              <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-700">
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
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
                />
              </div>

              <div>
                <label htmlFor="password" className="mb-2 block text-sm font-medium text-gray-700">
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
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
                />
              </div>

              <button
                type="submit"
                disabled={loading || authLoading}
                className="inline-flex w-full items-center justify-center rounded-xl bg-orange-600 px-5 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-700 focus:outline-none focus:ring-4 focus:ring-orange-100 disabled:opacity-60"
              >
                {loading ? "Signing in..." : "Sign in"}
              </button>
            </form>

            <p className="mt-7 text-center text-sm text-gray-500">
              Don&apos;t have an account?{" "}
              <Link to="/register" className="font-semibold text-orange-600 hover:text-orange-700">
                Register as Customer
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
};

export default Login;
