
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { getAllEquipment } from "../../services/equipmentService";
import { getAllCategories } from "../../services/categoryService";

// ==========================================
// HELPERS
// ==========================================

const getToday = () => {
  const now = new Date();
  const local = new Date(
    now.getTime() - now.getTimezoneOffset() * 60000
  );
  return local.toISOString().split("T")[0];
};

const formatPrice = (amount) => {
  const value = Number(amount);

  if (!Number.isFinite(value)) return "LKR —";

  return `LKR ${value.toLocaleString("en-LK", {
    maximumFractionDigits: 2,
  })}`;
};

const isOfferActive = (offer) => {
  if (
    !offer?.enabled ||
    !["DISCOUNT", "BONUS"].includes(offer.type)
  ) {
    return false;
  }

  const now = new Date();

  return (
    (!offer.startAt || new Date(offer.startAt) <= now) &&
    (!offer.endAt || new Date(offer.endAt) >= now)
  );
};

// ==========================================
// EQUIPMENT CARD
// ==========================================

const EquipmentCard = ({
  item,
  startDate,
  endDate,
  onView,
}) => {
  const [imageFailed, setImageFailed] = useState(false);

  const isRestricted = ["DAMAGED", "MAINTENANCE"].includes(
    item.status
  );

  const brandModel = [item.brand, item.model]
    .filter(Boolean)
    .join(" ");

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-orange-200 hover:shadow-lg">
      {/* IMAGE */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        {item.imageUrl && !imageFailed ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            loading="lazy"
            onError={() => setImageFailed(true)}
            className="h-full w-full object-contain p-3 transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center text-gray-400">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="h-12 w-12"
              aria-hidden="true"
            >
              <path d="M4 7h4l2-2h4l2 2h4v12H4V7Z" />
              <circle cx="12" cy="13" r="3" />
            </svg>

            <span className="mt-2 text-xs">
              Image unavailable
            </span>
          </div>
        )}

        {isOfferActive(item.offer) && (
          <span className="absolute left-3 top-3 max-w-[85%] truncate rounded-full bg-orange-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm">
            {item.offer.title || "Special Offer"}
          </span>
        )}

        {isRestricted && (
          <span className="absolute bottom-3 left-3 rounded-full bg-gray-900 px-3 py-1 text-xs font-medium text-white">
            Currently unavailable
          </span>
        )}
      </div>

      {/* INFORMATION */}
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <p className="text-xs font-bold uppercase tracking-wide text-orange-600">
          {item.category?.name || "Equipment"}
        </p>

        <h3 className="mt-2 line-clamp-2 text-base font-bold leading-snug text-gray-950 transition-colors group-hover:text-orange-600 sm:text-lg">
          {item.name}
        </h3>

        <p className="mt-1 min-h-5 text-sm text-gray-500">
          {brandModel || "Professional rental equipment"}
        </p>

        <div className="mt-auto pt-4">
          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs font-medium text-gray-500">
              Daily rental rate
            </p>

            <div className="mt-1 flex flex-wrap items-baseline gap-1">
              <span className="text-xl font-bold tracking-tight text-gray-950">
                {formatPrice(item.rentalPricePerDay)}
              </span>

              <span className="text-xs text-gray-500">
                / day
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              onView(item._id, startDate, endDate)
            }
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gray-950 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-orange-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
          >
            {isRestricted ? "View Details" : "View & Rent"}
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>
    </article>
  );
};

// ==========================================
// CATEGORY CARD
// ==========================================

