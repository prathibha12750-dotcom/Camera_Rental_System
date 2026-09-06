import { useEffect, useState } from "react";
import {
  getAllEquipment,
  createEquipment,
  updateEquipment,
  deleteEquipment,
} from "../../services/equipmentService";
import { getAllCategories } from "../../services/categoryService";

const EquipmentManagement = () => {
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showAddForm, setShowAddForm] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    category: "",
    brand: "",
    model: "",
    serialNumber: "",
    rentalPricePerDay: "",
    securityDeposit: "",
    condition: "GOOD",
    status: "AVAILABLE",
    description: "",
  });

  const [categories, setCategories] = useState([]);

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  const [editingId, setEditingId] = useState(null);

  const loadEquipment = async () => {
    try {
      setLoading(true);
      setError("");

      const result = await getAllEquipment();

      setEquipment(result?.data?.equipment || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to load equipment"
      );
    } finally {
      setLoading(false);
    }

    };

    const loadCategories = async () => {
        try {
            const result = await getAllCategories();

            console.log("CATEGORY RESULT:", result);

            setCategories(result?.data?.categories || []);
        } catch (err) {
            console.error("Failed to load categories", err);
        }
    };


    const handleCreateEquipment = async () => {
  try {
    setSaving(true);
    setFormError("");
    setFormSuccess("");

    if (
      !formData.name ||
      !formData.category ||
      !formData.brand ||
      !formData.model ||
      !formData.serialNumber ||
      !formData.rentalPricePerDay
    ) {
      setFormError("Please fill in all required fields.");
      return;
    }

    await createEquipment({
      ...formData,
      rentalPricePerDay: Number(formData.rentalPricePerDay),
      securityDeposit: Number(formData.securityDeposit || 0),
    });

    // Refresh equipment table
    await loadEquipment();

    // Clear form
    setFormData({
      name: "",
      category: "",
      brand: "",
      model: "",
      serialNumber: "",
      rentalPricePerDay: "",
      securityDeposit: "",
      condition: "GOOD",
      status: "AVAILABLE",
      description: "",
    });

    // Close form
    setShowAddForm(false);
    setEditingId(null);

    // Show success message
    setFormSuccess("Equipment added successfully.");

    // Remove success message after 3 seconds
    setTimeout(() => {
      setFormSuccess("");
    }, 3000);

  } catch (err) {
    setFormError(
      err.response?.data?.message ||
        "Failed to add equipment"
    );
  } finally {
    setSaving(false);
  }
};


