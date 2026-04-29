import api from "./api";

export const fetchEvents = async () => {
  const response = await api.get("/events");
  return response.data.data;
};

export const createEvent = async (payload) => {
  const response = await api.post("/events", payload, {
    headers: { "Content-Type": "multipart/form-data" }
  });
  return response.data.data;
};

export const updateEvent = async (id, payload) => {
  const response = await api.patch(`/events/${id}`, payload, {
    headers: { "Content-Type": "multipart/form-data" }
  });
  return response.data.data;
};

export const deleteEvent = async (id) => {
  await api.delete(`/events/${id}`);
};
