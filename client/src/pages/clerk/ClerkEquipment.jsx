import { useEffect, useState } from "react";

import { getAllEquipment } from "../../services/equipmentService";

const ClerkEquipment = () => {
  // ==========================================
  // STATE
  // ==========================================

  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const equipmentPerPage = 8;

  // ==========================================
  // LOAD EQUIPMENT
  // ==========================================

  useEffect(() => {
    let cancelled = false;

    const fetchEquipment = async () => {
      try {
        const result = await getAllEquipment();

        if (!cancelled) {
          setEquipment(
            result?.data?.equipment || []
          );
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.response?.data?.message ||
              "Failed to load equipment"
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void fetchEquipment();

    return () => {
      cancelled = true;
    };
  }, []);


  // ==========================================
  // EQUIPMENT STATUS STYLE
  // ==========================================

  const getStatusClass = (status) => {
    switch (status) {
      case "AVAILABLE":
        return "bg-green-100 text-green-800";

      case "RESERVED":
        return "bg-blue-100 text-blue-800";

      case "RENTED":
        return "bg-orange-100 text-orange-800";

      case "MAINTENANCE":
        return "bg-yellow-100 text-yellow-800";

      case "DAMAGED":
        return "bg-red-100 text-red-800";

      default:
        return "bg-gray-100 text-gray-700";
    }
  };


  // ==========================================
  // EQUIPMENT CONDITION STYLE
  // ==========================================

  const getConditionClass = (condition) => {
    switch (condition) {
      case "EXCELLENT":
        return "bg-green-100 text-green-800";

      case "GOOD":
        return "bg-blue-100 text-blue-800";

      case "FAIR":
        return "bg-yellow-100 text-yellow-800";

      case "DAMAGED":
        return "bg-red-100 text-red-800";

      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  // ==========================================
  // PAGINATION
  // ==========================================

  const totalPages = Math.ceil(
    equipment.length / equipmentPerPage
  );

  const startIndex =
    (currentPage - 1) * equipmentPerPage;

  const paginatedEquipment = equipment.slice(
    startIndex,
    startIndex + equipmentPerPage
  );

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-7xl">

        {/* ======================================
            HEADER
        ====================================== */}

        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-orange-600">
            Clerk
          </p>

          <h1 className="mt-2 text-3xl font-bold text-gray-950">
            Equipment Status
          </h1>

          <p className="mt-2 max-w-2xl text-gray-600">
            View equipment availability,
            condition, rental status, and
            pricing information.
          </p>
        </div>


        {/* ======================================
            LOADING
        ====================================== */}

        {loading && (
          <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-8">
            <p className="text-gray-600">
              Loading equipment...
            </p>
          </div>
        )}


        {/* ======================================
            ERROR
        ====================================== */}

        {!loading && error && (
          <div className="mt-8 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}


        {/* ======================================
            EMPTY STATE
        ====================================== */}

        {!loading &&
          !error &&
          equipment.length === 0 && (
            <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-8 text-center">
              <p className="text-gray-600">
                No equipment found.
              </p>
            </div>
          )}


        {/* ======================================
            EQUIPMENT TABLE
        ====================================== */}

        {!loading &&
          !error &&
          equipment.length > 0 && (
            <div className="mt-8 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">

                  {/* TABLE HEADER */}

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
                        Security Deposit
                      </th>

                    </tr>
                  </thead>


                  {/* TABLE BODY */}

                  <tbody className="divide-y divide-gray-100">

                    {paginatedEquipment.map((item) => (
                      <tr
                        key={item._id}
                        className="transition hover:bg-gray-50"
                      >

                        {/* EQUIPMENT */}

                        <td className="px-6 py-4">
                          <p className="font-semibold text-gray-950">
                            {item.name || "Unnamed Equipment"}
                          </p>

                          <p className="mt-1 text-sm text-gray-500">
                            {item.brand || "—"}{" "}
                            {item.model || ""}
                          </p>

                          <p className="mt-1 text-xs text-gray-400">
                            Serial:{" "}
                            {item.serialNumber || "—"}
                          </p>
                        </td>


                        {/* CATEGORY */}

                        <td className="px-6 py-4 text-sm text-gray-700">
                          {item.category?.name || "—"}
                        </td>


                        {/* CONDITION */}

                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getConditionClass(
                              item.condition
                            )}`}
                          >
                            {item.condition || "—"}
                          </span>
                        </td>


                        {/* STATUS */}

                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                              item.status
                            )}`}
                          >
                            {item.status || "—"}
                          </span>
                        </td>


                        {/* RENTAL PRICE */}

                        <td className="px-6 py-4 font-medium text-gray-900">
                          LKR{" "}
                          {Number(
                            item.rentalPricePerDay || 0
                          ).toLocaleString()}
                        </td>


                        {/* SECURITY DEPOSIT */}

                        <td className="px-6 py-4 font-medium text-gray-900">
                          LKR{" "}
                          {Number(
                            item.securityDeposit || 0
                          ).toLocaleString()}
                        </td>

                      </tr>
                    ))}

                  </tbody>
                  </table>
                  </div>

                  {totalPages > 1 && (
                    <div className="flex flex-col gap-3 border-t border-gray-200 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-sm text-gray-500">
                        Showing{" "}
                        <span className="font-medium text-gray-700">
                          {startIndex + 1}
                        </span>
                        {" - "}
                        <span className="font-medium text-gray-700">
                          {Math.min(
                            startIndex + equipmentPerPage,
                            equipment.length
                          )}
                        </span>
                        {" of "}
                        <span className="font-medium text-gray-700">
                          {equipment.length}
                        </span>{" "}
                        equipment items
                      </p>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setCurrentPage((page) =>
                              Math.max(page - 1, 1)
                            )
                          }
                          disabled={currentPage === 1}
                          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Previous
                        </button>

                        <span className="px-2 text-sm text-gray-600">
                          Page{" "}
                          <span className="font-semibold text-gray-900">
                            {currentPage}
                          </span>{" "}
                          of {totalPages}
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            setCurrentPage((page) =>
                              Math.min(page + 1, totalPages)
                            )
                          }
                          disabled={currentPage === totalPages}
                          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
            </div>
          )}

      </div>
    </main>
  );
};

export default ClerkEquipment;