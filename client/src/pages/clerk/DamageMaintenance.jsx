import { useEffect, useState } from "react";
import {
  getAllDamageRecords,
  updateDamageRecordStatus,
} from "../../services/rentalService";

const DamageMaintenance = () => {
  const [damageRecords, setDamageRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 8;

  useEffect(() => {
    let cancelled = false;

    const loadDamageRecords = async () => {
      try {
        const result = await getAllDamageRecords();

        if (!cancelled) {
          setDamageRecords(
            result?.data?.damageRecords || []
          );
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.response?.data?.message ||
              "Failed to load damage records"
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadDamageRecords();

    return () => {
      cancelled = true;
    };
  }, []);

  const refreshDamageRecords = async () => {
    const result = await getAllDamageRecords();

    setDamageRecords(
      result?.data?.damageRecords || []
    );
  };

  const handleDamageStatusUpdate = async (
    damageRecord,
    newStatus
  ) => {
    const confirmed = window.confirm(
      `Change damage status to ${newStatus.replaceAll(
        "_",
        " "
      )}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setActionLoading(damageRecord._id);
      setError("");
      setSuccess("");

      await updateDamageRecordStatus(
        damageRecord._id,
        newStatus
      );

      await refreshDamageRecords();

      setSuccess(
        `Damage record updated to ${newStatus.replaceAll(
          "_",
          " "
        )}.`
      );

      setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to update damage status"
      );
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (date) => {
    if (!date) {
      return "—";
    }

    return new Date(date).toLocaleDateString();
  };

  const getDamageStatusClass = (status) => {
    switch (status) {
      case "REPORTED":
        return "bg-red-100 text-red-800";

      case "UNDER_INSPECTION":
        return "bg-yellow-100 text-yellow-800";

      case "MAINTENANCE":
        return "bg-orange-100 text-orange-800";

      case "RESOLVED":
        return "bg-green-100 text-green-800";

      default:
        return "bg-gray-100 text-gray-700";
    }
  };

    const totalPages = Math.ceil(
    damageRecords.length / recordsPerPage
    );

    const startIndex =
    (currentPage - 1) * recordsPerPage;

    const paginatedDamageRecords = damageRecords.slice(
    startIndex,
    startIndex + recordsPerPage
    );

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-7xl">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-orange-600">
            Clerk
          </p>

          <h1 className="mt-2 text-3xl font-bold text-gray-950">
            Damage & Maintenance
          </h1>

          <p className="mt-2 max-w-3xl text-gray-600">
            Review equipment damage reported during rental
            returns and manage the inspection, maintenance,
            and resolution process.
          </p>
        </div>

        {error && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-4 font-medium text-green-700">
            ✓ {success}
          </div>
        )}

        <div className="mt-8 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-6 py-5">
            <h2 className="text-xl font-semibold text-gray-950">
              Damage Records
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Track damaged equipment from initial report
              through maintenance and resolution.
            </p>
          </div>

          {loading ? (
            <p className="p-6 text-gray-600">
              Loading damage records...
            </p>
          ) : damageRecords.length === 0 ? (
            <div className="p-10 text-center">
              <p className="font-medium text-gray-700">
                No damage records found
              </p>

              <p className="mt-1 text-sm text-gray-500">
                Damage reported during equipment returns
                will appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                      Equipment
                    </th>

                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                      Customer
                    </th>

                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                      Damage
                    </th>

                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                      Status
                    </th>

                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                      Reported
                    </th>

                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {paginatedDamageRecords.map((record) => (
                    <tr
                      key={record._id}
                      className="transition hover:bg-gray-50/70"
                    >
                      <td className="px-6 py-4">
                        <p className="font-semibold text-gray-950">
                          {record.equipment?.name ||
                            "Unknown Equipment"}
                        </p>

                        <p className="text-sm text-gray-500">
                          {record.equipment?.brand}{" "}
                          {record.equipment?.model}
                        </p>
                      </td>

                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900">
                          {record.customer?.name || "—"}
                        </p>

                        <p className="text-sm text-gray-500">
                          {record.customer?.email || "—"}
                        </p>
                      </td>

                      <td className="max-w-xs px-6 py-4 text-sm text-gray-700">
                        {record.description || "—"}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${getDamageStatusClass(
                            record.status
                          )}`}
                        >
                          {record.status.replaceAll(
                            "_",
                            " "
                          )}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-sm text-gray-600">
                        {formatDate(record.createdAt)}
                      </td>

                      <td className="px-6 py-4">
                        {record.status === "REPORTED" && (
                          <button
                            type="button"
                            onClick={() =>
                              handleDamageStatusUpdate(
                                record,
                                "UNDER_INSPECTION"
                              )
                            }
                            disabled={
                              actionLoading === record._id
                            }
                            className="rounded-lg bg-orange-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {actionLoading === record._id
                              ? "Updating..."
                              : "Start Inspection"}
                          </button>
                        )}

                        {record.status ===
                          "UNDER_INSPECTION" && (
                          <button
                            type="button"
                            onClick={() =>
                              handleDamageStatusUpdate(
                                record,
                                "MAINTENANCE"
                              )
                            }
                            disabled={
                              actionLoading === record._id
                            }
                            className="rounded-lg bg-orange-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {actionLoading === record._id
                              ? "Updating..."
                              : "Send to Maintenance"}
                          </button>
                        )}

                        {record.status ===
                          "MAINTENANCE" && (
                          <button
                            type="button"
                            onClick={() =>
                              handleDamageStatusUpdate(
                                record,
                                "RESOLVED"
                              )
                            }
                            disabled={
                              actionLoading === record._id
                            }
                            className="rounded-lg bg-orange-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {actionLoading === record._id
                              ? "Updating..."
                              : "Mark Resolved"}
                          </button>
                        )}

                        {record.status === "RESOLVED" && (
                          <span className="text-sm font-medium text-green-600">
                            Resolved ✓
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                </table>

                {totalPages > 1 && (
                <div className="flex flex-col gap-3 border-t border-gray-200 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-gray-500">
                    Showing{" "}
                    <span className="font-medium text-gray-700">
                        {startIndex + 1}
                    </span>
                    {" - "}
                    <span className="font-medium text-gray-700">
                        {Math.min(
                        startIndex + recordsPerPage,
                        damageRecords.length
                        )}
                    </span>
                    {" of "}
                    <span className="font-medium text-gray-700">
                        {damageRecords.length}
                    </span>{" "}
                    damage records
                    </p>

                    <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() =>
                        setCurrentPage((page) =>
                            Math.max(page - 1, 1)
                        )
                        }
                        disabled={currentPage === 1}
                        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        Previous
                    </button>

                    <span className="px-2 text-sm text-gray-600">
                        Page{" "}
                        <span className="font-semibold text-gray-900">
                        {currentPage}
                        </span>{" "}
                        of {totalPages}
                    </span>

                    <button
                        type="button"
                        onClick={() =>
                        setCurrentPage((page) =>
                            Math.min(page + 1, totalPages)
                        )
                        }
                        disabled={currentPage === totalPages}
                        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        Next
                    </button>
                    </div>
                </div>
                )}
                </div>
          )}
        </div>
      </div>
    </main>
  );
};

export default DamageMaintenance;