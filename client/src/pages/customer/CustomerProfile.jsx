import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "../../context/useAuth";
import api from "../../services/api";
import Loading from "../../components/Loading";


const CustomerProfile = () => {
  const { updateUser } = useAuth();

  const [profile, setProfile] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
  });

  const [passwordData, setPasswordData] = useState({
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
  });

  const [changingPassword, setChangingPassword] = useState(false);

  const [passwordError, setPasswordError] = useState("");

  const [passwordSuccess, setPasswordSuccess] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");


  // ==========================================
  // LOAD CUSTOMER PROFILE
  // ==========================================

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get(
          "/customer/profile"
        );

        const customer =
          response.data.data.user;

        setProfile(customer);

        setFormData({
          name: customer.name || "",
          email: customer.email || "",
        });

      } catch (error) {
        console.error(
          "Failed to load customer profile:",
          error
        );

        setError(
          error.response?.data?.message ||
          "Unable to load your profile. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);


  // ==========================================
  // HANDLE FORM INPUT
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

    setError("");
    setSuccess("");
  };

// ==========================================
// HANDLE PASSWORD INPUT
// ==========================================

  const handlePasswordChange = (event) => {
    const {
      name,
      value,
    } = event.target;

    setPasswordData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setPasswordError("");
    setPasswordSuccess("");
  };

  // ==========================================
  // UPDATE PROFILE
  // ==========================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");


    // ----------------------------------------
    // Basic frontend validation
    // ----------------------------------------

    const trimmedName = formData.name.trim();
    const trimmedEmail = formData.email.trim();

    if (!trimmedName) {
      setError("Name cannot be empty.");
      return;
    }

    if (!trimmedEmail) {
      setError("Email cannot be empty.");
      return;
    }


    try {
      setSaving(true);

      const response = await api.put(
        "/customer/profile",
        {
          name: trimmedName,
          email: trimmedEmail,
        }
      );

      const updatedUser =
        response.data.data.user;

      setProfile(updatedUser);

      setFormData({
        name: updatedUser.name || "",
        email: updatedUser.email || "",
      });


      // --------------------------------------
      // Synchronize AuthContext user
      // --------------------------------------

      updateUser(updatedUser);


      setSuccess(
        "Your profile has been updated successfully."
      );

    } catch (error) {
      console.error(
        "Failed to update customer profile:",
        error
      );

      setError(
        error.response?.data?.message ||
        "Unable to update your profile. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
// CHANGE PASSWORD
// ==========================================

const handlePasswordSubmit = async (event) => {
  event.preventDefault();

  setPasswordError("");
  setPasswordSuccess("");


  // ----------------------------------------
  // Validate current password
  // ----------------------------------------

  if (!passwordData.currentPassword) {
    setPasswordError(
      "Please enter your current password."
    );

    return;
  }


  // ----------------------------------------
  // Validate new password
  // ----------------------------------------

  if (!passwordData.newPassword) {
    setPasswordError(
      "Please enter a new password."
    );

    return;
  }


  // ----------------------------------------
  // Minimum password length
  // ----------------------------------------

  if (passwordData.newPassword.length < 8) {
    setPasswordError(
      "New password must be at least 8 characters long."
    );

    return;
  }


  // ----------------------------------------
  // Confirm password
  // ----------------------------------------

  if (
    passwordData.newPassword !==
    passwordData.confirmPassword
  ) {
    setPasswordError(
      "New password and confirm password do not match."
    );

    return;
  }


  try {
    setChangingPassword(true);

    await api.put(
      "/customer/change-password",
      {
        currentPassword:
          passwordData.currentPassword,

        newPassword:
          passwordData.newPassword,
      }
    );


    // --------------------------------------
    // Clear password form
    // --------------------------------------

    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });


    setPasswordSuccess(
      "Your password has been changed successfully."
    );

  } catch (error) {
    console.error(
      "Failed to change password:",
      error
    );

    setPasswordError(
      error.response?.data?.message ||
      "Unable to change your password. Please try again."
    );
  } finally {
    setChangingPassword(false);
  }
};

  // ==========================================
  // LOADING STATE
  // ==========================================

  if (loading) {
    return (
      <Loading label="Loading your profile..." />
    );
  }


  // ==========================================
  // ERROR STATE
  // ==========================================

  if (!profile) {
    return (
      <main className="min-h-[calc(100vh-4rem)] bg-gray-50 px-6 py-10">
        <div className="mx-auto max-w-3xl">

          <div className="rounded-3xl border border-red-200 bg-white p-8 shadow-sm">

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
              !
            </div>

            <h1 className="mt-5 text-2xl font-bold text-gray-950">
              Unable to load profile
            </h1>

            <p className="mt-2 text-sm leading-6 text-gray-600">
              {error ||
                "We could not retrieve your profile information."}
            </p>

            <Link
              to="/customer"
              className="mt-6 inline-flex rounded-xl bg-orange-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-700"
            >
              Back to Dashboard
            </Link>

          </div>

        </div>
      </main>
    );
  }


  // ==========================================
  // PROFILE PAGE
  // ==========================================

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-gray-50 px-6 py-10 sm:py-12">

      <div className="mx-auto max-w-5xl">

        {/* ================================== */}
        {/* PAGE HEADER                         */}
        {/* ================================== */}

        <div className="mb-8">

          <p className="text-sm font-semibold uppercase tracking-wider text-orange-600">
            Customer account
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl">
            My Profile
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-600 sm:text-base">
            View and manage your personal account information.
          </p>

        </div>


        {/* ================================== */}
        {/* ALERTS                              */}
        {/* ================================== */}

        {error && (
          <div
            className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700"
            role="alert"
          >
            {error}
          </div>
        )}

        {success && (
          <div
            className="mb-6 rounded-2xl border border-green-200 bg-green-50 px-5 py-4 text-sm text-green-700"
            role="status"
          >
            {success}
          </div>
        )}


        <div className="grid gap-6 lg:grid-cols-[0.75fr_1.25fr]">


          {/* ================================= */}
          {/* PROFILE SUMMARY                   */}
          {/* ================================= */}

          <section className="rounded-3xl border border-gray-200 bg-white p-7 shadow-sm sm:p-8">

            <div className="flex flex-col items-center text-center">

              {/* Avatar */}

              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-orange-100 text-3xl font-bold text-orange-700 ring-8 ring-orange-50">
                {profile.name
                  ?.charAt(0)
                  ?.toUpperCase()}
              </div>


              <h2 className="mt-5 text-xl font-bold text-gray-950">
                {profile.name}
              </h2>

              <p className="mt-1 break-all text-sm text-gray-500">
                {profile.email}
              </p>


              {/* Role */}

              <div className="mt-5 inline-flex rounded-full bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-700">
                Customer
              </div>

            </div>


            {/* Account Details */}

            <div className="mt-8 border-t border-gray-100 pt-6">

              <h3 className="text-sm font-semibold text-gray-950">
                Account details
              </h3>


              <dl className="mt-4 space-y-4">

                <div className="flex items-start justify-between gap-4">

                  <dt className="text-sm text-gray-500">
                    Account status
                  </dt>

                  <dd className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
                    {profile.status || "ACTIVE"}
                  </dd>

                </div>


                <div className="flex items-start justify-between gap-4">

                  <dt className="text-sm text-gray-500">
                    Account type
                  </dt>

                  <dd className="text-sm font-medium text-gray-900">
                    Customer
                  </dd>

                </div>

              </dl>

            </div>

          </section>


          {/* ================================= */}
          {/* EDIT PROFILE                      */}
          {/* ================================= */}

          <section className="rounded-3xl border border-gray-200 bg-white p-7 shadow-sm sm:p-8">

            <div>

              <p className="text-sm font-semibold text-orange-600">
                Personal information
              </p>

              <h2 className="mt-1 text-xl font-bold text-gray-950">
                Edit Profile
              </h2>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                Update the information associated with your customer account.
              </p>

            </div>


            <form
              onSubmit={handleSubmit}
              className="mt-8 space-y-6"
            >

              {/* Name */}

              <div>

                <label
                  htmlFor="name"
                  className="mb-2 block text-sm font-medium text-gray-700"
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
                  minLength={2}
                  maxLength={100}
                  required
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
                />

              </div>


              {/* Email */}

              <div>

                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium text-gray-700"
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
                  maxLength={150}
                  required
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
                />

              </div>


              {/* Save */}

              <div className="flex justify-end border-t border-gray-100 pt-6">

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center rounded-xl bg-orange-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-700 focus:outline-none focus:ring-4 focus:ring-orange-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving
                    ? "Saving changes..."
                    : "Save changes"}
                </button>

              </div>

            </form>

          </section>

        </div>
                
                {/* ================================= */}
{/* SECURITY                          */}
{/* ================================= */}

