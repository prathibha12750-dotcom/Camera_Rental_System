import {
  useEffect,
  useState,
} from "react";

import { Link } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import api from "../../services/api";


const CustomerHome = () => {

  const { user } = useAuth();

  const [
    bookings,
    setBookings,
  ] = useState([]);

  // ==========================================
  // CUSTOMER EQUIPMENT RENTALS
  // ==========================================

  const [rentals, setRentals] = useState([]);
  const [rentalsLoading, setRentalsLoading] = useState(true);
  const [rentalsError, setRentalsError] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    bookingsError,
    setBookingsError,
  ] = useState("");


  // ==========================================
  // LOAD CUSTOMER BOOKING DATA
  // ==========================================

  useEffect(() => {

    let ignore = false;


    const loadBookings = async () => {

      try {

        const response =
          await api.get(
            "/customer/bookings"
          );


        if (!ignore) {

          setBookings(
            Array.isArray(
              response.data?.data?.bookings
            )
              ? response.data.data.bookings
              : []
          );

        }

      } catch (err) {

        if (!ignore) {

          setBookingsError(
            err.response?.data?.message ||
              "Unable to load booking information."
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
  // LOAD CUSTOMER EQUIPMENT RENTALS
  // ==========================================

  useEffect(() => {
    let ignore = false;

    const loadCustomerRentals = async () => {
      try {
        const response = await api.get("/rentals/my-rentals");

        if (!ignore) {
          const rentalData = response.data?.data?.rentals;

          setRentals(
            Array.isArray(rentalData) ? rentalData : []
          );

          setRentalsError("");
        }
      } catch (error) {
        if (!ignore) {
          setRentalsError(
            error.response?.data?.message ||
              "Unable to load equipment rentals."
          );
        }
      } finally {
        if (!ignore) {
          setRentalsLoading(false);
        }
      }
    };

    loadCustomerRentals();

    return () => {
      ignore = true;
    };
  }, []);

  // ==========================================
  // DATE HELPERS
  // ==========================================

  const getTodayString = () => {

    const today = new Date();


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
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      }
    );

  };


  // ==========================================
  // BOOKING CLASSIFICATION
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


  const pendingBookings =
    bookings.filter(
      (booking) =>
        booking.status === "REQUESTED"
    );


  const completedBookings =
    bookings.filter(
      (booking) =>
        booking.status === "COMPLETED"
    );


  const nextBooking =
    upcomingBookings[0];

  // ==========================================
  // CUSTOMER EQUIPMENT RENTAL STATISTICS
  // ==========================================

  const activeRentals = rentals.filter(
    (rental) => rental.status === "ACTIVE"
  );

  const pendingRentals = rentals.filter(
    (rental) => rental.status === "PENDING"
  );

  const confirmedRentals = rentals.filter(
    (rental) => rental.status === "CONFIRMED"
  );

  const completedRentals = rentals.filter(
    (rental) => rental.status === "COMPLETED"
  );

  // Active rentals whose return date has passed.
  // Use the local calendar date for comparison.
  const rentalToday = new Date();
  rentalToday.setHours(0, 0, 0, 0);

  const overdueRentals = activeRentals.filter((rental) => {
    if (!rental.endDate) return false;

    const endDate = new Date(rental.endDate);

    if (Number.isNaN(endDate.getTime())) return false;

    endDate.setHours(0, 0, 0, 0);

    return endDate < rentalToday;
  });

  const rentalStats = {
    active: activeRentals.length,
    pending: pendingRentals.length,
    confirmed: confirmedRentals.length,
    completed: completedRentals.length,
    overdue: overdueRentals.length,
    total: rentals.length,
  };

  // ==========================================
  // STATUS STYLES
  // ==========================================

  const getStatusClasses = (
    status
  ) => {

    switch (status) {

      case "CONFIRMED":
        return "border-green-200 bg-green-50 text-green-700";

      case "REQUESTED":
        return "border-amber-200 bg-amber-50 text-amber-700";

      case "COMPLETED":
        return "border-blue-200 bg-blue-50 text-blue-700";

      case "CANCELLED":
        return "border-gray-200 bg-gray-100 text-gray-600";

      case "REJECTED":
        return "border-red-200 bg-red-50 text-red-700";

      default:
        return "border-gray-200 bg-gray-50 text-gray-600";

    }

  };


  return (

    <main
      className="
        min-h-[calc(100vh-4rem)]
        bg-gray-50
        px-4
        py-6
        sm:px-6
        lg:px-8
        lg:py-8
      "
    >

      <div
        className="
          mx-auto
          max-w-7xl
        "
      >


        {/* ==================================
            WELCOME AREA
        ================================== */}

        <section
          className="
            overflow-hidden
            rounded-3xl
            border
            border-gray-200
            bg-white
          "
        >

          <div
            className="
              flex
              flex-col
              gap-6
              px-6
              py-7
              sm:px-8
              sm:py-8
              lg:flex-row
              lg:items-center
              lg:justify-between
            "
          >

            <div className="max-w-2xl">

              <p
                className="
                  text-sm
                  font-semibold
                  text-orange-600
                "
              >
                Customer Dashboard
              </p>


              <h1
                className="
                  mt-2
                  text-2xl
                  font-bold
                  tracking-tight
                  text-gray-950
                  sm:text-3xl
                "
              >
                Welcome back,{" "}
                {user?.name?.split(
                  " "
                )[0] || "Customer"}
              </h1>


              <p
                className="
                  mt-2
                  text-sm
                  leading-6
                  text-gray-600
                  sm:text-base
                "
              >
                Manage your bookings,
                account activity and
                upcoming services in one
                place.
              </p>

            </div>

          </div>

        </section>

        {/* ==================================
            EQUIPMENT RENTAL STATISTICS
        ================================== */}

        <section className="mt-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-950">
              Equipment Rentals
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Track your equipment rental requests and returns.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                label: "Active Rentals",
                value: rentalStats.active,
                description: "Equipment currently rented to you.",
                color: "text-green-700 bg-green-50",
              },
              {
                label: "Pending Rentals",
                value: rentalStats.pending,
                description: "Requests awaiting staff approval.",
                color: "text-amber-700 bg-amber-50",
              },
              {
                label: "Overdue Rentals",
                value: rentalStats.overdue,
                description: "Active rentals past their return date.",
                color: "text-red-700 bg-red-50",
              },
            ].map((stat) => (
              <Link
                key={stat.label}
                to="/customer/rentals"
                className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-orange-300 hover:shadow-md"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-gray-600">
                    {stat.label}
                  </p>
                  <span
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${stat.color}`}
                  >
                    Rentals
                  </span>
                </div>

                {rentalsLoading ? (
                  <div className="mt-3 h-9 w-14 animate-pulse rounded bg-gray-200" />
                ) : rentalsError ? (
                  <p className="mt-3 text-sm text-red-600">
                    Unavailable
                  </p>
                ) : (
                  <p className="mt-2 text-3xl font-bold text-gray-950">
                    {stat.value}
                  </p>
                )}

                <p className="mt-3 text-xs leading-5 text-gray-500">
                  {stat.description}
                </p>
              </Link>
            ))}
          </div>

          {rentalsError && (
            <p role="alert" className="mt-3 text-sm text-red-600">
              {rentalsError}
            </p>
          )}
        </section>

        {/* ==================================
            BOOKING STATISTICS
        ================================== */}

        <section className="mt-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-950">
              Photography Bookings
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Track your photography requests, upcoming bookings,
              and completed sessions.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

          {/* UPCOMING */}

          <Link
            to="/customer/bookings?filter=upcoming"
            className="
              block
              rounded-2xl
              border
              border-gray-200
              bg-white
              p-5
              shadow-sm
              transition
              hover:border-orange-300
              hover:shadow-md
              focus:outline-none
              focus:ring-2
              focus:ring-orange-500
              focus:ring-offset-2
            "
          >

            <div
              className="
                flex
                items-center
                justify-between
                gap-4
              "
            >

              <div>

                <p
                  className="
                    text-sm
                    font-medium
                    text-gray-500
                  "
                >
                  Upcoming
                </p>


                {loading ? (

                  <div
                    className="
                      mt-2
                      h-8
                      w-12
                      animate-pulse
                      rounded
                      bg-gray-200
                    "
                  />

                ) : (

                  <p
                    className="
                      mt-1
                      text-3xl
                      font-bold
                      text-gray-950
                    "
                  >
                    {
                      upcomingBookings.length
                    }
                  </p>

                )}

              </div>


              <div
                className="
                  flex
                  h-11
                  w-11
                  items-center
                  justify-center
                  rounded-xl
                  bg-orange-50
                  text-orange-600
                "
              >

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

                </svg>

              </div>

            </div>


            <p
              className="
                mt-3
                text-xs
                leading-5
                text-gray-500
              "
            >
              Requested or confirmed
              future bookings.
            </p>

          </Link>


          {/* PENDING */}

          <Link
            to="/customer/bookings?filter=pending"
            className="
              block
              rounded-2xl
              border
              border-gray-200
              bg-white
              p-5
              shadow-sm
              transition
              hover:border-orange-300
              hover:shadow-md
              focus:outline-none
              focus:ring-2
              focus:ring-orange-500
              focus:ring-offset-2
            "
          >

            <div
              className="
                flex
                items-center
                justify-between
                gap-4
              "
            >

              <div>

                <p
                  className="
                    text-sm
                    font-medium
                    text-gray-500
                  "
                >
                  Pending Requests
                </p>


                {loading ? (

                  <div
                    className="
                      mt-2
                      h-8
                      w-12
                      animate-pulse
                      rounded
                      bg-gray-200
                    "
                  />

                ) : (

                  <p
                    className="
                      mt-1
                      text-3xl
                      font-bold
                      text-gray-950
                    "
                  >
                    {
                      pendingBookings.length
                    }
                  </p>

                )}

              </div>


              <div
                className="
                  flex
                  h-11
                  w-11
                  items-center
                  justify-center
                  rounded-xl
                  bg-amber-50
                  text-amber-600
                "
              >

                <svg
                  className="h-5 w-5"
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

              </div>

            </div>


            <p
              className="
                mt-3
                text-xs
                leading-5
                text-gray-500
              "
            >
              Requests waiting for
              photographer confirmation.
            </p>

          </Link>


          {/* COMPLETED */}

          <Link
            to="/customer/bookings?filter=completed"
            className="
              block
              rounded-2xl
              border
              border-gray-200
              bg-white
              p-5
              shadow-sm
              transition
              hover:border-orange-300
              hover:shadow-md
              focus:outline-none
              focus:ring-2
              focus:ring-orange-500
              focus:ring-offset-2
            "
          >

            <div
              className="
                flex
                items-center
                justify-between
                gap-4
              "
            >

              <div>

                <p
                  className="
                    text-sm
                    font-medium
                    text-gray-500
                  "
                >
                  Completed
                </p>


                {loading ? (

                  <div
                    className="
                      mt-2
                      h-8
                      w-12
                      animate-pulse
                      rounded
                      bg-gray-200
                    "
                  />

                ) : (

                  <p
                    className="
                      mt-1
                      text-3xl
                      font-bold
                      text-gray-950
                    "
                  >
                    {
                      completedBookings.length
                    }
                  </p>

                )}

              </div>


              <div
                className="
                  flex
                  h-11
                  w-11
                  items-center
                  justify-center
                  rounded-xl
                  bg-blue-50
                  text-blue-600
                "
              >

                <svg
                  className="h-5 w-5"
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

                  <path d="m8 12 2.5 2.5L16 9" />

                </svg>

              </div>

            </div>


            <p
              className="
                mt-3
                text-xs
                leading-5
                text-gray-500
              "
            >
              Completed photography
              services.
            </p>

          </Link>
        </div>
        </section>


        {/* ==================================
            MAIN DASHBOARD AREA
        ================================== */}

        <div
          className="
            mt-6
            grid
            gap-6
            xl:grid-cols-[minmax(0,1.7fr)_minmax(280px,0.8fr)]
          "
        >


          {/* =================================
              NEXT BOOKING
          ================================= */}

          <section
            className="
              rounded-2xl
              border
              border-gray-200
              bg-white
              p-6
              shadow-sm
            "
          >

            <div
              className="
                flex
                items-start
                justify-between
                gap-4
              "
            >

              <div>

                <p
                  className="
                    text-xs
                    font-semibold
                    uppercase
                    tracking-wider
                    text-gray-400
                  "
                >
                  Next Booking
                </p>


                <h2
                  className="
                    mt-1
                    text-xl
                    font-semibold
                    text-gray-950
                  "
                >
                  Upcoming Photography
                </h2>

              </div>


              <Link
                to="/customer/bookings"
                className="
                  text-sm
                  font-semibold
                  text-orange-600
                  transition
                  hover:text-orange-700
                "
              >
                View all
              </Link>

            </div>


            {loading ? (

              <div
                className="
                  mt-6
                  animate-pulse
                  rounded-2xl
                  border
                  border-gray-100
                  bg-gray-50
                  p-5
                "
              >

                <div
                  className="
                    h-5
                    w-48
                    rounded
                    bg-gray-200
                  "
                />


                <div
                  className="
                    mt-4
                    h-4
                    w-64
                    max-w-full
                    rounded
                    bg-gray-200
                  "
                />


                <div
                  className="
                    mt-3
                    h-4
                    w-40
                    rounded
                    bg-gray-200
                  "
                />

              </div>

            ) : bookingsError ? (

              <div
                className="
                  mt-6
                  rounded-xl
                  border
                  border-red-200
                  bg-red-50
                  px-4
                  py-4
                  text-sm
                  text-red-700
                "
              >
                {bookingsError}
              </div>

            ) : nextBooking ? (

              <div
                className="
                  mt-6
                  rounded-2xl
                  border
                  border-gray-200
                  bg-gray-50/70
                  p-5
                "
              >

                <div
                  className="
                    flex
                    flex-col
                    gap-5
                    sm:flex-row
                    sm:items-start
                    sm:justify-between
                  "
                >

                  <div>

                    <div
                      className="
                        flex
                        items-center
                        gap-3
                      "
                    >

                      <div
                        className="
                          flex
                          h-11
                          w-11
                          shrink-0
                          items-center
                          justify-center
                          rounded-full
                          bg-orange-100
                          font-bold
                          text-orange-700
                        "
                      >

                        {nextBooking
                          .photographer
                          ?.user
                          ?.name
                          ?.charAt(0)
                          ?.toUpperCase() ||
                          "P"}

                      </div>


                      <div>

                        <h3
                          className="
                            font-semibold
                            text-gray-950
                          "
                        >

                          {nextBooking
                            .photographer
                            ?.user
                            ?.name ||
                            "Photographer"}

                        </h3>


                        <p
                          className="
                            mt-0.5
                            text-sm
                            text-gray-500
                          "
                        >
                          Photography booking
                        </p>

                      </div>

                    </div>


                    <div
                      className="
                        mt-5
                        flex
                        flex-wrap
                        gap-x-6
                        gap-y-3
                        text-sm
                        text-gray-600
                      "
                    >

                      <div
                        className="
                          flex
                          items-center
                          gap-2
                        "
                      >

                        <svg
                          className="
                            h-4
                            w-4
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

                        {formatDate(
                          nextBooking.date
                        )}

                      </div>


                      <div
                        className="
                          flex
                          items-center
                          gap-2
                        "
                      >

                        <svg
                          className="
                            h-4
                            w-4
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

                        {nextBooking.startTime}
                        {" — "}
                        {nextBooking.endTime}

                      </div>

                    </div>

                  </div>


                  <span
                    className={`
                      inline-flex
                      w-fit
                      rounded-full
                      border
                      px-3
                      py-1.5
                      text-xs
                      font-semibold
                      ${getStatusClasses(
                        nextBooking.status
                      )}
                    `}
                  >
                    {nextBooking.status}
                  </span>

                </div>


                <div
                  className="
                    mt-5
                    border-t
                    border-gray-200
                    pt-4
                  "
                >

                  <Link
                    to="/customer/bookings"
                    className="
                      inline-flex
                      items-center
                      gap-1
                      text-sm
                      font-semibold
                      text-gray-700
                      transition
                      hover:text-orange-600
                    "
                  >
                    View booking details

                    <span aria-hidden="true">
                      →
                    </span>

                  </Link>

                </div>

              </div>

            ) : (

              <div
                className="
                  mt-6
                  rounded-2xl
                  border
                  border-dashed
                  border-gray-300
                  bg-gray-50
                  px-6
                  py-8
                  text-center
                "
              >

                <div
                  className="
                    mx-auto
                    flex
                    h-11
                    w-11
                    items-center
                    justify-center
                    rounded-xl
                    bg-orange-50
                    text-orange-600
                  "
                >

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

                  </svg>

                </div>


                <h3
                  className="
                    mt-4
                    font-semibold
                    text-gray-950
                  "
                >
                  No upcoming bookings
                </h3>


                <p
                  className="
                    mx-auto
                    mt-2
                    max-w-sm
                    text-sm
                    leading-6
                    text-gray-500
                  "
                >
                  Your upcoming photography
                  bookings will appear here.
                </p>


                <Link
                  to="/photographers"
                  className="
                    mt-4
                    inline-flex
                    text-sm
                    font-semibold
                    text-orange-600
                    hover:text-orange-700
                  "
                >
                  Find a photographer
                </Link>

              </div>

            )}

          </section>


          {/* =================================
              QUICK ACTIONS
          ================================= */}

          <section
            className="
              rounded-2xl
              border
              border-gray-200
              bg-white
              p-6
              shadow-sm
            "
          >

            <p
              className="
                text-xs
                font-semibold
                uppercase
                tracking-wider
                text-gray-400
              "
            >
              Quick Actions
            </p>


            <h2
              className="
                mt-1
                text-xl
                font-semibold
                text-gray-950
              "
            >
              Manage your account
            </h2>


            <div
              className="
                mt-6
                space-y-3
              "
            >


              <Link
                to="/photographers"
                className="
                  group
                  flex
                  items-center
                  justify-between
                  gap-4
                  rounded-xl
                  border
                  border-gray-200
                  px-4
                  py-4
                  transition
                  hover:border-orange-200
                  hover:bg-orange-50/50
                "
              >

                <div>

                  <p
                    className="
                      text-sm
                      font-semibold
                      text-gray-900
                      transition
                      group-hover:text-orange-700
                    "
                  >
                    Find Photographers
                  </p>

                  <p
                    className="
                      mt-1
                      text-xs
                      text-gray-500
                    "
                  >
                    Browse profiles and
                    portfolios.
                  </p>

                </div>


                <span
                  className="
                    text-lg
                    text-gray-400
                    transition
                    group-hover:text-orange-600
                  "
                  aria-hidden="true"
                >
                  →
                </span>

              </Link>


              <Link
                to="/customer/bookings"
                className="
                  group
                  flex
                  items-center
                  justify-between
                  gap-4
                  rounded-xl
                  border
                  border-gray-200
                  px-4
                  py-4
                  transition
                  hover:border-orange-200
                  hover:bg-orange-50/50
                "
              >

                <div>

                  <p
                    className="
                      text-sm
                      font-semibold
                      text-gray-900
                      transition
                      group-hover:text-orange-700
                    "
                  >
                    My Bookings
                  </p>

                  <p
                    className="
                      mt-1
                      text-xs
                      text-gray-500
                    "
                  >
                    View requests, upcoming
                    jobs and history.
                  </p>

                </div>


                <span
                  className="
                    text-lg
                    text-gray-400
                    transition
                    group-hover:text-orange-600
                  "
                  aria-hidden="true"
                >
                  →
                </span>

              </Link>


              <Link
                to="/customer/profile"
                className="
                  group
                  flex
                  items-center
                  justify-between
                  gap-4
                  rounded-xl
                  border
                  border-gray-200
                  px-4
                  py-4
                  transition
                  hover:border-orange-200
                  hover:bg-orange-50/50
                "
              >

                <div>

                  <p
                    className="
                      text-sm
                      font-semibold
                      text-gray-900
                      transition
                      group-hover:text-orange-700
                    "
                  >
                    My Profile
                  </p>

                  <p
                    className="
                      mt-1
                      text-xs
                      text-gray-500
                    "
                  >
                    Update your personal
                    information.
                  </p>

                </div>


                <span
                  className="
                    text-lg
                    text-gray-400
                    transition
                    group-hover:text-orange-600
                  "
                  aria-hidden="true"
                >
                  →
                </span>

              </Link>

            </div>

          </section>

        </div>

        {/* ==================================
            CUSTOMER RENTAL ACTIVITY
        ================================== */}

        <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-orange-600">
                Equipment Rentals
              </p>

              <h2 className="mt-1 text-xl font-semibold text-gray-950">
                My Rental Activity
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Keep track of your recent equipment rental requests.
              </p>
            </div>

            <Link
              to="/customer/rentals"
              className="text-sm font-semibold text-orange-600 hover:text-orange-700"
            >
              View All Rentals →
            </Link>
          </div>

          {rentalsLoading ? (
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-40 animate-pulse rounded-xl bg-gray-100"
                />
              ))}
            </div>
          ) : rentalsError ? (
            <div
              role="alert"
              className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
            >
              {rentalsError}
            </div>
          ) : rentals.length === 0 ? (
            <div className="mt-6 rounded-xl border border-dashed border-gray-300 bg-gray-50 px-6 py-8 text-center">
              <h3 className="font-semibold text-gray-900">
                No equipment rentals yet
              </h3>

              <p className="mt-2 text-sm text-gray-500">
                Explore our camera equipment and submit your first rental request.
              </p>

              <Link
                to="/customer/equipment"
                className="mt-4 inline-flex rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-700"
              >
                Browse Equipment
              </Link>
            </div>
          ) : (
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {[...rentals]
                .sort(
                  (a, b) =>
                    new Date(b.createdAt || b.startDate) -
                    new Date(a.createdAt || a.startDate)
                )
                .slice(0, 3)
                .map((rental) => {
                  const statusColors = {
                    PENDING: "bg-amber-50 text-amber-700",
                    CONFIRMED: "bg-blue-50 text-blue-700",
                    ACTIVE: "bg-green-50 text-green-700",
                    RETURNED: "bg-purple-50 text-purple-700",
                    COMPLETED: "bg-emerald-50 text-emerald-700",
                    REJECTED: "bg-red-50 text-red-700",
                    CANCELLED: "bg-gray-100 text-gray-600",
                  };

                  return (
                    <div
                      key={rental._id}
                      className="flex flex-col rounded-xl border border-gray-200 bg-gray-50/60 p-5 transition hover:border-orange-200"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="truncate font-semibold text-gray-950">
                            {rental.equipment?.name || "Camera Equipment"}
                          </h3>

                          <p className="mt-1 text-xs text-gray-500">
                            {[
                              rental.equipment?.brand,
                              rental.equipment?.model,
                            ]
                              .filter(Boolean)
                              .join(" ") || "Equipment rental"}
                          </p>
                        </div>

                        <span
                          className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                            statusColors[rental.status] ||
                            "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {rental.status}
                        </span>
                      </div>

                      <div className="mt-5 grid grid-cols-2 gap-3 border-t border-gray-200 pt-4">
                        <div>
                          <p className="text-xs text-gray-500">
                            Start Date
                          </p>
                          <p className="mt-1 text-sm font-medium text-gray-900">
                            {rental.startDate
                              ? formatDate(rental.startDate)
                              : "N/A"}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-gray-500">
                            Return Date
                          </p>
                          <p className="mt-1 text-sm font-medium text-gray-900">
                            {rental.endDate
                              ? formatDate(rental.endDate)
                              : "N/A"}
                          </p>
                        </div>
                      </div>

                      <Link
                        to={`/customer/rentals/${rental._id}`}
                        className="mt-5 inline-flex items-center justify-between border-t border-gray-200 pt-4 text-sm font-semibold text-orange-600 hover:text-orange-700"
                      >
                        View Rental Details
                        <span aria-hidden="true">→</span>
                      </Link>
                    </div>
                  );
                })}
            </div>
          )}
        </section>

      </div>

    </main>

  );

};


export default CustomerHome;