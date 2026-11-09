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
export const updateCategory = async (categoryId, categoryData) => {
  const response = await api.put(
    `/categories/${categoryId}`,
    categoryData
  );

  return response.data;
};

// ==========================================
// DELETE CATEGORY - ADMIN
// ==========================================
export const deleteCategory = async (categoryId) => {
  const response = await api.delete(
    `/categories/${categoryId}`
  );

  return response.data;
};
