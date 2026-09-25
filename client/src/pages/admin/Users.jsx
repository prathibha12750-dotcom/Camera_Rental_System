import { useState } from "react";
import api from "../../services/api";

const Users = () => {
  const [showCreatePhotographer, setShowCreatePhotographer] = useState(false);

  const [showCreateClerk, setShowCreateClerk] = useState(false);

  const [clerkFormData, setClerkFormData] = useState({
    name: "",
    email: "",
  });

  const [clerkLoading, setClerkLoading] = useState(false);
  const [clerkSuccessMessage, setClerkSuccessMessage] = useState("");
  const [clerkErrorMessage, setClerkErrorMessage] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleClerkChange = (event) => {
    const { name, value } = event.target;

    setClerkFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleClerkSubmit = async (event) => {
    event.preventDefault();

    setClerkSuccessMessage("");
    setClerkErrorMessage("");

    // ==========================================
    // FRONTEND VALIDATION
    // ==========================================

    if (!clerkFormData.name.trim()) {
      setClerkErrorMessage(
        "Clerk name is required."
      );
      return;
    }

    if (!clerkFormData.email.trim()) {
      setClerkErrorMessage(
        "Clerk email is required."
      );
      return;
    }

    try {
      setClerkLoading(true);

      const response = await api.post(
        "/admin/clerks",
        {
          name: clerkFormData.name.trim(),
          email: clerkFormData.email.trim(),
        }
      );

      setClerkSuccessMessage(
        response.data?.message ||
          "Clerk account created successfully."
      );

      setClerkFormData({
        name: "",
        email: "",
      });
    } catch (error) {
      console.error(
        "Create clerk error:",
        error
      );

      const status = error.response?.status;

      if (status === 400) {
        setClerkErrorMessage(
          error.response?.data?.message ||
            "Please check the entered information."
        );
      } else if (status === 409) {
        setClerkErrorMessage(
          error.response?.data?.message ||
            "An account with this email already exists."
        );
      } else if (status === 401) {
        setClerkErrorMessage(
          "Your session has expired. Please log in again."
        );
      } else if (status === 403) {
        setClerkErrorMessage(
          "You do not have permission to create a clerk account."
        );
      } else {
        setClerkErrorMessage(
          error.response?.data?.message ||
            "Failed to create clerk account."
        );
      }
    } finally {
      setClerkLoading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setSuccessMessage("");
    setErrorMessage("");

    // -------------------------------
    // Frontend validation
    // -------------------------------

    if (!formData.name.trim()) {
      setErrorMessage("Name is required.");
      return;
    }

    if (!formData.email.trim()) {
      setErrorMessage("Email is required.");
      return;
    }

    if (!formData.password) {
      setErrorMessage("Password is required.");
      return;
    }

    if (formData.password.length < 8) {
      setErrorMessage("Password must be at least 8 characters long.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const response = await api.post("/admin/photographers", {
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
      });

      setSuccessMessage(
        response.data?.message ||
          "Photographer account created successfully."
      );

      setFormData({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
      });
    } catch (error) {
      console.error("Create photographer error:", error);

      const status = error.response?.status;

      if (status === 400) {
        setErrorMessage(
          error.response?.data?.message ||
            "Please check the entered information."
        );
      } else if (status === 409) {
        setErrorMessage(
          error.response?.data?.message ||
            "An account with this email already exists."
        );
      } else if (status === 401) {
        setErrorMessage(
          "Your session has expired. Please log in again."
        );
      } else if (status === 403) {
        setErrorMessage(
          "You do not have permission to create a photographer account."
        );
      } else {
        setErrorMessage(
          error.response?.data?.message ||
            "Failed to create photographer account."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const closeCreatePhotographer = () => {
    if (loading) {
      return;
    }

    setShowCreatePhotographer(false);
    setSuccessMessage("");
    setErrorMessage("");
  };

  return (
    <main className="min-h-full bg-gray-100 px-6 py-8">
      <div className="mx-auto max-w-7xl">

        {/* Page Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-orange-600">
              User Management
            </p>

            <h1 className="mt-2 text-3xl font-bold text-gray-950">
              Users
            </h1>

            <p className="mt-2 text-gray-600">
              Manage customers, photographers and staff accounts.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setShowCreatePhotographer(true);
              setSuccessMessage("");
              setErrorMessage("");
            }}
            className="rounded-xl bg-orange-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-700"
          >
            + Create Photographer
          </button>
        </div>

        {/* User Categories */}
        <div className="mt-8 grid gap-5 md:grid-cols-3">

          {/* Customers */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 font-bold text-orange-600">
              C
            </div>

            <h2 className="mt-5 text-lg font-semibold text-gray-950">
              Customers
            </h2>

            <p className="mt-2 text-sm leading-6 text-gray-600">
              View and manage customer accounts.
            </p>

            <div className="mt-5 rounded-xl bg-gray-50 px-4 py-3">
              <p className="text-sm text-gray-500">
                Customer management
              </p>

              <p className="mt-1 text-sm font-semibold text-gray-700">
                Coming soon
              </p>
            </div>
          </div>

          {/* Photographers */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 font-bold text-orange-600">
              P
            </div>

            <h2 className="mt-5 text-lg font-semibold text-gray-950">
              Photographers
            </h2>

            <p className="mt-2 text-sm leading-6 text-gray-600">
              Create and manage photographer accounts.
            </p>

            <button
              type="button"
              onClick={() => {
                setShowCreatePhotographer(true);
                setSuccessMessage("");
                setErrorMessage("");
              }}
              className="mt-5 w-full rounded-xl border border-orange-200 px-4 py-3 text-sm font-semibold text-orange-600 transition hover:bg-orange-50"
            >
              Create Photographer
            </button>
          </div>

          {/* Clerks */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 font-bold text-orange-600">
              C
            </div>

            <h2 className="mt-5 text-lg font-semibold text-gray-950">
              Clerks
            </h2>

            <p className="mt-2 text-sm leading-6 text-gray-600">
              Create and manage clerk accounts.
            </p>

            <button
              type="button"
              onClick={() => {
                setShowCreateClerk(true);
                setShowCreatePhotographer(false);
                setClerkSuccessMessage("");
                setClerkErrorMessage("");
              }}
              className="mt-5 w-full rounded-xl border border-orange-200 px-4 py-3 text-sm font-semibold text-orange-600 transition hover:bg-orange-50"
            >
              Create Clerk
            </button>
          </div>

        </div>

        {/* Create Photographer Form */}
        {showCreatePhotographer && (
          <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-950">
                  Create Photographer Account
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Create a new photographer account for the system.
                </p>
              </div>

              <button
                type="button"
                onClick={closeCreatePhotographer}
                disabled={loading}
                className="rounded-lg px-3 py-2 text-sm font-medium text-gray-500 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Close
              </button>
            </div>

            {/* Success Message */}
            {successMessage && (
              <div className="mt-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
                <p className="text-sm font-medium text-green-800">
                  {successMessage}
                </p>
              </div>
            )}

            {/* Error Message */}
            {errorMessage && (
              <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                <p className="text-sm font-medium text-red-800">
                  {errorMessage}
                </p>
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="mt-6 grid gap-5 md:grid-cols-2"
            >

              {/* Name */}
              <div>
                <label
                  htmlFor="name"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Full Name
                </label>

                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter photographer name"
                  disabled={loading}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100 disabled:bg-gray-100"
                />
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Email Address
                </label>

                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter photographer email"
                  disabled={loading}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100 disabled:bg-gray-100"
                />
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Password
                </label>

                <input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Minimum 8 characters"
                  disabled={loading}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100 disabled:bg-gray-100"
                />
              </div>

              {/* Confirm Password */}
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Confirm Password
                </label>

                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Re-enter password"
                  disabled={loading}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100 disabled:bg-gray-100"
                />
              </div>

              {/* Submit */}
              <div className="md:col-span-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-xl bg-orange-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading
                    ? "Creating Photographer..."
                    : "Create Photographer"}
                </button>
              </div>

            </form>
          </div>
        )}

        {/* ==========================================
            CREATE CLERK FORM
        ========================================== */}

        {showCreateClerk && (
          <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-950">
                  Create Clerk Account
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Create a new clerk account for the system.
                  A temporary password will be generated and
                  sent to the clerk by email.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (clerkLoading) {
                    return;
                  }

                  setShowCreateClerk(false);
                  setClerkSuccessMessage("");
                  setClerkErrorMessage("");
                }}
                disabled={clerkLoading}
                className="rounded-lg px-3 py-2 text-sm font-medium text-gray-500 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Close
              </button>
            </div>


            {/* Success Message */}
            {clerkSuccessMessage && (
              <div className="mt-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
                <p className="text-sm font-medium text-green-800">
                  {clerkSuccessMessage}
                </p>

                <p className="mt-1 text-sm text-green-700">
                  The clerk can use the temporary password
                  sent by email to sign in.
                </p>
              </div>
            )}


            {/* Error Message */}
            {clerkErrorMessage && (
              <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                <p className="text-sm font-medium text-red-800">
                  {clerkErrorMessage}
                </p>
              </div>
            )}


            {/* Clerk Form */}
            <form
              onSubmit={handleClerkSubmit}
              className="mt-6 grid gap-5 md:grid-cols-2"
            >

              {/* Name */}
              <div>
                <label
                  htmlFor="clerkName"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Full Name
                </label>

                <input
                  id="clerkName"
                  name="name"
                  type="text"
                  value={clerkFormData.name}
                  onChange={handleClerkChange}
                  placeholder="Enter clerk name"
                  disabled={clerkLoading}
                  autoComplete="name"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100 disabled:bg-gray-100"
                />
              </div>


              {/* Email */}
              <div>
                <label
                  htmlFor="clerkEmail"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Email Address
                </label>

                <input
                  id="clerkEmail"
                  name="email"
                  type="email"
                  value={clerkFormData.email}
                  onChange={handleClerkChange}
                  placeholder="Enter clerk email"
                  disabled={clerkLoading}
                  autoComplete="email"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100 disabled:bg-gray-100"
                />
              </div>


              {/* Information */}
              <div className="md:col-span-2">
                <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
                  <p className="text-sm text-blue-800">
                    You do not need to create a password manually.
                    The system will generate a temporary password
                    and send the login credentials to the clerk's
                    email address.
                  </p>
                </div>
              </div>


              {/* Submit */}
              <div className="md:col-span-2">
                <button
                  type="submit"
                  disabled={clerkLoading}
                  className="rounded-xl bg-orange-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {clerkLoading
                    ? "Creating Clerk..."
                    : "Create Clerk"}
                </button>
              </div>

            </form>
          </div>
        )}

      </div>
    </main>
  );
};

export default Users;