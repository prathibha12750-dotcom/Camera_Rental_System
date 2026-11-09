const mongoose = require("mongoose");

const Booking =
  require("../models/Booking");

const Review =
  require("../models/Review");


// ==========================================
// CREATE CUSTOMER REVIEW
// POST /api/customer/bookings/:id/review
// CUSTOMER ONLY
// ==========================================

const createReview = async (
  req,
  res,
  next
) => {

  try {

    const bookingId =
      req.params.id;


    const {
      rating,
      comment,
    } = req.body;


    // --------------------------------------
    // VALID BOOKING ID
    // --------------------------------------

    if (
      !mongoose.Types.ObjectId.isValid(
        bookingId
      )
    ) {

      return res.status(400).json({
        success: false,

        message:
          "Invalid booking ID",
      });

    }


    // --------------------------------------
    // VALID RATING
    // --------------------------------------

    const numericRating =
      Number(rating);


    if (
      !Number.isInteger(
        numericRating
      ) ||
      numericRating < 1 ||
      numericRating > 5
    ) {

      return res.status(400).json({
        success: false,

        message:
          "Rating must be a whole number from 1 to 5",
      });

    }


    // --------------------------------------
    // FIND CUSTOMER BOOKING
    // --------------------------------------

    const booking =
      await Booking.findOne({
        _id: bookingId,

        customer:
          req.user.userId,
      });


    if (!booking) {

      return res.status(404).json({
        success: false,

        message:
          "Booking not found",
      });

    }


    // --------------------------------------
    // ONLY COMPLETED BOOKINGS
    // --------------------------------------

    if (
      booking.status !==
      "COMPLETED"
    ) {

      return res.status(400).json({
        success: false,

        message:
          "You can only review a completed booking",
      });

    }


    // --------------------------------------
    // PREVENT DUPLICATE REVIEW
    // --------------------------------------

    const existingReview =
      await Review.findOne({
        booking:
          booking._id,
      });


    if (existingReview) {

      return res.status(409).json({
        success: false,

        message:
          "You have already reviewed this booking",
      });

    }


    // --------------------------------------
    // CREATE REVIEW
    // --------------------------------------

    const review =
      await Review.create({
        booking:
          booking._id,

        customer:
          req.user.userId,

        photographer:
          booking.photographer,

        rating:
          numericRating,

        comment:
          comment?.trim() || "",
      });


    const populatedReview =
      await Review.findById(
        review._id
      ).populate({
        path: "customer",

        select: "name",
      });


    return res.status(201).json({
      success: true,

      message:
        "Review submitted successfully",

      data: {
        review:
          populatedReview,
      },
    });

  } catch (error) {

    if (
      error?.code === 11000
    ) {

      return res.status(409).json({
        success: false,

        message:
          "You have already reviewed this booking",
      });

    }


    next(error);

  }

};


// ==========================================
// GET PHOTOGRAPHER REVIEWS
// GET /api/customer/photographers/:id/reviews
// PUBLIC
// ==========================================

const getPhotographerReviews =
  async (
    req,
    res,
    next
  ) => {

    try {

      const photographerId =
        req.params.id;


      if (
        !mongoose.Types.ObjectId.isValid(
          photographerId
        )
      ) {

        return res.status(400).json({
          success: false,

          message:
            "Invalid photographer ID",
        });

      }


      const reviews =
        await Review.find({
          photographer:
            photographerId,
        })
          .populate({
            path: "customer",

            select: "name",
          })
          .sort({
            createdAt: -1,
          });


      const reviewCount =
        reviews.length;


      const averageRating =
        reviewCount > 0
          ? reviews.reduce(
              (
                total,
                review
              ) =>
                total +
                review.rating,
              0
            ) / reviewCount
          : 0;


      return res.status(200).json({
        success: true,

        data: {
          reviews,

          reviewCount,

          averageRating:
            Number(
              averageRating.toFixed(
                1
              )
            ),
        },
      });

    } catch (error) {

      next(error);

    }

  };


// ==========================================
// GET CUSTOMER REVIEWS
// GET /api/customer/reviews
// CUSTOMER ONLY
// ==========================================

const getCustomerReviews = async (
  req,
  res,
  next
) => {

  try {

    const reviews =
      await Review.find({
        customer:
          req.user.userId,
      })
        .select(
          "booking photographer rating comment createdAt"
        )
        .sort({
          createdAt: -1,
        });


    return res.status(200).json({
      success: true,

      data: {
        reviews,
      },
    });

  } catch (error) {

    next(error);

  }

};


module.exports = {
  createReview,
  getPhotographerReviews,
  getCustomerReviews,
};