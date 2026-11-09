const Photographer = require("../models/Photographer");
const Portfolio = require("../models/Portfolio");


// ==========================================
// HELPER — FIND CURRENT PHOTOGRAPHER
// ==========================================

const findCurrentPhotographer = async (
  userId
) => {
  return Photographer.findOne({
    user: userId,
  });
};


// ==========================================
// GET MY PORTFOLIO
// GET /api/photographer/portfolio
// ==========================================

const getMyPortfolio = async (
  req,
  res,
  next
) => {
  try {
    const photographer =
      await findCurrentPhotographer(
        req.user.userId
      );

    if (!photographer) {
      return res.status(404).json({
        success: false,
        message:
          "Photographer profile not found",
      });
    }


    const items = await Portfolio.find({
      photographer: photographer._id,
    }).sort({
      createdAt: -1,
    });


    return res.status(200).json({
      success: true,
      data: {
        items,
      },
    });

  } catch (error) {
    next(error);
  }
};


// ==========================================
// CREATE PORTFOLIO ITEM
// POST /api/photographer/portfolio
// ==========================================

const createPortfolioItem = async (
  req,
  res,
  next
) => {
  try {
    const {
      title,
      description,
      imageUrl,
    } = req.body;


    // --------------------------------------
    // Validation
    // --------------------------------------

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message:
          "Portfolio title is required",
      });
    }


    if (!imageUrl || !imageUrl.trim()) {
      return res.status(400).json({
        success: false,
        message:
          "Portfolio image URL is required",
      });
    }


    // --------------------------------------
    // Find current Photographer
    // --------------------------------------

    const photographer =
      await findCurrentPhotographer(
        req.user.userId
      );


    if (!photographer) {
      return res.status(404).json({
        success: false,
        message:
          "Photographer profile not found",
      });
    }


    // --------------------------------------
    // Create portfolio item
    // --------------------------------------

    const item = await Portfolio.create({
      photographer:
        photographer._id,

      title:
        title.trim(),

      description:
        description?.trim() || "",

      imageUrl:
        imageUrl.trim(),
    });


    return res.status(201).json({
      success: true,
      message:
        "Portfolio item added successfully",
      data: {
        item,
      },
    });

  } catch (error) {
    next(error);
  }
};


// ==========================================
// UPDATE PORTFOLIO ITEM
// PUT /api/photographer/portfolio/:id
// ==========================================

const updatePortfolioItem = async (
  req,
  res,
  next
) => {
  try {
    const {
      title,
      description,
      imageUrl,
    } = req.body;


    const photographer =
      await findCurrentPhotographer(
        req.user.userId
      );


    if (!photographer) {
      return res.status(404).json({
        success: false,
        message:
          "Photographer profile not found",
      });
    }


    // --------------------------------------
    // Ownership protection
    // --------------------------------------

    const item = await Portfolio.findOne({
      _id: req.params.id,
      photographer:
        photographer._id,
    });


    if (!item) {
      return res.status(404).json({
        success: false,
        message:
          "Portfolio item not found",
      });
    }


    // --------------------------------------
    // Update allowed fields only
    // --------------------------------------

    if (title !== undefined) {

      if (!title.trim()) {
        return res.status(400).json({
          success: false,
          message:
            "Portfolio title cannot be empty",
        });
      }

      item.title = title.trim();
    }


    if (description !== undefined) {
      item.description =
        description.trim();
    }


    if (imageUrl !== undefined) {

      if (!imageUrl.trim()) {
        return res.status(400).json({
          success: false,
          message:
            "Portfolio image URL cannot be empty",
        });
      }

      item.imageUrl =
        imageUrl.trim();
    }


    await item.save();


    return res.status(200).json({
      success: true,
      message:
        "Portfolio item updated successfully",
      data: {
        item,
      },
    });

  } catch (error) {
    next(error);
  }
};


// ==========================================
// DELETE PORTFOLIO ITEM
// DELETE /api/photographer/portfolio/:id
// ==========================================

const deletePortfolioItem = async (
  req,
  res,
  next
) => {
  try {
    const photographer =
      await findCurrentPhotographer(
        req.user.userId
      );


    if (!photographer) {
      return res.status(404).json({
        success: false,
        message:
          "Photographer profile not found",
      });
    }


    // --------------------------------------
    // Ownership protection
    // --------------------------------------

    const item = await Portfolio.findOne({
      _id: req.params.id,
      photographer:
        photographer._id,
    });


    if (!item) {
      return res.status(404).json({
        success: false,
        message:
          "Portfolio item not found",
      });
    }


    await item.deleteOne();


    return res.status(200).json({
      success: true,
      message:
        "Portfolio item deleted successfully",
    });

  } catch (error) {
    next(error);
  }
};


module.exports = {
  getMyPortfolio,
  createPortfolioItem,
  updatePortfolioItem,
  deletePortfolioItem,
};