import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

import { fetchCurrentUser, loginRequest, registerRequest, updateProfileRequest } from "../services/authService";
import { extractApiError } from "../utils/apiError";
import { clearSession, getStoredSession, persistSession } from "../utils/storage";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [authState, setAuthState] = useState({
    token: null,
    user: null,
    loading: true
  });

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const session = await getStoredSession();
        if (session.token && session.user) {
          setAuthState({
            token: session.token,
            user: session.user,
            loading: false
          });
          try {
            const freshUser = await fetchCurrentUser();
            await persistSession({ token: session.token, user: freshUser });
            setAuthState((current) => ({ ...current, user: freshUser }));
          } catch (error) {
            // Keep last known session on transient API failures.
            if (error?.response?.status === 401) {
              await clearSession();
              setAuthState({ token: null, user: null, loading: false });
            }
          }
        } else {
          setAuthState({ token: null, user: null, loading: false });
        }
      } catch (error) {
        await clearSession();
        setAuthState({ token: null, user: null, loading: false });
      }
    };

    bootstrap();
  }, []);

  const authenticate = async (request, payload) => {
    const session = await request(payload);
    await persistSession(session);
    setAuthState({
      token: session.token,
      user: session.user,
      loading: false
    });
  };

  const value = useMemo(
    () => ({
      ...authState,
      isAuthenticated: Boolean(authState.token && authState.user),
      signIn: async (payload) => authenticate(loginRequest, payload),
      register: async (payload) => authenticate(registerRequest, payload),
      signOut: async () => {
        await clearSession();
        setAuthState({ token: null, user: null, loading: false });
      },
      refreshProfile: async () => {
        const user = await fetchCurrentUser();
        await persistSession({ token: authState.token, user });
        setAuthState((current) => ({ ...current, user }));
      },
      updateProfile: async (payload) => {
        try {
          const user = await updateProfileRequest(payload);
          await persistSession({ token: authState.token, user });
          setAuthState((current) => ({ ...current, user }));
        } catch (error) {
          throw new Error(extractApiError(error));
        }
      }
    }),
    [authState]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
