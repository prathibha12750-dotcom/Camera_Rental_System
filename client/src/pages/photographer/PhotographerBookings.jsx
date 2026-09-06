import {
  useEffect,
  useState,
} from "react";

import api from "../../services/api";


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
    updatingStatus,
    setUpdatingStatus,
  ] = useState("");

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
  // BOOKING GROUPS
  // ==========================================

  const today =
    getTodayString();


  const sortUpcoming = (
    items
  ) =>
    [...items].sort(
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


  const sortHistory = (
    items
  ) =>
    [...items].sort(
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


  const pendingBookings =
    sortUpcoming(
      bookings.filter(
        (booking) =>
          getBookingDateString(
            booking.date
          ) >= today &&
          booking.status ===
            "REQUESTED"
      )
    );


  const upcomingBookings =
    sortUpcoming(
      bookings.filter(
        (booking) =>
          getBookingDateString(
            booking.date
          ) >= today &&
          booking.status ===
            "CONFIRMED"
      )
    );


  const bookingHistory =
    sortHistory(
      bookings.filter(
        (booking) => {

          const bookingDate =
            getBookingDateString(
              booking.date
            );

          const activeFuture =
            bookingDate >= today &&
            [
              "REQUESTED",
              "CONFIRMED",
            ].includes(
              booking.status
            );


          return !activeFuture;

        }
      )
    );


  // ==========================================
  // STATUS HELPERS
  // ==========================================

  const getStatusClasses = (
    status
  ) => {

    switch (status) {

      case "REQUESTED":
        return `
          border-amber-200
          bg-amber-50
          text-amber-700
        `;

      case "CONFIRMED":
        return `
          border-green-200
          bg-green-50
          text-green-700
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
        return "Waiting for your response.";

      case "CONFIRMED":
        return "This booking is confirmed.";

      case "REJECTED":
        return "This booking request was rejected.";

      case "CANCELLED":
        return "This booking was cancelled.";

      case "COMPLETED":
        return "This photography booking is complete.";

      default:
        return "";

    }

  };


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
        setUpdatingStatus(status);
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
                  ? {
                      ...booking,
                      ...updated,
                    }
                  : booking
            )
        );


        const messages = {
          CONFIRMED:
            "Booking confirmed successfully.",
          REJECTED:
            "Booking rejected successfully.",
          CANCELLED:
            "Booking cancelled successfully.",
          COMPLETED:
            "Booking marked as completed.",
        };


        setSuccess(
          messages[status] ||
            "Booking updated successfully."
        );

      } catch (err) {

        console.error(
          "Failed to update booking:",
          err
        );


        setError(
          err.response?.data
            ?.message ||
            err.message ||
            "Failed to update booking."
        );

      } finally {

        setUpdatingId(null);
        setUpdatingStatus("");

      }

    };


    // ==========================================
    // CHECK IF BOOKING CAN BE COMPLETED
    // SRI LANKA TIME
    // ==========================================

    const canCompleteBooking = (
      booking
    ) => {

      if (
        booking.status !==
        "CONFIRMED"
      ) {
        return false;
      }


      if (
        !booking.date ||
        !booking.endTime
      ) {
        return false;
      }


      const now =
        new Date();


      const dateFormatter =
        new Intl.DateTimeFormat(
          "en-CA",
          {
            timeZone:
              "Asia/Colombo",

            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          }
        );


      const timeFormatter =
        new Intl.DateTimeFormat(
          "en-GB",
          {
            timeZone:
              "Asia/Colombo",

            hour: "2-digit",
            minute: "2-digit",

            hourCycle: "h23",
          }
        );


      const today =
        dateFormatter.format(
          now
        );


      const currentTime =
        timeFormatter.format(
          now
        );


      const bookingDate =
        String(
          booking.date
        ).split("T")[0];


      if (
        bookingDate <
        today
      ) {
        return true;
      }


      if (
        bookingDate >
        today
      ) {
        return false;
      }


      return (
        currentTime >=
        booking.endTime
      );

    };


  // ==========================================
  // BOOKING CARD
  // ==========================================

  const renderBooking = (
    booking,
    allowActions
  ) => {

    const customerName =
      booking.customer?.name ||
      "Customer";

    const customerEmail =
      booking.customer?.email ||
      "";

    const initials =
      customerName
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map(
          (part) =>
            part.charAt(0)
              .toUpperCase()
        )
        .join("") || "C";

    const isUpdating =
      updatingId ===
      booking._id;


    const completionAllowed =
      canCompleteBooking(
        booking
      );


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
                  {initials}
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
                    {customerName}
                  </h3>


                  {customerEmail && (

                    <p className="
                      mt-1
                      truncate
                      text-sm
                      text-gray-500
                    ">
                      {customerEmail}
                    </p>

                  )}

                </div>

              </div>


              <div className="
                mt-5
                grid
                gap-3
                sm:grid-cols-2
              ">

                <div className="
                  rounded-xl
                  bg-gray-50
                  px-4
                  py-3
                ">

                  <p className="
                    text-xs
                    font-semibold
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


                <div className="
                  rounded-xl
                  bg-gray-50
                  px-4
                  py-3
                ">

                  <p className="
                    text-xs
                    font-semibold
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


              {booking.notes && (

                <div className="
                  mt-4
                  rounded-xl
                  border
                  border-gray-200
                  bg-white
                  px-4
                  py-3
                ">

                  <p className="
                    text-xs
                    font-semibold
                    uppercase
                    tracking-wide
                    text-gray-400
                  ">
                    Customer Notes
                  </p>

                  <p className="
                    mt-1
                    text-sm
                    leading-6
                    text-gray-600
                  ">
                    {booking.notes}
                  </p>

                </div>

              )}

            </div>


            <div className="
              flex
              shrink-0
              flex-col
              items-start
              gap-3
              sm:items-end
            ">

              <span className={`
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
              `}>
                {booking.status}
              </span>


              <p className="
                max-w-56
                text-xs
                leading-5
                text-gray-500
                sm:text-right
              ">
                {getStatusDescription(
                  booking.status
                )}
              </p>


              {allowActions &&
                booking.status ===
                  "REQUESTED" && (

                  <div className="
                    flex
                    flex-wrap
                    gap-2
                  ">

                    <button
                      type="button"
                      disabled={
                        isUpdating
                      }
                      onClick={() =>
                        updateStatus(
                          booking._id,
                          "CONFIRMED"
                        )
                      }
                      className="
                        rounded-xl
                        bg-gray-950
                        px-4
                        py-2.5
                        text-sm
                        font-semibold
                        text-white
                        transition
                        hover:bg-gray-800
                        focus:outline-none
                        focus-visible:ring-2
                        focus-visible:ring-gray-900
                        focus-visible:ring-offset-2
                        disabled:cursor-not-allowed
                        disabled:opacity-50
                      "
                    >
                      {isUpdating &&
                      updatingStatus ===
                        "CONFIRMED"
                        ? "Confirming..."
                        : "Confirm"}
                    </button>


                    <button
                      type="button"
                      disabled={
                        isUpdating
                      }
                      onClick={() =>
                        updateStatus(
                          booking._id,
                          "REJECTED"
                        )
                      }
                      className="
                        rounded-xl
                        border
                        border-red-200
                        bg-red-50
                        px-4
                        py-2.5
                        text-sm
                        font-semibold
                        text-red-600
                        transition
                        hover:bg-red-100
                        focus:outline-none
                        focus-visible:ring-2
                        focus-visible:ring-red-500
                        focus-visible:ring-offset-2
                        disabled:cursor-not-allowed
                        disabled:opacity-50
                      "
                    >
                      {isUpdating &&
                      updatingStatus ===
                        "REJECTED"
                        ? "Rejecting..."
                        : "Reject"}
                    </button>

                  </div>

                )}


              {allowActions &&
                booking.status ===
                  "CONFIRMED" && (

                  <div className="
                    flex
                    flex-wrap
                    gap-2
                  ">

                    <button
                      type="button"
                      disabled={
                        isUpdating ||
                        !completionAllowed
                      }
                      onClick={() =>
                        updateStatus(
                          booking._id,
                          "COMPLETED"
                        )
                      }
                      className="
                        rounded-xl
                        bg-gray-950
                        px-4
                        py-2.5
                        text-sm
                        font-semibold
                        text-white
                        transition
                        hover:bg-gray-800
                        focus:outline-none
                        focus-visible:ring-2
                        focus-visible:ring-gray-900
                        focus-visible:ring-offset-2
                        disabled:cursor-not-allowed
                        disabled:opacity-50
                      "
                    >
                      {isUpdating &&
                      updatingStatus ===
                        "COMPLETED"
                        ? "Updating..."
                        : completionAllowed
                          ? "Mark Completed"
                          : "Complete After Job"}
                    </button>


                    <button
                      type="button"
                      disabled={
                        isUpdating
                      }
                      onClick={() =>
                        updateStatus(
                          booking._id,
                          "CANCELLED"
                        )
                      }
                      className="
                        rounded-xl
                        border
                        border-red-200
                        bg-red-50
                        px-4
                        py-2.5
                        text-sm
                        font-semibold
                        text-red-600
                        transition
                        hover:bg-red-100
                        focus:outline-none
                        focus-visible:ring-2
                        focus-visible:ring-red-500
                        focus-visible:ring-offset-2
                        disabled:cursor-not-allowed
                        disabled:opacity-50
                      "
                    >
                      {isUpdating &&
                      updatingStatus ===
                        "CANCELLED"
                        ? "Cancelling..."
                        : "Cancel"}
                    </button>

                  </div>

                )}

            </div>

          </div>

        </div>

      </article>

    );

  };


  // ==========================================
  // LOADING SKELETON
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
        flex-col
        gap-5
        sm:flex-row
        sm:justify-between
      ">

        <div className="
          flex-1
        ">

          <div className="
            flex
            items-center
            gap-3
          ">

            <div className="
              h-11
              w-11
              rounded-full
              bg-gray-200
            " />

            <div>

              <div className="
                h-4
                w-36
                rounded
                bg-gray-200
              " />

              <div className="
                mt-2
                h-3
                w-44
                rounded
                bg-gray-100
              " />

            </div>

          </div>


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


        <div className="
          h-7
          w-24
          rounded-full
          bg-gray-100
        " />

      </div>

    </div>

  );


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

        <div>

          <p className="
            text-sm
            font-semibold
            text-orange-600
          ">
            Booking Management
          </p>


          <h1 className="
            mt-1
            text-2xl
            font-bold
            tracking-tight
            text-gray-950
            sm:text-3xl
          ">
            Photographer Bookings
          </h1>


          <p className="
            mt-2
            max-w-2xl
            text-sm
            leading-6
            text-gray-500
          ">
            Review incoming requests,
            manage confirmed sessions and
            keep track of previous bookings.
          </p>

        </div>


        {/* ==================================
            FEEDBACK
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
            "
          >

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
            "
          >

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
              mt-8
              space-y-10
            "
            aria-label="Loading photographer bookings"
          >

            {[1, 2, 3].map(
              (section) => (

                <section
                  key={section}
                >

                  <div className="
                    mb-5
                  ">

                    <div className="
                      h-6
                      w-44
                      animate-pulse
                      rounded
                      bg-gray-200
                    " />

                    <div className="
                      mt-2
                      h-3
                      w-64
                      max-w-full
                      animate-pulse
                      rounded
                      bg-gray-100
                    " />

                  </div>


                  <div className="
                    space-y-4
                  ">

                    {[
                      1,
                      section === 1
                        ? 2
                        : null,
                    ]
                      .filter(Boolean)
                      .map(
                        (item) =>
                          renderBookingSkeleton(
                            `${section}-${item}`
                          )
                      )}

                  </div>

                </section>

              )
            )}

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
                  {pendingBookings.length}
                </span>
                {" "}Pending
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

            </div>


            {/* ==================================
                PENDING REQUESTS
            ================================== */}

            <section className="
              mt-9
            ">

              <div className="
                mb-5
              ">

                <h2 className="
                  text-xl
                  font-semibold
                  text-gray-950
                ">
                  Pending Requests
                </h2>


                <p className="
                  mt-1
                  text-sm
                  text-gray-500
                ">
                  New customer requests
                  waiting for confirmation or
                  rejection.
                </p>

              </div>


              {pendingBookings.length ===
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
                    bg-orange-50
                    text-orange-600
                  ">

                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      aria-hidden="true"
                    >
                      <path d="M12 6v6l4 2" />
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
                    No pending requests
                  </h3>


                  <p className="
                    mx-auto
                    mt-2
                    max-w-md
                    text-sm
                    leading-6
                    text-gray-500
                  ">
                    New photography booking
                    requests will appear here
                    when customers submit them.
                  </p>

                </div>

              ) : (

                <div className="
                  space-y-4
                ">

                  {pendingBookings.map(
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
                UPCOMING BOOKINGS
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
                  Upcoming Bookings
                </h2>


                <p className="
                  mt-1
                  text-sm
                  text-gray-500
                ">
                  Confirmed future photography
                  sessions that are currently
                  scheduled.
                </p>

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
                    bg-green-50
                    text-green-600
                  ">

                    <svg
                      className="h-5 w-5"
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
                    Confirmed future sessions
                    will appear here.
                  </p>

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
                    Previous booking records
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

    </main>
  );
};


export default PhotographerBookings;
