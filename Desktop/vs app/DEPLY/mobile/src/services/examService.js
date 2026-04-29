import api from "./api";

export const fetchExams = async () => {
  const response = await api.get("/exams");
  return response.data.data;
};

export const createExam = async (payload) => {
  const response = await api.post("/exams", payload, {
    headers: { "Content-Type": "multipart/form-data" }
  });
  return response.data.data;
};

export const updateExam = async (id, payload) => {
  const response = await api.patch(`/exams/${id}`, payload, {
    headers: { "Content-Type": "multipart/form-data" }
  });
  return response.data.data;
};

export const deleteExam = async (id) => {
  await api.delete(`/exams/${id}`);
};
