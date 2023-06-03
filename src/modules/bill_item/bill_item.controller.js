const { StatusCodes } = require('http-status-codes');
const { responser } = require('../../utils');
const { ApiError } = require('../../utils/errors');
const { db } = require('../../config');

async function getAllBillItems(req, res, next) {
  try {
    const billItems = await db.BillItem.findAll({ include: db.Product });
    return responser(res, StatusCodes.ACCEPTED, { billItems });
  } catch (error) {
    return next(error);
  }
}

async function getBillItem(req, res, next) {
  try {
    const { billItemId } = req.params;
    const billItem = await db.findByPk(billItemId, { include: db.Product });
    if (!billItem)
      throw new ApiError('منتج الفاتورة غير موجود', StatusCodes.NOT_FOUND);
    return responser(res, StatusCodes.ACCEPTED, { billItem });
  } catch (error) {
    return next(error);
  }
}

async function addBillItem(req, res, next) {
  try {
    const { name, modelId, price, values, count, productId } = req.body;
    const product = await db.Product.findByPk(productId);
    if (!product) throw new ApiError('المنتج غير موجود', StatusCodes.NOT_FOUND);
    const billItem = await db.BillItem.create({
      name,
      modelId,
      price,
      values,
      count,
      ProductId: productId,
    });
    if (!billItem)
      throw new ApiError('تعذر انشاء منتج الفاتورة', StatusCodes.NOT_FOUND);
    return responser(res, StatusCodes.CREATED, { billItem });
  } catch (error) {
    return next(error);
  }
}

async function editBillItem(req, res, next) {
  try {
    const { name, modelId, price, values, count, productId } = req.body;
    const { billItemId } = req.params;
    const billItem = await db.BillItem.findByPk(billItemId);

    if (!billItem)
      throw new ApiError('منتج الفاتورة غير موجود', StatusCodes.NOT_FOUND);

    const product = await db.Product.findByPk(productId);
    if (!product) throw new ApiError('المنتج غير موجود', StatusCodes.NOT_FOUND);

    const updatedBillItem = await billItem.update({
      name,
      modelId,
      price,
      values,
      count,
      ProductId: productId,
    });
    return responser(res, StatusCodes.ACCEPTED, {
      billItem: updatedBillItem,
    });
  } catch (error) {
    return next(error);
  }
}

async function deleteBillItem(req, res, next) {
  try {
    const { billItemId } = req.params;
    const billItem = await db.BillItem.destroy({ where: { id: billItemId } });
    if (!billItem)
      throw new ApiError('تعذر حذف منتج الفاتورة', StatusCodes.NOT_FOUND);
    return responser(res, StatusCodes.ACCEPTED);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getAllBillItems,
  getBillItem,
  addBillItem,
  editBillItem,
  deleteBillItem,
};
