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

export const fetchCourses = async () => {
  const response = await api.get("/courses");
  return response.data.data;
};

export const createCourse = async (payload) => {
  const response = await api.post("/courses", payload, multipartConfig());
  return response.data.data;
};

export const updateCourse = async (id, payload) => {
  const response = await api.patch(`/courses/${id}`, payload, multipartConfig());
  return response.data.data;
};

export const deleteCourse = async (id) => {
  await api.delete(`/courses/${id}`);
};

export const toggleEnrollment = async (id) => {
  const response = await api.post(`/courses/${id}/enroll`);
  return response.data.data;
};
