
import { useEffect, useState } from "react";


import {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../../services/categoryService";


const emptyForm = {
  name: "",
  description: "",
  status: "ACTIVE",
};

const CategoryManagement = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState(emptyForm);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ========================================
  // LOAD CATEGORIES
  // ========================================

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError("");

      const result = await getAllCategories();

      setCategories(result?.data?.categories || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Failed to load categories."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  // ========================================
  // FORM HANDLING
  // ========================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddClick = () => {
    setEditingId(null);
    setFormData({ ...emptyForm });
    setError("");
    setSuccess("");
    setShowForm(true);
  };

  const handleEditClick = (category) => {
    setEditingId(category._id);

    setFormData({
      name: category.name || "",
      description: category.description || "",
      status: category.status || "ACTIVE",
    });

    setError("");
    setSuccess("");
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ ...emptyForm });
    setError("");
  };

  // ========================================
  // CREATE / UPDATE CATEGORY
  // ========================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    const name = formData.name.trim();
    const description = formData.description.trim();

    if (name.length < 2 || name.length > 100) {
      setError("Category name must be 2–100 characters.");
      return;
    }

    if (description.length > 500) {
      setError("Description cannot exceed 500 characters.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const payload = {
        name,
        description,
        status: formData.status,
      };

      if (editingId) {
        await updateCategory(editingId, payload);
        setSuccess("Category updated successfully.");
      } else {
        await createCategory(payload);
        setSuccess("Category created successfully.");
      }

      setShowForm(false);
      setEditingId(null);
      setFormData({ ...emptyForm });

      await loadCategories();
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Failed to save category."
      );
    } finally {
      setSaving(false);
    }
  };

  
// ========================================
// DELETE CATEGORY
// ========================================

const handleDelete = async (category) => {
  const confirmed = window.confirm(
    `Are you sure you want to delete "${category.name}"?\n\n` +
    "This action cannot be undone."
  );

  if (!confirmed) {
    return;
  }

  try {
    setDeletingId(category._id);
    setError("");
    setSuccess("");

    await deleteCategory(category._id);

    setSuccess("Category deleted successfully.");

    await loadCategories();
  } catch (err) {
    setError(
      err.response?.data?.message ||
      "Failed to delete category."
    );
  } finally {
    setDeletingId(null);
  }
};


  // ========================================
  // PAGE
  // ========================================

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Category Management
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage equipment categories used in the system.
          </p>
        </div>

        <button
          type="button"
          onClick={handleAddClick}
          className="rounded-lg bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-700"
        >
          + Add Category
        </button>
      </div>

      {/* MESSAGES */}
      {success && (
        <div className="rounded-lg bg-green-50 p-4 text-sm text-green-700">
          {success}
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ADD / EDIT FORM */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
        >
          <h2 className="mb-5 text-lg font-semibold text-gray-900">
            {editingId ? "Edit Category" : "Add Category"}
          </h2>

          <div className="grid gap-5 md:grid-cols-2">

            <div>
              <label
                htmlFor="categoryName"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Category Name *
              </label>

              <input
                id="categoryName"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                minLength={2}
                maxLength={100}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm"
                placeholder="e.g. DSLR Cameras"
              />
            </div>

            <div>
              <label
                htmlFor="categoryStatus"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Status
              </label>

              <select
                id="categoryStatus"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm"
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label
                htmlFor="categoryDescription"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Description
              </label>

              <textarea
                id="categoryDescription"
                name="description"
                value={formData.description}
                onChange={handleChange}
                maxLength={500}
                rows={3}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm"
                placeholder="Enter category description..."
              />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-50"
            >
              {saving
                ? "Saving..."
                : editingId
                ? "Update Category"
                : "Create Category"}
            </button>

            <button
              type="button"
              onClick={handleCancel}
              disabled={saving}
              className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* CATEGORY TABLE */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">

        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="font-semibold text-gray-900">
            Equipment Categories ({categories.length})
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">

            <thead className="bg-gray-50">
              <tr>
                {["Name", "Description", "Status", "Action"].map(
                  (heading) => (
                    <th
                      key={heading}
                      className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500"
                    >
                      {heading}
                    </th>
                  )
                )}
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-8 text-center text-sm text-gray-500"
                  >
                    Loading categories...
                  </td>
                </tr>
              ) : categories.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-8 text-center text-sm text-gray-500"
                  >
                    No categories found.
                  </td>
                </tr>
              ) : (
                categories.map((category) => (
                  <tr key={category._id}>

                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {category.name}
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-600">
                      {category.description || "-"}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={
                          category.status === "ACTIVE"
                            ? "rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700"
                            : "rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600"
                        }
                      >
                        {category.status}
                      </span>
                    </td>


                    <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                        <button
                        type="button"
                        onClick={() => handleEditClick(category)}
                        disabled={deletingId !== null}
                        className="text-sm font-semibold text-orange-600 hover:text-orange-700 disabled:opacity-50"
                        >
                        Edit
                        </button>

                        <button
                        type="button"
                        onClick={() => handleDelete(category)}
                        disabled={deletingId !== null}
                        className="text-sm font-semibold text-red-600 hover:text-red-700 disabled:opacity-50"
                        >
                        {deletingId === category._id
                            ? "Deleting..."
                            : "Delete"}
                        </button>
                    </div>
                    </td>


                  </tr>
                ))
              )}
            </tbody>

          </table>
        </div>
      </div>

    </div>
  );
};

export default CategoryManagement;
