import {
  useEffect,
  useState,
} from "react";

import { useAuth } from "../../context/useAuth";
import api from "../../services/api";


const CustomerProfile = () => {

  const {
    updateUser,
  } = useAuth();


  const [
    profile,
    setProfile,
  ] = useState(null);


  const [
    formData,
    setFormData,
  ] = useState({
    name: "",
    email: "",
  });


  const [
    passwordData,
    setPasswordData,
  ] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });


  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    saving,
    setSaving,
  ] = useState(false);


  const [
    changingPassword,
    setChangingPassword,
  ] = useState(false);


  const [
    error,
    setError,
  ] = useState("");


  const [
    success,
    setSuccess,
  ] = useState("");


  const [
    passwordError,
    setPasswordError,
  ] = useState("");


  const [
    passwordSuccess,
    setPasswordSuccess,
  ] = useState("");


  // ==========================================
  // LOAD CUSTOMER PROFILE
  // ==========================================

  useEffect(() => {

    let ignore = false;


    const loadProfile =
      async () => {

        try {

          const response =
            await api.get(
              "/customer/profile"
            );


          const customer =
            response.data?.data?.user;


          if (!customer) {

            throw new Error(
              "Customer profile data was not returned."
            );

          }


          if (!ignore) {

            setProfile(
              customer
            );


            setFormData({
              name:
                customer.name || "",

              email:
                customer.email || "",
            });

          }

        } catch (err) {

          console.error(
            "Failed to load customer profile:",
            err
          );


          if (!ignore) {

            setError(
              err.response?.data
                ?.message ||
                err.message ||
                "Unable to load your profile. Please try again."
            );

          }

        } finally {

          if (!ignore) {
            setLoading(false);
          }

        }

      };


    loadProfile();


    return () => {
      ignore = true;
    };

  }, []);


  // ==========================================
  // PROFILE INPUT
  // ==========================================

  const handleChange = (
    event
  ) => {

    const {
      name,
      value,
    } = event.target;


    setFormData(
      (previous) => ({
        ...previous,
        [name]: value,
      })
    );


    setError("");
    setSuccess("");

  };


  // ==========================================
  // PASSWORD INPUT
  // ==========================================

  const handlePasswordChange = (
    event
  ) => {

    const {
      name,
      value,
    } = event.target;


    setPasswordData(
      (previous) => ({
        ...previous,
        [name]: value,
      })
    );


    setPasswordError("");
    setPasswordSuccess("");

  };


  // ==========================================
  // UPDATE PROFILE
  // ==========================================

  const handleSubmit =
    async (event) => {

      event.preventDefault();

      setError("");
      setSuccess("");


      const trimmedName =
        formData.name.trim();


      const trimmedEmail =
        formData.email.trim();


      if (!trimmedName) {

        setError(
          "Name cannot be empty."
        );

        return;

      }


      if (
        trimmedName.length < 2
      ) {

        setError(
          "Name must be at least 2 characters long."
        );

        return;

      }


      if (!trimmedEmail) {

        setError(
          "Email cannot be empty."
        );

        return;

      }


      try {

        setSaving(true);


        const response =
          await api.put(
            "/customer/profile",
            {
              name:
                trimmedName,

              email:
                trimmedEmail,
            }
          );


        const updatedUser =
          response.data?.data?.user;


        if (!updatedUser) {

          throw new Error(
            "Updated customer profile was not returned."
          );

        }


        setProfile(
          updatedUser
        );


        setFormData({
          name:
            updatedUser.name ||
            "",

          email:
            updatedUser.email ||
            "",
        });


        // Keep AuthContext synchronized.
        // The backend returns the complete safe
        // user object including role/status.
        updateUser(
          updatedUser
        );


        setSuccess(
          "Your profile has been updated successfully."
        );

      } catch (err) {

        console.error(
          "Failed to update customer profile:",
          err
        );


        setError(
          err.response?.data
            ?.message ||
            "Unable to update your profile. Please try again."
        );

      } finally {

        setSaving(false);

      }

    };


  // ==========================================
  // CHANGE PASSWORD
  // ==========================================

  const handlePasswordSubmit =
    async (event) => {

      event.preventDefault();

      setPasswordError("");
      setPasswordSuccess("");


      if (
        !passwordData.currentPassword
      ) {

        setPasswordError(
          "Please enter your current password."
        );

        return;

      }


      if (
        !passwordData.newPassword
      ) {

        setPasswordError(
          "Please enter a new password."
        );

        return;

      }


      if (
        passwordData.newPassword
          .length < 8
      ) {

        setPasswordError(
          "New password must be at least 8 characters long."
        );

        return;

      }


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

        setChangingPassword(
          true
        );


        await api.put(
          "/customer/change-password",
          {
            currentPassword:
              passwordData
                .currentPassword,

            newPassword:
              passwordData
                .newPassword,
          }
        );


        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });


        setPasswordSuccess(
          "Your password has been changed successfully."
        );

      } catch (err) {

        console.error(
          "Failed to change password:",
          err
        );


        setPasswordError(
          err.response?.data
            ?.message ||
            "Unable to change your password. Please try again."
        );

      } finally {

        setChangingPassword(
          false
        );

      }

    };


  // ==========================================
  // INITIAL
  // ==========================================

  const initial =
    profile?.name
      ?.charAt(0)
      ?.toUpperCase() ||
    "C";


  // ==========================================
  // PAGE
  // ==========================================

  return (

    <main
      className="
        min-h-[calc(100vh-4rem)]
        bg-gray-50
        px-4
        py-6
        sm:px-6
        lg:px-8
        lg:py-8
      "
    >

      <div
        className="
          mx-auto
          max-w-5xl
        "
      >


        {/* ==================================
            HEADER
        ================================== */}

        <header>

          <p
            className="
              text-sm
              font-semibold
              text-orange-600
            "
          >
            Customer Account
          </p>


          <h1
            className="
              mt-1
              text-2xl
              font-bold
              tracking-tight
              text-gray-950
              sm:text-3xl
            "
          >
            My Profile
          </h1>


          <p
            className="
              mt-2
              max-w-2xl
              text-sm
              leading-6
              text-gray-500
            "
          >
            Manage your personal information
            and account security.
          </p>

        </header>


        {/* ==================================
            LOADING
        ================================== */}

        {loading ? (

          <div
            className="
              mt-7
              grid
              gap-6
              lg:grid-cols-[260px_minmax(0,1fr)]
            "
            role="status"
            aria-live="polite"
            aria-label="Loading customer profile"
          >

            <span className="sr-only">
              Loading customer profile...
            </span>

            <div
              className="
                h-48
                animate-pulse
                rounded-2xl
                border
                border-gray-200
                bg-white
              "
            />


            <div
              className="
                h-72
                animate-pulse
                rounded-2xl
                border
                border-gray-200
                bg-white
              "
            />

          </div>

        ) : !profile ? (

          /* ==================================
             LOAD ERROR
          ================================== */

          <div
            className="
              mt-7
              rounded-2xl
              border
              border-red-200
              bg-white
              p-6
              shadow-sm
            "
          >

            <div
              className="
                flex
                h-10
                w-10
                items-center
                justify-center
                rounded-xl
                bg-red-50
                font-bold
                text-red-600
              "
              aria-hidden="true"
            >
              !
            </div>


            <h2
              className="
                mt-4
                text-lg
                font-semibold
                text-gray-950
              "
            >
              Unable to load profile
            </h2>


            <p
              className="
                mt-2
                max-w-xl
                text-sm
                leading-6
                text-gray-600
              "
            >
              {error ||
                "We could not retrieve your profile information."}
            </p>

          </div>

        ) : (

          <>


            {/* ==================================
                PROFILE + ACCOUNT INFORMATION
            ================================== */}

            <div
              className="
                mt-7
                grid
                gap-6
                lg:grid-cols-[260px_minmax(0,1fr)]
              "
            >


              {/* PROFILE SUMMARY */}

              <aside
                className="
                  h-fit
                  rounded-2xl
                  border
                  border-gray-200
                  bg-white
                  p-5
                  shadow-sm
                "
              >

                <div
                  className="
                    flex
                    items-center
                    gap-4
                    lg:flex-col
                    lg:items-start
                  "
                >

                  <div
                    className="
                      flex
                      h-16
                      w-16
                      shrink-0
                      items-center
                      justify-center
                      rounded-full
                      bg-orange-100
                      text-xl
                      font-bold
                      text-orange-700
                    "
                    aria-hidden="true"
                  >
                    {initial}
                  </div>


                  <div
                    className="
                      min-w-0
                    "
                  >

                    <h2
                      className="
                        truncate
                        text-base
                        font-semibold
                        text-gray-950
                      "
                    >
                      {profile.name}
                    </h2>


                    <p
                      className="
                        mt-1
                        break-all
                        text-sm
                        text-gray-500
                      "
                    >
                      {profile.email}
                    </p>


                    <span
                      className="
                        mt-3
                        inline-flex
                        rounded-full
                        bg-orange-50
                        px-2.5
                        py-1
                        text-xs
                        font-semibold
                        text-orange-700
                      "
                    >
                      Customer
                    </span>

                  </div>

                </div>


                <dl
                  className="
                    mt-5
                    border-t
                    border-gray-100
                    pt-5
                  "
                >

                  <div
                    className="
                      flex
                      items-center
                      justify-between
                      gap-4
                    "
                  >

                    <dt
                      className="
                        text-sm
                        text-gray-500
                      "
                    >
                      Status
                    </dt>


                    <dd
                      className="
                        text-sm
                        font-medium
                        text-gray-900
                      "
                    >
                      {
                        profile.status ||
                        "ACTIVE"
                      }
                    </dd>

                  </div>

                </dl>

              </aside>


              {/* ==================================
                  PERSONAL INFORMATION
              ================================== */}

              <section
                className="
                  rounded-2xl
                  border
                  border-gray-200
                  bg-white
                  shadow-sm
                "
              >

                <div
                  className="
                    border-b
                    border-gray-100
                    px-5
                    py-4
                    sm:px-6
                  "
                >

                  <h2
                    className="
                      text-lg
                      font-semibold
                      text-gray-950
                    "
                  >
                    Personal Information
                  </h2>


                  <p
                    className="
                      mt-1
                      text-sm
                      text-gray-500
                    "
                  >
                    Update the name and email
                    associated with your account.
                  </p>

                </div>


                <form
                  onSubmit={
                    handleSubmit
                  }
                  className="
                    p-5
                    sm:p-6
                  "
                >


                  {error && (

                    <div
                      role="alert"
                      className="
                        mb-5
                        flex
                        items-start
                        justify-between
                        gap-4
                        rounded-xl
                        border
                        border-red-200
                        bg-red-50
                        px-4
                        py-3
                        text-sm
                        text-red-700
                      "
                    >
                      <span>
                        {error}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          setError("")
                        }
                        aria-label="Dismiss error"
                        className="
                          shrink-0
                          font-semibold
                          text-red-500
                          transition
                          hover:text-red-700
                          focus:outline-none
                          focus-visible:ring-2
                          focus-visible:ring-red-500
                          focus-visible:ring-offset-2
                        "
                      >
                        ×
                      </button>
                    </div>

                  )}


                  {success && (

                    <div
                      role="status"
                      aria-live="polite"
                      className="
                        mb-5
                        flex
                        items-start
                        justify-between
                        gap-4
                        rounded-xl
                        border
                        border-green-200
                        bg-green-50
                        px-4
                        py-3
                        text-sm
                        text-green-700
                      "
                    >
                      <span>
                        {success}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          setSuccess("")
                        }
                        aria-label="Dismiss success message"
                        className="
                          shrink-0
                          font-semibold
                          text-green-600
                          transition
                          hover:text-green-800
                          focus:outline-none
                          focus-visible:ring-2
                          focus-visible:ring-green-500
                          focus-visible:ring-offset-2
                        "
                      >
                        ×
                      </button>
                    </div>

                  )}


                  <div
                    className="
                      grid
                      gap-5
                      sm:grid-cols-2
                    "
                  >


                    {/* NAME */}

                    <div>

                      <label
                        htmlFor="name"
                        className="
                          mb-2
                          block
                          text-sm
                          font-medium
                          text-gray-700
                        "
                      >
                        Full name
                      </label>


                      <input
                        id="name"
                        name="name"
                        type="text"
                        autoComplete="name"
                        value={
                          formData.name
                        }
                        onChange={
                          handleChange
                        }
                        disabled={
                          saving
                        }
                        minLength={2}
                        maxLength={100}
                        required
                        className="
                          w-full
                          rounded-xl
                          border
                          border-gray-300
                          bg-white
                          px-4
                          py-3
                          text-sm
                          text-gray-900
                          outline-none
                          transition
                          focus:border-orange-500
                          focus:ring-2
                          focus:ring-orange-500/10
                          disabled:cursor-not-allowed
                          disabled:bg-gray-100
                        "
                      />

                    </div>


                    {/* EMAIL */}

                    <div>

                      <label
                        htmlFor="email"
                        className="
                          mb-2
                          block
                          text-sm
                          font-medium
                          text-gray-700
                        "
                      >
                        Email address
                      </label>


                      <input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        value={
                          formData.email
                        }
                        onChange={
                          handleChange
                        }
                        disabled={
                          saving
                        }
                        maxLength={150}
                        required
                        className="
                          w-full
                          rounded-xl
                          border
                          border-gray-300
                          bg-white
                          px-4
                          py-3
                          text-sm
                          text-gray-900
                          outline-none
                          transition
                          focus:border-orange-500
                          focus:ring-2
                          focus:ring-orange-500/10
                          disabled:cursor-not-allowed
                          disabled:bg-gray-100
                        "
                      />

                    </div>

                  </div>


                  <div
                    className="
                      mt-6
                      flex
                      justify-end
                      border-t
                      border-gray-100
                      pt-5
                    "
                  >

                    <button
                      type="submit"
                      disabled={
                        saving
                      }
                      className="
                        rounded-xl
                        bg-orange-600
                        px-5
                        py-2.5
                        text-sm
                        font-semibold
                        text-white
                        shadow-sm
                        transition
                        hover:bg-orange-700
                        disabled:cursor-not-allowed
                        disabled:opacity-50
                        focus:outline-none
                        focus-visible:ring-2
                        focus-visible:ring-orange-500
                        focus-visible:ring-offset-2
                      "
                    >
                      {saving
                        ? "Saving..."
                        : "Save Changes"}
                    </button>

                  </div>

                </form>

              </section>

            </div>


            {/* ==================================
                SECURITY
            ================================== */}

            <section
              className="
                mt-6
                rounded-2xl
                border
                border-gray-200
                bg-white
                shadow-sm
              "
            >

              <div
                className="
                  border-b
                  border-gray-100
                  px-5
                  py-4
                  sm:px-6
                "
              >

                <h2
                  className="
                    text-lg
                    font-semibold
                    text-gray-950
                  "
                >
                  Account Security
                </h2>


                <p
                  className="
                    mt-1
                    text-sm
                    leading-6
                    text-gray-500
                  "
                >
                  Change your password using
                  your current account password.
                </p>

              </div>


              <form
                onSubmit={
                  handlePasswordSubmit
                }
                className="
                  p-5
                  sm:p-6
                "
              >


                {passwordError && (

                  <div
                    role="alert"
                    className="
                      mb-5
                      flex
                      items-start
                      justify-between
                      gap-4
                      rounded-xl
                      border
                      border-red-200
                      bg-red-50
                      px-4
                      py-3
                      text-sm
                      text-red-700
                    "
                  >
                    <span>
                      {passwordError}
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        setPasswordError("")
                      }
                      aria-label="Dismiss password error"
                      className="
                        shrink-0
                        font-semibold
                        text-red-500
                        transition
                        hover:text-red-700
                        focus:outline-none
                        focus-visible:ring-2
                        focus-visible:ring-red-500
                        focus-visible:ring-offset-2
                      "
                    >
                      ×
                    </button>
                  </div>

                )}


                {passwordSuccess && (

                  <div
                    role="status"
                    aria-live="polite"
                    className="
                      mb-5
                      flex
                      items-start
                      justify-between
                      gap-4
                      rounded-xl
                      border
                      border-green-200
                      bg-green-50
                      px-4
                      py-3
                      text-sm
                      text-green-700
                    "
                  >
                    <span>
                      {passwordSuccess}
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        setPasswordSuccess("")
                      }
                      aria-label="Dismiss password success message"
                      className="
                        shrink-0
                        font-semibold
                        text-green-600
                        transition
                        hover:text-green-800
                        focus:outline-none
                        focus-visible:ring-2
                        focus-visible:ring-green-500
                        focus-visible:ring-offset-2
                      "
                    >
                      ×
                    </button>
                  </div>

                )}


                <div
                  className="
                    grid
                    gap-5
                    md:grid-cols-3
                  "
                >


                  {/* CURRENT PASSWORD */}

                  <div>

                    <label
                      htmlFor="currentPassword"
                      className="
                        mb-2
                        block
                        text-sm
                        font-medium
                        text-gray-700
                      "
                    >
                      Current password
                    </label>


                    <input
                      id="currentPassword"
                      name="currentPassword"
                      type="password"
                      autoComplete="current-password"
                      value={
                        passwordData
                          .currentPassword
                      }
                      onChange={
                        handlePasswordChange
                      }
                      disabled={
                        changingPassword
                      }
                      required
                      className="
                        w-full
                        rounded-xl
                        border
                        border-gray-300
                        bg-white
                        px-4
                        py-3
                        text-sm
                        text-gray-900
                        outline-none
                        transition
                        focus:border-orange-500
                        focus:ring-2
                        focus:ring-orange-500/10
                        disabled:cursor-not-allowed
                        disabled:bg-gray-100
                      "
                    />

                  </div>


                  {/* NEW PASSWORD */}

                  <div>

                    <label
                      htmlFor="newPassword"
                      className="
                        mb-2
                        block
                        text-sm
                        font-medium
                        text-gray-700
                      "
                    >
                      New password
                    </label>


                    <input
                      id="newPassword"
                      name="newPassword"
                      type="password"
                      autoComplete="new-password"
                      value={
                        passwordData
                          .newPassword
                      }
                      onChange={
                        handlePasswordChange
                      }
                      disabled={
                        changingPassword
                      }
                      minLength={8}
                      required
                      className="
                        w-full
                        rounded-xl
                        border
                        border-gray-300
                        bg-white
                        px-4
                        py-3
                        text-sm
                        text-gray-900
                        outline-none
                        transition
                        focus:border-orange-500
                        focus:ring-2
                        focus:ring-orange-500/10
                        disabled:cursor-not-allowed
                        disabled:bg-gray-100
                      "
                    />


                    <p
                      className="
                        mt-2
                        text-xs
                        text-gray-400
                      "
                    >
                      At least 8 characters.
                    </p>

                  </div>


                  {/* CONFIRM PASSWORD */}

                  <div>

                    <label
                      htmlFor="confirmPassword"
                      className="
                        mb-2
                        block
                        text-sm
                        font-medium
                        text-gray-700
                      "
                    >
                      Confirm password
                    </label>


                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      autoComplete="new-password"
                      value={
                        passwordData
                          .confirmPassword
                      }
                      onChange={
                        handlePasswordChange
                      }
                      disabled={
                        changingPassword
                      }
                      minLength={8}
                      required
                      className="
                        w-full
                        rounded-xl
                        border
                        border-gray-300
                        bg-white
                        px-4
                        py-3
                        text-sm
                        text-gray-900
                        outline-none
                        transition
                        focus:border-orange-500
                        focus:ring-2
                        focus:ring-orange-500/10
                        disabled:cursor-not-allowed
                        disabled:bg-gray-100
                      "
                    />

                  </div>

                </div>


                <div
                  className="
                    mt-6
                    flex
                    justify-end
                    border-t
                    border-gray-100
                    pt-5
                  "
                >

                  <button
                    type="submit"
                    disabled={
                      changingPassword
                    }
                    className="
                      rounded-xl
                      bg-gray-950
                      px-5
                      py-2.5
                      text-sm
                      font-semibold
                      text-white
                      shadow-sm
                      transition
                      hover:bg-gray-800
                      disabled:cursor-not-allowed
                      disabled:opacity-50
                      focus:outline-none
                      focus-visible:ring-2
                      focus-visible:ring-gray-500
                      focus-visible:ring-offset-2
                    "
                  >
                    {changingPassword
                      ? "Changing..."
                      : "Change Password"}
                  </button>

                </div>

              </form>

            </section>

          </>

        )}

      </div>

    </main>

  );

};


export default CustomerProfile;