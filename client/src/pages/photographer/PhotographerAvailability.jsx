import {
  useEffect,
  useMemo,
  useState,
} from "react";

import api from "../../services/api";
import ConfirmDialog from "../../components/ConfirmDialog";


const emptyForm = {
  date: "",
  startTime: "",
  endTime: "",
};


const PhotographerAvailability = () => {

  const [
    availability,
    setAvailability,
  ] = useState([]);

  const [
    formData,
    setFormData,
  ] = useState(emptyForm);

  const [
    editingId,
    setEditingId,
  ] = useState(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    availabilityToDelete,
    setAvailabilityToDelete,
  ] = useState(null);

  const [
    deletingId,
    setDeletingId,
  ] = useState(null);

  const [
    error,
    setError,
  ] = useState("");

  const [
    success,
    setSuccess,
  ] = useState("");

  const AVAILABILITY_PER_PAGE = 6;

  const [
    availabilityPage,
    setAvailabilityPage,
  ] = useState(1);

  const now = new Date();

  const [
    visibleMonth,
    setVisibleMonth,
  ] = useState(
    new Date(
      now.getFullYear(),
      now.getMonth(),
      1
    )
  );


  // ==========================================
  // DATE HELPERS
  // ==========================================

  const getDateKey = (
    value
  ) => {

    if (!value) {
      return "";
    }


    if (
      typeof value === "string"
    ) {
      return value.split("T")[0];
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


  const getTodayKey = () => {

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


  const formatDisplayDate = (
    value
  ) => {

    const dateKey =
      getDateKey(value);


    if (!dateKey) {
      return "";
    }


    return new Date(
      `${dateKey}T00:00:00`
    ).toLocaleDateString(
      undefined,
      {
        weekday: "short",
        year: "numeric",
        month: "long",
        day: "numeric",
      }
    );
  };


  const today =
    getTodayKey();


  // ==========================================
  // LOAD AVAILABILITY
  // ==========================================

  useEffect(() => {

    let ignore = false;


    const loadAvailability =
      async () => {

        try {

          const response =
            await api.get(
              "/photographer/availability"
            );


          if (!ignore) {

            const items =
              response.data?.data
                ?.availability;


            setAvailability(
              Array.isArray(items)
                ? items
                : []
            );

          }

        } catch (err) {

          console.error(
            "Failed to load availability:",
            err
          );


          if (!ignore) {

            setError(
              err.response?.data
                ?.message ||
                "Failed to load availability."
            );

          }

        } finally {

          if (!ignore) {
            setLoading(false);
          }

        }

      };


    loadAvailability();


    return () => {
      ignore = true;
    };

  }, []);


  // ==========================================
  // SORTED AVAILABILITY
  // ==========================================

  const sortedAvailability =
    useMemo(
      () =>
        [...availability].sort(
          (a, b) => {

            const dateDifference =
              getDateKey(
                a.date
              ).localeCompare(
                getDateKey(
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
        ),
      [availability]
    );


    const availabilityTotalPages =
      Math.ceil(
        sortedAvailability.length /
          AVAILABILITY_PER_PAGE
      );

    const safeAvailabilityPage =
      Math.min(
        availabilityPage,
        Math.max(
          availabilityTotalPages,
          1
        )
      );

    const paginatedAvailability =
      sortedAvailability.slice(
        (safeAvailabilityPage - 1) *
          AVAILABILITY_PER_PAGE,

        safeAvailabilityPage *
          AVAILABILITY_PER_PAGE
      );

    
  // ==========================================
  // AVAILABILITY BY DATE
  // ==========================================

  const availabilityByDate =
    useMemo(
      () => {

        const groups = {};


        sortedAvailability.forEach(
          (item) => {

            const dateKey =
              getDateKey(
                item.date
              );


            if (!groups[dateKey]) {
              groups[dateKey] = [];
            }


            groups[dateKey].push(
              item
            );

          }
        );


        return groups;

      },
      [sortedAvailability]
    );


  const selectedDateItems =
    formData.date
      ? availabilityByDate[
          formData.date
        ] || []
      : [];


  // ==========================================
  // CALENDAR DAYS
  // ==========================================

  const calendarDays =
    useMemo(
      () => {

        const year =
          visibleMonth.getFullYear();

        const month =
          visibleMonth.getMonth();

        const firstDay =
          new Date(
            year,
            month,
            1
          );

        const firstCalendarDay =
          new Date(
            year,
            month,
            1 - firstDay.getDay()
          );


        return Array.from(
          {
            length: 42,
          },
          (_, index) => {

            const date =
              new Date(
                firstCalendarDay
              );

            date.setDate(
              firstCalendarDay.getDate() +
                index
            );


            return {
              date,
              key:
                getDateKey(
                  date
                ),
              currentMonth:
                date.getMonth() ===
                month,
            };

          }
        );

      },
      [visibleMonth]
    );


  const monthLabel =
    visibleMonth.toLocaleDateString(
      undefined,
      {
        month: "long",
        year: "numeric",
      }
    );


  // ==========================================
  // CALENDAR NAVIGATION
  // ==========================================

  const changeMonth = (
    amount
  ) => {

    setVisibleMonth(
      (previous) =>
        new Date(
          previous.getFullYear(),
          previous.getMonth() +
            amount,
          1
        )
    );

  };


  const goToToday = () => {

    const current =
      new Date();


    setVisibleMonth(
      new Date(
        current.getFullYear(),
        current.getMonth(),
        1
      )
    );


    if (!saving) {

      setFormData(
        (previous) => ({
          date: today,
          startTime:
            editingId
              ? previous.startTime
              : "",
          endTime:
            editingId
              ? previous.endTime
              : "",
        })
      );

      setError("");
      setSuccess("");

    }

  };


  // ==========================================
  // SELECT DATE
  // ==========================================

  const handleDateSelect = (
    dateKey
  ) => {

    if (
      dateKey < today ||
      saving
    ) {
      return;
    }


    setFormData(
      (previous) => ({
        date: dateKey,

        startTime:
          editingId
            ? previous.startTime
            : "",

        endTime:
          editingId
            ? previous.endTime
            : "",
      })
    );


    setError("");
    setSuccess("");

  };


  // ==========================================
  // HANDLE TIME INPUT
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
    setSuccess("");

  };


  // ==========================================
  // RESET FORM
  // ==========================================

  const resetForm = () => {

    setFormData(emptyForm);
    setEditingId(null);
    setError("");

  };


  // ==========================================
  // SUBMIT
  // ==========================================

  const handleSubmit =
    async (
      event
    ) => {

      event.preventDefault();

      setError("");
      setSuccess("");


      if (!formData.date) {

        setError(
          "Please select an available date."
        );

        return;

      }


      if (
        formData.date < today
      ) {

        setError(
          "Availability cannot be added for a past date."
        );

        return;

      }


      if (!formData.startTime) {

        setError(
          "Please select a start time."
        );

        return;

      }


      if (!formData.endTime) {

        setError(
          "Please select an end time."
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


      try {

        setSaving(true);


        const payload = {
          date:
            formData.date,

          startTime:
            formData.startTime,

          endTime:
            formData.endTime,
        };


        if (editingId) {

          const response =
            await api.put(
              `/photographer/availability/${editingId}`,
              payload
            );


          const updated =
            response.data?.data
              ?.availability;


          if (!updated) {

            throw new Error(
              "Updated availability was not returned."
            );

          }


          setAvailability(
            (previous) =>
              previous.map(
                (item) =>
                  item._id ===
                  editingId
                    ? updated
                    : item
              )
          );


          setSuccess(
            "Availability updated successfully."
          );

        } else {

          const response =
            await api.post(
              "/photographer/availability",
              payload
            );


          const created =
            response.data?.data
              ?.availability;


          if (!created) {

            throw new Error(
              "Created availability was not returned."
            );

          }


          setAvailability(
            (previous) => [
              ...previous,
              created,
            ]
          );


          setSuccess(
            "Availability added successfully."
          );

        }


        setFormData(
          (previous) => ({
            date:
              previous.date,
            startTime: "",
            endTime: "",
          })
        );

        setEditingId(null);

      } catch (err) {

        console.error(
          "Failed to save availability:",
          err
        );


        setError(
          err.response?.data
            ?.message ||
            err.message ||
            "Failed to save availability."
        );

      } finally {

        setSaving(false);

      }

    };


  // ==========================================
  // EDIT
  // ==========================================

  const startEditing = (
    item
  ) => {

    const dateKey =
      getDateKey(
        item.date
      );


    setEditingId(
      item._id
    );


    setFormData({
      date:
        dateKey,

      startTime:
        item.startTime || "",

      endTime:
        item.endTime || "",
    });


    const selectedDate =
      new Date(
        `${dateKey}T00:00:00`
      );


    setVisibleMonth(
      new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        1
      )
    );


    setError("");
    setSuccess("");


    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });

  };


  // ==========================================
  // DELETE
  // ==========================================

  const handleDelete =
    async () => {

      if (
        !availabilityToDelete?._id
      ) {
        return;
      }


      const id =
        availabilityToDelete._id;


      try {

        setDeletingId(id);
        setError("");
        setSuccess("");


        await api.delete(
          `/photographer/availability/${id}`
        );


        setAvailability(
          (previous) =>
            previous.filter(
              (item) =>
                item._id !== id
            )
        );


        if (
          editingId === id
        ) {
          resetForm();
        }


        setSuccess(
          "Availability deleted successfully."
        );


        setAvailabilityToDelete(
          null
        );

      } catch (err) {

        console.error(
          "Failed to delete availability:",
          err
        );


        setError(
          err.response?.data
            ?.message ||
            "Failed to delete availability."
        );

      } finally {

        setDeletingId(null);

      }

    };


  // ==========================================
  // LOADING SKELETON
  // ==========================================

  const renderLoadingSkeleton =
    () => (

      <div
        className="
          mt-8
          grid
          gap-6
          lg:grid-cols-[1.15fr_0.85fr]
        "
        aria-label="Loading availability"
      >

        <div className="
          animate-pulse
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
            justify-between
          ">

            <div className="
              h-6
              w-40
              rounded
              bg-gray-200
            " />

            <div className="
              flex
              gap-2
            ">

              <div className="
                h-9
                w-9
                rounded-lg
                bg-gray-100
              " />

              <div className="
                h-9
                w-9
                rounded-lg
                bg-gray-100
              " />

            </div>

          </div>


          <div className="
            mt-6
            grid
            grid-cols-7
            gap-2
          ">

            {Array.from(
              {
                length: 42,
              },
              (_, index) => (

                <div
                  key={index}
                  className="
                    aspect-square
                    rounded-lg
                    bg-gray-100
                  "
                />

              )
            )}

          </div>

        </div>


        <div className="
          animate-pulse
          rounded-2xl
          border
          border-gray-200
          bg-white
          p-5
          shadow-sm
          sm:p-6
        ">

          <div className="
            h-6
            w-40
            rounded
            bg-gray-200
          " />

          <div className="
            mt-3
            h-4
            w-56
            max-w-full
            rounded
            bg-gray-100
          " />


          <div className="
            mt-7
            space-y-4
          ">

            <div className="
              h-12
              rounded-xl
              bg-gray-100
            " />

            <div className="
              h-12
              rounded-xl
              bg-gray-100
            " />

            <div className="
              h-11
              rounded-xl
              bg-gray-200
            " />

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

        {/* ==================================
            PAGE HEADER
        ================================== */}

        <div>

          <p className="
            text-sm
            font-semibold
            text-orange-600
          ">
            Schedule Management
          </p>


          <h1 className="
            mt-1
            text-2xl
            font-bold
            tracking-tight
            text-gray-950
            sm:text-3xl
          ">
            Availability
          </h1>


          <p className="
            mt-2
            max-w-2xl
            text-sm
            leading-6
            text-gray-500
          ">
            Choose the dates and time
            periods when customers can
            request your photography
            services.
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
                transition
                hover:text-red-700
                focus:outline-none
                focus-visible:ring-2
                focus-visible:ring-red-500
                focus-visible:ring-offset-2
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
                transition
                hover:text-green-800
                focus:outline-none
                focus-visible:ring-2
                focus-visible:ring-green-500
                focus-visible:ring-offset-2
              "
            >
              ×
            </button>

          </div>

        )}


        {loading ? (

          renderLoadingSkeleton()

        ) : (

          <>

            {/* ==================================
                CALENDAR + EDITOR
            ================================== */}

            <div className="
              mt-8
              grid
              gap-6
              lg:grid-cols-[1.15fr_0.85fr]
              lg:items-start
            ">

              {/* CALENDAR */}

              <section className="
                rounded-2xl
                border
                border-gray-200
                bg-white
                p-4
                shadow-sm
                sm:p-6
              ">

                <div className="
                  flex
                  flex-col
                  gap-4
                  sm:flex-row
                  sm:items-center
                  sm:justify-between
                ">

                  <div>

                    <h2 className="
                      text-lg
                      font-semibold
                      text-gray-950
                    ">
                      Select a Date
                    </h2>


                    <p className="
                      mt-1
                      text-sm
                      text-gray-500
                    ">
                      Dates with saved
                      availability are marked
                      with an orange dot.
                    </p>

                  </div>


                  <button
                    type="button"
                    onClick={
                      goToToday
                    }
                    disabled={saving}
                    className="
                      self-start
                      rounded-lg
                      border
                      border-gray-200
                      bg-white
                      px-3
                      py-2
                      text-sm
                      font-semibold
                      text-gray-600
                      transition
                      hover:bg-gray-50
                      focus:outline-none
                      focus-visible:ring-2
                      focus-visible:ring-orange-500
                      focus-visible:ring-offset-2
                      disabled:cursor-not-allowed
                      disabled:opacity-50
                    "
                  >
                    Today
                  </button>

                </div>


                <div className="
                  mt-6
                  flex
                  items-center
                  justify-between
                ">

                  <button
                    type="button"
                    onClick={() =>
                      changeMonth(-1)
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
                      text-gray-600
                      transition
                      hover:bg-gray-50
                      focus:outline-none
                      focus-visible:ring-2
                      focus-visible:ring-orange-500
                      focus-visible:ring-offset-2
                    "
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2"
                      aria-hidden="true"
                    >
                      <path d="m15 18-6-6 6-6" />
                    </svg>
                  </button>


                  <h3 className="
                    text-sm
                    font-semibold
                    text-gray-950
                    sm:text-base
                  ">
                    {monthLabel}
                  </h3>


                  <button
                    type="button"
                    onClick={() =>
                      changeMonth(1)
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
                      text-gray-600
                      transition
                      hover:bg-gray-50
                      focus:outline-none
                      focus-visible:ring-2
                      focus-visible:ring-orange-500
                      focus-visible:ring-offset-2
                    "
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2"
                      aria-hidden="true"
                    >
                      <path d="m9 18 6-6-6-6" />
                    </svg>
                  </button>

                </div>


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


                  {calendarDays.map(
                    ({
                      date,
                      key,
                      currentMonth,
                    }) => {

                      const isPast =
                        key < today;

                      const isSelected =
                        key ===
                        formData.date;

                      const isToday =
                        key === today;

                      const dateAvailability =
                        availabilityByDate[
                          key
                        ] || [];

                      const hasAvailability =
                        dateAvailability.length >
                        0;


                      return (

                        <button
                          key={key}
                          type="button"
                          onClick={() =>
                            handleDateSelect(
                              key
                            )
                          }
                          disabled={
                            isPast ||
                            saving
                          }
                          aria-label={`${formatDisplayDate(
                            key
                          )}${
                            hasAvailability
                              ? `, ${dateAvailability.length} availability period${dateAvailability.length === 1 ? "" : "s"}`
                              : ""
                          }`}
                          aria-pressed={
                            isSelected
                          }
                          className={`
                            relative
                            flex
                            aspect-square
                            min-h-10
                            items-center
                            justify-center
                            rounded-xl
                            border
                            text-sm
                            font-medium
                            transition
                            focus:outline-none
                            focus-visible:ring-2
                            focus-visible:ring-orange-500
                            focus-visible:ring-offset-2

                            ${
                              isSelected
                                ? `
                                  border-orange-600
                                  bg-orange-600
                                  text-white
                                `
                                : isPast
                                  ? `
                                    cursor-not-allowed
                                    border-transparent
                                    bg-transparent
                                    text-gray-300
                                  `
                                  : isToday
                                    ? `
                                      border-orange-200
                                      bg-orange-50
                                      text-orange-700
                                      hover:bg-orange-100
                                    `
                                    : currentMonth
                                      ? `
                                        border-transparent
                                        text-gray-700
                                        hover:border-gray-200
                                        hover:bg-gray-50
                                      `
                                      : `
                                        border-transparent
                                        text-gray-400
                                        hover:bg-gray-50
                                      `
                            }
                          `}
                        >

                          <span>
                            {date.getDate()}
                          </span>


                          {hasAvailability && (

                            <span
                              className={`
                                absolute
                                bottom-1.5
                                h-1.5
                                w-1.5
                                rounded-full

                                ${
                                  isSelected
                                    ? "bg-white"
                                    : "bg-orange-500"
                                }
                              `}
                              aria-hidden="true"
                            />

                          )}

                        </button>

                      );

                    }
                  )}

                </div>

              </section>


              {/* EDITOR */}

              <section className="
                rounded-2xl
                border
                border-gray-200
                bg-white
                p-5
                shadow-sm
                sm:p-6
              ">

                <div>

                  <p className="
                    text-xs
                    font-semibold
                    uppercase
                    tracking-wide
                    text-orange-600
                  ">
                    {editingId
                      ? "Editing Slot"
                      : "Availability Editor"}
                  </p>


                  <h2 className="
                    mt-1
                    text-lg
                    font-semibold
                    text-gray-950
                  ">
                    {formData.date
                      ? formatDisplayDate(
                          formData.date
                        )
                      : "Choose a date"}
                  </h2>


                  <p className="
                    mt-1
                    text-sm
                    leading-6
                    text-gray-500
                  ">
                    {formData.date
                      ? editingId
                        ? "Update the selected availability period."
                        : "Set the start and end time for this date."
                      : "Select a future date from the calendar to add availability."}
                  </p>

                </div>


                <form
                  onSubmit={
                    handleSubmit
                  }
                  className="
                    mt-6
                  "
                >

                  <div className="
                    grid
                    gap-4
                    sm:grid-cols-2
                  ">

                    <div>

                      <label
                        htmlFor="startTime"
                        className="
                          mb-2
                          block
                          text-sm
                          font-medium
                          text-gray-700
                        "
                      >
                        Start Time
                      </label>


                      <input
                        id="startTime"
                        name="startTime"
                        type="time"
                        value={
                          formData.startTime
                        }
                        onChange={
                          handleChange
                        }
                        disabled={
                          saving ||
                          !formData.date
                        }
                        className="
                          w-full
                          rounded-xl
                          border
                          border-gray-300
                          bg-white
                          px-4
                          py-3
                          text-sm
                          text-gray-900
                          outline-none
                          transition
                          focus:border-orange-500
                          focus:ring-2
                          focus:ring-orange-500/10
                          disabled:cursor-not-allowed
                          disabled:bg-gray-100
                          disabled:text-gray-400
                        "
                      />

                    </div>


                    <div>

                      <label
                        htmlFor="endTime"
                        className="
                          mb-2
                          block
                          text-sm
                          font-medium
                          text-gray-700
                        "
                      >
                        End Time
                      </label>


                      <input
                        id="endTime"
                        name="endTime"
                        type="time"
                        value={
                          formData.endTime
                        }
                        onChange={
                          handleChange
                        }
                        disabled={
                          saving ||
                          !formData.date
                        }
                        className="
                          w-full
                          rounded-xl
                          border
                          border-gray-300
                          bg-white
                          px-4
                          py-3
                          text-sm
                          text-gray-900
                          outline-none
                          transition
                          focus:border-orange-500
                          focus:ring-2
                          focus:ring-orange-500/10
                          disabled:cursor-not-allowed
                          disabled:bg-gray-100
                          disabled:text-gray-400
                        "
                      />

                    </div>

                  </div>


                  <div className="
                    mt-5
                    flex
                    flex-col-reverse
                    gap-3
                    sm:flex-row
                    sm:justify-end
                  ">

                    {editingId && (

                      <button
                        type="button"
                        onClick={
                          resetForm
                        }
                        disabled={saving}
                        className="
                          rounded-xl
                          border
                          border-gray-300
                          bg-white
                          px-5
                          py-3
                          text-sm
                          font-semibold
                          text-gray-700
                          transition
                          hover:bg-gray-50
                          focus:outline-none
                          focus-visible:ring-2
                          focus-visible:ring-gray-500
                          focus-visible:ring-offset-2
                          disabled:cursor-not-allowed
                          disabled:opacity-50
                        "
                      >
                        Cancel Editing
                      </button>

                    )}


                    <button
                      type="submit"
                      disabled={
                        saving ||
                        !formData.date
                      }
                      className="
                        rounded-xl
                        bg-gray-950
                        px-5
                        py-3
                        text-sm
                        font-semibold
                        text-white
                        shadow-sm
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
                      {saving
                        ? editingId
                          ? "Saving Changes..."
                          : "Adding..."
                        : editingId
                          ? "Save Changes"
                          : "Add Availability"}
                    </button>

                  </div>

                </form>


                {/* SELECTED DATE SLOTS */}

                {formData.date && (

                  <div className="
                    mt-7
                    border-t
                    border-gray-200
                    pt-6
                  ">

                    <div className="
                      flex
                      items-center
                      justify-between
                      gap-3
                    ">

                      <h3 className="
                        text-sm
                        font-semibold
                        text-gray-950
                      ">
                        Existing on this date
                      </h3>


                      <span className="
                        rounded-full
                        bg-gray-100
                        px-2.5
                        py-1
                        text-xs
                        font-semibold
                        text-gray-600
                      ">
                        {selectedDateItems.length}
                      </span>

                    </div>


                    {selectedDateItems.length ===
                    0 ? (

                      <p className="
                        mt-3
                        rounded-xl
                        bg-gray-50
                        px-4
                        py-3
                        text-sm
                        leading-6
                        text-gray-500
                      ">
                        No availability has
                        been added for this
                        date yet.
                      </p>

                    ) : (

                      <div className="
                        mt-3
                        space-y-2
                      ">

                        {selectedDateItems.map(
                          (item) => (

                            <div
                              key={
                                item._id
                              }
                              className="
                                flex
                                items-center
                                justify-between
                                gap-3
                                rounded-xl
                                border
                                border-gray-200
                                px-4
                                py-3
                              "
                            >

                              <span className="
                                text-sm
                                font-medium
                                text-gray-700
                              ">
                                {item.startTime}
                                {" — "}
                                {item.endTime}
                              </span>


                              <button
                                type="button"
                                onClick={() =>
                                  startEditing(
                                    item
                                  )
                                }
                                disabled={
                                  saving ||
                                  Boolean(
                                    deletingId
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
                                  disabled:cursor-not-allowed
                                  disabled:opacity-50
                                "
                              >
                                Edit
                              </button>

                            </div>

                          )
                        )}

                      </div>

                    )}

                  </div>

                )}

              </section>

            </div>


            {/* ==================================
                FULL SCHEDULE
            ================================== */}

            <section className="
              mt-10
              border-t
              border-gray-200
              pt-8
            ">

              <div className="
                mb-5
                flex
                flex-col
                gap-2
                sm:flex-row
                sm:items-end
                sm:justify-between
              ">

                <div>

                  <h2 className="
                    text-xl
                    font-semibold
                    text-gray-950
                  ">
                    My Availability
                  </h2>


                  <p className="
                    mt-1
                    text-sm
                    text-gray-500
                  ">
                    Review and manage all
                    saved availability periods.
                  </p>

                </div>


                <span className="
                  text-sm
                  font-medium
                  text-gray-500
                ">
                  {sortedAvailability.length}
                  {" "}
                  {sortedAvailability.length ===
                  1
                    ? "period"
                    : "periods"}
                </span>

              </div>


              {sortedAvailability.length ===
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
                    No availability added
                  </h3>


                  <p className="
                    mx-auto
                    mt-2
                    max-w-md
                    text-sm
                    leading-6
                    text-gray-500
                  ">
                    Add availability so
                    customers can request a
                    photography booking.
                  </p>

                </div>

                ) : (

                  <>

                    <div className="
                      space-y-3
                    ">

                      {paginatedAvailability.map(
                        (item) => {

                          const itemDate =
                            getDateKey(
                              item.date
                            );

                          const isPast =
                            itemDate < today;


                          return (

                            <article
                              key={item._id}
                              className="
                                flex
                                flex-col
                                gap-4
                                rounded-2xl
                                border
                                border-gray-200
                                bg-white
                                p-5
                                shadow-sm
                                sm:flex-row
                                sm:items-center
                                sm:justify-between
                              "
                            >

                              <div className="
                                min-w-0
                              ">

                                <div className="
                                  flex
                                  flex-wrap
                                  items-center
                                  gap-2
                                ">

                                  <p className="
                                    font-semibold
                                    text-gray-950
                                  ">
                                    {formatDisplayDate(
                                      item.date
                                    )}
                                  </p>


                                  {isPast && (

                                    <span className="
                                      rounded-full
                                      bg-gray-100
                                      px-2.5
                                      py-1
                                      text-xs
                                      font-semibold
                                      text-gray-500
                                    ">
                                      Past
                                    </span>

                                  )}

                                </div>


                                <p className="
                                  mt-1
                                  text-sm
                                  text-gray-500
                                ">
                                  {item.startTime}
                                  {" — "}
                                  {item.endTime}
                                </p>

                              </div>


                              <div className="
                                flex
                                flex-wrap
                                gap-2
                              ">

                                {!isPast && (

                                  <button
                                    type="button"
                                    onClick={() =>
                                      startEditing(
                                        item
                                      )
                                    }
                                    disabled={
                                      saving ||
                                      Boolean(
                                        deletingId
                                      )
                                    }
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
                                      hover:bg-gray-50
                                      focus:outline-none
                                      focus-visible:ring-2
                                      focus-visible:ring-gray-500
                                      focus-visible:ring-offset-2
                                      disabled:cursor-not-allowed
                                      disabled:opacity-50
                                    "
                                  >
                                    Edit
                                  </button>

                                )}


                                <button
                                  type="button"
                                  onClick={() =>
                                    setAvailabilityToDelete(
                                      item
                                    )
                                  }
                                  disabled={
                                    saving ||
                                    Boolean(
                                      deletingId
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
                                  {deletingId ===
                                  item._id
                                    ? "Deleting..."
                                    : "Delete"}
                                </button>

                              </div>

                            </article>

                          );

                        }
                      )}

                    </div>


                    {availabilityTotalPages > 1 && (

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
                            setAvailabilityPage(
                              Math.max(
                                safeAvailabilityPage - 1,
                                1
                              )
                            )
                          }
                          disabled={
                            safeAvailabilityPage === 1
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
                          Page {safeAvailabilityPage}
                          {" "}of{" "}
                          {availabilityTotalPages}
                        </p>


                        <button
                          type="button"
                          onClick={() =>
                            setAvailabilityPage(
                              Math.min(
                                safeAvailabilityPage + 1,
                                availabilityTotalPages
                              )
                            )
                          }
                          disabled={
                            safeAvailabilityPage ===
                            availabilityTotalPages
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

                    )}

                  </>

                )}

            </section>

          </>

        )}

      </div>


      <ConfirmDialog
        open={
          Boolean(
            availabilityToDelete
          )
        }
        title="Delete availability?"
        message="This availability period will be permanently removed."
        confirmLabel="Delete Availability"
        cancelLabel="Keep Availability"
        loading={
          deletingId ===
          availabilityToDelete?._id
        }
        onCancel={() => {

          if (!deletingId) {

            setAvailabilityToDelete(
              null
            );

          }

        }}
        onConfirm={
          handleDelete
        }
      />

    </main>
  );
};


export default PhotographerAvailability;
