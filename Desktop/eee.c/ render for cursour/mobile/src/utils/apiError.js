export const extractApiError = (error) => {
  if (error?.response?.data?.errors?.length) {
    return error.response.data.errors.map((item) => item.message).join(", ");
  }

  if (!error?.response) {
    return error?.message || "Network error. Please check your internet connection.";
  }

  return error?.response?.data?.message || error?.message || "Something went wrong";
};
