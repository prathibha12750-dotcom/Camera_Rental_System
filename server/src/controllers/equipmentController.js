

const Equipment = require("../models/Equipment");

const Category = require("../models/Category");

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
      condition,
      status,
      description,
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

    const equipment = await Equipment.create({
      name,
      category,
      brand,
      model,
      serialNumber,
      rentalPricePerDay,
      securityDeposit,
      condition,
      status,
      description,
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

const getAllEquipment = async (req, res, next) => {
  try {
    const { search, category, brand, condition, status } = req.query;

    const filter = {};

    // Search by equipment name, brand, or model
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { brand: { $regex: search, $options: "i" } },
        { model: { $regex: search, $options: "i" } },
      ];
    }

    // Category is now a Category ObjectId
    if (category) {
      filter.category = category;
    }

    if (brand) {
      filter.brand = brand;
    }

    if (condition) {
      filter.condition = condition;
    }

    if (status) {
      filter.status = status;
    }

    const equipment = await Equipment.find(filter)
      .populate("category", "name description status")
      .sort({ createdAt: -1 });

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
      condition,
      status,
      description,
    } = req.body;

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
    if (condition !== undefined) equipment.condition = condition;
    if (status !== undefined) equipment.status = status;
    if (description !== undefined) equipment.description = description;

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