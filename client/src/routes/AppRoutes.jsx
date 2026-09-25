// ==========================================
// REACT ROUTER
// ==========================================

import {
  BrowserRouter,
  Link,
  Route,
  Routes,
} from "react-router-dom";


// ==========================================
// LAYOUTS
// ==========================================

import AppLayout from "../components/AppLayout";
import Navbar from "../components/Navbar";
import AdminLayout from "../components/admin/AdminLayout";


// ==========================================
// PUBLIC PAGES
// ==========================================

import Home from "../pages/Home";
import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import Unauthorized from "../pages/Unauthorized";


// ==========================================
// CUSTOMER PAGES
// ==========================================

import CustomerHome from "../pages/customer/CustomerHome";
import CustomerProfile from "../pages/customer/CustomerProfile";
import PhotographerListing from "../pages/customer/PhotographerListing";
import PhotographerDetails from "../pages/customer/PhotographerDetails";
import PhotographerBooking from "../pages/customer/PhotographerBooking";
import CustomerBookings from "../pages/customer/CustomerBookings";
import PhotographerApplication from "../pages/customer/PhotographerApplication";


// ==========================================
// CUSTOMER EQUIPMENT / RENTAL PAGES
// Added by Thasindu
// ==========================================

import EquipmentBrowse from "../pages/customer/EquipmentBrowse";
import EquipmentDetails from "../pages/customer/EquipmentDetails";
import MyRentals from "../pages/customer/MyRentals";


// ==========================================
// PHOTOGRAPHER PAGES
// ==========================================

import PhotographerHome from "../pages/photographer/PhotographerHome";
import PhotographerProfile from "../pages/photographer/PhotographerProfile";
import PhotographerPortfolio from "../pages/photographer/PhotographerPortfolio";
import PhotographerAvailability from "../pages/photographer/PhotographerAvailability";
import PhotographerBookings from "../pages/photographer/PhotographerBookings";
import PhotographerChangePassword from "../pages/photographer/PhotographerChangePassword";


// ==========================================
// CLERK PAGES
// ==========================================

import ClerkHome from "../pages/clerk/ClerkHome";
import ClerkChangePassword from "../pages/clerk/ClerkChangePassword";
import ClerkEquipment from "../pages/clerk/ClerkEquipment";


// ==========================================
// ADMIN PAGES
// ==========================================

import AdminHome from "../pages/admin/AdminHome";
import AdminPhotographerApplications from "../pages/admin/AdminPhotographerApplications";

import Users from "../pages/admin/Users";
import Invoices from "../pages/admin/Invoices";
import Payments from "../pages/admin/Payments";
import Deposits from "../pages/admin/Deposits";
import Refunds from "../pages/admin/Refunds";
import Reports from "../pages/admin/Reports";
import Notifications from "../pages/admin/Notifications";


// ==========================================
// ADMIN EQUIPMENT / RENTAL PAGES
// Added by Thasindu
// ==========================================

import EquipmentManagement from "../pages/admin/EquipmentManagement";
import RentalManagement from "../pages/admin/RentalManagement";


// ==========================================
// ROUTE GUARDS
// ==========================================

import ProtectedRoute from "./ProtectedRoute";
import RoleRoute from "./RoleRoute";
import PasswordChangeRoute from "./PasswordChangeRoute";


// ==========================================
// 404 PAGE
// ==========================================

const NotFound = () => {

  return (

    <main
      className="
        flex
        min-h-[calc(100vh-4rem)]
        items-center
        justify-center
        bg-gray-50
        px-6
        py-16
      "
    >

      <div
        className="
          w-full
          max-w-lg
          rounded-3xl
          border
          border-gray-200
          bg-white
          p-10
          text-center
          shadow-lg
        "
      >

        <p
          className="
            text-sm
            font-semibold
            uppercase
            tracking-wider
            text-orange-600
          "
        >
          404 error
        </p>


        <h1
          className="
            mt-2
            text-3xl
            font-bold
            text-gray-950
          "
        >
          Page not found
        </h1>


        <p
          className="
            mt-4
            leading-7
            text-gray-600
          "
        >
          The page you are looking for does not
          exist or may have been moved.
        </p>


        <Link
          to="/"
          className="
            mt-8
            inline-flex
            rounded-xl
            bg-orange-600
            px-6
            py-3
            font-semibold
            text-white
            transition
            hover:bg-orange-700
          "
        >
          Go to Home
        </Link>

      </div>

    </main>

  );

};


// ==========================================
// APPLICATION ROUTES
// ==========================================

