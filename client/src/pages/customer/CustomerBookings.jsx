import {
  useEffect,
  useState,
} from "react";

import {
  Link,
  useLocation,
} from "react-router-dom";

import api from "../../services/api";
import Loading from "../../components/Loading";


const CustomerBookings = () => {

  const location =
    useLocation();


  const [
    bookings,
    setBookings,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const [
    success,
    setSuccess,
  ] = useState(
    location.state
      ?.bookingCreated
      ? "Booking request submitted successfully."
      : ""
  );


  useEffect(() => {

    let ignore = false;


    const loadBookings =
      async () => {

        try {

          const response =
            await api.get(
              "/customer/bookings"
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
            "Failed to load bookings:",
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


  const handleCancel =
    async (id) => {

      if (
        !window.confirm(
          "Are you sure you want to cancel this booking?"
        )
      ) {
        return;
      }


      try {

        setError("");
        setSuccess("");


        const response =
          await api.patch(
            `/customer/bookings/${id}/cancel`
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
          "Booking cancelled successfully."
        );

      } catch (err) {

        setError(
          err.response?.data
            ?.message ||
            "Failed to cancel booking."
        );
      }
    };


  if (loading) {
    return <Loading />;
  }


  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6">

      <div className="mx-auto max-w-6xl">

        <Link
          to="/customer"
          className="text-sm font-medium text-gray-500 hover:text-gray-950"
        >
          ← Back to Dashboard
        </Link>


        <h1 className="mt-4 text-3xl font-bold text-gray-950">
          My Photographer Bookings
        </h1>


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


        <div className="mt-8 space-y-4">

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

                  <div className="flex flex-col justify-between gap-5 sm:flex-row">

                    <div>

                      <h2 className="text-lg font-semibold text-gray-950">
                        {
                          booking
                            .photographer
                            ?.user
                            ?.name
                        }
                      </h2>


                      <p className="mt-2 text-sm text-gray-500">
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

                        <p className="mt-3 text-sm leading-6 text-gray-600">
                          {
                            booking.notes
                          }
                        </p>

                      )}

                    </div>


                    <div className="flex flex-col items-start gap-3 sm:items-end">

                      <span className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700">
                        {
                          booking.status
                        }
                      </span>


                      {[
                        "REQUESTED",
                        "CONFIRMED",
                      ].includes(
                        booking.status
                      ) && (

                        <button
                          type="button"
                          onClick={() =>
                            handleCancel(
                              booking._id
                            )
                          }
                          className="text-sm font-semibold text-red-600 hover:text-red-700"
                        >
                          Cancel Booking
                        </button>

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


export default CustomerBookings;