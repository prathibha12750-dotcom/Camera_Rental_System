const PhotographerApplication = require("../models/PhotographerApplication");
const User = require("../models/User");

// ==========================================
// SUBMIT PHOTOGRAPHER APPLICATION
// POST /api/customer/photographer-application
// CUSTOMER ONLY
// ==========================================

const submitPhotographerApplication =
  async (req, res, next) => {
    try {
      const {
        professionalEmail,
        phone,
        specialization,
        experienceYears,
        location,
        bio,
        portfolioUrl,
        expectedHourlyRate,
        reason,
      } = req.body;

      // --------------------------------------
      // Required fields
      // --------------------------------------

      if (
        !professionalEmail?.trim() ||
        !phone?.trim() ||
        !specialization?.trim() ||
        experienceYears === undefined ||
        experienceYears === null ||
        !location?.trim() ||
        !bio?.trim() ||
        !reason?.trim()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Please complete all required application fields.",
        });
      }

      // --------------------------------------
      // Validate experience
      // --------------------------------------

      const numericExperience =
        Number(experienceYears);

      if (
        !Number.isFinite(
          numericExperience
        ) ||
        numericExperience < 0 ||
        numericExperience > 80
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Experience years must be between 0 and 80.",
        });
      }

      // --------------------------------------
      // Validate hourly rate
      // --------------------------------------

      const numericRate =
        expectedHourlyRate === "" ||
        expectedHourlyRate === undefined ||
        expectedHourlyRate === null
          ? 0
          : Number(
              expectedHourlyRate
            );

      if (
        !Number.isFinite(
          numericRate
        ) ||
        numericRate < 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Expected hourly rate must be zero or greater.",
        });
      }

    const normalizedProfessionalEmail =
    professionalEmail
        .trim()
        .toLowerCase();

    const customer =
    await User.findById(
        req.user.userId
    ).select("email");

    if (!customer) {
    return res.status(404).json({
        success: false,
        message:
        "Customer account not found.",
    });
    }

    if (
    customer.email.toLowerCase() ===
    normalizedProfessionalEmail
    ) {
    return res.status(400).json({
        success: false,
        message:
        "Your photographer login email must be different from your customer account email.",
    });
    }

    const existingUserWithProfessionalEmail =
    await User.findOne({
        email:
        normalizedProfessionalEmail,
    });

    if (
    existingUserWithProfessionalEmail
    ) {
    return res.status(409).json({
        success: false,
        message:
        "An account with this professional email already exists.",
    });
    }

      // --------------------------------------
      // Check existing application
      // --------------------------------------

      const existingApplication =
        await PhotographerApplication.findOne({
          customer:
            req.user.userId,
        });

      if (
        existingApplication
      ) {
        if (
          existingApplication.status ===
          "PENDING"
        ) {
          return res.status(409).json({
            success: false,
            message:
              "You already have a photographer application awaiting review.",
          });
        }

        if (
          existingApplication.status ===
          "APPROVED"
        ) {
          return res.status(409).json({
            success: false,
            message:
              "Your photographer application has already been approved.",
          });
        }

        /*
         * If the previous application was rejected,
         * allow the customer to submit again.
         */

        existingApplication.professionalEmail =
            normalizedProfessionalEmail;

        existingApplication.phone =
          phone.trim();

        existingApplication.specialization =
          specialization.trim();

        existingApplication.experienceYears =
          numericExperience;

        existingApplication.location =
          location.trim();

        existingApplication.bio =
          bio.trim();

        existingApplication.portfolioUrl =
          portfolioUrl?.trim() ||
          "";

        existingApplication.expectedHourlyRate =
          numericRate;

        existingApplication.reason =
          reason.trim();

        existingApplication.status =
          "PENDING";

        existingApplication.adminNote =
          "";

        existingApplication.reviewedBy =
          null;

        existingApplication.reviewedAt =
          null;

        await existingApplication.save();

        return res.status(200).json({
          success: true,

          message:
            "Photographer application resubmitted successfully.",

          data: {
            application:
              existingApplication,
          },
        });
      }

      // --------------------------------------
      // Create first application
      // --------------------------------------

      const application =
        await PhotographerApplication.create({
          customer:
            req.user.userId,

          professionalEmail:  
            normalizedProfessionalEmail,

          phone:
            phone.trim(),

          specialization:
            specialization.trim(),

          experienceYears:
            numericExperience,

          location:
            location.trim(),

          bio:
            bio.trim(),

          portfolioUrl:
            portfolioUrl?.trim() ||
            "",

          expectedHourlyRate:
            numericRate,

          reason:
            reason.trim(),

          status:
            "PENDING",
        });

      return res.status(201).json({
        success: true,

        message:
          "Photographer application submitted successfully.",

        data: {
          application,
        },
      });
    } catch (error) {
      next(error);
    }
  };


// ==========================================
// GET MY PHOTOGRAPHER APPLICATION
// GET /api/customer/photographer-application
// CUSTOMER ONLY
// ==========================================

const getMyPhotographerApplication =
  async (req, res, next) => {
    try {
      const application =
        await PhotographerApplication.findOne({
          customer:
            req.user.userId,
        })
          .populate({
            path: "reviewedBy",
            select: "name",
          });

      return res.status(200).json({
        success: true,

        data: {
          application:
            application || null,
        },
      });
    } catch (error) {
      next(error);
    }
  };


module.exports = {
  submitPhotographerApplication,
  getMyPhotographerApplication,
};