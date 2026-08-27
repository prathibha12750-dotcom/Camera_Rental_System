import {
  useEffect,
  useState,
} from "react";

import { Link } from "react-router-dom";

import api from "../../services/api";
import Loading from "../../components/Loading";


const emptyForm = {
  title: "",
  description: "",
  imageUrl: "",
};


const PhotographerPortfolio = () => {

  const [items, setItems] =
    useState([]);

  const [formData, setFormData] =
    useState(emptyForm);

  const [editingId, setEditingId] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");



// ==========================================
// LOAD PORTFOLIO
// ==========================================

useEffect(() => {
  let ignore = false;

  const loadPortfolio = async () => {
    try {
      const response = await api.get(
        "/photographer/portfolio"
      );

      if (!ignore) {
        setItems(
          Array.isArray(
            response.data?.data?.items
          )
            ? response.data.data.items
            : []
        );
      }
    } catch (err) {
      console.error(
        "Failed to load portfolio:",
        err
      );

      if (!ignore) {
        setError(
          err.response?.data?.message ||
            "Failed to load portfolio."
        );
      }
    } finally {
      if (!ignore) {
        setLoading(false);
      }
    }
  };

  loadPortfolio();

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


    if (!formData.title.trim()) {

      setError(
        "Portfolio title is required."
      );

      return;
    }


    if (!formData.imageUrl.trim()) {

      setError(
        "Portfolio image URL is required."
      );

      return;
    }


    try {

      setSaving(true);


      const payload = {
        title:
          formData.title.trim(),

        description:
          formData.description.trim(),

        imageUrl:
          formData.imageUrl.trim(),
      };


      if (editingId) {

        const response = await api.put(
          `/photographer/portfolio/${editingId}`,
          payload
        );


        const updatedItem =
          response.data.data.item;


        setItems((previous) =>
          previous.map((item) =>
            item._id === editingId
              ? updatedItem
              : item
          )
        );


        setSuccess(
          "Portfolio item updated successfully."
        );

      } else {

        const response = await api.post(
          "/photographer/portfolio",
          payload
        );


        const newItem =
          response.data.data.item;


        setItems((previous) => [
          newItem,
          ...previous,
        ]);


        setSuccess(
          "Portfolio item added successfully."
        );
      }


      setFormData(emptyForm);
      setEditingId(null);

    } catch (err) {

      console.error(
        "Failed to save portfolio item:",
        err
      );


      setError(
        err.response?.data?.message ||
        "Failed to save portfolio item."
      );

    } finally {
      setSaving(false);
    }
  };


  // ==========================================
  // START EDITING
  // ==========================================

  const startEditing = (item) => {

    setEditingId(item._id);

    setFormData({
      title:
        item.title || "",

      description:
        item.description || "",

      imageUrl:
        item.imageUrl || "",
    });

    setError("");
    setSuccess("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };


  // ==========================================
  // DELETE ITEM
  // ==========================================

  const handleDelete = async (id) => {

    const confirmed =
      window.confirm(
        "Are you sure you want to delete this portfolio item?"
      );


    if (!confirmed) {
      return;
    }


    try {

      setError("");
      setSuccess("");


      await api.delete(
        `/photographer/portfolio/${id}`
      );


      setItems((previous) =>
        previous.filter(
          (item) =>
            item._id !== id
        )
      );


      if (editingId === id) {
        resetForm();
      }


      setSuccess(
        "Portfolio item deleted successfully."
      );

    } catch (err) {

      console.error(
        "Failed to delete portfolio item:",
        err
      );


      setError(
        err.response?.data?.message ||
        "Failed to delete portfolio item."
      );
    }
  };


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
            Portfolio Management
          </h1>


          <p className="mt-2 text-sm leading-6 text-gray-600">
            Add and manage photographs that
            showcase your professional work.
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
                ? "Edit Portfolio Item"
                : "Add Portfolio Item"}
            </h2>


            <p className="mt-1 text-sm text-gray-500">
              {editingId
                ? "Update the selected portfolio item."
                : "Add a new example of your photography work."}
            </p>

          </div>


          <form
            onSubmit={handleSubmit}
            className="space-y-6"
          >

            <div>

              <label
                htmlFor="title"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Title
              </label>


              <input
                id="title"
                name="title"
                type="text"
                value={formData.title}
                onChange={handleChange}
                disabled={saving}
                placeholder="e.g. Beach Wedding Photography"
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 disabled:bg-gray-100"
              />

            </div>


            <div>

              <label
                htmlFor="imageUrl"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Image URL
              </label>


              <input
                id="imageUrl"
                name="imageUrl"
                type="url"
                value={
                  formData.imageUrl
                }
                onChange={handleChange}
                disabled={saving}
                placeholder="https://example.com/photo.jpg"
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 disabled:bg-gray-100"
              />

            </div>


            <div>

              <label
                htmlFor="description"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Description
              </label>


              <textarea
                id="description"
                name="description"
                rows="4"
                value={
                  formData.description
                }
                onChange={handleChange}
                disabled={saving}
                placeholder="Describe this photography work..."
                className="w-full resize-none rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 disabled:bg-gray-100"
              />

            </div>


            {/* IMAGE PREVIEW */}

            {formData.imageUrl && (

              <div>

                <p className="mb-2 text-sm font-medium text-gray-700">
                  Preview
                </p>


                <div className="overflow-hidden rounded-xl border border-gray-200 bg-gray-100">

                  <img
                    src={
                      formData.imageUrl
                    }
                    alt="Portfolio preview"
                    className="h-64 w-full object-cover"
                  />

                </div>

              </div>

            )}


            <div className="flex flex-wrap justify-end gap-3">

              {editingId && (

                <button
                  type="button"
                  onClick={resetForm}
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
                    : "Add Portfolio Item"}
              </button>

            </div>

          </form>

        </section>


        {/* PORTFOLIO ITEMS */}

        <section>

          <div className="mb-5 flex items-end justify-between gap-4">

            <div>

              <h2 className="text-xl font-semibold text-gray-950">
                My Portfolio
              </h2>


              <p className="mt-1 text-sm text-gray-500">
                {items.length}{" "}
                {items.length === 1
                  ? "item"
                  : "items"}
              </p>

            </div>

          </div>


          {items.length === 0 ? (

            <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-14 text-center">

              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 font-bold text-orange-600">
                P
              </div>


              <h3 className="mt-4 text-base font-semibold text-gray-950">
                No portfolio items yet
              </h3>


              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
                Add examples of your photography
                work so customers can view your
                portfolio.
              </p>

            </div>

          ) : (

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">

              {items.map((item) => (

                <article
                  key={item._id}
                  className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
                >

                  <div className="aspect-[4/3] overflow-hidden bg-gray-100">

                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="h-full w-full object-cover transition duration-300 hover:scale-105"
                    />

                  </div>


                  <div className="p-5">

                    <h3 className="text-base font-semibold text-gray-950">
                      {item.title}
                    </h3>


                    {item.description && (

                      <p className="mt-2 line-clamp-3 text-sm leading-6 text-gray-500">
                        {item.description}
                      </p>

                    )}


                    <div className="mt-5 flex gap-3">

                      <button
                        type="button"
                        onClick={() =>
                          startEditing(
                            item
                          )
                        }
                        className="flex-1 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
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
                        className="flex-1 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100"
                      >
                        Delete
                      </button>

                    </div>

                  </div>

                </article>

              ))}

            </div>

          )}

        </section>

      </div>

    </main>
  );
};


export default PhotographerPortfolio;