import {
  createContext,
  useEffect,
  useState,
} from "react";

import api from "../services/api";

// ==========================================
// CREATE AUTH CONTEXT
// ==========================================

const AuthContext = createContext(null);

// ==========================================
// AUTH PROVIDER
// ==========================================

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ========================================
  // CHECK CURRENT USER WHEN APP STARTS
  // ========================================

  useEffect(() => {
    const loadCurrentUser = async () => {
      const token = localStorage.getItem("token");

      const renewalRequired =
        localStorage.getItem(
          "subscriptionRenewalRequired"
        ) === "true";

      if (!token) {
        localStorage.removeItem(
          "subscriptionRenewalRequired"
        );

        setLoading(false);
        return;
      }

      try {
        // --------------------------------------
        // EXPIRED PHOTOGRAPHER RENEWAL SESSION
        // --------------------------------------

        if (renewalRequired) {
          const response = await api.get(
            "/photographer/subscription"
          );

          setUser({
            id: response.data.data.photographer?.userId,
            role: "PHOTOGRAPHER",
            status: "INACTIVE",
            disabledReason:
              "SUBSCRIPTION_EXPIRED",
            renewalRequired: true,
          });

          return;
        }

        // --------------------------------------
        // NORMAL AUTHENTICATED SESSION
        // --------------------------------------

        const response =
          await api.get("/auth/me");

        setUser(response.data.data.user);
      } catch (error) {
        console.error(
          "Failed to load current user:",
          error
        );

        localStorage.removeItem("token");

        localStorage.removeItem(
          "subscriptionRenewalRequired"
        );

        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadCurrentUser();
  }, []);

  // ========================================
  // LOGIN
  // ========================================

  const login = async (email, password) => {
    const response = await api.post("/auth/login", {
      email,
      password,
    });

    const {
      token,
      user,
      renewalRequired,
    } = response.data.data;

    localStorage.setItem("token", token);

    if (renewalRequired) {
      localStorage.setItem(
        "subscriptionRenewalRequired",
        "true"
      );
    } else {
      localStorage.removeItem(
        "subscriptionRenewalRequired"
      );
    }

    setUser(user);

    return response.data;
  };

  // ========================================
  // CUSTOMER REGISTRATION
  // ========================================

  const register = async (name, email, password) => {
    const response = await api.post("/auth/register", {
      name,
      email,
      password,
    });

    return response.data;
  };

  // ========================================
  // LOGOUT
  // ========================================

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      console.error("Logout request failed:", error);
    } finally {
        localStorage.removeItem("token");
        localStorage.removeItem(
          "subscriptionRenewalRequired"
        );
        setUser(null);
    }
  };

  // ========================================
  // UPDATE CURRENT USER IN AUTH STATE
  // ========================================

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
  };

  // ========================================
  // CONTEXT VALUE
  // ========================================

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    updateUser,
  };

  // ========================================
  // PROVIDER
  // ========================================

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};


export { AuthContext };

