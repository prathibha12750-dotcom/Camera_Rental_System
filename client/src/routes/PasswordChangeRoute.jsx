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

  if (
    user?.role === "PHOTOGRAPHER" &&
    user?.mustChangePassword
  ) {
    return (
      <Navigate
        to="/photographer/change-password"
        replace
      />
    );
  }

  return <Outlet />;
};

export default PasswordChangeRoute;