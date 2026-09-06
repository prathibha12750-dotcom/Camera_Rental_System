import {
  useEffect,
  useState,
} from "react";

import {
  Link,
  useLocation,
} from "react-router-dom";

import api from "../../services/api";
import ConfirmDialog from "../../components/ConfirmDialog";
import ReviewForm from "../../components/ReviewForm";

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


  const [
    bookingToCancel,
    setBookingToCancel,
  ] = useState(null);


  const [
    cancellingId,
    setCancellingId,
  ] = useState(null);


  const [
    reviews,
    setReviews,
  ] = useState([]);


  const [
    reviewBookingId,
    setReviewBookingId,
  ] = useState(null);


  // ==========================================
  // LOAD BOOKINGS + CUSTOMER REVIEWS
  // ==========================================

  useEffect(() => {

    let ignore = false;


    const loadData =
      async () => {

        try {

          const [
            bookingsResponse,
            reviewsResponse,
          ] =
            await Promise.all([
              api.get(
                "/customer/bookings"
              ),

              api.get(
                "/customer/reviews"
              ),
            ]);


          if (!ignore) {

            setBookings(
              Array.isArray(
                bookingsResponse
                  .data?.data
                  ?.bookings
              )
                ? bookingsResponse
                    .data.data.bookings
                : []
            );


            setReviews(
              Array.isArray(
                reviewsResponse
                  .data?.data
                  ?.reviews
              )
                ? reviewsResponse
                    .data.data.reviews
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


    loadData();


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


    const dateKey =
      getBookingDateString(
        value
      );


    return new Date(
      `${dateKey}T00:00:00`
    ).toLocaleDateString(
      undefined,
      {
        weekday: "short",
        year: "numeric",
        month: "short",
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


          return (
            a.startTime || ""
          ).localeCompare(
            b.startTime || ""
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


          return (
            b.startTime || ""
          ).localeCompare(
            a.startTime || ""
          );

        }
      );


  // ==========================================
  // STATUS HELPERS
  // ==========================================

  const getStatusClasses = (
    status
  ) => {

    switch (status) {

      case "CONFIRMED":

        return `
          border-green-200
          bg-green-50
          text-green-700
        `;


      case "REQUESTED":

        return `
          border-amber-200
          bg-amber-50
          text-amber-700
        `;


      case "REJECTED":

        return `
          border-red-200
          bg-red-50
          text-red-700
        `;


      case "CANCELLED":

        return `
          border-gray-200
          bg-gray-100
          text-gray-600
        `;


      case "COMPLETED":

        return `
          border-blue-200
          bg-blue-50
          text-blue-700
        `;


      default:

        return `
          border-gray-200
          bg-gray-50
          text-gray-600
        `;

    }

  };


  const getStatusDescription = (
    status
  ) => {

    switch (status) {

      case "REQUESTED":
        return "Waiting for photographer response.";

      case "CONFIRMED":
        return "Your booking has been confirmed.";

      case "REJECTED":
        return "The booking request was not accepted.";

      case "CANCELLED":
        return "This booking was cancelled.";

      case "COMPLETED":
        return "This photography booking is complete.";

      default:
        return "";

    }

  };


  // ==========================================
  // PACKAGE HELPER
  // ==========================================

  const getSelectedPackage = (
    booking
  ) => {

    if (
      !booking.packageRateId ||
      !Array.isArray(
        booking.photographer
          ?.packageRates
      )
    ) {
      return null;
    }


    return (
      booking.photographer
        .packageRates
        .find(
          (pkg) =>
            String(pkg._id) ===
            String(
              booking.packageRateId
            )
        ) ||
      null
    );

  };


  // ==========================================
  // CANCEL BOOKING
  // ==========================================

  const handleCancel =
    async () => {

      if (
        !bookingToCancel?._id
      ) {
        return;
      }


      const id =
        bookingToCancel._id;


      try {

        setCancellingId(
          id
        );

        setError("");
        setSuccess("");


        const response =
          await api.patch(
            `/customer/bookings/${id}/cancel`
          );


        const updated =
          response.data?.data
            ?.booking;


        if (!updated) {

          throw new Error(
            "Updated booking was not returned."
          );

        }


        setBookings(
          (previous) =>
            previous.map(
              (booking) =>
                booking._id === id
                  ? updated
                  : booking
            )
        );


        setSuccess(
          "Booking cancelled successfully."
        );


        setBookingToCancel(
          null
        );

      } catch (err) {

        console.error(
          "Failed to cancel booking:",
          err
        );


        setError(
          err.response?.data
            ?.message ||
            "Failed to cancel booking."
        );

      } finally {

        setCancellingId(
          null
        );

      }

    };


  // ==========================================
  // REVIEW HELPERS
  // ==========================================

  const getBookingReview = (
    bookingId
  ) => {

    return reviews.find(
      (review) =>
        String(review.booking) ===
        String(bookingId)
    );

  };


  const handleReviewSuccess = (
    review
  ) => {

    setReviews(
      (previous) => [
        review,
        ...previous,
      ]
    );


    setReviewBookingId(null);


    setSuccess(
      "Thank you. Your review was submitted successfully."
    );

  };


  // ==========================================
  // BOOKING CARD
  // ==========================================

  const renderBooking = (
    booking,
    allowCancel
  ) => {

    const photographerName =
      booking.photographer
        ?.user
        ?.name ||
      "Photographer";


    const selectedPackage =
      getSelectedPackage(
        booking
      );


    const canCancel =
      allowCancel &&
      [
        "REQUESTED",
        "CONFIRMED",
      ].includes(
        booking.status
      );


    const isCancelling =
      cancellingId ===
      booking._id;


    const existingReview =
      getBookingReview(
        booking._id
      );


    const canReview =
      booking.status ===
        "COMPLETED" &&
      !existingReview;


    const reviewOpen =
      reviewBookingId ===
      booking._id;


    return (

      <article
        key={booking._id}
        className="
          overflow-hidden
          rounded-2xl
          border
          border-gray-200
          bg-white
          shadow-sm
        "
      >

        <div className="
          p-5
          sm:p-6
        ">

          <div className="
            flex
            flex-col
            gap-5
            sm:flex-row
            sm:items-start
            sm:justify-between
          ">


            {/* LEFT */}

            <div className="
              min-w-0
              flex-1
            ">

              <div className="
                flex
                items-start
                gap-3
              ">

                <div className="
                  flex
                  h-11
                  w-11
                  shrink-0
                  items-center
                  justify-center
                  rounded-full
                  bg-orange-50
                  text-sm
                  font-bold
                  text-orange-700
                ">

                  {photographerName
                    .charAt(0)
                    .toUpperCase()}

                </div>


                <div className="
                  min-w-0
                ">

                  <h3 className="
                    truncate
                    text-base
                    font-semibold
                    text-gray-950
                    sm:text-lg
                  ">
                    {photographerName}
                  </h3>


                  {booking.photographer
                    ?.specialization && (

                    <p className="
                      mt-0.5
                      truncate
                      text-sm
                      text-gray-500
                    ">
                      {
                        booking.photographer
                          .specialization
                      }
                    </p>

                  )}

                </div>

              </div>


              {/* DATE / TIME */}

              <div className="
                mt-5
                grid
                gap-3
                sm:grid-cols-2
              ">

                <div className="
                  flex
                  items-start
                  gap-3
                  rounded-xl
                  bg-gray-50
                  px-4
                  py-3
                ">

                  <svg
                    className="
                      mt-0.5
                      h-5
                      w-5
                      shrink-0
                      text-gray-400
                    "
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    aria-hidden="true"
                  >
                    <path d="M7 3v3M17 3v3" />

                    <rect
                      x="3"
                      y="5"
                      width="18"
                      height="16"
                      rx="2"
                    />

                    <path d="M3 10h18" />
                  </svg>


                  <div>

                    <p className="
                      text-xs
                      font-medium
                      uppercase
                      tracking-wide
                      text-gray-400
                    ">
                      Date
                    </p>


                    <p className="
                      mt-1
                      text-sm
                      font-medium
                      text-gray-800
                    ">
                      {formatDate(
                        booking.date
                      )}
                    </p>

                  </div>

                </div>


                <div className="
                  flex
                  items-start
                  gap-3
                  rounded-xl
                  bg-gray-50
                  px-4
                  py-3
                ">

                  <svg
                    className="
                      mt-0.5
                      h-5
                      w-5
                      shrink-0
                      text-gray-400
                    "
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    aria-hidden="true"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="9"
                    />

                    <path d="M12 7v5l3 2" />
                  </svg>


                  <div>

                    <p className="
                      text-xs
                      font-medium
                      uppercase
                      tracking-wide
                      text-gray-400
                    ">
                      Time
                    </p>


                    <p className="
                      mt-1
                      text-sm
                      font-medium
                      text-gray-800
                    ">
                      {booking.startTime}
                      {" — "}
                      {booking.endTime}
                    </p>

                  </div>

                </div>

              </div>


              {/* PACKAGE */}

              {selectedPackage && (

                <div className="
                  mt-4
                  flex
                  flex-wrap
                  items-center
                  gap-x-3
                  gap-y-1
                  text-sm
                ">

                  <span className="
                    text-gray-500
                  ">
                    Package:
                  </span>


                  <span className="
                    font-semibold
                    text-gray-800
                  ">
                    {selectedPackage.name}
                  </span>


                  {selectedPackage.price !==
                    undefined &&
                    selectedPackage.price !==
                      null && (

                    <span className="
                      text-gray-500
                    ">
                      LKR{" "}
                      {Number(
                        selectedPackage.price
                      ).toLocaleString()}
                    </span>

                  )}

                </div>

              )}


              {/* NOTES */}

              {booking.notes && (

                <div className="
                  mt-4
                  border-l-2
                  border-orange-200
                  pl-4
                ">

                  <p className="
                    text-xs
                    font-medium
                    uppercase
                    tracking-wide
                    text-gray-400
                  ">
                    Notes
                  </p>


                  <p className="
                    mt-1
                    whitespace-pre-line
                    text-sm
                    leading-6
                    text-gray-600
                  ">
                    {booking.notes}
                  </p>

                </div>

              )}

            </div>


            {/* RIGHT */}

            <div className="
              flex
              shrink-0
              flex-row
              items-center
              justify-between
              gap-4
              border-t
              border-gray-100
              pt-4
              sm:flex-col
              sm:items-end
              sm:border-0
              sm:pt-0
            ">

              <div className="
                sm:text-right
              ">

                <span
                  className={`
                    inline-flex
                    rounded-full
                    border
                    px-3
                    py-1.5
                    text-xs
                    font-semibold
                    ${getStatusClasses(
                      booking.status
                    )}
                  `}
                >
                  {booking.status}
                </span>


                <p className="
                  mt-2
                  hidden
                  max-w-48
                  text-xs
                  leading-5
                  text-gray-400
                  sm:block
                ">
                  {getStatusDescription(
                    booking.status
                  )}
                </p>

              </div>


              {canCancel && (

                <button
                  type="button"
                  onClick={() =>
                    setBookingToCancel(
                      booking
                    )
                  }
                  disabled={
                    isCancelling
                  }
                  className="
                    text-sm
                    font-semibold
                    text-red-600
                    transition
                    hover:text-red-700
                    disabled:cursor-not-allowed
                    disabled:opacity-50
                    focus:outline-none
                    focus-visible:ring-2
                    focus-visible:ring-red-500
                    focus-visible:ring-offset-2
                  "
                >
                  {isCancelling
                    ? "Cancelling..."
                    : "Cancel Booking"}
                </button>

              )}

              {canReview && (
                <button
                  type="button"
                  onClick={() =>
                    setReviewBookingId(
                      reviewOpen
                        ? null
                        : booking._id
                    )
                  }
                  className="
                    text-sm
                    font-semibold
                    text-orange-600
                    transition
                    hover:text-orange-700
                    focus:outline-none
                    focus-visible:ring-2
                    focus-visible:ring-orange-500
                    focus-visible:ring-offset-2
                  "
                >
                  {reviewOpen
                    ? "Close Review"
                    : "Leave Review"}
                </button>
              )}

            </div>

          </div>

        </div>


        {/* STATUS DESCRIPTION MOBILE */}

        {getStatusDescription(
          booking.status
        ) && (

          <div className="
            border-t
            border-gray-100
            bg-gray-50/70
            px-5
            py-3
            text-xs
            text-gray-500
            sm:hidden
          ">
            {getStatusDescription(
              booking.status
            )}
          </div>

        )}


        {existingReview && (

          <div
            className="
              border-t
              border-gray-100
              bg-gray-50/70
              px-5
              py-4
              sm:px-6
            "
          >

            <div
              className="
                flex
                flex-col
                gap-2
                sm:flex-row
                sm:items-start
                sm:justify-between
              "
            >

              <div>

                <p
                  className="
                    text-xs
                    font-semibold
                    uppercase
                    tracking-wide
                    text-gray-400
                  "
                >
                  Your Review
                </p>


                <div
                  className="
                    mt-1
                    flex
                    items-center
                    gap-1
                  "
                >

                  {[1, 2, 3, 4, 5].map(
                    (value) => (

                      <span
                        key={value}
                        className={
                          value <=
                          existingReview.rating
                            ? "text-amber-400"
                            : "text-gray-300"
                        }
                      >
                        ★
                      </span>

                    )
                  )}

                  <span
                    className="
                      ml-1
                      text-xs
                      font-medium
                      text-gray-500
                    "
                  >
                    {
                      existingReview.rating
                    }/5
                  </span>

                </div>


                {existingReview.comment && (

                  <p
                    className="
                      mt-2
                      max-w-2xl
                      text-sm
                      leading-6
                      text-gray-600
                    "
                  >
                    {existingReview.comment}
                  </p>

                )}

              </div>


              <span
                className="
                  w-fit
                  rounded-full
                  border
                  border-green-200
                  bg-green-50
                  px-3
                  py-1
                  text-xs
                  font-semibold
                  text-green-700
                "
              >
                Reviewed
              </span>

            </div>

          </div>

        )}

        {canReview &&
          reviewOpen && (

            <div
              className="
                border-t
                border-gray-100
                px-5
                pb-5
                sm:px-6
                sm:pb-6
              "
            >

              <ReviewForm
                booking={booking}
                photographerName={
                  photographerName
                }
                onSuccess={
                  handleReviewSuccess
                }
                onCancel={() =>
                  setReviewBookingId(
                    null
                  )
                }
              />

            </div>

          )}

      </article>

    );

  };


  // ==========================================
  // BOOKING SKELETON
  // ==========================================

  const renderBookingSkeleton = (
    key
  ) => (

    <div
      key={key}
      className="
        animate-pulse
        rounded-2xl
        border
        border-gray-200
        bg-white
        p-5
        shadow-sm
        sm:p-6
      "
      aria-hidden="true"
    >

      <div className="
        flex
        items-start
        gap-3
      ">

        <div className="
          h-11
          w-11
          shrink-0
          rounded-full
          bg-gray-200
        " />


        <div className="
          flex-1
        ">

          <div className="
            h-4
            w-40
            rounded
            bg-gray-200
          " />


          <div className="
            mt-2
            h-3
            w-28
            rounded
            bg-gray-100
          " />


          <div className="
            mt-5
            grid
            gap-3
            sm:grid-cols-2
          ">

            <div className="
              h-16
              rounded-xl
              bg-gray-100
            " />


            <div className="
              h-16
              rounded-xl
              bg-gray-100
            " />

          </div>

        </div>

      </div>

    </div>

  );


  // ==========================================
  // PAGE
  // ==========================================


  return (
    <main className="
      min-h-[calc(100vh-4rem)]
      bg-gray-50
      px-4
      py-6
      sm:px-6
      lg:px-8
      lg:py-8
    ">

      <div className="
        mx-auto
        max-w-6xl
      ">


        {/* ==================================
            PAGE HEADER
        ================================== */}

        <div className="
          flex
          flex-col
          gap-5
          sm:flex-row
          sm:items-end
          sm:justify-between
        ">

          <div>


            <p className="
              mt-5
              text-sm
              font-semibold
              text-orange-600
            ">
              Photography Bookings
            </p>


            <h1 className="
              mt-1
              text-2xl
              font-bold
              tracking-tight
              text-gray-950
              sm:text-3xl
            ">
              My Bookings
            </h1>


            <p className="
              mt-2
              max-w-2xl
              text-sm
              leading-6
              text-gray-500
            ">
              Review upcoming photography
              sessions and your previous
              booking history.
            </p>

          </div>


          <Link
            to="/photographers"
            className="
              inline-flex
              items-center
              justify-center
              rounded-xl
              bg-orange-600
              px-5
              py-3
              text-sm
              font-semibold
              text-white
              shadow-sm
              transition
              hover:bg-orange-700
              focus:outline-none
              focus-visible:ring-2
              focus-visible:ring-orange-500
              focus-visible:ring-offset-2
            "
          >
            Find a Photographer
          </Link>

        </div>


        {/* ==================================
            MESSAGES
        ================================== */}

        {error && (

          <div
            role="alert"
            className="
            mt-6
            flex
            items-start
            justify-between
            gap-4
            rounded-xl
            border
            border-red-200
            bg-red-50
            px-4
            py-3
            text-sm
            text-red-700
          ">

            <span>
              {error}
            </span>


            <button
              type="button"
              onClick={() =>
                setError("")
              }
              aria-label="Dismiss error"
              className="
                shrink-0
                font-semibold
                text-red-500
                hover:text-red-700
              "
            >
              ×
            </button>

          </div>

        )}


        {success && (

          <div
            role="status"
            className="
            mt-6
            flex
            items-start
            justify-between
            gap-4
            rounded-xl
            border
            border-green-200
            bg-green-50
            px-4
            py-3
            text-sm
            text-green-700
          ">

            <span>
              {success}
            </span>


            <button
              type="button"
              onClick={() =>
                setSuccess("")
              }
              aria-label="Dismiss success message"
              className="
                shrink-0
                font-semibold
                text-green-600
                hover:text-green-800
              "
            >
              ×
            </button>

          </div>

        )}


        {loading ? (

          <div
            className="
              mt-7
              space-y-8
            "
            aria-label="Loading bookings"
          >

            <div className="
              flex
              flex-wrap
              gap-3
            ">

              {[1, 2, 3].map(
                (item) => (

                  <div
                    key={item}
                    className="
                      h-9
                      w-28
                      animate-pulse
                      rounded-full
                      border
                      border-gray-200
                      bg-gray-200
                    "
                    aria-hidden="true"
                  />

                )
              )}

            </div>


            <section>

              <div className="
                mb-5
              ">

                <div className="
                  h-6
                  w-48
                  animate-pulse
                  rounded
                  bg-gray-200
                " />


                <div className="
                  mt-2
                  h-3
                  w-36
                  animate-pulse
                  rounded
                  bg-gray-100
                " />

              </div>


              <div className="
                space-y-4
              ">

                {[1, 2].map(
                  (item) =>
                    renderBookingSkeleton(
                      `upcoming-${item}`
                    )
                )}

              </div>

            </section>


            <section className="
              border-t
              border-gray-200
              pt-8
            ">

              <div className="
                mb-5
              ">

                <div className="
                  h-6
                  w-40
                  animate-pulse
                  rounded
                  bg-gray-200
                " />


                <div className="
                  mt-2
                  h-3
                  w-56
                  max-w-full
                  animate-pulse
                  rounded
                  bg-gray-100
                " />

              </div>


              {renderBookingSkeleton(
                "history"
              )}

            </section>

          </div>

        ) : (

          <>

        {/* ==================================
            QUICK OVERVIEW
        ================================== */}

        <div className="
          mt-7
          flex
          flex-wrap
          gap-3
        ">

          <div className="
            rounded-full
            border
            border-gray-200
            bg-white
            px-4
            py-2
            text-sm
            text-gray-600
            shadow-sm
          ">

            <span className="
              font-semibold
              text-gray-950
            ">
              {upcomingBookings.length}
            </span>

            {" "}Upcoming

          </div>


          <div className="
            rounded-full
            border
            border-gray-200
            bg-white
            px-4
            py-2
            text-sm
            text-gray-600
            shadow-sm
          ">

            <span className="
              font-semibold
              text-gray-950
            ">
              {bookingHistory.length}
            </span>

            {" "}History

          </div>


          <div className="
            rounded-full
            border
            border-gray-200
            bg-white
            px-4
            py-2
            text-sm
            text-gray-600
            shadow-sm
          ">

            <span className="
              font-semibold
              text-gray-950
            ">
              {bookings.length}
            </span>

            {" "}Total

          </div>

        </div>


        {/* ==================================
            UPCOMING BOOKINGS
        ================================== */}

        <section className="
          mt-9
        ">

          <div className="
            mb-5
            flex
            items-end
            justify-between
            gap-4
          ">

            <div>

              <h2 className="
                text-xl
                font-semibold
                text-gray-950
              ">
                Upcoming Bookings
              </h2>


              <p className="
                mt-1
                text-sm
                text-gray-500
              ">

                {upcomingBookings.length}{" "}

                {upcomingBookings.length ===
                1
                  ? "active upcoming booking"
                  : "active upcoming bookings"}

              </p>

            </div>

          </div>


          {upcomingBookings.length ===
          0 ? (

            <div className="
              rounded-2xl
              border
              border-dashed
              border-gray-300
              bg-white
              px-6
              py-10
              text-center
            ">

              <div className="
                mx-auto
                flex
                h-12
                w-12
                items-center
                justify-center
                rounded-xl
                bg-orange-50
                text-orange-600
              ">

                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  aria-hidden="true"
                >
                  <path d="M7 3v3M17 3v3" />

                  <rect
                    x="3"
                    y="5"
                    width="18"
                    height="16"
                    rx="2"
                  />

                  <path d="M3 10h18" />

                  <path d="m9 15 2 2 4-4" />
                </svg>

              </div>


              <h3 className="
                mt-4
                font-semibold
                text-gray-950
              ">
                No upcoming bookings
              </h3>


              <p className="
                mx-auto
                mt-2
                max-w-md
                text-sm
                leading-6
                text-gray-500
              ">
                Your requested and confirmed
                future photography bookings
                will appear here.
              </p>


              <Link
                to="/photographers"
                className="
                  mt-5
                  inline-flex
                  text-sm
                  font-semibold
                  text-orange-600
                  hover:text-orange-700
                "
              >
                Find a Photographer
              </Link>

            </div>

          ) : (

            <div className="
              space-y-4
            ">

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

        <section className="
          mt-12
          border-t
          border-gray-200
          pt-9
        ">

          <div className="
            mb-5
          ">

            <h2 className="
              text-xl
              font-semibold
              text-gray-950
            ">
              Booking History
            </h2>


            <p className="
              mt-1
              text-sm
              text-gray-500
            ">
              Previous, completed,
              cancelled and rejected
              photography bookings.
            </p>

          </div>


          {bookingHistory.length ===
          0 ? (

            <div className="
              rounded-2xl
              border
              border-dashed
              border-gray-300
              bg-white
              px-6
              py-9
              text-center
            ">

              <div className="
                mx-auto
                flex
                h-11
                w-11
                items-center
                justify-center
                rounded-xl
                bg-gray-100
                text-gray-500
              ">

                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  aria-hidden="true"
                >
                  <path d="M12 8v4l3 2" />

                  <circle
                    cx="12"
                    cy="12"
                    r="9"
                  />
                </svg>

              </div>


              <h3 className="
                mt-4
                font-semibold
                text-gray-950
              ">
                No booking history yet
              </h3>


              <p className="
                mt-2
                text-sm
                text-gray-500
              ">
                Your previous bookings
                will appear here over time.
              </p>

            </div>

          ) : (

            <div className="
              space-y-4
            ">

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

          </>

        )}

      </div>


      <ConfirmDialog
        open={
          Boolean(
            bookingToCancel
          )
        }
        title="Cancel booking?"
        message="This booking will be cancelled and the action cannot be undone."
        confirmLabel="Cancel Booking"
        cancelLabel="Keep Booking"
        loading={
          cancellingId ===
          bookingToCancel?._id
        }
        onCancel={() => {

          if (!cancellingId) {

            setBookingToCancel(
              null
            );

          }

        }}
        onConfirm={
          handleCancel
        }
      />

    </main>
  );

};


export default CustomerBookings;