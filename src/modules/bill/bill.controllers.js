const { StatusCodes } = require('http-status-codes');
const { responser } = require('../../utils');
const { ApiError } = require('../../utils/errors');
const { Bill } = require('./bill.model');
const { BillItem } = require('../bill_item/bill_item.model');
const { Product } = require('../product/product.model');
const {
  addToBalance,
  subtractFromBalance,
} = require('../myBalance/myBalance.services');
const { User } = require('../user/user.model');

async function getAllBills(req, res, next) {
  try {
    const { billType } = req.query;
    const bills = await Bill.findAll({
      include: BillItem,
      where: billType ? { billType } : null,
    });
    return responser(res, StatusCodes.ACCEPTED, { bills });
  } catch (error) {
    return next(error);
  }
}

async function getBill(req, res, next) {
  try {
    const { billId } = req.params;
    const bill = await Bill.findByPk(billId, {
      include: [
        { model: BillItem, include: [{ model: Product }] }, // Include Product model with BillItem model
      ],
    });
    if (!bill) throw new ApiError('فاتورة غير موجودة', StatusCodes.NOT_FOUND);
    return responser(res, StatusCodes.ACCEPTED, { bill });
  } catch (error) {
    return next(error);
  }
}

async function addBill(req, res, next) {
  try {
    const { values, value, billType, note, products } = req.body;
    const bill = await Bill.create({
      values,
      value,
      billType,
      note,
    });

    const productsWithBill = products.map((product) => ({
      ...product,
      BillId: bill.id,
    }));

    const billItems = await BillItem.bulkCreate(productsWithBill);

    if (!bill) throw new ApiError('تعذر انشاء الفاتورة', StatusCodes.NOT_FOUND);

    await bill.setBillItems(billItems);

    const result = await Bill.findByPk(bill.id, { include: BillItem });
    return responser(res, StatusCodes.CREATED, { bill: result });
  } catch (error) {
    return next(error);
  }
}

async function editBill(req, res, next) {
  try {
    const { billId } = req.params;
    const { values, value, billType, note, billItems } = req.body;

    const bill = await Bill.findByPk(billId);

    if (!bill) throw new ApiError('الفاتورة غير موجودة', StatusCodes.NOT_FOUND);

    // Update the Bill record
    await bill.update({
      values,
      value,
      billType,
      note,
    });

    // Update the associated BillItem records
    const updatedBillItems = await Promise.all(
      billItems.map(async (billItem) => {
        const {
          id: billItemId,
          ProductId,
          count,
          values: itemValues,
          value: itemValue,
          note: itemNote,
          colors,
          sizes,
        } = billItem;

        // Find the existing BillItem record by id
        const existingBillItem = await BillItem.findByPk(billItemId);

        // If the BillItem record does not exist, return null
        if (!existingBillItem) {
          return null;
        }

        // Update the existing BillItem record
        await existingBillItem.update({
          ProductId,
          count,
          values: itemValues,
          value: itemValue,
          note: itemNote,
          colors,
          sizes,
        });

        return existingBillItem;
      })
    );

    // Remove any null elements from the updatedBillItems array
    const filteredUpdatedBillItems = updatedBillItems.filter(
      (billItem) => billItem !== null
    );

    return responser(res, StatusCodes.OK, {
      bill,
      billItems: filteredUpdatedBillItems,
    });
  } catch (error) {
    return next(error);
  }
}

async function deleteBill(req, res, next) {
  try {
    const { billId } = req.params;

    // Delete the associated BillItems first
    await BillItem.destroy({ where: { BillId: billId } });

    // Delete the Bill
    const deletedBill = await Bill.destroy({ where: { id: billId } });

    if (!deletedBill)
      throw new ApiError('تعذر حذف الفاتورة', StatusCodes.NOT_FOUND);

    return responser(res, StatusCodes.ACCEPTED);
  } catch (error) {
    return next(error);
  }
}

