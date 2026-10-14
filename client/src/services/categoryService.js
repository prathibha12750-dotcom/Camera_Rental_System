
import api from "./api";

// ==========================================
// GET ALL CATEGORIES
// ==========================================
export const getAllCategories = async () => {
  const response = await api.get("/categories");
  return response.data;
};

// ==========================================
// CREATE CATEGORY - ADMIN
// ==========================================
export const createCategory = async (categoryData) => {
  const response = await api.post(
    "/categories",
    categoryData
  );

  return response.data;
};

// ==========================================
// UPDATE CATEGORY - ADMIN
// ==========================================
export const updateCategory = async (id, categoryData) => {
  const response = await api.put(
    `/categories/${id}`,
    categoryData
  );

  return response.data;
};

// ==========================================
// DELETE CATEGORY - ADMIN
// ==========================================
export const deleteCategory = async (id) => {
  const response = await api.delete(
    `/categories/${id}`
  );

  return response.data;
};
