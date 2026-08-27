import {
  useEffect,
  useState,
} from "react";

import {
  Link,
} from "react-router-dom";

import api from "../../services/api";
import Loading from "../../components/Loading";


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
    error,
    setError,
  ] = useState("");

  const [
    success,
    setSuccess,
  ] = useState("");


  // ==========================================
  // DATE FOR INPUT
  // ==========================================

  const formatInputDate = (value) => {

    if (!value) {
      return "";
    }

    return new Date(value)
      .toISOString()
      .split("T")[0];
  };


  // ==========================================
  // DISPLAY DATE
  // ==========================================

  const formatDisplayDate = (value) => {

    if (!value) {
      return "";
    }

    return new Date(value).toLocaleDateString(
      undefined,
      {
        year: "numeric",
        month: "long",
        day: "numeric",
      }
    );
  };


  // ==========================================
  // TODAY FOR MIN ATTRIBUTE
  // ==========================================

  const today = new Date()
    .toISOString()
    .split("T")[0];


// ==========================================
// LOAD AVAILABILITY
// ==========================================

useEffect(() => {
  let ignore = false;

  const loadAvailability = async () => {
    try {
      const response = await api.get(
        "/photographer/availability"
      );

      if (!ignore) {
        const availability =
          response.data?.data?.availability;

        // Use the state update that matches
        // your existing component here.
        setAvailability(availability);
      }
    } catch (err) {
      console.error(
        "Failed to load availability:",
        err
      );

      if (!ignore) {
        setError(
          err.response?.data?.message ||
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
  // HANDLE INPUT
  // ==========================================

  const handleChange = (event) => {

    const {
      name,
      value,
    } = event.target;


    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));


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

  const handleSubmit = async (event) => {

    event.preventDefault();

    setError("");
    setSuccess("");


    if (!formData.date) {
      setError(
        "Please select an available date."
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
          response.data.data.availability;


        setAvailability(
          (previous) =>
            previous
              .map((item) =>
                item._id === editingId
                  ? updated
                  : item
              )
              .sort(
                (a, b) => {

                  const dateDifference =
                    new Date(a.date) -
                    new Date(b.date);


                  if (
                    dateDifference !== 0
                  ) {
                    return dateDifference;
                  }


                  return a.startTime.localeCompare(
                    b.startTime
                  );
                }
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
          response.data.data.availability;


        setAvailability(
          (previous) =>
            [
              ...previous,
              created,
            ].sort(
              (a, b) => {

                const dateDifference =
                  new Date(a.date) -
                  new Date(b.date);


                if (
                  dateDifference !== 0
                ) {
                  return dateDifference;
                }


                return a.startTime.localeCompare(
                  b.startTime
                );
              }
            )
        );


        setSuccess(
          "Availability added successfully."
        );
      }


      setFormData(emptyForm);
      setEditingId(null);

    } catch (err) {

      console.error(
        "Failed to save availability:",
        err
      );


      setError(
        err.response?.data?.message ||
        "Failed to save availability."
      );

    } finally {
      setSaving(false);
    }
  };


  // ==========================================
  // EDIT
  // ==========================================

  const startEditing = (item) => {

    setEditingId(item._id);


    setFormData({
      date:
        formatInputDate(
          item.date
        ),

      startTime:
        item.startTime || "",

      endTime:
        item.endTime || "",
    });


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

  const handleDelete = async (id) => {

    const confirmed =
      window.confirm(
        "Are you sure you want to delete this availability period?"
      );


    if (!confirmed) {
      return;
    }


    try {

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


      if (editingId === id) {
        resetForm();
      }


      setSuccess(
        "Availability deleted successfully."
      );

    } catch (err) {

      console.error(
        "Failed to delete availability:",
        err
      );


      setError(
        err.response?.data?.message ||
        "Failed to delete availability."
      );
    }
  };


  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return <Loading />;
  }


  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">

      <div className="mx-auto max-w-6xl">


        {/* HEADER */}

        <div className="mb-8">

          <Link
            to="/photographer"
            className="text-sm font-medium text-gray-500 transition hover:text-gray-950"
          >
            ← Back to Dashboard
          </Link>


          <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-950">
            Availability Management
          </h1>


          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
            Define the dates and time periods
            when customers can request your
            photography services.
          </p>

        </div>


        {/* ALERTS */}

        {error && (
          <div
            className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            role="alert"
          >
            {error}
          </div>
        )}


        {success && (
          <div
            className="mb-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
            role="status"
          >
            {success}
          </div>
        )}


        {/* ADD / EDIT FORM */}

        <section className="mb-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

          <div className="mb-6">

            <h2 className="text-lg font-semibold text-gray-950">
              {editingId
                ? "Edit Availability"
                : "Add Availability"}
            </h2>


            <p className="mt-1 text-sm text-gray-500">
              Set an available date and time
              period.
            </p>

          </div>


          <form
            onSubmit={handleSubmit}
          >

            <div className="grid gap-6 md:grid-cols-3">


              {/* DATE */}

              <div>

                <label
                  htmlFor="date"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Date
                </label>


                <input
                  id="date"
                  name="date"
                  type="date"
                  min={today}
                  value={
                    formData.date
                  }
                  onChange={
                    handleChange
                  }
                  disabled={saving}
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 disabled:bg-gray-100"
                />

              </div>


              {/* START TIME */}

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
                  disabled={saving}
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 disabled:bg-gray-100"
                />

              </div>


              {/* END TIME */}

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
                  disabled={saving}
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 disabled:bg-gray-100"
                />

              </div>

            </div>


            <div className="mt-6 flex flex-wrap justify-end gap-3">

              {editingId && (

                <button
                  type="button"
                  onClick={
                    resetForm
                  }
                  disabled={saving}
                  className="rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>

              )}


              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-gray-950 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? "Saving..."
                  : editingId
                    ? "Save Changes"
                    : "Add Availability"}
              </button>

            </div>

          </form>

        </section>


        {/* AVAILABILITY LIST */}

        <section>

          <div className="mb-5">

            <h2 className="text-xl font-semibold text-gray-950">
              My Availability
            </h2>


            <p className="mt-1 text-sm text-gray-500">
              {availability.length}{" "}
              {availability.length === 1
                ? "available period"
                : "available periods"}
            </p>

          </div>


          {availability.length === 0 ? (

            <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-14 text-center">

              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 font-bold text-orange-600">
                A
              </div>


              <h3 className="mt-4 text-base font-semibold text-gray-950">
                No availability added
              </h3>


              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
                Add available dates and time
                periods so customers can know when
                you are available.
              </p>

            </div>

          ) : (

            <div className="space-y-4">

              {availability.map(
                (item) => (

                  <article
                    key={item._id}
                    className="flex flex-col justify-between gap-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center"
                  >

                    <div>

                      <p className="font-semibold text-gray-950">
                        {formatDisplayDate(
                          item.date
                        )}
                      </p>


                      <p className="mt-1 text-sm text-gray-500">
                        {item.startTime}
                        {" — "}
                        {item.endTime}
                      </p>

                    </div>


                    <div className="flex gap-3">

                      <button
                        type="button"
                        onClick={() =>
                          startEditing(
                            item
                          )
                        }
                        className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                      >
                        Edit
                      </button>


                      <button
                        type="button"
                        onClick={() =>
                          handleDelete(
                            item._id
                          )
                        }
                        className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100"
                      >
                        Delete
                      </button>

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


export default PhotographerAvailability;