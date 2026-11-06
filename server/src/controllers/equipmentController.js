

const Equipment = require("../models/Equipment");

const Category = require("../models/Category");

// MODIFIED BY: Thasindu
// PURPOSE: Check existing rental dates when filtering equipment availability.
const Rental = require("../models/Rental");

// ==========================================
// CREATE EQUIPMENT
// POST /api/equipment
// ==========================================
const createEquipment = async (req, res, next) => {
  try {
    const {
      name,
      category,
      brand,
      model,
      serialNumber,
      rentalPricePerDay,
      securityDeposit,
      status,
      description,
      imageUrl,
      images,
      // MODIFIED BY: Thasindu
      // PURPOSE: Accept optional promotional information.
      offer,
    } = req.body;

    const categoryExists = await Category.findOne({
      _id: category,
      status: "ACTIVE",
    });

    if (!categoryExists) {
      return res.status(400).json({
        success: false,
        message: "Invalid or inactive equipment category",
      });
    }



    // MODIFIED BY: Thasindu
    // PURPOSE: Reject invalid offer payloads during equipment creation.
    if (
      offer !== undefined &&
      (!offer || typeof offer !== "object" || Array.isArray(offer))
    ) {
      return res.status(400).json({
        success: false,
        message: "Offer must be an object",
      });
    }


    const equipment = await Equipment.create({
      name,
      category,
      brand,
      model,
      serialNumber,
      rentalPricePerDay,
      securityDeposit,
      status,
      description,
      imageUrl,
      images: Array.isArray(images) ? images : [],
      // MODIFIED BY: Thasindu
      // PURPOSE: Save offer metadata with newly created equipment.
      ...(offer !== undefined ? { offer } : {}),
    });


    // Populate category details
    await equipment.populate("category", "name description status");


    return res.status(201).json({
      success: true,
      message: "Equipment created successfully",
      data: {
        equipment,
      },
    });
  } catch (error) {
    next(error);
  }
};


// ==========================================
// GET ALL EQUIPMENT
// GET /api/equipment
//SEARCH AND FILTER EQUIPMENTS

// ============================================================
// GET ALL EQUIPMENT
// MODIFIED BY: Thasindu
// PURPOSE: Support price, special offer and rental-date filters.
// ============================================================
const getAllEquipment = async (req, res, next) => {
  try {
    const {
      search,
      category,
      brand,
      status,
      minPrice,
      maxPrice,
      specialOffers,
      startDate,
      endDate,
      sortBy,
      customerView,
    } = req.query;

    const filter = {};
    const additionalConditions = [];

    // MODIFIED BY: Thasindu
    // PURPOSE: Keep damaged and under-maintenance items out of customer browsing,
    // while leaving the admin equipment list unchanged.
    if (customerView === "true") {
      filter.status = { $nin: ["MAINTENANCE", "DAMAGED"] };
    }

    // Search by equipment name, brand or model.
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { brand: { $regex: search, $options: "i" } },
        { model: { $regex: search, $options: "i" } },
      ];
    }

    if (category) {
      filter.category = category;
    }

    if (brand) {
      filter.brand = brand;
    }

    // Preserve status filtering for admin uses without overriding customer exclusions.
    // MODIFIED BY: Thasindu
    // PURPOSE: Combine an explicitly requested status with customer-safe exclusions.
    if (status) {
      if (customerView === "true") {
        filter.status = { $in: [status], $nin: ["MAINTENANCE", "DAMAGED"] };
      } else {
        filter.status = status;
      }
    }

    // ==========================================
    // PRICE RANGE FILTER
    // MODIFIED BY: Thasindu
    // ==========================================

    const priceFilter = {};

    if (minPrice !== undefined && minPrice !== "") {
      const min = Number(minPrice);

      if (!Number.isFinite(min) || min < 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid minimum price",
        });
      }

      priceFilter.$gte = min;
    }

    if (maxPrice !== undefined && maxPrice !== "") {
      const max = Number(maxPrice);

      if (!Number.isFinite(max) || max < 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid maximum price",
        });
      }

      priceFilter.$lte = max;
    }

    if (
      priceFilter.$gte !== undefined &&
      priceFilter.$lte !== undefined &&
      priceFilter.$gte > priceFilter.$lte
    ) {
      return res.status(400).json({
        success: false,
        message: "Minimum price cannot exceed maximum price",
      });
    }

    if (Object.keys(priceFilter).length > 0) {
      filter.rentalPricePerDay = priceFilter;
    }

    // ==========================================
    // SPECIAL OFFERS FILTER
    // MODIFIED BY: Thasindu
    // PURPOSE: Show only currently active offers.
    // ==========================================

    if (specialOffers === "true") {
      const now = new Date();

      filter["offer.enabled"] = true;
      filter["offer.type"] = {
        $in: ["DISCOUNT", "BONUS"],
      };

      additionalConditions.push({
        $or: [
          { "offer.startAt": null },
          { "offer.startAt": { $lte: now } },
        ],
      });

      additionalConditions.push({
        $or: [
          { "offer.endAt": null },
          { "offer.endAt": { $gte: now } },
        ],
      });
    }

    // ==========================================
    // RENTAL DATE VALIDATION
    // MODIFIED BY: Thasindu
    // ==========================================

    const hasStartDate = Boolean(startDate);
    const hasEndDate = Boolean(endDate);

    if (hasStartDate !== hasEndDate) {
      return res.status(400).json({
        success: false,
        message: "Please select both rental dates",
      });
    }

    let rentalStart = null;
    let rentalEnd = null;

    if (hasStartDate && hasEndDate) {
      // MODIFIED BY: Thasindu
      // PURPOSE: Parse date-picker values consistently as UTC calendar-day boundaries.
      rentalStart = new Date(`${startDate}T00:00:00.000Z`);
      rentalEnd = new Date(`${endDate}T00:00:00.000Z`);

      if (
        Number.isNaN(rentalStart.getTime()) ||
        Number.isNaN(rentalEnd.getTime()) ||
        rentalStart > rentalEnd
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid rental date range",
        });
      }

      // MODIFIED BY: Thasindu
      // PURPOSE: Status exclusions are applied to every customer catalogue request,
      // not only requests that include rental dates.
    }

    if (additionalConditions.length > 0) {
      filter.$and = additionalConditions;
    }

    // ==========================================
    // SORTING
    // MODIFIED BY: Thasindu
    // ==========================================

    const sortOptions = {
      featured: { createdAt: -1 },
      price_asc: { rentalPricePerDay: 1 },
      price_desc: { rentalPricePerDay: -1 },
      name_asc: { name: 1 },
    };

    const selectedSort =
      sortOptions[sortBy] || sortOptions.featured;

    let equipment = await Equipment.find(filter)
      .populate("category", "name description status")
      .sort(selectedSort);

    // ==========================================
    // DATE-BASED AVAILABILITY FILTER
    // MODIFIED BY: Thasindu
    // PURPOSE: Exclude equipment with overlapping
    // pending, confirmed or active rentals.
    // ==========================================

    if (rentalStart && rentalEnd && equipment.length > 0) {
      const equipmentIds = equipment.map((item) => item._id);

      // MODIFIED BY: Thasindu
      // PURPOSE: Treat both selected calendar dates as occupied rental days.
      // This also supports one-day bookings where startDate and endDate are equal.
      // Any shared calendar day makes the requested periods overlap.
      const conflictingEquipmentIds = await Rental.distinct("equipment", {
        equipment: { $in: equipmentIds },
        status: { $in: ["PENDING", "CONFIRMED", "ACTIVE"] },
        startDate: { $lte: rentalEnd },
        endDate: { $gte: rentalStart },
      });

      const conflictingIds = new Set(
        conflictingEquipmentIds.map((id) => String(id))
      );

      equipment = equipment.filter(
        (item) => !conflictingIds.has(String(item._id))
      );
    }

    return res.status(200).json({
      success: true,
      count: equipment.length,
      data: {
        equipment,
      },
    });

  } catch (error) {
    next(error);
  }
};
// END GET ALL EQUIPMENT MODIFICATION BY THASINDU
//END OF SEARCH AND FILTER EQUIPMENTS
// ==========================================


