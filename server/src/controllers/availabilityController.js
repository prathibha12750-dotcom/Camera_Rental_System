const Photographer = require("../models/Photographer");
const Availability = require("../models/Availability");


// ==========================================
// HELPER — GET CURRENT PHOTOGRAPHER
// ==========================================

const findCurrentPhotographer = async (
  userId
) => {
  return Photographer.findOne({
    user: userId,
  });
};


// ==========================================
// HELPER — NORMALIZE DATE
// ==========================================

const normalizeDate = (dateValue) => {
  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  date.setUTCHours(0, 0, 0, 0);

  return date;
};


// ==========================================
// HELPER — HH:MM TO MINUTES
// ==========================================

const timeToMinutes = (time) => {
  const [hours, minutes] =
    time.split(":").map(Number);

  return hours * 60 + minutes;
};


// ==========================================
// HELPER — VALIDATE TIME FORMAT
// ==========================================

const isValidTime = (time) => {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(
    time
  );
};


// ==========================================
// HELPER — CHECK SLOT OVERLAP
// ==========================================

const hasOverlap = async ({
  photographerId,
  date,
  startTime,
  endTime,
  excludeId = null,
}) => {

  const query = {
    photographer: photographerId,
    date,
  };


  if (excludeId) {
    query._id = {
      $ne: excludeId,
    };
  }


  const existingSlots =
    await Availability.find(query);


  const newStart =
    timeToMinutes(startTime);

  const newEnd =
    timeToMinutes(endTime);


  return existingSlots.some((slot) => {

    const existingStart =
      timeToMinutes(slot.startTime);

    const existingEnd =
      timeToMinutes(slot.endTime);


    return (
      newStart < existingEnd &&
      newEnd > existingStart
    );
  });
};


// ==========================================
// GET MY AVAILABILITY
// GET /api/photographer/availability
// ==========================================

const getMyAvailability = async (
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


    const availability =
      await Availability.find({
        photographer:
          photographer._id,
      }).sort({
        date: 1,
        startTime: 1,
      });


    return res.status(200).json({
      success: true,

      data: {
        availability,
      },
    });

  } catch (error) {
    next(error);
  }
};


// ==========================================
// CREATE AVAILABILITY
// POST /api/photographer/availability
// ==========================================

const createAvailability = async (
  req,
  res,
  next
) => {
  try {

    const {
      date,
      startTime,
      endTime,
    } = req.body;


    // --------------------------------------
    // Required fields
    // --------------------------------------

    if (!date) {
      return res.status(400).json({
        success: false,
        message:
          "Availability date is required",
      });
    }


    if (!startTime) {
      return res.status(400).json({
        success: false,
        message:
          "Start time is required",
      });
    }


    if (!endTime) {
      return res.status(400).json({
        success: false,
        message:
          "End time is required",
      });
    }


    // --------------------------------------
    // Validate time formats
    // --------------------------------------

    if (!isValidTime(startTime)) {
      return res.status(400).json({
        success: false,
        message:
          "Start time must use HH:MM format",
      });
    }


    if (!isValidTime(endTime)) {
      return res.status(400).json({
        success: false,
        message:
          "End time must use HH:MM format",
      });
    }


    // --------------------------------------
    // Validate date
    // --------------------------------------

    const normalizedDate =
      normalizeDate(date);


    if (!normalizedDate) {
      return res.status(400).json({
        success: false,
        message:
          "Please provide a valid availability date",
      });
    }


    // --------------------------------------
    // Do not allow past dates
    // --------------------------------------

    const today = new Date();

    today.setUTCHours(
      0,
      0,
      0,
      0
    );


    if (normalizedDate < today) {
      return res.status(400).json({
        success: false,
        message:
          "Availability cannot be created for a past date",
      });
    }


    // --------------------------------------
    // End must be later than start
    // --------------------------------------

    const startMinutes =
      timeToMinutes(startTime);

    const endMinutes =
      timeToMinutes(endTime);


    if (endMinutes <= startMinutes) {
      return res.status(400).json({
        success: false,
        message:
          "End time must be later than start time",
      });
    }


    // --------------------------------------
    // Current Photographer
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
    // Check overlap
    // --------------------------------------

    const overlaps =
      await hasOverlap({
        photographerId:
          photographer._id,

        date:
          normalizedDate,

        startTime,
        endTime,
      });


    if (overlaps) {
      return res.status(409).json({
        success: false,
        message:
          "This availability period overlaps with an existing availability period",
      });
    }


    // --------------------------------------
    // Create
    // --------------------------------------

    const availability =
      await Availability.create({
        photographer:
          photographer._id,

        date:
          normalizedDate,

        startTime,
        endTime,
      });


    return res.status(201).json({
      success: true,

      message:
        "Availability added successfully",

      data: {
        availability,
      },
    });

  } catch (error) {
    next(error);
  }
};


