import api from "./api";

export const fetchNotifications = async () => {
  const response = await api.get("/notifications");
  return response.data.data;
};

export const createNotification = async (payload) => {
  const response = await api.post("/notifications", payload);
  return response.data.data;
};

export const updateNotification = async (id, payload) => {
  const response = await api.patch(`/notifications/${id}`, payload);
  return response.data.data;
};

export const deleteNotification = async (id) => {
  await api.delete(`/notifications/${id}`);
};

export const markAllNotificationsRead = async () => {
  await api.post("/notifications/mark-all-read");
};
