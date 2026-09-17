import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../../context/useAuth";

const Register = () => {
  const navigate = useNavigate();

  const {
    register,
    isAuthenticated,
    loading: authLoading,
  } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // ==========================================
  // REDIRECT AUTHENTICATED USERS
  // ==========================================

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate("/", {
        replace: true,
      });
    }
  }, [
    authLoading,
    isAuthenticated,
    navigate,
  ]);

  // ==========================================
  // HANDLE INPUT CHANGES
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
  // HANDLE REGISTRATION
  // ==========================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (
      formData.password !==
      formData.confirmPassword
    ) {
      setError(
        "Passwords do not match. Please check and try again."
      );

      return;
    }

    setLoading(true);

    try {
      await register(
        formData.name.trim(),
        formData.email.trim(),
        formData.password
      );

      setSuccess(
        "Customer account created successfully. Redirecting you to login..."
      );

      setTimeout(() => {
        navigate("/login", {
          replace: true,
        });
      }, 900);
    } catch (error) {
      const validationErrors =
        error.response?.data?.errors;

      const message =
        validationErrors?.email ||
        validationErrors?.password ||
        validationErrors?.name ||
        error.response?.data?.message ||
        "Registration failed. Please try again.";

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50">


      {/* ==========================================
          REGISTER LAYOUT
      ========================================== */}

      <div className="mx-auto grid min-h-[calc(100vh-73px)] max-w-7xl lg:grid-cols-[0.95fr_1.05fr]">

        {/* ==========================================
            LEFT INFORMATION PANEL
        ========================================== */}

        <section className="relative hidden overflow-hidden bg-gray-950 px-10 py-14 text-white lg:flex lg:flex-col lg:justify-between xl:px-14">

          {/* Decorative Elements */}

          <div className="absolute -right-28 -top-28 h-80 w-80 rounded-full bg-orange-600/10 blur-3xl" />

          <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-orange-500/10 blur-3xl" />


          <div className="relative">

            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-orange-400">

              <span className="h-2 w-2 rounded-full bg-orange-500" />

              Customer Registration

            </div>


            <h1 className="mt-8 max-w-lg text-4xl font-black leading-tight tracking-tight xl:text-5xl">
              Create your account and
              <span className="block text-orange-500">
                start your next project.
              </span>
            </h1>


            <p className="mt-6 max-w-lg text-base leading-8 text-gray-300">
              Browse equipment and photographers publicly,
              then use your customer account when you are
              ready to submit rental or photographer booking
              requests.
            </p>


            {/* ==========================================
                FEATURES
            ========================================== */}

            <div className="mt-10 space-y-4">

              {[
                {
                  title:
                    "Rent professional equipment",
                  description:
                    "Submit equipment rental requests once the equipment module is available.",
                },
                {
                  title:
                    "Book photographers",
                  description:
                    "View profiles, portfolios and availability, then submit a booking request.",
                },
                {
                  title:
                    "Manage your requests",
                  description:
                    "Track your customer bookings and rental activity from your account.",
                },
              ].map((item) => (

                <div
                  key={item.title}
                  className="flex gap-4 rounded-2xl border border-white/10 bg-white/5 p-4"
                >

                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-500/15 text-sm font-bold text-orange-400">
                    ✓
                  </div>

                  <div>

                    <p className="text-sm font-semibold text-white">
                      {item.title}
                    </p>

                    <p className="mt-1 text-sm leading-6 text-gray-400">
                      {item.description}
                    </p>

                  </div>

                </div>

              ))}

            </div>

          </div>


          {/* ==========================================
              ACCOUNT TYPE NOTICE
          ========================================== */}

          <div className="relative mt-12 rounded-2xl border border-white/10 bg-white/5 p-5">

            <p className="text-sm font-semibold text-white">
              Customer accounts only
            </p>

            <p className="mt-2 text-sm leading-6 text-gray-400">
              Public registration is available only for
              customers. Photographer and staff accounts
              are managed separately by authorized staff.
            </p>

          </div>

        </section>


        {/* ==========================================
            REGISTER FORM
        ========================================== */}

        <section className="flex items-center bg-white px-6 py-12 sm:px-10 lg:px-14 xl:px-20">

          <div className="mx-auto w-full max-w-lg">

            {/* Mobile Brand */}

            <div className="lg:hidden">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-600 text-sm font-bold text-white">
                SCR
              </div>

            </div>


            <p className="mt-6 text-sm font-semibold text-orange-600">
              Join Southern Camera Rental
            </p>

            <h2 className="mt-2 text-3xl font-black tracking-tight text-gray-950 sm:text-4xl">
              Create customer account
            </h2>

            <p className="mt-3 text-sm leading-6 text-gray-500">
              Register to submit equipment rental and
              photographer booking requests.
            </p>


            {/* ==========================================
                ERROR MESSAGE
            ========================================== */}

            {error && (

              <div
                className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700"
                role="alert"
              >
                {error}
              </div>

            )}


            {/* ==========================================
                SUCCESS MESSAGE
            ========================================== */}

            {success && (

              <div
                className="mt-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm leading-6 text-green-700"
                role="status"
              >
                {success}
              </div>

            )}


            {/* ==========================================
                FORM
            ========================================== */}

            <form
              onSubmit={handleSubmit}
              className="mt-8 space-y-5"
            >

              {/* Full Name */}

              <div>

                <label
                  htmlFor="name"
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  Full name
                </label>

                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  required
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
                />

              </div>


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
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create a password"
                  required
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
                />

                <p className="mt-2 text-xs leading-5 text-gray-400">
                  Use a secure password that you do not use
                  on other accounts.
                </p>

              </div>


              {/* Confirm Password */}

              <div>

                <label
                  htmlFor="confirmPassword"
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  Confirm password
                </label>

                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  value={
                    formData.confirmPassword
                  }
                  onChange={handleChange}
                  placeholder="Enter the password again"
                  required
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
                />

              </div>


              {/* ==========================================
                  REGISTER BUTTON
              ========================================== */}

              <button
                type="submit"
                disabled={
                  loading ||
                  authLoading ||
                  Boolean(success)
                }
                className="inline-flex w-full items-center justify-center rounded-xl bg-orange-600 px-5 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-700 focus:outline-none focus:ring-4 focus:ring-orange-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading
                  ? "Creating account..."
                  : success
                    ? "Account created"
                    : "Create Customer Account"}
              </button>

            </form>


            {/* ==========================================
                LOGIN LINK
            ========================================== */}

            <div className="mt-8 border-t border-gray-100 pt-6">

              <p className="text-center text-sm text-gray-500">
                Already have an account?{" "}

                <Link
                  to="/login"
                  className="font-semibold text-orange-600 transition hover:text-orange-700"
                >
                  Sign in
                </Link>

              </p>

            </div>


            {/* ==========================================
                PUBLIC DISCOVERY
            ========================================== */}

            <div className="mt-6 rounded-2xl border border-gray-200 bg-gray-50 p-4">

              <p className="text-center text-xs leading-5 text-gray-500">
                Just browsing? You can discover equipment
                and photographers without creating an
                account. Registration is needed when you
                want to rent or book.
              </p>

              <div className="mt-3 flex justify-center">

                <Link
                  to="/"
                  className="text-xs font-semibold text-gray-700 transition hover:text-orange-600"
                >
                  Continue discovering →
                </Link>

              </div>

            </div>

          </div>

        </section>

      </div>

    </main>
  );
};

export default Register;