const resetEquipmentForm = () => {
  setFormData({
    name: "",
    category: "",
    brand: "",
    model: "",
    serialNumber: "",
    rentalPricePerDay: "",
    securityDeposit: "",
    condition: "GOOD",
    status: "AVAILABLE",
    description: "",
  });

  setEditingId(null);
  setFormError("");
  setFormSuccess("");
};



    const handleEditClick = (item) => {
        setEditingId(item._id);

        setFormData({
            name: item.name || "",
            category: item.category?._id || "",
            brand: item.brand || "",
            model: item.model || "",
            serialNumber: item.serialNumber || "",
            rentalPricePerDay: item.rentalPricePerDay || "",
            securityDeposit: item.securityDeposit || "",
            condition: item.condition || "GOOD",
            status: item.status || "AVAILABLE",
            description: item.description || "",
        });

        setShowAddForm(true);
        setFormError("");
        setFormSuccess("");

        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };

  
    const handleUpdateEquipment = async () => {
  try {
    setSaving(true);
    setFormError("");
    setFormSuccess("");

    if (
      !formData.name ||
      !formData.category ||
      !formData.brand ||
      !formData.model ||
      !formData.serialNumber ||
      !formData.rentalPricePerDay
    ) {
      setFormError("Please fill in all required fields.");
      return;
    }

    await updateEquipment(editingId, {
      ...formData,
      rentalPricePerDay: Number(formData.rentalPricePerDay),
      securityDeposit: Number(formData.securityDeposit || 0),
    });

    // Refresh equipment table
    await loadEquipment();

    // Clear form
    setFormData({
      name: "",
      category: "",
      brand: "",
      model: "",
      serialNumber: "",
      rentalPricePerDay: "",
      securityDeposit: "",
      condition: "GOOD",
      status: "AVAILABLE",
      description: "",
    });

    // Exit edit mode and close form
    setEditingId(null);
    setShowAddForm(false);

    // Show success message
    setFormSuccess("Equipment updated successfully.");

    // Remove success message after 3 seconds
    setTimeout(() => {
      setFormSuccess("");
    }, 3000);

  } catch (err) {
    setFormError(
      err.response?.data?.message ||
        "Failed to update equipment"
    );
  } finally {
    setSaving(false);
  }
};


    const handleDeleteEquipment = async (item) => {
        const confirmed = window.confirm(
            `Are you sure you want to delete "${item.name}"?`
        );

        if (!confirmed) return;

        try {
            setError("");

            await deleteEquipment(item._id);

            await loadEquipment();
        } catch (err) {
            setError(
            err.response?.data?.message ||
                "Failed to delete equipment"
            );
        }
    };


  useEffect(() => {
    loadEquipment();
    loadCategories();
}, []);

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-orange-600">
              Admin
            </p>

            <h1 className="mt-2 text-3xl font-bold text-gray-950">
              Equipment Management
            </h1>

            <p className="mt-2 text-gray-600">
              Manage camera equipment and rental availability.
            </p>
          </div>

            <button
                type="button"
                onClick={() => {
                  resetEquipmentForm();
                  setShowAddForm(true);
                }}
                className="rounded-xl bg-orange-600 px-5 py-3 font-semibold text-white transition hover:bg-orange-700"
            >
            + Add Equipment
            </button>

        </div>


        {showAddForm && (
            <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-950">
                        {editingId ? "Edit Equipment" : "Add Equipment"}
                    </h2>

                    <button
                        type="button"
                        onClick={() => {
                          resetEquipmentForm();
                          setShowAddForm(false);
                        }}
                        className="text-sm font-semibold text-gray-500 hover:text-gray-900"
                    >
                        Close
                    </button>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                    <input
                        type="text"
                        placeholder="Equipment Name"
                        value={formData.name}
                        onChange={(e) =>
                            setFormData({
                                ...formData,
                                name: e.target.value,
                            })
                        }
                        className="rounded-xl border border-gray-300 px-4 py-3"
                    />

                            <select
                                value={formData.category}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        category: e.target.value,
                                    })
                                }
                                className="rounded-xl border border-gray-300 px-4 py-3"
                            >
                                    <option value="">Select Category</option>

                                    {categories.map((category) => (
                                    <option
                                        key={category._id}
                                        value={category._id}
                                    >
                                        {category.name}
                                    </option>
                                    ))}
                            </select>

                    <input
                        type="text"
                        placeholder="Brand"
                        value={formData.brand}
                        onChange={(e) =>
                            setFormData({
                                ...formData,
                                brand: e.target.value,
                            })
                        }
                        className="rounded-xl border border-gray-300 px-4 py-3"
                    />

                    <input
                        type="text"
                        placeholder="Model"
                        value={formData.model}
                        onChange={(e) =>
                            setFormData({
                                ...formData,
                                model: e.target.value,
                            })
                        }
                        className="rounded-xl border border-gray-300 px-4 py-3"
                    />

                    <input
                        type="text"
                        placeholder="Serial Number"
                        value={formData.serialNumber}
                        onChange={(e) =>
                            setFormData({
                                ...formData,
                                serialNumber: e.target.value,
                            })
                        }
                        className="rounded-xl border border-gray-300 px-4 py-3"
                    />

                    <input
                        type="number"
                        placeholder="Rental Price Per Day"
                        value={formData.rentalPricePerDay}
                        onChange={(e) =>
                            setFormData({
                            ...formData,
                            rentalPricePerDay: e.target.value,
                            })
                        }
                        className="rounded-xl border border-gray-300 px-4 py-3"
                    />

                    <input
                        type="number"
                        placeholder="Security Deposit"
                        value={formData.securityDeposit}
                        onChange={(e) =>
                            setFormData({
                                ...formData,
                                securityDeposit: e.target.value,
                            })
                        }
                        className="rounded-xl border border-gray-300 px-4 py-3"
                    />

                    <select
                        value={formData.condition}
                        onChange={(e) =>
                            setFormData({
                                ...formData,
                                condition: e.target.value,
                            })
                        }
                        className="rounded-xl border border-gray-300 px-4 py-3"
                    >
                            <option value="EXCELLENT">Excellent</option>
                            <option value="GOOD">Good</option>
                            <option value="FAIR">Fair</option>
                            <option value="DAMAGED">Damaged</option>
                    </select>

                    <select
                        value={formData.status}
                        onChange={(e) =>
                            setFormData({
                                ...formData,
                                status: e.target.value,
                            })
                        }
                        className="rounded-xl border border-gray-300 px-4 py-3"
                    >
                            <option value="AVAILABLE">Available</option>
                            <option value="RESERVED">Reserved</option>
                            <option value="RENTED">Rented</option>
                            <option value="MAINTENANCE">Maintenance</option>
                            <option value="DAMAGED">Damaged</option>
                    </select>

                    <textarea
                        placeholder="Description"
                        value={formData.description}
                        onChange={(e) =>
                        setFormData({
                            ...formData,
                            description: e.target.value,
                        })
                        }
                        className="min-h-28 rounded-xl border border-gray-300 px-4 py-3 md:col-span-2"
                    />
                </div>
                

                {formError && (
                    <div className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-700">
                        {formError}
                    </div>
                )}

                <button
                    type="button"
                    onClick={
                        editingId
                            ? handleUpdateEquipment
                            : handleCreateEquipment
                    }
                    disabled={saving}
                    className="mt-6 rounded-xl bg-orange-600 px-5 py-3 font-semibold text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                        {saving
                            ? "Saving..."
                            : editingId
                                ? "Update Equipment"
                                : "Save Equipment"}
                </button>


            </div>
        )}

        {formSuccess && (
          <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-4 font-medium text-green-700">
              ✓ {formSuccess}
          </div>
        )}


        {loading && (
          <p className="mt-8 text-gray-600">
            Loading equipment...
          </p>
        )}

        {error && (
          <div className="mt-8 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && equipment.length === 0 && (
          <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-8 text-center">
            <p className="text-gray-600">
              No equipment found.
            </p>
          </div>
        )}

        <div className="mt-8 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Equipment
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Category
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Condition
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Price / Day
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {equipment.map((item) => (
                  <tr key={item._id}>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-950">
                        {item.name}
                      </p>

                      <p className="text-sm text-gray-500">
                        {item.brand} {item.model}
                      </p>
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-700">
                      {item.category?.name || "—"}
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-700">
                      {item.condition}
                    </td>

                    <td className="px-6 py-4">
                      <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                        {item.status}
                      </span>
                    </td>

                    <td className="px-6 py-4 font-medium text-gray-900">
                      LKR {item.rentalPricePerDay?.toLocaleString()}
                    </td>

                    <td className="px-6 py-4">
                        <div className="flex gap-2">
                            <button
                            type="button"
                            onClick={() => handleEditClick(item)}
                            className="rounded-lg border border-orange-300 px-3 py-2 text-sm font-semibold text-orange-600 hover:bg-orange-50"
                            >
                            Edit
                            </button>

                            <button
                            type="button"
                            onClick={() => handleDeleteEquipment(item)}
                            className="rounded-lg border border-red-300 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                            >
                            Delete
                            </button>
                        </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
};

export default EquipmentManagement;