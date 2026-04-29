export const validateEmail = (value) => /\S+@\S+\.\S+/.test(value);
export const validateStudentSliitEmail = (value) => /^it\d{8}@my\.sliit\.lk$/i.test(String(value || "").trim());
export const validateSliitEmail = (value) => /^it\d{8}@my\.sliit\.lk$/i.test(String(value || "").trim());

export const required = (value) => String(value || "").trim().length > 0;

export const validatePassword = (value) => String(value || "").length >= 6;

export const buildValidationErrors = (fields) => {
  const errors = {};
  Object.entries(fields).forEach(([key, rule]) => {
    if (!rule.valid) {
      errors[key] = rule.message;
    }
  });
  return errors;
};
