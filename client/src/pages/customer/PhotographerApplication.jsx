import {
  useEffect,
  useState,
} from "react";

import { Link } from "react-router-dom";

import api from "../../services/api";

const initialForm = {
  professionalEmail: "",
  phone: "",
  specialization: "",
  experienceYears: "",
  location: "",
  bio: "",
  portfolioUrl: "",
  expectedHourlyRate: "",
  reason: "",
};

const PhotographerApplication = () => {
  const [application, setApplication] =
    useState(null);

  const [form, setForm] =
    useState(initialForm);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  // ==========================================
  // LOAD EXISTING APPLICATION
  // ==========================================

  useEffect(() => {
    let ignore = false;

    const loadApplication =
      async () => {
        try {
          const response =
            await api.get(
              "/customer/photographer-application"
            );

          if (!ignore) {
            const existingApplication =
              response.data?.data
                ?.application || null;

            setApplication(
              existingApplication
            );

            // If rejected, pre-fill the
            // previous application for editing.
            if (
              existingApplication?.status ===
              "REJECTED"
            ) {
              setForm({
                professionalEmail:
                existingApplication.professionalEmail ||
                "",
                
                phone:
                  existingApplication.phone ||
                  "",

                specialization:
                  existingApplication.specialization ||
                  "",

                experienceYears:
                  existingApplication.experienceYears ??
                  "",

                location:
                  existingApplication.location ||
                  "",

                bio:
                  existingApplication.bio ||
                  "",

                portfolioUrl:
                  existingApplication.portfolioUrl ||
                  "",

                expectedHourlyRate:
                  existingApplication.expectedHourlyRate ??
                  "",

                reason:
                  existingApplication.reason ||
                  "",
              });
            }
          }
        } catch (err) {
          console.error(
            "Failed to load photographer application:",
            err
          );

          if (!ignore) {
            setError(
              err.response?.data?.message ||
                "Failed to load your photographer application."
            );
          }
        } finally {
          if (!ignore) {
            setLoading(false);
          }
        }
      };

    loadApplication();

    return () => {
      ignore = true;
    };
  }, []);

  // ==========================================
  // FORM HANDLING
  // ==========================================

  const handleChange = (event) => {
    const {
      name,
      value,
    } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // ==========================================
  // SUBMIT APPLICATION
  // ==========================================

  const handleSubmit =
    async (event) => {
      event.preventDefault();

      setError("");
      setSuccess("");

      if (
        !form.professionalEmail.trim() ||
        !form.phone.trim() ||
        !form.specialization.trim() ||
        form.experienceYears === "" ||
        !form.location.trim() ||
        !form.bio.trim() ||
        !form.reason.trim()
      ) {
        setError(
          "Please complete all required fields."
        );

        return;
      }

      try {
        setSaving(true);

        const response =
          await api.post(
            "/customer/photographer-application",
            {
              professionalEmail:
                form.professionalEmail.trim().toLowerCase(),

              phone:
                form.phone.trim(),

              specialization:
                form.specialization.trim(),

              experienceYears:
                Number(
                  form.experienceYears
                ),

              location:
                form.location.trim(),

              bio:
                form.bio.trim(),

              portfolioUrl:
                form.portfolioUrl.trim(),

              expectedHourlyRate:
                form.expectedHourlyRate ===
                ""
                  ? 0
                  : Number(
                      form.expectedHourlyRate
                    ),

              reason:
                form.reason.trim(),
            }
          );

        const updatedApplication =
          response.data?.data
            ?.application;

        if (updatedApplication) {
          setApplication(
            updatedApplication
          );
        }

        setSuccess(
          response.data?.message ||
            "Your photographer application was submitted successfully."
        );
      } catch (err) {
        console.error(
          "Failed to submit photographer application:",
          err
        );

        setError(
          err.response?.data?.message ||
            "Failed to submit your photographer application."
        );
      } finally {
        setSaving(false);
      }
    };

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 px-6 py-12">
        <div className="mx-auto max-w-5xl">
          <div className="animate-pulse space-y-5">

            <div className="h-8 w-72 rounded bg-gray-200" />

            <div className="h-4 w-96 max-w-full rounded bg-gray-200" />

            <div className="h-96 rounded-3xl bg-white" />

          </div>
        </div>
      </main>
    );
  }

  // ==========================================
  // PENDING APPLICATION
  // ==========================================

  if (
    application?.status ===
    "PENDING"
  ) {
    return (
      <main className="min-h-screen bg-gray-50 px-6 py-12">

        <div className="mx-auto max-w-4xl">

          <Link
            to="/"
            className="text-sm font-semibold text-gray-500 transition hover:text-orange-600"
          >
            ← Back to Home
          </Link>


          <div className="mt-6 overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">

            <div className="border-b border-gray-100 px-8 py-8">

              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-2xl">
                ⏳
              </div>

              <p className="mt-5 text-sm font-bold uppercase tracking-wider text-amber-600">
                Application Pending
              </p>

              <h1 className="mt-2 text-3xl font-bold text-gray-950">
                Your application is under review
              </h1>

              <p className="mt-3 max-w-2xl leading-7 text-gray-600">
                Your photographer enrolment
                application has been submitted
                successfully. A staff administrator
                will review the information you
                provided.
              </p>

            </div>


            <div className="grid gap-6 px-8 py-8 md:grid-cols-2">

              <ApplicationDetail
                label="Professional Email"
                value={
                    application.professionalEmail
                }
                />

              <ApplicationDetail
                label="Specialization"
                value={
                  application.specialization
                }
              />

              <ApplicationDetail
                label="Experience"
                value={`${application.experienceYears} ${
                  Number(
                    application.experienceYears
                  ) === 1
                    ? "year"
                    : "years"
                }`}
              />

              <ApplicationDetail
                label="Location"
                value={
                  application.location
                }
              />

              <ApplicationDetail
                label="Phone"
                value={
                  application.phone
                }
              />

              <ApplicationDetail
                label="Expected Hourly Rate"
                value={
                  application.expectedHourlyRate
                    ? `LKR ${Number(
                        application.expectedHourlyRate
                      ).toLocaleString()}`
                    : "Not specified"
                }
              />

              <ApplicationDetail
                label="Submitted"
                value={
                  application.createdAt
                    ? new Date(
                        application.createdAt
                      ).toLocaleDateString()
                    : "—"
                }
              />

            </div>

          </div>

        </div>

      </main>
    );
  }

  // ==========================================
  // APPROVED APPLICATION
  // ==========================================

  if (
    application?.status ===
    "APPROVED"
  ) {
    return (
      <main className="min-h-screen bg-gray-50 px-6 py-12">

        <div className="mx-auto max-w-4xl">

          <Link
            to="/"
            className="text-sm font-semibold text-gray-500 transition hover:text-orange-600"
          >
            ← Back to Home
          </Link>


          <div className="mt-6 rounded-3xl border border-emerald-200 bg-white p-10 shadow-sm">

            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-2xl">
              ✓
            </div>

            <p className="mt-5 text-sm font-bold uppercase tracking-wider text-emerald-600">
              Application Approved
            </p>

            <h1 className="mt-2 text-3xl font-bold text-gray-950">
              Your photographer application was approved
            </h1>

            <p className="mt-4 max-w-2xl leading-7 text-gray-600">
              Your application has been approved
              by the administration. Photographer
              account activation details will be
              handled through the administrative
              workflow.
            </p>


            {application.adminNote && (
              <div className="mt-7 rounded-2xl bg-gray-50 p-5">

                <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Administrator Note
                </p>

                <p className="mt-2 leading-7 text-gray-700">
                  {application.adminNote}
                </p>

              </div>
            )}

          </div>

        </div>

      </main>
    );
  }

  // ==========================================
  // APPLICATION FORM
  // ==========================================

  const isRejected =
    application?.status ===
    "REJECTED";

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-12">

      <div className="mx-auto max-w-6xl">

        <Link
          to="/"
          className="text-sm font-semibold text-gray-500 transition hover:text-orange-600"
        >
          ← Back to Home
        </Link>


        <div className="mt-6 grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">


          {/* ==================================
              INFORMATION
          ================================== */}

          <section className="rounded-3xl bg-gray-950 p-8 text-white lg:p-10">

            <p className="text-sm font-bold uppercase tracking-[0.18em] text-orange-400">
              Southern Camera Rental
            </p>

            <h1 className="mt-4 text-3xl font-bold leading-tight sm:text-4xl">
              Become a Photographer
            </h1>

            <p className="mt-5 leading-7 text-gray-300">
              Apply to provide professional
              photography services through
              Southern Camera Rental.
            </p>


            <div className="mt-8 space-y-5">

              <InfoItem
                number="01"
                title="Submit Your Details"
                description="Tell us about your experience, specialization and professional background."
              />

              <InfoItem
                number="02"
                title="Administrator Review"
                description="A staff administrator reviews your application before approval."
              />

              <InfoItem
                number="03"
                title="Photographer Onboarding"
                description="Approved applicants continue through the photographer account setup process."
              />

            </div>


            <div className="mt-9 rounded-2xl border border-white/10 bg-white/5 p-5">

              <p className="text-sm font-semibold text-white">
                Important
              </p>

              <p className="mt-2 text-sm leading-6 text-gray-400">
                Submitting this application does
                not immediately convert your
                customer account into a
                photographer account.
              </p>

            </div>

          </section>


          {/* ==================================
              FORM
          ================================== */}

          <section className="rounded-3xl border border-gray-200 bg-white p-7 shadow-sm sm:p-9">

            {isRejected && (
              <div className="mb-7 rounded-2xl border border-red-200 bg-red-50 p-5">

                <p className="font-semibold text-red-800">
                  Your previous application was rejected.
                </p>

                <p className="mt-2 text-sm leading-6 text-red-700">
                  You can update your information
                  and submit a new application.
                </p>

                {application.adminNote && (
                  <div className="mt-4 border-t border-red-200 pt-4">

                    <p className="text-xs font-bold uppercase tracking-wider text-red-500">
                      Administrator Note
                    </p>

                    <p className="mt-1 text-sm leading-6 text-red-800">
                      {application.adminNote}
                    </p>

                  </div>
                )}

              </div>
            )}


            <div>

              <p className="text-sm font-bold uppercase tracking-wider text-orange-600">
                Photographer Application
              </p>

              <h2 className="mt-2 text-2xl font-bold text-gray-950">
                Professional Information
              </h2>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                Fields marked with * are required.
              </p>

            </div>


            {error && (
              <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}


            {success && (
              <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {success}
              </div>
            )}


            <form
              onSubmit={handleSubmit}
              className="mt-8 space-y-6"
            >

              <div className="grid gap-5 sm:grid-cols-2">
                
                <FormField
                    label="Professional Email *"
                    name="professionalEmail"
                    type="email"
                    value={form.professionalEmail}
                    onChange={handleChange}
                    placeholder="your.photography@example.com"
                    />

                <FormField
                  label="Phone Number *"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="0771234567"
                />


                <FormField
                  label="Location *"
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  placeholder="Galle"
                />

              </div>


              <FormField
                label="Specialization *"
                name="specialization"
                value={
                  form.specialization
                }
                onChange={
                  handleChange
                }
                placeholder="Wedding, portrait, event photography..."
              />


              <div className="grid gap-5 sm:grid-cols-2">

                <FormField
                  label="Years of Experience *"
                  name="experienceYears"
                  type="number"
                  min="0"
                  max="80"
                  value={
                    form.experienceYears
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="3"
                />


                <FormField
                  label="Expected Hourly Rate (LKR)"
                  name="expectedHourlyRate"
                  type="number"
                  min="0"
                  value={
                    form.expectedHourlyRate
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="5000"
                />

              </div>


              <FormField
                label="Portfolio URL"
                name="portfolioUrl"
                type="url"
                value={
                  form.portfolioUrl
                }
                onChange={
                  handleChange
                }
                placeholder="https://example.com/portfolio"
              />


              <TextAreaField
                label="Professional Bio *"
                name="bio"
                value={form.bio}
                onChange={
                  handleChange
                }
                placeholder="Describe your photography background, style and experience..."
                maxLength={1500}
              />


              <TextAreaField
                label="Why do you want to join SCR as a photographer? *"
                name="reason"
                value={form.reason}
                onChange={
                  handleChange
                }
                placeholder="Tell us why you would like to provide photography services through Southern Camera Rental..."
                maxLength={1500}
              />


              <div className="rounded-2xl bg-gray-50 p-5">

                <p className="text-sm font-semibold text-gray-900">
                  Before submitting
                </p>

                <p className="mt-1 text-sm leading-6 text-gray-500">
                  Please ensure the information
                  you provided is accurate. Your
                  application will be reviewed by
                  a staff administrator.
                </p>

              </div>


              <button
                type="submit"
                disabled={saving}
                className="flex w-full items-center justify-center rounded-xl bg-orange-600 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving
                  ? "Submitting..."
                  : isRejected
                    ? "Resubmit Application"
                    : "Submit Application"}
              </button>

            </form>

          </section>

        </div>

      </div>

    </main>
  );
};


