const { DataTypes } = require('sequelize');
const db = require('../../config/db');

const BillItem = db.define(
  'BillItem',
  {
    count: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    values: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 0 },
    value: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 0 },
    note: { type: DataTypes.STRING, allowNull: true },
    colors: { type: DataTypes.STRING, allowNull: true },
    sizes: { type: DataTypes.STRING, allowNull: true },
    createdAt: { type: DataTypes.DATEONLY, defaultValue: DataTypes.NOW },
  },
  { timestamps: false }
);

BillItem.associations = function associations(models) {
  BillItem.belongsTo(models.Product);
  BillItem.belongsTo(models.Bill);
};

module.exports = { BillItem };
