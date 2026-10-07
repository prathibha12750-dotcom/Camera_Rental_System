import { useEffect, useRef, useState } from "react";
import api from "../../services/api";

const Users = () => {
  const [showCreatePhotographer, setShowCreatePhotographer] = useState(false);
  const [showCreateClerk, setShowCreateClerk] = useState(false);
  const [clerkFormData, setClerkFormData] = useState({name: "", email: "",});
  const [clerkLoading, setClerkLoading] = useState(false);
  const [clerkSuccessMessage, setClerkSuccessMessage] = useState("");
  const [clerkErrorMessage, setClerkErrorMessage] = useState("");

  const [formData, setFormData] = useState({name: "", email: "", password: "", confirmPassword: "",});
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [staffAccounts, setStaffAccounts] = useState([]);
  const [staffAccountsLoading, setStaffAccountsLoading] = useState(true);
  const [staffAccountsError, setStaffAccountsError] = useState("");
  const [selectedStaffType, setSelectedStaffType] = useState(null);
  const [staffSearch, setStaffSearch] = useState("");
  const [staffPage, setStaffPage] = useState(1);
  const STAFF_PER_PAGE = 8;

  const [updatingAccountId, setUpdatingAccountId] = useState(null);
  const [accountActionError, setAccountActionError] = useState("");

  const staffManagementRef = useRef(null);
  const createPhotographerRef = useRef(null);
  const createClerkRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const loadStaffAccounts = async () => {
      try {
        const response = await api.get(
          "/admin/staff-accounts"
        );

        if (!isMounted) {
          return;
        }

        setStaffAccounts(
          response.data?.data?.users || []
        );
      } catch (error) {
        console.error(
          "Fetch staff accounts error:",
          error
        );

        if (!isMounted) {
          return;
        }

        setStaffAccountsError(
          error.response?.data?.message ||
            "Failed to load staff accounts."
        );
      } finally {
        if (isMounted) {
          setStaffAccountsLoading(false);
        }
      }
    };

    loadStaffAccounts();

    return () => {
      isMounted = false;
    };
  }, []);

  const scrollToSection = (ref) => {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        ref.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
    });
  };

  const handleAccountStatusChange = async (account) => {
    const newStatus =
      account.status === "ACTIVE"
        ? "INACTIVE"
        : "ACTIVE";

    try {
      setUpdatingAccountId(account._id);
      setAccountActionError("");

      const response = await api.patch(
        `/admin/users/${account._id}/status`,
        {
          status: newStatus,
        }
      );

      const updatedUser =
        response.data?.data?.user;

      setStaffAccounts((previous) =>
        previous.map((item) =>
          item._id === account._id
            ? {
                ...item,
                status:
                  updatedUser?.status ||
                  newStatus,
              }
            : item
        )
      );
    } catch (error) {
      console.error(
        "Update account status error:",
        error
      );

      setAccountActionError(
        error.response?.data?.message ||
          "Failed to update account status."
      );
    } finally {
      setUpdatingAccountId(null);
    }
  };

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

      const createdClerk =
        response.data?.data?.clerk;

      if (createdClerk) {
        const newAccount = {
          _id: createdClerk.id,
          name: createdClerk.name,
          email: createdClerk.email,
          role: createdClerk.role,
          status: createdClerk.status,
          mustChangePassword:
            createdClerk.mustChangePassword,
          createdAt: new Date().toISOString(),
        };

        setStaffAccounts((previous) => [
          newAccount,
          ...previous.filter(
            (account) =>
              account._id !== newAccount._id
          ),
        ]);

        setSelectedStaffType("CLERK");
        setStaffSearch("");
        setStaffPage(1);
      }

      setClerkSuccessMessage(
        response.data?.message ||
          "Clerk account created successfully."
      );

      setClerkFormData({
        name: "",
        email: "",
      });

      setShowCreateClerk(false);
      scrollToSection(staffManagementRef);

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

      const createdPhotographer =
        response.data?.data?.photographer;

      if (createdPhotographer) {
        const newAccount = {
          _id: createdPhotographer.userId,
          name: createdPhotographer.name,
          email: createdPhotographer.email,
          role: createdPhotographer.role,
          status: createdPhotographer.status,
          mustChangePassword: false,
          createdAt: new Date().toISOString(),
        };

        setStaffAccounts((previous) => [
          newAccount,
          ...previous.filter(
            (account) =>
              account._id !== newAccount._id
          ),
        ]);

        setSelectedStaffType("PHOTOGRAPHER");
        setStaffSearch("");
        setStaffPage(1);
      }

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

      setShowCreatePhotographer(false);
      scrollToSection(staffManagementRef);

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

  const filteredStaffAccounts = selectedStaffType
    ? staffAccounts.filter((account) => {
        if (account.role !== selectedStaffType) {
          return false;
        }

        const searchValue =
          staffSearch.trim().toLowerCase();

        if (!searchValue) {
          return true;
        }

        const name =
          account.name?.toLowerCase() || "";

        const email =
          account.email?.toLowerCase() || "";

        return (
          name.includes(searchValue) ||
          email.includes(searchValue)
        );
      })
    : [];

  const totalStaffPages = Math.max(
    1,
    Math.ceil(
      filteredStaffAccounts.length /
        STAFF_PER_PAGE
    )
  );

  const staffStartIndex =
    (staffPage - 1) * STAFF_PER_PAGE;

  const paginatedStaffAccounts =
    filteredStaffAccounts.slice(
      staffStartIndex,
      staffStartIndex + STAFF_PER_PAGE
    );

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
        </div>

        {/* User Categories */}
        <div className="mt-8 grid gap-5 md:grid-cols-2">

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
                setSelectedStaffType("PHOTOGRAPHER");
                setStaffSearch("");
                setStaffPage(1);
                setShowCreatePhotographer(false);
                setShowCreateClerk(false);
                setSuccessMessage("");
                setErrorMessage("");

                scrollToSection(staffManagementRef);
              }}
              className={`mt-5 w-full rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                selectedStaffType === "PHOTOGRAPHER"
                  ? "border-orange-600 bg-orange-600 text-white"
                  : "border-orange-200 text-orange-600 hover:bg-orange-50"
              }`}
            >
              {selectedStaffType === "PHOTOGRAPHER"
                ? "Viewing Photographers"
                : "Manage Photographers"}
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
                setSelectedStaffType("CLERK");
                setStaffSearch("");
                setStaffPage(1);
                setShowCreateClerk(false);
                setShowCreatePhotographer(false);
                setClerkSuccessMessage("");
                setClerkErrorMessage("");

                scrollToSection(staffManagementRef);
              }}
              className={`mt-5 w-full rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                selectedStaffType === "CLERK"
                  ? "border-orange-600 bg-orange-600 text-white"
                  : "border-orange-200 text-orange-600 hover:bg-orange-50"
              }`}
            >
              {selectedStaffType === "CLERK"
                ? "Viewing Clerks"
                : "Manage Clerks"}
            </button>
          </div>

        </div>

        {/* ==========================================
            STAFF ACCOUNT MANAGEMENT
        ========================================== */}

        {selectedStaffType && (
          <>
        <div
          ref={staffManagementRef}
          className="scroll-mt-6 mt-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
        >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-orange-600">
              Account Management
            </p>

            <h2 className="mt-2 text-xl font-semibold text-gray-950">
              {selectedStaffType === "PHOTOGRAPHER"
                ? "Photographer Accounts"
                : "Clerk Accounts"}
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              {selectedStaffType === "PHOTOGRAPHER"
                ? "Search, review, enable or disable photographer accounts."
                : "Search, review, enable or disable clerk accounts."}
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              if (selectedStaffType === "PHOTOGRAPHER") {
                setShowCreatePhotographer(true);
                setShowCreateClerk(false);
                setSuccessMessage("");
                setErrorMessage("");

                scrollToSection(createPhotographerRef);
              } else {
                setShowCreateClerk(true);
                setShowCreatePhotographer(false);
                setClerkSuccessMessage("");
                setClerkErrorMessage("");

                scrollToSection(createClerkRef);
              }
            }}
            className="shrink-0 rounded-xl bg-orange-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-700"
          >
            {selectedStaffType === "PHOTOGRAPHER"
              ? "+ Create Photographer"
              : "+ Create Clerk"}
          </button>
        </div>

          {accountActionError && (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-sm font-medium text-red-800">
                {accountActionError}
              </p>
            </div>
          )}

          <div className="mt-6">
            <label
              htmlFor="staffSearch"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Search {selectedStaffType === "PHOTOGRAPHER"
                ? "Photographers"
                : "Clerks"}
            </label>

            <div className="relative max-w-xl">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>

              <input
                id="staffSearch"
                type="search"
                value={staffSearch}
                onChange={(event) => {
                  setStaffSearch(event.target.value);
                  setStaffPage(1);
                }}
                placeholder="Search by name or email..."
                className="w-full rounded-xl border border-gray-300 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              />
            </div>
          </div>

          {/* Loading */}
          {staffAccountsLoading && (
            <div className="mt-6 rounded-xl bg-gray-50 px-4 py-6 text-center">
              <p className="text-sm text-gray-500">
                Loading staff accounts...
              </p>
            </div>
          )}

          {/* Error */}
          {!staffAccountsLoading && staffAccountsError && (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-sm font-medium text-red-800">
                {staffAccountsError}
              </p>
            </div>
          )}

          {/* Empty State */}
          {!staffAccountsLoading &&
            !staffAccountsError &&
            filteredStaffAccounts.length === 0 && (
              <div className="mt-6 rounded-xl bg-gray-50 px-4 py-6 text-center">
                <p className="text-sm text-gray-500">
                  {staffSearch.trim()
                    ? "No accounts match your search."
                    : `No ${
                        selectedStaffType === "PHOTOGRAPHER"
                          ? "Photographer"
                          : "Clerk"
                      } accounts found.`}
                </p>
              </div>
            )}

          {/* Accounts */}
          {!staffAccountsLoading &&
            !staffAccountsError &&
            staffAccounts.length > 0 && (
              <div className="mt-6 overflow-x-auto">
                <table className="w-full min-w-[700px] text-left">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                        User
                      </th>

                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Role
                      </th>

                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Status
                      </th>

                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Created
                      </th>

                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100">
                    {paginatedStaffAccounts.map((account) => (
                      <tr
                        key={account._id}
                        className="transition hover:bg-gray-50"
                      >
                        <td className="px-4 py-4">
                          <p className="text-sm font-semibold text-gray-900">
                            {account.name}
                          </p>

                          <p className="mt-1 text-xs text-gray-500">
                            {account.email}
                          </p>
                        </td>

                        <td className="px-4 py-4">
                          <span className="text-sm font-medium text-gray-700">
                            {account.role === "PHOTOGRAPHER"
                              ? "Photographer"
                              : "Clerk"}
                          </span>
                        </td>

                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                              account.status === "ACTIVE"
                                ? "bg-green-50 text-green-700"
                                : "bg-red-50 text-red-700"
                            }`}
                          >
                            {account.status === "ACTIVE"
                              ? "Active"
                              : "Inactive"}
                          </span>
                        </td>

                        <td className="px-4 py-4 text-sm text-gray-600">
                          {account.createdAt
                            ? new Date(
                                account.createdAt
                              ).toLocaleDateString()
                            : "—"}
                        </td>

                        <td className="px-4 py-4 text-right">
                          <button
                            type="button"
                            onClick={() =>
                              handleAccountStatusChange(account)
                            }
                            disabled={
                              updatingAccountId === account._id
                            }
                            className={`rounded-lg px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                              account.status === "ACTIVE"
                                ? "border border-red-200 text-red-600 hover:bg-red-50"
                                : "border border-green-200 text-green-700 hover:bg-green-50"
                            }`}
                          >
                            {updatingAccountId === account._id
                              ? "Updating..."
                              : account.status === "ACTIVE"
                                ? "Disable"
                                : "Enable"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredStaffAccounts.length > 0 && (
                  <div className="mt-6 flex flex-col gap-4 border-t border-gray-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-gray-500">
                      Showing{" "}
                      <span className="font-medium text-gray-700">
                        {staffStartIndex + 1}
                      </span>
                      {" - "}
                      <span className="font-medium text-gray-700">
                        {Math.min(
                          staffStartIndex + STAFF_PER_PAGE,
                          filteredStaffAccounts.length
                        )}
                      </span>
                      {" of "}
                      <span className="font-medium text-gray-700">
                        {filteredStaffAccounts.length}
                      </span>
                    </p>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          setStaffPage((previous) =>
                            Math.max(previous - 1, 1)
                          )
                        }
                        disabled={staffPage === 1}
                        className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Previous
                      </button>

                      <span className="text-sm font-medium text-gray-600">
                        Page {staffPage} of {totalStaffPages}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          setStaffPage((previous) =>
                            Math.min(
                              previous + 1,
                              totalStaffPages
                            )
                          )
                        }
                        disabled={
                          staffPage === totalStaffPages
                        }
                        className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
        </div>
        </>
        )}

        {/* Create Photographer Form */}
        {showCreatePhotographer && (
          <div
            ref={createPhotographerRef}
            className="scroll-mt-6 mt-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
          >

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
          <div
            ref={createClerkRef}
            className="scroll-mt-6 mt-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
          >

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