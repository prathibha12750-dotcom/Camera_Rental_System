import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  useSearchParams,
} from "react-router-dom";

import api from "../../services/api";


const PhotographerBookings = () => {

  const [searchParams] =
    useSearchParams();

  const highlightedBookingId =
    searchParams.get("booking");


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

  const [
    selectedDate,
    setSelectedDate,
  ] = useState("");

  const [
    selectedStatus,
    setSelectedStatus,
  ] = useState("ALL");


  const BOOKINGS_PER_PAGE = 3;


  const [
    pendingPage,
    setPendingPage,
  ] = useState(1);

  const [
    upcomingPage,
    setUpcomingPage,
  ] = useState(1);

  const [
    historyPage,
    setHistoryPage,
  ] = useState(1);

  const [
    filteredPage,
    setFilteredPage,
  ] = useState(1);


  const pendingSectionRef =
    useRef(null);

  const upcomingSectionRef =
    useRef(null);

  const historySectionRef =
    useRef(null);


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


  const getTomorrowString = () => {

    const tomorrow =
      new Date();

    tomorrow.setDate(
      tomorrow.getDate() + 1
    );

    const year =
      tomorrow.getFullYear();

    const month =
      String(
        tomorrow.getMonth() + 1
      ).padStart(
        2,
        "0"
      );

    const day =
      String(
        tomorrow.getDate()
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

  const tomorrow =
    getTomorrowString();


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


  const todayBookings =
    upcomingBookings.filter(
      (booking) =>
        getBookingDateString(
          booking.date
        ) === today
    );


  const tomorrowBookings =
    upcomingBookings.filter(
      (booking) =>
        getBookingDateString(
          booking.date
        ) === tomorrow
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


  const filteredBookings =
    bookings.filter(
      (booking) => {

        const bookingDate =
          getBookingDateString(
            booking.date
          );

        const matchesDate =
          !selectedDate ||
          bookingDate ===
            selectedDate;

        const matchesStatus =
          selectedStatus === "ALL" ||
          booking.status ===
            selectedStatus;

        return (
          matchesDate &&
          matchesStatus
        );

      }
    );


  // ==========================================
  // FILTERED SORT
  // ==========================================

  const sortedFilteredBookings =
    selectedStatus === "COMPLETED" ||
    selectedStatus === "REJECTED" ||
    selectedStatus === "CANCELLED"
      ? sortHistory(
          filteredBookings
        )
      : sortUpcoming(
          filteredBookings
        );


  // ==========================================
  // PAGINATION
  // ==========================================

  const pendingTotalPages =
    Math.ceil(
      pendingBookings.length /
        BOOKINGS_PER_PAGE
    );

  const upcomingTotalPages =
    Math.ceil(
      upcomingBookings.length /
        BOOKINGS_PER_PAGE
    );

  const historyTotalPages =
    Math.ceil(
      bookingHistory.length /
        BOOKINGS_PER_PAGE
    );

  const filteredTotalPages =
    Math.ceil(
      sortedFilteredBookings.length /
        BOOKINGS_PER_PAGE
    );


  // ==========================================
  // NOTIFICATION BOOKING LOCATION
  // ==========================================

  const highlightedPendingIndex =
    pendingBookings.findIndex(
      (booking) =>
        booking._id ===
        highlightedBookingId
    );


  const highlightedUpcomingIndex =
    upcomingBookings.findIndex(
      (booking) =>
        booking._id ===
        highlightedBookingId
    );


  const highlightedHistoryIndex =
    bookingHistory.findIndex(
      (booking) =>
        booking._id ===
        highlightedBookingId
    );


  const highlightedPendingPage =
    highlightedPendingIndex >= 0
      ? Math.floor(
          highlightedPendingIndex /
            BOOKINGS_PER_PAGE
        ) + 1
      : null;


  const highlightedUpcomingPage =
    highlightedUpcomingIndex >= 0
      ? Math.floor(
          highlightedUpcomingIndex /
            BOOKINGS_PER_PAGE
        ) + 1
      : null;


  const highlightedHistoryPage =
    highlightedHistoryIndex >= 0
      ? Math.floor(
          highlightedHistoryIndex /
            BOOKINGS_PER_PAGE
        ) + 1
      : null;


  // ==========================================
  // SAFE PAGE NUMBERS
  // ==========================================

  const safePendingPage =
    highlightedPendingPage ??
    Math.min(
      pendingPage,
      Math.max(
        pendingTotalPages,
        1
      )
    );


  const safeUpcomingPage =
    highlightedUpcomingPage ??
    Math.min(
      upcomingPage,
      Math.max(
        upcomingTotalPages,
        1
      )
    );


  const safeHistoryPage =
    highlightedHistoryPage ??
    Math.min(
      historyPage,
      Math.max(
        historyTotalPages,
        1
      )
    );


  const safeFilteredPage =
    Math.min(
      filteredPage,
      Math.max(
        filteredTotalPages,
        1
      )
    );


  const paginatedPendingBookings =
    pendingBookings.slice(
      (safePendingPage - 1) *
        BOOKINGS_PER_PAGE,

      safePendingPage *
        BOOKINGS_PER_PAGE
    );


  const paginatedUpcomingBookings =
    upcomingBookings.slice(
      (safeUpcomingPage - 1) *
        BOOKINGS_PER_PAGE,

      safeUpcomingPage *
        BOOKINGS_PER_PAGE
    );


  const paginatedBookingHistory =
    bookingHistory.slice(
      (safeHistoryPage - 1) *
        BOOKINGS_PER_PAGE,

      safeHistoryPage *
        BOOKINGS_PER_PAGE
    );


  const paginatedFilteredBookings =
    sortedFilteredBookings.slice(
      (safeFilteredPage - 1) *
        BOOKINGS_PER_PAGE,

      safeFilteredPage *
        BOOKINGS_PER_PAGE
    );


  // ==========================================
  // SCROLL TO NOTIFICATION BOOKING
  // ==========================================

  useEffect(() => {

    if (
      !highlightedBookingId ||
      loading
    ) {
      return;
    }


    const timer =
      setTimeout(() => {

        document
          .getElementById(
            `booking-${highlightedBookingId}`
          )
          ?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });

      }, 150);


    return () =>
      clearTimeout(timer);

  }, [
    highlightedBookingId,
    loading,
    safePendingPage,
    safeUpcomingPage,
    safeHistoryPage,
  ]);


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

    const todayInSriLanka =
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
      todayInSriLanka
    ) {
      return true;
    }

    if (
      bookingDate >
      todayInSriLanka
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
        id={`booking-${booking._id}`}
        className={`
          overflow-hidden
          rounded-2xl
          border
          border-gray-200
          bg-white
          shadow-sm
          transition
          ${
            highlightedBookingId ===
            booking._id
              ? "ring-2 ring-orange-500 ring-offset-2"
              : ""
          }
        `}
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

              {/* BOOKING DETAILS */}

              <div className="
                mt-4
                rounded-xl
                border
                border-gray-200
                bg-gray-50
                p-4
              ">
                <p className="
                  text-xs
                  font-semibold
                  uppercase
                  tracking-wide
                  text-gray-400
                ">
                  Booking Details
                </p>

                <div className="
                  mt-3
                  grid
                  gap-4
                  sm:grid-cols-2
                ">

                  {/* PRICING TYPE */}

                  <div>
                    <p className="
                      text-xs
                      text-gray-500
                    ">
                      Pricing
                    </p>

                    <p className="
                      mt-1
                      text-sm
                      font-semibold
                      text-gray-900
                    ">
                      {booking.pricingType === "PACKAGE"
                        ? "Package"
                        : "Hourly Rate"}
                    </p>
                  </div>


                  {/* PACKAGE OR HOURLY RATE */}

                  <div>
                    <p className="
                      text-xs
                      text-gray-500
                    ">
                      {booking.pricingType === "PACKAGE"
                        ? "Package"
                        : "Hourly Rate"}
                    </p>

                    <p className="
                      mt-1
                      text-sm
                      font-semibold
                      text-gray-900
                    ">
                      {booking.pricingType === "PACKAGE"
                        ? booking.packageNameAtBooking ||
                          "Photography Package"
                        : booking.hourlyRateAtBooking != null
                          ? `LKR ${Number(
                              booking.hourlyRateAtBooking
                            ).toLocaleString()} / hour`
                          : "Not available"}
                    </p>
                  </div>


                  {/* DURATION */}

                  <div>
                    <p className="
                      text-xs
                      text-gray-500
                    ">
                      Duration
                    </p>

                    <p className="
                      mt-1
                      text-sm
                      font-semibold
                      text-gray-900
                    ">
                      {booking.durationHours != null
                        ? `${booking.durationHours} ${
                            Number(
                              booking.durationHours
                            ) === 1
                              ? "hour"
                              : "hours"
                          }`
                        : "Not available"}
                    </p>
                  </div>


                  {/* TOTAL AMOUNT */}

                  <div>
                    <p className="
                      text-xs
                      text-gray-500
                    ">
                      Total Amount
                    </p>

                    <p className="
                      mt-1
                      text-sm
                      font-bold
                      text-gray-950
                    ">
                      {booking.totalAmount != null
                        ? `LKR ${Number(
                            booking.totalAmount
                          ).toLocaleString()}`
                        : "Not available"}
                    </p>
                  </div>

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
  // PAGINATION CONTROLS
  // ==========================================

  const renderPagination = (
    currentPage,
    totalPages,
    setPage
  ) => {

    if (totalPages <= 1) {
      return null;
    }

    return (

      <div className="
        mt-5
        flex
        items-center
        justify-between
        gap-4
      ">

        <button
          type="button"
          onClick={() =>
            setPage(
              Math.max(
                currentPage - 1,
                1
              )
            )
          }
          disabled={
            currentPage === 1
          }
          className="
            rounded-xl
            border
            border-gray-200
            bg-white
            px-4
            py-2
            text-sm
            font-semibold
            text-gray-700
            transition
            hover:border-orange-300
            hover:bg-orange-50
            hover:text-orange-700
            disabled:cursor-not-allowed
            disabled:opacity-40
          "
        >
          Previous
        </button>


        <p className="
          text-sm
          text-gray-500
        ">
          Page {currentPage}
          {" "}of{" "}
          {totalPages}
        </p>


        <button
          type="button"
          onClick={() =>
            setPage(
              Math.min(
                currentPage + 1,
                totalPages
              )
            )
          }
          disabled={
            currentPage ===
            totalPages
          }
          className="
            rounded-xl
            border
            border-gray-200
            bg-white
            px-4
            py-2
            text-sm
            font-semibold
            text-gray-700
            transition
            hover:border-orange-300
            hover:bg-orange-50
            hover:text-orange-700
            disabled:cursor-not-allowed
            disabled:opacity-40
          "
        >
          Next
        </button>

      </div>

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
            "
            />

            <div>

              <div className="
                h-4
                w-36
                rounded
                bg-gray-200
              "
              />

              <div className="
                mt-2
                h-3
                w-44
                rounded
                bg-gray-100
              "
              />

            </div>

          </div>

        </div>

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


        {/* PAGE HEADER */}

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


        {/* FEEDBACK */}

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
              className="
                font-semibold
                text-red-500
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
              className="
                font-semibold
                text-green-600
              "
            >
              ×
            </button>

          </div>

        )}


        {loading ? (

          <div className="
            mt-8
            space-y-4
          ">

            {[1, 2, 3].map(
              (item) =>
                renderBookingSkeleton(
                  item
                )
            )}

          </div>

        ) : (

          <>


            {/* QUICK OVERVIEW */}

            <div className="
              mt-7
              flex
              flex-wrap
              gap-3
            ">

              <button
                type="button"
                onClick={() =>
                  pendingSectionRef.current?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  })
                }
                className="
                  rounded-full
                  border
                  border-gray-200
                  bg-white
                  px-4
                  py-2
                  text-sm
                  text-gray-600
                  shadow-sm
                  transition
                  hover:border-orange-300
                  hover:bg-orange-50
                  hover:text-orange-700
                "
              >
                <span className="
                  font-semibold
                  text-gray-950
                ">
                  {pendingBookings.length}
                </span>
                {" "}Pending
              </button>


              <button
                type="button"
                onClick={() =>
                  upcomingSectionRef.current?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  })
                }
                className="
                  rounded-full
                  border
                  border-gray-200
                  bg-white
                  px-4
                  py-2
                  text-sm
                  text-gray-600
                  shadow-sm
                  transition
                  hover:border-orange-300
                  hover:bg-orange-50
                  hover:text-orange-700
                "
              >
                <span className="
                  font-semibold
                  text-gray-950
                ">
                  {upcomingBookings.length}
                </span>
                {" "}Upcoming
              </button>


              <button
                type="button"
                onClick={() =>
                  historySectionRef.current?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  })
                }
                className="
                  rounded-full
                  border
                  border-gray-200
                  bg-white
                  px-4
                  py-2
                  text-sm
                  text-gray-600
                  shadow-sm
                  transition
                  hover:border-orange-300
                  hover:bg-orange-50
                  hover:text-orange-700
                "
              >
                <span className="
                  font-semibold
                  text-gray-950
                ">
                  {bookingHistory.length}
                </span>
                {" "}History
              </button>

            </div>


            {/* FILTERS */}

            <section className="
              mt-6
              rounded-2xl
              border
              border-gray-200
              bg-white
              p-4
              shadow-sm
              sm:p-5
            ">

              <div className="
                flex
                flex-col
                gap-4
                md:flex-row
                md:items-end
              ">

                <div className="flex-1">

                  <label
                    htmlFor="booking-date"
                    className="
                      text-sm
                      font-semibold
                      text-gray-700
                    "
                  >
                    Find jobs by date
                  </label>

                  <input
                    id="booking-date"
                    type="date"
                    value={
                      selectedDate
                    }
                    onChange={(
                      event
                    ) => {

                      setSelectedDate(
                        event.target.value
                      );

                      setFilteredPage(
                        1
                      );

                    }}
                    className="
                      mt-2
                      w-full
                      rounded-xl
                      border
                      border-gray-300
                      px-4
                      py-2.5
                      text-sm
                      outline-none
                      focus:border-orange-400
                      focus:ring-2
                      focus:ring-orange-100
                    "
                  />

                </div>


                <div className="flex-1">

                  <label
                    htmlFor="booking-status"
                    className="
                      text-sm
                      font-semibold
                      text-gray-700
                    "
                  >
                    Booking status
                  </label>

                  <select
                    id="booking-status"
                    value={
                      selectedStatus
                    }
                    onChange={(
                      event
                    ) => {

                      setSelectedStatus(
                        event.target.value
                      );

                      setFilteredPage(
                        1
                      );

                    }}
                    className="
                      mt-2
                      w-full
                      rounded-xl
                      border
                      border-gray-300
                      px-4
                      py-2.5
                      text-sm
                      outline-none
                      focus:border-orange-400
                      focus:ring-2
                      focus:ring-orange-100
                    "
                  >
                    <option value="ALL">
                      All statuses
                    </option>

                    <option value="REQUESTED">
                      Requested
                    </option>

                    <option value="CONFIRMED">
                      Confirmed
                    </option>

                    <option value="COMPLETED">
                      Completed
                    </option>

                    <option value="REJECTED">
                      Rejected
                    </option>

                    <option value="CANCELLED">
                      Cancelled
                    </option>

                  </select>

                </div>


                <button
                  type="button"
                  onClick={() => {

                    setSelectedDate(
                      ""
                    );

                    setSelectedStatus(
                      "ALL"
                    );

                    setFilteredPage(
                      1
                    );

                  }}
                  className="
                    rounded-xl
                    border
                    border-gray-300
                    bg-white
                    px-4
                    py-2.5
                    text-sm
                    font-semibold
                    text-gray-700
                    transition
                    hover:border-orange-300
                    hover:bg-orange-50
                    hover:text-orange-700
                  "
                >
                  Clear
                </button>

              </div>

            </section>


            {/* FILTERED JOBS */}

            {(
              selectedDate ||
              selectedStatus !==
                "ALL"
            ) && (

              <section className="mt-6">

                <div className="mb-4">

                  <h2 className="
                    text-lg
                    font-semibold
                    text-gray-950
                  ">
                    Filtered Jobs
                  </h2>

                  <p className="
                    mt-1
                    text-sm
                    text-gray-500
                  ">
                    {
                      filteredBookings.length
                    }
                    {" "}
                    booking
                    {
                      filteredBookings.length ===
                      1
                        ? ""
                        : "s"
                    }
                    {" "}
                    found.
                  </p>

                </div>


                {filteredBookings.length ===
                0 ? (

                  <div className="
                    rounded-2xl
                    border
                    border-dashed
                    border-gray-300
                    bg-white
                    px-6
                    py-8
                    text-center
                  ">
                    <p className="
                      font-semibold
                      text-gray-800
                    ">
                      No bookings found.
                    </p>

                    <p className="
                      mt-1
                      text-sm
                      text-gray-500
                    ">
                      Try another date or
                      booking status.
                    </p>
                  </div>

                ) : (

                  <>

                    <div className="
                      space-y-4
                    ">

                      {
                        paginatedFilteredBookings.map(
                          (booking) =>
                            renderBooking(
                              booking,
                              [
                                "REQUESTED",
                                "CONFIRMED",
                              ].includes(
                                booking.status
                              )
                            )
                        )
                      }

                    </div>


                    {renderPagination(
                      safeFilteredPage,
                      filteredTotalPages,
                      setFilteredPage
                    )}

                  </>

                )}

              </section>

            )}


            {/* TODAY / TOMORROW */}

            <section className="mt-8">

              <div className="
                grid
                gap-5
                lg:grid-cols-2
              ">

                <div className="
                  rounded-2xl
                  border
                  border-orange-200
                  bg-orange-50
                  p-5
                  sm:p-6
                ">

                  <div className="
                    flex
                    justify-between
                    gap-4
                  ">

                    <div>

                      <p className="
                        text-xs
                        font-semibold
                        uppercase
                        text-orange-600
                      ">
                        Today
                      </p>

                      <h2 className="
                        mt-1
                        text-lg
                        font-bold
                        text-gray-950
                      ">
                        Today's Jobs
                      </h2>

                    </div>


                    <span className="
                      flex
                      h-9
                      min-w-9
                      items-center
                      justify-center
                      rounded-full
                      bg-orange-600
                      px-2
                      text-sm
                      font-bold
                      text-white
                    ">
                      {todayBookings.length}
                    </span>

                  </div>


                  {todayBookings.length ===
                  0 ? (

                    <p className="
                      mt-5
                      rounded-xl
                      bg-white
                      p-5
                      text-center
                      text-sm
                      text-gray-600
                    ">
                      No jobs scheduled
                      for today.
                    </p>

                  ) : (

                    <div className="
                      mt-5
                      space-y-3
                    ">

                      {todayBookings.map(
                        (booking) => (

                          <div
                            key={
                              booking._id
                            }
                            className="
                              rounded-xl
                              bg-white
                              p-4
                              shadow-sm
                            "
                          >

                            <p className="
                              font-semibold
                              text-gray-950
                            ">
                              {booking.customer?.name ||
                                "Customer"}
                            </p>

                            <p className="
                              mt-1
                              text-sm
                              text-gray-600
                            ">
                              {booking.pricingType === "PACKAGE"
                                ? booking.packageNameAtBooking ||
                                  "Photography Package"
                                : "Hourly Booking"}
                            </p>

                            <p className="
                              mt-1
                              text-sm
                              font-medium
                              text-orange-700
                            ">
                              {booking.startTime}
                              {" — "}
                              {booking.endTime}
                            </p>

                          </div>

                        )
                      )}

                    </div>

                  )}

                </div>


                <div className="
                  rounded-2xl
                  border
                  border-amber-200
                  bg-amber-50
                  p-5
                  sm:p-6
                ">

                  <div className="
                    flex
                    justify-between
                    gap-4
                  ">

                    <div>

                      <p className="
                        text-xs
                        font-semibold
                        uppercase
                        text-amber-700
                      ">
                        Tomorrow
                      </p>

                      <h2 className="
                        mt-1
                        text-lg
                        font-bold
                        text-gray-950
                      ">
                        Tomorrow's Jobs
                      </h2>

                    </div>


                    <span className="
                      flex
                      h-9
                      min-w-9
                      items-center
                      justify-center
                      rounded-full
                      bg-amber-500
                      px-2
                      text-sm
                      font-bold
                      text-white
                    ">
                      {
                        tomorrowBookings.length
                      }
                    </span>

                  </div>


                  {tomorrowBookings.length ===
                  0 ? (

                    <p className="
                      mt-5
                      rounded-xl
                      bg-white
                      p-5
                      text-center
                      text-sm
                      text-gray-600
                    ">
                      No jobs scheduled
                      for tomorrow.
                    </p>

                  ) : (

                    <div className="
                      mt-5
                      space-y-3
                    ">

                      {tomorrowBookings.map(
                        (booking) => (

                          <div
                            key={
                              booking._id
                            }
                            className="
                              rounded-xl
                              bg-white
                              p-4
                              shadow-sm
                            "
                          >

                            <p className="
                              font-semibold
                              text-gray-950
                            ">
                              {booking.customer?.name ||
                                "Customer"}
                            </p>

                            <p className="
                              mt-1
                              text-sm
                              text-gray-600
                            ">
                              {booking.pricingType === "PACKAGE"
                                ? booking.packageNameAtBooking ||
                                  "Photography Package"
                                : "Hourly Booking"}
                            </p>

                            <p className="
                              mt-1
                              text-sm
                              font-medium
                              text-amber-700
                            ">
                              {booking.startTime}
                              {" — "}
                              {booking.endTime}
                            </p>

                          </div>

                        )
                      )}

                    </div>

                  )}

                </div>

              </div>

            </section>


            {/* PENDING REQUESTS */}

            <section
              ref={pendingSectionRef}
              className="
                mt-9
                scroll-mt-24
              "
            >

              <div className="mb-5">

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
                  waiting for confirmation
                  or rejection.
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
                  No pending requests.
                </div>

              ) : (

                <>

                  <div className="
                    space-y-4
                  ">

                    {
                      paginatedPendingBookings.map(
                        (booking) =>
                          renderBooking(
                            booking,
                            true
                          )
                      )
                    }

                  </div>


                  {renderPagination(
                    safePendingPage,
                    pendingTotalPages,
                    setPendingPage
                  )}

                </>

              )}

            </section>


            {/* UPCOMING BOOKINGS */}

            <section
              ref={upcomingSectionRef}
              className="
                mt-12
                scroll-mt-24
                border-t
                border-gray-200
                pt-9
              "
            >

              <div className="mb-5">

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
                  No upcoming bookings.
                </div>

              ) : (

                <>

                  <div className="
                    space-y-4
                  ">

                    {
                      paginatedUpcomingBookings.map(
                        (booking) =>
                          renderBooking(
                            booking,
                            true
                          )
                      )
                    }

                  </div>


                  {renderPagination(
                    safeUpcomingPage,
                    upcomingTotalPages,
                    setUpcomingPage
                  )}

                </>

              )}

            </section>


            {/* BOOKING HISTORY */}

            <section
              ref={historySectionRef}
              className="
                mt-12
                scroll-mt-24
                border-t
                border-gray-200
                pt-9
              "
            >

              <div className="mb-5">

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
                  No booking history yet.
                </div>

              ) : (

                <>

                  <div className="
                    space-y-4
                  ">

                    {
                      paginatedBookingHistory.map(
                        (booking) =>
                          renderBooking(
                            booking,
                            false
                          )
                      )
                    }

                  </div>


                  {renderPagination(
                    safeHistoryPage,
                    historyTotalPages,
                    setHistoryPage
                  )}

                </>

              )}

            </section>

          </>

        )}

      </div>

    </main>

  );

};


export default PhotographerBookings;