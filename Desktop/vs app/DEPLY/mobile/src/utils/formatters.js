export const formatDateTime = (value) =>
  value
    ? new Date(value).toLocaleString([], {
        dateStyle: "medium",
        timeStyle: "short"
      })
    : "-";

export const capitalize = (value) => String(value || "").replace(/^\w/, (match) => match.toUpperCase());
