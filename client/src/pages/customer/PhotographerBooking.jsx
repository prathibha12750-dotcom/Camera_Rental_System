import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Link,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";

import api from "../../services/api";


// ==========================================
// TIME / FREE PERIOD HELPERS
// ==========================================

const timeToMinutes = (value) => {
  if (!value) {
    return 0;
  }

  const [hours, minutes] =
    value.split(":").map(Number);

  return hours * 60 + minutes;
};


const minutesToTime = (totalMinutes) => {
  const hours = Math.floor(
    totalMinutes / 60
  );

  const minutes =
    totalMinutes % 60;

  return `${String(hours).padStart(
    2,
    "0"
  )}:${String(minutes).padStart(
    2,
    "0"
  )}`;
};


const buildTimeOptions = (
  startTime,
  endTime,
  { includeEnd = false } = {}
) => {
  const start =
    timeToMinutes(startTime);

  const end =
    timeToMinutes(endTime);

  const options = [];

  // 30-minute dropdown increments.
  for (
    let minute = start;
    includeEnd
      ? minute <= end
      : minute < end;
    minute += 30
  ) {
    options.push(
      minutesToTime(minute)
    );
  }

  // Preserve an exact availability boundary even
  // when it does not fall on a 30-minute increment.
  if (
    includeEnd &&
    end > start &&
    options[options.length - 1] !==
      endTime
  ) {
    options.push(endTime);
  }

  return options;
};


const getFreePeriods = (
  availablePeriods,
  blockedPeriods
) => {
  return availablePeriods.flatMap(
    (availablePeriod) => {
      let segments = [
        {
          startTime:
            availablePeriod.startTime,

          endTime:
            availablePeriod.endTime,
        },
      ];

      blockedPeriods.forEach(
        (blockedPeriod) => {
          const blockedStart =
            timeToMinutes(
              blockedPeriod.startTime
            );

          const blockedEnd =
            timeToMinutes(
              blockedPeriod.endTime
            );

          segments = segments.flatMap(
            (segment) => {
              const segmentStart =
                timeToMinutes(
                  segment.startTime
                );

              const segmentEnd =
                timeToMinutes(
                  segment.endTime
                );

              // No overlap.
              if (
                blockedEnd <=
                  segmentStart ||
                blockedStart >=
                  segmentEnd
              ) {
                return [segment];
              }

              const remaining = [];

              // Free time before busy period.
              if (
                blockedStart >
                segmentStart
              ) {
                remaining.push({
                  startTime:
                    segment.startTime,

                  endTime:
                    blockedPeriod.startTime,
                });
              }

              // Free time after busy period.
              if (
                blockedEnd <
                segmentEnd
              ) {
                remaining.push({
                  startTime:
                    blockedPeriod.endTime,

                  endTime:
                    segment.endTime,
                });
              }

              return remaining;
            }
          );
        }
      );

      return segments.filter(
        (segment) =>
          timeToMinutes(
            segment.endTime
          ) >
          timeToMinutes(
            segment.startTime
          )
      );
    }
  );
};


// ==========================================
// COMPONENT
// ==========================================

