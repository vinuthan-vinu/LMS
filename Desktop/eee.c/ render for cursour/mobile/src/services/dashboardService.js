import api from "./api";

export const fetchDashboard = async () => {
  const response = await api.get("/dashboard/summary");
  return response.data.data;
};