// ==========================================
// SMALL COMPONENTS
// ==========================================

const FormField = ({
  label,
  name,
  value,
  onChange,
  type = "text",
  placeholder,
  min,
  max,
}) => {
  return (
    <label className="block">

      <span className="text-sm font-semibold text-gray-700">
        {label}
      </span>

      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        min={min}
        max={max}
        className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
      />

    </label>
  );
};


const TextAreaField = ({
  label,
  name,
  value,
  onChange,
  placeholder,
  maxLength,
}) => {
  return (
    <label className="block">

      <span className="text-sm font-semibold text-gray-700">
        {label}
      </span>

      <textarea
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        maxLength={maxLength}
        rows={5}
        className="mt-2 w-full resize-none rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm leading-6 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
      />

      <p className="mt-1 text-right text-xs text-gray-400">
        {value.length}/{maxLength}
      </p>

    </label>
  );
};


const InfoItem = ({
  number,
  title,
  description,
}) => {
  return (
    <div className="flex gap-4">

      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-600 text-xs font-bold text-white">
        {number}
      </div>

      <div>

        <p className="font-semibold text-white">
          {title}
        </p>

        <p className="mt-1 text-sm leading-6 text-gray-400">
          {description}
        </p>

      </div>

    </div>
  );
};


const ApplicationDetail = ({
  label,
  value,
}) => {
  return (
    <div>

      <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
        {label}
      </p>

      <p className="mt-1 font-medium text-gray-900">
        {value || "—"}
      </p>

    </div>
  );
};

export default PhotographerApplication;