const AppRoutes = () => {

  return (

    <BrowserRouter>

      <Navbar />


      <Routes>

        {/* ==================================
            PUBLIC ROUTES
        ================================== */}

        <Route
          path="/"
          element={<Home />}
        />


        <Route
          path="/login"
          element={<Login />}
        />


        <Route
          path="/register"
          element={<Register />}
        />


        <Route
          path="/unauthorized"
          element={<Unauthorized />}
        />


        {/* ==================================
            PUBLIC PHOTOGRAPHER DISCOVERY
        ================================== */}

        <Route
          path="/photographers"
          element={<PhotographerListing />}
        />


        <Route
          path="/photographers/:id"
          element={<PhotographerDetails />}
        />


        {/* ==================================
            PROTECTED ROUTES
        ================================== */}

        <Route element={<ProtectedRoute />}>


          {/* =================================
              AUTHENTICATED APPLICATION SHELL
          ================================= */}

          <Route element={<AppLayout />}>


            {/* ===============================
                CUSTOMER ROUTES
            =============================== */}

            <Route
              element={
                <RoleRoute
                  allowedRoles={[
                    "CUSTOMER",
                  ]}
                />
              }
            >

              {/* Customer Dashboard */}

              <Route
                path="/customer"
                element={<CustomerHome />}
              />


              {/* Customer Profile */}

              <Route
                path="/customer/profile"
                element={<CustomerProfile />}
              />


              {/* Photographer Discovery */}

              <Route
                path="/customer/photographers"
                element={
                  <PhotographerListing />
                }
              />


              <Route
                path="/customer/photographers/:id"
                element={
                  <PhotographerDetails />
                }
              />


              <Route
                path="/customer/photographers/:id/book"
                element={
                  <PhotographerBooking />
                }
              />


              {/* Customer Photographer Bookings */}

              <Route
                path="/customer/bookings"
                element={
                  <CustomerBookings />
                }
              />


              {/* Photographer Application */}

              <Route
                path="/customer/photographer-application"
                element={
                  <PhotographerApplication />
                }
              />


              {/* =============================
                  EQUIPMENT ROUTES
                  Added by Thasindu
              ============================= */}

              <Route
                path="/customer/equipment"
                element={
                  <EquipmentBrowse />
                }
              />


              <Route
                path="/customer/equipment/:id"
                element={
                  <EquipmentDetails />
                }
              />


              {/* =============================
                  CUSTOMER RENTAL ROUTES
                  Added by Thasindu
              ============================= */}

              <Route
                path="/customer/rentals"
                element={
                  <MyRentals />
                }
              />

            </Route>


            {/* ===============================
                PHOTOGRAPHER ROUTES
            =============================== */}

            <Route
              element={
                <RoleRoute
                  allowedRoles={[
                    "PHOTOGRAPHER",
                  ]}
                />
              }
            >

              {/* Photographer can access this
                  before changing temporary password */}

              <Route
                path="/photographer/change-password"
                element={
                  <PhotographerChangePassword />
                }
              />


              {/* All normal photographer routes
                  require password change completion */}

              <Route
                element={
                  <PasswordChangeRoute />
                }
              >

                <Route
                  path="/photographer"
                  element={
                    <PhotographerHome />
                  }
                />


                <Route
                  path="/photographer/profile"
                  element={
                    <PhotographerProfile />
                  }
                />


                <Route
                  path="/photographer/portfolio"
                  element={
                    <PhotographerPortfolio />
                  }
                />


                <Route
                  path="/photographer/availability"
                  element={
                    <PhotographerAvailability />
                  }
                />


                <Route
                  path="/photographer/bookings"
                  element={
                    <PhotographerBookings />
                  }
                />

              </Route>

            </Route>


            {/* ===============================
                CLERK ROUTES
            =============================== */}

            <Route
              element={
                <RoleRoute
                  allowedRoles={[
                    "CLERK",
                  ]}
                />
              }
            >

              {/* Clerk can access this before
                  changing temporary password */}

              <Route
                path="/clerk/change-password"
                element={
                  <ClerkChangePassword />
                }
              />

              {/* All normal Clerk routes require
                  password change completion */}

              <Route
                element={
                  <PasswordChangeRoute />
                }
              >

               <Route
                 path="/clerk"
                 element={
                  <ClerkHome />
                 }
               />

                <Route
                  path="/clerk/rentals"
                  element={
                    <RentalManagement />
                  }
                />

                <Route
                  path="/clerk/equipment"
                  element={
                    <ClerkEquipment />
                  }
                />

                <Route
                  path="/clerk/deposits"
                  element={
                    <Deposits />
                  }
                />

                <Route
                  path="/clerk/refunds"
                  element={<Refunds />}
                />

              </Route>

            </Route>


            {/* ===============================
                STAFF ADMIN ROUTES
            =============================== */}

            <Route
              element={
                <RoleRoute
                  allowedRoles={[
                    "STAFF_ADMIN",
                  ]}
                />
              }
            >

              <Route
                element={
                  <AdminLayout />
                }
              >

                {/* Admin Dashboard */}

                <Route
                  path="/admin"
                  element={
                    <AdminHome />
                  }
                />


                {/* User Management */}

                <Route
                  path="/admin/users"
                  element={
                    <Users />
                  }
                />


                {/* Invoice Management */}

                <Route
                  path="/admin/invoices"
                  element={
                    <Invoices />
                  }
                />


                {/* Payment Management */}

                <Route
                  path="/admin/payments"
                  element={
                    <Payments />
                  }
                />


                {/* Deposit Management */}

                <Route
                  path="/admin/deposits"
                  element={
                    <Deposits />
                  }
                />


                {/* Refund Management */}

                <Route
                  path="/admin/refunds"
                  element={
                    <Refunds />
                  }
                />


                {/* Reports */}

                <Route
                  path="/admin/reports"
                  element={
                    <Reports />
                  }
                />


                {/* Notifications */}

                <Route
                  path="/admin/notifications"
                  element={
                    <Notifications />
                  }
                />


                {/* Photographer Applications */}

                <Route
                  path="/admin/photographer-applications"
                  element={
                    <AdminPhotographerApplications />
                  }
                />


                {/* =============================
                    EQUIPMENT MANAGEMENT
                    Added by Thasindu
                ============================= */}

                <Route
                  path="/admin/equipment"
                  element={
                    <EquipmentManagement />
                  }
                />


                {/* =============================
                    RENTAL MANAGEMENT
                    Added by Thasindu
                ============================= */}

                <Route
                  path="/admin/rentals"
                  element={
                    <RentalManagement />
                  }
                />

              </Route>

            </Route>


          </Route>


        </Route>


        {/* ==================================
            404
        ================================== */}

        <Route
          path="*"
          element={<NotFound />}
        />


      </Routes>


    </BrowserRouter>

  );

};


export default AppRoutes;