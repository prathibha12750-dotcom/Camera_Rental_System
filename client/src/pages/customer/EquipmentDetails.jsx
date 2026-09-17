import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getEquipmentById } from "../../services/equipmentService";
import {
  checkAvailability,
  createRentalRequest,
} from "../../services/rentalService";

const EquipmentDetails = () => {
  const { id } = useParams();

  const [equipment, setEquipment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

    // add the date selection section ==============================
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [availability, setAvailability] = useState(null);
    const [checking, setChecking] = useState(false);
    const [availabilityError, setAvailabilityError] = useState("");
    // =============================================================

    // adding rental request section ===============================
    const [requesting, setRequesting] = useState(false);
    const [requestMessage, setRequestMessage] = useState("");
    const [requestError, setRequestError] = useState("");
    // ==============================================================

  useEffect(() => {
    const loadEquipment = async () => {
      try {
        setLoading(true);
        setError("");

        const result = await getEquipmentById(id);

        setEquipment(result?.data?.equipment || null);
      } catch (err) {
        setError(
          err.response?.data?.message ||
            "Failed to load equipment details"
        );
      } finally {
        setLoading(false);
      }
    };

    loadEquipment();
  }, [id]);


  const handleCheckAvailability = async () => {
  if (!startDate || !endDate) {
    setAvailabilityError("Please select both start and end dates.");
    return;
  }

  try {
    setChecking(true);
    setAvailabilityError("");
    setAvailability(null);

    const result = await checkAvailability({
      equipmentId: id,
      startDate,
      endDate,
    });

    setAvailability(result);
  } catch (err) {
    setAvailabilityError(
      err.response?.data?.message ||
        "Failed to check availability"
    );
  } finally {
    setChecking(false);
  }
    };


    const handleRentalRequest = async () => {
        try {
            setRequesting(true);
            setRequestMessage("");
            setRequestError("");

            const result = await createRentalRequest({
                equipmentId: id,
                startDate,
                endDate,
            });

            setRequestMessage(
                result.message || "Rental request submitted successfully."
            );
        } catch (err) {
            setRequestError(
                err.response?.data?.message ||
                "Failed to submit rental request"
            );
        } finally {
            setRequesting(false);
        }
    };

  if (loading) {
    return (
      <main className="min-h-[calc(100vh-4rem)] bg-gray-50 px-6 py-10">
        <div className="mx-auto max-w-5xl">
          <p className="text-gray-600">
            Loading equipment details...
          </p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-[calc(100vh-4rem)] bg-gray-50 px-6 py-10">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        </div>
      </main>
    );
  }

  if (!equipment) {
    return (
      <main className="min-h-[calc(100vh-4rem)] bg-gray-50 px-6 py-10">
        <div className="mx-auto max-w-5xl">
          <p className="text-gray-600">
            Equipment not found.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-5xl">

        <p className="text-sm font-semibold uppercase tracking-wider text-orange-600">
          Equipment Rental
        </p>

        <h1 className="mt-2 text-3xl font-bold text-gray-950">
          {equipment.name}
        </h1>

        <p className="mt-2 text-gray-600">
          {equipment.brand} {equipment.model}
        </p>

        <div className="mt-8 grid gap-6 md:grid-cols-2">

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-950">
              Equipment Information
            </h2>

            <div className="mt-5 space-y-3 text-sm">
              <p>
                <strong>Category:</strong>{" "}
                {equipment.category?.name || "N/A"}
              </p>

              <p>
                <strong>Brand:</strong> {equipment.brand}
              </p>

              <p>
                <strong>Model:</strong> {equipment.model}
              </p>

              <p>
                <strong>Condition:</strong>{" "}
                {equipment.condition}
              </p>

              <p>
                <strong>Status:</strong>{" "}
                {equipment.status}
              </p>

              <p>
                <strong>Security Deposit:</strong> LKR{" "}
                {equipment.securityDeposit?.toLocaleString()}
              </p>
            </div>
          </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-950">
              Rental Information
            </h2>

            <p className="mt-5 text-sm text-gray-500">
              Rental price
            </p>

            <p className="text-3xl font-bold text-orange-600">
              LKR{" "}
              {equipment.rentalPricePerDay?.toLocaleString()}
              <span className="text-base font-normal text-gray-500">
                {" "}
                / day
              </span>
            </p>

            <p className="mt-6 text-sm leading-6 text-gray-600">
              {equipment.description ||
                "No description available."}
            </p>

            <div className="mt-6 border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-950">
                    Check Availability
                </h3>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                            Start Date
                        </label>

                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => {
                                    setStartDate(e.target.value);
                                    setAvailability(null);
                                    setRequestMessage("");
                                    setRequestError("");
                                }}
                                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-orange-500"
                            />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                            End Date
                        </label>

                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => {
                                    setEndDate(e.target.value);
                                    setAvailability(null);
                                    setRequestMessage("");
                                    setRequestError("");
                                }}
                                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-orange-500"
                            />
                    </div>
                </div>

                <button
                    type="button"
                    onClick={handleCheckAvailability}
                    disabled={checking}
                    className="mt-4 w-full rounded-xl bg-gray-950 px-4 py-3 font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {checking ? "Checking..." : "Check Availability"}
                </button>

                    {availabilityError && (
                        <p className="mt-4 text-sm font-medium text-red-600">
                            {availabilityError}
                        </p>
                    )}

                    {/* Availability Result */}
                    {availability && (
                        <div
                            className={`mt-4 rounded-xl p-4 ${
                                availability.available
                                ? "bg-green-50 text-green-700"
                                : "bg-red-50 text-red-700"
                            }`}
                        >
                            {availability.available
                                ? "Equipment is available for these dates."
                                : availability.message ||
                                "Equipment is not available for these dates."}
                        </div>
                    )}

                    {/* Request Rental Button */}
                    {availability?.available && (
                        <button
                            type="button"
                            onClick={handleRentalRequest}
                            disabled={requesting}
                            className="mt-4 w-full rounded-xl bg-orange-600 px-4 py-3 font-semibold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {requesting
                            ? "Submitting Request..."
                            : "Request Rental"}
                        </button>
                        
                    )}

                    {/* Rental Request Success Message */}
                    {requestMessage && (
                        <div className="mt-4 rounded-xl bg-green-50 p-4 text-sm font-medium text-green-700">
                            {requestMessage}
                        </div>
                    )}

                    {/* Rental Request Error Message */}
                    {requestError && (
                        <div className="mt-4 rounded-xl bg-red-50 p-4 text-sm font-medium text-red-700">
                            {requestError}
                        </div>
                    )}

            </div>
        </div>

        </div>
      </div>
    </main>
  );

    
};

export default EquipmentDetails;