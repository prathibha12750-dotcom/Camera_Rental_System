import {
  useEffect,
  useState,
} from "react";

import api from "../../services/api";
import ConfirmDialog from "../../components/ConfirmDialog";

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

  const [
    itemToDelete,
    setItemToDelete,
  ] = useState(null);

  const [
    deletingId,
    setDeletingId,
  ] = useState(null);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");


  // ==========================================
  // LOAD PORTFOLIO
  // ==========================================

  useEffect(() => {

    let ignore = false;


    const loadPortfolio =
      async () => {

        try {

          const response =
            await api.get(
              "/photographer/portfolio"
            );


          if (!ignore) {

            setItems(
              Array.isArray(
                response.data?.data
                  ?.items
              )
                ? response.data.data
                    .items
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
              err.response?.data
                ?.message ||
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

    setFormData(
      emptyForm
    );

    setEditingId(
      null
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
      setSuccess("");


      if (
        !formData.title.trim()
      ) {

        setError(
          "Portfolio title is required."
        );

        return;

      }


      if (
        !formData.imageUrl.trim()
      ) {

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

          const response =
            await api.put(
              `/photographer/portfolio/${editingId}`,
              payload
            );


          const updatedItem =
            response.data?.data
              ?.item;


          if (!updatedItem) {

            throw new Error(
              "Updated portfolio item was not returned."
            );

          }


          setItems(
            (previous) =>
              previous.map(
                (item) =>
                  item._id ===
                  editingId
                    ? updatedItem
                    : item
              )
          );


          setSuccess(
            "Portfolio item updated successfully."
          );

        } else {

          const response =
            await api.post(
              "/photographer/portfolio",
              payload
            );


          const newItem =
            response.data?.data
              ?.item;


          if (!newItem) {

            throw new Error(
              "New portfolio item was not returned."
            );

          }


          setItems(
            (previous) => [
              newItem,
              ...previous,
            ]
          );


          setSuccess(
            "Portfolio item added successfully."
          );

        }


        setFormData(
          emptyForm
        );

        setEditingId(
          null
        );

      } catch (err) {

        console.error(
          "Failed to save portfolio item:",
          err
        );


        setError(
          err.response?.data
            ?.message ||
            "Failed to save portfolio item."
        );

      } finally {

        setSaving(false);

      }

    };


  // ==========================================
  // START EDITING
  // ==========================================

  const startEditing = (
    item
  ) => {

    setEditingId(
      item._id
    );


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


    window.setTimeout(
      () => {

        document
          .getElementById(
            "portfolio-editor"
          )
          ?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });

      },
      0
    );

  };


  // ==========================================
  // DELETE ITEM
  // ==========================================

  const handleDelete =
    async () => {

      if (
        !itemToDelete?._id
      ) {
        return;
      }


      const id =
        itemToDelete._id;


      try {

        setDeletingId(id);

        setError("");
        setSuccess("");


        await api.delete(
          `/photographer/portfolio/${id}`
        );


        setItems(
          (previous) =>
            previous.filter(
              (item) =>
                item._id !== id
            )
        );


        if (
          editingId === id
        ) {

          setEditingId(null);

          setFormData({
            title: "",
            description: "",
            imageUrl: "",
          });

        }


        setSuccess(
          "Portfolio item deleted successfully."
        );


        setItemToDelete(
          null
        );

      } catch (err) {

        console.error(
          "Failed to delete portfolio item:",
          err
        );


        setError(
          err.response?.data
            ?.message ||
            "Failed to delete portfolio item."
        );

      } finally {

        setDeletingId(null);

      }

    };


  return (

    <main
      className="
        min-h-[calc(100vh-4rem)]
        bg-gray-50
        px-4
        py-6
        sm:px-6
        lg:px-8
        lg:py-8
      "
    >

      <div
        className="
          mx-auto
          max-w-7xl
        "
      >


        {/* ==================================
            HEADER
        ================================== */}

        <header
          className="
            flex
            flex-col
            gap-4
            sm:flex-row
            sm:items-end
            sm:justify-between
          "
        >

          <div>

            <p
              className="
                text-sm
                font-semibold
                text-orange-600
              "
            >
              Portfolio
            </p>


            <h1
              className="
                mt-1
                text-2xl
                font-bold
                tracking-tight
                text-gray-950
                sm:text-3xl
              "
            >
              Showcase Your Work
            </h1>


            <p
              className="
                mt-2
                max-w-2xl
                text-sm
                leading-6
                text-gray-500
              "
            >
              Manage the photography
              examples customers see when
              they view your professional
              profile.
            </p>

          </div>


          {!loading && (

            <div
              className="
                inline-flex
                w-fit
                items-center
                gap-2
                rounded-full
                border
                border-gray-200
                bg-white
                px-4
                py-2
                text-sm
                text-gray-600
                shadow-sm
              "
            >

              <span
                className="
                  font-semibold
                  text-gray-950
                "
              >
                {items.length}
              </span>

              {items.length === 1
                ? "portfolio item"
                : "portfolio items"}

            </div>

          )}

        </header>


        {/* ==================================
            ALERTS
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


        {/* ==================================
            EDITOR
        ================================== */}

        <section
          id="portfolio-editor"
          className="
            mt-7
            overflow-hidden
            rounded-2xl
            border
            border-gray-200
            bg-white
            shadow-sm
          "
        >

          <div
            className="
              border-b
              border-gray-100
              px-5
              py-4
              sm:px-6
            "
          >

            <div
              className="
                flex
                items-start
                justify-between
                gap-4
              "
            >

              <div>

                <h2
                  className="
                    text-lg
                    font-semibold
                    text-gray-950
                  "
                >
                  {editingId
                    ? "Edit Portfolio Item"
                    : "Add Portfolio Item"}
                </h2>


                <p
                  className="
                    mt-1
                    text-sm
                    text-gray-500
                  "
                >
                  {editingId
                    ? "Update the selected photograph and its details."
                    : "Add a professional photography example to your portfolio."}
                </p>

              </div>


              {editingId && (

                <span
                  className="
                    shrink-0
                    rounded-full
                    bg-orange-50
                    px-3
                    py-1
                    text-xs
                    font-semibold
                    text-orange-700
                  "
                >
                  Editing
                </span>

              )}

            </div>

          </div>


          <form
            onSubmit={
              handleSubmit
            }
            className="
              grid
              gap-6
              p-5
              sm:p-6
              lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.8fr)]
            "
          >


            {/* FORM FIELDS */}

            <div
              className="
                space-y-5
              "
            >

              <div>

                <label
                  htmlFor="title"
                  className="
                    mb-2
                    block
                    text-sm
                    font-medium
                    text-gray-700
                  "
                >
                  Title
                </label>


                <input
                  id="title"
                  name="title"
                  type="text"
                  value={
                    formData.title
                  }
                  onChange={
                    handleChange
                  }
                  disabled={
                    saving
                  }
                  maxLength="120"
                  placeholder="e.g. Beach Wedding Photography"
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
                    placeholder:text-gray-400
                    focus:border-orange-500
                    focus:ring-2
                    focus:ring-orange-500/10
                    disabled:cursor-not-allowed
                    disabled:bg-gray-100
                  "
                />

              </div>


              <div>

                <label
                  htmlFor="imageUrl"
                  className="
                    mb-2
                    block
                    text-sm
                    font-medium
                    text-gray-700
                  "
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
                  onChange={
                    handleChange
                  }
                  disabled={
                    saving
                  }
                  placeholder="https://example.com/photo.jpg"
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
                    placeholder:text-gray-400
                    focus:border-orange-500
                    focus:ring-2
                    focus:ring-orange-500/10
                    disabled:cursor-not-allowed
                    disabled:bg-gray-100
                  "
                />


                <p
                  className="
                    mt-2
                    text-xs
                    leading-5
                    text-gray-400
                  "
                >
                  Use a direct image URL
                  that can be viewed
                  publicly.
                </p>

              </div>


              <div>

                <div
                  className="
                    mb-2
                    flex
                    items-center
                    justify-between
                    gap-3
                  "
                >

                  <label
                    htmlFor="description"
                    className="
                      block
                      text-sm
                      font-medium
                      text-gray-700
                    "
                  >
                    Description
                  </label>


                  <span
                    className="
                      text-xs
                      text-gray-400
                    "
                  >
                    {
                      formData.description
                        .length
                    }
                    /1000
                  </span>

                </div>


                <textarea
                  id="description"
                  name="description"
                  rows="5"
                  value={
                    formData.description
                  }
                  onChange={
                    handleChange
                  }
                  disabled={
                    saving
                  }
                  maxLength="1000"
                  placeholder="Describe this photography work..."
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
                    text-gray-900
                    outline-none
                    transition
                    placeholder:text-gray-400
                    focus:border-orange-500
                    focus:ring-2
                    focus:ring-orange-500/10
                    disabled:cursor-not-allowed
                    disabled:bg-gray-100
                  "
                />

              </div>


              <div
                className="
                  flex
                  flex-wrap
                  gap-3
                  pt-1
                "
              >

                <button
                  type="submit"
                  disabled={
                    saving
                  }
                  className="
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
                    ? "Saving..."
                    : editingId
                      ? "Save Changes"
                      : "Add Portfolio Item"}
                </button>


                {editingId && (

                  <button
                    type="button"
                    onClick={
                      resetForm
                    }
                    disabled={
                      saving
                    }
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
                      disabled:cursor-not-allowed
                      disabled:opacity-50
                      focus:outline-none
                      focus-visible:ring-2
                      focus-visible:ring-gray-400
                    "
                  >
                    Cancel Edit
                  </button>

                )}

              </div>

            </div>


            {/* PREVIEW */}

            <div>

              <p
                className="
                  mb-2
                  text-sm
                  font-medium
                  text-gray-700
                "
              >
                Preview
              </p>


              <div
                className="
                  overflow-hidden
                  rounded-2xl
                  border
                  border-gray-200
                  bg-gray-100
                "
              >

                {formData.imageUrl ? (

                  <img
                    src={
                      formData.imageUrl
                    }
                    alt={
                      formData.title
                        ? `${formData.title} preview`
                        : "Portfolio preview"
                    }
                    className="
                      aspect-[4/3]
                      w-full
                      object-cover
                    "
                  />

                ) : (

                  <div
                    className="
                      flex
                      aspect-[4/3]
                      w-full
                      flex-col
                      items-center
                      justify-center
                      px-6
                      text-center
                    "
                  >

                    <svg
                      className="
                        h-9
                        w-9
                        text-gray-300
                      "
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      aria-hidden="true"
                    >
                      <rect
                        x="3"
                        y="4"
                        width="18"
                        height="16"
                        rx="2"
                      />

                      <circle
                        cx="9"
                        cy="9"
                        r="2"
                      />

                      <path d="m4 18 5-5 4 4 3-3 4 4" />
                    </svg>


                    <p
                      className="
                        mt-3
                        text-sm
                        font-medium
                        text-gray-500
                      "
                    >
                      Image preview
                    </p>


                    <p
                      className="
                        mt-1
                        text-xs
                        text-gray-400
                      "
                    >
                      Enter an image URL
                      to preview your
                      photograph.
                    </p>

                  </div>

                )}

              </div>


              {formData.title && (

                <div
                  className="
                    mt-3
                  "
                >

                  <p
                    className="
                      text-sm
                      font-semibold
                      text-gray-900
                    "
                  >
                    {formData.title}
                  </p>


                  {formData.description && (

                    <p
                      className="
                        mt-1
                        text-sm
                        leading-5
                        text-gray-500
                      "
                    >
                      {
                        formData.description
                      }
                    </p>

                  )}

                </div>

              )}

            </div>

          </form>

        </section>


        {/* ==================================
            PORTFOLIO GALLERY
        ================================== */}

        <section
          className="
            mt-10
          "
        >

          <div
            className="
              mb-5
              flex
              items-end
              justify-between
              gap-4
            "
          >

            <div>

              <h2
                className="
                  text-xl
                  font-semibold
                  text-gray-950
                "
              >
                My Portfolio
              </h2>


              <p
                className="
                  mt-1
                  text-sm
                  text-gray-500
                "
              >
                Your current photography
                showcase.
              </p>

            </div>

          </div>


          {/* LOADING */}

          {loading ? (

            <div
              className="
                grid
                gap-5
                sm:grid-cols-2
                xl:grid-cols-3
              "
              role="status"
              aria-live="polite"
              aria-label="Loading portfolio items"
            >

              <span className="sr-only">
                Loading portfolio items...
              </span>

              {[1, 2, 3].map(
                (item) => (

                  <div
                    key={item}
                    className="
                      overflow-hidden
                      rounded-2xl
                      border
                      border-gray-200
                      bg-white
                    "
                  >

                    <div
                      className="
                        aspect-[4/3]
                        animate-pulse
                        bg-gray-200
                      "
                    />


                    <div
                      className="
                        space-y-3
                        p-5
                      "
                    >

                      <div
                        className="
                          h-5
                          w-2/3
                          animate-pulse
                          rounded
                          bg-gray-200
                        "
                      />


                      <div
                        className="
                          h-4
                          w-full
                          animate-pulse
                          rounded
                          bg-gray-100
                        "
                      />


                      <div
                        className="
                          h-4
                          w-4/5
                          animate-pulse
                          rounded
                          bg-gray-100
                        "
                      />

                    </div>

                  </div>

                )
              )}

            </div>

          ) : items.length === 0 ? (

            /* EMPTY STATE */

            <div
              className="
                rounded-2xl
                border
                border-dashed
                border-gray-300
                bg-white
                px-6
                py-12
                text-center
              "
            >

              <div
                className="
                  mx-auto
                  flex
                  h-12
                  w-12
                  items-center
                  justify-center
                  rounded-xl
                  bg-orange-50
                  text-orange-600
                "
              >

                <svg
                  className="
                    h-6
                    w-6
                  "
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  aria-hidden="true"
                >
                  <rect
                    x="3"
                    y="4"
                    width="18"
                    height="16"
                    rx="2"
                  />

                  <circle
                    cx="9"
                    cy="9"
                    r="2"
                  />

                  <path d="m4 18 5-5 4 4 3-3 4 4" />
                </svg>

              </div>


              <h3
                className="
                  mt-4
                  text-base
                  font-semibold
                  text-gray-950
                "
              >
                No portfolio items yet
              </h3>


              <p
                className="
                  mx-auto
                  mt-2
                  max-w-md
                  text-sm
                  leading-6
                  text-gray-500
                "
              >
                Add your first portfolio
                item to showcase your work
                and help customers understand
                your photography style.
              </p>

            </div>

          ) : (

            /* REAL PORTFOLIO ITEMS */

            <div
              className="
                grid
                gap-5
                sm:grid-cols-2
                xl:grid-cols-3
              "
            >

              {items.map(
                (item) => {

                  const isDeleting =
                    deletingId ===
                    item._id;


                  return (

                    <article
                      key={
                        item._id
                      }
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

                      <div
                        className="
                          aspect-[4/3]
                          overflow-hidden
                          bg-gray-100
                        "
                      >

                        <img
                          src={
                            item.imageUrl
                          }
                          alt={
                            item.title ||
                            "Portfolio photograph"
                          }
                          loading="lazy"
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


                      <div
                        className="
                          p-5
                        "
                      >

                        <h3
                          className="
                            text-base
                            font-semibold
                            text-gray-950
                          "
                        >
                          {item.title}
                        </h3>


                        {item.description && (

                          <p
                            className="
                              mt-2
                              line-clamp-3
                              text-sm
                              leading-6
                              text-gray-500
                            "
                          >
                            {
                              item.description
                            }
                          </p>

                        )}


                        <div
                          className="
                            mt-5
                            flex
                            gap-2
                            border-t
                            border-gray-100
                            pt-4
                          "
                        >

                          <button
                            type="button"
                            onClick={() =>
                              startEditing(
                                item
                              )
                            }
                            disabled={
                              isDeleting ||
                              saving ||
                              Boolean(
                                deletingId
                              )
                            }
                            className="
                              flex-1
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
                              disabled:cursor-not-allowed
                              disabled:opacity-50
                              focus:outline-none
                              focus-visible:ring-2
                              focus-visible:ring-gray-400
                            "
                          >
                            Edit
                          </button>


                          <button
                            type="button"
                            onClick={() =>
                              setItemToDelete(
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
                              flex-1
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
                            {deletingId === item._id
                              ? "Deleting..."
                              : "Delete"}
                          </button>

                        </div>

                      </div>

                    </article>

                  );

                }
              )}

            </div>

          )}

        </section>

      </div>

      <ConfirmDialog
        open={
          Boolean(
            itemToDelete
          )
        }
        title="Delete portfolio item?"
        message="This portfolio item will be permanently removed."
        confirmLabel="Delete Item"
        cancelLabel="Keep Item"
        loading={
          deletingId ===
          itemToDelete?._id
        }
        onCancel={() => {

          if (!deletingId) {

            setItemToDelete(
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


export default PhotographerPortfolio;