// ==========================================
// UPDATE AVAILABILITY
// PUT /api/photographer/availability/:id
// ==========================================

const updateAvailability = async (
  req,
  res,
  next
) => {
  try {

    const {
      date,
      startTime,
      endTime,
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

    const availability =
      await Availability.findOne({
        _id:
          req.params.id,

        photographer:
          photographer._id,
      });


    if (!availability) {
      return res.status(404).json({
        success: false,
        message:
          "Availability record not found",
      });
    }


    // --------------------------------------
    // Determine new values
    // --------------------------------------

    let updatedDate =
      availability.date;

    let updatedStart =
      availability.startTime;

    let updatedEnd =
      availability.endTime;


    if (date !== undefined) {

      updatedDate =
        normalizeDate(date);


      if (!updatedDate) {
        return res.status(400).json({
          success: false,
          message:
            "Please provide a valid availability date",
        });
      }


      const today = new Date();

      today.setUTCHours(
        0,
        0,
        0,
        0
      );


      if (updatedDate < today) {
        return res.status(400).json({
          success: false,
          message:
            "Availability cannot be moved to a past date",
        });
      }
    }


    if (startTime !== undefined) {

      if (!isValidTime(startTime)) {
        return res.status(400).json({
          success: false,
          message:
            "Start time must use HH:MM format",
        });
      }

      updatedStart =
        startTime;
    }


    if (endTime !== undefined) {

      if (!isValidTime(endTime)) {
        return res.status(400).json({
          success: false,
          message:
            "End time must use HH:MM format",
        });
      }

      updatedEnd =
        endTime;
    }


    // --------------------------------------
    // Validate resulting period
    // --------------------------------------

    if (
      timeToMinutes(updatedEnd) <=
      timeToMinutes(updatedStart)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "End time must be later than start time",
      });
    }


    // --------------------------------------
    // Check overlap excluding current slot
    // --------------------------------------

    const overlaps =
      await hasOverlap({
        photographerId:
          photographer._id,

        date:
          updatedDate,

        startTime:
          updatedStart,

        endTime:
          updatedEnd,

        excludeId:
          availability._id,
      });


    if (overlaps) {
      return res.status(409).json({
        success: false,
        message:
          "This availability period overlaps with an existing availability period",
      });
    }


    // --------------------------------------
    // Save
    // --------------------------------------

    availability.date =
      updatedDate;

    availability.startTime =
      updatedStart;

    availability.endTime =
      updatedEnd;


    await availability.save();


    return res.status(200).json({
      success: true,

      message:
        "Availability updated successfully",

      data: {
        availability,
      },
    });

  } catch (error) {
    next(error);
  }
};


// ==========================================
// DELETE AVAILABILITY
// DELETE /api/photographer/availability/:id
// ==========================================

const deleteAvailability = async (
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


    const availability =
      await Availability.findOne({
        _id:
          req.params.id,

        photographer:
          photographer._id,
      });


    if (!availability) {
      return res.status(404).json({
        success: false,
        message:
          "Availability record not found",
      });
    }


    await availability.deleteOne();


    return res.status(200).json({
      success: true,
      message:
        "Availability deleted successfully",
    });

  } catch (error) {
    next(error);
  }
};


module.exports = {
  getMyAvailability,
  createAvailability,
  updateAvailability,
  deleteAvailability,
};