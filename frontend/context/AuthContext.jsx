// frontend/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import api, { setAuthToken } from "../lib/api";
import { useRouter } from "next/router";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const router = useRouter();
  const [token, setToken] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // восстановление из localStorage
    if (typeof window !== "undefined") {
      const t = localStorage.getItem("token");
      const r = localStorage.getItem("role");
      if (t) {
        setToken(t);
        setAuthToken(t);
      }
      if (r) setRole(r);
    }
    setLoading(false);
  }, []);

  async function login({ email, password }) {
    const res = await api.post("/auth/login", { email, password });
    const { token: tok, role: r } = res.data;
    if (typeof window !== "undefined") {
      localStorage.setItem("token", tok);
      localStorage.setItem("role", r);
    }
    setToken(tok);
    setRole(r);
    setAuthToken(tok);
    return res.data;
  }

  async function register(payload) {
    // payload: { name, email, password }
    const res = await api.post("/auth/register", payload);
    return res.data;
  }

  function logout() {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("role");
    }
    setToken(null);
    setRole(null);
    setAuthToken(null);
    router.push("/login");
  }

  return (
    <AuthContext.Provider value={{ token, role, loading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
