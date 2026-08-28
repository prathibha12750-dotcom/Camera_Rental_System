import {
  BrowserRouter,
  Link,
  Route,
  Routes,
} from "react-router-dom";

import Navbar from "../components/Navbar";

import Home from "../pages/Home";
import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import Unauthorized from "../pages/Unauthorized";

import CustomerHome from "../pages/customer/CustomerHome";
import CustomerProfile from "../pages/customer/CustomerProfile";
import PhotographerListing from "../pages/customer/PhotographerListing";
import PhotographerDetails from "../pages/customer/PhotographerDetails";
import PhotographerHome from "../pages/photographer/PhotographerHome";
import PhotographerProfile from "../pages/photographer/PhotographerProfile";
import PhotographerPortfolio from "../pages/photographer/PhotographerPortfolio";
import PhotographerAvailability from "../pages/photographer/PhotographerAvailability";
import AdminHome from "../pages/admin/AdminHome";

import ProtectedRoute from "./ProtectedRoute";
import RoleRoute from "./RoleRoute";

const NotFound = () => {
  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-gray-50 px-6 py-16">
      <div className="w-full max-w-lg rounded-3xl border border-gray-200 bg-white p-10 text-center shadow-lg">
        <p className="text-sm font-semibold uppercase tracking-wider text-orange-600">
          404 error
        </p>
        <h1 className="mt-2 text-3xl font-bold text-gray-950">Page not found</h1>
        <p className="mt-4 leading-7 text-gray-600">
          The page you are looking for does not exist or may have been moved.
        </p>
        <Link
          to="/"
          className="mt-8 inline-flex rounded-xl bg-orange-600 px-6 py-3 font-semibold text-white transition hover:bg-orange-700"
        >
          Go to Home
        </Link>
      </div>
    </main>
  );
};

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Navbar />

      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />

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

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>

          {/* Customer Routes */}
          <Route
               element={
              <RoleRoute
                allowedRoles={["CUSTOMER"]}
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
              element={<PhotographerListing />}
            />
            <Route
              path="/customer/photographers/:id"
              element={<PhotographerDetails />}
            />
            {/* prathibha routes end */}

          </Route>

          {/* Photographer Routes */}
          <Route
            element={
              <RoleRoute
                allowedRoles={["PHOTOGRAPHER"]}
              />
            }
          >

            {/* prathibha routes start */}
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
            {/* prathibha routes end */}

          </Route>

          {/* Staff Admin Routes */}
          <Route
            element={
              <RoleRoute
                allowedRoles={["STAFF_ADMIN"]}
              />
            }
          >
            <Route
              path="/admin"
              element={<AdminHome />}
            />
          </Route>

        </Route>

        {/* 404 */}
        <Route
          path="*"
          element={<NotFound />}
        />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;