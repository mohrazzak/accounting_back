/* eslint-disable no-unsafe-optional-chaining */
/* eslint-disable no-restricted-syntax */
const { Op, Sequelize } = require('sequelize');
const moment = require('moment');
const { MyBalance } = require('../../config/db');

const today = moment().local().startOf('day').add(3, 'hours');

async function addToBalance(valueToAdd, valuesToAdd) {
  const balance = await MyBalance.findOne({
    where: {
      createdAt: today.format('YYYY-MM-DD'),
    },
  });
  console.log(balance);

  balance.todayValue += Number(valueToAdd);
  balance.todayValues += Number(valuesToAdd);
  await balance.save();
  return balance;
}
async function subtractFromBalance(valueToSubtract, valuesToSubtract) {
  const balance = await MyBalance.findOne({
    where: {
      createdAt: today.format('YYYY-MM-DD'),
    },
  });

  balance.todayValue -= Number(valueToSubtract);
  balance.todayValues -= Number(valuesToSubtract);
  await balance.save();
  return balance;
}

async function getBalance(selectedDay) {
  // IF BALANCE EXISTS RETURN IT
  // ELSE CREATE ONE WITH LATEST BALANCE VALUES
  const balance = await MyBalance.findOne({
    where: {
      createdAt: selectedDay.toDate(),
    },
  });
  if (balance)
    return {
      todayBalance: {
        value: balance.todayValue,
        values: balance.todayValues,
      },
      yesterdayBalance: {
        value: balance.yesterdayValue,
        values: balance.yesterdayValues,
      },
    };

  const prevBalance = await MyBalance.findOne({
    where: {
      createdAt: {
        [Op.lt]: selectedDay.toDate(),
      },
    },
    order: [['createdAt', 'DESC']],
  });

  if (today.isSame(selectedDay))
    await MyBalance.create({
      todayValue: 0,
      todayValues: 0,
      yesterdayValue: prevBalance.yesterdayValue + prevBalance.todayValue,
      yesterdayValues: prevBalance.yesterdayValues + prevBalance.todayValues,
      createdAt: selectedDay.toDate(),
    });

  return {
    todayBalance: {
      value: prevBalance.todayValue,
      values: prevBalance.todayValues,
    },
    yesterdayBalance: {
      value: prevBalance.yesterdayValue,
      values: prevBalance.yesterdayValues,
    },
  };
}

async function getPrevBalance(selectedDay) {
  const existingBalance = await MyBalance.findOne({
    where: {
      createdAt: selectedDay.toDate(),
    },
  });
  if (existingBalance)
    return {
      todayBalance: {
        value: existingBalance.todayValue,
        values: existingBalance.todayValues,
      },
      yesterdayBalance: {
        value: existingBalance.yesterdayValue,
        values: existingBalance.yesterdayValues,
      },
    };

  const prevBalance = await MyBalance.findOne({
    where: {
      createdAt: {
        [Op.lt]: selectedDay.toDate(),
      },
    },
    order: [['createdAt', 'DESC']],
  });
  console.log(prevBalance?.toJSON());

  if (!prevBalance)
    return {
      todayBalance: { value: 0, values: 0 },
      yesterdayBalance: { value: 0, values: 0 },
    };
  return {
    todayBalance: {
      value: prevBalance.todayValue,
      values: prevBalance.todayValues,
    },
    yesterdayBalance: {
      value: prevBalance.yesterdayValue,
      values: prevBalance.yesterdayValues,
    },
  };
}

module.exports = {
  addToBalance,
  subtractFromBalance,
  getBalance,
  getPrevBalance,
};
