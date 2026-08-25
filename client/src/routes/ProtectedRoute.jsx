import { Navigate, Outlet } from "react-router-dom";

import { useAuth } from "../context/useAuth";

import Loading from "../components/Loading";


const ProtectedRoute = () => {
  const {
    isAuthenticated,
    loading,
  } = useAuth();


  if (loading) {
    return <Loading />;
  }


  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }


  return <Outlet />;
};


export default ProtectedRoute;