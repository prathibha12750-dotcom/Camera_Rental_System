import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../context/useAuth";
import api from "../../services/api";

const PhotographerChangePassword = () => {
  const navigate = useNavigate();

  const {
    user,
    updateUser,
    logout,
  } = useAuth();

  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // ==========================================
  // HANDLE INPUT
  // ==========================================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // ==========================================
  // HANDLE PASSWORD CHANGE
  // ==========================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (
      formData.newPassword !==
      formData.confirmPassword
    ) {
      setError(
        "New password and confirmation do not match."
      );

      return;
    }

    if (formData.newPassword.length < 8) {
      setError(
        "New password must be at least 8 characters long."
      );

      return;
    }

    setLoading(true);

    try {
      const response = await api.put(
        "/auth/change-temporary-password",
        formData
      );

      const updatedUser =
        response.data.data.user;

      updateUser({
        ...user,
        ...updatedUser,
        mustChangePassword: false,
      });

      setSuccess(
        "Password changed successfully. Redirecting to your photographer dashboard..."
      );

      navigate(
        "/photographer",
        {
          replace: true,
        }
      );
    } catch (error) {
      const message =
        error.response?.data?.message ||
        "Unable to change your password. Please try again.";

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // LOGOUT
  // ==========================================

  const handleLogout = async () => {
    await logout();

    navigate(
      "/login",
      {
        replace: true,
      }
    );
  };

  return (
    <main className="min-h-screen bg-[#f7f7f5] px-6 py-10 sm:py-14 lg:px-8">

      <div className="mx-auto max-w-xl">

        <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-xl">

          {/* Header */}
          <div className="bg-gray-950 px-7 py-8 text-white sm:px-10">

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-600 text-sm font-black">
              SCR
            </div>

            <p className="mt-6 text-sm font-bold uppercase tracking-[0.15em] text-orange-400">
              Photographer Account Security
            </p>

            <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
              Create your new password
            </h1>

            <p className="mt-4 text-sm leading-7 text-gray-300">
              Your photographer account was created
              using a temporary password. You must
              replace it before accessing photographer
              features.
            </p>

          </div>

          {/* Form */}
          <div className="p-7 sm:p-10">

            <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4">

              <p className="text-sm font-semibold text-orange-900">
                Signed in as
              </p>

              <p className="mt-1 break-all text-sm text-orange-800">
                {user?.email}
              </p>

            </div>

            {error && (
              <div
                className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                role="alert"
              >
                {error}
              </div>
            )}

            {success && (
              <div
                className="mt-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
                role="status"
              >
                {success}
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="mt-7 space-y-5"
            >

              {/* Current Password */}
              <div>

                <label
                  htmlFor="currentPassword"
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  Temporary password
                </label>

                <input
                  id="currentPassword"
                  name="currentPassword"
                  type="password"
                  autoComplete="current-password"
                  value={formData.currentPassword}
                  onChange={handleChange}
                  placeholder="Enter your temporary password"
                  required
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3.5 text-sm text-gray-900 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
                />

              </div>

              {/* New Password */}
              <div>

                <label
                  htmlFor="newPassword"
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  New password
                </label>

                <input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  autoComplete="new-password"
                  value={formData.newPassword}
                  onChange={handleChange}
                  placeholder="At least 8 characters"
                  required
                  minLength={8}
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3.5 text-sm text-gray-900 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
                />

              </div>

              {/* Confirm Password */}
              <div>

                <label
                  htmlFor="confirmPassword"
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  Confirm new password
                </label>

                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Re-enter your new password"
                  required
                  minLength={8}
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3.5 text-sm text-gray-900 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
                />

              </div>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center rounded-xl bg-orange-600 px-5 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-orange-700 focus:outline-none focus:ring-4 focus:ring-orange-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading
                  ? "Changing password..."
                  : "Change Password"}
              </button>

            </form>

            <button
              type="button"
              onClick={handleLogout}
              disabled={loading}
              className="mt-4 w-full text-center text-sm font-semibold text-gray-500 transition hover:text-gray-900 disabled:opacity-60"
            >
              Sign out
            </button>

          </div>

        </div>

      </div>

    </main>
  );
};

export default PhotographerChangePassword;