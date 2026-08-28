import {
  useEffect,
  useState,
} from "react";

import {
  Link,
} from "react-router-dom";

import api from "../../services/api";
import Loading from "../../components/Loading";


const PhotographerListing = () => {

  const [
    photographers,
    setPhotographers,
  ] = useState([]);

  const [
    filters,
    setFilters,
  ] = useState({
    search: "",
    specialization: "",
    location: "",
    minRate: "",
    maxRate: "",
  });

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
  // HANDLE FILTER CHANGE
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

  const handleSearch =
    async (event) => {

      event.preventDefault();


      if (
        filters.minRate !== "" &&
        Number(filters.minRate) < 0
      ) {
        setError(
          "Minimum rate cannot be negative."
        );

        return;
      }


      if (
        filters.maxRate !== "" &&
        Number(filters.maxRate) < 0
      ) {
        setError(
          "Maximum rate cannot be negative."
        );

        return;
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

      const emptyFilters = {
        search: "",
        specialization: "",
        location: "",
        minRate: "",
        maxRate: "",
      };


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


  if (loading) {
    return <Loading />;
  }


  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">

      <div className="mx-auto max-w-7xl">


        {/* HEADER */}

        <div className="mb-8">

          <Link
            to="/customer"
            className="text-sm font-medium text-gray-500 transition hover:text-gray-950"
          >
            ← Back to Dashboard
          </Link>


          <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-950">
            Find a Photographer
          </h1>


          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
            Browse photographer profiles,
            portfolios, rates and availability
            before making a booking.
          </p>

        </div>


        {/* SEARCH / FILTER */}

        <section className="mb-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

          <form
            onSubmit={
              handleSearch
            }
          >

            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-5">


              <div className="lg:col-span-2">

                <label
                  htmlFor="search"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Search
                </label>


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
                  placeholder="Name, specialization or location"
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10"
                />

              </div>


              <div>

                <label
                  htmlFor="location"
                  className="mb-2 block text-sm font-medium text-gray-700"
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
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10"
                />

              </div>


              <div>

                <label
                  htmlFor="minRate"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Min Rate
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
                  placeholder="0"
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10"
                />

              </div>


              <div>

                <label
                  htmlFor="maxRate"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Max Rate
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
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10"
                />

              </div>

            </div>


            <div className="mt-5">

              <label
                htmlFor="specialization"
                className="mb-2 block text-sm font-medium text-gray-700"
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
                placeholder="e.g. Wedding Photography"
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 md:max-w-xl"
              />

            </div>


            <div className="mt-6 flex flex-wrap justify-end gap-3">

              <button
                type="button"
                onClick={
                  clearFilters
                }
                disabled={
                  searching
                }
                className="rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
              >
                Clear
              </button>


              <button
                type="submit"
                disabled={
                  searching
                }
                className="rounded-xl bg-gray-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:opacity-50"
              >
                {searching
                  ? "Searching..."
                  : "Search"}
              </button>

            </div>

          </form>

        </section>


        {/* ERROR */}

        {error && (

          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">

            {error}

          </div>

        )}


        {/* RESULTS */}

        <section>

          <div className="mb-5">

            <h2 className="text-xl font-semibold text-gray-950">
              Photographers
            </h2>


            <p className="mt-1 text-sm text-gray-500">
              {
                photographers.length
              }{" "}
              {photographers.length ===
              1
                ? "photographer"
                : "photographers"}{" "}
              found
            </p>

          </div>


          {photographers.length ===
          0 ? (

            <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-14 text-center">

              <h3 className="text-base font-semibold text-gray-950">
                No photographers found
              </h3>


              <p className="mt-2 text-sm text-gray-500">
                Try changing your search
                or filter criteria.
              </p>

            </div>

          ) : (

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">

              {photographers.map(
                (photographer) => (

                  <article
                    key={
                      photographer._id
                    }
                    className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
                  >

                    {/* PROFILE IMAGE */}

                    <div className="flex h-52 items-center justify-center bg-gray-100">

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
                          className="h-full w-full object-cover"
                        />

                      ) : (

                        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-orange-100 text-2xl font-bold text-orange-700">

                          {photographer.user
                            ?.name
                            ?.charAt(0)
                            ?.toUpperCase() ||
                            "P"}

                        </div>

                      )}

                    </div>


                    <div className="p-6">

                      <h3 className="text-lg font-semibold text-gray-950">
                        {
                          photographer.user
                            ?.name
                        }
                      </h3>


                      <p className="mt-1 text-sm font-medium text-orange-600">
                        {photographer.specialization ||
                          "Photography Services"}
                      </p>


                      {photographer.location && (

                        <p className="mt-3 text-sm text-gray-500">
                          {
                            photographer.location
                          }
                        </p>

                      )}


                      {photographer.bio && (

                        <p className="mt-3 line-clamp-3 text-sm leading-6 text-gray-600">
                          {
                            photographer.bio
                          }
                        </p>

                      )}


                      <div className="mt-5 border-t border-gray-100 pt-4">

                        <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                          Hourly rate
                        </p>


                        <p className="mt-1 font-semibold text-gray-950">

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
                        to={`/customer/photographers/${photographer._id}`}
                        className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-gray-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
                      >
                        View Photographer
                      </Link>

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


export default PhotographerListing;