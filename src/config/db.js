/* eslint-disable global-require */
const { Sequelize } = require('sequelize');

const { DB_URL } = require('./constants');

const db = new Sequelize(DB_URL, {
  // dialectOptions: {
  //   ssl: {
  //     require: true,
  //     rejectUnauthorized: false, // You may need to set this to false if you're using a self-signed certificate
  //   },
  // },
  logging: false,
});

(async () => {
  try {
    await db.authenticate();
    console.info('Connected to the DB.');

    // Import models and their associations
    const { BillItem } = require('../modules/bill_item/bill_item.model');

    const { Product } = require('../modules/product/product.model');

    const { Bill } = require('../modules/bill/bill.model');

    const { User } = require('../modules/user/user.model');

    await User.associations({ Bill });
    await Bill.associations({ User, BillItem });
    await BillItem.associations({ Product, Bill });
    await Product.associations({ BillItem });

    await db.sync();
  } catch (error) {
    console.error('Failed to connect with the DB: ', error);
  }
})();

module.exports = db;