async function addBillItem(req, res, next) {
  try {
    const { billId } = req.params;
    const { values, value, billType, note, ProductId, count } = req.body;
    const product = await Product.findByPk(ProductId);

    const bill = await Bill.findByPk(billId);
    if (count > product.count && bill.billType === 'صادر')
      throw new ApiError(`
         ,يرجى تحديد كمية أقل أو تساوي كمية المستودع
         لديك للمنتج صاحب الايدي  ${product.id}
        المسمى بـ ${product.name} 
        عدد ${product.count} فقط
            `);
    if (bill.billType === 'صادر') product.count -= count;
    else product.count += count;
    const valueToAdd = value * count;
    const valuesToAdd = values * count;
    const user = await User.findByPk(bill.UserId);
    if (
      (bill.billType === 'ادخال' && user.userType === 'تاجر سوق') ||
      (bill.billType === 'صادر' && user.userType === 'زبون')
    ) {
      if (bill.isDaily) addToBalance(valueToAdd, valuesToAdd);
      if (bill.billType === 'صادر' && user.userType === 'زبون') {
        user.accountBalance -= valueToAdd;
        user.accountBalanceValues -= valuesToAdd;
      } else {
        user.accountBalance += valueToAdd;
        user.accountBalanceValues += valuesToAdd;
      }

      bill.value += valueToAdd;
      bill.values += valuesToAdd;
    } else {
      if (bill.isDaily) subtractFromBalance(valueToAdd, valuesToAdd);

      user.accountBalance -= valueToAdd;
      user.accountBalanceValues -= valuesToAdd;
      bill.value -= valueToAdd;
      bill.values -= valuesToAdd;
    }

    await bill.save();
    await user.save();
    await product.save();

    const createdBillItem = await BillItem.create({
      values,
      value,
      billType,
      note,
      count,
      ProductId,
      BillId: billId,
    });
    const billItem = await BillItem.findByPk(createdBillItem.id, {
      include: [{ model: Product }],
    });
    return responser(res, StatusCodes.CREATED, { billItem });
  } catch (error) {
    return next(error);
  }
}

async function editBillItem(req, res, next) {
  try {
    const { billId } = req.params;
    const { values, value, billType, note, id, count } = req.body;

    const oldBillItem = await BillItem.findByPk(id);
    const product = await Product.findByPk(oldBillItem.ProductId);
    const bill = await Bill.findByPk(billId);
    if (bill.billType === 'صادر') {
      product.count += oldBillItem.count;
      product.count -= count;
    } else {
      product.count -= oldBillItem.count;
      product.count += count;
    }

    if (product.count < 0)
      throw new ApiError(`
         ,يرجى تحديد كمية أقل أو تساوي كمية المستودع
         لديك للمنتج صاحب الايدي  ${product.id}
        المسمى بـ ${product.name} 
        عدد ${product.count} فقط
            `);

    const updatedBillItem = await BillItem.update(
      {
        values,
        value,
        billType,
        note,
        count,
      },
      { where: { id } }
    );

    const valueToAdd = value * count;
    const valuesToAdd = values * count;

    const valueToSubtract = oldBillItem.value * oldBillItem.count;
    const valuesToSubtract = oldBillItem.values * oldBillItem.count;
    const user = await User.findByPk(bill.UserId);
    if (
      (bill.billType === 'ادخال' && user.userType === 'تاجر سوق') ||
      (bill.billType === 'صادر' && user.userType === 'زبون')
    ) {
      if (bill.isDaily) {
        await subtractFromBalance(valueToSubtract, valuesToSubtract);
        await addToBalance(valueToAdd, valuesToAdd);
      }

      if (bill.billType === 'صادر' && user.userType === 'زبون') {
        user.accountBalance += valueToSubtract;
        user.accountBalanceValues += valuesToSubtract;

        user.accountBalance -= valueToAdd;
        user.accountBalanceValues -= valuesToAdd;
      } else {
        user.accountBalance -= valueToSubtract;
        user.accountBalanceValues -= valuesToSubtract;

        user.accountBalance += valueToAdd;
        user.accountBalanceValues += valuesToAdd;
      }

      bill.value -= valueToSubtract;
      bill.values -= valuesToSubtract;

      bill.value += valueToAdd;
      bill.values += valuesToAdd;
    } else {
      if (bill.isDaily) {
        await addToBalance(valueToSubtract, valuesToSubtract);
        await subtractFromBalance(valueToAdd, valuesToAdd);
      }

      user.accountBalance += valueToSubtract;
      user.accountBalanceValues += valuesToSubtract;

      user.accountBalance -= valueToAdd;
      user.accountBalanceValues -= valuesToAdd;

      bill.value += valueToSubtract;
      bill.values += valuesToSubtract;

      bill.value -= valueToAdd;
      bill.values -= valuesToAdd;
    }

    await bill.save();
    await user.save();
    await product.save();

    const billItem = await BillItem.findByPk(updatedBillItem.id, {
      include: [{ model: Product }],
    });
    return responser(res, StatusCodes.CREATED, { billItem });
  } catch (error) {
    return next(error);
  }
}