const CategoryCard = ({
  name,
  imageUrl,
  selected,
  onClick,
  allEquipment = false,
}) => {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`group relative h-40 w-[calc((100%_-_0.75rem)/2)] shrink-0 snap-start overflow-hidden rounded-2xl border-2 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-lg sm:h-44 sm:w-[calc((100%_-_1.5rem)/3)] lg:h-48 lg:w-[calc((100%_-_3.75rem)/6)] ${
        selected
          ? "border-orange-500 ring-2 ring-orange-200"
          : "border-transparent"
      }`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-gray-700 to-gray-950" />

      {!allEquipment && imageUrl && !imageFailed ? (
        <img
          src={imageUrl}
          alt=""
          loading="lazy"
          onError={() => setImageFailed(true)}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-6xl text-white/20">
          ◈
        </div>
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

      {selected && (
        <span className="absolute right-2 top-2 rounded-full bg-orange-600 px-2.5 py-1 text-[10px] font-semibold text-white">
          ✓ Selected
        </span>
      )}

      <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
        <h3 className="text-base font-bold leading-tight text-white sm:text-lg">
          {name}
        </h3>

        <p className="mt-1 text-xs text-gray-200">
          {allEquipment
            ? "Browse all equipment"
            : "Explore collection"}
        </p>
      </div>
    </button>
  );
};

// ==========================================
// MAIN PAGE
// ==========================================

const EquipmentBrowse = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const initialCategory = searchParams.get("category") || "";

  const equipmentSectionRef = useRef(null);
  const categorySliderRef = useRef(null);
  const requestIdRef = useRef(0);

  const [equipment, setEquipment] = useState([]);
  const [categories, setCategories] = useState([]);

  const [category, setCategory] = useState(initialCategory);
  const [search, setSearch] = useState("");

  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const [specialOffersOnly, setSpecialOffersOnly] =
    useState(false);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [sortBy, setSortBy] = useState("featured");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [mobileFiltersOpen, setMobileFiltersOpen] =
    useState(false);

  // ==========================================
  // LOAD EQUIPMENT
  // ==========================================

  const loadEquipment = useCallback(async (filters = {}) => {
    const requestId = ++requestIdRef.current;

    try {
      const response = await getAllEquipment({
        ...filters,
        customerView: "true",
      });

      if (requestId !== requestIdRef.current) return;

      setEquipment(response?.data?.equipment || []);
    } catch (err) {
      if (requestId !== requestIdRef.current) return;

      console.error("Equipment load error:", err);

      setError(
        err.response?.data?.message ||
          "Failed to load equipment. Please try again."
      );
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, []);

  // ==========================================
  // INITIAL DATA
  // ==========================================

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await getAllCategories();

        setCategories(
          response?.data?.categories || []
        );
      } catch (err) {
        console.error("Category load error:", err);
        setCategories([]);
      }
    };

    loadCategories();
  }, []);

