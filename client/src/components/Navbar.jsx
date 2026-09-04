import { Link } from "react-router-dom";

import { useAuth } from "../context/useAuth";

const Navbar = () => {
  const {
    isAuthenticated,
    loading,
  } = useAuth();


  // ==========================================
  // AUTHENTICATED USERS USE AppLayout
  // ==========================================

  if (!loading && isAuthenticated) {
    return null;
  }


  return (
    <nav className="
      sticky
      top-0
      z-50
      border-b
      border-gray-200
      bg-white/95
      backdrop-blur
    ">

      <div className="
        mx-auto
        flex
        h-16
        max-w-7xl
        items-center
        justify-between
        px-6
        lg:px-8
      ">

        {/* ==================================
            LOGO
        ================================== */}

        <Link
          to="/"
          className="
            flex
            items-center
            gap-3
            rounded-xl
            focus:outline-none
            focus-visible:ring-2
            focus-visible:ring-orange-500
            focus-visible:ring-offset-2
          "
        >

          <div className="
            flex
            h-9
            w-9
            items-center
            justify-center
            rounded-lg
            bg-orange-600
            text-sm
            font-bold
            text-white
            shadow-sm
          ">
            SCR
          </div>


          <div className="hidden sm:block">

            <p className="
              text-sm
              font-bold
              tracking-tight
              text-gray-950
            ">
              Southern Camera Rental
            </p>

            <p className="
              text-[11px]
              text-gray-500
            ">
              Rental & Booking System
            </p>

          </div>

        </Link>


        {/* ==================================
            GUEST LINKS
        ================================== */}

        {!loading &&
          !isAuthenticated && (

          <div className="flex items-center gap-2">

            <Link
              to="/login"
              className="
                rounded-lg
                px-4
                py-2.5
                text-sm
                font-medium
                text-gray-600
                transition
                hover:bg-gray-50
                hover:text-gray-950
                focus:outline-none
                focus-visible:ring-2
                focus-visible:ring-orange-500
              "
            >
              Login
            </Link>


            <Link
              to="/register"
              className="
                rounded-lg
                bg-orange-600
                px-5
                py-2.5
                text-sm
                font-semibold
                text-white
                shadow-sm
                transition
                hover:bg-orange-700
                focus:outline-none
                focus-visible:ring-2
                focus-visible:ring-orange-500
                focus-visible:ring-offset-2
              "
            >
              Register
            </Link>

          </div>

        )}


        {/* ==================================
            AUTH LOADING
        ================================== */}

        {loading && (

          <div
            className="
              h-9
              w-28
              animate-pulse
              rounded-lg
              bg-gray-100
            "
            aria-hidden="true"
          />

        )}

      </div>

    </nav>
  );
};


export default Navbar;