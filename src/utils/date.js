export const getLocalDateInputValue = (value = new Date()) => {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const timezoneOffsetMs = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - timezoneOffsetMs).toISOString().slice(0, 10);
};

export const isSameLocalDay = (dateValue, targetYmd = getLocalDateInputValue()) => {
  if (!dateValue || !targetYmd) return false;
  if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue.trim())) {
    return dateValue.trim() === targetYmd;
  }
  return getLocalDateInputValue(dateValue) === targetYmd;
};