async function deleteBillItem(req, res, next) {
  try {
    const { billId, billItemId } = req.params;
    const billItem = await BillItem.findByPk(billItemId);
    const product = await Product.findByPk(billItem.ProductId);
    const bill = await Bill.findByPk(billId);
    const user = await User.findByPk(bill.UserId);
    const valueToAdd = billItem.value * billItem.count;
    const valuesToAdd = billItem.values * billItem.count;

    if (bill.billType === 'صادر') {
      product.count += billItem.count;
    } else {
      product.count -= billItem.count;
    }
    if (product.count < 0)
      throw new ApiError(`
         ,يرجى تحديد كمية أقل أو تساوي كمية المستودع
         لديك للمنتج صاحب الايدي  ${product.id}
        المسمى بـ ${product.name} 
        عدد ${product.count} فقط
            `);

    if (bill.billType === 'ادخال') {
      user.accountBalance -= valueToAdd;
      user.accountBalanceValues -= valuesToAdd;

      if (user.userType === 'زبون') {
        bill.value += valueToAdd;
        bill.values += valuesToAdd;
      } else {
        bill.value -= valueToAdd;
        bill.values -= valuesToAdd;
      }
    } else {
      user.accountBalance += valueToAdd;
      user.accountBalanceValues += valuesToAdd;

      if (user.userType === 'تاجر سوق') {
        bill.value += valueToAdd;
        bill.values += valuesToAdd;
      } else {
        bill.value -= valueToAdd;
        bill.values -= valuesToAdd;
      }
    }

    if (bill.billType === 'ادخال') subtractFromBalance(valueToAdd, valueToAdd);
    else addToBalance(valueToAdd, valueToAdd);

    await bill.save();
    await user?.save();
    await billItem.destroy();
    await product.save();

    return responser(res, StatusCodes.CREATED, { billItem });
  } catch (error) {
    return next(error);
  }
}

async function transfer(req, res, next) {
  try {
    const { transferType, value, values, price } = req.body;
    const parsedValue = parseInt(value, 10);
    const parsedPrice = parseInt(price, 10);
    const parsedValues = parseInt(values, 10);
    let firstBill;
    let secondBill;
    if (transferType === 'valueToValues') {
      // من سوري للدولار
      // نقصك سوري زادك دولار
      // 100 دولار تحويل
      // نقصني السعر بالدولار
      // زادني المبلغ
      firstBill = await Bill.create({
        value: parsedValue,
        values: 0,
        billType: 'صادر',
        note: ` مبيع قيمة بسعر ${parsedPrice}`,
      });
      secondBill = await Bill.create({
        value: 0,
        values: parsedValues,
        billType: 'ادخال',
        note: ` مبيع قيمة بسعر ${parsedPrice}`,
      });
      await addToBalance(0, parsedValues);
      await subtractFromBalance(parsedValue, 0);
    } else {
      firstBill = await Bill.create({
        values: parsedValues,
        value: 0,
        billType: 'صادر',
        note: ` مبيع قيمة بسعر ${parsedPrice}`,
      });
      secondBill = await Bill.create({
        value: parsedValue,
        values: 0,
        billType: 'ادخال',
        note: ` مبيع قيمة بسعر ${parsedPrice}`,
      });
      await addToBalance(parsedValue, 0);
      await subtractFromBalance(0, parsedValues);
    }
    responser(res, StatusCodes.OK, { firstBill, secondBill });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllBills,
  getBill,
  addBill,
  editBill,
  deleteBill,
  addBillItem,
  deleteBillItem,
  editBillItem,
  transfer,
};