// ==========================================
// GET ONE EQUIPMENT
// GET /api/equipment/:id
// ==========================================
const getEquipmentById = async (req, res, next) => {
  try {
    const equipment = await Equipment.findById(req.params.id)
      .populate("category", "name description status");

    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: "Equipment not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        equipment,
      },
    });
  } catch (error) {
    next(error);
  }
};


// ==========================================
// UPDATE EQUIPMENT
// PUT /api/equipment/:id
// ==========================================
const updateEquipment = async (req, res, next) => {
  try {
    const equipment = await Equipment.findById(req.params.id);

    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: "Equipment not found",
      });
    }

    const {
      name,
      category,
      brand,
      model,
      serialNumber,
      rentalPricePerDay,
      securityDeposit,
      status,
      description,
      imageUrl,
      images,
      // MODIFIED BY: Thasindu
      // PURPOSE: Read admin-edited promotion data.
      offer,
      
    } = req.body;


    console.log("BACKEND RECEIVED IMAGES:", images);
    console.log("BACKEND REQUEST BODY:", req.body);

    if (category !== undefined) {
      const categoryExists = await Category.findOne({
        _id: category,
        status: "ACTIVE",
      });

      if (!categoryExists) {
        return res.status(400).json({
          success: false,
          message: "Invalid or inactive equipment category",
        });
      }

      equipment.category = category;
    }

    if (name !== undefined) equipment.name = name;
    if (brand !== undefined) equipment.brand = brand;
    if (model !== undefined) equipment.model = model;
    if (serialNumber !== undefined) equipment.serialNumber = serialNumber;
    if (rentalPricePerDay !== undefined) {
      equipment.rentalPricePerDay = rentalPricePerDay;
    }
    if (securityDeposit !== undefined) {
      equipment.securityDeposit = securityDeposit;
    }
    if (status !== undefined) equipment.status = status;
    if (description !== undefined) equipment.description = description;
    if (imageUrl !== undefined) equipment.imageUrl = imageUrl;

    if (images !== undefined) {
    equipment.images = Array.isArray(images) ? images : [];
    }

    
    // ==========================================
    // MODIFICATION: Update Equipment Special Offer
    // MODIFIED BY: Thasindu
    // PURPOSE: Save or disable admin-configured
    // promotions without changing the base rental price.
    // ==========================================

    if (offer !== undefined) {
      if (
        !offer ||
        typeof offer !== "object" ||
        Array.isArray(offer)
      ) {
        return res.status(400).json({
          success: false,
          message: "Offer must be an object",
        });
      }

      equipment.offer = offer;
    }

    // END MODIFICATION: Update Equipment Special Offer by Thasindu



  console.log("IMAGES BEFORE SAVE:", equipment.images);

    await equipment.save();

    await equipment.populate("category", "name description status");

    return res.status(200).json({
      success: true,
      message: "Equipment updated successfully",
      data: {
        equipment,
      },
    });
  } catch (error) {
    next(error);
  }
};

const deleteEquipment = async (req, res, next) => {
  try {
    const equipment = await Equipment.findById(req.params.id);

    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: "Equipment not found",
      });
    }

    await equipment.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Equipment deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};


module.exports = {
  createEquipment,
  getAllEquipment,
  getEquipmentById,
  updateEquipment,
  deleteEquipment,
};