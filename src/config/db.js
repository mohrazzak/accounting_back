// /* eslint-disable global-require */
const { Sequelize, DataTypes } = require('sequelize');

const { DB_URL } = require('./constants');

// const BillItemModel = require('../modules/bill_item/bill_item.model');

// const ProductModel = require('../modules/product/product.model');

// const BillModel = require('../modules/bill/bill.model');

// const UserModel = require('../modules/user/user.model');

// const MyBalanceModel = require('../modules/myBalance/MyBalance.model');

// const db = new Sequelize(DB_URL, {
//   logging: false,
// });

// const User = UserModel(db, DataTypes);
// const BillItem = BillItemModel(db, DataTypes);
// const Product = ProductModel(db, DataTypes);
// const MyBalance = MyBalanceModel(db, DataTypes);
// const Bill = BillModel(db, DataTypes);

// const dbInitialize = async () => {
//   try {
//     await db.authenticate();
//     console.info('Connected to the DB.');

//     // User.associations({ Bill: BillModel(db, DataTypes) });
//     // Bill.associations({ User: UserModel(db, DataTypes), BillItem });
//     // BillItem.associations({ Product, Bill });
//     // Product.associations({ BillItem });
//     Bill.hasMany(BillItem);
//     Bill.belongsTo(User);
//     BillItem.belongsTo(Product);
//     Product.hasOne(BillItem);
//     BillItem.belongsTo(Bill);
//     User.hasMany(Bill);

//     await db.sync();
//   } catch (error) {
//     console.error('Failed to connect with the DB: ', error);
//   }
// };

// module.exports = { db, dbInitialize, Product, User, MyBalance, Bill, BillItem };

const sequelize = new Sequelize(DB_URL, {
  logging: false,
});

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.BillItem = require('../modules/bill_item/bill_item.model')(
  sequelize,
  DataTypes
);
db.Product = require('../modules/product/product.model')(sequelize, DataTypes);
db.Bill = require('../modules/bill/bill.model')(sequelize, DataTypes);
db.User = require('../modules/user/user.model')(sequelize, DataTypes);
db.MyBalance = require('../modules/myBalance/MyBalance.model')(
  sequelize,
  DataTypes
);

// Define associations
db.Bill.hasMany(db.BillItem);
db.Bill.belongsTo(db.User);
db.BillItem.belongsTo(db.Product);
db.Product.hasOne(db.BillItem);
db.BillItem.belongsTo(db.Bill);
db.User.hasMany(db.Bill);

// Synchronize the database
db.sequelize.sync();

module.exports = db;
