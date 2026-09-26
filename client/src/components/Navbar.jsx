import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import UserAvatar from "./UserAvatar";
import NotificationBell from "./NotificationBell";

const Navbar = () => {
  const {
    user,
    isAuthenticated,
    loading,
    logout,
  } = useAuth();

  const navigate = useNavigate();

  const [accountOpen, setAccountOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const accountRef = useRef(null);
  const searchRef = useRef(null);


  // ==========================================
  // CLOSE PANELS WHEN CLICKING OUTSIDE
  // ==========================================

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        accountRef.current &&
        !accountRef.current.contains(event.target)
      ) {
        setAccountOpen(false);
      }

      if (
        searchRef.current &&
        !searchRef.current.contains(event.target)
      ) {
        setSearchOpen(false);
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
  // PUBLIC SEARCH
  // ==========================================

  const handleSearch = (event) => {
    event.preventDefault();

    const term =
      searchTerm.trim().toLowerCase();

    if (!term) {
      return;
    }

    const equipmentKeywords = [
      "camera",
      "cameras",
      "lens",
      "lenses",
      "equipment",
      "gear",
      "studio",
      "lighting",
      "light",
    ];

    const photographerKeywords = [
      "photographer",
      "photographers",
      "photography",
      "photo",
    ];

    if (
      equipmentKeywords.some((keyword) =>
        term.includes(keyword)
      )
    ) {
      window.location.href = "/#equipment";
    } else if (
      photographerKeywords.some((keyword) =>
        term.includes(keyword)
      )
    ) {
      window.location.href =
        "/photographers";
    } else {
      window.location.href = "/#discover";
    }

    setSearchOpen(false);
  };

  // ==========================================
  // HIDE PUBLIC NAVBAR FOR OPERATIONAL ROLES
  // ==========================================

  if (
    !loading &&
    isAuthenticated &&
    user?.role !== "CUSTOMER"
  ) {
    return null;
  }

  const handleLogout = async () => {
    await logout();

    setAccountOpen(false);

    navigate("/", {
      replace: true,
    });
  };

  return (
    <>
      {/* ==========================================
          TOP INFORMATION BAR
      ========================================== */}

      <div className="bg-gray-950 px-4 py-2 text-center text-[11px] font-semibold tracking-wide text-gray-300 sm:text-xs">

        CAMERA EQUIPMENT RENTAL

        <span className="mx-2 text-orange-500">
          •
        </span>

        PHOTOGRAPHER DISCOVERY

        <span className="mx-2 hidden text-orange-500 sm:inline">
          •
        </span>

        <span className="hidden sm:inline">
          LOGIN REQUIRED TO RENT OR BOOK
        </span>

      </div>


      {/* ==========================================
          NAVIGATION
      ========================================== */}

      <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur-xl">

        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-6 lg:px-8">


          {/* ==========================================
              LOGO
          ========================================== */}

          <Link
            to="/"
            className="flex items-center gap-3"
          >
            <img
              src="/scr-logo.jpg"
              alt="Southern Camera Rent"
              className="h-14 w-auto object-contain"
            />

            <div className="hidden sm:block">
              <p className="text-sm font-black tracking-tight text-gray-950">
                Southern Camera Rent
              </p>

              <p className="text-[11px] text-gray-500">
                Equipment & Photographer Services
              </p>
            </div>
          </Link>



          {/* ==========================================
              RIGHT SIDE
          ========================================== */}

          <div className="flex items-center gap-2 lg:gap-5">


      {/* ==========================================
          DESKTOP NAVIGATION
      ========================================== */}

      <nav className="hidden items-center gap-7 lg:flex">

        {/* Home / Discover */}
        {isAuthenticated &&
        user?.role === "CUSTOMER" ? (
          <Link
            to="/"
            className="text-sm font-semibold text-gray-600 transition hover:text-orange-600"
          >
            Home
          </Link>
        ) : (
          <a
            href="/#discover"
            className="text-sm font-semibold text-gray-600 transition hover:text-orange-600"
          >
            Discover
          </a>
        )}


        {/* Equipment */}
        <a
          href="/customer/equipment"
          className="text-sm font-semibold text-gray-600 transition hover:text-orange-600"
        >
          Equipment
        </a>


        {/* Photographers */}
        <Link
          to="/photographers"
          className="text-sm font-semibold text-gray-600 transition hover:text-orange-600"
        >
          Photographers
        </Link>


        {/* Customer / Guest specific links */}
        {isAuthenticated && user?.role === "CUSTOMER" ? (
          <>
            <Link
              to="/customer/bookings"
              className="text-sm font-semibold text-gray-600 transition hover:text-orange-600"
            >
              My Bookings
            </Link>

            <Link
              to="/customer/rentals"
              className="text-sm font-semibold text-gray-600 transition hover:text-orange-600"
            >
              My Rentals
            </Link>
          </>
        ) : (
          <a
            href="/#how-it-works"
            className="text-sm font-semibold text-gray-600 transition hover:text-orange-600"
          >
            How It Works
          </a>
        )}

    </nav>



            {/* ==========================================
                SEARCH
            ========================================== */}

            <div
              ref={searchRef}
              className="relative"
            >

              <button
                type="button"
                aria-label="Search"
                aria-expanded={searchOpen}
                onClick={() => {
                  setSearchOpen((previous) => !previous);
                  setAccountOpen(false);
                }}
                className="flex h-10 w-10 items-center justify-center rounded-full text-gray-700 transition hover:bg-gray-100 hover:text-orange-600"
              >

                {/* Search SVG */}
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-5 w-5"
                  aria-hidden="true"
                >
                  <circle
                    cx="11"
                    cy="11"
                    r="7"
                  />

                  <path d="m20 20-3.5-3.5" />
                </svg>

              </button>


              {/* Search Dropdown */}
              {searchOpen && (

                <div className="absolute right-0 top-12 w-[300px] rounded-2xl border border-gray-200 bg-white p-4 shadow-xl sm:w-[360px]">

                  <p className="text-sm font-bold text-gray-950">
                    Search & Discover
                  </p>

                  <p className="mt-1 text-xs leading-5 text-gray-500">
                    Search equipment categories or photographers.
                  </p>


                  <form
                    onSubmit={handleSearch}
                    className="mt-4"
                  >

                    <div className="flex overflow-hidden rounded-xl border border-gray-300 focus-within:border-orange-500 focus-within:ring-4 focus-within:ring-orange-100">

                      <input
                        type="search"
                        value={searchTerm}
                        onChange={(event) =>
                          setSearchTerm(
                            event.target.value
                          )
                        }
                        placeholder="Camera, lens, photographer..."
                        autoFocus
                        className="min-w-0 flex-1 px-4 py-3 text-sm text-gray-900 outline-none placeholder:text-gray-400"
                      />

                      <button
                        type="submit"
                        className="bg-gray-950 px-4 text-sm font-semibold text-white transition hover:bg-orange-600"
                      >
                        Search
                      </button>

                    </div>

                  </form>


                  {/* Quick Discovery */}
                  <div className="mt-4">

                    <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                      Quick Discovery
                    </p>

                    <div className="mt-2 flex flex-wrap gap-2">

                      <a
                        href="/#equipment"
                        onClick={() =>
                          setSearchOpen(false)
                        }
                        className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-orange-50 hover:text-orange-700"
                      >
                        Cameras
                      </a>

                      <a
                        href="/#equipment"
                        onClick={() =>
                          setSearchOpen(false)
                        }
                        className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-orange-50 hover:text-orange-700"
                      >
                        Lenses
                      </a>

                      <a
                        href="/#equipment"
                        onClick={() =>
                          setSearchOpen(false)
                        }
                        className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-orange-50 hover:text-orange-700"
                      >
                        Studio Gear
                      </a>

                      <a
                        href="/photographers"
                        onClick={() =>
                          setSearchOpen(false)
                        }
                        className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-orange-50 hover:text-orange-700"
                      >
                        Photographers
                      </a>

                    </div>

                  </div>

                </div>

              )}

            </div>



            {/* Divider */}
            <div className="hidden h-6 w-px bg-gray-200 sm:block" />

            {/* ==========================================
                CUSTOMER NOTIFICATIONS
            ========================================== */}

            {isAuthenticated &&
            user?.role === "CUSTOMER" && (
              <NotificationBell />
            )}

            {/* ==========================================
                ACCOUNT
            ========================================== */}

            <div
              ref={accountRef}
              className="relative"
            >

              <button
                type="button"
                aria-label="Account"
                aria-expanded={accountOpen}
                onClick={() => {
                  setAccountOpen((previous) => !previous);
                  setSearchOpen(false);
                }}
                className="flex h-10 w-10 items-center justify-center rounded-full text-gray-700 transition hover:bg-gray-100 hover:text-orange-600"
              >

                {/* User SVG */}
                  {isAuthenticated &&
                  user?.role === "CUSTOMER" ? (
                    <UserAvatar
                      name={user?.name}
                      size="md"
                    />
                  ) : (
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      className="h-5 w-5"
                      aria-hidden="true"
                    >
                      <circle
                        cx="12"
                        cy="8"
                        r="4"
                      />

                      <path d="M4 21a8 8 0 0 1 16 0" />
                    </svg>
                  )}

              </button>


              {/* Account Dropdown */}
              {accountOpen && (

                <div className="absolute right-0 top-12 w-64 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">

                  {loading ? (

                    <div className="p-5">

                      <div className="h-4 w-24 animate-pulse rounded bg-gray-100" />

                      <div className="mt-3 h-9 animate-pulse rounded-lg bg-gray-100" />

                    </div>

                      ) : isAuthenticated &&
                      user?.role === "CUSTOMER" ? (

                        <div>

                          {/* ==================================
                              CUSTOMER IDENTITY
                          ================================== */}

                          <div className="border-b border-gray-100 px-4 py-4">

                            <div className="flex items-center gap-3">

                              <UserAvatar
                                name={user?.name}
                                size="md"
                              />

                              <div className="min-w-0">

                                <p className="truncate text-sm font-semibold text-gray-950">
                                  {user?.name || "Customer"}
                                </p>

                                <p className="truncate text-xs text-gray-500">
                                  {user?.email || ""}
                                </p>

                              </div>

                            </div>

                          </div>


                          {/* ==================================
                              CUSTOMER LINKS
                          ================================== */}

                          <div className="p-2">

                            <Link
                              to="/customer"
                              onClick={() =>
                                setAccountOpen(false)
                              }
                              className="flex rounded-xl px-3 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 hover:text-orange-600"
                            >
                              Dashboard
                            </Link>


                            <Link
                              to="/customer/profile"
                              onClick={() =>
                                setAccountOpen(false)
                              }
                              className="flex rounded-xl px-3 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 hover:text-orange-600"
                            >
                              My Profile
                            </Link>


                            <Link
                              to="/customer/bookings"
                              onClick={() =>
                                setAccountOpen(false)
                              }
                              className="flex rounded-xl px-3 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 hover:text-orange-600"
                            >
                              My Bookings
                            </Link>

                            <Link
                              to="/customer/billing"
                              onClick={() =>
                                setAccountOpen(false)
                              }
                              className="flex rounded-xl px-3 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 hover:text-orange-600"
                            >
                              Invoices & Payments
                            </Link>

                          </div>

{/* ==================================
    PHOTOGRAPHER APPLICATION
================================== */}

<div className="border-t border-gray-100 p-2">

  <Link
    to="/customer/photographer-application"
    onClick={() =>
      setAccountOpen(false)
    }
    className="group flex rounded-xl px-3 py-2.5 transition hover:bg-orange-50"
  >

    <div>

      <p className="text-sm font-medium text-gray-700 transition group-hover:text-orange-700">
        Become a Photographer
      </p>

      <p className="mt-0.5 text-xs text-gray-400">
        Apply to join our photographer network
      </p>

    </div>

  </Link>

</div>


                          {/* ==================================
                              LOGOUT
                          ================================== */}

                          <div className="border-t border-gray-100 p-2">

                            <button
                              type="button"
                              onClick={handleLogout}
                              className="flex w-full rounded-xl px-3 py-2.5 text-left text-sm font-medium text-red-600 transition hover:bg-red-50"
                            >
                              Logout
                            </button>

                          </div>

                        </div>

                      ) : (

                    <div className="p-5">

                      <p className="font-bold text-gray-950">
                        Your Account
                      </p>

                      <p className="mt-1 text-xs leading-5 text-gray-500">
                        Login or register to rent equipment
                        and book photographers.
                      </p>


                      <Link
                        to="/login"
                        onClick={() =>
                          setAccountOpen(false)
                        }
                        className="mt-4 flex w-full items-center justify-center rounded-xl bg-gray-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-black"
                      >
                        Login
                      </Link>


                      <Link
                        to="/register"
                        onClick={() =>
                          setAccountOpen(false)
                        }
                        className="mt-2 flex w-full items-center justify-center rounded-xl border border-gray-300 px-4 py-3 text-sm font-semibold text-gray-700 transition hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700"
                      >
                        Create Customer Account
                      </Link>


                      <p className="mt-4 text-center text-[11px] leading-5 text-gray-400">
                        Public visitors can discover services
                        without an account.
                      </p>

                    </div>

                  )}

                </div>

              )}

            </div>

          </div>

        </div>

      </nav>
    </>
  );
};

export default Navbar;