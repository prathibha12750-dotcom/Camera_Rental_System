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
    location.state?.bookingCreated
      ? "Booking request submitted successfully."
      : ""
  );


  // ==========================================
  // LOAD BOOKINGS
  // ==========================================

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


  // ==========================================
  // DATE HELPERS
  // ==========================================

  const getTodayString = () => {

    const today =
      new Date();


    const year =
      today.getFullYear();

    const month =
      String(
        today.getMonth() + 1
      ).padStart(
        2,
        "0"
      );

    const day =
      String(
        today.getDate()
      ).padStart(
        2,
        "0"
      );


    return `${year}-${month}-${day}`;
  };


  const getBookingDateString = (
    value
  ) => {

    if (!value) {
      return "";
    }


    return String(
      value
    ).split("T")[0];
  };


  const formatDate = (
    value
  ) => {

    if (!value) {
      return "";
    }


    return new Date(
      value
    ).toLocaleDateString(
      undefined,
      {
        year: "numeric",
        month: "long",
        day: "numeric",
      }
    );
  };


  // ==========================================
  // UPCOMING / HISTORY
  // ==========================================

  const today =
    getTodayString();


  const upcomingBookings =
    bookings
      .filter(
        (booking) => {

          const bookingDate =
            getBookingDateString(
              booking.date
            );


          const activeStatus =
            [
              "REQUESTED",
              "CONFIRMED",
            ].includes(
              booking.status
            );


          return (
            bookingDate >= today &&
            activeStatus
          );
        }
      )
      .sort(
        (a, b) => {

          const dateDifference =
            getBookingDateString(
              a.date
            ).localeCompare(
              getBookingDateString(
                b.date
              )
            );


          if (
            dateDifference !== 0
          ) {
            return dateDifference;
          }


          return a.startTime.localeCompare(
            b.startTime
          );
        }
      );


  const bookingHistory =
    bookings
      .filter(
        (booking) => {

          const bookingDate =
            getBookingDateString(
              booking.date
            );


          const activeStatus =
            [
              "REQUESTED",
              "CONFIRMED",
            ].includes(
              booking.status
            );


          return !(
            bookingDate >= today &&
            activeStatus
          );
        }
      )
      .sort(
        (a, b) => {

          const dateDifference =
            getBookingDateString(
              b.date
            ).localeCompare(
              getBookingDateString(
                a.date
              )
            );


          if (
            dateDifference !== 0
          ) {
            return dateDifference;
          }


          return b.startTime.localeCompare(
            a.startTime
          );
        }
      );


  // ==========================================
  // CANCEL BOOKING
  // ==========================================

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


  // ==========================================
  // BOOKING CARD
  // ==========================================

  const renderBooking = (
    booking,
    allowCancel
  ) => (

    <article
      key={booking._id}
      className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
    >

      <div className="flex flex-col justify-between gap-5 sm:flex-row">

        <div>

          <h3 className="text-lg font-semibold text-gray-950">
            {
              booking.photographer
                ?.user
                ?.name ||
              "Photographer"
            }
          </h3>


          <p className="mt-2 text-sm text-gray-500">
            {formatDate(
              booking.date
            )}
            {" • "}
            {booking.startTime}
            {" — "}
            {booking.endTime}
          </p>


          {booking.notes && (

            <p className="mt-3 text-sm leading-6 text-gray-600">
              {booking.notes}
            </p>

          )}

        </div>


        <div className="flex flex-col items-start gap-3 sm:items-end">

          <span className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700">
            {booking.status}
          </span>


          {allowCancel &&
            [
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
  );


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


        <p className="mt-2 text-sm text-gray-500">
          View your upcoming photographer
          bookings and previous booking history.
        </p>


        {error && (

          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>

        )}


        {success && (

          <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
            {success}
          </div>

        )}


        {/* ==================================
            UPCOMING BOOKINGS
        ================================== */}

        <section className="mt-8">

          <div className="mb-5">

            <h2 className="text-xl font-semibold text-gray-950">
              Upcoming Bookings
            </h2>


            <p className="mt-1 text-sm text-gray-500">
              {upcomingBookings.length}{" "}
              {upcomingBookings.length ===
              1
                ? "upcoming booking"
                : "upcoming bookings"}
            </p>

          </div>


          {upcomingBookings.length ===
          0 ? (

            <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center">

              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 font-bold text-orange-600">
                U
              </div>


              <h3 className="mt-4 font-semibold text-gray-950">
                No upcoming bookings
              </h3>


              <p className="mt-2 text-sm text-gray-500">
                Your future requested and
                confirmed bookings will appear
                here.
              </p>

            </div>

          ) : (

            <div className="space-y-4">

              {upcomingBookings.map(
                (booking) =>
                  renderBooking(
                    booking,
                    true
                  )
              )}

            </div>

          )}

        </section>


        {/* ==================================
            BOOKING HISTORY
        ================================== */}

        <section className="mt-12">

          <div className="mb-5">

            <h2 className="text-xl font-semibold text-gray-950">
              Booking History
            </h2>


            <p className="mt-1 text-sm text-gray-500">
              Completed, cancelled, rejected
              and previous bookings.
            </p>

          </div>


          {bookingHistory.length ===
          0 ? (

            <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center text-sm text-gray-500">
              No booking history yet.
            </div>

          ) : (

            <div className="space-y-4">

              {bookingHistory.map(
                (booking) =>
                  renderBooking(
                    booking,
                    false
                  )
              )}

            </div>

          )}

        </section>

      </div>

    </main>
  );
};


export default CustomerBookings;