import {
  useEffect,
  useState,
} from "react";

import { useAuth } from "../../context/useAuth";
import api from "../../services/api";


const PhotographerProfile = () => {

  const {
    user,
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
    bio: "",
    specialization: "",
    location: "",
    hourlyRate: "",
    profileImage: "",
  });


  const [
    packageRates,
    setPackageRates,
  ] = useState([]);


  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    saving,
    setSaving,
  ] = useState(false);


  const [
    error,
    setError,
  ] = useState("");


  const [
    success,
    setSuccess,
  ] = useState("");


  // ==========================================
  // LOAD PROFILE
  // ==========================================

  useEffect(() => {

    let ignore = false;


    const loadProfile =
      async () => {

        try {

          const response =
            await api.get(
              "/photographer/profile"
            );


          const photographer =
            response.data?.data
              ?.photographer;


          if (!photographer) {

            throw new Error(
              "Photographer profile data was not returned."
            );

          }


          if (!ignore) {

            setProfile(
              photographer
            );


            setFormData({

              name:
                photographer.user
                  ?.name || "",

              email:
                photographer.user
                  ?.email || "",

              bio:
                photographer.bio || "",

              specialization:
                photographer
                  .specialization || "",

              location:
                photographer.location ||
                "",

              hourlyRate:
                photographer.hourlyRate ??
                "",

              profileImage:
                photographer.profileImage ||
                "",

            });


            setPackageRates(

              Array.isArray(
                photographer
                  .packageRates
              )
                ? photographer.packageRates.map(
                    (pkg) => ({
                      name:
                        pkg.name || "",

                      description:
                        pkg.description ||
                        "",

                      price:
                        pkg.price ?? "",
                    })
                  )
                : []

            );

          }

        } catch (err) {

          console.error(
            "Failed to load photographer profile:",
            err
          );


          if (!ignore) {

            setError(
              err.response?.data
                ?.message ||
                err.message ||
                "Failed to load photographer profile."
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
  // NORMAL INPUTS
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
  // PACKAGE HANDLERS
  // ==========================================

  const addPackage = () => {

    setPackageRates(
      (previous) => [
        ...previous,
        {
          name: "",
          description: "",
          price: "",
        },
      ]
    );


    setError("");
    setSuccess("");

  };


  const removePackage = (
    index
  ) => {

    setPackageRates(
      (previous) =>
        previous.filter(
          (_, packageIndex) =>
            packageIndex !==
            index
        )
    );


    setError("");
    setSuccess("");

  };


  const handlePackageChange = (
    index,
    field,
    value
  ) => {

    setPackageRates(
      (previous) =>
        previous.map(
          (pkg, packageIndex) =>
            packageIndex === index
              ? {
                  ...pkg,
                  [field]: value,
                }
              : pkg
        )
    );


    setError("");
    setSuccess("");

  };


  // ==========================================
  // SAVE PROFILE
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
          "Name is required."
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
          "Email is required."
        );

        return;

      }


      if (
        formData.hourlyRate !== "" &&
        Number(
          formData.hourlyRate
        ) < 0
      ) {

        setError(
          "Hourly rate cannot be negative."
        );

        return;

      }


      for (
        const pkg of
        packageRates
      ) {

        if (
          !pkg.name.trim()
        ) {

          setError(
            "Every package must have a name."
          );

          return;

        }


        if (
          pkg.price === "" ||
          Number(pkg.price) < 0
        ) {

          setError(
            "Every package must have a valid price."
          );

          return;

        }

      }


      try {

        setSaving(true);


        const payload = {

          name:
            trimmedName,

          email:
            trimmedEmail,

          bio:
            formData.bio.trim(),

          specialization:
            formData
              .specialization
              .trim(),

          location:
            formData.location
              .trim(),

          hourlyRate:
            formData.hourlyRate === ""
              ? null
              : Number(
                  formData
                    .hourlyRate
                ),

          packageRates:
            packageRates.map(
              (pkg) => ({
                name:
                  pkg.name.trim(),

                description:
                  pkg.description
                    .trim(),

                price:
                  Number(
                    pkg.price
                  ),
              })
            ),

          profileImage:
            formData.profileImage
              .trim(),

        };


        const response =
          await api.put(
            "/photographer/profile",
            payload
          );


        const updatedPhotographer =
          response.data?.data
            ?.photographer;


        if (!updatedPhotographer) {

          throw new Error(
            "Updated photographer profile was not returned."
          );

        }


        setProfile(
          updatedPhotographer
        );


        setFormData({

          name:
            updatedPhotographer
              .user?.name || "",

          email:
            updatedPhotographer
              .user?.email || "",

          bio:
            updatedPhotographer
              .bio || "",

          specialization:
            updatedPhotographer
              .specialization || "",

          location:
            updatedPhotographer
              .location || "",

          hourlyRate:
            updatedPhotographer
              .hourlyRate ?? "",

          profileImage:
            updatedPhotographer
              .profileImage || "",

        });


        setPackageRates(

          Array.isArray(
            updatedPhotographer
              .packageRates
          )
            ? updatedPhotographer
                .packageRates
                .map(
                  (pkg) => ({
                    name:
                      pkg.name || "",

                    description:
                      pkg.description ||
                      "",

                    price:
                      pkg.price ?? "",
                  })
                )
            : []

        );


        // ======================================
        // IMPORTANT:
        // PRESERVE AUTH USER ROLE / ID / STATUS
        // ======================================

        if (
          updatedPhotographer.user
        ) {

          updateUser({

            ...user,

            id:
              updatedPhotographer
                .user?.id ||
              updatedPhotographer
                .user?._id ||
              user?.id,

            name:
              updatedPhotographer
                .user?.name ||
              user?.name,

            email:
              updatedPhotographer
                .user?.email ||
              user?.email,

            role:
              updatedPhotographer
                .user?.role ||
              user?.role,

            status:
              updatedPhotographer
                .user?.status ||
              user?.status,

          });

        }


        setSuccess(
          "Photographer profile updated successfully."
        );

      } catch (err) {

        console.error(
          "Failed to update photographer profile:",
          err
        );


        setError(
          err.response?.data
            ?.message ||
            "Failed to update photographer profile."
        );

      } finally {

        setSaving(false);

      }

    };


  // ==========================================
  // DISPLAY HELPERS
  // ==========================================

  const initial =
    formData.name
      ?.charAt(0)
      ?.toUpperCase() ||
    "P";


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
          max-w-6xl
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
            Professional Profile
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
            Photographer Profile
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
            Manage the professional
            information customers see when
            viewing your photographer profile.
          </p>

        </header>


        {/* ==================================
            LOADING
        ================================== */}

        {loading ? (

          <div
            className="
              mt-7
              space-y-6
            "
            role="status"
            aria-live="polite"
            aria-label="Loading photographer profile"
          >

            <span className="sr-only">
              Loading photographer profile...
            </span>

            <div
              className="
                h-52
                animate-pulse
                rounded-2xl
                border
                border-gray-200
                bg-white
              "
            />


            <div
              className="
                h-80
                animate-pulse
                rounded-2xl
                border
                border-gray-200
                bg-white
              "
            />


            <div
              className="
                h-64
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
                "We could not retrieve your photographer profile."}
            </p>

          </div>

        ) : (

          <form
            onSubmit={
              handleSubmit
            }
            className="
              mt-7
              space-y-6
            "
          >


            {/* ==================================
                FEEDBACK
            ================================== */}

            {error && (

              <div
                role="alert"
                className="
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


            {/* ==================================
                PROFILE IMAGE + ACCOUNT
            ================================== */}

            <section
              className="
                overflow-hidden
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
                  Account Information
                </h2>


                <p
                  className="
                    mt-1
                    text-sm
                    text-gray-500
                  "
                >
                  Manage your account identity
                  and professional profile image.
                </p>

              </div>


              <div
                className="
                  grid
                  gap-6
                  p-5
                  sm:p-6
                  lg:grid-cols-[220px_minmax(0,1fr)]
                "
              >


                {/* PROFILE IMAGE */}

                <div>

                  <p
                    className="
                      mb-3
                      text-sm
                      font-medium
                      text-gray-700
                    "
                  >
                    Profile image
                  </p>


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
                        h-24
                        w-24
                        shrink-0
                        overflow-hidden
                        rounded-2xl
                        border
                        border-gray-200
                        bg-orange-50
                      "
                    >

                      {formData.profileImage ? (

                        <img
                          src={
                            formData.profileImage
                          }
                          alt={`${formData.name || "Photographer"} profile`}
                          className="
                            h-full
                            w-full
                            object-cover
                          "
                        />

                      ) : (

                        <div
                          className="
                            flex
                            h-full
                            w-full
                            items-center
                            justify-center
                            text-2xl
                            font-bold
                            text-orange-700
                          "
                          aria-hidden="true"
                        >
                          {initial}
                        </div>

                      )}

                    </div>


                    <div
                      className="
                        min-w-0
                      "
                    >

                      <p
                        className="
                          truncate
                          text-sm
                          font-semibold
                          text-gray-950
                        "
                      >
                        {formData.name ||
                          "Photographer"}
                      </p>


                      <p
                        className="
                          mt-1
                          text-sm
                          text-gray-500
                        "
                      >
                        {formData
                          .specialization ||
                          "Professional Photographer"}
                      </p>

                    </div>

                  </div>

                </div>


                {/* ACCOUNT FIELDS */}

                <div
                  className="
                    space-y-5
                  "
                >

                  <div
                    className="
                      grid
                      gap-5
                      sm:grid-cols-2
                    "
                  >

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
                        Name
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
                        Email
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


                  <div>

                    <label
                      htmlFor="profileImage"
                      className="
                        mb-2
                        block
                        text-sm
                        font-medium
                        text-gray-700
                      "
                    >
                      Profile Image URL
                    </label>


                    <input
                      id="profileImage"
                      name="profileImage"
                      type="url"
                      value={
                        formData
                          .profileImage
                      }
                      onChange={
                        handleChange
                      }
                      disabled={
                        saving
                      }
                      placeholder="https://example.com/profile-image.jpg"
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
                        placeholder:text-gray-400
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
                        leading-5
                        text-gray-400
                      "
                    >
                      Enter a publicly accessible
                      image URL. The current
                      project stores image URLs
                      rather than uploaded files.
                    </p>

                  </div>

                </div>

              </div>

            </section>


            {/* ==================================
                PROFESSIONAL INFORMATION
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
                  Professional Information
                </h2>


                <p
                  className="
                    mt-1
                    text-sm
                    text-gray-500
                  "
                >
                  Help customers understand your
                  photography experience and
                  services.
                </p>

              </div>


              <div
                className="
                  space-y-5
                  p-5
                  sm:p-6
                "
              >


                <div
                  className="
                    grid
                    gap-5
                    sm:grid-cols-2
                  "
                >

                  <div>

                    <label
                      htmlFor="specialization"
                      className="
                        mb-2
                        block
                        text-sm
                        font-medium
                        text-gray-700
                      "
                    >
                      Specialization
                    </label>


                    <input
                      id="specialization"
                      name="specialization"
                      type="text"
                      value={
                        formData
                          .specialization
                      }
                      onChange={
                        handleChange
                      }
                      disabled={
                        saving
                      }
                      maxLength={150}
                      placeholder="e.g. Wedding Photography"
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
                        placeholder:text-gray-400
                        focus:border-orange-500
                        focus:ring-2
                        focus:ring-orange-500/10
                        disabled:cursor-not-allowed
                        disabled:bg-gray-100
                      "
                    />

                  </div>


                  <div>

                    <label
                      htmlFor="location"
                      className="
                        mb-2
                        block
                        text-sm
                        font-medium
                        text-gray-700
                      "
                    >
                      Location
                    </label>


                    <input
                      id="location"
                      name="location"
                      type="text"
                      value={
                        formData.location
                      }
                      onChange={
                        handleChange
                      }
                      disabled={
                        saving
                      }
                      maxLength={150}
                      placeholder="e.g. Matara"
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
                        placeholder:text-gray-400
                        focus:border-orange-500
                        focus:ring-2
                        focus:ring-orange-500/10
                        disabled:cursor-not-allowed
                        disabled:bg-gray-100
                      "
                    />

                  </div>

                </div>


                <div>

                  <div
                    className="
                      mb-2
                      flex
                      items-center
                      justify-between
                      gap-3
                    "
                  >

                    <label
                      htmlFor="bio"
                      className="
                        block
                        text-sm
                        font-medium
                        text-gray-700
                      "
                    >
                      Biography
                    </label>


                    <span
                      className="
                        text-xs
                        text-gray-400
                      "
                    >
                      {
                        formData.bio.length
                      }
                      /1000
                    </span>

                  </div>


                  <textarea
                    id="bio"
                    name="bio"
                    rows={5}
                    value={
                      formData.bio
                    }
                    onChange={
                      handleChange
                    }
                    disabled={
                      saving
                    }
                    maxLength={1000}
                    placeholder="Tell customers about yourself and your photography experience..."
                    className="
                      w-full
                      resize-none
                      rounded-xl
                      border
                      border-gray-300
                      bg-white
                      px-4
                      py-3
                      text-sm
                      leading-6
                      text-gray-900
                      outline-none
                      transition
                      placeholder:text-gray-400
                      focus:border-orange-500
                      focus:ring-2
                      focus:ring-orange-500/10
                      disabled:cursor-not-allowed
                      disabled:bg-gray-100
                    "
                  />

                </div>

              </div>

            </section>


            {/* ==================================
                PRICING
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
                  Pricing
                </h2>


                <p
                  className="
                    mt-1
                    text-sm
                    text-gray-500
                  "
                >
                  Set your hourly rate and
                  photography packages.
                </p>

              </div>


              <div
                className="
                  space-y-7
                  p-5
                  sm:p-6
                "
              >


                {/* HOURLY RATE */}

                <div
                  className="
                    max-w-sm
                  "
                >

                  <label
                    htmlFor="hourlyRate"
                    className="
                      mb-2
                      block
                      text-sm
                      font-medium
                      text-gray-700
                    "
                  >
                    Hourly Rate (LKR)
                  </label>


                  <input
                    id="hourlyRate"
                    name="hourlyRate"
                    type="number"
                    min="0"
                    step="1"
                    value={
                      formData.hourlyRate
                    }
                    onChange={
                      handleChange
                    }
                    disabled={
                      saving
                    }
                    placeholder="e.g. 5000"
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
                      placeholder:text-gray-400
                      focus:border-orange-500
                      focus:ring-2
                      focus:ring-orange-500/10
                      disabled:cursor-not-allowed
                      disabled:bg-gray-100
                    "
                  />

                </div>


                {/* PACKAGES */}

                <div
                  className="
                    border-t
                    border-gray-100
                    pt-6
                  "
                >

                  <div
                    className="
                      flex
                      flex-col
                      gap-4
                      sm:flex-row
                      sm:items-center
                      sm:justify-between
                    "
                  >

                    <div>

                      <h3
                        className="
                          text-base
                          font-semibold
                          text-gray-950
                        "
                      >
                        Photography Packages
                      </h3>


                      <p
                        className="
                          mt-1
                          text-sm
                          text-gray-500
                        "
                      >
                        Offer fixed-price options
                        alongside your hourly
                        rate.
                      </p>

                    </div>


                    <button
                      type="button"
                      onClick={
                        addPackage
                      }
                      disabled={
                        saving
                      }
                      className="
                        inline-flex
                        w-fit
                        items-center
                        justify-center
                        rounded-xl
                        border
                        border-gray-300
                        bg-white
                        px-4
                        py-2.5
                        text-sm
                        font-semibold
                        text-gray-700
                        transition
                        hover:bg-gray-50
                        disabled:cursor-not-allowed
                        disabled:opacity-50
                        focus:outline-none
                        focus-visible:ring-2
                        focus-visible:ring-gray-400
                      "
                    >
                      + Add Package
                    </button>

                  </div>


                  {packageRates.length ===
                  0 ? (

                    <div
                      className="
                        mt-5
                        rounded-xl
                        border
                        border-dashed
                        border-gray-300
                        bg-gray-50
                        px-5
                        py-8
                        text-center
                      "
                    >

                      <p
                        className="
                          text-sm
                          text-gray-500
                        "
                      >
                        You have not added any
                        photography packages yet.
                      </p>


                      <button
                        type="button"
                        onClick={
                          addPackage
                        }
                        disabled={
                          saving
                        }
                        className="
                          mt-3
                          text-sm
                          font-semibold
                          text-orange-600
                          transition
                          hover:text-orange-700
                          disabled:opacity-50
                          focus:outline-none
                          focus-visible:ring-2
                          focus-visible:ring-orange-500
                          focus-visible:ring-offset-2
                        "
                      >
                        Add your first package
                      </button>

                    </div>

                  ) : (

                    <div
                      className="
                        mt-5
                        space-y-4
                      "
                    >

                      {packageRates.map(
                        (
                          pkg,
                          index
                        ) => (

                          <div
                            key={
                              index
                            }
                            className="
                              rounded-xl
                              border
                              border-gray-200
                              bg-gray-50
                              p-4
                              sm:p-5
                            "
                          >

                            <div
                              className="
                                mb-4
                                flex
                                items-center
                                justify-between
                                gap-4
                              "
                            >

                              <h4
                                className="
                                  text-sm
                                  font-semibold
                                  text-gray-900
                                "
                              >
                                Package{" "}
                                {index + 1}
                              </h4>


                              <button
                                type="button"
                                onClick={() =>
                                  removePackage(
                                    index
                                  )
                                }
                                disabled={
                                  saving
                                }
                                className="
                                  text-sm
                                  font-medium
                                  text-red-600
                                  transition
                                  hover:text-red-700
                                  disabled:cursor-not-allowed
                                  disabled:opacity-50
                                  focus:outline-none
                                  focus-visible:ring-2
                                  focus-visible:ring-red-500
                                  focus-visible:ring-offset-2
                                "
                              >
                                Remove
                              </button>

                            </div>


                            <div
                              className="
                                grid
                                gap-5
                                md:grid-cols-2
                              "
                            >

                              <div>

                                <label
                                  htmlFor={`package-name-${index}`}
                                  className="
                                    mb-2
                                    block
                                    text-sm
                                    font-medium
                                    text-gray-700
                                  "
                                >
                                  Package Name
                                </label>


                                <input
                                  id={`package-name-${index}`}
                                  type="text"
                                  value={
                                    pkg.name
                                  }
                                  onChange={(
                                    event
                                  ) =>
                                    handlePackageChange(
                                      index,
                                      "name",
                                      event
                                        .target
                                        .value
                                    )
                                  }
                                  disabled={
                                    saving
                                  }
                                  minLength={2}
                                  maxLength={100}
                                  placeholder="e.g. Full Day Wedding"
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
                                    placeholder:text-gray-400
                                    focus:border-orange-500
                                    focus:ring-2
                                    focus:ring-orange-500/10
                                    disabled:cursor-not-allowed
                                    disabled:bg-gray-100
                                  "
                                />

                              </div>


                              <div>

                                <label
                                  htmlFor={`package-price-${index}`}
                                  className="
                                    mb-2
                                    block
                                    text-sm
                                    font-medium
                                    text-gray-700
                                  "
                                >
                                  Price (LKR)
                                </label>


                                <input
                                  id={`package-price-${index}`}
                                  type="number"
                                  min="0"
                                  step="1"
                                  value={
                                    pkg.price
                                  }
                                  onChange={(
                                    event
                                  ) =>
                                    handlePackageChange(
                                      index,
                                      "price",
                                      event
                                        .target
                                        .value
                                    )
                                  }
                                  disabled={
                                    saving
                                  }
                                  placeholder="e.g. 75000"
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
                                    placeholder:text-gray-400
                                    focus:border-orange-500
                                    focus:ring-2
                                    focus:ring-orange-500/10
                                    disabled:cursor-not-allowed
                                    disabled:bg-gray-100
                                  "
                                />

                              </div>


                              <div
                                className="
                                  md:col-span-2
                                "
                              >

                                <div
                                  className="
                                    mb-2
                                    flex
                                    items-center
                                    justify-between
                                    gap-3
                                  "
                                >

                                  <label
                                    htmlFor={`package-description-${index}`}
                                    className="
                                      block
                                      text-sm
                                      font-medium
                                      text-gray-700
                                    "
                                  >
                                    Description
                                  </label>


                                  <span
                                    className="
                                      text-xs
                                      text-gray-400
                                    "
                                  >
                                    {
                                      pkg
                                        .description
                                        .length
                                    }
                                    /500
                                  </span>

                                </div>


                                <textarea
                                  id={`package-description-${index}`}
                                  rows={3}
                                  value={
                                    pkg.description
                                  }
                                  onChange={(
                                    event
                                  ) =>
                                    handlePackageChange(
                                      index,
                                      "description",
                                      event
                                        .target
                                        .value
                                    )
                                  }
                                  disabled={
                                    saving
                                  }
                                  maxLength={500}
                                  placeholder="Describe what is included in this package..."
                                  className="
                                    w-full
                                    resize-none
                                    rounded-xl
                                    border
                                    border-gray-300
                                    bg-white
                                    px-4
                                    py-3
                                    text-sm
                                    leading-6
                                    text-gray-900
                                    outline-none
                                    transition
                                    placeholder:text-gray-400
                                    focus:border-orange-500
                                    focus:ring-2
                                    focus:ring-orange-500/10
                                    disabled:cursor-not-allowed
                                    disabled:bg-gray-100
                                  "
                                />

                              </div>

                            </div>

                          </div>

                        )
                      )}

                    </div>

                  )}

                </div>

              </div>

            </section>


            {/* ==================================
                SAVE
            ================================== */}

            <div
              className="
                sticky
                bottom-4
                z-10
                flex
                justify-end
                rounded-2xl
                border
                border-gray-200
                bg-white/95
                p-4
                shadow-lg
                backdrop-blur-sm
              "
            >

              <button
                type="submit"
                disabled={
                  saving
                }
                className="
                  w-full
                  rounded-xl
                  bg-orange-600
                  px-6
                  py-3
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
                  sm:w-auto
                "
              >
                {saving
                  ? "Saving..."
                  : "Save Profile"}
              </button>

            </div>

          </form>

        )}

      </div>

    </main>

  );

};


export default PhotographerProfile;