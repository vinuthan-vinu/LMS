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

export const fetchSubmissions = async () => {
  const response = await api.get("/submissions");
  return response.data.data;
};

export const createSubmission = async (payload) => {
  const response = await api.post("/submissions", payload, multipartConfig());
  return response.data.data;
};

export const updateSubmission = async (id, payload) => {
  const response = await api.patch(`/submissions/${id}`, payload, multipartConfig());
  return response.data.data;
};

export const deleteSubmission = async (id) => {
  await api.delete(`/submissions/${id}`);
};
