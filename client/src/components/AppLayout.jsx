import {
  useEffect,
  useState,
} from "react";

import { Outlet } from "react-router-dom";

import { useAuth } from "../context/useAuth";
import api from "../services/api";

import AppHeader from "./AppHeader";
import AppSidebar from "./AppSidebar";


const AppLayout = () => {

  const { user } = useAuth();

  const [
    mobileMenuOpen,
    setMobileMenuOpen,
  ] = useState(false);

  const [
    photographerIdentity,
    setPhotographerIdentity,
  ] = useState(null);


  // ==========================================
  // LOAD PHOTOGRAPHER SIDEBAR IDENTITY
  // ==========================================
  //
  // Auth user contains:
  // name, email, role, status
  //
  // Photographer-specific fields such as
  // profileImage and specialization live in
  // the Photographer profile document.
  //
  // This request is only made for photographers.
  // ==========================================

  useEffect(() => {

    if (user?.role !== "PHOTOGRAPHER") {
      return undefined;
    }

    let ignore = false;


    const loadPhotographerIdentity =
      async () => {

        try {

          const response =
            await api.get(
              "/photographer/profile"
            );


          if (!ignore) {

            const photographer =
              response.data?.data?.photographer;


            setPhotographerIdentity({
              profileImage:
                photographer?.profileImage ||
                "",

              specialization:
                photographer?.specialization ||
                "",
            });

          }

        } catch (error) {

          // If an older photographer account does
          // not yet have a Photographer document,
          // simply use the initials fallback.
          //
          // Do not break the entire application shell.

          if (
            !ignore &&
            error.response?.status !== 404
          ) {

            console.error(
              "Failed to load photographer sidebar identity:",
              error
            );

          }

        }

      };


    loadPhotographerIdentity();


    return () => {
      ignore = true;
    };

  }, [user?.role]);


  // ==========================================
  // CLOSE MOBILE DRAWER WITH ESCAPE
  // ==========================================

  useEffect(() => {

    if (!mobileMenuOpen) {
      return undefined;
    }


    const handleEscape = (event) => {

      if (event.key === "Escape") {
        setMobileMenuOpen(false);
      }

    };


    window.addEventListener(
      "keydown",
      handleEscape
    );


    return () => {

      window.removeEventListener(
        "keydown",
        handleEscape
      );

    };

  }, [mobileMenuOpen]);


  return (
    <div className="min-h-screen bg-gray-50">

      {/* ======================================
          DESKTOP SIDEBAR
      ====================================== */}

      <div className="
        fixed
        inset-y-0
        left-0
        z-40
        hidden
        w-72
        border-r
        border-gray-200
        lg:block
      ">

        <AppSidebar
          photographerIdentity={
            photographerIdentity
          }
        />

      </div>


      {/* ======================================
          MOBILE SIDEBAR
      ====================================== */}

      {mobileMenuOpen && (

        <div className="
          fixed
          inset-0
          z-50
          lg:hidden
        ">

          {/* Overlay */}

          <button
            type="button"
            className="
              absolute
              inset-0
              bg-gray-950/40
            "
            onClick={() =>
              setMobileMenuOpen(false)
            }
            aria-label="Close navigation menu"
          />


          {/* Drawer */}

          <div className="
            relative
            h-full
            w-[min(18rem,85vw)]
            border-r
            border-gray-200
            bg-white
            shadow-xl
          ">

            {/* Close Button */}

            <div className="
              absolute
              right-3
              top-3
              z-10
            ">

              <button
                type="button"
                onClick={() =>
                  setMobileMenuOpen(false)
                }
                className="
                  inline-flex
                  h-9
                  w-9
                  items-center
                  justify-center
                  rounded-lg
                  text-gray-500
                  transition
                  hover:bg-gray-100
                  hover:text-gray-950
                  focus:outline-none
                  focus-visible:ring-2
                  focus-visible:ring-orange-500
                "
                aria-label="Close navigation menu"
              >

                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  aria-hidden="true"
                >
                  <path d="M6 6l12 12M18 6 6 18" />
                </svg>

              </button>

            </div>


            <AppSidebar
              photographerIdentity={
                photographerIdentity
              }
              onNavigate={() =>
                setMobileMenuOpen(false)
              }
            />

          </div>

        </div>

      )}


      {/* ======================================
          MAIN APPLICATION AREA
      ====================================== */}

      <div className="lg:pl-72">

        <AppHeader
          onMenuClick={() =>
            setMobileMenuOpen(true)
          }
          photographerIdentity={
            photographerIdentity
          }
        />


        <div className="min-w-0">

          <Outlet />

        </div>

      </div>

    </div>
  );
};


export default AppLayout;