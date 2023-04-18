const { StatusCodes } = require('http-status-codes');
const { responser } = require('../../utils');
const { ApiError } = require('../../utils/errors');
const { Product } = require('./product.model');

async function getAllProducts(req, res, next) {
  try {
    const products = await Product.findAll();
    return responser(res, StatusCodes.ACCEPTED, { products });
  } catch (error) {
    return next(error);
  }
}

async function getProduct(req, res, next) {
  try {
    const { productId } = req.params;
    const product = await Product.findByPk(productId);
    if (!product) throw new ApiError('المنتج غير موجود', StatusCodes.NOT_FOUND);
    return responser(res, StatusCodes.ACCEPTED, { product });
  } catch (error) {
    return next(error);
  }
}

async function addProduct(req, res, next) {
  try {
    const { name, modelId, price, values, value, count, note, colors, sizes } =
      req.body;
    const product = await Product.create({
      name,
      modelId,
      price,
      values,
      value,
      count,
      note,
      colors,
      sizes,
    });
    if (!product)
      throw new ApiError('تعذر انشاء المنتج', StatusCodes.NOT_FOUND);
    return responser(res, StatusCodes.CREATED, { product });
  } catch (error) {
    return next(error);
  }
}

async function editProduct(req, res, next) {
  try {
    const { name, modelId, price, values, value, count, note, colors, sizes } =
      req.body;
    const { productId } = req.params;
    const product = await Product.findByPk(productId);

    if (!product) throw new ApiError('المنتج غير موجود', StatusCodes.NOT_FOUND);
    const updatedProduct = await product.update({
      name,
      modelId,
      price,
      value,
      note,
      colors,
      sizes,
      values,
      count,
    });
    return responser(res, StatusCodes.ACCEPTED, {
      product: updatedProduct,
    });
  } catch (error) {
    return next(error);
  }
}

async function deleteProduct(req, res, next) {
  try {
    const { productId } = req.params;
    const product = await Product.findByPk(productId);
    if (!product) throw new ApiError('تعذر حذف المنتج', StatusCodes.NOT_FOUND);
    await product.destroy();
    return responser(res, StatusCodes.ACCEPTED, { product });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getAllProducts,
  getProduct,
  addProduct,
  editProduct,
  deleteProduct,
};
