import {
  useEffect,
  useState,
} from "react";

import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";

import api from "../../services/api";
import Loading from "../../components/Loading";


const PhotographerBooking = () => {

  const { id } =
    useParams();

  const navigate =
    useNavigate();


  const [
    photographer,
    setPhotographer,
  ] = useState(null);

  const [
    availability,
    setAvailability,
  ] = useState([]);

  const [
    selectedSlotId,
    setSelectedSlotId,
  ] = useState("");

  const [
    formData,
    setFormData,
  ] = useState({
    date: "",
    startTime: "",
    endTime: "",
    packageRateId: "",
    notes: "",
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

            setPhotographer(
              response.data?.data
                ?.photographer ||
                null
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

  }, [id]);


  // ==========================================
  // FORMAT DATE
  // ==========================================

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


  // ==========================================
  // SLOT CHANGE
  // ==========================================

  const handleSlotChange = (
    event
  ) => {

    const slotId =
      event.target.value;


    setSelectedSlotId(
      slotId
    );


    const slot =
      availability.find(
        (item) =>
          item._id === slotId
      );


    if (!slot) {

      setFormData(
        (previous) => ({
          ...previous,

          date: "",
          startTime: "",
          endTime: "",
        })
      );

      return;
    }


    setFormData(
      (previous) => ({
        ...previous,

        date:
          new Date(
            slot.date
          )
            .toISOString()
            .split("T")[0],

        startTime:
          slot.startTime,

        endTime:
          slot.endTime,
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


      if (!selectedSlotId) {

        setError(
          "Please select an available period."
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


  if (loading) {
    return <Loading />;
  }


  if (!photographer) {

    return (
      <main className="min-h-screen bg-gray-50 px-4 py-10">

        <div className="mx-auto max-w-3xl rounded-2xl bg-white p-8 shadow-sm">

          <p className="text-red-600">
            {error ||
              "Photographer not found."}
          </p>

        </div>

      </main>
    );
  }


  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6">

      <div className="mx-auto max-w-4xl">


        <Link
          to={`/customer/photographers/${id}`}
          className="text-sm font-medium text-gray-500 hover:text-gray-950"
        >
          ← Back to Photographer
        </Link>


        <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">

          <p className="text-sm font-semibold uppercase tracking-wide text-orange-600">
            Booking Request
          </p>


          <h1 className="mt-2 text-3xl font-bold text-gray-950">
            Book{" "}
            {
              photographer.user
                ?.name
            }
          </h1>


          <p className="mt-2 text-sm text-gray-500">
            Choose one of the Photographer's
            available periods and submit your
            booking request.
          </p>


          {error && (

            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>

          )}


          <form
            onSubmit={
              handleSubmit
            }
            className="mt-8 space-y-6"
          >


            {/* AVAILABILITY */}

            <div>

              <label
                htmlFor="availability"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Available Period
              </label>


              <select
                id="availability"
                value={
                  selectedSlotId
                }
                onChange={
                  handleSlotChange
                }
                disabled={saving}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none"
              >

                <option value="">
                  Select availability
                </option>


                {availability.map(
                  (slot) => (

                    <option
                      key={
                        slot._id
                      }
                      value={
                        slot._id
                      }
                    >
                      {formatDate(
                        slot.date
                      )}
                      {" — "}
                      {
                        slot.startTime
                      }
                      {" to "}
                      {
                        slot.endTime
                      }
                    </option>

                  )
                )}

              </select>

            </div>


            {/* TIMES */}

            <div className="grid gap-5 sm:grid-cols-2">

              <div>

                <label
                  htmlFor="startTime"
                  className="mb-2 block text-sm font-medium text-gray-700"
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
                    !selectedSlotId
                  }
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none disabled:bg-gray-100"
                />

              </div>


              <div>

                <label
                  htmlFor="endTime"
                  className="mb-2 block text-sm font-medium text-gray-700"
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
                    !selectedSlotId
                  }
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none disabled:bg-gray-100"
                />

              </div>

            </div>


            {/* PACKAGE */}

            <div>

              <label
                htmlFor="packageRateId"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Photography Package
              </label>


              <select
                id="packageRateId"
                name="packageRateId"
                value={
                  formData.packageRateId
                }
                onChange={
                  handleChange
                }
                disabled={saving}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none"
              >

                <option value="">
                  Hourly / No package selected
                </option>


                {photographer.packageRates?.map(
                  (pkg) => (

                    <option
                      key={
                        pkg._id
                      }
                      value={
                        pkg._id
                      }
                    >
                      {pkg.name}
                      {" — LKR "}
                      {Number(
                        pkg.price
                      ).toLocaleString()}
                    </option>

                  )
                )}

              </select>

            </div>


            {/* NOTES */}

            <div>

              <label
                htmlFor="notes"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Notes
              </label>


              <textarea
                id="notes"
                name="notes"
                rows="4"
                maxLength="500"
                value={
                  formData.notes
                }
                onChange={
                  handleChange
                }
                disabled={saving}
                placeholder="Tell the photographer about your event or photography requirements..."
                className="w-full resize-none rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none"
              />

            </div>


            <div className="flex justify-end">

              <button
                type="submit"
                disabled={
                  saving ||
                  availability.length ===
                    0
                }
                className="rounded-xl bg-gray-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? "Submitting..."
                  : "Submit Booking Request"}
              </button>

            </div>

          </form>

        </div>

      </div>

    </main>
  );
};


export default PhotographerBooking;