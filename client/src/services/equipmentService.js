import api from "./api";

// Get all equipment
export const getAllEquipment = async (params = {}) => {
  const response = await api.get("/equipment", {
    params,
  });

  return response.data;
};

// Get one equipment item
export const getEquipmentById = async (id) => {
  const response = await api.get(`/equipment/${id}`);

  return response.data;
};

// Create equipment - STAFF_ADMIN
export const createEquipment = async (equipmentData) => {
  const response = await api.post(
    "/equipment",
    equipmentData
  );

  return response.data;
};

// Update equipment - STAFF_ADMIN
export const updateEquipment = async (
  id,
  equipmentData
) => {
  const response = await api.put(
    `/equipment/${id}`,
    equipmentData
  );

  return response.data;
};

// Delete equipment - STAFF_ADMIN
export const deleteEquipment = async (id) => {
  const response = await api.delete(`/equipment/${id}`);

  return response.data;
};