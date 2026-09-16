import {
  useEffect,
  useState,
} from "react";

import {
  Link,
} from "react-router-dom";

import {
  useAuth,
} from "../../context/useAuth";

import api from "../../services/api";


const PhotographerHome = () => {

  const {
    user,
  } = useAuth();


  const [
    bookings,
    setBookings,
  ] = useState([]);


  const [
    availability,
    setAvailability,
  ] = useState([]);


  const [
    portfolio,
    setPortfolio,
  ] = useState([]);


  const [
    photographer,
    setPhotographer,
  ] = useState(null);


  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    bookingsError,
    setBookingsError,
  ] = useState("");


  const [
    availabilityError,
    setAvailabilityError,
  ] = useState("");


  const [
    portfolioError,
    setPortfolioError,
  ] = useState("");


  const [
    profileError,
    setProfileError,
  ] = useState("");


  // ==========================================
  // LOAD DASHBOARD DATA
  // ==========================================

  useEffect(() => {

    let ignore = false;


    const loadDashboard =
      async () => {

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

                setBookingsError(
                  err.response?.data
                    ?.message ||
                    "Failed to load booking summary."
                );

              }

            }

          };


        const loadAvailability =
          async () => {

            try {

              const response =
                await api.get(
                  "/photographer/availability"
                );


              if (!ignore) {

                setAvailability(
                  Array.isArray(
                    response.data?.data
                      ?.availability
                  )
                    ? response.data.data
                        .availability
                    : []
                );

              }

            } catch (err) {

              console.error(
                "Failed to load photographer availability:",
                err
              );


              if (!ignore) {

                setAvailabilityError(
                  err.response?.data
                    ?.message ||
                    "Failed to load availability summary."
                );

              }

            }

          };


        const loadPortfolio =
          async () => {

            try {

              const response =
                await api.get(
                  "/photographer/portfolio"
                );


              if (!ignore) {

                setPortfolio(
                  Array.isArray(
                    response.data?.data
                      ?.items
                  )
                    ? response.data.data
                        .items
                    : []
                );

              }

            } catch (err) {

              console.error(
                "Failed to load photographer portfolio:",
                err
              );


              if (!ignore) {

                setPortfolioError(
                  err.response?.data
                    ?.message ||
                    "Failed to load portfolio summary."
                );

              }

            }

          };


        const loadProfile =
          async () => {

            try {

              const response =
                await api.get(
                  "/photographer/profile"
                );


              if (!ignore) {

                setPhotographer(
                  response.data?.data
                    ?.photographer ||
                    null
                );

              }

            } catch (err) {

              console.error(
                "Failed to load photographer profile:",
                err
              );


              if (!ignore) {

                setProfileError(
                  err.response?.data
                    ?.message ||
                    "Failed to load profile summary."
                );

              }

            }

          };


        await Promise.all([
          loadBookings(),
          loadAvailability(),
          loadPortfolio(),
          loadProfile(),
        ]);


        if (!ignore) {
          setLoading(false);
        }

      };


    loadDashboard();


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


  const getDateString = (
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
      getDateString(
        value
      );


    return new Date(
      `${dateKey}T00:00:00`
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


  const today =
    getTodayString();


  // ==========================================
  // BOOKING SUMMARY
  // ==========================================

  const pendingRequests =
    bookings
      .filter(
        (booking) =>
          booking.status ===
            "REQUESTED" &&
          getDateString(
            booking.date
          ) >= today
      )
      .sort(
        (a, b) => {

          const dateDifference =
            getDateString(
              a.date
            ).localeCompare(
              getDateString(
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


  const confirmedUpcoming =
    bookings
      .filter(
        (booking) =>
          booking.status ===
            "CONFIRMED" &&
          getDateString(
            booking.date
          ) >= today
      )
      .sort(
        (a, b) => {

          const dateDifference =
            getDateString(
              a.date
            ).localeCompare(
              getDateString(
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


  const nextBooking =
    confirmedUpcoming[0] ||
    null;


  // ==========================================
  // AVAILABILITY SUMMARY
  // ==========================================

  const upcomingAvailability =
    availability
      .filter(
        (slot) =>
          getDateString(
            slot.date
          ) >= today
      )
      .sort(
        (a, b) => {

          const dateDifference =
            getDateString(
              a.date
            ).localeCompare(
              getDateString(
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


  const firstAvailabilitySlots =
    upcomingAvailability.slice(
      0,
      3
    );


  // ==========================================
  // PROFILE COMPLETION
  // ==========================================

  const profileFields = [
    photographer?.bio,
    photographer?.specialization,
    photographer?.location,
    photographer?.hourlyRate,
    photographer?.profileImage,
  ];


  const completedProfileFields =
    profileFields.filter(
      (value) =>
        value !== undefined &&
        value !== null &&
        String(value).trim() !== ""
    ).length;


  const profileCompletion =
    photographer
      ? Math.round(
          (
            completedProfileFields /
            profileFields.length
          ) *
            100
        )
      : 0;


  // ==========================================
  // STATUS BADGE
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


      default:

        return `
          border-gray-200
          bg-gray-50
          text-gray-600
        `;

    }

  };


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
        max-w-7xl
      ">


        {/* ==================================
            HEADER
        ================================== */}

        <div className="
          flex
          flex-col
          gap-4
          sm:flex-row
          sm:items-end
          sm:justify-between
        ">

          <div>

            <p className="
              text-sm
              font-semibold
              text-orange-600
            ">
              Photographer Dashboard
            </p>


            <h1 className="
              mt-1
              text-2xl
              font-bold
              tracking-tight
              text-gray-950
              sm:text-3xl
            ">
              Welcome back,{" "}

              {user?.name
                ?.split(" ")[0] ||
                "Photographer"}
            </h1>


            <p className="
              mt-2
              max-w-2xl
              text-sm
              leading-6
              text-gray-500
            ">
              Review new requests,
              upcoming sessions and
              your current availability.
            </p>

          </div>


          <Link
            to="/photographer/availability"
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
            Manage Availability
          </Link>

        </div>


        {/* ==================================
            SUMMARY STATS
        ================================== */}

        <section className="
          mt-7
          grid
          gap-4
          sm:grid-cols-2
          xl:grid-cols-4
        ">

          {/* PENDING */}

          <Link
            to="/photographer/bookings"
            className="
              rounded-2xl
              border
              border-gray-200
              bg-white
              p-5
              shadow-sm
              transition
              hover:border-orange-200
              hover:shadow-md
            "
          >

            <div className="
              flex
              items-start
              justify-between
              gap-4
            ">

              <div>

                <p className="
                  text-sm
                  font-medium
                  text-gray-500
                ">
                  Pending Requests
                </p>


                {loading ? (

                  <div className="
                    mt-3
                    h-8
                    w-12
                    animate-pulse
                    rounded
                    bg-gray-200
                  " />

                ) : (

                  <p className="
                    mt-2
                    text-3xl
                    font-bold
                    text-gray-950
                  ">
                    {
                      pendingRequests.length
                    }
                  </p>

                )}

              </div>


              <div className="
                flex
                h-10
                w-10
                items-center
                justify-center
                rounded-xl
                bg-amber-50
                text-amber-600
              ">

                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  aria-hidden="true"
                >
                  <path d="M8 10h8M8 14h5" />

                  <rect
                    x="4"
                    y="4"
                    width="16"
                    height="16"
                    rx="2"
                  />
                </svg>

              </div>

            </div>


            <p className="
              mt-3
              text-xs
              text-gray-400
            ">
              Awaiting your response
            </p>

          </Link>


          {/* UPCOMING */}

          <Link
            to="/photographer/bookings"
            className="
              rounded-2xl
              border
              border-gray-200
              bg-white
              p-5
              shadow-sm
              transition
              hover:border-orange-200
              hover:shadow-md
            "
          >

            <div className="
              flex
              items-start
              justify-between
              gap-4
            ">

              <div>

                <p className="
                  text-sm
                  font-medium
                  text-gray-500
                ">
                  Upcoming Bookings
                </p>


                {loading ? (

                  <div className="
                    mt-3
                    h-8
                    w-12
                    animate-pulse
                    rounded
                    bg-gray-200
                  " />

                ) : (

                  <p className="
                    mt-2
                    text-3xl
                    font-bold
                    text-gray-950
                  ">
                    {
                      confirmedUpcoming.length
                    }
                  </p>

                )}

              </div>


              <div className="
                flex
                h-10
                w-10
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
                </svg>

              </div>

            </div>


            <p className="
              mt-3
              text-xs
              text-gray-400
            ">
              Confirmed future sessions
            </p>

          </Link>


          {/* AVAILABILITY */}

          <Link
            to="/photographer/availability"
            className="
              rounded-2xl
              border
              border-gray-200
              bg-white
              p-5
              shadow-sm
              transition
              hover:border-orange-200
              hover:shadow-md
            "
          >

            <div className="
              flex
              items-start
              justify-between
              gap-4
            ">

              <div>

                <p className="
                  text-sm
                  font-medium
                  text-gray-500
                ">
                  Availability Slots
                </p>


                {loading ? (

                  <div className="
                    mt-3
                    h-8
                    w-12
                    animate-pulse
                    rounded
                    bg-gray-200
                  " />

                ) : (

                  <p className="
                    mt-2
                    text-3xl
                    font-bold
                    text-gray-950
                  ">
                    {
                      upcomingAvailability.length
                    }
                  </p>

                )}

              </div>


              <div className="
                flex
                h-10
                w-10
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
                  <path d="M12 3v18M3 12h18" />
                </svg>

              </div>

            </div>


            <p className="
              mt-3
              text-xs
              text-gray-400
            ">
              Current and future availability
            </p>

          </Link>


          {/* PORTFOLIO */}

          <Link
            to="/photographer/portfolio"
            className="
              rounded-2xl
              border
              border-gray-200
              bg-white
              p-5
              shadow-sm
              transition
              hover:border-orange-200
              hover:shadow-md
            "
          >

            <div className="
              flex
              items-start
              justify-between
              gap-4
            ">

              <div>

                <p className="
                  text-sm
                  font-medium
                  text-gray-500
                ">
                  Portfolio Items
                </p>


                {loading ? (

                  <div className="
                    mt-3
                    h-8
                    w-12
                    animate-pulse
                    rounded
                    bg-gray-200
                  " />

                ) : (

                  <p className="
                    mt-2
                    text-3xl
                    font-bold
                    text-gray-950
                  ">
                    {portfolio.length}
                  </p>

                )}

              </div>


              <div className="
                flex
                h-10
                w-10
                items-center
                justify-center
                rounded-xl
                bg-gray-100
                text-gray-600
              ">

                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  aria-hidden="true"
                >
                  <rect
                    x="3"
                    y="4"
                    width="18"
                    height="16"
                    rx="2"
                  />

                  <circle
                    cx="9"
                    cy="10"
                    r="2"
                  />

                  <path d="m21 15-5-5L5 20" />
                </svg>

              </div>

            </div>


            <p className="
              mt-3
              text-xs
              text-gray-400
            ">
              Work visible to customers
            </p>

          </Link>

        </section>


        {/* ==================================
            API SUMMARY ERRORS
        ================================== */}

        {!loading &&
          (
            bookingsError ||
            availabilityError ||
            portfolioError
          ) && (

          <div className="
            mt-5
            rounded-xl
            border
            border-amber-200
            bg-amber-50
            px-4
            py-3
            text-sm
            text-amber-700
          ">
            Some dashboard information
            could not be loaded. You can
            still use the navigation links
            below.
          </div>

        )}


        {/* ==================================
            MAIN DASHBOARD GRID
        ================================== */}

        <div className="
          mt-7
          grid
          gap-6
          xl:grid-cols-[minmax(0,1.45fr)_minmax(300px,0.75fr)]
        ">


          {/* ==================================
              LEFT COLUMN
          ================================== */}

          <div className="
            space-y-6
          ">


            {/* NEXT BOOKING */}

            <section className="
              rounded-2xl
              border
              border-gray-200
              bg-white
              p-5
              shadow-sm
              sm:p-6
            ">

              <div className="
                flex
                items-start
                justify-between
                gap-4
              ">

                <div>

                  <p className="
                    text-sm
                    font-semibold
                    text-orange-600
                  ">
                    Schedule
                  </p>


                  <h2 className="
                    mt-1
                    text-xl
                    font-semibold
                    text-gray-950
                  ">
                    Next Booking
                  </h2>

                </div>


                <Link
                  to="/photographer/bookings"
                  className="
                    text-sm
                    font-semibold
                    text-orange-600
                    hover:text-orange-700
                  "
                >
                  View all
                </Link>

              </div>


              {loading ? (

                <div className="
                  mt-5
                  animate-pulse
                  rounded-xl
                  bg-gray-50
                  p-5
                ">

                  <div className="
                    h-5
                    w-40
                    rounded
                    bg-gray-200
                  " />


                  <div className="
                    mt-3
                    h-4
                    w-52
                    rounded
                    bg-gray-200
                  " />


                  <div className="
                    mt-5
                    h-10
                    rounded
                    bg-gray-100
                  " />

                </div>

              ) : bookingsError ? (

                <div className="
                  mt-5
                  rounded-xl
                  border
                  border-dashed
                  border-gray-300
                  bg-gray-50
                  px-5
                  py-6
                ">

                  <p className="
                    text-sm
                    text-gray-500
                  ">
                    Booking information
                    is currently unavailable.
                  </p>

                </div>

              ) : nextBooking ? (

                <article className="
                  mt-5
                  rounded-xl
                  border
                  border-gray-200
                  bg-gray-50
                  p-5
                ">

                  <div className="
                    flex
                    flex-col
                    gap-4
                    sm:flex-row
                    sm:items-start
                    sm:justify-between
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
                        bg-orange-100
                        text-sm
                        font-bold
                        text-orange-700
                      ">

                        {nextBooking.customer
                          ?.name
                          ?.charAt(0)
                          ?.toUpperCase() ||
                          "C"}

                      </div>


                      <div>

                        <h3 className="
                          font-semibold
                          text-gray-950
                        ">
                          {nextBooking.customer
                            ?.name ||
                            "Customer"}
                        </h3>


                        <p className="
                          mt-1
                          text-sm
                          text-gray-500
                        ">
                          {nextBooking.customer
                            ?.email ||
                            ""}
                        </p>

                      </div>

                    </div>


                    <span
                      className={`
                        inline-flex
                        self-start
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
                      {
                        nextBooking.status
                      }
                    </span>

                  </div>


                  <div className="
                    mt-5
                    grid
                    gap-3
                    sm:grid-cols-2
                  ">

                    <div className="
                      rounded-lg
                      bg-white
                      px-4
                      py-3
                    ">

                      <p className="
                        text-xs
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
                          nextBooking.date
                        )}
                      </p>

                    </div>


                    <div className="
                      rounded-lg
                      bg-white
                      px-4
                      py-3
                    ">

                      <p className="
                        text-xs
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
                        {
                          nextBooking.startTime
                        }

                        {" — "}

                        {
                          nextBooking.endTime
                        }
                      </p>

                    </div>

                  </div>

                </article>

              ) : (

                <div className="
                  mt-5
                  rounded-xl
                  border
                  border-dashed
                  border-gray-300
                  bg-gray-50
                  px-5
                  py-8
                  text-center
                ">

                  <h3 className="
                    font-semibold
                    text-gray-950
                  ">
                    No confirmed upcoming bookings
                  </h3>


                  <p className="
                    mt-2
                    text-sm
                    text-gray-500
                  ">
                    Confirmed future sessions
                    will appear here.
                  </p>

                </div>

              )}

            </section>


            {/* PENDING REQUESTS */}

            <section className="
              rounded-2xl
              border
              border-gray-200
              bg-white
              p-5
              shadow-sm
              sm:p-6
            ">

              <div className="
                flex
                items-start
                justify-between
                gap-4
              ">

                <div>

                  <p className="
                    text-sm
                    font-semibold
                    text-orange-600
                  ">
                    Requests
                  </p>


                  <h2 className="
                    mt-1
                    text-xl
                    font-semibold
                    text-gray-950
                  ">
                    Pending Booking Requests
                  </h2>


                  <p className="
                    mt-1
                    text-sm
                    text-gray-500
                  ">
                    Requests that still need
                    your response.
                  </p>

                </div>


                <Link
                  to="/photographer/bookings"
                  className="
                    shrink-0
                    text-sm
                    font-semibold
                    text-orange-600
                    hover:text-orange-700
                  "
                >
                  Manage
                </Link>

              </div>


              {loading ? (

                <div className="
                  mt-5
                  space-y-3
                ">

                  {[1, 2].map(
                    (item) => (

                      <div
                        key={item}
                        className="
                          h-20
                          animate-pulse
                          rounded-xl
                          bg-gray-100
                        "
                      />

                    )
                  )}

                </div>

              ) : bookingsError ? (

                <p className="
                  mt-5
                  text-sm
                  text-gray-500
                ">
                  Pending requests could
                  not be loaded.
                </p>

              ) : pendingRequests.length >
                0 ? (

                <div className="
                  mt-5
                  divide-y
                  divide-gray-100
                ">

                  {pendingRequests
                    .slice(
                      0,
                      3
                    )
                    .map(
                      (booking) => (

                        <div
                          key={
                            booking._id
                          }
                          className="
                            flex
                            flex-col
                            gap-3
                            py-4
                            first:pt-0
                            last:pb-0
                            sm:flex-row
                            sm:items-center
                            sm:justify-between
                          "
                        >

                          <div className="
                            min-w-0
                          ">

                            <p className="
                              truncate
                              text-sm
                              font-semibold
                              text-gray-950
                            ">
                              {booking.customer
                                ?.name ||
                                "Customer"}
                            </p>


                            <p className="
                              mt-1
                              text-sm
                              text-gray-500
                            ">
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

                          </div>


                          <span className="
                            self-start
                            rounded-full
                            border
                            border-amber-200
                            bg-amber-50
                            px-3
                            py-1.5
                            text-xs
                            font-semibold
                            text-amber-700
                            sm:self-auto
                          ">
                            REQUESTED
                          </span>

                        </div>

                      )
                    )}

                </div>

              ) : (

                <div className="
                  mt-5
                  rounded-xl
                  border
                  border-dashed
                  border-gray-300
                  bg-gray-50
                  px-5
                  py-7
                  text-center
                ">

                  <p className="
                    text-sm
                    text-gray-500
                  ">
                    You have no pending
                    booking requests.
                  </p>

                </div>

              )}

            </section>

          </div>


          {/* ==================================
              RIGHT COLUMN
          ================================== */}

          <div className="
            space-y-6
          ">


            {/* AVAILABILITY */}

            <section className="
              rounded-2xl
              border
              border-gray-200
              bg-white
              p-5
              shadow-sm
            ">

              <div className="
                flex
                items-start
                justify-between
                gap-4
              ">

                <div>

                  <p className="
                    text-sm
                    font-semibold
                    text-orange-600
                  ">
                    Availability
                  </p>


                  <h2 className="
                    mt-1
                    text-lg
                    font-semibold
                    text-gray-950
                  ">
                    Upcoming Schedule
                  </h2>

                </div>


                <Link
                  to="/photographer/availability"
                  className="
                    text-sm
                    font-semibold
                    text-orange-600
                    hover:text-orange-700
                  "
                >
                  Manage
                </Link>

              </div>


              {loading ? (

                <div className="
                  mt-5
                  space-y-3
                ">

                  {[1, 2, 3].map(
                    (item) => (

                      <div
                        key={item}
                        className="
                          h-14
                          animate-pulse
                          rounded-xl
                          bg-gray-100
                        "
                      />

                    )
                  )}

                </div>

              ) : availabilityError ? (

                <p className="
                  mt-5
                  text-sm
                  text-gray-500
                ">
                  Availability information
                  could not be loaded.
                </p>

              ) : firstAvailabilitySlots
                  .length > 0 ? (

                <div className="
                  mt-5
                  space-y-3
                ">

                  {firstAvailabilitySlots.map(
                    (slot) => (

                      <div
                        key={slot._id}
                        className="
                          rounded-xl
                          bg-gray-50
                          px-4
                          py-3
                        "
                      >

                        <p className="
                          text-sm
                          font-semibold
                          text-gray-900
                        ">
                          {formatDate(
                            slot.date
                          )}
                        </p>


                        <p className="
                          mt-1
                          text-xs
                          text-gray-500
                        ">
                          {slot.startTime}
                          {" — "}
                          {slot.endTime}
                        </p>

                      </div>

                    )
                  )}

                </div>

              ) : (

                <div className="
                  mt-5
                  rounded-xl
                  border
                  border-dashed
                  border-gray-300
                  px-4
                  py-6
                  text-center
                ">

                  <p className="
                    text-sm
                    text-gray-500
                  ">
                    No upcoming availability
                    has been added.
                  </p>


                  <Link
                    to="/photographer/availability"
                    className="
                      mt-3
                      inline-flex
                      text-sm
                      font-semibold
                      text-orange-600
                      hover:text-orange-700
                    "
                  >
                    Add availability
                  </Link>

                </div>

              )}

            </section>


            {/* PROFILE COMPLETION */}

            <section className="
              rounded-2xl
              border
              border-gray-200
              bg-white
              p-5
              shadow-sm
            ">

              <div className="
                flex
                items-start
                justify-between
                gap-4
              ">

                <div>

                  <p className="
                    text-sm
                    font-semibold
                    text-orange-600
                  ">
                    Profile
                  </p>


                  <h2 className="
                    mt-1
                    text-lg
                    font-semibold
                    text-gray-950
                  ">
                    Professional Profile
                  </h2>

                </div>


                <Link
                  to="/photographer/profile"
                  className="
                    text-sm
                    font-semibold
                    text-orange-600
                    hover:text-orange-700
                  "
                >
                  Edit
                </Link>

              </div>


              {loading ? (

                <div className="
                  mt-5
                  h-20
                  animate-pulse
                  rounded-xl
                  bg-gray-100
                " />

              ) : profileError ? (

                <div className="
                  mt-5
                  rounded-xl
                  border
                  border-amber-200
                  bg-amber-50
                  px-4
                  py-4
                ">

                  <p className="
                    text-sm
                    text-amber-700
                  ">
                    {profileError}
                  </p>

                </div>

              ) : (

                <>

                  <div className="
                    mt-5
                    flex
                    items-center
                    gap-4
                  ">

                    <div className="
                      flex
                      h-12
                      w-12
                      shrink-0
                      items-center
                      justify-center
                      overflow-hidden
                      rounded-full
                      bg-orange-100
                      text-sm
                      font-bold
                      text-orange-700
                    ">

                      {photographer?.profileImage ? (

                        <img
                          src={
                            photographer.profileImage
                          }
                          alt=""
                          className="
                            h-full
                            w-full
                            object-cover
                          "
                        />

                      ) : (

                        user?.name
                          ?.charAt(0)
                          ?.toUpperCase() ||
                        "P"

                      )}

                    </div>


                    <div className="
                      min-w-0
                    ">

                      <p className="
                        truncate
                        font-semibold
                        text-gray-950
                      ">
                        {photographer?.user
                          ?.name ||
                          user?.name ||
                          "Photographer"}
                      </p>


                      <p className="
                        mt-1
                        truncate
                        text-sm
                        text-gray-500
                      ">
                        {photographer
                          ?.specialization ||
                          "Specialization not added"}
                      </p>

                    </div>

                  </div>


                  <div className="
                    mt-5
                  ">

                    <div className="
                      flex
                      items-center
                      justify-between
                      gap-4
                      text-xs
                    ">

                      <span className="
                        font-medium
                        text-gray-500
                      ">
                        Profile completeness
                      </span>


                      <span className="
                        font-semibold
                        text-gray-800
                      ">
                        {profileCompletion}%
                      </span>

                    </div>


                    <div className="
                      mt-2
                      h-2
                      overflow-hidden
                      rounded-full
                      bg-gray-100
                    ">

                      <div
                        className="
                          h-full
                          rounded-full
                          bg-orange-500
                          transition-all
                        "
                        style={{
                          width:
                            `${profileCompletion}%`,
                        }}
                      />

                    </div>

                  </div>

                </>

              )}

            </section>


            {/* QUICK ACTIONS */}

            <section className="
              rounded-2xl
              border
              border-gray-200
              bg-white
              p-5
              shadow-sm
            ">

              <h2 className="
                text-lg
                font-semibold
                text-gray-950
              ">
                Quick Actions
              </h2>


              <div className="
                mt-4
                space-y-2
              ">

                <Link
                  to="/photographer/bookings"
                  className="
                    flex
                    items-center
                    justify-between
                    gap-4
                    rounded-xl
                    px-3
                    py-3
                    text-sm
                    font-medium
                    text-gray-700
                    transition
                    hover:bg-gray-50
                    hover:text-gray-950
                  "
                >

                  <span>
                    Manage bookings
                  </span>

                  <span
                    aria-hidden="true"
                    className="
                      text-gray-400
                    "
                  >
                    →
                  </span>

                </Link>


                <Link
                  to="/photographer/availability"
                  className="
                    flex
                    items-center
                    justify-between
                    gap-4
                    rounded-xl
                    px-3
                    py-3
                    text-sm
                    font-medium
                    text-gray-700
                    transition
                    hover:bg-gray-50
                    hover:text-gray-950
                  "
                >

                  <span>
                    Update availability
                  </span>

                  <span
                    aria-hidden="true"
                    className="
                      text-gray-400
                    "
                  >
                    →
                  </span>

                </Link>


                <Link
                  to="/photographer/portfolio"
                  className="
                    flex
                    items-center
                    justify-between
                    gap-4
                    rounded-xl
                    px-3
                    py-3
                    text-sm
                    font-medium
                    text-gray-700
                    transition
                    hover:bg-gray-50
                    hover:text-gray-950
                  "
                >

                  <span>
                    Manage portfolio
                  </span>

                  <span
                    aria-hidden="true"
                    className="
                      text-gray-400
                    "
                  >
                    →
                  </span>

                </Link>


                <Link
                  to="/photographer/profile"
                  className="
                    flex
                    items-center
                    justify-between
                    gap-4
                    rounded-xl
                    px-3
                    py-3
                    text-sm
                    font-medium
                    text-gray-700
                    transition
                    hover:bg-gray-50
                    hover:text-gray-950
                  "
                >

                  <span>
                    Edit profile
                  </span>

                  <span
                    aria-hidden="true"
                    className="
                      text-gray-400
                    "
                  >
                    →
                  </span>

                </Link>

              </div>

            </section>

          </div>

        </div>

      </div>

    </main>
  );

};


export default PhotographerHome;