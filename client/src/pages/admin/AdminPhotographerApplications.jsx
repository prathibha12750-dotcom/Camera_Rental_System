import {
  useEffect,
  useMemo,
  useState,
} from "react";

import api from "../../services/api";

const AdminPhotographerApplications = () => {
  const [applications, setApplications] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [filter, setFilter] =
    useState("PENDING");

  const [selectedApplication, setSelectedApplication] =
    useState(null);

  const [decision, setDecision] =
    useState("");

  const [adminNote, setAdminNote] =
    useState("");

  const [saving, setSaving] =
    useState(false);


  // ==========================================
  // LOAD APPLICATIONS
  // ==========================================

  useEffect(() => {
    let ignore = false;

    const loadApplications =
      async () => {
        try {
          const response =
            await api.get(
              "/admin/photographer-applications"
            );

          if (!ignore) {
            setApplications(
              Array.isArray(
                response.data?.data
                  ?.applications
              )
                ? response.data.data
                    .applications
                : []
            );
          }
        } catch (err) {
          console.error(
            "Failed to load photographer applications:",
            err
          );

          if (!ignore) {
            setError(
              err.response?.data?.message ||
                "Failed to load photographer applications."
            );
          }
        } finally {
          if (!ignore) {
            setLoading(false);
          }
        }
      };

    loadApplications();

    return () => {
      ignore = true;
    };
  }, []);


  // ==========================================
  // FILTERED APPLICATIONS
  // ==========================================

  const filteredApplications =
    useMemo(() => {
      if (filter === "ALL") {
        return applications;
      }

      return applications.filter(
        (application) =>
          application.status ===
          filter
      );
    }, [
      applications,
      filter,
    ]);


  // ==========================================
  // COUNTS
  // ==========================================

  const counts = useMemo(
    () => ({
      ALL:
        applications.length,

      PENDING:
        applications.filter(
          (application) =>
            application.status ===
            "PENDING"
        ).length,

      APPROVED:
        applications.filter(
          (application) =>
            application.status ===
            "APPROVED"
        ).length,

      REJECTED:
        applications.filter(
          (application) =>
            application.status ===
            "REJECTED"
        ).length,
    }),
    [applications]
  );


  // ==========================================
  // OPEN APPLICATION
  // ==========================================

  const openApplication = (
    application
  ) => {
    setSelectedApplication(
      application
    );

    setDecision("");

    setAdminNote(
      application.adminNote || ""
    );

    setError("");
    setSuccess("");
  };


  // ==========================================
  // CLOSE APPLICATION
  // ==========================================

  const closeApplication = () => {
    setSelectedApplication(null);
    setDecision("");
    setAdminNote("");
  };


  // ==========================================
  // REVIEW APPLICATION
  // ==========================================

  const handleReview =
    async () => {
      if (
        !selectedApplication ||
        !decision
      ) {
        setError(
          "Please choose Approve or Reject."
        );

        return;
      }

      if (
        decision === "REJECTED" &&
        !adminNote.trim()
      ) {
        setError(
          "Please provide a rejection reason."
        );

        return;
      }

      try {
        setSaving(true);

        setError("");
        setSuccess("");

        const response =
          await api.patch(
            `/admin/photographer-applications/${selectedApplication._id}/status`,
            {
              status: decision,
              adminNote:
                adminNote.trim(),
            }
          );

        const updatedApplication =
          response.data?.data
            ?.application;

        if (updatedApplication) {
          setApplications(
            (previous) =>
              previous.map(
                (application) =>
                  application._id ===
                  updatedApplication._id
                    ? updatedApplication
                    : application
              )
          );

          setSelectedApplication(
            updatedApplication
          );
        }

        setSuccess(
          response.data?.message ||
            "Application updated successfully."
        );

        setDecision("");
      } catch (err) {
        console.error(
          "Failed to review application:",
          err
        );

        setError(
          err.response?.data?.message ||
            "Failed to review application."
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
      <main className="p-6 lg:p-8">

        <div className="mx-auto max-w-7xl">

          <div className="animate-pulse space-y-5">

            <div className="h-8 w-72 rounded bg-gray-200" />

            <div className="h-24 rounded-2xl bg-gray-100" />

            <div className="h-96 rounded-2xl bg-gray-100" />

          </div>

        </div>

      </main>
    );
  }


  return (
    <main className="p-6 lg:p-8">

      <div className="mx-auto max-w-7xl">

        {/* ==================================
            PAGE HEADER
        ================================== */}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

          <div>

            <p className="text-sm font-bold uppercase tracking-wider text-orange-600">
              Administration
            </p>

            <h1 className="mt-1 text-3xl font-bold text-gray-950">
              Photographer Applications
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
              Review customer applications
              requesting enrolment as
              photographers.
            </p>

          </div>

        </div>


        {/* ==================================
            MESSAGES
        ================================== */}

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


        {/* ==================================
            SUMMARY
        ================================== */}

        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

          <SummaryCard
            label="Total"
            value={counts.ALL}
          />

          <SummaryCard
            label="Pending"
            value={counts.PENDING}
          />

          <SummaryCard
            label="Approved"
            value={counts.APPROVED}
          />

          <SummaryCard
            label="Rejected"
            value={counts.REJECTED}
          />

        </div>


        {/* ==================================
            FILTERS
        ================================== */}

        <div className="mt-8 flex flex-wrap gap-2">

          {[
            "PENDING",
            "APPROVED",
            "REJECTED",
            "ALL",
          ].map((status) => (
            <button
              key={status}
              type="button"
              onClick={() =>
                setFilter(status)
              }
              className={
                filter === status
                  ? "rounded-xl bg-gray-950 px-4 py-2.5 text-sm font-semibold text-white"
                  : "rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
              }
            >
              {formatStatus(status)}

              <span className="ml-2 text-xs opacity-70">
                {counts[status]}
              </span>

            </button>
          ))}

        </div>


        {/* ==================================
            APPLICATION LIST
        ================================== */}

        <section className="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

          {filteredApplications.length ===
          0 ? (

            <div className="px-6 py-16 text-center">

              <p className="font-semibold text-gray-900">
                No applications found
              </p>

              <p className="mt-2 text-sm text-gray-500">
                There are no applications
                matching this status.
              </p>

            </div>

          ) : (

            <div className="divide-y divide-gray-100">

              {filteredApplications.map(
                (application) => (
                  <button
                    key={
                      application._id
                    }
                    type="button"
                    onClick={() =>
                      openApplication(
                        application
                      )
                    }
                    className="flex w-full flex-col gap-4 px-6 py-5 text-left transition hover:bg-gray-50 sm:flex-row sm:items-center sm:justify-between"
                  >

                    <div className="min-w-0">

                      <div className="flex flex-wrap items-center gap-2">

                        <p className="font-semibold text-gray-950">
                          {application
                            .customer
                            ?.name ||
                            "Customer"}
                        </p>

                        <StatusBadge
                          status={
                            application.status
                          }
                        />

                      </div>


                      <p className="mt-1 text-sm text-gray-500">
                        {application
                          .customer
                          ?.email ||
                          "No email"}
                      </p>


                      <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-xs text-gray-500">

                        <span>
                          {
                            application.specialization
                          }
                        </span>

                        <span>
                          {
                            application.location
                          }
                        </span>

                        <span>
                          {
                            application.experienceYears
                          }{" "}
                          years experience
                        </span>

                      </div>

                    </div>


                    <div className="shrink-0 text-sm font-semibold text-orange-600">
                      View Application →
                    </div>

                  </button>
                )
              )}

            </div>

          )}

        </section>

      </div>


      {/* ==================================
          APPLICATION DETAIL PANEL
      ================================== */}

      {selectedApplication && (

        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 px-4 py-6">

          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white shadow-2xl">

            {/* Header */}

            <div className="sticky top-0 z-10 flex items-start justify-between border-b border-gray-100 bg-white px-6 py-5 sm:px-8">

              <div>

                <div className="flex flex-wrap items-center gap-3">

                  <h2 className="text-xl font-bold text-gray-950">
                    Photographer Application
                  </h2>

                  <StatusBadge
                    status={
                      selectedApplication.status
                    }
                  />

                </div>

                <p className="mt-1 text-sm text-gray-500">
                  Submitted by{" "}
                  {selectedApplication
                    .customer?.name ||
                    "Customer"}
                </p>

              </div>


              <button
                type="button"
                onClick={
                  closeApplication
                }
                className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100"
              >
                ✕
              </button>

            </div>


            <div className="p-6 sm:p-8">

              {/* Applicant */}

              <section>

                <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Applicant
                </p>

                <div className="mt-4 grid gap-5 sm:grid-cols-2">

                  <Detail
                    label="Name"
                    value={
                      selectedApplication
                        .customer?.name
                    }
                  />

                  <Detail
                    label="Email"
                    value={
                      selectedApplication
                        .customer?.email
                    }
                  />

                  <Detail
                    label="Phone"
                    value={
                      selectedApplication.phone
                    }
                  />

                  <Detail
                    label="Location"
                    value={
                      selectedApplication.location
                    }
                  />

                </div>

              </section>


              <hr className="my-7 border-gray-100" />


              {/* Professional information */}

              <section>

                <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Professional Information
                </p>

                <div className="mt-4 grid gap-5 sm:grid-cols-2">

                  <Detail
                    label="Specialization"
                    value={
                      selectedApplication.specialization
                    }
                  />

                  <Detail
                    label="Experience"
                    value={`${selectedApplication.experienceYears} years`}
                  />

                  <Detail
                    label="Expected Hourly Rate"
                    value={
                      selectedApplication
                        .expectedHourlyRate
                        ? `LKR ${Number(
                            selectedApplication.expectedHourlyRate
                          ).toLocaleString()}`
                        : "Not specified"
                    }
                  />

                  <Detail
                    label="Submitted"
                    value={
                      selectedApplication.createdAt
                        ? new Date(
                            selectedApplication.createdAt
                          ).toLocaleDateString()
                        : "—"
                    }
                  />

                </div>


                {selectedApplication
                  .portfolioUrl && (

                  <div className="mt-5">

                    <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                      Portfolio
                    </p>

                    <a
                      href={
                        selectedApplication.portfolioUrl
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-block break-all text-sm font-medium text-orange-600 hover:underline"
                    >
                      {
                        selectedApplication.portfolioUrl
                      }
                    </a>

                  </div>
                )}


                <LongDetail
                  label="Professional Bio"
                  value={
                    selectedApplication.bio
                  }
                />


                <LongDetail
                  label="Reason for Applying"
                  value={
                    selectedApplication.reason
                  }
                />

              </section>


              {/* Existing reviewed state */}

              {selectedApplication.status !==
                "PENDING" && (

                <>
                  <hr className="my-7 border-gray-100" />

                  <section>

                    <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                      Review Decision
                    </p>

                    <div className="mt-4 rounded-2xl bg-gray-50 p-5">

                      <StatusBadge
                        status={
                          selectedApplication.status
                        }
                      />

                      {selectedApplication.adminNote && (
                        <p className="mt-3 text-sm leading-6 text-gray-700">
                          {
                            selectedApplication.adminNote
                          }
                        </p>
                      )}

                      {selectedApplication.reviewedAt && (
                        <p className="mt-3 text-xs text-gray-400">
                          Reviewed{" "}
                          {new Date(
                            selectedApplication.reviewedAt
                          ).toLocaleString()}
                        </p>
                      )}

                    </div>

                  </section>
                </>
              )}


              {/* Pending decision */}

              {selectedApplication.status ===
                "PENDING" && (

                <>
                  <hr className="my-7 border-gray-100" />

                  <section>

                    <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                      Review Application
                    </p>


                    <div className="mt-4 grid gap-3 sm:grid-cols-2">

                      <button
                        type="button"
                        onClick={() =>
                          setDecision(
                            "APPROVED"
                          )
                        }
                        className={
                          decision ===
                          "APPROVED"
                            ? "rounded-xl border border-emerald-500 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700"
                            : "rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 transition hover:border-emerald-300 hover:bg-emerald-50"
                        }
                      >
                        ✓ Approve
                      </button>


                      <button
                        type="button"
                        onClick={() =>
                          setDecision(
                            "REJECTED"
                          )
                        }
                        className={
                          decision ===
                          "REJECTED"
                            ? "rounded-xl border border-red-500 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
                            : "rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 transition hover:border-red-300 hover:bg-red-50"
                        }
                      >
                        ✕ Reject
                      </button>

                    </div>


                    <label className="mt-5 block">

                      <span className="text-sm font-semibold text-gray-700">
                        Administrator Note
                        {decision ===
                          "REJECTED" &&
                          " *"}
                      </span>

                      <textarea
                        value={adminNote}
                        onChange={(event) =>
                          setAdminNote(
                            event.target
                              .value
                          )
                        }
                        rows={4}
                        maxLength={1000}
                        placeholder={
                          decision ===
                          "REJECTED"
                            ? "Explain why this application is being rejected..."
                            : "Optional note for the applicant..."
                        }
                        className="mt-2 w-full resize-none rounded-xl border border-gray-300 px-4 py-3 text-sm leading-6 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
                      />

                    </label>


                    <button
                      type="button"
                      disabled={
                        saving ||
                        !decision
                      }
                      onClick={
                        handleReview
                      }
                      className="mt-5 flex w-full items-center justify-center rounded-xl bg-gray-950 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {saving
                        ? "Saving Decision..."
                        : decision ===
                            "APPROVED"
                          ? "Confirm Approval"
                          : decision ===
                              "REJECTED"
                            ? "Confirm Rejection"
                            : "Choose a Decision"}
                    </button>

                  </section>
                </>
              )}

            </div>

          </div>

        </div>
      )}

    </main>
  );
};


// ==========================================
// SMALL COMPONENTS
// ==========================================

const SummaryCard = ({
  label,
  value,
}) => (
  <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

    <p className="text-sm font-medium text-gray-500">
      {label}
    </p>

    <p className="mt-2 text-3xl font-bold text-gray-950">
      {value}
    </p>

  </div>
);


const Detail = ({
  label,
  value,
}) => (
  <div>

    <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
      {label}
    </p>

    <p className="mt-1 text-sm font-medium text-gray-900">
      {value || "—"}
    </p>

  </div>
);


const LongDetail = ({
  label,
  value,
}) => (
  <div className="mt-6">

    <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
      {label}
    </p>

    <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-gray-700">
      {value || "—"}
    </p>

  </div>
);


const StatusBadge = ({
  status,
}) => {
  const classes = {
    PENDING:
      "bg-amber-50 text-amber-700",

    APPROVED:
      "bg-emerald-50 text-emerald-700",

    REJECTED:
      "bg-red-50 text-red-700",
  };

  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
        classes[status] ||
        "bg-gray-100 text-gray-600"
      }`}
    >
      {formatStatus(status)}
    </span>
  );
};


const formatStatus = (
  status
) => {
  if (!status) {
    return "Unknown";
  }

  return (
    status.charAt(0) +
    status
      .slice(1)
      .toLowerCase()
  );
};

export default AdminPhotographerApplications;