const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const User = require("../models/User");
const Photographer = require("../models/Photographer");
const PhotographerApplication = require("../models/PhotographerApplication");
const Booking = require("../models/Booking");
const Rental = require("../models/Rental");
const PhotographerNotification = require("../models/photographerNotification");
const sendEmail = require("../utils/sendEmail");

const Invoice = require("../models/invoice");
const Payment = require("../models/payment");
const Deposit = require("../models/deposit");
const Refund = require("../models/refund");
const Notification = require("../models/notification");
const Review = require("../models/Review");
const DamageRecord = require("../models/DamageRecord");
const Return = require("../models/Return");
const PhotographerSubscriptionPayment = require("../models/PhotographerSubscriptionPayment");

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
// CALCULATE PHOTOGRAPHER TRIAL END
// ==========================================

const getPhotographerTrialEnd = () => {
  const trialEnd = new Date();

  trialEnd.setHours(
    trialEnd.getHours() + 6
  );

  return trialEnd;
};


// ==========================================
// CREATE PHOTOGRAPHER ACCOUNT
// POST /api/admin/photographers
// STAFF_ADMIN ONLY
// ==========================================

const createPhotographer = async (req, res, next) => {
  let createdUser = null;
  let createdPhotographer = null;

  try {
    // 1. Validate input
    const { name, email } = req.body;

    if (
      typeof name !== "string" ||
      !name.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Name is required.",
      });
    }

    if (
      typeof email !== "string" ||
      !email.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Email is required.",
      });
    }

    // 2. Normalize email
    const normalizedEmail = email.trim().toLowerCase();

    // 3. Check for an existing account
    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    // 4. Generate a secure temporary password
    const temporaryPassword = generateTemporaryPassword();

    // 5. Hash the temporary password
    const passwordHash = await bcrypt.hash(
      temporaryPassword,
      12
    );

    // 6. Create photographer login account
    createdUser = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: "PHOTOGRAPHER",
      status: "ACTIVE",
      mustChangePassword: true,
    });

    // 7. Create photographer profile
    createdPhotographer = await Photographer.create({
      user: createdUser._id,
      bio: "",
      specialization: "",
      location: "",
      hourlyRate: null,
      packageRates: [],
      profileImage: "",
      subscriptionStatus: "TRIAL",
      trialEndsAt: getPhotographerTrialEnd(),
      subscriptionStartDate: null,
      subscriptionEndDate: null,
      gracePeriodEndsAt: null,
    });

    // 8. Send temporary credentials by email
    let emailSent = false;

    try {
      await sendEmail({
        to: createdUser.email,
        subject: "Your Southern Camera Rental Photographer Account",

        text: `
Hello ${createdUser.name},

Your photographer account for Southern Camera Rental has been created successfully.

Photographer Login Email:
${createdUser.email}

Temporary Password:
${temporaryPassword}

Please use these credentials to log in.

You will be required to change your temporary password after your first login.

For security, please do not share your login credentials with anyone.

Regards,
Southern Camera Rental
        `.trim(),

        html: `
          <div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;color:#1f2937;line-height:1.6;">
            <div style="padding:24px;background:#111827;color:#ffffff;border-radius:12px 12px 0 0;">
              <h1 style="margin:0;font-size:22px;">
                Southern Camera Rental
              </h1>
            </div>

            <div style="padding:30px;border:1px solid #e5e7eb;border-top:0;border-radius:0 0 12px 12px;">
              <h2 style="margin-top:0;color:#111827;">
                Photographer Account Created
              </h2>

              <p>Hello ${createdUser.name},</p>

              <p>
                Your photographer account has been created successfully.
              </p>

              <div style="margin:24px 0;padding:20px;background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;">
                <p style="margin:0 0 8px;font-size:13px;color:#6b7280;">
                  PHOTOGRAPHER LOGIN EMAIL
                </p>

                <p style="margin:0 0 20px;font-weight:bold;">
                  ${createdUser.email}
                </p>

                <p style="margin:0 0 8px;font-size:13px;color:#6b7280;">
                  TEMPORARY PASSWORD
                </p>

                <p style="margin:0;font-weight:bold;">
                  ${temporaryPassword}
                </p>
              </div>

              <p>
                Please log in using these credentials.
                You will be required to change your temporary
                password after your first login.
              </p>

              <p style="font-size:13px;color:#6b7280;">
                For security, please do not share your login
                credentials with anyone.
              </p>

              <p style="margin-top:28px;">
                Regards,<br />
                <strong>Southern Camera Rental</strong>
              </p>
            </div>
          </div>
        `,
      });

      emailSent = true;

      console.log(
        `Photographer credentials email sent to ${createdUser.email}`
      );
    } catch (emailError) {
      console.error(
        "Failed to send photographer credentials email:",
        emailError
      );
    }

    // 9. Return safe response
    return res.status(201).json({
      success: true,
      message: emailSent
        ? "Photographer account created successfully. Temporary credentials have been emailed."
        : "Photographer account created, but the credentials email could not be sent. Contact the administrator.",

      data: {
        emailSent,
        photographer: {
          id: createdPhotographer._id,
          userId: createdUser._id,
          name: createdUser.name,
          email: createdUser.email,
          role: createdUser.role,
          status: createdUser.status,
          mustChangePassword: createdUser.mustChangePassword,
          profile: {
            bio: createdPhotographer.bio,
            specialization: createdPhotographer.specialization,
            location: createdPhotographer.location,
            hourlyRate: createdPhotographer.hourlyRate,
            packageRates: createdPhotographer.packageRates,
            profileImage: createdPhotographer.profileImage,
          },
        },
      },
    });

  } catch (error) {
    // Roll back partially created records
    if (createdPhotographer) {
      try {
        await Photographer.findByIdAndDelete(
          createdPhotographer._id
        );
      } catch (cleanupError) {
        console.error(
          "Failed to clean up Photographer profile:",
          cleanupError
        );
      }
    }

    if (createdUser) {
      try {
        await User.findByIdAndDelete(createdUser._id);
      } catch (cleanupError) {
        console.error(
          "Failed to clean up Photographer user:",
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

            subscriptionStatus: "TRIAL",
            trialEndsAt: getPhotographerTrialEnd(),

            subscriptionStartDate: null,
            subscriptionEndDate: null,
            gracePeriodEndsAt: null,
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
          await PhotographerNotification.create({
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
          await PhotographerNotification.create({
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

// Adding controller by Abilash started here


// ==========================================
// GET ALL CUSTOMERS
// GET /api/admin/customers
// ==========================================

 // ==========================================
 // GET ALL CUSTOMERS
 // CLERK AND ADMIN
 // GET /api/admin/customers
 // ==========================================

 const getCustomers = async (req, res, next) => {
   try {
     const {
       search = "",
       status = "ALL",
       page = "1",
       limit = "10",
     } = req.query;

     // --------------------------------------
     // VALIDATE PAGINATION
     // --------------------------------------

     const pageNumber = Number(page);
     const limitNumber = Number(limit);

     if (
       !Number.isInteger(pageNumber) ||
       pageNumber < 1 ||
       !Number.isInteger(limitNumber) ||
       limitNumber < 1 ||
       limitNumber > 100
     ) {
       return res.status(400).json({
         success: false,
         message:
           "Page must be a positive integer and limit must be between 1 and 100.",
       });
     }

     // --------------------------------------
     // VALIDATE STATUS
     // --------------------------------------

     const normalizedStatus = String(status).toUpperCase();

     if (
       !["ALL", "ACTIVE", "INACTIVE"].includes(
         normalizedStatus
       )
     ) {
       return res.status(400).json({
         success: false,
         message: "Invalid customer status filter.",
       });
     }

     // --------------------------------------
     // BUILD FILTER
     // --------------------------------------

     const filter = {
       role: "CUSTOMER",
     };

     if (normalizedStatus !== "ALL") {
       filter.status = normalizedStatus;
     }

     const searchText = String(search).trim();

     if (searchText) {
       if (searchText.length > 100) {
         return res.status(400).json({
           success: false,
           message: "Search must not exceed 100 characters.",
         });
       }

       // Escape regex special characters.
       const escapedSearch = searchText.replace(
         /[.*+?^${}()|[\]\\]/g,
         "\\$&"
       );

       filter.$or = [
         {
           name: {
             $regex: escapedSearch,
             $options: "i",
           },
         },
         {
           email: {
             $regex: escapedSearch,
             $options: "i",
           },
         },
       ];
     }

     // --------------------------------------
     // FETCH CUSTOMERS
     // --------------------------------------

     const skip = (pageNumber - 1) * limitNumber;

     const [customers, totalCustomers] =
       await Promise.all([
         User.find(filter)
           .select("name email role status createdAt")
           .sort({ createdAt: -1, _id: -1 })
           .skip(skip)
           .limit(limitNumber)
           .lean(),

         User.countDocuments(filter),
       ]);

     const totalPages = Math.ceil(
       totalCustomers / limitNumber
     );

     // --------------------------------------
     // RESPONSE
     // --------------------------------------

     return res.status(200).json({
       success: true,
       message: "Customers retrieved successfully",
       data: {
         customers,
         pagination: {
           currentPage: pageNumber,
           totalPages,
           totalCustomers,
           limit: limitNumber,
           hasNextPage: pageNumber < totalPages,
           hasPreviousPage: pageNumber > 1,
         },
       },
     });
   } catch (error) {
     next(error);
   }
 };

// ==========================================
// GET CUSTOMER BY ID
// CLERK AND ADMIN
// GET /api/admin/customers/:id
// ==========================================

const getCustomerById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ObjectId
    if (!mongoose.isObjectIdOrHexString(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer ID.",
      });
    }

    // Only retrieve CUSTOMER accounts
    const customer = await User.findOne({
      _id: id,
      role: "CUSTOMER",
    })
      .select("name email role status createdAt updatedAt")
      .lean();

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Customer retrieved successfully.",
      data: {
        customer,
      },
    });
  } catch (error) {
    next(error);
  }
};


// ==========================================
// UPDATE CUSTOMER ACCOUNT STATUS
// ADMIN AND CLERK
// ==========================================

const updateCustomerStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate customer ID
    if (!mongoose.isObjectIdOrHexString(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer ID.",
      });
    }

    // Validate requested status
    if (!["ACTIVE", "INACTIVE"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be ACTIVE or INACTIVE.",
      });
    }

    // Only update CUSTOMER accounts
    const customer = await User.findOne({
      _id: id,
      role: "CUSTOMER",
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found.",
      });
    }

    if (customer.status === status) {
      return res.status(200).json({
        success: true,
        message: `Customer account is already ${status}.`,
        data: {
          customer: {
            id: customer._id,
            name: customer.name,
            email: customer.email,
            status: customer.status,
          },
        },
      });
    }

    customer.status = status;

    customer.disabledReason =
      status === "INACTIVE"
        ? "ADMIN_DISABLED"
        : "NONE";

    await customer.save();

    return res.status(200).json({
      success: true,
      message:
        status === "ACTIVE"
          ? "Customer account activated successfully."
          : "Customer account deactivated successfully.",
      data: {
        customer: {
          id: customer._id,
          name: customer.name,
          email: customer.email,
          status: customer.status,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};


// ==========================================
// DELETE CUSTOMER ACCOUNT - ADMIN ONLY
// ==========================================

const deleteCustomer = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.isObjectIdOrHexString(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer ID.",
      });
    }

    const customer = await User.findOne({
      _id: id,
      role: "CUSTOMER",
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found.",
      });
    }

    
    const [
      hasBookings,
      hasRentals,
      hasApplications,
      hasInvoices,
      hasPayments,
      hasDeposits,
      hasRefunds,
      hasNotifications,
      hasPhotographerNotifications,
      hasReviews,
      hasDamageRecords,
      hasReturnRecords,
      hasSubscriptionPayments,
    ] = await Promise.all([
      Booking.exists({ customer: id }),
      Rental.exists({$or: [{ customer: id },{ approvedBy: id },],}),
      PhotographerApplication.exists({ customer: id }),
      Invoice.exists({ customer: id }),
      Payment.exists({ customer: id }),
      Deposit.exists({ customer: id }),
      Refund.exists({ customer: id }),
      Notification.exists({ recipient: id }),
      PhotographerNotification.exists({ user: id }),
      Review.exists({ customer: id }),
      DamageRecord.exists({$or: [{ customer: id },{ reportedBy: id },],}),
      Return.exists({$or: [{ customer: id },{ receivedBy: id },],}),
      PhotographerSubscriptionPayment.exists({$or: [{ user: id },{ verifiedBy: id },],}),]);

    const hasLinkedRecords = Boolean(
      hasBookings ||
      hasRentals ||
      hasApplications ||
      hasInvoices ||
      hasPayments ||
      hasDeposits ||
      hasRefunds ||
      hasNotifications ||
      hasPhotographerNotifications ||
      hasReviews ||
      hasReturnRecords ||
      hasDamageRecords ||
      hasSubscriptionPayments

    );

    if (hasLinkedRecords) {
      return res.status(409).json({
        success: false,
        message:
          "This customer has linked records and cannot be permanently deleted. Deactivate the account instead.",
      });
    }

    // Permanently delete an eligible customer
    const deletedCustomer = await User.findOneAndDelete({
      _id: id,
      role: "CUSTOMER",
    });

    if (!deletedCustomer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Customer account deleted successfully.",
    });

  } catch (error) {
    next(error);
  }
};


