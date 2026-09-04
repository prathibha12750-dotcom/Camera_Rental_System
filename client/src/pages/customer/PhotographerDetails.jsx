import {
  useEffect,
  useState,
} from "react";

import {
  Link,
  useParams,
} from "react-router-dom";

import api from "../../services/api";


const PhotographerDetails = () => {

  const {
    id,
  } = useParams();


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
  // DATE FORMAT
  // ==========================================

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
        year: "numeric",
        month: "short",
        day: "numeric",
      }
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
        max-w-7xl
      ">


        {/* ==================================
            BACK NAVIGATION
        ================================== */}

        <Link
          to="/customer/photographers"
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
                  to={`/customer/photographers/${photographer._id}/book`}
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
                  Book Photographer
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

              {portfolio.map(
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
            AVAILABILITY
        ================================== */}

        <section className="mt-10">

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
                Available dates and
                time periods currently
                listed by the photographer.
              </p>

            </div>

          </div>


          {availability.length ===
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
                This photographer has no
                upcoming availability
                listed.
              </p>

            </div>

          ) : (

            <div className="
              mt-5
              grid
              gap-3
              md:grid-cols-2
            ">

              {availability.map(
                (slot) => (

                  <div
                    key={slot._id}
                    className="
                      flex
                      items-center
                      justify-between
                      gap-4
                      rounded-2xl
                      border
                      border-gray-200
                      bg-white
                      p-5
                      shadow-sm
                    "
                  >

                    <div className="
                      min-w-0
                    ">

                      <p className="
                        font-semibold
                        text-gray-950
                      ">
                        {formatDate(
                          slot.date
                        )}
                      </p>


                      <p className="
                        mt-1
                        text-sm
                        text-gray-500
                      ">

                        {slot.startTime}

                        {" — "}

                        {slot.endTime}

                      </p>

                    </div>


                    <span className="
                      shrink-0
                      rounded-full
                      border
                      border-green-200
                      bg-green-50
                      px-3
                      py-1.5
                      text-xs
                      font-semibold
                      text-green-700
                    ">
                      Available
                    </span>

                  </div>

                )
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
            to={`/customer/photographers/${photographer._id}/book`}
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
            Book Photographer
          </Link>

        </section>

      </div>

    </main>
  );

};


export default PhotographerDetails;