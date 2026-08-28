import {
  useEffect,
  useState,
} from "react";

import {
  Link,
  useParams,
} from "react-router-dom";

import api from "../../services/api";
import Loading from "../../components/Loading";


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


  const formatDate = (
    value
  ) => {

    return new Date(
      value
    ).toLocaleDateString(
      undefined,
      {
        year: "numeric",
        month: "long",
        day: "numeric",
      }
    );
  };


  if (loading) {
    return <Loading />;
  }


  if (
    error ||
    !photographer
  ) {

    return (
      <main className="min-h-screen bg-gray-50 px-4 py-10">

        <div className="mx-auto max-w-4xl rounded-2xl border border-red-200 bg-white p-8 shadow-sm">

          <h1 className="text-2xl font-bold text-gray-950">
            Photographer unavailable
          </h1>


          <p className="mt-3 text-sm text-red-600">
            {error ||
              "Photographer not found."}
          </p>


          <Link
            to="/customer/photographers"
            className="mt-6 inline-flex rounded-xl bg-gray-950 px-5 py-3 text-sm font-semibold text-white"
          >
            Back to Photographers
          </Link>

        </div>

      </main>
    );
  }


  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">

      <div className="mx-auto max-w-6xl">


        <Link
          to="/customer/photographers"
          className="text-sm font-medium text-gray-500 transition hover:text-gray-950"
        >
          ← Back to Photographers
        </Link>


        {/* PROFILE */}

        <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">

          <div className="flex flex-col gap-6 md:flex-row">


            {/* IMAGE */}

            <div className="shrink-0">

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
                  className="h-40 w-40 rounded-2xl object-cover"
                />

              ) : (

                <div className="flex h-40 w-40 items-center justify-center rounded-2xl bg-orange-100 text-4xl font-bold text-orange-700">

                  {photographer.user
                    ?.name
                    ?.charAt(0)
                    ?.toUpperCase() ||
                    "P"}

                </div>

              )}

            </div>


            <div className="flex-1">

              <p className="text-sm font-semibold uppercase tracking-wider text-orange-600">
                Photographer
              </p>


              <h1 className="mt-2 text-3xl font-bold text-gray-950">
                {
                  photographer.user
                    ?.name
                }
              </h1>


              <p className="mt-2 text-lg font-medium text-gray-700">
                {photographer.specialization ||
                  "Professional Photographer"}
              </p>


              {photographer.location && (

                <p className="mt-3 text-sm text-gray-500">
                  Location:{" "}
                  {
                    photographer.location
                  }
                </p>

              )}


              <div className="mt-5">

                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  Hourly Rate
                </p>


                <p className="mt-1 text-xl font-bold text-gray-950">

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

            </div>

          </div>


          {photographer.bio && (

            <div className="mt-8 border-t border-gray-100 pt-6">

              <h2 className="text-lg font-semibold text-gray-950">
                About
              </h2>


              <p className="mt-3 whitespace-pre-line text-sm leading-7 text-gray-600">
                {photographer.bio}
              </p>

            </div>

          )}

        </section>


        {/* PACKAGES */}

        <section className="mt-8">

          <h2 className="text-xl font-semibold text-gray-950">
            Photography Packages
          </h2>


          {photographer
            .packageRates
            ?.length > 0 ? (

            <div className="mt-5 grid gap-5 md:grid-cols-2">

              {photographer.packageRates.map(
                (pkg) => (

                  <article
                    key={pkg._id}
                    className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
                  >

                    <h3 className="font-semibold text-gray-950">
                      {pkg.name}
                    </h3>


                    {pkg.description && (

                      <p className="mt-2 text-sm leading-6 text-gray-500">
                        {
                          pkg.description
                        }
                      </p>

                    )}


                    <p className="mt-5 text-lg font-bold text-orange-600">
                      LKR{" "}
                      {Number(
                        pkg.price
                      ).toLocaleString()}
                    </p>

                  </article>

                )
              )}

            </div>

          ) : (

            <p className="mt-4 text-sm text-gray-500">
              No photography packages have
              been added yet.
            </p>

          )}

        </section>


        {/* PORTFOLIO */}

        <section className="mt-10">

          <h2 className="text-xl font-semibold text-gray-950">
            Portfolio
          </h2>


          {portfolio.length ===
          0 ? (

            <p className="mt-4 text-sm text-gray-500">
              No portfolio items available.
            </p>

          ) : (

            <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">

              {portfolio.map(
                (item) => (

                  <article
                    key={item._id}
                    className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
                  >

                    <div className="aspect-[4/3] bg-gray-100">

                      <img
                        src={
                          item.imageUrl
                        }
                        alt={
                          item.title
                        }
                        className="h-full w-full object-cover"
                      />

                    </div>


                    <div className="p-5">

                      <h3 className="font-semibold text-gray-950">
                        {
                          item.title
                        }
                      </h3>


                      {item.description && (

                        <p className="mt-2 text-sm leading-6 text-gray-500">
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


        {/* AVAILABILITY */}

        <section className="mt-10">

          <h2 className="text-xl font-semibold text-gray-950">
            Availability
          </h2>


          <p className="mt-1 text-sm text-gray-500">
            Upcoming available dates and
            service periods.
          </p>


          {availability.length ===
          0 ? (

            <div className="mt-5 rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center">

              <p className="text-sm text-gray-500">
                This photographer has no
                upcoming availability listed.
              </p>

            </div>

          ) : (

            <div className="mt-5 space-y-3">

              {availability.map(
                (slot) => (

                  <div
                    key={slot._id}
                    className="flex flex-col justify-between gap-3 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center"
                  >

                    <div>

                      <p className="font-semibold text-gray-950">
                        {formatDate(
                          slot.date
                        )}
                      </p>


                      <p className="mt-1 text-sm text-gray-500">
                        {
                          slot.startTime
                        }
                        {" — "}
                        {
                          slot.endTime
                        }
                      </p>

                    </div>


                    <span className="w-fit rounded-full bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700">
                      Available
                    </span>

                  </div>

                )
              )}

            </div>

          )}

        </section>


        {/* BOOKING PLACEHOLDER */}

        <section className="mt-10 rounded-2xl border border-orange-200 bg-orange-50 p-6">

          <h2 className="text-lg font-semibold text-gray-950">
            Want to book this photographer?
          </h2>


          <p className="mt-2 text-sm leading-6 text-gray-600">
            Photographer booking will be
            available in the next phase.
          </p>

        </section>

      </div>

    </main>
  );
};


export default PhotographerDetails;