// ==========================================
// GET CUSTOMER ACTIVITY HISTORY
// ADMIN AND CLERK
// GET /api/admin/customers/:id/history
// ==========================================

const getCustomerActivityHistory = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate Customer ID
    if (!mongoose.isObjectIdOrHexString(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer ID.",
      });
    }

    // Ensure the account belongs to a customer
    const customer = await User.findOne({
      _id: id,
      role: "CUSTOMER",
    })
      .select("_id name email")
      .lean();

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found.",
      });
    }

    // Retrieve booking and rental histories
    const [bookings, rentals] = await Promise.all([
      Booking.find({ customer: id })
        .select(
          "photographer date startTime endTime pricingType " +
          "durationHours packageNameAtBooking totalAmount " +
          "status createdAt"
        )
        .populate({
          path: "photographer",
          select: "user",
          populate: {
            path: "user",
            select: "name",
          },
        })
        .sort({ createdAt: -1 })
        .lean(),

      Rental.find({ customer: id })
        .select(
          "equipment startDate endDate totalPrice status " +
          "issuedAt returnedAt createdAt"
        )
        .populate({
          path: "equipment",
          select: "name",
        })
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    return res.status(200).json({
      success: true,
      message: "Customer activity history retrieved successfully.",
      data: {
        customer,
        summary: {
          totalBookings: bookings.length,
          totalRentals: rentals.length,
        },
        bookings,
        rentals,
      },
    });
  } catch (error) {
    next(error);
  }
};


