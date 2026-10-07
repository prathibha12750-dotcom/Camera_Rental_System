import {
  Navigate,
  Outlet,
} from "react-router-dom";

import {
  useEffect,
  useState,
} from "react";

import { useAuth } from "../context/useAuth";
import Loading from "../components/Loading";

import {
  getMySubscription,
} from "../services/photographerSubscriptionService";


const PhotographerSubscriptionRoute = () => {
  const {
    user,
    loading: authLoading,
  } = useAuth();

  const [checkingSubscription, setCheckingSubscription] =
    useState(true);

  const [subscriptionExpired, setSubscriptionExpired] =
    useState(false);

  const [checkFailed, setCheckFailed] =
    useState(false);


  // ==========================================
  // CHECK PHOTOGRAPHER SUBSCRIPTION
  // ==========================================

  useEffect(() => {
    const checkSubscription = async () => {
      if (
        !user ||
        user.role !== "PHOTOGRAPHER"
      ) {
        setCheckingSubscription(false);
        return;
      }

      try {
        setCheckingSubscription(true);
        setCheckFailed(false);

        const response =
          await getMySubscription();

        const status =
          response.data?.subscription?.status;

        const expired =
          status === "EXPIRED";

        setSubscriptionExpired(expired);

        if (expired) {
          localStorage.setItem(
            "subscriptionRenewalRequired",
            "true"
          );
        } else {
          localStorage.removeItem(
            "subscriptionRenewalRequired"
          );
        }
      } catch (error) {
        console.error(
          "Failed to check photographer subscription:",
          error
        );

        setCheckFailed(true);
      } finally {
        setCheckingSubscription(false);
      }
    };

    if (!authLoading) {
      checkSubscription();
    }
  }, [user, authLoading]);


  // ==========================================
  // AUTH LOADING
  // ==========================================

  if (
    authLoading ||
    checkingSubscription
  ) {
    return <Loading />;
  }


  // ==========================================
  // NOT LOGGED IN
  // ==========================================

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }


  // ==========================================
  // SUBSCRIPTION CHECK FAILED
  // ==========================================

  if (checkFailed) {
    return (
      <Navigate
        to="/photographer/subscription"
        replace
      />
    );
  }


  // ==========================================
  // EXPIRED PHOTOGRAPHER
  // ==========================================

  if (
    user.role === "PHOTOGRAPHER" &&
    subscriptionExpired
  ) {
    return (
      <Navigate
        to="/photographer/subscription"
        replace
      />
    );
  }


  return <Outlet />;
};


export default PhotographerSubscriptionRoute;