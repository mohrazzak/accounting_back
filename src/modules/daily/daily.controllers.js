/* eslint-disable no-await-in-loop */
const { StatusCodes } = require('http-status-codes');
const moment = require('moment');
const { responser } = require('../../utils');
const { ApiError } = require('../../utils/errors');
const {
  getBalance,
  subtractFromBalance,
  addToBalance,
  getPrevBalance,
} = require('../myBalance/myBalance.services');
const { db } = require('../../config');

async function getAllDailyBills(req, res, next) {
  const { all, userId, isDaily, billType, day, year, month } = req.query;
  try {
    const today = moment().local().startOf('day').add(3, 'hours');
    let selectedDay = moment().local().startOf('day').add(3, 'hours');
    if (year && month && day) {
      selectedDay = moment(`${year}-${month}-${day}`, 'YYYY-MM-DD')
        .startOf('day')
        .add(3, 'hours');
    }
    console.log(selectedDay);
    const whereClause = {};
    if (!all && !billType) {
      whereClause.createdAt = selectedDay.toISOString();
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
    console.log(whereClause);
    const bills = await db.Bill.findAll({
      where: whereClause,
      include: db.User,
    });
    console.log(bills?.length);
    let balance;
    if (today.isAfter(selectedDay)) balance = await getPrevBalance(selectedDay);
    else balance = await getBalance(selectedDay);

    responser(res, StatusCodes.OK, {
      bills,
      todayBalance: balance.todayBalance,
      yesterdayBalance: balance.yesterdayBalance,
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
    const createdBill = await db.Bill.create({
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
        const productInStorage = await db.Product.findByPk(product.ProductId);
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

      const billItems = await db.BillItem.bulkCreate(productsWithBill);
      await createdBill.setBillItems(billItems);
    }

    const user = await db.User.findByPk(userId);
    const bill = await db.Bill.findByPk(createdBill.id, {
      include: [db.User],
    });
    if (!bill || !user)
      throw new ApiError('تعذر انشاء الفاتورة', StatusCodes.BAD_REQUEST);

    if (billType === 'ادخال') {
      if (isDaily) await addToBalance(value, values);
      user.accountBalance += Number(value);
      user.accountBalanceValues += Number(values);
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
    const bill = await db.Bill.findByPk(billId, { include: [db.User] });
    if (!bill) {
      throw new ApiError('الفاتورة غير موجودة', StatusCodes.NOT_FOUND);
    }

    const oldUser = bill.User;
    const newUser = await db.User.findByPk(userId);
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
      if (bill.isDaily) await subtractFromBalance(bill.value, bill.values);
      newUser.accountBalance -= bill.value;
      newUser.accountBalanceValues -= bill.values;

      if (bill.isDaily) await addToBalance(value, values);

      newUser.accountBalance += Number(value);
      newUser.accountBalanceValues += Number(values);
    } else {
      if (bill.isDaily) await addToBalance(bill.value, bill.values);
      newUser.accountBalance += bill.value;
      newUser.accountBalanceValues += bill.values;

      if (bill.isDaily) await subtractFromBalance(value, values);
      newUser.accountBalance -= value;
      newUser.accountBalanceValues -= values;
    }

    // Update the bill with the new information
    await newUser.save();
    await bill.update({ value, values, note });
    const updatedBill = await db.Bill.findByPk(bill.id, { include: [db.User] });

    const balance = await getBalance();
    responser(res, StatusCodes.OK, { bill: updatedBill, balance });
  } catch (error) {
    next(error);
  }
}

async function deleteDailyBill(req, res, next) {
  try {
    const { billId } = req.params;
    const bill = await db.Bill.findByPk(billId);
    const user = await db.User.findByPk(bill.UserId);
    if (!bill) throw new ApiError('الفاتورة غير موجودة', StatusCodes.NOT_FOUND);
    const billItems = await db.BillItem.findAll({ where: { BillId: bill.id } });
    // eslint-disable-next-line no-restricted-syntax
    for (const billItem of billItems) {
      const productInStorage = await db.Product.findByPk(billItem.ProductId);
      let editedCount = 0;
      if (bill.billType === 'صادر') editedCount += billItem.count;
      else editedCount -= billItem.count;
      if (productInStorage.count < 0)
        throw new ApiError(`
  حدثت مشكلة اثناء حذف الفاتورة, لايمكن للمستودع ان يحوي على منتجات بعدد سالب
  `);

      productInStorage.count += editedCount; // Accumulate count for multiple bill items
      await productInStorage.save();
      await billItem.destroy();
    }

    if (bill.billType === 'ادخال') {
      if (bill.isDaily) await subtractFromBalance(bill.value, bill.values);
      if (user) {
        user.accountBalance -= bill.value;
        user.accountBalanceValues -= bill.values;
      }
    } else {
      if (bill.isDaily) await addToBalance(bill.value, bill.values);
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