// ==========================================
// CREATE CLERK ACCOUNT
// POST /api/admin/clerks
// STAFF_ADMIN ONLY
// ==========================================

const createClerk = async (req, res, next) => {
  try {
    const { name, email } = req.body;

    // ======================================
    // 1. VALIDATE REQUIRED FIELDS
    // ======================================

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Clerk name is required.",
      });
    }

    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: "Clerk email is required.",
      });
    }

    // ======================================
    // 2. NORMALIZE EMAIL
    // ======================================

    const normalizedEmail =
      email.trim().toLowerCase();

    // ======================================
    // 3. CHECK EXISTING USER
    // ======================================

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message:
          "An account with this email already exists.",
      });
    }

    // ======================================
    // 4. GENERATE TEMPORARY PASSWORD
    // ======================================

    const temporaryPassword =
      generateTemporaryPassword();

    // ======================================
    // 5. HASH TEMPORARY PASSWORD
    // ======================================

    const passwordHash = await bcrypt.hash(
      temporaryPassword,
      12
    );

    // ======================================
    // 6. CREATE CLERK USER
    // ======================================

    const clerk = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,

      role: "CLERK",

      status: "ACTIVE",

      mustChangePassword: true,
    });

    // ======================================
    // 7. SEND CLERK CREDENTIALS EMAIL
    // ======================================

    try {
      await sendEmail({
        to: clerk.email,

        subject:
          "Your Southern Camera Rental Clerk Account",

        text: `
Hello ${clerk.name},

Your Clerk account for Southern Camera Rental has been created.

Login Email:
${clerk.email}

Temporary Password:
${temporaryPassword}

Please use these credentials to log in.

You will be required to change your temporary password after your first login.

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
                Clerk Account Created
              </h2>

              <p>
                Hello ${clerk.name},
              </p>

              <p>
                Your Clerk account for Southern
                Camera Rental has been created.
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
                  CLERK LOGIN EMAIL
                </p>

                <p
                  style="
                    margin: 0 0 20px;
                    font-weight: bold;
                    color: #111827;
                  "
                >
                  ${clerk.email}
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
                log in. You will be required to
                change your temporary password
                after your first login.
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

              <p style="margin-top: 28px;">
                Regards,<br />
                <strong>
                  Southern Camera Rental
                </strong>
              </p>
            </div>
          </div>
        `,
      });
    } catch (emailError) {
      console.error(
        "Failed to send Clerk credentials email:",
        emailError
      );
    }

    // ======================================
    // 8. RETURN SAFE RESPONSE
    // ======================================

    return res.status(201).json({
      success: true,

      message:
        "Clerk account created successfully.",

      data: {
        clerk: {
          id: clerk._id,
          name: clerk.name,
          email: clerk.email,
          role: clerk.role,
          status: clerk.status,
          mustChangePassword:
            clerk.mustChangePassword,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// UPDATE CLERK / PHOTOGRAPHER ACCOUNT STATUS
// PATCH /api/admin/users/:userId/status
// STAFF_ADMIN ONLY
// ==========================================

const updateStaffAccountStatus = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { status } = req.body;

    // ----------------------------------------
    // Validate status
    // ----------------------------------------

    if (!["ACTIVE", "INACTIVE"].includes(status)) {
      return res.status(400).json({
        success: false,
        message:
          "Status must be either ACTIVE or INACTIVE.",
      });
    }

    // ----------------------------------------
    // Find user
    // ----------------------------------------

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User account not found.",
      });
    }

    // ----------------------------------------
    // Only Clerk and Photographer accounts
    // can be managed using this operation
    // ----------------------------------------

    if (
      user.role !== "CLERK" &&
      user.role !== "PHOTOGRAPHER"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Only Clerk and Photographer accounts can be enabled or disabled.",
      });
    }

    // ----------------------------------------
    // Clerk can manage Photographer accounts only
    // ----------------------------------------

    if (
      req.user.role === "CLERK" &&
      user.role !== "PHOTOGRAPHER"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Clerks can only enable or disable Photographer accounts.",
      });
    }

    // ----------------------------------------
    // Avoid unnecessary update
    // ----------------------------------------

    if (user.status === status) {
      return res.status(200).json({
        success: true,
        message: `Account is already ${status}.`,
        data: {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            status: user.status,
          },
        },
      });
    }

    // ----------------------------------------
    // Update account status
    // ----------------------------------------

    user.status = status;

    if (status === "INACTIVE") {
      user.disabledReason = "ADMIN_DISABLED";
    } else {
      user.disabledReason = "NONE";
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message:
        status === "ACTIVE"
          ? "Account enabled successfully."
          : "Account disabled successfully.",
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// GET CLERK / PHOTOGRAPHER ACCOUNTS
// GET /api/admin/staff-accounts
// STAFF_ADMIN ONLY
// ==========================================

const getStaffAccounts = async (req, res, next) => {
  try {
    const users = await User.find({
      role: {
        $in:
          req.user.role === "STAFF_ADMIN"
            ? ["CLERK", "PHOTOGRAPHER"]
            : ["PHOTOGRAPHER"],
      },
    })
      .select(
        "name email role status mustChangePassword createdAt"
      )
      .sort({
        createdAt: -1,
      });

    return res.status(200).json({
      success: true,
      data: {
        users,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// GET PHOTOGRAPHER DETAILS BY USER ID
// ADMIN ONLY
// GET /api/admin/photographers/:id
// ==========================================

const getPhotographerById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate User account ID
    if (!mongoose.isObjectIdOrHexString(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid photographer user ID.",
      });
    }

    // Find the photographer's login account
    const user = await User.findOne({
      _id: id,
      role: "PHOTOGRAPHER",
    })
      .select(
        "name email role status mustChangePassword " +
        "createdAt updatedAt"
      )
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Photographer account not found.",
      });
    }

    // Photographer.user references User._id
    const photographer = await Photographer.findOne({
      user: user._id,
    })
      .select(
        "user bio specialization location hourlyRate " +
        "packageRates profileImage subscriptionStatus " +
        "trialEndsAt subscriptionStartDate " +
        "subscriptionEndDate gracePeriodEndsAt " +
        "createdAt updatedAt"
      )
      .lean();

    return res.status(200).json({
      success: true,
      message: "Photographer details retrieved successfully.",
      data: {
        user,
        photographer,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// GET PHOTOGRAPHER BOOKING HISTORY
// ADMIN ONLY
// GET /api/admin/photographers/:id/history
// ==========================================

const getPhotographerBookingHistory = async (req, res, next) => {
  try {
    const { id } = req.params;

    // The URL contains the User account ID.
    if (!mongoose.isObjectIdOrHexString(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid photographer user ID.",
      });
    }

    const user = await User.findOne({
      _id: id,
      role: "PHOTOGRAPHER",
    })
      .select("_id name email")
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Photographer account not found.",
      });
    }

    // Resolve the Photographer profile ID.
    const photographer = await Photographer.findOne({
      user: user._id,
    })
      .select("_id")
      .lean();

    if (!photographer) {
      return res.status(404).json({
        success: false,
        message: "Photographer profile not found.",
      });
    }

    // Retrieve actual booking records.
    const bookings = await Booking.find({
      photographer: photographer._id,
    })
      .select(
        "customer date startTime endTime pricingType " +
        "durationHours packageNameAtBooking totalAmount " +
        "status createdAt"
      )
      .populate({
        path: "customer",
        select: "name email",
      })
      .sort({ date: -1, createdAt: -1 })
      .lean();

    const now = new Date();

    const summary = {
      totalBookings: bookings.length,
      requestedBookings: 0,
      confirmedBookings: 0,
      completedBookings: 0,
      rejectedBookings: 0,
      cancelledBookings: 0,
      upcomingBookings: 0,
      completedBookingValue: 0,
    };

    for (const booking of bookings) {
      switch (booking.status) {
        case "REQUESTED":
          summary.requestedBookings += 1;
          break;
        case "CONFIRMED":
          summary.confirmedBookings += 1;
          break;
        case "COMPLETED":
          summary.completedBookings += 1;
          summary.completedBookingValue +=
            booking.totalAmount || 0;
          break;
        case "REJECTED":
          summary.rejectedBookings += 1;
          break;
        case "CANCELLED":
          summary.cancelledBookings += 1;
          break;
        default:
          break;
      }

      // Upcoming means a future booking date
      // that has not been rejected or cancelled.
      if (
        booking.date &&
        new Date(booking.date) >= now &&
        ["REQUESTED", "CONFIRMED"].includes(booking.status)
      ) {
        summary.upcomingBookings += 1;
      }
    }

    return res.status(200).json({
      success: true,
      message: "Photographer booking history retrieved successfully.",
      data: {
        photographer: user,
        summary,
        bookings,
      },
    });
  } catch (error) {
    next(error);
  }
};

 // ==========================================
 // GET CLERK DETAILS BY USER ID
 // STAFF ADMIN ONLY
 // ==========================================

const getClerkById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ObjectId
    if (!mongoose.isObjectIdOrHexString(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid clerk user ID.",
      });
    }

    // Retrieve only a Clerk account
    const clerk = await User.findOne({
      _id: id,
      role: "CLERK",
    })
      .select(
        "name email role status mustChangePassword createdAt updatedAt"
      )
      .lean();

    if (!clerk) {
      return res.status(404).json({
        success: false,
        message: "Clerk account not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Clerk details retrieved successfully.",
      data: {
        clerk,
      },
    });
  } catch (error) {
    next(error);
  }
};

 // ==========================================
 // GET CLERK WORK HISTORY
 // STAFF ADMIN ONLY
 // ==========================================

