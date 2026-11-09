import {
  useState,
} from "react";

import api from "../services/api";


const ReviewForm = ({
  booking,
  photographerName,
  onSuccess,
  onCancel,
}) => {

  const [
    rating,
    setRating,
  ] = useState(0);


  const [
    hoverRating,
    setHoverRating,
  ] = useState(0);


  const [
    comment,
    setComment,
  ] = useState("");


  const [
    saving,
    setSaving,
  ] = useState(false);


  const [
    error,
    setError,
  ] = useState("");


  const handleSubmit = async (
    event
  ) => {

    event.preventDefault();

    setError("");


    if (
      rating < 1 ||
      rating > 5
    ) {

      setError(
        "Please select a rating."
      );

      return;

    }


    try {

      setSaving(true);


      const response =
        await api.post(
          `/customer/bookings/${booking._id}/review`,
          {
            rating,
            comment:
              comment.trim(),
          }
        );


      const review =
        response.data?.data?.review;


      if (!review) {

        throw new Error(
          "Review was not returned."
        );

      }


      onSuccess(review);

    } catch (err) {

      console.error(
        "Failed to submit review:",
        err
      );


      setError(
        err.response?.data?.message ||
          "Failed to submit review."
      );

    } finally {

      setSaving(false);

    }

  };


  return (

    <form
      onSubmit={handleSubmit}
      className="
        mt-5
        rounded-2xl
        border
        border-orange-100
        bg-orange-50/40
        p-5
      "
    >

      <div>

        <p
          className="
            text-sm
            font-semibold
            text-gray-950
          "
        >
          Review {photographerName}
        </p>


        <p
          className="
            mt-1
            text-xs
            leading-5
            text-gray-500
          "
        >
          Share your experience after
          completing this photography
          service.
        </p>

      </div>


      {/* ==================================
          STAR RATING
      ================================== */}

      <div className="mt-4">

        <p
          className="
            text-xs
            font-semibold
            uppercase
            tracking-wide
            text-gray-500
          "
        >
          Rating
        </p>


        <div
          className="
            mt-2
            flex
            items-center
            gap-1
          "
          onMouseLeave={() =>
            setHoverRating(0)
          }
        >

          {[1, 2, 3, 4, 5].map(
            (value) => {

              const active =
                value <=
                (
                  hoverRating ||
                  rating
                );


              return (

                <button
                  key={value}
                  type="button"
                  onClick={() =>
                    setRating(value)
                  }
                  onMouseEnter={() =>
                    setHoverRating(
                      value
                    )
                  }
                  aria-label={`${value} star rating`}
                  className="
                    rounded
                    p-1
                    text-3xl
                    leading-none
                    transition
                    focus:outline-none
                    focus-visible:ring-2
                    focus-visible:ring-orange-500
                  "
                >
                  <span
                    className={
                      active
                        ? "text-amber-400"
                        : "text-gray-300"
                    }
                  >
                    ★
                  </span>
                </button>

              );

            }
          )}

        </div>


        {rating > 0 && (

          <p
            className="
              mt-1
              text-xs
              font-medium
              text-gray-500
            "
          >
            {rating} out of 5
          </p>

        )}

      </div>


      {/* ==================================
          COMMENT
      ================================== */}

      <div className="mt-4">

        <label
          htmlFor={`review-${booking._id}`}
          className="
            text-xs
            font-semibold
            uppercase
            tracking-wide
            text-gray-500
          "
        >
          Comment
        </label>


        <textarea
          id={`review-${booking._id}`}
          value={comment}
          onChange={(event) =>
            setComment(
              event.target.value
            )
          }
          maxLength={1000}
          rows={4}
          placeholder="Tell others about your experience..."
          className="
            mt-2
            w-full
            resize-none
            rounded-xl
            border
            border-gray-200
            bg-white
            px-4
            py-3
            text-sm
            text-gray-900
            outline-none
            transition
            placeholder:text-gray-400
            focus:border-orange-400
            focus:ring-2
            focus:ring-orange-100
          "
        />


        <div
          className="
            mt-1
            text-right
            text-xs
            text-gray-400
          "
        >
          {comment.length}/1000
        </div>

      </div>


      {error && (

        <div
          className="
            mt-3
            rounded-lg
            border
            border-red-200
            bg-red-50
            px-3
            py-2
            text-sm
            text-red-700
          "
        >
          {error}
        </div>

      )}


      <div
        className="
          mt-4
          flex
          flex-wrap
          gap-3
        "
      >

        <button
          type="submit"
          disabled={
            saving ||
            rating === 0
          }
          className="
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
            disabled:opacity-50
          "
        >
          {saving
            ? "Submitting..."
            : "Submit Review"}
        </button>


        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="
            rounded-xl
            border
            border-gray-200
            bg-white
            px-5
            py-2.5
            text-sm
            font-semibold
            text-gray-700
            transition
            hover:bg-gray-50
            disabled:cursor-not-allowed
            disabled:opacity-50
          "
        >
          Cancel
        </button>

      </div>

    </form>

  );

};


export default ReviewForm;