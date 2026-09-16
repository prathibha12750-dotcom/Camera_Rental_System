const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const User = require("../models/User");
const Photographer = require("../models/Photographer");
const PhotographerApplication = require("../models/PhotographerApplication");
const Notification = require("../models/Notification");
const sendEmail = require("../utils/sendEmail");

// ==========================================
// GENERATE TEMPORARY PASSWORD
// ==========================================

const generateTemporaryPassword = () => {
  const randomPart = crypto
    .randomBytes(8)
    .toString("base64url");

  return `${randomPart}Aa1!`;
};


// ==========================================
// CREATE PHOTOGRAPHER ACCOUNT
// POST /api/admin/photographers
// ==========================================
const createPhotographer = async (req, res, next) => {
  let createdUser = null;

  try {
    const {
      name,
      email,
      password,
    } = req.body;


    // --------------------------------------
    // 1. Validate required fields
    // --------------------------------------

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Name is required",
      });
    }


    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }


    if (!password) {
      return res.status(400).json({
        success: false,
        message: "Password is required",
      });
    }


    // --------------------------------------
    // 2. Validate password length
    // --------------------------------------

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long",
      });
    }


    // --------------------------------------
    // 3. Normalize email
    // --------------------------------------

    const normalizedEmail =
      email.trim().toLowerCase();


    // --------------------------------------
    // 4. Check existing user
    // --------------------------------------

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });


    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
    }


    // --------------------------------------
    // 5. Hash password
    // --------------------------------------

    const passwordHash =
      await bcrypt.hash(password, 12);


    // --------------------------------------
    // 6. Create User account
    // --------------------------------------

    createdUser = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,

      // This endpoint can only create
      // Photographer accounts.
      role: "PHOTOGRAPHER",

      status: "ACTIVE",
    });


    // --------------------------------------
    // 7. Create Photographer profile
    // --------------------------------------

    const photographer =
      await Photographer.create({
        user: createdUser._id,

        // Professional information starts
        // empty and can be completed later
        // by the photographer.
        bio: "",
        specialization: "",
        location: "",
        hourlyRate: null,
        packageRates: [],
        profileImage: "",
      });


    // --------------------------------------
    // 8. Return safe response
    // --------------------------------------

    return res.status(201).json({
      success: true,
      message: "Photographer account created successfully",

      data: {
        photographer: {
          id: photographer._id,
          userId: createdUser._id,

          name: createdUser.name,
          email: createdUser.email,

          role: createdUser.role,
          status: createdUser.status,

          profile: {
            bio: photographer.bio,
            specialization:
              photographer.specialization,
            location:
              photographer.location,
            hourlyRate:
              photographer.hourlyRate,
            packageRates:
              photographer.packageRates,
            profileImage:
              photographer.profileImage,
          },
        },
      },
    });

  } catch (error) {

    // --------------------------------------
    // Roll back User if Photographer
    // profile creation failed.
    // --------------------------------------

    if (createdUser) {
      try {
        await User.findByIdAndDelete(
          createdUser._id
        );
      } catch (cleanupError) {
        console.error(
          "Failed to clean up User after Photographer creation error:",
          cleanupError
        );
      }
    }

    next(error);
  }
};

// ==========================================
// GET PHOTOGRAPHER APPLICATIONS
// GET /api/admin/photographer-applications
// STAFF_ADMIN ONLY
// ==========================================

const getPhotographerApplications =
  async (req, res, next) => {
    try {
      const {
        status,
      } = req.query;

      const filter = {};

      if (
        status &&
        [
          "PENDING",
          "APPROVED",
          "REJECTED",
        ].includes(status)
      ) {
        filter.status = status;
      }

      const applications =
        await PhotographerApplication.find(
          filter
        )
          .populate({
            path: "customer",
            select:
              "name email status",
          })
          .populate({
            path: "reviewedBy",
            select: "name email",
          })
          .sort({
            createdAt: -1,
          });

      return res
        .status(200)
        .json({
          success: true,

          data: {
            applications,
          },
        });
    } catch (error) {
      next(error);
    }
  };

