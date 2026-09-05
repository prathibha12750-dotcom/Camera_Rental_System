import {
  useEffect,
  useState,
} from "react";

import {
  Link,
  useLocation,
} from "react-router-dom";

import api from "../../services/api";


const emptyFilters = {
  search: "",
  specialization: "",
  location: "",
  minRate: "",
  maxRate: "",
};


const PhotographerListing = () => {

    const location = useLocation();

    const photographerBasePath =
      location.pathname.startsWith(
        "/customer"
      )
        ? "/customer/photographers"
        : "/photographers";


  const [
    photographers,
    setPhotographers,
  ] = useState([]);

  const [
    filters,
    setFilters,
  ] = useState(
    emptyFilters
  );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    searching,
    setSearching,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");


  // ==========================================
  // FETCH PHOTOGRAPHERS
  // ==========================================

  const fetchPhotographers = async (
    currentFilters = {}
  ) => {

    try {

      setError("");


      const params = {};


      Object.entries(
        currentFilters
      ).forEach(
        ([key, value]) => {

          if (
            value !== undefined &&
            value !== null &&
            String(value).trim() !== ""
          ) {

            params[key] =
              String(value).trim();

          }

        }
      );


      const response =
        await api.get(
          "/customer/photographers",
          {
            params,
          }
        );


      setPhotographers(
        Array.isArray(
          response.data?.data
            ?.photographers
        )
          ? response.data.data
              .photographers
          : []
      );

    } catch (err) {

      console.error(
        "Failed to load photographers:",
        err
      );


      setError(
        err.response?.data?.message ||
          "Failed to load photographers."
      );

    }

  };


  // ==========================================
  // INITIAL LOAD
  // ==========================================

  useEffect(() => {

    let ignore = false;


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

          console.error(
            "Failed to load photographers:",
            err
          );


          if (!ignore) {

            setError(
              err.response?.data
                ?.message ||
                "Failed to load photographers."
            );

          }

        } finally {

          if (!ignore) {
            setLoading(false);
          }

        }

      };


    loadPhotographers();


    return () => {
      ignore = true;
    };

  }, []);


  // ==========================================
  // FILTER CHANGE
  // ==========================================

  const handleChange = (
    event
  ) => {

    const {
      name,
      value,
    } = event.target;


    setFilters(
      (previous) => ({
        ...previous,
        [name]: value,
      })
    );


    setError("");

  };


  // ==========================================
  // VALIDATE RATE FILTERS
  // ==========================================

  const validateRates = () => {

    if (
      filters.minRate !== "" &&
      Number(filters.minRate) < 0
    ) {

      setError(
        "Minimum rate cannot be negative."
      );

      return false;

    }


    if (
      filters.maxRate !== "" &&
      Number(filters.maxRate) < 0
    ) {

      setError(
        "Maximum rate cannot be negative."
      );

      return false;

    }


    if (
      filters.minRate !== "" &&
      filters.maxRate !== "" &&
      Number(filters.minRate) >
        Number(filters.maxRate)
    ) {

      setError(
        "Minimum rate cannot be greater than maximum rate."
      );

      return false;

    }


    return true;

  };


  // ==========================================
  // SEARCH
  // ==========================================

  const handleSearch =
    async (event) => {

      event.preventDefault();


      if (!validateRates()) {
        return;
      }


      try {

        setSearching(true);

        await fetchPhotographers(
          filters
        );

      } finally {

        setSearching(false);

      }

    };


  // ==========================================
  // CLEAR FILTERS
  // ==========================================

  const clearFilters =
    async () => {

      setFilters(
        emptyFilters
      );


      try {

        setSearching(true);

        await fetchPhotographers(
          emptyFilters
        );

      } finally {

        setSearching(false);

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
            PAGE HEADER
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
              Discover Professionals
            </p>


            <h1 className="
              mt-1
              text-2xl
              font-bold
              tracking-tight
              text-gray-950
              sm:text-3xl
            ">
              Find a Photographer
            </h1>


            <p className="
              mt-2
              max-w-2xl
              text-sm
              leading-6
              text-gray-600
            ">
              Explore photographers,
              compare their specialties and
              rates, and find the right
              professional for your event.
            </p>

          </div>


          {!loading &&
            !error && (

            <p className="
              text-sm
              font-medium
              text-gray-500
            ">

              {photographers.length}{" "}

              {photographers.length === 1
                ? "photographer"
                : "photographers"}

            </p>

          )}

        </div>


        {/* ==================================
            SEARCH AND FILTERS
        ================================== */}

        <section className="
          mt-6
          rounded-2xl
          border
          border-gray-200
          bg-white
          p-5
          shadow-sm
          sm:p-6
        ">

          <form
            onSubmit={
              handleSearch
            }
          >

            {/* Search */}

            <div>

              <label
                htmlFor="search"
                className="
                  mb-2
                  block
                  text-sm
                  font-medium
                  text-gray-700
                "
              >
                Search photographers
              </label>


              <div className="relative">

                <svg
                  className="
                    pointer-events-none
                    absolute
                    left-4
                    top-1/2
                    h-5
                    w-5
                    -translate-y-1/2
                    text-gray-400
                  "
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


                <input
                  id="search"
                  name="search"
                  type="text"
                  value={
                    filters.search
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Search by name, specialization or location"
                  className="
                    w-full
                    rounded-xl
                    border
                    border-gray-300
                    bg-white
                    py-3
                    pl-11
                    pr-4
                    text-sm
                    text-gray-950
                    outline-none
                    transition
                    placeholder:text-gray-400
                    focus:border-orange-500
                    focus:ring-2
                    focus:ring-orange-500/10
                  "
                />

              </div>

            </div>


            {/* Filters */}

            <div className="
              mt-5
              grid
              gap-4
              sm:grid-cols-2
              lg:grid-cols-4
            ">

              {/* Specialization */}

              <div>

                <label
                  htmlFor="specialization"
                  className="
                    mb-2
                    block
                    text-sm
                    font-medium
                    text-gray-700
                  "
                >
                  Specialization
                </label>


                <input
                  id="specialization"
                  name="specialization"
                  type="text"
                  value={
                    filters.specialization
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="e.g. Wedding"
                  className="
                    w-full
                    rounded-xl
                    border
                    border-gray-300
                    px-4
                    py-3
                    text-sm
                    outline-none
                    transition
                    focus:border-orange-500
                    focus:ring-2
                    focus:ring-orange-500/10
                  "
                />

              </div>


              {/* Location */}

              <div>

                <label
                  htmlFor="location"
                  className="
                    mb-2
                    block
                    text-sm
                    font-medium
                    text-gray-700
                  "
                >
                  Location
                </label>


                <input
                  id="location"
                  name="location"
                  type="text"
                  value={
                    filters.location
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="e.g. Matara"
                  className="
                    w-full
                    rounded-xl
                    border
                    border-gray-300
                    px-4
                    py-3
                    text-sm
                    outline-none
                    transition
                    focus:border-orange-500
                    focus:ring-2
                    focus:ring-orange-500/10
                  "
                />

              </div>


              {/* Minimum Rate */}

              <div>

                <label
                  htmlFor="minRate"
                  className="
                    mb-2
                    block
                    text-sm
                    font-medium
                    text-gray-700
                  "
                >
                  Minimum Rate
                </label>


                <input
                  id="minRate"
                  name="minRate"
                  type="number"
                  min="0"
                  value={
                    filters.minRate
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="LKR"
                  className="
                    w-full
                    rounded-xl
                    border
                    border-gray-300
                    px-4
                    py-3
                    text-sm
                    outline-none
                    transition
                    focus:border-orange-500
                    focus:ring-2
                    focus:ring-orange-500/10
                  "
                />

              </div>


              {/* Maximum Rate */}

              <div>

                <label
                  htmlFor="maxRate"
                  className="
                    mb-2
                    block
                    text-sm
                    font-medium
                    text-gray-700
                  "
                >
                  Maximum Rate
                </label>


                <input
                  id="maxRate"
                  name="maxRate"
                  type="number"
                  min="0"
                  value={
                    filters.maxRate
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Any"
                  className="
                    w-full
                    rounded-xl
                    border
                    border-gray-300
                    px-4
                    py-3
                    text-sm
                    outline-none
                    transition
                    focus:border-orange-500
                    focus:ring-2
                    focus:ring-orange-500/10
                  "
                />

              </div>

            </div>


            {/* Error */}

            {error && (

              <div className="
                mt-4
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


            {/* Actions */}

            <div className="
              mt-5
              flex
              flex-col
              gap-3
              sm:flex-row
              sm:items-center
            ">

              <button
                type="submit"
                disabled={
                  searching
                }
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
                  disabled:cursor-not-allowed
                  disabled:opacity-60
                  focus:outline-none
                  focus-visible:ring-2
                  focus-visible:ring-orange-500
                  focus-visible:ring-offset-2
                "
              >
                {searching
                  ? "Searching..."
                  : "Search Photographers"}
              </button>


              <button
                type="button"
                onClick={
                  clearFilters
                }
                disabled={
                  searching
                }
                className="
                  inline-flex
                  items-center
                  justify-center
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
                  disabled:cursor-not-allowed
                  disabled:opacity-60
                "
              >
                Clear Filters
              </button>

            </div>

          </form>

        </section>


        {/* ==================================
            INITIAL LOADING SKELETONS
        ================================== */}

        {loading ? (

          <div className="
            mt-7
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
                    aspect-[4/3]
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

                    <div className="
                      mt-5
                      h-10
                      rounded-xl
                      bg-gray-100
                    " />

                  </div>

                </div>

              )
            )}

          </div>

        ) : photographers.length === 0 ? (

          /* ================================
              EMPTY STATE
          ================================ */

          <div className="
            mt-7
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
                <circle
                  cx="11"
                  cy="11"
                  r="7"
                />

                <path d="m20 20-3.5-3.5" />
              </svg>

            </div>


            <h2 className="
              mt-4
              text-lg
              font-semibold
              text-gray-950
            ">
              No photographers found
            </h2>


            <p className="
              mx-auto
              mt-2
              max-w-md
              text-sm
              leading-6
              text-gray-500
            ">
              No photographers match
              your current search and
              filter criteria.
            </p>


            <button
              type="button"
              onClick={
                clearFilters
              }
              className="
                mt-5
                text-sm
                font-semibold
                text-orange-600
                hover:text-orange-700
              "
            >
              Clear filters
            </button>

          </div>

        ) : (

          /* ================================
              PHOTOGRAPHER GRID
          ================================ */

          <div className="
            mt-7
            grid
            gap-5
            md:grid-cols-2
            xl:grid-cols-3
          ">

            {photographers.map(
              (photographer) => (

                <article
                  key={
                    photographer._id
                  }
                  className="
                    group
                    flex
                    min-w-0
                    flex-col
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

                  {/* IMAGE */}

                  <div className="
                    relative
                    aspect-[4/3]
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
                        h-full
                        items-center
                        justify-center
                        bg-gradient-to-br
                        from-orange-50
                        to-gray-100
                      ">

                        <div className="
                          flex
                          h-20
                          w-20
                          items-center
                          justify-center
                          rounded-full
                          bg-white
                          text-2xl
                          font-bold
                          text-orange-700
                          shadow-sm
                        ">

                          {photographer.user
                            ?.name
                            ?.charAt(0)
                            ?.toUpperCase() ||
                            "P"}

                        </div>

                      </div>

                    )}


                    {photographer.specialization && (

                      <span className="
                        absolute
                        bottom-3
                        left-3
                        max-w-[calc(100%-1.5rem)]
                        truncate
                        rounded-full
                        bg-white/95
                        px-3
                        py-1.5
                        text-xs
                        font-semibold
                        text-gray-800
                        shadow-sm
                        backdrop-blur
                      ">
                        {
                          photographer.specialization
                        }
                      </span>

                    )}

                  </div>


                  {/* CARD CONTENT */}

                  <div className="
                    flex
                    flex-1
                    flex-col
                    p-5
                  ">

                    <div>

                      <h2 className="
                        truncate
                        text-lg
                        font-semibold
                        text-gray-950
                      ">

                        {photographer.user
                          ?.name ||
                          "Photographer"}

                      </h2>


                      <div className="
                        mt-2
                        flex
                        min-h-5
                        items-center
                        gap-1.5
                        text-sm
                        text-gray-500
                      ">

                        <svg
                          className="
                            h-4
                            w-4
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


                        <span className="truncate">

                          {photographer.location ||
                            "Location not specified"}

                        </span>

                      </div>

                    </div>


                    <div className="
                      mt-5
                      flex
                      items-end
                      justify-between
                      gap-4
                    ">

                      <div>

                        <p className="
                          text-xs
                          text-gray-400
                        ">
                          Hourly rate
                        </p>


                        <p className="
                          mt-1
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
                            : "Contact"}

                        </p>

                      </div>


                      <Link
                        to={`${photographerBasePath}/${photographer._id}`}
                        className="
                          shrink-0
                          rounded-xl
                          bg-gray-950
                          px-4
                          py-2.5
                          text-sm
                          font-semibold
                          text-white
                          transition
                          hover:bg-orange-600
                          focus:outline-none
                          focus-visible:ring-2
                          focus-visible:ring-orange-500
                          focus-visible:ring-offset-2
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

      </div>

    </main>
  );

};
     

export default PhotographerListing;