useEffect(() => {
  let cancelled = false;

  const requestId = ++requestIdRef.current;

  const fetchInitialEquipment = async () => {
    try {
      const response = await getAllEquipment({
        customerView: "true",
        ...(initialCategory
          ? { category: initialCategory }
          : {}),
      });

      if (
        cancelled ||
        requestId !== requestIdRef.current
      ) {
        return;
      }

      setEquipment(response?.data?.equipment || []);
      setError("");
    } catch (err) {
      if (
        cancelled ||
        requestId !== requestIdRef.current
      ) {
        return;
      }

      console.error("Equipment load error:", err);

      setError(
        err.response?.data?.message ||
          "Failed to load equipment. Please try again."
      );
    } finally {
      if (
        !cancelled &&
        requestId === requestIdRef.current
      ) {
        setLoading(false);
      }
    }
  };

  fetchInitialEquipment();

  return () => {
    cancelled = true;
  };
}, [initialCategory]);

  // ==========================================
  // FILTER EQUIPMENT
  // ==========================================

  const applyFilters = (overrides = {}) => {
    const values = {
      search:
        overrides.search !== undefined
          ? overrides.search
          : search,

      category:
        overrides.category !== undefined
          ? overrides.category
          : category,

      minPrice:
        overrides.minPrice !== undefined
          ? overrides.minPrice
          : minPrice,

      maxPrice:
        overrides.maxPrice !== undefined
          ? overrides.maxPrice
          : maxPrice,

      specialOffersOnly:
        overrides.specialOffersOnly !== undefined
          ? overrides.specialOffersOnly
          : specialOffersOnly,

      startDate:
        overrides.startDate !== undefined
          ? overrides.startDate
          : startDate,

      endDate:
        overrides.endDate !== undefined
          ? overrides.endDate
          : endDate,

      sortBy:
        overrides.sortBy !== undefined
          ? overrides.sortBy
          : sortBy,
    };

    if (
      Boolean(values.startDate) !== Boolean(values.endDate)
    ) {
      setError("Please select both rental dates.");
      return;
    }

    if (
      values.startDate &&
      values.endDate < values.startDate
    ) {
      setError(
        "End date cannot be before the start date."
      );
      return;
    }

    if (
      (values.minPrice !== "" &&
        Number(values.minPrice) < 0) ||
      (values.maxPrice !== "" &&
        Number(values.maxPrice) < 0)
    ) {
      setError("Rental prices cannot be negative.");
      return;
    }

    if (
      values.minPrice !== "" &&
      values.maxPrice !== "" &&
      Number(values.minPrice) > Number(values.maxPrice)
    ) {
      setError(
        "Minimum price cannot exceed maximum price."
      );
      return;
    }

    const filters = {};

    if (values.search.trim()) {
      filters.search = values.search.trim();
    }

    if (values.category) {
      filters.category = values.category;
    }

    if (values.minPrice !== "") {
      filters.minPrice = values.minPrice;
    }

    if (values.maxPrice !== "") {
      filters.maxPrice = values.maxPrice;
    }

    if (values.specialOffersOnly) {
      filters.specialOffers = "true";
    }

    if (values.startDate && values.endDate) {
      filters.startDate = values.startDate;
      filters.endDate = values.endDate;
    }

    filters.sortBy = values.sortBy;

    setMobileFiltersOpen(false);
    setLoading(true);
    setError("");
    loadEquipment(filters);
  };

  // ==========================================
  // SEARCH
  // ==========================================

  const handleSearch = (event) => {
    event.preventDefault();
    applyFilters();
  };

  // ==========================================
  // CATEGORY SELECTION
  // ==========================================

  const handleCategorySelect = (categoryId) => {
    setCategory(categoryId);

    applyFilters({ category: categoryId });

    equipmentSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  // ==========================================
  // CLEAR FILTERS
  // ==========================================

  const handleClear = () => {
    setSearch("");
    setCategory("");
    setMinPrice("");
    setMaxPrice("");
    setSpecialOffersOnly(false);
    setStartDate("");
    setEndDate("");
    setSortBy("featured");
    setError("");
    setMobileFiltersOpen(false);
    setLoading(true);
    loadEquipment({ sortBy: "featured" });
  };

  // ==========================================
  // CATEGORY SLIDER
  // ==========================================

  const scrollCategories = (direction) => {
    categorySliderRef.current?.scrollBy({
      left: direction * 300,
      behavior: "smooth",
    });
  };

  // ==========================================
  // EQUIPMENT NAVIGATION
  // ==========================================

  const handleViewEquipment = (
    equipmentId,
    selectedStart,
    selectedEnd
  ) => {
    navigate(`/customer/equipment/${equipmentId}`, {
      state: {
        startDate: selectedStart,
        endDate: selectedEnd,
      },
    });
  };

  // ==========================================
  // GROUP EQUIPMENT BY CATEGORY
  // ==========================================
  const groupedEquipment = categories
    .filter((cat) => cat.status === "ACTIVE")
    .map((cat) => ({
      ...cat,
      items: equipment.filter(
        (item) =>
          String(item.category?._id || item.category) ===
          String(cat._id)
      ),
    }))
    .filter((cat) => cat.items.length > 0)
    .sort((a, b) => {
      const preferredOrder = [
        "cameras",
        "lenses",
        "lighting",
        "gimbals",
        "audio accessories",
      ];

      const getPosition = (name) => {
        const position = preferredOrder.indexOf(
          String(name || "").trim().toLowerCase()
        );

        return position === -1
          ? preferredOrder.length
          : position;
      };

      return getPosition(a.name) - getPosition(b.name);
    });

  const uncategorizedEquipment = equipment.filter(
    (item) =>
      !categories.some(
        (cat) =>
          String(cat._id) ===
          String(item.category?._id || item.category)
      )
  );

  // ==========================================
  // FILTER PANEL
  // ==========================================

  const filterPanel = (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-950">
          Filters
        </h2>

        <button
          type="button"
          onClick={handleClear}
          className="text-sm font-semibold text-orange-600 hover:text-orange-700"
        >
          Clear All
        </button>
      </div>

      {/* PRICE RANGE */}
      <div className="mt-5 border-t border-gray-100 pt-5">
        <h3 className="text-sm font-semibold text-gray-900">
          Price Range
        </h3>

        <p className="mt-1 text-xs text-gray-500">
          Daily rental price (LKR)
        </p>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="min-w-0">
            <label
              htmlFor="minimum-price"
              className="mb-1.5 block text-xs font-medium text-gray-600"
            >
              Minimum
            </label>

            <input
              id="minimum-price"
              type="number"
              min="0"
              value={minPrice}
              onChange={(e) =>
                setMinPrice(e.target.value)
              }
              placeholder="Min"
              className="w-full min-w-0 rounded-xl border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            />
          </div>

          <div className="min-w-0">
            <label
              htmlFor="maximum-price"
              className="mb-1.5 block text-xs font-medium text-gray-600"
            >
              Maximum
            </label>

            <input
              id="maximum-price"
              type="number"
              min="0"
              value={maxPrice}
              onChange={(e) =>
                setMaxPrice(e.target.value)
              }
              placeholder="Max"
              className="w-full min-w-0 rounded-xl border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            />
          </div>
        </div>
      </div>

      {/* SPECIAL OFFERS */}
      <div className="mt-5 border-t border-gray-100 pt-5">
        <h3 className="text-sm font-semibold text-gray-900">
          Special Offers
        </h3>

        <label className="mt-3 flex cursor-pointer items-center gap-3 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={specialOffersOnly}
            onChange={(e) =>
              setSpecialOffersOnly(e.target.checked)
            }
            className="h-4 w-4 rounded accent-orange-600"
          />

          Show special offers only
        </label>
      </div>

      {/* RENTAL DATES */}
      <div className="mt-5 border-t border-gray-100 pt-5">
        <h3 className="text-sm font-semibold text-gray-900">
          Rental Dates
        </h3>

        <p className="mt-1 text-xs leading-5 text-gray-500">
          Choose your rental period to check availability.
        </p>

        <div className="mt-3 space-y-3">
          <div>
            <label
              htmlFor="equipment-start-date"
              className="mb-1.5 block text-xs font-medium text-gray-700"
            >
              Start Date
            </label>

            <input
              id="equipment-start-date"
              type="date"
              value={startDate}
              min={getToday()}
              onChange={(e) => {
                const value = e.target.value;
                setStartDate(value);

                if (
                  endDate &&
                  value &&
                  endDate < value
                ) {
                  setEndDate("");
                }
              }}
              className="block w-full min-w-0 rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm text-gray-800 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            />
          </div>

          <div>
            <label
              htmlFor="equipment-end-date"
              className="mb-1.5 block text-xs font-medium text-gray-700"
            >
              End Date
            </label>

            <input
              id="equipment-end-date"
              type="date"
              value={endDate}
              min={startDate || getToday()}
              onChange={(e) =>
                setEndDate(e.target.value)
              }
              className="block w-full min-w-0 rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm text-gray-800 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            />
          </div>
        </div>

        {startDate && endDate && (
          <div className="mt-3 rounded-xl border border-orange-100 bg-orange-50 p-3">
            <p className="text-xs font-medium text-orange-700">
              Selected rental period
            </p>

            <p className="mt-1 text-sm font-semibold text-orange-900">
              {startDate} to {endDate}
            </p>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => applyFilters()}
        disabled={loading}
        className="mt-6 w-full rounded-xl bg-orange-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        Apply Filters
      </button>
    </div>
  );

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-gray-50 px-4 py-8 sm:px-6 lg:py-10">
      <div className="mx-auto max-w-7xl">
        {/* PAGE HEADING */}
        <header>
          <p className="text-xs font-bold uppercase tracking-widest text-orange-600">
            Equipment Rental
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl">
            Browse Equipment
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-600 sm:text-base">
            Explore cameras, lenses, lighting, and professional
            photography accessories for your next project.
          </p>
        </header>

        {/* SEARCH BAR */}
        <form
          onSubmit={handleSearch}
          role="search"
          className="mt-7"
        >
          <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-3 shadow-sm sm:flex-row sm:items-center">
            <div className="flex min-w-0 flex-1 items-center gap-3 px-2">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5 shrink-0 text-gray-400"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>

              <input
                type="search"
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder="Search cameras, lenses, brands, or models..."
                aria-label="Search rental equipment"
                className="w-full min-w-0 bg-transparent py-2 text-sm text-gray-900 outline-none placeholder:text-gray-400"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-orange-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-orange-700 disabled:opacity-60"
            >
              Search Equipment
            </button>
          </div>
        </form>

        {/* CATEGORY GALLERY */}
        <section className="mt-9">
          <div className="mb-5">
            <h2 className="text-xl font-bold text-gray-950 sm:text-2xl">
              Explore Categories
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Choose a category to find the equipment you need.
            </p>
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => scrollCategories(-1)}
              aria-label="Scroll categories left"
              className="absolute -left-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white text-2xl text-gray-700 shadow-md transition hover:bg-orange-600 hover:text-white"
            >
              ‹
            </button>

            <div
              ref={categorySliderRef}
              className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              <CategoryCard
                name="All Equipment"
                allEquipment
                selected={category === ""}
                onClick={() =>
                  handleCategorySelect("")
                }
              />

              {categories
                .filter((item) => item.status === "ACTIVE")
                .sort((a, b) => {
                  const preferredOrder = [
                    "cameras",
                    "lenses",
                    "lighting",
                    "gimbals",
                    "audio accessories",
                  ];

                  const getPosition = (name) => {
                    const position = preferredOrder.indexOf(
                      String(name || "").trim().toLowerCase()
                    );

                    return position === -1
                      ? preferredOrder.length
                      : position;
                  };

                  return (
                    getPosition(a.name) - getPosition(b.name)
                  );
                })
                .map((item) => (

                  <CategoryCard
                    key={item._id}
                    name={item.name}
                    imageUrl={item.imageUrl}
                    selected={category === item._id}
                    onClick={() =>
                      handleCategorySelect(item._id)
                    }
                  />
                ))}
            </div>

            <button
              type="button"
              onClick={() => scrollCategories(1)}
              aria-label="Scroll categories right"
              className="absolute -right-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white text-2xl text-gray-700 shadow-md transition hover:bg-orange-600 hover:text-white"
            >
              ›
            </button>
          </div>
        </section>

        {/* CATALOGUE */}
        <div
          ref={equipmentSectionRef}
          className="mt-9 scroll-mt-24 lg:grid lg:grid-cols-[260px_minmax(0,1fr)] lg:items-start lg:gap-7"
        >
          {/* DESKTOP FILTERS */}
          <aside className="hidden lg:sticky lg:top-24 lg:block">
            {filterPanel}
          </aside>

          {/* EQUIPMENT RESULTS */}
          <section className="min-w-0">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-gray-950">
                  Available Equipment
                </h2>

                {!loading && !error && (
                  <p className="mt-1 text-sm text-gray-500">
                    Showing {equipment.length} equipment item
                    {equipment.length !== 1 ? "s" : ""}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setMobileFiltersOpen((prev) => !prev)
                  }
                  aria-expanded={mobileFiltersOpen}
                  className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 lg:hidden"
                >
                  {mobileFiltersOpen
                    ? "Hide Filters"
                    : "Filters"}
                </button>

                <select
                  aria-label="Sort equipment"
                  value={sortBy}
                  onChange={(e) => {
                    const value = e.target.value;
                    setSortBy(value);
                    applyFilters({ sortBy: value });
                  }}
                  className="rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-orange-500"
                >
                  <option value="featured">
                    Sort: Featured
                  </option>
                  <option value="price_asc">
                    Price: Low to High
                  </option>
                  <option value="price_desc">
                    Price: High to Low
                  </option>
                  <option value="name_asc">
                    Name: A-Z
                  </option>
                </select>
              </div>
            </div>

            {/* MOBILE FILTERS */}
            {mobileFiltersOpen && (
              <div className="mb-6 lg:hidden">
                {filterPanel}
              </div>
            )}

            {/* LOADING */}
            {loading && (
              <div
                role="status"
                className="rounded-2xl border border-gray-200 bg-white p-10 text-center"
              >
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-orange-100 border-t-orange-600" />

                <p className="mt-4 text-sm text-gray-500">
                  Loading equipment...
                </p>
              </div>
            )}

            {/* ERROR */}
            {!loading && error && (
              <div
                role="alert"
                className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700"
              >
                {error}

                <button
                  type="button"
                  onClick={handleClear}
                  className="ml-3 font-semibold underline"
                >
                  Reset filters
                </button>
              </div>
            )}

            {/* EMPTY STATE */}
            {!loading &&
              !error &&
              equipment.length === 0 && (
                <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center">
                  <h3 className="text-lg font-bold text-gray-950">
                    No equipment found
                  </h3>

                  <p className="mt-2 text-sm text-gray-500">
                    Try another search or adjust your filters.
                  </p>

                  <button
                    type="button"
                    onClick={handleClear}
                    className="mt-5 rounded-xl bg-orange-600 px-5 py-3 text-sm font-semibold text-white hover:bg-orange-700"
                  >
                    Clear Filters
                  </button>
                </div>
              )}

            {/* EQUIPMENT GRID */}
            {!loading &&
              !error &&
              equipment.length > 0 && (
                <>
                  {category === "" ? (
                    <div className="space-y-10">
                      {groupedEquipment.map((cat) => (
                        <section
                          key={cat._id}
                          className="space-y-4"
                        >
                          <div className="border-b border-gray-200 pb-3">
                            <h3 className="text-xl font-bold text-gray-950">
                              {cat.name}
                            </h3>

                            <p className="mt-1 text-sm text-gray-500">
                              {cat.items.length} equipment item
                              {cat.items.length !== 1
                                ? "s"
                                : ""}
                            </p>
                          </div>

                          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                            {cat.items.map((item) => (
                              <EquipmentCard
                                key={item._id}
                                item={item}
                                startDate={startDate}
                                endDate={endDate}
                                onView={handleViewEquipment}
                              />
                            ))}
                          </div>
                        </section>
                      ))}

                      {uncategorizedEquipment.length > 0 && (
                        <section className="space-y-4">
                          <h3 className="border-b border-gray-200 pb-3 text-xl font-bold text-gray-950">
                            Other Equipment
                          </h3>

                          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                            {uncategorizedEquipment.map(
                              (item) => (
                                <EquipmentCard
                                  key={item._id}
                                  item={item}
                                  startDate={startDate}
                                  endDate={endDate}
                                  onView={handleViewEquipment}
                                />
                              )
                            )}
                          </div>
                        </section>
                      )}
                    </div>
                  ) : (
                    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                      {equipment.map((item) => (
                        <EquipmentCard
                          key={item._id}
                          item={item}
                          startDate={startDate}
                          endDate={endDate}
                          onView={handleViewEquipment}
                        />
                      ))}
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
