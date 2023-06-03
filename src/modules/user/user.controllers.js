const { StatusCodes } = require('http-status-codes');
const { responser } = require('../../utils');
const { ApiError } = require('../../utils/errors');

const {
  addToBalance,
  subtractFromBalance,
} = require('../myBalance/myBalance.services');
const { db } = require('../../config');

async function getAllUsers(req, res, next) {
  try {
    const users = await db.User.findAll();
    return responser(res, StatusCodes.ACCEPTED, { users });
  } catch (error) {
    return next(error);
  }
}

async function getUser(req, res, next) {
  try {
    const { userId } = req.params;
    const user = await db.User.findByPk(userId);
    const whereClause = {};
    if (user?.id) whereClause.UserId = user.id;
    const bills = await db.Bill.findAll({ where: whereClause });
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
    const user = await db.User.create({
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
    const user = await db.User.findByPk(userId);

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
    const user = await db.User.findByPk(userId);
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
    const bills = await db.BillItem.findAll({ where: { BillId: billId } });
  } catch (error) {
    next(error);
  }
}

async function addUserBill(req, res, next) {
  try {
    const { userId } = req.params;
    const { products, billType } = req.body;
    const bill = db.Bill.build({
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
      const billItem = await db.BillItem.create({
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