<section className="mt-6 rounded-3xl border border-gray-200 bg-white p-7 shadow-sm sm:p-8">

  <div>

    <p className="text-sm font-semibold text-orange-600">
      Account security
    </p>

    <h2 className="mt-1 text-xl font-bold text-gray-950">
      Change Password
    </h2>

    <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
      Update your account password regularly to help keep
      your account secure.
    </p>

  </div>


  {/* Password errors */}

  {passwordError && (
    <div
      className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700"
      role="alert"
    >
      {passwordError}
    </div>
  )}


  {/* Password success */}

  {passwordSuccess && (
    <div
      className="mt-6 rounded-2xl border border-green-200 bg-green-50 px-5 py-4 text-sm text-green-700"
      role="status"
    >
      {passwordSuccess}
    </div>
  )}


  <form
    onSubmit={handlePasswordSubmit}
    className="mt-8 grid gap-6 md:grid-cols-2"
  >

    {/* Current password */}

    <div className="md:col-span-2">

      <label
        htmlFor="currentPassword"
        className="mb-2 block text-sm font-medium text-gray-700"
      >
        Current password
      </label>

      <input
        id="currentPassword"
        name="currentPassword"
        type="password"
        autoComplete="current-password"
        value={passwordData.currentPassword}
        onChange={handlePasswordChange}
        required
        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
      />

    </div>


    {/* New password */}

    <div>

      <label
        htmlFor="newPassword"
        className="mb-2 block text-sm font-medium text-gray-700"
      >
        New password
      </label>

      <input
        id="newPassword"
        name="newPassword"
        type="password"
        autoComplete="new-password"
        value={passwordData.newPassword}
        onChange={handlePasswordChange}
        minLength={8}
        required
        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
      />

      <p className="mt-2 text-xs text-gray-500">
        Must be at least 8 characters.
      </p>

    </div>


    {/* Confirm password */}

    <div>

      <label
        htmlFor="confirmPassword"
        className="mb-2 block text-sm font-medium text-gray-700"
      >
        Confirm new password
      </label>

      <input
        id="confirmPassword"
        name="confirmPassword"
        type="password"
        autoComplete="new-password"
        value={passwordData.confirmPassword}
        onChange={handlePasswordChange}
        minLength={8}
        required
        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
      />

    </div>


    {/* Submit */}

    <div className="md:col-span-2 flex justify-end border-t border-gray-100 pt-6">

      <button
        type="submit"
        disabled={changingPassword}
        className="inline-flex items-center justify-center rounded-xl bg-gray-950 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800 focus:outline-none focus:ring-4 focus:ring-gray-200 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {changingPassword
          ? "Changing password..."
          : "Change password"}
      </button>

    </div>

  </form>

</section>

      </div>

    </main>
  );
};


export default CustomerProfile;