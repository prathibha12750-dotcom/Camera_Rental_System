import { useEffect, useState } from "react";
import { useAuth } from "../../context/useAuth";
import {
  getAllRentals,
  approveRental,
  rejectRental,
  issueRental,
  returnRental,
  completeRental,
  getOverdueRentals,
  getAllDamageRecords,
  updateDamageRecordStatus,
} from "../../services/rentalService";

const RentalManagement = () => {
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [actionLoading, setActionLoading] = useState(null);
  const [success, setSuccess] = useState("");

  const [returningRental, setReturningRental] = useState(null);

    const [returnData, setReturnData] = useState({
    condition: "GOOD",
    damageDescription: "",
    });

    const [showOverdueOnly, setShowOverdueOnly] = useState(false);

    const [damageRecords, setDamageRecords] = useState([]);
    const [showDamageRecords, setShowDamageRecords] = useState(false);
    const [damageLoading, setDamageLoading] = useState(false);

  const loadRentals = async () => {
    try {
      setLoading(true);
      setError("");

      const result = await getAllRentals();

      console.log("RENTAL RESULT:", result);

      setRentals(result?.data?.rentals || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to load rentals"
      );
    } finally {
      setLoading(false);
    }
  };



  const loadOverdueRentals = async () => {
    try {
        setLoading(true);
        setError("");

        const result = await getOverdueRentals();

        console.log("OVERDUE RESULT:", result);

        setRentals(result?.data?.rentals || []);
    } catch (err) {
        setError(
        err.response?.data?.message ||
            "Failed to load overdue rentals"
        );
    } finally {
        setLoading(false);
    }
  };


  const refreshRentals = async () => {
  if (showOverdueOnly) {
    await loadOverdueRentals();
  } else {
    await loadRentals();
  }
};


  const { user } = useAuth();

  const isClerk = user?.role === "CLERK";


  const loadDamageRecords = async () => {
  try {
    setDamageLoading(true);
    setError("");

    const result = await getAllDamageRecords();

    console.log("DAMAGE RECORD RESULT:", result);

    setDamageRecords(result?.data?.damageRecords || []);
  } catch (err) {
    setError(
      err.response?.data?.message ||
        "Failed to load damage records"
    );
  } finally {
    setDamageLoading(false);
  }
};


  const handleOverdueFilter = async () => {
    if (showOverdueOnly) {
        await loadRentals();
        setShowOverdueOnly(false);
    } else {
        await loadOverdueRentals();
        setShowOverdueOnly(true);
    }
 };


 const handleDamageRecords = async () => {
  if (showDamageRecords) {
    setShowDamageRecords(false);
    return;
  }

  await loadDamageRecords();
  setShowDamageRecords(true);
};


const handleDamageStatusUpdate = async (
  damageRecord,
  newStatus
) => {
  const confirmed = window.confirm(
    `Change damage status to ${newStatus.replace("_", " ")}?`
  );

  if (!confirmed) return;

  try {
    setActionLoading(damageRecord._id);
    setError("");
    setSuccess("");

    await updateDamageRecordStatus(
      damageRecord._id,
      newStatus
    );

    await loadDamageRecords();

    setSuccess(
      `Damage record updated to ${newStatus.replace("_", " ")}.`
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


  const handleApprove = async (rental) => {
    const confirmed = window.confirm(
        `Approve rental request for "${rental.equipment?.name}"?`
    );

    if (!confirmed) return;

    try {
        setActionLoading(rental._id);
        setError("");
        setSuccess("");

        await approveRental(rental._id);

        await loadRentals();

        setSuccess("Rental approved successfully.");

        setTimeout(() => {
        setSuccess("");
        }, 3000);
    } catch (err) {
        setError(
        err.response?.data?.message ||
            "Failed to approve rental"
        );
    } finally {
        setActionLoading(null);
    }
};


const handleReject = async (rental) => {
  const confirmed = window.confirm(
    `Reject rental request for "${rental.equipment?.name}"?`
  );

  if (!confirmed) return;

  try {
    setActionLoading(rental._id);
    setError("");
    setSuccess("");

    await rejectRental(rental._id);

    await loadRentals();

    setSuccess("Rental rejected successfully.");

    setTimeout(() => {
      setSuccess("");
    }, 3000);
  } catch (err) {
    setError(
      err.response?.data?.message ||
        "Failed to reject rental"
    );
  } finally {
    setActionLoading(null);
  }
};


const handleIssue = async (rental) => {
  const confirmed = window.confirm(
    `Issue "${rental.equipment?.name}" to ${rental.customer?.name || "this customer"}?`
  );

  if (!confirmed) return;

  try {
    setActionLoading(rental._id);
    setError("");
    setSuccess("");

    await issueRental(rental._id);

    await loadRentals();

    setSuccess("Equipment issued successfully.");

    setTimeout(() => {
      setSuccess("");
    }, 3000);
  } catch (err) {
    setError(
      err.response?.data?.message ||
        "Failed to issue equipment"
    );
  } finally {
    setActionLoading(null);
  }
};


const openReturnForm = (rental) => {
  setReturningRental(rental);

  setReturnData({
    condition: "GOOD",
    damageDescription: "",
  });

  setError("");
  setSuccess("");
};



const handleReturn = async () => {
  if (!returningRental) return;

  if (
    returnData.condition === "DAMAGED" &&
    !returnData.damageDescription.trim()
  ) {
    setError(
      "Please provide a damage description for damaged equipment."
    );
    return;
  }

  try {
    setActionLoading(returningRental._id);
    setError("");
    setSuccess("");

    await returnRental(returningRental._id, {
      condition: returnData.condition,
      damageDescription: returnData.damageDescription,
    });

    await refreshRentals();

    setReturningRental(null);

    setReturnData({
      condition: "GOOD",
      damageDescription: "",
    });

    setSuccess("Equipment returned successfully.");

    setTimeout(() => {
      setSuccess("");
    }, 3000);

  } catch (err) {
    setError(
      err.response?.data?.message ||
        "Failed to return equipment"
    );
  } finally {
    setActionLoading(null);
  }
};



const handleComplete = async (rental) => {
  const confirmed = window.confirm(
    `Complete rental for "${rental.equipment?.name}"?`
  );

  if (!confirmed) return;

  try {
    setActionLoading(rental._id);
    setError("");
    setSuccess("");

    await completeRental(rental._id);

    await loadRentals();

    setSuccess("Rental completed successfully.");

    setTimeout(() => {
      setSuccess("");
    }, 3000);
  } catch (err) {
    setError(
      err.response?.data?.message ||
        "Failed to complete rental"
    );
  } finally {
    setActionLoading(null);
  }
};


  useEffect(() => {
    let cancelled = false;

    const fetchInitialRentals = async () => {
      try {
        const result = await getAllRentals();

        console.log("RENTAL RESULT:", result);

        if (!cancelled) {
          setRentals(result?.data?.rentals || []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.response?.data?.message ||
              "Failed to load rentals"
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchInitialRentals();

    return () => {
      cancelled = true;
    };
  }, []);

  const formatDate = (date) => {
    if (!date) return "—";

    return new Date(date).toLocaleDateString();
  };



  const getRentalStatusClass = (status) => {
  switch (status) {
    case "PENDING":
      return "bg-yellow-100 text-yellow-800";

    case "CONFIRMED":
      return "bg-blue-100 text-blue-800";

    case "ACTIVE":
      return "bg-green-100 text-green-800";

    case "RETURNED":
      return "bg-purple-100 text-purple-800";

    case "COMPLETED":
      return "bg-emerald-100 text-emerald-800";

    case "REJECTED":
      return "bg-red-100 text-red-800";

    case "CANCELLED":
      return "bg-gray-100 text-gray-700";

    default:
      return "bg-gray-100 text-gray-700";
  }
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



  return (
    <main className="min-h-[calc(100vh-4rem)] bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
                <p className="text-sm font-semibold uppercase tracking-wider text-orange-600">
                  {isClerk ? "Clerk" : "Admin"}
                </p>

                <h1 className="mt-2 text-3xl font-bold text-gray-950">
                Rental Management
                </h1>

                <p className="mt-2 text-gray-600">
                  {isClerk
                    ? "Manage rental requests, equipment issue and return operations, overdue rentals, and damage records."
                    : "Manage equipment rental requests and rental status."}
                </p>
            </div>

           

            <div className="flex flex-wrap gap-3">
                <button
                    type="button"
                    onClick={handleOverdueFilter}
                    className={
                    showOverdueOnly
                        ? "rounded-xl bg-red-600 px-5 py-3 font-semibold text-white hover:bg-red-700"
                        : "rounded-xl border border-red-300 bg-white px-5 py-3 font-semibold text-red-600 hover:bg-red-50"
                    }
                >
                    {showOverdueOnly
                    ? "Show All Rentals"
                    : "Show Overdue Rentals"}
                </button>

                <button
                    type="button"
                    onClick={handleDamageRecords}
                    className={
                    showDamageRecords
                        ? "rounded-xl bg-orange-600 px-5 py-3 font-semibold text-white hover:bg-orange-700"
                        : "rounded-xl border border-orange-300 bg-white px-5 py-3 font-semibold text-orange-600 hover:bg-orange-50"
                    }
                >
                    {showDamageRecords
                    ? "Hide Damage Records"
                    : "Damage Records"}
                </button>
            </div>
        </div>

        {/* Loading */}
        {loading && (
          <p className="mt-8 text-gray-600">
            Loading rentals...
          </p>
        )}

        {/* Error */}
        {error && (
          <div className="mt-8 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {/* No rentals */}
        {!loading && !error && rentals.length === 0 && (
          <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-8 text-center">
            <p className="text-gray-600">
              No rentals found.
            </p>
          </div>
        )}
        


        {success && (
            <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-4 font-medium text-green-700">
                ✓ {success}
            </div>
        )}


        {returningRental && (
            <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

                <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold text-gray-950">
                    Return Equipment
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
                    {returningRental.equipment?.name}
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => {
                    setReturningRental(null);
                    setError("");
                    }}
                    className="text-sm font-semibold text-gray-500 hover:text-gray-900"
                >
                    Close
                </button>
                </div>

                <div className="mt-6 grid gap-4">

                <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Returned Condition
                    </label>

                    <select
                    value={returnData.condition}
                    onChange={(e) =>
                        setReturnData({
                        ...returnData,
                        condition: e.target.value,
                        })
                    }
                    className="w-full rounded-xl border border-gray-300 px-4 py-3"
                    >
                    <option value="EXCELLENT">Excellent</option>
                    <option value="GOOD">Good</option>
                    <option value="FAIR">Fair</option>
                    <option value="DAMAGED">Damaged</option>
                    </select>
                </div>

                {returnData.condition === "DAMAGED" && (
                    <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                        Damage Description
                    </label>

                    <textarea
                        value={returnData.damageDescription}
                        onChange={(e) =>
                        setReturnData({
                            ...returnData,
                            damageDescription: e.target.value,
                        })
                        }
                        placeholder="Describe the damage..."
                        className="min-h-28 w-full rounded-xl border border-gray-300 px-4 py-3"
                    />
                    </div>
                )}

                <button
                    type="button"
                    onClick={handleReturn}
                    disabled={
                    actionLoading === returningRental._id
                    }
                    className="w-fit rounded-xl bg-orange-600 px-5 py-3 font-semibold text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {actionLoading === returningRental._id
                    ? "Processing Return..."
                    : "Confirm Return"}
                </button>

                </div>
            </div>
            )}


            {showOverdueOnly && !loading && !error && (
                <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4">
                    <p className="font-semibold text-red-700">
                    {rentals.length} overdue rental
                    {rentals.length !== 1 ? "s" : ""} found
                    </p>
                </div>
            )}



        {showDamageRecords && (
            <div className="mt-8 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

                <div className="border-b border-gray-200 px-6 py-5">
                <h2 className="text-xl font-semibold text-gray-950">
                    Damage Records
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                    Equipment damage reported during rental returns.
                </p>
                </div>

                {damageLoading ? (
                <p className="p-6 text-gray-600">
                    Loading damage records...
                </p>
                ) : damageRecords.length === 0 ? (
                <p className="p-6 text-gray-600">
                    No damage records found.
                </p>
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
                            Actions
                        </th>

                        </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-100">
                        {damageRecords.map((record) => (
                        <tr key={record._id}>

                            <td className="px-6 py-4">
                            <p className="font-semibold text-gray-950">
                                {record.equipment?.name || "Unknown Equipment"}
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
                                        {record.status.replaceAll("_", " ")}
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
                                    disabled={actionLoading === record._id}
                                    className="rounded-lg bg-orange-600 px-3 py-2 text-sm font-semibold text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                    {actionLoading === record._id
                                        ? "Updating..."
                                        : "Start Inspection"}
                                    </button>
                                )}

                                {record.status === "UNDER_INSPECTION" && (
                                    <button
                                    type="button"
                                    onClick={() =>
                                        handleDamageStatusUpdate(
                                        record,
                                        "MAINTENANCE"
                                        )
                                    }
                                    disabled={actionLoading === record._id}
                                    className="rounded-lg bg-orange-600 px-3 py-2 text-sm font-semibold text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                    {actionLoading === record._id
                                        ? "Updating..."
                                        : "Send to Maintenance"}
                                    </button>
                                )}

                                {record.status === "MAINTENANCE" && (
                                    <button
                                    type="button"
                                    onClick={() =>
                                        handleDamageStatusUpdate(
                                        record,
                                        "RESOLVED"
                                        )
                                    }
                                    disabled={actionLoading === record._id}
                                    className="rounded-lg bg-orange-600 px-3 py-2 text-sm font-semibold text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
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
                </div>
                )}
            </div>
            )}



        {/* Rental table */}
        {!loading && !error && rentals.length > 0 && (
          <div className="mt-8 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">

                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                      Customer
                    </th>

                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                      Equipment
                    </th>

                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                      Rental Period
                    </th>

                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                      Total
                    </th>

                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                      Status
                    </th>

                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                        Actions
                    </th>

                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {rentals.map((rental) => (
                    <tr key={rental._id}>

                      {/* Customer */}
                      <td className="px-6 py-4">
                        <p className="font-semibold text-gray-950">
                          {rental.customer?.name || "Unknown Customer"}
                        </p>

                        <p className="text-sm text-gray-500">
                          {rental.customer?.email || "—"}
                        </p>
                      </td>

                      {/* Equipment */}
                      <td className="px-6 py-4">
                        <p className="font-semibold text-gray-950">
                          {rental.equipment?.name || "Unknown Equipment"}
                        </p>

                        <p className="text-sm text-gray-500">
                          {rental.equipment?.brand}{" "}
                          {rental.equipment?.model}
                        </p>
                      </td>

                      {/* Dates */}
                      <td className="px-6 py-4 text-sm text-gray-700">
                        <p>{formatDate(rental.startDate)}</p>

                        <p className="text-gray-500">
                            to {formatDate(rental.endDate)}
                        </p>

                        {rental.daysOverdue > 0 && (
                            <p className="mt-1 font-semibold text-red-600">
                            {rental.daysOverdue} day
                            {rental.daysOverdue !== 1 ? "s" : ""} overdue
                            </p>
                        )}
                      </td>

                      {/* Price */}
                      <td className="px-6 py-4 font-medium text-gray-900">
                        LKR{" "}
                        {rental.totalPrice?.toLocaleString() || "0"}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${getRentalStatusClass(
                                rental.status
                            )}`}
                        >
                                    {rental.status}
                        </span>
                      </td>

                      <td className="px-6 py-4">

                        {/* PENDING */}
                        {rental.status === "PENDING" && (
                            <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => handleApprove(rental)}
                                disabled={actionLoading === rental._id}
                                className="rounded-lg bg-orange-600 px-3 py-2 text-sm font-semibold text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {actionLoading === rental._id
                                ? "Processing..."
                                : "Approve"}
                            </button>

                            <button
                                type="button"
                                onClick={() => handleReject(rental)}
                                disabled={actionLoading === rental._id}
                                className="rounded-lg border border-red-300 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Reject
                            </button>
                            </div>
                        )}

                        {/* CONFIRMED */}
                        {rental.status === "CONFIRMED" && (
                            <button
                            type="button"
                            onClick={() => handleIssue(rental)}
                            disabled={actionLoading === rental._id}
                            className="rounded-lg bg-orange-600 px-3 py-2 text-sm font-semibold text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                            {actionLoading === rental._id
                                ? "Issuing..."
                                : "Issue Equipment"}
                            </button>
                        )}

                        {/* ACTIVE */}
                            {rental.status === "ACTIVE" && (
                            <button
                                type="button"
                                onClick={() => openReturnForm(rental)}
                                disabled={actionLoading === rental._id}
                                className="rounded-lg bg-orange-600 px-3 py-2 text-sm font-semibold text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Return Equipment
                            </button>
                            )}


                            {/* RETURNED */}
                            {rental.status === "RETURNED" && (
                            <button
                                type="button"
                                onClick={() => handleComplete(rental)}
                                disabled={actionLoading === rental._id}
                                className="rounded-lg bg-orange-600 px-3 py-2 text-sm font-semibold text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {actionLoading === rental._id
                                ? "Completing..."
                                : "Complete Rental"}
                            </button>
                            )}


                        {/* NO ACTION */}
                        {!["PENDING", "CONFIRMED", "ACTIVE","RETURNED"].includes(rental.status) && (
                            <span className="text-sm text-gray-400">—</span>
                        )}

                        </td>

                    </tr>
                  ))}
                </tbody>

              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  );
};

export default RentalManagement;