const PhotographerBooking = () => {

  const { id } =
    useParams();

  const location =
    useLocation();

  const navigate =
    useNavigate();


  // ==========================================
  // PRESELECTED SLOT FROM DETAILS PAGE
  // ==========================================

  const preselectedBooking =
    location.state
      ?.preselectedBooking ||
    null;


  // ==========================================
  // STATE
  // ==========================================

  const [
    photographer,
    setPhotographer,
  ] = useState(null);


  const [
    availability,
    setAvailability,
  ] = useState([]);


  const [
    busyPeriods,
    setBusyPeriods,
  ] = useState([]);


  /*
   * If the customer came from
   * "Book This Slot", use that date
   * immediately.
   *
   * Otherwise start with no selected date.
   */
  const [
    selectedDate,
    setSelectedDate,
  ] = useState(
    () =>
      preselectedBooking?.date ||
      ""
  );


  /*
   * Pre-fill the booking date/start/end
   * when a slot was selected on the
   * photographer details page.
   *
   * These values remain editable.
   */
  const [
    formData,
    setFormData,
  ] = useState(() => ({
    date:
      preselectedBooking?.date ||
      "",

    startTime:
      preselectedBooking?.startTime ||
      "",

    endTime:
      preselectedBooking?.endTime ||
      "",

    packageRateId: "",

    notes: "",
  }));


  /*
   * If a date was passed from the
   * photographer details page, open the
   * calendar on that month immediately.
   */
  const [
    currentMonth,
    setCurrentMonth,
  ] = useState(() => {

    if (
      preselectedBooking?.date
    ) {
      const selected =
        new Date(
          `${preselectedBooking.date}T00:00:00`
        );

      return new Date(
        selected.getFullYear(),
        selected.getMonth(),
        1
      );
    }


    const today =
      new Date();

    return new Date(
      today.getFullYear(),
      today.getMonth(),
      1
    );
  });


  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    saving,
    setSaving,
  ] = useState(false);


  const [
    error,
    setError,
  ] = useState("");


  // ==========================================
  // LOAD PHOTOGRAPHER
  // ==========================================

  useEffect(() => {

    let ignore = false;


    const loadPhotographer =
      async () => {

        try {

          const response =
            await api.get(
              `/customer/photographers/${id}`
            );


          if (!ignore) {

            const loadedPhotographer =
              response.data?.data
                ?.photographer ||
              null;


            const loadedAvailability =
              Array.isArray(
                response.data?.data
                  ?.availability
              )
                ? response.data.data
                    .availability
                : [];


            const loadedBusyPeriods =
              Array.isArray(
                response.data?.data
                  ?.busyPeriods
              )
                ? response.data.data
                    .busyPeriods
                : [];


            setPhotographer(
              loadedPhotographer
            );


            setAvailability(
              loadedAvailability
            );


            setBusyPeriods(
              loadedBusyPeriods
            );


            /*
             * Normal booking flow:
             * start calendar on first
             * available month.
             *
             * Book This Slot flow:
             * keep the month that was
             * initialized from the selected
             * booking date.
             */
            if (
              !preselectedBooking?.date &&
              loadedAvailability.length >
                0
            ) {

              const firstDate =
                new Date(
                  loadedAvailability[0]
                    .date
                );


              setCurrentMonth(
                new Date(
                  firstDate.getFullYear(),
                  firstDate.getMonth(),
                  1
                )
              );

            }

          }

        } catch (err) {

          console.error(
            "Failed to load photographer:",
            err
          );


          if (!ignore) {

            setError(
              err.response?.data
                ?.message ||
              "Failed to load photographer."
            );

          }

        } finally {

          if (!ignore) {
            setLoading(false);
          }

        }

      };


    loadPhotographer();


    return () => {
      ignore = true;
    };

  }, [
    id,
    preselectedBooking?.date,
  ]);


  // ==========================================
  // DATE HELPERS
  // ==========================================

  const toDateKey = (
    value
  ) => {

    if (!value) {
      return "";
    }


    const date =
      new Date(value);


    const year =
      date.getFullYear();


    const month =
      String(
        date.getMonth() + 1
      ).padStart(
        2,
        "0"
      );


    const day =
      String(
        date.getDate()
      ).padStart(
        2,
        "0"
      );


    return `${year}-${month}-${day}`;

  };


  const formatDate = (
    value
  ) => {

    if (!value) {
      return "";
    }


    return new Date(
      `${value}T00:00:00`
    ).toLocaleDateString(
      undefined,
      {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }
    );

  };


  const monthLabel =
    currentMonth.toLocaleDateString(
      undefined,
      {
        month: "long",
        year: "numeric",
      }
    );


  // ==========================================
  // GROUP AVAILABILITY BY DATE
  // ==========================================

  const availabilityByDate =
    useMemo(() => {

      const grouped = {};


      availability.forEach(
        (slot) => {

          const key =
            toDateKey(
              slot.date
            );


          if (!grouped[key]) {
            grouped[key] = [];
          }


          grouped[key].push(
            slot
          );

        }
      );


      return grouped;

    }, [availability]);


  // ==========================================
  // BUSY PERIODS BY DATE
  // ==========================================

  const busyPeriodsByDate =
    useMemo(() => {

      const grouped = {};


      busyPeriods.forEach(
        (period) => {

          const key =
            toDateKey(
              period.date
            );


          if (!grouped[key]) {
            grouped[key] = [];
          }


          grouped[key].push(
            period
          );

        }
      );


      return grouped;

    }, [busyPeriods]);


  // ==========================================
  // FREE PERIODS BY DATE
  // ==========================================

  const freePeriodsByDate =
    useMemo(() => {

      const freeByDate = {};


      Object.entries(
        availabilityByDate
      ).forEach(
        ([dateKey, periods]) => {

          freeByDate[dateKey] =
            getFreePeriods(
              periods,

              busyPeriodsByDate[
                dateKey
              ] || []
            );

        }
      );


      return freeByDate;

    }, [
      availabilityByDate,
      busyPeriodsByDate,
    ]);


  // ==========================================
  // SELECTED DATE FREE PERIODS
  // ==========================================

  const selectedDateFreePeriods =
    useMemo(() => {

      if (!selectedDate) {
        return [];
      }


      return (
        freePeriodsByDate[
          selectedDate
        ] || []
      );

    }, [
      freePeriodsByDate,
      selectedDate,
    ]);


  // ==========================================
  // START TIME OPTIONS
  // ==========================================

  const startTimeOptions =
    useMemo(() => {

      const options =
        selectedDateFreePeriods.flatMap(
          (period) =>
            buildTimeOptions(
              period.startTime,
              period.endTime
            )
        );


      return [
        ...new Set(options),
      ].sort();

    }, [
      selectedDateFreePeriods,
    ]);


  // ==========================================
  // ACTIVE FREE PERIOD
  // ==========================================

  const activeFreePeriod =
    formData.startTime
      ? selectedDateFreePeriods.find(
          (period) =>
            formData.startTime >=
              period.startTime &&
            formData.startTime <
              period.endTime
        ) || null
      : null;


  // ==========================================
  // END TIME OPTIONS
  // ==========================================

  const endTimeOptions =
    useMemo(() => {

      if (
        !formData.startTime ||
        !activeFreePeriod
      ) {
        return [];
      }


      const startMinutes =
        timeToMinutes(
          formData.startTime
        );


      const periodEndMinutes =
        timeToMinutes(
          activeFreePeriod.endTime
        );


      const options = [];


      for (
        let minute =
          startMinutes + 30;

        minute <=
          periodEndMinutes;

        minute += 30
      ) {

        options.push(
          minutesToTime(minute)
        );

      }


      /*
       * Preserve exact end boundary
       * even when it is not on a
       * 30-minute increment.
       */
      if (
        periodEndMinutes >
          startMinutes &&
        options[
          options.length - 1
        ] !==
          activeFreePeriod.endTime
      ) {

        options.push(
          activeFreePeriod.endTime
        );

      }


      return options;

    }, [
      activeFreePeriod,
      formData.startTime,
    ]);


  // ==========================================
  // VALIDATE SELECTED TIME
  // ==========================================

  const selectedTimeIsValid =
    Boolean(
      formData.startTime &&
      formData.endTime &&
      formData.endTime >
        formData.startTime &&
      selectedDateFreePeriods.some(
        (period) =>
          formData.startTime >=
            period.startTime &&
          formData.endTime <=
            period.endTime
      )
    );


  // ==========================================
  // SELECTED PACKAGE
  // ==========================================

  const selectedPackage =
    photographer?.packageRates?.find(
      (pkg) =>
        pkg._id ===
        formData.packageRateId
    );


  // ==========================================
  // BOOKING PRICE CALCULATION
  // ==========================================

  const bookingDurationHours =
    formData.startTime &&
    formData.endTime &&
    selectedTimeIsValid
      ? (
          timeToMinutes(
            formData.endTime
          ) -
          timeToMinutes(
            formData.startTime
          )
        ) / 60
      : 0;


  const hourlyRate =
    Number(
      photographer?.hourlyRate ||
        0
    );


  const hourlyTotalAmount =
    bookingDurationHours > 0 &&
    hourlyRate > 0
      ? bookingDurationHours *
        hourlyRate
      : 0;


  const totalAmount =
    selectedPackage
      ? Number(
          selectedPackage.price ||
            0
        )
      : hourlyTotalAmount;


  // ==========================================
  // CALENDAR DATA
  // ==========================================

  const calendarDays =
    useMemo(() => {

      const year =
        currentMonth.getFullYear();


      const month =
        currentMonth.getMonth();


      const firstDay =
        new Date(
          year,
          month,
          1
        );


      const lastDay =
        new Date(
          year,
          month + 1,
          0
        );


      const startOffset =
        firstDay.getDay();


      const daysInMonth =
        lastDay.getDate();


      const cells = [];


      for (
        let i = 0;
        i < startOffset;
        i += 1
      ) {

        cells.push(null);

      }


      for (
        let day = 1;
        day <= daysInMonth;
        day += 1
      ) {

        cells.push(
          new Date(
            year,
            month,
            day
          )
        );

      }


      return cells;

    }, [currentMonth]);


  // ==========================================
  // MONTH NAVIGATION
  // ==========================================

  const previousMonth = () => {

    setCurrentMonth(
      (previous) =>
        new Date(
          previous.getFullYear(),
          previous.getMonth() - 1,
          1
        )
    );

  };


  const nextMonth = () => {

    setCurrentMonth(
      (previous) =>
        new Date(
          previous.getFullYear(),
          previous.getMonth() + 1,
          1
        )
    );

  };


  // ==========================================
  // DATE SELECTION
  // ==========================================

  const handleDateSelect = (
    dateKey
  ) => {

    if (
      !freePeriodsByDate[
        dateKey
      ]?.length
    ) {
      return;
    }


    setSelectedDate(
      dateKey
    );


    /*
     * If the customer manually changes
     * the date, clear the old times.
     */
    setFormData(
      (previous) => ({
        ...previous,

        date:
          dateKey,

        startTime: "",

        endTime: "",
      })
    );


    setError("");

  };


  // ==========================================
  // TIME SELECTION
  // ==========================================

  const handleStartTimeChange = (
    event
  ) => {

    const value =
      event.target.value;


    /*
     * Changing the start time clears
     * the old end time because its
     * validity depends on the new
     * start time.
     */
    setFormData(
      (previous) => ({
        ...previous,

        startTime:
          value,

        endTime: "",
      })
    );


    setError("");

  };


  const handleEndTimeChange = (
    event
  ) => {

    setFormData(
      (previous) => ({
        ...previous,

        endTime:
          event.target.value,
      })
    );


    setError("");

  };


  // ==========================================
  // INPUT CHANGE
  // ==========================================

  const handleChange = (
    event
  ) => {

    const {
      name,
      value,
    } = event.target;


    setFormData(
      (previous) => ({
        ...previous,
        [name]: value,
      })
    );


    setError("");

  };


  // ==========================================
  // SUBMIT
  // ==========================================

  const handleSubmit =
    async (event) => {

      event.preventDefault();


      setError("");


      if (!selectedDate) {

        setError(
          "Please choose an available date."
        );

        return;
      }


      if (
        !formData.startTime ||
        !formData.endTime
      ) {

        setError(
          "Please select valid booking times."
        );

        return;
      }


      if (
        formData.endTime <=
        formData.startTime
      ) {

        setError(
          "End time must be later than start time."
        );

        return;
      }


      if (!selectedTimeIsValid) {

        setError(
          "Please choose a start and end time entirely within one of the available periods shown."
        );

        return;
      }


      try {

        setSaving(true);


        await api.post(
          "/customer/bookings",
          {
            photographerId:
              id,

            date:
              formData.date,

            startTime:
              formData.startTime,

            endTime:
              formData.endTime,

            packageRateId:
              formData.packageRateId ||
              undefined,

            notes:
              formData.notes.trim(),
          }
        );


        navigate(
          "/customer/bookings",
          {
            state: {
              bookingCreated:
                true,
            },
          }
        );

      } catch (err) {

        console.error(
          "Failed to create booking:",
          err
        );


        setError(
          err.response?.data
            ?.message ||
          "Failed to create booking request."
        );

      } finally {

        setSaving(false);

      }

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
          max-w-6xl
          animate-pulse
        ">

          <div className="
            h-5
            w-44
            rounded
            bg-gray-200
          " />


          <div className="
            mt-6
            h-32
            rounded-2xl
            bg-white
          " />


          <div className="
            mt-6
            grid
            gap-6
            lg:grid-cols-[minmax(0,1fr)_340px]
          ">

            <div className="
              h-[520px]
              rounded-2xl
              bg-white
            " />


            <div className="
              h-80
              rounded-2xl
              bg-white
            " />

          </div>

        </div>

      </main>
    );

  }


  // ==========================================
  // PHOTOGRAPHER NOT FOUND
  // ==========================================

  if (!photographer) {

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
            Booking unavailable
          </p>


          <h1 className="
            mt-2
            text-2xl
            font-bold
            text-gray-950
          ">
            Photographer not found
          </h1>


          <p className="
            mt-3
            text-sm
            text-gray-600
          ">
            {error ||
              "This photographer is currently unavailable."}
          </p>


          <Link
            to="/customer/photographers"
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
            Back to Photographers
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
        max-w-6xl
      ">


        {/* ==================================
            PAGE HEADER
        ================================== */}

        <section className="
          mt-5
          rounded-2xl
          border
          border-gray-200
          bg-white
          p-6
          shadow-sm
          sm:p-7
        ">

          <div className="
            flex
            flex-col
            gap-5
            sm:flex-row
            sm:items-center
            sm:justify-between
          ">

            <div>

              <p className="
                text-sm
                font-semibold
                text-orange-600
              ">
                Booking Request
              </p>


              <h1 className="
                mt-1
                text-2xl
                font-bold
                tracking-tight
                text-gray-950
                sm:text-3xl
              ">
                Book{" "}
                {photographer.user
                  ?.name ||
                  "Photographer"}
              </h1>


              <p className="
                mt-2
                max-w-2xl
                text-sm
                leading-6
                text-gray-500
              ">
                Choose an available date
                and time, then review your
                request before submitting.
              </p>

            </div>


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
                overflow-hidden
                rounded-full
                bg-orange-100
                font-bold
                text-orange-700
              ">

                {photographer.profileImage ? (

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

                  photographer.user
                    ?.name
                    ?.charAt(0)
                    ?.toUpperCase() ||
                  "P"

                )}

              </div>


              <div className="
                hidden
                sm:block
              ">

                <p className="
                  text-sm
                  font-semibold
                  text-gray-950
                ">
                  {photographer.user
                    ?.name}
                </p>


                <p className="
                  text-xs
                  text-gray-500
                ">
                  {photographer.specialization ||
                    "Photography Services"}
                </p>

              </div>

            </div>

          </div>

        </section>


        {/* ==================================
            ERROR
        ================================== */}

        {error && (

          <div className="
            mt-5
            rounded-xl
            border
            border-red-200
            bg-red-50
            px-4
            py-3
            text-sm
            text-red-700
          ">
            {error}
          </div>

        )}


        {availability.length === 0 ? (

          /* ================================
              NO AVAILABILITY
          ================================ */

          <section className="
            mt-6
            rounded-2xl
            border
            border-dashed
            border-gray-300
            bg-white
            px-6
            py-12
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
              </svg>

            </div>


            <h2 className="
              mt-4
              text-lg
              font-semibold
              text-gray-950
            ">
              No availability listed
            </h2>


            <p className="
              mx-auto
              mt-2
              max-w-md
              text-sm
              leading-6
              text-gray-500
            ">
              This photographer currently
              has no available booking
              periods.
            </p>


            <Link
              to={`/customer/photographers/${id}`}
              className="
                mt-5
                inline-flex
                text-sm
                font-semibold
                text-orange-600
                hover:text-orange-700
              "
            >
              Return to photographer
            </Link>

          </section>

        ) : (

          <form
            onSubmit={
              handleSubmit
            }
            className="
              mt-6
              grid
              gap-6
              lg:grid-cols-[minmax(0,1fr)_340px]
              lg:items-start
            "
          >


            {/* ==================================
                LEFT SIDE
            ================================== */}

            <div className="
              space-y-6
            ">


              {/* ================================
                  STEP 1 — DATE
              ================================ */}

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
                  gap-3
                ">

                  <span className="
                    flex
                    h-8
                    w-8
                    shrink-0
                    items-center
                    justify-center
                    rounded-full
                    bg-orange-600
                    text-sm
                    font-bold
                    text-white
                  ">
                    1
                  </span>


                  <div>

                    <h2 className="
                      font-semibold
                      text-gray-950
                    ">
                      Choose a date
                    </h2>


                    <p className="
                      mt-1
                      text-sm
                      text-gray-500
                    ">
                      Only dates with actual
                      photographer availability
                      can be selected.
                    </p>

                  </div>

                </div>


                {/* CALENDAR */}

                <div className="
                  mx-auto
                  mt-6
                  max-w-lg
                ">

                  <div className="
                    flex
                    items-center
                    justify-between
                    gap-4
                  ">

                    <button
                      type="button"
                      onClick={
                        previousMonth
                      }
                      disabled={
                        saving
                      }
                      aria-label="Previous month"
                      className="
                        flex
                        h-9
                        w-9
                        items-center
                        justify-center
                        rounded-lg
                        border
                        border-gray-200
                        bg-white
                        text-gray-600
                        transition
                        hover:bg-gray-50
                        disabled:opacity-50
                      "
                    >
                      ←
                    </button>


                    <h3 className="
                      text-sm
                      font-semibold
                      text-gray-950
                    ">
                      {monthLabel}
                    </h3>


                    <button
                      type="button"
                      onClick={
                        nextMonth
                      }
                      disabled={
                        saving
                      }
                      aria-label="Next month"
                      className="
                        flex
                        h-9
                        w-9
                        items-center
                        justify-center
                        rounded-lg
                        border
                        border-gray-200
                        bg-white
                        text-gray-600
                        transition
                        hover:bg-gray-50
                        disabled:opacity-50
                      "
                    >
                      →
                    </button>

                  </div>


                  {/* WEEK DAYS */}

                  <div className="
                    mt-5
                    grid
                    grid-cols-7
                    gap-1
                    text-center
                  ">

                    {[
                      "Sun",
                      "Mon",
                      "Tue",
                      "Wed",
                      "Thu",
                      "Fri",
                      "Sat",
                    ].map(
                      (day) => (

                        <div
                          key={day}
                          className="
                            py-2
                            text-[11px]
                            font-semibold
                            uppercase
                            tracking-wide
                            text-gray-400
                          "
                        >
                          {day}
                        </div>

                      )
                    )}

                  </div>


                  {/* CALENDAR DAYS */}

                  <div className="
                    grid
                    grid-cols-7
                    gap-1
                  ">

                    {calendarDays.map(
                      (
                        date,
                        index
                      ) => {

                        if (!date) {

                          return (
                            <div
                              key={`blank-${index}`}
                              className="
                                aspect-square
                              "
                            />
                          );

                        }


                        const dateKey =
                          toDateKey(
                            date
                          );


                        const hasAvailability =
                          Boolean(
                            freePeriodsByDate[
                              dateKey
                            ]?.length
                          );


                        const isSelected =
                          selectedDate ===
                          dateKey;


                        return (
                          <button
                            key={
                              dateKey
                            }
                            type="button"
                            disabled={
                              !hasAvailability ||
                              saving
                            }
                            onClick={() =>
                              handleDateSelect(
                                dateKey
                              )
                            }
                            aria-pressed={
                              isSelected
                            }
                            className={`
                              relative
                              aspect-square
                              rounded-xl
                              text-sm
                              font-medium
                              transition
                              focus:outline-none
                              focus-visible:ring-2
                              focus-visible:ring-orange-500
                              ${
                                isSelected
                                  ? "bg-orange-600 text-white shadow-sm"
                                  : hasAvailability
                                    ? "bg-orange-50 text-orange-800 hover:bg-orange-100"
                                    : "cursor-default text-gray-300"
                              }
                            `}
                          >

                            {
                              date.getDate()
                            }


                            {hasAvailability &&
                              !isSelected && (

                              <span className="
                                absolute
                                bottom-1.5
                                left-1/2
                                h-1
                                w-1
                                -translate-x-1/2
                                rounded-full
                                bg-orange-500
                              " />

                            )}

                          </button>
                        );

                      }
                    )}

                  </div>


                  <div className="
                    mt-4
                    flex
                    flex-wrap
                    gap-x-5
                    gap-y-2
                    text-xs
                    text-gray-500
                  ">

                    <span className="
                      flex
                      items-center
                      gap-2
                    ">

                      <span className="
                        h-2.5
                        w-2.5
                        rounded-full
                        bg-orange-500
                      " />

                      Available

                    </span>


                    <span className="
                      flex
                      items-center
                      gap-2
                    ">

                      <span className="
                        h-2.5
                        w-2.5
                        rounded-full
                        bg-gray-200
                      " />

                      Not available

                    </span>

                  </div>

                </div>


                {selectedDate && (

                  <div className="
                    mt-5
                    rounded-xl
                    bg-orange-50
                    px-4
                    py-3
                    text-sm
                    font-medium
                    text-orange-800
                  ">
                    Selected:{" "}
                    {formatDate(
                      selectedDate
                    )}
                  </div>

                )}

              </section>


              {/* ================================
                  STEP 2 — TIME
              ================================ */}

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
                  gap-3
                ">

                  <span className="
                    flex
                    h-8
                    w-8
                    shrink-0
                    items-center
                    justify-center
                    rounded-full
                    bg-orange-600
                    text-sm
                    font-bold
                    text-white
                  ">
                    2
                  </span>

                  <div>
                    <h2 className="
                      font-semibold
                      text-gray-950
                    ">
                      Choose start and end time
                    </h2>

                    <p className="
                      mt-1
                      text-sm
                      text-gray-500
                    ">
                      Busy booking periods are removed.
                      Select a start time first, then choose
                      a valid end time from the dropdown.
                    </p>
                  </div>

                </div>

                {!selectedDate ? (

                  <div className="
                    mt-5
                    rounded-xl
                    border
                    border-dashed
                    border-gray-300
                    bg-gray-50
                    px-4
                    py-6
                    text-center
                    text-sm
                    text-gray-500
                  ">
                    Choose a date first to
                    view free booking periods.
                  </div>

                ) : selectedDateFreePeriods.length === 0 ? (

                  <div className="
                    mt-5
                    rounded-xl
                    border
                    border-dashed
                    border-gray-300
                    bg-gray-50
                    px-4
                    py-6
                    text-center
                    text-sm
                    text-gray-500
                  ">
                    No free booking time remains
                    on this date.
                  </div>

                ) : (

                  <div className="mt-5 space-y-5">

                    <div>
                      <p className="
                        text-xs
                        font-semibold
                        uppercase
                        tracking-wide
                        text-gray-400
                      ">
                        Free periods
                      </p>

                      <div className="
                        mt-2
                        flex
                        flex-wrap
                        gap-2
                      ">
                        {selectedDateFreePeriods.map(
                          (period, index) => (
                            <span
                              key={`${period.startTime}-${period.endTime}-${index}`}
                              className="
                                rounded-lg
                                border
                                border-green-200
                                bg-green-50
                                px-3
                                py-2
                                text-sm
                                font-medium
                                text-green-800
                              "
                            >
                              {period.startTime}
                              {" — "}
                              {period.endTime}
                            </span>
                          )
                        )}
                      </div>
                    </div>

                    <div className="
                      grid
                      gap-4
                      sm:grid-cols-2
                    ">

                      <div>
                        <label
                          htmlFor="startTime"
                          className="
                            text-sm
                            font-semibold
                            text-gray-700
                          "
                        >
                          Start time
                        </label>

                        <select
                          id="startTime"
                          name="startTime"
                          value={
                            formData.startTime
                          }
                          onChange={
                            handleStartTimeChange
                          }
                          disabled={
                            saving ||
                            startTimeOptions.length === 0
                          }
                          className="
                            mt-2
                            w-full
                            rounded-xl
                            border
                            border-gray-300
                            bg-white
                            px-4
                            py-3
                            text-sm
                            text-gray-950
                            outline-none
                            transition
                            focus:border-orange-500
                            focus:ring-2
                            focus:ring-orange-500/10
                            disabled:cursor-not-allowed
                            disabled:bg-gray-100
                            disabled:text-gray-400
                          "
                        >
                          <option value="">
                            Select start time
                          </option>

                          {startTimeOptions.map(
                            (time) => (
                              <option
                                key={time}
                                value={time}
                              >
                                {time}
                              </option>
                            )
                          )}
                        </select>
                      </div>

                      <div>
                        <label
                          htmlFor="endTime"
                          className="
                            text-sm
                            font-semibold
                            text-gray-700
                          "
                        >
                          End time
                        </label>

                        <select
                          id="endTime"
                          name="endTime"
                          value={
                            formData.endTime
                          }
                          onChange={
                            handleEndTimeChange
                          }
                          disabled={
                            saving ||
                            !formData.startTime ||
                            endTimeOptions.length === 0
                          }
                          className="
                            mt-2
                            w-full
                            rounded-xl
                            border
                            border-gray-300
                            bg-white
                            px-4
                            py-3
                            text-sm
                            text-gray-950
                            outline-none
                            transition
                            focus:border-orange-500
                            focus:ring-2
                            focus:ring-orange-500/10
                            disabled:cursor-not-allowed
                            disabled:bg-gray-100
                            disabled:text-gray-400
                          "
                        >
                          <option value="">
                            {formData.startTime
                              ? "Select end time"
                              : "Select start time first"}
                          </option>

                          {endTimeOptions.map(
                            (time) => (
                              <option
                                key={time}
                                value={time}
                              >
                                {time}
                              </option>
                            )
                          )}
                        </select>
                      </div>

                    </div>

                    {formData.startTime &&
                      formData.endTime && (

                      <p
                        className={`
                          rounded-xl
                          px-4
                          py-3
                          text-sm
                          ${
                            selectedTimeIsValid
                              ? "bg-green-50 text-green-700"
                              : "bg-red-50 text-red-700"
                          }
                        `}
                        role={
                          selectedTimeIsValid
                            ? "status"
                            : "alert"
                        }
                      >
                        {selectedTimeIsValid
                          ? "This time range is currently available."
                          : "This time range crosses an unavailable period or falls outside the photographer's availability."}
                      </p>
                    )}

                  </div>

                )}

              </section>


              {/* ================================
                  STEP 3 — PACKAGE
              ================================ */}

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
                  gap-3
                ">

                  <span className="
                    flex
                    h-8
                    w-8
                    shrink-0
                    items-center
                    justify-center
                    rounded-full
                    bg-orange-600
                    text-sm
                    font-bold
                    text-white
                  ">
                    3
                  </span>


                  <div>

                    <h2 className="
                      font-semibold
                      text-gray-950
                    ">
                      Choose pricing option
                    </h2>


                    <p className="
                      mt-1
                      text-sm
                      text-gray-500
                    ">
                      You may use the hourly
                      rate or choose an
                      available package.
                    </p>

                  </div>

                </div>


                <div className="
                  mt-5
                  space-y-3
                ">

                  <label className="
                    flex
                    cursor-pointer
                    items-center
                    justify-between
                    gap-4
                    rounded-xl
                    border
                    border-gray-200
                    bg-white
                    p-4
                    transition
                    has-[:checked]:border-orange-500
                    has-[:checked]:bg-orange-50
                  ">

                    <div>

                      <p className="
                        text-sm
                        font-semibold
                        text-gray-950
                      ">
                        Hourly rate
                      </p>


                      <p className="
                        mt-1
                        text-xs
                        text-gray-500
                      ">
                        No package selected
                      </p>

                    </div>


                    <div className="
                      flex
                      items-center
                      gap-3
                    ">

                      <p className="
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
                          : "Hourly"}

                      </p>


                      <input
                        type="radio"
                        name="packageRateId"
                        value=""
                        checked={
                          formData.packageRateId ===
                          ""
                        }
                        onChange={
                          handleChange
                        }
                        disabled={
                          saving
                        }
                        className="
                          h-4
                          w-4
                          accent-orange-600
                        "
                      />

                    </div>

                  </label>


                  {photographer
                    .packageRates
                    ?.map(
                      (pkg) => (

                        <label
                          key={
                            pkg._id
                          }
                          className="
                            flex
                            cursor-pointer
                            items-start
                            justify-between
                            gap-4
                            rounded-xl
                            border
                            border-gray-200
                            bg-white
                            p-4
                            transition
                            has-[:checked]:border-orange-500
                            has-[:checked]:bg-orange-50
                          "
                        >

                          <div>

                            <p className="
                              text-sm
                              font-semibold
                              text-gray-950
                            ">
                              {pkg.name}
                            </p>


                            {pkg.description && (

                              <p className="
                                mt-1
                                text-xs
                                leading-5
                                text-gray-500
                              ">
                                {
                                  pkg.description
                                }
                              </p>

                            )}

                          </div>


                          <div className="
                            flex
                            shrink-0
                            items-center
                            gap-3
                          ">

                            <p className="
                              text-sm
                              font-semibold
                              text-gray-950
                            ">

                              LKR{" "}

                              {Number(
                                pkg.price
                              ).toLocaleString()}

                            </p>


                            <input
                              type="radio"
                              name="packageRateId"
                              value={
                                pkg._id
                              }
                              checked={
                                formData.packageRateId ===
                                pkg._id
                              }
                              onChange={
                                handleChange
                              }
                              disabled={
                                saving
                              }
                              className="
                                h-4
                                w-4
                                accent-orange-600
                              "
                            />

                          </div>

                        </label>

                      )
                    )}

                </div>

              </section>


              {/* ================================
                  STEP 4 — NOTES
              ================================ */}

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
                  gap-3
                ">

                  <span className="
                    flex
                    h-8
                    w-8
                    shrink-0
                    items-center
                    justify-center
                    rounded-full
                    bg-orange-600
                    text-sm
                    font-bold
                    text-white
                  ">
                    4
                  </span>


                  <div>

                    <h2 className="
                      font-semibold
                      text-gray-950
                    ">
                      Add optional notes
                    </h2>


                    <p className="
                      mt-1
                      text-sm
                      text-gray-500
                    ">
                      Share useful event or
                      photography requirements
                      with the photographer.
                    </p>

                  </div>

                </div>


                <div className="mt-5">

                  <textarea
                    id="notes"
                    name="notes"
                    rows="5"
                    maxLength="500"
                    value={
                      formData.notes
                    }
                    onChange={
                      handleChange
                    }
                    disabled={
                      saving
                    }
                    placeholder="For example: wedding ceremony, outdoor portrait session, preferred photography style..."
                    className="
                      w-full
                      resize-none
                      rounded-xl
                      border
                      border-gray-300
                      bg-white
                      px-4
                      py-3
                      text-sm
                      text-gray-950
                      outline-none
                      transition
                      placeholder:text-gray-400
                      focus:border-orange-500
                      focus:ring-2
                      focus:ring-orange-500/10
                      disabled:bg-gray-100
                    "
                  />


                  <div className="
                    mt-2
                    text-right
                    text-xs
                    text-gray-400
                  ">
                    {
                      formData.notes.length
                    }
                    /500
                  </div>

                </div>

              </section>

            </div>


            {/* ==================================
                RIGHT — REVIEW
            ================================== */}

            <aside className="
              lg:sticky
              lg:top-6
            ">

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
                  items-center
                  gap-3
                ">

                  <span className="
                    flex
                    h-8
                    w-8
                    items-center
                    justify-center
                    rounded-full
                    bg-gray-950
                    text-sm
                    font-bold
                    text-white
                  ">
                    5
                  </span>


                  <div>

                    <h2 className="
                      font-semibold
                      text-gray-950
                    ">
                      Review request
                    </h2>


                    <p className="
                      mt-0.5
                      text-xs
                      text-gray-500
                    ">
                      Check before submitting
                    </p>

                  </div>

                </div>


                <dl className="
                  mt-6
                  divide-y
                  divide-gray-100
                ">


                  {/* PHOTOGRAPHER */}

                  <div className="
                    py-4
                    first:pt-0
                  ">

                    <dt className="
                      text-xs
                      font-medium
                      uppercase
                      tracking-wide
                      text-gray-400
                    ">
                      Photographer
                    </dt>


                    <dd className="
                      mt-1
                      text-sm
                      font-semibold
                      text-gray-950
                    ">
                      {photographer.user
                        ?.name ||
                        "Photographer"}
                    </dd>

                  </div>


                  {/* DATE */}

                  <div className="py-4">

                    <dt className="
                      text-xs
                      font-medium
                      uppercase
                      tracking-wide
                      text-gray-400
                    ">
                      Date
                    </dt>


                    <dd className="
                      mt-1
                      text-sm
                      font-medium
                      text-gray-700
                    ">
                      {selectedDate
                        ? formatDate(
                            selectedDate
                          )
                        : "Not selected"}
                    </dd>

                  </div>


                  {/* TIME */}

                  <div className="py-4">

                    <dt className="
                      text-xs
                      font-medium
                      uppercase
                      tracking-wide
                      text-gray-400
                    ">
                      Time
                    </dt>


                    <dd className="
                      mt-1
                      text-sm
                      font-medium
                      text-gray-700
                    ">

                      {formData.startTime &&
                      formData.endTime
                        ? `${formData.startTime} — ${formData.endTime}`
                        : "Not selected"}

                    </dd>

                  </div>

                  {/* PRICING */}

                  <div className="py-4">

                    <dt className="
                      text-xs
                      font-medium
                      uppercase
                      tracking-wide
                      text-gray-400
                    ">
                      Pricing
                    </dt>


                    <dd className="
                      mt-1
                      text-sm
                      font-semibold
                      text-gray-950
                    ">
                      {selectedPackage
                        ? selectedPackage.name
                        : "Hourly rate"}
                    </dd>


                    {selectedPackage ? (

                      /* ============================
                        PACKAGE PRICING
                      ============================ */

                      <div className="
                        mt-3
                        space-y-2
                      ">

                        <div className="
                          flex
                          items-center
                          justify-between
                          gap-4
                          text-sm
                        ">

                          <span className="
                            text-gray-500
                          ">
                            Package Price
                          </span>

                          <span className="
                            font-semibold
                            text-gray-950
                          ">
                            LKR{" "}
                            {Number(
                              selectedPackage.price
                            ).toLocaleString()}
                          </span>

                        </div>

                      </div>

                    ) : (

                      /* ============================
                        HOURLY PRICING
                      ============================ */

                      <div className="
                        mt-3
                        space-y-2
                      ">

                        <div className="
                          flex
                          items-center
                          justify-between
                          gap-4
                          text-sm
                        ">

                          <span className="
                            text-gray-500
                          ">
                            Hourly Rate
                          </span>

                          <span className="
                            font-semibold
                            text-gray-950
                          ">
                            {photographer.hourlyRate !==
                              null &&
                            photographer.hourlyRate !==
                              undefined
                              ? `LKR ${Number(
                                  photographer.hourlyRate
                                ).toLocaleString()}`
                              : "Not specified"}
                          </span>

                        </div>


                        <div className="
                          flex
                          items-center
                          justify-between
                          gap-4
                          text-sm
                        ">

                          <span className="
                            text-gray-500
                          ">
                            Duration
                          </span>

                          <span className="
                            font-semibold
                            text-gray-950
                          ">
                            {bookingDurationHours > 0
                              ? `${bookingDurationHours} ${
                                  bookingDurationHours ===
                                  1
                                    ? "hour"
                                    : "hours"
                                }`
                              : "Select booking time"}
                          </span>

                        </div>

                      </div>

                    )}

                  </div>


                  {/* TOTAL AMOUNT */}

                  <div className="py-4">

                    <dt className="
                      text-xs
                      font-medium
                      uppercase
                      tracking-wide
                      text-gray-400
                    ">
                      Total Amount
                    </dt>


                    <dd className="
                      mt-2
                      text-xl
                      font-bold
                      text-orange-600
                    ">

                      {selectedPackage ? (

                        `LKR ${totalAmount.toLocaleString()}`

                      ) : bookingDurationHours > 0 &&
                        hourlyRate > 0 ? (

                        `LKR ${totalAmount.toLocaleString()}`

                      ) : (

                        <span className="
                          text-sm
                          font-medium
                          text-gray-400
                        ">
                          Select booking time
                        </span>

                      )}

                    </dd>


                    <p className="
                      mt-1
                      text-xs
                      leading-5
                      text-gray-500
                    ">

                      {selectedPackage
                        ? "Fixed price for the selected package."
                        : "Calculated using hourly rate × booking duration."}

                    </p>

                  </div>

                </dl>


                <div className="
                  mt-5
                  rounded-xl
                  bg-gray-50
                  p-4
                ">

                  <p className="
                    text-xs
                    leading-5
                    text-gray-500
                  ">
                    Submitting this form sends
                    a booking request. The
                    photographer still needs
                    to manage the request
                    according to the existing
                    booking workflow.
                  </p>

                </div>


                <button
                  type="submit"
                  disabled={
                    saving ||
                    !selectedDate ||
                    !selectedTimeIsValid
                  }
                  className="
                    mt-5
                    inline-flex
                    w-full
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
                    disabled:cursor-not-allowed
                    disabled:opacity-50
                    focus:outline-none
                    focus-visible:ring-2
                    focus-visible:ring-orange-500
                    focus-visible:ring-offset-2
                  "
                >
                  {saving
                    ? "Submitting Request..."
                    : "Submit Booking Request"}
                </button>


                <p className="
                  mt-3
                  text-center
                  text-xs
                  text-gray-400
                ">
                  Availability is verified
                  again when your request is
                  submitted.
                </p>

              </section>

            </aside>

          </form>

        )}

      </div>

    </main>
  );

};


export default PhotographerBooking;