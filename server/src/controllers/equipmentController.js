const Equipment = require("../models/Equipment");

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
    const {
      search,
      category,
      brand,
      condition,
      status,
    } = req.query;

    const filter = {};

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

    if (condition) {
      filter.condition = condition;
    }

    if (status) {
      filter.status = status;
    }

    const equipment = await Equipment.find(filter).sort({
      createdAt: -1,
    });

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
    const equipment = await Equipment.findById(req.params.id);

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
    const equipment = await Equipment.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: "Equipment not found",
      });
    }

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


// ==========================================
// DELETE EQUIPMENT
// DELETE /api/equipment/:id
// ==========================================
const deleteEquipment = async (req, res, next) => {
  try {
    const equipment = await Equipment.findByIdAndDelete(
      req.params.id
    );

    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: "Equipment not found",
      });
    }

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