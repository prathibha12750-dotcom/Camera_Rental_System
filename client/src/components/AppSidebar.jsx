import {
  NavLink,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../context/useAuth";
import UserAvatar from "./UserAvatar";


// ==========================================
// ROLE-BASED SIDEBAR NAVIGATION
// ==========================================

const navigationByRole = {

  CUSTOMER: [
    {
      label: "Dashboard",
      to: "/customer",
      end: true,
      icon: "home",
    },
    {
      label: "Find Photographers",
      to: "/customer/photographers",
      icon: "search",
    },
    {
      label: "My Bookings",
      to: "/customer/bookings",
      icon: "bookings",
    },
  ],


  PHOTOGRAPHER: [
    {
      label: "Dashboard",
      to: "/photographer",
      end: true,
      icon: "home",
    },
    {
      label: "Bookings",
      to: "/photographer/bookings",
      icon: "bookings",
    },
    {
      label: "Availability",
      to: "/photographer/availability",
      icon: "calendar",
    },
    {
      label: "Portfolio",
      to: "/photographer/portfolio",
      icon: "portfolio",
    },
    {
      label: "Subscription",
      to: "/photographer/subscription",
      icon: "subscription",
    },
  ],


  CLERK: [
    {
      label: "Dashboard",
      to: "/clerk",
      end: true,
      icon: "home",
    },
    {
      label: "User Management",
      to: "/clerk/users",
      icon: "users",
    },
    {
      label: "Photographer Applications",
      to: "/clerk/photographer-applications",
      icon: "photographer-applications",
    },
    {
      label: "Rental Management",
      to: "/clerk/rentals",
      icon: "bookings",
    },
    {
      label: "Equipment Status",
      to: "/clerk/equipment",
      icon: "equipment",
    },
    {
      label: "Damage & Maintenance",
      to: "/clerk/damage-maintenance",
      icon: "maintenance",
    },
    {
      label: "Security Deposits",
      to: "/clerk/deposits",
      icon: "payments",
    },
    {
      label: "Refund Management",
      to: "/clerk/refunds",
      icon: "refund",
    },
    {
      label: "Photographer Subscriptions",
      to: "/photographer-subscriptions",
      icon: "photographer-subscriptions",
    },
    {
      label: "Subscription Payments",
      to: "subscription-payments",
      icon: "subscription",
    },
  ],


  STAFF_ADMIN: [
    {
      label: "Dashboard",
      to: "/admin",
      end: true,
      icon: "home",
    },
    {
      label: "Users",
      to: "/admin/users",
      icon: "users",
    },
    {
      label: "Equipment",
      to: "/admin/equipment",
      icon: "equipment",
    },
    {
      label: "Rentals",
      to: "/admin/rentals",
      icon: "bookings",
    },
    {
      label: "Invoices",
      to: "/admin/invoices",
      icon: "invoice",
    },
    {
      label: "Payments",
      to: "/admin/payments",
      icon: "payments",
    },
    {
      label: "Deposits",
      to: "/admin/deposits",
      icon: "deposits",
    },
    {
      label: "Refunds",
      to: "/admin/refunds",
      icon: "refund",
    },
    {
      label: "Reports",
      to: "/admin/reports",
      icon: "reports",
    },
    {
      label: "Notifications",
      to: "/admin/notifications",
      icon: "notifications",
    },
  ],

};


// ==========================================
// PROFILE ROUTES
// ==========================================

const profileRoutes = {
  CUSTOMER: "/customer/profile",
  PHOTOGRAPHER: "/photographer/profile",
};


// ==========================================
// FRIENDLY ROLE LABELS
// ==========================================

const roleLabels = {
  CUSTOMER: "Customer",
  PHOTOGRAPHER: "Photographer",
  CLERK: "Clerk",
  STAFF_ADMIN: "Staff Admin",
};


// ==========================================
// SMALL INLINE ICON COMPONENT
// ==========================================

const Icon = ({ name }) => {

  const commonProps = {
    className: "h-5 w-5",
    fill: "none",
    viewBox: "0 0 24 24",
    stroke: "currentColor",
    strokeWidth: 1.8,
    "aria-hidden": true,
  };


  // SEARCH
  if (name === "search") {
    return (
      <svg {...commonProps}>
        <circle
          cx="11"
          cy="11"
          r="7"
        />

        <path d="m20 20-3.5-3.5" />
      </svg>
    );
  }


  // BOOKINGS
  if (name === "bookings") {
    return (
      <svg {...commonProps}>
        <path d="M7 3v3M17 3v3" />

        <rect
          x="3"
          y="5"
          width="18"
          height="16"
          rx="2"
        />

        <path d="M3 10h18M8 14h3M13 14h3M8 17h3" />
      </svg>
    );
  }


  // CALENDAR
  if (name === "calendar") {
    return (
      <svg {...commonProps}>
        <path d="M7 3v3M17 3v3" />

        <rect
          x="3"
          y="5"
          width="18"
          height="16"
          rx="2"
        />

        <path d="M3 10h18" />
      </svg>
    );
  }


  // PORTFOLIO
  if (name === "portfolio") {
    return (
      <svg {...commonProps}>
        <rect
          x="3"
          y="5"
          width="18"
          height="16"
          rx="2"
        />

        <path d="M8 5V3h8v2M3 11h18M9 11v2h6v-2" />
      </svg>
    );
  }

  // PHOTOGRAPHER SUBSCRIPTIONS
  // Camera + recurring subscription indicator
  if (name === "photographer-subscriptions") {
    return (
      <svg {...commonProps}>
        {/* Camera body */}
        <path d="M3 9a2 2 0 0 1 2-2h3l2-2h4l2 2h3a2 2 0 0 1 2 2v4" />

        {/* Camera lens */}
        <circle cx="12" cy="12" r="3" />

        {/* Subscription renewal */}
        <path d="M16 18a3 3 0 0 1 5-2" />
        <path d="M21 13v3h-3" />
        <path d="M21 18a3 3 0 0 1-5 2" />
        <path d="M16 23v-3h3" />
      </svg>
    );
  }

  // SUBSCRIPTION
  if (name === "subscription") {
    return (
      <svg {...commonProps}>
        <rect
          x="3"
          y="5"
          width="18"
          height="14"
          rx="2"
        />

        <path d="M3 9h18" />

        <path d="M7 14h4" />

        <circle
          cx="17"
          cy="14"
          r="1.5"
        />
      </svg>
    );
  }
  
  // PHOTOGRAPHER APPLICATIONS
  if (name === "photographer-applications") {
    return (
      <svg {...commonProps}>
        {/* Camera body */}
        <path d="M3 8a2 2 0 0 1 2-2h3l2-2h4l2 2h3a2 2 0 0 1 2 2v6" />

        {/* Camera lens */}
        <circle cx="12" cy="11" r="3" />

        {/* Approval checkmark */}
        <circle cx="18" cy="18" r="4" />
        <path d="m16.5 18 1 1 2-2" />
      </svg>
    );
  }

  // EQUIPMENT
  if (name === "equipment") {
    return (
      <svg {...commonProps}>
        <rect
          x="3"
          y="6"
          width="18"
          height="13"
          rx="2"
        />
        <path d="M8 6l1.5-2h5L16 6" />
        <circle cx="12" cy="12.5" r="3" />
      </svg>
    );
  }

  // MAINTENANCE
  if (name === "maintenance") {
    return (
      <svg {...commonProps}>
        <path d="M14.7 6.3a4 4 0 0 0-5 5L3 18l3 3 6.7-6.7a4 4 0 0 0 5-5l-2.4 2.4-3-3 2.4-2.4Z" />
      </svg>
    );
  }

  // PAYMENTS / DEPOSITS
  if (name === "payments") {
    return (
      <svg {...commonProps}>
        <rect
          x="3"
          y="5"
          width="18"
          height="14"
          rx="2"
        />
        <path d="M3 9h18" />
        <path d="M7 15h4" />
      </svg>
    );
  }

  // REFUND
  if (name === "refund") {
    return (
      <svg {...commonProps}>
        <path d="M9 7H5v-4" />
        <path d="M5 7a8 8 0 1 1-1 8" />
        <path d="M8 12h8M12 9l-3 3 3 3" />
      </svg>
    );
  }

  if (name === "users") {
    return (
      <svg {...commonProps}>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    );
  }

  if (name === "invoice") {
    return (
      <svg {...commonProps}>
        <path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z" />
        <path d="M9 8h6M9 12h6M9 16h3" />
      </svg>
    );
  }

  if (name === "deposits") {
    return (
      <svg {...commonProps}>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M3 9h18" />
        <path d="M7 14h4" />
      </svg>
    );
  }

  if (name === "reports") {
    return (
      <svg {...commonProps}>
        <path d="M4 19V10M10 19V5M16 19v-7M22 19H2" />
      </svg>
    );
  }

  if (name === "notifications") {
    return (
      <svg {...commonProps}>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
        <path d="M10 21h4" />
      </svg>
    );
  }

  // HOME / DASHBOARD
  return (
    <svg {...commonProps}>
      <path d="m3 10 9-7 9 7" />

      <path d="M5 9v11h14V9M9 20v-6h6v6" />
    </svg>
  );

};


// ==========================================
// SIDEBAR
// ==========================================

  const AppSidebar = ({
    photographerIdentity = null,
    onNavigate,
    collapsed = false,
    onToggleCollapse,
  }) => {

  const navigate = useNavigate();

  const {
    user,
    logout,
  } = useAuth();


  const navigation =
    navigationByRole[user?.role] || [];

  const profilePath =
    profileRoutes[user?.role];


  // ==========================================
  // LOGOUT
  // ==========================================

  const handleLogout = async () => {

    await logout();

    navigate(
      "/login",
      {
        replace: true,
      }
    );

  };


  // ==========================================
  // PROFILE NAVIGATION
  // ==========================================

  const handleProfileClick = () => {

    if (!profilePath) {
      return;
    }

    if (onNavigate) {
      onNavigate();
    }

    navigate(profilePath);

  };


  return (
    <aside className="flex h-full flex-col bg-white">

      {/* BRAND AND SIDEBAR TOGGLE */}
      <div
        className={`flex h-20 shrink-0 items-center border-b border-gray-100 ${
          collapsed ? "justify-center px-2" : "justify-between px-4"
        }`}
      >
        <NavLink
          to={navigation[0]?.to || "/"}
          onClick={onNavigate}
          title={collapsed ? "Southern Camera Rent" : undefined}
          className="flex min-w-0 items-center gap-2 rounded-xl focus-visible:outline-2 focus-visible:outline-orange-500"
        >
          <img
            src="/scr-logo.jpg"
            alt="Southern Camera Rent"
            className={`shrink-0 rounded-xl object-contain ${
              collapsed ? "h-10 w-10" : "h-11 w-11"
            }`}
          />

          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-gray-950">
                Southern Camera Rent
              </p>
              <p className="truncate text-[10px] text-gray-500">
                Equipment & Photographer Services
              </p>
            </div>
          )}
        </NavLink>

        {!collapsed && onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            title="Collapse sidebar"
            aria-label="Collapse sidebar"
            className="ml-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-500 transition hover:bg-orange-50 hover:text-orange-600 focus-visible:outline-2 focus-visible:outline-orange-500"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="1.8"
              aria-hidden="true"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
        )}
      </div>

      {/* EXPAND BUTTON */}
      {collapsed && onToggleCollapse && (
        <div className="flex justify-center border-b border-gray-100 py-2">
          <button
            type="button"
            onClick={onToggleCollapse}
            title="Expand sidebar"
            aria-label="Expand sidebar"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-orange-50 hover:text-orange-600 focus-visible:outline-2 focus-visible:outline-orange-500"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="1.8"
              aria-hidden="true"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
      )}

      {/* ======================================
          NAVIGATION
      ====================================== */}
      <nav
        className={`sidebar-scroll-hidden min-h-0 flex-1 space-y-1 overflow-x-hidden overflow-y-auto py-5 ${
          collapsed ? "px-2" : "px-3"
        }`}
        aria-label="Main navigation"
      >
        
        {navigation.map((item) => (

        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          onClick={onNavigate}
          title={collapsed ? item.label : undefined}
          aria-label={collapsed ? item.label : undefined}
          className={({ isActive }) =>
            [
              "group flex items-center rounded-xl py-2.5 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500",
              collapsed
                ? "justify-center px-2"
                : "gap-3 px-3",
              isActive
                ? "bg-orange-50 text-orange-700"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-950",
            ].join(" ")
          }
        >
          <span className="shrink-0">
            <Icon name={item.icon} />
          </span>

          {!collapsed && (
            <span className="min-w-0">{item.label}</span>
          )}
        </NavLink>

        ))}

      </nav>


      {/* ======================================
          USER / PROFILE AREA
      ====================================== */}

      <div className="border-t border-gray-200 p-3">
        {profilePath ? (
          <button
            type="button"
            onClick={handleProfileClick}
            title={collapsed ? `${user?.name || "User"} — Profile` : undefined}
            aria-label={collapsed ? "Open profile" : undefined}
            className={`flex w-full items-center rounded-xl p-2 transition hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-orange-500 ${
              collapsed ? "justify-center" : "gap-3 text-left"
            }`}
          >
            <div className="shrink-0">
              <UserAvatar
                name={user?.name}
                imageUrl={photographerIdentity?.profileImage || ""}
              />
            </div>

            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-gray-950">
                  {user?.name || "User"}
                </p>
                <p className="truncate text-xs text-gray-500">
                  {user?.role === "PHOTOGRAPHER"
                    ? photographerIdentity?.specialization ||
                      roleLabels[user?.role]
                    : roleLabels[user?.role]}
                </p>
              </div>
            )}
          </button>
        ) : (
          <div
            title={collapsed ? user?.name || "User" : undefined}
            className={`flex items-center rounded-xl p-2 ${
              collapsed ? "justify-center" : "gap-3"
            }`}
          >
            <div className="shrink-0">
              <UserAvatar name={user?.name} />
            </div>

            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-gray-950">
                  {user?.name || "User"}
                </p>
                <p className="truncate text-xs text-gray-500">
                  {roleLabels[user?.role] || user?.role}
                </p>
              </div>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={handleLogout}
          title={collapsed ? "Logout" : undefined}
          aria-label={collapsed ? "Logout" : undefined}
          className={`mt-2 flex w-full items-center rounded-xl py-2.5 text-sm font-medium text-gray-600 transition hover:bg-red-50 hover:text-red-600 focus-visible:outline-2 focus-visible:outline-red-500 ${
            collapsed ? "justify-center px-2" : "gap-3 px-3"
          }`}
        >
          <svg
            className="h-5 w-5 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="1.8"
            aria-hidden="true"
          >
            <path d="M10 17l5-5-5-5M15 12H3" />
            <path d="M13 3h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5" />
          </svg>

          {!collapsed && <span>Logout</span>}
        </button>
      </div>

    </aside>
  );
};


export default AppSidebar;