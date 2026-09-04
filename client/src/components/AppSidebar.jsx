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
  ],


  STAFF_ADMIN: [
    {
      label: "Dashboard",
      to: "/admin",
      end: true,
      icon: "home",
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

      {/* ======================================
          BRAND
      ====================================== */}

      <div className="flex h-20 items-center border-b border-gray-200 px-5">

        <NavLink
          to={
            navigation[0]?.to ||
            "/"
          }
          onClick={onNavigate}
          className="
            flex items-center gap-3 rounded-xl
            focus:outline-none
            focus-visible:ring-2
            focus-visible:ring-orange-500
            focus-visible:ring-offset-2
          "
        >

          <div className="
            flex h-10 w-10
            items-center justify-center
            rounded-xl
            bg-orange-600
            text-xs
            font-bold
            text-white
            shadow-sm
          ">
            SCR
          </div>


          <div className="min-w-0">

            <p className="
              truncate
              text-sm
              font-bold
              tracking-tight
              text-gray-950
            ">
              Southern Camera Rental
            </p>

            <p className="
              truncate
              text-[11px]
              text-gray-500
            ">
              Rental & Booking System
            </p>

          </div>

        </NavLink>

      </div>


      {/* ======================================
          NAVIGATION
      ====================================== */}

      <nav
        className="
          flex-1
          space-y-1
          overflow-y-auto
          px-3
          py-5
        "
        aria-label="Main navigation"
      >

        {navigation.map((item) => (

          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              [
                `
                group
                flex
                items-center
                gap-3
                rounded-xl
                px-3
                py-2.5
                text-sm
                font-medium
                transition
                focus:outline-none
                focus-visible:ring-2
                focus-visible:ring-orange-500
                focus-visible:ring-offset-2
                `,
                isActive
                  ? "bg-orange-50 text-orange-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-950",
              ].join(" ")
            }
          >

            <Icon name={item.icon} />

            <span>
              {item.label}
            </span>

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
            className="
              flex
              w-full
              items-center
              gap-3
              rounded-xl
              p-2.5
              text-left
              transition
              hover:bg-gray-50
              focus:outline-none
              focus-visible:ring-2
              focus-visible:ring-orange-500
              focus-visible:ring-offset-2
            "
          >

            <UserAvatar
              name={user?.name}
              imageUrl={
                photographerIdentity?.profileImage ||
                ""
              }
            />


            <div className="min-w-0 flex-1">

              <p className="
                truncate
                text-sm
                font-semibold
                text-gray-950
              ">
                {user?.name || "User"}
              </p>


              <p className="
                truncate
                text-xs
                text-gray-500
              ">

                {user?.role === "PHOTOGRAPHER"
                  ? photographerIdentity?.specialization ||
                    roleLabels[user?.role]
                  : roleLabels[user?.role]}

              </p>

            </div>

          </button>

        ) : (

          <div className="
            flex
            items-center
            gap-3
            rounded-xl
            p-2.5
          ">

            <UserAvatar
              name={user?.name}
            />


            <div className="min-w-0 flex-1">

              <p className="
                truncate
                text-sm
                font-semibold
                text-gray-950
              ">
                {user?.name || "User"}
              </p>

              <p className="
                truncate
                text-xs
                text-gray-500
              ">
                {roleLabels[user?.role] ||
                  user?.role}
              </p>

            </div>

          </div>

        )}


        {/* ==================================
            LOGOUT
        ================================== */}

        <button
          type="button"
          onClick={handleLogout}
          className="
            mt-2
            flex
            w-full
            items-center
            gap-3
            rounded-xl
            px-3
            py-2.5
            text-sm
            font-medium
            text-gray-600
            transition
            hover:bg-red-50
            hover:text-red-600
            focus:outline-none
            focus-visible:ring-2
            focus-visible:ring-red-500
            focus-visible:ring-offset-2
          "
        >

          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="1.8"
            aria-hidden="true"
          >

            <path d="M10 17l5-5-5-5M15 12H3" />

            <path d="M13 3h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5" />

          </svg>

          Logout

        </button>

      </div>

    </aside>
  );
};


export default AppSidebar;