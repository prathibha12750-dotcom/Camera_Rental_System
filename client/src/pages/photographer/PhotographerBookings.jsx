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
  // UPDATE BOOKING STATUS
  // ==========================================

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


  // ==========================================
  // BOOKING CARD
  // ==========================================

  const renderBooking = (
    booking,
    allowActions
  ) => (

    <article
      key={booking._id}
      className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
    >

      <div className="flex flex-col justify-between gap-6 md:flex-row">

        <div>

          <h3 className="text-lg font-semibold text-gray-950">
            {
              booking.customer
                ?.name ||
              "Customer"
            }
          </h3>


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
            {booking.startTime}
            {" — "}
            {booking.endTime}
          </p>


          {booking.notes && (

            <p className="mt-3 max-w-xl text-sm leading-6 text-gray-600">
              {booking.notes}
            </p>

          )}

        </div>


        <div className="flex min-w-48 flex-col items-start gap-3 md:items-end">

          <span className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700">
            {booking.status}
          </span>


          {allowActions &&
            booking.status ===
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
                  className="rounded-xl bg-gray-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:opacity-50"
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
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                >
                  Reject
                </button>

              </div>

            )}


          {allowActions &&
            booking.status ===
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
                  className="rounded-xl bg-gray-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:opacity-50"
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
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                >
                  Cancel
                </button>

              </div>

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
          to="/photographer"
          className="text-sm font-medium text-gray-500 hover:text-gray-950"
        >
          ← Back to Dashboard
        </Link>


        <h1 className="mt-4 text-3xl font-bold text-gray-950">
          Photographer Bookings
        </h1>


        <p className="mt-2 text-sm text-gray-500">
          Review upcoming booking requests,
          confirmed services and previous
          booking history.
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
              Requested and confirmed future
              photography services.
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
                Incoming requests and confirmed
                future bookings will appear
                here.
              </p>

            </div>

          ) : (

            <div className="space-y-5">

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
              and previous booking records.
            </p>

          </div>


          {bookingHistory.length ===
          0 ? (

            <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center text-sm text-gray-500">
              No booking history yet.
            </div>

          ) : (

            <div className="space-y-5">

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


export default PhotographerBookings;