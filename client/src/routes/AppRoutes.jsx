import {
  BrowserRouter,
  Link,
  Route,
  Routes,
} from "react-router-dom";

import AppLayout from "../components/AppLayout";
import Navbar from "../components/Navbar";

import Home from "../pages/Home";

import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";

import Unauthorized from "../pages/Unauthorized";

import CustomerHome from "../pages/customer/CustomerHome";
import CustomerProfile from "../pages/customer/CustomerProfile";
import PhotographerListing from "../pages/customer/PhotographerListing";
import PhotographerDetails from "../pages/customer/PhotographerDetails";
import PhotographerBooking from "../pages/customer/PhotographerBooking";
import CustomerBookings from "../pages/customer/CustomerBookings";
import PhotographerApplication from "../pages/customer/PhotographerApplication";

import PhotographerHome from "../pages/photographer/PhotographerHome";
import PhotographerProfile from "../pages/photographer/PhotographerProfile";
import PhotographerPortfolio from "../pages/photographer/PhotographerPortfolio";
import PhotographerAvailability from "../pages/photographer/PhotographerAvailability";
import PhotographerBookings from "../pages/photographer/PhotographerBookings";
import PhotographerChangePassword from "../pages/photographer/PhotographerChangePassword";

import AdminHome from "../pages/admin/AdminHome";
import AdminPhotographerApplications from "../pages/admin/AdminPhotographerApplications";

import ProtectedRoute from "./ProtectedRoute";
import RoleRoute from "./RoleRoute";
import PasswordChangeRoute from "./PasswordChangeRoute";


// ==========================================
// 404 PAGE
// ==========================================

// import start by Abilash

import AdminLayout from "../components/admin/AdminLayout";
import Users from "../pages/admin/Users";
import Invoices from "../pages/admin/Invoices";
import Payments from "../pages/admin/Payments";
import Deposits from "../pages/admin/Deposits";
import Refunds from "../pages/admin/Refunds";
import Reports from "../pages/admin/Reports";
import Notifications from "../pages/admin/Notifications";

// import end by Abilash

const NotFound = () => {

  return (
    <main className="
      flex
      min-h-[calc(100vh-4rem)]
      items-center
      justify-center
      bg-gray-50
      px-6
      py-16
    ">

      <div className="
        w-full
        max-w-lg
        rounded-3xl
        border
        border-gray-200
        bg-white
        p-10
        text-center
        shadow-lg
      ">

        <p className="
          text-sm
          font-semibold
          uppercase
          tracking-wider
          text-orange-600
        ">
          404 error
        </p>


        <h1 className="
          mt-2
          text-3xl
          font-bold
          text-gray-950
        ">
          Page not found
        </h1>


        <p className="
          mt-4
          leading-7
          text-gray-600
        ">
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

      {/* Public Navbar
          Automatically hides for
          authenticated users.
      */}

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

              {/* prathibha routes start */}

              <Route
                path="/customer"
                element={<CustomerHome />}
              />


              <Route
                path="/customer/profile"
                element={<CustomerProfile />}
              />


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


              <Route
                path="/customer/bookings"
                element={
                  <CustomerBookings />
                }
              />

              <Route
                path="/customer/photographer-application"
                element={
                  <PhotographerApplication />
                }
              />

              {/* prathibha routes end */}

            </Route>


            {/* ===============================
                PHOTOGRAPHER ROUTES
            =============================== */}

            <Route
              element={
                <RoleRoute
                  allowedRoles={["PHOTOGRAPHER"]}
                />
              }
            >
              {/* Photographer can access this before
                  completing temporary password change */}
              <Route
                path="/photographer/change-password"
                element={<PhotographerChangePassword />}
              />

              {/* All normal photographer routes require
                  temporary password change to be completed */}
              <Route element={<PasswordChangeRoute />}>
                <Route
                  path="/photographer"
                  element={<PhotographerHome />}
                />

                <Route
                  path="/photographer/profile"
                  element={<PhotographerProfile />}
                />

                <Route
                  path="/photographer/portfolio"
                  element={<PhotographerPortfolio />}
                />

                <Route
                  path="/photographer/availability"
                  element={<PhotographerAvailability />}
                />

                <Route
                  path="/photographer/bookings"
                  element={<PhotographerBookings />}
                />
              </Route>
            </Route>


            {/* ===============================
                STAFF ADMIN ROUTES
            =============================== */}

            <Route
              element={
                <RoleRoute
                  allowedRoles={["STAFF_ADMIN"]}
                />
              }
            >
              <Route element={<AdminLayout />}>
                <Route
                  path="/admin"
                  element={<AdminHome />}
                />

                <Route
                  path="/admin/users"
                  element={<Users />}
                />

                <Route
                  path="/admin/invoices"
                  element={<Invoices />}
                />

                <Route
                  path="/admin/payments"
                  element={<Payments />}
                />

                <Route
                  path="/admin/deposits"
                  element={<Deposits />}
                />

                <Route
                  path="/admin/refunds"
                  element={<Refunds />}
                />

                <Route
                  path="/admin/reports"
                  element={<Reports />}
                />

                <Route
                  path="/admin/notifications"
                  element={<Notifications />}
                />

                <Route
                  path="/admin/photographer-applications"
                  element={<AdminPhotographerApplications />}
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
              {/* prathibha routes start */}
              <Route
                path="/admin"
                element={<AdminHome />}
              />

              <Route 
                path="/admin/users"
                element={<Users />}
              />

              <Route 
                path="/admin/invoices" 
                element={<Invoices />} 
              />

              <Route 
                path="/admin/payments" 
                element={<Payments />} 
              />

              <Route
               path="/admin/deposits"
               element={<Deposits />} 
              />

              <Route
               path="/admin/refunds"
               element={<Refunds />} 
              />

              <Route 
               path="/admin/reports" 
               element={<Reports />} 
              />

              <Route
                path="/admin/notifications"
                element={<Notifications />}
              />
            </Route>

            
            {/*Route adding ends by Abilash*/}
            
              <Route
                path="/admin/photographer-applications"
                element={
                  <AdminPhotographerApplications />
                }
              />
              {/* prathibha routes end */}
              
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