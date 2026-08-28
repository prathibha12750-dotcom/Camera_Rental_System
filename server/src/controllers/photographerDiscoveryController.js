const mongoose = require("mongoose");

const User = require("../models/User");
const Photographer = require("../models/Photographer");
const Portfolio = require("../models/Portfolio");
const Availability = require("../models/Availability");


// ==========================================
// HELPER — ESCAPE REGEX
// ==========================================

const escapeRegex = (value = "") => {
  return value.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );
};


// ==========================================
// GET PHOTOGRAPHERS
// GET /api/customer/photographers
// ==========================================

const getPhotographers = async (
  req,
  res,
  next
) => {
  try {
    const {
      search = "",
      specialization = "",
      location = "",
      minRate,
      maxRate,
    } = req.query;


    // --------------------------------------
    // Base Photographer query
    // --------------------------------------

    const query = {};


    // --------------------------------------
    // Specialization filter
    // --------------------------------------

    if (specialization.trim()) {
      query.specialization = {
        $regex: escapeRegex(
          specialization.trim()
        ),
        $options: "i",
      };
    }


    // --------------------------------------
    // Location filter
    // --------------------------------------

    if (location.trim()) {
      query.location = {
        $regex: escapeRegex(
          location.trim()
        ),
        $options: "i",
      };
    }


    // --------------------------------------
    // Hourly rate filters
    // --------------------------------------

    if (
      minRate !== undefined ||
      maxRate !== undefined
    ) {
      query.hourlyRate = {};

      if (
        minRate !== undefined &&
        minRate !== ""
      ) {
        const minimum = Number(minRate);

        if (
          Number.isNaN(minimum) ||
          minimum < 0
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Minimum rate must be a non-negative number",
          });
        }

        query.hourlyRate.$gte =
          minimum;
      }


      if (
        maxRate !== undefined &&
        maxRate !== ""
      ) {
        const maximum = Number(maxRate);

        if (
          Number.isNaN(maximum) ||
          maximum < 0
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Maximum rate must be a non-negative number",
          });
        }

        query.hourlyRate.$lte =
          maximum;
      }


      if (
        minRate !== undefined &&
        minRate !== "" &&
        maxRate !== undefined &&
        maxRate !== "" &&
        Number(minRate) >
          Number(maxRate)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Minimum rate cannot be greater than maximum rate",
        });
      }
    }


    // --------------------------------------
    // General search
    //
    // Search:
    // name
    // specialization
    // location
    // --------------------------------------

    if (search.trim()) {
      const searchExpression =
        escapeRegex(
          search.trim()
        );


      const matchingUsers =
        await User.find({
          role: "PHOTOGRAPHER",
          status: "ACTIVE",

          name: {
            $regex:
              searchExpression,

            $options: "i",
          },
        }).select("_id");


      const matchingUserIds =
        matchingUsers.map(
          (user) => user._id
        );


      query.$or = [
        {
          user: {
            $in:
              matchingUserIds,
          },
        },

        {
          specialization: {
            $regex:
              searchExpression,

            $options: "i",
          },
        },

        {
          location: {
            $regex:
              searchExpression,

            $options: "i",
          },
        },
      ];
    }


    // --------------------------------------
    // Query Photographer collection
    // --------------------------------------

    const photographers =
      await Photographer.find(
        query
      )
        .populate({
          path: "user",

          match: {
            role: "PHOTOGRAPHER",
            status: "ACTIVE",
          },

          select:
            "name email role status",
        })
        .sort({
          createdAt: -1,
        });


    // --------------------------------------
    // Remove Photographer records whose
    // User account is inactive / invalid
    // --------------------------------------

    const activePhotographers =
      photographers.filter(
        (photographer) =>
          photographer.user
      );


    return res.status(200).json({
      success: true,

      data: {
        photographers:
          activePhotographers,

        count:
          activePhotographers.length,
      },
    });

  } catch (error) {
    next(error);
  }
};


// ==========================================
// GET PHOTOGRAPHER DETAILS
// GET /api/customer/photographers/:id
// ==========================================

const getPhotographerDetails = async (
  req,
  res,
  next
) => {
  try {
    const {
      id,
    } = req.params;


    // --------------------------------------
    // Validate MongoDB ID
    // --------------------------------------

    if (
      !mongoose.Types.ObjectId.isValid(
        id
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid photographer ID",
      });
    }


    // --------------------------------------
    // Find Photographer
    // --------------------------------------

    const photographer =
      await Photographer.findById(
        id
      ).populate({
        path: "user",

        match: {
          role: "PHOTOGRAPHER",
          status: "ACTIVE",
        },

        select:
          "name email role status",
      });


    if (
      !photographer ||
      !photographer.user
    ) {
      return res.status(404).json({
        success: false,
        message:
          "Photographer not found",
      });
    }


    // --------------------------------------
    // Portfolio
    // --------------------------------------

    const portfolio =
      await Portfolio.find({
        photographer:
          photographer._id,
      }).sort({
        createdAt: -1,
      });


    // --------------------------------------
    // Future availability
    // --------------------------------------

    const today = new Date();

    today.setUTCHours(
      0,
      0,
      0,
      0
    );


    const availability =
      await Availability.find({
        photographer:
          photographer._id,

        date: {
          $gte: today,
        },
      }).sort({
        date: 1,
        startTime: 1,
      });


    return res.status(200).json({
      success: true,

      data: {
        photographer,
        portfolio,
        availability,
      },
    });

  } catch (error) {
    next(error);
  }
};


module.exports = {
  getPhotographers,
  getPhotographerDetails,
};