import api from "./api";

export const fetchCalendarEvents = async () => {
  const response = await api.get("/calendar");
  return response.data.data;
};

export const upsertCalendarEvent = async (payload) => {
  const response = await api.post("/calendar", payload);
  return response.data.data;
};

export const deleteCalendarEvent = async (id) => {
  await api.delete(`/calendar/${id}`);
};
