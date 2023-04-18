/* eslint-disable no-await-in-loop */
const { StatusCodes } = require('http-status-codes');
const { Op } = require('sequelize');
const { Bill } = require('../bill/bill.model');
const { responser } = require('../../utils');
const { ApiError } = require('../../utils/errors');
const {
  getBalance,
  subtractFromBalance,
  addToBalance,
} = require('../myBalance/myBalance.services');
const { User } = require('../user/user.model');
const { BillItem } = require('../bill_item/bill_item.model');
const { Product } = require('../product/product.model');

async function getAllDailyBills(req, res, next) {
  const { all, userId, isDaily, billType } = req.query;
  try {
    const today = new Date();
    const startOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
    const endOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() + 1
    );

    const whereClause = {};

    if (!all) {
      whereClause.createdAt = {
        [Op.between]: [startOfDay, endOfDay],
      };
    }

    if (userId) {
      whereClause.UserId = userId;
    }

    if (billType) {
      whereClause.billType = billType;
    }

    if (isDaily) {
      whereClause.isDaily = true;
    }
    const bills = await Bill.findAll({
      // where: whereClause,
      // include: [{ model: User }],
    });
    // const balance = await getBalance();

    responser(res, StatusCodes.OK, {
      bills,
      // todayBalance: balance.todayBalance,
      // yesterdayBalance: balance.yesterdayBalance,
    });
  } catch (error) {
    next(error);
  }
}

async function addDailyBill(req, res, next) {
  try {
    const {
      userId,
      value,
      values,
      billType,
      note,
      products,
      isDaily = true,
    } = req.body;
    const createdBill = await Bill.create({
      UserId: userId,
      value,
      values,
      billType,
      note,
      isDaily,
    });

    if (products?.length > 0) {
      const productsWithBill = [];
      // eslint-disable-next-line no-restricted-syntax
      for (const product of products) {
        const productInStorage = await Product.findByPk(product.ProductId);
        if (billType === 'صادر' && product?.count > productInStorage?.count) {
          throw new ApiError(`
    ,يرجى تحديد كمية أقل أو تساوي كمية المستودع
    لديك للمنتج صاحب الايدي  ${product.ProductId}
    المسمى بـ ${productInStorage.name} 
    عدد ${productInStorage.count} فقط
      `);
        }
        if (billType === 'صادر') productInStorage.count -= product.count;
        // Accumulate count to subtract
        else productInStorage.count += product.count; // Accumulate count to add

        await productInStorage.save(); // Wait for the product to be saved before proceeding

        productsWithBill.push({
          ...product,
          BillId: createdBill.id,
        });
      }

      const billItems = await BillItem.bulkCreate(productsWithBill);
      await createdBill.setBillItems(billItems);
    }

    const user = await User.findByPk(userId);
    const bill = await Bill.findByPk(createdBill.id, {
      include: [{ model: User }],
    });
    if (!bill || !user)
      throw new ApiError('تعذر انشاء الفاتورة', StatusCodes.BAD_REQUEST);

    if (billType === 'ادخال') {
      if (isDaily) await addToBalance(value, values);
      user.accountBalance += value;
      user.accountBalanceValues += values;
    } else {
      if (isDaily) await subtractFromBalance(value, values);
      user.accountBalance -= value;
      user.accountBalanceValues -= values;
    }
    await user.save();
    responser(res, StatusCodes.CREATED, { bill });
  } catch (error) {
    next(error);
  }
}

async function editDailyBill(req, res, next) {
  try {
    const { billId } = req.params;
    const { userId, value, values, billType, note } = req.body;
    const bill = await Bill.findByPk(billId, { include: [User] });
    if (!bill) {
      throw new ApiError('الفاتورة غير موجودة', StatusCodes.NOT_FOUND);
    }

    const oldUser = bill.User;
    const newUser = await User.findByPk(userId);
    if (!newUser) {
      throw new ApiError('المستخدم غير موجود', StatusCodes.NOT_FOUND);
    }
    if (oldUser.id !== newUser.id)
      throw new ApiError(
        'لايمكنك تغيير الحساب الخاص بالفاتورة, يرجى حذف الفاتورة وانشاء فاتورة جديدة',
        StatusCodes.BAD_REQUEST
      );


    if (billType !== bill.billType)
      throw new ApiError(
        'لايمكنك تغيير نوع الفاتورة, يرجى حذف الفاتورة وانشاء فاتورة جديدة',
        StatusCodes.BAD_REQUEST
      );

    if (bill.billType === 'ادخال') {
      await subtractFromBalance(bill.value, bill.values);
      newUser.accountBalance -= bill.value;
      newUser.accountBalanceValues -= bill.values;

      await addToBalance(value, values);

      newUser.accountBalance += value;
      newUser.accountBalanceValues += values;
    } else {
      await addToBalance(bill.value, bill.values);
      newUser.accountBalance += bill.value;
      newUser.accountBalanceValues += bill.values;

      await subtractFromBalance(value, values);
      newUser.accountBalance -= value;
      newUser.accountBalanceValues -= values;
    }

    // Update the bill with the new information
    await newUser.save();
    await bill.update({ value, values, note });
    const updatedBill = await Bill.findByPk(bill.id, { include: [User] });

    const balance = await getBalance();
    responser(res, StatusCodes.OK, { bill: updatedBill, balance });
  } catch (error) {
    next(error);
  }
}

async function deleteDailyBill(req, res, next) {
  try {
    const { billId } = req.params;
    const bill = await Bill.findByPk(billId);
    const user = await User.findByPk(bill.UserId);
    if (!bill) throw new ApiError('الفاتورة غير موجودة', StatusCodes.NOT_FOUND);
    const billItems = await BillItem.findAll({ where: { BillId: bill.id } });
    // eslint-disable-next-line no-restricted-syntax
    for (const billItem of billItems) {
      const productInStorage = await Product.findByPk(billItem.ProductId);
      let editedCount = 0;
      if (bill.billType === 'صادر') editedCount += billItem.count;
      else editedCount -= billItem.count;
      if (productInStorage.count < 0)
        throw new ApiError(`
  حدثت مشكلة اثناء حذف الفاتورة, لايمكن للمستودع ان يحوي على منتجات بعدد سالب
  `);

      productInStorage.count += editedCount; // Accumulate count for multiple bill items
      await productInStorage.save();
    }

    if (bill.billType === 'ادخال') {
      await subtractFromBalance(bill.value, bill.values);
      if (user) {
        user.accountBalance -= bill.value;
        user.accountBalanceValues -= bill.values;
      }
    } else {
      await addToBalance(bill.value, bill.values);
      if (user) {
        user.accountBalance += bill.value;
        user.accountBalanceValues += bill.values;
      }
    }
    await user?.save();
    await bill.destroy();
    responser(res, StatusCodes.OK, { bill });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllDailyBills,
  addDailyBill,
  deleteDailyBill,
  editDailyBill,
};
