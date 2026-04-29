import api from "./api";

export const loginRequest = async (payload) => {
  const response = await api.post("/auth/login", payload);
  return response.data.data;
};

export const registerRequest = async (payload) => {
  const response = await api.post("/auth/register", payload);
  return response.data.data;
};

export const fetchCurrentUser = async () => {
  const response = await api.get("/auth/me");
  return response.data.data;
};

export const forgotPassword = async (payload) => {
  const response = await api.post("/auth/forgot-password", payload);
  return response.data;
};

export const updateProfileRequest = async (payload) => {
  const response = await api.patch("/auth/profile", payload);
  return response.data.data;
};
