module.exports = (
  res = {},
  statusCode = 200,
  data = {},
  message = 'تمت العملية بنجاح.'
) => {
  res.status(statusCode).json({ message, data });
};
