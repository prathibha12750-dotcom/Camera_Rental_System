import { useEffect, useState, useRef } from "react";
import { getAllEquipment } from "../../services/equipmentService";
import { getAllCategories } from "../../services/categoryService";//connect category
// MODIFIED by Thasindu: Read category selection from homepage URL
import { useNavigate, useSearchParams } from "react-router-dom";

const EquipmentBrowse = () => {
  const navigate = useNavigate();

  // ==========================================
  // MODIFICATION: Read Homepage Category
  // MODIFIED BY: Thasindu
  // PURPOSE: Identify the selected category
  // from the URL query parameters.
  // ==========================================

  const [searchParams] = useSearchParams();
  const initialCategory = searchParams.get("category") || "";

  // END MODIFICATION: Read Homepage Category by Thasindu

  const equipmentSectionRef = useRef(null);

  
  const categorySliderRef = useRef(null);

  const scrollCategories = (direction) => {
    categorySliderRef.current?.scrollBy({
      left: direction * 300,
      behavior: "smooth",
    });
  };

  



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
  // MODIFIED by Thasindu: Initialize selected category from URL
  const [category, setCategory] = useState(initialCategory);


  
  const groupedEquipment = categories
    .map((cat) => ({
      ...cat,
      items: equipment.filter(
        (item) => item.category?._id === cat._id
      ),
    }))
    .filter((cat) => cat.items.length > 0);

  const uncategorizedEquipment = equipment.filter(
    (item) =>
      !categories.some(
        (cat) => cat._id === item.category?._id
      )
  );



  
useEffect(() => {
  // Load equipment independently
  // MODIFIED by Thasindu: Apply homepage category filter on initial load
  loadEquipment(initialCategory ? { category: initialCategory } : {});

  // Load categories separately
  const loadCategories = async () => {
    try {
      const categoryResult = await getAllCategories();

      setCategories(
        categoryResult?.data?.categories || []
      );
    } catch (err) {
      console.error("Category load error:", err);
      setCategories([]);
    }
  };

  loadCategories();
}, []);


    

  const applyFilters = (overrides = {}) => {
  const filters = {};

  const currentSearch =
    overrides.search !== undefined ? overrides.search : search;

  const currentCategory =
    overrides.category !== undefined ? overrides.category : category;

  const currentCondition =
    overrides.condition !== undefined ? overrides.condition : condition;

  const currentStatus =
    overrides.status !== undefined ? overrides.status : status;

  if (currentSearch.trim()) {
    filters.search = currentSearch.trim();
  }

  if (currentCategory) {
    filters.category = currentCategory;
  }

  if (currentCondition) {
    filters.condition = currentCondition;
  }

  if (currentStatus) {
    filters.status = currentStatus;
  }

  loadEquipment(filters);
};


  const handleSearch = (e) => {
  e.preventDefault();
  applyFilters();
};



  
const handleCategorySelect = (categoryId) => {
  // Update selected category
  setCategory(categoryId);

  // Filter equipment
  applyFilters({ category: categoryId });

  // Smoothly scroll to equipment list
  setTimeout(() => {
    equipmentSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, 150);
};




  const handleClear = () => {
    setSearch("");
    setCondition("");
    setStatus("");

    applyFilters({
      search: "",
      condition: "",
      status: "",
    });
  };


const getStatusClass = (itemStatus) => {
  switch (itemStatus) {
    case "AVAILABLE":
      return "bg-green-50 text-green-700 ring-green-600/20";
    case "RESERVED":
      return "bg-yellow-50 text-yellow-700 ring-yellow-600/20";
    case "RENTED":
      return "bg-blue-50 text-blue-700 ring-blue-600/20";
    case "MAINTENANCE":
      return "bg-orange-50 text-orange-700 ring-orange-600/20";
    case "DAMAGED":
      return "bg-red-50 text-red-700 ring-red-600/20";
    default:
      return "bg-gray-50 text-gray-700 ring-gray-600/20";
  }
};




            
const renderEquipmentCard = (item) => (
  <article
    key={item._id}
    className="group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
  >
    {/* Equipment Image */}
    <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
      {item.imageUrl ? (
        <img
          src={item.imageUrl}
          alt={item.name}
          className="h-full w-full object-cover"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      ) : (
        <div className="flex h-full items-center justify-center">
          <div className="text-center">
            <div className="text-5xl text-gray-300">◇</div>
            <p className="mt-2 text-xs font-medium text-gray-400">
              Equipment Image
            </p>
          </div>
        </div>
      )}
    </div>

    {/* Product Information */}
    <div className="p-5">
      <p className="text-xs font-bold uppercase tracking-wider text-orange-600">
        {item.category?.name || "Equipment"}
      </p>

      <h2 className="mt-2 text-lg font-bold text-gray-950 transition group-hover:text-orange-600">
        {item.name}
      </h2>

      <p className="mt-1 text-sm text-gray-500">
        {[item.brand, item.model].filter(Boolean).join(" ")}
      </p>

      <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
        <div>
          <p className="text-xs text-gray-500">Rental price</p>
          <p className="mt-1 text-xl font-bold text-gray-950">
            LKR {item.rentalPricePerDay?.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500">per day</p>
        </div>

        <div className="text-right">
          <p className="text-xs text-gray-500">Condition</p>
          <p className="mt-1 text-sm font-semibold text-gray-900">
            {item.condition}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => navigate(`/customer/equipment/${item._id}`)}
        className="mt-5 w-full rounded-xl border border-gray-950 px-4 py-3 text-sm font-semibold text-gray-950 transition hover:bg-gray-950 hover:text-white"
      >
        {item.status === "AVAILABLE"
          ? "View & Rent"
          : "View Details"}
      </button>
    </div>
  </article>
);




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



       
        
{/* DYNAMIC IMAGE CATEGORY GALLERY */}
<div className="mt-8">

  {/* Heading */}
  <div className="mb-5">
    <h2 className="text-2xl font-bold text-gray-950">
      Explore Categories
    </h2>
    <p className="mt-1 text-sm text-gray-500">
      Select a category to explore our equipment.
    </p>
  </div>

  {/* Carousel Wrapper */}
  <div className="relative">

    {/* LEFT ARROW */}
    <button
      type="button"
      onClick={() => scrollCategories(-1)}
      aria-label="Scroll categories left"
      className="absolute -left-3 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white text-2xl shadow-lg hover:bg-orange-600 hover:text-white"
    >
      ‹
    </button>

    {/* HORIZONTAL SLIDER */}
    
    <div
      ref={categorySliderRef}
      className="flex flex-nowrap gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >


      {/* ALL EQUIPMENT CARD */}
      <button
        type="button"
        onClick={() => handleCategorySelect("")}
        aria-pressed={category === ""}
        className={`

group relative h-64 w-[calc((100%_-_1rem)/2)] shrink-0 snap-start sm:w-[calc((100%_-_2rem)/3)] lg:w-[calc((100%_-_5rem)/6)]
 overflow-hidden rounded-2xl border-2 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
          category === ""
            ? "border-orange-500 ring-2 ring-orange-200"
            : "border-transparent"
        }`}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-950" />

        <div className="absolute inset-0 flex items-center justify-center text-6xl text-white/20">
          ◈
        </div>

        <div className="absolute bottom-0 left-0 p-5">
          <h3 className="text-xl font-bold text-white">
            All Equipment
          </h3>
          <p className="mt-1 text-sm text-gray-300">
            Browse entire collection
          </p>
        </div>
      </button>

      {/* CATEGORY CARDS FROM DATABASE */}
      {categories
        .filter((item) => item.status === "ACTIVE")
        .map((item) => (
          <button
            key={item._id}
            type="button"
            onClick={() => handleCategorySelect(item._id)}
            aria-pressed={category === item._id}
            className={`

group relative h-64 w-[calc((100%_-_1rem)/2)] shrink-0 snap-start sm:w-[calc((100%_-_2rem)/3)] lg:w-[calc((100%_-_5rem)/6)]
 overflow-hidden rounded-2xl border-2 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
              category === item._id
                ? "border-orange-500 ring-2 ring-orange-200"
                : "border-transparent"
            }`}
          >

            {/* IMAGE FALLBACK BACKGROUND */}
            <div className="absolute inset-0 bg-gradient-to-br from-gray-700 to-gray-950" />

            {/* CATEGORY IMAGE */}
            {item.imageUrl && (
              <img
                src={item.imageUrl}
                alt=""
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            )}

            {/* DARK GRADIENT */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

            {/* CATEGORY DETAILS */}
            <div className="absolute bottom-0 left-0 p-5">
              <h3 className="text-xl font-bold text-white">
                {item.name}
              </h3>

              <p className="mt-1 text-sm text-gray-200">
                Explore collection
              </p>
            </div>

            {/* SELECTED BADGE */}
            {category === item._id && (
              <span className="absolute right-3 top-3 rounded-full bg-orange-500 px-3 py-1 text-xs font-bold text-white">
                ✓ Selected
              </span>
            )}

          </button>
        ))}

    </div> {/* END HORIZONTAL SLIDER */}

    {/* RIGHT ARROW */}
    <button
      type="button"
      onClick={() => scrollCategories(1)}
      aria-label="Scroll categories right"
      className="absolute -right-3 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white text-2xl shadow-lg hover:bg-orange-600 hover:text-white"
    >
      ›
    </button>

  </div> {/* END CAROUSEL WRAPPER */}

</div> {/* END CATEGORY GALLERY */}



        



        {/* Catalogue */}
          
          <div
            ref={equipmentSectionRef}
            className="mt-8 scroll-mt-24 lg:grid lg:grid-cols-[240px_1fr] lg:gap-8"
          >


            {/* Left Filter Panel */}
            <aside className="mb-6 lg:mb-0">
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm lg:sticky lg:top-24">

                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-gray-950">
                    Filters
                  </h2>

                  <button
                    type="button"
                    onClick={handleClear}
                    className="text-sm font-semibold text-orange-600 hover:text-orange-700"
                  >
                    Clear
                  </button>
                </div>

                {/* Condition */}
                <div className="mt-6 border-t border-gray-100 pt-5">
                  <p className="text-sm font-bold uppercase tracking-wide text-gray-900">
                    Condition
                  </p>

                  <div className="mt-3 space-y-2">
                    {["EXCELLENT", "GOOD", "FAIR", "DAMAGED"].map((value) => (
                      <label
                        key={value}
                        className="flex cursor-pointer items-center gap-3 text-sm text-gray-700"
                      >
                        <input
                          type="radio"
                          name="condition"
                          value={value}
                          checked={condition === value}
                          onChange={(e) => {
                            const value = e.target.value;
                            setCondition(value);
                            applyFilters({ condition: value });
                          }}
                          className="h-4 w-4 accent-orange-600"
                        />

                        <span className="capitalize">
                          {value.toLowerCase()}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Availability */}
                <div className="mt-6 border-t border-gray-100 pt-5">
                  <p className="text-sm font-bold uppercase tracking-wide text-gray-900">
                    Availability
                  </p>

                  <div className="mt-3 space-y-2">
                    {[
                      "AVAILABLE",
                      "RESERVED",
                      "RENTED",
                      "MAINTENANCE",
                    ].map((value) => (
                      <label
                        key={value}
                        className="flex cursor-pointer items-center gap-3 text-sm text-gray-700"
                      >
                        <input
                          type="radio"
                          name="status"
                          value={value}
                          checked={status === value}
                          onChange={(e) => {
                            const value = e.target.value;
                            setStatus(value);
                            applyFilters({ status: value });
                          }}
                          className="h-4 w-4 accent-orange-600"
                        />

                        <span className="capitalize">
                          {value.toLowerCase()}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

            

              </div>
            </aside>

            {/* Right Catalogue */}
            <section>

              {/* Results Header */}
              <div className="mb-5 flex flex-wrap items-center justify-between gap-4">

                <div>
                  {!loading && !error && (
                    <p className="text-sm text-gray-500">
                      Showing{" "}
                      <span className="font-semibold text-gray-900">
                        {equipment.length}
                      </span>{" "}
                      equipment item{equipment.length !== 1 ? "s" : ""}
                    </p>
                  )}
                </div>

                <select className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-700 outline-none focus:border-orange-500">
                  <option>Sort by: Featured</option>
                  <option>Price: Low to High</option>
                  <option>Price: High to Low</option>
                  <option>Name: A-Z</option>
                </select>

              </div>

              {/* Loading */}
              {loading && (
                <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center">
                  <p className="text-gray-500">
                    Loading equipment...
                  </p>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
                  {error}
                </div>
              )}

              {/* Empty State */}
              {!loading && !error && equipment.length === 0 && (
                <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center">
                  <h2 className="text-lg font-bold text-gray-950">
                    No equipment found
                  </h2>

                  <p className="mt-2 text-sm text-gray-500">
                    Try changing your search or filters.
                  </p>

                  <button
                    type="button"
                    onClick={handleClear}
                    className="mt-5 rounded-xl bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-700"
                  >
                    Clear Filters
                  </button>
                </div>
              )}

              
                {/* Product Grid */}
                {!loading && !error && equipment.length > 0 && (
                  <>
                    {category === "" ? (
                      /* ALL EQUIPMENT: GROUPED BY CATEGORY */
                      <div className="space-y-12">

                        {categories.map((cat) => {
                          const categoryItems = equipment.filter(
                            (item) =>
                              String(item.category?._id || item.category) ===
                              String(cat._id)
                          );

                          if (categoryItems.length === 0) return null;

                          return (
                            <section key={cat._id} className="space-y-5">

                              {/* Category Heading */}
                              <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                                <div>
                                  <h2 className="text-2xl font-bold text-gray-950">
                                    {cat.name}
                                  </h2>

                                  <p className="mt-1 text-sm text-gray-500">
                                    {categoryItems.length} equipment item
                                    {categoryItems.length !== 1 ? "s" : ""}
                                  </p>
                                </div>
                              </div>

                              {/* Category Equipment Grid */}
                              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                                {categoryItems.map(renderEquipmentCard)}
                              </div>

                            </section>
                          );
                        })}

                        {/* Equipment without a matching category */}
                        {(() => {
                          const otherItems = equipment.filter(
                            (item) =>
                              !categories.some(
                                (cat) =>
                                  String(cat._id) ===
                                  String(item.category?._id || item.category)
                              )
                          );

                          if (otherItems.length === 0) return null;

                          return (
                            <section className="space-y-5">
                              <h2 className="border-b border-gray-200 pb-3 text-2xl font-bold text-gray-950">
                                Other Equipment
                              </h2>

                              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                                {otherItems.map(renderEquipmentCard)}
                              </div>
                            </section>
                          );
                        })()}

                      </div>
                    ) : (
                      /* SELECTED CATEGORY: NORMAL EQUIPMENT GRID */
                      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                        {equipment.map(renderEquipmentCard)}
                      </div>
                    )}
                  </>
                )}


            </section>
          </div>

      </div>
    </main>
  );
};

export default EquipmentBrowse;