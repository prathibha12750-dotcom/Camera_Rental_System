import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "../../context/useAuth";
import api from "../../services/api";
import Loading from "../../components/Loading";


const PhotographerProfile = () => {
  const {user, updateUser } = useAuth();

  const [, setProfile] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    bio: "",
    specialization: "",
    location: "",
    hourlyRate: "",
    profileImage: "",
  });

  const [packageRates, setPackageRates] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");


  // ==========================================
  // FETCH PHOTOGRAPHER PROFILE
  // ==========================================

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get(
          "/photographer/profile"
        );

        const photographer =
          response.data?.data?.photographer;

        if (!photographer) {
          throw new Error(
            "Photographer profile data was not returned."
          );
        }

        setProfile(photographer);

        setFormData({
          name: photographer.user?.name || "",
          email: photographer.user?.email || "",
          bio: photographer.bio || "",
          specialization:
            photographer.specialization || "",
          location:
            photographer.location || "",
          hourlyRate:
            photographer.hourlyRate ?? "",
          profileImage:
            photographer.profileImage || "",
        });

        setPackageRates(
          Array.isArray(photographer.packageRates)
            ? photographer.packageRates.map((pkg) => ({
                name: pkg.name || "",
                description: pkg.description || "",
                price: pkg.price ?? "",
              }))
            : []
        );
      } catch (err) {
        console.error(
          "Failed to load photographer profile:",
          err
        );

        setError(
          err.response?.data?.message ||
            err.message ||
            "Failed to load photographer profile."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);


  // ==========================================
  // HANDLE INPUT CHANGE
  // ==========================================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  };


  // ==========================================
  // PACKAGE HANDLERS
  // ==========================================

  const addPackage = () => {
    setPackageRates((previous) => [
      ...previous,
      {
        name: "",
        description: "",
        price: "",
      },
    ]);

    setSuccess("");
    setError("");
  };


  const removePackage = (index) => {
    setPackageRates((previous) =>
      previous.filter((_, packageIndex) =>
        packageIndex !== index
      )
    );

    setSuccess("");
    setError("");
  };


  const handlePackageChange = (
    index,
    field,
    value
  ) => {
    setPackageRates((previous) =>
      previous.map((pkg, packageIndex) =>
        packageIndex === index
          ? {
              ...pkg,
              [field]: value,
            }
          : pkg
      )
    );

    setSuccess("");
    setError("");
  };


  // ==========================================
  // SUBMIT PROFILE
  // ==========================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");


    // ------------------------------------------
    // Basic validation
    // ------------------------------------------

    if (!formData.name.trim()) {
      setError("Name is required.");
      return;
    }


    if (!formData.email.trim()) {
      setError("Email is required.");
      return;
    }


    if (
      formData.hourlyRate !== "" &&
      Number(formData.hourlyRate) < 0
    ) {
      setError(
        "Hourly rate cannot be negative."
      );
      return;
    }


    // ------------------------------------------
    // Validate packages
    // ------------------------------------------

    for (const pkg of packageRates) {
      if (!pkg.name.trim()) {
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
        name: formData.name.trim(),
        email: formData.email.trim(),

        bio: formData.bio.trim(),

        specialization:
          formData.specialization.trim(),

        location:
          formData.location.trim(),

        hourlyRate:
          formData.hourlyRate === ""
            ? null
            : Number(formData.hourlyRate),

        packageRates: packageRates.map(
          (pkg) => ({
            name: pkg.name.trim(),
            description:
              pkg.description.trim(),
            price: Number(pkg.price),
          })
        ),

        profileImage:
          formData.profileImage.trim(),
      };


      const response = await api.put(
        "/photographer/profile",
        payload
      );


      const updatedPhotographer =
        response.data?.data?.photographer;


      if (!updatedPhotographer) {
        throw new Error(
          "Updated photographer profile was not returned."
        );
      }


      setProfile(updatedPhotographer);


      setFormData({
        name:
          updatedPhotographer.user?.name || "",
        email:
          updatedPhotographer.user?.email || "",
        bio:
          updatedPhotographer.bio || "",
        specialization:
          updatedPhotographer.specialization || "",
        location:
          updatedPhotographer.location || "",
        hourlyRate:
          updatedPhotographer.hourlyRate ?? "",
        profileImage:
          updatedPhotographer.profileImage || "",
      });


      setPackageRates(
        Array.isArray(
          updatedPhotographer.packageRates
        )
          ? updatedPhotographer.packageRates.map(
              (pkg) => ({
                name: pkg.name || "",
                description:
                  pkg.description || "",
                price: pkg.price ?? "",
              })
            )
          : []
      );


      // ------------------------------------------
      // Keep authentication user state updated
      // ------------------------------------------
      
      if (updatedPhotographer.user) {
        updateUser({
            ...user,

            id:
                updatedPhotographer.user?.id ||
                updatedPhotographer.user?._id ||
                user?.id,

            name:
                updatedPhotographer.user?.name ||
                user?.name,

            email:
                updatedPhotographer.user?.email ||
                user?.email,

            role:
                updatedPhotographer.user?.role ||
                user?.role,

            status:
                updatedPhotographer.user?.status ||
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
        err.response?.data?.message ||
          "Failed to update photographer profile."
      );
    } finally {
      setSaving(false);
    }
  };


  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return <Loading />;
  }


  // ==========================================
  // PAGE
  // ==========================================

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">

      <div className="mx-auto max-w-6xl">


        {/* =====================================
            HEADER
        ====================================== */}

        <div className="mb-8">

          <div className="mb-3">
            <Link
              to="/photographer"
              className="text-sm font-medium text-gray-500 transition hover:text-gray-900"
            >
              ← Back to Dashboard
            </Link>
          </div>


          <h1 className="text-3xl font-bold tracking-tight text-gray-950">
            Photographer Profile
          </h1>

          <p className="mt-2 text-sm text-gray-600">
            Manage your professional photography
            information.
          </p>

        </div>


        {/* =====================================
            ALERTS
        ====================================== */}

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}


        {success && (
          <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {success}
          </div>
        )}


        <form onSubmit={handleSubmit}>


          {/* ===================================
              ACCOUNT INFORMATION
          ==================================== */}

          <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-950">
                Account Information
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Your basic account information.
              </p>
            </div>


            <div className="grid gap-6 md:grid-cols-2">

              {/* Name */}

              <div>
                <label
                  htmlFor="name"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Name
                </label>

                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={saving}
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 disabled:bg-gray-100"
                />
              </div>


              {/* Email */}

              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Email
                </label>

                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={saving}
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 disabled:bg-gray-100"
                />
              </div>

            </div>

          </div>


          {/* ===================================
              PROFESSIONAL INFORMATION
          ==================================== */}

          <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-950">
                Professional Information
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Tell customers about your photography
                services.
              </p>
            </div>


            <div className="space-y-6">


              {/* Biography */}

              <div>
                <label
                  htmlFor="bio"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Biography
                </label>

                <textarea
                  id="bio"
                  name="bio"
                  rows="5"
                  value={formData.bio}
                  onChange={handleChange}
                  disabled={saving}
                  placeholder="Tell customers about yourself and your photography experience..."
                  className="w-full resize-none rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 disabled:bg-gray-100"
                />

                <p className="mt-2 text-xs text-gray-500">
                  Maximum 1000 characters.
                </p>
              </div>


              {/* Specialization + Location */}

              <div className="grid gap-6 md:grid-cols-2">

                <div>
                  <label
                    htmlFor="specialization"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Specialization
                  </label>

                  <input
                    id="specialization"
                    name="specialization"
                    type="text"
                    value={
                      formData.specialization
                    }
                    onChange={handleChange}
                    disabled={saving}
                    placeholder="e.g. Wedding Photography"
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 disabled:bg-gray-100"
                  />
                </div>


                <div>
                  <label
                    htmlFor="location"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Location
                  </label>

                  <input
                    id="location"
                    name="location"
                    type="text"
                    value={formData.location}
                    onChange={handleChange}
                    disabled={saving}
                    placeholder="e.g. Matara"
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 disabled:bg-gray-100"
                  />
                </div>

              </div>


              {/* Hourly Rate */}

              <div className="max-w-md">

                <label
                  htmlFor="hourlyRate"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Hourly Rate (LKR)
                </label>

                <input
                  id="hourlyRate"
                  name="hourlyRate"
                  type="number"
                  min="0"
                  value={formData.hourlyRate}
                  onChange={handleChange}
                  disabled={saving}
                  placeholder="e.g. 5000"
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 disabled:bg-gray-100"
                />

              </div>


              {/* Profile Image URL */}

              <div>

                <label
                  htmlFor="profileImage"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Profile Image URL
                </label>

                <input
                  id="profileImage"
                  name="profileImage"
                  type="url"
                  value={formData.profileImage}
                  onChange={handleChange}
                  disabled={saving}
                  placeholder="https://example.com/profile-image.jpg"
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 disabled:bg-gray-100"
                />

                <p className="mt-2 text-xs text-gray-500">
                  Image uploading/storage will be
                  implemented separately.
                </p>

              </div>

            </div>

          </div>


          {/* ===================================
              PHOTOGRAPHY PACKAGES
          ==================================== */}

          <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

            <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

              <div>
                <h2 className="text-lg font-semibold text-gray-950">
                  Photography Packages
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Add the photography packages you
                  offer.
                </p>
              </div>


              <button
                type="button"
                onClick={addPackage}
                disabled={saving}
                className="rounded-xl bg-gray-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                + Add Package
              </button>

            </div>


            {packageRates.length === 0 ? (

              <div className="rounded-xl border border-dashed border-gray-300 px-6 py-10 text-center">

                <p className="text-sm text-gray-500">
                  You have not added any photography
                  packages yet.
                </p>

                <button
                  type="button"
                  onClick={addPackage}
                  disabled={saving}
                  className="mt-4 text-sm font-semibold text-gray-950 underline underline-offset-4"
                >
                  Add your first package
                </button>

              </div>

            ) : (

              <div className="space-y-5">

                {packageRates.map(
                  (pkg, index) => (

                    <div
                      key={index}
                      className="rounded-xl border border-gray-200 bg-gray-50 p-5"
                    >

                      <div className="mb-4 flex items-center justify-between">

                        <h3 className="text-sm font-semibold text-gray-900">
                          Package {index + 1}
                        </h3>

                        <button
                          type="button"
                          onClick={() =>
                            removePackage(index)
                          }
                          disabled={saving}
                          className="text-sm font-medium text-red-600 transition hover:text-red-700 disabled:opacity-50"
                        >
                          Remove
                        </button>

                      </div>


                      <div className="grid gap-5 md:grid-cols-2">

                        {/* Package Name */}

                        <div>
                          <label className="mb-2 block text-sm font-medium text-gray-700">
                            Package Name
                          </label>

                          <input
                            type="text"
                            value={pkg.name}
                            onChange={(event) =>
                              handlePackageChange(
                                index,
                                "name",
                                event.target.value
                              )
                            }
                            disabled={saving}
                            placeholder="e.g. Full Day Wedding"
                            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 disabled:bg-gray-100"
                          />
                        </div>


                        {/* Price */}

                        <div>
                          <label className="mb-2 block text-sm font-medium text-gray-700">
                            Price (LKR)
                          </label>

                          <input
                            type="number"
                            min="0"
                            value={pkg.price}
                            onChange={(event) =>
                              handlePackageChange(
                                index,
                                "price",
                                event.target.value
                              )
                            }
                            disabled={saving}
                            placeholder="e.g. 75000"
                            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 disabled:bg-gray-100"
                          />
                        </div>


                        {/* Description */}

                        <div className="md:col-span-2">

                          <label className="mb-2 block text-sm font-medium text-gray-700">
                            Description
                          </label>

                          <textarea
                            rows="3"
                            value={
                              pkg.description
                            }
                            onChange={(event) =>
                              handlePackageChange(
                                index,
                                "description",
                                event.target.value
                              )
                            }
                            disabled={saving}
                            placeholder="Describe what is included in this package..."
                            className="w-full resize-none rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 disabled:bg-gray-100"
                          />

                        </div>

                      </div>

                    </div>

                  )
                )}

              </div>

            )}

          </div>


          {/* ===================================
              SAVE BUTTON
          ==================================== */}

          <div className="flex justify-end">

            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-gray-950 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving
                ? "Saving..."
                : "Save Profile"}
            </button>

          </div>

        </form>

      </div>

    </div>
  );
};


export default PhotographerProfile;