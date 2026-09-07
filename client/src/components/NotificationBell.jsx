import {
  useEffect,
  useRef,
  useState,
} from "react";

import { Link } from "react-router-dom";

import api from "../services/api";

const NotificationBell = () => {
  const [notifications, setNotifications] =
    useState([]);

  const [unreadCount, setUnreadCount] =
    useState(0);

  const [open, setOpen] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const panelRef = useRef(null);


  // ==========================================
  // LOAD NOTIFICATIONS
  // ==========================================

  useEffect(() => {
    let ignore = false;

    const loadNotifications =
      async () => {
        try {
          const response =
            await api.get(
              "/customer/notifications"
            );

          if (!ignore) {
            setNotifications(
              Array.isArray(
                response.data?.data
                  ?.notifications
              )
                ? response.data.data
                    .notifications
                : []
            );

            setUnreadCount(
              Number(
                response.data?.data
                  ?.unreadCount
              ) || 0
            );
          }
        } catch (err) {
          console.error(
            "Failed to load notifications:",
            err
          );
        } finally {
          if (!ignore) {
            setLoading(false);
          }
        }
      };

    loadNotifications();

    return () => {
      ignore = true;
    };
  }, []);


  // ==========================================
  // OUTSIDE CLICK
  // ==========================================

  useEffect(() => {
    const handleOutsideClick = (
      event
    ) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(
          event.target
        )
      ) {
        setOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, []);


  // ==========================================
  // MARK AS READ
  // ==========================================

  const markAsRead =
    async (notification) => {
      if (notification.read) {
        return;
      }

      try {
        await api.patch(
          `/customer/notifications/${notification._id}/read`
        );

        setNotifications(
          (previous) =>
            previous.map((item) =>
              item._id ===
              notification._id
                ? {
                    ...item,
                    read: true,
                  }
                : item
            )
        );

        setUnreadCount(
          (previous) =>
            Math.max(
              0,
              previous - 1
            )
        );
      } catch (err) {
        console.error(
          "Failed to mark notification as read:",
          err
        );
      }
    };


  return (
    <div
      ref={panelRef}
      className="relative"
    >

      {/* ==================================
          BELL BUTTON
      ================================== */}

      <button
        type="button"
        aria-label="Notifications"
        aria-expanded={open}
        onClick={() =>
          setOpen(
            (previous) =>
              !previous
          )
        }
        className="relative flex h-10 w-10 items-center justify-center rounded-full text-gray-700 transition hover:bg-gray-100 hover:text-orange-600"
      >

        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="h-5 w-5"
          aria-hidden="true"
        >
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />

          <path d="M10 21h4" />
        </svg>


        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-orange-600 px-1 text-[9px] font-bold text-white">
            {unreadCount > 9
              ? "9+"
              : unreadCount}
          </span>
        )}

      </button>


      {/* ==================================
          NOTIFICATION DROPDOWN
      ================================== */}

      {open && (
        <div className="absolute right-0 top-12 w-[330px] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl sm:w-[390px]">

          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">

            <div>

              <p className="font-bold text-gray-950">
                Notifications
              </p>

              <p className="mt-0.5 text-xs text-gray-500">
                {unreadCount > 0
                  ? `${unreadCount} unread`
                  : "You're all caught up"}
              </p>

            </div>

          </div>


          <div className="max-h-[420px] overflow-y-auto">

            {loading ? (

              <div className="space-y-3 p-5">

                {[1, 2, 3].map(
                  (item) => (
                    <div
                      key={item}
                      className="h-16 animate-pulse rounded-xl bg-gray-100"
                    />
                  )
                )}

              </div>

            ) : notifications.length ===
              0 ? (

              <div className="px-6 py-10 text-center">

                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-gray-100">
                  🔔
                </div>

                <p className="mt-3 text-sm font-semibold text-gray-900">
                  No notifications
                </p>

                <p className="mt-1 text-xs leading-5 text-gray-500">
                  Application updates and
                  important account messages
                  will appear here.
                </p>

              </div>

            ) : (

              <div className="divide-y divide-gray-100">

                {notifications.map(
                  (notification) => (
                    <button
                      key={
                        notification._id
                      }
                      type="button"
                      onClick={() =>
                        markAsRead(
                          notification
                        )
                      }
                      className={`w-full px-5 py-4 text-left transition hover:bg-gray-50 ${
                        !notification.read
                          ? "bg-orange-50/50"
                          : "bg-white"
                      }`}
                    >

                      <div className="flex gap-3">

                        <div
                          className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm ${
                            notification.type ===
                            "PHOTOGRAPHER_APPLICATION_APPROVED"
                              ? "bg-emerald-50 text-emerald-700"
                              : notification.type ===
                                  "PHOTOGRAPHER_APPLICATION_REJECTED"
                                ? "bg-red-50 text-red-700"
                                : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {notification.type ===
                          "PHOTOGRAPHER_APPLICATION_APPROVED"
                            ? "✓"
                            : notification.type ===
                                "PHOTOGRAPHER_APPLICATION_REJECTED"
                              ? "!"
                              : "i"}
                        </div>


                        <div className="min-w-0 flex-1">

                          <div className="flex items-start gap-2">

                            <p className="flex-1 text-sm font-semibold text-gray-900">
                              {
                                notification.title
                              }
                            </p>

                            {!notification.read && (
                              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-orange-600" />
                            )}

                          </div>


                          <p className="mt-1 line-clamp-3 text-xs leading-5 text-gray-500">
                            {
                              notification.message
                            }
                          </p>


                          <p className="mt-2 text-[11px] text-gray-400">
                            {formatNotificationDate(
                              notification.createdAt
                            )}
                          </p>

                        </div>

                      </div>

                    </button>
                  )
                )}

              </div>
            )}

          </div>


          <div className="border-t border-gray-100 p-3">

            <Link
              to="/customer/photographer-application"
              onClick={() =>
                setOpen(false)
              }
              className="flex justify-center rounded-xl px-4 py-2.5 text-sm font-semibold text-orange-600 transition hover:bg-orange-50"
            >
              View Photographer Application
            </Link>

          </div>

        </div>
      )}

    </div>
  );
};


const formatNotificationDate = (
  date
) => {
  if (!date) {
    return "";
  }

  return new Date(
    date
  ).toLocaleString(
    undefined,
    {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }
  );
};

export default NotificationBell;