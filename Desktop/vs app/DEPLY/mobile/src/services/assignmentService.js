import api from "./api";
import { Platform } from "react-native";

const multipartConfig = () =>
  Platform.OS === "web"
    ? {}
    : {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      };

export const fetchAssignments = async () => {
  const response = await api.get("/assignments");
  return response.data.data;
};

export const createAssignment = async (payload) => {
  const response = await api.post("/assignments", payload, multipartConfig());
  return response.data.data;
};

export const updateAssignment = async (id, payload) => {
  const response = await api.patch(`/assignments/${id}`, payload, multipartConfig());
  return response.data.data;
};

export const deleteAssignment = async (id) => {
  await api.delete(`/assignments/${id}`);
};
