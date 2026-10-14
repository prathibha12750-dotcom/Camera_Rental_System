
import { useEffect, useState } from "react";
import {
  getAllCategories,
  createCategory,
  updateCategory,
} from "../../services/categoryService";

const emptyForm = {
  name: "",
  description: "",
  imageUrl: "",
  status: "ACTIVE",
};

const CategoryManagement = () => {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadCategories = async () => {
    try {
      setLoading(true);
      const result = await getAllCategories();
      setCategories(result?.data?.categories || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to load categories"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const resetForm = () => {
    setForm({ ...emptyForm });
    setEditingId(null);
    setError("");
  };

  const handleEdit = (category) => {
    setEditingId(category._id);
    setForm({
      name: category.name || "",
      description: category.description || "",
      imageUrl: category.imageUrl || "",
      status: category.status || "ACTIVE",
    });
    setError("");
    setSuccess("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) {
      setError("Category name is required.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const payload = {
        ...form,
        name: form.name.trim(),
        imageUrl: form.imageUrl.trim(),
      };

      if (editingId) {
        await updateCategory(editingId, payload);
      } else {
        await createCategory(payload);
      }

      setSuccess(
        editingId
          ? "Category updated successfully!"
          : "Category created successfully!"
      );

      resetForm();
      await loadCategories();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to save category"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-7xl">

        <p className="text-sm font-bold uppercase tracking-wider text-orange-600">
          Admin Panel
        </p>

        <h1 className="mt-2 text-3xl font-bold text-gray-950">
          Category Management
        </h1>

        <p className="mt-2 text-gray-500">
          Create and manage equipment categories and images.
        </p>

        {/* CATEGORY FORM */}
        <form
          onSubmit={handleSave}
          className="mt-8 rounded-2xl border bg-white p-6 shadow-sm"
        >
          <h2 className="mb-6 text-xl font-bold">
            {editingId ? "Edit Category" : "Add New Category"}
          </h2>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold">
                Category Name
              </label>
              <input
                required
                value={form.name}
                onChange={(e) =>
                  setForm({ ...form, name: e.target.value })
                }
                placeholder="e.g. Drones"
                className="w-full rounded-xl border px-4 py-3"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold">
                Status
              </label>
              <select
                value={form.status}
                onChange={(e) =>
                  setForm({ ...form, status: e.target.value })
                }
                className="w-full rounded-xl border px-4 py-3"
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-semibold">
                Description
              </label>
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm({
                    ...form,
                    description: e.target.value,
                  })
                }
                rows={3}
                placeholder="Describe this category..."
                className="w-full rounded-xl border px-4 py-3"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-semibold">
                Category Image URL
              </label>
              <input
                type="url"
                value={form.imageUrl}
                onChange={(e) =>
                  setForm({ ...form, imageUrl: e.target.value })
                }
                placeholder="https://example.com/category.jpg"
                className="w-full rounded-xl border px-4 py-3"
              />
            </div>
          </div>

          {/* IMAGE PREVIEW */}
          {form.imageUrl && (
            <div className="mt-5 max-w-md overflow-hidden rounded-xl border bg-gray-100">
              <img
                key={form.imageUrl}
                src={form.imageUrl}
                alt="Category preview"
                className="h-52 w-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            </div>
          )}

          {error && (
            <p className="mt-4 text-sm text-red-600">
              {error}
            </p>
          )}

          {success && (
            <p className="mt-4 text-sm text-green-600">
              {success}
            </p>
          )}

          <div className="mt-6 flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-orange-600 px-6 py-3 font-semibold text-white hover:bg-orange-700 disabled:opacity-50"
            >
              {saving
                ? "Saving..."
                : editingId
                  ? "Update Category"
                  : "Add Category"}
            </button>

            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-xl border px-6 py-3 font-semibold"
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        {/* CATEGORY LIST */}
        <h2 className="mb-5 mt-10 text-2xl font-bold">
          Existing Categories
        </h2>

        {loading ? (
          <p>Loading categories...</p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((item) => (
              <div
                key={item._id}
                className="overflow-hidden rounded-2xl border bg-white shadow-sm"
              >
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="h-44 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-44 items-center justify-center bg-gray-100 text-gray-400">
                    No Image
                  </div>
                )}

                <div className="p-5">
                  <h3 className="text-lg font-bold">
                    {item.name}
                  </h3>

                  <p className="mt-2 text-sm text-gray-500">
                    {item.description}
                  </p>

                  <p className="mt-3 text-xs font-bold text-orange-600">
                    {item.status}
                  </p>

                  <button
                    type="button"
                    onClick={() => handleEdit(item)}
                    className="mt-4 rounded-lg border border-orange-300 px-4 py-2 text-sm font-semibold text-orange-600 hover:bg-orange-50"
                  >
                    Edit Category
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
};

export default CategoryManagement;
