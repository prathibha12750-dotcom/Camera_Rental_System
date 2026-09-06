import { useEffect, useState } from "react";
import { getAllEquipment } from "../../services/equipmentService";
import { getAllCategories } from "../../services/categoryService";//connect category
import { useNavigate } from "react-router-dom";

const EquipmentBrowse = () => {
  const navigate = useNavigate();
  const [equipment, setEquipment] = useState([]);

  const [search, setSearch] = useState("");
  const [condition, setCondition] = useState("");
  const [status, setStatus] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadEquipment = async (filters = {}) => {
    try {
      setLoading(true);
      setError("");

      const result = await getAllEquipment(filters);

      setEquipment(result?.data?.equipment || []);
    } catch (err) {
      console.error("Equipment load error:", err);

      setError(
        err.response?.data?.message ||
          "Failed to load equipment"
      );
    } finally {
      setLoading(false);
    }
  };

  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState("");

  useEffect(() => {
  const loadInitialData = async () => {
    try {
      const categoryResult = await getAllCategories();

      setCategories(
        categoryResult?.data?.categories || []
      );

      await loadEquipment();
    } catch (err) {
      console.error("Initial data load error:", err);
    }
  };

  loadInitialData();
  }, []);

    

  const handleSearch = (e) => {
    e.preventDefault();

    const filters = {};

    if (search.trim()) {
      filters.search = search.trim();
    }

    if (category) {
        filters.category = category;
    }

    if (condition) {
      filters.condition = condition;
    }

    if (status) {
      filters.status = status;
    }

    loadEquipment(filters);
  };

  const handleClear = () => {
  setSearch("");
  setCategory("");
  setCondition("");
  setStatus("");

  loadEquipment();
  };

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-7xl">

        {/* Heading */}
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-orange-600">
            Equipment Rental
          </p>

          <h1 className="mt-2 text-3xl font-bold text-gray-950">
            Browse Equipment
          </h1>

          <p className="mt-2 text-gray-600">
            Find camera equipment available for your next project.
          </p>
        </div>

        {/* Search and Filters */}
        <form
          onSubmit={handleSearch}
          className="mt-8 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
        >
          <div className="grid gap-4 md:grid-cols-4">

            <input
              type="text"
              placeholder="Search name, brand or model..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-orange-500"
            />

            {/* Category dropdown */}
            <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-orange-500"
            >

                <option value="">All Categories</option>

                {categories.map((item) => (
                    <option key={item._id} value={item._id}>
                        {item.name}
                    </option>
                ))}
            </select>

            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              className="rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-orange-500"
            >
              <option value="">All Conditions</option>
              <option value="EXCELLENT">Excellent</option>
              <option value="GOOD">Good</option>
              <option value="FAIR">Fair</option>
              <option value="DAMAGED">Damaged</option>
            </select>

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-orange-500"
            >
              <option value="">All Statuses</option>
              <option value="AVAILABLE">Available</option>
              <option value="RESERVED">Reserved</option>
              <option value="RENTED">Rented</option>
              <option value="MAINTENANCE">Maintenance</option>
              <option value="DAMAGED">Damaged</option>
            </select>

            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 rounded-xl bg-orange-600 px-4 py-3 font-semibold text-white transition hover:bg-orange-700"
              >
                Search
              </button>

              <button
                type="button"
                onClick={handleClear}
                className="rounded-xl border border-gray-300 px-4 py-3 font-semibold text-gray-700 transition hover:bg-gray-100"
              >
                Clear
              </button>
            </div>

          </div>
        </form>

        {/* Results count */}
        {!loading && !error && (
          <p className="mt-6 text-sm text-gray-500">
            {equipment.length} equipment item
            {equipment.length !== 1 ? "s" : ""} found
          </p>
        )}

        {/* Loading */}
        {loading && (
          <p className="mt-8 text-gray-600">
            Loading equipment...
          </p>
        )}

        {/* Error */}
        {error && (
          <div className="mt-8 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {/* No Results */}
        {!loading && !error && equipment.length === 0 && (
          <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-8 text-center">
            <h2 className="font-semibold text-gray-950">
              No equipment found
            </h2>

            <p className="mt-2 text-sm text-gray-600">
              Try changing your search or filters.
            </p>
          </div>
        )}

        {/* Equipment Cards */}
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {equipment.map((item) => (
            <div
              key={item._id}
              className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-orange-600">
                    {item.category?.name || "Equipment"}
                  </p>

                  <h2 className="mt-2 text-xl font-semibold text-gray-950">
                    {item.name}
                  </h2>
                </div>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    item.status === "AVAILABLE"
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {item.status}
                </span>
              </div>

              <p className="mt-3 text-sm text-gray-600">
                {item.brand} {item.model}
              </p>

              <div className="mt-5 border-t border-gray-100 pt-4">
                <p className="text-sm text-gray-500">
                  Condition
                </p>

                <p className="font-medium text-gray-900">
                  {item.condition}
                </p>
              </div>

              <div className="mt-4">
                <p className="text-sm text-gray-500">
                  Rental price
                </p>

                <p className="text-xl font-bold text-gray-950">
                  LKR {item.rentalPricePerDay?.toLocaleString()}
                  <span className="text-sm font-normal text-gray-500">
                    {" "}
                    / day
                  </span>
                </p>
              </div>

              <button
                type="button"
                disabled={item.status !== "AVAILABLE"}
                onClick={() => navigate(`/customer/equipment/${item._id}`)}
                className={`mt-6 w-full rounded-xl px-4 py-3 font-semibold transition ${
                  item.status === "AVAILABLE"
                    ? "bg-orange-600 text-white hover:bg-orange-700"
                    : "cursor-not-allowed bg-gray-200 text-gray-500"
                }`}
              >
                {item.status === "AVAILABLE"
                  ? "View & Rent"
                  : "Currently Unavailable"}
              </button>
            </div>
          ))}
        </div>

      </div>
    </main>
  );
};

export default EquipmentBrowse;