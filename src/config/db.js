/* eslint-disable global-require */
const { Sequelize, DataTypes } = require('sequelize');

const { DB_URL } = require('./constants');

const BillItemModel = require('../modules/bill_item/bill_item.model');

const ProductModel = require('../modules/product/product.model');

const BillModel = require('../modules/bill/bill.model');

const UserModel = require('../modules/user/user.model');

const MyBalanceModel = require('../modules/myBalance/MyBalance.model');

const db = new Sequelize(DB_URL, {
  logging: false,
});

const User = UserModel(db, DataTypes);
const BillItem = BillItemModel(db, DataTypes);
const Product = ProductModel(db, DataTypes);
const MyBalance = MyBalanceModel(db, DataTypes);
const Bill = BillModel(db, DataTypes);

const dbInitialize = async () => {
  try {
    await db.authenticate();
    console.info('Connected to the DB.');

    User.associations({ Bill });
    Bill.associations({ User, BillItem });
    BillItem.associations({ Product, Bill });
    Product.associations({ BillItem });

    await db.sync();
  } catch (error) {
    console.error('Failed to connect with the DB: ', error);
  }
};

module.exports = { db, dbInitialize, Product, User, MyBalance, Bill, BillItem };