const getClerkWorkHistory = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.isObjectIdOrHexString(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid clerk user ID.",
      });
    }

    const clerk = await User.findOne({
      _id: id,
      role: "CLERK",
    })
      .select("name email role status")
      .lean();

    if (!clerk) {
      return res.status(404).json({
        success: false,
        message: "Clerk account not found.",
      });
    }

    const [
      rentalApprovals,
      equipmentReturns,
      damageReports,
      deductionReviews,
      overduePenaltyReviews,
      depositSettlements,
      refundConfirmations,
    ] = await Promise.all([
      Rental.find({ approvedBy: id })
        .select(
          "customer equipment startDate endDate totalPrice status approvedAt"
        )
        .populate("customer", "name email")
        .populate("equipment", "name")
        .sort({ approvedAt: -1 })
        .lean(),

      Return.find({ receivedBy: id })
        .select(
          "rental equipment customer returnedAt condition damageDescription notes"
        )
        .populate("equipment", "name")
        .populate("customer", "name email")
        .sort({ returnedAt: -1 })
        .lean(),

      DamageRecord.find({ reportedBy: id })
        .select(
          "rental equipment customer description status repairCost createdAt"
        )
        .populate("equipment", "name")
        .populate("customer", "name email")
        .sort({ createdAt: -1 })
        .lean(),

      DamageRecord.find({ deductionReviewedBy: id })
        .select(
          "rental equipment customer description deductionApprovalStatus approvedDeductionAmount deductionReviewedAt"
        )
        .populate("equipment", "name")
        .populate("customer", "name email")
        .sort({ deductionReviewedAt: -1 })
        .lean(),

      Rental.find({ overduePenaltyReviewedBy: id })
        .select(
          "customer equipment overdueDays overduePenaltyAmount overduePenaltyStatus overduePenaltyReviewedAt"
        )
        .populate("equipment", "name")
        .populate("customer", "name email")
        .sort({ overduePenaltyReviewedAt: -1 })
        .lean(),

      Deposit.find({ settledBy: id })
        .select(
          "invoice customer amount deductedAmount refundedAmount status settlementNotes settledAt"
        )
        .populate("customer", "name email")
        .sort({ settledAt: -1 })
        .lean(),

      Refund.find({ confirmedBy: id })
        .select(
          "invoice customer amount refundMethod status confirmedAt payoutReference"
        )
        .populate("customer", "name email")
        .sort({ confirmedAt: -1 })
        .lean(),
    ]);

    const summary = {
      totalRentalApprovals: rentalApprovals.length,
      totalEquipmentReturns: equipmentReturns.length,
      totalDamageReports: damageReports.length,
      totalDeductionReviews: deductionReviews.length,
      totalOverduePenaltyReviews: overduePenaltyReviews.length,
      totalDepositSettlements: depositSettlements.length,
      totalRefundConfirmations: refundConfirmations.length,
    };

    return res.status(200).json({
      success: true,
      message: "Clerk work history retrieved successfully.",
      data: {
        clerk,
        summary,
        rentalApprovals,
        equipmentReturns,
        damageReports,
        deductionReviews,
        overduePenaltyReviews,
        depositSettlements,
        refundConfirmations,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPhotographer,
  createClerk,
  getCustomers, 
  getCustomerById,
  updateCustomerStatus,
  deleteCustomer,
  getCustomerActivityHistory,
  getPhotographerApplications,  
  getPhotographerApplicationById,
  reviewPhotographerApplication,
  updateStaffAccountStatus,
  getStaffAccounts,
  getPhotographerById,
  getPhotographerBookingHistory,
  getClerkById,
  getClerkWorkHistory,
};