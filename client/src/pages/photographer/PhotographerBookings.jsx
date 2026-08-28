import {
  useEffect,
  useState,
} from "react";

import {
  Link,
} from "react-router-dom";

import api from "../../services/api";
import Loading from "../../components/Loading";


const PhotographerBookings = () => {

  const [
    bookings,
    setBookings,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    updatingId,
    setUpdatingId,
  ] = useState(null);

  const [
    error,
    setError,
  ] = useState("");

  const [
    success,
    setSuccess,
  ] = useState("");


  useEffect(() => {

    let ignore = false;


    const loadBookings =
      async () => {

        try {

          const response =
            await api.get(
              "/photographer/bookings"
            );


          if (!ignore) {

            setBookings(
              Array.isArray(
                response.data?.data
                  ?.bookings
              )
                ? response.data.data
                    .bookings
                : []
            );

          }

        } catch (err) {

          console.error(
            "Failed to load photographer bookings:",
            err
          );


          if (!ignore) {

            setError(
              err.response?.data
                ?.message ||
                "Failed to load bookings."
            );

          }

        } finally {

          if (!ignore) {
            setLoading(false);
          }

        }
      };


    loadBookings();


    return () => {
      ignore = true;
    };

  }, []);


  const formatDate = (
    value
  ) => {

    return new Date(
      value
    ).toLocaleDateString();
  };


  const updateStatus =
    async (
      id,
      status
    ) => {

      try {

        setUpdatingId(id);
        setError("");
        setSuccess("");


        const response =
          await api.patch(
            `/photographer/bookings/${id}/status`,
            {
              status,
            }
          );


        const updated =
          response.data.data.booking;


        setBookings(
          (previous) =>
            previous.map(
              (booking) =>
                booking._id === id
                  ? {
                      ...booking,
                      status:
                        updated.status,
                    }
                  : booking
            )
        );


        setSuccess(
          `Booking changed to ${status}.`
        );

      } catch (err) {

        setError(
          err.response?.data
            ?.message ||
            "Failed to update booking."
        );

      } finally {
        setUpdatingId(null);
      }
    };


  if (loading) {
    return <Loading />;
  }


  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6">

      <div className="mx-auto max-w-6xl">

        <Link
          to="/photographer"
          className="text-sm font-medium text-gray-500 hover:text-gray-950"
        >
          ← Back to Dashboard
        </Link>


        <h1 className="mt-4 text-3xl font-bold text-gray-950">
          Photographer Bookings
        </h1>


        <p className="mt-2 text-sm text-gray-500">
          Review and manage customer photography
          booking requests.
        </p>


        {error && (
          <div className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}


        {success && (
          <div className="mt-6 rounded-xl bg-green-50 p-4 text-sm text-green-700">
            {success}
          </div>
        )}


        <div className="mt-8 space-y-5">

          {bookings.length ===
          0 ? (

            <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center text-sm text-gray-500">
              No photographer bookings yet.
            </div>

          ) : (

            bookings.map(
              (booking) => (

                <article
                  key={
                    booking._id
                  }
                  className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
                >

                  <div className="flex flex-col justify-between gap-6 md:flex-row">

                    <div>

                      <h2 className="text-lg font-semibold text-gray-950">
                        {
                          booking.customer
                            ?.name
                        }
                      </h2>


                      <p className="mt-1 text-sm text-gray-500">
                        {
                          booking.customer
                            ?.email
                        }
                      </p>


                      <p className="mt-4 text-sm font-medium text-gray-700">
                        {formatDate(
                          booking.date
                        )}
                        {" • "}
                        {
                          booking.startTime
                        }
                        {" — "}
                        {
                          booking.endTime
                        }
                      </p>


                      {booking.notes && (

                        <p className="mt-3 max-w-xl text-sm leading-6 text-gray-600">
                          {
                            booking.notes
                          }
                        </p>

                      )}

                    </div>


                    <div className="flex min-w-48 flex-col items-start gap-3 md:items-end">

                      <span className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700">
                        {
                          booking.status
                        }
                      </span>


                      {booking.status ===
                        "REQUESTED" && (

                        <div className="flex flex-wrap gap-2">

                          <button
                            type="button"
                            disabled={
                              updatingId ===
                              booking._id
                            }
                            onClick={() =>
                              updateStatus(
                                booking._id,
                                "CONFIRMED"
                              )
                            }
                            className="rounded-xl bg-gray-950 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                          >
                            Confirm
                          </button>


                          <button
                            type="button"
                            disabled={
                              updatingId ===
                              booking._id
                            }
                            onClick={() =>
                              updateStatus(
                                booking._id,
                                "REJECTED"
                              )
                            }
                            className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 disabled:opacity-50"
                          >
                            Reject
                          </button>

                        </div>

                      )}


                      {booking.status ===
                        "CONFIRMED" && (

                        <div className="flex flex-wrap gap-2">

                          <button
                            type="button"
                            disabled={
                              updatingId ===
                              booking._id
                            }
                            onClick={() =>
                              updateStatus(
                                booking._id,
                                "COMPLETED"
                              )
                            }
                            className="rounded-xl bg-gray-950 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                          >
                            Mark Completed
                          </button>


                          <button
                            type="button"
                            disabled={
                              updatingId ===
                              booking._id
                            }
                            onClick={() =>
                              updateStatus(
                                booking._id,
                                "CANCELLED"
                              )
                            }
                            className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 disabled:opacity-50"
                          >
                            Cancel
                          </button>

                        </div>

                      )}

                    </div>

                  </div>

                </article>

              )
            )

          )}

        </div>

      </div>

    </main>
  );
};


export default PhotographerBookings;