export const getLocalDateInputValue = (value = new Date()) => {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const timezoneOffsetMs = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - timezoneOffsetMs).toISOString().slice(0, 10);
};
