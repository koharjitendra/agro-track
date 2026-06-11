/**
 * Send a success JSON response.
 */
export const success = (res, data = null, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

/**
 * Send an error JSON response.
 */
export const error = (res, message = 'Something went wrong', statusCode = 500, errors = null) => {
  const body = {
    success: false,
    message,
  };
  if (errors) {
    body.errors = errors;
  }
  return res.status(statusCode).json(body);
};
