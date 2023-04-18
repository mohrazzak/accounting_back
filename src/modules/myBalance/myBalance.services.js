/* eslint-disable no-restricted-syntax */
const { Op, Sequelize } = require('sequelize');
const { Bill } = require('../bill/bill.model');
const { MyBalance } = require('./MyBalance.model');

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

async function addToBalance(valueToAdd, valuesToAdd) {
  const balance = await MyBalance.findOne({
    where: {
      createdAt: {
        [Op.between]: [startOfDay, endOfDay],
      },
    },
  });

  balance.todayValue += valueToAdd;
  balance.todayValues += valuesToAdd;
  await balance.save();
  return balance;
}
async function subtractFromBalance(valueToSubtract, valuesToSubtract) {
  const balance = await MyBalance.findOne({
    where: {
      createdAt: {
        [Op.between]: [startOfDay, endOfDay],
      },
    },
  });

  balance.todayValue -= valueToSubtract;
  balance.todayValues -= valuesToSubtract;
  await balance.save();
  return balance;
}

async function getBalance() {
  const todayBalanceExists = await MyBalance.findOne({
    where: {
      createdAt: {
        [Op.between]: [startOfDay, endOfDay],
      },
    },
  });
  if (!todayBalanceExists) {
    const lastCreated = await MyBalance.findOne({
      attributes: [
        'id',
        'todayValues',
        'todayValue',
        'yesterdayValues',
        'yesterdayValue',
        'createdAt',
      ],
      group: ['createdAt'],
      order: [[Sequelize.fn('max', Sequelize.col('createdAt')), 'DESC']],
    });
    await MyBalance.create({
      yesterdayValue: lastCreated?.todayValue ?? 0,
      yesterdayValues: lastCreated?.todayValues ?? 0,
    });
  } else {
    return {
      todayBalance: {
        value:
          todayBalanceExists.todayValue + todayBalanceExists.yesterdayValue,
        values:
          todayBalanceExists.todayValues + todayBalanceExists.yesterdayValues,
      },
      yesterdayBalance: {
        value: todayBalanceExists.yesterdayValue,
        values: todayBalanceExists.yesterdayValues,
      },
    };
  }

  const bills = await Bill.findAll({
    where: {
      createdAt: {
        [Op.lte]: startOfDay,
      },
    },
    attributes: ['value', 'values', 'billType'],
  });

  let yesterdayBalance = { value: 0, values: 0 };

  for (const bill of bills) {
    if (bill.billType === 'ادخال') {
      yesterdayBalance = {
        value: yesterdayBalance.value + bill.value,
        values: yesterdayBalance.values + bill.values,
      };
    } else {
      yesterdayBalance = {
        value: yesterdayBalance.value - bill.value,
        values: yesterdayBalance.values - bill.values,
      };
    }
  }

  const todayBills = await Bill.findAll({
    where: {
      createdAt: {
        [Op.gte]: new Date(),
      },
    },
    attributes: ['value', 'values', 'billType'],
  });

  let todayBalance = yesterdayBalance;

  for (const bill of todayBills) {
    if (bill.billType === 'ادخال') {
      todayBalance = {
        value: todayBalance.value + bill.value,
        values: todayBalance.values + bill.values,
      };
    } else {
      todayBalance = {
        value: todayBalance.value - bill.value,
        values: todayBalance.values - bill.values,
      };
    }
  }

  return {
    todayBalance,
    yesterdayBalance,
  };
}

module.exports = { addToBalance, subtractFromBalance, getBalance };
