/* eslint-disable security/detect-object-injection */
const { StatusCodes } = require('http-status-codes');

const { Op, Sequelize } = require('sequelize');
const { Bill } = require('../bill/bill.model');
const { responser } = require('../../utils');
const { ApiError } = require('../../utils/errors');
const {
  getBalance,
  subtractFromBalance,
  addToBalance,
} = require('../myBalance/myBalance.services');

const billTypes = ['ادخال', 'صادر', 'مصروف', 'سحوبات'];

// async function getMonthly(req, res, next) {
//   try {
//     const year = new Date().getFullYear();
//     const months = [...Array(12).keys()].map((m) => m + 1);
//     const results = await Promise.all(
//       billTypes.map(async (billType) => {
//         const monthlyTotals = await Bill.findAll({
//           attributes: [
//             [Sequelize.fn('SUM', Sequelize.col('value')), 'value'],
//             [Sequelize.fn('SUM', Sequelize.col('values')), 'values'],
//             [Sequelize.fn('MONTH', Sequelize.col('createdAt')), 'month'],
//           ],
//           where: {
//             billType,
//             [Op.and]: [
//               Sequelize.where(
//                 Sequelize.fn('YEAR', Sequelize.col('createdAt')),
//                 year
//               ),
//             ],
//           },
//           group: [Sequelize.fn('MONTH', Sequelize.col('createdAt'))],
//         });
//         const monthlyInventory = {};
//         monthlyTotals.forEach((item) => {
//           monthlyInventory[item.dataValues.month] = {
//             value: parseInt(item.dataValues.value, 10),
//             values: parseInt(item.dataValues.values, 10),
//           };
//         });
//         return { billType, monthlyInventory };
//       })
//     );
//     const monthlyInventory = {};
//     months.forEach((month) => {
//       monthlyInventory[month] = {};
//       billTypes.forEach((billType) => {
//         const result = results.find((r) => r.billType === billType);
//         monthlyInventory[month][billType] = result.monthlyInventory[month] || {
//           value: 0,
//           values: 0,
//         };
//       });
//     });
//     responser(res, StatusCodes.OK, { monthlyInventory });
//   } catch (error) {
//     next(error);
//   }
// }
async function getMonthly(req, res, next) {
  try {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();

    const monthly = await Promise.all(
      [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(async (currentMonth) => {
        const billsByMonth = await Bill.findAll({
          attributes: [
            'UserId',
            'billType', // Group by billType
            [Sequelize.literal('MONTH("createdAt")'), 'month'], // Extract month from createdAt
            [Sequelize.fn('SUM', Sequelize.col('value')), 'totalValue'], // Calculate sum of value
            [Sequelize.fn('SUM', Sequelize.col('values')), 'totalValues'], // Calculate sum of values
          ],
          where: {
            [Op.and]: [
              Sequelize.where(
                Sequelize.fn('MONTH', Sequelize.col('createdAt')),
                currentMonth
              ), // Compare month
              Sequelize.where(
                Sequelize.fn('YEAR', Sequelize.col('createdAt')),
                currentYear
              ), // Compare year
            ],
            UserId: {
              [Op.ne]: null, // Exclude bills where UserId is null
            },
            isDaily: true,
          },
          group: ['billType', 'month'], // Group by billType and month
          raw: true,
        });

        const transformingBills = await Bill.findAll({
          attributes: [
            'billType', // Group by billType
            [Sequelize.literal('MONTH("createdAt")'), 'month'], // Extract month from createdAt
            [Sequelize.fn('SUM', Sequelize.col('value')), 'totalValue'], // Calculate sum of value
            [Sequelize.fn('SUM', Sequelize.col('values')), 'totalValues'], // Calculate sum of values
            'UserId',
          ],
          where: {
            UserId: {
              [Op.eq]: null,
            },
            [Op.and]: [
              Sequelize.where(
                Sequelize.fn('MONTH', Sequelize.col('createdAt')),
                currentMonth
              ), // Compare month
              Sequelize.where(
                Sequelize.fn('YEAR', Sequelize.col('createdAt')),
                currentYear
              ), // Compare year
            ],
            isDaily: true,
          },
          group: ['billType', 'month'], // Group by billType and month
          raw: true,
        });

        const monthlyBills = billsByMonth.concat(transformingBills);

        const returnedBills = monthlyBills.map((bill) => ({
          billType: bill.UserId === null ? 'تحويل' : bill.billType,
          value: bill.totalValue,
          values: bill.totalValues,
        }));

        const mergedBills = returnedBills.reduce((accumulator, bill) => {
          const existingBill = accumulator.find(
            (b) => b.billType === bill.billType
          );
          if (existingBill) {
            // If billType already exists in accumulator, sum the values
            existingBill.value = String(
              Number(existingBill.value) + Number(bill.value)
            );
            existingBill.values = String(
              Number(existingBill.values) + Number(bill.values)
            );
          } else {
            // If billType does not exist in accumulator, add it
            accumulator.push(bill);
          }
          return accumulator;
        }, []);

        return mergedBills;
      })
    );

    responser(res, StatusCodes.OK, {
      monthly,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getMonthly,
};
