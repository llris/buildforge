const sendSuccess = (res, data = null, statusCode = 200) => {
  const response = {
    success: true,
  };

  if (data !== null && data !== undefined) {
    response.data = data;
  }

  return res.status(statusCode).json(response);
};

module.exports = { sendSuccess };
