/**
 * Normalize list payloads from API responses ({ items, total } or plain arrays).
 */
export const getListItems = (apiResponse) => {
  const payload = apiResponse?.data ?? apiResponse;
  return Array.isArray(payload) ? payload : payload?.items ?? [];
};
