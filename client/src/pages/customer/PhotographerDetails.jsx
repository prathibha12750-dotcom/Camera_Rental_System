import {
  useEffect,
  useState,
} from "react";

import {
  Link,
  useLocation,
  useParams,
} from "react-router-dom";

import { useAuth } from "../../context/useAuth";
import api from "../../services/api";


const PhotographerDetails = () => {

  const {
    id,
  } = useParams();


  const location = useLocation();

  const {
    user,
    isAuthenticated,
  } = useAuth();

  const photographerBasePath =
    location.pathname.startsWith(
      "/customer"
    )
      ? "/customer/photographers"
      : "/photographers";

  const dashboardRoutes = {
    CUSTOMER: "/customer",
    PHOTOGRAPHER: "/photographer",
    STAFF_ADMIN: "/admin",
  };

  let bookingLink = "/login";
  let bookingText = "Login to Book";

  if (
    isAuthenticated &&
    user?.role === "CUSTOMER"
  ) {
    bookingLink =
      `/customer/photographers/${id}/book`;

    bookingText =
      "Book Photographer";
  } else if (
    isAuthenticated &&
    user?.role !== "CUSTOMER"
  ) {
    bookingLink =
      dashboardRoutes[user?.role] || "/";

    bookingText =
      "Go to Dashboard";
  }


  const [
    photographer,
    setPhotographer,
  ] = useState(null);

  const [
    portfolio,
    setPortfolio,
  ] = useState([]);

  const [
    availability,
    setAvailability,
  ] = useState([]);

  const [
    busyPeriods,
    setBusyPeriods,
  ] = useState([]);

  // ==========================================
  // CUSTOMER AVAILABILITY CALENDAR
  // ==========================================

  const [
    calendarMonth,
    setCalendarMonth,
  ] = useState(() => {
    const today = new Date();

    return new Date(
      today.getFullYear(),
      today.getMonth(),
      1
    );
  });

  const [
    selectedAvailabilityDate,
    setSelectedAvailabilityDate,
  ] = useState(null);

  const [
    reviews,
    setReviews,
  ] = useState([]);


  const [
    reviewCount,
    setReviewCount,
  ] = useState(0);


  const [
    averageRating,
    setAverageRating,
  ] = useState(0);


  const [
    reviewsLoading,
    setReviewsLoading,
  ] = useState(true);

  const [
    visiblePortfolioCount,
    setVisiblePortfolioCount,
  ] = useState(6);

  const [
    visibleReviewCount,
    setVisibleReviewCount,
  ] = useState(3);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");


  // ==========================================
  // LOAD DETAILS
  // ==========================================

  useEffect(() => {

    let ignore = false;


    const loadDetails =
      async () => {

        try {

          const response =
            await api.get(
              `/customer/photographers/${id}`
            );


          if (!ignore) {

            setPhotographer(
              response.data?.data
                ?.photographer ||
                null
            );


            setPortfolio(
              Array.isArray(
                response.data?.data
                  ?.portfolio
              )
                ? response.data.data
                    .portfolio
                : []
            );


            setAvailability(
              Array.isArray(
                response.data?.data
                  ?.availability
              )
                ? response.data.data
                    .availability
                : []
            );


            setBusyPeriods(
              Array.isArray(
                response.data?.data
                  ?.busyPeriods
              )
                ? response.data.data
                    .busyPeriods
                : []
            );

          }

        } catch (err) {

          console.error(
            "Failed to load photographer details:",
            err
          );


          if (!ignore) {

            setError(
              err.response?.data
                ?.message ||
                "Failed to load photographer details."
            );

          }

        } finally {

          if (!ignore) {
            setLoading(false);
          }

        }

      };


    loadDetails();


    return () => {
      ignore = true;
    };

  }, [id]);


  // ==========================================
  // LOAD PUBLIC PHOTOGRAPHER REVIEWS
  // ==========================================

  useEffect(() => {

    let ignore = false;


    const loadReviews =
      async () => {

        try {

          const response =
            await api.get(
              `/customer/photographers/${id}/reviews`
            );


          if (!ignore) {

            const data =
              response.data?.data;


            setReviews(
              Array.isArray(
                data?.reviews
              )
                ? data.reviews
                : []
            );


            setReviewCount(
              Number(
                data?.reviewCount
              ) || 0
            );


            setAverageRating(
              Number(
                data?.averageRating
              ) || 0
            );

          }

        } catch (err) {

          console.error(
            "Failed to load reviews:",
            err
          );


          if (!ignore) {

            setReviews([]);
            setReviewCount(0);
            setAverageRating(0);

          }

        } finally {

          if (!ignore) {
            setReviewsLoading(false);
          }

        }

      };


    loadReviews();


    return () => {
      ignore = true;
    };

  }, [id]);


  // ==========================================
  // DATE FORMAT
  // ==========================================

  const visiblePortfolio =
    portfolio.slice(
      0,
      visiblePortfolioCount
    );

  const visibleReviews =
    reviews.slice(
      0,
      visibleReviewCount
    );


  // ==========================================
  // CALENDAR HELPERS
  // ==========================================

  const getDateKey = (value) => {
    if (!value) {
      return "";
    }

    const date = new Date(value);

    const year = date.getFullYear();

    const month = String(
      date.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
      date.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };


  const getLocalDateKey = (
    year,
    month,
    day
  ) => {

    const monthValue = String(
      month + 1
    ).padStart(2, "0");

    const dayValue = String(
      day
    ).padStart(2, "0");

    return (
      `${year}-${monthValue}-${dayValue}`
    );
  };


  const calendarYear =
    calendarMonth.getFullYear();

  const calendarMonthIndex =
    calendarMonth.getMonth();


  const daysInCalendarMonth =
    new Date(
      calendarYear,
      calendarMonthIndex + 1,
      0
    ).getDate();


  const firstDayOfCalendarMonth =
    new Date(
      calendarYear,
      calendarMonthIndex,
      1
    ).getDay();


  const calendarMonthLabel =
    calendarMonth.toLocaleDateString(
      undefined,
      {
        month: "long",
        year: "numeric",
      }
    );

    const timeToMinutes = (
      time
    ) => {

      if (!time) {
        return 0;
      }

      const [
        hours,
        minutes,
      ] = time
        .split(":")
        .map(Number);

      return (
        hours * 60 +
        minutes
      );
    };

  const getRemainingSlots = (
    availabilitySlot,
    dateBusyPeriods
  ) => {

    let remaining = [
      {
        startTime:
          availabilitySlot.startTime,

        endTime:
          availabilitySlot.endTime,

        sourceId:
          availabilitySlot._id,
      },
    ];


    dateBusyPeriods.forEach(
      (busy) => {

        const busyStart =
          timeToMinutes(
            busy.startTime
          );

        const busyEnd =
          timeToMinutes(
            busy.endTime
          );


        const nextRemaining = [];


        remaining.forEach(
          (slot) => {

            const slotStart =
              timeToMinutes(
                slot.startTime
              );

            const slotEnd =
              timeToMinutes(
                slot.endTime
              );


            // No overlap

            if (
              busyEnd <= slotStart ||
              busyStart >= slotEnd
            ) {

              nextRemaining.push(
                slot
              );

              return;
            }


            // Available time before
            // the busy period

            if (
              busyStart >
              slotStart
            ) {

              nextRemaining.push({
                startTime:
                  slot.startTime,

                endTime:
                  busy.startTime,

                sourceId:
                  slot.sourceId,
              });
            }


            // Available time after
            // the busy period

            if (
              busyEnd <
              slotEnd
            ) {

              nextRemaining.push({
                startTime:
                  busy.endTime,

                endTime:
                  slot.endTime,

                sourceId:
                  slot.sourceId,
              });
            }

          }
        );


        remaining =
          nextRemaining;

      }
    );


    return remaining;
  };


const availabilityByDate =
  availability.reduce(
    (result, slot) => {

      const dateKey =
        getDateKey(
          slot.date
        );


      if (!dateKey) {
        return result;
      }


      const busyForDate =
        busyPeriods.filter(
          (busy) =>
            getDateKey(
              busy.date
            ) === dateKey
        );


      const remainingSlots =
        getRemainingSlots(
          slot,
          busyForDate
        );


      if (
        remainingSlots.length ===
        0
      ) {
        return result;
      }


      if (!result[dateKey]) {
        result[dateKey] = [];
      }


      remainingSlots.forEach(
        (
          remainingSlot,
          index
        ) => {

          result[
            dateKey
          ].push({
            ...remainingSlot,

            _id:
              `${slot._id}-${index}`,
          });

        }
      );


      return result;

    },
    {}
  );


  const selectedSlots =
    selectedAvailabilityDate
      ? availabilityByDate[
          selectedAvailabilityDate
        ] || []
      : [];


  const goToPreviousMonth = () => {

    const today = new Date();

    const currentMonthStart =
      new Date(
        today.getFullYear(),
        today.getMonth(),
        1
      );

    if (
      calendarMonth <=
      currentMonthStart
    ) {
      return;
    }

    setCalendarMonth(
      new Date(
        calendarYear,
        calendarMonthIndex - 1,
        1
      )
    );

    setSelectedAvailabilityDate(
      null
    );
  };


  const goToNextMonth = () => {

    setCalendarMonth(
      new Date(
        calendarYear,
        calendarMonthIndex + 1,
        1
      )
    );

    setSelectedAvailabilityDate(
      null
    );
  };


  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {

    return (
      <main className="
        min-h-[calc(100vh-4rem)]
        bg-gray-50
        px-4
        py-6
        sm:px-6
        lg:px-8
      ">

        <div className="
          mx-auto
          max-w-7xl
          animate-pulse
        ">

          <div className="
            h-5
            w-40
            rounded
            bg-gray-200
          " />


          <div className="
            mt-6
            rounded-3xl
            border
            border-gray-200
            bg-white
            p-6
            sm:p-8
          ">

            <div className="
              flex
              flex-col
              gap-6
              md:flex-row
            ">

              <div className="
                h-44
                w-full
                rounded-2xl
                bg-gray-200
                sm:w-44
              " />


              <div className="
                flex-1
                space-y-4
              ">

                <div className="
                  h-4
                  w-28
                  rounded
                  bg-gray-200
                " />

                <div className="
                  h-8
                  w-64
                  max-w-full
                  rounded
                  bg-gray-200
                " />

                <div className="
                  h-5
                  w-48
                  rounded
                  bg-gray-100
                " />

                <div className="
                  h-12
                  w-40
                  rounded-xl
                  bg-gray-100
                " />

              </div>

            </div>

          </div>

        </div>

      </main>
    );

  }


  // ==========================================
  // ERROR
  // ==========================================

  if (
    error ||
    !photographer
  ) {

    return (
      <main className="
        min-h-[calc(100vh-4rem)]
        bg-gray-50
        px-4
        py-10
        sm:px-6
      ">

        <div className="
          mx-auto
          max-w-2xl
          rounded-2xl
          border
          border-red-200
          bg-white
          p-8
          shadow-sm
        ">

          <p className="
            text-sm
            font-semibold
            text-red-600
          ">
            Unable to load profile
          </p>


          <h1 className="
            mt-2
            text-2xl
            font-bold
            text-gray-950
          ">
            Photographer unavailable
          </h1>


          <p className="
            mt-3
            text-sm
            leading-6
            text-gray-600
          ">
            {error ||
              "Photographer not found."}
          </p>


          <Link
            to={photographerBasePath}
            className="
              mt-6
              inline-flex
              rounded-xl
              bg-gray-950
              px-5
              py-3
              text-sm
              font-semibold
              text-white
              transition
              hover:bg-orange-600
            "
          >
            //Back to Photographers
          </Link>

        </div>

      </main>
    );

  }


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
            BACK NAVIGATION
        ================================== */}

        <Link
          to={photographerBasePath}
          className="
            inline-flex
            items-center
            gap-2
            text-sm
            font-medium
            text-gray-500
            transition
            hover:text-gray-950
          "
        >

          <span aria-hidden="true">
            ←
          </span>

          Back to Photographers

        </Link>


        {/* ==================================
            PROFILE HEADER
        ================================== */}

        <section className="
          mt-5
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
            gap-7
            p-6
            sm:p-8
            lg:flex-row
            lg:items-center
          ">


            {/* IMAGE */}

            <div className="
              shrink-0
              overflow-hidden
              rounded-2xl
              bg-gray-100
              lg:h-52
              lg:w-52
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
                    aspect-square
                    h-full
                    w-full
                    object-cover
                  "
                />

              ) : (

                <div className="
                  flex
                  aspect-square
                  h-full
                  min-h-48
                  w-full
                  items-center
                  justify-center
                  bg-gradient-to-br
                  from-orange-50
                  to-gray-100
                  text-5xl
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


            {/* MAIN PROFILE INFO */}

            <div className="
              min-w-0
              flex-1
            ">

              <p className="
                text-sm
                font-semibold
                text-orange-600
              ">
                Professional Photographer
              </p>


              <h1 className="
                mt-2
                text-3xl
                font-bold
                tracking-tight
                text-gray-950
                sm:text-4xl
              ">

                {photographer.user
                  ?.name ||
                  "Photographer"}

              </h1>


              <p className="
                mt-2
                text-base
                font-medium
                text-gray-600
                sm:text-lg
              ">

                {photographer.specialization ||
                  "Photography Services"}

              </p>


              {photographer.location && (

                <div className="
                  mt-4
                  flex
                  items-center
                  gap-2
                  text-sm
                  text-gray-500
                ">

                  <svg
                    className="
                      h-5
                      w-5
                      shrink-0
                    "
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    aria-hidden="true"
                  >
                    <path d="M12 21s6-5.1 6-11a6 6 0 1 0-12 0c0 5.9 6 11 6 11Z" />

                    <circle
                      cx="12"
                      cy="10"
                      r="2"
                    />
                  </svg>

                  {
                    photographer.location
                  }

                </div>

              )}


                <div
                  className="
                    mt-3
                    flex
                    flex-wrap
                    items-center
                    gap-2
                  "
                >

                  <div
                    className="
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
                            Math.round(
                              averageRating
                            )
                              ? "text-amber-400"
                              : "text-gray-300"
                          }
                        >
                          ★
                        </span>

                      )
                    )}

                  </div>


                  {reviewCount > 0 ? (

                    <span
                      className="
                        text-sm
                        font-medium
                        text-gray-600
                      "
                    >
                      {averageRating.toFixed(1)}
                      {" "}
                      ({reviewCount}
                      {" "}
                      {reviewCount === 1
                        ? "review"
                        : "reviews"})
                    </span>

                  ) : (

                    <span
                      className="
                        text-sm
                        text-gray-500
                      "
                    >
                      No reviews yet
                    </span>

                  )}

                </div>


              <div className="
                mt-6
                flex
                flex-col
                gap-4
                sm:flex-row
                sm:items-end
                sm:justify-between
              ">

                <div>

                  <p className="
                    text-xs
                    font-medium
                    uppercase
                    tracking-wider
                    text-gray-400
                  ">
                    Hourly rate
                  </p>


                  <p className="
                    mt-1
                    text-2xl
                    font-bold
                    text-gray-950
                  ">

                    {photographer.hourlyRate !==
                      null &&
                    photographer.hourlyRate !==
                      undefined
                      ? `LKR ${Number(
                          photographer.hourlyRate
                        ).toLocaleString()}`
                      : "Contact for pricing"}

                  </p>

                </div>


                <Link
                  to={bookingLink}
                  className="
                    inline-flex
                    items-center
                    justify-center
                    rounded-xl
                    bg-orange-600
                    px-6
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
                  {bookingText}
                </Link>

              </div>

            </div>

          </div>

        </section>


        {/* ==================================
            ABOUT
        ================================== */}

        <section className="
          mt-8
          border-b
          border-gray-200
          pb-8
        ">

          <div className="
            max-w-3xl
          ">

            <p className="
              text-xs
              font-semibold
              uppercase
              tracking-wider
              text-orange-600
            ">
              About
            </p>


            <h2 className="
              mt-1
              text-2xl
              font-bold
              text-gray-950
            ">
              About this photographer
            </h2>


            <p className="
              mt-4
              whitespace-pre-line
              text-sm
              leading-7
              text-gray-600
            ">

              {photographer.bio ||
                "This photographer has not added a professional biography yet."}

            </p>

          </div>

        </section>


        {/* ==================================
            PACKAGES
        ================================== */}

        <section className="mt-8">

          <div>

            <p className="
              text-xs
              font-semibold
              uppercase
              tracking-wider
              text-orange-600
            ">
              Pricing
            </p>


            <h2 className="
              mt-1
              text-2xl
              font-bold
              text-gray-950
            ">
              Photography Packages
            </h2>


            <p className="
              mt-2
              text-sm
              text-gray-500
            ">
              Available service packages
              offered by this photographer.
            </p>

          </div>


          {photographer
            .packageRates
            ?.length > 0 ? (

            <div className="
              mt-5
              grid
              gap-4
              md:grid-cols-2
              xl:grid-cols-3
            ">

              {photographer.packageRates.map(
                (pkg) => (

                  <article
                    key={
                      pkg._id ||
                      pkg.name
                    }
                    className="
                      rounded-2xl
                      border
                      border-gray-200
                      bg-white
                      p-5
                      shadow-sm
                    "
                  >

                    <div className="
                      flex
                      items-start
                      justify-between
                      gap-4
                    ">

                      <h3 className="
                        font-semibold
                        text-gray-950
                      ">
                        {pkg.name}
                      </h3>


                      <p className="
                        shrink-0
                        font-bold
                        text-orange-600
                      ">

                        LKR{" "}

                        {Number(
                          pkg.price
                        ).toLocaleString()}

                      </p>

                    </div>


                    {pkg.description && (

                      <p className="
                        mt-3
                        text-sm
                        leading-6
                        text-gray-500
                      ">
                        {
                          pkg.description
                        }
                      </p>

                    )}

                  </article>

                )
              )}

            </div>

          ) : (

            <div className="
              mt-5
              rounded-2xl
              border
              border-dashed
              border-gray-300
              bg-white
              px-5
              py-7
            ">

              <p className="
                text-sm
                text-gray-500
              ">
                No photography packages
                have been added yet.
              </p>

            </div>

          )}

        </section>


        {/* ==================================
            PORTFOLIO
        ================================== */}

        <section className="mt-10">

          <div>

            <p className="
              text-xs
              font-semibold
              uppercase
              tracking-wider
              text-orange-600
            ">
              Work
            </p>


            <h2 className="
              mt-1
              text-2xl
              font-bold
              text-gray-950
            ">
              Portfolio
            </h2>


            <p className="
              mt-2
              text-sm
              text-gray-500
            ">
              A selection of this
              photographer's previous work.
            </p>

          </div>


          {portfolio.length >
            visiblePortfolioCount && (

            <div className="
              mt-6
              flex
              justify-center
            ">

              <button
                type="button"
                onClick={() =>
                  setVisiblePortfolioCount(
                    (previous) =>
                      previous + 6
                  )
                }
                className="
                  rounded-xl
                  border
                  border-gray-200
                  bg-white
                  px-5
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
                Show More
              </button>

            </div>

          )}


          {portfolio.length ===
          0 ? (

            <div className="
              mt-5
              rounded-2xl
              border
              border-dashed
              border-gray-300
              bg-white
              px-6
              py-9
              text-center
            ">

              <p className="
                text-sm
                text-gray-500
              ">
                No portfolio items are
                available yet.
              </p>

            </div>

          ) : (

            <div className="
              mt-5
              grid
              gap-5
              sm:grid-cols-2
              xl:grid-cols-3
            ">

              {visiblePortfolio.map(
                (item) => (

                  <article
                    key={item._id}
                    className="
                      group
                      overflow-hidden
                      rounded-2xl
                      border
                      border-gray-200
                      bg-white
                      shadow-sm
                    "
                  >

                    <div className="
                      aspect-[4/3]
                      overflow-hidden
                      bg-gray-100
                    ">

                      <img
                        src={
                          item.imageUrl
                        }
                        alt={
                          item.title ||
                          "Portfolio work"
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

                    </div>


                    <div className="p-5">

                      <h3 className="
                        font-semibold
                        text-gray-950
                      ">
                        {item.title}
                      </h3>


                      {item.description && (

                        <p className="
                          mt-2
                          line-clamp-3
                          text-sm
                          leading-6
                          text-gray-500
                        ">
                          {
                            item.description
                          }
                        </p>

                      )}

                    </div>

                  </article>

                )
              )}

            </div>

          )}

        </section>


        {/* ==================================
            AVAILABILITY CALENDAR
        ================================== */}

        <section className="mt-10">

          <div>

            <p className="
              text-xs
              font-semibold
              uppercase
              tracking-wider
              text-orange-600
            ">
              Schedule
            </p>


            <h2 className="
              mt-1
              text-2xl
              font-bold
              text-gray-950
            ">
              Upcoming Availability
            </h2>


            <p className="
              mt-2
              text-sm
              text-gray-500
            ">
              Select an available date to view
              the photographer&apos;s available
              time slots.
            </p>

          </div>


          {availability.length === 0 ? (

            <div className="
              mt-5
              rounded-2xl
              border
              border-dashed
              border-gray-300
              bg-white
              px-6
              py-9
              text-center
            ">

              <p className="
                text-sm
                text-gray-500
              ">
                This photographer has no
                upcoming availability listed.
              </p>

            </div>

          ) : (

            <div className="
              mt-5
              grid
              gap-5
              lg:grid-cols-[minmax(0,1.3fr)_minmax(280px,0.7fr)]
            ">

              {/* CALENDAR */}

              <div className="
                rounded-2xl
                border
                border-gray-200
                bg-white
                p-5
                shadow-sm
                sm:p-6
              ">

                {/* MONTH NAVIGATION */}

                <div className="
                  flex
                  items-center
                  justify-between
                  gap-4
                ">

                  <button
                    type="button"
                    onClick={
                      goToPreviousMonth
                    }
                    className="
                      flex
                      h-10
                      w-10
                      items-center
                      justify-center
                      rounded-xl
                      border
                      border-gray-200
                      text-lg
                      text-gray-600
                      transition
                      hover:border-orange-300
                      hover:bg-orange-50
                      hover:text-orange-700
                    "
                    aria-label="Previous month"
                  >
                    ←
                  </button>


                  <h3 className="
                    text-base
                    font-bold
                    text-gray-950
                    sm:text-lg
                  ">
                    {calendarMonthLabel}
                  </h3>


                  <button
                    type="button"
                    onClick={
                      goToNextMonth
                    }
                    className="
                      flex
                      h-10
                      w-10
                      items-center
                      justify-center
                      rounded-xl
                      border
                      border-gray-200
                      text-lg
                      text-gray-600
                      transition
                      hover:border-orange-300
                      hover:bg-orange-50
                      hover:text-orange-700
                    "
                    aria-label="Next month"
                  >
                    →
                  </button>

                </div>


                {/* WEEKDAY HEADINGS */}

                <div className="
                  mt-6
                  grid
                  grid-cols-7
                  gap-1
                ">

                  {[
                    "Sun",
                    "Mon",
                    "Tue",
                    "Wed",
                    "Thu",
                    "Fri",
                    "Sat",
                  ].map((day) => (

                    <div
                      key={day}
                      className="
                        py-2
                        text-center
                        text-xs
                        font-semibold
                        text-gray-400
                      "
                    >
                      {day}
                    </div>

                  ))}

                </div>


                {/* CALENDAR DAYS */}

                <div className="
                  grid
                  grid-cols-7
                  gap-1
                ">

                  {Array.from({
                    length:
                      firstDayOfCalendarMonth,
                  }).map((_, index) => (

                    <div
                      key={`empty-${index}`}
                      className="aspect-square"
                    />

                  ))}


                  {Array.from({
                    length:
                      daysInCalendarMonth,
                  }).map((_, index) => {

                    const day =
                      index + 1;

                    const dateKey =
                      getLocalDateKey(
                        calendarYear,
                        calendarMonthIndex,
                        day
                      );

                    const daySlots =
                      availabilityByDate[
                        dateKey
                      ] || [];

                    const isAvailable =
                      daySlots.length > 0;

                    const isSelected =
                      selectedAvailabilityDate ===
                      dateKey;

                    const today =
                      new Date();

                    const dateValue =
                      new Date(
                        calendarYear,
                        calendarMonthIndex,
                        day
                      );

                    const todayStart =
                      new Date(
                        today.getFullYear(),
                        today.getMonth(),
                        today.getDate()
                      );

                    const isPast =
                      dateValue <
                      todayStart;


                    return (

                      <button
                        key={dateKey}
                        type="button"
                        disabled={
                          !isAvailable ||
                          isPast
                        }
                        onClick={() =>
                          setSelectedAvailabilityDate(
                            dateKey
                          )
                        }
                        className={`
                          relative
                          flex
                          aspect-square
                          items-center
                          justify-center
                          rounded-xl
                          text-sm
                          font-medium
                          transition

                          ${
                            isSelected
                              ? "bg-orange-600 text-white shadow-sm"
                              : isAvailable &&
                                !isPast
                              ? "bg-green-50 text-green-700 hover:bg-green-100"
                              : "text-gray-400"
                          }

                          ${
                            !isAvailable ||
                            isPast
                              ? "cursor-default"
                              : "cursor-pointer"
                          }
                        `}
                      >

                        {day}


                        {isAvailable &&
                          !isPast &&
                          !isSelected && (

                          <span className="
                            absolute
                            bottom-1.5
                            h-1.5
                            w-1.5
                            rounded-full
                            bg-green-500
                          " />

                        )}

                      </button>

                    );

                  })}

                </div>


                {/* LEGEND */}

                <div className="
                  mt-5
                  flex
                  flex-wrap
                  items-center
                  gap-4
                  border-t
                  border-gray-100
                  pt-4
                ">

                  <div className="
                    flex
                    items-center
                    gap-2
                    text-xs
                    text-gray-500
                  ">

                    <span className="
                      h-3
                      w-3
                      rounded-full
                      bg-green-100
                      ring-1
                      ring-green-300
                    " />

                    Available

                  </div>


                  <div className="
                    flex
                    items-center
                    gap-2
                    text-xs
                    text-gray-500
                  ">

                    <span className="
                      h-3
                      w-3
                      rounded-full
                      bg-orange-600
                    " />

                    Selected

                  </div>

                </div>

              </div>


              {/* SELECTED DATE / TIME SLOTS */}

              <div className="
                rounded-2xl
                border
                border-gray-200
                bg-white
                p-5
                shadow-sm
                sm:p-6
              ">

                <p className="
                  text-xs
                  font-semibold
                  uppercase
                  tracking-wider
                  text-orange-600
                ">
                  Available Times
                </p>


                {!selectedAvailabilityDate ? (

                  <div className="
                    mt-5
                    rounded-xl
                    border
                    border-dashed
                    border-gray-200
                    bg-gray-50
                    px-5
                    py-8
                    text-center
                  ">

                    <p className="
                      text-sm
                      font-medium
                      text-gray-700
                    ">
                      Select an available date
                    </p>

                    <p className="
                      mt-2
                      text-xs
                      leading-5
                      text-gray-500
                    ">
                      Dates highlighted in green
                      have available photography
                      time slots.
                    </p>

                  </div>

                ) : (

                  <>

                    <h3 className="
                      mt-2
                      text-lg
                      font-bold
                      text-gray-950
                    ">

                      {new Date(
                        `${selectedAvailabilityDate}T00:00:00`
                      ).toLocaleDateString(
                        undefined,
                        {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        }
                      )}

                    </h3>


                    <div className="
                      mt-5
                      space-y-3
                    ">

                      {selectedSlots.map(
                        (slot, index) => (
                          <div
                            key={
                              slot._id ||
                              `${slot.startTime}-${slot.endTime}-${index}`
                            }
                            className="
                              flex
                              flex-col
                              gap-3
                              rounded-xl
                              border
                              border-green-200
                              bg-green-50
                              p-4
                              sm:flex-row
                              sm:items-center
                              sm:justify-between
                            "
                          >
                            <div>
                              <p className="
                                text-xs
                                font-semibold
                                uppercase
                                tracking-wide
                                text-green-600
                              ">
                                Available
                              </p>

                              <p className="
                                mt-1
                                text-sm
                                font-semibold
                                text-green-900
                              ">
                                {slot.startTime}
                                {" — "}
                                {slot.endTime}
                              </p>
                            </div>

                            <Link
                              to={bookingLink}
                              state={{
                                preselectedBooking: {
                                  date:
                                    selectedAvailabilityDate,

                                  startTime:
                                    slot.startTime,

                                  endTime:
                                    slot.endTime,
                                },
                              }}
                              className="
                                inline-flex
                                items-center
                                justify-center
                                rounded-lg
                                bg-gray-950
                                px-4
                                py-2.5
                                text-sm
                                font-semibold
                                text-white
                                transition
                                hover:bg-orange-600
                              "
                            >
                              Book This Slot
                            </Link>
                          </div>
                        )
                      )}

                    </div>

                  </>

                )}

              </div>

            </div>

          )}

        </section>


        {/* ==================================
            CUSTOMER REVIEWS
        ================================== */}

        <section
          className="
            mt-8
            rounded-2xl
            border
            border-gray-200
            bg-white
            p-6
            shadow-sm
            sm:p-7
          "
        >

          <div
            className="
              flex
              flex-col
              gap-4
              sm:flex-row
              sm:items-end
              sm:justify-between
            "
          >

            <div>

              <p
                className="
                  text-sm
                  font-semibold
                  text-orange-600
                "
              >
                Verified Experiences
              </p>


              <h2
                className="
                  mt-1
                  text-xl
                  font-bold
                  text-gray-950
                  sm:text-2xl
                "
              >
                Customer Reviews
              </h2>


              <p
                className="
                  mt-2
                  text-sm
                  leading-6
                  text-gray-500
                "
              >
                Reviews are submitted by
                customers after completed
                photography bookings.
              </p>

            </div>


            {reviewCount > 0 && (

              <div
                className="
                  rounded-xl
                  bg-gray-50
                  px-4
                  py-3
                "
              >

                <div
                  className="
                    flex
                    items-center
                    gap-2
                  "
                >

                  <span
                    className="
                      text-2xl
                      font-bold
                      text-gray-950
                    "
                  >
                    {averageRating.toFixed(1)}
                  </span>


                  <span
                    className="
                      text-xl
                      text-amber-400
                    "
                  >
                    ★
                  </span>

                </div>


                <p
                  className="
                    mt-1
                    text-xs
                    text-gray-500
                  "
                >
                  Based on {reviewCount}
                  {" "}
                  {reviewCount === 1
                    ? "review"
                    : "reviews"}
                </p>

              </div>

            )}

          </div>


          {reviewsLoading ? (

            <div
              className="
                mt-6
                space-y-4
              "
            >

              {[1, 2].map(
                (item) => (

                  <div
                    key={item}
                    className="
                      animate-pulse
                      rounded-xl
                      border
                      border-gray-100
                      p-5
                    "
                  >

                    <div
                      className="
                        h-4
                        w-32
                        rounded
                        bg-gray-200
                      "
                    />

                    <div
                      className="
                        mt-3
                        h-3
                        w-full
                        rounded
                        bg-gray-100
                      "
                    />

                    <div
                      className="
                        mt-2
                        h-3
                        w-2/3
                        rounded
                        bg-gray-100
                      "
                    />

                  </div>

                )
              )}

            </div>

          ) : reviews.length === 0 ? (

            <div
              className="
                mt-6
                rounded-xl
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
                  text-2xl
                  text-gray-300
                "
              >
                ★★★★★
              </div>


              <h3
                className="
                  mt-3
                  font-semibold
                  text-gray-900
                "
              >
                No reviews yet
              </h3>


              <p
                className="
                  mt-1
                  text-sm
                  text-gray-500
                "
              >
                This photographer has not
                received any verified customer
                reviews yet.
              </p>

            </div>

          ) : (

            <div
              className="
                mt-6
                space-y-4
              "
            >

              {visibleReviews.map(
                (review) => {

                  const customerName =
                    review.customer?.name ||
                    "Customer";


                  return (

                    <article
                      key={review._id}
                      className="
                        rounded-xl
                        border
                        border-gray-200
                        p-5
                      "
                    >

                      <div
                        className="
                          flex
                          flex-col
                          gap-3
                          sm:flex-row
                          sm:items-start
                          sm:justify-between
                        "
                      >

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
                              h-10
                              w-10
                              shrink-0
                              items-center
                              justify-center
                              rounded-full
                              bg-orange-50
                              text-sm
                              font-bold
                              text-orange-700
                            "
                          >
                            {customerName
                              .charAt(0)
                              .toUpperCase()}
                          </div>


                          <div>

                            <p
                              className="
                                text-sm
                                font-semibold
                                text-gray-900
                              "
                            >
                              {customerName}
                            </p>


                            <span
                              className="
                                mt-1
                                inline-flex
                                rounded-full
                                border
                                border-green-200
                                bg-green-50
                                px-2
                                py-0.5
                                text-xs
                                font-medium
                                text-green-700
                              "
                            >
                              Verified booking
                            </span>

                          </div>

                        </div>


                        <div
                          className="
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
                                  review.rating
                                    ? "text-amber-400"
                                    : "text-gray-300"
                                }
                              >
                                ★
                              </span>

                            )
                          )}

                        </div>

                      </div>


                      {reviews.length >
                        visibleReviewCount && (

                        <div className="
                          mt-6
                          flex
                          justify-center
                        ">

                          <button
                            type="button"
                            onClick={() =>
                              setVisibleReviewCount(
                                (previous) =>
                                  previous + 3
                              )
                            }
                            className="
                              rounded-xl
                              border
                              border-gray-200
                              bg-white
                              px-5
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
                            Show More Reviews
                          </button>

                        </div>

                      )}


                      {review.comment && (

                        <p
                          className="
                            mt-4
                            whitespace-pre-line
                            text-sm
                            leading-6
                            text-gray-600
                          "
                        >
                          {review.comment}
                        </p>

                      )}


                      {review.createdAt && (

                        <p
                          className="
                            mt-4
                            text-xs
                            text-gray-400
                          "
                        >
                          {new Date(
                            review.createdAt
                          ).toLocaleDateString(
                            undefined,
                            {
                              year:
                                "numeric",

                              month:
                                "short",

                              day:
                                "numeric",
                            }
                          )}
                        </p>

                      )}

                    </article>

                  );

                }
              )}

            </div>

          )}

        </section>


        {/* ==================================
            FINAL BOOKING CTA
        ================================== */}

        <section className="
          mt-10
          rounded-2xl
          border
          border-orange-200
          bg-orange-50
          p-6
          sm:flex
          sm:items-center
          sm:justify-between
          sm:gap-6
        ">

          <div>

            <h2 className="
              text-lg
              font-semibold
              text-gray-950
            ">
              Ready to work with{" "}

              {photographer.user
                ?.name ||
                "this photographer"}
              ?
            </h2>


            <p className="
              mt-2
              text-sm
              leading-6
              text-gray-600
            ">
              Review available dates
              and submit a photography
              booking request.
            </p>

          </div>


          <Link
            to={bookingLink}
            className="
              mt-5
              inline-flex
              shrink-0
              items-center
              justify-center
              rounded-xl
              bg-gray-950
              px-6
              py-3
              text-sm
              font-semibold
              text-white
              transition
              hover:bg-orange-600
              sm:mt-0
            "
          >
            {bookingText}
          </Link>

        </section>

      </div>

    </main>
  );

};


export default PhotographerDetails;