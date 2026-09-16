import { useEffect, useState } from "react";
import api from "../../services/api";

const Notifications = () => {
  const [users, setUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const [selectedUser, setSelectedUser] = useState("");

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState("RENTAL_REQUEST");

  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingNotifications, setLoadingNotifications] =
    useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [markingRead, setMarkingRead] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ==========================================
  // FETCH USERS
  // ==========================================

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      setError("");

      /*
       * There is currently no dedicated "all users" endpoint
       * in the admin backend.
       *
       * We therefore combine the existing customer endpoint
       * with the invoices endpoint to obtain known customers.
       */

      const response = await api.get("/admin/customers");

      setUsers(response.data?.data?.customers || []);
    } catch (error) {
      const status = error.response?.status;

      if (status === 401) {
        setError("Your session has expired. Please log in again.");
      } else if (status === 403) {
        setError(
          "You do not have permission to manage notifications."
        );
      } else {
        setError(
          error.response?.data?.message ||
            "Failed to load users."
        );
      }
    } finally {
      setLoadingUsers(false);
    }
  };

  // ==========================================
  // FETCH NOTIFICATIONS FOR USER
  // ==========================================

  const fetchNotifications = async (userId) => {
    if (!userId) {
      setNotifications([]);
      return;
    }

    try {
      setLoadingNotifications(true);
      setError("");

      const response = await api.get(
        `/admin/notifications/user/${userId}`
      );

      setNotifications(
        response.data?.data?.notification || []
      );
    } catch (error) {
      setNotifications([]);

      setError(
        error.response?.data?.message ||
          "Failed to load notifications."
      );
    } finally {
      setLoadingNotifications(false);
    }
  };

  // ==========================================
  // INITIAL LOAD
  // ==========================================

  useEffect(() => {
    fetchUsers();
  }, []);

  // ==========================================
  // USER CHANGE
  // ==========================================

  const handleUserChange = async (event) => {
    const userId = event.target.value;

    setSelectedUser(userId);
    setSuccess("");
    setError("");

    await fetchNotifications(userId);
  };

  // ==========================================
  // CREATE NOTIFICATION
  // ==========================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!selectedUser) {
      setError("Please select a recipient.");
      return;
    }

    if (!title.trim()) {
      setError("Notification title is required.");
      return;
    }

    if (!message.trim()) {
      setError("Notification message is required.");
      return;
    }

    if (!type) {
      setError("Notification type is required.");
      return;
    }

    try {
      setSubmitting(true);

      await api.post("/admin/notifications", {
        recipient: selectedUser,
        title: title.trim(),
        message: message.trim(),
        type,
      });

      setSuccess("Notification created successfully.");

      setTitle("");
      setMessage("");

      await fetchNotifications(selectedUser);
    } catch (error) {
      const status = error.response?.status;

      if (status === 400) {
        setError(
          error.response?.data?.message ||
            "Invalid notification details."
        );
      } else if (status === 404) {
        setError(
          error.response?.data?.message ||
            "Recipient user was not found."
        );
      } else if (status === 401) {
        setError("Your session has expired. Please log in again.");
      } else if (status === 403) {
        setError(
          "You do not have permission to create notifications."
        );
      } else {
        setError(
          error.response?.data?.message ||
            "Failed to create notification."
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  // ==========================================
  // MARK AS READ
  // ==========================================

  const handleMarkAsRead = async (notificationId) => {
    try {
      setMarkingRead(notificationId);
      setError("");
      setSuccess("");

      await api.patch(
        `/admin/notifications/${notificationId}/read`
      );

      setSuccess("Notification marked as read.");

      await fetchNotifications(selectedUser);
    } catch (error) {
      const status = error.response?.status;

      if (status === 404) {
        setError(
          error.response?.data?.message ||
            "Notification was not found."
        );
      } else if (status === 401) {
        setError("Your session has expired. Please log in again.");
      } else if (status === 403) {
        setError(
          "You do not have permission to update notifications."
        );
      } else {
        setError(
          error.response?.data?.message ||
            "Failed to mark notification as read."
        );
      }
    } finally {
      setMarkingRead("");
    }
  };

  // ==========================================
  // FORMAT DATE
  // ==========================================

  const formatDate = (value) => {
    if (!value) return "-";

    return new Date(value).toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ==========================================
  // NOTIFICATION TYPE LABEL
  // ==========================================

  const getTypeLabel = (type) => {
    const labels = {
      RENTAL_REQUEST: "Rental Request",
      RENTAL_RETURN_DUE: "Rental Return Due",
      RENTAL_OVERDUE: "Rental Overdue",
      BOOKING_CONFIRMATION: "Booking Confirmation",
      BOOKING_STATUS_CHANGE: "Booking Status Change",
      PAYMENT_RECORDED: "Payment Recorded",
    };

    return labels[type] || type;
  };

  // ==========================================
  // STATUS
  // ==========================================

  const getReadBadge = (isRead) => {
    if (isRead) {
      return "bg-gray-100 text-gray-600";
    }

    return "bg-orange-100 text-orange-700";
  };

  return (
    <div className="p-6">
      {/* ======================================
          PAGE HEADER
      ====================================== */}

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-950">
          Notification Management
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Create in-app notifications and manage notification
          status.
        </p>
      </div>

      {/* ======================================
          SUCCESS
      ====================================== */}

      {success && (
        <div className="mb-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      )}

      {/* ======================================
          ERROR
      ====================================== */}

      {error && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* ====================================
            CREATE NOTIFICATION
        ==================================== */}

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-950">
            Create Notification
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Send an in-app notification to a user.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            {/* Recipient */}

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Recipient
              </label>

              <select
                value={selectedUser}
                onChange={handleUserChange}
                disabled={loadingUsers || submitting}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              >
                <option value="">
                  {loadingUsers
                    ? "Loading users..."
                    : "Select recipient"}
                </option>

                {users.map((user) => (
                  <option key={user._id} value={user._id}>
                    {user.name} - {user.email}
                  </option>
                ))}
              </select>
            </div>

            {/* Title */}

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Title
              </label>

              <input
                type="text"
                value={title}
                onChange={(event) =>
                  setTitle(event.target.value)
                }
                disabled={submitting}
                placeholder="Enter notification title"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              />
            </div>

            {/* Type */}

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Notification Type
              </label>

              <select
                value={type}
                onChange={(event) =>
                  setType(event.target.value)
                }
                disabled={submitting}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              >
                <option value="RENTAL_REQUEST">
                  Rental Request
                </option>

                <option value="RENTAL_RETURN_DUE">
                  Rental Return Due
                </option>

                <option value="RENTAL_OVERDUE">
                  Rental Overdue
                </option>

                <option value="BOOKING_CONFIRMATION">
                  Booking Confirmation
                </option>

                <option value="BOOKING_STATUS_CHANGE">
                  Booking Status Change
                </option>

                <option value="PAYMENT_RECORDED">
                  Payment Recorded
                </option>
              </select>
            </div>

            {/* Message */}

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Message
              </label>

              <textarea
                rows="5"
                value={message}
                onChange={(event) =>
                  setMessage(event.target.value)
                }
                disabled={submitting}
                placeholder="Enter notification message"
                className="w-full resize-none rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              />
            </div>

            {/* Submit */}

            <button
              type="submit"
              disabled={
                submitting ||
                !selectedUser ||
                !title.trim() ||
                !message.trim()
              }
              className="w-full rounded-xl bg-orange-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              {submitting
                ? "Creating Notification..."
                : "Create Notification"}
            </button>
          </form>
        </div>

        {/* ====================================
            NOTIFICATION HISTORY
        ==================================== */}

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-2">
          <div>
            <h2 className="text-lg font-semibold text-gray-950">
              Notification History
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              {selectedUser
                ? "Notifications for the selected recipient."
                : "Select a recipient to view notifications."}
            </p>
          </div>

          <div className="mt-6">
            {!selectedUser ? (
              <div className="rounded-xl border border-dashed border-gray-300 px-6 py-12 text-center">
                <p className="text-sm font-medium text-gray-700">
                  No recipient selected
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  Select a recipient from the form to view their
                  notification history.
                </p>
              </div>
            ) : loadingNotifications ? (
              <div className="py-12 text-center">
                <p className="text-sm text-gray-500">
                  Loading notifications...
                </p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-300 px-6 py-12 text-center">
                <p className="text-sm font-medium text-gray-700">
                  No notifications found
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  No notifications have been created for this user.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {notifications.map((notification) => (
                  <div
                    key={notification._id}
                    className="rounded-xl border border-gray-200 p-4"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-gray-950">
                            {notification.title}
                          </h3>

                          <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                            {getTypeLabel(notification.type)}
                          </span>

                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-medium ${getReadBadge(
                              notification.isRead
                            )}`}
                          >
                            {notification.isRead
                              ? "Read"
                              : "Unread"}
                          </span>
                        </div>

                        <p className="mt-3 text-sm leading-6 text-gray-600">
                          {notification.message}
                        </p>

                        <p className="mt-3 text-xs text-gray-400">
                          {formatDate(notification.createdAt)}
                        </p>
                      </div>

                      {!notification.isRead && (
                        <button
                          onClick={() =>
                            handleMarkAsRead(notification._id)
                          }
                          disabled={
                            markingRead === notification._id
                          }
                          className="shrink-0 rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {markingRead === notification._id
                            ? "Updating..."
                            : "Mark as Read"}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notifications;