/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import * as authService from "../services/authService";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = () => {
      const user = authService.getCurrentUser();
      setCurrentUser(user);
      setLoading(false);
    };
    const timer = window.setTimeout(init, 350);
    return () => window.clearTimeout(timer);
  }, []);

  const login = useCallback(async (email, password) => {
    const user = await authService.login(email, password);
    setCurrentUser(user);
    return user;
  }, []);

  const register = useCallback(async (name, email, password) => {
    const user = await authService.register(name, email, password);
    setCurrentUser(user);
    return user;
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setCurrentUser(null);
  }, []);

  const forgotPassword = useCallback(async (email) => {
    return authService.forgotPassword(email);
  }, []);

  const updateCurrentUser = useCallback((patch) => {
    setCurrentUser((prev) => (prev ? { ...prev, ...patch } : prev));
  }, []);

  const value = useMemo(
    () => ({
      currentUser,
      loading,
      login,
      register,
      logout,
      forgotPassword,
      updateCurrentUser,
    }),
    [currentUser, loading, login, register, logout, forgotPassword, updateCurrentUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
