import {
  Navigate,
  Outlet,
} from "react-router-dom";

import { useAuth } from "../context/useAuth";

const PasswordChangeRoute = () => {
  const {
    user,
    loading,
    isAuthenticated,
  } = useAuth();

  if (loading) {
    return null;
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  // ==========================================
  // FORCE TEMPORARY PASSWORD CHANGE
  // ==========================================

  if (user?.mustChangePassword) {
    if (user?.role === "PHOTOGRAPHER") {
      return (
        <Navigate
          to="/photographer/change-password"
          replace
        />
      );
    }

    if (user?.role === "CLERK") {
      return (
        <Navigate
          to="/clerk/change-password"
          replace
        />
      );
    }
  }

  return <Outlet />;
};

export default PasswordChangeRoute;