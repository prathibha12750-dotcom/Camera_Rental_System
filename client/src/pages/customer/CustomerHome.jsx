import {
  useEffect,
  useState,
} from "react";

import {
  Link,
} from "react-router-dom";

import { useAuth } from "../../context/useAuth";
import api from "../../services/api";


const CustomerHome = () => {

  const { user } = useAuth();


  const [
    bookings,
    setBookings,
  ] = useState([]);


  const [
    photographers,
    setPhotographers,
  ] = useState([]);


  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    bookingsError,
    setBookingsError,
  ] = useState("");


  const [
    photographersError,
    setPhotographersError,
  ] = useState("");


  // ==========================================
  // LOAD DASHBOARD DATA
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

          if (!ignore) {

            setBookingsError(
              err.response?.data
                ?.message ||
                "Unable to load booking information."
            );

          }

        }

      };


    const loadPhotographers =
      async () => {

        try {

          const response =
            await api.get(
              "/customer/photographers"
            );


          if (!ignore) {

            setPhotographers(
              Array.isArray(
                response.data?.data
                  ?.photographers
              )
                ? response.data.data
                    .photographers
                : []
            );

          }

        } catch (err) {

          if (!ignore) {

            setPhotographersError(
              err.response?.data
                ?.message ||
                "Unable to load photographers."
            );

          }

        }

      };


    const loadDashboard =
      async () => {

        await Promise.all([
          loadBookings(),
          loadPhotographers(),
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


  const bookingHistory =
    bookings.filter(
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
    );


  const nextBooking =
    upcomingBookings[0];


  // ==========================================
  // PHOTOGRAPHER PREVIEWS
  // ==========================================

  const featuredPhotographers =
    photographers.slice(
      0,
      3
    );


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
            WELCOME AREA
        ================================== */}

        <section className="
          overflow-hidden
          rounded-3xl
          border
          border-gray-200
          bg-white
          shadow-sm
        ">

          <div className="
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
          ">

            <div className="max-w-2xl">

              <p className="
                text-sm
                font-semibold
                text-orange-600
              ">
                Customer Dashboard
              </p>


              <h1 className="
                mt-2
                text-2xl
                font-bold
                tracking-tight
                text-gray-950
                sm:text-3xl
              ">

                Welcome back,{" "}
                {user?.name?.split(
                  " "
                )[0] || "Customer"}

              </h1>


              <p className="
                mt-2
                text-sm
                leading-6
                text-gray-600
                sm:text-base
              ">
                Find the right photographer
                and keep track of your
                upcoming bookings in one
                place.
              </p>

            </div>


            <Link
              to="/customer/photographers"
              className="
                inline-flex
                shrink-0
                items-center
                justify-center
                gap-2
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

              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="1.8"
                aria-hidden="true"
              >
                <circle
                  cx="11"
                  cy="11"
                  r="7"
                />

                <path d="m20 20-3.5-3.5" />
              </svg>

              Find a Photographer

            </Link>

          </div>

        </section>


        {/* ==================================
            MAIN DASHBOARD AREA
        ================================== */}

        <div className="
          mt-6
          grid
          gap-6
          xl:grid-cols-[minmax(0,1.7fr)_minmax(280px,0.8fr)]
        ">


          {/* ================================
              NEXT BOOKING
          ================================ */}

          <section className="
            rounded-2xl
            border
            border-gray-200
            bg-white
            p-6
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
                  text-xs
                  font-semibold
                  uppercase
                  tracking-wider
                  text-gray-400
                ">
                  Next booking
                </p>


                <h2 className="
                  mt-1
                  text-xl
                  font-semibold
                  text-gray-950
                ">
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
                  focus:outline-none
                  focus-visible:underline
                "
              >
                View all
              </Link>

            </div>


            {loading ? (

              /* ============================
                  BOOKING SKELETON
              ============================ */

              <div className="
                mt-6
                animate-pulse
                rounded-2xl
                border
                border-gray-100
                bg-gray-50
                p-5
              ">

                <div className="
                  h-5
                  w-48
                  rounded
                  bg-gray-200
                " />


                <div className="
                  mt-4
                  h-4
                  w-64
                  max-w-full
                  rounded
                  bg-gray-200
                " />


                <div className="
                  mt-3
                  h-4
                  w-40
                  rounded
                  bg-gray-200
                " />

              </div>

            ) : bookingsError ? (

              <div className="
                mt-6
                rounded-xl
                border
                border-red-200
                bg-red-50
                px-4
                py-4
                text-sm
                text-red-700
              ">
                {bookingsError}
              </div>

            ) : nextBooking ? (

              <div className="
                mt-6
                rounded-2xl
                border
                border-gray-200
                bg-gray-50/70
                p-5
              ">

                <div className="
                  flex
                  flex-col
                  gap-5
                  sm:flex-row
                  sm:items-start
                  sm:justify-between
                ">

                  <div>

                    <div className="
                      flex
                      items-center
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
                        font-bold
                        text-orange-700
                      ">

                        {nextBooking
                          .photographer
                          ?.user
                          ?.name
                          ?.charAt(0)
                          ?.toUpperCase() ||
                          "P"}

                      </div>


                      <div>

                        <h3 className="
                          font-semibold
                          text-gray-950
                        ">

                          {nextBooking
                            .photographer
                            ?.user
                            ?.name ||
                            "Photographer"}

                        </h3>


                        <p className="
                          mt-0.5
                          text-sm
                          text-gray-500
                        ">
                          Photography booking
                        </p>

                      </div>

                    </div>


                    <div className="
                      mt-5
                      flex
                      flex-wrap
                      gap-x-6
                      gap-y-3
                      text-sm
                      text-gray-600
                    ">

                      <div className="
                        flex
                        items-center
                        gap-2
                      ">

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


                      <div className="
                        flex
                        items-center
                        gap-2
                      ">

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


                <div className="
                  mt-5
                  border-t
                  border-gray-200
                  pt-4
                ">

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

              /* ============================
                  EMPTY BOOKING STATE
              ============================ */

              <div className="
                mt-6
                rounded-2xl
                border
                border-dashed
                border-gray-300
                bg-gray-50
                px-6
                py-8
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
                  max-w-sm
                  text-sm
                  leading-6
                  text-gray-500
                ">
                  Your upcoming photography
                  bookings will appear here.
                </p>


                <Link
                  to="/customer/photographers"
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


          {/* ================================
              BOOKING OVERVIEW
          ================================ */}

          <section className="
            rounded-2xl
            border
            border-gray-200
            bg-white
            p-6
            shadow-sm
          ">

            <p className="
              text-xs
              font-semibold
              uppercase
              tracking-wider
              text-gray-400
            ">
              Booking overview
            </p>


            <h2 className="
              mt-1
              text-xl
              font-semibold
              text-gray-950
            ">
              Your activity
            </h2>


            {loading ? (

              <div className="
                mt-6
                space-y-4
                animate-pulse
              ">

                <div className="
                  h-20
                  rounded-xl
                  bg-gray-100
                " />

                <div className="
                  h-20
                  rounded-xl
                  bg-gray-100
                " />

              </div>

            ) : bookingsError ? (

              <p className="
                mt-6
                text-sm
                leading-6
                text-gray-500
              ">
                Booking summary is currently
                unavailable.
              </p>

            ) : (

              <div className="
                mt-6
                grid
                gap-3
                sm:grid-cols-2
                xl:grid-cols-1
              ">

                <div className="
                  rounded-xl
                  border
                  border-gray-200
                  bg-gray-50
                  p-4
                ">

                  <p className="
                    text-2xl
                    font-bold
                    text-gray-950
                  ">
                    {
                      upcomingBookings.length
                    }
                  </p>

                  <p className="
                    mt-1
                    text-sm
                    text-gray-500
                  ">
                    Upcoming bookings
                  </p>

                </div>


                <div className="
                  rounded-xl
                  border
                  border-gray-200
                  bg-gray-50
                  p-4
                ">

                  <p className="
                    text-2xl
                    font-bold
                    text-gray-950
                  ">
                    {
                      bookingHistory.length
                    }
                  </p>

                  <p className="
                    mt-1
                    text-sm
                    text-gray-500
                  ">
                    Booking history
                  </p>

                </div>

              </div>

            )}


            <Link
              to="/customer/bookings"
              className="
                mt-5
                inline-flex
                items-center
                gap-1
                text-sm
                font-semibold
                text-orange-600
                transition
                hover:text-orange-700
              "
            >
              Manage bookings

              <span aria-hidden="true">
                →
              </span>

            </Link>

          </section>

        </div>


        {/* ==================================
            PHOTOGRAPHER DISCOVERY
        ================================== */}

        <section className="mt-8">

          <div className="
            flex
            flex-col
            gap-3
            sm:flex-row
            sm:items-end
            sm:justify-between
          ">

            <div>

              <p className="
                text-xs
                font-semibold
                uppercase
                tracking-wider
                text-orange-600
              ">
                Discover
              </p>


              <h2 className="
                mt-1
                text-2xl
                font-bold
                tracking-tight
                text-gray-950
              ">
                Find your photographer
              </h2>


              <p className="
                mt-2
                text-sm
                leading-6
                text-gray-500
              ">
                Browse professionals and
                explore their portfolios,
                rates and services.
              </p>

            </div>


            <Link
              to="/customer/photographers"
              className="
                inline-flex
                items-center
                gap-1
                text-sm
                font-semibold
                text-orange-600
                transition
                hover:text-orange-700
              "
            >
              View all photographers

              <span aria-hidden="true">
                →
              </span>

            </Link>

          </div>


          {/* ================================
              PHOTOGRAPHER CONTENT
          ================================ */}

          {loading ? (

            <div className="
              mt-5
              grid
              gap-5
              md:grid-cols-2
              xl:grid-cols-3
            ">

              {[1, 2, 3].map(
                (item) => (

                  <div
                    key={item}
                    className="
                      animate-pulse
                      overflow-hidden
                      rounded-2xl
                      border
                      border-gray-200
                      bg-white
                    "
                  >

                    <div className="
                      h-48
                      bg-gray-200
                    " />


                    <div className="p-5">

                      <div className="
                        h-5
                        w-2/3
                        rounded
                        bg-gray-200
                      " />

                      <div className="
                        mt-3
                        h-4
                        w-1/2
                        rounded
                        bg-gray-100
                      " />

                      <div className="
                        mt-5
                        h-4
                        w-1/3
                        rounded
                        bg-gray-100
                      " />

                    </div>

                  </div>

                )
              )}

            </div>

          ) : photographersError ? (

            <div className="
              mt-5
              rounded-xl
              border
              border-red-200
              bg-red-50
              px-4
              py-4
              text-sm
              text-red-700
            ">
              {photographersError}
            </div>

          ) : featuredPhotographers.length ===
            0 ? (

            <div className="
              mt-5
              rounded-2xl
              border
              border-dashed
              border-gray-300
              bg-white
              px-6
              py-10
              text-center
            ">

              <h3 className="
                font-semibold
                text-gray-950
              ">
                No photographers available
              </h3>


              <p className="
                mt-2
                text-sm
                text-gray-500
              ">
                Photographer profiles will
                appear here when they become
                available.
              </p>

            </div>

          ) : (

            <div className="
              mt-5
              grid
              gap-5
              md:grid-cols-2
              xl:grid-cols-3
            ">

              {featuredPhotographers.map(
                (photographer) => (

                  <article
                    key={photographer._id}
                    className="
                      group
                      overflow-hidden
                      rounded-2xl
                      border
                      border-gray-200
                      bg-white
                      shadow-sm
                      transition
                      duration-200
                      hover:-translate-y-0.5
                      hover:shadow-md
                    "
                  >

                    {/* PROFILE IMAGE */}

                    <div className="
                      relative
                      flex
                      h-48
                      items-center
                      justify-center
                      overflow-hidden
                      bg-gray-100
                    ">

                      {photographer.profileImage ? (

                        <img
                          src={
                            photographer.profileImage
                          }
                          alt={
                            photographer.user
                              ?.name ||
                            "Photographer"
                          }
                          className="
                            h-full
                            w-full
                            object-cover
                            transition
                            duration-300
                            group-hover:scale-[1.02]
                          "
                        />

                      ) : (

                        <div className="
                          flex
                          h-20
                          w-20
                          items-center
                          justify-center
                          rounded-full
                          bg-orange-100
                          text-2xl
                          font-bold
                          text-orange-700
                        ">

                          {photographer.user
                            ?.name
                            ?.charAt(0)
                            ?.toUpperCase() ||
                            "P"}

                        </div>

                      )}

                    </div>


                    {/* CONTENT */}

                    <div className="p-5">

                      <h3 className="
                        truncate
                        text-lg
                        font-semibold
                        text-gray-950
                      ">

                        {photographer.user
                          ?.name ||
                          "Photographer"}

                      </h3>


                      <p className="
                        mt-1
                        truncate
                        text-sm
                        font-medium
                        text-orange-600
                      ">

                        {photographer.specialization ||
                          "Photography Services"}

                      </p>


                      <div className="
                        mt-4
                        flex
                        items-end
                        justify-between
                        gap-4
                      ">

                        <div className="min-w-0">

                          {photographer.location && (

                            <p className="
                              truncate
                              text-xs
                              text-gray-500
                            ">
                              {
                                photographer.location
                              }
                            </p>

                          )}


                          <p className="
                            mt-1
                            text-sm
                            font-semibold
                            text-gray-950
                          ">

                            {photographer.hourlyRate !==
                              null &&
                            photographer.hourlyRate !==
                              undefined
                              ? `LKR ${Number(
                                  photographer.hourlyRate
                                ).toLocaleString()} / hr`
                              : "Contact for pricing"}

                          </p>

                        </div>


                        <Link
                          to={`/customer/photographers/${photographer._id}`}
                          className="
                            shrink-0
                            rounded-lg
                            border
                            border-gray-200
                            px-3
                            py-2
                            text-xs
                            font-semibold
                            text-gray-700
                            transition
                            hover:border-orange-200
                            hover:bg-orange-50
                            hover:text-orange-700
                            focus:outline-none
                            focus-visible:ring-2
                            focus-visible:ring-orange-500
                          "
                        >
                          View Profile
                        </Link>

                      </div>

                    </div>

                  </article>

                )
              )}

            </div>

          )}

        </section>

      </div>

    </main>
  );
};


export default CustomerHome;