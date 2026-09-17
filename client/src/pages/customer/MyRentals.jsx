import { useEffect, useState } from "react";
import api from "../../services/api";
import { cancelRental } from "../../services/rentalService";

const MyRentals = () => {
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [cancellingId, setCancellingId] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  const loadRentals = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/rentals/my-rentals");

      setRentals(response.data?.data?.rentals || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to load your rentals"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRental = async (rentalId) => {
    const confirmed = window.confirm(
        "Are you sure you want to cancel this rental request?"
    );

    if (!confirmed) return;

        try {
            setCancellingId(rentalId);
            setError("");
            setSuccessMessage("");

        await cancelRental(rentalId);

        setSuccessMessage(
            "Rental request cancelled successfully."
        );

        await loadRentals();
    } catch (err) {
        setError(
            err.response?.data?.message ||
            "Failed to cancel rental request"
        );
    } finally {
        setCancellingId(null);
    }
  };

  useEffect(() => {
    loadRentals();
  }, []);

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-7xl">
        <p className="text-sm font-semibold uppercase tracking-wider text-orange-600">
          Customer Rentals
        </p>

        <h1 className="mt-2 text-3xl font-bold text-gray-950">
          My Rentals
        </h1>

        <p className="mt-2 text-gray-600">
          View and manage your equipment rental requests.
        </p>

        {loading && (
          <p className="mt-8 text-gray-600">
            Loading rentals...
          </p>
        )}

        {error && (
          <div className="mt-8 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {successMessage && (
            <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-4 text-green-700">
                {successMessage}
            </div>
        )}

        {!loading && !error && rentals.length === 0 && (
          <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-8 text-center">
            <p className="text-gray-600">
              You do not have any rental requests yet.
            </p>
          </div>
        )}

        <div className="mt-8 space-y-4">
          {rentals.map((rental) => (
            <div
              key={rental._id}
              className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
            >
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                <div>
                  <h2 className="text-xl font-semibold text-gray-950">
                    {rental.equipment?.name || "Equipment"}
                  </h2>

                  <p className="mt-1 text-sm text-gray-600">
                    {rental.equipment?.brand}{" "}
                    {rental.equipment?.model}
                  </p>
                </div>

                <span className="w-fit rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                  {rental.status}
                </span>
              </div>

              <div className="mt-5 grid gap-4 border-t border-gray-100 pt-5 sm:grid-cols-3">
                <div>
                  <p className="text-sm text-gray-500">
                    Start Date
                  </p>
                  <p className="font-medium text-gray-900">
                    {new Date(
                      rental.startDate
                    ).toLocaleDateString()}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">
                    End Date
                  </p>
                  <p className="font-medium text-gray-900">
                    {new Date(
                      rental.endDate
                    ).toLocaleDateString()}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">
                    Total Price
                  </p>
                  <p className="font-semibold text-orange-600">
                    LKR{" "}
                    {rental.totalPrice?.toLocaleString()}
                  </p>
                </div>

                {rental.status === "PENDING" && (
                    <div className="mt-5 border-t border-gray-100 pt-5">
                        <button
                            type="button"
                            onClick={() => handleCancelRental(rental._id)}
                            disabled={cancellingId === rental._id}
                            className="rounded-xl border border-red-300 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {cancellingId === rental._id
                            ? "Cancelling..."
                            : "Cancel Request"}
                        </button>
                    </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
};

export default MyRentals;