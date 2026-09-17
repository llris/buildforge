const sendSuccess = (res, data = null, statusCode = 200) => {
  const response = {
    success: true,
  };

  if (data !== null && data !== undefined) {
    response.data = data;
  }

  return res.status(statusCode).json(response);
};

const formatResponse = (success, data = null) => {
  const res = { success };
  if (data !== null && data !== undefined) {
    res.data = data;
  }
  return res;
};

module.exports = { sendSuccess, formatResponse };
