const { DataTypes } = require('sequelize');
const db = require('../../config/db');

const Bill = db.define(
  'Bill',
  {
    values: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 0 },
    value: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 0 },
    billType: {
      type: DataTypes.ENUM('ادخال', 'صادر', 'مصروف', 'سحوبات'),
      allowNull: true,
    },
    note: { type: DataTypes.STRING, allowNull: true },
    isDaily: { type: DataTypes.BOOLEAN, defaultValue: true },
    createdAt: { type: DataTypes.DATEONLY, defaultValue: DataTypes.NOW },
  },
  { timestamps: false }
);
Bill.associations = function associations(models) {
  Bill.hasMany(models.BillItem);
  Bill.belongsTo(models.User);
};
module.exports = { Bill };
