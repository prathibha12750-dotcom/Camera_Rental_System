import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/useAuth";
import UserAvatar from "./UserAvatar";


const profileRoutes = {
  CUSTOMER: "/customer/profile",
  PHOTOGRAPHER: "/photographer/profile",
};


const AppHeader = ({
  onMenuClick,
  photographerIdentity = null,
}) => {

  const navigate = useNavigate();

  const { user } = useAuth();

  const profilePath =
    profileRoutes[user?.role];


  // ==========================================
  // PROFILE NAVIGATION
  // ==========================================

  const handleProfileClick = () => {

    if (profilePath) {
      navigate(profilePath);
    }

  };


  return (
    <header className="
      sticky
      top-0
      z-30
      flex
      h-16
      items-center
      justify-between
      border-b
      border-gray-200
      bg-white/95
      px-4
      backdrop-blur
      sm:px-6
      lg:px-8
    ">

      {/* ======================================
          LEFT SIDE
      ====================================== */}

      <div className="flex items-center gap-3">

        {/* Mobile Menu Button */}

        <button
          type="button"
          onClick={onMenuClick}
          className="
            inline-flex
            h-10
            w-10
            items-center
            justify-center
            rounded-xl
            border
            border-gray-200
            text-gray-600
            transition
            hover:bg-gray-50
            hover:text-gray-950
            focus:outline-none
            focus-visible:ring-2
            focus-visible:ring-orange-500
            lg:hidden
          "
          aria-label="Open navigation menu"
        >

          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="1.8"
            aria-hidden="true"
          >
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>

        </button>


        {/* Mobile Brand */}

        <div className="lg:hidden">

          <p className="
            text-sm
            font-bold
            tracking-tight
            text-gray-950
          ">
            Southern Camera Rental
          </p>

          <p className="
            hidden
            text-[11px]
            text-gray-500
            sm:block
          ">
            Rental & Booking System
          </p>

        </div>


        {/* Desktop Welcome */}

        <div className="hidden lg:block">

          <p className="
            text-sm
            font-semibold
            text-gray-950
          ">
            Welcome back,{" "}
            {user?.name?.split(" ")[0] ||
              "User"}
          </p>

          <p className="text-xs text-gray-500">
            Manage your rental and booking activity.
          </p>

        </div>

      </div>


      {/* ======================================
          PROFILE AVATAR
      ====================================== */}

      {profilePath ? (

        <button
          type="button"
          onClick={handleProfileClick}
          className="
            rounded-full
            focus:outline-none
            focus-visible:ring-2
            focus-visible:ring-orange-500
            focus-visible:ring-offset-2
          "
          aria-label="Open profile"
        >

          <UserAvatar
            name={user?.name}
            imageUrl={
              photographerIdentity?.profileImage ||
              ""
            }
            size="sm"
          />

        </button>

      ) : (

        <UserAvatar
          name={user?.name}
          size="sm"
        />

      )}

    </header>
  );
};


export default AppHeader;