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

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.get("/auth/me");

        setUser(response.data.data.user);
      } catch (error) {
        console.error("Failed to load current user:", error);

        localStorage.removeItem("token");
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

    const { token, user } = response.data.data;

    localStorage.setItem("token", token);

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
      setUser(null);
    }
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

