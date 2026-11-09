
//added by abilash

import { useEffect, useState } from "react";
import api from "../../services/api";

// ==========================================
// FR-085: ADMIN SYSTEM ACTIVITY MONITORING
// ==========================================

const ActivityLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  //added by abilash
  // FR-085: Activity log pagination
  const [page, setPage] = useState(1);
  
  //added by abilash
  // FR-085: Activity log filters
  const [actionFilter, setActionFilter] = useState("");
  const [outcomeFilter, setOutcomeFilter] = useState("");
  //ended by abilash

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  //ended by abilash


  useEffect(() => {
    const fetchActivityLogs = async () => {
      try {
        setLoading(true);
        setError("");

        
        //added by abilash
        
        //added by abilash
        const response = await api.get("/admin/activity-logs", {
          params: {
            page,
            ...(actionFilter && { action: actionFilter }),
            ...(outcomeFilter && { outcome: outcomeFilter }),
          },
        });
        //ended by abilash


        setLogs(response.data?.data?.logs || []);
        setPagination(
          response.data?.data?.pagination || {
            page,
            limit: 20,
            total: 0,
            totalPages: 0,
          }
        );
        //ended by abilash

      } catch (err) {
        setError(
          err.response?.data?.message ||
            "Failed to load system activities."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchActivityLogs();
  }, [page, actionFilter, outcomeFilter]);

  const formatDate = (date) => {
    if (!date) return "-";

    return new Date(date).toLocaleString("en-GB", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  return (
    <div className="min-h-full bg-gray-100 px-6 py-8">
      <div className="mx-auto max-w-7xl">

        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-wider text-orange-600">
            Business Monitoring
          </p>

          <h1 className="mt-2 text-3xl font-bold text-gray-900">
            System Activity Logs
          </h1>

          <p className="mt-2 text-gray-600">
            Monitor recorded system activities and administrative operations.
          </p>
        </div>

        
        {/* added by abilash */}
        {/* FR-085: Activity Log Filters */}
        <div className="mb-6 flex flex-wrap items-end gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">

          <div className="min-w-[200px] flex-1">
            <label
              htmlFor="activity-action-filter"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Filter by Action
            </label>

            <select
              id="activity-action-filter"
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm"
            >
              <option value="">All Actions</option>
              <option value="PAYMENT_CREATED">Payment Created</option>
              
              {/* added by abilash */}
              <option value="INVOICE_CREATED">Invoice Created</option>
              {/* ended by abilash */}
              
              {/* added by abilash */}
              <option value="DEPOSIT_RECORDED">Deposit Recorded</option>
              {/* ended by abilash */}
              
              {/* added by abilash */}
              <option value="REFUND_RECORDED">Refund Recorded</option>
              {/* ended by abilash */}
              
              {/* added by abilash */}
              <option value="PHOTOGRAPHER_ACCOUNT_CREATED">
                Photographer Account Created
              </option>
              {/* ended by abilash */}
              
              {/* added by abilash */}
              <option value="PHOTOGRAPHER_APPLICATION_APPROVED">
                Photographer Application Approved
              </option>

              <option value="PHOTOGRAPHER_APPLICATION_REJECTED">
                Photographer Application Rejected
              </option>
              {/* ended by abilash */}

              {/* added by abilash */}
              <option value="ADMIN_PROFILE_UPDATED">
                Admin Profile Updated
              </option>
              {/* ended by abilash */}
              
              {/* added by abilash */}
              <option value="PASSWORD_CHANGED">
                Password Changed
              </option>
              {/* ended by abilash */}
              
              {/* added by abilash */}
              <option value="USER_LOGIN">
                User Login
              </option>
              {/* ended by abilash */}
              
              {/* added by abilash */}
              <option value="USER_LOGOUT">
                User Logout
              </option>
              {/* ended by abilash */}









              <option value="AUDIT_LOG_TEST">Audit Log Test</option>
            </select>
          </div>

          <div className="min-w-[180px] flex-1">
            <label
              htmlFor="activity-outcome-filter"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Filter by Outcome
            </label>

            <select
              id="activity-outcome-filter"
              value={outcomeFilter}
              onChange={(e) => {
                setOutcomeFilter(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm"
            >
              <option value="">All Outcomes</option>
              <option value="SUCCESS">Success</option>
              <option value="FAILURE">Failure</option>
            </select>
          </div>

          <button
            type="button"
            onClick={() => {
              setActionFilter("");
              setOutcomeFilter("");
              setPage(1);
            }}
            className="rounded-lg border border-gray-300 px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            Clear Filters
          </button>

        </div>
        {/* ended by abilash */}


        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          {loading ? (
            <p className="p-6 text-gray-500">
              Loading system activities...
            </p>
          ) : error ? (
            <p className="p-6 text-red-600">{error}</p>
          ) : logs.length === 0 ? (
            <p className="p-6 text-gray-500">
              No system activities recorded yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-700">
                  <tr>
                    <th className="px-4 py-3">Date & Time</th>
                    <th className="px-4 py-3">Performed By</th>
                    <th className="px-4 py-3">Action</th>
                    <th className="px-4 py-3">Entity</th>
                    <th className="px-4 py-3">Outcome</th>
                    <th className="px-4 py-3">Details</th>
                  </tr>
                </thead>

                <tbody>
                  {logs.map((log) => (
                    <tr
                      key={log._id}
                      className="border-t border-gray-100"
                    >
                      <td className="whitespace-nowrap px-4 py-3">
                        {formatDate(log.createdAt)}
                      </td>

                      <td className="px-4 py-3">
                        <p className="font-medium">
                          {log.actor?.name || log.actorRole}
                        </p>
                        <p className="text-xs text-gray-500">
                          {log.actor?.email || ""}
                        </p>
                      </td>

                      <td className="px-4 py-3 font-medium">
                        {log.action?.replaceAll("_", " ")}
                      </td>

                      <td className="px-4 py-3">
                        <p>{log.entityType}</p>
                        <p className="break-all text-xs text-gray-500">
                          {log.entityId || "-"}
                        </p>
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${
                            log.outcome === "SUCCESS"
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {log.outcome}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-gray-600">
                        {log.message || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        {/* added by abilash */}
        {/* FR-085: Activity Log Pagination Controls */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-xl bg-white p-4 shadow-sm">

          <p className="text-sm text-gray-600">
            Page {pagination.page} of {Math.max(pagination.totalPages, 1)}
            {" "} | Total activities: {pagination.total}
          </p>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setPage((previous) => Math.max(1, previous - 1))}
              disabled={loading || page <= 1}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>

            <button
              type="button"
              onClick={() => setPage((previous) => previous + 1)}
              disabled={
                loading ||
                pagination.totalPages === 0 ||
                page >= pagination.totalPages
              }
              className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>

        </div>
        {/* ended by abilash */}

      </div>
    </div>
  );
};

export default ActivityLogs;

//ended by abilash
