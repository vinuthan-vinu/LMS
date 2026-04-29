import api from "./api";

export const fetchUsers = async (params = {}) => {
  const response = await api.get("/users", { params });
  return response.data.data;
};

export const fetchLecturers = async () => {
  const response = await api.get("/users?role=lecturer");
  return response.data.data;
};

export const updateUser = async (id, payload) => {
  const response = await api.patch(`/users/${id}`, payload);
  return response.data.data;
};

export const deleteUser = async (id) => {
  await api.delete(`/users/${id}`);
};
