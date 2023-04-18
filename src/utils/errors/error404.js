module.exports = (req, res, next) => {
  res.status(404).json({ message: 'عذرا الصفحة غير موجودة' });
};
