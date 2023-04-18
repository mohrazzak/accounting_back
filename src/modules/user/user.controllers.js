const { StatusCodes } = require('http-status-codes');
const { responser } = require('../../utils');
const { ApiError } = require('../../utils/errors');
const { Bill } = require('../bill/bill.model');
const { BillItem } = require('../bill_item/bill_item.model');
const {
  addToBalance,
  subtractFromBalance,
} = require('../myBalance/myBalance.services');
const { Product } = require('../product/product.model');
const { User } = require('./user.model');

async function getAllUsers(req, res, next) {
  try {
    const users = await User.findAll();
    return responser(res, StatusCodes.ACCEPTED, { users });
  } catch (error) {
    return next(error);
  }
}

async function getUser(req, res, next) {
  try {
    const { userId } = req.params;
    const user = await User.findByPk(userId);
    const whereClause = {};
    if (user?.id) whereClause.UserId = user.id;
    const bills = await Bill.findAll({ where: whereClause });
    if (!user) throw new ApiError('المستخدم غير موجود', StatusCodes.NOT_FOUND);
    return responser(res, StatusCodes.ACCEPTED, { user, bills });
  } catch (error) {
    return next(error);
  }
}

async function addUser(req, res, next) {
  try {
    const {
      name,
      mobileNumber,
      address,
      userType,
      note,
      accountBalance,
      accountBalanceValues,
    } = req.body;
    const user = await User.create({
      name,
      mobileNumber,
      address,
      userType,
      note,
      accountBalance,
      accountBalanceValues,
    });
    if (!user) throw new ApiError('تعذر انشاء المستخدم', StatusCodes.NOT_FOUND);
    return responser(res, StatusCodes.CREATED, { user });
  } catch (error) {
    return next(error);
  }
}

async function editUser(req, res, next) {
  try {
    const {
      name,
      mobileNumber,
      address,
      userType,
      note,
      accountBalance,
      accountBalanceValues,
    } = req.body;
    const { userId } = req.params;
    const user = await User.findByPk(userId);

    if (!user) throw new ApiError('المستخدم غير موجود', StatusCodes.NOT_FOUND);
    const updatedUser = await user.update({
      name,
      mobileNumber,
      address,
      userType,
      note,
      accountBalance,
      accountBalanceValues,
    });
    return responser(res, StatusCodes.ACCEPTED, {
      user: updatedUser,
    });
  } catch (error) {
    return next(error);
  }
}

async function deleteUser(req, res, next) {
  try {
    const { userId } = req.params;
    const user = await User.findByPk(userId);
    await user.destroy();
    if (!user) throw new ApiError('تعذر حذف المستخدم', StatusCodes.NOT_FOUND);
    return responser(res, StatusCodes.ACCEPTED, { user });
  } catch (error) {
    return next(error);
  }
}

async function getUserBill(req, res, next) {
  try {
    const { userId, billId } = req.params;
    const bills = await BillItem.findAll({ where: { BillId: billId } });
  } catch (error) {
    next(error);
  }
}

async function addUserBill(req, res, next) {
  try {
    const { userId } = req.params;
    const { products, billType } = req.body;
    const bill = Bill.build({
      value: 0,
      values: 0,
      UserId: userId,
      billType,
    });
    let totalValue = 0;
    let totalValues = 0;
    // eslint-disable-next-line no-restricted-syntax
    for (const product of products) {
      // eslint-disable-next-line no-await-in-loop
      const billItem = await BillItem.create({
        count: product.count,
        value: product.value,
        values: product.values,
        note: product.note,
        colors: product.colors,
        sizes: product.sizes,
        ProductId: product.id,
        BillId: bill.id,
      });
      totalValue += billItem.value * product.count;
      totalValues += billItem.values * product.count;
    }
    bill.value = totalValue;
    bill.values = totalValues;
    if (billType === 'ادخال') await addToBalance(totalValue, totalValues);
    else await subtractFromBalance(totalValue, totalValues);
    await bill.save();
    responser(res, StatusCodes.OK, { bill });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllUsers,
  getUser,
  addUser,
  editUser,
  deleteUser,
  getUserBill,
  addUserBill,
};