// ==========================================
// GET PHOTOGRAPHER APPLICATION
// GET /api/admin/photographer-applications/:id
// STAFF_ADMIN ONLY
// ==========================================

const getPhotographerApplicationById =
  async (req, res, next) => {
    try {
      const application =
        await PhotographerApplication
          .findById(
            req.params.id
          )
          .populate({
            path: "customer",
            select:
              "name email status",
          })
          .populate({
            path: "reviewedBy",
            select: "name email",
          });

      if (!application) {
        return res
          .status(404)
          .json({
            success: false,

            message:
              "Photographer application not found.",
          });
      }

      return res
        .status(200)
        .json({
          success: true,

          data: {
            application,
          },
        });
    } catch (error) {
      next(error);
    }
  };

// ==========================================
// REVIEW PHOTOGRAPHER APPLICATION
// PATCH /api/admin/photographer-applications/:id/status
// STAFF_ADMIN ONLY
// ==========================================

const reviewPhotographerApplication =
  async (req, res, next) => {
    let createdUser = null;
    let createdPhotographer = null;
    let temporaryPassword = null;

    try {
      const {
        status,
        adminNote,
      } = req.body;


      // ======================================
      // 1. VALIDATE STATUS
      // ======================================

      if (
        ![
          "APPROVED",
          "REJECTED",
        ].includes(status)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Status must be APPROVED or REJECTED.",
        });
      }


      // ======================================
      // 2. FIND APPLICATION
      // ======================================

      const application =
        await PhotographerApplication.findById(
          req.params.id
        );

      if (!application) {
        return res.status(404).json({
          success: false,
          message:
            "Photographer application not found.",
        });
      }


      // ======================================
      // 3. ONLY PENDING CAN BE REVIEWED
      // ======================================

      if (
        application.status !==
        "PENDING"
      ) {
        return res.status(409).json({
          success: false,
          message:
            "This application has already been reviewed.",
        });
      }


      // ======================================
      // 4. REJECTION REQUIRES EXPLANATION
      // ======================================

      if (
        status === "REJECTED" &&
        !adminNote?.trim()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Please provide a reason when rejecting an application.",
        });
      }


      // ======================================
      // 5. HANDLE APPROVAL
      // ======================================

      if (status === "APPROVED") {

        // ------------------------------------
        // Professional email must exist
        // ------------------------------------

        if (
          !application.professionalEmail
            ?.trim()
        ) {
          return res.status(400).json({
            success: false,
            message:
              "This application does not have a professional email.",
          });
        }


        const normalizedProfessionalEmail =
          application.professionalEmail
            .trim()
            .toLowerCase();


        // ------------------------------------
        // Get original customer
        // ------------------------------------

        const customer =
          await User.findById(
            application.customer
          ).select(
            "name email status"
          );

        if (!customer) {
          return res.status(404).json({
            success: false,
            message:
              "Customer account linked to this application was not found.",
          });
        }


        // ------------------------------------
        // Recheck professional email
        // ------------------------------------

        const existingUser =
          await User.findOne({
            email:
              normalizedProfessionalEmail,
          });

        if (existingUser) {
          return res.status(409).json({
            success: false,
            message:
              "The professional email is already being used by another account.",
          });
        }


        // ------------------------------------
        // Protect against Photographer model
        // field-length differences
        // ------------------------------------

        if (
          application.bio &&
          application.bio.length > 1000
        ) {
          return res.status(400).json({
            success: false,
            message:
              "The professional bio cannot exceed 1000 characters before approval.",
          });
        }

        if (
          application.location &&
          application.location.length > 150
        ) {
          return res.status(400).json({
            success: false,
            message:
              "The photographer location cannot exceed 150 characters before approval.",
          });
        }


        // ------------------------------------
        // Generate temporary password
        // ------------------------------------

        temporaryPassword =
          generateTemporaryPassword();


        // ------------------------------------
        // Hash temporary password
        // ------------------------------------

        const passwordHash =
          await bcrypt.hash(
            temporaryPassword,
            12
          );


        // ------------------------------------
        // Create separate PHOTOGRAPHER User
        // ------------------------------------

        createdUser =
          await User.create({
            name: customer.name,

            email:
              normalizedProfessionalEmail,

            passwordHash,

            role:
              "PHOTOGRAPHER",

            status:
              "ACTIVE",

            mustChangePassword: true,
          });


        // ------------------------------------
        // Create Photographer profile
        // using application information
        // ------------------------------------

        createdPhotographer =
          await Photographer.create({
            user:
              createdUser._id,

            bio:
              application.bio || "",

            specialization:
              application.specialization ||
              "",

            location:
              application.location || "",

            hourlyRate:
              application.expectedHourlyRate ??
              null,

            packageRates: [],

            profileImage: "",
          });
      }


      // ======================================
      // 6. UPDATE APPLICATION
      // ======================================

      application.status =
        status;

      application.adminNote =
        adminNote?.trim() || "";

      application.reviewedBy =
        req.user.userId;

      application.reviewedAt =
        new Date();

      await application.save();


      // ======================================
      // SEND PHOTOGRAPHER CREDENTIALS EMAIL
      // ======================================

      if (
        status === "APPROVED" &&
        createdUser &&
        temporaryPassword
      ) {
        try {
          const customer =
            await User.findById(
              application.customer
            ).select("name email");

          if (!customer) {
            console.error(
              "Unable to send photographer credentials: customer not found."
            );
          } else {
            await sendEmail({
              to: customer.email,

              subject:
                "Your SCR Photographer Account Has Been Approved",

              text: `
      Hello ${customer.name},

      Congratulations! Your application to join Southern Camera Rental as a photographer has been approved.

      Your photographer account has now been created.

      Photographer Login Email:
      ${createdUser.email}

      Temporary Password:
      ${temporaryPassword}

      Please use these credentials to log in to your photographer account.

      For security, please do not share your login credentials with anyone.

      Regards,
      Southern Camera Rental
              `.trim(),

              html: `
                <div
                  style="
                    max-width: 600px;
                    margin: 0 auto;
                    font-family: Arial, sans-serif;
                    color: #1f2937;
                    line-height: 1.6;
                  "
                >
                  <div
                    style="
                      padding: 24px;
                      background: #111827;
                      color: #ffffff;
                      border-radius: 12px 12px 0 0;
                    "
                  >
                    <h1
                      style="
                        margin: 0;
                        font-size: 22px;
                      "
                    >
                      Southern Camera Rental
                    </h1>
                  </div>

                  <div
                    style="
                      padding: 30px;
                      border: 1px solid #e5e7eb;
                      border-top: 0;
                      border-radius: 0 0 12px 12px;
                    "
                  >
                    <h2
                      style="
                        margin-top: 0;
                        color: #111827;
                      "
                    >
                      Photographer Application Approved
                    </h2>

                    <p>
                      Hello ${customer.name},
                    </p>

                    <p>
                      Congratulations! Your application
                      to join Southern Camera Rental as
                      a photographer has been approved.
                    </p>

                    <p>
                      Your photographer account has
                      now been created.
                    </p>

                    <div
                      style="
                        margin: 24px 0;
                        padding: 20px;
                        background: #fff7ed;
                        border: 1px solid #fed7aa;
                        border-radius: 10px;
                      "
                    >
                      <p
                        style="
                          margin: 0 0 12px;
                          font-size: 13px;
                          color: #6b7280;
                        "
                      >
                        PHOTOGRAPHER LOGIN EMAIL
                      </p>

                      <p
                        style="
                          margin: 0 0 20px;
                          font-weight: bold;
                          color: #111827;
                        "
                      >
                        ${createdUser.email}
                      </p>

                      <p
                        style="
                          margin: 0 0 12px;
                          font-size: 13px;
                          color: #6b7280;
                        "
                      >
                        TEMPORARY PASSWORD
                      </p>

                      <p
                        style="
                          margin: 0;
                          font-weight: bold;
                          color: #111827;
                        "
                      >
                        ${temporaryPassword}
                      </p>
                    </div>

                    <p>
                      Please use these credentials to
                      log in to your photographer
                      account.
                    </p>

                    <p
                      style="
                        font-size: 13px;
                        color: #6b7280;
                      "
                    >
                      For security, please do not share
                      your login credentials with anyone.
                    </p>

                    <p
                      style="
                        margin-top: 28px;
                      "
                    >
                      Regards,<br />
                      <strong>
                        Southern Camera Rental
                      </strong>
                    </p>
                  </div>
                </div>
              `,
            });

            console.log(
              `Photographer credentials email sent to ${customer.email}`
            );
          }
        } catch (emailError) {
          console.error(
            "Failed to send photographer credentials email:",
            emailError
          );
        }
      }


      // ======================================
      // 7. CREATE CUSTOMER NOTIFICATION
      // ======================================

      try {
        if (
          status ===
          "APPROVED"
        ) {
          await Notification.create({
            user:
              application.customer,

            type:
              "PHOTOGRAPHER_APPLICATION_APPROVED",

            title:
              "Photographer Application Approved",

            message:
              `Your application to become a photographer has been approved. Your photographer login email is ${application.professionalEmail}. Your temporary password and login instructions will be sent to your customer email address.`,

            relatedApplication:
              application._id,
          });
        } else {
          await Notification.create({
            user:
              application.customer,

            type:
              "PHOTOGRAPHER_APPLICATION_REJECTED",

            title:
              "Photographer Application Rejected",

            message:
              adminNote?.trim()
                ? `Your photographer application was not approved. Administrator note: ${adminNote.trim()}`
                : "Your photographer application was not approved.",

            relatedApplication:
              application._id,
          });
        }
      } catch (
        notificationError
      ) {
        console.error(
          "Failed to create photographer application notification:",
          notificationError
        );
      }


      // ======================================
      // 8. POPULATE RESPONSE
      // ======================================

      await application.populate([
        {
          path: "customer",
          select:
            "name email status",
        },
        {
          path: "reviewedBy",
          select:
            "name email",
        },
      ]);


      // ======================================
      // 9. RETURN RESPONSE
      // ======================================

      return res.status(200).json({
        success: true,

        message:
          status ===
          "APPROVED"
            ? "Photographer application approved and photographer account created successfully."
            : "Photographer application rejected successfully.",

        data: {
          application,

          photographerAccount:
            status === "APPROVED"
              ? {
                  userId:
                    createdUser._id,

                  photographerId:
                    createdPhotographer._id,

                  name:
                    createdUser.name,

                  email:
                    createdUser.email,

                  role:
                    createdUser.role,

                  status:
                    createdUser.status,
                }
              : null,

        },
      });
    } catch (error) {

      // ======================================
      // ROLLBACK
      // ======================================
      //
      // If profile/account creation fails
      // before approval completes, remove
      // anything partially created.
      // ======================================

      if (createdPhotographer) {
        try {
          await Photographer.findByIdAndDelete(
            createdPhotographer._id
          );
        } catch (
          cleanupError
        ) {
          console.error(
            "Failed to clean up Photographer after approval error:",
            cleanupError
          );
        }
      }


      if (createdUser) {
        try {
          await User.findByIdAndDelete(
            createdUser._id
          );
        } catch (
          cleanupError
        ) {
          console.error(
            "Failed to clean up User after approval error:",
            cleanupError
          );
        }
      }


      next(error);
    }
  };

module.exports = {
  createPhotographer,
  getPhotographerApplications,  
  getPhotographerApplicationById,
  reviewPhotographerApplication,
};