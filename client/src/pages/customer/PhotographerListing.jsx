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

  const PHOTOGRAPHERS_PER_PAGE = 6;

  const [
    currentPage,
    setCurrentPage,
  ] = useState(1);


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
  // SEARCH
  // ==========================================

  const handleSearch = async (event) => {
    event.preventDefault();

    try {
      setSearching(true);

      setCurrentPage(1);

      await fetchPhotographers(filters);
    } finally {
      setSearching(false);
    }
  };


  const totalPages =
    Math.ceil(
      photographers.length /
        PHOTOGRAPHERS_PER_PAGE
    );

  const safeCurrentPage =
    Math.min(
      currentPage,
      Math.max(totalPages, 1)
    );

  const paginatedPhotographers =
    photographers.slice(
      (safeCurrentPage - 1) *
        PHOTOGRAPHERS_PER_PAGE,

      safeCurrentPage *
        PHOTOGRAPHERS_PER_PAGE
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
            PHOTOGRAPHER SEARCH
        ================================== */}

        <section className="
          mx-auto
          mt-6
          max-w-3xl
        ">

          <form
            onSubmit={handleSearch}
            className="
              flex
              items-center
              gap-5
              rounded-2xl
              border
              border-gray-200
              bg-white
              p-2
              shadow-sm
              transition
              focus-within:border-orange-300
              focus-within:shadow-md
            "
          >

            {/* Search icon */}
            <div className="
              flex
              h-10
              w-10
              shrink-0
              items-center
              justify-center
              text-gray-400
            ">
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
            </div>


            {/* Search input */}
            <input
              id="search"
              name="search"
              type="text"
              value={filters.search}
              onChange={handleChange}
              placeholder="Search photographers..."
              className="
                min-w-0
                flex-1
                border-0
                bg-transparent
                px-1
                py-2.5
                text-sm
                text-gray-950
                outline-none
                placeholder:text-gray-400
                focus:ring-0
              "
            />


            {/* Search button */}
            <button
              type="submit"
              disabled={searching}
              className="
                shrink-0
                rounded-xl
                bg-orange-600
                px-5
                py-2.5
                text-sm
                font-semibold
                text-white
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
                : "Search"}
            </button>

          </form>


          {/* Error */}
          {error && (
            <div className="
              mt-3
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
              No photographers match your search.
              Try a different name, specialization, or location.
            </p>


          </div>

          ) : (

            /* ================================
                PHOTOGRAPHER GRID
            ================================ */

            <div>

              <div className="
                mt-7
                grid
                gap-5
                md:grid-cols-2
                xl:grid-cols-3
              ">

                {paginatedPhotographers.map(
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


            {totalPages > 1 && (

              <div className="
                mt-8
                flex
                items-center
                justify-center
                gap-3
              ">

                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage(
                      Math.max(
                        safeCurrentPage - 1,
                        1
                      )
                    )
                  }
                  disabled={
                    safeCurrentPage === 1
                  }
                  className="
                    rounded-lg
                    border
                    border-gray-200
                    bg-white
                    px-4
                    py-2
                    text-sm
                    font-medium
                    text-gray-700
                    transition
                    hover:bg-gray-50
                    disabled:cursor-not-allowed
                    disabled:opacity-40
                  "
                >
                  Previous
                </button>


                <span className="
                  text-sm
                  text-gray-500
                ">
                  Page{" "}

                  <span className="
                    font-semibold
                    text-gray-900
                  ">
                    {safeCurrentPage}
                  </span>

                  {" "}of{" "}
                  {totalPages}
                </span>


                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage(
                      Math.min(
                        safeCurrentPage + 1,
                        totalPages
                      )
                    )
                  }
                  disabled={
                    safeCurrentPage ===
                    totalPages
                  }
                  className="
                    rounded-lg
                    border
                    border-gray-200
                    bg-white
                    px-4
                    py-2
                    text-sm
                    font-medium
                    text-gray-700
                    transition
                    hover:bg-gray-50
                    disabled:cursor-not-allowed
                    disabled:opacity-40
                  "
                >
                  Next
                </button>

              </div>

            )}

          </div>

        )}

      </div>

    </main>
  );

};
     

export default PhotographerListing;